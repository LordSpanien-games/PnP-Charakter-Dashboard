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

/** Alternative Schreibweisen in alten Importdateien, z.B. "STÄ" statt "STR". */
export const ATTR_LEGACY_ALIASES: Record<string, string[]> = {
  KON: ["KON", "KONSTITUTION"],
  GES: ["GES", "GESCHICKLICHKEIT"],
  REA: ["REA", "REAKTION"],
  STR: ["STR", "STÄ", "STÄRKE"],
  CHA: ["CHA", "CHARISMA"],
  INT: ["INT", "INTUITION"],
  LOG: ["LOG", "LOGIK"],
  WIL: ["WIL", "WILLENSKRAFT"],
  EDG: ["EDG", "EDGE"],
};

export interface ShadowrunLimits { physical: number; mental: number; social: number; }

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

/** Essenz ergibt sich automatisch aus allen Cyberware/Bioware-Posten im Inventar. */
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

// ───────────────────────────────────────────────────────────
// Decker: Cyberdeck & Matrix
// ───────────────────────────────────────────────────────────

export type ShadowrunMatrixAttribute = "attack" | "sleaze" | "dataProcessing" | "firewall";

export const MATRIX_ATTR_LABELS: Record<ShadowrunMatrixAttribute, string> = {
  attack: "Angriff", sleaze: "Schleicher", dataProcessing: "Datenverarbeitung", firewall: "Firewall",
};

export interface ShadowrunDeckProgramModifiers {
  dicePoolMod?: number;
  applicableSkills?: string[];
  attributeBoost?: { attribute: ShadowrunMatrixAttribute; value: number };
  extraProgramSlots?: number;
  damageBonus?: number;
  matrixDamageResistance?: number;
  noiseReduction?: number;
  notes?: string;
}

export interface ShadowrunDeckProgram {
  id: string;
  name: string;
  type: "hacking" | "standard" | "special";
  rating?: number;
  isActive: boolean;
  description: string;
  modifiers?: ShadowrunDeckProgramModifiers;
}

export interface ShadowrunCyberdeck {
  name: string;
  manufacturer?: string;
  deviceRating: number;
  attributeArray: [number, number, number, number];
  configuration: { attack: number; sleaze: number; dataProcessing: number; firewall: number };
  matrixCondition?: { max: number; damage: number };
  programs: ShadowrunDeckProgram[];
  mode?: "AR" | "cold-vr" | "hot-vr";
}

export const MODE_LABELS: Record<string, string> = {
  AR: "Augmented Reality (AR)",
  "cold-vr": "Virtuelle Realität – Kalt (Cold-VR)",
  "hot-vr": "Virtuelle Realität – Heiß (Hot-VR)",
};

/** Effektive Matrix-Attribute inkl. aller Boni durch aktive Programme -
 * generisch, unabhängig vom konkreten Programmnamen. */
export const calculateEffectiveMatrixAttributes = (
  deck: ShadowrunCyberdeck
): { attack: number; sleaze: number; dataProcessing: number; firewall: number } => {
  const result = { ...deck.configuration };
  deck.programs.forEach((p) => {
    if (p.isActive && p.modifiers?.attributeBoost) {
      const { attribute, value } = p.modifiers.attributeBoost;
      result[attribute] += value;
    }
  });
  return result;
};

export const calculateExtraProgramSlots = (deck: ShadowrunCyberdeck): number =>
  deck.programs.reduce((sum, p) => (p.isActive ? sum + (p.modifiers?.extraProgramSlots ?? 0) : sum), 0);

export const getActiveProgramDicePoolMods = (deck: ShadowrunCyberdeck, skillName: string): number =>
  deck.programs.reduce((sum, p) => {
    if (!p.isActive || !p.modifiers?.dicePoolMod) return sum;
    if (!p.modifiers.applicableSkills || p.modifiers.applicableSkills.includes(skillName)) {
      return sum + p.modifiers.dicePoolMod;
    }
    return sum;
  }, 0);
