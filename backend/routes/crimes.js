/**
 * Crime Management Routes
 * CRUD operations for crime records with search functionality
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, query: queryValidator } = require('express-validator');
const { query, queryOne } = require('../config/database');
const { authenticate, policeOrAdmin } = require('../middleware/auth');

// Validation rules for crime
const crimeValidation = [
    body('crime_type').isIn(['theft', 'robbery', 'assault', 'murder', 'fraud', 'cybercrime', 'drug_offense', 'kidnapping', 'domestic_violence', 'other']).withMessage('Invalid crime type'),
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('date_occurred').isDate().withMessage('Valid date is required'),
    body('location').trim().notEmpty().withMessage('Location is required')
];

/**
 * GET /api/crimes
 * Get all crimes with pagination and filters
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            crime_type, 
            status, 
            date_from, 
            date_to, 
            location,
            search,
            severity
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = '1=1';
        const params = [];

        // Apply filters
        if (crime_type) {
            whereClause += ' AND c.crime_type = ?';
            params.push(crime_type);
        }
        if (status) {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }
        if (date_from) {
            whereClause += ' AND c.date_occurred >= ?';
            params.push(date_from);
        }
        if (date_to) {
            whereClause += ' AND c.date_occurred <= ?';
            params.push(date_to);
        }
        if (location) {
            whereClause += ' AND (c.location LIKE ? OR c.city LIKE ? OR c.state LIKE ?)';
            const locationSearch = `%${location}%`;
            params.push(locationSearch, locationSearch, locationSearch);
        }
        if (search) {
            whereClause += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.crime_number LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (severity) {
            whereClause += ' AND c.severity = ?';
            params.push(severity);
        }

        // Get total count
        const countResult = await queryOne(
            `SELECT COUNT(*) as total FROM crimes c WHERE ${whereClause}`,
            params
        );

        // Get crimes with pagination
        const crimes = await query(
            `SELECT c.*, u.full_name as created_by_name,
                    (SELECT COUNT(*) FROM crime_criminals cc WHERE cc.crime_id = c.id) as criminal_count,
                    (SELECT COUNT(*) FROM crime_victims cv WHERE cv.crime_id = c.id) as victim_count
             FROM crimes c
             LEFT JOIN users u ON c.created_by = u.id
             WHERE ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
            params
        );

        res.json({
            success: true,
            crimes,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get crimes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching crimes'
        });
    }
});

/**
 * GET /api/crimes/:id
 * Get single crime with full details
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Get crime details
        const crime = await queryOne(
            `SELECT c.*, u.full_name as created_by_name
             FROM crimes c
             LEFT JOIN users u ON c.created_by = u.id
             WHERE c.id = ?`,
            [id]
        );

        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Get linked criminals
        const criminals = await query(
            `SELECT cr.*, cc.role as crime_role, cc.notes as link_notes
             FROM criminals cr
             INNER JOIN crime_criminals cc ON cr.id = cc.criminal_id
             WHERE cc.crime_id = ?`,
            [id]
        );

        // Get linked victims
        const victims = await query(
            `SELECT v.*, cv.notes as link_notes
             FROM victims v
             INNER JOIN crime_victims cv ON v.id = cv.victim_id
             WHERE cv.crime_id = ?`,
            [id]
        );

        // Get assigned officers
        const assignedOfficers = await query(
            `SELECT u.id, u.full_name, u.badge_number, u.department,
                    ca.role, ca.status, ca.assigned_date, ca.notes
             FROM users u
             INNER JOIN case_assignments ca ON u.id = ca.officer_id
             WHERE ca.crime_id = ?`,
            [id]
        );

        // Get FIR if exists
        const fir = await queryOne(
            `SELECT f.*, u.full_name as investigating_officer_name
             FROM fir f
             LEFT JOIN users u ON f.investigating_officer_id = u.id
             WHERE f.crime_id = ?`,
            [id]
        );

        // Get case updates
        const updates = await query(
            `SELECT cu.*, u.full_name as officer_name
             FROM case_updates cu
             LEFT JOIN users u ON cu.officer_id = u.id
             WHERE cu.crime_id = ?
             ORDER BY cu.created_at DESC`,
            [id]
        );

        // Get evidence
        const evidence = await query(
            `SELECT e.*, u.full_name as collected_by_name
             FROM evidence e
             LEFT JOIN users u ON e.collected_by = u.id
             WHERE e.crime_id = ?`,
            [id]
        );

        res.json({
            success: true,
            crime: {
                ...crime,
                criminals,
                victims,
                assignedOfficers,
                fir,
                updates,
                evidence
            }
        });
    } catch (error) {
        console.error('Get crime error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching crime details'
        });
    }
});

/**
 * POST /api/crimes
 * Create new crime record
 */
