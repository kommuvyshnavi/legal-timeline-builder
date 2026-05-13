import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    endDate: { type: Date },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['filing', 'hearing', 'deposition', 'contract', 'correspondence', 'other'],
        default: 'other',
    },
    parties: [{ type: String }],
    confidence: { type: Number, default: 0.8, min: 0, max: 1 },
    source: { type: String },
    isManual: { type: Boolean, default: false },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
}, { timestamps: true });

// Index for efficient querying
eventSchema.index({ caseId: 1, date: 1 });
eventSchema.index({ caseId: 1, category: 1 });

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export default mongoose.model('Event', eventSchema);
