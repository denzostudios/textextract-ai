import { useState } from 'react';

/**
 * Syntax-highlight a JSON string into React elements
 */
function highlightJSON(str) {
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={`p-${lastIndex}`} className="json-punctuation">{str.slice(lastIndex, match.index)}</span>);
        }

        const token = match[0];
        let cls;
        if (/^"/.test(token)) {
            cls = /:$/.test(token) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(token)) {
            cls = 'json-boolean';
        } else if (/null/.test(token)) {
            cls = 'json-null';
        } else {
            cls = 'json-number';
        }

        parts.push(<span key={`t-${match.index}`} className={cls}>{token}</span>);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
        parts.push(<span key={`p-end`} className="json-punctuation">{str.slice(lastIndex)}</span>);
    }

    return parts;
}

export default function JsonViewer({ jsonData, onCopy, onDownload }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        const str = JSON.stringify(jsonData, null, 2);
        navigator.clipboard.writeText(str).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onCopy?.();
        });
    }

    function handleDownload() {
        const str = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const lang = jsonData?.meta?.language || 'output';
        a.href = url;
        a.download = `extracted_${lang.toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        onDownload?.();
    }

    const jsonStr = jsonData ? JSON.stringify(jsonData, null, 2) : null;

    return (
        <div className="json-panel">
            <div className="json-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="json-panel-title">Generated JSON</span>
                    {jsonData && (
                        <span className="status-badge ready">✓ Ready</span>
                    )}
                </div>
                {jsonData && (
                    <div className="json-actions">
                        <button className={`btn-sm ${copied ? 'success' : ''}`} onClick={handleCopy}>
                            {copied ? '✓ Copied!' : '⎘ Copy'}
                        </button>
                        <button className="btn-sm" onClick={handleDownload}>
                            ↓ Download .json
                        </button>
                    </div>
                )}
            </div>

            <div className="json-code-wrapper">
                {jsonData ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {highlightJSON(jsonStr)}
                    </pre>
                ) : (
                    <div className="json-empty">
                        <span className="json-empty-icon">{ }</span>
                        <span className="json-empty-text">Your structured JSON will appear here</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            Upload a PDF or image and click Extract
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
