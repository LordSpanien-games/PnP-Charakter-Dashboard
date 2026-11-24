import {
  DamageComponent,
  DamageCondition,
  DamageComponentKind,
  InventoryItem,
  WeaponSlot,
  WeaponItemData,
  AmmoItemData,
} from "../../core/types";
import { CombatModifier } from "../../core/types";
import { getSneakAttackDice } from "./pathfinderRules";

/**
 * Zentrales Waffenmodell für Pathfinder 1e.
 *
 * Alte Felder (baseDice, extraDamage, magicBonus, sneakAttackBonus*) werden
 * beim Lesen automatisch in das neue Komponentenmodell überführt, damit
 * bestehende Charaktere ohne Datenverlust weiter funktionieren.
 */

export const DAMAGE_KIND_LABELS: Record<DamageComponentKind, string> = {
  native: "Nativ",
  extra: "Zusatz",
  magic: "Magisch",
  situational: "Situativ",
};

export const DAMAGE_KIND_ORDER: DamageComponentKind[] = ["native", "extra", "magic", "situational"];

export const CONDITION_LABELS: Record<string, string> = {
  always: "Immer",
  sneakAttack: "Hinterhalt",
  critical: "Kritischer Treffer",
  opportunityAttack: "Gelegenheitsangriff",
  twoWeaponFighting: "Zweiwaffenkampf",
  area: "Flächenangriff",
};

export const CONDITION_OPTIONS: { value: DamageCondition; label: string }[] = [
  { value: "always", label: "Immer" },
  { value: "sneakAttack", label: "Nur Hinterhalt" },
  { value: "critical", label: "Nur bei kritischem Treffer" },
  { value: "opportunityAttack", label: "Nur Gelegenheitsangriff" },
  { value: "twoWeaponFighting", label: "Nur bei Zweiwaffenkampf" },
  { value: "area", label: "Nur Flächenangriff" },
];

