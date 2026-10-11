import React, { useState } from 'react';
import { 
  Activity, 
  Dices, 
  Plus, 
  Minus, 
  Edit3, 
  Check, 
  X, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  Shield,
  Zap,
  Calculator
} from 'lucide-react';
import { CharacterData, Stat } from '../types';
import { 
  PATHFINDER_CORE_ATTRIBUTES, 
  calculatePathfinderModifier, 
  formatPathfinderModifier, 
  getOrInitializePathfinderCharacteristics,
  PathfinderCoreAttributeMeta
} from '../utils/pathfinder';

interface PathfinderAttributesCardProps {
  character: CharacterData;
  onUpdateCharacteristics: (newChars: Stat[]) => void;
  onOpenDiceCalc?: (attrName?: string, mod?: number) => void;
  isEditing?: boolean;
}

interface AttributeRollResult {
  attrKey: string;
  attrName: string;
  d20: number;
  modifier: number;
  total: number;
  dc: number;
  hasRerolled?: boolean;
}

export const PathfinderAttributesCard: React.FC<PathfinderAttributesCardProps> = ({
  character,
  onUpdateCharacteristics,
  onOpenDiceCalc,
  isEditing = false,
}) => {
  // Extract or initialize the 6 core Pathfinder attributes
  const characteristics = getOrInitializePathfinderCharacteristics(character);

  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);
  const [activeRoll, setActiveRoll] = useState<AttributeRollResult | null>(null);
  const [targetDC, setTargetDC] = useState<number>(15);
  const [tempBuffs, setTempBuffs] = useState<Record<string, number>>({});

  // Helper to get stat by attribute meta
  const getStatForMeta = (meta: PathfinderCoreAttributeMeta): Stat => {
    const found = characteristics.find(c => {
      const l = (c?.label || '').toUpperCase().trim();
      return meta.aliases.includes(l);
    });

    if (found) return found;

    return {
      label: meta.shortName,
      value: 10,
      secondary: "+0",
      modifier: 0
    };
  };

  const handleAdjustValue = (meta: PathfinderCoreAttributeMeta, delta: number) => {
    const currentChars = [...characteristics];
    const index = currentChars.findIndex(c => {
      const l = (c?.label || '').toUpperCase().trim();
      return meta.aliases.includes(l);
    });

    if (index >= 0) {
      const currentVal = typeof currentChars[index].value === 'number' 
        ? currentChars[index].value 
        : parseInt(String(currentChars[index].value).replace(/[^0-9-]/g, ''), 10) || 10;
      
      const newVal = Math.max(1, Math.min(50, (currentVal as number) + delta));
      const newMod = calculatePathfinderModifier(newVal);

      currentChars[index] = {
        ...currentChars[index],
        value: newVal,
        secondary: formatPathfinderModifier(newMod)
      };
      onUpdateCharacteristics(currentChars);
    } else {
      const newVal = Math.max(1, 10 + delta);
      const newMod = calculatePathfinderModifier(newVal);
      currentChars.push({
        label: meta.shortName,
        value: newVal,
        secondary: formatPathfinderModifier(newMod)
      });
      onUpdateCharacteristics(currentChars);
    }
  };

  const handleSetValue = (meta: PathfinderCoreAttributeMeta, rawVal: number) => {
    const newVal = Math.max(1, Math.min(50, isNaN(rawVal) ? 10 : rawVal));
    const newMod = calculatePathfinderModifier(newVal);
    const currentChars = [...characteristics];
    const index = currentChars.findIndex(c => {
      const l = (c?.label || '').toUpperCase().trim();
      return meta.aliases.includes(l);
    });

    if (index >= 0) {
      currentChars[index] = {
        ...currentChars[index],
        value: newVal,
        secondary: formatPathfinderModifier(newMod)
      };
    } else {
      currentChars.push({
        label: meta.shortName,
        value: newVal,
        secondary: formatPathfinderModifier(newMod)
      });
    }
    onUpdateCharacteristics(currentChars);
  };

  const handleAdjustBuff = (attrKey: string, delta: number) => {
    setTempBuffs(prev => {
      const current = prev[attrKey] || 0;
      const next = current + delta;
      if (next === 0) {
        const copy = { ...prev };
        delete copy[attrKey];
        return copy;
      }
      return { ...prev, [attrKey]: next };
    });
  };

  const executeAttributeRoll = (meta: PathfinderCoreAttributeMeta) => {
    const stat = getStatForMeta(meta);
    const rawVal = typeof stat.value === 'number' 
      ? stat.value 
      : parseInt(String(stat.value).replace(/[^0-9-]/g, ''), 10) || 10;
    const baseMod = calculatePathfinderModifier(rawVal);
    const buff = tempBuffs[meta.key] || 0;
    const totalMod = baseMod + buff;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + totalMod;

    setActiveRoll({
      attrKey: meta.key,
      attrName: `${meta.fullName} (${meta.shortName})`,
      d20,
      modifier: totalMod,
      total,
      dc: targetDC,
      hasRerolled: false
    });
  };

  const handleReroll = () => {
    if (!activeRoll) return;
    const newD20 = Math.floor(Math.random() * 20) + 1;
    const newTotal = newD20 + activeRoll.modifier;
    setActiveRoll({
      ...activeRoll,
      d20: newD20,
      total: newTotal,
      hasRerolled: true
    });
  };

  return (
    <div className="bg-zinc-900/40 border border-amber-500/25 rounded-2xl p-5 md:p-6 backdrop-blur-md relative overflow-hidden shadow-lg shadow-black/20" id="pathfinder-grundwerte-card">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Activity size={20} className="stroke-[2.2px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight font-sans">
                Grundwerte & Attribute
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                Pathfinder Core
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Basiswerte, Modifikatoren [ (Wert - 10) / 2 ] & Attributsproben
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setExpandedDetails(!expandedDetails)}
            className="px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-300 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            title="Wirkungsbereiche und abhängige Werte anzeigen"
          >
            {expandedDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{expandedDetails ? 'Details einklappen' : 'Wirkungsbereiche'}</span>
          </button>

          {onOpenDiceCalc && (
            <button
              type="button"
              onClick={() => onOpenDiceCalc()}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              title="Zum Probenrechner wechseln"
            >
              <Calculator size={13} />
              <span>Probenrechner</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Core Attributes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PATHFINDER_CORE_ATTRIBUTES.map((meta) => {
          const stat = getStatForMeta(meta);
          const rawVal = typeof stat.value === 'number' 
            ? stat.value 
            : parseInt(String(stat.value).replace(/[^0-9-]/g, ''), 10) || 10;
          const baseMod = calculatePathfinderModifier(rawVal);
          const buff = tempBuffs[meta.key] || 0;
          const totalMod = baseMod + buff;

          return (
            <div
              key={meta.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 group relative ${meta.color.bg} ${meta.color.border}`}
            >
              {/* Top Row: Short & Full Name */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-base font-black tracking-wider font-mono ${meta.color.text}`}>
                    {meta.shortName}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight hidden sm:inline">
                    {meta.fullName}
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${meta.color.badge}`}>
                  {meta.englishName}
                </span>
              </div>

              {/* Main Numbers: Big Modifier + Base Score */}
              <div className="my-1 text-center">
                {/* Modifier as primary interactive element */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                    {formatPathfinderModifier(totalMod)}
                  </span>
                  {buff !== 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1 py-0.5 rounded">
                      {buff > 0 ? `+${buff}` : buff}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mt-0.5">
                  Modifikator
                </span>
              </div>

              {/* Base Score Row with +/- Controls */}
              <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <span>Wert:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={rawVal}
                      onChange={(e) => handleSetValue(meta, parseInt(e.target.value, 10))}
                      className="w-12 bg-zinc-950 border border-amber-500/40 text-amber-300 font-bold px-1 py-0.5 rounded text-xs text-center font-mono"
                    />
                  ) : (
                    <strong className="text-zinc-200 font-bold">{rawVal}</strong>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustValue(meta, -1)}
                    className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors text-xs cursor-pointer"
                    title={`${meta.fullName} -1`}
                  >
                    <Minus size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustValue(meta, 1)}
                    className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors text-xs cursor-pointer"
                    title={`${meta.fullName} +1`}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Quick Action Buttons: Roll Check & Dice Calc */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => executeAttributeRoll(meta)}
                  className="flex-1 py-1.5 px-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-zinc-200 hover:text-amber-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                  title={`W20 + ${formatPathfinderModifier(totalMod)} für ${meta.fullName}-Probe würfeln`}
                >
                  <Dices size={12} className="text-amber-400" />
                  <span>Probe</span>
                </button>

                {/* Buff toggle button */}
                <button
                  type="button"
                  onClick={() => handleAdjustBuff(meta.key, buff === 0 ? 2 : buff === 2 ? 4 : -buff)}
                  className={`py-1.5 px-1.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    buff > 0 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={buff === 0 ? "Temporären Zauber-Buff (+2/+4) aktivieren" : `Aktueller Bonus: +${buff}. Klick zum Ändern/Entfernen`}
                >
                  <Sparkles size={11} />
                </button>
              </div>

              {/* Expanded Mechanics info per attribute */}
              {expandedDetails && (
                <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] font-mono space-y-1.5">
                  {meta.associatedSaves.length > 0 && (
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-bold">Rettungswurf:</span>
                      <span className="text-zinc-300">{meta.associatedSaves.join(', ')}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Kernmechaniken:</span>
                    <ul className="text-zinc-400 list-disc list-inside space-y-0.5 text-[9px]">
                      {meta.keyMechanics.map((mech, mIdx) => (
                        <li key={mIdx}>{mech}</li>
                      ))}
                    </ul>
                  </div>
                  {meta.associatedSkills.length > 0 && (
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-bold">Fertigkeiten:</span>
                      <span className="text-zinc-400 text-[9px] leading-tight block">
                        {meta.associatedSkills.slice(0, 4).join(', ')}{meta.associatedSkills.length > 4 ? '…' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Roll Result Modal / Popup */}
      {activeRoll && (
        <div className="mt-5 p-4 rounded-xl bg-zinc-950/90 border border-amber-500/40 shadow-2xl relative animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => setActiveRoll(null)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={15} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                  <Dices size={14} /> Attributsprobe: {activeRoll.attrName}
                </span>
                {activeRoll.d20 === 20 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black animate-pulse">
                    NATÜRLICHE 20!
                  </span>
                )}
                {activeRoll.d20 === 1 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-black">
                    PATZER (NATÜRLICHE 1)
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span>Wurf: <strong className="text-white font-bold">{activeRoll.d20}</strong> (W20)</span>
                <span>+</span>
                <span>Modifikator: <strong className="text-white font-bold">{formatPathfinderModifier(activeRoll.modifier)}</strong></span>
                <span>=</span>
                <span className="text-sm font-black text-amber-400">Gesamt {activeRoll.total}</span>
              </div>
            </div>

            {/* Target DC & Result Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
                <span className="text-[10px] font-mono text-zinc-400">Ziel-SG:</span>
                <input
                  type="number"
                  value={targetDC}
                  onChange={(e) => {
                    const newDC = parseInt(e.target.value, 10) || 10;
                    setTargetDC(newDC);
                    if (activeRoll) setActiveRoll({ ...activeRoll, dc: newDC });
                  }}
                  className="w-10 bg-transparent text-center font-mono text-xs font-bold text-white outline-none"
                />
              </div>

              <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 ${
                activeRoll.total >= targetDC
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}>
                {activeRoll.total >= targetDC ? <Check size={14} /> : <X size={14} />}
                <span>{activeRoll.total >= targetDC ? 'Bestanden' : 'Misslungen'}</span>
              </div>

              <button
                type="button"
                onClick={handleReroll}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                title="Wurf wiederholen"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
