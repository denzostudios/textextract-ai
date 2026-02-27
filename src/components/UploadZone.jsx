import { useState, useRef } from 'react';

const SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'];
const FORMATS = ['PDF', 'JPG', 'PNG', 'WebP', 'GIF', 'TIFF'];

export default function UploadZone({ onFileSelected }) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    function handleFile(file) {
        if (!file) return;
        if (!SUPPORTED_TYPES.includes(file.type)) {
            alert(`Unsupported file type: ${file.type}\nSupported: PDF, JPG, PNG, WebP, GIF, TIFF`);
            return;
        }
        onFileSelected(file);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }

    return (
        <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/gif,image/tiff"
                onChange={(e) => handleFile(e.target.files[0])}
                onClick={(e) => e.stopPropagation()}
            />
            <span className="upload-icon">📂</span>
            <p className="upload-title">Drop your PDF or Image here</p>
            <p className="upload-sub">or click to browse</p>
            <div className="upload-formats">
                {FORMATS.map((f) => <span key={f} className="format-badge">{f}</span>)}
            </div>
        </div>
    );
}
