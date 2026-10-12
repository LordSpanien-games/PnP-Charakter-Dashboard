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

export interface SkillValue {
  name: string;
  value: number | string;
  notes?: string;
  sourceReference?: string;
  [extra: string]: unknown;
}

export interface Weapon {
  name: string;
  attack?: string;
  damage?: string;
  critical?: string;
  note?: string;
  range?: string;
  sourceReference?: string;
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

export interface WeaponItemData {
  isMelee: boolean;
  isFinesse?: boolean;
  /** 'leichte Waffe' - relevant für reduzierten Nebenhand-Abzug beim Zweiwaffenkampf */
  isLight?: boolean;
  magicBonus?: number;
  baseDice?: string;
  damageAttribute?: "ST" | "GE" | "NONE";
  attackAttribute?: "ST" | "GE";
  sneakAttackBonusAttack?: number;
  sneakAttackBonusDamage?: number;
  extraDamage?: string;
  /** Welche Hand diese Waffe belegt, falls sie als aktive Kampfwaffe markiert ist. */
  weaponSlot?: WeaponSlot;
}

export interface ArmorItemData {
  armorBonus: number;
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
  sourceReference?: string;
  [extra: string]: unknown;
}

export interface Ability {
  name: string;
  effect?: string;
  usage?: string;
  type?: string;
  maxUses?: number;
  currentUses?: number;
  sourceReference?: string;
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
