export const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;

export const rollDice = (count: number, sides: number): number => {
  let sum = 0;
  for (let i = 0; i < count; i++) sum += rollDie(sides);
  return sum;
};

export const rollPool = (count: number, rollFn: () => number): number[] =>
  Array.from({ length: count }, () => rollFn());

/** Klassisches 4W6, niedrigsten Wurf verwerfen (Pathfinder/D&D-Standardarray). */
export const roll4d6DropLowest = (): number => {
  const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};
