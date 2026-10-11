import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Shield, 
  Crosshair, 
  Zap, 
  Info, 
  Dices, 
  Check, 
  Plus, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Flame,
  Activity,
  Heart,
  Swords
} from 'lucide-react';
import { CharacterData, Ability, PathfinderCombatSettings } from '../types';
import { 
  calculatePathfinderCombatValues, 
  formatPathfinderModifier,
  hasWeaponFinesse,
  hasDexToDamage,
  recalculatePathfinderCharacter,
  getDefaultPathfinderCombatSettings
} from '../utils/pathfinder';
import { PathfinderDamageSequenceCard } from './PathfinderDamageSequenceCard';

export interface PathfinderCombatCardProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onOpenDiceCalc?: (title?: string, mod?: number) => void;
  onSwitchToCombatTab?: () => void;
  isEditing?: boolean;
}

interface AttackRollResult {
  title: string;
  type: 'melee' | 'ranged' | 'cmb';
  d20: number;
  modifier: number;
  total: number;
  isThreat: boolean;
  threatRange: string;
  confirmRoll?: number;
  confirmTotal?: number;
  timestamp: string;
}

export const PathfinderCombatCard: React.FC<PathfinderCombatCardProps> = ({
  character,
  onUpdateCharacter,
  onOpenDiceCalc,
  onSwitchToCombatTab,
  isEditing = false,
}) => {
  const currentSettings: PathfinderCombatSettings = character.combatSettings || getDefaultPathfinderCombatSettings(character);
  const hasFinesse = hasWeaponFinesse(character);
  const hasDexDmg = hasDexToDamage(character);
  const [activeRoll, setActiveRoll] = useState<AttackRollResult | null>(null);
  const [showFormulas, setShowFormulas] = useState<boolean>(false);

  const combat = calculatePathfinderCombatValues(character, {
    combatSettings: currentSettings,
    forceFinesse: currentSettings.attackAttr === 'GE',
    forceStrength: currentSettings.attackAttr === 'ST',
    forceDexToDamage: currentSettings.damageAttr === 'GE'
  });

  const diffMod = combat.geMod - combat.stMod;

  const updateSettings = (updates: Partial<PathfinderCombatSettings>) => {
    const newSettings: PathfinderCombatSettings = {
      ...currentSettings,
      ...updates
    };
    const updatedCharacter = recalculatePathfinderCharacter(character, undefined, newSettings);
    onUpdateCharacter(updatedCharacter);
  };

  const handleRollAttack = (type: 'melee' | 'ranged' | 'cmb', bonus: number, title: string) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const isThreat = type === 'melee' ? d20 >= 19 : d20 === 20;
    
    let confirmRoll: number | undefined;
    let confirmTotal: number | undefined;

    if (isThreat) {
      confirmRoll = Math.floor(Math.random() * 20) + 1;
      confirmTotal = confirmRoll + bonus;
    }

    const result: AttackRollResult = {
      title,
      type,
      d20,
      modifier: bonus,
      total: d20 + bonus,
      isThreat,
      threatRange: type === 'melee' ? '19-20' : '20',
      confirmRoll,
      confirmTotal,
      timestamp: new Date().toLocaleTimeString()
    };

    setActiveRoll(result);
  };

  const handleAddFinesseFeat = () => {
    const currentAbilities = [...(character.abilities || [])];
    const newFeat: Ability = {
      name: "Waffenfinesse",
      type: "talent",
      effect: "GE statt ST für Angriffswürfe mit leichten Nahkampfwaffen und Rapier."
    };
    const updatedCharacter = recalculatePathfinderCharacter({
      ...character,
      abilities: [newFeat, ...currentAbilities]
    }, undefined, {
      ...currentSettings,
      attackAttr: 'GE'
    });
    onUpdateCharacter(updatedCharacter);
  };

  return (
    <section className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative background aura */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sword size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Kampfwerte & Angriffsboni
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Pathfinder 1e
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automatische Verrechnung von Grund-Angriffsbonus (GAB), Stärke (ST) & Geschicklichkeit (GE)
            </p>
          </div>
        </div>

        {/* Action / Combat Tab Link */}
        <div className="flex items-center gap-2">
          {onSwitchToCombatTab && (
            <button
              type="button"
              onClick={onSwitchToCombatTab}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm cursor-pointer"
              title="Zur detaillierten taktischen Kampfübersicht wechseln"
            >
              <Swords size={13} />
              <span>Kampfübersicht (Tab)</span>
              <ArrowRight size={12} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${
              showFormulas 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200' 
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Formeln und Regelaufschlüsselung ein-/ausblenden"
          >
            <HelpCircle size={13} />
            <span>Formeln {showFormulas ? 'ausblenden' : 'anzeigen'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Tactical Control Strip */}
      <div className="p-4 rounded-2xl border bg-zinc-950/60 border-zinc-800/80 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              Angriffs-Attribut:
            </span>
            <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => updateSettings({ attackAttr: 'GE' })}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  currentSettings.attackAttr === 'GE'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap size={11} />
                <span>GE ({formatPathfinderModifier(combat.geMod)})</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ attackAttr: 'ST' })}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  currentSettings.attackAttr === 'ST'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sword size={11} />
                <span>ST ({formatPathfinderModifier(combat.stMod)})</span>
              </button>
            </div>
            {!hasFinesse && (
              <button
                type="button"
                onClick={handleAddFinesseFeat}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <Plus size={10} /> Waffenfinesse lernen
              </button>
            )}
          </div>

          {/* Schadens-Attribut Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Flame size={14} className="text-orange-400" />
              Schadens-Attribut:
            </span>
            <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => updateSettings({ damageAttr: 'GE' })}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  currentSettings.damageAttr === 'GE'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap size={11} />
                <span>GE (+{combat.geMod})</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ damageAttr: 'ST' })}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                  currentSettings.damageAttr === 'ST'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sword size={11} />
                <span>ST ({formatPathfinderModifier(combat.stMod)})</span>
              </button>
            </div>
          </div>

          {/* Grip / Handedness Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Führung:
            </span>
            <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => updateSettings({ grip: 'oneHanded' })}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  currentSettings.grip === 'oneHanded'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1-Hand (1x)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ grip: 'twoHanded' })}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  currentSettings.grip === 'twoHanded'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2-Hand (1.5x)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ grip: 'offHand' })}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  currentSettings.grip === 'offHand'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Nebenhand (0.5x)
              </button>
            </div>
          </div>
        </div>

        {/* Toggles Strip: Flankiert, Hast, Hinterhältiger Angriff */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={() => updateSettings({ isFlanking: !currentSettings.isFlanking })}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              currentSettings.isFlanking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Crosshair size={12} className={currentSettings.isFlanking ? 'text-amber-400' : 'text-zinc-500'} />
            <span>Flankiert (+2 Atk)</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ isHasted: !currentSettings.isHasted })}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              currentSettings.isHasted
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles size={12} className={currentSettings.isHasted ? 'text-cyan-400' : 'text-zinc-500'} />
            <span>Hast (+1 Atk/RK)</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ isSneakAttack: !currentSettings.isSneakAttack })}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              currentSettings.isSneakAttack || currentSettings.isFlanking
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Flame size={12} className={currentSettings.isSneakAttack || currentSettings.isFlanking ? 'text-red-400' : 'text-zinc-500'} />
            <span>Hinterhältiger Angriff (+5W6)</span>
          </button>

          {/* Quick Modifier Display */}
          {combat.tacticalMeleeBonus !== 0 && (
            <span className="text-[11px] font-mono text-amber-400 ml-auto flex items-center gap-1">
              Taktischer Nahkampf-Bonus: <strong>{formatPathfinderModifier(combat.tacticalMeleeBonus)}</strong> auf Angriff
            </span>
          )}
        </div>
      </div>

      {/* Grid of Main Combat Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Base Attack Bonus (GAB / BAB) */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                Grundangriff (GAB)
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                Basis
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {combat.babFormatted}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Klassenbasis für Angriffe & KMB
            </div>
          </div>
          {showFormulas && (
            <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono">
              Iterativ: {combat.babIteratives.map((b, idx) => `${idx + 1}. Angriff ${formatPathfinderModifier(b)}`).join(' • ')}
            </div>
          )}
        </div>

        {/* 2. Melee Attack Bonus (Nahkampf) */}
        <div className={`border p-4 rounded-2xl flex flex-col justify-between transition-all relative overflow-hidden ${
          currentSettings.attackAttr === 'GE'
            ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
            : 'bg-red-950/20 border-red-500/40 hover:border-red-400'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-1.5">
                <Sword size={13} className={currentSettings.attackAttr === 'GE' ? 'text-amber-400' : 'text-red-400'} />
                Nahkampf-Basis
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                currentSettings.attackAttr === 'GE' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {combat.meleeAttr}: {formatPathfinderModifier(combat.meleeAttrMod)}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {combat.meleeFormatted}
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 mt-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                {currentSettings.attackAttr === 'GE' ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Zap size={11} /> Treffer: GE (+{combat.geMod})
                  </span>
                ) : (
                  <span className="text-red-300 flex items-center gap-1">
                    <Sword size={11} /> Treffer: ST ({formatPathfinderModifier(combat.stMod)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {combat.meleeDamageAttr === 'GE' ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <Zap size={11} /> Schaden: GE (+{combat.meleeDamageAttrMod})
                  </span>
                ) : (
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <Sword size={11} /> Schaden: ST ({formatPathfinderModifier(combat.meleeDamageAttrMod)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleRollAttack('melee', combat.meleeAttackBonus, 'Nahkampf-Angriff')}
              className="w-full py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Dices size={13} className="text-amber-400" />
              <span>Nahkampf würfeln</span>
            </button>
          </div>

          {showFormulas && (
            <div className="mt-2 text-[10px] text-zinc-400 font-mono leading-tight">
              {combat.meleeFormula}
            </div>
          )}
        </div>

        {/* 3. Ranged Attack Bonus (Fernkampf) */}
        <div className="bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-400 p-4 rounded-2xl flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-1.5">
                <Crosshair size={13} className="text-cyan-400" />
                Fernkampf-Basis
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                GE: {formatPathfinderModifier(combat.geMod)}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {combat.rangedFormatted}
            </div>

            <div className="text-[11px] text-cyan-300/90 mt-1">
              Geschicklichkeit auf alle Schuss-/Wurfwaffen
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleRollAttack('ranged', combat.rangedAttackBonus, 'Fernkampf-Angriff')}
              className="w-full py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Dices size={13} className="text-cyan-400" />
              <span>Fernkampf würfeln</span>
            </button>
          </div>

          {showFormulas && (
            <div className="mt-2 text-[10px] text-zinc-400 font-mono leading-tight">
              {combat.rangedFormula}
            </div>
          )}
        </div>

        {/* 4. Combat Maneuvers (KMB & KMV) */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-400 p-4 rounded-2xl flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-300 flex items-center gap-1.5">
                <Shield size={13} className="text-indigo-400" />
                Kampfmanöver
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                KMB / KMV
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">KMB</span>
                <span className="text-2xl font-black text-white font-mono">
                  {formatPathfinderModifier(combat.cmb)}
                </span>
              </div>
              <div className="text-zinc-600 font-light text-xl">/</div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">KMV</span>
                <span className="text-2xl font-black text-white font-mono">
                  {combat.cmd}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 mt-1">
              Entwaffnen, Zu-Fall-bringen, Ringen
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleRollAttack('cmb', combat.cmb, 'Kampfmanöverwurf (KMB)')}
              className="w-full py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Dices size={13} className="text-indigo-400" />
              <span>KMB würfeln</span>
            </button>
          </div>

          {showFormulas && (
            <div className="mt-2 text-[10px] text-zinc-400 font-mono leading-tight space-y-0.5">
              <div>KMB: {combat.cmbFormula}</div>
              <div>KMV: {combat.cmdFormula}</div>
            </div>
          )}
        </div>
      </div>

      {/* Defensive Combat Values with Dexterity & Haste Contribution */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
            <Shield size={13} className="text-emerald-400" />
            Defensive Kampfwerte (mit Geschicklichkeit & Zuständen)
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            GE: +{combat.geMod} {currentSettings.isHasted ? '+1 Hast' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Rüstungsklasse (RK)</span>
            <span className="text-xl font-black text-white font-mono">{combat.armorClass}</span>
            <span className="text-[9px] text-emerald-400 block font-mono">
              inkl. +{combat.geMod} GE {currentSettings.isHasted ? '+1 Hast' : ''}
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Berührungs-RK</span>
            <span className="text-xl font-black text-white font-mono">{combat.touchAc}</span>
            <span className="text-[9px] text-emerald-400 block font-mono">
              inkl. +{combat.geMod} GE {currentSettings.isHasted ? '+1 Hast' : ''}
            </span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Auf falschem Fuß</span>
            <span className="text-xl font-black text-white font-mono">{combat.flatFootedAc}</span>
            <span className="text-[9px] text-zinc-500 block font-mono">kein GE-Bonus</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Initiative</span>
            <span className="text-xl font-black text-white font-mono">{formatPathfinderModifier(combat.initiative)}</span>
            <span className="text-[9px] text-cyan-400 block font-mono">reine GE (+{combat.geMod})</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Reflexwurf</span>
            <span className="text-xl font-black text-white font-mono">{formatPathfinderModifier(combat.reflexTotal)}</span>
            <span className="text-[9px] text-cyan-400 block font-mono">
              Basis + GE (+{combat.geMod}) {currentSettings.isHasted ? '+1 Hast' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Schadenszug-Rechner */}
      <PathfinderDamageSequenceCard character={character} className="mt-4" />

      {/* Active Attack Roll Result Overlay */}
      <AnimatePresence>
        {activeRoll && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              activeRoll.isThreat 
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-100 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl font-mono text-xl font-black shrink-0 ${
                activeRoll.d20 === 20 
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' 
                  : activeRoll.d20 === 1 
                  ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                  : 'bg-zinc-800 text-zinc-200'
              }`}>
                W20: {activeRoll.d20}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{activeRoll.title}</span>
                  {activeRoll.d20 === 20 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                      Natürliche 20!
                    </span>
                  )}
                  {activeRoll.d20 === 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                      Kritischer Fehlschlag!
                    </span>
                  )}
                  {activeRoll.isThreat && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                      🔥 Kritische Bedrohung ({activeRoll.threatRange})!
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  W20 ({activeRoll.d20}) + Modifikator ({formatPathfinderModifier(activeRoll.modifier)}) = <strong className="text-white text-sm">{activeRoll.total}</strong>
                  {activeRoll.confirmRoll !== undefined && (
                    <span className="ml-2 text-amber-300">
                      • Bestätigungswurf: {activeRoll.confirmRoll} + {activeRoll.modifier} = {activeRoll.confirmTotal}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleRollAttack(activeRoll.type, activeRoll.modifier, activeRoll.title)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-medium transition-all"
              >
                Erneut würfeln
              </button>
              <button
                type="button"
                onClick={() => setActiveRoll(null)}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs transition-all"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
