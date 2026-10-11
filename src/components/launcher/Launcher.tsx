import React, { FC, useState, useRef, ChangeEvent } from "react";
import { motion } from "motion/react";
import {
  Rocket,
  FolderArchive,
  ArrowRight,
  FolderOpen,
  RefreshCw,
  FileUp,
  UserPlus
} from "lucide-react";
import { CharacterData, GameSystem, LocalCharacterMeta } from "../../types";
import { isPathfinder, syncPathfinderStats } from "../../utils/pathfinder";
import { loadLocalCharacter } from "../../services/characterStorageService";
import {
  FLOKI_DATA,
  HARVEY_DATA,
  ARMITAGE_DATA,
  GHOST_DATA,
  RODERICK_DATA
} from "../../data";

export interface PresetCharacterInfo {
  id: string;
  system: GameSystem;
  name: string;
  fullName: string;
  systemLabel: string;
  subtitle: string;
  activeColor: string;
  data: CharacterData;
}

export const PRESET_CHARACTERS: PresetCharacterInfo[] = [
  {
    id: 'pathfinder',
    system: 'pathfinder',
    name: 'Floki',
    fullName: 'Floki Dunkkling',
    systemLabel: 'Pathfinder 1e',
    subtitle: 'Level 9 Gnom Dieb',
    activeColor: 'bg-amber-500 text-black border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.4)]',
    data: FLOKI_DATA
  },
  {
    id: 'coc7e',
    system: 'coc7e',
    name: 'Harvey',
    fullName: 'Harvey Walters',
    systemLabel: 'CoC 7e',
    subtitle: 'Journalist (1930er)',
    activeColor: 'bg-blue-600 text-white border-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.4)]',
    data: HARVEY_DATA
  },
  {
    id: 'coc1920',
    system: 'coc1920',
    name: 'Henry',
    fullName: 'Henry Armitage',
    systemLabel: 'CoC 1920s',
    subtitle: 'Bibliothekar (1920er)',
    activeColor: 'bg-purple-600 text-white border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.4)]',
    data: ARMITAGE_DATA
  },
  {
    id: 'shadowrun',
    system: 'shadowrun',
    name: 'Ghost',
    fullName: 'Ghost',
    systemLabel: 'Shadowrun 5e',
    subtitle: 'Straßensamurai / Decking',
    activeColor: 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.4)]',
    data: GHOST_DATA
  },
  {
    id: 'traveller',
    system: 'traveller',
    name: 'Roderick',
    fullName: 'Roderick Thorne',
    systemLabel: 'Traveller 2e',
    subtitle: 'Scout Kapitän / Sternenschiff',
    activeColor: 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)]',
    data: RODERICK_DATA
  }
];

export interface SystemOption {
  id: GameSystem;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  activeColor: string;
  highlightText: string;
}

export const SYSTEM_OPTIONS: SystemOption[] = [
  {
    id: 'pathfinder',
    name: 'Pathfinder 1e',
    tagline: 'High-Fantasy D20 mit taktischem Tiefgang',
    badge: 'D20 System',
    color: 'border-zinc-800 hover:border-amber-500/50 bg-zinc-900/60',
    activeColor: 'border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50',
    highlightText: 'Attribute ST-CH, Zähigkeit/Reflex/Wille (Auto-Berechnung), RK, TP & Kombos'
  },
  {
    id: 'coc7e',
    name: 'Call of Cthulhu 7e',
    tagline: 'Kosmischer Horror & detektivische Ermittlungen',
    badge: 'W100 Prozent',
    color: 'border-zinc-800 hover:border-blue-500/50 bg-zinc-900/60',
    activeColor: 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/50',
    highlightText: 'Prozent-Fertigkeiten, Geistige Stabilität, 1/2 & 1/5 Schwellenwerte, Glück'
  },
  {
    id: 'coc1920',
    name: 'Call of Cthulhu 1920er',
    tagline: 'Das klassische Lovecraft-Zeitalter der 1920er Jahre',
    badge: '1920s Ära',
    color: 'border-zinc-800 hover:border-purple-500/50 bg-zinc-900/60',
    activeColor: 'border-purple-500 bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/50',
    highlightText: 'Historische Fertigkeiten, Cthulhu-Mythos, Bibliotheksnutzung, Stabilität'
  },
  {
    id: 'shadowrun',
    name: 'Shadowrun 5e',
    tagline: 'Cyberpunk trifft Magie in den Schatten der Megakonzerne',
    badge: 'Cyberpunk W6',
    color: 'border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/60',
    activeColor: 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/50',
    highlightText: 'Cyberdeck Matrix-Attribute, Body-Mods & Essenz-Rechner, Schadensmonitore'
  },
  {
    id: 'traveller',
    name: 'Mongoose Traveller 2e',
    tagline: 'Hard-Sci-Fi Erkundung & Sternenschiffe',
    badge: '2W6 Sci-Fi',
    color: 'border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/60',
    activeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50',
    highlightText: 'Scout-Raumschiffe, Subsektor-Sprünge, Treibstoff & Rumpf, 2W6 Fertigkeiten'
  },
  {
    id: 'generic',
    name: 'Generisches P&P',
    tagline: 'Universelles Dashboard für jedes beliebige Spielsystem',
    badge: 'Universal',
    color: 'border-zinc-800 hover:border-zinc-500/50 bg-zinc-900/60',
    activeColor: 'border-zinc-400 bg-zinc-800/80 text-zinc-200 ring-1 ring-zinc-400/50',
    highlightText: 'Universelle Attribute, flexible Fertigkeiten, Inventar & Waffen'
  }
];

