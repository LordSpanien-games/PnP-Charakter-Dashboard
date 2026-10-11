import { CharacterData, GameSystem } from '../types';

export interface LocalCharacterMeta {
  id: string;
  name: string;
  subTitle?: string;
  system: GameSystem | string;
  filename: string;
  relativePath: string;
  lastModified: number;
  size: number;
  previewStats?: string[];
}

export interface SaveResult {
  success: boolean;
  relativePath: string;
  filename: string;
  fullLocalPath: string;
  message: string;
}

export interface CharacterHistoryVersion {
  id: string;
  filename: string;
  versionPath: string;
  timestamp: number;
  size: number;
  subTitle: string;
  characterName: string;
  statsPreview: string[];
  xp?: number;
  system: string;
}

const LOCAL_STORAGE_BACKUP_KEY = 'universal_pnp_roster_cache';
const LOCAL_HISTORY_CACHE_PREFIX = 'pnp_char_history_v10_';

/**
 * Checks if the local Vite dev server /api/characters endpoint is responding.
 */
export async function checkLocalServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/characters', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.success);
  } catch {
    return false;
  }
}

/**
 * Lists all character files directly from the local ./characters/ folder via API.
 * Falls back to local cached characters if offline.
 */
export async function listLocalCharacters(): Promise<LocalCharacterMeta[]> {
  try {
    const res = await fetch('/api/characters', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.characters)) {
        // Cache meta in localStorage for offline fallback
        try {
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(data.characters));
        } catch {}
        return data.characters;
      }
    }
  } catch (err) {
    console.warn('[characterStorageService] Failed to fetch /api/characters:', err);
  }

  // Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

/**
 * Loads a full character JSON file from characters/<relativePath>.
 */
export async function loadLocalCharacter(relativePath: string): Promise<CharacterData> {
  const url = `/api/characters/load?path=${encodeURIComponent(relativePath)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Fehler beim Laden von characters/${relativePath}`);
  }

  const data = await res.json();
  if (!data.success || !data.character) {
    throw new Error('Ungültige Charakterdaten erhalten');
  }

  return data.character;
}

/**
 * Saves a character directly to ./characters/<system>/<filename>.json.
 */
export async function saveLocalCharacter(
  character: CharacterData,
  customFilename?: string
): Promise<SaveResult> {
  const res = await fetch('/api/characters/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      character,
      filename: customFilename,
      subfolder: character.system || 'custom',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Fehler beim lokalen Speichern der Datei');
  }

  const data = await res.json();
  return data;
}

/**
 * Deletes a character file from ./characters/<relativePath>.
 */
export async function deleteLocalCharacter(relativePath: string): Promise<boolean> {
  const res = await fetch('/api/characters/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ path: relativePath }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Fehler beim Löschen der Datei');
  }

  return true;
}

/**
 * Fetches the list of up to 10 stored historical versions for a character file.
 */
export async function getCharacterHistory(relativePath: string): Promise<CharacterHistoryVersion[]> {
  try {
    const url = `/api/characters/history?path=${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.versions)) {
        return data.versions;
      }
    }
  } catch (e) {
    console.warn('[characterStorageService] Failed to load history from server:', e);
  }

  // Fallback to client localStorage history cache
  try {
    const cacheKey = `${LOCAL_HISTORY_CACHE_PREFIX}${relativePath.replace(/[/\\?%*:|"<>]/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

/**
 * Restores a specific historical version as the active file in ./characters/.
 */
export async function restoreCharacterVersion(
  relativePath: string,
  versionPath: string
): Promise<CharacterData> {
  const res = await fetch('/api/characters/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ relativePath, versionPath }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Fehler beim Wiederherstellen der Version');
  }

  const data = await res.json();
  if (!data.success || !data.character) {
    throw new Error('Ungültige Daten nach Wiederherstellung');
  }

  return data.character;
}

/**
 * Client-side helper to record character snapshot into localStorage (maintaining strictly 10 versions).
 */
export function recordClientHistoryVersion(character: CharacterData, relativePath: string) {
  try {
    const cacheKey = `${LOCAL_HISTORY_CACHE_PREFIX}${relativePath.replace(/[/\\?%*:|"<>]/g, '_')}`;
    const raw = localStorage.getItem(cacheKey);
    const list: CharacterHistoryVersion[] = raw ? JSON.parse(raw) : [];

    const newEntry: CharacterHistoryVersion = {
      id: `v_${Date.now()}`,
      filename: `v_${Date.now()}.json`,
      versionPath: relativePath,
      timestamp: Date.now(),
      size: JSON.stringify(character).length,
      subTitle: character.subTitle || '',
      characterName: character.name,
      statsPreview: Array.isArray(character.stats)
        ? character.stats.slice(0, 3).map((s) => `${s.label}: ${s.value}`)
        : [],
      xp: character.experience?.current,
      system: character.system,
    };

    const updated = [newEntry, ...list.slice(0, 9)]; // Keep max 10
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch {}
}

/**
 * Helper to download character JSON as a fallback if user wants a raw download.
 */
export function downloadCharacterFile(character: CharacterData) {
  const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (character.name || 'Charakter').replace(/\s+/g, '_');
  a.download = `${safeName}_data.json`;
  a.click();
  URL.revokeObjectURL(url);
}
