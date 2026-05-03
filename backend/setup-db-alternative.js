/**
 * Alternative Database Setup Script
 * Tries multiple connection strategies to set up the database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setupDatabaseWithMultipleStrategies() {
    console.log('Starting database setup with multiple connection strategies...\n');

    const strategies = [
        {
            name: 'Standard (empty password)',
            config: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                port: process.env.DB_PORT ||3306,
                multipleStatements: true,
                enableKeepAlive: true
            }
        },
        {
            name: 'With waitForConnections',
            config: {
                waitForConnections: true,
                connectionLimit: 1,
                queueLimit: 0,
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                port: process.env.DB_PORT || 3306,
                multipleStatements: true
            }
        },
        {
            name: 'With additional options',
            config: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                port: process.env.DB_PORT || 3306,
                multipleStatements: true,
                authPlugins: {
                    mysql_native_password: () => () => process.env.DB_PASSWORD || ''
                }
            }
        }
    ];

    for (const strategy of strategies) {
        try {
            console.log(`\nAttempting: ${strategy.name}`);
            
            let connection;
            if (strategy.config.waitForConnections) {
                connection = await mysql.createPool(strategy.config).getConnection();
            } else {
                connection = await mysql.createConnection(strategy.config);
            }

            console.log('✓ Connected successfully!');

            // Check if database exists
            const [databases] = await connection.query(
                `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'crms_db'`
            );

            if (databases.length === 0) {
                console.log('Creating database, schema, and sample data...');
                
                // Read and execute schema
                const schemaPath = path.join(__dirname, '../../database/schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');
                const statements = schema.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await connection.query(statement);
                        } catch (err) {
                            console.log(`Note: ${err.message}`);
                        }
                    }
                }

                console.log('✓ Schema created successfully!');

                // Use the database
                await connection.query('USE crms_db');

                // Create sample users
                console.log('Creating sample users...');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);

                const users = [
                    ['admin', hashedPassword, 'Admin User', 'admin@crms.gov', 'admin', 'ADMIN001', 'Headquarters', '555-0100'],
                    ['officer1', hashedPassword, 'Police Officer 1', 'officer1@crms.gov', 'police_officer', 'PO001', 'Police Station', '555-0101'],
                ];

                for (const user of users) {
                    try {
                        await connection.query(
                            'INSERT INTO users (username, password, full_name, email, role, badge_number, department, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            user
                        );
                    } catch (err) {
                        console.log(`Note: User may already exist - ${err.message.substring(0, 50)}`);
                    }
                }

                console.log('✓ Sample users created!');
            } else {
                console.log('✓ Database already exists!');
            }

            if (connection.release) connection.release();
            else await connection.end();

            console.log('\n✓✓✓ DATABASE SETUP COMPLETE ✓✓✓');
            console.log('\nYou can now:');
            console.log('1. npm start    - to start the server');
            console.log('2. Login with admin/admin123');
            return;

        } catch (error) {
            console.log(`✗ Failed: ${error.message.substring(0, 80)}`);
        }
    }

    console.log('\n\n✗✗✗ ALL STRATEGIES FAILED ✗✗✗');
    console.log('\nPossible solutions:');
    console.log('1. Ensure MySQL is running: Check XAMPP Control Panel');
    console.log('2. Try resetting XAMPP MySQL password');
    console.log('3. Reinstall XAMPP');
    console.log('4. Check Windows Firewall settings for port 3306');
}

setupDatabaseWithMultipleStrategies().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
