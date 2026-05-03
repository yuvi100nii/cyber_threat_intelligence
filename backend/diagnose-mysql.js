const mysql = require('mysql2/promise');

async function getDetailedError() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            port: 3306,
            database: 'mysql'  // Try to connect to default MySQL database
        });
        
        const [rows] = await connection.query('SELECT USER() as current_user, VERSION() as version');
        console.log('Connected as:', rows[0]);
        
        await connection.end();
    } catch (error) {
        console.log('ERROR DETAILS:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
        console.log('Errno:', error.errno);
        console.log('SQL State:', error.sqlState);
        console.log('\nFull Error:', error);
        
        // Try to suggest solutions
        console.log('\n\nPOSSIBLE SOLUTIONS:');
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('1. Try changing DB_PASSWORD in .env to a common XAMPP password');
            console.log('   - Try: "xampp", "password", "root", "admin"');
            console.log('2. Or reset XAMPP MySQL to default (reinstall XAMPP)');
            console.log('3. Or use phpMyAdmin to check current MySQL user setup');
            console.log('4. Check if MySQL service is actually running');
        }
    }
}

getDetailedError();
