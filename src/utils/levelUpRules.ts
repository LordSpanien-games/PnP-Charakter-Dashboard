import { CharacterData, GameSystem } from '../types';

export interface PathfinderClassPreset {
  id: string;
  name: string;
  aliases: string[];
  hitDie: number;
  babProgression: 'full' | 'threeFourths' | 'half';
  goodSaves: {
    fort: boolean;
    ref: boolean;
    will: boolean;
  };
  skillPointsPerLevel: number;
  classSkills: string[];
  keyFeaturesByLevel?: Record<number, string[]>;
}

export const PATHFINDER_CLASSES: Record<string, PathfinderClassPreset> = {
  rogue: {
    id: 'rogue', name: 'Schurke / Dieb (Rogue)',
    aliases: ['schurke', 'dieb', 'rogue'],
    hitDie: 8, babProgression: 'threeFourths',
    goodSaves: { fort: false, ref: true, will: false },
    skillPointsPerLevel: 8,
    classSkills: [
      'Akrobatik', 'Bluffen', 'Diplomatie', 'Einschüchtern', 'Entfesselungskunst',
      'Fingerfertigkeit', 'Heimlichkeit', 'Klettern', 'Mechanismus ausschalten',
      'Motiv erkennen', 'Schätzen', 'Schwimmen', 'Verkleiden', 'Wahrnehmung',
      'Wissen (Lokales)', 'Zauberkunde'
    ],
    keyFeaturesByLevel: {
      1:  ['Hinterhältiger Angriff +1W6', 'Fallenfinder'],
      2:  ['Entrinnen', 'Schurkentalent'],
      3:  ['Hinterhältiger Angriff +2W6', 'Fallengespür +1'],
      4:  ['Schurkentalent', 'Ungewohntes Ausweichen'],
      5:  ['Hinterhältiger Angriff +3W6'],
      6:  ['Schurkentalent', 'Fallengespür +2'],
      7:  ['Hinterhältiger Angriff +4W6'],
      8:  ['Schurkentalent', 'Verbessertes ungewohntes Ausweichen'],
      9:  ['Hinterhältiger Angriff +5W6', 'Fallengespür +3'],
      10: ['Fortgeschrittenes Schurkentalent', 'Schurkentalent'],
      11: ['Hinterhältiger Angriff +6W6'],
      12: ['Schurkentalent', 'Fallengespür +4'],
      13: ['Hinterhältiger Angriff +7W6'],
      14: ['Schurkentalent'],
      15: ['Hinterhältiger Angriff +8W6', 'Fallengespür +5'],
      16: ['Schurkentalent'],
      17: ['Hinterhältiger Angriff +9W6'],
      18: ['Schurkentalent', 'Fallengespür +6'],
      19: ['Hinterhältiger Angriff +10W6'],
      20: ['Schurkentalent', 'Meisterstreich']
    }
  },
  fighter: {
    id: 'fighter', name: 'Kämpfer (Fighter)',
    aliases: ['kämpfer', 'krieger', 'fighter'],
    hitDie: 10, babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: false },
    skillPointsPerLevel: 2,
    classSkills: ['Einschüchtern', 'Handwerk', 'Klettern', 'Reiten', 'Schwimmen', 'Überleben', 'Wissen (Baukunst)', 'Wissen (Kriegskunst)'],
    keyFeaturesByLevel: {
      1:  ['Kampf-Bonustalent'],
      2:  ['Kampf-Bonustalent', 'Mut +1'],
      3:  ['Rüstungstraining 1'],
      4:  ['Kampf-Bonustalent', 'Attributssteigerung +1'],
      5:  ['Waffentraining 1'],
      6:  ['Kampf-Bonustalent', 'Mut +2'],
      7:  ['Rüstungstraining 2'],
      8:  ['Kampf-Bonustalent', 'Attributssteigerung +1'],
      9:  ['Waffentraining 2'],
      10: ['Kampf-Bonustalent', 'Mut +3'],
      11: ['Rüstungstraining 3'],
      12: ['Kampf-Bonustalent', 'Attributssteigerung +1'],
      13: ['Waffentraining 3'],
      14: ['Kampf-Bonustalent', 'Mut +4'],
      15: ['Rüstungstraining 4'],
      16: ['Kampf-Bonustalent', 'Attributssteigerung +1'],
      17: ['Waffentraining 4'],
      18: ['Kampf-Bonustalent'],
      19: ['Rüstungsbeherrschung'],
      20: ['Waffenbeherrschung', 'Attributssteigerung +1']
    }
  },
  barbarian: {
    id: 'barbarian', name: 'Barbar (Barbarian)',
    aliases: ['barbar', 'barbarian'],
    hitDie: 12, babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: false },
    skillPointsPerLevel: 4,
    classSkills: ['Akrobatik', 'Einschüchtern', 'Handwerk', 'Klettern', 'Mit Tieren umgehen', 'Reiten', 'Schwimmen', 'Überleben', 'Wahrnehmung'],
    keyFeaturesByLevel: {
      1:  ['Kampfrausch', 'Schnelle Bewegung (+3m)'],
      2:  ['Kampfrauschkraft', 'Ungewohntes Ausweichen'],
      3:  ['Fallengespür +1'],
      4:  ['Kampfrauschkraft', 'Attributssteigerung +1'],
      5:  ['Verbessertes ungewohntes Ausweichen'],
      6:  ['Kampfrauschkraft', 'Fallengespür +2'],
      7:  ['Schadensreduzierung 1/-'],
      8:  ['Kampfrauschkraft', 'Attributssteigerung +1'],
      9:  ['Fallengespür +3'],
      10: ['Kampfrauschkraft', 'Schadensreduzierung 2/-'],
      12: ['Attributssteigerung +1'],
      16: ['Attributssteigerung +1'],
      20: ['Mächtiger Kampfrausch', 'Attributssteigerung +1']
    }
  },
  wizard: {
    id: 'wizard', name: 'Magier (Wizard)',
    aliases: ['magier', 'wizard'],
    hitDie: 6, babProgression: 'half',
    goodSaves: { fort: false, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Handwerk', 'Beruf', 'Fliegen', 'Sprachenkunde', 'Wissen (alle)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1:  ['Zauberbuch', 'Arkane Bindung', 'Arkane Schule', 'Schreibtalent'],
      4:  ['Attributssteigerung +1'],
      5:  ['Magier-Bonustalent'],
      8:  ['Attributssteigerung +1'],
      10: ['Magier-Bonustalent'],
      12: ['Attributssteigerung +1'],
      15: ['Magier-Bonustalent'],
      16: ['Attributssteigerung +1'],
      20: ['Magier-Bonustalent', 'Attributssteigerung +1']
    }
  },
  cleric: {
    id: 'cleric', name: 'Kleriker (Cleric)',
    aliases: ['kleriker', 'priester', 'cleric'],
    hitDie: 8, babProgression: 'threeFourths',
    goodSaves: { fort: true, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Diplomatie', 'Heilkunde', 'Motiv erkennen', 'Wissen (Geschichte)', 'Wissen (Die Ebenen)', 'Wissen (Religion)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1:  ['Aura', 'Domänen', 'Energie fokussieren (1W6)', 'Spontane Zauber'],
      3:  ['Energie fokussieren 2W6'],
      4:  ['Attributssteigerung +1'],
      5:  ['Energie fokussieren 3W6'],
      7:  ['Energie fokussieren 4W6'],
      8:  ['Attributssteigerung +1'],
      9:  ['Energie fokussieren 5W6'],
      12: ['Attributssteigerung +1'],
      16: ['Attributssteigerung +1'],
      20: ['Attributssteigerung +1']
    }
  },
  ranger: {
    id: 'ranger', name: 'Waldläufer (Ranger)',
    aliases: ['waldläufer', 'ranger'],
    hitDie: 10, babProgression: 'full',
    goodSaves: { fort: true, ref: true, will: false },
    skillPointsPerLevel: 6,
    classSkills: ['Heimlichkeit', 'Klettern', 'Mit Tieren umgehen', 'Reiten', 'Schwimmen', 'Überleben', 'Wahrnehmung', 'Wissen (Natur)'],
    keyFeaturesByLevel: {
      1:  ['Erzfeind 1', 'Spuren lesen', 'Wildes Gespür'],
      2:  ['Kampfstil-Talent'],
      3:  ['Bevorzugtes Gelände 1', 'Ausdauer'],
      4:  ['Bund des Jägers', 'Attributssteigerung +1'],
      5:  ['Erzfeind 2'],
      6:  ['Kampfstil-Talent'],
      7:  ['Bevorzugtes Gelände 2'],
      8:  ['Schnelle Spurensuche', 'Attributssteigerung +1'],
      10: ['Erzfeind 3', 'Kampfstil-Talent'],
      12: ['Attributssteigerung +1'],
      15: ['Erzfeind 4'],
      16: ['Attributssteigerung +1'],
      20: ['Erzfeind 5', 'Meisterhafte Jagd', 'Attributssteigerung +1']
    }
  },
  paladin: {
    id: 'paladin', name: 'Paladin',
    aliases: ['paladin'],
    hitDie: 10, babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Diplomatie', 'Heilkunde', 'Mit Tieren umgehen', 'Motiv erkennen', 'Reiten', 'Wissen (Religion)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1:  ['Aura des Guten', 'Böses erkennen', 'Böses niederstrecken 1/Tag'],
      2:  ['Göttliche Anmut', 'Handauflegen'],
      3:  ['Aura des Mutes', 'Göttliche Gesundheit', 'Gnade 1'],
      4:  ['Kanalisieren', 'Zauber vorbereiten', 'Attributssteigerung +1'],
      5:  ['Böses niederstrecken 2/Tag'],
      8:  ['Attributssteigerung +1'],
      9:  ['Böses niederstrecken 3/Tag'],
      12: ['Attributssteigerung +1'],
      16: ['Attributssteigerung +1'],
      20: ['Heilige Entschlossenheit', 'Attributssteigerung +1']
    }
  },
  monk: {
    id: 'monk', name: 'Mönch (Monk)',
    aliases: ['mönch', 'monk'],
    hitDie: 8, babProgression: 'threeFourths',
    goodSaves: { fort: true, ref: true, will: true },
    skillPointsPerLevel: 4,
    classSkills: ['Akrobatik', 'Einschüchtern', 'Entfesselungskunst', 'Heimlichkeit', 'Klettern', 'Motiv erkennen', 'Schwimmen', 'Wahrnehmung'],
    keyFeaturesByLevel: {
      1:  ['Waffenloser Schlag', 'Bonustalent', 'Schlaghagel', 'Betäubender Schlag'],
      2:  ['Ausweichen', 'Entrinnen', 'Bonustalent'],
      3:  ['Schnelle Bewegung (+3m)', 'Ki-Vorrat'],
      4:  ['Verlangsamter Fall', 'Ki-Schlag (Magisch)', 'Attributssteigerung +1'],
      5:  ['Bonustalent', 'Stilles Gemüt'],
      6:  ['Schlaghagel-Verbesserung', 'Ki-Schlag (Gesetzlich)'],
      7:  ['Windgang', 'Wholeness of Body'],
      8:  ['Attributssteigerung +1'],
      9:  ['Verbessertes ungewohntes Ausweichen'],
      10: ['Bonustalent', 'Ki-Schlag (Silber/Kalt Eisen)'],
      12: ['Attributssteigerung +1'],
      16: ['Attributssteigerung +1'],
      20: ['Vollkommene Seele', 'Attributssteigerung +1']
    }
  },
  sorcerer: {
    id: 'sorcerer', name: 'Hexenmeister (Sorcerer)',
    aliases: ['hexenmeister', 'sorcerer'],
    hitDie: 6, babProgression: 'half',
    goodSaves: { fort: false, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Bluffen', 'Einschüchtern', 'Fliegen', 'Handwerk', 'Beruf', 'Zauberkunde', 'Wissen (Arkanes)'],
    keyFeaturesByLevel: {
      1:  ['Blutlinie', 'Blutlinienkraft', 'Einfache Waffen'],
      3:  ['Blutlinien-Zauber 1'],
      4:  ['Attributssteigerung +1'],
      5:  ['Blutlinien-Zauber 2'],
      7:  ['Blutlinien-Talent'],
      8:  ['Attributssteigerung +1'],
      9:  ['Blutlinien-Zauber 3'],
      11: ['Blutlinien-Talent'],
      12: ['Attributssteigerung +1'],
      13: ['Blutlinien-Zauber 4'],
      15: ['Blutlinien-Talent'],
      16: ['Attributssteigerung +1'],
      17: ['Blutlinien-Zauber 5'],
      19: ['Blutlinien-Kraft (große)'],
      20: ['Blutlinien-Meisterschaft', 'Attributssteigerung +1']
    }
  },
  bard: {
    id: 'bard', name: 'Barde (Bard)',
    aliases: ['barde', 'bard'],
    hitDie: 8, babProgression: 'threeFourths',
    goodSaves: { fort: false, ref: true, will: true },
    skillPointsPerLevel: 6,
    classSkills: ['Akrobatik', 'Auftreten', 'Bluffen', 'Diplomatie', 'Einschüchtern', 'Entfesselungskunst', 'Heimlichkeit', 'Motiv erkennen', 'Schätzen', 'Wahrnehmung', 'Wissen (alle)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1:  ['Bardenauftritt', 'Bardenwissen', 'Faszinieren', 'Mut zusprechen +1'],
      2:  ['Vielseitige Darbietung 1', 'Bewandert'],
      3:  ['Inspirierende Kompetenz +2'],
      4:  ['Attributssteigerung +1'],
      5:  ['Mut zusprechen +2', 'Lore Master 1'],
      6:  ['Vielseitige Darbietung 2'],
      7:  ['Expertenwissen'],
      8:  ['Attributssteigerung +1'],
      9:  ['Inspirierende Kompetenz +4'],
      10: ['Mut zusprechen +3', 'Lore Master 2'],
      12: ['Attributssteigerung +1'],
      16: ['Attributssteigerung +1'],
      20: ['Meisterbarde', 'Attributssteigerung +1']
    }
  }
};

