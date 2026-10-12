import React, { useState } from "react";
import { SystemPlugin, AttributePool } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter, InventoryItem } from "../../core/types";
import { rollPool, roll4d6DropLowest } from "../../core/dice";
import {
  PathfinderAttributes,
  calculateModifier,
  formatModifier,
  calculateSavingThrows,
  calculateArmorClass,
  calculateWeaponStats,
  calculateBAB,
  formatIteratives,
  getBabIteratives,
  getSneakAttackDice,
  getRageRounds,
  getFavoredEnemyBonus,
  getChannelEnergy,
  getBardicPerformanceRounds,
  getStunningFistUses,
  PATHFINDER_CLASSES,
  PATHFINDER_RACES,
} from "./pathfinderRules";

const ATTR_KEYS = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
const ATTR_LABELS: Record<string, string> = {
  ST: "Stärke (ST)", GE: "Geschicklichkeit (GE)", KO: "Konstitution (KO)",
  IN: "Intelligenz (IN)", WE: "Weisheit (WE)", CH: "Charisma (CH)",
};

const getAttrs = (character: GenericCharacter): PathfinderAttributes => ({
  ST: Number(character.attributes.ST) || 10,
  GE: Number(character.attributes.GE) || 10,
  KO: Number(character.attributes.KO) || 10,
  IN: Number(character.attributes.IN) || 10,
  WE: Number(character.attributes.WE) || 10,
  CH: Number(character.attributes.CH) || 10,
});

const getLevel = (c: GenericCharacter) => Number(c.systemData.level) || 1;
const getClassId = (c: GenericCharacter) => c.systemData.classId as string | undefined;
const getRaceId = (c: GenericCharacter) => c.systemData.raceId as string | undefined;

const makeId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const createBase = (name: string, subTitle: string | undefined, attrs: Record<string, number>): GenericCharacter => {
  const base = createEmptyGenericCharacter("pathfinder", name, subTitle);
  return {
    ...base,
    attributes: attrs,
    resources: { hp: { current: 1, max: 1 } },
    systemData: { level: 1, classId: "fighter", raceId: "human", sneakAttackActive: false },
  };
};

