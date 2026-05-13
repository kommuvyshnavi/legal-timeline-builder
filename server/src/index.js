import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import casesRouter from './routes/cases.js';
import documentsRouter from './routes/documents.js';
import eventsRouter from './routes/events.js';
import timelineRouter from './routes/timeline.js';
import authRouter from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api', documentsRouter);
app.use('/api', eventsRouter);
app.use('/api', timelineRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Connect to MongoDB and start server
async function start() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/casemap';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const server = app.listen(PORT, () => {
            console.log(`🚀 CaseMap server running on http://localhost:${PORT}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Error: Port ${PORT} is already in use.`);
                console.error(`💡 Please stop the other process running on this port, or change the PORT variable in your .env file.\n`);
                process.exit(1);
            } else {
                console.error('\n❌ Server error:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }
}

start();
