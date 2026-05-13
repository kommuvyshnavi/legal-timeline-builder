import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../lib/api';

export default function Dashboard() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCases()
            .then(setCases)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalDocs = cases.reduce((sum, c) => sum + (c.documentCount || 0), 0);
    const totalEvents = cases.reduce((sum, c) => sum + (c.eventCount || 0), 0);

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="hero">
                <h1>Turn 1000 pages into a timeline in minutes</h1>
                <p>
                    Drag-and-drop your legal documents. AI extracts every date, event, and
                    party — building an interactive visual timeline instantly.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Link to="/upload" className="btn btn-primary btn-lg">
                        🚀 Start New Case
                    </Link>
                    <Link to="/cases" className="btn btn-secondary btn-lg">
                        View All Cases
                    </Link>
                </div>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-value">{cases.length}</div>
                        <div className="hero-stat-label">Cases</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-value">{totalDocs}</div>
                        <div className="hero-stat-label">Documents Processed</div>
                    </div>
                    <div className="hero-stat">
                        <div className="hero-stat-value">{totalEvents}</div>
                        <div className="hero-stat-label">Events Extracted</div>
                    </div>
                </div>
            </section>

            {/* Recent Cases */}
            {cases.length > 0 && (
                <section>
                    <div className="section-header">
                        <h2>Recent Cases</h2>
                        <Link to="/cases" className="btn btn-ghost">View all →</Link>
                    </div>
                    <div className="cases-grid">
                        {cases.slice(0, 6).map((c) => (
                            <Link to={`/cases/${c._id}`} key={c._id} className="case-card">
                                <h3>{c.name}</h3>
                                <p>{c.description || 'No description'}</p>
                                <div className="case-card-meta">
                                    <span>📄 {c.documentCount || 0} documents</span>
                                    <span>📌 {c.eventCount || 0} events</span>
                                    <span>🕐 {new Date(c.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {!loading && cases.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📂</div>
                    <h3>No cases yet</h3>
                    <p>Create your first case by uploading legal documents. The AI will extract dates and events automatically.</p>
                    <Link to="/upload" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Create Your First Case
                    </Link>
                </div>
            )}
        </div>
    );
}
