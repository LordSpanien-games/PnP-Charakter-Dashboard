import {
  DamageComponent,
  InventoryItem,
  WeaponSlot,
  WeaponItemData,
  CombatModifier,
} from "../../core/types";
import {
  buildDamageLines,
  buildCriticalLines,
  DamageLine,
  formatFlat,
  formatProfile,
  normalizeWeaponData,
  sumFixed,
  WeaponProfileContext,
} from "./pathfinderWeaponModel";
import {
  calculateBAB,
  calculateModifier,
  getBabIteratives,
  getSneakAttackDice,
  formatModifier,
  PATHFINDER_RACES,
  SIZE_MODIFIERS,
} from "./pathfinderRules";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";

/**
 * Aufbau des Angriffsprofils einer Waffe:
 * Angriffswürfe (Iteratives), Enhancement, Attribut, Größe, Modifikatoren
 * und der vollständige Wurfplan für die Würfelübersicht.
 */

export interface AttackProfile {
  item: InventoryItem;
  name: string;
  slot: WeaponSlot;
  handLabel: string;
  /** Angriffsbonus der Iteratives, z.B. [7, 2]. */
  attackRolls: number[];
  /** Angriffsbonus als String, z.B. "+7/+2". */
  attackString: string;
  /** Schadenszeilen in Wurfplan-Reihenfolge. */
  damageLines: DamageLine[];
  /** Flacher Schaden ohne Würfel. */
  fixed: { native: number; magic: number; situational: number; total: number };
  /** Kritischer Treffer */
  criticalThreshold: number;
  /** Zeilen des ZUSATZWURFS bei kritischem Treffer (Standardschaden der Waffe,
   *  ohne Klassen-Hinterhaltwürfel). Ersetzt den Normalwurf NICHT. */
  criticalLines: DamageLine[];
  criticalFixed: { native: number; magic: number; situational: number; total: number };
  /** Kurzfassung des Zusatzwurfs, z.B. "1W6+3". */
  criticalSummary: string;
  /** Kurzfassung des normalen Schadens, z.B. "1W6+2". */
  damageSummary: string;
  /** Aktuell gewählte Munition */
  ammo?: InventoryItem;
  weaponType?: string;
  rangeText?: string;
  enhancement: number;
  /** Angriffs-Attribut, das verwendet wird. */
  attackAttribute: "ST" | "GE";
  /** Schadens-Attribut, das verwendet wird. */
  damageAttribute: "ST" | "GE" | "NONE";
  /** Zweiwaffen-Malus (0 bei keinem Zweiwaffenkampf). */
  penalty: number;
  /** Zuschläge aus Waffen-Modifikatoren, die im aktuellen Zustand wirken. */
  attackBonusDetail: { label: string; value: number }[];
}

export const HAND_LABELS: Record<WeaponSlot, string> = {
  primary: "Haupthand",
  offHand: "Nebenhand",
  twoHanded: "Beidhändig",
};

export interface BuildAttackContext extends WeaponProfileContext {
  /** Aktuell aktive Eigenbedingungen (custom:… usw.). */
  activeConditions: string[];
  /** Aktive Waffen (ausgerüstet + als aktiv markiert). */
  activeWeapons: InventoryItem[];
  /** Vollständiges Inventar – wird für die Munitionsauflösung gebraucht. */
  inventory: InventoryItem[];
}

/** Ermittelt das Angriffs-Attribut: Waffe zuerst, dann globaler Fallback. */
const resolveAttackAttribute = (
  wd: WeaponItemData,
  ctx: BuildAttackContext
): "ST" | "GE" => {
  if (wd.attackAttribute) return wd.attackAttribute;
  if (!wd.isMelee) return "GE";
  if (wd.isFinesse) return "GE";
  return ctx.attackAttribute;
};

/** Ermittelt das Schadens-Attribut. */
const resolveDamageAttribute = (
  wd: WeaponItemData,
  ctx: BuildAttackContext
): "ST" | "GE" | "NONE" => {
  if (wd.damageAttribute) return wd.damageAttribute;
  if (!wd.isMelee) return "NONE";
  if (wd.isFinesse) return "GE";
  return "ST";
};

