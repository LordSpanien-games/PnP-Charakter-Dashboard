import React from "react";
import { SystemPlugin, AttributePool } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter } from "../../core/types";
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
  PATHFINDER_CLASSES,
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

const getLevel = (character: GenericCharacter): number =>
  Number(character.systemData.level) || 1;

const getClassId = (character: GenericCharacter): string | undefined =>
  character.systemData.classId as string | undefined;

const createBase = (name: string, subTitle: string | undefined, attrs: Record<string, number>): GenericCharacter => {
  const base = createEmptyGenericCharacter("pathfinder", name, subTitle);
  return {
    ...base,
    attributes: attrs,
    resources: { hp: { current: 1, max: 1 } },
    systemData: { level: 1, classId: "fighter", armorBonus: 0, useDexToDamage: false },
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
    const koMod = calculateModifier(attrs.KO);
    const hp = 8 + koMod; // Startwert, Hit Die wird beim Level-Up relevant
    char.resources.hp = { current: hp, max: hp };
    return char;
  },

  detectLegacy: (raw: any) => {
    if (!raw || typeof raw !== "object") return false;
    const sys = String(raw.system || "").toLowerCase();
    if (sys === "pathfinder" || sys.startsWith("pathfinder") || sys === "pf" || sys === "pf1e") return true;
    // Heuristik wie im alten Code: typische Pathfinder-Stat-Labels
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

    // Level & Klasse grob aus subTitle extrahieren, z.B. "Level 9 Gnom Dieb"
    const sub = (raw.subTitle || "").toLowerCase();
    const levelMatch = sub.match(/(?:level|stufe)\s*(\d+)/);
    char.systemData.level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

    const classMatch = Object.entries(PATHFINDER_CLASSES).find(([, c]) =>
      sub.includes(c.name.toLowerCase().split(" ")[0])
    );
    char.systemData.classId = classMatch ? classMatch[0] : "fighter";

    char.weapons.melee = (raw.weapons?.melee || []).map((w: any) => ({
      name: w.name, attack: w.attack, damage: w.damage, note: w.note,
    }));
    char.weapons.ranged = (raw.weapons?.ranged || []).map((w: any) => ({
      name: w.name, attack: w.attack, damage: w.damage, note: w.note,
    }));
    char.inventory = raw.inventory || [];
    char.skills = (raw.skills || []).map((s: any) => ({ name: s.name, value: s.value, notes: s.note }));
    char.abilities = raw.abilities || [];

    return char;
  },

  recalculate: (character) => character, // Werte werden live im Dashboard berechnet, nicht persistiert

  DashboardComponent: ({ character, isEditing, onUpdate }) => {
    const attrs = getAttrs(character);
    const level = getLevel(character);
    const classId = getClassId(character);
    const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
    const armorBonus = Number(character.systemData.armorBonus) || 0;
    const useDexToDamage = Boolean(character.systemData.useDexToDamage);

    const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");
    const iteratives = getBabIteratives(bab);
    const saves = calculateSavingThrows(attrs, level, classId);
    const ac = calculateArmorClass(attrs, armorBonus);
    const hp = character.resources.hp || { current: 0, max: 0 };

    const updateAttr = (key: string, value: number) => {
      onUpdate({ attributes: { ...character.attributes, [key]: value } });
    };
    const updateSystemData = (key: string, value: unknown) => {
      onUpdate({ systemData: { ...character.systemData, [key]: value } });
    };
    const updateHp = (field: "current" | "max", value: number) => {
      onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });
    };

    return (
      <div className="space-y-6">
        {/* Klasse & Level */}
        <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 uppercase font-mono">Klasse</label>
            {isEditing ? (
              <select
                value={classId || ""}
                onChange={(e) => updateSystemData("classId", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1"
              >
                {Object.values(PATHFINDER_CLASSES).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-bold text-white mt-1">{cls?.name || "–"}</div>
            )}
          </div>
          <div className="w-24">
            <label className="text-[10px] text-zinc-500 uppercase font-mono">Level</label>
            {isEditing ? (
              <input
                type="number"
                min={1} max={20}
                value={level}
                onChange={(e) => updateSystemData("level", Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1 text-center"
              />
            ) : (
              <div className="text-sm font-bold text-white mt-1 text-center">{level}</div>
            )}
          </div>
        </div>

        {/* Attribute */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ATTR_KEYS.map((key) => (
            <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{key}</div>
              {isEditing ? (
                <input
                  type="number"
                  value={attrs[key]}
                  onChange={(e) => updateAttr(key, Number(e.target.value))}
                  className="w-full bg-black border border-zinc-700 rounded-lg text-center text-lg font-bold text-white py-1"
                />
              ) : (
                <div className="text-xl font-bold text-white">{attrs[key]}</div>
              )}
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                {formatModifier(calculateModifier(attrs[key]))}
              </div>
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
            {isEditing ? (
              <input
                type="number"
                value={armorBonus}
                onChange={(e) => updateSystemData("armorBonus", Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-lg text-center text-sm font-bold text-white py-1"
                title="Rüstungsbonus eintragen"
              />
            ) : (
              <div className="text-lg font-bold text-white">{ac.armorClass}</div>
            )}
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
              Berührung {ac.touchAc} · Flat {ac.flatFootedAc}
            </div>
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
            ) : (
              <div className="text-lg font-bold text-white">{hp.current} / {hp.max ?? "–"}</div>
            )}
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Dex-to-Dmg</div>
            {isEditing ? (
              <input
                type="checkbox"
                checked={useDexToDamage}
                onChange={(e) => updateSystemData("useDexToDamage", e.target.checked)}
                className="w-5 h-5 mt-1"
                title="Schurken-Finesse / Fechtkunst aktiv"
              />
            ) : (
              <div className="text-sm font-bold text-white">{useDexToDamage ? "Aktiv" : "Inaktiv"}</div>
            )}
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

        {/* Waffen */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300 mb-1">Waffen</div>
          {[...character.weapons.melee, ...character.weapons.ranged].length === 0 && (
            <p className="text-xs text-zinc-600 font-mono">Keine Waffen eingetragen</p>
          )}
          {[...character.weapons.melee, ...character.weapons.ranged].map((w, idx) => {
            const live = calculateWeaponStats(
              { name: w.name, baseDice: (w.damage || "1W6").split("+")[0], isMelee: character.weapons.melee.includes(w) },
              attrs, level, classId, useDexToDamage
            );
            return (
              <div key={idx} className="flex items-center justify-between text-sm text-zinc-300 font-mono">
                <span>{w.name}</span>
                <span className="text-zinc-500">{live.attack} · {live.damage}</span>
              </div>
            );
          })}
        </div>

        {/* Inventar */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-xs font-mono font-bold text-zinc-300 mb-2">Inventar</div>
          <ul className="space-y-1 text-sm text-zinc-400">
            {character.inventory.length === 0 && <li className="text-zinc-600">Leer</li>}
            {character.inventory.map((item) => (
              <li key={item.id}>• {item.name} {item.quantity ? `(${item.quantity}x)` : ""}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  },
};
