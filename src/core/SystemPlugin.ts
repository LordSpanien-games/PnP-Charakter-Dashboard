import { FC } from "react";
import { AttributeDefinition, ResourceDefinition, GenericCharacter } from "./types";

export type GenerationMode = "blank" | "auto" | "manual";

export interface AttributePool {
  /** Rohe Würfelergebnisse in Wurf-Reihenfolge (für manuelle Zuordnung). */
  values: number[];
  /** Lesbare Beschreibung der Methode, z.B. "4W6 (niedrigsten verwerfen)". */
  methodLabel: string;
}

export interface SystemPlugin {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  activeColor: string;

  attributeDefinitions: AttributeDefinition[];
  resourceDefinitions: ResourceDefinition[];

  /** Erstellt einen komplett leeren Charakter zum manuellen Eintragen. */
  createBlankCharacter: (name: string, subTitle?: string) => GenericCharacter;

  /** Würfelt einen Attribut-Pool nach der offiziellen Methode des Systems. */
  rollAttributePool: () => AttributePool;

  /** Ob dieses System freie Zuordnung der gewürfelten Werte zu Attributen
   * erlaubt (z.B. Pathfinder-Array) oder die Werte fix in Wurf-Reihenfolge
   * vergeben werden (die meisten OSR-Systeme wie Cairn). */
  supportsManualAssignment: boolean;

  /** Baut einen Charakter direkt aus einem gewürfelten Pool, entweder in
   * Wurf-Reihenfolge (assignment === undefined) oder mit einer vom Nutzer
   * gewählten Zuordnung attributKey -> Pool-Index. */
  buildCharacterFromPool: (
    name: string,
    subTitle: string | undefined,
    pool: number[],
    assignment?: Record<string, number>
  ) => GenericCharacter;

  /** Erkennt, ob ein rohes importiertes JSON zu diesem System gehört
   * (für automatische Migration alter Spielstände beim Import). */
  detectLegacy: (raw: any) => boolean;

  /** Wandelt ein altes, system-spezifisches JSON in die neue GenericCharacter-Form um. */
  migrateLegacy: (raw: any) => GenericCharacter;

  /** Berechnet abgeleitete Werte neu (Modifikatoren, Rettungswürfe, RK, etc.). */
  recalculate: (character: GenericCharacter) => GenericCharacter;

  /** Haupt-Dashboard-UI für dieses System. */
  DashboardComponent: FC<{
    character: GenericCharacter;
    isEditing: boolean;
    onUpdate: (updates: Partial<GenericCharacter>) => void;
  }>;
}
