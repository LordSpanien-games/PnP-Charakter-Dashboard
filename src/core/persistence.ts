import { GenericCharacter } from "./types";
import { detectSystemForLegacyJson, getSystem } from "./systemRegistry";

const ACTIVE_KEY = "pnp_last_active_character";
const PER_SYSTEM_PREFIX = "pnp_last_character_by_system__";

export const saveActiveCharacter = (character: GenericCharacter): void => {
  try {
    const json = JSON.stringify(character);
    localStorage.setItem(ACTIVE_KEY, json);
    localStorage.setItem(`${PER_SYSTEM_PREFIX}${character.systemId}`, json);
  } catch (e) {
    console.warn("[persistence] Konnte aktiven Charakter nicht speichern:", e);
  }
};

export const loadActiveCharacter = (): GenericCharacter | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as GenericCharacter) : null;
  } catch {
    return null;
  }
};

export const loadLastCharacterForSystem = (systemId: string): GenericCharacter | null => {
  try {
    const raw = localStorage.getItem(`${PER_SYSTEM_PREFIX}${systemId}`);
    return raw ? (JSON.parse(raw) as GenericCharacter) : null;
  } catch {
    return null;
  }
};

export const clearActiveCharacter = (): void => {
  try {
    localStorage.removeItem(ACTIVE_KEY);
  } catch {}
};

/** Baut den Dateinamen "<Name> - <System> - <Version>.json" und löst den Download aus. */
export const exportCharacterToFile = (character: GenericCharacter): GenericCharacter => {
  const bumped: GenericCharacter = {
    ...character,
    exportVersion: (character.exportVersion || 0) + 1,
  };

  const safeName = (bumped.name || "Charakter").replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, "").trim();
  const systemLabel = getSystem(bumped.systemId)?.name || bumped.systemId;
  const filename = `${safeName} - ${systemLabel} - ${bumped.exportVersion}.json`;

  const blob = new Blob([JSON.stringify(bumped, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return bumped;
};

const isGenericSchema = (raw: any): raw is GenericCharacter =>
  !!raw && typeof raw === "object" && raw.schemaVersion === 2 && typeof raw.systemId === "string";

/** Liest eine Datei ein, erkennt automatisch altes/neues Format und
 * migriert alte Spielstände transparent beim Einlesen. */
export const importCharacterFromFile = (file: File): Promise<GenericCharacter> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);

        if (isGenericSchema(raw)) {
          resolve(raw);
          return;
        }

        // Altes Format: passendes Plugin suchen und automatisch migrieren.
        const plugin = detectSystemForLegacyJson(raw);
        if (!plugin) {
          reject(new Error(
            "Diese Datei konnte keinem bekannten Spielsystem zugeordnet werden. " +
            "Ist das passende System-Plugin registriert?"
          ));
          return;
        }

        const migrated = plugin.migrateLegacy(raw);
        resolve(migrated);
      } catch {
        reject(new Error("Die Datei ist kein gültiges JSON oder beschädigt."));
      }
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsText(file);
  });
};
