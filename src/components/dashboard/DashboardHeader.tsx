import React, { FC } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Save,
  History,
  TrendingUp,
  FolderOpen,
  FolderArchive,
  Rocket,
  Sparkles,
  Bot,
  Plus,
  User,
  Scroll,
  Calculator,
  RefreshCw,
  Edit2,
  Check,
  Swords,
  Moon
} from "lucide-react";
import { CharacterData, Stat } from "../../types";
import { StatCard } from "../common/StatCard";
import { Input } from "../common/Input";

export interface PresetItem {
  id: string;
  name: string;
  systemLabel: string;
  system: CharacterData['system'];
  data: CharacterData;
}

export interface DashboardHeaderProps {
  data: CharacterData;
  isEditing: boolean;
  onToggleEdit: () => void;
  updateData: (partial: Partial<CharacterData>) => void;
  dashboardTab: 'sheet' | 'skills' | 'calc' | 'original' | 'combat';
  setDashboardTab: (tab: 'sheet' | 'skills' | 'calc' | 'original' | 'combat') => void;
  onSaveLocal: () => void;
  onOpenHistory: () => void;
  onOpenLevelUp: () => void;
  onOpenVault: () => void;
  onOpenBackup: () => void;
  onOpenLauncher: () => void;
  onOpenImport: () => void;
  onOpenAiSettings: () => void;
  onOpenRestModal?: () => void;
  presetCharacters: PresetItem[];
  onSelectPreset: (preset: PresetItem) => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  data,
  isEditing,
  onToggleEdit,
  updateData,
  dashboardTab,
  setDashboardTab,
  onSaveLocal,
  onOpenHistory,
  onOpenLevelUp,
  onOpenVault,
  onOpenBackup,
  onOpenLauncher,
  onOpenImport,
  onOpenAiSettings,
  onOpenRestModal,
  presetCharacters,
  onSelectPreset
}) => {
  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={onToggleEdit}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isEditing 
                ? 'bg-orange-500 text-black shadow-orange-500/20' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
            title="Werte manuell bearbeiten"
            id="btn-toggle-edit-mode"
          >
            {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
            <span>{isEditing ? "Fertig" : "Bearbeiten"}</span>
          </button>

          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hidden sm:inline px-1">
            Presets:
          </span>

          {presetCharacters.map((preset) => {
            const active = data.name === preset.name && data.system === preset.system;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                  active 
                    ? 'bg-orange-500/15 border-orange-500 text-orange-400 font-bold shadow-sm' 
                    : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Preset ${preset.name} (${preset.systemLabel}) laden`}
              >
                <span>{preset.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-normal ${active ? 'bg-black/20 text-inherit' : 'text-zinc-500'}`}>
                  {preset.systemLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <button
            type="button"
            onClick={() => setDashboardTab(dashboardTab === 'original' ? 'sheet' : 'original')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              dashboardTab === 'original'
                ? 'bg-amber-500 text-black border border-amber-400 shadow-amber-500/20'
                : 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-200 border border-amber-500/40'
            }`}
            title="Auf den klassischen Original-Charakterbogen wechseln"
            id="btn-nav-original-sheet"
          >
            <FileText size={13} className="stroke-[2.5]" />
            <span>{dashboardTab === 'original' ? "← Dashboard" : "Original-Bogen (PDF)"}</span>
          </button>
          <button
            type="button"
            onClick={onSaveLocal}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20"
            title="Charakter direkt im lokalen Ordner speichern (characters/<spielsystem>/)"
            id="btn-quick-save-local-nav"
          >
            <Save size={13} />
            <span>Lokal speichern</span>
          </button>
          {onOpenRestModal && (
            <button
              type="button"
              onClick={onOpenRestModal}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
              title="Rast & Schlafen: Trefferpunkte nach Regelwerk heilen und tägliche Nutzungen auffüllen"
              id="btn-rest-and-recovery-nav"
            >
              <Moon size={13} className="text-indigo-400 stroke-[2.5]" />
              <span>Rast & Schlafen</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Letzte 10 gespeicherte Versionen dieses Charakters ansehen & wiederherstellen"
            id="btn-open-history-nav"
          >
            <History size={13} className="text-amber-400" />
            <span>Historie (10)</span>
          </button>
          <button
            type="button"
            onClick={onOpenLevelUp}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
            title="Stufenaufstiegs-Assistent & Regel-Leitfaden öffnen"
            id="btn-level-up-nav"
          >
            <TrendingUp size={13} className="text-amber-400 stroke-[2.5]" />
            <span>Stufenaufstieg</span>
          </button>
          <button
            type="button"
            onClick={onOpenVault}
            className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Charakter-Bibliothek im Ordner ./characters/ ansehen und laden"
            id="btn-open-vault-nav"
          >
            <FolderOpen size={13} className="text-orange-400" />
            <span>Charaktere (Ordner)</span>
          </button>
          <button
            type="button"
            onClick={onOpenBackup}
            className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Projekt-Dokumentation herunterladen, Daten-Backup & Self-Hosting Guide"
          >
            <FolderArchive size={13} className="text-orange-400" />
            <span>Backup & Doku</span>
          </button>
          <button
            type="button"
            onClick={onOpenLauncher}
            className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Zum System-Launcher"
          >
            <Rocket size={13} className="text-orange-400" />
            <span>🚀 System-Launcher</span>
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Charakterdaten mit KI neu einlesen"
          >
            <Sparkles size={13} className="text-orange-400" />
            <span>KI-Import</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiSettings}
            className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="KI-Modell wählen"
            id="btn-trigger-ai-settings-nav"
          >
            <Bot size={13} className="text-indigo-400" />
            <span>KI-Modell</span>
          </button>
        </div>
      </nav>

      {/* Main Header / Title and Stats */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2 flex-wrap"
          >
            {isEditing ? (
              <Input 
                value={data.subTitle || ""} 
                onChange={(v) => updateData({ subTitle: v })} 
                className="px-2 py-1 bg-orange-500 text-black text-[10px] font-bold uppercase tracking-widest rounded"
              />
            ) : (
              <span className="px-2 py-1 bg-orange-500 text-black text-[10px] font-bold uppercase tracking-widest rounded">
                {data.subTitle}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
              System: {
                data.system === 'pathfinder' ? 'Pathfinder 1e' :
                data.system === 'coc7e' ? 'Call of Cthulhu 7e' :
                data.system === 'coc1920' ? 'Call of Cthulhu 1920er' :
                data.system === 'shadowrun' ? 'Shadowrun 5e' :
                data.system === 'traveller' ? 'Mongoose Traveller 2e' : 'Generic'
              }
            </span>

            <button
              type="button"
              onClick={onOpenLevelUp}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95"
              title="Stufenaufstiegs-Assistent & Regel-Leitfaden öffnen"
              id="btn-level-up-header"
            >
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Stufenaufstieg</span>
            </button>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none"
          >
            {isEditing ? (
              <Input 
                value={data.name} 
                onChange={(v) => updateData({ name: v })} 
                className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none bg-transparent border-none w-full"
              />
            ) : (
              <>
                {data.name.split(' ')[0]}<br />
                <span className="text-orange-500">{data.name.split(' ')[1] || ""}</span>
              </>
            )}
          </motion.h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {data.stats.map((s, i) => {
            const isEssence = s.label.toLowerCase() === 'essenz' || s.label.toLowerCase() === 'essence';
            let statToRender: Stat = s;
            if (data.system === 'shadowrun' && isEssence && data.bodyMods) {
              const totalSpent = data.bodyMods.reduce((acc, mod) => acc + (Number(mod.essenceCost) || 0), 0);
              const calculatedRemaining = Math.max(0, parseFloat((6.0 - totalSpent).toFixed(2)));
              statToRender = { ...s, value: calculatedRemaining };
            }

            return (
              <StatCard 
                key={i} 
                stat={statToRender} 
                isEditing={isEditing}
                system={data.system}
                onChange={(updates) => {
                  const newStats = [...data.stats];
                  newStats[i] = { ...statToRender, ...updates };
                  updateData({ stats: newStats });
                }}
                onRemove={() => {
                  const newStats = data.stats.filter((_, idx) => idx !== i);
                  updateData({ stats: newStats });
                }}
              />
            );
          })}
          {isEditing && (
            <button 
              onClick={() => updateData({ stats: [...data.stats, { label: "NEU", value: "0" }] })}
              className="bg-zinc-900 border border-dashed border-zinc-800 p-3 rounded-lg flex items-center justify-center min-w-[100px] text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors cursor-pointer"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Global Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 mb-8 gap-4 pb-0">
        <div className="flex overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setDashboardTab('sheet')}
            className={`pb-4 px-3 text-xs font-black tracking-[0.2em] uppercase relative transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
              dashboardTab === 'sheet' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="tab-charakterbogen"
          >
            <User size={14} className="stroke-[2.5px]" /> Charakterbogen
            {dashboardTab === 'sheet' && (
              <motion.div 
                layoutId="dashboardTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" 
              />
            )}
          </button>

          {data.system === 'pathfinder' && (
            <button
              onClick={() => setDashboardTab('combat')}
              className={`pb-4 px-3 text-xs font-black tracking-[0.2em] uppercase relative transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
                dashboardTab === 'combat' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              id="tab-angriffsuebersicht"
            >
              <Swords size={14} className="stroke-[2.5px]" /> Angriffsübersicht
              {dashboardTab === 'combat' && (
                <motion.div 
                  layoutId="dashboardTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" 
                />
              )}
            </button>
          )}
          
          <button
            onClick={() => setDashboardTab('skills')}
            className={`pb-4 px-3 text-xs font-black tracking-[0.2em] uppercase relative transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
              dashboardTab === 'skills' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="tab-fertigkeiten"
          >
            <Scroll size={14} className="stroke-[2.5px]" /> Fertigkeiten-Übersicht
            {dashboardTab === 'skills' && (
              <motion.div 
                layoutId="dashboardTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" 
              />
            )}
          </button>

          <button
            onClick={() => setDashboardTab('calc')}
            className={`pb-4 px-3 text-xs font-black tracking-[0.2em] uppercase relative transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
              dashboardTab === 'calc' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="tab-probenrechner"
          >
            <Calculator size={14} className="stroke-[2.5px]" /> Probenrechner
            {dashboardTab === 'calc' && (
              <motion.div 
                layoutId="dashboardTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" 
              />
            )}
          </button>

          <button
            onClick={() => setDashboardTab('original')}
            className={`pb-4 px-3 text-xs font-black tracking-[0.2em] uppercase relative transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
              dashboardTab === 'original' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            id="tab-original-sheet"
            title="Auf den offiziellen klassischen Charakterbogen wechseln"
          >
            <FileText size={14} className="stroke-[2.5px]" /> Original-Bogen (PDF)
            {dashboardTab === 'original' && (
              <motion.div 
                layoutId="dashboardTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400" 
              />
            )}
          </button>
        </div>

        <button
          onClick={onOpenImport}
          className="mb-4 sm:mb-0 px-4 py-2 bg-orange-600/10 hover:bg-orange-600/25 text-orange-400 border border-orange-500/20 rounded-xl text-[10px] font-black font-mono tracking-widest transition-all duration-300 flex items-center gap-2 select-none shrink-0 cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.05)]"
          id="bar-btn-reimport"
        >
          <RefreshCw size={12} className="stroke-[2.5px]" /> DATEN NEU EINLESEN
        </button>
      </div>
    </>
  );
};
