/**
 * Victim Management Routes
 * CRUD operations for victim records
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, queryOne } = require('../config/database');
const { authenticate, policeOrAdmin } = require('../middleware/auth');

// Validation rules
const victimValidation = [
    body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required')
];

/**
 * GET /api/victims
 * Get all victims with pagination
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const countResult = await queryOne(
            `SELECT COUNT(*) as total FROM victims WHERE ${whereClause}`,
            params
        );

        const victims = await query(
            `SELECT v.*, 
                    (SELECT COUNT(*) FROM crime_victims cv WHERE cv.victim_id = v.id) as crime_count,
                    (SELECT c.crime_number FROM crimes c 
                     INNER JOIN crime_victims cv2 ON c.id = cv2.crime_id 
                     WHERE cv2.victim_id = v.id 
                     ORDER BY c.date_occurred DESC LIMIT 1) as latest_case_number,
                    (SELECT f.fir_number FROM fir f 
                     INNER JOIN crime_victims cv3 ON f.crime_id = cv3.crime_id 
                     WHERE cv3.victim_id = v.id 
                     ORDER BY f.date_filed DESC LIMIT 1) as latest_fir_number
             FROM victims v
             WHERE ${whereClause}
             ORDER BY v.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            params
        );

        res.json({
            success: true,
            victims,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get victims error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching victims'
        });
    }
});

/**
 * GET /api/victims/:id
 * Get single victim with linked crimes
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const victim = await queryOne('SELECT * FROM victims WHERE id = ?', [id]);

        if (!victim) {
            return res.status(404).json({
                success: false,
                message: 'Victim not found'
            });
        }

        // Get linked crimes with FIR info
        const linkedCrimes = await query(
            `SELECT c.id, c.crime_number, c.crime_type, c.title, c.date_occurred, c.status,
                    f.fir_number, f.id as fir_id, f.status as fir_status,
                    f.date_filed as fir_date_filed
             FROM crimes c
             INNER JOIN crime_victims cv ON c.id = cv.crime_id
             LEFT JOIN fir f ON c.id = f.crime_id
             WHERE cv.victim_id = ?
             ORDER BY c.date_occurred DESC`,
            [id]
        );

        // Get associated criminals (criminals linked to the same crimes)
        const associatedCriminals = await query(
            `SELECT DISTINCT cr.id, cr.first_name, cr.last_name, cr.alias, cr.status,
                             cc.role as crime_role, c.crime_number
             FROM criminals cr
             INNER JOIN crime_criminals cc ON cr.id = cc.criminal_id
             INNER JOIN crimes c ON cc.crime_id = c.id
             INNER JOIN crime_victims cv ON c.id = cv.crime_id
             WHERE cv.victim_id = ?
             ORDER BY cr.last_name ASC`,
            [id]
        );

        res.json({
            success: true,
            victim: {
                ...victim,
                linkedCrimes,
                associatedCriminals
            }
        });
    } catch (error) {
        console.error('Get victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching victim'
        });
    }
});

/**
 * POST /api/victims
 * Create new victim record
 */
router.post('/', authenticate, policeOrAdmin, victimValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            first_name, last_name, date_of_birth, gender,
            address, phone, email, occupation, injury_description, statement,
            crimes // Array of crime IDs
        } = req.body;

        const result = await query(
            `INSERT INTO victims (first_name, last_name, date_of_birth, gender,
             address, phone, email, occupation, injury_description, statement)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, date_of_birth, gender,
             address, phone, email, occupation, injury_description, statement].map(v => (v === undefined || v === '') ? null : v)
        );

        const victimId = result.insertId;

        // Link crimes if provided
        if (crimes && Array.isArray(crimes)) {
            for (const crimeId of crimes) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?)',
                    [crimeId, victimId]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Victim record created successfully',
            victimId
        });
    } catch (error) {
        console.error('Create victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating victim record'
        });
    }
});

/**
 * PUT /api/victims/:id
 * Update victim record
 */
router.put('/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name, last_name, date_of_birth, gender,
            address, phone, email, occupation, injury_description, statement,
            crimes // Array of crime IDs
        } = req.body;

        const victim = await queryOne('SELECT id FROM victims WHERE id = ?', [id]);
        if (!victim) {
            return res.status(404).json({
                success: false,
                message: 'Victim not found'
            });
        }

        await query(
            `UPDATE victims SET
             first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             date_of_birth = COALESCE(?, date_of_birth),
             gender = COALESCE(?, gender),
             address = COALESCE(?, address),
             phone = COALESCE(?, phone),
             email = COALESCE(?, email),
             occupation = COALESCE(?, occupation),
             injury_description = COALESCE(?, injury_description),
             statement = COALESCE(?, statement)
             WHERE id = ?`,
            [first_name, last_name, date_of_birth, gender,
             address, phone, email, occupation, injury_description, statement, id].map(v => (v === undefined || v === '') ? null : v)
        );

        // Update crime links if provided
        if (crimes && Array.isArray(crimes)) {
            // Remove existing links
            await query('DELETE FROM crime_victims WHERE victim_id = ?', [id]);
            // Add new links
            for (const crimeId of crimes) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?)',
                    [crimeId, id]
                );
            }
        }

        res.json({
            success: true,
            message: 'Victim record updated successfully'
        });
    } catch (error) {
        console.error('Update victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating victim record'
        });
    }
});

/**
 * DELETE /api/victims/:id
 * Delete victim record
 */
router.delete('/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const victim = await queryOne('SELECT id FROM victims WHERE id = ?', [id]);
        if (!victim) {
            return res.status(404).json({
                success: false,
                message: 'Victim not found'
            });
        }

        await query('DELETE FROM victims WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Victim record deleted successfully'
        });
    } catch (error) {
        console.error('Delete victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting victim record'
        });
    }
});

/**
 * POST /api/victims/:id/link-crime
 * Link victim to a crime
 */
router.post('/:id/link-crime', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { crime_id, notes } = req.body;

        // Verify victim exists
        const victim = await queryOne('SELECT id FROM victims WHERE id = ?', [id]);
        if (!victim) {
            return res.status(404).json({
                success: false,
                message: 'Victim not found'
            });
        }

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [crime_id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        await query(
            `INSERT INTO crime_victims (crime_id, victim_id, notes) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE notes = ?`,
            [crime_id, id, notes, notes].map(v => v === undefined ? null : v)
        );

        res.json({
            success: true,
            message: 'Victim linked to crime successfully'
        });
    } catch (error) {
        console.error('Link victim to crime error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error linking victim to crime'
        });
    }
});

module.exports = router;
