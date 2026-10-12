import React from "react";
import { SystemPlugin, AttributePool } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter } from "../../core/types";
import { rollDice, rollPool } from "../../core/dice";

const ATTRIBUTE_KEYS = ["STR", "DEX", "WIL"] as const;

const createCairnBase = (
  id: string,
  name: string,
  subTitle: string | undefined,
  attributes: Record<string, number>
): GenericCharacter => {
  const base = createEmptyGenericCharacter(id, name, subTitle);
  return {
    ...base,
    attributes,
    resources: {
      hp: { current: 1, max: 1 },
      deprivation: { current: 0, max: 10 },
    },
  };
};

const buildPlugin = (id: string, name: string, badge: string): SystemPlugin => ({
  id,
  name,
  tagline: "Minimalistisches OSR-Rollenspiel mit tödlichem Fokus",
  badge,
  color: "border-zinc-800 hover:border-stone-500/50 bg-zinc-900/60",
  activeColor: "border-stone-400 bg-stone-500/10 text-stone-200 ring-1 ring-stone-400/50",

  attributeDefinitions: [
    { key: "STR", label: "Stärke (STR)" },
    { key: "DEX", label: "Geschicklichkeit (DEX)" },
    { key: "WIL", label: "Wille (WIL)" },
  ],
  resourceDefinitions: [
    { key: "hp", label: "Trefferpunkte (HP)", hasMax: true },
    { key: "deprivation", label: "Entbehrung (Deprivation)", hasMax: true },
  ],

  createBlankCharacter: (charName, subTitle) =>
    createCairnBase(id, charName, subTitle, { STR: 0, DEX: 0, WIL: 0 }),

  rollAttributePool: (): AttributePool => ({
    values: rollPool(3, () => rollDice(3, 6)),
    methodLabel: "3W6 pro Attribut (STR, DEX, WIL)",
  }),

  supportsManualAssignment: true,

  buildCharacterFromPool: (charName, subTitle, pool, assignment) => {
    const attrs: Record<string, number> = {};
    ATTRIBUTE_KEYS.forEach((key, idx) => {
      const poolIndex = assignment ? assignment[key] : idx;
      attrs[key] = pool[poolIndex] ?? 10;
    });
    const hp = rollDice(1, 6);
    const char = createCairnBase(id, charName, subTitle, attrs);
    char.resources.hp = { current: hp, max: hp };
    return char;
  },

  detectLegacy: (raw: any) => {
    if (!raw || typeof raw !== "object") return false;
    const sys = String(raw.system || "").toLowerCase();
    return sys === id || sys === "cairn";
  },

  migrateLegacy: (raw: any) => {
    const attrs: Record<string, number> = {};
    (raw.characteristics || raw.stats || []).forEach((s: any) => {
      const label = (s.label || "").toUpperCase();
      if (ATTRIBUTE_KEYS.some((k) => label.includes(k))) {
        const key = ATTRIBUTE_KEYS.find((k) => label.includes(k))!;
        attrs[key] = Number(s.value) || 0;
      }
    });
    const char = createCairnBase(id, raw.name || "Unbenannt", raw.subTitle, attrs);
    const hpStat = (raw.stats || []).find((s: any) => (s.label || "").toLowerCase().includes("hp") || (s.label || "").toLowerCase().includes("trefferpunkte"));
    if (hpStat) {
      const hp = Number(hpStat.value) || 1;
      char.resources.hp = { current: hp, max: hp };
    }
    char.inventory = raw.inventory || [];
    return char;
  },

  recalculate: (character) => character, // Cairn hat keine abgeleiteten Werte

  DashboardComponent: ({ character, isEditing, onUpdate }) => {
    const updateAttr = (key: string, value: number) => {
      onUpdate({ attributes: { ...character.attributes, [key]: value } });
    };
    const updateResource = (key: string, field: "current" | "max", value: number) => {
      onUpdate({
        resources: {
          ...character.resources,
          [key]: { ...character.resources[key], [field]: value },
        },
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {ATTRIBUTE_KEYS.map((key) => (
            <div key={key} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[10px] uppercase text-zinc-500 font-mono mb-1">{key}</div>
              {isEditing ? (
                <input
                  type="number"
                  value={Number(character.attributes[key]) || 0}
                  onChange={(e) => updateAttr(key, Number(e.target.value))}
                  className="w-full bg-black border border-zinc-700 rounded-lg text-center text-xl font-bold text-white py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-white">{character.attributes[key] ?? 0}</div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["hp", "deprivation"] as const).map((resKey) => {
            const res = character.resources[resKey] || { current: 0, max: 0 };
            return (
              <div key={resKey} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-[10px] uppercase text-zinc-500 font-mono mb-1">
                  {resKey === "hp" ? "Trefferpunkte" : "Entbehrung"}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        value={res.current}
                        onChange={(e) => updateResource(resKey, "current", Number(e.target.value))}
                        className="w-16 bg-black border border-zinc-700 rounded-lg text-center text-white py-1"
                      />
                      <span className="text-zinc-500">/</span>
                      <input
                        type="number"
                        value={res.max ?? 0}
                        onChange={(e) => updateResource(resKey, "max", Number(e.target.value))}
                        className="w-16 bg-black border border-zinc-700 rounded-lg text-center text-white py-1"
                      />
                    </>
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {res.current} / {res.max ?? "–"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
});

export const CairnPlugin: SystemPlugin = buildPlugin("cairn", "Cairn", "OSR 3W6");
export const Cairn2Plugin: SystemPlugin = buildPlugin("cairn2", "Cairn 2", "OSR 3W6 v2");