export const makeComponentId = (): string =>
  `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Reihenfolge der Komponenten im Wurfplan: Nativ → Zusatz → Magisch → Situativ. */
export const sortDamageComponents = (components: DamageComponent[]): DamageComponent[] =>
  [...components].sort((a, b) => {
    const ka = DAMAGE_KIND_ORDER.indexOf(a.kind);
    const kb = DAMAGE_KIND_ORDER.indexOf(b.kind);
    if (ka !== kb) return ka - kb;
    return 0;
  });

/**
 * Feste IDs fuer die aus Legacy-Feldern abgeleiteten Komponenten.
 * Diese MUESSEN deterministisch sein: normalizeWeaponData() laeuft bei jedem
 * Render. Zufaellige IDs wuerden die ID jeder Schadenszeile veraendern und
 * damit die eingegebenen Wuerfelwerte im State verwerfen.
 */
const LEGACY_IDS = {
  native: "legacy-native",
  magic: "legacy-magic",
  sneak: "legacy-sneak",
};

/** Wandelt alte Waffenfelder in das neue Komponentenmodell. */
export const normalizeWeaponData = (weapon: WeaponItemData | undefined): WeaponItemData => {
  const wd: WeaponItemData = { ...(weapon || { isMelee: true }) };
  const legacy: DamageComponent[] = [];

  // baseDice -> native
  if (wd.baseDice && !wd.damageComponents?.some((c) => c.kind === "native")) {
    legacy.push({
      id: LEGACY_IDS.native,
      label: "Nativ",
      kind: "native",
      dice: wd.baseDice,
      criticalApplies: true,
    });
  }

  // extraDamage -> magic (altes Feld war "Magieschaden")
  if (wd.extraDamage && !wd.damageComponents?.some((c) => c.kind === "magic")) {
    legacy.push({
      id: LEGACY_IDS.magic,
      label: "Magisch",
      kind: "magic",
      dice: wd.extraDamage,
      criticalApplies: true,
    });
  }

  // sneakAttackBonusDamage -> situativ mit Bedingung Hinterhalt
  if (
    (wd.sneakAttackBonusDamage || wd.sneakAttackBonusAttack) &&
    !wd.damageComponents?.some((c) => c.condition === "sneakAttack")
  ) {
    legacy.push({
      id: LEGACY_IDS.sneak,
      label: "Hinterhalt",
      kind: "situational",
      flat: wd.sneakAttackBonusDamage || 0,
      attackBonus: wd.sneakAttackBonusAttack || 0,
      condition: "sneakAttack",
      criticalApplies: false,
    });
  }

  if (legacy.length > 0) {
    wd.damageComponents = sortDamageComponents([...(wd.damageComponents || []), ...legacy]);
  }

  // magicBonus -> enhancement
  if (wd.enhancement === undefined && wd.magicBonus !== undefined) {
    wd.enhancement = wd.magicBonus;
  }

  if (wd.criticalThreshold === undefined) wd.criticalThreshold = 20;

  return wd;
};

/** Alle Komponenten einer Waffe in Wurfplan-Reihenfolge. */
export const getWeaponComponents = (weapon: WeaponItemData | undefined): DamageComponent[] => {
  const wd = normalizeWeaponData(weapon);
  return sortDamageComponents(wd.damageComponents || []);
};

/** Wie viele Würfel stecken in einer Würfelangabe (z.B. "1W6+2W6" -> 3)? */
export const countDice = (dice: string | undefined): number => {
  if (!dice) return 0;
  const matches = dice.match(/(\d*)\s*[wW]\s*(\d+)/g);
  if (!matches) return 0;
  return matches.reduce((sum, m) => {
    const n = parseInt(m.replace(/[^0-9].*$/, ""), 10);
    return sum + (isNaN(n) || n === 0 ? 1 : n);
  }, 0);
};

/** Verdoppelt die Würfel einer Würfelangabe (für kritische Treffer):
 *  "1W6" -> "2W6", "1W6+1W8" -> "2W6+2W8", "1W6+2" -> "2W6+2". */
export const doubleDice = (dice: string | undefined): string | undefined => {
  if (!dice) return undefined;
  return dice.replace(/(\d*)\s*([wW])\s*(\d+)/g, (_m, count, w, sides) => {
    const n = parseInt(count, 10);
    const factor = isNaN(n) || n === 0 ? 2 : n * 2;
    return `${factor}${w}${sides}`;
  });
};

/** Formatiert einen flachen Bonus mit Vorzeichen. */
export const formatFlat = (value: number | undefined): string => {
  const v = value || 0;
  return v > 0 ? `+${v}` : v < 0 ? `${v}` : "";
};

/** Zerlegt eine Würfelangabe in Würfel-Teil und flachen Rest.
 *  Beispiel: "1W6+2" -> {dice:"1W6", flat:2}; "1W6+1W8-1" -> {dice:"1W6+1W8", flat:-1}.
 *  Wird zuerst die Würfelangabe herausgelöst, danach werden die übrigen
 *  Zahlen als flacher Summand gelesen (sonst würde "6" aus "1W6" als
 *  Flachbonus fehlinterpretiert). */
export const splitDiceAndFlat = (dice: string | undefined): { dice: string; flat: number } => {
  if (!dice) return { dice: "", flat: 0 };
  const diceTerms: string[] = [];
  const rest = dice.replace(/(\d*)\s*[wWdD]\s*(\d+)/g, (_m, count: string, sides: string) => {
    const n = parseInt(count, 10);
    const c = isNaN(n) || n === 0 ? 1 : n;
    diceTerms.push(`${c}W${sides}`);
    return " ";
  });
  let flat = 0;
  rest.replace(/([+-]?)\s*(\d+)/g, (_m, sign: string, num: string) => {
    const n = parseInt(num, 10);
    if (!isNaN(n)) flat += sign === "-" ? -n : n;
    return "";
  });
  return { dice: diceTerms.join("+"), flat };
};

/** Wandelt eine Komponente in eine Schadenszeile: Würfel und flacher Rest werden getrennt,
 *  damit der flache Anteil in die Fest-Summen eingeht und bei Krit nicht verdoppelt wird. */
const componentToLine = (
  c: DamageComponent,
  ctx: { sneakAttackActive: boolean; twoWeaponFighting: boolean; activeConditions: string[] },
  source: "weapon" | "ammo" | "modifier",
  labelOverride?: string
): DamageLine => {
  const split = splitDiceAndFlat(c.dice);
  return {
    id: c.id,
    label: labelOverride || c.label || DAMAGE_KIND_LABELS[c.kind],
    kind: c.kind,
    dice: split.dice || undefined,
    flat: (c.flat || 0) + split.flat,
    condition: c.condition || "always",
    active: isConditionMet(c.condition, ctx),
    criticalApplies: c.criticalApplies !== false,
    source,
  };
};

export interface WeaponProfileContext {
  /** Aktive Attribute des Charakters. */
  attributes: { ST: number; GE: number; KO: number; IN: number; WE: number; CH: number };
  /** Stufe */
  level: number;
  /** Klassenkennung für sneakAttackDice etc. */
  classId?: string;
  /** Rassenkennung für Größenmodifikator. */
  raceId?: string;
  /** Größenmodifikator (attackAndAc / cmbAndCmd) */
  sizeMod: { attackAndAc: number; cmbAndCmd: number };
  /** Hinterhalt aktiv? */
  sneakAttackActive: boolean;
  /** Zweiwaffenkampf aktiv? */
  twoWeaponFighting: boolean;
  /** Globales Angriffs-Attribut (Fallback, wenn die Waffe nichts festlegt). */
  attackAttribute: "ST" | "GE";
  /** Charakter-Modifikatoren (Kampf-Effekte). */
  characterModifiers: CombatModifier[];
}

export interface DamageLine {
  /** Eindeutige ID der Zeile (für Eingabefelder). */
  id: string;
  label: string;
  kind: DamageComponentKind;
  /** Würfelangabe, z.B. "1W6". */
  dice?: string;
  /** Flacher Anteil (immer vorhanden, wird ohne Würfel addiert). */
  flat: number;
  /** Bedingung, unter der die Zeile gilt. */
  condition: DamageCondition;
  /** Gilt die Zeile im aktuellen Zustand? */
  active: boolean;
  /** Wird bei kritischem Treffer verdoppelt? */
  criticalApplies: boolean;
  /** Herkunft: Waffe, Munition oder Charakter-Modifikator. */
  source: "weapon" | "ammo" | "modifier";
}

export interface WeaponProfile {
  item: InventoryItem;
  name: string;
  slot: WeaponSlot;
  /** Angriffsbonus (inkl. BAB, Attribut, Größe, Enhancement, Modifikatoren). */
  attack: number;
  /** Angriffsbonus-Formate (Iteratives, z.B. "+7/+2"). */
  attackString: string;
  /** Schadenszeilen in Wurfplan-Reihenfolge. */
  damageLines: DamageLine[];
  /** Flacher Schaden ohne Würfel, getrennt nach Herkunft. */
  fixed: { native: number; magic: number; situational: number; total: number };
  /** Kritischer Treffer: Schwelle und Schadenszusammenstellung. */
  critical: {
    threshold: number;
    lines: DamageLine[];
    fixed: { native: number; magic: number; situational: number; total: number };
    summary: string;
  };
  /** Aktuell gewählte Munition (falls referenziert). */
  ammo?: InventoryItem;
  /** Art und Reichweite */
  weaponType?: string;
  rangeText?: string;
  /** Verbesserung der Waffe. */
  enhancement: number;
}

/** Bedingung erfüllt? */
export const isConditionMet = (
  condition: DamageCondition | undefined,
  ctx: { sneakAttackActive: boolean; twoWeaponFighting: boolean; activeConditions: string[] }
): boolean => {
  const c = condition || "always";
  if (c === "always") return true;
  if (c === "sneakAttack") return ctx.sneakAttackActive;
  if (c === "twoWeaponFighting") return ctx.twoWeaponFighting;
  if (c === "opportunityAttack") return ctx.activeConditions.includes("opportunityAttack");
  if (c === "area") return ctx.activeConditions.includes("area");
  if (c === "critical") return false; // nur im kritischen Zweig
  if (c.startsWith("custom:")) return ctx.activeConditions.includes(c);
  return true;
};

/** Baut die Schadenszeilen einer Waffe (inkl. Munition). */
export const buildDamageLines = (
  weapon: WeaponItemData | undefined,
  ctx: WeaponProfileContext & { activeConditions: string[] },
  ammo?: InventoryItem
): DamageLine[] => {
  const wd = normalizeWeaponData(weapon);
  const components = getWeaponComponents(wd);
  const lines: DamageLine[] = [];

  const ammoComponents = (ammo?.ammoData?.damageComponents || []) as DamageComponent[];
  const ammoNative = ammoComponents.find((c) => c.kind === "native");

  components.forEach((c) => {
    // Eine native Munitions-Komponente ersetzt den nativen Waffenschaden.
    if (c.kind === "native" && ammoNative) return;
    lines.push(componentToLine(c, ctx, "weapon"));
  });

  // Munition: native Komponente ersetzt den nativen Waffenschaden,
  // alle anderen Munitionsanteile kommen als situativer Block dazu.
  ammoComponents.forEach((c) => {
    if (c.kind === "native") {
      lines.push(
        componentToLine(c, ctx, "ammo", `${ammo?.name || "Munition"} – ${c.label || "Nativ"}`)
      );
      return;
    }
    lines.push(
      componentToLine(c, ctx, "ammo", `${ammo?.name || "Munition"} – ${c.label || "Effekt"}`)
    );
  });

  // Klassen-Hinterhaltwürfel (z.B. Rogue 1W6/2W6) – wirken nur beim hinterhältigen Angriff
  // und werden bei einem kritischen Treffer NICHT verdoppelt (Pathfinder-Regel).
  if (ctx.sneakAttackActive) {
    const sneakDice = getSneakAttackDice(ctx.classId, ctx.level);
    if (sneakDice > 0) {
      lines.push({
        id: `sneak-class-${ctx.classId}-${ctx.level}`,
        label: "Hinterhalt (Klasse)",
        kind: "situational",
        dice: `${sneakDice}W6`,
        flat: 0,
        condition: "sneakAttack",
        active: true,
        criticalApplies: false,
        source: "modifier",
      });
    }
  }

  // Charakter-Modifikatoren (z.B. "Segen +1 Schaden") als eigene Zeile
  ctx.characterModifiers.forEach((m) => {
    if (!m.extraDamageDice && !m.damageBonus) return;
    const contextOk =
      m.context === "always" ||
      (m.context === "sneakAttackOnly" && ctx.sneakAttackActive) ||
      (m.context === "twoWeaponFightingOnly" && ctx.twoWeaponFighting);
    if (!contextOk) return;
    const split = splitDiceAndFlat(m.extraDamageDice);
    lines.push({
      id: m.id,
      label: m.label,
      kind: m.context === "sneakAttackOnly" ? "situational" : "magic",
      dice: split.dice || undefined,
      flat: (m.damageBonus || 0) + split.flat,
      condition: m.context === "sneakAttackOnly" ? "sneakAttack" : "always",
      active: true,
      criticalApplies: true,
      source: "modifier",
    });
  });

  return lines;
};

/** Summiert die flachen Anteile nach Herkunft. */
export const sumFixed = (
  lines: DamageLine[]
): { native: number; magic: number; situational: number; total: number } => {
  let native = 0;
  let magic = 0;
  let situational = 0;
  lines.forEach((l) => {
    if (!l.active) return;
    if (l.kind === "native") native += l.flat;
    else if (l.kind === "extra") native += l.flat;
    else if (l.kind === "magic") magic += l.flat;
    else situational += l.flat;
  });
  return { native, magic, situational, total: native + magic + situational };
};

/** Kritische Zeilen: Würfel verdoppeln, flache Boni bleiben. */
export const buildCriticalLines = (lines: DamageLine[]): DamageLine[] =>
  lines
    .filter((l) => l.active && l.criticalApplies)
    .map((l) => ({ ...l, dice: doubleDice(l.dice), condition: "critical" as DamageCondition }));

/** Kurzfassung eines Schadensprofils, z.B. "1W6+2 +1W6".
 *  Die flachen Anteile stehen bereits in den Zeilen – sie werden hier NICHT
 *  erneut als Gesamtsumme angehängt (das würde sie doppelt zählen). */
export const formatProfile = (lines: DamageLine[]): string => {
  const parts: string[] = [];
  lines.filter((l) => l.active).forEach((l) => {
    const flat = l.flat ? formatFlat(l.flat) : "";
    if (l.dice && flat) parts.push(`${l.dice}${flat}`);
    else if (l.dice) parts.push(l.dice);
    else if (flat) parts.push(flat);
  });
  return parts.length > 0 ? parts.join(" ") : "–";
};

/** Kurzfassung inkl. Gesamtsumme der flachen Anteile (für Tooltips). */
export const formatProfileWithTotal = (
  lines: DamageLine[],
  fixed: { native: number; magic: number; situational: number; total: number }
): string => {
  const base = formatProfile(lines);
  const extra = fixed.total ? formatFlat(fixed.total) : "";
  if (!extra) return base;
  return base === "–" ? extra : `${base} ${extra}`;
};
