import { useState } from 'react';
import LanguageSelector, { LANGUAGES } from './LanguageSelector';
import { translateJSON } from '../lib/gemini';

function getFlagForLang(langCode) {
    const lang = LANGUAGES.find(l => l.code === langCode);
    return lang ? lang.label.split(' ')[0] : '🌐';
}

export default function TranslatePanel({ apiKey, jsonData, originalLanguage }) {
    const [targetLang, setTargetLang] = useState('Spanish');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [translations, setTranslations] = useState([]); // [{language, json}]

    async function handleTranslate() {
        if (!jsonData) return;
        if (!apiKey) { setError('Please set your Gemini API key first.'); return; }
        if (targetLang === originalLanguage) { setError(`The JSON is already in ${originalLanguage}.`); return; }

        setLoading(true);
        setError(null);

        try {
            const result = await translateJSON(apiKey, jsonData, targetLang);
            if (!result.success) {
                setError(result.error || 'Translation failed.');
            } else {
                // Update or add translation
                setTranslations(prev => {
                    const idx = prev.findIndex(t => t.language === targetLang);
                    if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = { language: targetLang, json: result.json };
                        return updated;
                    }
                    return [...prev, { language: targetLang, json: result.json }];
                });
            }
        } catch (err) {
            setError(err.message || 'Unknown error during translation.');
        } finally {
            setLoading(false);
        }
    }

    function downloadTranslation(translation) {
        const str = JSON.stringify(translation.json, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extracted_${translation.language.toLowerCase().replace(/ /g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="translate-panel">
            <div className="translate-panel-header">
                <span>🌐</span>
                <span className="translate-panel-title">Translate to another language</span>
            </div>

            <div className="translate-row">
                <div style={{ flex: 1 }}>
                    <LanguageSelector value={targetLang} onChange={setTargetLang} label="" />
                </div>
                <button
                    className="btn-translate"
                    onClick={handleTranslate}
                    disabled={loading || !jsonData}
                >
                    {loading ? <><span className="spinner" /> Translating...</> : '↓ Download Translation'}
                </button>
            </div>

            {error && (
                <div className="error-box" style={{ marginTop: 10 }}>
                    ⚠️ {error}
                </div>
            )}

            {translations.length > 0 && (
                <div className="translation-chips">
                    {translations.map((t) => (
                        <button
                            key={t.language}
                            className="translation-chip"
                            onClick={() => downloadTranslation(t)}
                            title={`Download ${t.language} JSON`}
                        >
                            {getFlagForLang(t.language)} {t.language} ↓
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
