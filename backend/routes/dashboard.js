/**
 * Dashboard Routes
 * Statistics and analytics for the CRMS dashboard
 */

const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Get overall statistics for dashboard
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        // Total crimes
        const totalCrimes = await queryOne('SELECT COUNT(*) as count FROM crimes');

        // Crimes by status
        const crimesByStatus = await query(
            `SELECT status, COUNT(*) as count FROM crimes GROUP BY status`
        );

        // Total criminals
        const totalCriminals = await queryOne('SELECT COUNT(*) as count FROM criminals');

        // Wanted criminals
        const wantedCriminals = await queryOne(
            "SELECT COUNT(*) as count FROM criminals WHERE status = 'wanted'"
        );

        // Total FIRs
        const totalFirs = await queryOne('SELECT COUNT(*) as count FROM fir');

        // Active cases (open + investigating)
        const activeCases = await queryOne(
            "SELECT COUNT(*) as count FROM crimes WHERE status IN ('open', 'investigating')"
        );

        // Solved cases
        const solvedCases = await queryOne(
            "SELECT COUNT(*) as count FROM crimes WHERE status = 'solved'"
        );

        // Total officers
        const totalOfficers = await queryOne(
            "SELECT COUNT(*) as count FROM users WHERE role = 'police_officer' AND is_active = TRUE"
        );

        res.json({
            success: true,
            stats: {
                totalCrimes: totalCrimes.count,
                totalCriminals: totalCriminals.count,
                wantedCriminals: wantedCriminals.count,
                totalFirs: totalFirs.count,
                activeCases: activeCases.count,
                solvedCases: solvedCases.count,
                totalOfficers: totalOfficers.count,
                crimesByStatus: crimesByStatus.reduce((acc, item) => {
                    acc[item.status] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics'
        });
    }
});

/**
 * GET /api/dashboard/crimes-by-type
 * Get crime distribution by type
 */
router.get('/crimes-by-type', authenticate, async (req, res) => {
    try {
        const crimesByType = await query(
            `SELECT crime_type, COUNT(*) as count 
             FROM crimes 
             GROUP BY crime_type 
             ORDER BY count DESC`
        );

        res.json({
            success: true,
            data: crimesByType
        });
    } catch (error) {
        console.error('Get crimes by type error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching crime types'
        });
    }
});

/**
 * GET /api/dashboard/crimes-by-severity
 * Get crime distribution by severity
 */
router.get('/crimes-by-severity', authenticate, async (req, res) => {
    try {
        const crimesBySeverity = await query(
            `SELECT severity, COUNT(*) as count 
             FROM crimes 
             GROUP BY severity 
             ORDER BY 
                CASE severity 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END`
        );

        res.json({
            success: true,
            data: crimesBySeverity
        });
    } catch (error) {
        console.error('Get crimes by severity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching crime severity'
        });
    }
});

/**
 * GET /api/dashboard/recent-crimes
 * Get most recent crimes
 */
router.get('/recent-crimes', authenticate, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const recentCrimes = await query(
            `SELECT c.id, c.crime_number, c.crime_type, c.title, c.status, 
                    c.severity, c.date_occurred, c.location, c.city,
                    u.full_name as created_by_name
             FROM crimes c
             LEFT JOIN users u ON c.created_by = u.id
             ORDER BY c.created_at DESC
             LIMIT ${parseInt(limit)}`
        );

        res.json({
            success: true,
            crimes: recentCrimes
        });
    } catch (error) {
        console.error('Get recent crimes error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching recent crimes'
        });
    }
});

/**
 * GET /api/dashboard/monthly-trends
 * Get crime trends by month (last 12 months)
 */
router.get('/monthly-trends', authenticate, async (req, res) => {
    try {
        const monthlyTrends = await query(
            `SELECT 
                DATE_FORMAT(date_occurred, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) as solved,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
             FROM crimes
             WHERE date_occurred >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(date_occurred, '%Y-%m')
             ORDER BY month`
        );

        res.json({
            success: true,
            data: monthlyTrends
        });
    } catch (error) {
        console.error('Get monthly trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching monthly trends'
        });
    }
});

/**
 * GET /api/dashboard/crimes-by-location
 * Get crime distribution by city/location
 */
router.get('/crimes-by-location', authenticate, async (req, res) => {
    try {
        const crimesByLocation = await query(
            `SELECT city, COUNT(*) as count 
             FROM crimes 
             WHERE city IS NOT NULL AND city != ''
             GROUP BY city 
             ORDER BY count DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: crimesByLocation
        });
    } catch (error) {
        console.error('Get crimes by location error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching crime locations'
        });
    }
});

/**
 * GET /api/dashboard/officer-workload
 * Get case assignments per officer (Admin view)
 */
router.get('/officer-workload', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const workload = await query(
            `SELECT u.id, u.full_name, u.badge_number, u.department,
                    COUNT(ca.id) as total_cases,
                    SUM(CASE WHEN ca.status = 'active' THEN 1 ELSE 0 END) as active_cases,
                    SUM(CASE WHEN ca.status = 'completed' THEN 1 ELSE 0 END) as completed_cases
             FROM users u
             LEFT JOIN case_assignments ca ON u.id = ca.officer_id
             WHERE u.role = 'police_officer' AND u.is_active = TRUE
             GROUP BY u.id
             ORDER BY active_cases DESC`
        );

        res.json({
            success: true,
            data: workload
        });
    } catch (error) {
        console.error('Get officer workload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching officer workload'
        });
    }
});

/**
 * GET /api/dashboard/critical-cases
 * Get high priority/critical cases
 */
router.get('/critical-cases', authenticate, async (req, res) => {
    try {
        const criticalCases = await query(
            `SELECT c.id, c.crime_number, c.crime_type, c.title, c.status,
                    c.date_occurred, c.location, c.city,
                    GROUP_CONCAT(DISTINCT u.full_name) as assigned_officers
             FROM crimes c
             LEFT JOIN case_assignments ca ON c.id = ca.crime_id AND ca.status = 'active'
             LEFT JOIN users u ON ca.officer_id = u.id
             WHERE c.severity IN ('critical', 'high') AND c.status NOT IN ('closed', 'solved')
             GROUP BY c.id
             ORDER BY 
                CASE c.severity WHEN 'critical' THEN 1 ELSE 2 END,
                c.date_occurred DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            cases: criticalCases
        });
    } catch (error) {
        console.error('Get critical cases error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching critical cases'
        });
    }
});

/**
 * GET /api/dashboard/fir-status
 * Get FIR statistics
 */
router.get('/fir-status', authenticate, async (req, res) => {
    try {
        const firStats = await query(
            `SELECT status, COUNT(*) as count 
             FROM fir 
             GROUP BY status`
        );

        res.json({
            success: true,
            data: firStats
        });
    } catch (error) {
        console.error('Get FIR status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching FIR status'
        });
    }
});

module.exports = router;
