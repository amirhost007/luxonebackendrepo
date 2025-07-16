import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Create a new quotation piece
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const [result] = await pool.query('INSERT INTO quotation_pieces SET ?', [data]);
    res.status(201).json({ id: (result as any).insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

// Get all pieces for a quotation
router.get('/', async (req, res) => {
  const { quotation_id } = req.query;
  if (!quotation_id) return res.status(400).json({ error: 'quotation_id is required' });
  try {
    const [rows] = await pool.query('SELECT * FROM quotation_pieces WHERE quotation_id = ?', [quotation_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

export default router; 