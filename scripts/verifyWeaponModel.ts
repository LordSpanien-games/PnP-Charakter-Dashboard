/**
 * Verifikation des neuen Waffenmodells (Pathfinder 1e).
 * Ausführen:  npx tsx scripts/verifyWeaponModel.ts
 *
 * Enthält auch Prüfungen für die Kampfhistorie (Abschnitt 13).
 */
import {
  buildAttackProfile,
  buildAttackSequence,
  computeRowDamage,
  formatRollPlan,
  getTwoWeaponPenalties,
  rollValueKey,
} from "../src/systems/pathfinder/pathfinderAttackProfile";
import {
  formatProfile,
  normalizeWeaponData,
  splitDiceAndFlat,
} from "../src/systems/pathfinder/pathfinderWeaponModel";
import { GenericCharacter, InventoryItem } from "../src/core/types";
import {
  appendCombatHistory,
  formatCombatHistoryLabel,
  formatCombatHistoryTime,
  makeCombatHistoryEntry,
  readCombatHistory,
  sumCombatHistory,
} from "../src/systems/pathfinder/pathfinderCombatHistory";

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) console.log(`      erwartet: ${JSON.stringify(expected)}`);
  if (!ok) console.log(`      erhalten: ${JSON.stringify(actual)}`);
};

const attrs = { ST: 16, GE: 14, KO: 14, IN: 10, WE: 10, CH: 8 };

const ctxBase = {
  attributes: attrs,
  level: 5,
  classId: "rogue",
  raceId: "human",
  sizeMod: { attackAndAc: 0, cmbAndCmd: 0 },
  sneakAttackActive: false,
  twoWeaponFighting: false,
  attackAttribute: "GE" as const,
  characterModifiers: [],
  activeConditions: [] as string[],
  activeWeapons: [] as InventoryItem[],
  inventory: [] as InventoryItem[],
};

// ── 1) Waffe +2: +2 Angriff, +2 Schaden (Krit = Zusatzwurf, keine Verdopplung) ──
const swordPlus2: InventoryItem = {
  id: "w1",
  name: "Kurzschwert +2",
  category: "weapon",
  location: "equipped",
  isActiveWeapon: true,
  weaponData: {
    isMelee: true,
    weaponSlot: "primary",
    enhancement: 2,
    criticalThreshold: 20,
    damageAttribute: "ST",
    supportsOneHanded: true,
    supportsTwoHanded: false,
    damageComponents: [
      { id: "c-native", label: "Nativ", kind: "native", dice: "1W6", criticalApplies: true },
    ],
  },
};

const p1 = buildAttackProfile(swordPlus2, ctxBase);
check("+2 Waffe: Angriff +2 auf den Basis-BAB", p1.attackRolls[0], 7); // BAB 3 + GE 2 + ENH 2
check("+2 Waffe: Schaden 1W6+5 (ST 3 + ENH 2)", p1.damageSummary, "1W6+5");
check("+2 Waffe: Krit-Zusatzwurf = Standardschaden (nicht verdoppelt)", p1.criticalSummary, "1W6+5");
check("+2 Waffe: kritische Schwelle 20", p1.criticalThreshold, 20);

// ── 2) Magischer Schaden als eigene Würfelzeile, Reihenfolge nativ → magic ──
const magicSword: InventoryItem = {
  ...swordPlus2,
  id: "w2",
  name: "Kurzschwert +1 (magisch)",
  weaponData: {
    ...swordPlus2.weaponData!,
    enhancement: 1,
    damageComponents: [
      { id: "c-n", label: "Nativ", kind: "native", dice: "1W6", criticalApplies: true },
      { id: "c-m", label: "Magisch", kind: "magic", dice: "1W6", criticalApplies: true },
    ],
  },
};
const p2 = buildAttackProfile(magicSword, ctxBase);
check("Magie: Wurfplan nativ vor magisch", formatRollPlan(p2), "1W6+4 · 1W6 (Magisch)");
check("Magie: Fest-Anteile getrennt", [p2.fixed.native, p2.fixed.magic], [4, 0]);
check("Magie: Krit-Zusatzwurf enthält beide Würfelgruppen", p2.criticalSummary, "1W6+4 1W6");

