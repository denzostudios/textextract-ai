import { useState, useEffect } from 'react';
import './index.css';
import UploadZone from './components/UploadZone';
import LanguageSelector from './components/LanguageSelector';
import JsonViewer from './components/JsonViewer';
import TranslatePanel from './components/TranslatePanel';
import ApiKeyModal from './components/ApiKeyModal';
import { renderPDFToCanvases, canvasesToImageParts, getPDFThumbnails, imageFileToImagePart } from './lib/pdfLoader';
import { extractTextToJSON } from './lib/gemini';

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('te_api_key') || '');
  const [showApiModal, setShowApiModal] = useState(false);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null); // { name, type, size, pages, thumbUrl }
  const [language, setLanguage] = useState('English');
  const [ignoreNavFooter, setIgnoreNavFooter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);

  // Show API modal if no key on load
  useEffect(() => {
    if (!apiKey) setShowApiModal(true);
  }, []);

  async function handleFileSelected(selectedFile) {
    setFile(selectedFile);
    setJsonData(null);
    setError(null);

    const isPDF = selectedFile.type === 'application/pdf';

    if (isPDF) {
      try {
        const { thumbnails, numPages } = await getPDFThumbnails(selectedFile);
        setFileInfo({
          name: selectedFile.name,
          type: 'PDF',
          size: formatSize(selectedFile.size),
          pages: numPages,
          thumbUrl: thumbnails[0]?.dataUrl || null,
          isPDF: true,
          thumbnails,
        });
      } catch (err) {
        setFileInfo({
          name: selectedFile.name,
          type: 'PDF',
          size: formatSize(selectedFile.size),
          pages: '?',
          thumbUrl: null,
          isPDF: true,
          thumbnails: [],
        });
      }
    } else {
      // Image file
      const dataUrl = await fileToDataUrl(selectedFile);
      const ext = selectedFile.name.split('.').pop().toUpperCase();
      setFileInfo({
        name: selectedFile.name,
        type: ext,
        size: formatSize(selectedFile.size),
        pages: null,
        thumbUrl: dataUrl,
        isPDF: false,
      });
    }
  }

  async function handleExtract() {
    if (!file) return;
    if (!apiKey) { setShowApiModal(true); return; }

    setLoading(true);
    setError(null);
    setJsonData(null);

    try {
      let imageParts;

      if (fileInfo?.isPDF) {
        const canvases = await renderPDFToCanvases(file);
        imageParts = canvasesToImageParts(canvases);
      } else {
        const part = await imageFileToImagePart(file);
        imageParts = [part];
      }

      const result = await extractTextToJSON(apiKey, imageParts, language, ignoreNavFooter);

      if (!result.success) {
        setError(result.error || 'Could not extract JSON from file.');
        // Show raw output if available
        if (result.raw) {
          setJsonData({ _raw: result.raw, _note: 'Model returned non-JSON. Raw text shown.' });
        }
      } else {
        setJsonData(result.json);
      }
    } catch (err) {
      setError(err.message || 'Unexpected error during extraction.');
    } finally {
      setLoading(false);
    }
  }

  function handleRemoveFile() {
    setFile(null);
    setFileInfo(null);
    setJsonData(null);
    setError(null);
  }

  function handleApiKeySave(key) {
    setApiKey(key);
    setShowApiModal(false);
  }

  const canExtract = !!file && !!apiKey && !loading;

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="logo-icon">✦</div>
          Text<span>Extract</span>.ai
        </div>
        <div className="navbar-actions">
          {apiKey && (
            <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span> API Key active
            </span>
          )}
          <button
            className="btn-icon"
            title="API Key Settings"
            onClick={() => setShowApiModal(true)}
          >
            ⚙
          </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="app-main">
        {/* LEFT PANEL */}
        <aside className="panel-left">
          <div>
            <div className="card-title">Upload File</div>
            <UploadZone onFileSelected={handleFileSelected} />
          </div>

          {/* File preview */}
          {fileInfo && (
            <div>
              <div className="card-title">File Preview</div>
              <div className="file-preview">
                {fileInfo.thumbUrl ? (
                  <img className="file-thumb" src={fileInfo.thumbUrl} alt="preview" />
                ) : (
                  <div className="file-thumb-placeholder">
                    {fileInfo.isPDF ? '📄' : '🖼️'}
                  </div>
                )}
                <div className="file-info">
                  <div className="file-name">{fileInfo.name}</div>
                  <div className="file-meta">
                    {fileInfo.type} · {fileInfo.size}
                    {fileInfo.pages != null && ` · ${fileInfo.pages} page${fileInfo.pages !== 1 ? 's' : ''}`}
                  </div>
                </div>
                <button className="btn-remove" onClick={handleRemoveFile} title="Remove file">✕</button>
              </div>

              {/* PDF thumbnails */}
              {fileInfo.isPDF && fileInfo.thumbnails?.length > 1 && (
                <div className="thumb-strip" style={{ marginTop: 10 }}>
                  {fileInfo.thumbnails.map((t) => (
                    <div key={t.index} className="thumb-item">
                      <img src={t.dataUrl} alt={`Page ${t.index}`} />
                      <div className="thumb-label">p.{t.index}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Language */}
          <LanguageSelector value={language} onChange={setLanguage} />

          {/* Options */}
          <div>
            <div className="card-title">Extraction Options</div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={ignoreNavFooter}
                onChange={(e) => setIgnoreNavFooter(e.target.checked)}
              />
              <div className="toggle-label">
                <span>Ignore Nav &amp; Footer</span>
                <span className="toggle-hint">Skip navbars and footers found in web design PDFs</span>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* CTA */}
          <button
            className="btn-primary"
            onClick={handleExtract}
            disabled={!canExtract}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing & Extracting...</>
            ) : (
              <><span>✦</span> Extract &amp; Generate JSON</>
            )}
          </button>

          {!apiKey && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              ⚠️ No API key set —{' '}
              <button
                onClick={() => setShowApiModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}
              >
                click here to add one
              </button>
            </p>
          )}
        </aside>

        {/* RIGHT PANEL */}
        <main className="panel-right">
          <JsonViewer jsonData={jsonData} />

          {jsonData && !jsonData._raw && (
            <TranslatePanel
              apiKey={apiKey}
              jsonData={jsonData}
              originalLanguage={jsonData?.meta?.language || language}
            />
          )}
        </main>
      </div>

      {/* API Key Modal */}
      {showApiModal && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={handleApiKeySave}
          onClose={() => apiKey && setShowApiModal(false)}
        />
      )}
    </div>
  );
}

/* ---- Helpers ---- */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
