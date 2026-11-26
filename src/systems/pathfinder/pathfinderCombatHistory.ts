import { GenericCharacter } from "../../core/types";
import { makeId } from "./pathfinderRules";

/**
 * Kampfhistorie: Liste der im Kampf geführten Schläge mit Schadenssumme.
 *
 * Die Einträge liegen in `character.systemData.combatHistory` und überstehen
 * damit einen Tabwechsel und einen Reload. Charaktere ohne dieses Feld
 * (ältere Exporte) liefern eine leere Historie.
 */

/** Ein geführter Schlag. */
export interface CombatHistoryEntry {
  id: string;
  /** Waffenname, z.B. "Schurkenschwert". */
  weaponName: string;
  /** Hand, z.B. "Haupthand". */
  handLabel: string;
  /** Angriffsbonus des Schlags, z.B. 7. */
  attackBonus: number;
  /** Schaden dieses Schlags. */
  damage: number;
  /** Kritischer Treffer? */
  critical: boolean;
  /** Statushinweis, z.B. "blutend" (siehe STATUS_OPTIONS in der Würfelübersicht). */
  status: string;
  /** Zeitpunkt (ISO-String). */
  timestamp: string;
}

/** Rohdaten eines Schlags, wie ihn die Würfelübersicht meldet. */
export interface CombatHistoryInput {
  weaponName: string;
  handLabel: string;
  attackBonus: number;
  damage: number;
  critical: boolean;
  status: string;
}

/** Liest die Kampfhistorie aus den Systemdaten; fehlende/kaputte Daten -> leere Liste. */
export const readCombatHistory = (character: GenericCharacter): CombatHistoryEntry[] => {
  const raw = character.systemData?.combatHistory;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is CombatHistoryEntry =>
      !!e && typeof e === "object" && typeof (e as CombatHistoryEntry).damage === "number"
  );
};

/** Summe des Schadens aller geführten Schläge. */
export const sumCombatHistory = (entries: CombatHistoryEntry[]): number =>
  entries.reduce((sum, e) => sum + (e.damage || 0), 0);

/** Wandelt die Meldung der Würfelübersicht in einen Eintrag mit ID und Zeitpunkt. */
export const makeCombatHistoryEntry = (
  input: CombatHistoryInput,
  now: string = new Date().toISOString()
): CombatHistoryEntry => ({
  id: makeId(),
  weaponName: input.weaponName,
  handLabel: input.handLabel,
  attackBonus: input.attackBonus,
  damage: input.damage,
  critical: input.critical,
  status: input.status,
  timestamp: now,
});

/** Hängt einen Schlag an die Historie (neueste Einträge zuerst). */
export const appendCombatHistory = (
  entries: CombatHistoryEntry[],
  entry: CombatHistoryEntry
): CombatHistoryEntry[] => [entry, ...entries];

/** Formatierter Zeitpunkt, z.B. "14:35". */
export const formatCombatHistoryTime = (timestamp: string): string => {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Kurzbeschreibung eines Eintrags, z.B. "Schurkenschwert +7 · 18 Schaden". */
export const formatCombatHistoryLabel = (entry: CombatHistoryEntry): string => {
  const atk = entry.attackBonus >= 0 ? `+${entry.attackBonus}` : `${entry.attackBonus}`;
  return `${entry.weaponName} ${atk} · ${entry.damage} Schaden`;
};
