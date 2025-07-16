import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_users');
    const rows = result[0] as any[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE id = ?', [req.params.id]);
    const rows = result[0] as any[];
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await pool.query('INSERT INTO admin_users SET ?', [data]);
    res.status(201).json({ id: (result[0] as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const result = await pool.query('UPDATE admin_users SET ? WHERE id = ?', [data, req.params.id]);
    res.json({ affectedRows: (result[0] as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
    res.json({ affectedRows: (result[0] as any).affectedRows });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router; 