import { CharacterData, GameSystem } from '../types';

export type AiProvider = 'openrouter' | 'gemini';

export interface AiConfig {
  provider: AiProvider;
  openrouterApiKey: string;
  openrouterModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

export const OPENROUTER_FREE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Kostenlos - Sehr schnell & präzise)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Kostenlos - Höchste Intelligenz)' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B (Kostenlos - Sehr gut)' },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat V3 (Kostenlos - Stark in Daten)' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Kostenlos - Stark & ausführlich)' },
];

const STORAGE_KEY = 'pnp_ai_config';

export const getSavedAiConfig = (): AiConfig => {
  const envGemini = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ? process.env.GEMINI_API_KEY : '';
  const envOpenRouter = (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) ? process.env.OPENROUTER_API_KEY : '';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        provider: parsed.provider || (envOpenRouter ? 'openrouter' : 'openrouter'),
        openrouterApiKey: parsed.openrouterApiKey || envOpenRouter,
        openrouterModel: parsed.openrouterModel || 'google/gemini-2.0-flash-exp:free',
        geminiApiKey: parsed.geminiApiKey || envGemini,
        geminiModel: parsed.geminiModel || 'gemini-1.5-flash',
      };
    }
  } catch (e) {
    console.warn('Could not read saved AI config from localStorage:', e);
  }

  return {
    provider: 'openrouter',
    openrouterApiKey: envOpenRouter,
    openrouterModel: 'google/gemini-2.0-flash-exp:free',
    geminiApiKey: envGemini,
    geminiModel: 'gemini-1.5-flash',
  };
};

export const saveAiConfig = (config: AiConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save AI config to localStorage:', e);
  }
};

const sanitizeJson = (text: string): string => {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  }
  return cleaned;
};

export const parseCharacterWithAi = async (
  rawText: string,
  selectedSystem: GameSystem,
  config?: AiConfig,
  pdfBase64?: { mimeType: string; data: string }
): Promise<CharacterData> => {
  const activeConfig = config || getSavedAiConfig();

  const prompt = `You are an expert Pen & Paper RPG character sheet parser.
Parse the following character sheet text and extract all information for the '${selectedSystem}' game system.
Return ONLY a valid, raw JSON object (no markdown, no backticks, no commentary).

The JSON must follow this exact structure:
{
  "name": "Character Name",
  "system": "${selectedSystem}",
  "subTitle": "Class / Profession / Subtitle",
  "level": "Level or Rank (e.g. 'Stufe 5' or 'Rang 2')",
  "race": "Race, Species, or Heritage",
  "stats": [
    { "label": "Stat Name (e.g. TP, RK, Initiative, Essenz)", "value": "12", "secondary": "+2" }
  ],
  "characteristics": [
    { "label": "STR", "value": "16" }
  ],
  "skills": [
    { "name": "Skill Name", "value": 45, "note": "Optional note" }
  ],
  "weapons": {
    "melee": [
      { "name": "Weapon Name", "attack": "+5", "damage": "1d8+3", "critical": "19-20/x2", "note": "Slashing" }
    ],
    "ranged": [
      { "name": "Ranged Weapon", "attack": "+4", "damage": "1d6", "critical": "x3", "range": "20m", "attacks": "1", "note": "Ammo 12" }
    ]
  },
  "abilities": [
    { "name": "Trait/Feat/Ability", "description": "What it does" }
  ],
  "inventory": [
    { "name": "Item Name", "quantity": 1, "weight": "1 kg", "notes": "Description" }
  ],
  "bio": {
    "appearance": "Visual description",
    "backstory": "Background story",
    "notes": "Important campaign notes",
    "allies": "Friends & contacts",
    "enemies": "Rivals"
  }
}

Special Rules by System:
- If 'pathfinder': Include attributes ST, GE, KO, IN, WE, CH in characteristics. Include TP/HP, RK/AC, Initiative, Zähigkeit, Reflex, Wille, KMB, KMV in stats.
- If 'coc7e' or 'coc1920': Characteristics must be ST, KO, GR, GE, ER, IN, MA, BI. Include Stabilität (SAN), Magiepunkte (MP), Trefferpunkte (TP), and Glück in stats.
- If 'shadowrun': Characteristics must be KON, GES, REA, STÄ, WIL, LOG, INT, CHA. Include Körperlicher Schaden, Geistiger Schaden, Essenz, Edge, Initiative, Panzerung in stats.
- If 'traveller': Characteristics must be STR, DEX, END, INT, EDU, SOC. Include ship or travel stats if mentioned.

Input Text to parse:
${rawText}`;

  if (activeConfig.provider === 'openrouter') {
    const apiKey = activeConfig.openrouterApiKey.trim();
    if (!apiKey) {
      throw new Error(
        'Kein OpenRouter API-Schlüssel hinterlegt. Bitte trage deinen OpenRouter Key in den KI-Einstellungen ein (oder hole dir einen kostenlosen Key auf openrouter.ai).'
      );
    }

    const modelToUse = activeConfig.openrouterModel || 'google/gemini-2.0-flash-exp:free';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin || 'http://localhost:3000',
        'X-Title': 'Universal P&P Dashboard',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a Pen & Paper character sheet parser that strictly outputs raw JSON without markdown codeblocks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API Fehler (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von OpenRouter erhalten.');
    }

    const cleaned = sanitizeJson(content);
    return JSON.parse(cleaned) as CharacterData;
  } else {
    // Provider: Gemini REST API
    const apiKey = activeConfig.geminiApiKey.trim();
    if (!apiKey) {
      throw new Error(
        'Kein Gemini API-Schlüssel hinterlegt. Bitte trage deinen Google Gemini Key in den Einstellungen ein (oder wechsle zu OpenRouter).'
      );
    }

    const modelName = activeConfig.geminiModel || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const parts: any[] = [];
    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: pdfBase64.mimeType,
          data: pdfBase64.data,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Gemini API Fehler (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOut) {
      throw new Error('Keine Textantwort von Gemini erhalten.');
    }

    const cleaned = sanitizeJson(textOut);
    return JSON.parse(cleaned) as CharacterData;
  }
};