/** Zählt Modifikatoren, die im aktuellen Zustand auf den Angriff wirken. */
const collectAttackBonuses = (
  modifiers: CombatModifier[] | undefined,
  ctx: BuildAttackContext,
  wd: WeaponItemData,
  isOffHand: boolean
): { total: number; detail: { label: string; value: number }[] } => {
  const detail: { label: string; value: number }[] = [];
  let total = 0;
  (modifiers || []).forEach((m) => {
    const value = m.attackBonus ?? 0;
    if (!value) return;
    const contextOk =
      m.context === "always" ||
      (m.context === "sneakAttackOnly" && ctx.sneakAttackActive) ||
      (m.context === "twoWeaponFightingOnly" && ctx.twoWeaponFighting) ||
      (m.context === "oneHandedOnly" && !wd.supportsTwoHanded) ||
      (m.context === "twoHandedOnly" && !!wd.supportsTwoHanded) ||
      (m.context === "offHandOnly" && isOffHand);
    if (!contextOk) return;
    total += value;
    detail.push({ label: m.label, value });
  });
  return { total, detail };
};

/** Baut das vollständige Angriffsprofil einer Waffe. */
export const buildAttackProfile = (
  item: InventoryItem,
  ctx: BuildAttackContext,
  options: { isOffHand?: boolean; penalty?: number } = {}
): AttackProfile => {
  const wd = normalizeWeaponData(item.weaponData);
  const cls = ctx.classId ? PATHFINDER_CLASSES[ctx.classId] : undefined;
  const race = ctx.raceId ? PATHFINDER_RACES[ctx.raceId] : undefined;
  const sizeMod = SIZE_MODIFIERS[race?.size ?? "medium"];

  const bab = calculateBAB(ctx.level, cls?.babProgression ?? "threeFourths");
  const attackAttribute = resolveAttackAttribute(wd, ctx);
  const damageAttribute = resolveDamageAttribute(wd, ctx);
  const enhancement = wd.enhancement ?? 0;

  const attrMod = calculateModifier(
    attackAttribute === "GE" ? ctx.attributes.GE : ctx.attributes.ST
  );
  const dmgAttrMod =
    damageAttribute === "GE"
      ? calculateModifier(ctx.attributes.GE)
      : damageAttribute === "ST"
        ? calculateModifier(ctx.attributes.ST)
        : 0;

  const isOffHand = options.isOffHand ?? false;
  const weaponBonuses = collectAttackBonuses(wd.modifiers, ctx, wd, isOffHand);
  const charBonuses = collectAttackBonuses(ctx.characterModifiers, ctx, wd, isOffHand);

  const penalty = options.penalty ?? 0;

  const baseAttack =
    bab +
    attrMod +
    sizeMod.attackAndAc +
    enhancement +
    weaponBonuses.total +
    charBonuses.total +
    penalty;

  const attackRolls = getBabIteratives(bab).map((b) => b + baseAttack - bab);

  // ── Schaden ──────────────────────────────────────────────────────────
  const ammo = item.weaponData?.ammoItemId
    ? ctx.inventory.find((i) => i.id === item.weaponData?.ammoItemId)
    : undefined;

  const lines = buildDamageLines(wd, ctx, ammo);

  // Enhancement und Attribut-Modifikator fließen als flacher Anteil
  // in den nativen Schaden ein. Gibt es keine native Zeile (z.B. reine
  // Munitionswaffen), wird eine Basiszeile mit dem Flachbonus erzeugt,
  // damit der Bonus nicht verloren geht.
  const nativeFlat = dmgAttrMod + enhancement;
  let withNative: DamageLine[];
  const nativeIndex = withNativeIndex(lines);
  if (nativeIndex >= 0) {
    withNative = lines.map((l, i) => (i === nativeIndex ? { ...l, flat: l.flat + nativeFlat } : l));
  } else {
    withNative = [
      {
        id: `${item.id}-basis`,
        label: "Basis",
        kind: "native",
        dice: undefined,
        flat: nativeFlat,
        condition: "always",
        active: true,
        criticalApplies: true,
        source: "weapon",
      },
      ...lines,
    ];
  }

  const fixed = sumFixed(withNative);
  const criticalThreshold = wd.criticalThreshold ?? 20;
  const criticalLines = buildCriticalLines(withNative);
  const criticalFixed = sumFixed(criticalLines);

  return {
    item,
    name: item.name,
    slot: wd.weaponSlot ?? "primary",
    handLabel: HAND_LABELS[wd.weaponSlot ?? "primary"],
    attackRolls,
    attackString: attackRolls.map((r) => formatModifier(r)).join(" / "),
    damageLines: withNative,
    fixed,
    criticalThreshold,
    criticalLines,
    criticalFixed,
    criticalSummary: formatProfile(criticalLines),
    damageSummary: formatProfile(withNative),
    ammo,
    weaponType: wd.weaponType,
    rangeText: wd.rangeText,
    enhancement,
    attackAttribute,
    damageAttribute,
    penalty,
    attackBonusDetail: [...weaponBonuses.detail, ...charBonuses.detail],
  };
};

