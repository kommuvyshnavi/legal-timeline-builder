import { useState } from 'react';
import { createEvent, updateEvent } from '../lib/api';

const CATEGORIES = ['filing', 'hearing', 'deposition', 'contract', 'correspondence', 'other'];

export default function EventEditModal({ caseId, event, onClose, onSaved }) {
    const isEdit = !!event;

    const [form, setForm] = useState({
        date: event ? new Date(event.date).toISOString().split('T')[0] : '',
        endDate: event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        title: event?.title || '',
        description: event?.description || '',
        category: event?.category || 'other',
        parties: event?.parties?.join(', ') || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.date || !form.title || !form.description) {
            setError('Date, title, and description are required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const data = {
                date: form.date,
                endDate: form.endDate || undefined,
                title: form.title,
                description: form.description,
                category: form.category,
                parties: form.parties ? form.parties.split(',').map((p) => p.trim()).filter(Boolean) : [],
            };

            if (isEdit) {
                await updateEvent(event._id, data);
            } else {
                await createEvent(caseId, data);
            }
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{isEdit ? 'Edit Event' : 'Add Event'}</h2>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div>
                        <label>Date *</label>
                        <input type="date" className="input" value={form.date} onChange={handleChange('date')} required />
                    </div>

                    <div>
                        <label>End Date (optional)</label>
                        <input type="date" className="input" value={form.endDate} onChange={handleChange('endDate')} />
                    </div>

                    <div>
                        <label>Title *</label>
                        <input className="input" placeholder="Short event title" value={form.title} onChange={handleChange('title')} required />
                    </div>

                    <div>
                        <label>Description *</label>
                        <textarea className="input" placeholder="Event description" value={form.description} onChange={handleChange('description')} rows={3} required />
                    </div>

                    <div>
                        <label>Category</label>
                        <select className="input" value={form.category} onChange={handleChange('category')}>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Parties (comma-separated)</label>
                        <input className="input" placeholder="Jane Smith, Acme Corp" value={form.parties} onChange={handleChange('parties')} />
                    </div>

                    {error && (
                        <p style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
