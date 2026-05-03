/**
 * Crime Record Management System - Main Server
 * Entry point for the Express.js backend application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, query } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const crimeRoutes = require('./routes/crimes');
const criminalRoutes = require('./routes/criminals');
const victimRoutes = require('./routes/victims');
const firRoutes = require('./routes/fir');
const policeRoutes = require('./routes/police');
const dashboardRoutes = require('./routes/dashboard');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crimes', crimeRoutes);
app.use('/api/criminals', criminalRoutes);
app.use('/api/victims', victimRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CRMS API is running' });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Database initialization and server startup
async function startServer() {
    try {
        console.log('🔍 Testing database connection...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Database connection failed!');
            console.error('⚠️  CRMS Server requires MySQL to be running.');
            console.error('📋 To fix this:');
            console.error('   1. Start MySQL (via XAMPP Control Panel or Windows Services)');
            console.error('   2. Restart this server');
            process.exit(1);
        }
        
        console.log('✅ Database connection successful!');
        
        // Check if database needs initialization
        try {
            await query('SELECT COUNT(*) FROM users', []);
            console.log('✅ Database initialized and ready!');
        } catch (err) {
            console.log('🔧 Database tables not found. Initializing database...');
            console.log('Please run: node scripts/setup-db.js');
            console.log('This will create all necessary tables and sample data.');
        }
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`\n🚀 CRMS Server running on http://localhost:${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('✨ Application is ready to use!\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