// ── Hilfsfunktionen ────────────────────────────────────────

export const calculateBAB = (level: number, progression: 'full' | 'threeFourths' | 'half'): number => {
  if (level <= 0) return 0;
  if (progression === 'full') return level;
  if (progression === 'threeFourths') return Math.floor(level * 0.75);
  return Math.floor(level * 0.5);
};

export const formatBABAttacks = (bab: number): string => {
  const attacks: string[] = [];
  let current = bab;
  while (current > 0) { attacks.push(`+${current}`); current -= 5; }
  return attacks.length > 0 ? attacks.join(' / ') : '+0';
};

export const calculateBaseSave = (level: number, isGood: boolean): number => {
  if (level <= 0) return 0;
  return isGood ? 2 + Math.floor(level / 2) : Math.floor(level / 3);
};

export const isAttributeIncreaseLevel = (level: number): boolean =>
  level > 0 && level % 4 === 0;

export const isGeneralFeatLevel = (level: number): boolean =>
  level > 0 && level % 2 === 1;

export const parseLevelAndClass = (subTitle: string = ''): {
  level: number;
  className: string;
  matchedClassId?: string;
  race?: string;
} => {
  let level = 1;
  let className = 'Klasse';
  let matchedClassId: string | undefined;
  let race: string | undefined;

  const s = subTitle.trim();
  const levelMatch = s.match(/(?:level|stufe|lvl)\s*(\d+)/i) ||
    s.match(/(\d+)\.\s*(?:stufe|level)/i) || s.match(/\b(\d+)\b/);
  if (levelMatch) {
    const parsed = parseInt(levelMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) level = parsed;
  }

  const lower = s.toLowerCase();
  for (const [id, cls] of Object.entries(PATHFINDER_CLASSES)) {
    if (cls.aliases.some((a) => lower.includes(a))) {
      matchedClassId = id;
      className = cls.name;
      break;
    }
  }

  if (lower.includes('gnom')) race = 'Gnom';
  else if (lower.includes('mensch')) race = 'Mensch';
  else if (lower.includes('halbelf')) race = 'Halbelf';
  else if (lower.includes('elf')) race = 'Elf';
  else if (lower.includes('zwerg')) race = 'Zwerg';
  else if (lower.includes('halbork') || lower.includes('halborc')) race = 'Halbork';
  else if (lower.includes('halbling')) race = 'Halbling';

  return { level, className, matchedClassId, race };
};

