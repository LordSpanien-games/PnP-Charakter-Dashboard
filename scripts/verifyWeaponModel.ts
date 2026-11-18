/**
 * Verifikation des neuen Waffenmodells (Pathfinder 1e).
 * Ausführen:  npx tsx scripts/verifyWeaponModel.ts
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
  doubleDice,
  formatProfile,
  normalizeWeaponData,
  splitDiceAndFlat,
} from "../src/systems/pathfinder/pathfinderWeaponModel";
import { InventoryItem } from "../src/core/types";

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

// ── 1) Waffe +2: +2 Angriff, +2 Schaden, flach (nicht verdoppelt bei Krit) ──
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
check("+2 Waffe: Krit verdoppelt nur die Würfel", p1.criticalSummary, "2W6+5");
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
check("Magie: Krit verdoppelt beide Würfelgruppen", p2.criticalSummary, "2W6+4 2W6");

// ── 3) Hinterhalt: situativer Anteil, nur aktiv bei Hinterhalt, nicht bei Krit ──
const ctxSneak = { ...ctxBase, sneakAttackActive: true };
const p3 = buildAttackProfile(magicSword, ctxSneak);
check(
  "Hinterhalt: Wurfplan enthält Klassen-Hinterhaltwürfel (Rogue St.5 = 3W6)",
  formatRollPlan(p3),
  "1W6+4 · 1W6 (Magisch) · 3W6 (Hinterhalt (Klasse))"
);
check(
  "Hinterhalt: Klassenwürfel werden bei Krit NICHT verdoppelt",
  p3.criticalSummary,
  "2W6+4 2W6"
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
  "Hinterhalt-Bonus: nicht im kritischen Schaden",
  p3b.criticalSummary,
  "2W6+3"
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
check(
  "Zeilenschaden kritisch: Würfel verdoppelt, Fest bleibt",
  computeRowDamage(p2, { [rollValueKey(rowA, "c-n")]: 8, [rollValueKey(rowA, "c-m")]: 7 }, true, rowA),
  4 + 0 + 8 + 7
);
check(
  "Zeilenschaden: Werte verschiedener Zeilen vermischen sich nicht",
  computeRowDamage(p2, rolled, false, rowB),
  4 + 0 + 5 + 2
);

// ── 8) Hilfsfunktionen ──
check("doubleDice 1W6 -> 2W6", doubleDice("1W6"), "2W6");
check("doubleDice 1W6+1W8 -> 2W6+2W8", doubleDice("1W6+1W8"), "2W6+2W8");
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

console.log("");
if (failed === 0) {
  console.log("ALLE PRUEFUNGEN BESTANDEN");
} else {
  console.log(`${failed} PRUEFUNG(EN) FEHLGESCHLAGEN`);
  process.exit(1);
}
