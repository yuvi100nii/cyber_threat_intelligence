/**
 * FIR (First Information Report) Routes
 * CRUD operations for FIR records
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, queryOne } = require('../config/database');
const { authenticate, policeOrAdmin } = require('../middleware/auth');

// Validation rules
const firValidation = [
    body('crime_id').isInt().withMessage('Valid crime ID is required'),
    body('complainant_name').trim().notEmpty().withMessage('Complainant name is required'),
    body('date_filed').isDate().withMessage('Valid date is required'),
    body('description').trim().notEmpty().withMessage('Description is required')
];

/**
 * GET /api/fir
 * Get all FIRs with pagination
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, date_from, date_to } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '1=1';
        const params = [];

        if (status) {
            whereClause += ' AND f.status = ?';
            params.push(status);
        }
        if (search) {
            whereClause += ' AND (f.fir_number LIKE ? OR f.complainant_name LIKE ? OR f.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (date_from) {
            whereClause += ' AND f.date_filed >= ?';
            params.push(date_from);
        }
        if (date_to) {
            whereClause += ' AND f.date_filed <= ?';
            params.push(date_to);
        }

        const countResult = await queryOne(
            `SELECT COUNT(*) as total FROM fir f WHERE ${whereClause}`,
            params
        );

        const firs = await query(
            `SELECT f.*, c.crime_number, c.crime_type, c.title as crime_title,
                    u.full_name as investigating_officer_name,
                    (SELECT COUNT(*) FROM crime_criminals cc WHERE cc.crime_id = f.crime_id) as criminal_count,
                    (SELECT GROUP_CONCAT(CONCAT(cr.first_name, ' ', cr.last_name) SEPARATOR ', ') 
                     FROM criminals cr 
                     INNER JOIN crime_criminals cc2 ON cr.id = cc2.criminal_id 
                     WHERE cc2.crime_id = f.crime_id) as criminal_names,
                    (SELECT GROUP_CONCAT(CONCAT(v.first_name, ' ', v.last_name) SEPARATOR ', ') 
                     FROM victims v 
                     INNER JOIN crime_victims cv ON v.id = cv.victim_id 
                     WHERE cv.crime_id = f.crime_id) as victim_names
             FROM fir f
             LEFT JOIN crimes c ON f.crime_id = c.id
             LEFT JOIN users u ON f.investigating_officer_id = u.id
             WHERE ${whereClause}
             ORDER BY f.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            params
        );

        res.json({
            success: true,
            firs,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get FIRs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching FIRs'
        });
    }
});

/**
 * GET /api/fir/:id
 * Get single FIR with details
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const fir = await queryOne(
            `SELECT f.*, c.crime_number, c.crime_type, c.title as crime_title, c.status as crime_status,
                    u.full_name as investigating_officer_name, u.badge_number, u.department
             FROM fir f
             LEFT JOIN crimes c ON f.crime_id = c.id
             LEFT JOIN users u ON f.investigating_officer_id = u.id
             WHERE f.id = ?`,
            [id]
        );

        if (!fir) {
            return res.status(404).json({
                success: false,
                message: 'FIR not found'
            });
        }

        // Get criminals linked to this FIR's crime
        const linkedCriminals = await query(
            `SELECT cr.id, cr.first_name, cr.last_name, cr.alias, cr.status,
                    cc.role as crime_role
             FROM criminals cr
             INNER JOIN crime_criminals cc ON cr.id = cc.criminal_id
             WHERE cc.crime_id = ?
             ORDER BY cc.role ASC`,
            [fir.crime_id]
        );

        // Get victims linked to this FIR's crime
        const linkedVictims = await query(
            `SELECT v.id, v.first_name, v.last_name, v.phone, v.occupation
             FROM victims v
             INNER JOIN crime_victims cv ON v.id = cv.victim_id
             WHERE cv.crime_id = ?`,
            [fir.crime_id]
        );

        res.json({
            success: true,
            fir: {
                ...fir,
                linkedCriminals,
                linkedVictims
            }
        });
    } catch (error) {
        console.error('Get FIR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching FIR'
        });
    }
});

/**
 * POST /api/fir
 * Create new FIR
 */
