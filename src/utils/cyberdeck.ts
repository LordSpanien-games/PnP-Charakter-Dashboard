import { 
  ShadowrunCyberdeck, 
  ShadowrunDeckProgram, 
  ShadowrunMatrixAttribute, 
  Stat 
} from '../types';

export interface DeckModelPreset {
  name: string;
  manufacturer: string;
  deviceRating: number;
  attributeArray: [number, number, number, number];
  defaultConfig: {
    attack: number;
    sleaze: number;
    dataProcessing: number;
    firewall: number;
  };
  description: string;
}

export const CYBERDECK_PRESETS: DeckModelPreset[] = [
  // Stufe 1 - 2 (Einsteiger & Street-Tier)
  {
    name: 'Erika MCD-1',
    manufacturer: 'Erika',
    deviceRating: 1,
    attributeArray: [4, 3, 2, 1],
    defaultConfig: { attack: 4, sleaze: 3, dataProcessing: 2, firewall: 1 },
    description: 'Einstiegsdeck für Neulinge und Street-Gangs. Günstig und robust, aber begrenzte Rechenleistung.'
  },
  {
    name: 'Microdeck Summit',
    manufacturer: 'Microdeck Systems',
    deviceRating: 1,
    attributeArray: [4, 3, 3, 1],
    defaultConfig: { attack: 3, sleaze: 4, dataProcessing: 3, firewall: 1 },
    description: 'Kompaktes Leichtbau-Deck für Einsteiger mit solider Signalabschirmung.'
  },
  {
    name: 'Microtronics Azteca 200',
    manufacturer: 'Microtronics',
    deviceRating: 2,
    attributeArray: [5, 4, 3, 2],
    defaultConfig: { attack: 5, sleaze: 4, dataProcessing: 3, firewall: 2 },
    description: 'Beliebtes Arbeitsdeck unter Schmugglern und Runnern mit kleinem Budget.'
  },
  {
    name: 'Hermes Ikon',
    manufacturer: 'Hermes Koop',
    deviceRating: 2,
    attributeArray: [5, 5, 3, 2],
    defaultConfig: { attack: 3, sleaze: 5, dataProcessing: 5, firewall: 2 },
    description: 'Klassisches Allround-Deck für schnelle Datenanalysen und Matrix-Recherche.'
  },

  // Stufe 3 - 4 (Professionelle Runner)
  {
    name: 'Hermetic Water',
    manufacturer: 'Hermetic Corp',
    deviceRating: 3,
    attributeArray: [6, 5, 4, 3],
    defaultConfig: { attack: 6, sleaze: 5, dataProcessing: 4, firewall: 3 },
    description: 'Ausgewogenes Mid-Tier Cyberdeck mit zuverlässigem Kühlsystem und flüssiger Datenverarbeitung.'
  },
  {
    name: 'Renraku Tsurugi',
    manufacturer: 'Renraku Computer Systems',
    deviceRating: 3,
    attributeArray: [6, 5, 5, 3],
    defaultConfig: { attack: 6, sleaze: 5, dataProcessing: 5, firewall: 3 },
    description: 'Der Klassiker für Deck-Krieger. Aggressive Architektur für Brute-Force und Matrix-Infiltration.'
  },
  {
    name: 'Sony CIY-720',
    manufacturer: 'Sony',
    deviceRating: 4,
    attributeArray: [7, 6, 5, 4],
    defaultConfig: { attack: 7, sleaze: 6, dataProcessing: 5, firewall: 4 },
    description: 'High-End Cyberdeck für professionelle Schatten-Decker mit dedizierten Coprozessoren.'
  },
  {
    name: 'Shiawase Cyber-5',
    manufacturer: 'Shiawase Electronics',
    deviceRating: 4,
    attributeArray: [8, 6, 5, 3],
    defaultConfig: { attack: 8, sleaze: 6, dataProcessing: 5, firewall: 3 },
    description: 'Schlagkräftiges Kampf-Deck für Sicherheitskräfte und schwere Angriffsoperationen.'
  },

  // Stufe 5 - 6 (High-End & Elite-Decker)
  {
    name: 'Fairlight Caliban',
    manufacturer: 'Fairlight Systems',
    deviceRating: 5,
    attributeArray: [8, 7, 6, 5],
    defaultConfig: { attack: 8, sleaze: 7, dataProcessing: 6, firewall: 5 },
    description: 'Konzern-Spezialanfertigung mit extrem hoher Bandbreite und Firewall-Bollwerk.'
  },
  {
    name: 'Novatech Navi',
    manufacturer: 'Novatech',
    deviceRating: 5,
    attributeArray: [8, 7, 7, 4],
    defaultConfig: { attack: 7, sleaze: 8, dataProcessing: 7, firewall: 4 },
    description: 'Hochmoderne Infiltrationsplattform für diskrete Schatten-Hacks und Datenraub.'
  },
  {
    name: 'Fairlight Excalibur',
    manufacturer: 'Fairlight Systems',
    deviceRating: 6,
    attributeArray: [9, 8, 7, 6],
    defaultConfig: { attack: 9, sleaze: 8, dataProcessing: 7, firewall: 6 },
    description: 'Die Krone der zivilen Matrix-Hardware. Unübertroffene Rechenpower für Elite-Decker.'
  },
  {
    name: 'Renraku Archon',
    manufacturer: 'Renraku Computer Systems',
    deviceRating: 6,
    attributeArray: [9, 8, 8, 6],
    defaultConfig: { attack: 8, sleaze: 9, dataProcessing: 8, firewall: 6 },
    description: 'Elite-Deck mit doppelten Bus-Leitungen für Höchstgeschwindigkeits-Rechnerarchitektur.'
  },

  // Stufe 7 - 12 (Mil-Spec, Black-Ops & Prototypen)
  {
    name: 'Shiawase Shuriken Mil-Spec',
    manufacturer: 'Shiawase Advanced Defense',
    deviceRating: 7,
    attributeArray: [10, 9, 8, 7],
    defaultConfig: { attack: 10, sleaze: 9, dataProcessing: 8, firewall: 7 },
    description: 'Militärisches Spezial-Deck für Black-Ops und Matrix-Infiltration hinter feindlichen Linien.'
  },
  {
    name: 'Fuchi Cyber-8 Mil-Spec Prototyp',
    manufacturer: 'Fuchi Industrial Technologies',
    deviceRating: 8,
    attributeArray: [11, 10, 9, 8],
    defaultConfig: { attack: 10, sleaze: 11, dataProcessing: 9, firewall: 8 },
    description: 'Streng geheime Prototyp-Hardware mit militärischen Quanten-Koprozessoren.'
  },
  {
    name: 'Saeder-Krupp Prime Vanguard',
    manufacturer: 'Saeder-Krupp Prime',
    deviceRating: 9,
    attributeArray: [12, 11, 10, 9],
    defaultConfig: { attack: 11, sleaze: 10, dataProcessing: 12, firewall: 9 },
    description: 'Schwer gepanzertes Kommandodeck mit massiver Bandbreite und Firewall-Übermacht.'
  },
  {
    name: 'Fairlight Paladin Black-Ops',
    manufacturer: 'Fairlight Systems',
    deviceRating: 10,
    attributeArray: [13, 12, 11, 10],
    defaultConfig: { attack: 12, sleaze: 13, dataProcessing: 11, firewall: 10 },
    description: 'Extrem seltenes High-End-Deck für staatliche Geheimdienste und GOD-Spezialeinheiten.'
  },
  {
    name: 'Nexus AI-Core Quantum Deck',
    manufacturer: 'Trans-Orbital Labs',
    deviceRating: 12,
    attributeArray: [15, 14, 13, 12],
    defaultConfig: { attack: 15, sleaze: 14, dataProcessing: 13, firewall: 12 },
    description: 'Ultramodernes Quanten-Matrix-Interface mit KI-Coprozessor und gigantischem Programmspeicher.'
  }
];

