// Generische, systemunabhängige Charakter-Datenstruktur.
// Jedes System-Plugin liest/schreibt ausschließlich diese Form -
// keine system-spezifischen Felder im Kern der App.

export type AttributeValue = number | string;

export interface AttributeDefinition {
  key: string;          // "ST", "DEX", "MU", ...
  label: string;         // "Stärke"
  description?: string;
}

export interface ResourceDefinition {
  key: string;           // "hp", "sanity", "deprivation", "essence"
  label: string;
  hasMax?: boolean;
}

export interface ResourceState {
  current: number;
  max?: number;
  [extra: string]: unknown;
}

export interface SkillValue {
  name: string;
  value: number | string;
  notes?: string;
  [extra: string]: unknown;
}

export interface Weapon {
  name: string;
  attack?: string;
  damage?: string;
  critical?: string;
  note?: string;
  range?: string;
  [extra: string]: unknown;
}

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity?: number;
  notes?: string;
  status?: "equipped" | "stored";
  [extra: string]: unknown;
}

export interface Ability {
  name: string;
  effect?: string;
  usage?: string;
  type?: string;
  maxUses?: number;
  currentUses?: number;
  [extra: string]: unknown;
}

export interface PartyMember {
  name: string;
  note?: string;
  [extra: string]: unknown;
}

export interface CurrencyData {
  [currencyName: string]: number;
}

export interface GenericCharacter {
  schemaVersion: 2;
  exportVersion: number;
  systemId: string;
  name: string;
  subTitle?: string;
  attributes: Record<string, AttributeValue>;
  resources: Record<string, ResourceState>;
  skills: SkillValue[];
  weapons: { melee: Weapon[]; ranged: Weapon[] };
  inventory: InventoryItem[];
  abilities: Ability[];
  party: PartyMember[];
  currency?: CurrencyData;
  notes?: string;
  /** Freie Ablage für alles, was sich nicht sinnvoll generalisieren lässt
   * (z.B. Pathfinder combatSettings, Shadowrun bodyMods, Cairn-Sonderregeln). */
  systemData: Record<string, unknown>;
}

export const createEmptyGenericCharacter = (
  systemId: string,
  name: string,
  subTitle?: string
): GenericCharacter => ({
  schemaVersion: 2,
  exportVersion: 1,
  systemId,
  name,
  subTitle,
  attributes: {},
  resources: {},
  skills: [],
  weapons: { melee: [], ranged: [] },
  inventory: [],
  abilities: [],
  party: [],
  systemData: {},
});