export const PathfinderPlugin: SystemPlugin = {
  id: "pathfinder",
  name: "Pathfinder 1e",
  tagline: "High-Fantasy D20 mit taktischem Tiefgang",
  badge: "D20 System",
  color: "border-zinc-800 hover:border-amber-500/50 bg-zinc-900/60",
  activeColor: "border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50",

  attributeDefinitions: ATTR_KEYS.map((k) => ({ key: k, label: ATTR_LABELS[k] })),
  resourceDefinitions: [{ key: "hp", label: "Trefferpunkte (TP)", hasMax: true }],

  createBlankCharacter: (name, subTitle) =>
    createBase(name, subTitle, { ST: 10, GE: 10, KO: 10, IN: 10, WE: 10, CH: 10 }),

  rollAttributePool: (): AttributePool => ({
    values: rollPool(6, roll4d6DropLowest),
    methodLabel: "4W6 pro Attribut, niedrigsten Wurf verwerfen (Standardmethode)",
  }),

  supportsManualAssignment: true,

  buildCharacterFromPool: (name, subTitle, pool, assignment) => {
    const attrs: Record<string, number> = {};
    ATTR_KEYS.forEach((key, idx) => {
      const poolIndex = assignment ? assignment[key] : idx;
      attrs[key] = pool[poolIndex] ?? 10;
    });
    const char = createBase(name, subTitle, attrs);
    const hp = 8 + calculateModifier(attrs.KO);
    char.resources.hp = { current: hp, max: hp };
    return char;
  },

  detectLegacy: (raw: any) => {
    if (!raw || typeof raw !== "object") return false;
    const sys = String(raw.system || "").toLowerCase();
    if (sys === "pathfinder" || sys.startsWith("pathfinder") || sys === "pf" || sys === "pf1e") return true;
    if (Array.isArray(raw.stats)) {
      return raw.stats.some((s: any) => {
        const l = (s.label || "").toLowerCase();
        return l.includes("zähigkeit") || l.includes("reflex") || l.includes("wille") || l.includes("kmb") || l.includes("kmv");
      });
    }
    return false;
  },

  migrateLegacy: (raw: any) => {
    const attrs: Record<string, number> = { ST: 10, GE: 10, KO: 10, IN: 10, WE: 10, CH: 10 };
    const sourceList = [...(raw.characteristics || []), ...(raw.stats || [])];
    sourceList.forEach((s: any) => {
      const label = (s.label || "").toUpperCase();
      ATTR_KEYS.forEach((key) => {
        if (label === key || label.startsWith(ATTR_LABELS[key].toUpperCase().slice(0, 4))) {
          const val = typeof s.value === "number" ? s.value : parseInt(String(s.value).replace(/[^0-9-]/g, ""), 10);
          if (!isNaN(val)) attrs[key] = val;
        }
      });
    });

    const char = createBase(raw.name || "Unbenannt", raw.subTitle, attrs);

    const hpStat = (raw.stats || []).find((s: any) => (s.label || "").toLowerCase().includes("trefferpunkte"));
    if (hpStat) {
      const hp = parseInt(String(hpStat.value).replace(/[^0-9-]/g, ""), 10) || 1;
      char.resources.hp = { current: hp, max: hp };
    }

    const sub = (raw.subTitle || "").toLowerCase();
    const levelMatch = sub.match(/(?:level|stufe)\s*(\d+)/);
    char.systemData.level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

    const classMatch = Object.entries(PATHFINDER_CLASSES).find(([, c]) =>
      sub.includes(c.name.toLowerCase().split(" ")[0].replace(/[^a-zäöü]/gi, ""))
    );
    char.systemData.classId = classMatch ? classMatch[0] : "fighter";

    const raceMatch = Object.entries(PATHFINDER_RACES).find(([, r]) => sub.includes(r.name.toLowerCase()));
    char.systemData.raceId = raceMatch ? raceMatch[0] : "human";

    const migrateWeapon = (w: any, isMelee: boolean): InventoryItem => ({
      id: makeId(),
      name: w.name,
      category: "weapon",
      location: "equipped",
      isActiveWeapon: true,
      sourceReference: w.sourceReference,
      weaponData: {
        isMelee,
        isFinesse: !!w.isFinesse,
        magicBonus: w.magicBonus ?? 0,
        baseDice: w.baseDice || "1W6",
        damageAttribute: w.damageAttribute === "GE" ? "GE" : isMelee ? "ST" : "NONE",
        sneakAttackBonusAttack: w.sneakAttackBonus ?? 0,
        sneakAttackBonusDamage: w.sneakAttackDamageBonus ?? 0,
      },
    });

    char.inventory = [
      ...(raw.weapons?.melee || []).map((w: any) => migrateWeapon(w, true)),
      ...(raw.weapons?.ranged || []).map((w: any) => migrateWeapon(w, false)),
      ...((raw.inventory || []).map((it: any) => ({
        id: makeId(),
        name: it.name,
        category: it.category || "gear",
        quantity: it.quantity ?? 1,
        notes: it.notes,
        sourceReference: it.page || it.sourceReference,
        location: it.status === "stored" ? "stored" : "equipped",
        charges: it.maxUses
          ? { max: it.maxUses, current: it.currentUses ?? it.maxUses, rechargeType: "rest" }
          : undefined,
      }))),
    ];

    char.skills = (raw.skills || []).map((s: any) => ({ name: s.name, value: s.value, notes: s.note }));
    char.abilities = raw.abilities || [];

    return char;
  },

  recalculate: (character) => character,

  DashboardComponent: ({ character, isEditing, onUpdate }) => {
    const attrs = getAttrs(character);
    const level = getLevel(character);
    const classId = getClassId(character);
    const raceId = getRaceId(character);
    const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
    const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
    const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);

    const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");
    const iteratives = getBabIteratives(bab);
    const saves = calculateSavingThrows(attrs, level, classId);

    const armorItem = character.inventory.find((i) => i.category === "armor" && i.location === "equipped");
    const armorBonus = armorItem?.armorData?.armorBonus ?? 0;
    const ac = calculateArmorClass(attrs, armorBonus, raceId);
    const hp = character.resources.hp || { current: 0, max: 0 };

    const activeWeapons = character.inventory.filter(
      (i) => i.category === "weapon" && i.location === "equipped" && i.isActiveWeapon
    );

    const chaMod = calculateModifier(attrs.CH);
    const wisMod = calculateModifier(attrs.WE);

    const sneakDice = getSneakAttackDice(classId, level);
    const rageRounds = classId === "barbarian" ? getRageRounds(classId, calculateModifier(attrs.KO)) : 0;
    const favoredEnemy = classId === "ranger" ? getFavoredEnemyBonus(classId, level) : 0;
    const channelEnergy = classId === "cleric" ? getChannelEnergy(classId, level, chaMod) : null;
    const bardicRounds = classId === "bard" ? getBardicPerformanceRounds(classId, level) : 0;
    const stunningFistUses = classId === "monk" ? getStunningFistUses(classId, level) : 0;

    const hasClassFeatureDisplay = ["barbarian", "ranger", "cleric", "bard", "monk"].includes(classId || "");

    const updateAttr = (key: string, value: number) =>
      onUpdate({ attributes: { ...character.attributes, [key]: value } });
    const updateSystemData = (key: string, value: unknown) =>
      onUpdate({ systemData: { ...character.systemData, [key]: value } });
    const updateHp = (field: "current" | "max", value: number) =>
      onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });

    const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) => {
      onUpdate({
        inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      });
    };
    const removeInventoryItem = (id: string) => {
      onUpdate({ inventory: character.inventory.filter((it) => it.id !== id) });
    };
    const addInventoryItem = (category: "weapon" | "armor" | "gear") => {
      const base: InventoryItem = {
        id: makeId(),
        name: category === "weapon" ? "Neue Waffe" : category === "armor" ? "Neue Rüstung" : "Neuer Gegenstand",
        category,
        quantity: 1,
        location: "equipped",
        isActiveWeapon: category === "weapon" ? false : undefined,
        weaponData: category === "weapon" ? { isMelee: true, baseDice: "1W6", damageAttribute: "ST" } : undefined,
        armorData: category === "armor" ? { armorBonus: 0 } : undefined,
      };
      onUpdate({ inventory: [...character.inventory, base] });
    };

    return (
      <div className="space-y-6">
        {/* Klasse, Rasse, Level */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-mono">Klasse</label>
            {isEditing ? (
              <select value={classId || ""} onChange={(e) => updateSystemData("classId", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1">
                {Object.values(PATHFINDER_CLASSES).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            ) : <div className="text-sm font-bold text-white mt-1">{cls?.name || "–"}</div>}
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-mono">Rasse</label>
            {isEditing ? (
              <select value={raceId || ""} onChange={(e) => updateSystemData("raceId", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1">
                {Object.values(PATHFINDER_RACES).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            ) : <div className="text-sm font-bold text-white mt-1">{race?.name || "–"}</div>}
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase font-mono">Level</label>
            {isEditing ? (
              <input type="number" min={1} max={20} value={level}
                onChange={(e) => updateSystemData("level", Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1 text-center" />
            ) : <div className="text-sm font-bold text-white mt-1 text-center">{level}</div>}
          </div>
        </div>

        {/* Attribute */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ATTR_KEYS.map((key) => (
            <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{key}</div>
              {isEditing ? (
                <input type="number" value={attrs[key]} onChange={(e) => updateAttr(key, Number(e.target.value))}
                  className="w-full bg-black border border-zinc-700 rounded-lg text-center text-lg font-bold text-white py-1" />
              ) : <div className="text-xl font-bold text-white">{attrs[key]}</div>}
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">{formatModifier(calculateModifier(attrs[key]))}</div>
            </div>
          ))}
        </div>

        {/* Kampfwerte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">GAB</div>
            <div className="text-sm font-bold text-white">{formatIteratives(iteratives)}</div>
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Rüstungsklasse</div>
            <div className="text-lg font-bold text-white">{ac.armorClass}</div>
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">Berührung {ac.touchAc} · Flat {ac.flatFootedAc}</div>
            <div className="text-[9px] text-zinc-600 font-mono">aus Rüstung: {armorItem?.name || "keine"}</div>
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Trefferpunkte</div>
            {isEditing ? (
              <div className="flex items-center justify-center gap-1">
                <input type="number" value={hp.current} onChange={(e) => updateHp("current", Number(e.target.value))}
                  className="w-12 bg-black border border-zinc-700 rounded-lg text-center text-sm font-bold text-white py-1" />
                <span className="text-zinc-500">/</span>
                <input type="number" value={hp.max ?? 0} onChange={(e) => updateHp("max", Number(e.target.value))}
                  className="w-12 bg-black border border-zinc-700 rounded-lg text-center text-sm font-bold text-white py-1" />
              </div>
            ) : <div className="text-lg font-bold text-white">{hp.current} / {hp.max ?? "–"}</div>}
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Hinterhält. Angriff</div>
            <label className="flex items-center justify-center gap-1.5 mt-1 cursor-pointer">
              <input type="checkbox" checked={sneakAttackActive}
                onChange={(e) => updateSystemData("sneakAttackActive", e.target.checked)} />
              <span className="text-sm font-bold text-white">{sneakDice > 0 ? `+${sneakDice}W6` : "–"}</span>
            </label>
          </div>
        </div>

        {/* Rettungswürfe */}
        <div className="grid grid-cols-3 gap-3">
          {(["fortitude", "reflex", "will"] as const).map((key) => (
            <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">
                {key === "fortitude" ? "Zähigkeit" : key === "reflex" ? "Reflex" : "Wille"}
              </div>
              <div className="text-lg font-bold text-white">{formatModifier(saves[key].total)}</div>
            </div>
          ))}
        </div>

        {/* Generische Klassen-Features (nur sichtbar, wenn relevant) */}
        {hasClassFeatureDisplay && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {classId === "barbarian" && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Wut (Runden/Tag)</div>
                <div className="text-lg font-bold text-white">{rageRounds}</div>
              </div>
            )}
            {classId === "ranger" && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Lieblingsfeind-Bonus</div>
                <div className="text-lg font-bold text-white">+{favoredEnemy}</div>
              </div>
            )}
            {classId === "cleric" && channelEnergy && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Energie fokussieren</div>
                <div className="text-lg font-bold text-white">{channelEnergy.dice}W6</div>
                <div className="text-[9px] text-zinc-500 font-mono">{channelEnergy.usesPerDay}x / Tag</div>
              </div>
            )}
            {classId === "bard" && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Bardenauftritt (Runden/Tag)</div>
                <div className="text-lg font-bold text-white">{bardicRounds}</div>
              </div>
            )}
            {classId === "monk" && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Betäubender Schlag (x/Tag)</div>
                <div className="text-lg font-bold text-white">{stunningFistUses}</div>
              </div>
            )}
          </div>
        )}

        {/* Aktive Kampfwaffen */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300 mb-1">
            Aktive Kampfwaffen {sneakAttackActive && "(mit hinterhältigem Angriff)"}
          </div>
          {activeWeapons.length === 0 && (
            <p className="text-xs text-zinc-600 font-mono">
              Keine aktive Waffe markiert – im Inventar unten eine Waffe als "aktiv" setzen.
            </p>
          )}
          {activeWeapons.map((item) => {
            const result = calculateWeaponStats(
              {
                name: item.name,
                isMelee: item.weaponData?.isMelee ?? true,
                isFinesse: item.weaponData?.isFinesse,
                magicBonus: item.weaponData?.magicBonus,
                baseDice: item.weaponData?.baseDice,
                damageAttribute: item.weaponData?.damageAttribute,
                sneakAttackBonusAttack: item.weaponData?.sneakAttackBonusAttack,
                sneakAttackBonusDamage: item.weaponData?.sneakAttackBonusDamage,
                extraDamage: item.weaponData?.extraDamage,
              },
              attrs, level, classId, raceId, { sneakAttackActive }
            );
            return (
              <div key={item.id} className="text-sm font-mono text-zinc-300 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {item.name}
                  {item.sourceReference && (
                    <span className="text-[9px] text-amber-400/80 bg-amber-950/20 border border-amber-900/30 px-1 py-0.5 rounded">
                      {item.sourceReference}
                    </span>
                  )}
                </span>
                <span className="text-zinc-500">
                  {sneakAttackActive && result.sneakAttack ? (
                    <>{result.sneakAttack.attack} · {result.sneakAttack.damage}</>
                  ) : (
                    <>{result.attack} · {result.damage}</>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Inventar-Editor */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Inventar</span>
            {isEditing && (
              <div className="flex gap-1.5">
                <button onClick={() => addInventoryItem("weapon")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Waffe</button>
                <button onClick={() => addInventoryItem("armor")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Rüstung</button>
                <button onClick={() => addInventoryItem("gear")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Gegenstand</button>
              </div>
            )}
          </div>

          {character.inventory.length === 0 && <p className="text-xs text-zinc-600 font-mono">Leer</p>}

          <div className="space-y-2">
            {character.inventory.map((item) => (
              <div key={item.id} className="p-3 bg-black/40 border border-zinc-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {isEditing ? (
                    <input value={item.name} onChange={(e) => updateInventoryItem(item.id, { name: e.target.value })}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-mono" />
                  ) : (
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      {item.name}
                      {item.sourceReference && (
                        <span className="text-[9px] text-amber-400/80 bg-amber-950/20 border border-amber-900/30 px-1 py-0.5 rounded">
                          {item.sourceReference}
                        </span>
                      )}
                    </span>
                  )}

                  {isEditing && (
                    <button onClick={() => removeInventoryItem(item.id)} className="text-xs text-red-400 font-mono">Entfernen</button>
                  )}
                </div>

                {isEditing && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={item.location === "equipped"}
                        onChange={(e) => updateInventoryItem(item.id, { location: e.target.checked ? "equipped" : "stored" })} />
                      Am Körper getragen
                    </label>

                    {item.category === "weapon" && (
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={!!item.isActiveWeapon}
                          onChange={(e) => updateInventoryItem(item.id, { isActiveWeapon: e.target.checked })} />
                        Aktive Kampfwaffe
                      </label>
                    )}
                  </div>
                )}

                {isEditing && item.category === "weapon" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-800">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      <input type="checkbox" checked={item.weaponData?.isMelee ?? true}
                        onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData, isMelee: e.target.checked } })} />
                      Nahkampf
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      <input type="checkbox" checked={!!item.weaponData?.isFinesse}
                        onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, isFinesse: e.target.checked } })} />
                      Finesse
                    </label>
                    <div>
                      <label className="block text-[9px] text-zinc-500">Schaden (W-Formel)</label>
                      <input value={item.weaponData?.baseDice || ""} placeholder="1W6"
                        onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, baseDice: e.target.value } })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500">Magie-Bonus</label>
                      <input type="number" value={item.weaponData?.magicBonus ?? 0}
                        onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, magicBonus: Number(e.target.value) } })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                    </div>
                  </div>
                )}

                {isEditing && item.category === "armor" && (
                  <div className="pt-1 border-t border-zinc-800">
                    <label className="block text-[9px] text-zinc-500">Rüstungsbonus</label>
                    <input type="number" value={item.armorData?.armorBonus ?? 0}
                      onChange={(e) => updateInventoryItem(item.id, { armorData: { armorBonus: Number(e.target.value) } })}
                      className="w-24 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                  </div>
                )}

                {isEditing && (
                  <div className="pt-1 border-t border-zinc-800 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      <input type="checkbox" checked={!!item.charges}
                        onChange={(e) => updateInventoryItem(item.id, {
                          charges: e.target.checked ? { max: 1, current: 1, rechargeType: "rest" } : undefined
                        })} />
                      Hat Ladungen
                    </label>
                    {item.charges && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                        <span>Aktuell</span>
                        <input type="number" value={item.charges.current}
                          onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, current: Number(e.target.value) } })}
                          className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
                        <span>/ Max</span>
                        <input type="number" value={item.charges.max}
                          onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, max: Number(e.target.value) } })}
                          className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
                        <select value={item.charges.rechargeType}
                          onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, rechargeType: e.target.value as any } })}
                          className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white">
                          <option value="rest">Erneuert sich bei Rast</option>
                          <option value="manual">Muss aufgeladen werden</option>
                          <option value="none">Verbraucht sich dauerhaft</option>
                        </select>
                      </div>
                    )}

                    {/* Regelwerk-Referenz zum schnellen Nachschlagen */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                      <span>Regelwerk-Seite</span>
                      <input
                        value={item.sourceReference || ""}
                        placeholder="z.B. GRW S. 112"
                        onChange={(e) => updateInventoryItem(item.id, { sourceReference: e.target.value || undefined })}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white"
                      />
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="text-[11px] text-zinc-500 font-mono flex gap-3">
                    <span>{item.location === "equipped" ? "Am Körper" : "Eingelagert"}</span>
                    {item.charges && <span>Ladungen: {item.charges.current}/{item.charges.max}</span>}
                    {item.category === "weapon" && item.isActiveWeapon && <span className="text-orange-400">Aktive Waffe</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