// ── Shadowrun Karma-Regeln ─────────────────────────────────

export interface ShadowrunKarmaCostRule {
  category: string;
  formula: string;
  example: string;
  notes: string;
}

export const SHADOWRUN_KARMA_RULES: ShadowrunKarmaCostRule[] = [
  { category: 'Attribut steigern',           formula: 'Neue Stufe × 5 Karma',        example: 'Stärke 3→4 = 20 Karma',              notes: 'Max Rassen-Attributsmaximum.' },
  { category: 'Aktionsfertigkeit steigern',  formula: 'Neue Stufe × 2 Karma',        example: 'Pistolen 4→5 = 10 Karma',            notes: 'Neu auf Stufe 1 = 2 Karma.' },
  { category: 'Fertigkeitsspezialisierung',  formula: '7 Karma pauschal',            example: 'Pistolen (Halbautomatik) = 7 Karma', notes: '+2 Würfelpool.' },
  { category: 'Fertigkeitsgruppe steigern',  formula: 'Neue Stufe × 5 Karma',        example: 'Feuerwaffen 2→3 = 15 Karma',         notes: 'Nur ungeteilt.' },
  { category: 'Wissens-/Sprachfertigkeit',   formula: 'Neue Stufe × 1 Karma',        example: 'Straßenwissen 3→4 = 4 Karma',        notes: 'Neu = 1 Karma.' },
  { category: 'Neuer Zauber',                formula: '5 Karma pauschal',            example: 'Heilung = 5 Karma',                  notes: 'Erfordert Formel oder Lehrer.' },
  { category: 'Komplexe Form',               formula: '4 Karma pauschal',            example: 'Resonanzspitze = 4 Karma',           notes: 'Für Technomancer.' },
  { category: 'Initiation',                  formula: '10 + (Grad × 3) Karma',       example: 'Grad 1 = 13 Karma',                  notes: 'Schaltet Metamagie frei.' },
  { category: 'Vorteil nachträglich',        formula: 'Doppelte Karma-Kosten',       example: 'Beidhändigkeit (4) = 8 Karma',       notes: 'SL-Zustimmung nötig.' },
];

