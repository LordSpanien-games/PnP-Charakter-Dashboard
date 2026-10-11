import { GameSystem, Stat } from "../types";

// Würfelt n Würfel mit s Seiten und gibt die Summe zurück
const rollDice = (n: number, sides: number): number => {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.floor(Math.random() * sides) + 1;
  }
  return sum;
};

// 4W6, niedrigsten Wurf verwerfen (klassische Pathfinder/D&D Methode)
const roll4d6DropLowest = (): number => {
  const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};

export type GenerationMethod = "standard" | "random";

export interface GeneratedAttribute {
  label: string;
  value: number;
}

/**
 * Generiert Attribute für ein Spielsystem.
 * method "standard" = feste, ausgewogene Werte
 * method "random" = systemgerecht ausgewürfelt
 */
export const generateAttributes = (
  system: GameSystem,
  method: GenerationMethod
): GeneratedAttribute[] => {
  switch (system) {
    case "pathfinder": {
      const labels = [
        "Stärke (ST)",
        "Geschicklichkeit (GE)",
        "Konstitution (KO)",
        "Intelligenz (IN)",
        "Weisheit (WE)",
        "Charisma (CH)",
      ];
      if (method === "standard") {
        // Standardarray nach Pathfinder-Regeln
        return labels.map((label, i) => ({
          label,
          value: [15, 14, 13, 12, 10, 8][i],
        }));
      }
      // 4W6 drop lowest, pro Attribut
      return labels.map((label) => ({ label, value: roll4d6DropLowest() }));
    }

    case "coc7e":
    case "coc1920": {
      // STR, CON, DEX, APP = 3W6x5 | SIZ, INT, EDU = (2W6+6)x5
      const rolled3x5 = ["Stärke (ST)", "Konstitution (KO)", "Geschicklichkeit (GE)", "Erscheinung (ER)"];
      const rolled2plus6x5 = ["Größe (GR)", "Intelligenz (IN)", "Bildung (BI)"];
      const macht = "Macht (MA)";

      const result: GeneratedAttribute[] = [];
      [...rolled3x5].forEach((label) => {
        result.push({ label, value: method === "standard" ? 50 : rollDice(3, 6) * 5 });
      });
      [...rolled2plus6x5].forEach((label) => {
        result.push({ label, value: method === "standard" ? 60 : (rollDice(2, 6) + 6) * 5 });
      });
      result.push({ label: macht, value: method === "standard" ? 50 : rollDice(3, 6) * 5 });
      return result;
    }

    case "shadowrun": {
      const labels = [
        "Konstitution", "Geschicklichkeit", "Reaktion", "Stärke",
        "Charisma", "Intuition", "Logik", "Willenskraft",
      ];
      // Standard: alle 3 (solide Priority-C-Verteilung) | Zufällig: 1-6 pro Attribut
      return labels.map((label) => ({
        label,
        value: method === "standard" ? 3 : Math.floor(Math.random() * 6) + 1,
      }));
    }

    case "traveller": {
      const labels = [
        "Stärke (STR)", "Geschicklichkeit (DEX)", "Ausdauer (END)",
        "Intelligenz (INT)", "Bildung (EDU)", "Sozial (SOC)",
      ];
      // Traveller-Standard: 2W6 pro Attribut
      return labels.map((label) => ({
        label,
        value: method === "standard" ? 7 : rollDice(2, 6),
      }));
    }

    case "generic":
    default: {
      return [
        { label: "Stärke", value: method === "standard" ? 10 : rollDice(2, 6) + 2 },
        { label: "Geschicklichkeit", value: method === "standard" ? 10 : rollDice(2, 6) + 2 },
        { label: "Konstitution", value: method === "standard" ? 10 : rollDice(2, 6) + 2 },
      ];
    }
  }
};
