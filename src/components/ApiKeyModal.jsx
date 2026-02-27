import { useState } from 'react';

export default function ApiKeyModal({ onSave, onClose, currentKey }) {
    const [key, setKey] = useState(currentKey || '');

    function handleSave() {
        if (!key.trim()) return;
        localStorage.setItem('te_api_key', key.trim());
        onSave(key.trim());
    }

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-title">🔑 Gemini API Key</div>
                <div className="modal-sub">
                    Required to extract text and translate. Your key is stored only in your browser and never sent to any server other than Google.
                </div>

                <a
                    className="modal-link"
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                >
                    ↗ Get a free API key at aistudio.google.com
                </a>

                <input
                    className="modal-input"
                    type="password"
                    placeholder="AIza..."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                />

                <div className="modal-actions">
                    {currentKey && (
                        <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    )}
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={!key.trim()}
                        style={{ width: currentKey ? 'auto' : '100%' }}
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
