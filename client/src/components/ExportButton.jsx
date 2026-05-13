import { useState, useRef, useEffect } from 'react';
import { exportTimeline } from '../lib/api';

export default function ExportButton({ caseId }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (format) => {
        setOpen(false);
        try {
            const data = await exportTimeline(caseId, format);

            if (format === 'csv') {
                // Data is a Blob for CSV
                const url = URL.createObjectURL(data);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timeline-${caseId}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // JSON export
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `timeline-${caseId}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    const handlePdfPrint = () => {
        setOpen(false);
        window.print();
    };

    return (
        <div className="export-wrapper" ref={wrapperRef}>
            <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>
                📥 Export
            </button>
            {open && (
                <div className="export-dropdown">
                    <button onClick={() => handleExport('csv')}>📊 Export as CSV</button>
                    <button onClick={() => handleExport('json')}>📋 Export as JSON</button>
                    <button onClick={handlePdfPrint}>🖨️ Print / Save as PDF</button>
                </div>
            )}
        </div>
    );
}
