"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'luxone_secret';
// Register
router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email and password required' });
    try {
        const [existing] = await db_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0)
            return res.status(409).json({ error: 'Email already registered' });
        const hash = await bcryptjs_1.default.hash(password, 10);
        await db_1.pool.query('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)', [email, hash, full_name || null]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email and password required' });
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const match = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});
// Middleware to verify JWT
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
// List all users (admin only)
router.get('/', async (req, res) => {
    // TODO: Add admin auth check
    try {
        console.log('Fetching users from database...');
        const [rows] = await db_1.pool.query('SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC');
        console.log('Users fetched successfully:', rows);
        res.json(rows);
    }
    catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users', details: err instanceof Error ? err.message : 'Unknown error' });
    }
});
// Add user (admin only)
router.post('/', async (req, res) => {
    // TODO: Add admin auth check
    const { email, password, full_name } = req.body;
    console.log('Adding user:', { email, full_name });
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const [existing] = await db_1.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Email already exists:', email);
            return res.status(409).json({ error: 'Email already registered' });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        await db_1.pool.query('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)', [email, hash, full_name || null]);
        console.log('User added successfully:', email);
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ error: 'Failed to add user', details: err instanceof Error ? err.message : 'Unknown error' });
    }
});
// Edit user (admin only)
router.put('/:id', async (req, res) => {
    // TODO: Add admin auth check
    const { full_name, password } = req.body;
    const { id } = req.params;
    try {
        if (password) {
            const hash = await bcryptjs_1.default.hash(password, 10);
            await db_1.pool.query('UPDATE users SET full_name = ?, password_hash = ? WHERE id = ?', [full_name, hash, id]);
        }
        else {
            await db_1.pool.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, id]);
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// Delete user (admin only)
router.delete('/:id', async (req, res) => {
    // TODO: Add admin auth check
    const { id } = req.params;
    try {
        await db_1.pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
// Get user's quotations
router.get('/my-quotations', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
});
// Test endpoint for health check
router.get('/test', (req, res) => {
    res.json({ message: 'User API is working!' });
});
// Database connection test
router.get('/db-test', async (req, res) => {
    try {
        const [result] = await db_1.pool.query('SELECT 1 as test');
        res.json({ message: 'Database connection successful', result });
    }
    catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Database connection failed', details: err instanceof Error ? err.message : 'Unknown error' });
    }
});
exports.default = router;