export const PROGRAM_PRESETS: Omit<ShadowrunDeckProgram, 'id' | 'isActive'>[] = [
  // Hacking-Programme
  {
    name: 'Ausnutzen (Exploit)',
    type: 'hacking',
    description: 'Nutzt Sicherheitslücken in Host-Architekturen aus. Gibt +2 Würfelpool für Hacking-Proben gegen Geräte, Marken oder Daten.',
    modifiers: {
      dicePoolMod: 2,
      applicableSkills: ['Hacking'],
      notes: '+2 Würfelpool auf Hacking-Handlungen'
    }
  },
  {
    name: 'Panzerung (Armor)',
    type: 'hacking',
    description: 'Härtet das Matrix-Icon und absorbiert Überspannungen. Gibt +2 Würfel auf Schadenswiderstand gegen Matrixschaden.',
    modifiers: {
      matrixDamageResistance: 2,
      notes: '+2 Würfel auf Matrix-Schadenswiderstand'
    }
  },
  {
    name: 'Hammer',
    type: 'hacking',
    description: 'Verstärkt Schadensroutinen in Datenpaketen. Erhöht den angerichteten Matrixschaden bei Cyberkampf-Angriffen um +2.',
    modifiers: {
      damageBonus: 2,
      applicableSkills: ['Cyberkampf'],
      notes: '+2 Matrixschaden bei erfolgreichem Cyberkampf'
    }
  },
  {
    name: 'Tarnung (Stealth)',
    type: 'hacking',
    description: 'Verschleiert Datenströme und Maskierungen. Erhöht den Schleicher-Wert des Decks um +1 und gibt +1 Würfelpool auf Schleicher-Handlungen.',
    modifiers: {
      attributeBoost: {
        attribute: 'sleaze',
        value: 1
      },
      dicePoolMod: 1,
      applicableSkills: ['Hacking', 'Schleichen'],
      notes: '+1 Schleicher-Attribut & +1 Würfelpool auf Matrix-Schleichen'
    }
  },
  {
    name: 'Entschlüsselung (Decryption)',
    type: 'hacking',
    description: 'Echtzeit-Kryptoanalyse für Brute-Force-Routinen. Erhöht das Angriffs-Attribut des Decks um +1 und gibt +1 Würfelpool auf Angriffs-Aktionen.',
    modifiers: {
      attributeBoost: {
        attribute: 'attack',
        value: 1
      },
      dicePoolMod: 1,
      applicableSkills: ['Cyberkampf'],
      notes: '+1 Angriffs-Attribut & +1 Würfelpool auf Angriffs-Handlungen'
    }
  },
  {
    name: 'Biofeedback-Filter',
    type: 'hacking',
    description: 'Fängt schädliche neuronale Spannungsspitzen ab. Gibt +2 Würfel auf Schadenswiderstand gegen Biofeedback-Schaden.',
    modifiers: {
      notes: '+2 Würfel auf Biofeedback-Widerstand (Körperlich & Geistig)'
    }
  },
  {
    name: 'Gabel (Fork)',
    type: 'hacking',
    description: 'Spaltet Signalpfade auf. Erlaubt es, eine einzelne Angriffs- oder Hacking-Matrixhandlung gleichzeitig gegen zwei verschiedene Ziele auszuführen.',
    modifiers: {
      notes: 'Zwei Ziele gleichzeitig mit einer Matrixhandlung anvisieren'
    }
  },
  {
    name: 'Täuschung (Decoy)',
    type: 'hacking',
    description: 'Erzeugt Fehlsignale bei aktiver IC-Verfolgung. Verringert eingehenden Biofeedback-Schaden bei fehlgeschlagenen Handlungen um 1.',
    modifiers: {
      notes: '-1 erlittener Biofeedback-Schaden bei Misserfolg'
    }
  },
  {
    name: 'Blackout',
    type: 'hacking',
    description: 'Konvertiert physischen Biofeedback-Schaden aus deinen Angriffen in geistigen Betäubungsschaden zur nicht-tödlichen Ausschaltung.',
    modifiers: {
      notes: 'Verursacht geistigen statt körperlichen Biofeedback-Schaden'
    }
  },
  {
    name: 'Mugger',
    type: 'hacking',
    description: 'Nutzt bestehende Marken für gezielte Systemüberlastung. +1 Matrixschaden pro bereits platzierter Marke auf dem Ziel.',
    modifiers: {
      notes: '+1 Schaden pro Marke auf dem Ziel'
    }
  },

  // Standard-Programme
  {
    name: 'Schmöker (Browse)',
    type: 'standard',
    description: 'Intelligente Matrix-Indizierung. Gibt +2 Würfelpool auf Matrixsuche (Computer) und halbiert die erforderliche Suchzeit.',
    modifiers: {
      dicePoolMod: 2,
      applicableSkills: ['Computer'],
      notes: '+2 Würfelpool auf Matrixsuche & halbiert Suchzeit'
    }
  },
  {
    name: 'Editor',
    type: 'standard',
    description: 'Fortgeschrittene Datenmanipulations-Suite. Gibt +2 Würfelpool auf Datei-Editierungen und das Einrichten von Schutzroutinen.',
    modifiers: {
      dicePoolMod: 2,
      applicableSkills: ['Software', 'Computer'],
      notes: '+2 Würfelpool auf Datei-Editieren & Schutzroutinen'
    }
  },
  {
    name: 'Verschlüsselung (Encryption)',
    type: 'standard',
    description: 'Dynamische Verschlüsselungsschichten auf Hardware-Ebene. Erhöht das Firewall-Attribut des Cyberdecks permanent um +1.',
    modifiers: {
      attributeBoost: {
        attribute: 'firewall',
        value: 1
      },
      notes: '+1 Firewall-Attribut des Decks'
    }
  },
  {
    name: 'Signal-Scrubber',
    type: 'standard',
    description: 'Bereinigt atmosphärische und funktechnische Signalstörungen. Reduziert jegliches Matrix-Rauschen (Noise) um 2.',
    modifiers: {
      noiseReduction: 2,
      notes: 'Verringert Rauschen (Noise) um 2'
    }
  },
  {
    name: 'Virtuelle Maschine (Virtual Machine)',
    type: 'standard',
    description: 'Schafft zwei zusätzliche virtuelle Programmplätze im Speicher (+2 Slots). Bei Matrixschaden erleidet das Deck jedoch 1 Kasten zusätzlichen Schaden.',
    modifiers: {
      extraProgramSlots: 2,
      notes: '+2 zusätzliche Programmplätze (+1 Matrixschaden bei Schaden)'
    }
  },
  {
    name: 'Babymonitor',
    type: 'standard',
    description: 'Überwacht den Gitter-Verkehr und warnt frühzeitig. Informiert den Decker jederzeit über den exakten Overwatch-Wert (OS) vor dem GOD-Zugriff.',
    modifiers: {
      notes: 'Zeigt aktuellen Overwatch-Wert (OS) transparent an'
    }
  },
  {
    name: 'Konfigurator',
    type: 'standard',
    description: 'Speichert eine sekundäre Matrix-Konfiguration für blitzschnelles Notfall-Umschalten in einer Freien Aktion.',
    modifiers: {
      notes: 'Freie Aktion: Sofortiges Umschalten auf gespeicherte Konfiguration'
    }
  }
];