// ── CoC Entwicklungsphase ──────────────────────────────────

export const COC_DEVELOPMENT_GUIDE = {
  title: 'Call of Cthulhu 7e: Entwicklungsphase',
  steps: [
    {
      title: '1. Fertigkeits-Steigerungsproben',
      description: 'Für jede Fertigkeit mit Häkchen: W100 würfeln.',
      rules: 'Ergebnis HÖHER als aktueller Wert → +1W10 auf die Fertigkeit.'
    },
    {
      title: '2. Geistige Stabilität',
      description: 'Nach erfolgreichem Abschluss: Stabilität zurück.',
      rules: '1W4 bis 1W10 Punkte. Max: 99 minus Cthulhu-Mythos-Wert.'
    },
  ]
};

// ── Pathfinder XP-Tabelle ──────────────────────────────────

export interface XpTrackThresholds {
  fast:   number[];
  medium: number[];
  slow:   number[];
}

export const PATHFINDER_XP_TABLE: XpTrackThresholds = {
  fast: [
    0, 1300, 3300, 6000, 10000, 15000, 23000, 34000, 50000, 71000,
    105000, 145000, 210000, 295000, 425000, 600000, 850000, 1200000, 1700000, 2400000
  ],
  medium: [
    0, 2000, 5000, 9000, 15000, 23000, 35000, 51000, 75000, 105000,
    155000, 220000, 315000, 445000, 635000, 890000, 1300000, 1800000, 2550000, 3600000
  ],
  slow: [
    0, 3000, 7500, 14000, 23000, 35000, 53000, 77000, 115000, 160000,
    235000, 330000, 475000, 670000, 955000, 1335000, 1900000, 2700000, 3850000, 5350000
  ]
};