router.post('/', authenticate, policeOrAdmin, crimeValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            crime_type, title, description, date_occurred, time_occurred,
            location, city, state, latitude, longitude, status,
            severity, evidence_description, weapon_used,
            criminals, victims // Arrays of IDs
        } = req.body;

        // Generate unique crime number
        const year = new Date().getFullYear();
        const lastRecord = await queryOne(
            "SELECT crime_number FROM crimes WHERE crime_number LIKE ? ORDER BY id DESC LIMIT 1",
            [`CR-${year}-%`]
        );
        let nextNum = 1;
        if (lastRecord && lastRecord.crime_number) {
            const parts = lastRecord.crime_number.split('-');
            if (parts.length === 3) {
                nextNum = parseInt(parts[2]) + 1;
            }
        }
        const crimeNumber = `CR-${year}-${String(nextNum).padStart(3, '0')}`;

        const result = await query(
            `INSERT INTO crimes (crime_number, crime_type, title, description, date_occurred, 
             time_occurred, location, city, state, latitude, longitude, status, severity,
             evidence_description, weapon_used, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [crimeNumber, crime_type, title, description, date_occurred, time_occurred,
             location, city, state, latitude, longitude, status || 'open', severity || 'medium',
             evidence_description, weapon_used, req.user.id].map(v => (v === undefined || v === '') ? null : v)
        );

        const crimeId = result.insertId;

        // Link criminals if provided
        if (criminals && Array.isArray(criminals)) {
            for (const c of criminals) {
                const cId = typeof c === 'object' ? c.id : c;
                const role = typeof c === 'object' ? c.role : 'suspect';
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id, role) VALUES (?, ?, ?)',
                    [crimeId, cId, role]
                );
            }
        }

        // Link victims if provided
        if (victims && Array.isArray(victims)) {
            for (const vId of victims) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?)',
                    [crimeId, vId]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Crime record created successfully',
            crimeId,
            crimeNumber
        });
    } catch (error) {
        console.error('Create crime error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating crime record'
        });
    }
});

/**
 * PUT /api/crimes/:id
 * Update crime record
 */
router.put('/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            crime_type, title, description, date_occurred, time_occurred,
            location, city, state, latitude, longitude, status,
            severity, evidence_description, weapon_used,
            criminals, victims // Arrays of IDs
        } = req.body;

        // Check if crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        await query(
            `UPDATE crimes SET 
             crime_type = COALESCE(?, crime_type),
             title = COALESCE(?, title),
             description = COALESCE(?, description),
             date_occurred = COALESCE(?, date_occurred),
             time_occurred = COALESCE(?, time_occurred),
             location = COALESCE(?, location),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude),
             status = COALESCE(?, status),
             severity = COALESCE(?, severity),
             evidence_description = COALESCE(?, evidence_description),
             weapon_used = COALESCE(?, weapon_used)
             WHERE id = ?`,
            [crime_type, title, description, date_occurred, time_occurred,
             location, city, state, latitude, longitude, status, severity,
             evidence_description, weapon_used, id].map(v => (v === undefined || v === '') ? null : v)
        );

        // Update criminal links if provided
        if (criminals && Array.isArray(criminals)) {
            // Remove existing links
            await query('DELETE FROM crime_criminals WHERE crime_id = ?', [id]);
            // Add new links
            for (const c of criminals) {
                const cId = typeof c === 'object' ? (c.id || c.criminal_id) : c;
                const role = typeof c === 'object' ? c.role : 'suspect';
                await query(
                    'INSERT INTO crime_criminals (crime_id, criminal_id, role) VALUES (?, ?, ?)',
                    [id, cId, role]
                );
            }
        }

        // Update victim links if provided
        if (victims && Array.isArray(victims)) {
            // Remove existing links
            await query('DELETE FROM crime_victims WHERE crime_id = ?', [id]);
            // Add new links
            for (const vId of victims) {
                await query(
                    'INSERT INTO crime_victims (crime_id, victim_id) VALUES (?, ?)',
                    [id, vId]
                );
            }
        }

        res.json({
            success: true,
            message: 'Crime record updated successfully'
        });
    } catch (error) {
        console.error('Update crime error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating crime record'
        });
    }
});

/**
 * DELETE /api/crimes/:id
 * Delete crime record (Admin only)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete crime records'
            });
        }

        const { id } = req.params;

        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        await query('DELETE FROM crimes WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Crime record deleted successfully'
        });
    } catch (error) {
        console.error('Delete crime error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting crime record'
        });
    }
});

/**
 * POST /api/crimes/:id/criminals
 * Link criminal to crime
 */
router.post('/:id/criminals', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { criminal_id, role, notes } = req.body;

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Verify criminal exists
        const criminal = await queryOne('SELECT id FROM criminals WHERE id = ?', [criminal_id]);
        if (!criminal) {
            return res.status(404).json({
                success: false,
                message: 'Criminal not found'
            });
        }

        await query(
            'INSERT INTO crime_criminals (crime_id, criminal_id, role, notes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = ?, notes = ?',
            [id, criminal_id, role || 'suspect', notes, role || 'suspect', notes].map(v => (v === undefined || v === '') ? null : v)
        );

        res.json({
            success: true,
            message: 'Criminal linked to crime successfully'
        });
    } catch (error) {
        console.error('Link criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error linking criminal'
        });
    }
});

/**
 * DELETE /api/crimes/:id/criminals/:criminalId
 * Unlink criminal from crime
 */
router.delete('/:id/criminals/:criminalId', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id, criminalId } = req.params;

        await query(
            'DELETE FROM crime_criminals WHERE crime_id = ? AND criminal_id = ?',
            [id, criminalId]
        );

        res.json({
            success: true,
            message: 'Criminal unlinked from crime'
        });
    } catch (error) {
        console.error('Unlink criminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unlinking criminal'
        });
    }
});

/**
 * POST /api/crimes/:id/victims
 * Link victim to crime
 */
router.post('/:id/victims', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { victim_id, notes } = req.body;

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Verify victim exists
        const victim = await queryOne('SELECT id FROM victims WHERE id = ?', [victim_id]);
        if (!victim) {
            return res.status(404).json({
                success: false,
                message: 'Victim not found'
            });
        }

        await query(
            'INSERT INTO crime_victims (crime_id, victim_id, notes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE notes = ?',
            [id, victim_id, notes, notes].map(v => (v === undefined || v === '') ? null : v)
        );

        res.json({
            success: true,
            message: 'Victim linked to crime successfully'
        });
    } catch (error) {
        console.error('Link victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error linking victim'
        });
    }
});

/**
 * DELETE /api/crimes/:id/victims/:victimId
 * Unlink victim from crime
 */
router.delete('/:id/victims/:victimId', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id, victimId } = req.params;

        await query(
            'DELETE FROM crime_victims WHERE crime_id = ? AND victim_id = ?',
            [id, victimId]
        );

        res.json({
            success: true,
            message: 'Victim unlinked from crime'
        });
    } catch (error) {
        console.error('Unlink victim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unlinking victim'
        });
    }
});

module.exports = router;
