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

/** Wann ein Kampf-Modifikator wirkt. "always" gilt immer zusätzlich zum jeweiligen Kontext. */
export type CombatModifierContext =
  | "always"
  | "oneHandedOnly"
  | "twoHandedOnly"
  | "offHandOnly"
  | "sneakAttackOnly";

export type CombatModifierSourceType = "weapon" | "talent" | "class" | "race" | "skill" | "custom";

/**
 * Generischer Kampf-Modifikator: kann an einer Waffe (weaponData.modifiers)
 * oder am Charakter selbst (systemData.combatModifiers, für Talente/Rasse/
 * Klasse/Skill-Boni, die nicht an eine bestimmte Waffe gebunden sind) hängen.
 * Mehrere Quellen summieren sich automatisch je nach aktuellem Kontext.
 */
export interface CombatModifier {
  id: string;
  label: string;
  sourceType: CombatModifierSourceType;
  context: CombatModifierContext;
  attackBonus?: number;
  damageBonus?: number;
  /** Zusätzlicher Schaden als Text, z.B. "+1W6 Eis" oder "+5 Blutung" */
  extraDamageDice?: string;
}

export interface WeaponItemData {
  isMelee: boolean;
  isFinesse?: boolean;
  isLight?: boolean;
  magicBonus?: number;
  baseDice?: string;
  damageAttribute?: "ST" | "GE" | "NONE";
  attackAttribute?: "ST" | "GE";
  /** @deprecated Nutze stattdessen modifiers mit context "sneakAttackOnly" */
  sneakAttackBonusAttack?: number;
  /** @deprecated Nutze stattdessen modifiers mit context "sneakAttackOnly" */
  sneakAttackBonusDamage?: number;
  extraDamage?: string;
  weaponSlot?: WeaponSlot;
  /** Ob diese Waffe einhändig geführt werden kann (Default: true) */
  supportsOneHanded?: boolean;
  /** Ob diese Waffe zweihändig geführt werden kann (Default: false) */
  supportsTwoHanded?: boolean;
  /** Waffeneigene Kampf-Modifikatoren, z.B. ein Schurkenkurzschwert-Bonus nur bei Hinterhalt */
  modifiers?: CombatModifier[];
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
