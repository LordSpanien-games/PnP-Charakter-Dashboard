import React, { useState } from "react";
import { Info, Plus, Minus, ChevronDown, ChevronRight, X, Moon, BedDouble, Printer, Download, Shield, Activity, Sword, ShieldAlert, Target } from "lucide-react";
import { SystemPlugin, AttributePool, PluginViewProps } from "../../core/SystemPlugin";
import {
  GenericCharacter,
  createEmptyGenericCharacter,
  InventoryItem,
  CombatModifier,
  CombatModifierContext,
  CombatModifierSourceType,
  Ability,
} from "../../core/types";
import { rollPool, roll4d6DropLowest } from "../../core/dice";
import { applyRest } from "../../core/rest";
import { downloadCharacterAsMarkdown } from "../../core/markdownExport";
import {
  ValueBadge,
  ChargeTracker,
  SourceReferenceBadges,
  SourceReferenceEditor,
  PartyCard,
  CurrencyHistoryCard,
  ValueStepper,
} from "../../core/uiKit";
import {
  PathfinderAttributes,
  calculateModifier,
  formatModifier,
  calculateSavingThrows,
  calculateArmorClass,
  getEquippedArmorBonus,
  getJewelryArmorBonus,
  getTalentAcBonus,
  calculateCombatManeuver,
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
  calculateNaturalHealingAmount,
  sumMiscCombatBonuses,
  parseLegacyWeaponDamage,
  parseMagicBonusFromName,
  makeModifierId,
  makeId,
  PATHFINDER_RACES,
} from "./pathfinderRules";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";
import { PathfinderCharacterSheetView } from "./PathfinderCharacterSheet";

const ATTR_KEYS = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
const ATTR_LABELS: Record<string, string> = {
  ST: "Stärke (ST)", GE: "Geschicklichkeit (GE)", KO: "Konstitution (KO)",
  IN: "Intelligenz (IN)", WE: "Weisheit (WE)", CH: "Charisma (CH)",
};

const CONTEXT_LABELS: Record<CombatModifierContext, string> = {
  always: "Immer",
  oneHandedOnly: "Nur einhändig",
  twoHandedOnly: "Nur zweihändig (Griff)",
  offHandOnly: "Nur Nebenhand",
  sneakAttackOnly: "Nur Hinterhalt",
  twoWeaponFightingOnly: "Nur bei Zweiwaffenkampf",
};

const SOURCE_LABELS: Record<CombatModifierSourceType, string> = {
  weapon: "Waffe", talent: "Talent", class: "Klasse", race: "Rasse", skill: "Fertigkeit", custom: "Sonstiges",
};

