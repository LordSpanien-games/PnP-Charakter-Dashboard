export type GameSystem = 'pathfinder' | 'coc7e' | 'coc1920' | 'shadowrun' | 'traveller' | 'generic';

export interface Stat {
  label: string;
  value: string | number;
  secondary?: string | number; // For CoC 1/2 and 1/5 values
  modifier?: number;            // Temporary modifiers (e.g. buffs, debuffs)
  damage?: number;              // Damage taken / points lost (e.g. HP loss, Sanity loss)
}

export interface Skill {
  name: string;
  value: number;
  note?: string;
  checked?: boolean;   // CoC: Successful use tick for development phase
  trained?: boolean;   // Pathfinder: Trained class skill indicator
  page?: string;       // Regelbuch-Referenz / Buchseite (z. B. "GRW S. 92")
}

export interface Weapon {
  name: string;
  attack: string;
  damage: string;
  critical: string;
  note: string;
  range?: string;
  attacks?: string; // CoC specific
  malfunction?: string; // CoC specific
  attribute?: 'ST' | 'GE' | 'auto'; // Pathfinder: specific attribute for attack roll (auto: uses GE if Finesse, else ST)
  damageAttribute?: 'ST' | 'ST_1_5' | 'ST_0_5' | 'GE' | 'NONE'; // Pathfinder: attribute for damage bonus
  isFinesse?: boolean; // Pathfinder: qualifies for Waffenfinesse (light weapon, rapier, etc.)
  magicBonus?: number; // Enhancement bonus (+1, +2, etc.)
  baseDice?: string; // e.g. "1W3", "1W4", "1W6", "1W8"
  sneakAttackBonus?: number; // Pathfinder: extra attack bonus during sneak attack (e.g. +4 for Schurkenkurzschwert / Sword of Subtlety)
  sneakAttackDamageBonus?: number; // Pathfinder: extra flat damage bonus during sneak attack (e.g. +4 for Schurkenkurzschwert)
  isSchurkenWeapon?: boolean; // Pathfinder: Sword of Subtlety / Schurkenwaffe trait
  page?: string; // Regelbuch-Referenz / Buchseite (z. B. "GRW S. 142")
}

export type ItemLocationStatus = 'equipped' | 'stored'; // 'equipped' = Am Mann (im Einsatz) | 'stored' = Eingelagert
export type InventoryCategory = 'weapon' | 'armor' | 'gear' | 'ammo' | 'consumable' | 'electronics' | 'other';

export interface InventoryItem {
  id: string;
  name: string; // Bezeichnung (vorne)
  category?: InventoryCategory; // Waffe, Panzerung, Ausrüstung, etc.
  quantity?: number; // Menge (Standard: 1)
  rating?: number | string; // Gegenstandsstufe (z. B. Stufe 4)
  status: ItemLocationStatus; // 'equipped' (Am Mann) | 'stored' (Eingelagert)
  location?: string; // Lagerort (Standard: "Unterkunft")

  // Waffen-spezifische Zusatzfelder:
  damage?: string; // Schaden (z. B. "8K", "11K", "1W8+2")
  accuracy?: string | number; // Präzision (z. B. 5, 7)
  ap?: string | number; // DK / Durchschlagskraft (z. B. -1, -3)
  mode?: string; // Feuermodus (z. B. "HM", "SF", "AM", "HM/SF/AM")
  rc?: string | number; // Rückstoßkompensation (RK) (z. B. 2, 3)
  ammo?: string; // Munition (z. B. "15 (c)", "42/42")
  weaponType?: 'melee' | 'ranged'; // Nahkampf oder Fernkampf
  attackPool?: string | number; // Würfelpool / Angriffswert (z. B. "14", "+7")
  range?: string; // Reichweite

  // Panzerungs-spezifische Zusatzfelder:
  armorValue?: string | number; // Panzerungswert (z. B. 12, +2)

  // Allgemeine Felder:
  price?: number | string; // Wert in Nuyen ¥ / GM
  weight?: string; // Gewicht (z. B. "1.5 kg")
  notes?: string; // Anmerkungen / Effekte / Upgrades
  page?: string; // Regelbuch-Referenz / Buchseite (z. B. "GRW S. 158")
  maxUses?: number; // Maximale tägliche Nutzungen (z. B. 2x täglich Fanghandschuhe)
  currentUses?: number; // Verbleibende Nutzungen vor nächster Rast
}

export interface CombatCombo {
  id: string;
  title: string;
  description: string;
  weapons?: {
    name: string;
    roll: string;
    damage: string;
    notes?: string[];
  }[];
  table?: {
    headers: string[];
    rows: string[][];
  };
  notes?: string[];
  page?: string; // Regelbuch-Referenz / Buchseite
}