export interface EffectiveMatrixAttributes {
  attack: number;
  sleaze: number;
  dataProcessing: number;
  firewall: number;
  bonuses: {
    attack: number;
    sleaze: number;
    dataProcessing: number;
    firewall: number;
  };
}

export function calculateEffectiveDeckAttributes(deck?: ShadowrunCyberdeck | null): EffectiveMatrixAttributes {
  const activePrograms = (deck?.programs || []).filter(p => p?.isActive);

  let attackBonus = 0;
  let sleazeBonus = 0;
  let dataProcessingBonus = 0;
  let firewallBonus = 0;

  activePrograms.forEach(prog => {
    if (prog?.modifiers?.attributeBoost) {
      const { attribute, value } = prog.modifiers.attributeBoost;
      if (attribute === 'attack') attackBonus += value;
      if (attribute === 'sleaze') sleazeBonus += value;
      if (attribute === 'dataProcessing') dataProcessingBonus += value;
      if (attribute === 'firewall') firewallBonus += value;
    }
  });

  return {
    attack: (deck?.configuration?.attack || 0) + attackBonus,
    sleaze: (deck?.configuration?.sleaze || 0) + sleazeBonus,
    dataProcessing: (deck?.configuration?.dataProcessing || 0) + dataProcessingBonus,
    firewall: (deck?.configuration?.firewall || 0) + firewallBonus,
    bonuses: {
      attack: attackBonus,
      sleaze: sleazeBonus,
      dataProcessing: dataProcessingBonus,
      firewall: firewallBonus
    }
  };
}

