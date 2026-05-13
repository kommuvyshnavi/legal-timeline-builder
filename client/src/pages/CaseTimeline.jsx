import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCase, getEvents, deleteEvent } from '../lib/api';
import Timeline from '../components/Timeline';
import EventDetailPanel from '../components/EventDetailPanel';
import FilterBar from '../components/FilterBar';
import ExportButton from '../components/ExportButton';
import EventEditModal from '../components/EventEditModal';
import FileDropZone from '../components/FileDropZone';

const CATEGORY_COLORS = {
    filing: '#3b82f6',
    hearing: '#ef4444',
    deposition: '#a855f7',
    contract: '#10b981',
    correspondence: '#f59e0b',
    other: '#64748b',
};

export default function CaseTimeline() {
    const { id } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [editEvent, setEditEvent] = useState(null);
    const [showUpload, setShowUpload] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [caseResult, eventsResult] = await Promise.all([
                getCase(id),
                getEvents(id, filters),
            ]);
            setCaseData(caseResult);
            setEvents(eventsResult);
            setFilteredEvents(eventsResult);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleEventClick = (eventId) => {
        const event = events.find((e) => e._id === eventId);
        setSelectedEvent(event);
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Delete this event?')) return;
        try {
            await deleteEvent(eventId);
            setSelectedEvent(null);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEventSaved = () => {
        setShowAddEvent(false);
        setEditEvent(null);
        fetchData();
    };

    const handleUploadComplete = () => {
        setShowUpload(false);
        fetchData();
    };

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="skeleton skeleton-title" style={{ width: '40%' }} />
                <div className="skeleton" style={{ height: '400px', marginTop: '24px' }} />
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3>Case not found</h3>
                <Link to="/cases" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Cases</Link>
            </div>
        );
    }

    // Prepare timeline items
    const timelineItems = filteredEvents.map((event) => ({
        id: event._id,
        content: event.title,
        start: new Date(event.date),
        end: event.endDate ? new Date(event.endDate) : undefined,
        type: event.endDate ? 'range' : 'point',
        style: `background-color: ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other}; 
            border-color: ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other};
            color: white;
            ${event.confidence < 0.6 ? 'border-style: dashed; opacity: 0.7;' : ''}`,
        title: `${event.title}\n${event.description}`,
    }));

    return (
        <div className="timeline-page animate-fade-in">
            {/* Header */}
            <div className="timeline-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <Link to="/cases" className="btn btn-ghost btn-sm">← Back</Link>
                        <h1>{caseData.name}</h1>
                    </div>
                    {caseData.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {caseData.description}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                        <span>📄 {caseData.documents?.length || 0} documents</span>
                        <span>📌 {events.length} events</span>
                    </div>
                </div>
                <div className="timeline-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(!showUpload)}>
                        📤 Upload More
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEvent(true)}>
                        + Add Event
                    </button>
                    <ExportButton caseId={id} />
                </div>
            </div>

            {/* Upload Section */}
            {showUpload && (
                <FileDropZone caseId={id} onComplete={handleUploadComplete} />
            )}

            {/* Filters */}
            <FilterBar onFilterChange={handleFilterChange} />

            {/* Timeline */}
            {timelineItems.length > 0 ? (
                <div className="timeline-container">
                    <Timeline items={timelineItems} onSelect={handleEventClick} />
                </div>
            ) : (
                <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div className="empty-state-icon">📅</div>
                    <h3>No events yet</h3>
                    <p>Upload documents to extract events, or add events manually.</p>
                </div>
            )}

            {/* Category Legend */}
            {timelineItems.length > 0 && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: 'var(--font-size-xs)' }}>
                    {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                        <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                            {cat}
                        </span>
                    ))}
                </div>
            )}

            {/* Event Detail Panel */}
            {selectedEvent && (
                <EventDetailPanel
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onDelete={() => handleDeleteEvent(selectedEvent._id)}
                    onEdit={() => { setEditEvent(selectedEvent); setSelectedEvent(null); }}
                />
            )}

            {/* Add/Edit Event Modal */}
            {(showAddEvent || editEvent) && (
                <EventEditModal
                    caseId={id}
                    event={editEvent}
                    onClose={() => { setShowAddEvent(false); setEditEvent(null); }}
                    onSaved={handleEventSaved}
                />
            )}
        </div>
    );
}
