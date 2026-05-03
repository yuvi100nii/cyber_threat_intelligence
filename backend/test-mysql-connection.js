const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing MySQL connections...\n');

    // Test configurations to try
    const configs = [
        {
            name: 'Default (no password)',
            host: 'localhost',
            user: 'root',
            password: '',
            port: 3306
        },
        {
            name: 'With socket',
            host: 'localhost',
            user: 'root',
            password: '',
            port: 3306,
            socketPath: '/var/run/mysqld/mysqld.sock'
        },
        {
            name: '127.0.0.1',
            host: '127.0.0.1',
            user: 'root',
            password: '',
            port: 3306
        }
    ];

    for (const config of configs) {
        try {
            console.log(`\nAttempting: ${config.name}`);
            console.log(`Config: ${JSON.stringify({host: config.host, user: config.user, port: config.port})}`);
            
            const connection = await mysql.createConnection(config);
            const [rows] = await connection.query('SELECT VERSION() as version');
            console.log('✓ SUCCESS! MySQL Version:', rows[0].version);
            
            // Try to show databases
            const [databases] = await connection.query('SHOW DATABASES');
            console.log('Available databases:', databases.map(db => db.Database).join(', '));
            
            await connection.end();
            return;
        } catch (error) {
            console.log('✗ FAILED:', error.message);
        }
    }

    console.log('\n\nAll connection attempts failed!');
    console.log('Please ensure:');
    console.log('1. MySQL is running (check XAMPP Control Panel)');
    console.log('2. Port 3306 is not blocked');
    console.log('3. The root user exists and has no password set');
}

testConnection();
