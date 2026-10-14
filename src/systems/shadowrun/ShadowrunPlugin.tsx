import React, { useState } from "react";
import { Info, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react";
import { SystemPlugin, AttributePool, PluginViewProps } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter, InventoryItem } from "../../core/types";
import { ValueBadge, ChargeTracker } from "../../core/uiKit";
import {
  ShadowrunAttributes,
  ATTR_KEYS,
  ATTR_LABELS,
  ATTR_LEGACY_ALIASES,
  calculateLimits,
  calculateInitiative,
  calculateConditionMonitors,
  calculateEssence,
  calculateWeaponPool,
  makeId,
  ShadowrunCyberdeck,
  MATRIX_ATTR_LABELS,
  MODE_LABELS,
  calculateEffectiveMatrixAttributes,
  calculateExtraProgramSlots,
} from "./shadowrunRules";

const METATYPES = ["Mensch", "Elf", "Zwerg", "Ork", "Troll"];

const getAttrs = (character: GenericCharacter): ShadowrunAttributes => ({
  KON: Number(character.attributes.KON) || 1,
  GES: Number(character.attributes.GES) || 1,
  REA: Number(character.attributes.REA) || 1,
  STR: Number(character.attributes.STR) || 1,
  CHA: Number(character.attributes.CHA) || 1,
  INT: Number(character.attributes.INT) || 1,
  LOG: Number(character.attributes.LOG) || 1,
  WIL: Number(character.attributes.WIL) || 1,
  EDG: Number(character.attributes.EDG) || 1,
});

const createBase = (name: string, subTitle: string | undefined, attrs: Record<string, number>): GenericCharacter => {
  const base = createEmptyGenericCharacter("shadowrun", name, subTitle);
  const condMon = calculateConditionMonitors({
    KON: attrs.KON, GES: attrs.GES, REA: attrs.REA, STR: attrs.STR,
    CHA: attrs.CHA, INT: attrs.INT, LOG: attrs.LOG, WIL: attrs.WIL, EDG: attrs.EDG,
  });
  return {
    ...base,
    attributes: attrs,
    resources: {
      // current = bereits erlittener Schaden (0 bei neuem Charakter), nicht "verbleibend"
      physical: { current: 0, max: condMon.physical },
      stun: { current: 0, max: condMon.stun },
    },
    systemData: { metatype: "Mensch", initiativeDice: 1 },
  };
};

type CategoryTabId = "all" | "weapon" | "armor" | "cyberware" | "consumable" | "electronics" | "gear";
const CATEGORY_TABS: { id: CategoryTabId; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "weapon", label: "Waffen" },
  { id: "armor", label: "Rüstung" },
  { id: "cyberware", label: "Cyberware/Bioware" },
  { id: "consumable", label: "Drogen & Verbrauch" },
  { id: "electronics", label: "Elektronik" },
  { id: "gear", label: "Sonstiges" },
];
const getTabForItem = (item: InventoryItem): CategoryTabId => {
  const cat = (item.category || "gear").toLowerCase();
  if (cat === "weapon") return "weapon";
  if (cat === "armor") return "armor";
  if (cat === "cyberware" || cat === "bioware") return "cyberware";
  if (cat === "consumable" || cat === "drug" || cat === "ammo") return "consumable";
  if (cat === "electronics" || cat === "matrix") return "electronics";
  return "gear";
};

// ═══════════════════════════════════════════════════════════
// HAUPTSEITE
// ═══════════════════════════════════════════════════════════

