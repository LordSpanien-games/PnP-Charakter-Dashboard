import React, { useState } from "react";
import { Info, Plus, Minus, ChevronDown, ChevronRight, HeartPulse, Brain, BookOpen } from "lucide-react";
import { SystemPlugin, AttributePool, PluginViewProps } from "../../core/SystemPlugin";
import { GenericCharacter, createEmptyGenericCharacter, InventoryItem } from "../../core/types";
import {
  ValueBadge,
  ChargeTracker,
  ValueStepper,
  SourceReferenceBadges,
  SourceReferenceEditor,
  PartyCard,
  CurrencyHistoryCard,
  EditableEntryList,
  SimpleEntry,
} from "../../core/uiKit";
import {
  ATTR_KEYS,
  ATTR_LABELS,
  ATTR_LEGACY_ALIASES,
  CocAttributes,
  rollCocAttributePool,
  rollLuck,
  calculateThresholds,
  calculateHitPoints,
  calculateMagicPoints,
  calculateMaxSanity,
  calculateMovementRate,
  calculateDamageBonus,
  findSkillValue,
  parseCocDamage,
  formatCocDamage,
  makeId,
} from "./cthulhuRules";
import { CoCDevelopmentView } from "./CoCDevelopmentView";
const getAttrs = (character: GenericCharacter): CocAttributes => ({
  ST: Number(character.attributes.ST) || 50,
  KO: Number(character.attributes.KO) || 50,
  GR: Number(character.attributes.GR) || 50,
  GE: Number(character.attributes.GE) || 50,
  ER: Number(character.attributes.ER) || 50,
  IN: Number(character.attributes.IN) || 50,
  MA: Number(character.attributes.MA) || 50,
  BI: Number(character.attributes.BI) || 50,
});

type CategoryTabId = "all" | "weapon" | "mythos_tome" | "consumable" | "gear";
const CATEGORY_TABS: { id: CategoryTabId; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "weapon", label: "Waffen" },
  { id: "mythos_tome", label: "Mythos-Bücher" },
  { id: "consumable", label: "Verbrauch" },
  { id: "gear", label: "Sonstiges" },
];
const getTabForItem = (item: InventoryItem): CategoryTabId => {
  const cat = (item.category || "gear").toLowerCase();
  if (cat === "weapon") return "weapon";
  if (cat === "mythos_tome" || cat === "tome" || cat === "book") return "mythos_tome";
  if (cat === "consumable" || cat === "ammo") return "consumable";
  return "gear";
};

