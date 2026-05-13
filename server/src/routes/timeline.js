import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/cases/:caseId/timeline/export — Export timeline
router.get('/cases/:caseId/timeline/export', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { format = 'json' } = req.query;

        const events = await Event.find({ caseId })
            .sort({ date: 1 })
            .populate('documentId', 'filename')
            .lean();

        if (format === 'csv') {
            const csvHeader = 'Date,End Date,Title,Description,Category,Parties,Confidence,Source Document\n';
            const csvRows = events.map((e) => {
                const date = new Date(e.date).toISOString().split('T')[0];
                const endDate = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '';
                const parties = (e.parties || []).join('; ');
                const sourceDoc = e.documentId?.filename || '';
                const desc = `"${(e.description || '').replace(/"/g, '""')}"`;
                const title = `"${(e.title || '').replace(/"/g, '""')}"`;
                return `${date},${endDate},${title},${desc},${e.category},${parties},${e.confidence},${sourceDoc}`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=timeline-${caseId}.csv`);
            res.send(csvHeader + csvRows.join('\n'));
        } else {
            res.json(events);
        }
    } catch (error) {
        next(error);
    }
});

export default router;
