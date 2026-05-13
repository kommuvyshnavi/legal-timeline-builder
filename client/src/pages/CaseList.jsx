import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCases, createCase, deleteCase } from '../lib/api';

export default function CaseList() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const fetchCases = () => {
        getCases()
            .then(setCases)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(fetchCases, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await createCase({ name: newName, description: newDesc });
            setNewName('');
            setNewDesc('');
            setShowNew(false);
            fetchCases();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete case "${name}" and all its data?`)) return;
        try {
            await deleteCase(id);
            fetchCases();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <h2>All Cases</h2>
                <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
                    + New Case
                </button>
            </div>

            {/* New Case Form */}
            {showNew && (
                <form onSubmit={handleCreate} className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            className="input"
                            placeholder="Case name (e.g., Smith v. Jones)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                        />
                        <textarea
                            className="input"
                            placeholder="Description (optional)"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            rows={2}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" className="btn btn-primary">Create Case</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                        </div>
                    </div>
                </form>
            )}

            {/* Cases Grid */}
            {loading ? (
                <div className="cases-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-text" />
                            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                        </div>
                    ))}
                </div>
            ) : cases.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚖️</div>
                    <h3>No cases yet</h3>
                    <p>Click "New Case" above to create your first case, then upload documents to extract a timeline.</p>
                </div>
            ) : (
                <div className="cases-grid">
                    {cases.map((c) => (
                        <div key={c._id} className="case-card" style={{ position: 'relative' }}>
                            <Link to={`/cases/${c._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                <h3>{c.name}</h3>
                                <p>{c.description || 'No description'}</p>
                                <div className="case-card-meta">
                                    <span>📄 {c.documentCount || 0} docs</span>
                                    <span>📌 {c.eventCount || 0} events</span>
                                    <span>🕐 {new Date(c.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ position: 'absolute', top: '12px', right: '12px' }}
                                onClick={(e) => { e.stopPropagation(); handleDelete(c._id, c.name); }}
                                title="Delete case"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
