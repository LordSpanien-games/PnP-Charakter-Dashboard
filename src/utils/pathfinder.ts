import { CharacterData, GameSystem, PathfinderSavingThrows, Stat, Weapon, CombatCombo, PathfinderCombatSettings, Ability } from "../types";
import { 
  PATHFINDER_CLASSES, 
  calculateBAB, 
  formatBABAttacks, 
  parseLevelAndClass 
} from "./levelUpRules";

/**
 * Robustly checks if a character or system string represents a Pathfinder character.
 * Case-insensitive and checks both system name and hallmark Pathfinder stats.
 */
export const isPathfinder = (characterOrSystem?: Partial<CharacterData> | string | null): boolean => {
  if (!characterOrSystem) return false;
  
  const sysStr = typeof characterOrSystem === 'string' 
    ? characterOrSystem 
    : (characterOrSystem.system || '');
  
  const s = sysStr.toLowerCase().trim();
  if (s === 'pathfinder' || s.startsWith('pathfinder') || s === 'pf' || s === 'pf1e' || s === 'pf2e') {
    return true;
  }

  // Fallback heuristic: check if character has distinctive Pathfinder attributes/stats
  if (typeof characterOrSystem !== 'string' && characterOrSystem.stats) {
    return characterOrSystem.stats.some(st => {
      const l = (st.label || '').toLowerCase();
      return (
        l.includes('berührung') || 
        l.includes('falschen fuß') || 
        l.includes('kmb') || 
        l.includes('kmv') || 
        l.includes('zähigkeit') || 
        l.includes('reflex') || 
        l.includes('wille')
      );
    });
  }

  return false;
};

/**
 * Calculates the standard Pathfinder ability score modifier: Math.floor((score - 10) / 2)
 */
export const calculatePathfinderModifier = (score: number | string): number => {
  const num = typeof score === 'number' ? score : parseInt(String(score).replace(/[^0-9-]/g, ''), 10);
  if (isNaN(num)) return 0;
  return Math.floor((num - 10) / 2);
};

/**
 * Formats a modifier with explicit +/- sign
 */
