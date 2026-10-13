export type BabProgression = "full" | "threeFourths" | "half";

export interface PathfinderClassPreset {
  id: string;
  name: string;
  aliases: string[];
  hitDie: number;
  babProgression: BabProgression;
  goodSaves: { fort: boolean; ref: boolean; will: boolean };
}

export const PATHFINDER_CLASSES: Record<string, PathfinderClassPreset> = {
  rogue: { id: "rogue", name: "Schurke / Dieb (Rogue)", aliases: ["schurke", "dieb", "rogue"], hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: false, ref: true, will: false } },
  fighter: { id: "fighter", name: "Kämpfer (Fighter)", aliases: ["kämpfer", "krieger", "fighter"], hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: false, will: false } },
  barbarian: { id: "barbarian", name: "Barbar (Barbarian)", aliases: ["barbar", "barbarian"], hitDie: 12, babProgression: "full", goodSaves: { fort: true, ref: false, will: false } },
  wizard: { id: "wizard", name: "Magier (Wizard)", aliases: ["magier", "wizard"], hitDie: 6, babProgression: "half", goodSaves: { fort: false, ref: false, will: true } },
  cleric: { id: "cleric", name: "Kleriker (Cleric)", aliases: ["kleriker", "priester", "cleric"], hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: true, ref: false, will: true } },
  ranger: { id: "ranger", name: "Waldläufer (Ranger)", aliases: ["waldläufer", "ranger"], hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: true, will: false } },
  paladin: { id: "paladin", name: "Paladin", aliases: ["paladin"], hitDie: 10, babProgression: "full", goodSaves: { fort: true, ref: false, will: true } },
  monk: { id: "monk", name: "Mönch (Monk)", aliases: ["mönch", "monk"], hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: true, ref: true, will: true } },
  sorcerer: { id: "sorcerer", name: "Hexenmeister (Sorcerer)", aliases: ["hexenmeister", "sorcerer"], hitDie: 6, babProgression: "half", goodSaves: { fort: false, ref: false, will: true } },
  bard: { id: "bard", name: "Barde (Bard)", aliases: ["barde", "bard"], hitDie: 8, babProgression: "threeFourths", goodSaves: { fort: false, ref: true, will: true } },
};

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

