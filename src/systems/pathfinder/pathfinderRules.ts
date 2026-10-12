export type BabProgression = "full" | "threeFourths" | "half";

export interface PathfinderClassPreset {
  id: string;
  name: string;
  hitDie: number;
  babProgression: BabProgression;
  goodSaves: { fort: boolean; ref: boolean; will: boolean };
}

export const PATHFINDER_CLASSES: Record<string, PathfinderClassPreset> = {
  rogue: { id: "rogue", name: "Schurke (Rogue)", hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: false, ref: true, will: false } },
  fighter: { id: "fighter", name: "Kämpfer (Fighter)", hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: false, will: false } },
  barbarian: { id: "barbarian", name: "Barbar (Barbarian)", hitDie: 12, babProgression: "full", goodSaves: { fort: true, ref: false, will: false } },
  wizard: { id: "wizard", name: "Magier (Wizard)", hitDie: 6, babProgression: "half", goodSaves: { fort: false, ref: false, will: true } },
  cleric: { id: "cleric", name: "Kleriker (Cleric)", hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: true, ref: false, will: true } },
  ranger: { id: "ranger", name: "Waldläufer (Ranger)", hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: true, will: false } },
  paladin: { id: "paladin", name: "Paladin", hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: false, will: true } },
  monk: { id: "monk", name: "Mönch (Monk)", hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: true, ref: true, will: true } },
  sorcerer: { id: "sorcerer", name: "Hexenmeister (Sorcerer)", hitDie: 6, babProgression: "half", goodSaves: { fort: false, ref: false, will: true } },
  bard: { id: "bard", name: "Barde (Bard)", hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: false, ref: true, will: true } },
};

/** Rassen-Größenmodifikatoren - generisch, nicht an einen Namen gebunden. */
export interface PathfinderRacePreset {
  id: string;
  name: string;
  size: "small" | "medium" | "large";
}

export const PATHFINDER_RACES: Record<string, PathfinderRacePreset> = {
  human: { id: "human", name: "Mensch", size: "medium" },
  elf: { id: "elf", name: "Elf", size: "medium" },
  dwarf: { id: "dwarf", name: "Zwerg", size: "medium" },
  halfling: { id: "halfling", name: "Halbling", size: "small" },
  gnome: { id: "gnome", name: "Gnom", size: "small" },
  halforc: { id: "halforc", name: "Halbork", size: "medium" },
};

export const SIZE_MODIFIERS: Record<string, { attackAndAc: number; cmbAndCmd: number }> = {
  small: { attackAndAc: 1, cmbAndCmd: -1 },
  medium: { attackAndAc: 0, cmbAndCmd: 0 },
  large: { attackAndAc: -1, cmbAndCmd: 1 },
};

/** Klassen-Kampf-Features als FORMEL, abhängig von Level/Attributen -
 * das ersetzt die alten, charakterspezifischen Hardcodierungen. */
export interface ClassCombatFeatures {
  sneakAttackDice?: (level: number) => number;              // Rogue
  rageRoundsPerDay?: (conMod: number) => number;             // Barbarian
  favoredEnemyBonus?: (level: number) => number;             // Ranger
  smiteUsesPerDay?: (chaMod: number) => number;              // Paladin
  flurryExtraAttack?: (level: number) => boolean;            // Monk
}

export const PATHFINDER_CLASS_COMBAT_FEATURES: Record<string, ClassCombatFeatures> = {
  rogue: {
    sneakAttackDice: (level) => Math.max(1, Math.ceil(level / 2)),
  },
  barbarian: {
    rageRoundsPerDay: (conMod) => 4 + 2 * conMod,
  },
  ranger: {
    favoredEnemyBonus: (level) => (level >= 15 ? 4 : level >= 10 ? 3 : level >= 5 ? 2 : 1),
  },
  paladin: {
    smiteUsesPerDay: (chaMod) => Math.max(1, 1 + chaMod),
  },
  monk: {
    flurryExtraAttack: (level) => level >= 1,
  },
};

export const getSneakAttackDice = (classId: string | undefined, level: number): number => {
  const fn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.sneakAttackDice : undefined;
  return fn ? fn(level) : 0;
};

export const getRageRounds = (classId: string | undefined, conMod: number): number => {
  const fn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.rageRoundsPerDay : undefined;
  return fn ? fn(conMod) : 0;
};

export const getFavoredEnemyBonus = (classId: string | undefined, level: number): number => {
  const fn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.favoredEnemyBonus : undefined;
  return fn ? fn(level) : 0;
};

export const calculateModifier = (score: number): number => Math.floor((score - 10) / 2);
export const formatModifier = (mod: number): string => (mod >= 0 ? `+${mod}` : `${mod}`);

export const calculateBAB = (level: number, progression: BabProgression): number => {
  if (level <= 0) return 0;
  if (progression === "full") return level;
  if (progression === "threeFourths") return Math.floor(level * 0.75);
  return Math.floor(level * 0.5);
};

export const calculateBaseSave = (level: number, isGood: boolean): number => {
  if (level <= 0) return 0;
  return isGood ? 2 + Math.floor(level / 2) : Math.floor(level / 3);
};