export type AbilityType = 'talent' | 'class' | 'gnome' | 'item' | 'trait' | 'spell' | 'rogue_talent' | 'quality' | 'flaw' | 'adept_power';

export interface Ability {
  name: string;
  usage?: string;
  effect: string;
  type: AbilityType;
  karmaCost?: number;
  powerPoints?: number;
  drain?: string;
  category?: string;
  page?: string; // Regelbuch-Referenz / Buchseite (z. B. "GRW S. 68")
  maxUses?: number; // Maximale tägliche Nutzungen (z. B. 3x am Tag)
  currentUses?: number; // Verbleibende Nutzungen
}

export interface PartyMember {
  name: string;
  playerName?: string;
  class?: string;
  race?: string;
  occupation?: string;
  role?: string;
  system?: string;
  subTitle?: string;
  synergyNote?: string;
}

export type { LocalCharacterMeta, SaveResult, CharacterHistoryVersion } from './services/characterStorageService';
export type { AiConfig, AiProvider } from './services/aiService';


export interface PathfinderCoins {
  pp: number; // Platin (Platinmünzen: 1 PM = 10 GM)
  gp: number; // Gold (Goldmünzen: 1 GM = 1 GM)
  sp: number; // Silber (Silbermünzen: 10 SM = 1 GM)
  cp: number; // Kupfer (Kupfermünzen: 100 KM = 1 GM)
}

export interface CurrencyTransaction {
  id: string;
  timestamp: string;
  description: string;
  amount: number; // positive for income, negative for expense
  type: 'income' | 'expense' | 'set';
  balanceAfter: number;
  coinDetails?: string; // e.g. "+5 PM, +20 GM"
}

export interface CurrencyData {
  amount: number;
  unit: string; // e.g. "¥", "GM", "$", "Münzen"
  lifestyle?: string; // e.g. "Mittelstand", "Unterschicht", "Oberschicht"
  lifestyleCost?: number; // e.g. 5000
  coins?: PathfinderCoins; // Platin, Gold, Silber, Kupfer
  history?: CurrencyTransaction[];
}

export interface ExperienceHistoryEntry {
  id: string;
  timestamp: string;
  amount: number; // +250, +1000
  reason: string;
  totalAfter: number;
}

export interface ExperienceData {
  current: number;                    // Aktuelle Erfahrungspunkte (EP)
  nextLevel?: number;                  // Erforderliche EP für die nächste Stufe
  track?: 'fast' | 'medium' | 'slow';  // Pathfinder Progressionstempo (Standard: 'medium')
  history?: ExperienceHistoryEntry[];  // EP-Logbuch
}

export interface ShadowrunLimitData {
  physicalMod?: number;
  mentalMod?: number;
  socialMod?: number;
  astralMod?: number;
  physicalOverride?: number;
  mentalOverride?: number;
  socialOverride?: number;
  astralOverride?: number;
}

export type ShadowrunBodyModCategory = 'cyberware' | 'bioware' | 'cyberdeck' | 'genetech' | 'other';
export type ShadowrunWareGrade = 'standard' | 'alphaware' | 'betaware' | 'deltaware' | 'used';
export type ShadowrunChipType = 'lingwasoft' | 'knowsoft' | 'actsoft' | 'datachip' | 'other';

export interface ShadowrunChip {
  id: string;
  name: string; // e.g. "Sprachen-Chip: Portugiesisch", "Wissenssoft: Schmuggelrouten", "Aktsoft: Mechanik"
  type: ShadowrunChipType;
  rating: number; // Stufe (1-6)
  isActive: boolean; // Eingesteckt / Online in der Chipbuchse
  notes?: string; // z.B. "Fließende Verständigung und Akzentfreiheit auf Stufe 3"
}

export interface ShadowrunBodyMod {
  id: string;
  name: string; // z.B. "Datenbuchse", "Chipbuchse", "Smartlink", "Drahtreflexe"
  category: ShadowrunBodyModCategory;
  grade?: ShadowrunWareGrade;
  essenceCost: number; // Essenzkosten (z.B. 0.1, 0.2)
  rating?: number; // Stufe (z.B. 1, 2, 3)
  capacity?: number; // Kapazität
  description?: string;
  isChipjack?: boolean; // Kennzeichnet eine Chipbuchse mit Slot-/Chip-Inventar
  chips?: ShadowrunChip[]; // Eigenes Chip-Inventar für diese Chipbuchse
}

export type ShadowrunMatrixAttribute = 'attack' | 'sleaze' | 'dataProcessing' | 'firewall';

