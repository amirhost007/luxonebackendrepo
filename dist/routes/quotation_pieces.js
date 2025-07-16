"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// Create a new quotation piece
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const [result] = await db_1.pool.query('INSERT INTO quotation_pieces SET ?', [data]);
        res.status(201).json({ id: result.insertId });
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
// Get all pieces for a quotation
router.get('/', async (req, res) => {
    const { quotation_id } = req.query;
    if (!quotation_id)
        return res.status(400).json({ error: 'quotation_id is required' });
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM quotation_pieces WHERE quotation_id = ?', [quotation_id]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: 'Database error', details: err });
    }
});
exports.default = router;