const ShadowrunOverview: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
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
  const essence = calculateEssence(character.inventory);
  const limits = calculateLimits(attrs, essence);
  const init = calculateInitiative(attrs, Number(character.systemData.initiativeDice) || 1);

  const physical = character.resources.physical || { current: 0, max: 0 };
  const stun = character.resources.stun || { current: 0, max: 0 };

  const metatype = (character.systemData.metatype as string) || "Mensch";
  const cyberdeck = character.systemData.cyberdeck as ShadowrunCyberdeck | undefined;
  const effectiveAttrs = cyberdeck ? calculateEffectiveMatrixAttributes(cyberdeck) : null;

  const activeWeapons = character.inventory.filter((i) => i.category === "weapon" && i.location === "equipped");
  const armorItem = character.inventory.find((i) => i.category === "armor" && i.location === "equipped");

  const updateAttr = (key: string, value: number) => onUpdate({ attributes: { ...character.attributes, [key]: value } });
  const updateSystemData = (key: string, value: unknown) => onUpdate({ systemData: { ...character.systemData, [key]: value } });
  const updateResource = (key: "physical" | "stun", field: "current" | "max", value: number) =>
    onUpdate({ resources: { ...character.resources, [key]: { ...character.resources[key], [field]: value } } });

  const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) => {
    onUpdate({ inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  };
  const removeInventoryItem = (id: string) => onUpdate({ inventory: character.inventory.filter((it) => it.id !== id) });
  const addInventoryItem = (category: CategoryTabId) => {
    const base: InventoryItem = {
      id: makeId(),
      name:
        category === "weapon" ? "Neue Waffe" : category === "armor" ? "Neue Rüstung" :
        category === "cyberware" ? "Neues Cyberware-Teil" : category === "consumable" ? "Neuer Verbrauchsgegenstand" :
        category === "electronics" ? "Neue Elektronik" : "Neuer Gegenstand",
      category, quantity: 1, location: "equipped",
      srWeapon: category === "weapon" ? { skillName: "Pistolen", attackAttribute: "GES", damageCode: "6P", ap: "0", poolBonus: 0 } : undefined,
      armorData: category === "armor" ? { armorBonus: 0 } : undefined,
      essenceCost: category === "cyberware" ? 0 : undefined,
    };
    onUpdate({ inventory: [...character.inventory, base] });
    setExpandedIds((prev) => new Set(prev).add(base.id));
  };
  const adjustQuantity = (id: string, delta: number) =>
    onUpdate({ inventory: character.inventory.map((it) => it.id === id ? { ...it, quantity: Math.max(0, (it.quantity ?? 0) + delta) } : it) });
  const setCharge = (id: string, newCurrent: number) =>
    onUpdate({ inventory: character.inventory.map((it) => {
      if (it.id !== id || !it.charges) return it;
      return { ...it, charges: { ...it.charges, current: Math.min(it.charges.max, Math.max(0, newCurrent)) } };
    }) });

  const filteredInventory = character.inventory.filter((item) => activeTab === "all" || getTabForItem(item) === activeTab);

  const getWeaponSkillValue = (skillName: string) =>
    character.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())?.value ?? 0;

  return (
    <div className="space-y-6">
      {/* Metatyp */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <label className="text-[10px] text-zinc-500 uppercase font-mono">Metatyp</label>
        {isEditing ? (
          <select value={metatype} onChange={(e) => updateSystemData("metatype", e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white font-mono mt-1">
            {METATYPES.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        ) : <div className="text-sm font-bold text-white mt-1">{metatype}</div>}
      </div>

      {/* Attribute */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {ATTR_KEYS.map((key) => (
          <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{key}</div>
            {isEditing ? (
              <input type="number" value={attrs[key]} onChange={(e) => updateAttr(key, Number(e.target.value))}
                className="w-full bg-black border border-zinc-700 rounded-lg text-center text-lg font-bold text-white py-1" />
            ) : <div className="text-xl font-bold text-white">{attrs[key]}</div>}
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{ATTR_LABELS[key]}</div>
          </div>
        ))}
      </div>

      {/* Essenz, Initiative, Limits */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Essenz</div>
          <div className="text-xl font-bold text-white">{essence.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Initiative</div>
          <div className="text-lg font-bold text-white">{init.base} + {init.dice}W6</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Limit Körperlich</div>
          <div className="text-lg font-bold text-white">{limits.physical}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Limit Geistig</div>
          <div className="text-lg font-bold text-white">{limits.mental}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Limit Sozial</div>
          <div className="text-lg font-bold text-white">{limits.social}</div>
        </div>
      </div>

      {/* Zustandsmonitore - Kästchen = erlittener Schaden */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-2">Körperlicher Schaden</div>
          <ChargeTracker current={physical.current} max={physical.max ?? 0} onToggle={(v) => updateResource("physical", "current", v)} />
          {isEditing && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 font-mono">
              <span>Max</span>
              <input type="number" value={physical.max ?? 0} onChange={(e) => updateResource("physical", "max", Number(e.target.value))}
                className="w-14 bg-black border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
            </div>
          )}
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-2">Geistiger Schaden (Stun)</div>
          <ChargeTracker current={stun.current} max={stun.max ?? 0} onToggle={(v) => updateResource("stun", "current", v)} />
          {isEditing && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 font-mono">
              <span>Max</span>
              <input type="number" value={stun.max ?? 0} onChange={(e) => updateResource("stun", "max", Number(e.target.value))}
                className="w-14 bg-black border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
            </div>
          )}
        </div>
      </div>

      {/* Decker: Cyberdeck-Kompaktanzeige - nur sichtbar, wenn vorhanden */}
      {cyberdeck && effectiveAttrs && (
        <div className="p-4 bg-zinc-900 border border-cyan-900/40 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-cyan-300">Cyberdeck: {cyberdeck.name}</div>
          <div className="flex flex-wrap gap-1.5">
            <ValueBadge label="Gerätestufe" value={cyberdeck.deviceRating} />
            <ValueBadge label="Angriff" value={effectiveAttrs.attack} color="text-cyan-300" />
            <ValueBadge label="Schleicher" value={effectiveAttrs.sleaze} color="text-cyan-300" />
            <ValueBadge label="Datenverarb." value={effectiveAttrs.dataProcessing} color="text-cyan-300" />
            <ValueBadge label="Firewall" value={effectiveAttrs.firewall} color="text-cyan-300" />
            {cyberdeck.matrixCondition && (
              <ValueBadge label="Matrix-Schaden" value={`${cyberdeck.matrixCondition.damage}/${cyberdeck.matrixCondition.max}`} color="text-purple-300" />
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono italic">Programme & Details siehe Reiter "Matrix"</p>
        </div>
      )}

      {/* Fertigkeiten */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Fertigkeiten</div>
        {character.skills.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Fertigkeiten hinterlegt.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {character.skills.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono bg-black/40 px-2 py-1 rounded">
              <span className="text-zinc-300">{s.name}</span>
              <span className="text-white font-bold">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Waffen */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Waffen</div>
        {activeWeapons.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Waffe am Mann.</p>}
        {activeWeapons.map((item) => {
          const w = item.srWeapon;
          if (!w) return null;
          const skillVal = Number(getWeaponSkillValue(w.skillName));
          const attrVal = w.attackAttribute === "none" ? 0 : attrs[w.attackAttribute as keyof ShadowrunAttributes];
          const { pool } = calculateWeaponPool(skillVal, attrVal, w);
          return (
            <div key={item.id} className="flex items-center justify-between text-sm font-mono text-zinc-300">
              <span className="font-bold text-white">{item.name}</span>
              <span className="text-zinc-500">Pool {pool} · Schaden {w.damageCode} · AP {w.ap || "0"}</span>
            </div>
          );
        })}
        <p className="text-[10px] text-zinc-500 font-mono italic">Vollständige Herleitung siehe Reiter "Kampf"</p>
      </div>

      {/* Rüstung */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="text-xs font-mono font-bold text-zinc-300 mb-1">Rüstung</div>
        {armorItem ? (
          <div className="flex items-center justify-between text-sm font-mono text-zinc-300">
            <span className="font-bold text-white">{armorItem.name}</span>
            <span className="text-zinc-500">Panzerung {armorItem.armorData?.armorBonus ?? 0}</span>
          </div>
        ) : <p className="text-xs text-zinc-600 font-mono">Keine Rüstung am Mann.</p>}
      </div>

      {/* Qualitäten & Fähigkeiten */}
      {character.abilities.length > 0 && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-300">Qualitäten & besondere Fähigkeiten</div>
          {character.abilities.map((a, idx) => (
            <div key={idx} className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
              <span className="font-bold text-white">{a.name}</span>
              {a.effect && <span className="text-zinc-500">— {a.effect}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Inventar mit Kategorie-Reitern */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold text-zinc-300">Inventar</span>
          {isEditing && (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => addInventoryItem("weapon")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Waffe</button>
              <button onClick={() => addInventoryItem("armor")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Rüstung</button>
              <button onClick={() => addInventoryItem("cyberware")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Cyberware</button>
              <button onClick={() => addInventoryItem("consumable")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Verbrauch</button>
              <button onClick={() => addInventoryItem("electronics")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Elektronik</button>
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
                    {item.category === "weapon" && item.srWeapon && (
                      <>
                        <ValueBadge label="Schaden" value={item.srWeapon.damageCode} color="text-rose-400" />
                        <ValueBadge label="AP" value={item.srWeapon.ap || "0"} color="text-zinc-200" />
                      </>
                    )}
                    {item.category === "armor" && <ValueBadge label="Panzerung" value={item.armorData?.armorBonus ?? 0} color="text-cyan-300" />}
                    {(item.category === "cyberware" || item.category === "bioware") && item.essenceCost !== undefined && (
                      <ValueBadge label="Essenzkosten" value={item.essenceCost} color="text-indigo-300" />
                    )}
                    {item.charges && <ValueBadge label="Ladungen" value={`${item.charges.current}/${item.charges.max}`} color="text-purple-300" />}
                    {item.quantity !== undefined && item.category !== "weapon" && item.category !== "armor" && <ValueBadge label="Anzahl" value={`${item.quantity}x`} color="text-zinc-200" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                    {item.charges && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">Ladungen verwalten</span>
                        <ChargeTracker current={item.charges.current} max={item.charges.max} onToggle={(v) => setCharge(item.id, v)} />
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
                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                          <input type="checkbox" checked={item.location === "equipped"} onChange={(e) => updateInventoryItem(item.id, { location: e.target.checked ? "equipped" : "stored" })} />
                          Am Körper getragen
                        </label>

                        {item.category === "weapon" && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div><label className="block text-[9px] text-zinc-500">Verknüpfte Fertigkeit</label>
                              <input value={item.srWeapon?.skillName || ""} onChange={(e) => updateInventoryItem(item.id, { srWeapon: { ...item.srWeapon!, skillName: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Attribut</label>
                              <select value={item.srWeapon?.attackAttribute || "GES"} onChange={(e) => updateInventoryItem(item.id, { srWeapon: { ...item.srWeapon!, attackAttribute: e.target.value as any } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono">
                                <option value="GES">GES</option><option value="STR">STR</option><option value="LOG">LOG</option><option value="none">keins</option>
                              </select>
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Schadenscode (z.B. 8P)</label>
                              <input value={item.srWeapon?.damageCode || ""} onChange={(e) => updateInventoryItem(item.id, { srWeapon: { ...item.srWeapon!, damageCode: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Panzerbrechung (AP)</label>
                              <input value={item.srWeapon?.ap || ""} onChange={(e) => updateInventoryItem(item.id, { srWeapon: { ...item.srWeapon!, ap: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Pool-Bonus (Smartlink etc.)</label>
                              <input type="number" value={item.srWeapon?.poolBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { srWeapon: { ...item.srWeapon!, poolBonus: Number(e.target.value) } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                          </div>
                        )}

                        {item.category === "armor" && (
                          <div><label className="block text-[9px] text-zinc-500">Panzerungswert</label>
                            <input type="number" value={item.armorData?.armorBonus ?? 0} onChange={(e) => updateInventoryItem(item.id, { armorData: { armorBonus: Number(e.target.value) } })}
                              className="w-24 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                          </div>
                        )}

                        {(item.category === "cyberware" || item.category === "bioware") && (
                          <div><label className="block text-[9px] text-zinc-500">Essenzkosten</label>
                            <input type="number" step="0.1" value={item.essenceCost ?? 0} onChange={(e) => updateInventoryItem(item.id, { essenceCost: Number(e.target.value) })}
                              className="w-24 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                          </div>
                        )}

                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                          <input type="checkbox" checked={!!item.charges} onChange={(e) => updateInventoryItem(item.id, { charges: e.target.checked ? { max: 1, current: 1, rechargeType: "manual" } : undefined })} />
                          Hat Ladungen (Munition/Dosen)
                        </label>
                        {item.charges && (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                            <span>Max</span>
                            <input type="number" value={item.charges.max} onChange={(e) => updateInventoryItem(item.id, { charges: { ...item.charges!, max: Number(e.target.value) } })}
                              className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-white text-center" />
                          </div>
                        )}

                        <div>
                          <label className="block text-[9px] text-zinc-500">Kategorie</label>
                          <select value={item.category || "gear"} onChange={(e) => updateInventoryItem(item.id, { category: e.target.value })}
                            className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono">
                            <option value="weapon">Waffe</option>
                            <option value="armor">Rüstung</option>
                            <option value="cyberware">Cyberware</option>
                            <option value="bioware">Bioware</option>
                            <option value="consumable">Drogen / Verbrauch</option>
                            <option value="electronics">Elektronik</option>
                            <option value="gear">Sonstiges</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-400 font-mono mb-1">Beschreibung / Effekt bearbeiten</label>
                          <textarea value={item.notes || ""} onChange={(e) => updateInventoryItem(item.id, { notes: e.target.value || undefined })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono min-h-[50px]" />
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
};

// ═══════════════════════════════════════════════════════════
// KAMPF-REITER
// ═══════════════════════════════════════════════════════════

const ShadowrunCombatView: React.FC<PluginViewProps> = ({ character }) => {
  const attrs = getAttrs(character);
  const essence = calculateEssence(character.inventory);
  const limits = calculateLimits(attrs, essence);
  const init = calculateInitiative(attrs, Number(character.systemData.initiativeDice) || 1);

  const getWeaponSkillValue = (skillName: string) =>
    character.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())?.value ?? 0;

  const activeWeapons = character.inventory.filter((i) => i.category === "weapon" && i.location === "equipped");

  return (
    <div className="space-y-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Limits (Herleitung)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-zinc-400">
          <div>Körperlich: ceil((STR×2 + KON + REA) / 3) = <strong className="text-white">{limits.physical}</strong></div>
          <div>Geistig: ceil((LOG×2 + INT + WIL) / 3) = <strong className="text-white">{limits.mental}</strong></div>
          <div>Sozial: ceil((CHA×2 + WIL + ESS) / 3) = <strong className="text-white">{limits.social}</strong></div>
        </div>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Initiative & Verteidigung</div>
        <div className="flex flex-wrap gap-1.5">
          <ValueBadge label="Initiative" value={`${init.base} + ${init.dice}W6`} color="text-cyan-300" />
          <ValueBadge label="Verteidigungspool" value={attrs.REA + attrs.INT} color="text-emerald-400" />
        </div>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
        <div className="text-xs font-mono font-bold text-zinc-300">Waffenpool-Herleitung</div>
        {activeWeapons.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Waffe am Mann.</p>}
        {activeWeapons.map((item) => {
          const w = item.srWeapon;
          if (!w) return null;
          const skillVal = Number(getWeaponSkillValue(w.skillName));
          const attrVal = w.attackAttribute === "none" ? 0 : attrs[w.attackAttribute as keyof ShadowrunAttributes];
          const { pool, breakdown } = calculateWeaponPool(skillVal, attrVal, w);
          return (
            <div key={item.id} className="pb-2 border-b border-zinc-800 last:border-b-0 last:pb-0 space-y-1">
              <span className="text-sm font-bold text-white">{item.name}</span>
              <div className="flex flex-wrap gap-1.5">
                <ValueBadge label="Pool" value={pool} color="text-cyan-300" />
                <ValueBadge label="Schaden" value={w.damageCode} color="text-rose-400" />
                <ValueBadge label="AP" value={w.ap || "0"} color="text-zinc-200" />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">{breakdown}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MATRIX-REITER (Decker)
// ═══════════════════════════════════════════════════════════

const ShadowrunMatrixView: React.FC<PluginViewProps> = ({ character, onUpdate }) => {
  const cyberdeck = character.systemData.cyberdeck as ShadowrunCyberdeck | undefined;

  if (!cyberdeck) {
    return <p className="text-xs text-zinc-600 font-mono">Dieser Charakter besitzt kein Cyberdeck.</p>;
  }

  const effectiveAttrs = calculateEffectiveMatrixAttributes(cyberdeck);
  const extraSlots = calculateExtraProgramSlots(cyberdeck);

  const updateDeck = (patch: Partial<ShadowrunCyberdeck>) => {
    onUpdate({ systemData: { ...character.systemData, cyberdeck: { ...cyberdeck, ...patch } } });
  };
  const toggleProgram = (id: string) => {
    updateDeck({ programs: cyberdeck.programs.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)) });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">
          {cyberdeck.name} {cyberdeck.manufacturer && `(${cyberdeck.manufacturer})`}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ValueBadge label="Gerätestufe" value={cyberdeck.deviceRating} />
          {cyberdeck.mode && <ValueBadge label="Modus" value={MODE_LABELS[cyberdeck.mode] || cyberdeck.mode} color="text-amber-300" />}
          {extraSlots > 0 && <ValueBadge label="Zusatzslots" value={`+${extraSlots}`} color="text-emerald-400" />}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["attack", "sleaze", "dataProcessing", "firewall"] as const).map((key) => {
          const base = cyberdeck.configuration[key];
          const effective = effectiveAttrs[key];
          const boosted = effective !== base;
          return (
            <div key={key} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
              <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{MATRIX_ATTR_LABELS[key]}</div>
              <div className="text-xl font-bold text-white">{effective}</div>
              {boosted && <div className="text-[9px] text-emerald-400 font-mono">(Basis {base})</div>}
            </div>
          );
        })}
      </div>

      {cyberdeck.matrixCondition && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-2">Matrix-Zustandsmonitor (Kästchen = Schaden)</div>
          <ChargeTracker
            current={cyberdeck.matrixCondition.damage}
            max={cyberdeck.matrixCondition.max}
            onToggle={(newDamage) => updateDeck({ matrixCondition: { ...cyberdeck.matrixCondition!, damage: newDamage } })}
          />
        </div>
      )}

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Programme</div>
        {cyberdeck.programs.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Programme installiert.</p>}
        {cyberdeck.programs.map((p) => (
          <div key={p.id} className="p-2.5 bg-black/40 border border-zinc-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={p.isActive} onChange={() => toggleProgram(p.id)} />
                <span className="text-sm font-bold text-white">{p.name}</span>
              </label>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">
                {p.type === "hacking" ? "Hacking" : p.type === "standard" ? "Standard" : "Spezial"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">{p.description}</p>
            {p.modifiers?.notes && <p className="text-[10px] text-cyan-400 font-mono">{p.modifiers.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PLUGIN-DEFINITION
// ═══════════════════════════════════════════════════════════

export const ShadowrunPlugin: SystemPlugin = {
  id: "shadowrun",
  name: "Shadowrun 5e",
  tagline: "Cyberpunk trifft Magie in den Schatten der Megakonzerne",
  badge: "Cyberpunk W6",
  color: "border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/60",
  activeColor: "border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/50",

  attributeDefinitions: ATTR_KEYS.map((k) => ({ key: k, label: ATTR_LABELS[k] })),
  resourceDefinitions: [
    { key: "physical", label: "Körperlicher Schaden", hasMax: true },
    { key: "stun", label: "Geistiger Schaden (Stun)", hasMax: true },
  ],

  createBlankCharacter: (name, subTitle) =>
    createBase(name, subTitle, { KON: 1, GES: 1, REA: 1, STR: 1, CHA: 1, INT: 1, LOG: 1, WIL: 1, EDG: 1 }),

  rollAttributePool: (): AttributePool => ({
    values: [3, 3, 3, 3, 3, 3, 3, 3, 2],
    methodLabel: "Standard-Ausgangswerte (kein Würfeln, da Shadowrun über Prioritäten/Karma erstellt wird)",
  }),

  supportsManualAssignment: true,

  buildCharacterFromPool: (name, subTitle, pool, assignment) => {
    const attrs: Record<string, number> = {};
    ATTR_KEYS.forEach((key, idx) => {
      const poolIndex = assignment ? assignment[key] : idx;
      attrs[key] = pool[poolIndex] ?? 1;
    });
    return createBase(name, subTitle, attrs);
  },

  detectLegacy: (raw: any) => {
    if (!raw || typeof raw !== "object") return false;
    const sys = String(raw.system || "").toLowerCase();
    if (sys === "shadowrun" || sys.startsWith("shadowrun") || sys === "sr5" || sys === "sr") return true;
    if (Array.isArray(raw.stats)) {
      return raw.stats.some((s: any) => {
        const l = (s.label || "").toLowerCase();
        return l.includes("essenz") || l.includes("konstitution") || l.includes("geschicklichkeit") || l.includes("willenskraft") || l.includes("reaktion");
      });
    }
    return !!raw.cyberdeck || !!raw.bodyMods;
  },

  migrateLegacy: (raw: any) => {
    const attrs: Record<string, number> = { KON: 1, GES: 1, REA: 1, STR: 1, CHA: 1, INT: 1, LOG: 1, WIL: 1, EDG: 1 };
    const sourceList = [...(raw.characteristics || []), ...(raw.stats || [])];
    sourceList.forEach((s: any) => {
      const label = (s.label || "").toUpperCase();
      ATTR_KEYS.forEach((key) => {
        const aliases = ATTR_LEGACY_ALIASES[key] || [key];
        if (aliases.includes(label)) {
          const val = typeof s.value === "number" ? s.value : parseInt(String(s.value).replace(/[^0-9-]/g, ""), 10);
          if (!isNaN(val)) attrs[key] = val;
        }
      });
    });
    // EDG und ESS stehen in manchen Exporten in raw.stats statt in characteristics
    const edgeStat = (raw.stats || []).find((s: any) => (s.label || "").toUpperCase() === "EDGE");
    if (edgeStat) {
      const val = parseInt(String(edgeStat.value).replace(/[^0-9-]/g, ""), 10);
      if (!isNaN(val)) attrs.EDG = val;
    }

    const char = createBase(raw.name || "Unbenannt", raw.subTitle, attrs);
    char.systemData.metatype = raw.race || raw.metatype || "Mensch";

    // Normale Inventar-Items
    const normalItems: InventoryItem[] = (raw.inventory || []).map((it: any) => ({
      id: makeId(),
      name: it.name,
      category: it.category === "weapon" ? "weapon" : it.category || "gear",
      quantity: it.quantity ?? 1,
      notes: it.notes,
      location: it.status === "stored" ? "stored" : "equipped",
      srWeapon: it.category === "weapon"
        ? { skillName: it.skillName || "Pistolen", attackAttribute: "GES", damageCode: it.damage || "6P", ap: it.ap || "0", poolBonus: 0 }
        : undefined,
      armorData: it.category === "armor" ? { armorBonus: Number(it.armorValue) || 0 } : undefined,
      essenceCost: it.essenceCost,
      charges: it.maxUses ? { max: it.maxUses, current: it.currentUses ?? it.maxUses, rechargeType: "manual" } : undefined,
    }));

    // bodyMods (Cyberware/Bioware) -> werden zu Inventar-Posten mit Essenzkosten
    const bodyModItems: InventoryItem[] = (raw.bodyMods || []).map((mod: any) => {
      const chipNotes = mod.isChipjack && Array.isArray(mod.chips) && mod.chips.length > 0
        ? " Eingesteckte Chips: " + mod.chips.map((c: any) => `${c.name}${c.isActive ? " (aktiv)" : ""}`).join(", ")
        : "";
      return {
        id: makeId(),
        name: mod.name,
        category: mod.category === "bioware" ? "bioware" : "cyberware",
        quantity: 1,
        location: "equipped",
        notes: (mod.description || "") + chipNotes,
        essenceCost: Number(mod.essenceCost) || 0,
        rating: mod.rating,
      };
    });

    char.inventory = [...normalItems, ...bodyModItems];

    // Cyberdeck - Struktur stimmt bereits mit unserem Typ überein, direkt übernehmen
    if (raw.cyberdeck) {
      char.systemData.cyberdeck = raw.cyberdeck;
    }

    char.skills = (raw.skills || []).map((s: any) => ({ name: s.name, value: s.value, notes: s.note }));
    char.abilities = raw.abilities || [];

    return char;
  },

  recalculate: (character) => character,

  DashboardComponent: ShadowrunOverview,

  secondaryViews: [
    { id: "combat", label: "Kampf", Component: ShadowrunCombatView },
    { id: "matrix", label: "Matrix", Component: ShadowrunMatrixView },
  ],
};
