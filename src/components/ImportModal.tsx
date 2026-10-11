import React, { FC, useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Upload, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertTriangle, 
  FileText, 
  Clipboard, 
  HelpCircle,
  TrendingUp,
  History,
  GitCompare,
  ArrowRight,
  Settings,
  Bot
} from "lucide-react";
import { CharacterData, GameSystem, Stat } from "../types";
import { parseCharacterWithAi, getSavedAiConfig, AiConfig, OPENROUTER_FREE_MODELS } from "../services/aiService";
import { AiSettingsModal } from "./AiSettingsModal";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: CharacterData | null;
  onConfirmOverwrite: (newData: CharacterData) => void;
  ai?: any;
}

const parseStatValue = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const parsed = parseInt(val.replace(/[+]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const mergeCharacterData = (
  current: CharacterData,
  parsed: CharacterData,
  overwriteExisting: boolean
): CharacterData => {
  if (!current) return parsed;
  
  const merged = { ...current };

  // 1. Core Profile Details
  if (overwriteExisting) {
    if (parsed.name) merged.name = parsed.name;
    if (parsed.subTitle !== undefined) merged.subTitle = parsed.subTitle;
    if (parsed.system !== undefined) merged.system = parsed.system;
  }

  // 2. Stats list
  const statsMap = new Map<string, Stat>(merged.stats.map(s => [s.label.toLowerCase(), s]));
  if (parsed.stats) {
    parsed.stats.forEach(newStat => {
      const key = newStat.label.toLowerCase();
      if (statsMap.has(key)) {
        if (overwriteExisting) {
          statsMap.set(key, {
            ...statsMap.get(key)!,
            value: newStat.value,
            secondary: newStat.secondary !== undefined ? newStat.secondary : statsMap.get(key)!.secondary
          });
        }
      } else {
        statsMap.set(key, newStat);
      }
    });
  }
  merged.stats = Array.from(statsMap.values());

  // 3. Characteristics
  if (parsed.characteristics && parsed.characteristics.length > 0) {
    const charMap = new Map<string, any>((merged.characteristics || []).map(c => [c.label.toLowerCase(), c]));
    parsed.characteristics.forEach(newC => {
      const key = newC.label.toLowerCase();
      if (charMap.has(key)) {
        if (overwriteExisting) {
          charMap.set(key, { ...charMap.get(key)!, value: newC.value });
        }
      } else {
        charMap.set(key, newC);
      }
    });
    merged.characteristics = Array.from(charMap.values());
  }

  // 4. Skills
  const skillsMap = new Map<string, any>((merged.skills || []).map(s => [s.name.toLowerCase(), s]));
  if (parsed.skills) {
    parsed.skills.forEach(newSkill => {
      const key = newSkill.name.toLowerCase();
      if (skillsMap.has(key)) {
        if (overwriteExisting) {
          skillsMap.set(key, { 
            ...skillsMap.get(key)!, 
            value: newSkill.value, 
            note: newSkill.note || skillsMap.get(key)!.note,
            checked: newSkill.checked !== undefined ? newSkill.checked : skillsMap.get(key)!.checked,
            trained: newSkill.trained !== undefined ? newSkill.trained : skillsMap.get(key)!.trained
          });
        }
      } else {
        skillsMap.set(key, newSkill);
      }
    });
  }
  merged.skills = Array.from(skillsMap.values());

  // 5. Weapons
  const existingMelee = merged.weapons?.melee || [];
  const existingRanged = merged.weapons?.ranged || [];
  const parsedMelee = parsed.weapons?.melee || [];
  const parsedRanged = parsed.weapons?.ranged || [];

  const mergeWeaponsList = (existingList: any[], parsedList: any[]) => {
    const wMap = new Map<string, any>(existingList.map(w => [w.name.toLowerCase(), w]));
    parsedList.forEach(newW => {
      const key = newW.name.toLowerCase();
      if (wMap.has(key)) {
        if (overwriteExisting) {
          wMap.set(key, { ...wMap.get(key)!, ...newW });
        }
      } else {
        wMap.set(key, newW);
      }
    });
    return Array.from(wMap.values());
  };

  merged.weapons = {
    melee: mergeWeaponsList(existingMelee, parsedMelee),
    ranged: mergeWeaponsList(existingRanged, parsedRanged)
  };

  // 6. Abilities
  const abilitiesMap = new Map<string, any>((merged.abilities || []).map(a => [a.name.toLowerCase(), a]));
  if (parsed.abilities) {
    parsed.abilities.forEach(newA => {
      const key = newA.name.toLowerCase();
      if (abilitiesMap.has(key)) {
        if (overwriteExisting) {
          abilitiesMap.set(key, { ...abilitiesMap.get(key)!, ...newA });
        }
      } else {
        abilitiesMap.set(key, newA);
      }
    });
  }
  merged.abilities = Array.from(abilitiesMap.values());

  // 7. Combos
  const combosMap = new Map<string, any>((merged.combos || []).map(c => [c.title.toLowerCase(), c]));
  if (parsed.combos) {
    parsed.combos.forEach(newC => {
      const key = newC.title.toLowerCase();
      if (combosMap.has(key)) {
        if (overwriteExisting) {
          combosMap.set(key, { ...combosMap.get(key)!, ...newC });
        }
      } else {
        combosMap.set(key, newC);
      }
    });
  }
  merged.combos = Array.from(combosMap.values());

  // 8. Party members
  const partyMap = new Map<string, any>((merged.party || []).map(p => [p.name.toLowerCase(), p]));
  if (parsed.party) {
    parsed.party.forEach(newP => {
      const key = newP.name.toLowerCase();
      if (partyMap.has(key)) {
        if (overwriteExisting) {
          partyMap.set(key, { ...partyMap.get(key)!, ...newP });
        }
      } else {
        partyMap.set(key, newP);
      }
    });
  }
  merged.party = Array.from(partyMap.values());

  // 9. Currency
  if (parsed.currency) {
    if (overwriteExisting || !merged.currency) {
      merged.currency = parsed.currency;
    }
  }

  // 10. Saving Throws (Pathfinder: Reflex, Wille, Zähigkeit)
  if (parsed.savingThrows) {
    if (overwriteExisting || !merged.savingThrows) {
      merged.savingThrows = parsed.savingThrows;
    } else {
      merged.savingThrows = {
        fortitude: { ...merged.savingThrows.fortitude, ...parsed.savingThrows.fortitude },
        reflex: { ...merged.savingThrows.reflex, ...parsed.savingThrows.reflex },
        will: { ...merged.savingThrows.will, ...parsed.savingThrows.will }
      };
    }
  }

  return merged;
};

export const ImportModal: FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  currentData, 
  onConfirmOverwrite,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<GameSystem>(currentData?.system || 'pathfinder');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig>(getSavedAiConfig());
  
  // States for verification phase
  const [parsedCandidate, setParsedCandidate] = useState<CharacterData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAiConfig(getSavedAiConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Reset all states
  const handleReset = () => {
    setTextInput("");
    setFile(null);
    setParsedCandidate(null);
    setIsLoading(false);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Convert PDF file to base64 for Gemini multimodal input
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Read plain text file
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      let contentToParse = textInput;
      let pdfPart: any = null;

      // Handle file processing if we're on the file upload tab
      if (activeTab === 'file' && file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExt === 'json') {
          // Direct JSON import - bypass Gemini
          const text = await readFileAsText(file);
          const parsed = JSON.parse(text);
          if (parsed && parsed.name && parsed.stats) {
            setParsedCandidate(parsed);
            setIsLoading(false);
            return;
          } else {
            throw new Error("Ungültiges JSON-Schema");
          }
        } else if (fileExt === 'pdf') {
          // PDF Multimodal upload
          const base64Pdf = await readFileAsBase64(file);
          pdfPart = {
            inlineData: {
              data: base64Pdf,
              mimeType: "application/pdf"
            }
          };
          contentToParse = `[PDF FILE ATTACHED] Please read and extract character details directly from this raw PDF file.`;
        } else {
          // Fallback parsing as standard text (.txt, etc)
          contentToParse = await readFileAsText(file);
        }
      }

      if (!contentToParse.trim() && !pdfPart) {
        alert("Bitte gib einen Text ein oder wähle eine Datei aus.");
        setIsLoading(false);
        return;
      }

      // Direct JSON detection (100% offline, no AI API key needed)
      const trimmedText = contentToParse.trim();
      if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) || (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
        try {
          const directJson = JSON.parse(trimmedText);
          if (directJson && directJson.name && (directJson.stats || directJson.characteristics)) {
            setParsedCandidate(directJson);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall through to AI parser
        }
      }

      // Query AI via OpenRouter or Gemini REST API
      const parsed = await parseCharacterWithAi(
        contentToParse,
        selectedSystem,
        aiConfig,
        pdfPart ? { mimeType: pdfPart.inlineData.mimeType, data: pdfPart.inlineData.data } : undefined
      );

      setParsedCandidate(parsed);
      setIsLoading(false);
      return;
    } catch (err: any) {
      console.error("AI Reader failure", err);
      const msg = err?.message || "Fehler beim Extrahieren der Charakterwerte.";
      alert(msg);
      if (msg.includes("Key") || msg.includes("Schlüssel") || msg.includes("API")) {
        setIsSettingsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };



  // Compare stats to show actual changes for critical decision making
  const renderDataComparison = () => {
    if (!parsedCandidate || !currentData) return null;

    const oldStatsMap = new Map<string, Stat>(currentData.stats.map(s => [s.label.toLowerCase(), s]));
    
    // Core details diffs
    const coreDiffs: { label: string; oldVal: string; newVal: string }[] = [];
    if (currentData.name !== parsedCandidate.name) {
      coreDiffs.push({ label: "Name", oldVal: currentData.name, newVal: parsedCandidate.name });
    }
    if (currentData.system !== parsedCandidate.system) {
      coreDiffs.push({ label: "Regelsystem", oldVal: currentData.system, newVal: parsedCandidate.system });
    }
    if (currentData.subTitle !== parsedCandidate.subTitle) {
      coreDiffs.push({ label: "Untertitel", oldVal: currentData.subTitle || "—", newVal: parsedCandidate.subTitle || "—" });
    }

    // Stats diffs
    const statDiffs: { label: string; oldVal: string; newVal: string }[] = [];
    parsedCandidate.stats.forEach(newStat => {
      const oldStat = oldStatsMap.get(newStat.label.toLowerCase());
      const oldValStr = oldStat ? String(oldStat.value) : "Nicht vorhanden";
      const newValStr = String(newStat.value);
      if (oldValStr !== newValStr) {
        statDiffs.push({ label: newStat.label, oldVal: oldValStr, newVal: newValStr });
      }
    });

    // Check weapon / abilities counts
    const oldWeaponsCount = (currentData.weapons?.melee?.length || 0) + (currentData.weapons?.ranged?.length || 0);
    const newWeaponsCount = (parsedCandidate.weapons?.melee?.length || 0) + (parsedCandidate.weapons?.ranged?.length || 0);

    const oldAbilitiesCount = currentData.abilities?.length || 0;
    const newAbilitiesCount = parsedCandidate.abilities?.length || 0;

    const oldSkillsCount = currentData.skills?.length || 0;
    const newSkillsCount = parsedCandidate.skills?.length || 0;

    const handleConfirmMerge = (overwrite: boolean) => {
      const mergedResult = mergeCharacterData(currentData, parsedCandidate, overwrite);
      onConfirmOverwrite(mergedResult);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500">
          <AlertTriangle className="shrink-0 animate-bounce" size={24} />
          <div className="text-left">
            <h4 className="text-sm font-black uppercase tracking-wider">Entscheidung erforderlich: Daten-Zusammenführung</h4>
            <p className="text-[10px] leading-relaxed font-mono opacity-90">
              Möchtest du vorhandene Charakter-Werte mit den neuen Werten überschreiben, oder sollen ausschließlich neue Einträge (z.B. neue Fertigkeiten) ergänzt werden?
            </p>
          </div>
        </div>

        {/* Detailed side by side differences */}
        <div className="border border-zinc-800 rounded-2xl bg-zinc-950/40 p-4 max-h-[250px] overflow-y-auto space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
            <GitCompare size={14} className="text-orange-500" />
            <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">Identifizierte Änderungen:</span>
          </div>

          {/* Core differences list */}
          {coreDiffs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-550 font-bold block uppercase tracking-wide">Hauptinformationen:</span>
              {coreDiffs.map((cf, idx) => (
                <div key={idx} className="flex justify-between items-center gap-4 bg-zinc-900/40 border border-zinc-850 p-2 rounded-lg text-[11px]">
                  <span className="text-zinc-500">{cf.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-red-500 opacity-60">{cf.oldVal}</span>
                    <ArrowRight size={10} className="text-zinc-500" />
                    <span className="text-emerald-400 font-bold">{cf.newVal}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats differences list */}
          {statDiffs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-550 font-bold block uppercase tracking-wide">Attribute & Werte:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {statDiffs.map((sd, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-900/40 gap-4 border border-zinc-850 p-2 rounded-lg text-[11px]">
                    <span className="font-bold text-zinc-400">{sd.label}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-red-500 opacity-60">{sd.oldVal}</span>
                      <ArrowRight size={10} className="text-zinc-500" />
                      <span className="text-emerald-400 font-black">{sd.newVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counts changes summaries */}
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-550 font-bold block uppercase tracking-wide">Einträge & Ausrüstung (Bestehend ➔ Neu eingelesen):</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-zinc-900/40 border border-zinc-855 px-3 py-2 rounded-xl text-center">
                <span className="text-[9px] text-zinc-500 block uppercase">Waffen</span>
                <span className="text-xs font-bold text-zinc-300">{oldWeaponsCount} ➔ {newWeaponsCount}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-855 px-3 py-2 rounded-xl text-center">
                <span className="text-[9px] text-zinc-500 block uppercase">Fähigkeiten</span>
                <span className="text-xs font-bold text-zinc-300">{oldAbilitiesCount} ➔ {newAbilitiesCount}</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-855 px-3 py-2 rounded-xl text-center">
                <span className="text-[9px] text-zinc-500 block uppercase">Fertigkeiten</span>
                <span className="text-xs font-bold text-zinc-300">{oldSkillsCount} ➔ {newSkillsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Choices Block */}
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleConfirmMerge(true)}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white border border-orange-500/30 rounded-xl text-[10px] font-black font-mono tracking-wider transition-all hover:scale-102 active:scale-98 uppercase shadow-[0_0_20px_rgba(249,115,22,0.15)]"
              id="confirm-overwrite-yes"
            >
              Ja, vorhandene Werte überschreiben
            </button>
            <button
              onClick={() => handleConfirmMerge(false)}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-855 text-emerald-400 border border-zinc-800 rounded-xl text-[10px] font-black font-mono tracking-wider transition-all hover:scale-102 active:scale-98 uppercase"
              id="confirm-overwrite-no"
            >
              Nein, nur neue Werte ergänzen
            </button>
          </div>
          
          <button
            onClick={() => setParsedCandidate(null)}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-xl text-xs font-bold font-mono text-zinc-500 hover:text-white transition-all tracking-wider uppercase"
          >
            Zurück / Abbrechen
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-zinc-955 border border-zinc-800/80 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-900 transition-colors"
        >
          <X size={18} />
        </button>

        {parsedCandidate ? (
          <div>
            <div className="flex items-center gap-2 mb-2 text-orange-400">
              <History size={16} />
              <span className="text-[10px] font-mono tracking-widest font-black uppercase">Verifikation vor Import</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">INTEGRATIONSPRÜFUNG</h3>
            <p className="text-xs text-zinc-500 font-mono mb-6 leading-relaxed">
              Die KI hat die hochgeladenen/kopierten Daten erfolgreich strukturiert. Siehe unten die Zusammenfassung und bestätige die Überschreibung deines aktuellen Charakters.
            </p>
            {renderDataComparison()}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2 text-orange-500">
              <Sparkles size={16} />
              <span className="text-[10px] font-mono tracking-widest font-black uppercase">Multimodaler Importer (PDF / TXT / Paste)</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-1">CHARAKTER NEU EINLESEN</h3>
            <p className="text-xs text-zinc-550 font-mono mb-6 leading-relaxed">
              Lese Dokumente, Spielberichte, rohen kopierten Text oder PDF-Exporte ein, um deine Charakterkarte mit Google Gemini AI mühelos zu aktualisieren.
            </p>

            {/* Input Selection Tabs */}
            <div className="flex border-b border-zinc-900 mb-6 gap-2">
              <button
                onClick={() => setActiveTab('text')}
                className={`pb-2.5 px-3 text-xs font-black tracking-wider uppercase relative transition-all flex items-center gap-2 ${
                  activeTab === 'text' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Clipboard size={13} /> Text Kopieren / Einfügen
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`pb-2.5 px-3 text-xs font-black tracking-wider uppercase relative transition-all flex items-center gap-2 ${
                  activeTab === 'file' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Upload size={13} /> Dokument hochladen
              </button>
            </div>

            <div className="space-y-6">
              {/* Game System Selection */}
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2.5">
                  Als welches System analysieren?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['pathfinder', 'coc7e', 'coc1920', 'shadowrun', 'generic'] as GameSystem[]).map(sys => (
                    <button
                      key={sys}
                      onClick={() => setSelectedSystem(sys)}
                      className={`py-2 rounded-xl border text-[10px] font-mono font-bold transition-all ${
                        selectedSystem === sys 
                          ? 'bg-orange-500 border-orange-500 text-black' 
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {sys === 'coc7e' ? 'CoC 7e' : sys === 'coc1920' ? 'CoC 1920s' : sys === 'shadowrun' ? 'Shadowrun' : sys.charAt(0).toUpperCase() + sys.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'text' ? (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2.5">
                    Charaktertext einfügen (z.B. Attribut-Listen, Kampfergebnisse, PDF-Copypastes)
                  </span>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Füge hier die ausgelesenen Text-Werte deines Charakters ein..."
                    className="w-full h-40 bg-zinc-950 border border-zinc-850 rounded-2xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2.5">
                    Dokument auswählen (PDF-Bogen, Notiz, Textdatei, JSON)
                  </span>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${
                      dragActive 
                        ? 'border-orange-500 bg-orange-950/10' 
                        : 'border-zinc-800 hover:border-orange-500/50 bg-zinc-950/20'
                    }`}
                  >
                    <Upload className="text-zinc-700 group-hover:text-orange-500 mb-3 transition-colors shrink-0" size={32} />
                    {file ? (
                      <div>
                        <span className="text-xs font-bold text-white block truncate max-w-xs">{file.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 mt-1 block font-bold">
                          {(file.size / 1024).toFixed(1)} KB — Klicke zum Ändern
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-zinc-300 block mb-1">Datei reinziehen oder Klicken</span>
                        <span className="text-[9px] font-mono text-zinc-500 block">Akzeptierte Formate: .pdf, .txt, .json</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,.txt,.json" 
                    />
                  </div>
                </div>
              )}

              {/* AI Engine & Settings Selector */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/65 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${aiConfig.provider === 'openrouter' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                    <Bot size={16} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">
                        {aiConfig.provider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'}
                      </span>
                      {aiConfig.provider === 'openrouter' && (
                        <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono">
                          Kostenlose Modelle
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate max-w-[220px] sm:max-w-xs">
                      {aiConfig.provider === 'openrouter' ? aiConfig.openrouterModel : aiConfig.geminiModel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-zinc-750 shrink-0"
                >
                  <Settings size={13} />
                  <span>Modell / Key</span>
                </button>
              </div>

              {/* Analyze trigger button */}
              <button
                onClick={handleAnalyze}
                disabled={isLoading || (activeTab === 'text' ? !textInput.trim() : !file)}
                className="w-full py-4 bg-zinc-100 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:hover:bg-zinc-100 placeholder:text-zinc-700 text-xs shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin text-black shrink-0" size={16} />
                    <span>LESE WERTE EIN ({aiConfig.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-black shrink-0" />
                    <span>ANALYSIEREN & NEU EINLESEN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <AiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            setAiConfig(getSavedAiConfig());
          }}
          onSaved={(cfg) => setAiConfig(cfg)}
        />
      </motion.div>
    </div>
  );
};
