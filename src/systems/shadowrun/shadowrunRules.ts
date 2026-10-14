export interface ShadowrunAttributes {
  KON: number; GES: number; REA: number; STR: number;
  CHA: number; INT: number; LOG: number; WIL: number;
  EDG: number;
}

export const ATTR_KEYS = ["KON", "GES", "REA", "STR", "CHA", "INT", "LOG", "WIL", "EDG"] as const;

export const ATTR_LABELS: Record<string, string> = {
  KON: "Konstitution", GES: "Geschicklichkeit", REA: "Reaktion", STR: "Stärke",
  CHA: "Charisma", INT: "Intuition", LOG: "Logik", WIL: "Willenskraft", EDG: "Edge",
};

export interface ShadowrunLimits { physical: number; mental: number; social: number; }

/** Formeln nach SR5e-Kernregelwerk. */
export const calculateLimits = (attrs: ShadowrunAttributes, essence: number): ShadowrunLimits => ({
  physical: Math.ceil((attrs.STR * 2 + attrs.KON + attrs.REA) / 3),
  mental: Math.ceil((attrs.LOG * 2 + attrs.INT + attrs.WIL) / 3),
  social: Math.ceil((attrs.CHA * 2 + attrs.WIL + Math.ceil(essence)) / 3),
});

export const calculateInitiative = (attrs: ShadowrunAttributes, extraDice: number = 1) => ({
  base: attrs.REA + attrs.INT,
  dice: extraDice,
});

export const calculateConditionMonitors = (attrs: ShadowrunAttributes) => ({
  physical: 8 + Math.ceil(attrs.KON / 2),
  stun: 8 + Math.ceil(attrs.WIL / 2),
});

/** Essenz ergibt sich automatisch aus allen Cyberware/Bioware-Posten im Inventar -
 * genau wie bei Pathfinder die RK aus dem Rüstungsgegenstand. */
export const calculateEssence = (
  inventory: { category?: string; essenceCost?: number }[]
): number => {
  const spent = inventory
    .filter((i) => i.category === "cyberware" || i.category === "bioware")
    .reduce((sum, i) => sum + (Number(i.essenceCost) || 0), 0);
  return Math.max(0, Math.round((6 - spent) * 100) / 100);
};

export interface ShadowrunWeaponData {
  skillName: string;
  attackAttribute: "GES" | "STR" | "LOG" | "none";
  damageCode: string;
  ap?: string;
  /** einfacher Flachbonus, z.B. Smartlink +1, Zielfernrohr +1 */
  poolBonus?: number;
}

export const calculateWeaponPool = (
  skillValue: number,
  attrValue: number,
  weapon: ShadowrunWeaponData
): { pool: number; breakdown: string } => {
  const bonus = weapon.poolBonus ?? 0;
  const pool = skillValue + attrValue + bonus;
  const parts = [`${skillValue} (${weapon.skillName})`, `${attrValue} (${weapon.attackAttribute})`];
  if (bonus) parts.push(`${bonus >= 0 ? "+" : ""}${bonus} (Bonus)`);
  return { pool, breakdown: parts.join(" + ") };
};

export const makeId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
