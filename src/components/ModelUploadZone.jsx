import { useState, useRef } from 'react';
import { MODEL_FORMATS, MODEL_ACCEPTED_TYPES } from '../lib/modelParser';

export default function ModelUploadZone({ modelFile, onModelSelected, onModelRemove }) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    function handleFile(file) {
        if (!file) return;
        onModelSelected(file);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }

    // If a model file is already selected, show its info
    if (modelFile) {
        const ext = modelFile.name.split('.').pop().toUpperCase();
        const sizeKB = (modelFile.size / 1024).toFixed(1);
        return (
            <div className="model-file-loaded">
                <div className="model-file-icon">📋</div>
                <div className="model-file-details">
                    <div className="model-file-name">{modelFile.name}</div>
                    <div className="model-file-meta">{ext} · {sizeKB} KB · Used as JSON structure reference</div>
                </div>
                <button
                    className="btn-remove"
                    onClick={onModelRemove}
                    title="Remove model"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div
            className={`model-upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={MODEL_ACCEPTED_TYPES}
                onChange={(e) => handleFile(e.target.files[0])}
                onClick={(e) => e.stopPropagation()}
            />
            <span className="model-upload-icon">📋</span>
            <p className="model-upload-title">Upload JSON Model / Template</p>
            <p className="model-upload-sub">The AI will mirror this structure when generating JSON</p>
            <div className="upload-formats" style={{ marginTop: 8 }}>
                {MODEL_FORMATS.map((f) => (
                    <span key={f} className="format-badge format-badge--model">{f}</span>
                ))}
            </div>
        </div>
    );
}