router.post('/', authenticate, policeOrAdmin, firValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            crime_id, complainant_name, complainant_address, complainant_phone,
            date_filed, time_filed, description, investigating_officer_id,
            criminals, victims // Arrays for associated crime
        } = req.body;

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [crime_id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Check if FIR already exists for this crime
        const existingFir = await queryOne('SELECT id FROM fir WHERE crime_id = ?', [crime_id]);
        if (existingFir) {
            return res.status(400).json({
                success: false,
                message: 'FIR already exists for this crime'
            });
        }

        // Generate FIR number
        const year = new Date().getFullYear();
        const lastRecord = await queryOne(
            "SELECT fir_number FROM fir WHERE fir_number LIKE ? ORDER BY id DESC LIMIT 1",
            [`FIR-${year}-%`]
        );
        let nextNum = 1;
        if (lastRecord && lastRecord.fir_number) {
            const parts = lastRecord.fir_number.split('-');
            if (parts.length === 3) {
                nextNum = parseInt(parts[2]) + 1;
            }
        }
        const firNumber = `FIR-${year}-${String(nextNum).padStart(3, '0')}`;

        const result = await query(
            `INSERT INTO fir (fir_number, crime_id, complainant_name, complainant_address,
             complainant_phone, date_filed, time_filed, description, investigating_officer_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firNumber, crime_id, complainant_name, complainant_address,
             complainant_phone, date_filed, time_filed, description, 
             investigating_officer_id || req.user.id].map(v => (v === undefined || v === '') ? null : v)
        );

        const firId = result.insertId;

        // Link criminals to the crime if provided
        if (criminals && Array.isArray(criminals)) {
            for (const cId of criminals) {
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE crime_id = crime_id',
                    [crime_id, cId]
                );
            }
        }

        // Link victims to the crime if provided
        if (victims && Array.isArray(victims)) {
            for (const vId of victims) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE crime_id = crime_id',
                    [crime_id, vId]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'FIR filed successfully',
            firId,
            firNumber
        });
    } catch (error) {
        console.error('Create FIR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating FIR'
        });
    }
});

/**
 * PUT /api/fir/:id
 * Update FIR
 */
router.put('/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            complainant_name, complainant_address, complainant_phone,
            description, status, investigating_officer_id,
            criminals, victims // Arrays for associated crime
        } = req.body;

        const fir = await queryOne('SELECT id, crime_id FROM fir WHERE id = ?', [id]);
        if (!fir) {
            return res.status(404).json({
                success: false,
                message: 'FIR not found'
            });
        }

        await query(
            `UPDATE fir SET
             complainant_name = COALESCE(?, complainant_name),
             complainant_address = COALESCE(?, complainant_address),
             complainant_phone = COALESCE(?, complainant_phone),
             description = COALESCE(?, description),
             status = COALESCE(?, status),
             investigating_officer_id = COALESCE(?, investigating_officer_id)
             WHERE id = ?`,
            [complainant_name, complainant_address, complainant_phone,
             description, status, investigating_officer_id, id].map(v => (v === undefined || v === '') ? null : v)
        );

        // Update crime links if provided
        if (criminals && Array.isArray(criminals)) {
            await query('DELETE FROM crime_criminals WHERE crime_id = ?', [fir.crime_id]);
            for (const cId of criminals) {
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id) VALUES (?, ?)',
                    [fir.crime_id, cId]
                );
            }
        }

        if (victims && Array.isArray(victims)) {
            await query('DELETE FROM crime_victims WHERE crime_id = ?', [fir.crime_id]);
            for (const vId of victims) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?)',
                    [fir.crime_id, vId]
                );
            }
        }

        res.json({
            success: true,
            message: 'FIR updated successfully'
        });
    } catch (error) {
        console.error('Update FIR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating FIR'
        });
    }
});

/**
 * DELETE /api/fir/:id
 * Delete FIR (Admin only)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete FIRs'
            });
        }

        const { id } = req.params;

        const fir = await queryOne('SELECT id FROM fir WHERE id = ?', [id]);
        if (!fir) {
            return res.status(404).json({
                success: false,
                message: 'FIR not found'
            });
        }

        await query('DELETE FROM fir WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'FIR deleted successfully'
        });
    } catch (error) {
        console.error('Delete FIR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting FIR'
        });
    }
});

module.exports = router;
