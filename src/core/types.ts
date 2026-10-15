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
  /** Optionale freie Gruppierung, z.B. "active" / "knowledge" bei Shadowrun -
   * wird NICHT automatisch aus dem Namen erkannt, sondern manuell zugeordnet. */
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
  /** Bonus auf den Kampfmanöverbonus (KMB) */
  kmbBonus?: number;
  /** Bonus auf die Kampfmanöververteidigung (KMV) */
  kmvBonus?: number;
  /** Bonus auf die Rüstungsklasse (RK), z.B. Ausweichbonus oder Schildbonus */
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

/** Generisches, einzeln schaltbares Unterelement an einem Inventar-Gegenstand -
 * z.B. ein einzelner Soft-Chip in einer Chipbuchse. Systemunabhängig nutzbar. */
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
  sourceReference?: string;
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
  sourceReference?: string;
  [extra: string]: unknown;
}

export interface PartyMember {
  name: string;
  note?: string;
  playerName?: string;
  race?: string;
  occupation?: string;
  class?: string;
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
