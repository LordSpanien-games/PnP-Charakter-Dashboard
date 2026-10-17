export const ATTR_KEYS = ["ST", "KO", "GR", "GE", "ER", "IN", "MA", "BI"] as const;

export const ATTR_LABELS: Record<string, string> = {
  ST: "Stärke", KO: "Konstitution", GR: "Größe", GE: "Geschicklichkeit",
  ER: "Erscheinung", IN: "Intelligenz", MA: "Macht", BI: "Bildung",
};

/** Alternative Schreibweisen in alten Importdateien. */
export const ATTR_LEGACY_ALIASES: Record<string, string[]> = {
  ST: ["ST", "STR", "STÄRKE"],
  KO: ["KO", "CON", "KONSTITUTION"],
  GR: ["GR", "GRÖ", "SIZ", "GRÖSSE"],
  GE: ["GE", "DEX", "GESCHICKLICHKEIT"],
  ER: ["ER", "APP", "AUS", "ERSCHEINUNG", "AUSSEHEN"],
  IN: ["IN", "INT", "INTELLIGENZ"],
  MA: ["MA", "POW", "MACHT"],
  BI: ["BI", "EDU", "BILDUNG"],
};

export const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;
const roll3d6x5 = (): number => (rollDie(6) + rollDie(6) + rollDie(6)) * 5;
const roll2d6plus6x5 = (): number => (rollDie(6) + rollDie(6) + 6) * 5;

/**
 * Erzeugt die 8 Charakteristiken in ATTR_KEYS-Reihenfolge mit der jeweils
 * korrekten CoC-7e-Würfelformel (3W6×5 bzw. (2W6+6)×5). Reihenfolge ist
 * fix - kein freies Vertauschen wie bei Pathfinder, da sich die
 * Würfelmethoden je Attribut unterscheiden.
 */
export const rollCocAttributePool = (): number[] => [
  roll3d6x5(),       // ST
  roll3d6x5(),       // KO
  roll2d6plus6x5(),  // GR
  roll3d6x5(),       // GE
  roll3d6x5(),       // ER
  roll2d6plus6x5(),  // IN
  roll3d6x5(),       // MA
  roll2d6plus6x5(),  // BI
];

export const rollLuck = (): number => roll3d6x5();

export interface CocAttributes {
  ST: number; KO: number; GR: number; GE: number; ER: number; IN: number; MA: number; BI: number;
}

export interface Thresholds {
  normal: number;
  hard: number;
  extreme: number;
}

export const calculateThresholds = (value: number): Thresholds => ({
  normal: value,
  hard: Math.floor(value / 2),
  extreme: Math.floor(value / 5),
});

export const calculateHitPoints = (ko: number, gr: number): number => Math.floor((ko + gr) / 10);
export const calculateMagicPoints = (ma: number): number => Math.floor(ma / 5);

/** Jeder Punkt Cthulhu-Mythos senkt die maximale Geistige Stabilität dauerhaft um 1. */
export const calculateMaxSanity = (mythosValue: number): number => Math.max(0, 99 - mythosValue);

export interface DamageBonusResult {
  build: number;
  damageBonus: string;
}

/** Schadensbonus & Bauen nach ST+GR (CoC-7e-Standardtabelle, nach oben erweitert). */
export const calculateDamageBonus = (st: number, gr: number): DamageBonusResult => {
  const sum = st + gr;
  const table: { max: number; build: number; db: string }[] = [
    { max: 64, build: -2, db: "-2" },
    { max: 84, build: -1, db: "-1" },
    { max: 124, build: 0, db: "+0" },
    { max: 164, build: 1, db: "+1W4" },
    { max: 204, build: 2, db: "+1W6" },
    { max: 284, build: 3, db: "+2W6" },
    { max: 364, build: 4, db: "+3W6" },
    { max: 444, build: 5, db: "+4W6" },
    { max: 524, build: 6, db: "+5W6" },
  ];
  const found = table.find((row) => sum <= row.max);
  if (found) return { build: found.build, damageBonus: found.db };
  const extraSteps = Math.floor((sum - 524) / 80) + 1;
  return { build: 6 + extraSteps, damageBonus: `+${6 + extraSteps}W6` };
};

export const findSkillValue = (
  skills: { name: string; value: number | string }[],
  namePart: string
): number => {
  const found = skills.find((s) => s.name.toLowerCase().includes(namePart.toLowerCase()));
  if (!found) return 0;
  return typeof found.value === "number" ? found.value : parseInt(String(found.value), 10) || 0;
};

/** Zerlegt einen Schadens-String wie "1W6+SchB" in Basiswürfel + Flag,
 * ob der Schadensbonus automatisch angehängt werden soll. */
export const parseCocDamage = (damageStr: string | undefined): { baseDice: string; useDamageBonus: boolean } => {
  if (!damageStr) return { baseDice: "1W6", useDamageBonus: false };
  const useDamageBonus = /schb/i.test(damageStr);
  const baseDice = damageStr.replace(/\+?\s*schb/i, "").trim() || "1W6";
  return { baseDice, useDamageBonus };
};

export const formatCocDamage = (baseDice: string, useDamageBonus: boolean, damageBonus: string): string => {
  if (!useDamageBonus || damageBonus === "+0") return baseDice;
  return `${baseDice}${damageBonus}`;
};

export const makeId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
