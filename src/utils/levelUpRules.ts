import { CharacterData, GameSystem } from '../types';

export interface PathfinderClassPreset {
  id: string;
  name: string;
  hitDie: number; // e.g. 8 for W8
  babProgression: 'full' | 'threeFourths' | 'half';
  goodSaves: {
    fort: boolean;
    ref: boolean;
    will: boolean;
  };
  skillPointsPerLevel: number; // e.g. 8 for Rogue
  classSkills: string[];
  keyFeaturesByLevel?: Record<number, string[]>;
}

export const PATHFINDER_CLASSES: Record<string, PathfinderClassPreset> = {
  rogue: {
    id: 'rogue',
    name: 'Schurke / Dieb (Rogue)',
    hitDie: 8,
    babProgression: 'threeFourths',
    goodSaves: { fort: false, ref: true, will: false },
    skillPointsPerLevel: 8,
    classSkills: [
      'Akrobatik', 'Bluffen', 'Diplomatie', 'Entfesselungskunst', 'Einschüchtern',
      'Entdecken / Wahrnehmung', 'Fahrzeug lenken', 'Fingerfertigkeit', 'Heimlichkeit',
      'Klettern', 'Mechanismus ausschalten', 'Motiv erkennen', 'Schätzen', 'Schwimmen',
      'Verkleiden', 'Wahrnehmung', 'Wissen (Lokales)', 'Wissen (Gewölbekunde)', 'Zauberkunde'
    ],
    keyFeaturesByLevel: {
      1: ['Hinterhältiger Angriff +1W6', 'Fallenfinder'],
      2: ['Entrinnen', 'Schurkentalent'],
      3: ['Hinterhältiger Angriff +2W6', 'Fallengespür +1'],
      4: ['Schurkentalent', 'Ungewohntes Ausweichen'],
      5: ['Hinterhältiger Angriff +3W6'],
      6: ['Schurkentalent', 'Fallengespür +2'],
      7: ['Hinterhältiger Angriff +4W6'],
      8: ['Schurkentalent', 'Verbessertes ungewohntes Ausweichen'],
      9: ['Hinterhältiger Angriff +5W6', 'Fallengespür +3'],
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
    id: 'fighter',
    name: 'Kämpfer (Fighter)',
    hitDie: 10,
    babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: false },
    skillPointsPerLevel: 2,
    classSkills: ['Einschüchtern', 'Handwerk', 'Klettern', 'Reiten', 'Schwimmen', 'Überlebenskunst', 'Wissen (Baukunst)', 'Wissen (Kriegskunst)'],
    keyFeaturesByLevel: {
      1: ['Kampf-Bonustalent'],
      2: ['Kampf-Bonustalent', 'Mut +1'],
      3: ['Rüstungstraining 1'],
      4: ['Kampf-Bonustalent'],
      5: ['Waffentraining 1'],
      6: ['Kampf-Bonustalent', 'Mut +2'],
      7: ['Rüstungstraining 2'],
      8: ['Kampf-Bonustalent'],
      9: ['Waffentraining 2'],
      10: ['Kampf-Bonustalent', 'Mut +3']
    }
  },
  barbarian: {
    id: 'barbarian',
    name: 'Barbar (Barbarian)',
    hitDie: 12,
    babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: false },
    skillPointsPerLevel: 4,
    classSkills: ['Akrobatik', 'Einschüchtern', 'Handwerk', 'Klettern', 'Mit Tieren umgehen', 'Reiten', 'Schwimmen', 'Überlebenskunst', 'Wahrnehmung'],
    keyFeaturesByLevel: {
      1: ['Kampfrausch', 'Schnelle Bewegung (+3m)'],
      2: ['Kampfrauschkraft', 'Ungewohntes Ausweichen'],
      3: ['Fallengespür +1'],
      4: ['Kampfrauschkraft'],
      5: ['Verbessertes ungewohntes Ausweichen'],
      6: ['Kampfrauschkraft', 'Fallengespür +2'],
      7: ['Schadensreduzierung 1/-']
    }
  },
  wizard: {
    id: 'wizard',
    name: 'Magier (Wizard)',
    hitDie: 6,
    babProgression: 'half',
    goodSaves: { fort: false, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Handwerk', 'Beruf', 'Fliegen', 'Sprachenkunde', 'Wissen (alle)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1: ['Zauberbuch', 'Arkane Bindung', 'Arkane Schule', 'Schreibtalent'],
      5: ['Magier-Bonustalent'],
      10: ['Magier-Bonustalent'],
      15: ['Magier-Bonustalent'],
      20: ['Magier-Bonustalent']
    }
  },
  cleric: {
    id: 'cleric',
    name: 'Kleriker (Cleric)',
    hitDie: 8,
    babProgression: 'threeFourths',
    goodSaves: { fort: true, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Diplomatie', 'Heilkunde', 'Motiv erkennen', 'Wissen (Geschichte)', 'Wissen (Die Ebenen)', 'Wissen (Religion)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1: ['Aura', 'Domänen', 'Energie fokussieren (1W6)', 'Spontane Zauber'],
      3: ['Energie fokussieren 2W6'],
      5: ['Energie fokussieren 3W6'],
      7: ['Energie fokussieren 4W6'],
      9: ['Energie fokussieren 5W6']
    }
  },
  ranger: {
    id: 'ranger',
    name: 'Waldläufer (Ranger)',
    hitDie: 10,
    babProgression: 'full',
    goodSaves: { fort: true, ref: true, will: false },
    skillPointsPerLevel: 6,
    classSkills: ['Heimlichkeit', 'Klettern', 'Mit Tieren umgehen', 'Reiten', 'Schwimmen', 'Spuren lesen', 'Überlebenskunst', 'Wahrnehmung', 'Wissen (Natur)'],
    keyFeaturesByLevel: {
      1: ['Erzfeind 1', 'Spuren lesen', 'Wildes Gespür'],
      2: ['Kampfstil-Talent'],
      3: ['Bevorzugtes Gelände 1', 'Ausdauer'],
      4: ['Bund des Jägers (Tiergefährte / Gefährten)'],
      5: ['Erzfeind 2']
    }
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    hitDie: 10,
    babProgression: 'full',
    goodSaves: { fort: true, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Diplomatie', 'Heilkunde', 'Mit Tieren umgehen', 'Motiv erkennen', 'Reiten', 'Wissen (Religion)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1: ['Aura des Guten', 'Böses erkennen', 'Böses niederstrecken 1/Tag'],
      2: ['Göttliche Anmut', 'Handauflegen'],
      3: ['Aura des Mutes', 'Göttliche Gesundheit', 'Gnade 1'],
      4: ['Kanalisieren', 'Zauber vorbereiten']
    }
  },
  monk: {
    id: 'monk',
    name: 'Mönch (Monk)',
    hitDie: 8,
    babProgression: 'threeFourths',
    goodSaves: { fort: true, ref: true, will: true },
    skillPointsPerLevel: 4,
    classSkills: ['Akrobatik', 'Einschüchtern', 'Entfesselungskunst', 'Heimlichkeit', 'Klettern', 'Motiv erkennen', 'Schwimmen', 'Wahrnehmung'],
    keyFeaturesByLevel: {
      1: ['Waffenloser Schlag', 'Bonustalent', 'Schlaghagel', 'Betäubender Schlag'],
      2: ['Ausweichen', 'Entrinnen', 'Bonustalent'],
      3: ['Schnelle Bewegung (+3m)', 'Ki-Vorrat'],
      4: ['Verlangsamter Fall', 'Ki-Schlag (Magisch)']
    }
  },
  sorcerer: {
    id: 'sorcerer',
    name: 'Hexenmeister (Sorcerer)',
    hitDie: 6,
    babProgression: 'half',
    goodSaves: { fort: false, ref: false, will: true },
    skillPointsPerLevel: 2,
    classSkills: ['Bluffen', 'Einschüchtern', 'Fliegen', 'Handwerk', 'Beruf', 'Zauberkunde', 'Wissen (Arkanes)'],
    keyFeaturesByLevel: {
      1: ['Blutlinie', 'Blutlinienkraft', 'Einfache Waffen'],
      3: ['Blutlinien-Zauber 1'],
      5: ['Blutlinien-Zauber 2'],
      7: ['Blutlinien-Talent']
    }
  },
  bard: {
    id: 'bard',
    name: 'Barde (Bard)',
    hitDie: 8,
    babProgression: 'threeFourths',
    goodSaves: { fort: false, ref: true, will: true },
    skillPointsPerLevel: 6,
    classSkills: ['Akrobatik', 'Auftreten', 'Bluffen', 'Diplomatie', 'Einschüchtern', 'Entfesselungskunst', 'Heimlichkeit', 'Motiv erkennen', 'Schätzen', 'Taschendiebstahl', 'Wahrnehmung', 'Wissen (alle)', 'Zauberkunde'],
    keyFeaturesByLevel: {
      1: ['Bardenauftritt', 'Bardenwissen', 'Faszinieren', 'Mut zusprechen +1'],
      2: ['Vielseitige Darbietung 1', 'Bewandert'],
      3: ['Inspirierende Kompetenz +2'],
      5: ['Mut zusprechen +2']
    }
  }
};