const ValueStepperBox: React.FC<{
  label: string;
  current: number;
  max?: number;
  onChange: (v: number) => void;
  isEditing: boolean;
  onMaxChange?: (v: number) => void;
}> = ({ label, current, max, onChange, isEditing, onMaxChange }) => (
  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center space-y-1.5">
    <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">{label}</div>
    <ValueStepper current={current} max={max} onChange={onChange} />
    {isEditing && onMaxChange && (
      <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono">
        <span>Max</span>
        <input
          type="number"
          value={max ?? 0}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          className="w-14 bg-black border border-zinc-700 rounded px-1 py-0.5 text-white text-center"
        />
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════
// HAUPTSEITE
// ═══════════════════════════════════════════════════════════

const CthulhuOverview: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<CategoryTabId>("all");
  const [healMessage, setHealMessage] = useState<string | null>(null);
  const [healHpAmount, setHealHpAmount] = useState(1);
  const [healSanityAmount, setHealSanityAmount] = useState(1);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const attrs = getAttrs(character);
  const hp = character.resources.hp || { current: 0, max: 0 };
  const sanity = character.resources.sanity || { current: 0, max: 0 };
  const luck = character.resources.luck || { current: 0, max: 0 };
  const mp = character.resources.mp || { current: 0, max: 0 };

  const mythosValue = findSkillValue(character.skills, "mythos");
  const dmgBonus = calculateDamageBonus(attrs.ST, attrs.GR);

  const manualMov = character.systemData.movementRate as number | undefined;
  const movementRate = manualMov ?? calculateMovementRate(attrs.ST, attrs.GE, attrs.GR);

  const activeWeapons = character.inventory.filter((i) => i.category === "weapon" && i.location === "equipped");
  const currencyBalance = character.systemData.currencyBalance as number | undefined;
  const currencyUnit = (character.systemData.currencyUnit as string) || "$";

  const updateAttr = (key: string, value: number) => onUpdate({ attributes: { ...character.attributes, [key]: value } });
  const updateSystemData = (key: string, value: unknown) => onUpdate({ systemData: { ...character.systemData, [key]: value } });
  const updateResource = (key: "hp" | "sanity" | "luck" | "mp", field: "current" | "max", value: number) =>
    onUpdate({ resources: { ...character.resources, [key]: { ...character.resources[key], [field]: value } } });
  const updateParty = (party: typeof character.party) => onUpdate({ party });

  const toggleSkillChecked = (index: number) => {
    onUpdate({
      skills: character.skills.map((s, i) => (i === index ? { ...s, checked: !(s as any).checked } : s)),
    });
  };

  const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) => {
    onUpdate({ inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  };
  const removeInventoryItem = (id: string) => onUpdate({ inventory: character.inventory.filter((it) => it.id !== id) });
  const addInventoryItem = (category: CategoryTabId) => {
    const base: InventoryItem = {
      id: makeId(),
      name:
        category === "weapon" ? "Neue Waffe" : category === "mythos_tome" ? "Neues Mythos-Buch" :
        category === "consumable" ? "Neuer Verbrauchsgegenstand" : "Neuer Gegenstand",
      category, quantity: 1, location: "equipped",
      cocWeapon: category === "weapon" ? { skillName: "Nahkampf (Kampf)", damage: "1W6+SchB", useDamageBonus: true, range: "Nahkampf" } : undefined,
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

  const handleHealHp = () => {
    const newCurrent = Math.min(hp.max ?? hp.current, hp.current + healHpAmount);
    updateResource("hp", "current", newCurrent);
    setHealMessage(`+${healHpAmount} TP geheilt`);
  };
  const handleHealSanity = () => {
    const maxSan = calculateMaxSanity(mythosValue);
    const newCurrent = Math.min(sanity.max ?? maxSan, sanity.current + healSanityAmount);
    updateResource("sanity", "current", newCurrent);
    setHealMessage(`+${healSanityAmount} Stabilität wiederhergestellt`);
  };

  const filteredInventory = character.inventory.filter((item) => activeTab === "all" || getTabForItem(item) === activeTab);

  return (
    <div className="space-y-6">
      {/* Heilung & Erholung */}
      <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-indigo-300">Heilung & Erholung</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[9px] text-zinc-500 font-mono uppercase">TP heilen</label>
            <input type="number" min={0} value={healHpAmount} onChange={(e) => setHealHpAmount(Number(e.target.value))}
              className="w-16 bg-black border border-zinc-700 rounded px-1.5 py-1 text-white text-center text-sm" />
          </div>
          <div>
            <label className="block text-[9px] text-zinc-500 font-mono uppercase">Stabilität heilen</label>
            <input type="number" min={0} value={healSanityAmount} onChange={(e) => setHealSanityAmount(Number(e.target.value))}
              className="w-16 bg-black border border-zinc-700 rounded px-1.5 py-1 text-white text-center text-sm" />
          </div>
          <button onClick={handleHealHp} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold rounded-lg text-xs">
            <HeartPulse size={14} /> TP heilen
          </button>
          <button onClick={handleHealSanity} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white font-mono font-bold rounded-lg text-xs">
            <Brain size={14} /> Stabilität heilen
          </button>
        </div>
        {healMessage && <p className="text-xs text-indigo-300 font-mono">{healMessage}</p>}
      </div>

      {/* Attribute */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
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

      {/* Ressourcen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ValueStepperBox label="Trefferpunkte" current={hp.current} max={hp.max} isEditing={isEditing}
          onChange={(v) => updateResource("hp", "current", v)} onMaxChange={(v) => updateResource("hp", "max", v)} />
        <ValueStepperBox label="Stabilität" current={sanity.current} max={sanity.max} isEditing={isEditing}
          onChange={(v) => updateResource("sanity", "current", v)} onMaxChange={(v) => updateResource("sanity", "max", v)} />
        <ValueStepperBox label="Glück" current={luck.current} max={luck.max} isEditing={isEditing}
          onChange={(v) => updateResource("luck", "current", v)} onMaxChange={(v) => updateResource("luck", "max", v)} />
        <ValueStepperBox label="Magiepunkte" current={mp.current} max={mp.max} isEditing={isEditing}
          onChange={(v) => updateResource("mp", "current", v)} onMaxChange={(v) => updateResource("mp", "max", v)} />
      </div>

      {/* Schadensbonus, Mythos, Bewegungsrate */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Schadensbonus / Bauen</div>
          <div className="text-lg font-bold text-white">{dmgBonus.damageBonus}</div>
          <div className="text-[9px] text-zinc-500 font-mono">Bauen {dmgBonus.build}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Max. Stabilität (99 - Mythos)</div>
          <div className="text-lg font-bold text-white">{calculateMaxSanity(mythosValue)}</div>
          <div className="text-[9px] text-zinc-500 font-mono">Cthulhu-Mythos: {mythosValue}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <div className="text-[9px] uppercase text-zinc-500 font-mono mb-1">Bewegungsrate (MOV)</div>
          {isEditing ? (
            <input type="number" value={movementRate} onChange={(e) => updateSystemData("movementRate", Number(e.target.value))}
              className="w-full bg-black border border-zinc-700 rounded-lg text-center text-lg font-bold text-white py-1" />
          ) : <div className="text-lg font-bold text-white">{movementRate}</div>}
        </div>
      </div>

      {/* Fertigkeiten mit Entwicklungs-Checkbox direkt in der Liste */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Fertigkeiten</span>
          <span className="text-[10px] text-zinc-500 font-mono">☑ = erfolgreich genutzt (für Entwicklungsphase)</span>
        </div>
        {character.skills.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Fertigkeiten hinterlegt.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {character.skills.map((s, idx) => {
            const val = Number(s.value) || 0;
            const th = calculateThresholds(val);
            const checked = !!(s as any).checked;
            return (
              <label key={idx} className="flex items-center gap-1.5 text-xs font-mono bg-black/40 px-2 py-1 rounded cursor-pointer">
                <input type="checkbox" checked={checked} onChange={() => toggleSkillChecked(idx)} />
                <span className="text-zinc-300 truncate flex-1">{s.name}</span>
                <span className="text-white font-bold shrink-0">{val}% <span className="text-zinc-500">({th.hard}/{th.extreme})</span></span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Waffen */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Waffen</div>
        {activeWeapons.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Waffe am Mann.</p>}
        {activeWeapons.map((item) => {
          const w = item.cocWeapon as any;
          if (!w) return null;
          const skillVal = findSkillValue(character.skills, w.skillName);
          const { baseDice, useDamageBonus } = parseCocDamage(w.damage);
          const damage = formatCocDamage(baseDice, w.useDamageBonus ?? useDamageBonus, dmgBonus.damageBonus);
          return (
            <div key={item.id} className="flex items-center justify-between text-sm font-mono text-zinc-300">
              <span className="font-bold text-white">{item.name}</span>
              <span className="text-zinc-500">{skillVal}% · Schaden {damage}</span>
            </div>
          );
        })}
        <p className="text-[10px] text-zinc-500 font-mono italic">Schwer-/Extremwerte & Details siehe Reiter "Kampf"</p>
      </div>

      {/* Vermögen */}
      <CurrencyHistoryCard
        title="Vermögen"
        balanceDisplay={currencyBalance !== undefined ? `${currencyBalance} ${currencyUnit}` : undefined}
        entries={(character.systemData.currencyHistory as any[]) || []}
      />

      {/* Inventar */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold text-zinc-300">Inventar</span>
          {isEditing && (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => addInventoryItem("weapon")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Waffe</button>
              <button onClick={() => addInventoryItem("mythos_tome")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Mythos-Buch</button>
              <button onClick={() => addInventoryItem("consumable")} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono rounded-lg text-zinc-300">+ Verbrauch</button>
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
            const w = item.cocWeapon as any;
            return (
              <div key={item.id} className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                      {isExpanded ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
                      {isEditing ? (
                        <input value={item.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateInventoryItem(item.id, { name: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white font-mono" />
                      ) : <span className="text-sm font-bold text-white truncate flex items-center gap-1">
                          {item.category === "mythos_tome" && <BookOpen size={12} className="text-purple-400" />}
                          {item.name}
                        </span>}
                      {!isExpanded && item.notes && <span title={item.notes} className="text-zinc-500 hover:text-amber-400 cursor-help shrink-0"><Info size={13} /></span>}
                    </button>
                    {isEditing && <button onClick={() => removeInventoryItem(item.id)} className="text-xs text-red-400 font-mono shrink-0">Entfernen</button>}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <ValueBadge label="Ort" value={item.location === "equipped" ? "Am Mann" : "Eingelagert"} color={item.location === "equipped" ? "text-emerald-400" : "text-amber-400"} />
                    {item.category === "weapon" && w && (
                      <>
                        <ValueBadge label="Fertigkeit" value={w.skillName} color="text-cyan-300" />
                        <ValueBadge label="Schaden" value={w.damage} color="text-rose-400" />
                      </>
                    )}
                    {item.category === "mythos_tome" && (
                      <>
                        {item.sanityLoss && <ValueBadge label="SAN-Verlust" value={String(item.sanityLoss)} color="text-red-400" />}
                        {item.mythosGain && <ValueBadge label="Mythos-Zuwachs" value={String(item.mythosGain)} color="text-purple-300" />}
                      </>
                    )}
                    {item.charges && <ValueBadge label="Ladungen" value={`${item.charges.current}/${item.charges.max}`} color="text-purple-300" />}
                    {item.quantity !== undefined && item.category !== "weapon" && <ValueBadge label="Anzahl" value={`${item.quantity}x`} color="text-zinc-200" />}
                    <SourceReferenceBadges value={item.sourceReference} />
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
                              <input value={w?.skillName || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, skillName: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Schaden (z.B. 1W6+SchB)</label>
                              <input value={w?.damage || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, damage: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                              <input type="checkbox" checked={w?.useDamageBonus ?? false} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, useDamageBonus: e.target.checked } })} />
                              Schadensbonus automatisch addieren
                            </label>
                            <div><label className="block text-[9px] text-zinc-500">Reichweite</label>
                              <input value={w?.range || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, range: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Angriffe/Runde</label>
                              <input value={w?.attacksPerRound || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, attacksPerRound: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Munition</label>
                              <input value={w?.ammo || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, ammo: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Patzerwert</label>
                              <input value={w?.malfunction || ""} onChange={(e) => updateInventoryItem(item.id, { cocWeapon: { ...w, malfunction: e.target.value } })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                          </div>
                        )}

                        {item.category === "mythos_tome" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div><label className="block text-[9px] text-zinc-500">SAN-Verlust (z.B. 1W6/1W10)</label>
                              <input value={String(item.sanityLoss || "")} onChange={(e) => updateInventoryItem(item.id, { sanityLoss: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Mythos-Zuwachs (z.B. +2 / 1W4)</label>
                              <input value={String(item.mythosGain || "")} onChange={(e) => updateInventoryItem(item.id, { mythosGain: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                            <div><label className="block text-[9px] text-zinc-500">Lesezeit</label>
                              <input value={String(item.readingTime || "")} onChange={(e) => updateInventoryItem(item.id, { readingTime: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-xs text-white font-mono" />
                            </div>
                          </div>
                        )}

                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                          <input type="checkbox" checked={!!item.charges} onChange={(e) => updateInventoryItem(item.id, { charges: e.target.checked ? { max: 1, current: 1, rechargeType: "manual" } : undefined })} />
                          Hat Ladungen
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
                            <option value="mythos_tome">Mythos-Buch</option>
                            <option value="consumable">Verbrauch</option>
                            <option value="gear">Sonstiges</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase text-zinc-500 font-mono">Regelwerk-Referenz</span>
                          <div className="mt-1">
                            <SourceReferenceEditor value={item.sourceReference} onChange={(v) => updateInventoryItem(item.id, { sourceReference: v })} />
                          </div>
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

      {/* Gruppe - ganz unten */}
      <PartyCard party={character.party} isEditing={isEditing} onUpdate={updateParty} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// KAMPF-REITER
// ═══════════════════════════════════════════════════════════

const CthulhuCombatView: React.FC<PluginViewProps> = ({ character }) => {
  const attrs = getAttrs(character);
  const dmgBonus = calculateDamageBonus(attrs.ST, attrs.GR);
  const activeWeapons = character.inventory.filter((i) => i.category === "weapon" && i.location === "equipped");

  return (
    <div className="space-y-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Kampfreihenfolge & Schadensbonus</div>
        <div className="flex flex-wrap gap-1.5">
          <ValueBadge label="Geschicklichkeit (Reihenfolge)" value={attrs.GE} color="text-cyan-300" />
          <ValueBadge label="Schadensbonus" value={dmgBonus.damageBonus} color="text-rose-400" />
          <ValueBadge label="Bauen" value={dmgBonus.build} color="text-zinc-200" />
        </div>
        <p className="text-[10px] text-zinc-500 font-mono">Höchster GE-Wert handelt zuerst, bei Gleichstand gleichzeitig.</p>
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
        <div className="text-xs font-mono font-bold text-zinc-300">Waffen-Details</div>
        {activeWeapons.length === 0 && <p className="text-xs text-zinc-600 font-mono">Keine Waffe am Mann.</p>}
        {activeWeapons.map((item) => {
          const w = item.cocWeapon as any;
          if (!w) return null;
          const skillVal = findSkillValue(character.skills, w.skillName);
          const th = calculateThresholds(skillVal);
          const { baseDice, useDamageBonus } = parseCocDamage(w.damage);
          const damage = formatCocDamage(baseDice, w.useDamageBonus ?? useDamageBonus, dmgBonus.damageBonus);
          return (
            <div key={item.id} className="pb-2 border-b border-zinc-800 last:border-b-0 last:pb-0 space-y-1.5">
              <span className="text-sm font-bold text-white">{item.name}</span>
              <div className="flex flex-wrap gap-1.5">
                <ValueBadge label="Normal" value={`${th.normal}%`} color="text-cyan-300" />
                <ValueBadge label="Schwer" value={`${th.hard}%`} color="text-amber-300" />
                <ValueBadge label="Extrem" value={`${th.extreme}%`} color="text-red-400" />
                <ValueBadge label="Schaden" value={damage} color="text-rose-400" />
                {w.range && <ValueBadge label="Reichweite" value={w.range} color="text-zinc-200" />}
                {w.attacksPerRound && <ValueBadge label="Angriffe/Runde" value={w.attacksPerRound} color="text-zinc-200" />}
                {w.ammo && <ValueBadge label="Munition" value={w.ammo} color="text-zinc-200" />}
                {w.malfunction && <ValueBadge label="Patzer" value={w.malfunction} color="text-red-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════
// HINTERGRUND-REITER
// ═══════════════════════════════════════════════════════════

const CthulhuBackgroundView: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const getEntries = (key: string): SimpleEntry[] => (character.systemData[key] as SimpleEntry[]) || [];
  const setEntries = (key: string, entries: SimpleEntry[]) =>
    onUpdate({ systemData: { ...character.systemData, [key]: entries } });

  const ideology = (character.systemData.ideology as string) || "";

  return (
    <div className="space-y-6">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Ideologie / Glaube</div>
        {isEditing ? (
          <textarea
            value={ideology}
            onChange={(e) => onUpdate({ systemData: { ...character.systemData, ideology: e.target.value || undefined } })}
            placeholder="Weltanschauung, Religion, moralische Überzeugungen..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white font-mono min-h-[60px]"
          />
        ) : (
          <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{ideology || "–"}</p>
        )}
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <EditableEntryList
          label="Wichtige Personen im Leben"
          entries={getEntries("importantPeople")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("importantPeople", e)}
          titlePlaceholder="Name der Person"
          descriptionPlaceholder="Beziehung / Bedeutung..."
        />
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <EditableEntryList
          label="Bedeutsame Orte"
          entries={getEntries("meaningfulLocations")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("meaningfulLocations", e)}
          titlePlaceholder="Ortsname"
          descriptionPlaceholder="Warum bedeutsam..."
        />
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <EditableEntryList
          label="Geschätzter Besitz"
          entries={getEntries("treasuredPossessions")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("treasuredPossessions", e)}
          titlePlaceholder="Gegenstand"
          descriptionPlaceholder="Warum wertvoll..."
        />
      </div>

      <div className="p-4 bg-zinc-900 border border-amber-900/40 rounded-xl">
        <EditableEntryList
          label="Phobien & Manien"
          entries={getEntries("phobiasManias")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("phobiasManias", e)}
          titlePlaceholder="z.B. Klaustrophobie"
          descriptionPlaceholder="Entstehung / Auswirkung..."
        />
      </div>

      <div className="p-4 bg-zinc-900 border border-red-900/40 rounded-xl">
        <EditableEntryList
          label="Verletzungen & Narben"
          entries={getEntries("injuriesScars")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("injuriesScars", e)}
          titlePlaceholder="z.B. Narbe am linken Arm"
          descriptionPlaceholder="Wie entstanden..."
        />
      </div>

      <div className="p-4 bg-zinc-900 border border-purple-900/40 rounded-xl">
        <EditableEntryList
          label="Begegnungen mit seltsamen Wesenheiten & Folianten"
          entries={getEntries("mythosEncounters")}
          isEditing={isEditing}
          onUpdate={(e) => setEntries("mythosEncounters", e)}
          titlePlaceholder="Was wurde erlebt/gelesen"
          descriptionPlaceholder="Details & Auswirkungen..."
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PLUGIN-FACTORY (für CoC 7e & CoC 1920er)
// ═══════════════════════════════════════════════════════════

interface CocVariantConfig {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  activeColor: string;
  defaultSkills: { name: string; value: number }[];
}

const COMMON_SKILLS: { name: string; value: number }[] = [
  { name: "Ausweichen", value: 20 },
  { name: "Einschüchtern", value: 15 },
  { name: "Erste Hilfe", value: 30 },
  { name: "Horchen", value: 20 },
  { name: "Cthulhu-Mythos", value: 0 },
  { name: "Nahkampf (Kampf)", value: 25 },
  { name: "Psychologie", value: 10 },
  { name: "Schusswaffen (Handfeuerwaffen)", value: 20 },
  { name: "Schätzen", value: 5 },
  { name: "Sprache (Muttersprache)", value: 50 },
  { name: "Überzeugen", value: 10 },
  { name: "Verborgenes erkennen", value: 25 },
  { name: "Wahrnehmung", value: 25 },
  { name: "Weltgewandtheit", value: 5 },
  { name: "Bibliotheksnutzung", value: 20 },
  { name: "Klettern", value: 20 },
  { name: "Schwimmen", value: 20 },
  { name: "Überlebenskunst", value: 10 },
  { name: "Geschichte", value: 5 },
  { name: "Okkultismus", value: 5 },
];

const createBase = (
  systemId: string,
  name: string,
  subTitle: string | undefined,
  attrs: Record<string, number>,
  defaultSkills: { name: string; value: number }[]
): GenericCharacter => {
  const base = createEmptyGenericCharacter(systemId, name, subTitle);
  const ko = attrs.KO ?? 50;
  const gr = attrs.GR ?? 50;
  const ma = attrs.MA ?? 50;
  const hp = calculateHitPoints(ko, gr);
  const mpVal = calculateMagicPoints(ma);
  const luckVal = rollLuck();
  return {
    ...base,
    attributes: attrs,
    resources: {
      hp: { current: hp, max: hp },
      sanity: { current: ma, max: ma },
      luck: { current: luckVal, max: luckVal },
      mp: { current: mpVal, max: mpVal },
    },
    skills: defaultSkills.map((s) => ({ name: s.name, value: s.value })),
    systemData: {},
  };
};

const buildCocPlugin = (config: CocVariantConfig): SystemPlugin => ({
  id: config.id,
  name: config.name,
  tagline: config.tagline,
  badge: config.badge,
  color: config.color,
  activeColor: config.activeColor,

  attributeDefinitions: ATTR_KEYS.map((k) => ({ key: k, label: ATTR_LABELS[k] })),
  resourceDefinitions: [
    { key: "hp", label: "Trefferpunkte (TP)", hasMax: true },
    { key: "sanity", label: "Geistige Stabilität", hasMax: true },
    { key: "luck", label: "Glück", hasMax: true },
    { key: "mp", label: "Magiepunkte (MP)", hasMax: true },
  ],

  createBlankCharacter: (name, subTitle) =>
    createBase(config.id, name, subTitle, { ST: 50, KO: 50, GR: 50, GE: 50, ER: 50, IN: 50, MA: 50, BI: 50 }, config.defaultSkills),

  rollAttributePool: (): AttributePool => ({
    values: rollCocAttributePool(),
    methodLabel: "3W6×5 (ST/KO/GE/ER/MA), (2W6+6)×5 (GR/IN/BI) - automatisch in dieser Reihenfolge zugewiesen, kein Vertauschen möglich",
  }),

  supportsManualAssignment: false,

  buildCharacterFromPool: (name, subTitle, pool) => {
    const attrs: Record<string, number> = {};
    ATTR_KEYS.forEach((key, idx) => { attrs[key] = pool[idx] ?? 50; });
    return createBase(config.id, name, subTitle, attrs, config.defaultSkills);
  },

  detectLegacy: (raw: any) => {
    if (!raw || typeof raw !== "object") return false;
    const sys = String(raw.system || "").toLowerCase();
    return sys === config.id;
  },

  migrateLegacy: (raw: any) => {
    const attrs: Record<string, number> = { ST: 50, KO: 50, GR: 50, GE: 50, ER: 50, IN: 50, MA: 50, BI: 50 };
    (raw.characteristics || []).forEach((s: any) => {
      const label = (s.label || "").toUpperCase();
      ATTR_KEYS.forEach((key) => {
        const aliases = ATTR_LEGACY_ALIASES[key] || [key];
        if (aliases.includes(label)) {
          const val = typeof s.value === "number" ? s.value : parseInt(String(s.value).replace(/[^0-9-]/g, ""), 10);
          if (!isNaN(val)) attrs[key] = val;
        }
      });
    });

    const char = createBase(config.id, raw.name || "Unbenannt", raw.subTitle, attrs, []);

    const findStat = (namePart: string) =>
      (raw.stats || []).find((s: any) => (s.label || "").toLowerCase().includes(namePart.toLowerCase()));

    const hpStat = findStat("trefferpunkte") || findStat("tp");
    if (hpStat) {
      const maxHp = parseInt(String(hpStat.value).replace(/[^0-9-]/g, ""), 10) || calculateHitPoints(attrs.KO, attrs.GR);
      const damageTaken = Number(hpStat.damage) || 0;
      char.resources.hp = { current: Math.max(0, maxHp - damageTaken), max: maxHp };
    }
    const sanStat = findStat("stabilität") || findStat("san");
    if (sanStat) {
      const maxSan = parseInt(String(sanStat.value).replace(/[^0-9-]/g, ""), 10) || attrs.MA;
      char.resources.sanity = { current: maxSan, max: maxSan };
    }
    const luckStat = findStat("glück");
    if (luckStat) {
      const luckVal = parseInt(String(luckStat.value).replace(/[^0-9-]/g, ""), 10) || 50;
      char.resources.luck = { current: luckVal, max: luckVal };
    }
    const mpStat = findStat("magiepunkte") || findStat("mp");
    if (mpStat) {
      const mpVal = parseInt(String(mpStat.value).replace(/[^0-9-]/g, ""), 10) || calculateMagicPoints(attrs.MA);
      char.resources.mp = { current: mpVal, max: mpVal };
    }

    const migrateWeapon = (w: any): InventoryItem => ({
      id: makeId(),
      name: w.name,
      category: "weapon",
      location: "equipped",
      notes: w.note || w.notes,
      sourceReference: w.page ? { page: w.page } : undefined,
      cocWeapon: {
        skillName: w.skillName || w.name,
        damage: w.damage || "1W6",
        useDamageBonus: /schb/i.test(w.damage || ""),
        range: w.range,
        attacksPerRound: w.attacks,
        malfunction: w.malfunction,
      },
    });

    char.inventory = [
      ...(raw.weapons?.melee || []).map(migrateWeapon),
      ...(raw.weapons?.ranged || []).map(migrateWeapon),
      ...((raw.inventory || []).map((it: any) => ({
        id: makeId(),
        name: it.name,
        category: it.category || "gear",
        quantity: it.quantity ?? 1,
        notes: it.notes,
        sourceReference: it.page ? { page: it.page } : undefined,
        location: it.status === "stored" ? "stored" : "equipped",
        charges: it.maxUses ? { max: it.maxUses, current: it.currentUses ?? it.maxUses, rechargeType: "manual" } : undefined,
      }))),
    ];

    char.skills = (raw.skills || []).map((s: any) => ({
      name: s.name, value: s.value, notes: s.note, checked: s.checked, trained: s.trained,
    }));
    char.abilities = raw.abilities || [];
    char.party = raw.party || [];

    // Hintergrund-Felder übernehmen, falls im alten Format vorhanden
    if (raw.background) {
      char.systemData.ideology = raw.background.ideology;
      char.systemData.importantPeople = raw.background.importantPeople || [];
      char.systemData.meaningfulLocations = raw.background.meaningfulLocations || [];
      char.systemData.treasuredPossessions = raw.background.treasuredPossessions || [];
      char.systemData.phobiasManias = raw.background.phobiasManias || [];
      char.systemData.injuriesScars = raw.background.injuriesScars || [];
      char.systemData.mythosEncounters = raw.background.mythosEncounters || raw.background.encounters || [];
    }
    if (raw.movementRate !== undefined) {
      char.systemData.movementRate = raw.movementRate;
    }

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
      char.systemData.currencyUnit = "$";
    }

    return char;
  },

  recalculate: (character) => character,

  DashboardComponent: CthulhuOverview,

  secondaryViews: [
    { id: "combat", label: "Kampf", Component: CthulhuCombatView },
  { id: "development", label: "⬆ Entwicklung", Component: CoCDevelopmentView },
    { id: "background", label: "Hintergrund", Component: CthulhuBackgroundView },
  ],
});

export const CoC7ePlugin: SystemPlugin = buildCocPlugin({
  id: "coc7e",
  name: "Call of Cthulhu 7e",
  tagline: "Kosmischer Horror & detektivische Ermittlungen",
  badge: "W100 Prozent",
  color: "border-zinc-800 hover:border-blue-500/50 bg-zinc-900/60",
  activeColor: "border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/50",
  defaultSkills: [...COMMON_SKILLS, { name: "Elektronische Geräte bedienen", value: 1 }],
});

export const CoC1920Plugin: SystemPlugin = buildCocPlugin({
  id: "coc1920",
  name: "Call of Cthulhu 1920er",
  tagline: "Das klassische Lovecraft-Zeitalter",
  badge: "1920s Ära",
  color: "border-zinc-800 hover:border-purple-500/50 bg-zinc-900/60",
  activeColor: "border-purple-500 bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/50",
  defaultSkills: [...COMMON_SKILLS, { name: "Telegraphie", value: 20 }],
});
