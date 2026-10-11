import { PathfinderCoins } from '../types';

/**
 * Rates in Pathfinder:
 * 1 Platin (PM) = 10 Gold (GM)
 * 1 Gold (GM) = 1 GM
 * 1 Silber (SM) = 0.1 GM (10 SM = 1 GM)
 * 1 Kupfer (KM) = 0.01 GM (100 KM = 1 GM)
 */

export const COIN_CONVERSION = {
  ppToGp: 10,
  gpToGp: 1,
  spToGp: 0.1,
  cpToGp: 0.01,
  gpToSp: 10,
  gpToCp: 100,
  coinsPerPound: 50 // In Pathfinder, 50 coins of any type weigh 1 pound (ca. 0.5 kg)
};

/**
 * Calculates the total net worth in Goldmünzen (GM).
 */
export function calculateTotalGold(coins?: Partial<PathfinderCoins>): number {
  if (!coins) return 0;
  const pp = coins.pp || 0;
  const gp = coins.gp || 0;
  const sp = coins.sp || 0;
  const cp = coins.cp || 0;
  const total = pp * 10 + gp + sp * 0.1 + cp * 0.01;
  return Math.round(total * 100) / 100;
}

/**
 * Returns total weight in pounds (50 Münzen = 1 Pfund).
 */
export function calculateCoinWeight(coins?: Partial<PathfinderCoins>): { count: number; weightPounds: number } {
  if (!coins) return { count: 0, weightPounds: 0 };
  const totalCount = (coins.pp || 0) + (coins.gp || 0) + (coins.sp || 0) + (coins.cp || 0);
  const weightPounds = Math.round((totalCount / COIN_CONVERSION.coinsPerPound) * 10) / 10;
  return { count: totalCount, weightPounds };
}

/**
 * Consolidates smaller coins into higher denominations (e.g. 150 KM -> 1 GM, 5 SM).
 */
export function consolidateCoins(coins: PathfinderCoins): PathfinderCoins {
  let totalCopper = (coins.pp || 0) * 1000 + (coins.gp || 0) * 100 + (coins.sp || 0) * 10 + (coins.cp || 0);

  const pp = Math.floor(totalCopper / 1000);
  totalCopper %= 1000;

  const gp = Math.floor(totalCopper / 100);
  totalCopper %= 100;

  const sp = Math.floor(totalCopper / 10);
  totalCopper %= 10;

  const cp = totalCopper;

  return { pp, gp, sp, cp };
}

/**
 * Breaks down high coins into standard gold/silver/copper for easier spending.
 */
export function breakdownPlatinum(coins: PathfinderCoins): PathfinderCoins {
  const extraGold = (coins.pp || 0) * 10;
  return {
    pp: 0,
    gp: (coins.gp || 0) + extraGold,
    sp: coins.sp || 0,
    cp: coins.cp || 0
  };
}
