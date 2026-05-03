/**
 * Criminal Management Routes
 * CRUD operations for criminal records with photo upload
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, queryOne } = require('../config/database');
const { authenticate, policeOrAdmin } = require('../middleware/auth');
const { uploadCriminalPhoto, handleUploadError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Validation rules
const criminalValidation = [
    body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
    body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('status').optional({ checkFalsy: true }).isIn(['wanted', 'arrested', 'released', 'deceased']).withMessage('Invalid status')
];

/**
 * GET /api/criminals
 * Get all criminals with pagination and search
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, gender } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR alias LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        if (gender) {
            whereClause += ' AND gender = ?';
            params.push(gender);
        }

        // Get total count
        const countResult = await queryOne(
            `SELECT COUNT(*) as total FROM criminals WHERE ${whereClause}`,
            params
        );

        // Get criminals
        const criminals = await query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM crime_criminals cc WHERE cc.criminal_id = c.id) as crime_count
             FROM criminals c
             WHERE ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            params
        );

        res.json({
            success: true,
            criminals,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get criminals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching criminals'
        });
    }
});

/**
 * GET /api/criminals/:id
 * Get single criminal with crime history
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const criminal = await queryOne('SELECT * FROM criminals WHERE id = ?', [id]);

        if (!criminal) {
            return res.status(404).json({
                success: false,
                message: 'Criminal not found'
            });
        }

        // Get crime history with FIR info
        const crimeHistory = await query(
            `SELECT c.id, c.crime_number, c.crime_type, c.title, c.date_occurred, 
                    c.status, c.severity, cc.role as criminal_role,
                    f.fir_number, f.id as fir_id, f.status as fir_status,
                    f.date_filed as fir_date_filed
             FROM crimes c
             INNER JOIN crime_criminals cc ON c.id = cc.crime_id
             LEFT JOIN fir f ON c.id = f.crime_id
             WHERE cc.criminal_id = ?
             ORDER BY c.date_occurred DESC`,
            [id]
        );

        // Get associated victims (victims linked to the same crimes)
        const associatedVictims = await query(
            `SELECT DISTINCT v.id, v.first_name, v.last_name, v.phone, v.occupation,
                             c.crime_number
             FROM victims v
             INNER JOIN crime_victims cv ON v.id = cv.victim_id
             INNER JOIN crimes c ON cv.crime_id = c.id
             INNER JOIN crime_criminals cc ON c.id = cc.crime_id
             WHERE cc.criminal_id = ?
             ORDER BY v.last_name ASC`,
            [id]
        );

        res.json({
            success: true,
            criminal: {
                ...criminal,
                crimeHistory,
                associatedVictims
            }
        });
    } catch (error) {
        console.error('Get criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching criminal'
        });
    }
});

/**
 * POST /api/criminals
 * Create new criminal record
 */
router.post('/', authenticate, policeOrAdmin, criminalValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            first_name, last_name, alias, date_of_birth, gender,
            nationality, address, phone, email, identification_mark,
            fingerprint_id, height_cm, weight_kg, eye_color, hair_color, status,
            crimes // Array of crime IDs
        } = req.body;

        const result = await query(
            `INSERT INTO criminals (first_name, last_name, alias, date_of_birth, gender,
             nationality, address, phone, email, identification_mark, fingerprint_id,
             height_cm, weight_kg, eye_color, hair_color, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, alias, date_of_birth, gender,
             nationality, address, phone, email, identification_mark, fingerprint_id,
             height_cm, weight_kg, eye_color, hair_color, status || 'wanted'].map(v => (v === undefined || v === '') ? null : v)
        );

        const criminalId = result.insertId;

        // Link crimes if provided
        if (crimes && Array.isArray(crimes)) {
            for (const crimeId of crimes) {
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id) VALUES (?, ?)',
                    [crimeId, criminalId]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Criminal record created successfully',
            criminalId
        });
    } catch (error) {
        console.error('Create criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating criminal record'
        });
    }
});

/**
 * PUT /api/criminals/:id
 * Update criminal record
 */
router.put('/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name, last_name, alias, date_of_birth, gender,
            nationality, address, phone, email, identification_mark,
            fingerprint_id, height_cm, weight_kg, eye_color, hair_color, status,
            crimes // Array of crime IDs
        } = req.body;

        const criminal = await queryOne('SELECT id FROM criminals WHERE id = ?', [id]);
        if (!criminal) {
            return res.status(404).json({
                success: false,
                message: 'Criminal not found'
            });
        }

        await query(
            `UPDATE criminals SET
             first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             alias = COALESCE(?, alias),
             date_of_birth = COALESCE(?, date_of_birth),
             gender = COALESCE(?, gender),
             nationality = COALESCE(?, nationality),
             address = COALESCE(?, address),
             phone = COALESCE(?, phone),
             email = COALESCE(?, email),
             identification_mark = COALESCE(?, identification_mark),
             fingerprint_id = COALESCE(?, fingerprint_id),
             height_cm = COALESCE(?, height_cm),
             weight_kg = COALESCE(?, weight_kg),
             eye_color = COALESCE(?, eye_color),
             hair_color = COALESCE(?, hair_color),
             status = COALESCE(?, status)
             WHERE id = ?`,
            [first_name, last_name, alias, date_of_birth, gender,
             nationality, address, phone, email, identification_mark,
             fingerprint_id, height_cm, weight_kg, eye_color, hair_color, status, id].map(v => (v === undefined || v === '') ? null : v)
        );

        // Update crime links if provided
        if (crimes && Array.isArray(crimes)) {
            // Remove existing links
            await query('DELETE FROM crime_criminals WHERE criminal_id = ?', [id]);
            // Add new links
            for (const crimeId of crimes) {
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id) VALUES (?, ?)',
                    [crimeId, id]
                );
            }
        }

        res.json({
            success: true,
            message: 'Criminal record updated successfully'
        });
    } catch (error) {
        console.error('Update criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating criminal record'
        });
    }
});

/**
 * POST /api/criminals/:id/photo
 * Upload criminal photo
 */
router.post('/:id/photo', authenticate, policeOrAdmin, 
    uploadCriminalPhoto.single('photo'), handleUploadError,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No photo uploaded'
                });
            }

            const criminal = await queryOne('SELECT photo_path FROM criminals WHERE id = ?', [id]);
            if (!criminal) {
                // Remove uploaded file if criminal not found
                fs.unlinkSync(req.file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Criminal not found'
                });
            }

            // Remove old photo if exists
            if (criminal.photo_path) {
                const oldPhotoPath = path.join(__dirname, '..', criminal.photo_path);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Update with new photo path
            const photoPath = `/uploads/criminals/${req.file.filename}`;
            await query('UPDATE criminals SET photo_path = ? WHERE id = ?', [photoPath, id]);

            res.json({
                success: true,
                message: 'Photo uploaded successfully',
                photoPath
            });
        } catch (error) {
            console.error('Upload photo error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error uploading photo'
            });
        }
    }
);

/**
 * DELETE /api/criminals/:id
 * Delete criminal record (Admin only)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete criminal records'
            });
        }

        const { id } = req.params;

        const criminal = await queryOne('SELECT photo_path FROM criminals WHERE id = ?', [id]);
        if (!criminal) {
            return res.status(404).json({
                success: false,
                message: 'Criminal not found'
            });
        }

        // Remove photo if exists
        if (criminal.photo_path) {
            const photoPath = path.join(__dirname, '..', criminal.photo_path);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        await query('DELETE FROM criminals WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Criminal record deleted successfully'
        });
    } catch (error) {
        console.error('Delete criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting criminal record'
        });
    }
});

module.exports = router;
