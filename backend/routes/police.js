/**
 * Police Module Routes
 * Case assignments, officer management, and case tracking
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, queryOne } = require('../config/database');
const { authenticate, policeOrAdmin, adminOnly } = require('../middleware/auth');

/**
 * GET /api/police/officers
 * Get all police officers
 */
router.get('/officers', authenticate, async (req, res) => {
    try {
        const { department, available } = req.query;

        let whereClause = "u.role = 'police_officer' AND u.is_active = TRUE";
        const params = [];

        if (department) {
            whereClause += ' AND u.department = ?';
            params.push(department);
        }

        const officers = await query(
            `SELECT u.id, u.full_name, u.badge_number, u.department, u.email, u.phone,
                    po.rank, po.station, po.specialization,
                    (SELECT COUNT(*) FROM case_assignments ca WHERE ca.officer_id = u.id AND ca.status = 'active') as active_cases
             FROM users u
             LEFT JOIN police_officers po ON u.id = po.user_id
             WHERE ${whereClause}
             ORDER BY u.full_name`,
            params
        );

        res.json({
            success: true,
            officers
        });
    } catch (error) {
        console.error('Get officers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching officers'
        });
    }
});

/**
 * GET /api/police/officers/:id
 * Get officer details with assigned cases
 */
router.get('/officers/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const officer = await queryOne(
            `SELECT u.id, u.full_name, u.badge_number, u.department, u.email, u.phone,
                    po.rank, po.station, po.joining_date, po.specialization
             FROM users u
             LEFT JOIN police_officers po ON u.id = po.user_id
             WHERE u.id = ? AND u.role = 'police_officer'`,
            [id]
        );

        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found'
            });
        }

        // Get assigned cases
        const assignedCases = await query(
            `SELECT c.id, c.crime_number, c.crime_type, c.title, c.status as crime_status,
                    c.severity, c.date_occurred, ca.role, ca.status as assignment_status,
                    ca.assigned_date, ca.notes
             FROM crimes c
             INNER JOIN case_assignments ca ON c.id = ca.crime_id
             WHERE ca.officer_id = ?
             ORDER BY ca.assigned_date DESC`,
            [id]
        );

        // Get case statistics
        const stats = await queryOne(
            `SELECT 
                COUNT(*) as total_cases,
                SUM(CASE WHEN ca.status = 'active' THEN 1 ELSE 0 END) as active_cases,
                SUM(CASE WHEN ca.status = 'completed' THEN 1 ELSE 0 END) as completed_cases
             FROM case_assignments ca
             WHERE ca.officer_id = ?`,
            [id]
        );

        res.json({
            success: true,
            officer: {
                ...officer,
                assignedCases,
                statistics: stats
            }
        });
    } catch (error) {
        console.error('Get officer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching officer details'
        });
    }
});

/**
 * POST /api/police/assign
 * Assign officer to a case
 */
router.post('/assign', authenticate, policeOrAdmin, [
    body('crime_id').isInt().withMessage('Valid crime ID is required'),
    body('officer_id').isInt().withMessage('Valid officer ID is required'),
    body('role').isIn(['lead', 'support', 'investigator']).withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { crime_id, officer_id, role, notes } = req.body;

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [crime_id]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Verify officer exists and is a police officer
        const officer = await queryOne(
            "SELECT id FROM users WHERE id = ? AND role = 'police_officer' AND is_active = TRUE",
            [officer_id]
        );
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: 'Officer not found or inactive'
            });
        }

        // Check if already assigned
        const existingAssignment = await queryOne(
            'SELECT id FROM case_assignments WHERE crime_id = ? AND officer_id = ?',
            [crime_id, officer_id]
        );

        if (existingAssignment) {
            // Update existing assignment
            await query(
                'UPDATE case_assignments SET role = ?, notes = ?, status = ? WHERE id = ?',
                [role, notes, 'active', existingAssignment.id]
            );
        } else {
            // Create new assignment
            await query(
                `INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, notes)
                 VALUES (?, ?, CURDATE(), ?, ?)`,
                [crime_id, officer_id, role, notes].map(v => (v === undefined || v === '') ? null : v)
            );
        }

        res.json({
            success: true,
            message: 'Officer assigned to case successfully'
        });
    } catch (error) {
        console.error('Assign officer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error assigning officer'
        });
    }
});

