import express from 'express';
import Case from '../models/Case.js';
import Document from '../models/Document.js';
import Event from '../models/Event.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

// GET /api/cases — List only the logged-in user's cases with counts
router.get('/', async (req, res, next) => {
    try {
        const cases = await Case.find({ userId: req.user.id }).sort({ updatedAt: -1 }).lean();

        // Add document and event counts
        const casesWithCounts = await Promise.all(
            cases.map(async (c) => {
                const [documentCount, eventCount] = await Promise.all([
                    Document.countDocuments({ caseId: c._id }),
                    Event.countDocuments({ caseId: c._id }),
                ]);
                return { ...c, documentCount, eventCount };
            })
        );

        res.json(casesWithCounts);
    } catch (error) {
        next(error);
    }
});

// POST /api/cases — Create a new case owned by the logged-in user
router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Case name is required' });
        }

        const newCase = await Case.create({
            name: name.trim(),
            description: description || '',
            userId: req.user.id,
        });

        res.status(201).json(newCase);
    } catch (error) {
        next(error);
    }
});

// GET /api/cases/:id — Get case with all events & documents (only if owned by user)
router.get('/:id', async (req, res, next) => {
    try {
        const caseDoc = await Case.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!caseDoc) {
            return res.status(404).json({ error: 'Case not found' });
        }

        const [documents, events] = await Promise.all([
            Document.find({ caseId: caseDoc._id }).sort({ createdAt: -1 }).lean(),
            Event.find({ caseId: caseDoc._id }).sort({ date: 1 }).lean(),
        ]);

        res.json({ ...caseDoc, documents, events });
    } catch (error) {
        next(error);
    }
});

// PUT /api/cases/:id — Update case (only if owned by user)
router.put('/:id', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const updated = await Case.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name, description },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/cases/:id — Delete case and all related data (only if owned by user)
router.delete('/:id', async (req, res, next) => {
    try {
        const caseDoc = await Case.findOne({ _id: req.params.id, userId: req.user.id });
        if (!caseDoc) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // Delete all related documents and events
        await Promise.all([
            Document.deleteMany({ caseId: caseDoc._id }),
            Event.deleteMany({ caseId: caseDoc._id }),
            caseDoc.deleteOne(),
        ]);

        res.json({ message: 'Case deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