export const getBabIteratives = (bab: number): number[] => {
  const result: number[] = [];
  let current = bab;
  while (current > 0) {
    result.push(current);
    current -= 5;
  }
  return result.length > 0 ? result : [0];
};

export const formatIteratives = (iteratives: number[]): string =>
  iteratives.map(formatModifier).join(" / ");

export interface PathfinderAttributes {
  ST: number; GE: number; KO: number; IN: number; WE: number; CH: number;
}

export interface PathfinderSavingThrows {
  fortitude: { base: number; total: number };
  reflex: { base: number; total: number };
  will: { base: number; total: number };
}

export const calculateSavingThrows = (
  attrs: PathfinderAttributes,
  level: number,
  classId: string | undefined
): PathfinderSavingThrows => {
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const fortBase = calculateBaseSave(level, cls?.goodSaves.fort ?? false);
  const refBase = calculateBaseSave(level, cls?.goodSaves.ref ?? false);
  const willBase = calculateBaseSave(level, cls?.goodSaves.will ?? false);

  return {
    fortitude: { base: fortBase, total: fortBase + calculateModifier(attrs.KO) },
    reflex: { base: refBase, total: refBase + calculateModifier(attrs.GE) },
    will: { base: willBase, total: willBase + calculateModifier(attrs.WE) },
  };
};

/**
 * Berechnet die Kampfwerte EINER Waffe ausschließlich aus:
 * - den Charakter-Attributen
 * - Level/Klasse (für BAB & Sneak Attack)
 * - den Eigenschaften, die AM INVENTAR-ITEM selbst hinterlegt sind
 * Keine Namens-Erkennung, keine Hardcodierung.
 */
export interface WeaponCalcInput {
  name: string;
  isMelee: boolean;
  isFinesse?: boolean;
  magicBonus?: number;
  baseDice?: string;
  damageAttribute?: "ST" | "GE" | "NONE";
  sneakAttackBonusAttack?: number;
  sneakAttackBonusDamage?: number;
  extraDamage?: string;
}

export interface WeaponCalcResult {
  name: string;
  attack: string;
  damage: string;
  sneakAttack?: { attack: string; damage: string };
}

export const calculateWeaponStats = (
  weapon: WeaponCalcInput,
  attrs: PathfinderAttributes,
  level: number,
  classId: string | undefined,
  raceId: string | undefined,
  options: { sneakAttackActive: boolean }
): WeaponCalcResult => {
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const sizeMod = SIZE_MODIFIERS[race?.size ?? "medium"];
  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");

  const stMod = calculateModifier(attrs.ST);
  const geMod = calculateModifier(attrs.GE);
  const magicBonus = weapon.magicBonus ?? 0;

  const useFinesse = weapon.isMelee && weapon.isFinesse;
  const attackAttr = !weapon.isMelee ? "GE" : useFinesse ? "GE" : "ST";
  const attackMod = attackAttr === "GE" ? geMod : stMod;

  const iteratives = getBabIteratives(bab).map((b) => b + attackMod + magicBonus + sizeMod.attackAndAc);
  const attack = formatIteratives(iteratives);

  const dmgAttr = weapon.damageAttribute ?? (!weapon.isMelee ? "NONE" : "ST");
  const dmgMod = dmgAttr === "GE" ? geMod : dmgAttr === "ST" ? stMod : 0;
  const flat = dmgMod + magicBonus;
  const baseDice = weapon.baseDice || "1W6";
  let damage = flat > 0 ? `${baseDice}+${flat}` : flat < 0 ? `${baseDice}${flat}` : baseDice;
  if (weapon.extraDamage) damage += ` ${weapon.extraDamage}`;

  let sneakAttack: WeaponCalcResult["sneakAttack"] | undefined;
  if (options.sneakAttackActive) {
    const sneakDice = getSneakAttackDice(classId, level);
    const bonusAtk = weapon.sneakAttackBonusAttack ?? 0;
    const bonusDmg = weapon.sneakAttackBonusDamage ?? 0;
    const sneakIteratives = getBabIteratives(bab).map(
      (b) => b + attackMod + magicBonus + sizeMod.attackAndAc + bonusAtk
    );
    const sneakFlat = flat + bonusDmg;
    let sneakDamage = sneakFlat > 0 ? `${baseDice}+${sneakFlat}` : sneakFlat < 0 ? `${baseDice}${sneakFlat}` : baseDice;
    if (sneakDice > 0) sneakDamage += ` + ${sneakDice}W6`;
    if (weapon.extraDamage) sneakDamage += ` ${weapon.extraDamage}`;

    sneakAttack = { attack: formatIteratives(sneakIteratives), damage: sneakDamage };
  }

  return { name: weapon.name, attack, damage, sneakAttack };
};

export const calculateArmorClass = (
  attrs: PathfinderAttributes,
  armorBonus: number,
  raceId: string | undefined
): { armorClass: number; touchAc: number; flatFootedAc: number } => {
  const geMod = calculateModifier(attrs.GE);
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const sizeMod = SIZE_MODIFIERS[race?.size ?? "medium"].attackAndAc;
  return {
    armorClass: 10 + geMod + armorBonus + sizeMod,
    touchAc: 10 + geMod + sizeMod,
    flatFootedAc: 10 + armorBonus + sizeMod,
  };
};
