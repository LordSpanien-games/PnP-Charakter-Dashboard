import React, { FC, useState, useEffect, useMemo } from "react";
import { X, UserPlus, ChevronRight, ChevronLeft, Dices, FileEdit } from "lucide-react";
import { GenericCharacter } from "../core/types";
import { getAllSystems } from "../core/systemRegistry";
import { AttributePool } from "../core/SystemPlugin";

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCharacter: (newData: GenericCharacter) => void;
}

type Step = 1 | 2 | 3;
type GenMode = "blank" | "auto" | "manual";

export const CreateCharacterModal: FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCreateCharacter,
}) => {
  const systems = getAllSystems();

  const [step, setStep] = useState<Step>(1);
  const [selectedSystemId, setSelectedSystemId] = useState<string>(systems[0]?.id || "");
  const [genMode, setGenMode] = useState<GenMode>("auto");
  const [pool, setPool] = useState<AttributePool | null>(null);
  const [assignment, setAssignment] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [subTitle, setSubTitle] = useState("");

  const plugin = useMemo(
    () => systems.find((s) => s.id === selectedSystemId) || systems[0],
    [systems, selectedSystemId]
  );

  // Reset-Helfer
  const resetAll = () => {
    setStep(1);
    setSelectedSystemId(systems[0]?.id || "");
    setGenMode("auto");
    setPool(null);
    setAssignment({});
    setName("");
    setSubTitle("");
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  if (!isOpen) return null;

  if (!plugin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 font-mono">
          Kein Spielsystem registriert.
          <button onClick={handleClose} className="ml-4 text-orange-400">Schließen</button>
        </div>
      </div>
    );
  }

  // --- Schritt 2: Würfeln vorbereiten, sobald Modus "auto"/"manual" gewählt wird ---
  const rollNewPool = () => {
    const rolled = plugin.rollAttributePool();
    setPool(rolled);
    setAssignment({});
  };

  const handleSelectGenMode = (mode: GenMode) => {
    setGenMode(mode);
    if (mode === "auto" || mode === "manual") {
      const rolled = plugin.rollAttributePool();
      setPool(rolled);
      setAssignment({});
    } else {
      setPool(null);
    }
  };

  // Für manuelle Zuordnung: welche Pool-Indizes sind für ein Attribut noch wählbar?
  const availableIndicesFor = (attrKey: string): number[] => {
    if (!pool) return [];
    const usedByOthers = new Set(
      Object.entries(assignment)
        .filter(([k]) => k !== attrKey)
        .map(([, idx]) => idx)
    );
    return pool.values
      .map((_, idx) => idx)
      .filter((idx) => !usedByOthers.has(idx));
  };

  const allAssigned =
    genMode !== "manual" ||
    (pool && plugin.attributeDefinitions.every((a) => assignment[a.key] !== undefined));

  const handleCreate = () => {
    if (!name.trim()) return;

    let newChar: GenericCharacter;

    if (genMode === "blank") {
      newChar = plugin.createBlankCharacter(name.trim(), subTitle.trim() || undefined);
    } else if (genMode === "auto" && pool) {
      newChar = plugin.buildCharacterFromPool(name.trim(), subTitle.trim() || undefined, pool.values);
    } else if (genMode === "manual" && pool) {
      newChar = plugin.buildCharacterFromPool(
        name.trim(),
        subTitle.trim() || undefined,
        pool.values,
        assignment
      );
    } else {
      newChar = plugin.createBlankCharacter(name.trim(), subTitle.trim() || undefined);
    }

    onCreateCharacter(plugin.recalculate(newChar));
    resetAll();
  };

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
                Schritt {step} von 3 –{" "}
                {step === 1 ? "Spielsystem wählen" : step === 2 ? "Attribute festlegen" : "Name & Beschreibung"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-orange-500" : "bg-zinc-800"}`} />
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* STEP 1: Spielsystem */}
          {step === 1 && (
            <>
              <p className="text-xs text-zinc-400 font-mono">
                Für welches Spielsystem soll der Charakter angelegt werden?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {systems.map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => setSelectedSystemId(sys.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedSystemId === sys.id
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

          {/* STEP 2: Attribute festlegen */}
          {step === 2 && (
            <>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${plugin.activeColor}`}>
                {plugin.name} · {plugin.badge}
              </div>

              <p className="text-xs text-zinc-400 font-mono">Wie sollen die Attribute bestimmt werden?</p>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleSelectGenMode("blank")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    genMode === "blank"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <FileEdit size={14} /> Leerer Charakter (Werte selbst eintragen)
                </button>

                <button
                  onClick={() => handleSelectGenMode("auto")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    genMode === "auto"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <Dices size={14} /> Automatisch auswürfeln (direkt zugewiesen)
                </button>

                {plugin.supportsManualAssignment && (
                  <button
                    onClick={() => handleSelectGenMode("manual")}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      genMode === "manual"
                        ? "border-orange-500 bg-orange-500/10 text-orange-300"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <Dices size={14} /> Auswürfeln & selbst zuordnen
                  </button>
                )}
              </div>

              {/* Blank: Hinweis */}
              {genMode === "blank" && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 font-mono">
                  Alle Attribute starten bei 0 und können direkt im Dashboard eingetragen werden.
                </div>
              )}

              {/* Auto: direkte Zuordnung anzeigen */}
              {genMode === "auto" && pool && (
                <>
                  <p className="text-[11px] text-zinc-500 font-mono">{pool.methodLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {plugin.attributeDefinitions.map((attr, idx) => (
                      <div key={attr.key} className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <span className="text-[11px] text-zinc-400 font-mono truncate">{attr.label}</span>
                        <span className="text-sm font-bold text-white font-mono shrink-0 ml-2">
                          {pool.values[idx] ?? "–"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={rollNewPool}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold transition-all"
                  >
                    <Dices size={14} /> Neu würfeln
                  </button>
                </>
              )}

              {/* Manual: Zuordnung per Dropdown */}
              {genMode === "manual" && pool && (
                <>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {pool.methodLabel} – ordne jeden gewürfelten Wert einem Attribut zu.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pool.values.map((v, idx) => {
                      const isUsed = Object.values(assignment).includes(idx);
                      return (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                            isUsed
                              ? "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                              : "border-orange-500/40 bg-orange-500/10 text-orange-300"
                          }`}
                        >
                          {v}
                        </span>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {plugin.attributeDefinitions.map((attr) => {
                      const options = availableIndicesFor(attr.key);
                      const currentIdx = assignment[attr.key];
                      return (
                        <div key={attr.key} className="flex items-center justify-between gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <span className="text-[11px] text-zinc-400 font-mono">{attr.label}</span>
                          <select
                            value={currentIdx ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAssignment((prev) => {
                                const next = { ...prev };
                                if (val === "") {
                                  delete next[attr.key];
                                } else {
                                  next[attr.key] = Number(val);
                                }
                                return next;
                              });
                            }}
                            className="bg-black border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white font-mono"
                          >
                            <option value="">– wählen –</option>
                            {options.map((idx) => (
                              <option key={idx} value={idx}>
                                {pool.values[idx]}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={rollNewPool}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold transition-all"
                  >
                    <Dices size={14} /> Neu würfeln
                  </button>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <ChevronLeft size={15} /> Zurück
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!allAssigned}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold rounded-xl text-sm transition-all"
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

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${plugin.activeColor}`}>
                {plugin.name} · {plugin.badge}
              </div>

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

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 font-mono font-bold">
                  Klasse / Beruf / Beschreibung
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && handleCreate()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <ChevronLeft size={15} /> Zurück
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold rounded-xl text-sm transition-all"
                >
                  <UserPlus size={15} /> Charakter erstellen & öffnen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
