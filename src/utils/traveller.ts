import { Stat } from '../types';

export interface TravellerCharacteristic {
  code: string;
  name: string;
  value: number;
  currentValue: number;
  damage: number;
  dm: number;
  effectiveDm: number;
  isPhysical: boolean;
}

export interface TravellerHealthState {
  str: TravellerCharacteristic;
  dex: TravellerCharacteristic;
  end: TravellerCharacteristic;
  int: TravellerCharacteristic;
  edu: TravellerCharacteristic;
  soc: TravellerCharacteristic;
  psi?: TravellerCharacteristic;
  upp: string;
  currentUpp: string;
  totalPhysicalMax: number;
  totalPhysicalCurrent: number;
  totalDamage: number;
  unconscious: boolean;
  critical: boolean;
  dying: boolean;
  dead: boolean;
  statusLabel: string;
  statusColor: string;
}

export interface TravellerDifficulty {
  name: string;
  target: number;
  description: string;
}

export const TRAVELLER_DIFFICULTIES: TravellerDifficulty[] = [
  { name: 'Sehr Einfach (Simple)', target: 2, description: 'Praktisch automatisch, nur bei extremem Pech' },
  { name: 'Einfach (Easy)', target: 4, description: 'Grundlegende Routinetätigkeit unter normalen Bedingungen' },
  { name: 'Routine (Routine)', target: 6, description: 'Geübte Standardtätigkeit ohne Zeitdruck' },
  { name: 'Durchschnitt (Average)', target: 8, description: 'Standard-Schwierigkeit für typische Proben (8+)' },
  { name: 'Schwierig (Difficult)', target: 10, description: 'Anspruchsvoll, Stresssituation oder komplexe Aufgabe' },
  { name: 'Sehr Schwierig (Very Difficult)', target: 12, description: 'Erfordert Meisterschaft und Glück' },
  { name: 'Furchterregend (Formidable)', target: 14, description: 'Nahezu unmögliche Heldentat' },
  { name: 'Unmöglich (Impossible)', target: 16, description: 'Physikalisches Grenzphänomen' },
];

/**
 * Calculates standard Mongoose / Classic Traveller Dice Modifier (DM)
 * 0: -3
 * 1-2: -2
 * 3-5: -1
 * 6-8: 0
 * 9-11: +1
 * 12-14: +2
 * 15+: +3
 */
export function getTravellerDM(value: number | string): number {
  const num = typeof value === 'number' ? value : parseInt(value.toString().replace(/[+]/g, ''), 10) || 0;
  if (num <= 0) return -3;
  if (num <= 2) return -2;
  if (num <= 5) return -1;
  if (num <= 8) return 0;
  if (num <= 11) return 1;
  if (num <= 14) return 2;
  return 3;
}

export function formatTravellerDM(dm: number): string {
  if (dm > 0) return `+${dm}`;
  if (dm === 0) return `+0`;
  return `${dm}`;
}

export function toPseudoHex(val: number): string {
  if (val < 0) return '0';
  if (val < 10) return val.toString();
  if (val === 10) return 'A';
  if (val === 11) return 'B';
  if (val === 12) return 'C';
  if (val === 13) return 'D';
  if (val === 14) return 'E';
  if (val >= 15) return 'F';
  return val.toString();
}

export function parseNum(val: string | number | undefined, defaultVal = 7): number {
  if (val === undefined || val === null) return defaultVal;
  const num = typeof val === 'number' ? val : parseInt(val.toString().replace(/[+]/g, ''), 10);
  return isNaN(num) ? defaultVal : num;
}

