import React, { FC, useState } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Plus, 
  Minus, 
  Edit3, 
  RotateCcw, 
  Zap,
  Brain,
  Users,
  Eye
} from 'lucide-react';
import { CharacterData, ShadowrunLimitData } from '../types';
import { calculateShadowrunLimits } from '../utils/limits';

interface ShadowrunLimitsCardProps {
  character: CharacterData;
  onUpdateLimits: (limits: ShadowrunLimitData) => void;
  isEditing?: boolean;
}

export const ShadowrunLimitsCard: FC<ShadowrunLimitsCardProps> = ({
  character,
  onUpdateLimits,
  isEditing = false,
}) => {
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [showEditMods, setShowEditMods] = useState(false);

  const limits = calculateShadowrunLimits(
    character.characteristics || [],
    character.stats || [],
    character.limits
  );

  const custom = character.limits || {};

  const handleModChange = (key: 'physicalMod' | 'mentalMod' | 'socialMod' | 'astralMod', delta: number) => {
    const current = custom[key] || 0;
    onUpdateLimits({
      ...custom,
      [key]: current + delta
    });
  };

  const handleOverrideChange = (key: 'physicalOverride' | 'mentalOverride' | 'socialOverride' | 'astralOverride', val: string) => {
    const num = val === '' ? undefined : parseInt(val, 10);
    onUpdateLimits({
      ...custom,
      [key]: isNaN(num as number) ? undefined : num
    });
  };

  const resetLimits = () => {
    onUpdateLimits({});
    setShowEditMods(false);
  };

  return (
    <div className="bg-zinc-900/60 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
              Aktions-Limits (SR5)
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Maximale Erfolge pro Probe (automatisch aus Attributen berechnet)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="p-1.5 text-zinc-400 hover:text-cyan-300 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 transition-colors"
            title="Formel-Details anzeigen"
          >
            <HelpCircle size={15} />
          </button>
          <button
            onClick={() => setShowEditMods(!showEditMods)}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors flex items-center gap-1 ${
              showEditMods ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Edit3 size={12} />
            <span>{showEditMods ? 'Fertig' : 'Modifikatoren'}</span>
          </button>
        </div>
      </div>

      {/* Formula Breakdown Dropdown Info */}
      {showFormulaInfo && (
        <div className="bg-zinc-950/90 border border-cyan-500/30 rounded-xl p-3 text-xs font-mono space-y-2 text-zinc-300 animate-fadeIn">
          <p className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] border-b border-zinc-800 pb-1">
            Formeln zur Selbstberechnung (Shadowrun 5)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <strong className="text-cyan-300">Körperlich:</strong> <br />
              <span className="text-zinc-400">[(STÄ × 2) + KON + REA] / 3</span><br />
              <span className="text-zinc-500 text-[10px]">Basis: [({limits.sta} × 2) + {limits.kon} + {limits.rea}] / 3 = {limits.physicalBase}</span>
            </div>
            <div>
              <strong className="text-purple-300">Geistig:</strong> <br />
              <span className="text-zinc-400">[(LOG × 2) + INT + WIL] / 3</span><br />
              <span className="text-zinc-500 text-[10px]">Basis: [({limits.log} × 2) + {limits.int} + {limits.wil}] / 3 = {limits.mentalBase}</span>
            </div>
            <div>
              <strong className="text-amber-300">Sozial:</strong> <br />
              <span className="text-zinc-400">[(CHA × 2) + WIL + Essenz] / 3</span><br />
              <span className="text-zinc-500 text-[10px]">Basis: [({limits.cha} × 2) + {limits.wil} + {limits.ess}] / 3 = {limits.socialBase}</span>
            </div>
            <div>
              <strong className="text-emerald-300">Astral:</strong> <br />
              <span className="text-zinc-400">Höchster Wert aus Geistig / Sozial</span><br />
              <span className="text-zinc-500 text-[10px]">Basis: Max({limits.mentalBase}, {limits.socialBase}) = {limits.astralBase}</span>
            </div>
          </div>
        </div>
      )}

      {/* Limits Main Display Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Physical Limit */}
        <div className="bg-zinc-950/80 border border-cyan-500/30 p-3 rounded-xl flex flex-col items-center relative group">
          <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
            <Zap size={14} />
            <span className="text-[10px] uppercase font-bold font-mono">Körperlich</span>
          </div>
          <span className="text-2xl font-black font-mono text-cyan-300 tracking-tight">
            {limits.physicalTotal}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
            Basis: {limits.physicalBase}
            {custom.physicalMod ? ` (${custom.physicalMod > 0 ? '+' : ''}${custom.physicalMod})` : ''}
          </span>

          {showEditMods && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-800 w-full justify-center">
              <button
                onClick={() => handleModChange('physicalMod', -1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-cyan-400 w-6 text-center font-bold">
                {custom.physicalMod || 0}
              </span>
              <button
                onClick={() => handleModChange('physicalMod', 1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Mental Limit */}
        <div className="bg-zinc-950/80 border border-purple-500/30 p-3 rounded-xl flex flex-col items-center relative group">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1">
            <Brain size={14} />
            <span className="text-[10px] uppercase font-bold font-mono">Geistig</span>
          </div>
          <span className="text-2xl font-black font-mono text-purple-300 tracking-tight">
            {limits.mentalTotal}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
            Basis: {limits.mentalBase}
            {custom.mentalMod ? ` (${custom.mentalMod > 0 ? '+' : ''}${custom.mentalMod})` : ''}
          </span>

          {showEditMods && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-800 w-full justify-center">
              <button
                onClick={() => handleModChange('mentalMod', -1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-purple-400 w-6 text-center font-bold">
                {custom.mentalMod || 0}
              </span>
              <button
                onClick={() => handleModChange('mentalMod', 1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Social Limit */}
        <div className="bg-zinc-950/80 border border-amber-500/30 p-3 rounded-xl flex flex-col items-center relative group">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Users size={14} />
            <span className="text-[10px] uppercase font-bold font-mono">Sozial</span>
          </div>
          <span className="text-2xl font-black font-mono text-amber-300 tracking-tight">
            {limits.socialTotal}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
            Basis: {limits.socialBase}
            {custom.socialMod ? ` (${custom.socialMod > 0 ? '+' : ''}${custom.socialMod})` : ''}
          </span>

          {showEditMods && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-800 w-full justify-center">
              <button
                onClick={() => handleModChange('socialMod', -1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-amber-400 w-6 text-center font-bold">
                {custom.socialMod || 0}
              </span>
              <button
                onClick={() => handleModChange('socialMod', 1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Astral Limit */}
        <div className="bg-zinc-950/80 border border-emerald-500/30 p-3 rounded-xl flex flex-col items-center relative group">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <Eye size={14} />
            <span className="text-[10px] uppercase font-bold font-mono">Astral</span>
          </div>
          <span className="text-2xl font-black font-mono text-emerald-300 tracking-tight">
            {limits.astralTotal}
          </span>
          <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
            Basis: {limits.astralBase}
            {custom.astralMod ? ` (${custom.astralMod > 0 ? '+' : ''}${custom.astralMod})` : ''}
          </span>

          {showEditMods && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-800 w-full justify-center">
              <button
                onClick={() => handleModChange('astralMod', -1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-emerald-400 w-6 text-center font-bold">
                {custom.astralMod || 0}
              </span>
              <button
                onClick={() => handleModChange('astralMod', 1)}
                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center text-xs font-mono"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Inputs Panel */}
      {showEditMods && (
        <div className="pt-3 border-t border-zinc-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px]">Manuelle Überschreibungen (optional):</span>
            <button
              onClick={resetLimits}
              className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={10} /> Zurücksetzen
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[9px] text-zinc-500">Körperlich Festwert</label>
              <input
                type="number"
                placeholder={limits.physicalBase.toString()}
                value={custom.physicalOverride !== undefined ? custom.physicalOverride : ''}
                onChange={(e) => handleOverrideChange('physicalOverride', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500">Geistig Festwert</label>
              <input
                type="number"
                placeholder={limits.mentalBase.toString()}
                value={custom.mentalOverride !== undefined ? custom.mentalOverride : ''}
                onChange={(e) => handleOverrideChange('mentalOverride', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500">Sozial Festwert</label>
              <input
                type="number"
                placeholder={limits.socialBase.toString()}
                value={custom.socialOverride !== undefined ? custom.socialOverride : ''}
                onChange={(e) => handleOverrideChange('socialOverride', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] text-zinc-500">Astral Festwert</label>
              <input
                type="number"
                placeholder={limits.astralBase.toString()}
                value={custom.astralOverride !== undefined ? custom.astralOverride : ''}
                onChange={(e) => handleOverrideChange('astralOverride', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