// ── 3) Hinterhalt: situativer Anteil, nur aktiv bei Hinterhalt, nicht bei Krit ──
const ctxSneak = { ...ctxBase, sneakAttackActive: true };
const p3 = buildAttackProfile(magicSword, ctxSneak);
check(
  "Hinterhalt: Wurfplan enthält Klassen-Hinterhaltwürfel (Rogue St.5 = 3W6)",
  formatRollPlan(p3),
  "1W6+4 · 1W6 (Magisch) · 3W6 (Hinterhalt (Klasse))"
);
check(
  "Hinterhalt: Klassenwürfel fehlen im Krit-Zusatzwurf",
  p3.criticalSummary,
  "1W6+4 1W6"
);

// Waffenspezifischer Hinterhalt-Bonus (z.B. Schurkenzahn)
const rogueBlade: InventoryItem = {
  ...magicSword,
  id: "w3",
  name: "Schurkenzahn",
  weaponData: {
    ...magicSword.weaponData!,
    enhancement: 0,
    damageComponents: [
      { id: "c-n", label: "Nativ", kind: "native", dice: "1W6", criticalApplies: true },
      {
        id: "c-s",
        label: "Hinterhalt",
        kind: "situational",
        flat: 2,
        condition: "sneakAttack",
        criticalApplies: false,
      },
    ],
  },
};
const p3b = buildAttackProfile(rogueBlade, ctxSneak);
check(
  "Hinterhalt-Bonus: situativer Flachanteil nur bei Hinterhalt",
  [p3b.fixed.native, p3b.fixed.situational],
  [3, 2]
);
const p3c = buildAttackProfile(rogueBlade, ctxBase);
check(
  "Hinterhalt-Bonus: ohne Hinterhalt inaktiv",
  [p3c.fixed.native, p3c.fixed.situational],
  [3, 0]
);
check(
  "Hinterhalt-Bonus (criticalApplies false): nicht im Krit-Zusatzwurf",
  p3b.criticalSummary,
  "1W6+3"
);

// ── 4) Munition: native Komponente ersetzt Waffenschaden, situative kommen dazu ──
const poisonArrows: InventoryItem = {
  id: "a1",
  name: "Giftpfeile",
  category: "ammo",
  location: "equipped",
  quantity: 20,
  ammoData: {
    damageComponents: [
      { id: "ac-gift", label: "Gift", kind: "situational", dice: "1W6", condition: "always", criticalApplies: false },
    ],
  },
};
const bow: InventoryItem = {
  id: "w4",
  name: "Kurzbow",
  category: "weapon",
  location: "equipped",
  isActiveWeapon: true,
  weaponData: {
    isMelee: false,
    weaponSlot: "primary",
    damageAttribute: "NONE",
    ammoItemId: "a1",
    supportsOneHanded: true,
    supportsTwoHanded: false,
    damageComponents: [
      { id: "c-n", label: "Nativ", kind: "native", dice: "1W6", criticalApplies: true },
    ],
  },
};
const ctxAmmo = { ...ctxBase, inventory: [poisonArrows] };
const p4 = buildAttackProfile(bow, ctxAmmo);
check("Munition: Gift-Pfeile als situativer Block am Ende", formatRollPlan(p4), "1W6 · 1W6 (Giftpfeile – Gift)");
check("Munition: Fernkampfwaffe hat keinen Attributbonus", p4.fixed.native, 0);