export interface LauncherProps {
  selectedSystem: GameSystem;
  setSelectedSystem: (sys: GameSystem) => void;
  onSelectCharacter: (character: CharacterData) => void;
  currentCharacter: CharacterData | null;
  onOpenDashboard: () => void;
  localCharactersList: LocalCharacterMeta[];
  refreshLocalCharacters: () => void;
  isLoadingLocalChars: boolean;
  onOpenVaultModal: () => void;
  onOpenBackupModal: () => void;
  onOpenCreateModal: () => void;
}

export const Launcher: FC<LauncherProps> = ({
  selectedSystem,
  setSelectedSystem,
  onSelectCharacter,
  currentCharacter,
  onOpenDashboard,
  localCharactersList,
  refreshLocalCharacters,
  isLoadingLocalChars,
  onOpenVaultModal,
  onOpenBackupModal,
  onOpenCreateModal
}) => {
  const [launcherTab, setLauncherTab] = useState<'vault' | 'presets' | 'file'>('vault');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSelectedSystemOption = SYSTEM_OPTIONS.find(s => s.id === selectedSystem) || SYSTEM_OPTIONS[0];

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (isPathfinder(json)) {
          json.stats = syncPathfinderStats(json.stats, json.savingThrows);
        }
        onSelectCharacter(json);
      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Fehler beim Laden der Datei. Bitte stellen Sie sicher, dass es sich um eine gültige JSON-Datei handelt.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans flex flex-col items-center justify-start p-4 sm:p-8 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-5xl bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl my-auto space-y-8"
      >
        {/* Top Bar / Launcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Rocket size={13} className="text-orange-400" />
                System-Launcher
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                6 Regelsysteme
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              P&P <span className="text-orange-500">System-Launcher</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Wähle dein Spielsystem, erstelle einen neuen Charakter oder lade einen bestehenden.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="flex items-center gap-2 px-3.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 font-mono font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
              title="Projekt-Dokumentation herunterladen, Daten-Backup sichern & Self-Hosting Anleitung"
            >
              <FolderArchive size={15} className="text-orange-400" />
              <span>Backup & Doku</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
              title="Neuen Charakter manuell anlegen"
            >
              <UserPlus size={15} />
              <span>Neuen Charakter anlegen</span>
            </button>

            {currentCharacter && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-2.5 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer group"
                title="Zurück zum aktuell geladenen Charakterbogen"
              >
                <span>Aktiven Bogen öffnen: <strong>{currentCharacter.name}</strong></span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Spielsystem wählen */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Spielsystem wählen</span>
            </label>
            <span className="text-[11px] font-mono text-orange-400">
              Aktiv: <strong>{currentSelectedSystemOption.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SYSTEM_OPTIONS.map((sys) => {
              const isSelected = selectedSystem === sys.id;
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSelectedSystem(sys.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? sys.activeColor
                      : `${sys.color} text-zinc-300 hover:text-white`
                  }`}
                >
                  <div>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold inline-block mb-1.5 ${
                      isSelected ? 'bg-black/30 text-current' : 'bg-zinc-800/80 text-zinc-400'
                    }`}>
                      {sys.badge}
                    </span>
                    <h4 className="text-xs font-bold font-mono leading-tight truncate">
                      {sys.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {sys.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2 truncate">
              <span className="text-orange-400 font-bold">Besonderheiten ({currentSelectedSystemOption.name}):</span>
              <span className="truncate text-zinc-300">{currentSelectedSystemOption.highlightText}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Charakter laden */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Bestehenden Charakter laden</span>
            </label>

            <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setLauncherTab('vault');
                  refreshLocalCharacters();
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  launcherTab === 'vault' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FolderOpen size={13} />
                <span>Lokale Charaktere ({localCharactersList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLauncherTab('file')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  launcherTab === 'file' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                JSON-Upload
              </button>
              <button
                type="button"
                onClick={() => setLauncherTab('presets')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  launcherTab === 'presets' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Vorlagen (1-Klick)
              </button>
            </div>
          </div>

          {/* TAB CONTENT: JSON File Upload */}
          {launcherTab === 'file' && (
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-6">
              <div
                className="p-10 border-2 border-dashed border-zinc-800 hover:border-orange-500/60 rounded-2xl text-center transition-all group cursor-pointer bg-zinc-900/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="mx-auto text-zinc-600 group-hover:text-orange-400 mb-3 transition-colors" size={44} />
                <h3 className="text-white font-mono font-bold text-base mb-1">
                  Bestehende .json Charakterdatei ablegen
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Lade eine zuvor exportierte Datei hoch. Das Dashboard wird sofort mit allen Attributen, Waffen, Notizen und dem jeweiligen Spielsystem geöffnet.
                </p>
                <span className="inline-block mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-xl transition-colors border border-zinc-700">
                  Datei auswählen (.json)
                </span>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".json" />
              </div>
            </div>
          )}

          {/* TAB CONTENT: Presets */}
          {launcherTab === 'presets' && (
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_CHARACTERS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectCharacter(preset.data);
                      setSelectedSystem(preset.system);
                    }}
                    className="flex items-center gap-3.5 p-3.5 bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/60 rounded-2xl transition-all text-left cursor-pointer group hover:bg-zinc-900"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 font-mono ${preset.activeColor}`}>
                      {preset.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate font-mono">
                        {preset.fullName}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        <span className="font-semibold text-zinc-300">{preset.systemLabel}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {preset.subtitle}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Vault (Local Files) */}
          {launcherTab === 'vault' && (
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      Gespeicherte Charaktere im Ordner:
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      ./characters/
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Unterteilt in <strong>pathfinder/</strong>, <strong>coc_7e/</strong>, <strong>coc_1920/</strong>, <strong>shadowrun/</strong>, <strong>traveller/</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenVaultModal}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <FolderOpen size={13} />
                    <span>Bibliothek öffnen & verwalten</span>
                  </button>
                  <button
                    type="button"
                    onClick={refreshLocalCharacters}
                    disabled={isLoadingLocalChars}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-colors cursor-pointer"
                    title="Neu einlesen"
                  >
                    <RefreshCw size={13} className={isLoadingLocalChars ? "animate-spin text-orange-400" : ""} />
                  </button>
                </div>
              </div>

              {localCharactersList.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                  <FolderOpen size={32} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-mono mb-4">Noch keine Charakterdateien in ./characters/ gefunden.</p>
                  <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-xs transition-all cursor-pointer mx-auto"
                  >
                    <UserPlus size={14} />
                    Ersten Charakter anlegen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {localCharactersList.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={async () => {
                        try {
                          const loaded = await loadLocalCharacter(char.relativePath);
                          if (isPathfinder(loaded)) {
                            loaded.stats = syncPathfinderStats(loaded.stats, loaded.savingThrows);
                          }
                          onSelectCharacter(loaded);
                          setSelectedSystem(loaded.system || 'pathfinder');
                        } catch (err: any) {
                          alert(err?.message || "Fehler beim Laden");
                        }
                      }}
                      className="p-3.5 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-orange-500/60 rounded-2xl transition-all text-left cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 font-bold">
                            {char.system}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {(char.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors font-mono truncate">
                          {char.name}
                        </div>
                        {char.subTitle && (
                          <div className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                            {char.subTitle}
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-400 font-mono truncate mt-2 bg-black/40 px-2 py-0.5 rounded">
                          📁 characters/{char.relativePath}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-orange-400 group-hover:text-orange-300">
                        <span>1-Klick Laden</span>
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick-Launch Row */}
        <div className="pt-4 border-t border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              Schnellstart mit fertigen System-Vorlagen:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {PRESET_CHARACTERS.map((preset) => (
                <button
                  key={`quick-${preset.id}`}
                  type="button"
                  onClick={() => {
                    onSelectCharacter(preset.data);
                    setSelectedSystem(preset.system);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span className="text-orange-400 font-bold">{preset.name}</span>
                  <span className="text-zinc-500 text-[10px]">({preset.systemLabel})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
