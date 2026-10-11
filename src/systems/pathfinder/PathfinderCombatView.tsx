import React, { FC, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sword,
  Swords,
  Shield,
  Crosshair,
  Zap,
  Flame,
  Sparkles,
  Dices,
  Check,
  ChevronRight,
  HelpCircle,
  Activity,
  User,
  Plus,
  Minus,
  RefreshCw,
  Info
} from 'lucide-react';
import { CharacterData, Weapon, PathfinderCombatSettings } from '../../types';
import {
  calculatePathfinderCombatValues,
  calculatePathfinderWeaponStats,
  formatPathfinderModifier,
  getAttributeScore,
  calculatePathfinderModifier,
  hasWeaponFinesse,
  hasDexToDamage,
  recalculatePathfinderCharacter,
  getDefaultPathfinderCombatSettings,
  getBaseAttackBonus,
  getCharacterSizeMod
} from '../../utils/pathfinder';
import { WeaponCard } from '../../components/common/WeaponCard';
import { ComboCard } from '../../components/common/ComboCard';
import { PathfinderDamageSequenceCard } from '../../components/PathfinderDamageSequenceCard';

export interface PathfinderCombatViewProps {
  character: CharacterData;
  onUpdateCharacter: (character: CharacterData) => void;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenDiceCalc: (title?: string, mod?: number) => void;
  isEditing: boolean;
}

interface TacticalRollOutcome {
  weaponName: string;
  isMelee: boolean;
  d20: number;
  attackBonus: number;
  attackTotal: number;
  isThreat: boolean;
  threatRange: string;
  confirmD20?: number;
  confirmTotal?: number;
  isCritConfirm?: boolean;
  damageFormula: string;
  calculatedDamageVal?: number;
  notes: string[];
  timestamp: string;
}

