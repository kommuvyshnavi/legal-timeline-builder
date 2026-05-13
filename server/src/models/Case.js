import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Virtual populate for documents and events
caseSchema.virtual('documents', {
    ref: 'Document',
    localField: '_id',
    foreignField: 'caseId',
});

caseSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'caseId',
});

caseSchema.set('toJSON', { virtuals: true });
caseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Case', caseSchema);
