import express from 'express';
import { upload } from '../middleware/upload.js';
import Document from '../models/Document.js';
import { processDocument } from '../services/extractor.js';

const router = express.Router();

// POST /api/cases/:caseId/documents — Upload multiple files
router.post('/cases/:caseId/documents', upload.array('files', 50), async (req, res, next) => {
    try {
        const { caseId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Create document records
        const documents = await Document.insertMany(
            req.files.map((file) => ({
                filename: file.originalname,
                filepath: file.path,
                mimeType: file.mimetype,
                size: file.size,
                status: 'pending',
                caseId,
            }))
        );

        // Process each document in the background (don't await)
        documents.forEach((doc) => {
            processDocument(doc._id, doc.filepath, doc.mimeType, caseId).catch((err) => {
                console.error(`Error processing document ${doc._id}:`, err.message);
            });
        });

        res.status(201).json({
            message: `${documents.length} file(s) uploaded. Processing started.`,
            documents,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/cases/:caseId/documents — List all documents for a case
router.get('/cases/:caseId/documents', async (req, res, next) => {
    try {
        const documents = await Document.find({ caseId: req.params.caseId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(documents);
    } catch (error) {
        next(error);
    }
});

// GET /api/documents/:id/status — Get processing status
router.get('/documents/:id/status', async (req, res, next) => {
    try {
        const doc = await Document.findById(req.params.id).lean();
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({
            id: doc._id,
            status: doc.status,
            filename: doc.filename,
            errorMessage: doc.errorMessage,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
