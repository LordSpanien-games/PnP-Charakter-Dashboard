import React, { useState } from "react";
import { Info, Plus, Minus, ChevronDown, ChevronRight, X } from "lucide-react";
import { SystemPlugin, AttributePool } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter, InventoryItem, CombatModifier, CombatModifierContext, CombatModifierSourceType } from "../../core/types";
import { rollPool, roll4d6DropLowest } from "../../core/dice";
import {
  PathfinderAttributes,
  calculateModifier,
  formatModifier,
  calculateSavingThrows,
  calculateArmorClass,
  calculateWeaponGripVariants,
  calculateTwoWeaponFighting,
  calculateBAB,
  formatIteratives,
  getBabIteratives,
  getSneakAttackDice,
  getRageRounds,
  getFavoredEnemyBonus,
  getChannelEnergy,
  getBardicPerformanceRounds,
  getStunningFistUses,
  parseLegacyWeaponDamage,
  parseMagicBonusFromName,
  makeModifierId,
  PATHFINDER_CLASSES,
  PATHFINDER_RACES,
} from "./pathfinderRules";

const ATTR_KEYS = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
const ATTR_LABELS: Record<string, string> = {
  ST: "Stärke (ST)", GE: "Geschicklichkeit (GE)", KO: "Konstitution (KO)",
  IN: "Intelligenz (IN)", WE: "Weisheit (WE)", CH: "Charisma (CH)",
};

const CONTEXT_LABELS: Record<CombatModifierContext, string> = {
  always: "Immer",
  oneHandedOnly: "Nur einhändig",
  twoHandedOnly: "Nur zweihändig",
  offHandOnly: "Nur Nebenhand",
  sneakAttackOnly: "Nur Hinterhalt",
};

const SOURCE_LABELS: Record<CombatModifierSourceType, string> = {
  weapon: "Waffe", talent: "Talent", class: "Klasse", race: "Rasse", skill: "Fertigkeit", custom: "Sonstiges",
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
const getCharModifiers = (c: GenericCharacter): CombatModifier[] => (c.systemData.combatModifiers as CombatModifier[]) || [];

const makeId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const createBase = (name: string, subTitle: string | undefined, attrs: Record<string, number>): GenericCharacter => {
  const base = createEmptyGenericCharacter("pathfinder", name, subTitle);
  return {
    ...base,
    attributes: attrs,
    resources: { hp: { current: 1, max: 1 } },
    systemData: {
      level: 1, classId: "fighter", raceId: "human", sneakAttackActive: false,
      hasTwoWeaponFighting: false, hasImprovedTwoWeaponFighting: false, hasGreaterTwoWeaponFighting: false,
      combatModifiers: [] as CombatModifier[],
    },
  };
};

const ValueBadge: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 text-[11px] font-mono">
    <span className="text-[9px] text-zinc-500 uppercase mr-1">{label}:</span>
    <strong className={color || "text-zinc-200"}>{value}</strong>
  </div>
);

const GRIP_LABELS: Record<string, string> = { oneHanded: "Einhändig", twoHanded: "Zweihändig" };

/** Editierbare Liste von Kampf-Modifikatoren - für Waffen oder den Charakter selbst.
 * Zeigt im Editor immer einen "Hinzufügen"-Button, damit jede denkbare Kombination
 * (Quelle × Kontext × Angriff/Schaden/Zusatzschaden) ergänzt werden kann. */
