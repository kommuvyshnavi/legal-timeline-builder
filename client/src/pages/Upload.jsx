import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createCase, uploadDocuments, getDocumentStatus } from '../lib/api';

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Upload() {
    const navigate = useNavigate();
    const [caseName, setCaseName] = useState('');
    const [caseDesc, setCaseDesc] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [processingDocs, setProcessingDocs] = useState([]);
    const [error, setError] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        setFiles((prev) => {
            const existing = new Set(prev.map((f) => f.name + f.size));
            const newFiles = acceptedFiles.filter((f) => !existing.has(f.name + f.size));
            return [...prev, ...newFiles];
        });
        setError('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        maxFiles: 50,
        maxSize: 50 * 1024 * 1024,
    });

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const pollStatus = async (docs, caseId) => {
        const statuses = docs.map((d) => ({ ...d, status: 'processing' }));
        setProcessingDocs([...statuses]);

        const pending = new Set(docs.map((d) => d._id));

        while (pending.size > 0) {
            await new Promise((r) => setTimeout(r, 2000));

            for (const id of pending) {
                try {
                    const status = await getDocumentStatus(id);
                    const idx = statuses.findIndex((s) => s._id === id);
                    if (idx !== -1) {
                        statuses[idx] = { ...statuses[idx], ...status };
                    }
                    if (status.status === 'done' || status.status === 'error') {
                        pending.delete(id);
                    }
                } catch {
                    pending.delete(id);
                }
            }
            setProcessingDocs([...statuses]);
        }

        // All done — navigate to case timeline
        setTimeout(() => navigate(`/cases/${caseId}`), 1000);
    };

    const handleSubmit = async () => {
        if (!caseName.trim()) {
            setError('Please enter a case name');
            return;
        }
        if (files.length === 0) {
            setError('Please add at least one file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Step 1: Create the case
            const newCase = await createCase({ name: caseName, description: caseDesc });

            // Step 2: Upload files
            const result = await uploadDocuments(newCase._id, files);

            // Step 3: Poll for processing status
            setFiles([]);
            pollStatus(result.documents, newCase._id);
        } catch (err) {
            setError(err.message);
            setUploading(false);
        }
    };

    const allDone = processingDocs.length > 0 &&
        processingDocs.every((d) => d.status === 'done' || d.status === 'error');

    return (
        <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, marginBottom: 'var(--space-lg)' }}>
                📤 Upload Documents
            </h1>

            {/* Case Info */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>
                    Case Name *
                </label>
                <input
                    className="input"
                    placeholder="e.g., Smith v. Jones, Contract Review - Acme Corp"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    disabled={uploading}
                />
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '16px', display: 'block' }}>
                    Description
                </label>
                <textarea
                    className="input"
                    placeholder="Optional case description..."
                    value={caseDesc}
                    onChange={(e) => setCaseDesc(e.target.value)}
                    rows={2}
                    disabled={uploading}
                />
            </div>

            {/* Drop Zone */}
            {!uploading && (
                <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-icon">📁</div>
                    <h3>
                        {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
                    </h3>
                    <p>or click to browse · PDF, DOCX, TXT · up to 50 files</p>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && !uploading && (
                <div className="file-list">
                    {files.map((file, i) => (
                        <div key={file.name + i} className="file-item">
                            <div className="file-item-info">
                                <span>{file.name.endsWith('.pdf') ? '📕' : file.name.endsWith('.docx') ? '📘' : '📄'}</span>
                                <span className="file-item-name">{file.name}</span>
                            </div>
                            <span className="file-item-size">{formatSize(file.size)}</span>
                            <button className="file-item-remove" onClick={() => removeFile(i)}>×</button>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {files.length} file{files.length !== 1 ? 's' : ''} · {formatSize(files.reduce((s, f) => s + f.size, 0))}
                        </span>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            🚀 Start Extraction
                        </button>
                    </div>
                </div>
            )}

            {/* Processing Status */}
            {processingDocs.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>
                        {allDone ? '✅ Processing Complete!' : '⏳ Extracting events with AI...'}
                    </h3>
                    <div className="processing-list">
                        {processingDocs.map((doc) => (
                            <div key={doc._id} className="processing-item">
                                {doc.status === 'processing' && <div className="processing-spinner" />}
                                {doc.status === 'done' && <span className="processing-done">✓</span>}
                                {doc.status === 'error' && <span className="processing-error">✗</span>}
                                <span style={{ flex: 1 }}>{doc.filename}</span>
                                <span style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: doc.status === 'done' ? 'var(--accent-success)' :
                                        doc.status === 'error' ? 'var(--accent-danger)' : 'var(--text-tertiary)'
                                }}>
                                    {doc.status === 'processing' ? 'Analyzing...' :
                                        doc.status === 'done' ? 'Complete' :
                                            doc.errorMessage || 'Failed'}
                                </span>
                            </div>
                        ))}
                    </div>
                    {allDone && (
                        <p style={{ marginTop: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Redirecting to timeline...
                        </p>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', fontSize: 'var(--font-size-sm)' }}>
                    {error}
                </div>
            )}
        </div>
    );
}