/**
 * Calculates Base Attack Bonus for a given level and progression
 */
export const calculateBAB = (level: number, progression: 'full' | 'threeFourths' | 'half'): number => {
  if (level <= 0) return 0;
  if (progression === 'full') return level;
  if (progression === 'threeFourths') return Math.floor(level * 0.75);
  return Math.floor(level * 0.5);
};

/**
 * Formats multi-attack BAB string, e.g. level 9 full BAB = "+9/+4"
 */
export const formatBABAttacks = (bab: number): string => {
  const attacks: string[] = [];
  let current = bab;
  while (current > 0) {
    attacks.push(`+${current}`);
    current -= 5;
  }
  return attacks.length > 0 ? attacks.join(' / ') : '+0';
};

/**
 * Calculates base saving throw value (Good vs Poor)
 */
export const calculateBaseSave = (level: number, isGood: boolean): number => {
  if (level <= 0) return 0;
  if (isGood) {
    return 2 + Math.floor(level / 2);
  } else {
    return Math.floor(level / 3);
  }
};

/**
 * Checks if a specific level grants an Ability Score Increase (+1 to any stat)
 * In Pathfinder/D20: Levels 4, 8, 12, 16, 20
 */
export const isAttributeIncreaseLevel = (level: number): boolean => {
  return level > 0 && level % 4 === 0;
};

