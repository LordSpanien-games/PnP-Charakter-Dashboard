import React, { useState, useMemo } from 'react';
import { Shield, Zap, Sparkles, HeartPulse, Dices, Edit3, Check, X, RotateCcw, Award, Info, ChevronDown, ChevronUp, Plus, Minus, RefreshCw } from 'lucide-react';
import { CharacterData, PathfinderSavingThrow, PathfinderSavingThrows, Stat } from '../types';
import { 
  syncPathfinderStats, 
  calculateSavingThrows, 
  getAttributeScore, 
  calculatePathfinderModifier, 
  formatPathfinderModifier 
} from '../utils/pathfinder';

interface PathfinderSavingThrowsCardProps {
  character: CharacterData;
  onUpdateSavingThrows: (saves: PathfinderSavingThrows, updatedStats?: Stat[]) => void;
  onOpenDiceCalc?: (saveType: 'fortitude' | 'reflex' | 'will', mod: number) => void;
  isEditing?: boolean;
}

interface RollResult {
  saveKey: 'fortitude' | 'reflex' | 'will';
  saveName: string;
  d20: number;
  bonus: number;
  total: number;
  dc: number;
  isCustomRoll?: boolean;
  customBonusName?: string;
  hasRerolled?: boolean;
}

export const PathfinderSavingThrowsCard: React.FC<PathfinderSavingThrowsCardProps> = ({
  character,
  onUpdateSavingThrows,
  onOpenDiceCalc,
  isEditing = false
}) => {
  // Dynamically compute ability scores & modifiers from attributes
  const koScore = getAttributeScore(character, 'KO');
  const geScore = getAttributeScore(character, 'GE');
  const weScore = getAttributeScore(character, 'WE');

  const koMod = calculatePathfinderModifier(koScore);
  const geMod = calculatePathfinderModifier(geScore);
  const weMod = calculatePathfinderModifier(weScore);

  // Automatically derive saving throws from attributes, base values, and magic/misc bonuses
  const currentSaves: PathfinderSavingThrows = useMemo(() => {
    return calculateSavingThrows(character, character.savingThrows);
  }, [character.characteristics, character.stats, character.savingThrows]);

  // Local state for editing
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingSaves, setEditingSaves] = useState<PathfinderSavingThrows>(currentSaves);
  const [autoSyncAttrs, setAutoSyncAttrs] = useState<{ fortitude: boolean; reflex: boolean; will: boolean }>({
    fortitude: true,
    reflex: true,
    will: true
  });
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);

  // Quick Roll Modal State
  const [activeRoll, setActiveRoll] = useState<RollResult | null>(null);
  const [targetDC, setTargetDC] = useState<number>(15);

  const calcSaveTotal = (save: PathfinderSavingThrow): number => {
    return (
      (save.base || 0) +
      (save.abilityMod || 0) +
      (save.magicMod || 0) +
      (save.miscMod || 0) +
      (save.tempMod || 0)
    );
  };

  const handleQuickAdjust = (
    saveKey: 'fortitude' | 'reflex' | 'will',
    field: 'base' | 'magicMod' | 'miscMod' | 'tempMod',
    delta: number
  ) => {
    const targetSave = currentSaves[saveKey];
    const currentVal = targetSave[field] || 0;
    const newVal = Math.max(0, currentVal + delta);
    const updatedSave: PathfinderSavingThrow = {
      ...targetSave,
      [field]: newVal
    };
    updatedSave.total = calcSaveTotal(updatedSave);

    const updatedSaves: PathfinderSavingThrows = {
      ...currentSaves,
      [saveKey]: updatedSave
    };

    const updatedStats = syncPathfinderStats(character.stats, updatedSaves);
    onUpdateSavingThrows(updatedSaves, updatedStats);
  };

  const openEditModal = () => {
    setEditingSaves({
      fortitude: { ...currentSaves.fortitude, abilityMod: koMod },
      reflex: { ...currentSaves.reflex, abilityMod: geMod },
      will: { ...currentSaves.will, abilityMod: weMod }
    });
    setAutoSyncAttrs({ fortitude: true, reflex: true, will: true });
    setShowEditModal(true);
  };

  const syncModifiersFromAttributes = () => {
    setEditingSaves(prev => ({
      fortitude: {
        ...prev.fortitude,
        abilityMod: koMod,
        total: calcSaveTotal({ ...prev.fortitude, abilityMod: koMod })
      },
      reflex: {
        ...prev.reflex,
        abilityMod: geMod,
        total: calcSaveTotal({ ...prev.reflex, abilityMod: geMod })
      },
      will: {
        ...prev.will,
        abilityMod: weMod,
        total: calcSaveTotal({ ...prev.will, abilityMod: weMod })
      }
    }));
    setAutoSyncAttrs({ fortitude: true, reflex: true, will: true });
  };

  const handleSaveEdits = () => {
    const finalized: PathfinderSavingThrows = {
      fortitude: {
        ...editingSaves.fortitude,
        abilityMod: autoSyncAttrs.fortitude ? koMod : editingSaves.fortitude.abilityMod,
        total: calcSaveTotal({
          ...editingSaves.fortitude,
          abilityMod: autoSyncAttrs.fortitude ? koMod : editingSaves.fortitude.abilityMod
        })
      },
      reflex: {
        ...editingSaves.reflex,
        abilityMod: autoSyncAttrs.reflex ? geMod : editingSaves.reflex.abilityMod,
        total: calcSaveTotal({
          ...editingSaves.reflex,
          abilityMod: autoSyncAttrs.reflex ? geMod : editingSaves.reflex.abilityMod
        })
      },
      will: {
        ...editingSaves.will,
        abilityMod: autoSyncAttrs.will ? weMod : editingSaves.will.abilityMod,
        total: calcSaveTotal({
          ...editingSaves.will,
          abilityMod: autoSyncAttrs.will ? weMod : editingSaves.will.abilityMod
        })
      }
    };

    // Synchronize with stats array using helper to guarantee correct labels
    const updatedStats = syncPathfinderStats(character.stats, finalized);

    onUpdateSavingThrows(finalized, updatedStats);
    setShowEditModal(false);
  };

  const executeRoll = (
    saveKey: 'fortitude' | 'reflex' | 'will',
    bonusOverride?: number,
    customBonusName?: string
  ) => {
    const save = currentSaves[saveKey];
    const totalBonus = bonusOverride !== undefined ? bonusOverride : save.total;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + totalBonus;

    const names = {
      fortitude: 'Zähigkeit (Konstitution)',
      reflex: 'Reflex (Geschicklichkeit)',
      will: 'Wille (Weisheit)'
    };

    setActiveRoll({
      saveKey,
      saveName: names[saveKey],
      d20,
      bonus: totalBonus,
      total,
      dc: targetDC,
      isCustomRoll: bonusOverride !== undefined,
      customBonusName,
      hasRerolled: false
    });
  };

  const handleReroll = () => {
    if (!activeRoll) return;
    const newD20 = Math.floor(Math.random() * 20) + 1;
    const newTotal = newD20 + activeRoll.bonus;
    setActiveRoll({
      ...activeRoll,
      d20: newD20,
      total: newTotal,
      hasRerolled: true
    });
  };

  return (
    <div className="bg-zinc-900/40 border border-amber-500/25 rounded-2xl p-5 md:p-6 backdrop-blur-md relative overflow-hidden shadow-lg shadow-black/20">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Shield size={20} className="stroke-[2.2px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight font-sans">
                Rettungswürfe
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                Pathfinder d20
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Zähigkeit (Konstitution), Reflex (Geschicklichkeit) & Wille (Weisheit)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-300 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            title="Formel-Details ein- oder ausblenden"
          >
            {expandedDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{expandedDetails ? 'Details einklappen' : 'Formel-Aufschlüsselung'}</span>
          </button>

          <button
            type="button"
            onClick={openEditModal}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            id="btn-edit-pathfinder-saves"
          >
            <Edit3 size={13} />
            <span>Werte anpassen</span>
          </button>
        </div>
      </div>

      {/* The 3 Saving Throws Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. ZÄHIGKEIT (Fortitude) */}
        <div className="bg-gradient-to-b from-emerald-950/25 via-zinc-950/70 to-zinc-950 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <HeartPulse size={15} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block font-sans">
                    Zähigkeit (Konstitution)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400/80 uppercase font-bold">Fortitude • KO</span>
                </div>
              </div>

              <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {currentSaves.fortitude.total >= 0 ? `+${currentSaves.fortitude.total}` : currentSaves.fortitude.total}
              </span>
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 text-[11px] font-mono mb-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Basis-RW:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-200">+{currentSaves.fortitude.base}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('fortitude', 'base', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('fortitude', 'base', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">KO-Modifikator:</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-mono">
                    auto (KO: {koScore})
                  </span>
                </div>
                <span className="font-bold text-emerald-300">
                  {formatPathfinderModifier(currentSaves.fortitude.abilityMod)}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Magie (Umhang):</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-400">
                    +{currentSaves.fortitude.magicMod || 0}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('fortitude', 'magicMod', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('fortitude', 'magicMod', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              {((currentSaves.fortitude.miscMod || 0) !== 0 || (currentSaves.fortitude.tempMod || 0) !== 0) && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">Sonstiges / Temp:</span>
                  <span className="font-bold text-emerald-400">
                    +{(currentSaves.fortitude.miscMod || 0) + (currentSaves.fortitude.tempMod || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes / Special Situational Trait */}
            {currentSaves.fortitude.notes && (
              <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-300/90 leading-relaxed mb-3">
                <span className="text-emerald-400 font-bold block">Situationsboni:</span>
                {currentSaves.fortitude.notes}
              </div>
            )}
          </div>

          {/* Action: Quick Roll */}
          <div className="pt-2 border-t border-zinc-855 flex items-center gap-2">
            <button
              type="button"
              onClick={() => executeRoll('fortitude')}
              className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 rounded-xl text-xs font-mono font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              id="btn-roll-fortitude"
            >
              <Dices size={14} className="text-emerald-400" />
              <span>W20 Würfeln ({currentSaves.fortitude.total >= 0 ? `+${currentSaves.fortitude.total}` : currentSaves.fortitude.total})</span>
            </button>
          </div>
        </div>

        {/* 2. REFLEX (Reflex) */}
        <div className="bg-gradient-to-b from-amber-950/25 via-zinc-950/70 to-zinc-950 border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm ring-1 ring-amber-500/10">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Zap size={15} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 block font-sans">
                    Reflex (Geschicklichkeit)
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/80 uppercase font-bold">Reflex • GE</span>
                </div>
              </div>

              <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                {currentSaves.reflex.total >= 0 ? `+${currentSaves.reflex.total}` : currentSaves.reflex.total}
              </span>
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 text-[11px] font-mono mb-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Basis-RW:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-200">+{currentSaves.reflex.base}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('reflex', 'base', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('reflex', 'base', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">GE-Modifikator:</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50 font-mono">
                    auto (GE: {geScore})
                  </span>
                </div>
                <span className="font-bold text-amber-300">
                  {formatPathfinderModifier(currentSaves.reflex.abilityMod)}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Magie (Umhang):</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-400">
                    +{currentSaves.reflex.magicMod || 0}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('reflex', 'magicMod', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('reflex', 'magicMod', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              {((currentSaves.reflex.magicMod || 0) !== 0 || (currentSaves.reflex.miscMod || 0) !== 0 || (currentSaves.reflex.tempMod || 0) !== 0) && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">Magie / Sonst.:</span>
                  <span className="font-bold text-amber-400">
                    +{(currentSaves.reflex.magicMod || 0) + (currentSaves.reflex.miscMod || 0) + (currentSaves.reflex.tempMod || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes / Special Situational Trait */}
            {currentSaves.reflex.notes && (
              <div className="bg-amber-950/30 border border-amber-800/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-300/90 leading-relaxed mb-3">
                <span className="text-amber-400 font-bold block">Situationsboni:</span>
                {currentSaves.reflex.notes}
              </div>
            )}
          </div>

          {/* Action: Quick Roll with option for Trap Sense */}
          <div className="pt-2 border-t border-zinc-850 space-y-1.5">
            <button
              type="button"
              onClick={() => executeRoll('reflex')}
              className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 rounded-xl text-xs font-mono font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              id="btn-roll-reflex"
            >
              <Dices size={14} className="text-amber-400" />
              <span>W20 Würfeln ({currentSaves.reflex.total >= 0 ? `+${currentSaves.reflex.total}` : currentSaves.reflex.total})</span>
            </button>

            {/* Quick Roll with Trap Sense if Floki or has Trap bonus */}
            {currentSaves.reflex.notes?.includes('Fallen') && (
              <button
                type="button"
                onClick={() => executeRoll('reflex', currentSaves.reflex.total + 3, 'Gegen Fallen (+3 Fallengespür)')}
                className="w-full py-1 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-700/40 text-amber-200 rounded-lg text-[10px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Reflexwurf gegen Falle mit +3 Fallengespür"
              >
                <Zap size={11} className="text-amber-400" />
                <span>Vs. Falle: +{currentSaves.reflex.total + 3}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. WILLE (Will) */}
        <div className="bg-gradient-to-b from-purple-950/25 via-zinc-950/70 to-zinc-950 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300 block font-sans">
                    Wille (Weisheit)
                  </span>
                  <span className="text-[10px] font-mono text-purple-400/80 uppercase font-bold">Will • WE</span>
                </div>
              </div>

              <span className="text-2xl font-black font-mono text-purple-400 tracking-tight">
                {currentSaves.will.total >= 0 ? `+${currentSaves.will.total}` : currentSaves.will.total}
              </span>
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 text-[11px] font-mono mb-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Basis-RW:</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-zinc-200">+{currentSaves.will.base}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('will', 'base', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('will', 'base', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Basis-RW +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">WE-Modifikator:</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950/80 text-purple-400 border border-purple-800/50 font-mono">
                    auto (WE: {weScore})
                  </span>
                </div>
                <span className="font-bold text-purple-300">
                  {formatPathfinderModifier(currentSaves.will.abilityMod)}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-zinc-500">Magie (Umhang):</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-purple-400">
                    +{currentSaves.will.magicMod || 0}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('will', 'magicMod', -1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie -1"
                    >
                      <Minus size={9} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust('will', 'magicMod', 1)}
                      className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[9px]"
                      title="Magie +1"
                    >
                      <Plus size={9} />
                    </button>
                  </div>
                </div>
              </div>

              {((currentSaves.will.magicMod || 0) !== 0 || (currentSaves.will.miscMod || 0) !== 0 || (currentSaves.will.tempMod || 0) !== 0) && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">Magie / Sonst.:</span>
                  <span className="font-bold text-purple-400">
                    +{(currentSaves.will.magicMod || 0) + (currentSaves.will.miscMod || 0) + (currentSaves.will.tempMod || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes / Special Situational Trait */}
            {currentSaves.will.notes && (
              <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-purple-300/90 leading-relaxed mb-3">
                <span className="text-purple-400 font-bold block">Situationsboni:</span>
                {currentSaves.will.notes}
              </div>
            )}
          </div>

          {/* Action: Quick Roll */}
          <div className="pt-2 border-t border-zinc-850 flex items-center gap-2">
            <button
              type="button"
              onClick={() => executeRoll('will')}
              className="flex-1 py-2 bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 rounded-xl text-xs font-mono font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              id="btn-roll-will"
            >
              <Dices size={14} className="text-purple-400" />
              <span>W20 Würfeln ({currentSaves.will.total >= 0 ? `+${currentSaves.will.total}` : currentSaves.will.total})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Formulas & Reference Table */}
      {expandedDetails && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 bg-zinc-950/60 p-4 rounded-xl text-xs font-mono text-zinc-400 space-y-2">
          <div className="flex items-center gap-2 text-zinc-300 font-bold">
            <Info size={14} className="text-amber-400" />
            <span>Regelwerk: Rettungswürfe in Pathfinder d20</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            <strong>Gesamtwert = Basis-Rettungswurf (Klasse & Stufe) + Attributs-Modifikator + Magie-Bonus (z.B. Widerstandsumhang) + Sonstige Boni/Mali.</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
            <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
              <span className="text-emerald-400 font-bold block mb-1">Zähigkeit (Fortitude)</span>
              Schützt gegen Gifte, Krankheiten, Verwandlungen, Entkräftung und Todeseffekte.
            </div>
            <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
              <span className="text-amber-400 font-bold block mb-1">Reflex (Reflex)</span>
              Schützt vor Flächeneffekten (Feuerball), Einstürzen, Atemwaffen und Fallen.
            </div>
            <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
              <span className="text-purple-400 font-bold block mb-1">Wille (Will)</span>
              Schützt gegen mentale Magie, Verzauberung, Beherrschung, Furcht und Illusionen.
            </div>
          </div>
        </div>
      )}

      {/* QUICK ROLL MODAL / RESULT OVERLAY */}
      {activeRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveRoll(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                Pathfinder Rettungswurf
              </span>
              <h4 className="text-lg font-black text-white">{activeRoll.saveName}</h4>
              {activeRoll.customBonusName && (
                <span className="text-xs font-mono text-amber-300 block">{activeRoll.customBonusName}</span>
              )}
            </div>

            {/* D20 Visual Result */}
            <div className="flex flex-col items-center justify-center py-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-3 text-3xl md:text-4xl font-black font-mono">
                <span className={`px-4 py-2 rounded-xl border ${
                  activeRoll.d20 === 20
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                    : activeRoll.d20 === 1
                    ? 'bg-red-950/50 border-red-500 text-red-400'
                    : 'bg-zinc-900 border-zinc-700 text-white'
                }`}>
                  {activeRoll.d20}
                </span>
                <span className="text-zinc-500 text-2xl">+</span>
                <span className="text-amber-400 text-2xl font-bold">
                  {activeRoll.bonus >= 0 ? `${activeRoll.bonus}` : activeRoll.bonus}
                </span>
                <span className="text-zinc-500 text-2xl">=</span>
                <span className="text-white font-extrabold text-4xl">
                  {activeRoll.total}
                </span>
              </div>

              <div className="mt-2 text-xs font-mono">
                {activeRoll.d20 === 20 && (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Award size={14} /> Natürliche 20 — Kritischer Erfolg!
                  </span>
                )}
                {activeRoll.d20 === 1 && (
                  <span className="text-red-400 font-bold">
                    Natürliche 1 — Automatischer Misserfolg!
                  </span>
                )}
                {activeRoll.d20 > 1 && activeRoll.d20 < 20 && (
                  <span className="text-zinc-400">
                    Wurf: 1W20 ({activeRoll.d20}) + {activeRoll.bonus}
                  </span>
                )}
              </div>
            </div>

            {/* Target DC Checker */}
            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Schwierigkeitsgrad (SG / DC):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDC(prev => Math.max(5, prev - 1))}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs hover:bg-zinc-700"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white w-8 text-center">{targetDC}</span>
                  <button
                    type="button"
                    onClick={() => setTargetDC(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className={`p-2.5 rounded-xl text-center text-xs font-mono font-black tracking-wider flex items-center justify-center gap-1.5 ${
                activeRoll.d20 === 1 
                  ? 'bg-red-950/50 border border-red-500/40 text-red-300'
                  : activeRoll.d20 === 20 || activeRoll.total >= targetDC
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/50 border border-red-500/40 text-red-300'
              }`}>
                {activeRoll.d20 === 1 ? (
                  <>
                    <X size={15} /> MISSLUNGEN (Nat 1)
                  </>
                ) : activeRoll.d20 === 20 || activeRoll.total >= targetDC ? (
                  <>
                    <Check size={15} /> RETTUNGSWURF BESTANDEN! ({activeRoll.total} ≥ SG {targetDC})
                  </>
                ) : (
                  <>
                    <X size={15} /> RETTUNGSWURF MISSLUNGEN ({activeRoll.total} &lt; SG {targetDC})
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReroll}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{activeRoll.hasRerolled ? 'Nochmals wiederholen' : 'Wiederholen (Widerstandsfähigkeit)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRoll(null)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs font-mono rounded-xl transition-all cursor-pointer"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-amber-400" />
                <h4 className="text-base font-bold text-white">Rettungswürfe bearbeiten (Pathfinder)</h4>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Sync Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
                <Info size={14} className="text-amber-400" />
                <span>Modifikatoren errechnen sich automatisch aus den Attributen.</span>
              </div>
              <button
                type="button"
                onClick={syncModifiersFromAttributes}
                className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg font-mono font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
                title="Aktualisiert KO, GE und WE Modifikatoren sofort auf die aktuellen Attributswerte"
              >
                <RefreshCw size={12} className="text-amber-400" />
                <span>Aus Attributen synchronisieren</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Fortitude Edit */}
              <div className="p-4 bg-zinc-950/60 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                      1. Zähigkeit (Konstitution)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-mono">
                      KO: {koScore} ({formatPathfinderModifier(koMod)})
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">
                    Gesamt: +{calcSaveTotal({
                      ...editingSaves.fortitude,
                      abilityMod: autoSyncAttrs.fortitude ? koMod : editingSaves.fortitude.abilityMod
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Basis-RW</label>
                    <input
                      type="number"
                      value={editingSaves.fortitude.base}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        fortitude: { ...editingSaves.fortitude, base: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-zinc-400">KO-Mod</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSyncAttrs(p => ({ ...p, fortitude: !p.fortitude }));
                          if (!autoSyncAttrs.fortitude) {
                            setEditingSaves(p => ({ ...p, fortitude: { ...p.fortitude, abilityMod: koMod } }));
                          }
                        }}
                        className={`text-[9px] px-1 rounded ${autoSyncAttrs.fortitude ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {autoSyncAttrs.fortitude ? 'Auto (aktiv)' : 'Manuell'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={autoSyncAttrs.fortitude ? koMod : editingSaves.fortitude.abilityMod}
                      disabled={autoSyncAttrs.fortitude}
                      onChange={(e) => {
                        setAutoSyncAttrs(p => ({ ...p, fortitude: false }));
                        setEditingSaves({
                          ...editingSaves,
                          fortitude: { ...editingSaves.fortitude, abilityMod: parseInt(e.target.value, 10) || 0 }
                        });
                      }}
                      className={`w-full border rounded p-1.5 ${autoSyncAttrs.fortitude ? 'bg-zinc-950/80 border-emerald-500/30 text-emerald-300 cursor-not-allowed' : 'bg-zinc-900 border-zinc-750 text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Magie (Umhang)</label>
                    <input
                      type="number"
                      value={editingSaves.fortitude.magicMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        fortitude: { ...editingSaves.fortitude, magicMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Sonstiges</label>
                    <input
                      type="number"
                      value={editingSaves.fortitude.miscMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        fortitude: { ...editingSaves.fortitude, miscMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-mono">Situationsboni / Notizen</label>
                  <input
                    type="text"
                    value={editingSaves.fortitude.notes || ''}
                    onChange={(e) => setEditingSaves({
                      ...editingSaves,
                      fortitude: { ...editingSaves.fortitude, notes: e.target.value }
                    })}
                    placeholder="z.B. +2 gegen Gift & Lähmung"
                    className="w-full bg-zinc-900 border border-zinc-750 text-white text-xs font-mono rounded p-2"
                  />
                </div>
              </div>

              {/* Reflex Edit */}
              <div className="p-4 bg-zinc-950/60 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase font-mono">
                      2. Reflex (Geschicklichkeit)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40 font-mono">
                      GE: {geScore} ({formatPathfinderModifier(geMod)})
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">
                    Gesamt: +{calcSaveTotal({
                      ...editingSaves.reflex,
                      abilityMod: autoSyncAttrs.reflex ? geMod : editingSaves.reflex.abilityMod
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Basis-RW</label>
                    <input
                      type="number"
                      value={editingSaves.reflex.base}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        reflex: { ...editingSaves.reflex, base: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-zinc-400">GE-Mod</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSyncAttrs(p => ({ ...p, reflex: !p.reflex }));
                          if (!autoSyncAttrs.reflex) {
                            setEditingSaves(p => ({ ...p, reflex: { ...p.reflex, abilityMod: geMod } }));
                          }
                        }}
                        className={`text-[9px] px-1 rounded ${autoSyncAttrs.reflex ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {autoSyncAttrs.reflex ? 'Auto (aktiv)' : 'Manuell'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={autoSyncAttrs.reflex ? geMod : editingSaves.reflex.abilityMod}
                      disabled={autoSyncAttrs.reflex}
                      onChange={(e) => {
                        setAutoSyncAttrs(p => ({ ...p, reflex: false }));
                        setEditingSaves({
                          ...editingSaves,
                          reflex: { ...editingSaves.reflex, abilityMod: parseInt(e.target.value, 10) || 0 }
                        });
                      }}
                      className={`w-full border rounded p-1.5 ${autoSyncAttrs.reflex ? 'bg-zinc-950/80 border-amber-500/30 text-amber-300 cursor-not-allowed' : 'bg-zinc-900 border-zinc-750 text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Magie (Umhang)</label>
                    <input
                      type="number"
                      value={editingSaves.reflex.magicMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        reflex: { ...editingSaves.reflex, magicMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Sonstiges</label>
                    <input
                      type="number"
                      value={editingSaves.reflex.miscMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        reflex: { ...editingSaves.reflex, miscMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-mono">Situationsboni / Notizen</label>
                  <input
                    type="text"
                    value={editingSaves.reflex.notes || ''}
                    onChange={(e) => setEditingSaves({
                      ...editingSaves,
                      reflex: { ...editingSaves.reflex, notes: e.target.value }
                    })}
                    placeholder="z.B. +3 gegen Fallen (Fallengespür: W20+13), Entrinnen"
                    className="w-full bg-zinc-900 border border-zinc-750 text-white text-xs font-mono rounded p-2"
                  />
                </div>
              </div>

              {/* Will Edit */}
              <div className="p-4 bg-zinc-950/60 border border-purple-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400 uppercase font-mono">
                      3. Wille (Weisheit)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40 font-mono">
                      WE: {weScore} ({formatPathfinderModifier(weMod)})
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">
                    Gesamt: +{calcSaveTotal({
                      ...editingSaves.will,
                      abilityMod: autoSyncAttrs.will ? weMod : editingSaves.will.abilityMod
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Basis-RW</label>
                    <input
                      type="number"
                      value={editingSaves.will.base}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        will: { ...editingSaves.will, base: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-zinc-400">WE-Mod</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSyncAttrs(p => ({ ...p, will: !p.will }));
                          if (!autoSyncAttrs.will) {
                            setEditingSaves(p => ({ ...p, will: { ...p.will, abilityMod: weMod } }));
                          }
                        }}
                        className={`text-[9px] px-1 rounded ${autoSyncAttrs.will ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {autoSyncAttrs.will ? 'Auto (aktiv)' : 'Manuell'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={autoSyncAttrs.will ? weMod : editingSaves.will.abilityMod}
                      disabled={autoSyncAttrs.will}
                      onChange={(e) => {
                        setAutoSyncAttrs(p => ({ ...p, will: false }));
                        setEditingSaves({
                          ...editingSaves,
                          will: { ...editingSaves.will, abilityMod: parseInt(e.target.value, 10) || 0 }
                        });
                      }}
                      className={`w-full border rounded p-1.5 ${autoSyncAttrs.will ? 'bg-zinc-950/80 border-purple-500/30 text-purple-300 cursor-not-allowed' : 'bg-zinc-900 border-zinc-750 text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Magie (Umhang)</label>
                    <input
                      type="number"
                      value={editingSaves.will.magicMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        will: { ...editingSaves.will, magicMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Sonstiges</label>
                    <input
                      type="number"
                      value={editingSaves.will.miscMod || 0}
                      onChange={(e) => setEditingSaves({
                        ...editingSaves,
                        will: { ...editingSaves.will, miscMod: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="w-full bg-zinc-900 border border-zinc-750 text-white rounded p-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 font-mono">Situationsboni / Notizen</label>
                  <input
                    type="text"
                    value={editingSaves.will.notes || ''}
                    onChange={(e) => setEditingSaves({
                      ...editingSaves,
                      will: { ...editingSaves.will, notes: e.target.value }
                    })}
                    placeholder="z.B. +2 gegen Illusionen (Gnom-Bonus)"
                    className="w-full bg-zinc-900 border border-zinc-750 text-white text-xs font-mono rounded p-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-mono transition-all"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs font-mono transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