export const PathfinderCombatView: FC<PathfinderCombatViewProps> = ({
  character,
  onUpdateCharacter,
  onUpdateData,
  onOpenDiceCalc,
  isEditing
}) => {
  const currentSettings: PathfinderCombatSettings = character.combatSettings || getDefaultPathfinderCombatSettings(character);
  const [activeRoll, setActiveRoll] = useState<TacticalRollOutcome | null>(null);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const geScore = getAttributeScore(character, 'GE');
  const geMod = calculatePathfinderModifier(geScore);
  const stScore = getAttributeScore(character, 'ST');
  const stMod = calculatePathfinderModifier(stScore);
  const hasFinesse = hasWeaponFinesse(character);
  const hasDexDmg = hasDexToDamage(character);

  // Compute live combat values using current settings
  const combat = calculatePathfinderCombatValues(character, {
    combatSettings: currentSettings,
    forceFinesse: currentSettings.attackAttr === 'GE',
    forceStrength: currentSettings.attackAttr === 'ST',
    forceDexToDamage: currentSettings.damageAttr === 'GE'
  });

  // Update settings and recalculate entire character
  const updateSettings = (updates: Partial<PathfinderCombatSettings>) => {
    const newSettings: PathfinderCombatSettings = {
      ...currentSettings,
      ...updates
    };
    const updated = recalculatePathfinderCharacter(character, undefined, newSettings);
    onUpdateCharacter(updated);
  };

  // Find all available melee and ranged weapons
  const meleeWeapons = character.weapons?.melee || [];
  const rangedWeapons = character.weapons?.ranged || [];
  const allWeapons: { weapon: Weapon; isMelee: boolean }[] = [
    ...meleeWeapons.map(w => ({ weapon: w, isMelee: true })),
    ...rangedWeapons.map(w => ({ weapon: w, isMelee: false }))
  ];

  const fallbackWeapon: Weapon = {
    name: "Waffenlos / Faust",
    attack: "+0",
    damage: "1W3",
    critical: "x2",
    note: "Einfache Nahkampfwaffe"
  };

  // Currently selected weapon
  const selectedWeaponEntry = allWeapons.find(
    w => w.weapon.name === currentSettings.selectedWeaponName
  ) || allWeapons[0] || {
    weapon: fallbackWeapon,
    isMelee: true
  };

  const selectedStats = calculatePathfinderWeaponStats(
    selectedWeaponEntry.weapon,
    character,
    selectedWeaponEntry.isMelee,
    { combatSettings: currentSettings }
  );

  // Execute an interactive tactical attack roll
  const executeAttackRoll = (weapon: Weapon, isMelee: boolean) => {
    const stats = calculatePathfinderWeaponStats(weapon, character, isMelee, {
      combatSettings: currentSettings
    });

    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonus = stats.singleAttackBonus;
    const total = d20 + bonus;

    // Critical threat logic
    const critRangeStr = weapon.critical || 'x2';
    const isThreat = critRangeStr.includes('18-20')
      ? d20 >= 18
      : critRangeStr.includes('19-20')
      ? d20 >= 19
      : d20 === 20;

    let confirmD20: number | undefined;
    let confirmTotal: number | undefined;
    let isCritConfirm: boolean | undefined;

    if (isThreat) {
      confirmD20 = Math.floor(Math.random() * 20) + 1;
      confirmTotal = confirmD20 + bonus;
      isCritConfirm = confirmD20 >= 10; // general indicator
    }

    const rollNotes: string[] = [];
    if (stats.activeTactics.length > 0) {
      rollNotes.push(...stats.activeTactics);
    }
    if (stats.hasSneakBonus && (currentSettings.isSneakAttack || currentSettings.isFlanking)) {
      rollNotes.push(`Hinterhältiger Angriff: +${stats.sneakAttackBonusAttack} Atk / +${stats.sneakAttackBonusDamage} Dmg (Schurkenwaffe)`);
    }

    const outcome: TacticalRollOutcome = {
      weaponName: weapon.name,
      isMelee,
      d20,
      attackBonus: bonus,
      attackTotal: total,
      isThreat,
      threatRange: isThreat ? critRangeStr : '',
      confirmD20,
      confirmTotal,
      isCritConfirm,
      damageFormula: stats.calculatedDamage,
      notes: rollNotes,
      timestamp: new Date().toLocaleTimeString()
    };

    setActiveRoll(outcome);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Tactical Control Center */}
      <section className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10">
              <Swords size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  Taktische Angriffs- & Kampfübersicht
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                  Pathfinder 1e
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Wähle Attribute, Flankieren, Hast, Waffenführung und Situationsboni. Alle Werte und Waffen passen sich sofort dynamisch an!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${
                showFormulaDetails
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <HelpCircle size={14} />
              <span>{showFormulaDetails ? 'Formeln verbergen' : 'Formeln aufschlüsseln'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const defaults = getDefaultPathfinderCombatSettings(character);
                updateSettings(defaults);
              }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Auf Standard-Kampfeinstellungen zurücksetzen"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Tactical Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Attribut-Auswahl für Angriff & Schaden */}
          <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  Angriffs- & Schadens-Attribut
                </span>
                {hasFinesse && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    Waffenfinesse gelernt
                  </span>
                )}
              </div>

              {/* Angriff: GE vs ST */}
              <div className="mb-4">
                <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                  Angriffswurf (Nahkampf & leichte Waffen):
                </span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => updateSettings({ attackAttr: 'GE' })}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentSettings.attackAttr === 'GE'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Zap size={13} />
                    <span>Geschick ({formatPathfinderModifier(geMod)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ attackAttr: 'ST' })}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentSettings.attackAttr === 'ST'
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sword size={13} />
                    <span>Stärke ({formatPathfinderModifier(stMod)})</span>
                  </button>
                </div>
                {geMod !== stMod && (
                  <div className="text-[10px] text-zinc-500 mt-1.5 flex items-center justify-between font-mono">
                    <span>Differenz: {geMod > stMod ? `GE ist +${geMod - stMod} höher` : `ST ist +${stMod - geMod} höher`}</span>
                    <span className={currentSettings.attackAttr === 'GE' ? 'text-amber-400' : 'text-red-400'}>
                      Aktiv: {currentSettings.attackAttr}
                    </span>
                  </div>
                )}
              </div>

              {/* Schaden: GE (Schurken-Finesse) vs ST */}
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                  Schadenswurf (Grundschaden):
                </span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => updateSettings({ damageAttr: 'GE' })}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentSettings.damageAttr === 'GE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Zap size={12} />
                    <span>GE-Schaden (+{geMod})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ damageAttr: 'ST' })}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentSettings.damageAttr === 'ST'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sword size={12} />
                    <span>ST-Schaden ({formatPathfinderModifier(stMod)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Waffenführung & Kampfzustände (Flankiert, Hast, Hinterhältiger Angriff) */}
          <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Activity size={14} className="text-orange-400" />
                  Waffenführung & Taktik
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Grip & Situationsboni
                </span>
              </div>

              {/* Handedness / Grip */}
              <div className="mb-4">
                <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                  Waffenführung (Handedness):
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 text-center">
                  <button
                    type="button"
                    onClick={() => updateSettings({ grip: 'oneHanded' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      currentSettings.grip === 'oneHanded'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1-Händig (1x)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ grip: 'twoHanded' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      currentSettings.grip === 'twoHanded'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    2-Händig (1.5x)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ grip: 'offHand' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      currentSettings.grip === 'offHand'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Nebenhand (0.5x)
                  </button>
                </div>
              </div>

              {/* Flankiert & Hast Toggles */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ isFlanking: !currentSettings.isFlanking })}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                    currentSettings.isFlanking
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Crosshair size={14} className={currentSettings.isFlanking ? 'text-amber-400' : 'text-zinc-500'} />
                    <span>Flankiert (Flanking)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    currentSettings.isFlanking ? 'bg-amber-500/30 text-amber-200' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {currentSettings.isFlanking ? '+2 Angriff (HA aktiv)' : 'Aus'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ isHasted: !currentSettings.isHasted })}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                    currentSettings.isHasted
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className={currentSettings.isHasted ? 'text-cyan-400' : 'text-zinc-500'} />
                    <span>Hast-Zauber (Haste)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    currentSettings.isHasted ? 'bg-cyan-500/30 text-cyan-200' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {currentSettings.isHasted ? '+1 Atk/RK + Zusatzangriff' : 'Aus'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Hinterhältiger Angriff & Zusätzliche Boni/Mali */}
          <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Flame size={14} className="text-red-400" />
                  Hinterhältiger Angriff & Boni/Mali
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  +5W6 / Schurkenbonus
                </span>
              </div>

              {/* Sneak Attack Toggle */}
              <button
                type="button"
                onClick={() => updateSettings({ isSneakAttack: !currentSettings.isSneakAttack })}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all mb-3 ${
                  currentSettings.isSneakAttack || currentSettings.isFlanking
                    ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flame size={14} className={currentSettings.isSneakAttack || currentSettings.isFlanking ? 'text-red-400' : 'text-zinc-500'} />
                  <span>Hinterhältiger Angriff</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/30 text-red-200">
                  +5W6 + 5 Blutung
                </span>
              </button>

              {/* Additional tactical toggles */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                <button
                  type="button"
                  onClick={() => updateSettings({ higherGround: !currentSettings.higherGround })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all ${
                    currentSettings.higherGround
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                  title="Höherer Stand (+1 auf Nahkampf-Angriffe)"
                >
                  Höhe (+1)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ targetProne: !currentSettings.targetProne })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all ${
                    currentSettings.targetProne
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                  title="Ziel liegt am Boden (+4 Nahkampf / -4 Fernkampf)"
                >
                  Boden (+4)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ isStealthed: !currentSettings.isStealthed })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all ${
                    currentSettings.isStealthed
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                  title="Unsichtbar oder aus der Tarnung (+2 Angriff, Ziel ohne GE-Bonus auf RK)"
                >
                  Tarnung (+2)
                </button>
              </div>

              {/* Custom +/- Attack & Damage Modifiers */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">Angriffsmod:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateSettings({ customAttackMod: currentSettings.customAttackMod - 1 })}
                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-white px-1">
                      {formatPathfinderModifier(currentSettings.customAttackMod)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSettings({ customAttackMod: currentSettings.customAttackMod + 1 })}
                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">Schadensmod:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateSettings({ customDamageMod: currentSettings.customDamageMod - 1 })}
                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-white px-1">
                      {formatPathfinderModifier(currentSettings.customDamageMod)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateSettings({ customDamageMod: currentSettings.customDamageMod + 1 })}
                      className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Summary Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
          <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Aktive Modifikatoren:</span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            Angriff: {currentSettings.attackAttr} ({currentSettings.attackAttr === 'GE' ? formatPathfinderModifier(geMod) : formatPathfinderModifier(stMod)})
          </span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            Schaden: {currentSettings.damageAttr || 'GE'} ({currentSettings.grip === 'twoHanded' ? '2-händig 1.5x' : currentSettings.grip === 'offHand' ? 'Nebenhand 0.5x' : '1-händig 1x'})
          </span>
          {currentSettings.isFlanking && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Flankiert (+2 Atk)
            </span>
          )}
          {currentSettings.isHasted && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Hast (+1 Atk/RK & Zusatzangriff)
            </span>
          )}
          {(currentSettings.isSneakAttack || currentSettings.isFlanking) && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
              Hinterhältiger Angriff (+5W6, 5 Blutung)
            </span>
          )}
          {currentSettings.higherGround && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Höhe (+1 Atk)
            </span>
          )}
          {currentSettings.targetProne && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Boden (+4 Nahk)
            </span>
          )}
          {currentSettings.isStealthed && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Tarnung (+2 Atk)
            </span>
          )}
          {currentSettings.customAttackMod !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">
              Situativ Atk: {formatPathfinderModifier(currentSettings.customAttackMod)}
            </span>
          )}
          {currentSettings.customDamageMod !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">
              Situativ Dmg: {formatPathfinderModifier(currentSettings.customDamageMod)}
            </span>
          )}
        </div>
      </section>

      {/* Interactive Active Weapon Selection & Attack Showcase */}
      <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Sword className="text-amber-400" size={22} />
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                Waffe für den Angriff auswählen
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Wähle eine Waffe deines Arsenals, um ihren exakten W20-Wurf, Schadenswurf und alle iterativen Angriffe einzusehen.
            </p>
          </div>

          {/* Quick weapon picker pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {allWeapons.map(({ weapon, isMelee }, idx) => {
              const active = weapon.name === selectedWeaponEntry.weapon.name;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateSettings({ selectedWeaponName: weapon.name })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {isMelee ? <Sword size={12} /> : <Crosshair size={12} />}
                  <span>{weapon.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Weapon Big Card */}
        <div className="bg-zinc-950/70 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Weapon Name, Type & Crit */}
            <div className="md:col-span-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedWeaponEntry.isMelee ? 'Nahkampfwaffe' : 'Fernkampfwaffe'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                  Krit: {selectedWeaponEntry.weapon.critical || 'x2'}
                </span>
                {selectedStats.hasSneakBonus && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                    Schurkenwaffe (+4/+4 bei HA)
                  </span>
                )}
              </div>

              <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {selectedWeaponEntry.weapon.name}
              </h4>

              <div className="text-xs text-zinc-400 font-mono">
                Attribut: <strong className="text-amber-300">{selectedStats.effectiveAttackAttr}</strong> (Treffer) / <strong className="text-amber-300">{selectedStats.effectiveDamageAttr}</strong> (Schaden)
              </div>

              {selectedWeaponEntry.weapon.note && (
                <p className="text-xs text-zinc-500 italic mt-1">
                  {selectedWeaponEntry.weapon.note}
                </p>
              )}
            </div>

            {/* Middle: Calculated Attack Bonus & Iterative Attacks */}
            <div className="md:col-span-4 space-y-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Angriffsbonus (GAB + Boni)</span>
                <span className="text-[10px] font-mono text-amber-400">
                  {currentSettings.isHasted ? 'inkl. Hast (+1)' : ''}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight text-amber-400">
                {selectedStats.calculatedAttackFormatted}
              </div>

              <div className="text-[11px] text-zinc-400 font-mono">
                Iterativ: {selectedStats.attackIteratives.map((b, i) => `${i + 1}. W20+${b}`).join(' / ')}
              </div>

              <div className="text-[10px] text-zinc-500 font-mono leading-tight">
                Formel: {selectedStats.attackFormula}
              </div>
            </div>

            {/* Right: Calculated Damage & Roll Action */}
            <div className="md:col-span-4 space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Schaden pro Treffer</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {currentSettings.grip === 'twoHanded' ? '2-Händig (1.5x)' : currentSettings.grip === 'offHand' ? 'Nebenhand (0.5x)' : '1-Händig (1.0x)'}
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight mt-1 text-emerald-400">
                  {selectedStats.calculatedDamage}
                </div>

                <div className="text-[10px] text-zinc-500 font-mono leading-tight mt-1">
                  Formel: {selectedStats.damageFormula}
                </div>
              </div>

              <button
                type="button"
                onClick={() => executeAttackRoll(selectedWeaponEntry.weapon, selectedWeaponEntry.isMelee)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Dices size={15} />
                <span>Angriff jetzt ausführen (W20)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Attack Roll Outcome Display */}
        <AnimatePresence>
          {activeRoll && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className={`p-5 rounded-2xl border mb-6 relative ${
                activeRoll.isThreat
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-100 shadow-xl shadow-amber-500/10'
                  : 'bg-zinc-950 border-zinc-700 text-zinc-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl font-mono text-2xl font-black shrink-0 ${
                    activeRoll.d20 === 20
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : activeRoll.d20 === 1
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-zinc-800 text-white'
                  }`}>
                    W20: {activeRoll.d20}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg text-white">
                        {activeRoll.weaponName}
                      </span>
                      {activeRoll.d20 === 20 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                          🎉 Natürliche 20!
                        </span>
                      )}
                      {activeRoll.d20 === 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 font-mono text-xs font-bold">
                          💀 Kritischer Fehlschlag!
                        </span>
                      )}
                      {activeRoll.isThreat && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                          🔥 Kritische Bedrohung ({activeRoll.threatRange})!
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-300 font-mono mt-1">
                      W20 ({activeRoll.d20}) + Modifikator ({formatPathfinderModifier(activeRoll.attackBonus)}) = <strong className="text-white text-base text-amber-400">{activeRoll.attackTotal}</strong> gegen Rüstungsklasse (RK)
                    </div>

                    {activeRoll.confirmD20 !== undefined && (
                      <div className="text-xs text-amber-300 font-mono mt-1">
                        🎯 Bestätigungswurf: W20 ({activeRoll.confirmD20}) + {activeRoll.attackBonus} = <strong className="text-white">{activeRoll.confirmTotal}</strong>
                      </div>
                    )}

                    <div className="text-xs text-emerald-400 font-mono mt-1">
                      Schaden bei Treffer: <strong className="text-white">{activeRoll.damageFormula}</strong>
                    </div>

                    {activeRoll.notes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeRoll.notes.map((n, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-zinc-300 border border-zinc-700">
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => executeAttackRoll(selectedWeaponEntry.weapon, selectedWeaponEntry.isMelee)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-mono font-medium transition-all"
                  >
                    Nochmal würfeln
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoll(null)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Complete Weapons & Combinations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 cols: All weapons with live tactical stats */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="text-orange-500" size={20} />
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                Nahkampfwaffen ({meleeWeapons.length})
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {meleeWeapons.map((w, idx) => (
              <WeaponCard
                key={idx}
                weapon={w}
                isEditing={isEditing}
                character={character}
                isMelee={true}
                onChange={(updates) => {
                  const newMelee = [...meleeWeapons];
                  newMelee[idx] = { ...w, ...updates };
                  onUpdateData({ weapons: { ...character.weapons, melee: newMelee } });
                }}
                onRemove={() => {
                  const newMelee = meleeWeapons.filter((_, i) => i !== idx);
                  onUpdateData({ weapons: { ...character.weapons, melee: newMelee } });
                }}
              />
            ))}
          </div>

          {rangedWeapons.length > 0 && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Crosshair className="text-cyan-400" size={20} />
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                  Fernkampfwaffen ({rangedWeapons.length})
                </h3>
              </div>
              {rangedWeapons.map((w, idx) => (
                <WeaponCard
                  key={idx}
                  weapon={w}
                  isEditing={isEditing}
                  character={character}
                  isMelee={false}
                  onChange={(updates) => {
                    const newRanged = [...rangedWeapons];
                    newRanged[idx] = { ...w, ...updates };
                    onUpdateData({ weapons: { ...character.weapons, ranged: newRanged } });
                  }}
                  onRemove={() => {
                    const newRanged = rangedWeapons.filter((_, i) => i !== idx);
                    onUpdateData({ weapons: { ...character.weapons, ranged: newRanged } });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 6 cols: Combos & Dual-Wielding */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-400" size={20} />
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">
              Kampfkombinationen & Voller Angriff
            </h3>
          </div>

          <div className="space-y-4">
            {character.combos?.map((combo, idx) => (
              <ComboCard
                key={combo.id || idx}
                combo={combo}
                isEditing={isEditing}
                character={character}
                onOpenDiceCalc={onOpenDiceCalc}
                onChange={(updates) => {
                  const newCombos = [...(character.combos || [])];
                  newCombos[idx] = { ...combo, ...updates };
                  onUpdateData({ combos: newCombos });
                }}
                onRemove={() => {
                  const newCombos = (character.combos || []).filter((_, i) => i !== idx);
                  onUpdateData({ combos: newCombos });
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Optimal Damage Sequence Simulator */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-amber-400" size={22} />
          <h3 className="text-xl font-bold text-white tracking-tight uppercase">
            Optimaler Schadenszug (Voller Angriff mit allen taktischen Boni)
          </h3>
        </div>
        <PathfinderDamageSequenceCard character={character} />
      </section>
    </div>
  );
};