const ModifierListEditor: React.FC<{
  modifiers: CombatModifier[];
  onChange: (next: CombatModifier[]) => void;
}> = ({ modifiers, onChange }) => {
  const addModifier = () => {
    onChange([
      ...modifiers,
      { id: makeModifierId(), label: "Neuer Modifikator", sourceType: "custom", context: "always" },
    ]);
  };
  const updateModifier = (id: string, patch: Partial<CombatModifier>) => {
    onChange(modifiers.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };
  const removeModifier = (id: string) => {
    onChange(modifiers.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-2">
      {modifiers.map((mod) => (
        <div key={mod.id} className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              value={mod.label}
              onChange={(e) => updateModifier(mod.id, { label: e.target.value })}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
              placeholder="Bezeichnung, z.B. Schurkenkurzschwert-Bonus"
            />
            <button onClick={() => removeModifier(mod.id)} className="text-red-400 hover:text-red-300 shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <select
              value={mod.sourceType}
              onChange={(e) => updateModifier(mod.id, { sourceType: e.target.value as CombatModifierSourceType })}
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
            >
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <select
              value={mod.context}
              onChange={(e) => updateModifier(mod.id, { context: e.target.value as CombatModifierContext })}
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
            >
              {Object.entries(CONTEXT_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <input
              type="number"
              value={mod.attackBonus ?? 0}
              onChange={(e) => updateModifier(mod.id, { attackBonus: Number(e.target.value) })}
              placeholder="Angriff +X"
              title="Angriffsbonus"
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
            />
            <input
              type="number"
              value={mod.damageBonus ?? 0}
              onChange={(e) => updateModifier(mod.id, { damageBonus: Number(e.target.value) })}
              placeholder="Schaden +X"
              title="Schadensbonus (flach)"
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
            />
          </div>
          <input
            value={mod.extraDamageDice || ""}
            onChange={(e) => updateModifier(mod.id, { extraDamageDice: e.target.value || undefined })}
            placeholder="Zusatzschaden, z.B. +1W6 Feuer oder +5 Blutung"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono"
          />
        </div>
      ))}
      <button
        onClick={addModifier}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono font-bold rounded-lg text-zinc-300"
      >
        <Plus size={12} /> Modifikator hinzufügen
      </button>
    </div>
  );
};

type CategoryTabId = "all" | "weapon" | "armor" | "consumable" | "jewelry" | "gear";
const CATEGORY_TABS: { id: CategoryTabId; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "weapon", label: "Waffen" },
  { id: "armor", label: "Rüstung" },
  { id: "consumable", label: "Tränke & Verbrauch" },
  { id: "jewelry", label: "Schmuck" },
  { id: "gear", label: "Sonstiges" },
];
const getTabForItem = (item: InventoryItem): CategoryTabId => {
  const cat = (item.category || "gear").toLowerCase();
  if (cat === "weapon") return "weapon";
  if (cat === "armor") return "armor";
  if (cat === "consumable" || cat === "potion" || cat === "ammo") return "consumable";
  if (cat === "jewelry" || cat === "accessory" || cat === "ring" || cat === "amulet") return "jewelry";
  return "gear";
};

const ChargeTracker: React.FC<{ current: number; max: number; onToggle: (newCurrent: number) => void }> = ({ current, max, onToggle }) => (
  <div className="flex items-center gap-1 flex-wrap">
    {Array.from({ length: max }, (_, i) => {
      const filled = i < current;
      return (
        <button key={i} onClick={() => onToggle(filled ? i : i + 1)}
          title={filled ? "Ladung verbrauchen" : "Ladung wiederherstellen"}
          className={`w-5 h-5 rounded border text-[9px] font-mono font-bold transition-colors ${
            filled ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-zinc-900 border-zinc-700 text-zinc-600"
          }`}
        >{i + 1}</button>
      );
    })}
  </div>
);

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

    const hpStat = (raw.stats || []).find(
      (s: any) => (s.label || "").toLowerCase().includes("trefferpunkte") || (s.label || "").toUpperCase() === "TP"
    );
    if (hpStat) {
      const rawVal = typeof hpStat.value === "number" ? hpStat.value : parseInt(String(hpStat.value).replace(/[^0-9-]/g, ""), 10);
      const maxHp = isNaN(rawVal) ? 1 : rawVal;
      const damageTaken = Number(hpStat.damage) || 0;
      char.resources.hp = { current: Math.max(0, maxHp - damageTaken), max: maxHp };
    }

    const combinedText = [raw.race, raw.level, raw.subTitle].filter(Boolean).join(" ").toLowerCase();

    let raceId = "human";
    if (raw.race) {
      const direct = Object.entries(PATHFINDER_RACES).find(([, r]) => r.name.toLowerCase() === String(raw.race).toLowerCase());
      if (direct) raceId = direct[0];
    }
    if (raceId === "human") {
      const textMatch = Object.entries(PATHFINDER_RACES).find(([, r]) => combinedText.includes(r.name.toLowerCase()));
      if (textMatch) raceId = textMatch[0];
    }
    char.systemData.raceId = raceId;

    const levelSource = (raw.level ? String(raw.level) : (raw.subTitle || "")).toLowerCase();
    const levelNumMatch = levelSource.match(/(\d+)/);
    const level = levelNumMatch ? parseInt(levelNumMatch[1], 10) : 1;

    const classMatch = Object.entries(PATHFINDER_CLASSES).find(([, c]) =>
      c.aliases.some((alias) => levelSource.includes(alias) || combinedText.includes(alias))
    );
    char.systemData.level = level;
    char.systemData.classId = classMatch ? classMatch[0] : "fighter";
    char.systemData.combatModifiers = [];

    const migrateWeapon = (w: any, isMelee: boolean): InventoryItem => {
      const { baseDice, extraDamage } = parseLegacyWeaponDamage(w.damage);
      const magicBonus = w.magicBonus ?? parseMagicBonusFromName(w.name || "");
      return {
        id: makeId(),
        name: w.name,
        category: "weapon",
        location: "equipped",
        isActiveWeapon: true,
        notes: w.note || w.notes,
        sourceReference: w.sourceReference || w.page,
        weaponData: {
          isMelee,
          isFinesse: !!w.isFinesse,
          isLight: !!w.isLight,
          magicBonus,
          baseDice,
          extraDamage,
          damageAttribute: w.damageAttribute === "GE" ? "GE" : isMelee ? "ST" : "NONE",
          supportsOneHanded: true,
          supportsTwoHanded: false,
          // Alte Werte bleiben als Fallback erhalten und werden automatisch in Hinterhalt-Modifikatoren übersetzt
          sneakAttackBonusAttack: w.sneakAttackBonus ?? 0,
          sneakAttackBonusDamage: w.sneakAttackDamageBonus ?? 0,
          modifiers: [],
          weaponSlot: "primary",
        },
      };
    };

    char.inventory = [
      ...(raw.weapons?.melee || []).map((w: any) => migrateWeapon(w, true)),
      ...(raw.weapons?.ranged || []).map((w: any) => migrateWeapon(w, false)),
      ...((raw.inventory || [])
        .filter((it: any) => it.category !== "weapon")
        .map((it: any) => ({
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
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<CategoryTabId>("all");

    const toggleExpand = (id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    const attrs = getAttrs(character);
    const level = getLevel(character);
    const classId = getClassId(character);
    const raceId = getRaceId(character);
    const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
    const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
    const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);
    const charModifiers = getCharModifiers(character);

    const hasTwoWeaponFighting = Boolean(character.systemData.hasTwoWeaponFighting);
    const hasImprovedTwoWeaponFighting = Boolean(character.systemData.hasImprovedTwoWeaponFighting);
    const hasGreaterTwoWeaponFighting = Boolean(character.systemData.hasGreaterTwoWeaponFighting);

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
    const primaryWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "primary" || !w.weaponData?.weaponSlot) || activeWeapons[0];
    const offHandWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "offHand" && w !== primaryWeapon);
    const isTwoWeaponMode = !!primaryWeapon && !!offHandWeapon;

    const chaMod = calculateModifier(attrs.CH);
    const sneakDice = getSneakAttackDice(classId, level);
    const rageRounds = classId === "barbarian" ? getRageRounds(classId, calculateModifier(attrs.KO)) : 0;
    const favoredEnemy = classId === "ranger" ? getFavoredEnemyBonus(classId, level) : 0;
    const channelEnergy = classId === "cleric" ? getChannelEnergy(classId, level, chaMod) : null;
    const bardicRounds = classId === "bard" ? getBardicPerformanceRounds(classId, level) : 0;
    const stunningFistUses = classId === "monk" ? getStunningFistUses(classId, level) : 0;
    const hasClassFeatureDisplay = ["barbarian", "ranger", "cleric", "bard", "monk"].includes(classId || "");

    const updateAttr = (key: string, value: number) => onUpdate({ attributes: { ...character.attributes, [key]: value } });
    const updateSystemData = (key: string, value: unknown) => onUpdate({ systemData: { ...character.systemData, [key]: value } });
    const updateHp = (field: "current" | "max", value: number) => onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });

    const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) => {
      onUpdate({ inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
    };
    const removeInventoryItem = (id: string) => {
      onUpdate({ inventory: character.inventory.filter((it) => it.id !== id) });
    };
    const addInventoryItem = (category: "weapon" | "armor" | "consumable" | "jewelry" | "gear") => {
      const base: InventoryItem = {
        id: makeId(),
        name: category === "weapon" ? "Neue Waffe" : category === "armor" ? "Neue Rüstung" : category === "consumable" ? "Neuer Trank" : category === "jewelry" ? "Neuer Schmuck" : "Neuer Gegenstand",
        category, quantity: 1, location: "equipped",
        isActiveWeapon: category === "weapon" ? false : undefined,
        weaponData: category === "weapon" ? { isMelee: true, baseDice: "1W6", damageAttribute: "ST", weaponSlot: "primary", supportsOneHanded: true, supportsTwoHanded: false, modifiers: [] } : undefined,
        armorData: category === "armor" ? { armorBonus: 0 } : undefined,
      };
      onUpdate({ inventory: [...character.inventory, base] });
      setExpandedIds((prev) => new Set(prev).add(base.id));
    };

    const adjustQuantity = (id: string, delta: number) => {
      onUpdate({ inventory: character.inventory.map((it) => it.id === id ? { ...it, quantity: Math.max(0, (it.quantity ?? 0) + delta) } : it) });
    };
    const setCharge = (id: string, newCurrent: number) => {
      onUpdate({ inventory: character.inventory.map((it) => {
        if (it.id !== id || !it.charges) return it;
        const clamped = Math.min(it.charges.max, Math.max(0, newCurrent));
        return { ...it, charges: { ...it.charges, current: clamped } };
      }) });
    };

    const singleResults = !isTwoWeaponMode
      ? activeWeapons.map((item) => ({
          item,
          result: calculateWeaponGripVariants(
            {
              name: item.name,
              isMelee: item.weaponData?.isMelee ?? true,
              isFinesse: item.weaponData?.isFinesse,
              magicBonus: item.weaponData?.magicBonus,
              baseDice: item.weaponData?.baseDice,
              damageAttribute: item.weaponData?.damageAttribute,
              extraDamage: item.weaponData?.extraDamage,
              supportsOneHanded: item.weaponData?.supportsOneHanded,
              supportsTwoHanded: item.weaponData?.supportsTwoHanded,
              modifiers: item.weaponData?.modifiers,
              sneakAttackBonusAttack: item.weaponData?.sneakAttackBonusAttack,
              sneakAttackBonusDamage: item.weaponData?.sneakAttackBonusDamage,
            },
            attrs, level, classId, raceId, charModifiers, sneakAttackActive
          ),
        }))
      : [];

    const twfResult = isTwoWeaponMode
      ? calculateTwoWeaponFighting(
          { name: primaryWeapon!.name, isMelee: primaryWeapon!.weaponData?.isMelee ?? true, isFinesse: primaryWeapon!.weaponData?.isFinesse, magicBonus: primaryWeapon!.weaponData?.magicBonus, baseDice: primaryWeapon!.weaponData?.baseDice, damageAttribute: primaryWeapon!.weaponData?.damageAttribute, extraDamage: primaryWeapon!.weaponData?.extraDamage, modifiers: primaryWeapon!.weaponData?.modifiers, sneakAttackBonusAttack: primaryWeapon!.weaponData?.sneakAttackBonusAttack, sneakAttackBonusDamage: primaryWeapon!.weaponData?.sneakAttackBonusDamage },
          { name: offHandWeapon!.name, isMelee: offHandWeapon!.weaponData?.isMelee ?? true, isFinesse: offHandWeapon!.weaponData?.isFinesse, isLight: offHandWeapon!.weaponData?.isLight, magicBonus: offHandWeapon!.weaponData?.magicBonus, baseDice: offHandWeapon!.weaponData?.baseDice, damageAttribute: offHandWeapon!.weaponData?.damageAttribute, extraDamage: offHandWeapon!.weaponData?.extraDamage, modifiers: offHandWeapon!.weaponData?.modifiers },
          attrs, level, classId, raceId,
          { hasTwoWeaponFighting, hasImprovedTwoWeaponFighting, hasGreaterTwoWeaponFighting },
          charModifiers, sneakAttackActive
        )
      : null;

    const filteredInventory = character.inventory.filter((item) => activeTab === "all" || getTabForItem(item) === activeTab);

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
              <input type="number" min={1} max={20} value={level} onChange={(e) => updateSystemData("level", Number(e.target.value))}
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
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Trefferpunkte</div>
            {isEditing ? (
              <div className="flex items-center justify-center gap-1">
                <input type="number" value={hp.current} onChange={(e) => updateHp("current", Number(e.target.value))} className="w-12 bg-black border border-zinc-700 rounded-lg text-center text-sm font-bold text-white py-1" />
                <span className="text-zinc-500">/</span>
                <input type="number" value={hp.max ?? 0} onChange={(e) => updateHp("max", Number(e.target.value))} className="w-12 bg-black border border-zinc-700 rounded-lg text-center text-sm font-bold text-white py-1" />
              </div>
            ) : <div className="text-lg font-bold text-white">{hp.current} / {hp.max ?? "–"}</div>}
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Hinterhalt aktiv?</div>
            <label className="flex items-center justify-center gap-1.5 mt-1 cursor-pointer">
              <input type="checkbox" checked={sneakAttackActive} onChange={(e) => updateSystemData("sneakAttackActive", e.target.checked)} />
              <span className="text-sm font-bold text-white">{sneakDice > 0 ? `+${sneakDice}W6` : "ja/nein"}</span>
            </label>
          </div>
        </div>

        {/* Rettungswürfe */}
        <div className="grid grid-cols-3 gap-3">
          {(["fortitude", "reflex", "will"] as const).map((key) => (
            <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{key === "fortitude" ? "Zähigkeit" : key === "reflex" ? "Reflex" : "Wille"}</div>
              <div className="text-lg font-bold text-white">{formatModifier(saves[key].total)}</div>
            </div>
          ))}
        </div>

        {hasClassFeatureDisplay && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {classId === "barbarian" && <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center"><div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Wut (Runden/Tag)</div><div className="text-lg font-bold text-white">{rageRounds}</div></div>}
            {classId === "ranger" && <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center"><div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Lieblingsfeind-Bonus</div><div className="text-lg font-bold text-white">+{favoredEnemy}</div></div>}
            {classId === "cleric" && channelEnergy && <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center"><div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Energie fokussieren</div><div className="text-lg font-bold text-white">{channelEnergy.dice}W6</div><div className="text-[9px] text-zinc-500 font-mono">{channelEnergy.usesPerDay}x / Tag</div></div>}
            {classId === "bard" && <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center"><div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Bardenauftritt (Runden/Tag)</div><div className="text-lg font-bold text-white">{bardicRounds}</div></div>}
            {classId === "monk" && <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center"><div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Betäubender Schlag (x/Tag)</div><div className="text-lg font-bold text-white">{stunningFistUses}</div></div>}
          </div>
        )}

        {/* Zweiwaffenkampf-Talente + Charakter-Kampfmodifikatoren (nur Editor) */}
        {isEditing && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex flex-wrap gap-4 text-[11px] font-mono text-zinc-400">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={hasTwoWeaponFighting} onChange={(e) => updateSystemData("hasTwoWeaponFighting", e.target.checked)} />Zweiwaffenkampf (Talent)</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={hasImprovedTwoWeaponFighting} onChange={(e) => updateSystemData("hasImprovedTwoWeaponFighting", e.target.checked)} />Verbesserter Zweiwaffenkampf</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={hasGreaterTwoWeaponFighting} onChange={(e) => updateSystemData("hasGreaterTwoWeaponFighting", e.target.checked)} />Meisterlicher Zweiwaffenkampf</label>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-500 font-mono">Charakter-Kampfmodifikatoren (Talente, Rasse, Klasse, Skills – nicht an eine Waffe gebunden)</span>
              <div className="mt-1.5">
                <ModifierListEditor modifiers={charModifiers} onChange={(next) => updateSystemData("combatModifiers", next)} />
              </div>
            </div>
          </div>
        )}

        {/* Aktive Kampfwaffen - mit Grip-Varianten & Hinterhalt-Unterzeile */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-300">Aktive Kampfwaffen</div>

          {activeWeapons.length === 0 && (
            <p className="text-xs text-zinc-600 font-mono">Keine aktive Waffe markiert – im Inventar unten eine Waffe als "aktiv" setzen.</p>
          )}

          {!isTwoWeaponMode && singleResults.map(({ item, result }) => (
            <div key={item.id} className="pb-2 border-b border-zinc-800 last:border-b-0 last:pb-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{item.name}</span>
                {item.weaponData?.isFinesse && <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-400">Finesse</span>}
                {item.notes && <span title={item.notes} className="text-zinc-500 hover:text-amber-400 cursor-help"><Info size={13} /></span>}
              </div>
              {result.grips.map((grip) => (
                <div key={grip.grip} className="pl-2 border-l-2 border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase text-zinc-500 font-mono">{GRIP_LABELS[grip.grip]}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <ValueBadge label="Angriff" value={grip.attack} color="text-cyan-300" />
                    <ValueBadge label="Schaden" value={grip.damage} color="text-rose-400" />
                    {grip.extraDamageParts.map((part, i) => (
                      <ValueBadge key={i} label="Magieschaden" value={part} color="text-sky-300" />
                    ))}
                    {!!item.weaponData?.magicBonus && <ValueBadge label="Verstärkung" value={`+${item.weaponData.magicBonus}`} color="text-indigo-300" />}
                  </div>
                  {grip.sneakAttack && (
                    <div className="pl-2 border-l-2 border-emerald-900/50 flex flex-wrap gap-1.5">
                      <span className="text-[10px] uppercase text-emerald-500 font-mono w-full">Hinterhalt</span>
                      <ValueBadge label="Angriff" value={grip.sneakAttack.attack} color="text-emerald-400" />
                      <ValueBadge label="Schaden" value={grip.sneakAttack.damage} color="text-emerald-400" />
                      {grip.sneakAttack.extraDamageParts.map((part, i) => (
                        <ValueBadge key={i} label="Zusatz" value={part} color="text-emerald-300" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {isTwoWeaponMode && twfResult && (
            <>
              <p className="text-[10px] text-amber-400/80 font-mono">{twfResult.penaltyNote}</p>
              {[{ res: twfResult.primary, label: "Haupthand" }, { res: twfResult.offHand, label: "Nebenhand" }].map(({ res, label }) => (
                <div key={label} className="pb-2 border-b border-zinc-800 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white">⚔ {res.weaponName}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">{label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ValueBadge label="Angriff" value={res.formattedAttack} color="text-cyan-300" />
                    <ValueBadge label="Schaden" value={res.attacks[0].damage} color="text-rose-400" />
                    {res.attacks[0].extraDamageParts.map((part, i) => (
                      <ValueBadge key={i} label="Magieschaden" value={part} color="text-sky-300" />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Inventar mit Kategorie-Reitern */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold text-zinc-300">Inventar</span>
            {isEditing && (
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => addInventoryItem("weapon")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Waffe</button>
                <button onClick={() => addInventoryItem("armor")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Rüstung</button>
                <button onClick={() => addInventoryItem("consumable")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Trank/Verbrauch</button>
                <button onClick={() => addInventoryItem("jewelry")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Schmuck</button>
                <button onClick={() => addInventoryItem("gear")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Gegenstand</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-zinc-800 text-xs font-mono overflow-x-auto">
            {CATEGORY_TABS.map((tab) => {
              const count = tab.id === "all" ? character.inventory.length : character.inventory.filter((it) => getTabForItem(it) === tab.id).length;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-orange-500 text-black" : "text-zinc-400 hover:text-white"}`}>
                  {tab.label} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredInventory.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Gegenstände in dieser Kategorie.</p>}

          <div className="space-y-2">
            {filteredInventory.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              return (
                <div key={item.id} className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                        {isExpanded ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
                        {isEditing ? (
                          <input value={item.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateInventoryItem(item.id, { name: e.target.value })}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-mono" />
                        ) : <span className="text-sm font-bold text-white truncate">{item.name}</span>}
                        {!isExpanded && item.notes && <span title={item.notes} className="text-zinc-500 hover:text-amber-400 cursor-help shrink-0"><Info size={13} /></span>}
                      </button>
                      {isEditing && <button onClick={() => removeInventoryItem(item.id)} className="text-xs text-red-400 font-mono shrink-0">Entfernen</button>}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <ValueBadge label="Ort" value={item.location === "equipped" ? "Am Mann" : "Eingelagert"} color={item.location === "equipped" ? "text-emerald-400" : "text-amber-400"} />
                      {item.category === "weapon" && item.weaponData?.baseDice && <ValueBadge label="Schaden" value={item.weaponData.baseDice} color="text-rose-400" />}
                      {item.category === "weapon" && item.weaponData?.extraDamage && <ValueBadge label="Magieschaden" value={item.weaponData.extraDamage} color="text-sky-300" />}
                      {item.category === "weapon" && !!item.weaponData?.magicBonus && <ValueBadge label="Verstärkung" value={`+${item.weaponData.magicBonus}`} color="text-indigo-300" />}
                      {item.category === "weapon" && item.weaponData?.supportsTwoHanded && <ValueBadge label="Griff" value="1H/2H" color="text-zinc-200" />}
                      {item.category === "weapon" && item.isActiveWeapon && <ValueBadge label="Aktiv" value={item.weaponData?.weaponSlot === "offHand" ? "Nebenhand" : item.weaponData?.weaponSlot === "twoHanded" ? "beidhändig" : "Haupthand"} color="text-orange-400" />}
                      {item.category === "armor" && <ValueBadge label="Rüstung" value={`+${item.armorData?.armorBonus ?? 0}`} color="text-cyan-300" />}
                      {item.charges && <ValueBadge label="Ladungen" value={`${item.charges.current}/${item.charges.max}`} color="text-purple-300" />}
                      {item.quantity !== undefined && item.category !== "weapon" && item.category !== "armor" && <ValueBadge label="Anzahl" value={`${item.quantity}x`} color="text-zinc-200" />}
                      {item.sourceReference && <ValueBadge label="Quelle" value={item.sourceReference} color="text-amber-300" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                      {item.charges && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Ladungen verwalten</span>
                          <ChargeTracker current={item.charges.current} max={item.charges.max} onToggle={(newCurrent) => setCharge(item.id, newCurrent)} />
                        </div>
                      )}
                      {item.quantity !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Anzahl</span>
                          <button onClick={() => adjustQuantity(item.id, -1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"><Minus size={12} /></button>
                          <span className="text-sm font-mono text-white w-10 text-center">{item.quantity}</span>
                          <button onClick={() => adjustQuantity(item.id, 1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"><Plus size={12} /></button>
                        </div>
                      )}
                      {item.notes && (
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">Beschreibung</span>
                          <p className="text-xs text-zinc-300 font-mono mt-1 whitespace-pre-wrap bg-zinc-950/60 border border-zinc-800 rounded-lg p-2">{item.notes}</p>
                        </div>
                      )}

                      {isEditing && (
                        <div className="space-y-3 pt-2 border-t border-zinc-800">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                            <label className="flex items-center gap-1.5"><input type="checkbox" checked={item.location === "equipped"} onChange={(e) => updateInventoryItem(item.id, { location: e.target.checked ? "equipped" : "stored" })} />Am Körper getragen</label>
                            {item.category === "weapon" && (
                              <>
                                <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!item.isActiveWeapon} onChange={(e) => updateInventoryItem(item.id, { isActiveWeapon: e.target.checked })} />Aktive Kampfwaffe</label>
                                {item.isActiveWeapon && (
                                  <label className="flex items-center gap-1.5">
                                    <span>Hand:</span>
                                    <select value={item.weaponData?.weaponSlot || "primary"} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, weaponSlot: e.target.value as any } })} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white">
                                      <option value="primary">Haupthand</option>
                                      <option value="offHand">Nebenhand</option>
                                      <option value="twoHanded">Beidhändig</option>
                                    </select>
                                  </label>
                                )}
                              </>
                            )}
                          </div>

                          {item.category === "weapon" && (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={item.weaponData?.isMelee ?? true} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData, isMelee: e.target.checked } })} />Nahkampf</label>
                                <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.isFinesse} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, isFinesse: e.target.checked } })} />Finesse</label>
                                <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.isLight} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, isLight: e.target.checked } })} />Leicht (TWF)</label>
                              </div>
                              {/* Grip-Schalter - immer beide anzeigen, damit jede Kombination wählbar ist */}
                              <div className="flex gap-3">
                                <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={item.weaponData?.supportsOneHanded !== false} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, supportsOneHanded: e.target.checked } })} />Einhändig nutzbar</label>
                                <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.supportsTwoHanded} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, supportsTwoHanded: e.target.checked } })} />Zweihändig nutzbar</label>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div><label className="block text-[9px] text-zinc-500">Schaden (W-Formel)</label><input value={item.weaponData?.baseDice || ""} placeholder="1W6" onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, baseDice: e.target.value } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" /></div>
                                <div><label className="block text-[9px] text-zinc-500">Verstärkung (+X)</label><input type="number" value={item.weaponData?.magicBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, magicBonus: Number(e.target.value) } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" /></div>
                                <div><label className="block text-[9px] text-zinc-500">Magieschaden (z.B. +1W6 Eis)</label><input value={item.weaponData?.extraDamage || ""} placeholder="+1W6 Feuer" onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, extraDamage: e.target.value || undefined } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" /></div>
                              </div>
                              {/* Generische Kampf-Modifikatoren der Waffe - deckt Schurkenkurzschwert-artige Boni & jede andere Kombination ab */}
                              <div>
                                <span className="text-[10px] uppercase text-zinc-500 font-mono">Waffeneigene Kampf-Modifikatoren</span>
                                <div className="mt-1.5">
                                  <ModifierListEditor
                                    modifiers={item.weaponData?.modifiers || []}
                                    onChange={(next) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, modifiers: next } })}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {item.category === "armor" && (
                            <div><label className="block text-[9px] text-zinc-500">Rüstungsbonus</label><input type="number" value={item.armorData?.armorBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { armorData: { armorBonus: Number(e.target.value) } })} className="w-24 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" /></div>
                          )}

                          <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.charges} onChange={(e) => updateInventoryItem(item.id, { charges: e.target.checked ? { max: 1, current: 1, rechargeType: "rest" } : undefined })} />Hat Ladungen</label>
                          {item.charges && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                              <span>Max</span>
                              <input type="number" value={item.charges.max} onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, max: Number(e.target.value) } })} className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
                              <select value={item.charges.rechargeType} onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, rechargeType: e.target.value as any } })} className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white">
                                <option value="rest">Erneuert sich bei Rast</option>
                                <option value="manual">Muss aufgeladen werden</option>
                                <option value="none">Verbraucht sich dauerhaft</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-[9px] text-zinc-500">Kategorie</label>
                            <select value={item.category || "gear"} onChange={(e) => updateInventoryItem(item.id, { category: e.target.value })} className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono">
                              <option value="weapon">Waffe</option>
                              <option value="armor">Rüstung</option>
                              <option value="consumable">Trank / Verbrauch</option>
                              <option value="jewelry">Schmuck</option>
                              <option value="gear">Sonstiges</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                            <span>Regelwerk-Seite</span>
                            <input value={item.sourceReference || ""} placeholder="z.B. GRW S. 112" onChange={(e) => updateInventoryItem(item.id, { sourceReference: e.target.value || undefined })} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white" />
                          </div>

                          <div>
                            <label className="block text-[10px] text-zinc-400 font-mono mb-1">Beschreibung / Effekt bearbeiten</label>
                            <textarea value={item.notes || ""} onChange={(e) => updateInventoryItem(item.id, { notes: e.target.value || undefined })} placeholder="z.B. Fängt 2x/Tag ein Geschoss ab." className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono min-h-[50px]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
};
