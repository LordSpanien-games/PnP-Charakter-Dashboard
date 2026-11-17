export type AttributeValue = number | string;

export interface AttributeDefinition {
  key: string;
  label: string;
  description?: string;
}

export interface ResourceDefinition {
  key: string;
  label: string;
  hasMax?: boolean;
}

export interface ResourceState {
  current: number;
  max?: number;
  [extra: string]: unknown;
}

/** Getrennte Buchreferenz & Weblink - beide gleichzeitig und unabhängig
 * voneinander nutzbar, kein einzelnes Textfeld mehr. */
export interface SourceReference {
  book?: string;
  page?: string;
  url?: string;
}

export interface SkillValue {
  name: string;
  value: number | string;
  notes?: string;
  sourceReference?: SourceReference;
  category?: string;
  [extra: string]: unknown;
}

export interface Weapon {
  name: string;
  attack?: string;
  damage?: string;
  critical?: string;
  note?: string;
  range?: string;
  sourceReference?: SourceReference;
  [extra: string]: unknown;
}

export type ItemLocationStatus = "equipped" | "stored";
export type ChargeRechargeType = "rest" | "manual" | "none";
export type WeaponSlot = "primary" | "offHand" | "twoHanded";

export interface ItemCharges {
  max: number;
  current: number;
  rechargeType: ChargeRechargeType;
  rechargeAmount?: number;
}

export type CombatModifierContext =
  | "always"
  | "oneHandedOnly"
  | "twoHandedOnly"
  | "offHandOnly"
  | "sneakAttackOnly"
  | "twoWeaponFightingOnly";

export type CombatModifierSourceType = "weapon" | "talent" | "class" | "race" | "skill" | "custom";

/** Art eines Schadensanteils:
 *  - native: der Waffe eigener Schaden (1W8 usw.)
 *  - extra: zusätzliche Würfel der Waffe (Flammenwaffe 1W6 usw.)
 *  - magic: magischer Schaden (z.B. +1W6 einer magischen Waffe)
 *  - situational: nur unter einer Bedingung wirksam (Hinterhalt, Gift, Fläche …) */
export type DamageComponentKind = "native" | "extra" | "magic" | "situational";

/** Bedingung, unter der ein Schadensanteil wirkt.
 *  "custom:<Text>" erlaubt frei benennbare Eigenbedingungen. */
export type DamageCondition =
  | "always"
  | "sneakAttack"
  | "critical"
  | "opportunityAttack"
  | "twoWeaponFighting"
  | "area"
  | `custom:${string}`;

/** Ein einzelner Schadensanteil einer Waffe: optionale Würfel + flacher Wert. */
export interface DamageComponent {
  id: string;
  label: string;
  kind: DamageComponentKind;
  /** Würfelangabe, z.B. "1W8" oder "1W6+1". */
  dice?: string;
  /** Schaden ohne Würfel (flach), z.B. +2. */
  flat?: number;
  /** Angriffsbonus, der nur bei aktiver Bedingung wirkt (z.B. Hinterhalt +2 Angriff). */
  attackBonus?: number;
  /** Standard: "always". */
  condition?: DamageCondition;
  /** Bei kritischem Treffer werden die Würfel verdoppelt (Standard: true).
   *  Für Hinterhalt-Schaden in Pathfinder standardmäßig false. */
  criticalApplies?: boolean;
}

/** Daten einer Munitionsart (Inventar-Kategorie "ammo"). */
export interface AmmoItemData {
  /** Schadensanteile dieser Munition (z.B. Gift, Öl, Euphorie). */
  damageComponents?: DamageComponent[];
  /** Freitext-Effekt, z.B. "1d6 CON-Schaden". */
  effect?: string;
}

export interface CombatModifier {
  id: string;
  label: string;
  sourceType: CombatModifierSourceType;
  context: CombatModifierContext;
  attackBonus?: number;
  damageBonus?: number;
  extraDamageDice?: string;
  kmbBonus?: number;
  kmvBonus?: number;
  acBonus?: number;
}

export interface WeaponItemData {
  isMelee: boolean;
  isFinesse?: boolean;
  isLight?: boolean;
  /** Legacy: magischer Bonus. Neu: enhancement verwenden. */
  magicBonus?: number;
  /** Legacy: nativer Schaden als Würfel. Neu: damageComponents verwenden. */
  baseDice?: string;
  damageAttribute?: "ST" | "GE" | "NONE";
  attackAttribute?: "ST" | "GE";
  /** Legacy: Hinterhalt-Feld. Neu: damageComponents mit condition "sneakAttack". */
  sneakAttackBonusAttack?: number;
  /** Legacy: Hinterhalt-Feld. Neu: damageComponents mit condition "sneakAttack". */
  sneakAttackBonusDamage?: number;
  /** Legacy: zusätzlicher Schaden. Neu: damageComponents verwenden. */
  extraDamage?: string;
  weaponSlot?: WeaponSlot;
  supportsOneHanded?: boolean;
  supportsTwoHanded?: boolean;
  modifiers?: CombatModifier[];
  /** Neu: „+2" usw. Wirkt als +X auf Angriff und +X auf Schaden. */
  enhancement?: number;
  /** Neu: ab diesem Wurf ist der Treffer kritisch (Standard 20). */
  criticalThreshold?: number;
  /** Neu: Art der Waffe, z.B. "Klinge", "Bogen" (Freitext). */
  weaponType?: string;
  /** Neu: Reichweite, z.B. "Nahkampf", "20 ft" (Freitext). */
  rangeText?: string;
  /** Neu: Referenz auf ein Inventar-Item der Kategorie "ammo". */
  ammoItemId?: string;
  /** Neu: dynamische Schadensanteile (native / extra / magic / situational). */
  damageComponents?: DamageComponent[];
}

export interface ArmorItemData {
  armorBonus: number;
}

/** Ein bonus, den ein Schmuck-Item verleihen kann (z.B. Amulett der Natürlichen Rüstung +1). */
export interface JewelryBonus {
  id: string;
  type: 'armor' | 'attack' | 'damage' | 'save' | 'ac' | 'kmb' | 'kmv' | 'custom';
  value: number;
  label?: string;
  sourceReference?: SourceReference;
}

export interface InventorySubItem {
  id: string;
  name: string;
  isActive?: boolean;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity?: number;
  notes?: string;
  location: ItemLocationStatus;
  isActiveWeapon?: boolean;
  weaponData?: WeaponItemData;
  armorData?: ArmorItemData;
  charges?: ItemCharges;
  sourceReference?: SourceReference;
  subItems?: InventorySubItem[];
  /** Optionale Boni für Schmuck-Items (z.B. Amulett der Natürlichen Rüstung +1). */
  jewelryBonus?: JewelryBonus[];
  /** Nur bei category "ammo": Daten der Munitionsart. */
  ammoData?: AmmoItemData;
  [extra: string]: unknown;
}

export interface Ability {
  id?: string;
  name: string;
  effect?: string;
  usage?: string;
  type?: string;
  maxUses?: number;
  currentUses?: number;
  showInCombat?: boolean;
  sourceReference?: SourceReference;
  [extra: string]: unknown;
}

/** Erweiterte Party-Struktur: Name/Spielername immer sichtbar, Rest optional
 * und nur bei Bedarf (Hover/Edit) gezeigt. */
export interface PartyMember {
  name: string;
  playerName?: string;
  race?: string;
  occupation?: string;
  class?: string;
  note?: string;
  status?: string;
  hp?: { current: number; max?: number };
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
