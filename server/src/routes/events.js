import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/cases/:caseId/events — Get all events with filters
router.get('/cases/:caseId/events', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { category, from, to, search } = req.query;

        const filter = { caseId };

        if (category) {
            filter.category = category;
        }

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const events = await Event.find(filter)
            .sort({ date: 1 })
            .populate('documentId', 'filename')
            .lean();

        res.json(events);
    } catch (error) {
        next(error);
    }
});

// POST /api/cases/:caseId/events — Manually add an event
router.post('/cases/:caseId/events', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { date, endDate, title, description, category, parties } = req.body;

        if (!date || !title || !description) {
            return res.status(400).json({ error: 'date, title, and description are required' });
        }

        const event = await Event.create({
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : undefined,
            title,
            description,
            category: category || 'other',
            parties: parties || [],
            confidence: 1.0,
            isManual: true,
            caseId,
        });

        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
});

// PUT /api/events/:id — Edit an event
router.put('/events/:id', async (req, res, next) => {
    try {
        const { date, endDate, title, description, category, parties } = req.body;

        const updateData = {};
        if (date) updateData.date = new Date(date);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (parties) updateData.parties = parties;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/events/:id — Delete an event
router.delete('/events/:id', async (req, res, next) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