export interface ShadowrunDeckProgramModifiers {
  dicePoolMod?: number; // e.g. +2 on Hacking
  applicableSkills?: string[]; // e.g. ['Hacking', 'Cyberkampf', 'Computer', 'Elektronische Kriegsführung']
  attributeBoost?: {
    attribute: ShadowrunMatrixAttribute;
    value: number; // e.g. +1 Firewall or +1 Sleaze
  };
  extraProgramSlots?: number; // e.g. +2 for Virtuelle Maschine
  damageBonus?: number; // e.g. +2 for Hammer
  matrixDamageResistance?: number; // e.g. +2 for Panzerung
  noiseReduction?: number; // e.g. +2 for Signal-Scrubber
  notes?: string;
}

export interface ShadowrunDeckProgram {
  id: string;
  name: string;
  type: 'hacking' | 'standard' | 'special';
  rating?: number;
  isActive: boolean;
  description: string;
  modifiers?: ShadowrunDeckProgramModifiers;
}

export interface ShadowrunCyberdeck {
  name: string; // e.g. "Erika MCD-1", "Renraku Tsurugi"
  manufacturer?: string;
  deviceRating: number; // Gerätestufe (1-12+)
  attributeArray: [number, number, number, number]; // Konfigurations-Wertepool
  configuration: {
    attack: number;
    sleaze: number;
    dataProcessing: number;
    firewall: number;
  };
  matrixCondition?: {
    max: number;
    damage: number;
  };
  programs: ShadowrunDeckProgram[];
  mode?: 'AR' | 'cold-vr' | 'hot-vr';
}

export interface PathfinderSavingThrow {
  total: number;
  base: number;
  abilityMod: number; // KO für Zähigkeit, GE für Reflex, WE für Wille
  magicMod?: number;
  miscMod?: number;
  tempMod?: number;
  notes?: string;
}

export interface PathfinderSavingThrows {
  fortitude: PathfinderSavingThrow; // Zähigkeit
  reflex: PathfinderSavingThrow;    // Reflex
  will: PathfinderSavingThrow;       // Wille
}

export interface PathfinderCombatSettings {
  attackAttr: 'GE' | 'ST';               // GE (Geschicklichkeit / Waffenfinesse) vs. ST (Stärke)
  damageAttr?: 'GE' | 'ST';              // GE (Schurken-Finesse) vs. ST (Stärke)
  grip: 'oneHanded' | 'twoHanded' | 'offHand'; // Einhand (1x Attribut), Zweihand (1.5x Attribut), Nebenhand (0.5x Attribut)
  isFlanking: boolean;                   // Flankiert (+2 Angriff, schaltet HA frei)
  isHasted: boolean;                     // Hast (+1 Angriff, +1 RK/Reflex, +1 Zusatzangriff mit max GAB)
  isSneakAttack: boolean;                // Hinterhältiger Angriff aktiv (+5W6, Blutung, Verkrüppelnder Schlag)
  powerAttack: boolean;                  // Heftiger Angriff / Tödliche Zielgenauigkeit (-GAB/4 auf Angriff, +Schaden)
  higherGround: boolean;                 // Höherer Stand (+1 Angriff)
  targetProne: boolean;                  // Ziel liegt / blind (+4 Nahkampf)
  isStealthed: boolean;                  // Unsichtbar / Versteckt (+2 Angriff, Ziel ohne GE-Bonus)
  customAttackMod: number;               // Eigener situativer Bonus/Malus auf Angriff
  customDamageMod: number;               // Eigener situativer Bonus/Malus auf Schaden
  selectedWeaponName?: string;           // Ausgewählte Waffe für den Detail-Angriff
}

export interface CharacterData {
  system: GameSystem;
  name: string;
  subTitle?: string; // Level/Race or Occupation/Age
  stats: Stat[];
  characteristics?: Stat[];
  skills?: Skill[];
  weapons: {
    melee: Weapon[];
    ranged: Weapon[];
  };
  combos: CombatCombo[];
  abilities: Ability[];
  party?: PartyMember[];
  currency?: CurrencyData;
  limits?: ShadowrunLimitData;
  bodyMods?: ShadowrunBodyMod[];
  cyberdeck?: ShadowrunCyberdeck;
  savingThrows?: PathfinderSavingThrows;
  experience?: ExperienceData;
  useDexToDamage?: boolean; // Pathfinder: applies DEX mod to damage with finesse weapons (Schurken-Finesse / Flink / Fencing Grace)
  combatSettings?: PathfinderCombatSettings; // Pathfinder: dynamic attack and combat configuration
  inventory?: InventoryItem[]; // Inventar & Ausrüstung mit Tragestatus ("Am Mann" vs "Eingelagert")
}