export function getMaxProgramSlots(deck?: ShadowrunCyberdeck | null): number {
  if (!deck) return 1;
  const baseSlots = deck.deviceRating || 1;
  const activeVM = (deck.programs || []).some(p => p?.isActive && p?.modifiers?.extraProgramSlots);
  return baseSlots + (activeVM ? 2 : 0);
}

export function getActiveProgramCount(deck?: ShadowrunCyberdeck | null): number {
  return (deck?.programs || []).filter(p => p?.isActive).length;
}

export function getMatrixInitiative(deck?: ShadowrunCyberdeck | null, characteristics: Stat[] = []): {
  ar: string;
  coldVR: { score: number; dice: string; label: string };
  hotVR: { score: number; dice: string; label: string };
} {
  const intStat = characteristics.find(c => c?.label && typeof c.label === 'string' && c.label.toUpperCase() === 'INT');
  const reaStat = characteristics.find(c => c?.label && typeof c.label === 'string' && c.label.toUpperCase() === 'REA');
  const intVal = intStat ? (typeof intStat.value === 'number' ? intStat.value : parseInt(String(intStat.value), 10) || 0) : 0;
  const reaVal = reaStat ? (typeof reaStat.value === 'number' ? reaStat.value : parseInt(String(reaStat.value), 10) || 0) : 0;

  const eff = calculateEffectiveDeckAttributes(deck);
  const dp = eff.dataProcessing;

  const coldScore = dp + intVal;
  const hotScore = dp + intVal;

  return {
    ar: `${reaVal + intVal} + 1W6`,
    coldVR: {
      score: coldScore,
      dice: `${coldScore} + 3W6`,
      label: `DV (${dp}) + INT (${intVal}) + 3W6`
    },
    hotVR: {
      score: hotScore,
      dice: `${hotScore} + 4W6`,
      label: `DV (${dp}) + INT (${intVal}) + 4W6 (+2 Würfel auf alle Handlungen)`
    }
  };
}

