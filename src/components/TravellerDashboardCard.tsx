import React, { FC, useState } from 'react';
import { 
  Compass, 
  Shield, 
  Activity, 
  Plus, 
  Minus, 
  RotateCcw, 
  HeartPulse, 
  AlertTriangle, 
  HelpCircle, 
  Radio, 
  Rocket, 
  Crosshair, 
  Dices,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { CharacterData, Stat } from '../types';
import { 
  parseTravellerCharacteristics, 
  formatTravellerDM, 
  getTravellerDM, 
  TRAVELLER_DIFFICULTIES 
} from '../utils/traveller';

interface TravellerDashboardCardProps {
  character: CharacterData;
  onUpdateStats: (newStats: Stat[]) => void;
  onUpdateCharacteristics?: (newChars: Stat[]) => void;
  onOpenDiceCalc?: (skillName?: string, attrName?: string) => void;
  isEditing?: boolean;
}

export const TravellerDashboardCard: FC<TravellerDashboardCardProps> = ({
  character,
  onUpdateStats,
  onUpdateCharacteristics,
  onOpenDiceCalc,
  isEditing = false,
}) => {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [damageInput, setDamageInput] = useState<string>('');
  const [armorInput, setArmorInput] = useState<number>(8);
  const [showQuickDamage, setShowQuickDamage] = useState<boolean>(false);

  const healthState = parseTravellerCharacteristics(
    character.characteristics || [],
    character.stats || []
  );

  const updateCharacteristicDamage = (code: string, newDamage: number) => {
    const chars = [...(character.characteristics || [])];
    const charIndex = chars.findIndex(c => (c?.label || '').toUpperCase() === (code || '').toUpperCase());
    
    if (charIndex >= 0) {
      chars[charIndex] = {
        ...chars[charIndex],
        damage: Math.max(0, newDamage)
      };
      if (onUpdateCharacteristics) {
        onUpdateCharacteristics(chars);
      }
    } else {
      // Also check stats list if characteristics wasn't set
      const stats = [...(character.stats || [])];
      const statIndex = stats.findIndex(s => (s?.label || '').toUpperCase().includes((code || '').toUpperCase()));
      if (statIndex >= 0) {
        stats[statIndex] = {
          ...stats[statIndex],
          damage: Math.max(0, newDamage)
        };
        onUpdateStats(stats);
      }
    }
  };

  // Automatic Traveller damage distributor:
  // Damage reduces END first; remaining goes to STR or DEX
  const applyAutoDamage = (amount: number) => {
    if (amount <= 0) return;

    let remaining = amount;
    const endBase = healthState.end.value;
    const currentEndDmg = healthState.end.damage;
    const endRemainingCapacity = Math.max(0, endBase - currentEndDmg);

    const endDamageToAdd = Math.min(remaining, endRemainingCapacity);
    const newEndDmg = currentEndDmg + endDamageToAdd;
    remaining -= endDamageToAdd;

    let newStrDmg = healthState.str.damage;
    let newDexDmg = healthState.dex.damage;

    if (remaining > 0) {
      // Allocate to STR first, then DEX
      const strBase = healthState.str.value;
      const strRemainingCapacity = Math.max(0, strBase - newStrDmg);
      const strDamageToAdd = Math.min(remaining, strRemainingCapacity);
      newStrDmg += strDamageToAdd;
      remaining -= strDamageToAdd;
    }

    if (remaining > 0) {
      // Allocate remaining to DEX
      newDexDmg += remaining;
    }

    // Apply updates
    const chars = [...(character.characteristics || [])];
    ['END', 'STR', 'DEX'].forEach(code => {
      const charIndex = chars.findIndex(c => (c?.label || '').toUpperCase() === (code || '').toUpperCase());
      if (charIndex >= 0) {
        const val = code === 'END' ? newEndDmg : code === 'STR' ? newStrDmg : newDexDmg;
        chars[charIndex] = { ...chars[charIndex], damage: val };
      }
    });

    if (onUpdateCharacteristics) {
      onUpdateCharacteristics(chars);
    }
    setDamageInput('');
  };

  const healAllDamage = () => {
    const chars = (character.characteristics || []).map(c => ({
      ...c,
      damage: 0
    }));
    if (onUpdateCharacteristics) {
      onUpdateCharacteristics(chars);
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-5 backdrop-blur-md relative overflow-hidden">
      {/* Sci-Fi Grid Overlay Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & UPP Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Compass size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                Universal Personality Profile
              </h3>
              <div className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono font-bold text-xs">
                UPP: {healthState.upp}
              </div>
              {healthState.totalDamage > 0 && (
                <div className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-mono font-bold text-xs animate-pulse">
                  Aktuell: {healthState.currentUpp}
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Klassisches 2D6 Sci-Fi RPG System • Mongoose / Classic Traveller
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="p-1.5 text-zinc-400 hover:text-blue-300 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 transition-colors"
            title="DM & Verwundungs-Regeln anzeigen"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={() => setShowQuickDamage(!showQuickDamage)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
              showQuickDamage 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
            }`}
          >
            <HeartPulse size={13} className="text-red-400" />
            <span>{showQuickDamage ? 'Schaden Rechner schließen' : 'Schaden erfassen'}</span>
          </button>
        </div>
      </div>

      {/* Rules & DM Breakdown Info Box */}
      {showFormulaInfo && (
        <div className="bg-zinc-950/90 border border-blue-500/30 rounded-xl p-4 text-xs font-mono space-y-3 text-zinc-300 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Sparkles size={14} /> Traveller 2D6 Regeln & Attributs-Modifikatoren (DM)
            </span>
            <span className="text-[10px] text-zinc-500">Kernmechanik: 2D6 + DM + Fertigkeit ≥ 8+</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400">Wert 0:</span> <strong className="text-red-400 font-bold ml-1">-3 DM</strong><br/>
              <span className="text-zinc-400">Wert 1-2:</span> <strong className="text-red-400 font-bold ml-1">-2 DM</strong><br/>
              <span className="text-zinc-400">Wert 3-5:</span> <strong className="text-amber-400 font-bold ml-1">-1 DM</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400">Wert 6-8:</span> <strong className="text-zinc-300 font-bold ml-1">+0 DM</strong><br/>
              <span className="text-zinc-400">Wert 9-11:</span> <strong className="text-blue-400 font-bold ml-1">+1 DM</strong><br/>
              <span className="text-zinc-400">Wert 12-14:</span> <strong className="text-emerald-400 font-bold ml-1">+2 DM</strong>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800 col-span-2">
              <strong className="text-blue-300 block mb-1">Verwundungssystem:</strong>
              <span className="text-zinc-400 text-[10px] leading-relaxed">
                Schaden nach Panzerung wird direkt von den physischen Attributen abgezogen (zuerst <strong>Ausdauer / END</strong>, dann <strong>STR oder DEX</strong>).
                Sinkt 1 Attribut auf 0: Bewusstlos. Sinken 2 auf 0: Sterbend. Sinken alle 3 auf 0: Tod.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Characteristics Grid (UPP) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          healthState.str,
          healthState.dex,
          healthState.end,
          healthState.int,
          healthState.edu,
          healthState.soc
        ].map((c) => {
          const isDamaged = c.damage > 0;
          const isZero = c.currentValue === 0;

          return (
            <div
              key={c.code}
              className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all relative group ${
                isZero
                  ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : isDamaged
                  ? 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-zinc-950/80 border-blue-500/20 hover:border-blue-500/40'
              }`}
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-black text-zinc-300 uppercase tracking-widest">{c.code}</span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${
                  c.effectiveDm > 0 ? 'bg-blue-500/20 text-blue-300' :
                  c.effectiveDm === 0 ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  DM {formatTravellerDM(c.effectiveDm)}
                </span>
              </div>

              {/* Main Value Display */}
              <div className="my-1 flex flex-col items-center">
                <span className={`text-2xl font-black font-mono tracking-tight leading-none ${
                  isZero ? 'text-red-500' : isDamaged ? 'text-amber-400' : 'text-white'
                }`}>
                  {c.currentValue}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Basis: {c.value} {isDamaged ? `(-${c.damage})` : ''}
                </span>
              </div>

              {/* Label */}
              <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider text-center truncate w-full">
                {c.name}
              </span>

              {/* Damage Adjustment buttons on physical characteristics */}
              {c.isPhysical && (
                <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-zinc-800/80 gap-1">
                  <button
                    onClick={() => updateCharacteristicDamage(c.code, c.damage + 1)}
                    className="w-5 h-5 bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 rounded flex items-center justify-center text-xs font-mono transition-colors"
                    title={`1 Schaden auf ${c.code} anrechnen`}
                  >
                    -
                  </button>
                  <span className={`text-[9px] font-mono font-bold ${c.damage > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                    {c.damage > 0 ? `-${c.damage}` : 'OK'}
                  </span>
                  <button
                    onClick={() => updateCharacteristicDamage(c.code, Math.max(0, c.damage - 1))}
                    className="w-5 h-5 bg-zinc-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-zinc-400 rounded flex items-center justify-center text-xs font-mono transition-colors"
                    title={`1 Schaden auf ${c.code} heilen`}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Damage & Health Track Calculator */}
      {showQuickDamage && (
        <div className="bg-zinc-950/90 border border-red-500/30 rounded-xl p-4 space-y-4 font-mono animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
              <HeartPulse size={16} />
              <span>Traveller Verwundungs- & Schadensverteiler</span>
            </div>
            {healthState.totalDamage > 0 && (
              <button
                onClick={healAllDamage}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/50"
              >
                <RotateCcw size={11} /> Alle Wunden heilen (Reset)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Input direct damage */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Eingehender Trefferschaden:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="z.B. 12"
                  value={damageInput}
                  onChange={(e) => setDamageInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Armor deduction */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-bold">Rüstungsschutz (Panzerung):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={armorInput}
                  onChange={(e) => setArmorInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Calculate and apply button */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <button
                onClick={() => {
                  const rawDmg = parseInt(damageInput, 10) || 0;
                  const netDmg = Math.max(0, rawDmg - armorInput);
                  applyAutoDamage(netDmg);
                }}
                disabled={!damageInput}
                className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Zap size={14} />
                <span>Schaden anwenden ({Math.max(0, (parseInt(damageInput, 10) || 0) - armorInput)} Netto)</span>
              </button>
            </div>
          </div>

          {/* Physical Health Progress Bar */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Gesamte Physische Belastbarkeit (END + STR + DEX):</span>
              <span className="font-bold text-white">
                {healthState.totalPhysicalCurrent} / {healthState.totalPhysicalMax} ({Math.round((healthState.totalPhysicalCurrent / healthState.totalPhysicalMax) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-300 ${
                  healthState.totalPhysicalCurrent <= 0 ? 'bg-red-600' :
                  healthState.totalPhysicalCurrent <= (healthState.totalPhysicalMax / 3) ? 'bg-red-500' :
                  healthState.totalPhysicalCurrent <= (healthState.totalPhysicalMax * 0.7) ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(0, (healthState.totalPhysicalCurrent / healthState.totalPhysicalMax) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Starship & Tactical Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Rocket size={18} />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono block">Schiffsstatus</span>
            <span className="text-xs font-bold text-zinc-200 font-mono">Typ S Scout "Seeker IV"</span>
            <span className="text-[10px] text-zinc-400 font-mono block">Sprung 2 • 2 Schiff-Anteile</span>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono block">Panzerung & Schutz</span>
            <span className="text-xs font-bold text-zinc-200 font-mono">TL 10 Kevlar-Mesh (Prot 8)</span>
            <span className="text-[10px] text-zinc-400 font-mono block">45 RAD Strahlungsschutz</span>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Activity size={18} />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono block">Aktueller Zustand</span>
            <span className={`text-xs font-bold font-mono ${healthState.totalDamage > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {healthState.statusLabel}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block">
              {healthState.totalDamage === 0 ? 'Voll einsatzfähig' : `${healthState.totalDamage} Punkte Wundabzug`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
