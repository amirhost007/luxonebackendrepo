const { pool } = require('./db');

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.send('✅ DB connection successful');
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    res.status(500).json({ error: 'DB connection failed', details: err });
  }
});
