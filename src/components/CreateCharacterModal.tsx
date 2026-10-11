import React, { FC, useState } from "react";
import { X, UserPlus, ChevronRight } from "lucide-react";
import { CharacterData, GameSystem } from "../types";
import { SYSTEM_OPTIONS } from "./launcher/Launcher";

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
    characteristics: [
      { label: "Stärke (ST)", value: 10 },
      { label: "Geschicklichkeit (GE)", value: 10 },
      { label: "Konstitution (KO)", value: 10 },
      { label: "Intelligenz (IN)", value: 10 },
      { label: "Weisheit (WE)", value: 10 },
      { label: "Charisma (CH)", value: 10 },
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
    characteristics: [
      { label: "Stärke (ST)", value: 50 },
      { label: "Konstitution (KO)", value: 50 },
      { label: "Größe (GR)", value: 50 },
      { label: "Geschicklichkeit (GE)", value: 50 },
      { label: "Erscheinung (ER)", value: 50 },
      { label: "Intelligenz (IN)", value: 60 },
      { label: "Macht (MA)", value: 50 },
      { label: "Bildung (BI)", value: 60 },
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
    ],
    characteristics: [
      { label: "Stärke (ST)", value: 50 },
      { label: "Konstitution (KO)", value: 50 },
      { label: "Größe (GR)", value: 50 },
      { label: "Geschicklichkeit (GE)", value: 50 },
      { label: "Erscheinung (ER)", value: 50 },
      { label: "Intelligenz (IN)", value: 60 },
      { label: "Macht (MA)", value: 50 },
      { label: "Bildung (BI)", value: 60 },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  shadowrun: {
    subTitle: "Straßensamurai",
    stats: [
      { label: "Konstitution", value: "4" },
      { label: "Geschicklichkeit", value: "4" },
      { label: "Reaktion", value: "4" },
      { label: "Stärke", value: "4" },
      { label: "Charisma", value: "3" },
      { label: "Intuition", value: "4" },
      { label: "Logik", value: "3" },
      { label: "Willenskraft", value: "3" },
      { label: "Essenz", value: "6" },
    ],
    skills: [],
    weapons: { melee: [], ranged: [] },
    combos: [],
    abilities: [],
  },
  traveller: {
    subTitle: "Scout, Rang 1",
    stats: [
      { label: "Stärke (STR)", value: "7" },
      { label: "Geschicklichkeit (DEX)", value: "7" },
      { label: "Ausdauer (END)", value: "7" },
      { label: "Intelligenz (INT)", value: "7" },
      { label: "Bildung (EDU)", value: "7" },
      { label: "Sozial (SOC)", value: "5" },
    ],
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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSystem, setSelectedSystem] = useState<GameSystem>("pathfinder");
  const [name, setName] = useState("");
  const [subTitle, setSubTitle] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    const defaults = SYSTEM_DEFAULTS[selectedSystem];
    const newChar: CharacterData = {
      system: selectedSystem,
      name: name.trim(),
      subTitle: subTitle.trim() || defaults.subTitle || "",
      stats: defaults.stats || [],
      characteristics: defaults.characteristics || [],
      skills: defaults.skills || [],
      weapons: defaults.weapons || { melee: [], ranged: [] },
      combos: defaults.combos || [],
      abilities: defaults.abilities || [],
    };
    onCreateCharacter(newChar);
    // Reset
    setStep(1);
    setName("");
    setSubTitle("");
    setSelectedSystem("pathfinder");
  };

  const systemInfo = SYSTEM_OPTIONS.find(s => s.id === selectedSystem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <UserPlus size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                NEUEN CHARAKTER ANLEGEN
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Schritt {step} von 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <p className="text-xs text-zinc-400 font-mono">
                Wähle das Spielsystem für deinen neuen Charakter:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SYSTEM_OPTIONS.map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => setSelectedSystem(sys.id)}
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
                    <span className="text-[10px] font-mono border border-current rounded px-1.5 py-0.5 opacity-70">
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

          {step === 2 && (
            <>
              <p className="text-xs text-zinc-400 font-mono">
                Gib deinem Charakter einen Namen und eine kurze Beschreibung:
              </p>

              {/* System Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${systemInfo?.activeColor}`}>
                {systemInfo?.name} · {systemInfo?.badge}
              </div>

              {/* Name */}
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-bold placeholder:text-zinc-600"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 font-mono font-bold">
                  Klasse / Beruf / Beschreibung
                </label>
                <input
                  type="text"
                  placeholder={SYSTEM_DEFAULTS[selectedSystem].subTitle as string}
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-600"
                />
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                  Optional · Kann später im Dashboard bearbeitet werden
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold rounded-xl text-sm transition-all"
                >
                  Zurück
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <UserPlus size={15} />
                  Charakter erstellen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
