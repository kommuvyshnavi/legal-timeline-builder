import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'done', 'error'],
        default: 'pending',
    },
    pageCount: { type: Number },
    errorMessage: { type: String },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
}, { timestamps: true });

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Document', documentSchema);
