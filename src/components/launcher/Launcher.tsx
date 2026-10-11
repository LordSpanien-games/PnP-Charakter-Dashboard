import React, { FC, useState, useRef, ChangeEvent } from "react";
import { motion } from "motion/react";
import {
  Rocket,
  FolderArchive,
  ArrowRight,
  FolderOpen,
  RefreshCw,
  FileUp,
  Sparkles,
  Loader2,
  Bot,
  Settings
} from "lucide-react";
import { CharacterData, GameSystem, LocalCharacterMeta, AiConfig } from "../../types";
import { isPathfinder, syncPathfinderStats } from "../../utils/pathfinder";
import { parseCharacterWithAi } from "../../services/aiService";
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

export const SYSTEM_SAMPLES: Record<GameSystem, string> = {
  pathfinder: `Name: Valeros
Volk: Mensch | Klasse: Kämpfer 5 | Gesinnung: Neutral Gut
Attribute: ST 18 (+4), GE 14 (+2), KO 16 (+3), IN 10 (+0), WE 12 (+1), CH 10 (+0)
TP: 54 | RK: 21 (Brustpanzer + Schild) | Initiative: +6
Rettungswürfe: Zähigkeit +7, Reflex +3, Wille +2
Basis-Angriffsbonus: +5 | KMB: +9 | KMV: 21
Waffen:
- Langschwert +1 Meisterarbeit (+10 Angriff, 1W8+6 Schaden, 19-20/x2)
- Komposit-Kurzbogen (+7 Angriff, 1W6+4 Schaden, x3)
Talente: Waffenfokus (Langschwert), Waffenspezialisierung, Heftiger Angriff, Verbesserte Initiative
Fertigkeiten: Klettern +11, Schwimmen +10, Reiten +8, Wahrnehmung +6`,

  coc7e: `Name: Harvey Walters
Beruf: Enthüllungsjournalist | Alter: 42
Attribute: ST 40, KO 50, GR 65, GE 70, ER 75, IN 85, MA 60, BI 80
Werte: TP 11, Stabilität 60, Magiepunkte 12, Glück 55
Fertigkeiten:
- Bibliotheksnutzung: 70%
- Verborgenes erkennen: 65%
- Psychologie: 60%
- Überreden: 65%
- Ausweichen: 35%
- Schusswaffen (Handfeuerwaffe): 50%
Waffen:
- .38 Revolver (.38 Special): 1W10 Schaden, Reichweite 15m, 1 Angriff
Inventar: Notizbuch, Presseausweis, Taschenlampe, Füllfederhalter`,

  coc1920: `Name: Dr. Henry Armitage
Beruf: Chefbibliothekar & Forscher | Alter: 68
Attribute: ST 35, KO 45, GR 60, GE 40, ER 50, IN 90, MA 75, BI 90
Werte: TP 10, Stabilität 75, Magiepunkte 15, Glück 45
Fertigkeiten:
- Bibliotheksnutzung: 90%
- Okkultismus: 75%
- Cthulhu-Mythos: 18%
- Geschichte: 80%
- Fremdsprache (Latein): 85%
- Fremdsprache (Griechisch): 70%
Inventar: Schlüssel zum Sperrbestand der Miskatonic-Bibliothek, Lesebrille, Notizbuch`,

  shadowrun: `Name: Ghost (Kira Vance)
Archetyp: Straßensamurai / Cyber-Spezialistin
Attribute: KON 5, GES 7 (9), REA 5 (7), STÄ 4, CHA 3, INT 5, LOG 4, WIL 4, EDG 4, ESS 2.15
Initiative: 12 + 3W6 | Limits: Körperlich 8, Geistig 6, Sozid 5
Zustandsmonitore: Körperlich 11, Geistig 10
Cyberware:
- Cyberaugen Stufe 2 (Restlicht, Smartlink, Blitzkompensation)
- Reflexbooster Stufe 2 (+2 REA, +2W6 Initiative)
- Titanknochen (+2 Würfel Schadenswiderstand)
Waffen:
- Ares Predator V (Schwere Pistole, Smartlink, Schaden 8K, PB -1, RC 0)
- Katana (Schaden 7K, PB -3)
Fertigkeiten:
- Pistolen: 6 (+2 Schwere Pistolen)
- Klingenwaffen: 5
- Wahrnehmung: 4
- Schleichen: 5
- Athletik-Gruppe: 4`,

  traveller: `Name: Roderick Thorne
Karriere: Scout (Rang 3 - Leitender Erkunder) | Alter: 38
Attribute: STR 7 (+0), DEX 9 (+1), END 8 (+0), INT 10 (+1), EDU 9 (+1), SOC 5 (-1)
Fertigkeiten:
- Pilot (Raumschiff): 2
- Astrogation: 2
- Sensoren: 1
- Schusswaffen (Energiewaffen): 1
- Überleben: 2
- Mechanik: 1
Ausrüstung:
- Laserpistole (Schaden 3W6+3)
- Vakuum-Anzug (Panzerung 8)
- Hand-Computer / Kommunikator
Besitz: Anteile an einem Typ S Scout-Schiff (100 Tonnen "Sternenwanderer")`,

  generic: `Name: Alistair
Rolle: Abenteurer & Waldläufer
Werte:
- Lebenspunkte: 30
- Rüstung: 14
- Stärke: 14 (+2)
- Geschicklichkeit: 16 (+3)
- Konstitution: 12 (+1)
- Verstand: 13 (+1)
Waffen:
- Jagdbogen (1W8+3 Schaden)
- Kurzschwert (1W6+2 Schaden)
Ausrüstung: Seil, Fackeln, Rationen, Schlafsack`
};

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
  aiConfig: AiConfig;
  onOpenAiSettings: () => void;
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
  aiConfig,
  onOpenAiSettings
}) => {
  const [launcherTab, setLauncherTab] = useState<'vault' | 'presets' | 'text' | 'file'>('vault');
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSelectedSystemOption = SYSTEM_OPTIONS.find(s => s.id === selectedSystem) || SYSTEM_OPTIONS[0];

  const handlePasteClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTextInput(text);
        }
      }
    } catch (err) {
      console.warn("Clipboard access not available", err);
    }
  };

  const handleLoadSample = () => {
    const sample = SYSTEM_SAMPLES[selectedSystem];
    if (sample) {
      setTextInput(sample);
    }
  };

  const parseCharacterText = async () => {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    setIsLoading(true);

    // 1. Direct JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const directJson = JSON.parse(trimmed);
        if (directJson && directJson.name && (directJson.stats || directJson.characteristics)) {
          if (isPathfinder(directJson)) {
            directJson.stats = syncPathfinderStats(directJson.stats, directJson.savingThrows);
          }
          onSelectCharacter(directJson);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fall through to AI
      }
    }

    // 2. AI Parsing
    try {
      const parsedData = await parseCharacterWithAi(textInput, selectedSystem, aiConfig);
      if (isPathfinder(parsedData)) {
        parsedData.stats = syncPathfinderStats(parsedData.stats, parsedData.savingThrows);
      }
      onSelectCharacter(parsedData);
    } catch (err: any) {
      console.error("AI Parsing failed", err);
      const msg = err?.message || "Fehler beim Verarbeiten des Textes.";
      alert(msg);
      if (msg.includes("Key") || msg.includes("Schlüssel") || msg.includes("API")) {
        onOpenAiSettings();
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Background Ambient Glow */}
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
                System-Launcher & Charakter-Import
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                6 Regelsysteme
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              P&P <span className="text-orange-500">System-Launcher</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Wähle dein Spielsystem & importiere bestehende Charaktere (als Freitext/PDF oder JSON) oder wähle eine spielbereite Vorlage.
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

            {currentCharacter && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-2.5 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer group"
                title="Zurück zum aktuell geladenen Charakterbogen"
              >
                <span>Aktiven Bogen öffnen: <strong>{currentCharacter.name}</strong></span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Spielsystem auswählen */}
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

          {/* System Info Banner */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2 truncate">
              <span className="text-orange-400 font-bold">Besonderheiten ({currentSelectedSystemOption.name}):</span>
              <span className="truncate text-zinc-300">{currentSelectedSystemOption.highlightText}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Import-Methode & Aktionen */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Bestehenden Charakter importieren oder starten</span>
            </label>

            {/* Tab Selector */}
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
                onClick={() => setLauncherTab('text')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  launcherTab === 'text' ? 'bg-orange-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Text / KI-Import
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

          {/* TAB CONTENT: Text / KI Import */}
          {launcherTab === 'text' && (
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-zinc-400 font-mono">
                  Füge hier beliebigen Charaktertext ein (z. B. aus PDF, Word, Chummer, Rollenspiel-Notizen):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-mono transition-all cursor-pointer"
                    title="Text direkt aus der Zwischenablage einfügen"
                  >
                    Aus Zwischenablage einfügen
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded-lg text-[11px] font-mono transition-all cursor-pointer"
                    title={`Beispieldaten für ${currentSelectedSystemOption.name} einsetzen`}
                  >
                    Beispiel-Text laden
                  </button>
                  {textInput && (
                    <button
                      type="button"
                      onClick={() => setTextInput("")}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg text-[11px] font-mono transition-all cursor-pointer"
                    >
                      Leeren
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Kopiere deine Charakterwerte hier hinein...\n(z.B. Name, Attribute, Rettungswürfe/Fertigkeiten, Waffen, Rüstung für ${currentSelectedSystemOption.name})`}
                className="w-full h-44 bg-black/80 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-orange-500 transition-colors resize-none leading-relaxed"
              />

              {/* AI Provider Indicator & Selector */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${aiConfig.provider === 'openrouter' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                    <Bot size={15} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">
                        {aiConfig.provider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'}
                      </span>
                      {aiConfig.provider === 'openrouter' && (
                        <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono">
                          Kostenlose Modelle aktiv
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate max-w-[200px] sm:max-w-md">
                      {aiConfig.provider === 'openrouter' ? aiConfig.openrouterModel : aiConfig.geminiModel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAiSettings}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border border-zinc-700 shrink-0 cursor-pointer"
                >
                  <Settings size={12} />
                  <span>KI-Modell / Key</span>
                </button>
              </div>

              <button
                type="button"
                onClick={parseCharacterText}
                disabled={isLoading || !textInput.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-black font-mono font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:hover:bg-orange-500 cursor-pointer text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>Charakter mit {aiConfig.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'} für {currentSelectedSystemOption.name} analysieren</span>
              </button>
            </div>
          )}

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

          {/* TAB CONTENT: Vault (Local Files in characters/) */}
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
                  <p className="text-xs text-zinc-400 font-mono">Noch keine Charakterdateien in ./characters/ gefunden.</p>
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