// Native Munitions-Komponente ersetzt den nativen Waffenschaden
const boltAmmo: InventoryItem = {
  id: "a2",
  name: "Blasrohrpfeile",
  category: "ammo",
  location: "equipped",
  quantity: 10,
  ammoData: {
    damageComponents: [
      { id: "ac-n", label: "Nativ", kind: "native", dice: "1W4", criticalApplies: true },
    ],
  },
};
const blowgun: InventoryItem = {
  ...bow,
  id: "w5",
  name: "Blasrohr",
  weaponData: { ...bow.weaponData!, ammoItemId: "a2", damageComponents: [] },
};
const p5 = buildAttackProfile(blowgun, { ...ctxBase, inventory: [boltAmmo] });
check("Munition: native Munitions-Komponente ersetzt Waffenschaden", formatRollPlan(p5), "1W4 (Blasrohrpfeile – Nativ)");

// ── 5) Enhancement wirkt auf Angriff UND Schaden ──
const plain: InventoryItem = {
  id: "w6",
  name: "Kurzschwert",
  category: "weapon",
  location: "equipped",
  weaponData: {
    isMelee: true,
    weaponSlot: "primary",
    damageAttribute: "ST",
    supportsOneHanded: true,
    damageComponents: [
      { id: "c-n", label: "Nativ", kind: "native", dice: "1W6", criticalApplies: true },
    ],
  },
};
const p6 = buildAttackProfile(plain, ctxBase);
const p6b = buildAttackProfile({ ...plain, id: "w7", weaponData: { ...plain.weaponData!, enhancement: 2 } }, ctxBase);
check(
  "Enhancement: +2 hebt Angriff um 2 und Schaden um 2",
  [p6b.attackRolls[0] - p6.attackRolls[0], p6b.fixed.native - p6.fixed.native],
  [2, 2]
);

// ── 6) Wurfplan-Reihenfolge über alle Angriffe (1. Hand, 2. Hand, 1. Hand, 2. Hand) ──
// Stufe 9 Rogue: BAB 6 -> 2 Iteratives (+6/+1) in beiden Händen
const ctxHigh = { ...ctxBase, level: 9 };
const mainHand: InventoryItem = { ...swordPlus2, id: "m1", name: "Haupthandwaffe" };
const offHand: InventoryItem = {
  ...swordPlus2,
  id: "o1",
  name: "Nebenhandwaffe",
  weaponData: { ...swordPlus2.weaponData!, weaponSlot: "offHand", isLight: true },
};
const ctxTWF = { ...ctxHigh, twoWeaponFighting: true };
const penalties = getTwoWeaponPenalties(true, true);
const profMain = buildAttackProfile(mainHand, ctxTWF, { penalty: penalties.primary });
const profOff = buildAttackProfile(offHand, ctxTWF, { isOffHand: true, penalty: penalties.offHand });
const seq = buildAttackSequence([profMain, profOff], profMain.attackRolls.length, true);
check(
  "Zweiwaffenkampf: Reihenfolge wechselt die Hand",
  seq.map((s) => `${s.index}.${s.handLabel}`),
  ["1.Haupthand", "2.Nebenhand", "3.Haupthand", "4.Nebenhand"]
);
check("Zweiwaffenkampf: jede Zeile hat einen Angriffswert", seq.every((s) => typeof s.attack === "number"), true);
check(
  "Zweiwaffenkampf: Iteratives fallen ab (Haupthand)",
  profMain.attackRolls.map((r) => r - profMain.attackRolls[0]),
  [0, -5]
);

