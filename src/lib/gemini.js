import { GoogleGenerativeAI } from '@google/generative-ai';

function getClient(apiKey) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Convert a File object to a base64 data part for Gemini
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a canvas (PDF page render) to a base64 part
 */
function canvasToGenerativePart(canvas) {
  const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  return { inlineData: { data: base64, mimeType: 'image/jpeg' } };
}

/**
 * Extract and structure text from image parts using Gemini
 */
export async function extractTextToJSON(apiKey, imageParts, language, ignoreNavFooter = false) {
  const genAI = getClient(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const navFooterRule = ignoreNavFooter
    ? `7. IMPORTANT: Do NOT include navigation bars (navbars), top menus, header navigation links, or footer sections in the output. Skip any nav, header nav, or footer elements entirely.`
    : `7. Include ALL elements found on the page, including navigation bars and footers.`;

  const prompt = `You are an expert at analyzing design files (PDFs and images) for web development teams.

Analyze the provided image(s) and extract ALL visible text content. Structure it into a detailed JSON object that a developer can directly use to populate a website or app.

Rules:
1. Detect the hierarchy: page title, section headings, subheadings, body paragraphs, labels, buttons, links, form fields, placeholder text, legal/footer text, etc.
2. Maintain reading order (top to bottom, left to right).
3. Group logically related content into sections.
4. Output ONLY valid JSON, no markdown fences, no extra explanation.
5. Output language: ${language}
6. Use descriptive, semantic keys in camelCase (e.g., "heroTitle", "ctaButton", "formLabel").
${navFooterRule}

JSON structure to follow:
{
  "meta": {
    "language": "${language}",
    "generatedAt": "<ISO timestamp>",
    "totalSections": <number>
  },
  "content": [
    {
      "section": "<section name>",
      "elements": [
        { "type": "<title|subtitle|body|button|label|link|placeholder|legal|listItem|other>", "key": "<camelCase key>", "value": "<extracted text>" }
      ]
    }
  ]
}

Extract every piece of visible text. Do not skip anything, including small labels, placeholder text, checkbox text, legal disclaimers, button text, etc.`;

  const result = await model.generateContent([prompt, ...imageParts]);
  const text = result.response.text().trim();

  // Clean up if model wraps in markdown fences
  const cleaned = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, json: parsed, raw: cleaned };
  } catch {
    return { success: false, json: null, raw: cleaned, error: 'Failed to parse JSON from model response.' };
  }
}

/**
 * Translate an existing JSON to a new language, preserving structure
 */
export async function translateJSON(apiKey, jsonData, targetLanguage) {
  const genAI = getClient(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a professional translator and developer tool.

Translate the following JSON to ${targetLanguage}. 

Rules:
1. Translate ONLY the "value" fields inside the "elements" arrays.
2. Also update "meta.language" to "${targetLanguage}".
3. Keep ALL keys, structure, arrays, and non-text fields EXACTLY the same.
4. Output ONLY the translated valid JSON. No markdown, no explanation.
5. Preserve punctuation style and tone of the original text.
6. Do not translate proper nouns, brand names, email addresses, phone numbers, or URLs.

JSON to translate:
${JSON.stringify(jsonData, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, json: parsed, raw: cleaned };
  } catch {
    return { success: false, json: null, raw: cleaned, error: 'Failed to parse translated JSON.' };
  }
}
