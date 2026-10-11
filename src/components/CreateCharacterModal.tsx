import React, { FC, useState } from "react";
import { X, UserPlus, ChevronRight, ChevronLeft, Dices } from "lucide-react";
import { CharacterData, GameSystem } from "../types";
import { SYSTEM_OPTIONS } from "./launcher/Launcher";
import { generateAttributes, GenerationMethod, GeneratedAttribute } from "../utils/characterGenerator";

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCharacter: (newData: CharacterData) => void;
}

const SYSTEM_DEFAULTS: Record<GameSystem, Partial<CharacterData>> = {
  pathfinder: {
    subTitle: "Level 1 Mensch Kämpfer",
    stats: [
      { label: "Trefferpunkte", value: "10" },
      { label: "Rüstungsklasse", value: "10" },
      { label: "Initiative", value: "+0" },
      { label: "Zähigkeit (Konstitution)", value: "+0" },
      { label: "Reflex (Geschicklichkeit)", value: "+0" },
      { label: "Wille (Weisheit)", value: "+0" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  coc7e: {
    subTitle: "Journalist, 30",
    stats: [
      { label: "Trefferpunkte", value: "10" },
      { label: "Geistige Stabilität", value: "60" },
      { label: "Glück", value: "50" },
      { label: "Magiepunkte", value: "10" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  coc1920: {
    subTitle: "Forscher, 35",
    stats: [
      { label: "Trefferpunkte", value: "10" },
      { label: "Geistige Stabilität", value: "60" },
      { label: "Glück", value: "50" },
      { label: "Magiepunkte", value: "10" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  shadowrun: {
    subTitle: "Straßensamurai",
    stats: [
      { label: "Essenz", value: "6" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  traveller: {
    subTitle: "Scout, Rang 1",
    stats: [],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  generic: {
    subTitle: "Abenteurer",
    stats: [
      { label: "Lebenspunkte", value: "20" },
      { label: "Rüstung", value: "10" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
};

export const CreateCharacterModal: FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCreateCharacter,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSystem, setSelectedSystem] = useState<GameSystem>("pathfinder");
  const [genMethod, setGenMethod] = useState<GenerationMethod>("standard");
  const [generatedAttrs, setGeneratedAttrs] = useState<GeneratedAttribute[]>(
    generateAttributes("pathfinder", "standard")
  );
  const [name, setName] = useState("");
  const [subTitle, setSubTitle] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setName("");
    setSubTitle("");
    setSelectedSystem("pathfinder");
    setGenMethod("standard");
    setGeneratedAttrs(generateAttributes("pathfinder", "standard"));
    onClose();
  };

  const handleSelectSystem = (sys: GameSystem) => {
    setSelectedSystem(sys);
    setGeneratedAttrs(generateAttributes(sys, genMethod));
  };

  const handleSelectGenMethod = (method: GenerationMethod) => {
    setGenMethod(method);
    setGeneratedAttrs(generateAttributes(selectedSystem, method));
  };

  const handleReroll = () => {
    setGeneratedAttrs(generateAttributes(selectedSystem, genMethod));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const defaults = SYSTEM_DEFAULTS[selectedSystem];

    const characteristics = generatedAttrs.map(a => ({
      label: a.label,
      value: a.value,
    }));

    const newChar: CharacterData = {
      system: selectedSystem,
      name: name.trim(),
      subTitle: subTitle.trim() || (defaults.subTitle as string) || "",
      stats: (defaults.stats as any) || [],
      characteristics: characteristics,
      skills: [],
      weapons: { melee: [], ranged: [] },
      combos: [],
      abilities: [],
    };
    onCreateCharacter(newChar);
    // Reset
    setStep(1);
    setName("");
    setSubTitle("");
    setSelectedSystem("pathfinder");
    setGenMethod("standard");
    setGeneratedAttrs(generateAttributes("pathfinder", "standard"));
  };

  const systemInfo = SYSTEM_OPTIONS.find(s => s.id === selectedSystem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <UserPlus size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight font-mono">
                NEUEN CHARAKTER ANLEGEN
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Schritt {step} von 3 – {step === 1 ? "Spielsystem wählen" : step === 2 ? "Attribute generieren" : "Name & Beschreibung"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex px-6 pt-4 gap-2">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
        </div>

        <div className="p-6 space-y-5">

          {/* STEP 1: Spielsystem wählen */}
          {step === 1 && (
            <>
              <p className="text-xs text-zinc-400 font-mono">
                Für welches Spielsystem soll der Charakter angelegt werden?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SYSTEM_OPTIONS.map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => handleSelectSystem(sys.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedSystem === sys.id
                        ? sys.activeColor
                        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 text-zinc-300"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold font-mono">{sys.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{sys.tagline}</div>
                    </div>
                    <span className="text-[10px] font-mono border border-current rounded px-1.5 py-0.5 opacity-70 shrink-0 ml-3">
                      {sys.badge}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-sm transition-all"
              >
                Weiter <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* STEP 2: Attribute generieren */}
          {step === 2 && (
            <>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${systemInfo?.activeColor}`}>
                {systemInfo?.name} · {systemInfo?.badge}
              </div>

              <p className="text-xs text-zinc-400 font-mono">
                Wie sollen die Attribute bestimmt werden?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectGenMethod("standard")}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    genMethod === "standard"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Ausgewogene Standardwerte
                </button>
                <button
                  onClick={() => handleSelectGenMethod("random")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    genMethod === "random"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <Dices size={14} />
                  Zufällig würfeln
                </button>
              </div>

              {/* Attribut-Vorschau */}
              <div className="grid grid-cols-2 gap-2">
                {generatedAttrs.map((attr) => (
                  <div
                    key={attr.label}
                    className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
                  >
                    <span className="text-[11px] text-zinc-400 font-mono truncate">{attr.label}</span>
                    <span className="text-sm font-bold text-white font-mono shrink-0 ml-2">{attr.value}</span>
                  </div>
                ))}
              </div>

              {genMethod === "random" && (
                <button
                  onClick={handleReroll}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold transition-all"
                >
                  <Dices size={14} />
                  Neu würfeln
                </button>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <ChevronLeft size={15} />
                  Zurück
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-xl text-sm transition-all"
                >
                  Weiter <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Name & Beschreibung */}
          {step === 3 && (
            <>
              <p className="text-xs text-zinc-400 font-mono">
                Gib deinem Charakter einen Namen und eine kurze Beschreibung:
              </p>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${systemInfo?.activeColor}`}>
                {systemInfo?.name} · {systemInfo?.badge}
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 font-mono font-bold">
                  Charaktername *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="z.B. Valeros, Harvey Walters, Ghost..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && handleCreate()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-bold placeholder:text-zinc-600 transition-colors"
                />
              </div>

              {/* Subtitle Input */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 font-mono font-bold">
                  Klasse / Beruf / Beschreibung
                </label>
                <input
                  type="text"
                  placeholder={SYSTEM_DEFAULTS[selectedSystem].subTitle as string}
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && handleCreate()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 transition-colors"
                />
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                  Optional · Kann später im Dashboard bearbeitet werden
                </p>
              </div>

              {/* Hinweis Startwerte */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 font-mono">
                <span className="text-zinc-300 font-bold">ℹ️ Attribute:</span>{" "}
                {generatedAttrs.map(a => `${a.label}: ${a.value}`).join(" · ")}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <ChevronLeft size={15} />
                  Zurück
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <UserPlus size={15} />
                  Charakter erstellen & öffnen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
