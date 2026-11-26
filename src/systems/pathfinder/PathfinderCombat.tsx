import React, { useState } from "react";
import { Activity, Shield, Sword, Target } from "lucide-react";
import { PluginViewProps } from "../../core/SystemPlugin";
import {
  Ability,
  CombatModifier,
  CombatModifierContext,
  CombatModifierSourceType,
  GenericCharacter,
  InventoryItem,
} from "../../core/types";
import { ValueBadge } from "../../core/uiKit";
import { X, Plus } from "lucide-react";
import {
  calculateArmorClass,
  calculateBAB,
  calculateCombatManeuver,
  calculateModifier,
  calculateSavingThrows,
  formatModifier,
  getBabIteratives,
  getEquippedArmorBonus,
  getJewelryArmorBonus,
  getTalentAcBonus,
  PathfinderAttributes,
  PATHFINDER_RACES,
  sumMiscCombatBonuses,
} from "./pathfinderRules";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";
import {
  buildAttackProfile,
  buildAttackSequence,
  BuildAttackContext,
  getTwoWeaponPenalties,
} from "./pathfinderAttackProfile";
import { normalizeWeaponData } from "./pathfinderWeaponModel";
import { makeId } from "./pathfinderRules";
import { DiceOverview, DiceInputMode, DiceRowState, WeaponProfileCard } from "./PathfinderDiceOverview";
import { WeaponEditor } from "./PathfinderWeaponEditor";

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
const getCharModifiers = (c: GenericCharacter): CombatModifier[] =>
  (c.systemData.combatModifiers as CombatModifier[]) || [];

const HAND_OPTIONS = [
  { value: "primary", label: "Haupthand" },
  { value: "offHand", label: "Nebenhand" },
  { value: "twoHanded", label: "Beidhändig" },
];