// ── 7) Schadensberechnung einer Zeile mit Eingabewerten ──
// Die Werte sind zeilenspezifisch zu speichern (gleiche Waffe, mehrere Zeilen).
const rowA = "rowA";
const rowB = "rowB";
const rolled = {
  [rollValueKey(rowA, "c-n")]: 4,
  [rollValueKey(rowA, "c-m")]: 3,
  [rollValueKey(rowB, "c-n")]: 5,
  [rollValueKey(rowB, "c-m")]: 2,
};
check(
  "Zeilenschaden: Fest + alle Würfelwerte",
  computeRowDamage(p2, rolled, false, rowA),
  4 + 0 + 4 + 3
);
// Krit = Normalwurf + Zusatzwurf (nicht: verdoppelte Würfel statt Normalwurf)
const critRolled = {
  [rollValueKey(rowA, "c-n")]: 4,
  [rollValueKey(rowA, "c-m")]: 3,
  [rollValueKey(rowA, "c-n__krit")]: 5,
  [rollValueKey(rowA, "c-m__krit")]: 2,
};
check(
  "Zeilenschaden kritisch: Normalwurf + Fest + Zusatzwurf + Krit-Fest",
  computeRowDamage(p2, critRolled, true, rowA),
  4 + 0 + 4 + 3 + 4 + 0 + 5 + 2
);
check(
  "Zeilenschaden kritisch: ohne Zusatzwurf-Eingaben zählt nur der Normalwurf",
  computeRowDamage(p2, rolled, true, rowA),
  4 + 0 + 4 + 3 + 4 + 0
);
check(
  "Krit-Zeilen haben eigene IDs (Eingabefelder kollidieren nicht)",
  p2.criticalLines.map((l) => l.id),
  ["c-n__krit", "c-m__krit"]
);
check(
  "Zeilenschaden: Werte verschiedener Zeilen vermischen sich nicht",
  computeRowDamage(p2, rolled, false, rowB),
  4 + 0 + 5 + 2
);

// ── 8) Hilfsfunktionen ──
check("splitDiceAndFlat 1W6+2", splitDiceAndFlat("1W6+2"), { dice: "1W6", flat: 2 });
check("splitDiceAndFlat 1W6", splitDiceAndFlat("1W6"), { dice: "1W6", flat: 0 });

// ── 9) Migration: alte Felder werden ins neue Modell überführt ──
const legacy = normalizeWeaponData({
  isMelee: true,
  baseDice: "1W8",
  extraDamage: "+1W6",
  magicBonus: 2,
  sneakAttackBonusDamage: 3,
  sneakAttackBonusAttack: 2,
});
check(
  "Migration: alte Felder -> Komponenten",
  legacy.damageComponents?.map((c) => `${c.kind}:${c.label}:${c.dice ?? ""}:${c.flat ?? 0}`),
  ["native:Nativ:1W8:0", "magic:Magisch:+1W6:0", "situational:Hinterhalt::3"]
);
check("Migration: magicBonus -> enhancement", legacy.enhancement, 2);
check("Migration: kritische Schwelle standard 20", legacy.criticalThreshold, 20);

// ── 10) Legacy-IDs sind stabil (sonst werden Wuerfelwerte bei jedem Render verworfen) ──
const legacyA = normalizeWeaponData({ isMelee: true, baseDice: "1W8", magicBonus: 2 });
const legacyB = normalizeWeaponData({ isMelee: true, baseDice: "1W8", magicBonus: 2 });
check(
  "Migration: Komponenten-IDs sind ueber zwei Aufrufe identisch",
  legacyA.damageComponents?.map((c) => c.id),
  legacyB.damageComponents?.map((c) => c.id)
);
check(
  "Migration: Wuerfel-Key bleibt ueber zwei Aufrufe stabil",
  rollValueKey("w1::0", legacyA.damageComponents?.[0]?.id ?? ""),
  rollValueKey("w1::0", legacyB.damageComponents?.[0]?.id ?? "")
);
check(
  "Migration: Schadenszeilen behalten ihre ID (Eingabefelder bleiben befuellt)",
  buildAttackProfile(
    {
      id: "w1",
      name: "Altschwert",
      category: "weapon",
      location: "equipped",
      isActiveWeapon: true,
      weaponData: { isMelee: true, baseDice: "1W6", magicBonus: 2, damageAttribute: "ST" },
    },
    ctxBase
  ).damageLines.map((l) => l.id),
  buildAttackProfile(
    {
      id: "w1",
      name: "Altschwert",
      category: "weapon",
      location: "equipped",
      isActiveWeapon: true,
      weaponData: { isMelee: true, baseDice: "1W6", magicBonus: 2, damageAttribute: "ST" },
    },
    ctxBase
  ).damageLines.map((l) => l.id)
);

