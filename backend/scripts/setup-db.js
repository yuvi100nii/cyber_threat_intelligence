/**
 * Database Setup Script
 * Initializes the database with proper password hashing
 * Run: node setup-db.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log('Starting database setup...\n');

    // Database connection config
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crms_db',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
        ssl: process.env.DB_HOST !== 'localhost' ? {
            rejectUnauthorized: false
        } : null
    };

    let connection;

    try {
        // Connect to MySQL
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(config);
        console.log('Connected successfully!\n');

        // Read and execute schema
        console.log('Creating database schema...');
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schema);
        console.log('Schema created successfully!\n');

        // Hash passwords for sample users
        console.log('Creating sample users with hashed passwords...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Insert users with properly hashed passwords
        const users = [
            ['admin', hashedPassword, 'System Administrator', 'admin@crms.gov', 'admin', 'ADMIN001', 'Headquarters', '555-0100'],
            ['officer_john', hashedPassword, 'John Smith', 'john.smith@crms.gov', 'police_officer', 'PO-1001', 'Homicide Division', '555-0101'],
            ['officer_jane', hashedPassword, 'Jane Doe', 'jane.doe@crms.gov', 'police_officer', 'PO-1002', 'Cyber Crime Unit', '555-0102'],
            ['officer_mike', hashedPassword, 'Mike Johnson', 'mike.johnson@crms.gov', 'police_officer', 'PO-1003', 'Narcotics Division', '555-0103'],
            ['officer_sarah', hashedPassword, 'Sarah Williams', 'sarah.williams@crms.gov', 'police_officer', 'PO-1004', 'Traffic Division', '555-0104']
        ];

        for (const user of users) {
            await connection.query(
                `INSERT INTO users (username, password, full_name, email, role, badge_number, department, phone)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = ?`,
                [...user, hashedPassword]
            );
        }
        console.log('Users created successfully!\n');

        // Insert police officer details
        console.log('Creating police officer profiles...');
        const officers = [
            [2, 'Detective', 'Central Police Station', '2018-03-15', 'Homicide Investigation'],
            [3, 'Sergeant', 'Cyber Crime Cell', '2019-07-20', 'Digital Forensics'],
            [4, 'Inspector', 'Anti-Narcotics Bureau', '2015-01-10', 'Drug Trafficking'],
            [5, 'Constable', 'Traffic Control', '2020-11-05', 'Accident Investigation']
        ];

        for (const officer of officers) {
            await connection.query(
                `INSERT INTO police_officers (user_id, \`rank\`, station, joining_date, specialization)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE \`rank\` = ?`,
                [...officer, officer[1]]
            );
        }
        console.log('Police officer profiles created!\n');

        // Insert sample criminals
        console.log('Creating sample criminals...');
        await connection.query(`
            INSERT INTO criminals (first_name, last_name, alias, date_of_birth, gender, nationality, address, phone, identification_mark, status, height_cm, weight_kg, eye_color, hair_color) VALUES
            ('James', 'Wilson', 'The Shadow', '1985-06-15', 'male', 'American', '123 Dark Alley, Downtown', '555-9001', 'Scar on left cheek', 'wanted', 180, 75, 'brown', 'black'),
            ('Maria', 'Garcia', 'Red Fox', '1990-02-28', 'female', 'Mexican', '456 Hidden Street, Westside', '555-9002', 'Tattoo on right arm', 'arrested', 165, 55, 'green', 'red'),
            ('Robert', 'Brown', 'Big Bob', '1978-11-03', 'male', 'American', '789 Crime Lane, Eastside', NULL, 'Missing left pinky', 'wanted', 195, 110, 'blue', 'bald'),
            ('Lisa', 'Chen', NULL, '1995-08-22', 'female', 'Chinese', '321 Quiet Road, Suburbs', '555-9004', 'None', 'released', 158, 50, 'brown', 'black'),
            ('Ahmed', 'Hassan', 'The Ghost', '1982-04-10', 'male', 'Egyptian', 'Unknown', NULL, 'Burn mark on back', 'wanted', 175, 70, 'brown', 'brown')
            ON DUPLICATE KEY UPDATE status = status
        `);
        console.log('Criminals created!\n');

        // Insert sample crimes
        console.log('Creating sample crimes...');
        await connection.query(`
            INSERT INTO crimes (crime_number, crime_type, title, description, date_occurred, time_occurred, location, city, state, status, severity, weapon_used, created_by) VALUES
            ('CR-2024-001', 'robbery', 'Downtown Bank Robbery', 'Armed robbery at First National Bank. Suspects escaped with approximately $50,000.', '2024-01-15', '14:30:00', '100 Main Street', 'Metro City', 'State A', 'investigating', 'high', 'Handgun', 2),
            ('CR-2024-002', 'murder', 'Warehouse District Homicide', 'Body found in abandoned warehouse. Victim identified as local businessman.', '2024-01-20', '23:45:00', '500 Industrial Ave', 'Metro City', 'State A', 'open', 'critical', 'Knife', 2),
            ('CR-2024-003', 'cybercrime', 'Corporate Data Breach', 'Major data breach affecting TechCorp. Customer data compromised.', '2024-02-01', '09:00:00', 'TechCorp HQ, 200 Silicon Blvd', 'Tech Valley', 'State B', 'investigating', 'high', NULL, 3),
            ('CR-2024-004', 'drug_offense', 'Drug Trafficking Ring Bust', 'Large-scale drug operation discovered in residential area.', '2024-02-10', '02:00:00', '777 Suburban Drive', 'Quiet Town', 'State A', 'solved', 'high', NULL, 4),
            ('CR-2024-005', 'assault', 'Bar Fight Assault', 'Aggravated assault at local bar resulting in serious injuries.', '2024-02-14', '22:15:00', 'Joe''s Bar, 50 Party Street', 'Metro City', 'State A', 'closed', 'medium', 'Bottle', 2),
            ('CR-2024-006', 'theft', 'Vehicle Theft Ring', 'Multiple luxury vehicles stolen from dealership.', '2024-02-20', '03:30:00', 'Luxury Auto Mall', 'Metro City', 'State A', 'open', 'medium', NULL, 5),
            ('CR-2024-007', 'fraud', 'Insurance Fraud Scheme', 'Organized insurance fraud affecting multiple victims.', '2024-03-01', '10:00:00', 'Various Locations', 'Metro City', 'State A', 'investigating', 'medium', NULL, 2),
            ('CR-2024-008', 'kidnapping', 'Child Abduction Case', 'Missing child reported from school premises.', '2024-03-05', '15:30:00', 'Lincoln Elementary School', 'Quiet Town', 'State A', 'investigating', 'critical', NULL, 2)
            ON DUPLICATE KEY UPDATE status = status
        `);
        console.log('Crimes created!\n');

        // Insert sample victims
        console.log('Creating sample victims...');
        await connection.query(`
            INSERT INTO victims (first_name, last_name, date_of_birth, gender, address, phone, email, occupation, injury_description, statement) VALUES
            ('Michael', 'Thompson', '1970-05-20', 'male', '100 Main Street, Metro City', '555-1001', 'mthompson@email.com', 'Bank Manager', 'Minor injuries from being pushed', 'I was at the counter when three masked men entered...'),
            ('David', 'Lee', '1965-09-12', 'male', '45 Business Park, Metro City', '555-1002', 'david.lee@techcorp.com', 'Businessman', 'Fatal stab wounds', NULL),
            ('TechCorp Inc.', 'Corporation', NULL, NULL, '200 Silicon Blvd, Tech Valley', '555-1003', 'security@techcorp.com', 'Technology Company', 'Data breach - financial losses', 'We noticed unusual activity on our servers...'),
            ('Emily', 'Watson', '1988-12-03', 'female', '60 Park Avenue, Metro City', '555-1004', 'emily.w@email.com', 'Teacher', 'Bruises and lacerations', 'I was trying to break up the fight when...'),
            ('Jake', 'Miller', '2015-07-15', 'male', '150 Oak Street, Quiet Town', '555-1005', NULL, 'Student', 'Unknown', NULL)
        `);
        console.log('Victims created!\n');

        // Insert FIRs
        console.log('Creating sample FIRs...');
        await connection.query(`
            INSERT INTO fir (fir_number, crime_id, complainant_name, complainant_address, complainant_phone, date_filed, time_filed, description, status, investigating_officer_id) VALUES
            ('FIR-2024-001', 1, 'First National Bank Security', '100 Main Street, Metro City', '555-2001', '2024-01-15', '15:00:00', 'Report of armed robbery at bank premises. Three suspects involved.', 'under_investigation', 2),
            ('FIR-2024-002', 2, 'Anonymous Caller', 'Unknown', NULL, '2024-01-21', '00:30:00', 'Body discovered by homeless person in warehouse district.', 'under_investigation', 2),
            ('FIR-2024-003', 3, 'TechCorp Security Team', '200 Silicon Blvd, Tech Valley', '555-2003', '2024-02-01', '11:00:00', 'Major security breach detected. Customer data compromised.', 'under_investigation', 3),
            ('FIR-2024-004', 4, 'Neighborhood Watch', '777 Suburban Drive, Quiet Town', '555-2004', '2024-02-10', '03:00:00', 'Suspicious activity reported. Large quantities of drugs found.', 'chargesheet_filed', 4),
            ('FIR-2024-005', 8, 'Sarah Miller', '150 Oak Street, Quiet Town', '555-2005', '2024-03-05', '16:00:00', 'Child did not return from school. Last seen at 3:30 PM.', 'under_investigation', 2)
            ON DUPLICATE KEY UPDATE status = status
        `);
        console.log('FIRs created!\n');

        // Link criminals to crimes
        console.log('Linking criminals to crimes...');
        await connection.query(`
            INSERT INTO crime_criminals (crime_id, criminal_id, role, notes) VALUES
            (1, 1, 'primary', 'Identified from security footage'),
            (1, 3, 'accomplice', 'Getaway driver'),
            (2, 5, 'suspect', 'Witness saw someone matching description'),
            (4, 2, 'primary', 'Arrested at scene'),
            (4, 4, 'accomplice', 'Released after cooperation')
            ON DUPLICATE KEY UPDATE role = role
        `);
        console.log('Criminal links created!\n');

        // Link victims to crimes
        console.log('Linking victims to crimes...');
        await connection.query(`
            INSERT INTO crime_victims (crime_id, victim_id, notes) VALUES
            (1, 1, 'Bank manager present during robbery'),
            (2, 2, 'Deceased victim'),
            (3, 3, 'Corporate victim - data breach'),
            (5, 4, 'Injured bystander'),
            (8, 5, 'Missing child')
            ON DUPLICATE KEY UPDATE notes = notes
        `);
        console.log('Victim links created!\n');

        // Assign officers to cases
        console.log('Assigning officers to cases...');
        await connection.query(`
            INSERT INTO case_assignments (crime_id, officer_id, assigned_date, role, status, notes) VALUES
            (1, 2, '2024-01-15', 'lead', 'active', 'Primary investigator for bank robbery'),
            (1, 5, '2024-01-16', 'support', 'active', 'Assisting with vehicle tracking'),
            (2, 2, '2024-01-21', 'lead', 'active', 'Homicide investigation lead'),
            (3, 3, '2024-02-01', 'lead', 'active', 'Cyber forensics expert assigned'),
            (4, 4, '2024-02-10', 'lead', 'completed', 'Case resolved - arrests made'),
            (8, 2, '2024-03-05', 'lead', 'active', 'Urgent - child abduction case')
            ON DUPLICATE KEY UPDATE status = status
        `);
        console.log('Case assignments created!\n');

        console.log('='.repeat(50));
        console.log('Database setup completed successfully!');
        console.log('='.repeat(50));
        console.log('\nDefault login credentials:');
        console.log('  Admin: admin / admin123');
        console.log('  Officers: officer_john, officer_jane, officer_mike, officer_sarah / admin123');
        console.log('\nYou can now start the server with: npm start');

    } catch (error) {
        console.error('Setup error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
