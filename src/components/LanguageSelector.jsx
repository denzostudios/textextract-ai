const LANGUAGES = [
    { code: 'English', label: '🇺🇸 English' },
    { code: 'Spanish', label: '🇪🇸 Spanish' },
    { code: 'French', label: '🇫🇷 French' },
    { code: 'German', label: '🇩🇪 German' },
    { code: 'Italian', label: '🇮🇹 Italian' },
    { code: 'Portuguese', label: '🇧🇷 Portuguese' },
    { code: 'Dutch', label: '🇳🇱 Dutch' },
    { code: 'Russian', label: '🇷🇺 Russian' },
    { code: 'Japanese', label: '🇯🇵 Japanese' },
    { code: 'Chinese (Simplified)', label: '🇨🇳 Chinese (Simplified)' },
    { code: 'Korean', label: '🇰🇷 Korean' },
    { code: 'Arabic', label: '🇸🇦 Arabic' },
];

export default function LanguageSelector({ value, onChange, label = 'Output Language' }) {
    return (
        <div>
            <div className="card-title">{label}</div>
            <select
                className="select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
            </select>
        </div>
    );
}

export { LANGUAGES };
