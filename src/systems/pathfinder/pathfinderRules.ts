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

export interface PathfinderWeaponInput {
  name: string;
  baseDice: string;      // "1W6"
  isMelee: boolean;
  isFinesse?: boolean;
  magicBonus?: number;
}

export interface PathfinderWeaponResult {
  name: string;
  attack: string;        // "+9 / +4"
  damage: string;        // "1W6+4"
}

export const calculateWeaponStats = (
  weapon: PathfinderWeaponInput,
  attrs: PathfinderAttributes,
  level: number,
  classId: string | undefined,
  useDexToDamage: boolean
): PathfinderWeaponResult => {
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");

  const stMod = calculateModifier(attrs.ST);
  const geMod = calculateModifier(attrs.GE);
  const magicBonus = weapon.magicBonus ?? 0;

  const useFinesse = weapon.isMelee && weapon.isFinesse;
  const attackAttr = !weapon.isMelee ? "GE" : useFinesse ? "GE" : "ST";
  const attackMod = attackAttr === "GE" ? geMod : stMod;

  const iteratives = getBabIteratives(bab).map((b) => b + attackMod + magicBonus);
  const attack = formatIteratives(iteratives);

  const dmgAttr = !weapon.isMelee ? "NONE" : useDexToDamage ? "GE" : "ST";
  const dmgMod = dmgAttr === "GE" ? geMod : dmgAttr === "ST" ? stMod : 0;
  const flat = dmgMod + magicBonus;
  const damage = flat > 0 ? `${weapon.baseDice}+${flat}` : flat < 0 ? `${weapon.baseDice}${flat}` : weapon.baseDice;

  return { name: weapon.name, attack, damage };
};

export const calculateArmorClass = (attrs: PathfinderAttributes, armorBonus: number): {
  armorClass: number; touchAc: number; flatFootedAc: number;
} => {
  const geMod = calculateModifier(attrs.GE);
  return {
    armorClass: 10 + geMod + armorBonus,
    touchAc: 10 + geMod,
    flatFootedAc: 10 + armorBonus,
  };
};
