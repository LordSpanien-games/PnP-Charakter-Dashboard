import React, { FC, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Sparkles,
  Award,
  Plus,
  Edit2,
  Check,
  X,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { CharacterData, ExperienceData, ExperienceHistoryEntry } from '../types';
import {
  calculateXpStatus,
  extractCharacterLevel,
  getXpThresholdForLevel,
  PATHFINDER_XP_TABLE
} from '../utils/experience';
import { isPathfinder } from '../utils/pathfinder';

interface ExperienceCardProps {
  character: CharacterData;
  onUpdateExperience: (updatedExp: ExperienceData) => void;
  onOpenLevelUpModal: () => void;
  isEditing?: boolean;
}

export const ExperienceCard: FC<ExperienceCardProps> = ({
  character,
  onUpdateExperience,
  onOpenLevelUpModal,
  isEditing = false
}) => {
  const currentExp: ExperienceData = character.experience || {
    current: 0,
    track: 'medium',
    history: []
  };

  const track = currentExp.track || 'medium';
  const xpStatus = calculateXpStatus(currentExp.current, character.subTitle, track);

  const [isAddingXp, setIsAddingXp] = useState(false);
  const [addAmount, setAddAmount] = useState<string>('');
  const [addReason, setAddReason] = useState<string>('');
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [editCurrentVal, setEditCurrentVal] = useState<string>(currentExp.current.toString());
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackHelp, setShowTrackHelp] = useState(false);

  const handleApplyAddXp = () => {
    const num = parseInt(addAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num <= 0) return;

    const newCurrent = currentExp.current + num;
    const newEntry: ExperienceHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: num,
      reason: addReason.trim() || 'EP erhalten',
      totalAfter: newCurrent
    };

    const nextLvl = getXpThresholdForLevel(xpStatus.nextLevel, track);

    onUpdateExperience({
      current: newCurrent,
      nextLevel: nextLvl,
      track,
      history: [newEntry, ...(currentExp.history || [])]
    });

    setAddAmount('');
    setAddReason('');
    setIsAddingXp(false);
  };

  const handleSaveDirectCurrent = () => {
    const num = parseInt(editCurrentVal.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < 0) {
      setIsEditingCurrent(false);
      return;
    }

    const nextLvl = getXpThresholdForLevel(xpStatus.nextLevel, track);
    onUpdateExperience({
      ...currentExp,
      current: num,
      nextLevel: nextLvl
    });
    setIsEditingCurrent(false);
  };

  const handleSetTrack = (newTrack: 'fast' | 'medium' | 'slow') => {
    const nextLvl = getXpThresholdForLevel(xpStatus.nextLevel, newTrack);
    onUpdateExperience({
      ...currentExp,
      track: newTrack,
      nextLevel: nextLvl
    });
  };

  const handleQuickAdd = (amount: number) => {
    const newCurrent = currentExp.current + amount;
    const newEntry: ExperienceHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount,
      reason: `+${amount.toLocaleString('de-DE')} EP Schnellgutschrift`,
      totalAfter: newCurrent
    };

    const nextLvl = getXpThresholdForLevel(xpStatus.nextLevel, track);

    onUpdateExperience({
      current: newCurrent,
      nextLevel: nextLvl,
      track,
      history: [newEntry, ...(currentExp.history || [])]
    });
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 md:p-5 backdrop-blur-md relative overflow-hidden">
      {/* Ready for Level Up Glowing Banner */}
      {xpStatus.isReadyForLevelUp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/50 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Sparkles size={18} className="animate-spin [animation-duration:6s]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-300">
                  Stufenaufstieg bereit!
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black">
                  Stufe {xpStatus.nextLevel} verfügbar
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 mt-0.5">
                Du hast {currentExp.current.toLocaleString('de-DE')} EP gesammelt (erforderlich: {xpStatus.nextLevelThresholdXp.toLocaleString('de-DE')} EP).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLevelUpModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-105 transition-all cursor-pointer"
            id="btn-level-up-xp-banner"
          >
            <TrendingUp size={15} className="stroke-[2.5]" />
            <span>Jetzt Aufsteigen (Stufe {xpStatus.nextLevel})</span>
          </button>
        </motion.div>
      )}

      {/* Main Header & Level Progression */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Erfahrungspunkte & Stufenfortschritt
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                Stufe {xpStatus.currentLevel}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Ziel für Stufe {xpStatus.nextLevel}:{' '}
              <strong className="text-amber-400">
                {xpStatus.nextLevelThresholdXp.toLocaleString('de-DE')} EP
              </strong>{' '}
              {xpStatus.remainingXp > 0 ? (
                <span>(Noch {xpStatus.remainingXp.toLocaleString('de-DE')} EP)</span>
              ) : (
                <span className="text-emerald-400 font-bold">✓ Ziel erreicht!</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddingXp(!isAddingXp)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-add-xp"
          >
            <Plus size={13} />
            <span>EP vergeben</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevelUpModal}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Stufenaufstiegs-Helfer öffnen"
            id="btn-open-levelup-from-xp"
          >
            <TrendingUp size={13} className="text-amber-400" />
            <span>Aufstiegs-Helfer</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Numerical Metrics */}
      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Aktuelle EP:</span>
            {isEditingCurrent ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editCurrentVal}
                  onChange={(e) => setEditCurrentVal(e.target.value)}
                  className="w-24 px-2 py-0.5 bg-black border border-amber-500 rounded text-amber-300 text-xs font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveDirectCurrent}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCurrent(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-400"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditCurrentVal(currentExp.current.toString());
                  setIsEditingCurrent(true);
                }}
                className="group flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold"
                title="Klicken, um EP direkt zu bearbeiten"
              >
                <span className="text-base font-black">
                  {currentExp.current.toLocaleString('de-DE')}
                </span>
                <Edit2 size={11} className="opacity-0 group-hover:opacity-100 text-zinc-500 transition-opacity" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[11px]">
              Stufe {xpStatus.currentLevel} ({xpStatus.currentLevelFloorXp.toLocaleString('de-DE')})
            </span>
            <span className="text-zinc-600">→</span>
            <span className="text-amber-400 font-bold">
              Stufe {xpStatus.nextLevel} ({xpStatus.nextLevelThresholdXp.toLocaleString('de-DE')})
            </span>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="w-full bg-zinc-950 border border-zinc-800 h-3.5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, xpStatus.progressPercent)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              xpStatus.isReadyForLevelUp
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse'
                : 'bg-gradient-to-r from-orange-600 to-amber-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>{xpStatus.progressPercent}% Fortschritt bis Stufe {xpStatus.nextLevel}</span>
          <span>
            {xpStatus.remainingXp > 0
              ? `Noch ${xpStatus.remainingXp.toLocaleString('de-DE')} EP`
              : 'Stufenaufstieg freigeschaltet'}
          </span>
        </div>
      </div>

      {/* Quick Add Form (Collapsible) */}
      <AnimatePresence>
        {isAddingXp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 pt-3 border-t border-zinc-800/80"
          >
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <span className="text-xs font-mono font-bold text-amber-400 block">
                Erfahrungspunkte hinzufügen
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                    Betrag (EP)
                  </label>
                  <input
                    type="number"
                    placeholder="z.B. 500"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                    Begründung / Quest (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Höhlentroll besiegt, Quest-Belohnung"
                    value={addReason}
                    onChange={(e) => setAddReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-500 mr-1">Schnellwahl:</span>
                  {[100, 250, 500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAddAmount(val.toString())}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-[10px] font-mono text-zinc-300 hover:text-amber-300 rounded cursor-pointer"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingXp(false)}
                    className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAddXp}
                    disabled={!addAmount}
                    className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    EP buchen
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pathfinder Track Selector & History Toggle */}
      {isPathfinder(character) && (
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Pathfinder Aufstiegstempo:</span>
            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => handleSetTrack('slow')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  track === 'slow' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Langsam: Kampagnen mit viel Erkundung"
              >
                Langsam
              </button>
              <button
                type="button"
                onClick={() => handleSetTrack('medium')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  track === 'medium' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mittel (Standard): Empfohlenes Pathfinder Tempo"
              >
                Mittel (Std.)
              </button>
              <button
                type="button"
                onClick={() => handleSetTrack('fast')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  track === 'fast' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Schnell: Schnelle Level-Aufstiege"
              >
                Schnell
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <History size={12} />
            <span>EP-Logbuch ({currentExp.history?.length || 0})</span>
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      )}

      {/* EP History Entries */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3 pt-2 border-t border-zinc-800"
          >
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {!currentExp.history || currentExp.history.length === 0 ? (
                <p className="text-[11px] font-mono text-zinc-500 text-center py-2">
                  Noch keine EP-Einträge protokolliert.
                </p>
              ) : (
                currentExp.history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-[11px] font-mono bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">
                        +{entry.amount.toLocaleString('de-DE')} EP
                      </span>
                      <span className="text-zinc-300">{entry.reason}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
                      <span>{entry.timestamp}</span>
                      <span>(Stand: {entry.totalAfter.toLocaleString('de-DE')})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
