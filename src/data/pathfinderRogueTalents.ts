import { Ability } from '../types';

export interface RogueTalentPreset {
  name: string;
  effect: string;
  usage?: string;
  isAdvanced?: boolean;
  minLevel?: number;
  page?: string;
  maxUses?: number;
}

export const PATHFINDER_ROGUE_TALENTS: RogueTalentPreset[] = [
  {
    name: "Widerstandsfähigkeit (Resiliency)",
    effect: "1x/Tag kann der Schurke einen misslungenen Rettungswurf wiederholen. Das zweite Ergebnis muss verwendet werden.",
    usage: "1x/Tag",
    minLevel: 2,
    page: "GRW S. 68",
    maxUses: 1
  },
  {
    name: "Blutende Wunden (Bleeding Attack)",
    effect: "Bei einem erfolgreichen Hinterhältigen Angriff erleidet das Ziel pro Runde Blutungsschaden in Höhe der Anzahl der HA-Schadenswürfel (z.B. +5 TP/Runde). Kann durch Heilkunde (SG 15) oder magische Heilung gestoppt werden.",
    usage: "Passiv bei HA-Treffer",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Finesse-Training (Schurken-Finesse)",
    effect: "Ermöglicht es dem Schurken, bei gewählten leichten Waffen (oder Waffen mit Waffenfinesse) seinen Geschicklichkeitsmodifikator statt des Stärkemodifikators auf den Schadenswurf anzurechnen.",
    usage: "Permanent aktiv",
    minLevel: 2,
    page: "Unchained S. 20"
  },
  {
    name: "Waffentraining (Weapon Training)",
    effect: "Der Schurke erhält das Talent 'Waffenfokus' als Bonustalent für eine Waffe seiner Wahl (+1 auf alle Angriffs- und Bestätigungswürfe mit dieser Waffe).",
    usage: "Permanent aktiv",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Schnelle Finger (Fast Stealth)",
    effect: "Der Schurke kann sich mit voller normaler Bewegungsrate heimlich bewegen (Schleichen), ohne den üblichen Malus von -5 auf Fertigkeitswürfe für Heimlichkeit hinnehmen zu müssen.",
    usage: "Bei Bewegung / Schleichen",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Gefechtsrolle (Offensive Defense)",
    effect: "Trifft der Schurke mit einem Hinterhältigen Nahkampfangriff, erhält er bis zum Beginn seines nächsten Zuges einen Ausweichbonus auf seine RK gegen diesen Gegner in Höhe der erzielten HA-Schadenswürfel.",
    usage: "1 Runde nach HA-Treffer",
    minLevel: 2,
    page: "APG S. 130"
  },
  {
    name: "Überraschungsangriff (Surprise Attack)",
    effect: "Während einer Überraschungsrunde gilt jeder Gegner, den der Schurke angreift, automatisch als auf dem falschen Fuß, selbst wenn der Gegner vor ihm gehandelt hat.",
    usage: "Überraschungsrunde",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Fallenspürer (Trap Spotter)",
    effect: "Immer wenn der Schurke in einen Umkreis von 3m um eine Falle gelangt, erhält der SL verdeckt einen sofortigen Wurf auf Wahrnehmung, um die Falle zu entdecken.",
    usage: "Automatisch im 3m-Radius",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Kampftalent (Combat Trick)",
    effect: "Der Schurke erhält ein beliebiges Kampftalent als Bonustalent, dessen Voraussetzungen er erfüllt.",
    usage: "Permanent aktiv",
    minLevel: 2,
    page: "GRW S. 68"
  },
  {
    name: "Schwächender Schlag (Debilitating Injury)",
    effect: "Nach einem erfolgreichen Hinterhältigen Angriff kann der Schurke dem Ziel für 1 Runde einen Zustand aufzwingen: Verwirrt (-2 RK / -4 gegen Schurken), Verlangsamt (halbe Bewegungsrate) oder Geschwächt (-2 auf Angriffswürfe).",
    usage: "1 Runde nach HA-Treffer",
    minLevel: 4,
    page: "Unchained S. 20"
  },
  {
    name: "Verkrüppelnder Schlag (Crippling Strike)",
    effect: "Verbesserter Schurkentrick: Jeder erfolgreiche Hinterhältige Angriff fügt dem Ziel zusätzlich 2 Punkte Attributsschaden auf Stärke zu.",
    usage: "Bei jedem HA-Treffer",
    isAdvanced: true,
    minLevel: 10,
    page: "GRW S. 69"
  },
  {
    name: "Gelegenheitsschlag (Opportunist)",
    effect: "Verbesserter Schurkentrick: Einmal pro Runde kann der Schurke einen Gelegenheitsangriff gegen einen Gegner ausführen, der gerade von einem Verbündeten im Nahkampf getroffen wurde.",
    usage: "1x pro Runde (Sofort-Aktion)",
    isAdvanced: true,
    minLevel: 10,
    page: "GRW S. 69"
  },
  {
    name: "Schlüpfriger Geist (Slippery Mind)",
    effect: "Verbesserter Schurkentrick: Misslingt ein Willenswurf gegen einen Verzauberungseffekt, darf der Schurke 1 Runde später mit demselben SG einen zweiten Willenswurf wiederholen, um den Effekt abzuschütteln.",
    usage: "Zweite Chance gegen Bezauberungen",
    isAdvanced: true,
    minLevel: 10,
    page: "GRW S. 69"
  },
  {
    name: "Verbessertes Entrinnen (Improved Evasion)",
    effect: "Verbesserter Schurkentrick: Der Schurke nimmt keinen Schaden bei erfolgreichem Reflexwurf gegen Flächeneffekte und nur halben Schaden, selbst wenn der Reflexwurf misslingt.",
    usage: "Automatisch aktiv",
    isAdvanced: true,
    minLevel: 10,
    page: "GRW S. 69"
  }
];

export const createRogueTalentAbility = (preset: RogueTalentPreset): Ability => ({
  name: preset.name,
  usage: preset.usage || "Schurkentrick",
  effect: preset.effect,
  type: 'rogue_talent',
  page: preset.page,
  maxUses: preset.maxUses,
  currentUses: preset.maxUses
});
