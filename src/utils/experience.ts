import { GameSystem } from '../types';

export interface XpTrackThresholds {
  fast: number[];
  medium: number[];
  slow: number[];
}

// Official Pathfinder 1e Experience Point Tables (Levels 1 to 20)
export const PATHFINDER_XP_TABLE: XpTrackThresholds = {
  fast: [
    0,         // Lvl 1
    1300,      // Lvl 2
    3300,      // Lvl 3
    6000,      // Lvl 4
    10000,     // Lvl 5
    15000,     // Lvl 6
    23000,     // Lvl 7
    34000,     // Lvl 8
    50000,     // Lvl 9
    71000,     // Lvl 10
    105000,    // Lvl 11
    145000,    // Lvl 12
    210000,    // Lvl 13
    295000,    // Lvl 14
    425000,    // Lvl 15
    60000,    // Lvl 16
    850000,    // Lvl 17
    1200000,   // Lvl 18
    1700000,   // Lvl 19
    2400000    // Lvl 20
  ],
  medium: [
    0,         // Lvl 1
    2000,      // Lvl 2
    5000,      // Lvl 3
    9000,      // Lvl 4
    15000,     // Lvl 5
    23000,     // Lvl 6
    35000,     // Lvl 7
    51000,     // Lvl 8
    75000,     // Lvl 9
    105000,    // Lvl 10
    155000,    // Lvl 11
    220000,    // Lvl 12
    315000,    // Lvl 13
    445000,    // Lvl 14
    635000,    // Lvl 15
    890000,    // Lvl 16
    1300000,   // Lvl 17
    1800000,   // Lvl 18
    2550000,   // Lvl 19
    3600000    // Lvl 20
  ],
  slow: [
    0,         // Lvl 1
    3000,      // Lvl 2
    7500,      // Lvl 3
    14000,     // Lvl 4
    23000,     // Lvl 5
    35000,     // Lvl 6
    53000,     // Lvl 7
    77000,     // Lvl 8
    115000,    // Lvl 9
    160000,    // Lvl 10
    235000,    // Lvl 11
    330000,    // Lvl 12
    475000,    // Lvl 13
    670000,    // Lvl 14
    955000,    // Lvl 15
    1335000,   // Lvl 16
    1900000,   // Lvl 17
    2700000,   // Lvl 18
    3850000,   // Lvl 19
    5350000    // Lvl 20
  ]
};

/**
 * Parses the current level from character subtitle or text.
 * Examples: "Level 9 Gnom Dieb" -> 9, "Stufe 3 Alchemist" -> 3, "Kämpfer 5" -> 5
 */
export function extractCharacterLevel(subTitle?: string): number {
  if (!subTitle) return 1;
  const match = subTitle.match(/(?:level|stufe|grad)\s*(\d+)/i);
  if (match && match[1]) {
    const lvl = parseInt(match[1], 10);
    if (!isNaN(lvl) && lvl >= 1 && lvl <= 30) return lvl;
  }
  const anyNumMatch = subTitle.match(/\b(\d+)\b/);
  if (anyNumMatch && anyNumMatch[1]) {
    const num = parseInt(anyNumMatch[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 20) return num;
  }
  return 1;
}

/**
 * Returns the threshold XP required to reach the specified level.
 */
export function getXpThresholdForLevel(
  level: number,
  track: 'fast' | 'medium' | 'slow' = 'medium'
): number {
  const table = PATHFINDER_XP_TABLE[track] || PATHFINDER_XP_TABLE.medium;
  const clampedLevel = Math.max(1, Math.min(level, 20));
  return table[clampedLevel - 1] ?? 0;
}

export interface LevelUpXpStatus {
  currentLevel: number;
  nextLevel: number;
  currentXp: number;
  currentLevelFloorXp: number;
  nextLevelThresholdXp: number;
  remainingXp: number;
  progressPercent: number;
  isReadyForLevelUp: boolean;
  track: 'fast' | 'medium' | 'slow';
}

/**
 * Calculates full progress, remaining XP and whether level up is available.
 */
export function calculateXpStatus(
  currentXp: number,
  subTitle?: string,
  track: 'fast' | 'medium' | 'slow' = 'medium'
): LevelUpXpStatus {
  const currentLevel = extractCharacterLevel(subTitle);
  const nextLevel = Math.min(currentLevel + 1, 20);

  const currentLevelFloorXp = getXpThresholdForLevel(currentLevel, track);
  const nextLevelThresholdXp = getXpThresholdForLevel(nextLevel, track);

  const remainingXp = Math.max(0, nextLevelThresholdXp - currentXp);
  const isReadyForLevelUp = currentXp >= nextLevelThresholdXp && currentLevel < 20;

  // Percentage between this level's floor and next level
  const levelSpan = Math.max(1, nextLevelThresholdXp - currentLevelFloorXp);
  const gainedInLevel = Math.max(0, currentXp - currentLevelFloorXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((gainedInLevel / levelSpan) * 100)));

  return {
    currentLevel,
    nextLevel,
    currentXp,
    currentLevelFloorXp,
    nextLevelThresholdXp,
    remainingXp,
    progressPercent,
    isReadyForLevelUp,
    track
  };
}