export const PathfinderCombatView: React.FC<PluginViewProps> = ({ character, isEditing, onUpdate }) => {
  const [diceMode, setDiceMode] = useState<DiceInputMode>("einzeln");
  const [rowStates, setRowStates] = useState<Record<string, DiceRowState>>({});
  const [expandedWeapons, setExpandedWeapons] = useState<Record<string, boolean>>({});
  const [freeModName, setFreeModName] = useState("");
  const [freeModValue, setFreeModValue] = useState<number | "">("");
  const [freeModTarget, setFreeModTarget] = useState<
    "attackBonus" | "damageBonus" | "acBonus" | "kmbBonus" | "kmvBonus" | "fortBonus" | "refBonus" | "willBonus"
  >("attackBonus");

  const attrs = getAttrs(character);
  const level = getLevel(character);
  const classId = getClassId(character);
  const raceId = getRaceId(character);
  const cls = classId ? PATHFINDER_CLASSES[classId] : undefined;
  const race = raceId ? PATHFINDER_RACES[raceId] : undefined;
  const charModifiers = getCharModifiers(character);

  const sneakAttackActive = Boolean(character.systemData.sneakAttackActive);
  const hasTwoWeaponFighting = Boolean(character.systemData.hasTwoWeaponFighting);
  const hasImprovedTwoWeaponFighting = Boolean(character.systemData.hasImprovedTwoWeaponFighting);
  const hasGreaterTwoWeaponFighting = Boolean(character.systemData.hasGreaterTwoWeaponFighting);
  const hasDefensiveTwoWeaponFighting = Boolean(character.systemData.hasDefensiveTwoWeaponFighting);
  const hasDodge = Boolean(character.systemData.hasDodge);

  const bab = calculateBAB(level, cls?.babProgression ?? "threeFourths");
  const iteratives = getBabIteratives(bab);
  const maneuver = calculateCombatManeuver(attrs, level, classId, raceId);
  const armorBonus = getEquippedArmorBonus(character.inventory);
  const jewelryArmorBonus = getJewelryArmorBonus(character.inventory);
  const ac = calculateArmorClass(attrs, armorBonus, jewelryArmorBonus, raceId);

  const activeWeapons = character.inventory.filter(
    (i) => i.category === "weapon" && i.location === "equipped" && i.isActiveWeapon
  );
  const primaryWeapon =
    activeWeapons.find((w) => w.weaponData?.weaponSlot === "primary" || !w.weaponData?.weaponSlot) ||
    activeWeapons[0];
  const offHandWeapon = activeWeapons.find(
    (w) => w.weaponData?.weaponSlot === "offHand" && w !== primaryWeapon
  );
  const isTwoWeaponMode = !!primaryWeapon && !!offHandWeapon;
  const miscBonuses = sumMiscCombatBonuses(
    charModifiers,
    isTwoWeaponMode ? ["twoWeaponFightingOnly"] : []
  );
  const totalKmb = maneuver.kmb + miscBonuses.kmbBonus;
  const totalKmv = maneuver.kmv + miscBonuses.kmvBonus;
  const talentAcBonus = getTalentAcBonus(hasDefensiveTwoWeaponFighting, hasDodge, isTwoWeaponMode);
  const totalArmorClass = ac.armorClass + miscBonuses.acBonus + talentAcBonus;

  const hp = character.resources.hp || { current: 0, max: 0 };
  const updateSystemData = (key: string, value: unknown) =>
    onUpdate({ systemData: { ...character.systemData, [key]: value } });
  const updateHp = (field: "current" | "max", value: number) =>
    onUpdate({ resources: { ...character.resources, hp: { ...hp, [field]: value } } });

  const updateInventoryItem = (id: string, patch: Partial<InventoryItem>) =>
    onUpdate({ inventory: character.inventory.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

  // Aktive Eigenbedingungen (custom:… aus den Schadensanteilen)
  const activeConditions: string[] = (character.systemData.activeConditions as string[]) || [];

  const buildContext: BuildAttackContext = {
    attributes: attrs,
    level,
    classId,
    raceId,
    sizeMod: { attackAndAc: 0, cmbAndCmd: 0 },
    sneakAttackActive,
    twoWeaponFighting: isTwoWeaponMode,
    attackAttribute: "GE" as "ST" | "GE",
    characterModifiers: charModifiers,
    activeConditions,
    activeWeapons,
    inventory: character.inventory,
  };

  const offHandIsLight = !!offHandWeapon?.weaponData?.isLight;
  const penalties = getTwoWeaponPenalties(hasTwoWeaponFighting, offHandIsLight);

  const profiles = activeWeapons.map((item) => {
    const isOffHand = item.weaponData?.weaponSlot === "offHand" && item !== primaryWeapon;
    return buildAttackProfile(item, buildContext, {
      isOffHand,
      penalty: isTwoWeaponMode ? (isOffHand ? penalties.offHand : penalties.primary) : 0,
    });
  });

  const sequence = buildAttackSequence(profiles, iteratives.length, isTwoWeaponMode);

  const ammoItems = character.inventory.filter((i) => i.category === "ammo");

  const consumeAmmo = (item: InventoryItem, amount: number) => {
    const current = item.quantity ?? 0;
    const next = Math.max(0, current + amount);
    updateInventoryItem(item.id, { quantity: next });
  };

  const setRowState = (key: string, patch: Partial<DiceRowState>) =>
    setRowStates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { rolled: {}, critical: false, status: "" }), ...patch },
    }));

  return (
    <div className="space-y-4">
      {/* Kampfwerte oben */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">Basis-Angriffsbonus</div>
          <div className="text-base font-bold text-white">{bab}</div>
          <div className="text-[9px] text-zinc-500 font-mono">
            {iteratives.map((b) => formatModifier(b)).join(" / ")}
          </div>
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">KMB</div>
          <div className="text-base font-bold text-white">{formatModifier(totalKmb)}</div>
          {miscBonuses.kmbBonus !== 0 && (
            <div className="text-[9px] text-emerald-400 font-mono">(Basis {formatModifier(maneuver.kmb)})</div>
          )}
        </div>
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-[8px] uppercase text-zinc-500 font-mono mb-0.5">KMV</div>
          <div className="text-base font-bold text-white">{formatModifier(totalKmv)}</div>
          {miscBonuses.kmvBonus !== 0 && (
            <div className="text-[9px] text-emerald-400 font-mono">(Basis {formatModifier(maneuver.kmv)})</div>
          )}
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

      {/* TP im Kampf */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Trefferpunkte (Kampf)</span>
          <Shield size={14} className="text-zinc-500" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateHp("current", Math.max(0, hp.current - 1))}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
          >
            −
          </button>
          <span className="text-base font-mono font-bold text-white">
            {hp.current} / {hp.max ?? "–"}
          </span>
          <button
            onClick={() => updateHp("current", hp.current + 1)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
          >
            +
          </button>
        </div>
        {isEditing && (
          <div className="flex items-center gap-1">
            <label className="text-[9px] text-zinc-500 font-mono">Max</label>
            <input
              type="number"
              value={hp.max ?? 0}
              onChange={(e) => updateHp("max", Number(e.target.value))}
              className="w-14 bg-black border border-zinc-700 rounded px-1 py-0.5 text-white text-center"
            />
          </div>
        )}
      </div>

      {/* Kampf-Modi */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="text-xs font-mono font-bold text-zinc-300">Kampf-Modi</div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sneakAttackActive}
                  onChange={(e) => updateSystemData("sneakAttackActive", e.target.checked)}
                  className="accent-amber-500"
                />
                <span className="text-xs text-white">Hinterhalt aktiv</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDefensiveTwoWeaponFighting}
                  onChange={(e) => updateSystemData("hasDefensiveTwoWeaponFighting", e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-xs text-white">Verteidigung mit zwei Waffen (+1 RK)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDodge}
                  onChange={(e) => updateSystemData("hasDodge", e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-xs text-white">Ausweichen (+1 RK)</span>
              </label>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <span>{sneakAttackActive ? "🎯 Hinterhalt aktiv" : "–"}</span>
              <span>{hasDefensiveTwoWeaponFighting ? "⚔ Verteidigung mit zwei Waffen" : "–"}</span>
              <span>{hasDodge ? "🛡 Ausweichen" : "–"}</span>
            </div>
          )}
        </div>
        {isTwoWeaponMode && (
          <p className="text-[9px] text-amber-400/80 font-mono">
            Zweiwaffenkampf aktiv: Malus Haupthand {formatModifier(penalties.primary)}, Nebenhand{" "}
            {formatModifier(penalties.offHand)}
            {hasTwoWeaponFighting ? " (Talent)" : " (ohne Talent)"}
          </p>
        )}
      </div>

      {/* Waffenprofile */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Waffen</span>
          <Sword size={14} className="text-zinc-500" />
        </div>
        {profiles.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono">
            Keine aktive Waffe. Markiere im Inventar-Reiter eine Waffe als „Aktiv".
          </p>
        ) : (
          profiles.map((profile) => {
            const isOpen = expandedWeapons[profile.item.id] ?? false;
            return (
              <div key={profile.item.id} className="space-y-1">
                <WeaponProfileCard
                  profile={profile}
                  onAmmoConsume={profile.ammo ? (amount) => consumeAmmo(profile.ammo!, amount) : undefined}
                >
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() =>
                        setExpandedWeapons((p) => ({ ...p, [profile.item.id]: !isOpen }))
                      }
                      className="text-[9px] font-mono text-zinc-400 hover:text-white"
                    >
                      {isOpen ? "Werte schließen" : "Werte bearbeiten"}
                    </button>
                    {!isEditing && (
                      <span className="text-[9px] font-mono text-zinc-600">
                        (Bearbeiten-Modus aktivieren, um Werte zu ändern)
                      </span>
                    )}
                  </div>
                </WeaponProfileCard>

                {isOpen && isEditing && (
                  <div className="p-2 bg-black/30 border border-zinc-800 rounded-lg">
                    <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">Hand</span>
                      <select
                        value={profile.item.weaponData?.weaponSlot ?? "primary"}
                        onChange={(e) =>
                          updateInventoryItem(profile.item.id, {
                            weaponData: {
                              ...normalizeWeaponData(profile.item.weaponData),
                              weaponSlot: e.target.value as any,
                            },
                          })
                        }
                        className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-0.5 py-0.5"
                      >
                        {HAND_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <WeaponEditor
                      item={profile.item}
                      ammoItems={ammoItems}
                      onChange={(weaponData) =>
                        updateInventoryItem(profile.item.id, { weaponData })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Würfelübersicht */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300">Würfel-Übersicht</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRowStates({})}
              title="Alle eingegebenen Würfelwerte, Krit-Markierungen und Trefferstatus entfernen"
              className="px-2 py-0.5 bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded text-[9px] font-mono transition-colors"
            >
              Alles löschen
            </button>
            <Activity size={14} className="text-zinc-500" />
          </div>
        </div>
        <DiceOverview
          entries={sequence}
          states={rowStates}
          onChange={setRowState}
          mode={diceMode}
          onModeChange={setDiceMode}
        />
      </div>

      {/* Talente & Fähigkeiten im Kampf */}
      {character.abilities?.filter((a: Ability) => Boolean(a.showInCombat)).length > 0 && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Talente & Fähigkeiten im Kampf</span>
            <Target size={14} className="text-zinc-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {character.abilities
              .filter((a: Ability) => Boolean(a.showInCombat))
              .map((ability: Ability) => (
                <div key={ability.id || ability.name} className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white">{ability.name}</span>
                    {ability.effect && (
                      <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[200px]">
                        — {ability.effect}
                      </span>
                    )}
                  </div>
                  {ability.usage && (
                    <div className="text-[9px] text-zinc-400 font-mono">{ability.usage}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Kampf-Modifikatoren */}
      {isEditing && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-300">Kampf-Modifikatoren (Echtzeit)</span>
            <Target size={14} className="text-zinc-500" />
          </div>
          <p className="text-[9px] text-zinc-500 font-mono">
            Boni/Mali, die im Kampf aktiv sind (Haste, Vergiftung, Segen, Fluch). Wirken auf
            Angriff, Schaden, KMB, KMV und RK. Ein Schadensanteil erscheint als eigene Zeile im
            Wurfplan.
          </p>
          <ModifierListEditor
            modifiers={charModifiers}
            onChange={(next) => updateSystemData("combatModifiers", next)}
            showMiscFields
          />

          {/* Freier Statuseffekt */}
          <div className="mt-2 p-2 bg-black/30 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-zinc-300">Freier Statuseffekt</span>
              <span className="text-[8px] text-zinc-500 font-mono">Beliebiger Name + Wert + Ziel</span>
            </div>
            <div className="flex flex-wrap gap-1 items-end">
              <div className="flex-1 min-w-[110px]">
                <label className="text-[9px] text-zinc-500 font-mono block mb-0.5">Name</label>
                <input
                  type="text"
                  value={freeModName}
                  placeholder="z.B. Lied des Mutes"
                  onChange={(e) => setFreeModName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                />
              </div>
              <div className="min-w-[55px]">
                <label className="text-[9px] text-zinc-500 font-mono block mb-0.5">Wert</label>
                <input
                  type="number"
                  value={freeModValue === "" ? "" : freeModValue}
                  placeholder="+2"
                  onChange={(e) =>
                    setFreeModValue(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5 text-center"
                />
              </div>
              <div className="min-w-[80px]">
                <label className="text-[9px] text-zinc-500 font-mono block mb-0.5">Erhöht</label>
                <select
                  value={freeModTarget}
                  onChange={(e) => setFreeModTarget(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                >
                  <option value="attackBonus">Angriff</option>
                  <option value="damageBonus">Schaden</option>
                  <option value="acBonus">RK</option>
                  <option value="kmbBonus">KMB</option>
                  <option value="kmvBonus">KMV</option>
                  <option value="fortBonus">Zähigkeit</option>
                  <option value="refBonus">Reflex</option>
                  <option value="willBonus">Wille</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (!freeModName.trim() || freeModValue === "") return;
                  const val = Number(freeModValue);
                  const mod: CombatModifier = {
                    id: makeId(),
                    label: freeModName.trim(),
                    sourceType: "custom",
                    context: "always",
                    ...(freeModTarget === "attackBonus" && { attackBonus: val }),
                    ...(freeModTarget === "damageBonus" && { damageBonus: val }),
                    ...(freeModTarget === "acBonus" && { acBonus: val }),
                    ...(freeModTarget === "kmbBonus" && { kmbBonus: val }),
                    ...(freeModTarget === "kmvBonus" && { kmvBonus: val }),
                    ...(freeModTarget === "fortBonus" && { fortBonus: val }),
                    ...(freeModTarget === "refBonus" && { refBonus: val }),
                    ...(freeModTarget === "willBonus" && { willBonus: val }),
                  };
                  updateSystemData("combatModifiers", [...charModifiers, mod]);
                  setFreeModName("");
                  setFreeModValue("");
                }}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-mono rounded"
              >
                + Hinzufügen
              </button>
            </div>
            {charModifiers
              .filter((m) => m.sourceType === "custom" && m.context === "always")
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between px-2 py-1 mt-0.5 bg-zinc-950/50 border border-zinc-800/50 rounded">
                  <span className="text-[9px] text-zinc-300 font-mono">{m.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-emerald-400 font-mono">
                      {m.attackBonus ? `Angriff ${m.attackBonus > 0 ? "+" : ""}${m.attackBonus}` : ""}
                      {m.damageBonus ? `Schaden ${m.damageBonus > 0 ? "+" : ""}${m.damageBonus}` : ""}
                      {m.acBonus ? `RK ${m.acBonus > 0 ? "+" : ""}${m.acBonus}` : ""}
                    </span>
                    <button
                      onClick={() =>
                        updateSystemData(
                          "combatModifiers",
                          charModifiers.filter((x) => x.id !== m.id)
                        )
                      }
                      className="text-[9px] text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Aktive Eigenbedingungen */}
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-[9px] text-zinc-500 font-mono">Bedingungen:</span>
            {(["opportunityAttack", "area"] as const).map((cond) => (
              <label key={cond} className="flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                <input
                  type="checkbox"
                  checked={activeConditions.includes(cond)}
                  onChange={(e) =>
                    updateSystemData(
                      "activeConditions",
                      e.target.checked
                        ? [...activeConditions, cond]
                        : activeConditions.filter((c) => c !== cond)
                    )
                  }
                />
                {cond === "opportunityAttack" ? "Gelegenheitsangriff" : "Flächenangriff"}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
