import { Stat, ShadowrunLimitData } from '../types';

export interface CalculatedLimits {
  physicalBase: number;
  physicalTotal: number;
  mentalBase: number;
  mentalTotal: number;
  socialBase: number;
  socialTotal: number;
  astralBase: number;
  astralTotal: number;
  // Extracted characteristics used in calculation
  kon: number;
  sta: number;
  rea: number;
  log: number;
  int: number;
  wil: number;
  cha: number;
  ess: number;
}

const parseNum = (val: string | number | undefined, defaultVal = 0): number => {
  if (val === undefined || val === null) return defaultVal;
  const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/,/g, '.'));
  return isNaN(num) ? defaultVal : num;
};

export function calculateShadowrunLimits(
  characteristics: Stat[] = [],
  stats: Stat[] = [],
  customLimits?: ShadowrunLimitData
): CalculatedLimits {
  const findChar = (keys: string[]): number => {
    const item = characteristics.find(c => 
      keys.some(k => c.label.toLowerCase() === k.toLowerCase() || c.label.toLowerCase().includes(k.toLowerCase()))
    );
    return parseNum(item?.value, 0);
  };

  const kon = findChar(['KON', 'Konstitution', 'Body']);
  const sta = findChar(['STÄ', 'Stärke', 'Strength']);
  const rea = findChar(['REA', 'Reaktion', 'Reaction']);
  const log = findChar(['LOG', 'Logik', 'Logic']);
  const int = findChar(['INT', 'Intuition']);
  const wil = findChar(['WIL', 'Willenskraft', 'Willpower']);
  const cha = findChar(['CHA', 'Charisma']);

  // Extract Essence from stats (default 6 if not present)
  const essStat = stats.find(s => 
    s.label.toLowerCase().includes('essenz') || s.label.toLowerCase().includes('essence')
  );
  const ess = essStat !== undefined ? parseNum(essStat.value, 6) : 6;

  // Formula SR5:
  // Körperliches Limit: [(STÄ x 2) + KON + REA] / 3 (aufgerundet)
  const physicalBase = Math.ceil(((sta * 2) + kon + rea) / 3) || 1;

  // Geistiges Limit: [(LOG x 2) + INT + WIL] / 3 (aufgerundet)
  const mentalBase = Math.ceil(((log * 2) + int + wil) / 3) || 1;

  // Soziales Limit: [(CHA x 2) + WIL + Essenz] / 3 (aufgerundet)
  const socialBase = Math.ceil(((cha * 2) + wil + ess) / 3) || 1;

  // Astrales Limit: Höchster Wert aus Geistigem oder Sozialem Limit
  const astralBase = Math.max(mentalBase, socialBase);

  // Apply mods or overrides
  const physicalTotal = customLimits?.physicalOverride !== undefined 
    ? customLimits.physicalOverride 
    : Math.max(1, physicalBase + (customLimits?.physicalMod || 0));

  const mentalTotal = customLimits?.mentalOverride !== undefined 
    ? customLimits.mentalOverride 
    : Math.max(1, mentalBase + (customLimits?.mentalMod || 0));

  const socialTotal = customLimits?.socialOverride !== undefined 
    ? customLimits.socialOverride 
    : Math.max(1, socialBase + (customLimits?.socialMod || 0));

  const astralTotal = customLimits?.astralOverride !== undefined 
    ? customLimits.astralOverride 
    : Math.max(1, astralBase + (customLimits?.astralMod || 0));

  return {
    physicalBase,
    physicalTotal,
    mentalBase,
    mentalTotal,
    socialBase,
    socialTotal,
    astralBase,
    astralTotal,
    kon,
    sta,
    rea,
    log,
    int,
    wil,
    cha,
    ess
  };
}
