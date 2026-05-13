import { Router } from 'express';
import User from '../models/User.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { fullName, username, email, phone, password } = req.body;

        // Check if user exists
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({
                error: existing.email === email ? 'Email already registered' : 'Username already taken',
            });
        }

        const user = await User.create({ fullName, username, email, phone, password });
        const token = generateToken(user);

        res.status(201).json({ user, token });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { emailOrUsername, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: emailOrUsername?.toLowerCase() }, { username: emailOrUsername?.toLowerCase() }],
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ user, token });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me — get current user profile
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
});

export default router;