export const formatPathfinderModifier = (mod: number | undefined | null): string => {
  if (mod === undefined || mod === null || isNaN(mod)) return "+0";
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export interface PathfinderCoreAttributeMeta {
  key: string;            // e.g. "ST"
  aliases: string[];      // e.g. ["ST", "STR", "STÄRKE", "STRENGTH"]
  fullName: string;       // e.g. "Stärke"
  shortName: string;      // e.g. "ST"
  englishName: string;    // e.g. "STR"
  associatedSaves: string[]; // e.g. []
  keyMechanics: string[];    // e.g. ["Nahkampf-Angriff", "Nahkampf-Schaden", "KMB"]
  associatedSkills: string[];
  color: {
    badge: string;
    border: string;
    text: string;
    bg: string;
  };
}

export const PATHFINDER_CORE_ATTRIBUTES: PathfinderCoreAttributeMeta[] = [
  {
    key: "ST",
    aliases: ["ST", "STR", "STÄRKE", "STRENGTH", "STÄ"],
    fullName: "Stärke",
    shortName: "ST",
    englishName: "STR",
    associatedSaves: [],
    keyMechanics: ["Nahkampf-Angriff & Schaden", "Kampfmanöverbonus (KMB)", "Traglast & Hebeleistung"],
    associatedSkills: ["Klettern", "Schwimmen"],
    color: {
      badge: "bg-red-500/20 text-red-300 border-red-500/40",
      border: "border-red-500/40 hover:border-red-400",
      text: "text-red-400",
      bg: "bg-red-950/20"
    }
  },
  {
    key: "GE",
    aliases: ["GE", "DEX", "GESCHICKLICHKEIT", "DEXTERITY", "GES"],
    fullName: "Geschicklichkeit",
    shortName: "GE",
    englishName: "DEX",
    associatedSaves: ["Reflex (Geschicklichkeit)"],
    keyMechanics: ["Reflexwurf", "Rüstungsklasse (RK)", "Initiative", "Fernkampf-Angriff", "KMB (Finesse)"],
    associatedSkills: ["Akrobatik", "Fingerfertigkeit", "Heimlichkeit", "Mechanismus ausschalten", "Reiten", "Fliegen", "Entfesslungskunst"],
    color: {
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      border: "border-amber-500/40 hover:border-amber-400",
      text: "text-amber-400",
      bg: "bg-amber-950/20"
    }
  },
  {
    key: "KO",
    aliases: ["KO", "CON", "KONSTITUTION", "CONSTITUTION", "KON"],
    fullName: "Konstitution",
    shortName: "KO",
    englishName: "CON",
    associatedSaves: ["Zähigkeit (Konstitution)"],
    keyMechanics: ["Zähigkeitswurf", "Trefferpunkte (TP) pro Stufe", "Atem anhalten & Zähigkeit"],
    associatedSkills: [],
    color: {
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      border: "border-emerald-500/40 hover:border-emerald-400",
      text: "text-emerald-400",
      bg: "bg-emerald-950/20"
    }
  },
  {
    key: "IN",
    aliases: ["IN", "INT", "INTELLIGENZ", "INTELLIGENCE"],
    fullName: "Intelligenz",
    shortName: "IN",
    englishName: "INT",
    associatedSaves: [],
    keyMechanics: ["Zusätzliche Fertigkeitsränge", "Magier-Zauber", "Bonus-Sprachen"],
    associatedSkills: ["Wissen (alle)", "Zauberkunde", "Schätzen", "Handwerk", "Fälschen"],
    color: {
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      border: "border-blue-500/40 hover:border-blue-400",
      text: "text-blue-400",
      bg: "bg-blue-950/20"
    }
  },
  {
    key: "WE",
    aliases: ["WE", "WIS", "WEISHEIT", "WISDOM", "WIL"],
    fullName: "Weisheit",
    shortName: "WE",
    englishName: "WIS",
    associatedSaves: ["Wille (Weisheit)"],
    keyMechanics: ["Willenswurf", "Kleriker- / Druiden-Zauber", "Sinneswahrnehmung"],
    associatedSkills: ["Wahrnehmung", "Motiv erkennen", "Heilkunde", "Überleben", "Beruf"],
    color: {
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      border: "border-purple-500/40 hover:border-purple-400",
      text: "text-purple-400",
      bg: "bg-purple-950/20"
    }
  },
  {
    key: "CH",
    aliases: ["CH", "CHA", "CHARISMA"],
    fullName: "Charisma",
    shortName: "CH",
    englishName: "CHA",
    associatedSaves: [],
    keyMechanics: ["Hexenmeister- / Barden-Zauber", "Untote vertreiben", "Soziale Interaktion"],
    associatedSkills: ["Bluffen", "Diplomatie", "Einschüchtern", "Verkleiden", "Auftreten", "Mit Tieren umgehen"],
    color: {
      badge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      border: "border-pink-500/40 hover:border-pink-400",
      text: "text-pink-400",
      bg: "bg-pink-950/20"
    }
  }
];

export const PATHFINDER_SKILL_TO_ATTRIBUTE_MAP: Record<string, string> = {
  "akrobatik": "GE",
  "fingerfertigkeit": "GE",
  "heimlichkeit": "GE",
  "mechanismus ausschalten": "GE",
  "reiten": "GE",
  "fliegen": "GE",
  "entfesslungskunst": "GE",
  "klettern": "ST",
  "schwimmen": "ST",
  "wahrnehmung": "WE",
  "motiv erkennen": "WE",
  "heilkunde": "WE",
  "überleben": "WE",
  "beruf": "WE",
  "zauberkunde": "IN",
  "schätzen": "IN",
  "wissen": "IN",
  "handwerk": "IN",
  "bluffen": "CH",
  "diplomatie": "CH",
  "einschüchtern": "CH",
  "verkleiden": "CH",
  "auftreten": "CH",
  "mit tieren umgehen": "CH"
};

/**
 * Ensures a Pathfinder character always has all 6 Grundwerte (ST, GE, KO, IN, WE, CH)
 * with reliable values, extracting from characteristics or stats or sensible defaults.
 */
export const getOrInitializePathfinderCharacteristics = (character: Partial<CharacterData>): Stat[] => {
  const existingChars = character.characteristics || [];
  const existingStats = character.stats || [];

  // Default values for Floki Dunkkling if matching or standard 10
  const isFloki = (character.name || '').toLowerCase().includes('floki');
  const flokiDefaults: Record<string, number> = {
    ST: 10,
    GE: 19,
    KO: 14,
    IN: 14,
    WE: 12,
    CH: 14
  };

  const result: Stat[] = [];

  for (const meta of PATHFINDER_CORE_ATTRIBUTES) {
    // 1. Check existing characteristics
    let found = existingChars.find(c => {
      const l = (c?.label || '').toUpperCase().trim();
      return meta.aliases.includes(l);
    });

    // 2. If not found in characteristics, check stats
    if (!found) {
      found = existingStats.find(s => {
        const l = (s?.label || '').toUpperCase().trim();
        return meta.aliases.includes(l) || l.startsWith((meta.fullName || '').toUpperCase());
      });
    }

    if (found) {
      const val = typeof found.value === 'number' 
        ? found.value 
        : parseInt(String(found.value).replace(/[^0-9-]/g, ''), 10) || (isFloki ? flokiDefaults[meta.key] : 10);
      result.push({
        label: meta.shortName,
        value: val,
        secondary: formatPathfinderModifier(calculatePathfinderModifier(val)),
        modifier: found.modifier || 0
      });
    } else {
      const defaultVal = isFloki ? flokiDefaults[meta.key] : 10;
      result.push({
        label: meta.shortName,
        value: defaultVal,
        secondary: formatPathfinderModifier(calculatePathfinderModifier(defaultVal)),
        modifier: 0
      });
    }
  }

  return result;
};

/**
 * Safely retrieves an attribute score from characteristics or stats by key (e.g. 'KO', 'GE', 'WE', 'ST', 'IN', 'CH')
 */
export const getAttributeScore = (character: Partial<CharacterData>, attrKey: string): number => {
  const meta = PATHFINDER_CORE_ATTRIBUTES.find(a => a.key === attrKey);
  const aliases = meta ? meta.aliases : [attrKey];

  // 1. Check characteristics
  if (character.characteristics) {
    const found = character.characteristics.find(c => {
      const l = (c?.label || '').toUpperCase().trim();
      return aliases.includes(l);
    });
    if (found) {
      const num = typeof found.value === 'number' ? found.value : parseInt(String(found.value).replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) return num;
    }
  }

  // 2. Check stats
  if (character.stats) {
    const found = character.stats.find(s => {
      const l = (s?.label || '').toUpperCase().trim();
      return aliases.includes(l) || (meta && l.startsWith((meta.fullName || '').toUpperCase()));
    });
    if (found) {
      const num = typeof found.value === 'number' ? found.value : parseInt(String(found.value).replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) return num;
    }
  }

  // Default fallback for Floki or general standard
  const isFloki = (character.name || '').toLowerCase().includes('floki');
  const defaults: Record<string, number> = {
    ST: 10,
    GE: 19,
    KO: 14,
    IN: 14,
    WE: 12,
    CH: 14
  };

  return isFloki ? (defaults[attrKey] ?? 10) : 10;
};

/**
 * Calculates the complete Pathfinder saving throws (Fortitude, Reflex, Will) automatically:
 * - Fortitude (Zähigkeit) = Base + KO-Mod (Konstitution) + Magic + Misc + Temp
 * - Reflex = Base + GE-Mod (Geschicklichkeit) + Magic + Misc + Temp
 * - Will (Wille) = Base + WE-Mod (Weisheit) + Magic + Misc + Temp
 */
export const calculateSavingThrows = (
  character: Partial<CharacterData>,
  existingSaves?: PathfinderSavingThrows
): PathfinderSavingThrows => {
  const koScore = getAttributeScore(character, 'KO');
  const geScore = getAttributeScore(character, 'GE');
  const weScore = getAttributeScore(character, 'WE');

  const koMod = calculatePathfinderModifier(koScore);
  const geMod = calculatePathfinderModifier(geScore);
  const weMod = calculatePathfinderModifier(weScore);

  const prevFort = existingSaves?.fortitude;
  const prevRef = existingSaves?.reflex;
  const prevWill = existingSaves?.will;

  // Defaults if none exist (e.g. Floki Level 9 Rogue has base saves Ref +6, Fort +3, Will +3)
  const isFloki = (character.name || '').toLowerCase().includes('floki');
  const defaultFortBase = isFloki ? 3 : 2;
  const defaultRefBase = isFloki ? 6 : 2;
  const defaultWillBase = isFloki ? 3 : 2;

  const fortBase = prevFort?.base !== undefined ? prevFort.base : defaultFortBase;
  const refBase = prevRef?.base !== undefined ? prevRef.base : defaultRefBase;
  const willBase = prevWill?.base !== undefined ? prevWill.base : defaultWillBase;

  const fortMagic = prevFort?.magicMod || 0;
  const fortMisc = prevFort?.miscMod || 0;
  const fortTemp = prevFort?.tempMod || 0;

  const refMagic = prevRef?.magicMod || 0;
  const refMisc = prevRef?.miscMod || 0;
  const refTemp = prevRef?.tempMod || 0;

  const willMagic = prevWill?.magicMod || 0;
  const willMisc = prevWill?.miscMod || 0;
  const willTemp = prevWill?.tempMod || 0;

  const fortTotal = fortBase + koMod + fortMagic + fortMisc + fortTemp;
  const refTotal = refBase + geMod + refMagic + refMisc + refTemp;
  const willTotal = willBase + weMod + willMagic + willMisc + willTemp;

  return {
    fortitude: {
      total: fortTotal,
      base: fortBase,
      abilityMod: koMod,
      magicMod: fortMagic,
      miscMod: fortMisc,
      tempMod: fortTemp,
      notes: prevFort?.notes || (isFloki ? '+2 gegen Gift & Lähmung (Gnom-Zähigkeit)' : undefined)
    },
    reflex: {
      total: refTotal,
      base: refBase,
      abilityMod: geMod,
      magicMod: refMagic,
      miscMod: refMisc,
      tempMod: refTemp,
      notes: prevRef?.notes || (isFloki ? '+3 gegen Fallen (Fallengespür: W20+13), Entrinnen aktiv' : undefined)
    },
    will: {
      total: willTotal,
      base: willBase,
      abilityMod: weMod,
      magicMod: willMagic,
      miscMod: willMisc,
      tempMod: willTemp,
      notes: prevWill?.notes || (isFloki ? '+2 gegen Illusionen (Gnom-Volksbonus)' : undefined)
    }
  };
};

/**
 * Default Pathfinder combat configuration settings.
 */
export const getDefaultPathfinderCombatSettings = (character?: Partial<CharacterData> | null): PathfinderCombatSettings => {
  const hasFinesse = hasWeaponFinesse(character);
  const hasDexDmg = hasDexToDamage(character);
  const defaultWeapon = character?.weapons?.melee?.[0]?.name || "Dolch des Eises +2";

  return {
    attackAttr: hasFinesse ? 'GE' : 'ST',
    damageAttr: hasDexDmg ? 'GE' : 'ST',
    grip: 'oneHanded',
    isFlanking: true,
    isHasted: false,
    isSneakAttack: true,
    powerAttack: false,
    higherGround: false,
    targetProne: false,
    isStealthed: false,
    customAttackMod: 0,
    customDamageMod: 0,
    selectedWeaponName: defaultWeapon
  };
};

/**
 * Recalculates all dependent Pathfinder values (Characteristics modifiers, Saving Throws, Stats, Weapons, and Combos)
 * ensuring full consistency across the entire character sheet.
 */
export const recalculatePathfinderCharacter = (
  character: CharacterData,
  newCharacteristics?: Stat[],
  combatSettingsOverride?: PathfinderCombatSettings
): CharacterData => {
  const chars = getOrInitializePathfinderCharacteristics({
    ...character,
    ...(newCharacteristics ? { characteristics: newCharacteristics } : {})
  });

  const combatSettings = combatSettingsOverride || character.combatSettings || getDefaultPathfinderCombatSettings(character);

  // Track attribute changes to apply deltas
  const oldGeMod = calculatePathfinderModifier(getAttributeScore(character, 'GE'));
  const oldStMod = calculatePathfinderModifier(getAttributeScore(character, 'ST'));

  const geScore = getAttributeScore({ characteristics: chars }, 'GE');
  const geMod = calculatePathfinderModifier(geScore);
  const stScore = getAttributeScore({ characteristics: chars }, 'ST');
  const stMod = calculatePathfinderModifier(stScore);

  const deltaGe = geMod - oldGeMod;
  const deltaSt = stMod - oldStMod;

  // Calculate saving throws using the updated characteristics
  const updatedSaves = calculateSavingThrows(
    { ...character, characteristics: chars },
    character.savingThrows
  );

  // Sync saving throws into stats array
  let updatedStats = syncPathfinderStats(character.stats || [], updatedSaves);

  // Apply deltaGe to RK and Touch AC if deltaGe !== 0
  if (deltaGe !== 0) {
    updatedStats = updatedStats.map(s => {
      const l = s.label.toLowerCase().trim();
      if (l === 'rk' || l === 'rüstungsklasse' || l.startsWith('rk ') || l.startsWith('rüstungsklasse ')) {
        const currentVal = parseInt(String(s.value).replace(/[^0-9-]/g, ''), 10);
        if (!isNaN(currentVal)) {
          return { ...s, value: currentVal + deltaGe };
        }
      }
      if (l === 'berührung' || l === 'berührungs-rk' || l.includes('berührung')) {
        const currentVal = parseInt(String(s.value).replace(/[^0-9-]/g, ''), 10);
        if (!isNaN(currentVal)) {
          return { ...s, value: currentVal + deltaGe };
        }
      }
      return s;
    });
  }

  const combatVals = calculatePathfinderCombatValues({
    ...character,
    characteristics: chars
  });

  const initIndex = updatedStats.findIndex(s => s.label.toLowerCase().includes('initiative'));
  if (initIndex >= 0) {
    const currentInitVal = updatedStats[initIndex].value;
    const currentInitNum = parseInt(String(currentInitVal).replace(/[^0-9-]/g, ''), 10);
    if (!isNaN(currentInitNum)) {
      const featBonus = currentInitNum - oldGeMod;
      const newInitNum = geMod + (featBonus > 0 ? featBonus : 0);
      updatedStats[initIndex] = {
        ...updatedStats[initIndex],
        value: formatPathfinderModifier(newInitNum)
      };
    }
  }

  // Update KMB in stats if present
  const kmbIndex = updatedStats.findIndex(s => {
    const l = s.label.toLowerCase().trim();
    return l === 'kmb' || l.startsWith('kmb ') || l.includes('kampfmanöverbonus');
  });
  if (kmbIndex >= 0) {
    updatedStats[kmbIndex] = {
      ...updatedStats[kmbIndex],
      value: formatPathfinderModifier(combatVals.cmb)
    };
  }

  // Update KMV in stats if present
  const kmvIndex = updatedStats.findIndex(s => {
    const l = s.label.toLowerCase().trim();
    return l === 'kmv' || l.startsWith('kmv ') || l.includes('kampfmanöververteidigung');
  });
  if (kmvIndex >= 0) {
    updatedStats[kmvIndex] = {
      ...updatedStats[kmvIndex],
      value: combatVals.cmd
    };
  }

  // Update Rüstungsklasse (RK) in stats if present
  const rkIndex = updatedStats.findIndex(s => {
    const l = s.label.toLowerCase().trim();
    return l === 'rk' || l.startsWith('rk ') || l === 'rüstungsklasse' || l.startsWith('rüstungsklasse ');
  });
  if (rkIndex >= 0) {
    updatedStats[rkIndex] = {
      ...updatedStats[rkIndex],
      value: combatVals.armorClass
    };
  }

  // Update Berührungs-RK in stats if present
  const touchIndex = updatedStats.findIndex(s => {
    const l = s.label.toLowerCase().trim();
    return l.includes('berührung');
  });
  if (touchIndex >= 0) {
    updatedStats[touchIndex] = {
      ...updatedStats[touchIndex],
      value: combatVals.touchAc
    };
  }

  // Update Auf falschem Fuß in stats if present
  const ffIndex = updatedStats.findIndex(s => {
    const l = s.label.toLowerCase().trim();
    return l.includes('falschem') || l.includes('auf dem falschen fuß');
  });
  if (ffIndex >= 0) {
    updatedStats[ffIndex] = {
      ...updatedStats[ffIndex],
      value: combatVals.flatFootedAc
    };
  }

  // Update or sync GAB (Grund-Angriffsbonus) in stats array
  const babData = getBaseAttackBonus({
    ...character,
    characteristics: chars
  });
  const gabIndex = updatedStats.findIndex(s => {
    const l = (s.label || '').toLowerCase().trim();
    return l === 'gab' || l === 'bab' || l.includes('grund-angriffsbonus') || l.includes('grundangriffsbonus');
  });
  if (gabIndex >= 0) {
    updatedStats[gabIndex] = {
      ...updatedStats[gabIndex],
      value: babData.formatted
    };
  } else {
    updatedStats.push({
      label: "GAB",
      value: babData.formatted
    });
  }

  // Always recalculate weapons with current attributes, finesse, combatSettings, and Dex-to-damage
  let updatedWeapons = character.weapons;
  if (character.weapons) {
    const tempChar: CharacterData = {
      ...character,
      characteristics: chars,
      stats: updatedStats,
      combatSettings
    };
    updatedWeapons = {
      melee: (character.weapons.melee || []).map(w => {
        const stats = calculatePathfinderWeaponStats(w, tempChar, true, { combatSettings });
        return {
          ...w,
          attack: stats.calculatedAttackFormatted,
          damage: stats.calculatedDamage,
          attribute: stats.effectiveAttackAttr,
          damageAttribute: stats.effectiveDamageAttr,
          sneakAttackBonus: stats.sneakAttackBonusAttack,
          sneakAttackDamageBonus: stats.sneakAttackBonusDamage,
          isSchurkenWeapon: stats.hasSneakBonus
        };
      }),
      ranged: (character.weapons.ranged || []).map(w => {
        const stats = calculatePathfinderWeaponStats(w, tempChar, false, { combatSettings });
        return {
          ...w,
          attack: stats.calculatedAttackFormatted,
          damage: stats.calculatedDamage,
          attribute: stats.effectiveAttackAttr,
          damageAttribute: stats.effectiveDamageAttr
        };
      })
    };
  }

  // Always recalculate combos to ensure combat sequences and tables reflect live Dexterity and Strength
  let updatedCombos = character.combos;
  if (character.combos) {
    const tempChar: CharacterData = {
      ...character,
      characteristics: chars,
      stats: updatedStats,
      weapons: updatedWeapons,
      combatSettings
    };
    updatedCombos = calculateDynamicCombos(tempChar);
  }

  return {
    ...character,
    characteristics: chars,
    savingThrows: updatedSaves,
    stats: updatedStats,
    weapons: updatedWeapons,
    combos: updatedCombos,
    combatSettings
  };
};

/**
 * Checks if a character has the "Waffenfinesse" (Weapon Finesse) feat in abilities.
 */
export const hasWeaponFinesse = (character?: Partial<CharacterData> | null): boolean => {
  if (!character || !character.abilities) return false;
  return character.abilities.some(a => {
    const n = (a.name || '').toLowerCase();
    const e = (a.effect || '').toLowerCase();
    return (
      n.includes('waffenfinesse') ||
      n.includes('weapon finesse') ||
      e.includes('waffenfinesse') ||
      (e.includes('ge statt st') && e.includes('angriff')) ||
      (e.includes('geschicklichkeit statt stärke') && e.includes('angriff'))
    );
  });
};

/**
 * Checks if a character can apply their Dexterity modifier instead of Strength to damage rolls
 * (Pathfinder 1e Unchained Rogue "Finesse-Training" at Level 3+, Feats like "Schlitzerische Anmut" / "Fechtkunst",
 * "Flink" enchantments, or character settings).
 */
export const hasDexToDamage = (character?: Partial<CharacterData> | null): boolean => {
  if (!character) return false;
  if (character.useDexToDamage !== undefined) return character.useDexToDamage;
  if (character.combatSettings?.damageAttr) {
    return character.combatSettings.damageAttr === 'GE';
  }

  if (character.abilities) {
    const hasTalent = character.abilities.some(a => {
      const n = (a.name || '').toLowerCase();
      const e = (a.effect || '').toLowerCase();
      return (
        n.includes('finesse-training') ||
        n.includes('finesse training') ||
        n.includes('schurken-finesse') ||
        n.includes('schurkenfinesse') ||
        n.includes('fechtkunst') ||
        n.includes('fencing grace') ||
        n.includes('schlitzerische anmut') ||
        n.includes('slashing grace') ||
        n.includes('derwisch-tanz') ||
        n.includes('dervish dance') ||
        n.includes('flink') ||
        n.includes('agile') ||
        (e.includes('ge statt st') && e.includes('schaden')) ||
        (e.includes('geschicklichkeit statt stärke') && e.includes('schaden')) ||
        e.includes('dex auf schaden') ||
        e.includes('ge auf schaden')
      );
    });
    if (hasTalent) return true;
  }

  // Only Unchained Rogue / Entfesselter Schurke level >= 3 gets Finesse-Training for finesse weapons
  const sub = ((character.name || '') + ' ' + (character.subTitle || '')).toLowerCase();
  const isUnchainedRogue = (sub.includes('entfesselt') || sub.includes('unchained')) && (sub.includes('dieb') || sub.includes('schurke') || sub.includes('rogue'));
  if (isUnchainedRogue) {
    const match = sub.match(/level\s*(\d+)|stufe\s*(\d+)/);
    const lvl = match ? parseInt(match[1] || match[2], 10) : 1;
    if (lvl >= 3) return true;
  }

  return false;
};

/**
 * Checks if a character is a Rogue / Dieb / Schurke
 */
export const isRogueCharacter = (character?: Partial<CharacterData> | null): boolean => {
  if (!character) return false;
  const sub = ((character.subTitle || '') + ' ' + (character.name || '')).toLowerCase();
  return sub.includes('schurke') || sub.includes('dieb') || sub.includes('rogue') || sub.includes('floki');
};

/**
 * Checks if an ability is a Rogue Talent (Schurkentrick)
 */
export const isRogueTalentAbility = (ability: { name: string; type?: string; effect?: string }): boolean => {
  if (!ability) return false;
  if (ability.type === 'rogue_talent') return true;

  const n = (ability.name || '').toLowerCase();
  const e = (ability.effect || '').toLowerCase();

  return (
    n.includes('schurkentrick') ||
    n.includes('rogue talent') ||
    n.includes('blutende wunde') ||
    n.includes('blutende wunden') ||
    n.includes('bleeding attack') ||
    n.includes('schwächender schlag') ||
    n.includes('debilitating injury') ||
    n.includes('verkrüppelnder schlag') ||
    n.includes('crippling strike') ||
    n.includes('finesse-training') ||
    n.includes('schurken-finesse') ||
    n.includes('schnelle heimlichkeit') ||
    n.includes('fast stealth') ||
    n.includes('widerstandsfähigkeit') ||
    n.includes('resiliency') ||
    n.includes('gefechtsrolle') ||
    n.includes('offensive defense') ||
    n.includes('überraschungsangriff') ||
    n.includes('surprise attack') ||
    n.includes('fallenspürer') ||
    n.includes('trap spotter') ||
    n.includes('schlüpfriger geist') ||
    n.includes('slippery mind') ||
    n.includes('gelegenheitsschlag') ||
    n.includes('opportunist') ||
    n.includes('schurkenwaffe') ||
    (n.includes('trick') && (e.includes('schurke') || e.includes('ha-treffer') || e.includes('hinterhältig')))
  );
};

/**
 * Returns all rogue talents of a character
 */
export const getCharacterRogueTalents = (character?: Partial<CharacterData> | null): Ability[] => {
  if (!character || !character.abilities) return [];
  return character.abilities.filter(isRogueTalentAbility);
};

/**
 * Returns combat-relevant rogue tricks of a character (Bleeding attack, crippling strike, etc.)
 */
export const getCombatRogueTalents = (character?: Partial<CharacterData> | null): Ability[] => {
  const talents = getCharacterRogueTalents(character);
  return talents.filter(t => {
    const n = (t.name || '').toLowerCase();
    const e = (t.effect || '').toLowerCase();
    return (
      n.includes('blutend') ||
      n.includes('bleed') ||
      n.includes('schlag') ||
      n.includes('strike') ||
      n.includes('injury') ||
      n.includes('finesse') ||
      n.includes('gefechtsrolle') ||
      n.includes('defense') ||
      n.includes('angriff') ||
      n.includes('attack') ||
      n.includes('waffe') ||
      e.includes('treffer') ||
      e.includes('schaden') ||
      e.includes('angriff') ||
      e.includes('rk')
    );
  });
};

/**
 * Checks whether a weapon qualifies as a finessable weapon in Pathfinder 1e
 * (Light melee weapons, rapier, whip, spiked chain, elven curve blade, or marked isFinesse).
 */
export const isFinesseWeapon = (weaponName: string, weapon?: { isFinesse?: boolean; attribute?: string }): boolean => {
  if (weapon?.isFinesse !== undefined) return weapon.isFinesse;
  if (weapon?.attribute === 'GE') return true;

  const n = (weaponName || '').toLowerCase().trim();
  const finessableKeywords = [
    'dolch', 'dagger', 'kurzschwert', 'shortsword', 'short sword',
    'rapier', 'peitsche', 'whip', 'stachelkette', 'spiked chain',
    'kukri', 'kama', 'nunchaku', 'siangham', 'waffenlos', 'unarmed',
    'krummsäbel', 'scimitar', 'spickdolch', 'leichte', 'light'
  ];

  return finessableKeywords.some(kw => n.includes(kw));
};

/**
 * Derives size modifiers for attack rolls, AC, and CMB/CMD.
 */
export const getCharacterSizeMod = (character?: Partial<CharacterData> | null): {
  attackAndAc: number;
  cmbAndCmd: number;
  size: 'small' | 'medium' | 'large';
  label: string;
} => {
  const name = ((character?.name || '') + ' ' + (character?.subTitle || '')).toLowerCase();

  // Small races: Gnom, Halbling, Goblin, Kobold, etc.
  if (name.includes('gnom') || name.includes('gnome') || name.includes('halbling') || name.includes('halfling') || name.includes('goblin') || name.includes('klein')) {
    return {
      attackAndAc: 1,
      cmbAndCmd: -1,
      size: 'small',
      label: 'Klein (Gnom / Halbling: +1 Angriff/RK, -1 KMB/KMV)'
    };
  }

  // Large creatures
  if (name.includes('groß') || name.includes('large') || name.includes('riese') || name.includes('ogre')) {
    return {
      attackAndAc: -1,
      cmbAndCmd: 1,
      size: 'large',
      label: 'Groß (-1 Angriff/RK, +1 KMB/KMV)'
    };
  }

  // Default: Medium (Mensch, Elf, Zwerg, Halbork, etc.)
  return {
    attackAndAc: 0,
    cmbAndCmd: 0,
    size: 'medium',
    label: 'Mittelgroß (Mensch / Elf / Zwerg: keine Größenmodifikatoren)'
  };
};

/**
 * Calculates the expected Pathfinder Base Attack Bonus (GAB / BAB) based on character level and class.
 * Accounts for full (+1/lvl: Fighter, Barbarian, Paladin, Ranger), 
 * 3/4 (+0.75/lvl: Rogue, Cleric, Druid, Monk, Bard, etc.), 
 * and 1/2 (+0.5/lvl: Wizard, Sorcerer).
 */
export const calculatePathfinderBABForCharacter = (character?: Partial<CharacterData> | null): number => {
  if (!character) return 0;
  
  const sub = character.subTitle || '';
  const parsed = parseLevelAndClass(sub);
  const level = parsed.level || 1;
  const matchedClassId = parsed.matchedClassId;
  const className = parsed.className || '';

  // Determine progression
  let progression: 'full' | 'threeFourths' | 'half' = 'threeFourths';
  if (matchedClassId && PATHFINDER_CLASSES[matchedClassId]) {
    progression = PATHFINDER_CLASSES[matchedClassId].babProgression;
  } else {
    const s = `${className} ${sub} ${character.name || ''}`.toLowerCase();
    if (
      s.includes('kämpfer') || s.includes('fighter') ||
      s.includes('barbar') || s.includes('barbarian') ||
      s.includes('paladin') ||
      s.includes('waldläufer') || s.includes('ranger') ||
      s.includes('schütze') || s.includes('gunslinger') ||
      s.includes('schläger') || s.includes('brawler') ||
      s.includes('ritter') || s.includes('cavalier') ||
      s.includes('blutwüter') || s.includes('bloodrager')
    ) {
      progression = 'full';
    } else if (
      s.includes('magier') || s.includes('wizard') ||
      s.includes('hexenmeister') || s.includes('sorcerer') ||
      s.includes('hexe') || s.includes('witch') ||
      s.includes('arcanist') || s.includes('arkanist')
    ) {
      progression = 'half';
    } else {
      // Schurke / Rogue / Dieb, Kleriker, Druide, Barde, Mönch, Alchemist, etc.
      progression = 'threeFourths';
    }
  }

  return calculateBAB(level, progression);
};

/**
 * Retrieves the Base Attack Bonus (GAB / BAB) for a Pathfinder character.
 * Dynamically scales with character level and class, respecting any explicit overrides.
 */
export const getBaseAttackBonus = (character?: Partial<CharacterData> | null): {
  bab: number;
  iteratives: number[];
  formatted: string;
} => {
  if (!character) {
    return { bab: 0, iteratives: [0], formatted: "+0" };
  }

  // 1. Calculate dynamic GAB strictly based on the character's level and class
  const classBab = calculatePathfinderBABForCharacter(character);

  // 2. Check in stats if an explicit GAB or BAB is recorded
  let foundBab: number = classBab;
  if (character.stats) {
    const gabStat = character.stats.find(s => {
      const l = (s?.label || '').toLowerCase().trim();
      return l === 'gab' || l === 'bab' || l.includes('grund-angriffsbonus') || l.includes('grundangriffsbonus');
    });
    if (gabStat) {
      // Only match the first number (the primary BAB), ignoring iteratives like / +1
      const match = String(gabStat.value).trim().match(/^([+-]?\d+)/);
      const num = match ? parseInt(match[1], 10) : NaN;
      if (!isNaN(num)) {
        // If classBab > 0, dynamic class level calculation takes precedence on level increases
        foundBab = classBab > 0 ? classBab : num;
      }
    }
  }

  // Fallback if level parsing resulted in 0 or less
  if (foundBab <= 0 && classBab <= 0) {
    const sub = (character.subTitle || '').toLowerCase();
    const match = sub.match(/level\s*(\d+)|stufe\s*(\d+)/);
    const lvl = match ? parseInt(match[1] || match[2], 10) : 1;
    foundBab = Math.max(0, Math.floor(lvl * 0.75));
  }

  // Compute iterative attacks according to Pathfinder rules (+GAB / +(GAB-5) / +(GAB-10) / +(GAB-15))
  const iteratives: number[] = [];
  let curr = foundBab;
  while (curr > 0) {
    iteratives.push(curr);
    curr -= 5;
  }
  if (iteratives.length === 0) iteratives.push(0);

  const formatted = iteratives.map(v => formatPathfinderModifier(v)).join(' / ');

  return {
    bab: foundBab,
    iteratives,
    formatted
  };
};

export interface PathfinderCombatCalculationResult {
  bab: number;
  babIteratives: number[];
  babFormatted: string;
  stScore: number;
  stMod: number;
  geScore: number;
  geMod: number;
  hasFinesseFeat: boolean;
  useFinesseForMelee: boolean;
  hasDexToDamage: boolean;
  useDexToDamage: boolean;
  meleeAttr: 'GE' | 'ST';
  meleeAttrMod: number;
  meleeAttackBonus: number;
  meleeIteratives: number[];
  meleeFormatted: string;
  meleeFormula: string;
  rangedAttackBonus: number;
  rangedIteratives: number[];
  rangedFormatted: string;
  rangedFormula: string;
  meleeDamageAttr: 'GE' | 'ST';
  meleeDamageAttrMod: number;
  meleeDamageMod: {
    primary: number;
    twoHanded: number;
    offHand: number;
  };
  sizeMod: {
    attackAndAc: number;
    cmbAndCmd: number;
    size: 'small' | 'medium' | 'large';
    label: string;
  };
  cmb: number;
  cmbFormula: string;
  cmd: number;
  cmdFormula: string;
  initiative: number;
  armorClass: number;
  touchAc: number;
  flatFootedAc: number;
  acGeBonus: number;
  reflexTotal: number;
  tacticalMeleeBonus: number;
  tacticalRangedBonus: number;
  activeTactics: string[];
  isHasted: boolean;
  isFlanking: boolean;
}

/**
 * Calculates complete Pathfinder combat values accounting for Strength,
 * Dexterity, the "Waffenfinesse" feat, size modifiers, iterative attacks,
 * and Dexterity-to-damage (Schurken-Finesse / Finesse Training).
 */
export const calculatePathfinderCombatValues = (
  character: CharacterData,
  options?: {
    forceFinesse?: boolean;
    forceStrength?: boolean;
    forceDexToDamage?: boolean;
    combatSettings?: PathfinderCombatSettings;
  }
): PathfinderCombatCalculationResult => {
  const cs = options?.combatSettings || character.combatSettings;
  const babData = getBaseAttackBonus(character);
  const stScore = getAttributeScore(character, 'ST');
  const geScore = getAttributeScore(character, 'GE');
  const stMod = calculatePathfinderModifier(stScore);
  const geMod = calculatePathfinderModifier(geScore);
  const sizeMod = getCharacterSizeMod(character);

  const hasFinesseFeat = hasWeaponFinesse(character);
  let useFinesseForMelee = hasFinesseFeat;
  if (options?.forceFinesse !== undefined) {
    useFinesseForMelee = options.forceFinesse;
  } else if (options?.forceStrength !== undefined && options.forceStrength) {
    useFinesseForMelee = false;
  } else if (cs?.attackAttr) {
    useFinesseForMelee = cs.attackAttr === 'GE';
  }

  // Dexterity to damage check
  const hasDexDmgFeat = hasDexToDamage(character);
  let useDexToDamage = hasDexDmgFeat;
  if (options?.forceDexToDamage !== undefined) {
    useDexToDamage = options.forceDexToDamage;
  } else if (cs?.damageAttr) {
    useDexToDamage = cs.damageAttr === 'GE';
  }

  // Tactical modifiers
  let tacticalMeleeBonus = 0;
  let tacticalRangedBonus = 0;
  const activeTactics: string[] = [];

  const isFlanking = cs?.isFlanking ?? false;
  const isHasted = cs?.isHasted ?? false;

  if (isFlanking) {
    tacticalMeleeBonus += 2;
    activeTactics.push('Flankiert (+2 Nahkampf)');
  }
  if (isHasted) {
    tacticalMeleeBonus += 1;
    tacticalRangedBonus += 1;
    activeTactics.push('Hast (+1 Angriff & +1 RK/Reflex)');
  }
  if (cs?.higherGround) {
    tacticalMeleeBonus += 1;
    tacticalRangedBonus += 1;
    activeTactics.push('Höherer Stand (+1)');
  }
  if (cs?.targetProne) {
    tacticalMeleeBonus += 4;
    tacticalRangedBonus -= 4;
    activeTactics.push('Ziel liegt (+4 Nahk. / -4 Fernk.)');
  }
  if (cs?.isStealthed) {
    tacticalMeleeBonus += 2;
    tacticalRangedBonus += 2;
    activeTactics.push('Unsichtbar/Versteckt (+2)');
  }
  if (cs?.powerAttack) {
    const paPenalty = 1 + Math.floor(babData.bab / 4);
    tacticalMeleeBonus -= paPenalty;
    tacticalRangedBonus -= paPenalty;
    activeTactics.push(`Heftiger Angriff (-${paPenalty})`);
  }
  if (cs?.customAttackMod) {
    tacticalMeleeBonus += cs.customAttackMod;
    tacticalRangedBonus += cs.customAttackMod;
    activeTactics.push(`Situativ (${formatPathfinderModifier(cs.customAttackMod)})`);
  }

  // Melee Attack Bonus
  const meleeAttr = useFinesseForMelee ? 'GE' : 'ST';
  const meleeAttrMod = useFinesseForMelee ? geMod : stMod;
  const meleeAttackBonus = babData.bab + meleeAttrMod + sizeMod.attackAndAc + tacticalMeleeBonus;

  let rawMeleeIteratives = [...babData.iteratives];
  if (isHasted) {
    rawMeleeIteratives = [babData.bab, ...rawMeleeIteratives];
  }
  const meleeIteratives = rawMeleeIteratives.map(b => b + meleeAttrMod + sizeMod.attackAndAc + tacticalMeleeBonus);
  const meleeFormatted = meleeIteratives.map(v => formatPathfinderModifier(v)).join(' / ');
  const meleeFormula = `GAB (${formatPathfinderModifier(babData.bab)}) + ${meleeAttr} (${formatPathfinderModifier(meleeAttrMod)}${useFinesseForMelee ? ' Finesse' : ''}) + Größe (${formatPathfinderModifier(sizeMod.attackAndAc)})${tacticalMeleeBonus !== 0 ? ` + Taktik (${formatPathfinderModifier(tacticalMeleeBonus)})` : ''}`;

  // Ranged Attack Bonus
  const rangedAttackBonus = babData.bab + geMod + sizeMod.attackAndAc + tacticalRangedBonus;
  let rawRangedIteratives = [...babData.iteratives];
  if (isHasted) {
    rawRangedIteratives = [babData.bab, ...rawRangedIteratives];
  }
  const rangedIteratives = rawRangedIteratives.map(b => b + geMod + sizeMod.attackAndAc + tacticalRangedBonus);
  const rangedFormatted = rangedIteratives.map(v => formatPathfinderModifier(v)).join(' / ');
  const rangedFormula = `GAB (${formatPathfinderModifier(babData.bab)}) + GE (${formatPathfinderModifier(geMod)}) + Größe (${formatPathfinderModifier(sizeMod.attackAndAc)})${tacticalRangedBonus !== 0 ? ` + Taktik (${formatPathfinderModifier(tacticalRangedBonus)})` : ''}`;

  // Melee Damage (with optional Dexterity via Schurken-Finesse)
  const isDexDamageActive = useDexToDamage;
  const meleeDamageAttr = isDexDamageActive ? 'GE' : 'ST';
  const meleeDamageAttrMod = isDexDamageActive ? geMod : stMod;

  const primaryDamage = meleeDamageAttrMod;
  const twoHandedDamage = isDexDamageActive
    ? (geMod > 0 ? Math.floor(geMod * 1.5) : geMod)
    : (stMod > 0 ? Math.floor(stMod * 1.5) : stMod);
  const offHandDamage = isDexDamageActive
    ? Math.floor(geMod * 0.5)
    : (stMod > 0 ? Math.floor(stMod * 0.5) : stMod);

  // Combat Maneuver Bonus (KMB)
  const cmbAttr = useFinesseForMelee ? 'GE' : 'ST';
  const cmbAttrMod = useFinesseForMelee ? geMod : stMod;
  const cmb = babData.bab + cmbAttrMod + sizeMod.cmbAndCmd;
  const cmbFormula = `GAB (${formatPathfinderModifier(babData.bab)}) + ${cmbAttr} (${formatPathfinderModifier(cmbAttrMod)}${useFinesseForMelee ? ' Finesse' : ''}) + Größe (${formatPathfinderModifier(sizeMod.cmbAndCmd)})`;

  // Combat Maneuver Defense (KMV)
  let existingCmdMisc = 0;
  if (character.stats) {
    const kmvStat = character.stats.find(s => {
      const l = (s.label || '').toLowerCase().trim();
      return l === 'kmv' || l.includes('kampfmanöververteidigung');
    });
    if (kmvStat) {
      const existingCmdNum = parseInt(String(kmvStat.value).replace(/[^0-9-]/g, ''), 10);
      const rawCmd = 10 + babData.bab + stMod + geMod + sizeMod.cmbAndCmd;
      if (!isNaN(existingCmdNum) && existingCmdNum > rawCmd) {
        existingCmdMisc = existingCmdNum - rawCmd;
      }
    }
  }

  const isFloki = (character.name || '').toLowerCase().includes('floki');
  if (existingCmdMisc === 0 && isFloki) {
    existingCmdMisc = 3; // +1 Ausweichen, +2 Reflexbewegung
  }

  const cmd = 10 + babData.bab + stMod + geMod + sizeMod.cmbAndCmd + existingCmdMisc;
  const cmdFormula = `10 + GAB (${babData.bab}) + ST (${formatPathfinderModifier(stMod)}) + GE (${formatPathfinderModifier(geMod)}) + Größe (${formatPathfinderModifier(sizeMod.cmbAndCmd)})${existingCmdMisc > 0 ? ` + Boni (+${existingCmdMisc})` : ''}`;

  // Defensive combat values
  let armorClass = 10 + geMod + sizeMod.attackAndAc;
  let touchAc = 10 + geMod + sizeMod.attackAndAc;
  let flatFootedAc = 10 + sizeMod.attackAndAc;

  if (character.stats) {
    const rkStat = character.stats.find(s => {
      const l = (s.label || '').toLowerCase().trim();
      return l === 'rk' || l === 'rüstungsklasse' || l.startsWith('rk ') || l.startsWith('rüstungsklasse ');
    });
    if (rkStat) {
      const num = parseInt(String(rkStat.value).replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) armorClass = num;
    }

    const touchStat = character.stats.find(s => {
      const l = (s.label || '').toLowerCase().trim();
      return l === 'berührung' || l === 'berührungs-rk' || l.includes('berührung');
    });
    if (touchStat) {
      const num = parseInt(String(touchStat.value).replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) touchAc = num;
    }

    const ffStat = character.stats.find(s => {
      const l = (s.label || '').toLowerCase().trim();
      return l.includes('falschen fuß') || l.includes('auf dem falschen fuß');
    });
    if (ffStat) {
      const num = parseInt(String(ffStat.value).replace(/[^0-9-]/g, ''), 10);
      if (!isNaN(num)) flatFootedAc = num;
    }
  }

  // Haste grants +1 dodge bonus to AC and reflex save
  if (isHasted) {
    armorClass += 1;
    touchAc += 1;
  }

  const baseReflex = character.savingThrows?.reflex.total ?? (geMod + 6);
  const reflexTotal = baseReflex + (isHasted ? 1 : 0);

  return {
    bab: babData.bab,
    babIteratives: babData.iteratives,
    babFormatted: babData.formatted,
    stScore,
    stMod,
    geScore,
    geMod,
    hasFinesseFeat,
    useFinesseForMelee,
    hasDexToDamage: hasDexDmgFeat,
    useDexToDamage,
    meleeAttr,
    meleeAttrMod,
    meleeAttackBonus,
    meleeIteratives,
    meleeFormatted,
    meleeFormula,
    rangedAttackBonus,
    rangedIteratives,
    rangedFormatted,
    rangedFormula,
    meleeDamageAttr,
    meleeDamageAttrMod,
    meleeDamageMod: {
      primary: primaryDamage,
      twoHanded: twoHandedDamage,
      offHand: offHandDamage
    },
    sizeMod,
    cmb,
    cmbFormula,
    cmd,
    cmdFormula,
    initiative: geMod,
    armorClass,
    touchAc,
    flatFootedAc,
    acGeBonus: geMod,
    reflexTotal,
    tacticalMeleeBonus,
    tacticalRangedBonus,
    activeTactics,
    isHasted,
    isFlanking
  };
};

export interface PathfinderWeaponStats {
  weapon: Weapon;
  isMelee: boolean;
  isFinesse: boolean;
  effectiveAttackAttr: 'GE' | 'ST';
  effectiveAttackMod: number;
  effectiveDamageAttr: 'GE' | 'ST' | 'NONE';
  effectiveDamageMod: number;
  magicBonus: number;
  baseDice: string;
  extraDamageText: string;
  calculatedAttack: number;
  calculatedAttackFormatted: string; // e.g. "+13 / +8" or "+16 / +16 / +11"
  attackIteratives: number[];
  singleAttackBonus: number;
  singleAttackFormatted: string; // e.g. "+13"
  calculatedDamage: string; // e.g. "1W3+6 + 1W6 Eis" (with GE)
  damageFormula: string;
  attackFormula: string;
  differsFromSaved: boolean;
  tacticalAttackBonus: number;
  tacticalDamageBonus: number;
  activeTactics: string[];
  grip?: 'oneHanded' | 'twoHanded' | 'offHand';
  isHasted?: boolean;
  isFlanking?: boolean;
  // Sneak Attack / Schurkenwaffe bonuses (e.g. Schurkenkurzschwert / Schwert der Subtilität)
  hasSneakBonus: boolean;
  sneakAttackBonusAttack: number; // e.g. +4
  sneakAttackBonusDamage: number; // e.g. +4
  sneakAttackSingleBonus: number;
  sneakAttackAttackFormatted: string; // e.g. "+17 / +12"
  sneakAttackDamage: string; // e.g. "1W4+9 + 5W6"
  sneakBonusDescription: string;
}

/**
 * Resolves sneak attack dice for a character based on abilities or level.
 */
export const getCharacterSneakAttackDice = (character: CharacterData): { diceCount: number; formula: string } => {
  const haAbility = (character.abilities || []).find(a => 
    (a.name || '').toLowerCase().includes('hinterhältig') ||
    (a.name || '').toLowerCase().includes('sneak attack')
  );
  if (haAbility) {
    const text = `${haAbility.name} ${haAbility.effect || ''}`;
    const m = text.match(/(\d+)\s*[WwDd]6/);
    if (m) {
      const d = parseInt(m[1], 10);
      return { diceCount: d, formula: `${d}W6` };
    }
  }

  const sub = (character.subTitle || '').toLowerCase();
  const mLevel = sub.match(/level\s*(\d+)|stufe\s*(\d+)/i);
  const lvl = mLevel ? parseInt(mLevel[1] || mLevel[2], 10) : 9;
  const isRogue = sub.includes('schurke') || sub.includes('rogue') || (character.name || '').toLowerCase().includes('floki');
  if (isRogue) {
    const dice = Math.max(1, Math.ceil(lvl / 2));
    return { diceCount: dice, formula: `${dice}W6` };
  }

  return { diceCount: 0, formula: "" };
};

/**
 * Checks whether a weapon is a Schurkenwaffe (such as Schurkenkurzschwert / Schwert der Subtilität)
 * that provides bonus attack and bonus damage on sneak attacks.
 */
export const getWeaponSneakAttackBonus = (weapon: Weapon): {
  attackBonus: number;
  damageBonus: number;
  hasBonus: boolean;
  source: string;
} => {
  const nameLower = (weapon.name || '').toLowerCase();
  const noteLower = (weapon.note || '').toLowerCase();

  // Explicit weapon fields
  if (weapon.sneakAttackBonus !== undefined || weapon.sneakAttackDamageBonus !== undefined) {
    const atk = weapon.sneakAttackBonus ?? 0;
    const dmg = weapon.sneakAttackDamageBonus ?? 0;
    return {
      attackBonus: atk,
      damageBonus: dmg,
      hasBonus: atk > 0 || dmg > 0,
      source: weapon.isSchurkenWeapon ? "Schurkenwaffe (Schwert der Subtilität)" : "Spezifischer HA-Waffenbonus"
    };
  }

  // Automatic detection for Schurkenkurzschwert / Schwert der Subtilität / Sword of Subtlety
  if (
    nameLower.includes('schurkenkurzschwert') ||
    nameLower.includes('schurken-kurzschwert') ||
    nameLower.includes('schurken kurzschwert') ||
    nameLower.includes('subtilität') ||
    nameLower.includes('subtlety') ||
    (nameLower.includes('schurken') && nameLower.includes('schwert')) ||
    weapon.isSchurkenWeapon
  ) {
    return {
      attackBonus: 4,
      damageBonus: 4,
      hasBonus: true,
      source: "Schurkenwaffe (Schwert der Subtilität: +4 Angriff & +4 Schaden bei HA)"
    };
  }

  // Check weapon note text
  const noteMatch = noteLower.match(/\+(\d+)\s*(?:auf\s*)?angriff.*?ha|\+(\d+)\s*ha-angriff/i);
  if (noteMatch) {
    const bonus = parseInt(noteMatch[1] || noteMatch[2], 10);
    return {
      attackBonus: bonus,
      damageBonus: bonus,
      hasBonus: true,
      source: `HA-Zusatzbonus (+${bonus})`
    };
  }

  return { attackBonus: 0, damageBonus: 0, hasBonus: false, source: "" };
};

/**
 * Calculates live Pathfinder stats for an individual weapon, including
 * BAB, size, magic enhancement, Dexterity/Strength for attack, and Dexterity/Strength for damage.
 */
export const calculatePathfinderWeaponStats = (
  weapon: Weapon,
  character: CharacterData,
  isMelee: boolean,
  options?: {
    forceDexToDamage?: boolean;
    forceAttackAttr?: 'GE' | 'ST';
    combatSettings?: PathfinderCombatSettings;
  }
): PathfinderWeaponStats => {
  const cs = options?.combatSettings || character.combatSettings;
  const geScore = getAttributeScore(character, 'GE');
  const stScore = getAttributeScore(character, 'ST');
  const geMod = calculatePathfinderModifier(geScore);
  const stMod = calculatePathfinderModifier(stScore);
  const babData = getBaseAttackBonus(character);
  const size = getCharacterSizeMod(character).attackAndAc;
  const hasFinesse = hasWeaponFinesse(character);
  const isFinesse = isFinesseWeapon(weapon.name, weapon);

  // Magic / Enhancement bonus (+1, +2, etc.)
  let magicBonus = weapon.magicBonus ?? 0;
  if (weapon.magicBonus === undefined) {
    const match = weapon.name.match(/\+(\d+)/);
    if (match) {
      magicBonus = parseInt(match[1], 10);
    }
  }

  // Determine attack attribute (GE vs ST)
  let effectiveAttackAttr: 'GE' | 'ST' = 'ST';
  if (options?.forceAttackAttr) {
    effectiveAttackAttr = options.forceAttackAttr;
  } else if (!isMelee) {
    effectiveAttackAttr = 'GE'; // Ranged weapons always use GE
  } else if (cs?.attackAttr) {
    // If user explicitly picked ST or GE, respect it (allowing ST even if weapon defaults or GE if finesse)
    if (cs.attackAttr === 'ST') {
      effectiveAttackAttr = 'ST';
    } else if (cs.attackAttr === 'GE') {
      effectiveAttackAttr = 'GE';
    } else {
      effectiveAttackAttr = (hasFinesse && isFinesse) ? 'GE' : 'ST';
    }
  } else if (weapon.attribute === 'GE') {
    effectiveAttackAttr = 'GE';
  } else if (weapon.attribute === 'ST') {
    effectiveAttackAttr = 'ST';
  } else {
    effectiveAttackAttr = (hasFinesse && isFinesse) ? 'GE' : 'ST';
  }

  const effectiveAttackMod = effectiveAttackAttr === 'GE' ? geMod : stMod;

  // Tactical combat modifiers
  let tacticalAttackBonus = 0;
  let tacticalDamageBonus = 0;
  const activeTactics: string[] = [];

  const isFlanking = cs?.isFlanking ?? false;
  const isHasted = cs?.isHasted ?? false;
  const isSneakAttack = cs?.isSneakAttack ?? false;
  const grip = cs?.grip || 'oneHanded';

  if (isFlanking && isMelee) {
    tacticalAttackBonus += 2;
    activeTactics.push('Flankiert (+2)');
  }
  if (isHasted) {
    tacticalAttackBonus += 1;
    activeTactics.push('Hast (+1 & Extra-Angriff)');
  }
  if (cs?.higherGround) {
    tacticalAttackBonus += 1;
    activeTactics.push('Höherer Stand (+1)');
  }
  if (cs?.targetProne) {
    const proneMod = isMelee ? 4 : -4;
    tacticalAttackBonus += proneMod;
    activeTactics.push(isMelee ? 'Ziel liegt (+4)' : 'Ziel liegt (-4)');
  }
  if (cs?.isStealthed) {
    tacticalAttackBonus += 2;
    activeTactics.push('Unsichtbar/Versteckt (+2)');
  }

  // Power Attack / Heftiger Angriff
  const paPenalty = 1 + Math.floor(babData.bab / 4);
  if (cs?.powerAttack && isMelee) {
    tacticalAttackBonus -= paPenalty;
    const paDmg = grip === 'twoHanded' ? (paPenalty * 3) : grip === 'offHand' ? paPenalty : (paPenalty * 2);
    tacticalDamageBonus += paDmg;
    activeTactics.push(`Heftiger Angriff (-${paPenalty} Atk / +${paDmg} Dmg)`);
  }

  if (cs?.customAttackMod) {
    tacticalAttackBonus += cs.customAttackMod;
    activeTactics.push(`Situativ (${formatPathfinderModifier(cs.customAttackMod)})`);
  }
  if (cs?.customDamageMod) {
    tacticalDamageBonus += cs.customDamageMod;
  }

  // Schurkenwaffe / Schwert der Subtilität check
  const sneakInfo = getWeaponSneakAttackBonus(weapon);
  const sneakDice = getCharacterSneakAttackDice(character);
  const sneakAttackBonusAttack = sneakInfo.attackBonus;
  const sneakAttackBonusDamage = sneakInfo.damageBonus;
  const hasSneakBonus = sneakInfo.hasBonus;

  // If sneak attack is active (explicitly toggled, or from flank/stealth), apply Schurkenwaffe to main calculation
  const applySneakBonusToAttack = (isSneakAttack || isFlanking || cs?.isStealthed) && hasSneakBonus;
  if (applySneakBonusToAttack) {
    tacticalAttackBonus += sneakAttackBonusAttack;
    tacticalDamageBonus += sneakAttackBonusDamage;
    activeTactics.push(`Schurkenwaffe (+${sneakAttackBonusAttack} Atk / +${sneakAttackBonusDamage} Dmg)`);
  }

  const singleAttackBonus = babData.bab + effectiveAttackMod + size + magicBonus + tacticalAttackBonus;
  const singleAttackFormatted = formatPathfinderModifier(singleAttackBonus);

  // Iteratives (Include extra attack at full BAB if Haste is active!)
  let rawIteratives = [...babData.iteratives];
  if (isHasted) {
    rawIteratives = [babData.bab, ...rawIteratives];
  }
  const attackIteratives = rawIteratives.map(b => b + effectiveAttackMod + size + magicBonus + tacticalAttackBonus);
  const calculatedAttackFormatted = attackIteratives.map(v => formatPathfinderModifier(v)).join(' / ');

  // Determine damage attribute (Pathfinder Dex to Damage / Finesse Training)
  let canUseDexToDmg = false;
  if (options?.forceDexToDamage !== undefined) {
    canUseDexToDmg = options.forceDexToDamage;
  } else if (cs?.damageAttr) {
    canUseDexToDmg = cs.damageAttr === 'GE';
  } else {
    canUseDexToDmg = hasDexToDamage(character);
  }

  let effectiveDamageAttr: 'GE' | 'ST' | 'NONE' = 'ST';
  if (!isMelee) {
    const isComposite = weapon.name.toLowerCase().includes('komposit') || weapon.name.toLowerCase().includes('composite');
    effectiveDamageAttr = isComposite ? 'ST' : 'NONE';
  } else if (options?.forceDexToDamage !== undefined) {
    effectiveDamageAttr = options.forceDexToDamage ? 'GE' : 'ST';
  } else if (cs?.damageAttr === 'GE') {
    effectiveDamageAttr = 'GE';
  } else if (cs?.damageAttr === 'ST') {
    effectiveDamageAttr = 'ST';
  } else if (weapon.damageAttribute === 'GE') {
    effectiveDamageAttr = 'GE';
  } else if (weapon.damageAttribute === 'ST') {
    effectiveDamageAttr = 'ST';
  } else if (weapon.damageAttribute === 'NONE') {
    effectiveDamageAttr = 'NONE';
  } else {
    effectiveDamageAttr = canUseDexToDmg ? 'GE' : 'ST';
  }

  const rawDamageMod = effectiveDamageAttr === 'GE'
    ? geMod
    : effectiveDamageAttr === 'ST'
    ? stMod
    : 0;

  // Scale damage modifier by grip (Einhand 1x, Zweihand 1.5x, Nebenhand 0.5x)
  let effectiveDamageMod = rawDamageMod;
  if (isMelee && effectiveDamageAttr !== 'NONE') {
    if (grip === 'twoHanded') {
      effectiveDamageMod = rawDamageMod > 0 ? Math.floor(rawDamageMod * 1.5) : rawDamageMod;
    } else if (grip === 'offHand') {
      effectiveDamageMod = rawDamageMod > 0 ? Math.floor(rawDamageMod * 0.5) : rawDamageMod;
    }
  }

  // Parse base dice (e.g. "1W3", "1W4", "1W6", "1")
  let baseDice = weapon.baseDice || "";
  let extraDamageText = "";
  if (!baseDice) {
    const diceMatch = weapon.damage.match(/^(\d+[Wd]\d+|\d+)/i);
    if (diceMatch) {
      baseDice = diceMatch[1].toUpperCase();
    } else {
      baseDice = isMelee ? "1W4" : "1W6";
    }
  }

  // Extract extra damage text like "+ 1W6 Eis"
  const extraMatch = weapon.damage.match(/(\+\s*\d+[Wd]\d+\s*[^,]+)/i);
  if (extraMatch) {
    extraDamageText = extraMatch[0].trim();
  }

  // Calculate flat damage bonus: attribute mod + magic bonus + tactical
  const totalFlatDamage = effectiveDamageMod + magicBonus + tacticalDamageBonus;
  let calculatedDamage = baseDice;
  if (totalFlatDamage > 0) {
    calculatedDamage = `${baseDice}+${totalFlatDamage}`;
  } else if (totalFlatDamage < 0) {
    calculatedDamage = `${baseDice}${totalFlatDamage}`;
  }

  if (extraDamageText && !calculatedDamage.includes(extraDamageText)) {
    calculatedDamage = `${calculatedDamage} ${extraDamageText}`;
  }

  // If Sneak Attack is active, append sneak attack dice
  if ((isSneakAttack || isFlanking || cs?.isStealthed) && sneakDice.formula) {
    if (!calculatedDamage.includes(sneakDice.formula)) {
      calculatedDamage = `${calculatedDamage} + ${sneakDice.formula}`;
    }
  }

  // Specific Sneak Attack variant values (for comparison & dedicated sneak display)
  const sneakAttackSingleBonus = singleAttackBonus + (applySneakBonusToAttack ? 0 : (hasSneakBonus ? sneakAttackBonusAttack : 0));
  const sneakAttackIteratives = attackIteratives.map(v => v + (applySneakBonusToAttack ? 0 : (hasSneakBonus ? sneakAttackBonusAttack : 0)));
  const sneakAttackAttackFormatted = sneakAttackIteratives.map(v => formatPathfinderModifier(v)).join(' / ');

  const totalSneakFlatDamage = totalFlatDamage + (applySneakBonusToAttack ? 0 : (hasSneakBonus ? sneakAttackBonusDamage : 0));
  let sneakDamageBase = baseDice;
  if (totalSneakFlatDamage > 0) {
    sneakDamageBase = `${baseDice}+${totalSneakFlatDamage}`;
  } else if (totalSneakFlatDamage < 0) {
    sneakDamageBase = `${baseDice}${totalSneakFlatDamage}`;
  }

  let sneakAttackDamage = sneakDamageBase;
  if (sneakDice.formula) {
    sneakAttackDamage = `${sneakAttackDamage} + ${sneakDice.formula}`;
  }
  if (extraDamageText && !sneakAttackDamage.includes(extraDamageText)) {
    sneakAttackDamage = `${sneakAttackDamage} ${extraDamageText}`;
  }

  const sneakBonusDescription = hasSneakBonus
    ? `+${sneakAttackBonusAttack} Angriffsbonus & +${sneakAttackBonusDamage} Schaden bei Hinterhältigem Angriff (${sneakInfo.source})`
    : "";

  let attackFormulaParts = [
    `GAB (${formatPathfinderModifier(babData.bab)})`,
    `${effectiveAttackAttr} (${formatPathfinderModifier(effectiveAttackMod)})`,
    `Größe (${formatPathfinderModifier(size)})`
  ];
  if (magicBonus > 0) attackFormulaParts.push(`Magie (+${magicBonus})`);
  if (tacticalAttackBonus !== 0) attackFormulaParts.push(`Taktik (${formatPathfinderModifier(tacticalAttackBonus)})`);
  const attackFormula = attackFormulaParts.join(' + ');

  let damageFormulaParts = [
    baseDice,
    `${effectiveDamageAttr}${grip === 'twoHanded' ? ' 1.5x' : grip === 'offHand' ? ' 0.5x' : ''} (${formatPathfinderModifier(effectiveDamageMod)})`
  ];
  if (magicBonus > 0) damageFormulaParts.push(`Magie (+${magicBonus})`);
  if (tacticalDamageBonus !== 0) damageFormulaParts.push(`Taktik (${formatPathfinderModifier(tacticalDamageBonus)})`);
  if (extraDamageText) damageFormulaParts.push(extraDamageText);
  if ((isSneakAttack || isFlanking || cs?.isStealthed) && sneakDice.formula) damageFormulaParts.push(sneakDice.formula);
  const damageFormula = damageFormulaParts.join(' + ');

  const differsFromSaved = weapon.attack !== calculatedAttackFormatted || weapon.damage !== calculatedDamage;

  return {
    weapon,
    isMelee,
    isFinesse,
    effectiveAttackAttr,
    effectiveAttackMod,
    effectiveDamageAttr,
    effectiveDamageMod,
    magicBonus,
    baseDice,
    extraDamageText,
    calculatedAttack: singleAttackBonus,
    calculatedAttackFormatted,
    attackIteratives,
    singleAttackBonus,
    singleAttackFormatted,
    calculatedDamage,
    damageFormula,
    attackFormula,
    differsFromSaved,
    tacticalAttackBonus,
    tacticalDamageBonus,
    activeTactics,
    grip,
    isHasted,
    isFlanking,
    hasSneakBonus,
    sneakAttackBonusAttack,
    sneakAttackBonusDamage,
    sneakAttackSingleBonus,
    sneakAttackAttackFormatted,
    sneakAttackDamage,
    sneakBonusDescription
  };
};

/**
 * Calculates dynamic combat combinations updating rolls and damages to reflect
 * live Dexterity and Strength attributes, including Sneak Attack and Finesse.
 */
export const calculateDynamicCombos = (
  character: CharacterData,
  options?: { forceDexToDamage?: boolean }
): CombatCombo[] => {
  if (!character.combos || character.combos.length === 0) return [];

  const geScore = getAttributeScore(character, 'GE');
  const stScore = getAttributeScore(character, 'ST');
  const geMod = calculatePathfinderModifier(geScore);
  const stMod = calculatePathfinderModifier(stScore);
  const babData = getBaseAttackBonus(character);
  const size = getCharacterSizeMod(character).attackAndAc;
  const useDexToDmg = options?.forceDexToDamage !== undefined
    ? options.forceDexToDamage
    : (character.combatSettings?.damageAttr ? character.combatSettings.damageAttr === 'GE' : hasDexToDamage(character));

  const dagger = character.weapons?.melee?.find(w => w.name.toLowerCase().includes('dolch')) || character.weapons?.melee?.[0];
  const shortsword = character.weapons?.melee?.find(w => w.name.toLowerCase().includes('kurzschwert')) || character.weapons?.melee?.[1] || character.weapons?.melee?.[0];

  const daggerStats = dagger ? calculatePathfinderWeaponStats(dagger, character, true, { forceDexToDamage: useDexToDmg, combatSettings: character.combatSettings }) : null;
  const shortswordStats = shortsword ? calculatePathfinderWeaponStats(shortsword, character, true, { forceDexToDamage: useDexToDmg, combatSettings: character.combatSettings }) : null;

  const daggerDmg = daggerStats ? daggerStats.calculatedDamage : `1W3+${(useDexToDmg ? geMod : stMod) + 2} + 1W6 Eis`;
  const shortswordDmg = shortswordStats ? shortswordStats.calculatedDamage : `1W4+${(useDexToDmg ? geMod : stMod) + 1}`;

  // Two-Weapon Fighting base attack rolls
  const mainAttack1 = Math.max(1, babData.bab + geMod + size + (daggerStats?.magicBonus || 2) - 2);
  const mainAttack2 = Math.max(1, (babData.iteratives[1] ?? 1) + geMod + size + (daggerStats?.magicBonus || 2) - 2);
  const offAttack1 = Math.max(1, babData.bab + geMod + size + (shortswordStats?.magicBonus || 1) - 2);
  const offAttack2 = Math.max(1, (babData.iteratives[1] ?? 1) + geMod + size + (shortswordStats?.magicBonus || 1) - 2);

  return character.combos.map(combo => {
    const titleLower = (combo.title || '').toLowerCase();

    // Combo 1: "Angriff aus der Bewegung"
    if (titleLower.includes('bewegung') || combo.id === '1') {
      const singleDaggerBonus = daggerStats ? daggerStats.singleAttackBonus : babData.bab + geMod + size + 2;
      const singleShortswordBonus = shortswordStats ? shortswordStats.singleAttackBonus : babData.bab + geMod + size + 1;

      const newWeapons = (combo.weapons || []).map(w => {
        const isDagger = w.name.toLowerCase().includes('dolch');
        const rollBonus = isDagger ? singleDaggerBonus : singleShortswordBonus;
        const dmgStr = isDagger ? daggerDmg : shortswordDmg;
        return {
          ...w,
          roll: `W20+${rollBonus}`,
          damage: dmgStr,
          notes: (w.notes || []).map(n => {
            if (n.includes('Bestätigung')) {
              return `Kritisch: 19-20 (Bestätigung W20+${rollBonus})`;
            }
            if (n.includes('HA:') && isDagger) {
              return `HA: +5W6 + 5 Blutung/Runde`;
            }
            if (n.includes('HA:') && !isDagger) {
              return `HA: Angriff W20+${rollBonus + 2}, Schaden ${shortswordDmg} + 5W6`;
            }
            return n;
          })
        };
      });
      return { ...combo, weapons: newWeapons };
    }

    // Combo 2 / 4: "Voller Angriff – Zwei Waffen"
    if (titleLower.includes('zwei waffen') || combo.id === '4') {
      if (!combo.table) return combo;
      const deltaGe = geMod - 4;
      const rows = [
        ["1. Haupthand", dagger?.name || "Dolch des Eises +2", `W20+${12 + deltaGe}`, daggerDmg],
        ["2. Haupthand", dagger?.name || "Dolch des Eises +2", `W20+${10 + deltaGe}`, daggerDmg],
        ["3. Nebenhand", shortsword?.name || "Schurkenkurzschwert +1", `W20+${11 + deltaGe}`, shortswordDmg],
        ["4. Nebenhand (verb.)", shortsword?.name || "Schurkenkurzschwert +1", `W20+${9 + deltaGe}`, shortswordDmg],
      ];
      return {
        ...combo,
        table: {
          ...combo.table,
          rows
        },
        notes: [
          `Waffenfinesse aktiv (${formatPathfinderModifier(geMod)} GE auf Angriff)`,
          useDexToDmg ? `Schurken-Finesse: ${formatPathfinderModifier(geMod)} GE auf Schaden einkalkuliert` : `Stärkebonus (${formatPathfinderModifier(stMod)}) im Grundschaden`,
          "Verteidigung mit zwei Waffen: +1 Schildbonus auf RK"
        ]
      };
    }

    // Combo 3 / 5: "Optimaler Schadenszug (HA)"
    if (titleLower.includes('schadenszug') || combo.id === '5') {
      if (!combo.table) return combo;
      const deltaGe = geMod - 4;
      const daggerStaticDmg = (useDexToDmg ? geMod : stMod) + (daggerStats?.magicBonus || 2);
      const shortswordStaticDmg = (useDexToDmg ? geMod : stMod) + (shortswordStats?.magicBonus || 1);
      const dDmg = `1W3+${daggerStaticDmg} + 1W6 Eis`;
      const sDmg = `1W4+${shortswordStaticDmg}`;

      const rows = [
        ["Treffer 1", `W20+${11 + deltaGe}`, `${dDmg} + 5W6 + 5 Blutung`],
        ["Treffer 2", `W20+${9 + deltaGe}`, `${dDmg} + 5W6`],
        ["Treffer 3", `W20+${13 + deltaGe}`, `${sDmg} + 5W6`],
        ["Treffer 4", `W20+${11 + deltaGe}`, `${sDmg} + 5W6`],
      ];
      return {
        ...combo,
        description: "Bedingung: Flankiert, Überrascht oder GE-Verlust.",
        table: {
          ...combo.table,
          headers: ["Angriff", "Wurf", "Schaden gesamt"],
          rows
        },
        notes: [
          useDexToDmg ? `Geschicklichkeitsbonus (${formatPathfinderModifier(geMod)}) vollständig in alle Schadenszüge einkalkuliert!` : `Stärkebonus (${formatPathfinderModifier(stMod)}) im Grundschaden`,
          "Blutung gilt nur einmal (+5 TP/Runde)",
          "Hinterhältiger Angriff: +5W6 pro Treffer separat",
          "Kein HA gegen Untote / Konstrukte"
        ]
      };
    }

    return combo;
  });
};

export interface DamageSequenceAttackResult {
  title: string;
  weaponName: string;
  attackRollFormatted: string;
  attackBonus: number;
  damageFormula: string;
  baseDamageDice: string;
  attributeBonus: number;
  attributeName: string;
  magicBonus: number;
  extraElemental: string;
  sneakAttackDice: string;
  bleedDamage: number;
  minDamage: number;
  avgDamage: number;
  maxDamage: number;
}

/**
 * Calculates a complete attack-and-damage sequence for the full sneak attack routine ("Optimaler Schadenszug")
 * breaking down each hit with its exact attribute contribution (Dexterity vs Strength).
 */
export const calculateOptimalDamageSequence = (
  character: CharacterData,
  options?: {
    useDexToDamage?: boolean;
    includeSneakAttack?: boolean;
    flankBonus?: number;
    combatSettings?: PathfinderCombatSettings;
  }
): {
  attacks: DamageSequenceAttackResult[];
  totalMin: number;
  totalAvg: number;
  totalMax: number;
  dexPortionTotal: number;
  sneakAttackTotalDice: string;
  summaryFormula: string;
} => {
  const cs = options?.combatSettings || character.combatSettings;
  const geScore = getAttributeScore(character, 'GE');
  const geMod = calculatePathfinderModifier(geScore);
  const stScore = getAttributeScore(character, 'ST');
  const stMod = calculatePathfinderModifier(stScore);
  const babData = getBaseAttackBonus(character);
  const size = getCharacterSizeMod(character).attackAndAc;

  const isFlanking = cs ? cs.isFlanking : true;
  const isHasted = cs ? cs.isHasted : false;
  const isSneak = cs ? (cs.isSneakAttack || cs.isFlanking || cs.isStealthed) : true;
  const attackAttr = cs?.attackAttr || 'GE';
  const attackMod = attackAttr === 'GE' ? geMod : stMod;

  const useDex = options?.useDexToDamage !== undefined
    ? options.useDexToDamage
    : (cs?.damageAttr ? cs.damageAttr === 'GE' : hasDexToDamage(character));

  const includeHA = options?.includeSneakAttack !== undefined ? options.includeSneakAttack : isSneak;
  const flank = options?.flankBonus !== undefined ? options.flankBonus : (isFlanking ? 2 : 0);

  const attrName = useDex ? 'GE' : 'ST';
  const attrBonus = useDex ? geMod : stMod;

  const hasteBonus = isHasted ? 1 : 0;
  const tacticalMod = (cs?.customAttackMod || 0) + (cs?.higherGround ? 1 : 0) + (cs?.isStealthed ? 2 : 0) + (cs?.targetProne ? 4 : 0);

  // Two-Weapon fighting with BAB +9/+4, magic +2 on dagger, +1 on shortsword, size +1, TWF penalty -2:
  // Base dagger: GAB (9) + AtkAttr + Size(1) + Magic(2) - 2 + Flank + Haste + Tactical
  const baseDagger1 = babData.bab + attackMod + size + 2 - 2 + flank + hasteBonus + tacticalMod;
  const baseDagger2 = (babData.iteratives[1] ?? 4) + attackMod + size + 2 - 2 + flank + hasteBonus + tacticalMod;

  // Shortsword: GAB (9) + AtkAttr + Size(1) + Magic(1) - 2 + Flank + Haste + Tactical
  const baseShortsword1 = babData.bab + attackMod + size + 1 - 2 + flank + hasteBonus + tacticalMod;
  const baseShortsword2 = (babData.iteratives[1] ?? 4) + attackMod + size + 1 - 2 + flank + hasteBonus + tacticalMod;

  const hit1Atk = baseDagger1;
  const hit2Atk = baseDagger2;
  const hit3Atk = baseShortsword1;
  const hit4Atk = baseShortsword2;

  const daggerFlat = attrBonus + 2;
  const shortswordWeapon = character.weapons?.melee?.find(w => w.name.toLowerCase().includes('kurzschwert')) || character.weapons?.melee?.[1];
  const shortswordSneak = shortswordWeapon ? getWeaponSneakAttackBonus(shortswordWeapon) : { attackBonus: 4, damageBonus: 4, hasBonus: true, source: "" };
  const shortswordSneakAtkBonus = includeHA ? (shortswordSneak.attackBonus || 4) : 0;
  const shortswordSneakDmgBonus = includeHA ? (shortswordSneak.damageBonus || 4) : 0;
  const shortswordFlat = attrBonus + 1 + shortswordSneakDmgBonus;

  // Attacks:
  // 1. Haupthand Dolch +2
  // 2. Haupthand Dolch +2 (iterative)
  // 3. Nebenhand Schurkenkurzschwert +1 (inkl. +4 Angriff & +4 Schaden bei HA)
  // 4. Nebenhand Schurkenkurzschwert +1 (iterative, inkl. +4 Angriff & +4 Schaden bei HA)
  const attacks: DamageSequenceAttackResult[] = [
    {
      title: "Treffer 1 (Haupthand)",
      weaponName: "Dolch des Eises +2",
      attackRollFormatted: `W20+${hit1Atk}`,
      attackBonus: hit1Atk,
      damageFormula: `1W3+${daggerFlat} + 1W6 Eis${includeHA ? ' + 5W6 + 5 Blutung' : ''}`,
      baseDamageDice: "1W3",
      attributeBonus: attrBonus,
      attributeName: attrName,
      magicBonus: 2,
      extraElemental: "1W6 Eis",
      sneakAttackDice: includeHA ? "5W6" : "",
      bleedDamage: 5,
      minDamage: 1 + attrBonus + 2 + 1 + (includeHA ? 5 : 0) + 5,
      avgDamage: 2 + attrBonus + 2 + 3.5 + (includeHA ? 17.5 : 0) + 5,
      maxDamage: 3 + attrBonus + 2 + 6 + (includeHA ? 30 : 0) + 5,
    },
    {
      title: "Treffer 2 (Haupthand 2. Angriff)",
      weaponName: "Dolch des Eises +2",
      attackRollFormatted: `W20+${hit2Atk}`,
      attackBonus: hit2Atk,
      damageFormula: `1W3+${daggerFlat} + 1W6 Eis${includeHA ? ' + 5W6' : ''}`,
      baseDamageDice: "1W3",
      attributeBonus: attrBonus,
      attributeName: attrName,
      magicBonus: 2,
      extraElemental: "1W6 Eis",
      sneakAttackDice: includeHA ? "5W6" : "",
      bleedDamage: 0,
      minDamage: 1 + attrBonus + 2 + 1 + (includeHA ? 5 : 0),
      avgDamage: 2 + attrBonus + 2 + 3.5 + (includeHA ? 17.5 : 0),
      maxDamage: 3 + attrBonus + 2 + 6 + (includeHA ? 30 : 0),
    },
    {
      title: `Treffer 3 (Nebenhand${shortswordSneakAtkBonus > 0 ? ` +${shortswordSneakAtkBonus} Schurkenwaffe` : ''})`,
      weaponName: "Schurkenkurzschwert +1",
      attackRollFormatted: `W20+${hit3Atk + shortswordSneakAtkBonus}`,
      attackBonus: hit3Atk + shortswordSneakAtkBonus,
      damageFormula: `1W4+${shortswordFlat}${includeHA ? ' + 5W6' : ''}${shortswordSneakDmgBonus > 0 ? ` (inkl. +${shortswordSneakDmgBonus} Schurkenbonus)` : ''}`,
      baseDamageDice: "1W4",
      attributeBonus: attrBonus,
      attributeName: attrName,
      magicBonus: 1,
      extraElemental: "",
      sneakAttackDice: includeHA ? "5W6" : "",
      bleedDamage: 0,
      minDamage: 1 + shortswordFlat + (includeHA ? 5 : 0),
      avgDamage: 2.5 + shortswordFlat + (includeHA ? 17.5 : 0),
      maxDamage: 4 + shortswordFlat + (includeHA ? 30 : 0),
    },
    {
      title: `Treffer 4 (Nebenhand 2. Angriff${shortswordSneakAtkBonus > 0 ? ` +${shortswordSneakAtkBonus} Schurkenwaffe` : ''})`,
      weaponName: "Schurkenkurzschwert +1",
      attackRollFormatted: `W20+${hit4Atk + shortswordSneakAtkBonus}`,
      attackBonus: hit4Atk + shortswordSneakAtkBonus,
      damageFormula: `1W4+${shortswordFlat}${includeHA ? ' + 5W6' : ''}${shortswordSneakDmgBonus > 0 ? ` (inkl. +${shortswordSneakDmgBonus} Schurkenbonus)` : ''}`,
      baseDamageDice: "1W4",
      attributeBonus: attrBonus,
      attributeName: attrName,
      magicBonus: 1,
      extraElemental: "",
      sneakAttackDice: includeHA ? "5W6" : "",
      bleedDamage: 0,
      minDamage: 1 + shortswordFlat + (includeHA ? 5 : 0),
      avgDamage: 2.5 + shortswordFlat + (includeHA ? 17.5 : 0),
      maxDamage: 4 + shortswordFlat + (includeHA ? 30 : 0),
    }
  ];

  const totalMin = attacks.reduce((acc, a) => acc + a.minDamage, 0);
  const totalAvg = attacks.reduce((acc, a) => acc + a.avgDamage, 0);
  const totalMax = attacks.reduce((acc, a) => acc + a.maxDamage, 0);
  const dexPortionTotal = useDex ? (geMod * attacks.length) : 0;

  return {
    attacks,
    totalMin,
    totalAvg,
    totalMax,
    dexPortionTotal,
    sneakAttackTotalDice: includeHA ? "20W6" : "0",
    summaryFormula: `2x 1W3 + 2x 1W4 + 2x 1W6 Eis + 6 Magie + 4x ${attrName} (${4 * attrBonus})${includeHA ? ' + 20W6 HA + 5 Blutung' : ''}`
  };
};

/**
 * Standardizes saving throw stats in data.stats for Pathfinder characters.
 */
export const syncPathfinderStats = (
  stats: { label: string; value: string | number; secondary?: string | number; modifier?: number; damage?: number }[],
  savingThrows?: PathfinderSavingThrows
) => {
  if (!savingThrows || !savingThrows.fortitude || !savingThrows.reflex || !savingThrows.will) return stats;

  const fortTotal = savingThrows.fortitude.total ?? 0;
  const refTotal = savingThrows.reflex.total ?? 0;
  const willTotal = savingThrows.will.total ?? 0;

  const fortStr = fortTotal >= 0 ? `+${fortTotal}` : `${fortTotal}`;
  const refStr = refTotal >= 0 ? `+${refTotal}` : `${refTotal}`;
  const willStr = willTotal >= 0 ? `+${willTotal}` : `${willTotal}`;

  let hasFort = false;
  let hasRef = false;
  let hasWill = false;

  const updated = stats.map(s => {
    const l = s.label.toLowerCase();
    if (l.includes('zähigkeit') || l.includes('fortitude')) {
      hasFort = true;
      return { ...s, label: "Zähigkeit (Konstitution)", value: fortStr };
    }
    if (l.includes('reflex')) {
      hasRef = true;
      return { ...s, label: "Reflex (Geschicklichkeit)", value: refStr };
    }
    if (l.includes('wille') || l.includes('will')) {
      hasWill = true;
      return { ...s, label: "Wille (Weisheit)", value: willStr };
    }
    return s;
  });

  if (!hasFort) {
    updated.push({ label: "Zähigkeit (Konstitution)", value: fortStr });
  }
  if (!hasRef) {
    updated.push({ label: "Reflex (Geschicklichkeit)", value: refStr });
  }
  if (!hasWill) {
    updated.push({ label: "Wille (Weisheit)", value: willStr });
  }

  return updated;
};