/** Ermittelt den Index der ersten nativen Schadenszeile (-1, wenn keine existiert). */
const withNativeIndex = (lines: DamageLine[]): number =>
  lines.findIndex((l) => l.kind === "native");

/** Sucht das Munitions-Item anhand der ID im Inventar. */
const findAmmo = (ctx: BuildAttackContext, ammoItemId: string): InventoryItem | undefined => {
  const all = (ctx as BuildAttackContext & { inventory?: InventoryItem[] }).inventory || [];
  return all.find((i) => i.id === ammoItemId);
};

/**
 * Ermittelt das Zweiwaffen-Malus:
 *  - ohne Zweiwaffenkampf-Talent: Haupthand -4, Nebenhand -4 (leicht -2)
 *  - mit Talent: Haupthand -2, Nebenhand -2 (leicht: 0)
 */
export const getTwoWeaponPenalties = (
  hasTalent: boolean,
  offHandIsLight: boolean
): { primary: number; offHand: number } => {
  if (!hasTalent) {
    return { primary: offHandIsLight ? -2 : -4, offHand: offHandIsLight ? -2 : -4 };
  }
  return { primary: offHandIsLight ? 0 : -2, offHand: offHandIsLight ? 0 : -2 };
};

/**
 * Erzeugt die Angriffsreihenfolge für die Würfelübersicht.
 * Bei Zweiwaffenkampf wird abwechselnd Haupthand/Nebenhand gewürfelt:
 * 1. Hand, 2. Hand, 1. Hand, 2. Hand, …
 */
export interface AttackSequenceEntry {
  /** Eindeutiger Schlüssel für State/Eingabefelder. */
  key: string;
  /** Laufende Nummer in der Übersicht. */
  index: number;
  profile: AttackProfile;
  /** Angriffsbonus dieses Schlags. */
  attack: number;
  /** Hand dieses Schlags. */
  handLabel: string;
}

export const buildAttackSequence = (
  profiles: AttackProfile[],
  iterativesPerWeapon: number,
  twoWeaponMode: boolean
): AttackSequenceEntry[] => {
  const entries: AttackSequenceEntry[] = [];
  let index = 1;

  if (!twoWeaponMode) {
    profiles.forEach((profile) => {
      profile.attackRolls.forEach((attack) => {
        entries.push({
          key: `${profile.item.id}::${entries.length}`,
          index: index++,
          profile,
          attack,
          handLabel: profile.handLabel,
        });
      });
    });
    return entries;
  }

  // Zweiwaffenkampf: abwechselnd Haupthand / Nebenhand
  const maxAttacks = Math.max(...profiles.map((p) => p.attackRolls.length), 0);
  for (let i = 0; i < maxAttacks; i++) {
    profiles.forEach((profile) => {
      const attack = profile.attackRolls[i];
      if (attack === undefined) return;
      entries.push({
        key: `${profile.item.id}::${i}`,
        index: index++,
        profile,
        attack,
        handLabel: profile.handLabel,
      });
    });
  }
  return entries;
};

