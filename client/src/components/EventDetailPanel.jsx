export default function EventDetailPanel({ event, onClose, onDelete, onEdit }) {
    if (!event) return null;

    const confidenceClass =
        event.confidence >= 0.8 ? 'confidence-high' :
            event.confidence >= 0.5 ? 'confidence-medium' : 'confidence-low';

    const confidenceLabel =
        event.confidence >= 0.8 ? 'High' :
            event.confidence >= 0.5 ? 'Medium' : 'Low';

    return (
        <div className="event-panel animate-slide-in">
            <div className="event-panel-header">
                <div>
                    <span className={`badge badge-${event.category}`}>{event.category}</span>
                </div>
                <button className="event-panel-close" onClick={onClose}>×</button>
            </div>

            <h2>{event.title}</h2>

            <div className="event-panel-field">
                <label>Date</label>
                <p>
                    {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                    {event.endDate && (
                        <> — {new Date(event.endDate).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</>
                    )}
                </p>
            </div>

            <div className="event-panel-field">
                <label>Description</label>
                <p>{event.description}</p>
            </div>

            {event.parties && event.parties.length > 0 && (
                <div className="event-panel-field">
                    <label>Parties Involved</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {event.parties.map((party, i) => (
                            <span key={i} className="badge badge-other">{party}</span>
                        ))}
                    </div>
                </div>
            )}

            {event.source && (
                <div className="event-panel-field">
                    <label>Source Quote</label>
                    <div className="event-source-quote">{event.source}</div>
                </div>
            )}

            {event.documentId && (
                <div className="event-panel-field">
                    <label>Source Document</label>
                    <p>📄 {event.documentId.filename || 'Unknown document'}</p>
                </div>
            )}

            <div className="event-panel-field">
                <label>AI Confidence — {confidenceLabel} ({Math.round(event.confidence * 100)}%)</label>
                <div className="confidence-bar">
                    <div
                        className={`confidence-bar-fill ${confidenceClass}`}
                        style={{ width: `${event.confidence * 100}%` }}
                    />
                </div>
            </div>

            <div className="event-panel-field" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                {event.isManual ? '✍️ Manually added' : '🤖 AI extracted'}
            </div>

            <div className="event-panel-actions">
                <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️ Delete</button>
            </div>
        </div>
    );
}