/**
 * Checks if a specific level grants a General Feat (All odd levels: 1, 3, 5, 7, 9, 11, etc.)
 */
export const isGeneralFeatLevel = (level: number): boolean => {
  return level > 0 && level % 2 === 1;
};

/**
 * Attempts to parse character level and class name from a subTitle string
 * e.g. "Level 9 Gnom Dieb" -> { level: 9, className: 'Dieb', matchedClassId: 'rogue' }
 */
export const parseLevelAndClass = (subTitle: string = ''): {
  level: number;
  className: string;
  matchedClassId?: string;
  race?: string;
} => {
  let level = 1;
  let className = 'Klasse';
  let matchedClassId: string | undefined = undefined;
  let race: string | undefined = undefined;

  const s = subTitle.trim();

  // Look for "Level X", "Stufe X", "Lvl X", or numbers
  const levelMatch = s.match(/(?:level|stufe|lvl)\s*(\d+)/i) || s.match(/(\d+)\.\s*(?:stufe|level)/i) || s.match(/\b(\d+)\b/);
  if (levelMatch) {
    const parsed = parseInt(levelMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
      level = parsed;
    }
  }

  // Detect class from text
  const lower = s.toLowerCase();
  if (lower.includes('dieb') || lower.includes('schurke') || lower.includes('rogue')) {
    matchedClassId = 'rogue';
    className = 'Schurke';
  } else if (lower.includes('kämpfer') || lower.includes('fighter') || lower.includes('krieger')) {
    matchedClassId = 'fighter';
    className = 'Kämpfer';
  } else if (lower.includes('barbar') || lower.includes('barbarian')) {
    matchedClassId = 'barbarian';
    className = 'Barbar';
  } else if (lower.includes('magier') || lower.includes('wizard')) {
    matchedClassId = 'wizard';
    className = 'Magier';
  } else if (lower.includes('kleriker') || lower.includes('cleric') || lower.includes('priester')) {
    matchedClassId = 'cleric';
    className = 'Kleriker';
  } else if (lower.includes('waldläufer') || lower.includes('ranger')) {
    matchedClassId = 'ranger';
    className = 'Waldläufer';
  } else if (lower.includes('paladin')) {
    matchedClassId = 'paladin';
    className = 'Paladin';
  } else if (lower.includes('mönch') || lower.includes('monk')) {
    matchedClassId = 'monk';
    className = 'Mönch';
  } else if (lower.includes('hexenmeister') || lower.includes('sorcerer')) {
    matchedClassId = 'sorcerer';
    className = 'Hexenmeister';
  } else if (lower.includes('barde') || lower.includes('bard')) {
    matchedClassId = 'bard';
    className = 'Barde';
  }

  // Detect race
  if (lower.includes('gnom') || lower.includes('gnome')) race = 'Gnom';
  else if (lower.includes('mensch') || lower.includes('human')) race = 'Mensch';
  else if (lower.includes('elf') || lower.includes('elfe')) race = 'Elf';
  else if (lower.includes('zwerg') || lower.includes('dwarf')) race = 'Zwerg';
  else if (lower.includes('halbelf')) race = 'Halbelf';
  else if (lower.includes('halborc') || lower.includes('halbork')) race = 'Halbork';
  else if (lower.includes('halbling') || lower.includes('halfling')) race = 'Halbling';

  return { level, className, matchedClassId, race };
};