/** Schlüssel für einen Würfelwert. Der Zeilenschlüssel ist zwingend, damit
 *  dieselbe Waffe in mehreren Angriffszeilen keine Werte vermischt. */
export const rollValueKey = (rowKey: string, lineId: string): string => `${rowKey}::${lineId}`;

/** Schlüssel für den Gesamt-Würfelwert einer Angriffszeile im Modus "gesamt". */
export const TOTAL_ROLL_ID = "__total__";
/** Schlüssel für den Gesamt-Würfelwert des Krit-Zusatzwurfs im Modus "gesamt". */
export const CRITICAL_TOTAL_ROLL_ID = "__krit_total__";

/** Summiert die gewürfelten Werte einer Zeile inklusive fester Boni.
 *  `rolledValues` ist zeilenspezifisch zu lesen (Schlüssel: rollValueKey).
 *
 *  Kritischer Treffer = Normalwurf + Zusatzwurf. Der Normalwurf wird IMMER
 *  verrechnet; bei `critical` kommen die Festanteile und Würfelwerte des
 *  Zusatzwurfs (criticalLines, eigene IDs mit Suffix "__krit") hinzu. */
export const computeRowDamage = (
  profile: AttackProfile,
  rolledValues: Record<string, number>,
  critical: boolean,
  rowKey = "",
  extraFlat = 0
): number => {
  let sum = profile.fixed.total + extraFlat;
  profile.damageLines.forEach((l) => {
    if (!l.active) return;
    const value = rolledValues[rollValueKey(rowKey, l.id)];
    if (value) sum += value;
  });
  if (critical) {
    sum += profile.criticalFixed.total;
    profile.criticalLines.forEach((l) => {
      const value = rolledValues[rollValueKey(rowKey, l.id)];
      if (value) sum += value;
    });
  }
  return sum;
};

/** Summiert die gewürfelten Werte einer Zeile, wenn die Werte flach (ohne
 *  Zeilenschlüssel) abgelegt sind – z.B. für die Gesamtsumme über alle Zeilen.
 *  Gleiche Krit-Semantik wie computeRowDamage: Normalwurf + Zusatzwurf. */
export const computeRowDamageFlat = (
  profile: AttackProfile,
  rolledValues: Record<string, number>,
  critical: boolean
): number => {
  let sum = profile.fixed.total;
  profile.damageLines.forEach((l) => {
    if (!l.active) return;
    const value = rolledValues[l.id];
    if (value) sum += value;
  });
  if (critical) {
    sum += profile.criticalFixed.total;
    profile.criticalLines.forEach((l) => {
      const value = rolledValues[l.id];
      if (value) sum += value;
    });
  }
  return sum;
};

/** Formatiert den Wurfplan als Textzeile, z.B. "1W6+2 · 1W6 (Magisch) · 1W6 (Hinterhalt)".
 *  Bei `critical` wird der Zusatzwurf angehängt: "… + Krit: 1W6+2 · 1W6 (Magisch)". */
export const formatRollPlan = (profile: AttackProfile, critical = false): string => {
  const plan = (lines: DamageLine[]): string =>
    lines
      .filter((l) => l.active && (l.dice || l.flat))
      .map((l) => {
        const dice = l.dice || "";
        const flat = l.flat ? formatFlat(l.flat) : "";
        const combined = dice && flat ? `${dice}${flat}` : dice || flat;
        return l.label && l.label !== "Nativ" ? `${combined} (${l.label})` : combined;
      })
      .join(" · ");
  const base = plan(profile.damageLines);
  if (!critical) return base;
  const crit = plan(profile.criticalLines);
  if (!crit) return base;
  return base ? `${base} + Krit: ${crit}` : `Krit: ${crit}`;
};