export function parseTravellerCharacteristics(
  characteristics: Stat[] = [],
  stats: Stat[] = []
): TravellerHealthState {
  const findChar = (keys: string[], defaultVal = 7): { base: number; damage: number; statObj?: Stat } => {
    // Check characteristics list first
    let item = characteristics.find(c =>
      keys.some(k => c.label.toLowerCase() === k.toLowerCase() || c.label.toLowerCase().startsWith(k.toLowerCase()))
    );
    // If not found, check stats list
    if (!item) {
      item = stats.find(s =>
        keys.some(k => s.label.toLowerCase() === k.toLowerCase() || s.label.toLowerCase().startsWith(k.toLowerCase()))
      );
    }
    const base = parseNum(item?.value, defaultVal);
    const damage = Math.max(0, item?.damage || 0);
    return { base, damage, statObj: item };
  };

  const strData = findChar(['STR', 'Stärke', 'Strength'], 7);
  const dexData = findChar(['DEX', 'Geschick', 'Dexterity', 'GES'], 7);
  const endData = findChar(['END', 'Ausdauer', 'Endurance', 'AUS'], 7);
  const intData = findChar(['INT', 'Intelligenz', 'Intelligence'], 7);
  const eduData = findChar(['EDU', 'Bildung', 'Education', 'BIL'], 7);
  const socData = findChar(['SOC', 'Sozialstatus', 'Social', 'SOZ'], 7);

  const makeChar = (code: string, name: string, data: { base: number; damage: number }, isPhysical: boolean): TravellerCharacteristic => {
    const value = data.base;
    const damage = data.damage;
    const currentValue = Math.max(0, value - damage);
    const dm = getTravellerDM(value);
    const effectiveDm = getTravellerDM(currentValue);
    return {
      code,
      name,
      value,
      currentValue,
      damage,
      dm,
      effectiveDm,
      isPhysical
    };
  };

  const str = makeChar('STR', 'Stärke', strData, true);
  const dex = makeChar('DEX', 'Geschicklichkeit', dexData, true);
  const end = makeChar('END', 'Ausdauer', endData, true);
  const int = makeChar('INT', 'Intelligenz', intData, false);
  const edu = makeChar('EDU', 'Bildung', eduData, false);
  const soc = makeChar('SOC', 'Sozialstatus', socData, false);

  const upp = `${toPseudoHex(str.value)}${toPseudoHex(dex.value)}${toPseudoHex(end.value)}${toPseudoHex(int.value)}${toPseudoHex(edu.value)}${toPseudoHex(soc.value)}`;
  const currentUpp = `${toPseudoHex(str.currentValue)}${toPseudoHex(dex.currentValue)}${toPseudoHex(end.currentValue)}${toPseudoHex(int.currentValue)}${toPseudoHex(edu.currentValue)}${toPseudoHex(soc.currentValue)}`;

  const totalPhysicalMax = str.value + dex.value + end.value;
  const totalPhysicalCurrent = str.currentValue + dex.currentValue + end.currentValue;
  const totalDamage = str.damage + dex.damage + end.damage;

  const zeroesCount = [str.currentValue === 0, dex.currentValue === 0, end.currentValue === 0].filter(Boolean).length;

  const dead = zeroesCount === 3;
  const dying = zeroesCount === 2;
  const unconscious = zeroesCount >= 1;
  const critical = zeroesCount >= 2;

  let statusLabel = 'Einsatzbereit & Stabil';
  let statusColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-800/40';

  if (dead) {
    statusLabel = 'GEFALLEN / VERSTORBEN (Alle 3 Physischen Attribute auf 0)';
    statusColor = 'text-red-500 bg-red-950/40 border-red-600 animate-pulse';
  } else if (dying) {
    statusLabel = 'STERBEND / KRITISCH (2 Physische Attribute auf 0)';
    statusColor = 'text-red-400 bg-red-950/30 border-red-500 animate-pulse';
  } else if (unconscious) {
    statusLabel = 'BEWUSSTLOS / SCHWER VERWUNDET (1 Physisches Attribut auf 0)';
    statusColor = 'text-amber-400 bg-amber-950/30 border-amber-500';
  } else if (totalDamage > 0) {
    statusLabel = `Leicht verwundet (${totalDamage} Schadenspunkte erlitten)`;
    statusColor = 'text-yellow-400 bg-yellow-950/20 border-yellow-800/40';
  }

  return {
    str,
    dex,
    end,
    int,
    edu,
    soc,
    upp,
    currentUpp,
    totalPhysicalMax,
    totalPhysicalCurrent,
    totalDamage,
    unconscious,
    critical,
    dying,
    dead,
    statusLabel,
    statusColor
  };
}

/**
 * Traveller 2D6 Probability Tables
 * Standard 2D6 roll outcomes (36 total combinations)
 */