export interface ApplicableMatrixSkillModifier {
  programName: string;
  bonus: number;
  notes?: string;
  matrixLimit?: {
    attribute: string;
    value: number;
  };
}

export function getApplicableProgramModifiersForSkill(
  skillName: string,
  deck?: ShadowrunCyberdeck
): {
  totalDiceBonus: number;
  programs: ApplicableMatrixSkillModifier[];
  matrixLimit?: {
    attribute: string;
    value: number;
  };
  hotVrBonus: number;
} {
  if (!deck) return { totalDiceBonus: 0, programs: [], hotVrBonus: 0 };

  const sName = skillName.trim().toLowerCase();
  const eff = calculateEffectiveDeckAttributes(deck);
  const activePrograms = (deck.programs || []).filter(p => p.isActive);

  const matchedPrograms: ApplicableMatrixSkillModifier[] = [];
  let totalDice = 0;

  activePrograms.forEach(prog => {
    if (!prog.modifiers) return;
    const applicable = (prog.modifiers.applicableSkills || []).map(s => s.toLowerCase());
    
    // Check if skill matches
    const isApplicable = applicable.some(appSkill => sName.includes(appSkill) || appSkill.includes(sName));
    if (isApplicable && prog.modifiers.dicePoolMod) {
      matchedPrograms.push({
        programName: prog.name,
        bonus: prog.modifiers.dicePoolMod,
        notes: prog.modifiers.notes
      });
      totalDice += prog.modifiers.dicePoolMod;
    }
  });

  // Determine Matrix Limit based on the action/skill
  let matrixLimit: { attribute: string; value: number } | undefined = undefined;
  if (sName.includes('cyberkampf')) {
    matrixLimit = { attribute: 'Angriff', value: eff.attack };
  } else if (sName.includes('schleichen') || (sName.includes('hacking') && !sName.includes('brute'))) {
    // Eiliges Hacken / Matrix-Schleichen uses Sleaze
    matrixLimit = { attribute: 'Schleicher', value: eff.sleaze };
  } else if (sName.includes('computer') || sName.includes('elektronische') || sName.includes('hardware') || sName.includes('software')) {
    matrixLimit = { attribute: 'Datenverarbeitung', value: eff.dataProcessing };
  }

  // Hot-VR adds +2 dice to all Matrix actions
  const isHotVR = deck.mode === 'hot-vr';
  const isMatrixSkill = ['hacking', 'cyberkampf', 'computer', 'software', 'hardware', 'elektronische kriegsführung'].some(k => sName.includes(k));
  const hotVrBonus = (isHotVR && isMatrixSkill) ? 2 : 0;

  return {
    totalDiceBonus: totalDice + hotVrBonus,
    programs: matchedPrograms,
    matrixLimit,
    hotVrBonus
  };
}