/**
 * PUT /api/police/assignments/:id
 * Update case assignment
 */
router.put('/assignments/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status, notes } = req.body;

        const assignment = await queryOne('SELECT id FROM case_assignments WHERE id = ?', [id]);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        await query(
            `UPDATE case_assignments SET
             role = COALESCE(?, role),
             status = COALESCE(?, status),
             notes = COALESCE(?, notes)
             WHERE id = ?`,
            [role, status, notes, id].map(v => (v === undefined || v === '') ? null : v)
        );

        res.json({
            success: true,
            message: 'Assignment updated successfully'
        });
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating assignment'
        });
    }
});

/**
 * DELETE /api/police/assignments/:id
 * Remove officer from case
 */
router.delete('/assignments/:id', authenticate, policeOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await queryOne('SELECT id FROM case_assignments WHERE id = ?', [id]);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        await query('DELETE FROM case_assignments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Officer removed from case'
        });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing assignment'
        });
    }
});

/**
 * GET /api/police/my-cases
 * Get cases assigned to current officer
 */
router.get('/my-cases', authenticate, async (req, res) => {
    try {
        const { status } = req.query;

        let whereClause = 'ca.officer_id = ?';
        const params = [req.user.id];

        if (status) {
            whereClause += ' AND ca.status = ?';
            params.push(status);
        }

        const cases = await query(
            `SELECT c.*, ca.role as assignment_role, ca.status as assignment_status,
                    ca.assigned_date, ca.notes as assignment_notes,
                    (SELECT COUNT(*) FROM crime_criminals cc WHERE cc.crime_id = c.id) as criminal_count,
                    (SELECT COUNT(*) FROM fir f WHERE f.crime_id = c.id) as has_fir
             FROM crimes c
             INNER JOIN case_assignments ca ON c.id = ca.crime_id
             WHERE ${whereClause}
             ORDER BY 
                CASE c.severity 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                c.date_occurred DESC`,
            params
        );

        res.json({
            success: true,
            cases
        });
    } catch (error) {
        console.error('Get my cases error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching assigned cases'
        });
    }
});

/**
 * PUT /api/police/cases/:crimeId/status
 * Update case status
 */
router.put('/cases/:crimeId/status', authenticate, policeOrAdmin, [
    body('status').isIn(['open', 'investigating', 'closed', 'solved']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { crimeId } = req.params;
        const { status } = req.body;

        // Verify crime exists
        const crime = await queryOne('SELECT id FROM crimes WHERE id = ?', [crimeId]);
        if (!crime) {
            return res.status(404).json({
                success: false,
                message: 'Crime not found'
            });
        }

        // Update crime status
        await query('UPDATE crimes SET status = ? WHERE id = ?', [status, crimeId]);

        // Add case update note
        await query(
            `INSERT INTO case_updates (crime_id, officer_id, update_type, description)
             VALUES (?, ?, 'note', ?)`,
            [crimeId, req.user.id, `Case status changed to: ${status}`]
        );

        res.json({
            success: true,
            message: 'Case status updated successfully'
        });
    } catch (error) {
        console.error('Update case status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating case status'
        });
    }
});

/**
 * GET /api/police/departments
 * Get list of departments
 */
router.get('/departments', authenticate, async (req, res) => {
    try {
        const departments = await query(
            `SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department`
        );

        res.json({
            success: true,
            departments: departments.map(d => d.department)
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching departments'
        });
    }
});

module.exports = router;