export interface ClassCombatFeatures {
  sneakAttackDice?: (level: number) => number;
  rageRoundsPerDay?: (conMod: number) => number;
  favoredEnemyBonus?: (level: number) => number;
  smiteUsesPerDay?: (chaMod: number) => number;
  flurryExtraAttack?: (level: number) => boolean;
  channelEnergyDice?: (level: number) => number;
  channelEnergyUsesPerDay?: (chaMod: number) => number;
  bardicPerformanceRounds?: (level: number) => number;
  stunningFistUsesPerDay?: (level: number) => number;
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
    stunningFistUsesPerDay: (level) => 1 + Math.floor((level - 1) / 4),
  },
  cleric: {
    channelEnergyDice: (level) => Math.ceil(level / 2),
    channelEnergyUsesPerDay: (chaMod) => 3 + chaMod,
  },
  bard: {
    bardicPerformanceRounds: (level) => 4 + level * 2,
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

export const getChannelEnergy = (
  classId: string | undefined,
  level: number,
  chaMod: number
): { dice: number; usesPerDay: number } => {
  const diceFn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.channelEnergyDice : undefined;
  const usesFn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.channelEnergyUsesPerDay : undefined;
  return {
    dice: diceFn ? diceFn(level) : 0,
    usesPerDay: usesFn ? usesFn(chaMod) : 0,
  };
};

export const getBardicPerformanceRounds = (classId: string | undefined, level: number): number => {
  const fn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.bardicPerformanceRounds : undefined;
  return fn ? fn(level) : 0;
};

export const getStunningFistUses = (classId: string | undefined, level: number): number => {
  const fn = classId ? PATHFINDER_CLASS_COMBAT_FEATURES[classId]?.stunningFistUsesPerDay : undefined;
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
  /** Nur Basiswürfel + Attributsbonus + Verstärkung, OHNE Elementarschaden-Text */
  damage: string;
  /** Separater Elementar-/Zusatzschaden, z.B. "+1W6 Eis" - unabhängig vom Verstärkungsbonus */
  extraDamage?: string;
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

  // Verstärkungsbonus (magicBonus) wirkt auf Angriff UND Schaden gleichermaßen
  const iteratives = getBabIteratives(bab).map((b) => b + attackMod + magicBonus + sizeMod.attackAndAc);
  const attack = formatIteratives(iteratives);

  const dmgAttr = weapon.damageAttribute ?? (!weapon.isMelee ? "NONE" : "ST");
  const dmgMod = dmgAttr === "GE" ? geMod : dmgAttr === "ST" ? stMod : 0;
  const flat = dmgMod + magicBonus;
  const baseDice = weapon.baseDice || "1W6";
  // "damage" enthält NUR den numerischen Teil - der Elementarschaden wird separat zurückgegeben
  const damage = flat > 0 ? `${baseDice}+${flat}` : flat < 0 ? `${baseDice}${flat}` : baseDice;

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

  return { name: weapon.name, attack, damage, extraDamage: weapon.extraDamage, sneakAttack };
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

// ───────────────────────────────────────────────────────────
// Zweiwaffenkampf (Two-Weapon Fighting)
// ───────────────────────────────────────────────────────────

export interface TwoWeaponFightingFeats {
  hasTwoWeaponFighting: boolean;
  hasImprovedTwoWeaponFighting: boolean;
  hasGreaterTwoWeaponFighting: boolean;
}

export interface TwoWeaponAttackResult {
  slot: "primary" | "offHand";
  weaponName: string;
  attacks: { attackBonus: number; damage: string }[];
  formattedAttack: string;
  extraDamage?: string;
}

export interface TwoWeaponFightingResult {
  primary: TwoWeaponAttackResult;
  offHand: TwoWeaponAttackResult;
  penaltyNote: string;
}

export const calculateTwoWeaponFighting = (
  primaryWeapon: WeaponCalcInput & { isLight?: boolean },
  offHandWeapon: WeaponCalcInput & { isLight?: boolean },
  attrs: PathfinderAttributes,
  level: number,
  classId: string | undefined,
  raceId: string | undefined,
  feats: TwoWeaponFightingFeats,
  options: { sneakAttackActive: boolean }
): TwoWeaponFightingResult => {
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const sizeMod = SIZE_MODIFIERS[race?.size ?? "medium"];
  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");

  const stMod = calculateModifier(attrs.ST);
  const geMod = calculateModifier(attrs.GE);
  const sneakDice = options.sneakAttackActive ? getSneakAttackDice(classId, level) : 0;

  let primaryPenalty = -2;
  let offHandPenalty = offHandWeapon.isLight ? -2 : -4;
  if (feats.hasTwoWeaponFighting) {
    primaryPenalty = -2;
    offHandPenalty = -2;
  }

  const buildAttacks = (
    weapon: WeaponCalcInput,
    penalty: number,
    extraBabThresholds: number[]
  ) => {
    const useFinesse = weapon.isMelee && weapon.isFinesse;
    const attackAttr = !weapon.isMelee ? "GE" : useFinesse ? "GE" : "ST";
    const attackMod = attackAttr === "GE" ? geMod : stMod;
    const magicBonus = weapon.magicBonus ?? 0;

    const dmgAttr = weapon.damageAttribute ?? (!weapon.isMelee ? "NONE" : "ST");
    const rawDmgMod = dmgAttr === "GE" ? geMod : dmgAttr === "ST" ? stMod : 0;
    const dmgMod = weapon === offHandWeapon && rawDmgMod > 0 ? Math.floor(rawDmgMod * 0.5) : rawDmgMod;

    const flat = dmgMod + magicBonus + (weapon === primaryWeapon && options.sneakAttackActive ? weapon.sneakAttackBonusDamage ?? 0 : 0);
    const baseDice = weapon.baseDice || "1W6";
    let damage = flat > 0 ? `${baseDice}+${flat}` : flat < 0 ? `${baseDice}${flat}` : baseDice;
    if (sneakDice > 0) damage += ` + ${sneakDice}W6`;
    if (weapon.extraDamage) damage += ` ${weapon.extraDamage}`;

    const mainAttackBonus = bab + attackMod + magicBonus + sizeMod.attackAndAc + penalty;
    const attacks = [{ attackBonus: mainAttackBonus, damage }];

    extraBabThresholds.forEach((threshold) => {
      if (bab >= threshold) {
        attacks.push({
          attackBonus: bab - threshold + attackMod + magicBonus + sizeMod.attackAndAc + penalty,
          damage,
        });
      }
    });

    return attacks;
  };

  const primaryAttacks = buildAttacks(primaryWeapon, primaryPenalty, []);
  const offHandExtra = [
    ...(feats.hasImprovedTwoWeaponFighting ? [5] : []),
    ...(feats.hasGreaterTwoWeaponFighting ? [10] : []),
  ];
  const offHandAttacks = buildAttacks(offHandWeapon, offHandPenalty, offHandExtra);

  const formatAttacks = (attacks: { attackBonus: number }[]) =>
    attacks.map((a) => formatModifier(a.attackBonus)).join(" / ");

  return {
    primary: {
      slot: "primary",
      weaponName: primaryWeapon.name,
      attacks: primaryAttacks,
      formattedAttack: formatAttacks(primaryAttacks),
      extraDamage: primaryWeapon.extraDamage,
    },
    offHand: {
      slot: "offHand",
      weaponName: offHandWeapon.name,
      attacks: offHandAttacks,
      formattedAttack: formatAttacks(offHandAttacks),
      extraDamage: offHandWeapon.extraDamage,
    },
    penaltyNote: feats.hasTwoWeaponFighting
      ? "Zweiwaffenkampf-Talent aktiv: -2/-2"
      : `Standard-Abzüge: ${primaryPenalty}/${offHandPenalty}${offHandWeapon.isLight ? " (Nebenhand leicht)" : ""}`,
  };
};

// ───────────────────────────────────────────────────────────
// Legacy-Import-Hilfsfunktionen
// ───────────────────────────────────────────────────────────

export const parseLegacyWeaponDamage = (
  damageStr: string | undefined
): { baseDice: string; extraDamage?: string } => {
  if (!damageStr) return { baseDice: "1W6" };
  const trimmed = damageStr.trim();

  const baseDiceMatch = trimmed.match(/^(\d+[Ww]\d+)/);
  const baseDice = baseDiceMatch ? baseDiceMatch[1].toUpperCase() : "1W6";

  const extraMatch = trimmed.match(/\+\s*(\d+[Ww]\d+\s*[^\d+]+)/);
  const extraDamage = extraMatch ? `+${extraMatch[1].trim()}` : undefined;

  return { baseDice, extraDamage };
};

/** Liest den Verstärkungsbonus aus der üblichen Waffennamen-Konvention,
 * z.B. "Dolch des Eises +2" -> 2. Dieser Bonus wirkt auf Angriff UND Schaden,
 * NICHT auf Elementar-/Zusatzschaden (siehe extraDamage). */
export const parseMagicBonusFromName = (name: string): number => {
  const match = name.match(/\+(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : 0;
};
