/**
 * MySQL Password Finder
 * Tries common XAMPP MySQL passwords
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const commonPasswords = [
    '',
    'password',
    'root',
    'admin',
    'xampp',
    '123456',
    'mysql',
    'localhost',
    '1234',
    'pass',
    'admin123',
    'password123',
    undefined,
];

async function findPassword() {
    console.log('Attempting to find MySQL root password...\n');

    for (let i = 0; i < commonPasswords.length; i++) {
        const pass = commonPasswords[i];
        const passDisplay = pass === '' ? '(empty)' : pass;
        
        process.stdout.write(`[${i + 1}/${commonPasswords.length}] Trying password: "${passDisplay}" ... `);

        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pass || '',
                port: 3306,
                connectTimeout: 2000
            });

            console.log('✓ SUCCESS!');
            console.log(`\n✓✓ FOUND PASSWORD: "${passDisplay}"`);

            // Get version to confirm
            const [rows] = await connection.query('SELECT VERSION() as version');
            console.log('MySQL Version:', rows[0].version);

            // Save to .env
            const fs = require('fs');
            const envPath = require('path').join(__dirname, '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            envContent = envContent.replace(
                /DB_PASSWORD=.*/,
                `DB_PASSWORD=${pass || ''}`
            );
            
            fs.writeFileSync(envPath, envContent);
            console.log(`✓ .env file updated with password: "${passDisplay}"`);

            await connection.end();
            return pass;
        } catch (error) {
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('✗ Wrong password');
            } else if (error.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
                console.log('✗ Timeout - MySQL might not be running');
                break;
            } else {
                console.log(`✗ Error: ${error.code}`);
            }
        }
    }

    console.log('\n✗ Password not found in common passwords list');
    console.log('Please try:');
    console.log('1. Reinstalling XAMPP');
    console.log('2. Or manually resetting MySQL root password');
}

findPassword();
