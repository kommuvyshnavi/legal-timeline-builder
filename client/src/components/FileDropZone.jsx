import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDocuments, getDocumentStatus } from '../lib/api';

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileDropZone({ caseId, onComplete }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState([]);
    const [error, setError] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
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
    });

    const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setError('');

        try {
            const result = await uploadDocuments(caseId, files);
            setFiles([]);

            // Poll for completion
            const statuses = result.documents.map((d) => ({ ...d, status: 'processing' }));
            setProcessing([...statuses]);

            const pending = new Set(result.documents.map((d) => d._id));
            while (pending.size > 0) {
                await new Promise((r) => setTimeout(r, 2000));
                for (const id of pending) {
                    try {
                        const st = await getDocumentStatus(id);
                        const idx = statuses.findIndex((s) => s._id === id);
                        if (idx !== -1) statuses[idx] = { ...statuses[idx], ...st };
                        if (st.status === 'done' || st.status === 'error') pending.delete(id);
                    } catch { pending.delete(id); }
                }
                setProcessing([...statuses]);
            }

            setTimeout(() => onComplete && onComplete(), 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const allDone = processing.length > 0 && processing.every((d) => d.status !== 'processing');

    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            {!uploading && processing.length === 0 && (
                <>
                    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`} style={{ padding: 'var(--space-xl)' }}>
                        <input {...getInputProps()} />
                        <p style={{ margin: 0 }}>
                            {isDragActive ? '📂 Drop files here...' : '📁 Drag & drop more files, or click to browse'}
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className="file-list">
                            {files.map((f, i) => (
                                <div key={f.name + i} className="file-item">
                                    <div className="file-item-info">
                                        <span>📄</span>
                                        <span className="file-item-name">{f.name}</span>
                                    </div>
                                    <span className="file-item-size">{formatSize(f.size)}</span>
                                    <button className="file-item-remove" onClick={() => removeFile(i)}>×</button>
                                </div>
                            ))}
                            <button className="btn btn-primary btn-sm" onClick={handleUpload} style={{ marginTop: '8px', alignSelf: 'flex-end' }}>
                                🚀 Upload & Extract
                            </button>
                        </div>
                    )}
                </>
            )}

            {processing.length > 0 && (
                <div className="processing-list">
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                        {allDone ? '✅ Done!' : '⏳ Processing...'}
                    </p>
                    {processing.map((doc) => (
                        <div key={doc._id} className="processing-item">
                            {doc.status === 'processing' && <div className="processing-spinner" />}
                            {doc.status === 'done' && <span className="processing-done">✓</span>}
                            {doc.status === 'error' && <span className="processing-error">✗</span>}
                            <span style={{ flex: 1 }}>{doc.filename}</span>
                        </div>
                    ))}
                </div>
            )}

            {error && <p style={{ color: 'var(--accent-danger)', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>{error}</p>}
        </div>
    );
}
