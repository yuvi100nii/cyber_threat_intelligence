/**
 * Database Configuration
 * MySQL connection pool setup using mysql2
 */

const mysql = require('mysql2/promise');

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crms_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Execute query helper function
const query = async (sql, params) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        throw error;
    }
};

// Get single row helper
const queryOne = async (sql, params) => {
    const results = await query(sql, params);
    return results[0] || null;
};

module.exports = {
    pool,
    query,
    queryOne,
    testConnection
};

module.exports = {
    pool,
    query,
    queryOne,
    testConnection
};