// ── 11) Migration: extraDamage als bedingter Waffen-Standardschaden ──
// Schurkenschwert: "+4 bei Hinterhältig" ist Teil des STANDARD-Schadens der
// Waffe und gehoert deshalb auch in den Krit-Zusatzwurf.
const rogueSwordLegacy = normalizeWeaponData({
  isMelee: true,
  baseDice: "1W6",
  extraDamage: "+4 bei Hinterhältig",
  magicBonus: 1,
  damageAttribute: "ST",
});
check(
  "Migration: '+4 bei Hinterhältig' wird situativer Flachbonus, kein Magiewürfel",
  rogueSwordLegacy.damageComponents?.map((c) => `${c.id}:${c.kind}:${c.flat ?? 0}:${c.condition ?? "always"}`),
  ["legacy-native:native:0:always", "legacy-sneak-conditional:situational:4:sneakAttack"]
);
check(
  "Migration: bedingter Waffenbonus zaehlt zum Standardschaden (criticalApplies true)",
  rogueSwordLegacy.damageComponents?.find((c) => c.id === "legacy-sneak-conditional")?.criticalApplies,
  true
);

const rogueSwordItem: InventoryItem = {
  id: "w-rogue",
  name: "Schurkenschwert",
  category: "weapon",
  location: "equipped",
  isActiveWeapon: true,
  weaponData: {
    isMelee: true,
    baseDice: "1W6",
    extraDamage: "+4 bei Hinterhältig",
    magicBonus: 1,
    damageAttribute: "ST",
  },
};
const pRogueSneak = buildAttackProfile(rogueSwordItem, ctxSneak);
check(
  "Schurkenschwert: Normalwurf enthaelt bedingten Bonus und Klassenwuerfel",
  formatRollPlan(pRogueSneak),
  "1W6+4 · +4 (Bei Hinterhältig) · 3W6 (Hinterhalt (Klasse))"
);
check(
  "Schurkenschwert: Krit-Zusatzwurf MIT bedingtem Bonus, OHNE Klassenwuerfel",
  pRogueSneak.criticalSummary,
  "1W6+4 +4"
);
check(
  "Schurkenschwert: Krit-Fest enthaelt den bedingten Bonus",
  pRogueSneak.criticalFixed.total,
  4 + 4
);
const pRogueNoSneak = buildAttackProfile(rogueSwordItem, ctxBase);
check(
  "Schurkenschwert: ohne Hinterhalt kein bedingter Bonus im Zusatzwurf",
  pRogueNoSneak.criticalSummary,
  "1W6+4"
);

// Gegenprobe: extraDamage als Wuerfelangabe bleibt magischer Schaden.
const iceSwordLegacy = normalizeWeaponData({
  isMelee: true,
  baseDice: "1W6",
  extraDamage: "1W6 Eis",
});
check(
  "Migration: '1W6 Eis' bleibt Magieschaden (kein bedingter Bonus)",
  iceSwordLegacy.damageComponents?.map((c) => `${c.id}:${c.kind}:${c.dice ?? ""}`),
  ["legacy-native:native:1W6", "legacy-magic:magic:1W6 Eis"]
);
check(
  "Migration: beide Legacy-Zweige nutzen unterschiedliche IDs",
  new Set([
    ...(rogueSwordLegacy.damageComponents || []),
    ...(iceSwordLegacy.damageComponents || []),
  ].map((c) => c.id)).size,
  3
);