export function extractCharacterLevel(subTitle?: string): number {
  if (!subTitle) return 1;
  const match = subTitle.match(/(?:level|stufe|grad)\s*(\d+)/i);
  if (match && match[1]) {
    const lvl = parseInt(match[1], 10);
    if (!isNaN(lvl) && lvl >= 1 && lvl <= 20) return lvl;
  }
  return 1;
}

export function getXpThresholdForLevel(
  level: number,
  track: 'fast' | 'medium' | 'slow' = 'medium'
): number {
  const table = PATHFINDER_XP_TABLE[track];
  const idx = Math.max(0, Math.min(level - 1, table.length - 1));
  return table[idx];
}

export interface LevelUpXpStatus {
  currentLevel:       number;
  nextLevel:          number;
  currentXp:          number;
  nextLevelXp:        number;
  remainingXp:        number;
  progressPercent:    number;
  isReadyForLevelUp:  boolean;
  track:              'fast' | 'medium' | 'slow';
}

export function calculateXpStatus(
  currentXp: number,
  subTitle?: string,
  track: 'fast' | 'medium' | 'slow' = 'medium'
): LevelUpXpStatus {
  const currentLevel       = extractCharacterLevel(subTitle);
  const nextLevel          = Math.min(currentLevel + 1, 20);
  const currentLevelFloorXp = getXpThresholdForLevel(currentLevel, track);
  const nextLevelThresholdXp = getXpThresholdForLevel(nextLevel, track);
  const remainingXp        = Math.max(0, nextLevelThresholdXp - currentXp);
  const isReadyForLevelUp  = currentXp >= nextLevelThresholdXp && currentLevel < 20;
  const levelSpan          = Math.max(1, nextLevelThresholdXp - currentLevelFloorXp);
  const gainedInLevel      = Math.max(0, currentXp - currentLevelFloorXp);
  const progressPercent    = Math.min(100, Math.round((gainedInLevel / levelSpan) * 100));

  return {
    currentLevel, nextLevel, currentXp,
    nextLevelXp: nextLevelThresholdXp,
    remainingXp, progressPercent, isReadyForLevelUp, track
  };
}
