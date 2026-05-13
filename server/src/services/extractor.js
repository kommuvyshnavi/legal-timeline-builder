import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import Document from '../models/Document.js';
import { chunkText } from './chunker.js';
import { extractEventsFromChunks } from './aiExtractor.js';
import { normalizeAndDeduplicate } from './normalizer.js';
import Event from '../models/Event.js';

/**
 * Extract text from a file based on its MIME type.
 */
export async function extractText(filepath, mimeType) {
    const buffer = await fs.readFile(filepath);

    if (mimeType === 'application/pdf') {
        const data = await pdf(buffer);
        return { text: data.text, pageCount: data.numpages };
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return { text: result.value, pageCount: null };
    }

    if (mimeType === 'text/plain') {
        return { text: buffer.toString('utf-8'), pageCount: null };
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Full pipeline: extract text → chunk → AI extract → normalize → save events.
 * Called in the background after file upload.
 */
export async function processDocument(documentId, filepath, mimeType, caseId) {
    try {
        // Mark as processing
        await Document.findByIdAndUpdate(documentId, { status: 'processing' });

        // Step 1: Extract text
        const { text, pageCount } = await extractText(filepath, mimeType);

        if (pageCount) {
            await Document.findByIdAndUpdate(documentId, { pageCount });
        }

        if (!text || text.trim().length < 10) {
            await Document.findByIdAndUpdate(documentId, {
                status: 'done',
                errorMessage: 'No meaningful text found in document',
            });
            return;
        }

        // Step 2: Chunk text
        const chunks = chunkText(text);

        // Step 3: AI extraction
        const rawEvents = await extractEventsFromChunks(chunks);

        // Step 4: Normalize and deduplicate
        const normalizedEvents = normalizeAndDeduplicate(rawEvents);

        // Step 5: Save events to database
        if (normalizedEvents.length > 0) {
            await Event.insertMany(
                normalizedEvents.map((event) => ({
                    ...event,
                    documentId,
                    caseId,
                    isManual: false,
                }))
            );
        }

        // Mark as done
        await Document.findByIdAndUpdate(documentId, { status: 'done' });

        console.log(`✅ Document ${documentId}: extracted ${normalizedEvents.length} events`);
    } catch (error) {
        console.error(`❌ Document ${documentId} processing failed:`, error.message);
        await Document.findByIdAndUpdate(documentId, {
            status: 'error',
            errorMessage: error.message,
        });
    }
}