// ── 12) Krit-ID-Stabilitaet: Zusatzwurf-Keys bleiben ueber Render stabil ──
const critKeyA = buildAttackProfile(rogueSwordItem, ctxSneak).criticalLines.map((l) =>
  rollValueKey("w-rogue::0", l.id)
);
const critKeyB = buildAttackProfile(rogueSwordItem, ctxSneak).criticalLines.map((l) =>
  rollValueKey("w-rogue::0", l.id)
);
check("Krit-Zusatzwurf: Wuerfel-Keys sind ueber zwei Aufrufe identisch", critKeyA, critKeyB);
check(
  "Krit-Zusatzwurf: Keys ueberschneiden sich nicht mit dem Normalwurf",
  critKeyA.some((k) =>
    pRogueSneak.damageLines.some((l) => rollValueKey("w-rogue::0", l.id) === k)
  ),
  false
);
check(
  "Wurfplan mit Krit zeigt Normalwurf UND Zusatzwurf",
  formatRollPlan(p2, true),
  "1W6+4 · 1W6 (Magisch) + Krit: 1W6+4 · 1W6 (Magisch)"
);

// ── 13) Kampfhistorie ──
const hitA = makeCombatHistoryEntry(
  { weaponName: "Schurkenschwert", handLabel: "Haupthand", attackBonus: 7, damage: 18, critical: false, status: "" },
  "2026-11-26T13:30:00.000Z"
);
const hitB = makeCombatHistoryEntry(
  { weaponName: "Schurkenschwert", handLabel: "Haupthand", attackBonus: 2, damage: 24, critical: true, status: "blutend" },
  "2026-11-26T13:31:00.000Z"
);
check("Kampfhistorie: neuer Eintrag hat ID und Zeitpunkt", [typeof hitA.id === "string" && hitA.id.length > 0, hitA.timestamp], [true, "2026-11-26T13:30:00.000Z"]);
const hist = appendCombatHistory(appendCombatHistory([], hitA), hitB);
check("Kampfhistorie: neueste Schläge stehen vorn", hist.map((h) => h.id), [hitB.id, hitA.id]);
check("Kampfhistorie: Schadenssumme", sumCombatHistory(hist), 42);
check(
  "Kampfhistorie: Label mit Angriffsbonus und Schaden",
  formatCombatHistoryLabel(hitA),
  "Schurkenschwert +7 · 18 Schaden"
);
check(
  "Kampfhistorie: Label bei negativem Bonus ohne doppeltes Vorzeichen",
  formatCombatHistoryLabel(makeCombatHistoryEntry({ weaponName: "Keule", handLabel: "Haupthand", attackBonus: -2, damage: 4, critical: false, status: "" })),
  "Keule -2 · 4 Schaden"
);
check("Kampfhistorie: leere Liste summiert zu 0", sumCombatHistory([]), 0);
check("Kampfhistorie: Zeitformat HH:MM", /^([01]\d|2[0-3]):[0-5]\d$/.test(formatCombatHistoryTime(hitA.timestamp)), true);
check("Kampfhistorie: kaputter Zeitstempel wird nicht angezeigt", formatCombatHistoryTime("kaputt"), "--:--");

// Persistenz am Charakter
const charWithHistory = {
  systemData: { combatHistory: hist },
} as unknown as GenericCharacter;
check("Kampfhistorie: Lesen aus den Systemdaten", readCombatHistory(charWithHistory).length, 2);
const charWithoutHistory = { systemData: {} } as unknown as GenericCharacter;
check("Kampfhistorie: alter Charakter ohne Feld liefert leere Liste", readCombatHistory(charWithoutHistory), []);
const charWithBrokenHistory = { systemData: { combatHistory: "kaputt" } } as unknown as GenericCharacter;
check("Kampfhistorie: kaputte Systemdaten liefern leere Liste", readCombatHistory(charWithBrokenHistory), []);
check("Kampfhistorie: Eintrag mit Krit und Status bleibt erhalten", [hist[0].critical, hist[0].status], [true, "blutend"]);

console.log("");
if (failed === 0) {
  console.log("ALLE PRUEFUNGEN BESTANDEN");
} else {
  console.log(`${failed} PRUEFUNG(EN) FEHLGESCHLAGEN`);
  process.exit(1);
}