export interface ShadowrunKarmaCostRule {
  category: string;
  formula: string;
  example: string;
  notes: string;
}

export const SHADOWRUN_KARMA_RULES: ShadowrunKarmaCostRule[] = [
  {
    category: 'Attribut steigern',
    formula: 'Neue Stufe × 5 Karma',
    example: 'Stärke von 3 auf 4 = 4 × 5 = 20 Karma',
    notes: 'Maximal bis zum Rassen-Attributsmaximum. Magie und Resonanz kosten ebenfalls Neue Stufe × 5.'
  },
  {
    category: 'Aktionsfertigkeit steigern',
    formula: 'Neue Stufe × 2 Karma (ab Stufe 1: 2 Karma)',
    example: 'Pistolen von 4 auf 5 = 5 × 2 = 10 Karma',
    notes: 'Neue Aktionsfertigkeit auf Stufe 1 lernen kostet 2 Karma.'
  },
  {
    category: 'Fertigkeitsspezialisierung',
    formula: '7 Karma pauschal',
    example: 'Pistolen (Halbautomatik) = 7 Karma',
    notes: 'Nur 1 Spezialisierung pro Fertigkeit, gewährt +2 Würfelpool.'
  },
  {
    category: 'Fertigkeitsgruppe steigern',
    formula: 'Neue Stufe × 5 Karma',
    example: 'Feuerwaffen von 2 auf 3 = 3 × 5 = 15 Karma',
    notes: 'Gilt nur, solange keine Einzelfertigkeit der Gruppe spezialisiert wurde.'
  },
  {
    category: 'Wissens- / Sprachfertigkeit',
    formula: 'Neue Stufe × 1 Karma',
    example: 'Straßengerüchte von 3 auf 4 = 4 × 1 = 4 Karma',
    notes: 'Neue Wissensfertigkeit auf Stufe 1 kostet 1 Karma.'
  },
  {
    category: 'Neuer Zauber / Alchemie',
    formula: '5 Karma pauschal',
    example: 'Heilung oder Betäubungsblitz lernen = 5 Karma',
    notes: 'Erfordert Zauberformel oder Lehrer.'
  },
  {
    category: 'Komplexe Form (Technomancer)',
    formula: '4 Karma pauschal',
    example: 'Resonanzspitze lernen = 4 Karma',
    notes: 'Für Technomancer.'
  },
  {
    category: 'Initiation / Wandlung',
    formula: '10 + (Neuer Grad × 3) Karma',
    example: 'Initiationsgrad 1 = 10 + 3 = 13 Karma',
    notes: 'Erhöht maximales Magie/Resonanz-Attribut um +1 und schaltet Metamagie frei. Mit Prüfung/Gruppe evtl. Rabatt.'
  },
  {
    category: 'Vorteil nachträglich erwerben',
    formula: 'Doppelte Karma-Kosten',
    example: 'Vorteil Beidhändigkeit (4 Karma) nachträglich = 8 Karma',
    notes: 'Erfordert Spielleiter-Zustimmung und Rollenspiel-Begründung.'
  }
];

