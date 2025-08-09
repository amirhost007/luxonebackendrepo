const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createUser() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'luxone_quotation_system'
  });

  try {
    // Check if user already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', ['user@theluxone.com']);
    
    if (existing.length === 0) {
      const hash = bcrypt.hashSync('user123', 10);
      await connection.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        ['user@theluxone.com', hash, 'Regular User', 'user']
      );
      console.log('Regular user created successfully');
    } else {
      console.log('User already exists');
    }

    // List all users
    const [users] = await connection.query('SELECT email, role FROM users');
    console.log('All users:', users);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

createUser();
