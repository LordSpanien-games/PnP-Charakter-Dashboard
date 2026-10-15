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
  magicBonus?: number;
  baseDice?: string;
  damageAttribute?: "ST" | "GE" | "NONE";
  attackAttribute?: "ST" | "GE";
  sneakAttackBonusAttack?: number;
  sneakAttackBonusDamage?: number;
  extraDamage?: string;
  weaponSlot?: WeaponSlot;
  supportsOneHanded?: boolean;
  supportsTwoHanded?: boolean;
  modifiers?: CombatModifier[];
}

export interface ArmorItemData {
  armorBonus: number;
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
  [extra: string]: unknown;
}

export interface Ability {
  name: string;
  effect?: string;
  usage?: string;
  type?: string;
  maxUses?: number;
  currentUses?: number;
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