export function calculateTravellerProbability(
  totalBonus: number,
  targetDifficulty: number,
  rollMode: 'normal' | 'boon' | 'bane' = 'normal'
): {
  successChance: number;
  critSuccessChance: number;
  fumbleChance: number;
  distribution: { roll: number; prob: number; totalWithBonus: number; isSuccess: boolean }[];
} {
  const combinations: { total: number; d1: number; d2: number; d3?: number }[] = [];

  if (rollMode === 'normal') {
    // 36 combos of 2D6
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        combinations.push({ total: d1 + d2, d1, d2 });
      }
    }
  } else if (rollMode === 'boon') {
    // 216 combos of 3D6, keep 2 highest
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        for (let d3 = 1; d3 <= 6; d3++) {
          const dice = [d1, d2, d3].sort((a, b) => b - a);
          combinations.push({ total: dice[0] + dice[1], d1, d2, d3 });
        }
      }
    }
  } else {
    // 216 combos of 3D6, keep 2 lowest
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        for (let d3 = 1; d3 <= 6; d3++) {
          const dice = [d1, d2, d3].sort((a, b) => a - b);
          combinations.push({ total: dice[0] + dice[1], d1, d2, d3 });
        }
      }
    }
  }

  const totalCombos = combinations.length;
  let successCount = 0;
  let critSuccessCount = 0; // Natural 12
  let fumbleCount = 0; // Natural 2

  const counts: Record<number, number> = {};
  for (let r = 2; r <= 12; r++) counts[r] = 0;

  combinations.forEach(c => {
    counts[c.total] = (counts[c.total] || 0) + 1;
    if (c.total === 12) critSuccessCount++;
    if (c.total === 2) fumbleCount++;

    const rollWithBonus = c.total + totalBonus;
    if (c.total === 12 || (rollWithBonus >= targetDifficulty && c.total !== 2)) {
      successCount++;
    }
  });

  const successChance = Math.round((successCount / totalCombos) * 1000) / 10;
  const critSuccessChance = Math.round((critSuccessCount / totalCombos) * 1000) / 10;
  const fumbleChance = Math.round((fumbleCount / totalCombos) * 1000) / 10;

  const distribution = Object.entries(counts).map(([rollStr, count]) => {
    const roll = parseInt(rollStr, 10);
    const prob = Math.round((count / totalCombos) * 1000) / 10;
    const totalWithBonus = roll + totalBonus;
    const isSuccess = roll === 12 || (totalWithBonus >= targetDifficulty && roll !== 2);
    return {
      roll,
      prob,
      totalWithBonus,
      isSuccess
    };
  });

  return {
    successChance,
    critSuccessChance,
    fumbleChance,
    distribution
  };
}

/**
 * Traveller Skill to Characteristic mapping for common skills
 */
export const TRAVELLER_SKILL_TO_ATTRIBUTE_MAP: Record<string, string> = {
  // Combat & Physical
  'schusswaffen': 'DEX',
  'gun combat': 'DEX',
  'pistole': 'DEX',
  'gewehr': 'DEX',
  'energie': 'DEX',
  'schwerelosigkeit': 'DEX',
  'zero-g': 'DEX',
  'nahkampf': 'STR',
  'melee': 'STR',
  'athletik': 'STR',
  'athletics': 'STR',
  'überleben': 'END',
  'survival': 'END',
  'ausdauer': 'END',
  'heimlichkeit': 'DEX',
  'stealth': 'DEX',
  'schwere waffen': 'STR',
  'heavy weapons': 'STR',

  // Vehicle & Technical
  'pilot': 'DEX',
  'fahren': 'DEX',
  'drive': 'DEX',
  'fliegen': 'DEX',
  'flyer': 'DEX',
  'seefahrt': 'INT',
  'seafarer': 'INT',
  'astrogation': 'EDU',
  'navigation': 'INT',
  'elektronik': 'INT',
  'electronics': 'INT',
  'sensoren': 'INT',
  'computer': 'INT',
  'mechanik': 'EDU',
  'mechanic': 'EDU',
  'technik': 'EDU',
  'engineer': 'EDU',
  'ingenieur': 'EDU',

  // Knowledge & Science
  'medizin': 'EDU',
  'medic': 'EDU',
  'wissenschaft': 'EDU',
  'science': 'EDU',
  'sprachen': 'EDU',
  'language': 'EDU',
  'ermittlung': 'INT',
  'investigate': 'INT',
  'wahrnehmung': 'INT',
  'recon': 'INT',

  // Social & Trade
  'überreden': 'SOC',
  'persuade': 'SOC',
  'diplomatie': 'SOC',
  'diplomat': 'SOC',
  'täuschung': 'SOC',
  'deception': 'SOC',
  'handeln': 'SOC',
  'broker': 'SOC',
  'feilschen': 'SOC',
  'verwaltung': 'EDU',
  'admin': 'EDU',
  'anführen': 'SOC',
  'leadership': 'SOC',
  'straßenwissen': 'SOC',
  'streetwise': 'SOC',
  'glücksspiel': 'INT',
  'gambler': 'INT',
  'einschüchtern': 'STR',
};