const GRIP_LABELS: Record<string, string> = { oneHanded: "Einhändig", twoHanded: "Zweihändig" };
const TYPE_LABELS: Record<string, string> = {
  class: "Klassenmerkmale",
  talent: "Talente",
  race: "Rassenfähigkeiten",
  gnome: "Rassenfähigkeiten",
  item: "Ausrüstungs-Fähigkeiten",
  other: "Weitere Fähigkeiten",
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

const createBase = (name: string, subTitle: string | undefined, attrs: Record<string, number>): GenericCharacter => {
  const base = createEmptyGenericCharacter("pathfinder", name, subTitle);
  return {
    ...base,
    attributes: attrs,
    resources: { hp: { current: 1, max: 1 } },
    systemData: {
      level: 1, classId: "fighter", raceId: "human", sneakAttackActive: false,
      hasTwoWeaponFighting: false, hasImprovedTwoWeaponFighting: false, hasGreaterTwoWeaponFighting: false,
      hasDefensiveTwoWeaponFighting: false, hasDodge: false,
      combatModifiers: [] as CombatModifier[],
    },
  };
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

const parseDailyUses = (usage?: string): number | undefined => {
  if (!usage) return undefined;
  const match = usage.match(/(\d+)\s*x/i);
  return match ? parseInt(match[1], 10) : undefined;
};

const ModifierListEditor: React.FC<{
  modifiers: CombatModifier[];
  onChange: (next: CombatModifier[]) => void;
  showMiscFields?: boolean;
}> = ({ modifiers, onChange, showMiscFields }) => {
  const addModifier = () => {
    onChange([...modifiers, { id: makeId(), label: "Neuer Modifikator", sourceType: "custom", context: "always" }]);
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
              placeholder="Bezeichnung, z.B. Ausweichen"
            />
            <button onClick={() => removeModifier(mod.id)} className="text-red-400 hover:text-red-300 shrink-0"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <select value={mod.sourceType} onChange={(e) => updateModifier(mod.id, { sourceType: e.target.value as CombatModifierSourceType })}
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <select value={mod.context} onChange={(e) => updateModifier(mod.id, { context: e.target.value as CombatModifierContext })}
              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono">
              {Object.entries(CONTEXT_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
            </select>
            <input type="number" value={mod.attackBonus ?? 0} onChange={(e) => updateModifier(mod.id, { attackBonus: Number(e.target.value) })}
              placeholder="Angriff +X" title="Angriffsbonus" className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
            <input type="number" value={mod.damageBonus ?? 0} onChange={(e) => updateModifier(mod.id, { damageBonus: Number(e.target.value) })}
              placeholder="Schaden +X" title="Schadensbonus (flach)" className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
          </div>
          <input value={mod.extraDamageDice || ""} onChange={(e) => updateModifier(mod.id, { extraDamageDice: e.target.value || undefined })}
            placeholder="Zusatzschaden, z.B. +1W6 Feuer oder +5 Blutung" className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
          {showMiscFields && (
            <div className="grid grid-cols-3 gap-1.5">
              <input type="number" value={mod.kmbBonus ?? 0} onChange={(e) => updateModifier(mod.id, { kmbBonus: Number(e.target.value) })}
                placeholder="KMB +X" title="Bonus auf KMB" className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
              <input type="number" value={mod.kmvBonus ?? 0} onChange={(e) => updateModifier(mod.id, { kmvBonus: Number(e.target.value) })}
                placeholder="KMV +X" title="Bonus auf KMV" className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
              <input type="number" value={mod.acBonus ?? 0} onChange={(e) => updateModifier(mod.id, { acBonus: Number(e.target.value) })}
                placeholder="RK +X" title="Bonus auf Rüstungsklasse" className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white font-mono" />
            </div>
          )}
        </div>
      ))}
      <button onClick={addModifier} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono font-bold rounded-lg text-zinc-300">
        <Plus size={12} /> Modifikator hinzufügen
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ÜBERSICHT (kompakt, wie Papierbogen)
// ═══════════════════════════════════════════════════════════

const PathfinderOverview: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const [restMessage, setRestMessage] = useState<string | null>(null);

  const attrs = getAttrs(character);
  const level = getLevel(character);
  const classId = getClassId(character);
  const raceId = getRaceId(character);
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);
  const charModifiers = getCharModifiers(character);

  const saves = calculateSavingThrows(attrs, level, classId);
  const armorBonus = getEquippedArmorBonus(character.inventory);
  const jewelryArmorBonus = getJewelryArmorBonus(character.inventory);
  const ac = calculateArmorClass(attrs, armorBonus, jewelryArmorBonus, raceId);
  const hp = character.resources.hp || { current: 0, max: 0 };

  const activeWeapons = character.inventory.filter(
    (i) => i.category === "weapon" && i.location === "equipped" && i.isActiveWeapon
  );
  const primaryWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "primary" || !w.weaponData?.weaponSlot) || activeWeapons[0];
  const offHandWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "offHand" && w !== primaryWeapon);
  const isTwoWeaponMode = !!primaryWeapon && !!offHandWeapon;
  const miscBonuses = sumMiscCombatBonuses(charModifiers, isTwoWeaponMode ? ["twoWeaponFightingOnly"] : []);
  const hasDefensiveTwoWeaponFighting = Boolean(character.systemData.hasDefensiveTwoWeaponFighting);
  const hasDodge = Boolean(character.systemData.hasDodge);
  const talentAcBonus = getTalentAcBonus(hasDefensiveTwoWeaponFighting, hasDodge, isTwoWeaponMode);
  const totalArmorClass = ac.armorClass + miscBonuses.acBonus + talentAcBonus;

  const chaMod = calculateModifier(attrs.CH);
  const sneakDice = getSneakAttackDice(classId, level);
  const rageRounds = classId === "barbarian" ? getRageRounds(classId, calculateModifier(attrs.KO)) : 0;
  const favoredEnemy = classId === "ranger" ? getFavoredEnemyBonus(classId, level) : 0;
  const channelEnergy = classId === "cleric" ? getChannelEnergy(classId, level, chaMod) : null;
  const bardicRounds = classId === "bard" ? getBardicPerformanceRounds(classId, level) : 0;
  const stunningFistUses = classId === "monk" ? getStunningFistUses(classId, level) : 0;
  const hasClassFeatureDisplay = ["barbarian", "ranger", "cleric", "bard", "monk"].includes(classId || "");

  const abilities: Ability[] = character.abilities || [];
  const groups: Record<string, Ability[]> = {};
  abilities.forEach((a) => {
    const key = a.type || "other";
    (groups[key] = groups[key] || []).push(a);
  });
  const orderedKeys = ["class", "talent", "race", "gnome", "item", "other"].filter((k) => groups[k]?.length);
  Object.keys(groups).forEach((k) => {
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  });

  const updateAttr = (key: string, value: number) => onUpdate({ attributes: { ...character.attributes, [key]: value } });
  const updateSystemData = (key: string, value: unknown) => onUpdate({ systemData: { ...character.systemData, [key]: value } });
  const updateHp = (field: "current" | "max", value: number) => onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });
  const updateParty = (party: typeof character.party) => onUpdate({ party });

  // ── FIXED: handleNightRest ──
  const handleNightRest = () => {
    const healAmount = calculateNaturalHealingAmount(level, false);
    const { character: updated, summary } = applyRest(character);
    const newHp = Math.min(hp.max ?? hp.current, hp.current + healAmount);
    onUpdate({
      abilities: updated.abilities,
      inventory: updated.inventory,
      resources: { ...character.resources, hp: { ...hp, current: newHp } },
    });
    const parts: string[] = [`+${healAmount} TP geheilt`];
    if (summary.refreshedAbilities.length) parts.push(`${summary.refreshedAbilities.length} Fähigkeit(en) aufgefrischt`);
    if (summary.refreshedItems.length) parts.push(`${summary.refreshedItems.length} Ladung(en) aufgefüllt`);
    setRestMessage(`Nachtruhe (8h): ${parts.join(" · ")}`);
  };

  // ── FIXED: handleBedRest ──
  const handleBedRest = () => {
    const healAmount = calculateNaturalHealingAmount(level, true);
    const { character: updated, summary } = applyRest(character);
    const newHp = Math.min(hp.max ?? hp.current, hp.current + healAmount);
    onUpdate({
      abilities: updated.abilities,
      inventory: updated.inventory,
      resources: { ...character.resources, hp: { ...hp, current: newHp } },
    });
    const parts: string[] = [`+${healAmount} TP geheilt`];
    if (summary.refreshedAbilities.length) parts.push(`${summary.refreshedAbilities.length} Fähigkeit(en) aufgefrischt`);
    if (summary.refreshedItems.length) parts.push(`${summary.refreshedItems.length} Ladung(en) aufgefüllt`);
    setRestMessage(`Bettruhe (24h): ${parts.join(" · ")}`);
  };

  const currencyBalance = character.systemData.currencyBalance as number | undefined;
  const currencyUnit = (character.systemData.currencyUnit as string) || "GM";

  return (
    <div className="space-y-4">
      {/* Kopfzeile */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{character.name || "Unbenannter Charakter"}</h1>
            <p className="text-xs text-zinc-400 font-mono">
              {race?.name || "–"} · {cls?.name || "–"} · Stufe {level}
              {character.subTitle ? ` · ${character.subTitle}` : ""}
            </p>
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <select value={classId || ""} onChange={(e) => updateSystemData("classId", e.target.value)} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono">
                {Object.values(PATHFINDER_CLASSES).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={raceId || ""} onChange={(e) => updateSystemData("raceId", e.target.value)} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono">
                {Object.values(PATHFINDER_RACES).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-500 font-mono">Level</label>
            <input type="number" min={1} max={20} value={level} onChange={(e) => updateSystemData("level", Number(e.target.value))} className="w-16 bg-black border border-zinc-700 rounded px-1 py-0.5 text-xs text-white font-mono text-center" />
          </div>
        )}
      </div>

      {/* Grundwerte kompakt */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
        {ATTR_KEYS.map((key) => (
          <div key={key} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
            <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">{key}</div>
            {isEditing ? (
              <input type="number" value={attrs[key]} onChange={(e) => updateAttr(key, Number(e.target.value))} className="w-full bg-black border border-zinc-700 rounded text-center text-base font-bold text-white py-0.5" />
            ) : (
              <div className="text-base font-bold text-white">{attrs[key]}</div>
            )}
            <div className="text-[9px] text-amber-400 font-mono">{formatModifier(calculateModifier(attrs[key]))}</div>
          </div>
        ))}
      </div>

      {/* TP, RK, Rettungswürfe kompakt */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center space-y-0.5">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">Trefferpunkte</div>
          <div className="text-base font-bold text-white">{hp.current} / {hp.max ?? "–"}</div>
          {isEditing && (
            <div className="flex items-center justify-center gap-1 text-[9px] text-zinc-500 font-mono">
              <span>Max</span>
              <input type="number" value={hp.max ?? 0} onChange={(e) => updateHp("max", Number(e.target.value))} className="w-12 bg-black border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
            </div>
          )}
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">Rüstungsklasse</div>
          <div className="text-base font-bold text-white">{totalArmorClass}</div>
          <div className="grid grid-cols-2 gap-0.5 text-[9px] text-zinc-500 font-mono">
            <div>Berührung {ac.touchAc}</div>
            <div>Flat-Footed {ac.flatFootedAc}</div>
          </div>
        </div>
        {(["fortitude", "reflex", "will"] as const).map((key) => (
          <div key={key} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
            <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">{key === "fortitude" ? "Zähigkeit" : key === "reflex" ? "Reflex" : "Wille"}</div>
            <div className="text-base font-bold text-white">{formatModifier(saves[key].total)}</div>
          </div>
        ))}
      </div>

      {/* Talente & Fähigkeiten (auf Übersicht) */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Talente & Fähigkeiten</div>
        {abilities.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono">Keine Talente oder Fähigkeiten hinterlegt.</p>
        ) : (
          <div className="space-y-1">
            {orderedKeys.map((key) => (
              <div key={key}>
                <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{TYPE_LABELS[key] || key}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {groups[key].map((ability) => {
                    const max = ability.maxUses ?? parseDailyUses(ability.usage) ?? 0;
                    const current = ability.currentUses ?? max;
                    return (
                      <div key={ability.id || ability.name} className="p-1.5 bg-black/40 border border-zinc-800 rounded">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">{ability.name}</span>
                          {ability.usage && <ValueBadge label="Nutzung" value={ability.usage} color="text-purple-300" />}
                        </div>
                        {ability.effect && <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{ability.effect}</p>}
                        {max > 0 && (
                          <ChargeTracker
                            current={current}
                            max={max}
                            onToggle={(newCurrent) => {
                              const idx = abilities.findIndex((a) => a.id === ability.id);
                              if (idx >= 0) {
                                const next = [...abilities];
                                next[idx] = { ...next[idx], currentUses: newCurrent };
                                onUpdate({ abilities: next });
                              }
                            }}
                          />
                        )}
                        {isEditing && (
                          <SourceReferenceEditor value={ability.sourceReference} onChange={(v) => {
                            const idx = abilities.findIndex((a) => a.id === ability.id);
                            if (idx >= 0) {
                              const next = [...abilities];
                              next[idx] = { ...next[idx], sourceReference: v };
                              onUpdate({ abilities: next });
                            }
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fertigkeiten (ohne Scrollbar, kompakt) */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Fertigkeiten</span>
        </div>
        {character.skills.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono">Keine Fertigkeiten hinterlegt.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr>
                  <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono">Fertigkeit</th>
                  <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Wert</th>
                  <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Geübt</th>
                </tr>
              </thead>
              <tbody>
                {character.skills.map((s, idx) => (
                  <tr key={idx} className="border-b border-zinc-800">
                    <td className="border border-zinc-800 px-1 py-0.5 text-xs text-white">{s.name}</td>
                    <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">{isEditing ? (
                      <input type="number" value={s.value} onChange={(e) => {
                        const next = [...character.skills];
                        next[idx] = { ...next[idx], value: Number(e.target.value) };
                        onUpdate({ skills: next });
                      }} className="w-10 bg-black border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                    ) : s.value}</td>
                    <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-zinc-400">{ (s as any).trained ? "✓" : "" }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gruppe & Finanzen kompakt */}
      <div className="grid grid-cols-2 gap-3">
        {character.party.length > 0 && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
            <div className="text-xs font-mono font-bold text-zinc-300">Gruppe</div>
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono">Name</th>
                  <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono">Spieler</th>
                </tr>
              </thead>
              <tbody>
                {character.party.map((p, idx) => (
                  <tr key={idx} className="border-b border-zinc-800">
                    <td className="border border-zinc-800 px-1 py-0.5 text-xs text-white">{p.name}</td>
                    <td className="border border-zinc-800 px-1 py-0.5 text-xs text-zinc-400">{p.playerName || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditing && <PartyCard party={character.party} isEditing={true} onUpdate={updateParty} />}
          </div>
        )}
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="text-xs font-mono font-bold text-zinc-300">Finanzen</div>
          <div className="text-sm text-white">Guthaben: {character.systemData.currencyBalance !== undefined ? `${character.systemData.currencyBalance} ${currencyUnit}` : "–"}</div>
          {isEditing && <CurrencyHistoryCard title="Transaktionen" balanceDisplay={currencyBalance !== undefined ? currencyBalance : undefined} entries={(character.systemData.currencyHistory as any[]) || []} />}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// KAMPF-REITER (alle kampfrelevanten Werte)
// ═══════════════════════════════════════════════════════════

const PathfinderCombatView: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const attrs = getAttrs(character);
  const level = getLevel(character);
  const classId = getClassId(character);
  const raceId = getRaceId(character);
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);
  const charModifiers = getCharModifiers(character);

  const hasTwoWeaponFighting = Boolean(character.systemData.hasTwoWeaponFighting);
  const hasImprovedTwoWeaponFighting = Boolean(character.systemData.hasImprovedTwoWeaponFighting);
  const hasGreaterTwoWeaponFighting = Boolean(character.systemData.hasGreaterTwoWeaponFighting);
  const hasDefensiveTwoWeaponFighting = Boolean(character.systemData.hasDefensiveTwoWeaponFighting);
  const hasDodge = Boolean(character.systemData.hasDodge);
  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");
  const iteratives = getBabIteratives(bab);
  const maneuver = calculateCombatManeuver(attrs, level, classId, raceId);
  const activeWeapons = character.inventory.filter(
    (i) => i.category === "weapon" && i.location === "equipped" && i.isActiveWeapon
  );
  const primaryWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "primary" || !w.weaponData?.weaponSlot) || activeWeapons[0];
  const offHandWeapon = activeWeapons.find((w) => w.weaponData?.weaponSlot === "offHand" && w !== primaryWeapon);
  const isTwoWeaponMode = !!primaryWeapon && !!offHandWeapon;
  const miscBonuses = sumMiscCombatBonuses(charModifiers, isTwoWeaponMode ? ["twoWeaponFightingOnly"] : []);
  const totalKmb = maneuver.kmb + miscBonuses.kmbBonus;
  const totalKmv = maneuver.kmv + miscBonuses.kmvBonus;
  const updateSystemData = (key: string, value: unknown) => onUpdate({ systemData: { ...character.systemData, [key]: value } });
  const hp = character.resources.hp || { current: 0, max: 0 };
  const updateHp = (field: "current" | "max", value: number) => onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });
  const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) => {
    onUpdate({ inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  };

  const armorBonus = getEquippedArmorBonus(character.inventory);
  const jewelryArmorBonus = getJewelryArmorBonus(character.inventory);
  const ac = calculateArmorClass(attrs, armorBonus, jewelryArmorBonus, raceId);
  const talentAcBonus = getTalentAcBonus(hasDefensiveTwoWeaponFighting, hasDodge, isTwoWeaponMode);
  const totalArmorClass = ac.armorClass + miscBonuses.acBonus + talentAcBonus;

  const sneakDice = getSneakAttackDice(classId, level);

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

  return (
    <div className="space-y-4">
      {/* Kampfwerte oben */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">Basis-Angriffsbonus</div>
          <div className="text-base font-bold text-white">{bab}</div>
          <div className="text-[9px] text-zinc-500 font-mono">{formatIteratives(iteratives)}</div>
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">KMB</div>
          <div className="text-base font-bold text-white">{formatModifier(totalKmb)}</div>
          {miscBonuses.kmbBonus !== 0 && <div className="text-[9px] text-emerald-400 font-mono">(Basis {formatModifier(maneuver.kmb)})</div>}
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">KMV</div>
          <div className="text-base font-bold text-white">{formatModifier(totalKmv)}</div>
          {miscBonuses.kmvBonus !== 0 && <div className="text-[9px] text-emerald-400 font-mono">(Basis {formatModifier(maneuver.kmv)})</div>}
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">RK</div>
          <div className="text-base font-bold text-white">{totalArmorClass}</div>
          <div className="grid grid-cols-2 gap-0.5 text-[9px] text-zinc-500 font-mono">
            <div>Berührung {ac.touchAc}</div>
            <div>Flat-Footed {ac.flatFootedAc}</div>
          </div>
        </div>
      </div>

      {/* TP im Kampf mit +/- */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Trefferpunkte (Kampf)</span>
          <Shield size={14} className="text-zinc-500" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => updateHp("current", Math.max(0, hp.current - 1))} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"><Minus size={14} /></button>
          <span className="text-base font-mono font-bold text-white">{hp.current} / {hp.max ?? "–"}</span>
          <button onClick={() => updateHp("current", hp.current + 1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"><Plus size={14} /></button>
        </div>
        {isEditing && (
          <div className="flex items-center gap-1">
            <label className="text-[9px] text-zinc-500 font-mono">Max</label>
            <input type="number" value={hp.max ?? 0} onChange={(e) => updateHp("max", Number(e.target.value))} className="w-14 bg-black border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
          </div>
        )}
      </div>

      {/* Kampf-Modi: Einhändig/Beidhändig, Hinterhalt, Gelegenheitsangriff */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Kampf-Modi</div>
        <div className="flex flex-wrap gap-2">
          {isEditing && (
            <>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={sneakAttackActive} onChange={(e) => updateSystemData("sneakAttackActive", e.target.checked)} className="accent-amber-500" />
                <span className="text-xs text-white">{sneakDice > 0 ? `Hinterhalt aktiv (+${sneakDice}W6)` : "Hinterhalt aktiv"}</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={hasDefensiveTwoWeaponFighting} onChange={(e) => updateSystemData("hasDefensiveTwoWeaponFighting", e.target.checked)} className="accent-emerald-500" />
                <span className="text-xs text-white">Verteidigung mit zwei Waffen (+1 RK)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={hasDodge} onChange={(e) => updateSystemData("hasDodge", e.target.checked)} className="accent-emerald-500" />
                <span className="text-xs text-white">Ausweichen (+1 RK)</span>
              </label>
            </>
          )}
          {!isEditing && (
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <span>{sneakAttackActive ? "🎯 Hinterhalt aktiv" : "–"}</span>
              <span>{hasDefensiveTwoWeaponFighting ? "⚔ Verteidigung mit zwei Waffen" : "–"}</span>
              <span>{hasDodge ? "🛡 Ausweichen" : "–"}</span>
            </div>
          )}
        </div>
        <p className="text-[9px] text-zinc-500 font-mono">
          Waffenschachtel im Reiter „Gegenstände“: legen Sie fest, welche Waffe in welcher Hand (Haupthand / Nebenhand / Beidhändig) geführt wird.
        </p>
      </div>

      {/* Waffen-Angriffstabellen */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Angriffstabellen</div>
        {!isTwoWeaponMode && singleResults.map(({ item, result }) => (
          <div key={item.id} className="pb-2 border-b border-zinc-800 last:border-b-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{item.name}</span>
              {item.weaponData?.isFinesse && <span className="text-[9px] uppercase px-1 py-0.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-400">Finesse</span>}
            </div>
            {result.grips.map((grip) => (
              <div key={grip.grip} className="pl-2 border-l-2 border-zinc-800 space-y-0.5">
                <span className="text-[9px] uppercase text-zinc-500 font-mono">{GRIP_LABELS[grip.grip]}</span>
                <div className="flex flex-wrap gap-1">
                  <ValueBadge label="Angriff" value={grip.attack} color="text-cyan-300" />
                  <ValueBadge label="Schaden" value={grip.damage} color="text-rose-400" />
                  {grip.extraDamageParts.map((part, i) => (<ValueBadge key={i} label="Magie" value={part} color="text-sky-300" />))}
                  {!!item.weaponData?.magicBonus && <ValueBadge label="Verstärkung" value={`+${item.weaponData.magicBonus}`} color="text-indigo-300" />}
                </div>
                {grip.sneakAttack && (
                  <div className="pl-2 border-l-2 border-emerald-900/50 flex flex-wrap gap-1 mt-0.5">
                    <span className="text-[9px] uppercase text-emerald-500 font-mono w-full">Hinterhalt</span>
                    <ValueBadge label="Angriff" value={grip.sneakAttack.attack} color="text-emerald-400" />
                    <ValueBadge label="Schaden" value={grip.sneakAttack.damage} color="text-emerald-400" />
                    {grip.sneakAttack.extraDamageParts.map((part, i) => (<ValueBadge key={i} label="Zusatz" value={part} color="text-emerald-300" />))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {isTwoWeaponMode && twfResult && (
          <>
            <p className="text-[9px] text-amber-400/80 font-mono mb-1">{twfResult.penaltyNote}</p>
            {[
              { res: twfResult.primary, label: "Haupthand" },
              { res: twfResult.offHand, label: "Nebenhand" },
            ].map(({ res, label }) => (
              <div key={label} className="pb-2 border-b border-zinc-800 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">⚔ {res.weaponName}</span>
                  <span className="text-[9px] uppercase px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">{label}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <ValueBadge label="Angriff" value={res.formattedAttack} color="text-cyan-300" />
                  <ValueBadge label="Schaden" value={res.attacks[0].damage} color="text-rose-400" />
                  {res.attacks[0].extraDamageParts.map((part, i) => (<ValueBadge key={i} label="Magie" value={part} color="text-sky-300" />))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Würfel-Abfolge (Kampf) */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Würfel-Abfolge</span>
          <Activity size={14} className="text-zinc-500" />
        </div>
        <p className="text-[9px] text-zinc-500 font-mono">
          Eine Zeile pro Schlag. Bei Zweiwaffenkampf reihum: Haupt, Neben, Haupt, Neben…
          W20 entfällt – entscheidend ist der gewürfelte Schaden. Kritisch als eigener Wurf.
          Alle Werte stammen aus den Waffen im Inventar.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead>
              <tr>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">#</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Waffe / Hand</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Würfel (aus Waffe)</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Sneak Attack</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Angriffswert</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Kritisch</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Gewürfelt</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Status</th>
                <th className="border border-zinc-800 px-1 py-0.5 text-zinc-500 font-mono text-center">Schaden</th>
              </tr>
            </thead>
            <tbody>
              {!isTwoWeaponMode ? (
                singleResults.map(({ item, result }) => {
                  const iteratives = getBabIteratives(bab);
                  const dmgLine = result.grips[0]?.damage || "\u2013";
                  return iteratives.map((_b, idx) => {
                    const weaponName = item.name;
                    const hand = "Haupthand";
                    const magicBonus = item.weaponData?.magicBonus ?? 0;
                    const stMod = calculateModifier(attrs.ST);
                    const geMod = calculateModifier(attrs.GE);
                    const dmgAttr = item.weaponData?.damageAttribute ?? "ST";
                    const dmgMod = dmgAttr === "GE" ? geMod : stMod;
                    const weaponAttackBonus = item.weaponData?.modifiers?.reduce(
                      (sum, m) => sum + (m.context === "always" || (sneakAttackActive && m.context === "sneakAttackOnly") ? m.attackBonus ?? 0 : 0), 0
                    ) ?? 0;
                    const totalAttack = bab + dmgMod + magicBonus + weaponAttackBonus;
                    const sneakActive = sneakAttackActive;
                    const sneakDiceCount = sneakActive ? getSneakAttackDice(classId, level) : 0;
                    const weaponDamageBonus = item.weaponData?.modifiers?.reduce(
                      (sum, m) => sum + (m.context === "always" || (sneakAttackActive && m.context === "sneakAttackOnly") ? m.damageBonus ?? 0 : 0), 0
                    ) ?? 0;
                    const sneakDamageBonus = item.weaponData?.sneakAttackBonusDamage ?? 0;
                    return (
                      <tr key={idx} className="border-b border-zinc-800">
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">{idx + 1}.</td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">{weaponName} ({hand})</td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-zinc-400">
                          {dmgLine}{magicBonus > 0 ? ` +${magicBonus}` : ""}
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-emerald-400">
                          {sneakDiceCount > 0 ? `+${sneakDiceCount}W6` : "\u2013"}
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white font-bold">
                          {totalAttack >= 0 ? "+" : ""}{totalAttack}
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                          <input type="number" placeholder="0" className="w-10 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                          <input type="number" placeholder="0" className="w-10 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                          <select className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white px-0.5 py-0">
                            <option value="">–</option>
                            <option value="blutend">Blutend</option>
                            <option value="schwächen">Schwächen</option>
                            <option value="vergiftet">Vergiftet</option>
                          </select>
                        </td>
                        <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white font-bold">0</td>
                      </tr>
                    );
                  });
                })
              ) : (
                isTwoWeaponMode && twfResult && (
                  <>
                    <p className="text-[9px] text-amber-400/80 font-mono mb-1">{twfResult.penaltyNote}</p>
                    {[twfResult.primary, twfResult.offHand].flatMap((res, wIdx) => {
                      const iteratives = res.attacks;
                      const hand = wIdx === 0 ? "Haupthand" : "Nebenhand";
                      const weaponName = res.weaponName;
                      const isOffHand = wIdx === 1;
                      const weapon = isOffHand ? offHandWeapon : primaryWeapon;
                      const magicBonus = weapon?.weaponData?.magicBonus ?? 0;
                      const stMod = calculateModifier(attrs.ST);
                      const geMod = calculateModifier(attrs.GE);
                      const dmgMod = stMod;
                      const weaponAttackBonus = weapon?.weaponData?.modifiers?.reduce(
                        (sum, m) => sum + (m.context === "always" || (sneakAttackActive && m.context === "sneakAttackOnly") ? m.attackBonus ?? 0 : 0), 0
                      ) ?? 0;
                      const baseAttack = bab + dmgMod + magicBonus + weaponAttackBonus;
                      const weaponDamageBonus = weapon?.weaponData?.modifiers?.reduce(
                        (sum, m) => sum + (m.context === "always" || (sneakAttackActive && m.context === "sneakAttackOnly") ? m.damageBonus ?? 0 : 0), 0
                      ) ?? 0;
                      const sneakDamageBonus = weapon?.weaponData?.sneakAttackBonusDamage ?? 0;
                      const sneakDiceCount = sneakAttackActive ? getSneakAttackDice(classId, level) : 0;
                      return iteratives.map((att, aidx) => {
                        const globalIdx = wIdx * iteratives.length + aidx;
                        return (
                          <tr key={globalIdx} className="border-b border-zinc-800">
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">{globalIdx + 1}.</td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">{weaponName} ({hand})</td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-zinc-400">
                              {att.damage || "\u2013"}
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-emerald-400">
                              {sneakDiceCount > 0 ? `+${sneakDiceCount}W6` : "\u2013"}
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white font-bold">
                              {baseAttack >= 0 ? "+" : ""}{baseAttack}
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                              <input type="number" placeholder="0" className="w-10 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                              <input type="number" placeholder="0" className="w-10 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white">
                              <select className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white px-0.5 py-0">
                                <option value="">–</option>
                                <option value="blutend">Blutend</option>
                                <option value="schwächen">Schwächen</option>
                                <option value="vergiftet">Vergiftet</option>
                              </select>
                            </td>
                            <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white font-bold">0</td>
                          </tr>
                        );
                      });
                    })}
                    <tr className="border-t border-zinc-800">
                      <td className="border border-zinc-800 px-1 py-0.5 text-xs text-center text-white font-bold" colSpan={9}>
                        Gesamtschaden aller Schläge: <span className="text-emerald-400 font-bold">0</span>
                      </td>
                    </tr>
                  </>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kampf-Modifikatoren (Echtzeit: Zauber, Flüche, Hast, Gift etc.) */}
      {isEditing && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Kampf-Modifikatoren (Echtzeit)</span>
            <Target size={14} className="text-zinc-500" />
          </div>
          <p className="text-[9px] text-zinc-500 font-mono">
            Boni/Mali die im Kampf aktiv sind (z.B. Haste, Vergiftung, Segen, Fluch, Gelegenheitsangriff). Wirken auf Angriff, Schaden, KMB, KMV und RK.
          </p>
          <div className="mt-1">
            <ModifierListEditor modifiers={charModifiers} onChange={(next) => updateSystemData("combatModifiers", next)} showMiscFields />
          </div>
        </div>
      )}

      {/* Statuseffekte (Dropdown zur Auswahl) */}
      {isEditing && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Statuseffekt hinzufügen</span>
            <ShieldAlert size={14} className="text-zinc-500" />
          </div>
          <p className="text-[9px] text-zinc-500 font-mono">
            Wähle einen Statuseffekt aus. Der entsprechende Kampf-Modifikator wird automatisch erstellt und wirkt auf Angriff, Schaden, KMB, KMV und RK.
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value=""
              onChange={(e) => {
                const type = e.target.value as any;
                if (!type) return;
                const now = Date.now();
                let mod: CombatModifier;
                switch (type) {
                  case "haste":
                    mod = { id: `mod_${now}_1`, label: "Haste", sourceType: "custom", context: "always", attackBonus: 1, acBonus: 1 };
                    break;
                  case "langsam":
                    mod = { id: `mod_${now}_2`, label: "Langsam", sourceType: "custom", context: "always", attackBonus: -1, acBonus: -1 };
                    break;
                  case "vergiftet":
                    mod = { id: `mod_${now}_3`, label: "Vergiftet", sourceType: "custom", context: "always", damageBonus: -1, extraDamageDice: "1W6 Gift" };
                    break;
                  case "blutend":
                    mod = { id: `mod_${now}_4`, label: "Blutende Wunden", sourceType: "custom", context: "always", extraDamageDice: "1W6 Blutung" };
                    break;
                  case "segen":
                    mod = { id: `mod_${now}_5`, label: "Segen", sourceType: "custom", context: "always", attackBonus: 1 };
                    break;
                  case "fluch":
                    mod = { id: `mod_${now}_6`, label: "Fluch", sourceType: "custom", context: "always", attackBonus: -1 };
                    break;
                  case "gelegenheitsangriff":
                    mod = { id: `mod_${now}_7`, label: "Gelegenheitsangriff", sourceType: "custom", context: "always", acBonus: -2 };
                    break;
                  default:
                    return;
                }
                updateSystemData("combatModifiers", [...charModifiers, mod]);
                e.target.value = "";
              }}
              className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
            >
              <option value="">-- Statuseffekt auswählen --</option>
              <option value="haste">Haste (+1 Angriff, +1 RK)</option>
              <option value="langsam">Langsam (-1 Angriff, -1 RK)</option>
              <option value="vergiftet">Vergiftet (-1 Schaden, +1W6 Gift)</option>
              <option value="blutend">Blutende Wunden (+1W6 Blutung)</option>
              <option value="segen">Segen (+1 Angriff)</option>
              <option value="fluch">Fluch (-1 Angriff)</option>
              <option value="gelegenheitsangriff">Gelegenheitsangriff (-2 RK)</option>
            </select>
          </div>
        </div>
      )}
      {!isEditing && charModifiers.length > 0 && (
        <div className="p-3 bg-black/30 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Aktive Statuseffekte</span>
            <ShieldAlert size={14} className="text-zinc-500" />
          </div>
          {charModifiers.map((mod) => (
            <div key={mod.id} className="flex items-center gap-2 p-1 bg-black/20 rounded">
              <span className="text-[9px] text-zinc-400 font-mono">{mod.label}</span>
              <span className="text-[9px] text-amber-400 font-mono">
                {mod.attackBonus !== 0 ? `Angriff ${mod.attackBonus > 0 ? "+" : ""}${mod.attackBonus} · ` : ""}
                {mod.damageBonus !== 0 ? `Schaden ${mod.damageBonus > 0 ? "+" : ""}${mod.damageBonus} · ` : ""}
                {mod.acBonus !== 0 ? `RK ${mod.acBonus > 0 ? "+" : ""}${mod.acBonus}` : ""}
                {mod.extraDamageDice ? `Zusatz: ${mod.extraDamageDice}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// INVENTAR-REITER (eigene Ansicht)
// ═══════════════════════════════════════════════════════════

const PathfinderInventory: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<CategoryTabId>("all");

  const currencyUnit = (character.systemData.currencyUnit as string) || "GM";

  const toggleExpand = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) =>
    onUpdate({ inventory: character.inventory.map((it) => it.id === id ? { ...it, ...patch } : it) });

  const removeInventoryItem = (id: string) =>
    onUpdate({ inventory: character.inventory.filter((it) => it.id !== id) });

  const addInventoryItem = (category: CategoryTabId) => {
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

  const adjustQuantity = (id: string, delta: number) =>
    onUpdate({ inventory: character.inventory.map((it) => it.id === id ? { ...it, quantity: Math.max(0, (it.quantity ?? 0) + delta) } : it) });

  const setCharge = (id: string, newCurrent: number) =>
    onUpdate({ inventory: character.inventory.map((it) => {
      if (it.id !== id || !it.charges) return it;
      const clamped = Math.min(it.charges.max, Math.max(0, newCurrent));
      return { ...it, charges: { ...it.charges, current: clamped } };
    }) });

  const filteredInventory = character.inventory.filter((item) => activeTab === "all" || getTabForItem(item) === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-zinc-800 text-[9px] font-mono overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.id === "all" ? character.inventory.length : character.inventory.filter((it) => getTabForItem(it) === tab.id).length;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 rounded text-[9px] font-mono transition-colors ${activeTab === tab.id ? "bg-orange-500 text-black" : "text-zinc-400 hover:text-white"}`}>
                {tab.label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        {isEditing && (
          <div className="flex gap-1 flex-wrap">
            {["weapon", "armor", "consumable", "jewelry", "gear"].map((cat) => (
              <button key={cat} onClick={() => addInventoryItem(cat as CategoryTabId)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] font-mono rounded-lg text-zinc-300">
                <Plus size={10} /> {cat === "weapon" ? "Waffe" : cat === "armor" ? "Rüstung" : cat === "consumable" ? "Trank" : cat === "jewelry" ? "Schmuck" : "Gegenstand"}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredInventory.length === 0 && (
        <p className="text-xs text-zinc-600 font-mono">Keine Gegenstände in dieser Kategorie.</p>
      )}

      <div className="space-y-1">
        {filteredInventory.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          return (
            <div key={item.id} className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1 text-left flex-1 min-w-0">
                    {isExpanded ? <ChevronDown size={12} className="text-zinc-500 shrink-0" /> : <ChevronRight size={12} className="text-zinc-500 shrink-0" />}
                    {isEditing ? (
                      <input value={item.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateInventoryItem(item.id, { name: e.target.value })} className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-xs text-white font-mono" />
                    ) : <span className="text-xs font-bold text-white truncate">{item.name}</span>}
                    {!isExpanded && item.notes && <span title={item.notes} className="text-zinc-500 hover:text-amber-400 cursor-help shrink-0"><Info size={11} /></span>}
                  </button>
                  {isEditing && <button onClick={() => removeInventoryItem(item.id)} className="text-[9px] text-red-400 font-mono shrink-0">Entfernen</button>}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  <ValueBadge label="Ort" value={item.location === "equipped" ? "Am Mann" : "Eingelagert"} color={item.location === "equipped" ? "text-emerald-400" : "text-amber-400"} />
                  {item.category === "weapon" && item.weaponData?.baseDice && <ValueBadge label="Schaden" value={item.weaponData.baseDice} color="text-rose-400" />}
                  {item.category === "weapon" && item.weaponData?.extraDamage && <ValueBadge label="Magie" value={item.weaponData.extraDamage} color="text-sky-300" />}
                  {item.category === "weapon" && !!item.weaponData?.magicBonus && <ValueBadge label="+X" value={item.weaponData.magicBonus} color="text-indigo-300" />}
                  {item.category === "weapon" && item.isActiveWeapon && <ValueBadge label="Aktiv" value={item.weaponData?.weaponSlot === "offHand" ? "Nebenhand" : item.weaponData?.weaponSlot === "twoHanded" ? "Beidhändig" : "Haupthand"} color="text-orange-400" />}
                  {item.category === "armor" && <ValueBadge label="Rüstung" value={`+${item.armorData?.armorBonus ?? 0}`} color="text-cyan-300" />}
                  {item.charges && <ValueBadge label="Ladungen" value={`${item.charges.current}/${item.charges.max}`} color="text-purple-300" />}
                  {item.quantity !== undefined && item.category !== "weapon" && item.category !== "armor" && <ValueBadge label="Anzahl" value={`${item.quantity}x`} color="text-zinc-200" />}
                  <SourceReferenceBadges value={item.sourceReference} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-2 pb-2 pt-0.5 border-t border-zinc-800 space-y-1">
                  {item.charges && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">Ladungen</span>
                      <ChargeTracker current={item.charges.current} max={item.charges.max} onToggle={(newCurrent) => setCharge(item.id, newCurrent)} />
                    </div>
                  )}
                  {item.quantity !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">Anzahl</span>
                      <button onClick={() => adjustQuantity(item.id, -1)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"><Minus size={10} /></button>
                      <span className="text-xs font-mono text-white w-8 text-center">{item.quantity}</span>
                      <button onClick={() => adjustQuantity(item.id, 1)} className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"><Plus size={10} /></button>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">Beschreibung</span>
                      <p className="text-[9px] text-zinc-300 font-mono mt-0.5 whitespace-pre-wrap bg-zinc-950/60 border border-zinc-800 rounded p-1">{item.notes}</p>
                    </div>
                  )}
                  {isEditing && (
                    <div className="space-y-1 pt-1 border-t border-zinc-800">
                      <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-zinc-400">
                        <label className="flex items-center gap-1"><input type="checkbox" checked={item.location === "equipped"} onChange={(e) => updateInventoryItem(item.id, { location: e.target.checked ? "equipped" : "stored" })} /> Am Körper</label>
                        {item.category === "weapon" && (
                          <>
                            <label className="flex items-center gap-1"><input type="checkbox" checked={!!item.isActiveWeapon} onChange={(e) => updateInventoryItem(item.id, { isActiveWeapon: e.target.checked })} /> Aktiv</label>
                            {item.isActiveWeapon && (
                              <label className="flex items-center gap-1"><span className="mr-0.5">Hand:</span>
                                <select value={item.weaponData?.weaponSlot || "primary"} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, weaponSlot: e.target.value as any } })} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-0.5 py-0">
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
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                            <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={item.weaponData?.isMelee ?? true} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData, isMelee: e.target.checked } })} /> Nahkampf</label>
                            <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.isFinesse} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, isFinesse: e.target.checked } })} /> Finesse</label>
                            <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.isLight} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, isLight: e.target.checked } })} /> Leicht</label>
                          </div>
                          <div className="flex gap-1">
                            <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={item.weaponData?.supportsOneHanded !== false} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, supportsOneHanded: e.target.checked } })} /> 1H</label>
                            <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.weaponData?.supportsTwoHanded} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, supportsTwoHanded: e.target.checked } })} /> 2H</label>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                            <div><label className="block text-[9px] text-zinc-500">Schaden</label><input value={item.weaponData?.baseDice || ""} placeholder="1W6" onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, baseDice: e.target.value } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[9px] text-white font-mono" /></div>
                            <div><label className="block text-[9px] text-zinc-500">+X</label><input type="number" value={item.weaponData?.magicBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, magicBonus: Number(e.target.value) } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[9px] text-white font-mono" /></div>
                            <div><label className="block text-[9px] text-zinc-500">Magieschaden</label><input value={item.weaponData?.extraDamage || ""} placeholder="+1W6" onChange={(e) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, extraDamage: e.target.value || undefined } })} className="w-full bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[9px] text-white font-mono" /></div>
                          </div>
                          <div><span className="text-[9px] uppercase text-zinc-500 font-mono">Waffen-Modifikatoren</span><div className="mt-0.5"><ModifierListEditor modifiers={item.weaponData?.modifiers || []} onChange={(next) => updateInventoryItem(item.id, { weaponData: { ...item.weaponData!, modifiers: next } })} /></div></div>
                        </>
                      )}
                      {item.category === "armor" && (
                        <div><label className="block text-[9px] text-zinc-500">Rüstungsbonus</label><input type="number" value={item.armorData?.armorBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { armorData: { armorBonus: Number(e.target.value) } })} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0.5 text-[9px] text-white font-mono" /></div>
                      )}
                      {item.category === "jewelry" && (
                        <>
                          <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-zinc-400 mb-0.5">
                            <label className="flex items-center gap-1"><span>Bonus:</span>
                              <select value="" onChange={(e) => {
                                const type = e.target.value as any;
                                if (!type) return;
                                updateInventoryItem(item.id, { jewelryBonus: [ ...(item.jewelryBonus || []), { id: makeId(), type, value: 0, label: "Neu" } ] });
                              }} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-400 px-0.5 py-0">
                                <option value="">-- hinzufügen --</option>
                                <option value="armor">Rüstung</option><option value="attack">Angriff</option><option value="damage">Schaden</option><option value="save">Rettungswurf</option><option value="ac">RK</option><option value="kmb">KMB</option><option value="kmv">KMV</option><option value="custom">Custom</option>
                              </select>
                            </label>
                          </div>
                          {item.jewelryBonus?.map((bonus, idx) => (
                            <div key={bonus.id} className="flex items-center gap-1 mt-0.5">
                              <select value={bonus.type} onChange={(e) => updateInventoryItem(item.id, { jewelryBonus: item.jewelryBonus!.map((b, i) => i === idx ? { ...b, type: e.target.value as any } : b) })} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-400 px-0.5 py-0">
                                <option value="armor">Rüstung</option><option value="attack">Angriff</option><option value="damage">Schaden</option><option value="save">Rettungswurf</option><option value="ac">RK</option><option value="kmb">KMB</option><option value="kmv">KMV</option><option value="custom">Custom</option>
                              </select>
                              <input type="number" value={bonus.value} onChange={(e) => updateInventoryItem(item.id, { jewelryBonus: item.jewelryBonus!.map((b, i) => i === idx ? { ...b, value: Number(e.target.value) } : b) })} className="w-12 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-[9px] text-white font-mono" />
                              <button onClick={() => updateInventoryItem(item.id, { jewelryBonus: item.jewelryBonus!.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-300 text-[9px]">×</button>
                            </div>
                          ))}
                        </>
                      )}
                      <label className="flex items-center gap-1 text-[9px] font-mono text-zinc-400"><input type="checkbox" checked={!!item.charges} onChange={(e) => updateInventoryItem(item.id, { charges: e.target.checked ? { max: 1, current: 1, rechargeType: "rest" } : undefined })} /> Ladungen</label>
                      {item.charges && (
                        <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                          <span>Max</span>
                          <input type="number" value={item.charges.max} onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, max: Number(e.target.value) } })} className="w-10 bg-zinc-900 border border-zinc-700 rounded px-0.5 py-0 text-white text-center" />
                          <select value={item.charges.rechargeType} onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, rechargeType: e.target.value as any } })} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white">
                            <option value="rest">Rast</option><option value="manual">Manuell</option><option value="none">Dauerhaft</option>
                          </select>
                        </div>
                      )}
                      <div><label className="block text-[9px] text-zinc-500">Kategorie</label><select value={item.category || "gear"} onChange={(e) => updateInventoryItem(item.id, { category: e.target.value })} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-0.5 py-0">
                        <option value="weapon">Waffe</option><option value="armor">Rüstung</option><option value="consumable">Trank</option><option value="jewelry">Schmuck</option><option value="gear">Sonstiges</option>
                      </select></div>
                      <div><span className="text-[9px] uppercase text-zinc-500 font-mono">Referenz</span><div className="mt-0.5"><SourceReferenceEditor value={item.sourceReference} onChange={(v) => updateInventoryItem(item.id, { sourceReference: v })} /></div></div>
                      <div><label className="block text-[9px] text-zinc-400 font-mono mb-0.5">Notizen</label><textarea value={item.notes || ""} onChange={(e) => updateInventoryItem(item.id, { notes: e.target.value || undefined })} placeholder="Notizen" className="w-full bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[9px] text-white font-mono min-h-[40px]" /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <CurrencyHistoryCard title="Vermögen" balanceDisplay={character.systemData.currencyBalance !== undefined ? `${character.systemData.currencyBalance} ${currencyUnit}` : undefined} entries={(character.systemData.currencyHistory as any[]) || []} />
        <PartyCard party={character.party} isEditing={isEditing} onUpdate={onUpdate as any} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TALENTE & FÄHIGKEITEN-REITER
// ═══════════════════════════════════════════════════════════

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
        sourceReference: w.page ? { page: w.page } : undefined,
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
          sourceReference: it.page ? { page: it.page } : undefined,
          location: it.status === "stored" ? "stored" : "equipped",
          charges: it.maxUses
            ? { max: it.maxUses, current: it.currentUses ?? it.maxUses, rechargeType: "rest" }
            : undefined,
        }))),
    ];
    char.skills = (raw.skills || []).map((s: any) => ({ name: s.name, value: s.value, notes: s.note, trained: s.trained, checked: s.checked }));
    char.abilities = raw.abilities || [];
    char.party = raw.party || [];
    if (raw.currency) {
      const hist = Array.isArray(raw.currency.history) ? raw.currency.history : [];
      char.systemData.currencyHistory = hist.map((h: any) => ({
        id: h.id || makeId(),
        description: h.description || h.type || "Transaktion",
        amount: Number(h.amount) || 0,
        balanceAfter: h.balanceAfter,
        detail: h.coinDetails,
      }));
      char.systemData.currencyBalance = raw.currency.amount ?? hist[0]?.balanceAfter;
      char.systemData.currencyUnit = "GM";
    }
    return char;
  },
  recalculate: (character) => character,
  DashboardComponent: PathfinderOverview,
  secondaryViews: [
    { id: "combat", label: "Kampf", Component: PathfinderCombatView },
    { id: "inventory", label: "Inventar", Component: PathfinderInventory },
    { id: "sheet", label: "Charakterbogen", Component: PathfinderCharacterSheetView },
  ],
};