export const COC_DEVELOPMENT_GUIDE = {
  title: 'Call of Cthulhu 7e: Die Ermittler-Entwicklungsphase',
  steps: [
    {
      title: '1. Fertigkeits-Steigerungsproben (Erfahrung)',
      description: 'Für jede Fertigkeit, die im Laufe des Szenarios erfolgreich angewendet wurde (gekennzeichnet durch ein Häkchen), würfelt der Ermittler 1W100.',
      rules: 'Liegt das Wurfergebnis HÖHER als der aktuelle Wert der Fertigkeit (oder ist es 96–100), verbessert sich der Ermittler: Würfle 1W10 und addiere das Ergebnis direkt zum Fertigkeitswert!'
    },
    {
      title: '2. Geistige Stabilität belohnen (Sanity Rewards)',
      description: 'Nach erfolgreichem Abschluss eines Falles oder Meilensteins erhalten die Ermittler Stabilität zurück.',
      rules: 'Typischerweise 1W4 bis 1W10 Punkte Stabilität. Maximaler Wert ist 99 minus aktueller Cthulhu-Mythos-Wert.'
    },
    {
      title: '3. Mythos-Erkenntnisse & Wahnsinn',
      description: 'Gelesene Mythos-Wälzer oder Begegnungen können den Cthulhu-Mythos-Wert dauerhaft steigern.',
      rules: 'Jeder Punkt Cthulhu-Mythos verringert die maximale Geistige Stabilität unwiderruflich um 1 Punkt.'
    },
    {
      title: '4. Finanzkraft & Lebensstil',
      description: 'Prüfung von Einnahmen, Arztrechnungen für psychische Sanatorien und Reisekosten.',
      rules: 'Ggf. Steigerung oder Senkung des Werts Finanzkraft je nach beruflichen Erfolgen oder Verlusten.'
    }
  ]
};

export const TRAVELLER_TRAINING_GUIDE = {
  title: 'Mongoose Traveller 2e: Trainings- & Weiterbildungssystem',
  steps: [
    {
      title: '1. Fertigkeitstraining im Dienst',
      description: 'Ein Charakter kann pro Trainingsabschnitt eine Fertigkeit oder ein Attribut steigern.',
      rules: 'Benötigte Trainingszeit in Wochen = (Neue gewünschte Stufe × 5). Für Stufe 1 werden 5 Wochen intensives Training oder 10 Wochen Nebenbeistudium benötigt.'
    },
    {
      title: '2. Maximales Fertigkeitslimit',
      description: 'Die Gesamtsumme aller Fertigkeitsstufen darf (Intelligenz + Bildung) mal 3 nicht überschreiten.',
      rules: 'Wird das Limit erreicht, müssen ältere Fertigkeiten verrohen oder abgebaut werden, um neue zu meistern.'
    },
    {
      title: '3. Physische Augmentationen & Bionik',
      description: 'Kybernetische Upgrades (Subdermale Panzerung, künstliche Muskeln) steigern Attribute direkt gegen Credits.',
      rules: 'Erfordert Krankenhausaufenthalt und medizinische Betreuung (Medical Check).'
    }
  ]
};
