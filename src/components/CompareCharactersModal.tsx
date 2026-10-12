import React, { FC, useState, useRef, ChangeEvent } from "react";
import { X, GitCompare, FileUp, ArrowRight } from "lucide-react";
import { GenericCharacter } from "../core/types";
import { importCharacterFromFile } from "../core/persistence";
import { compareCharacters, CompareRow, CharacterComparison } from "../core/compare";

interface CompareCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusColor: Record<CompareRow["status"], string> = {
  unchanged: "text-zinc-500",
  increased: "text-emerald-400",
  decreased: "text-red-400",
  changed: "text-amber-400",
  added: "text-blue-400",
  removed: "text-zinc-600 line-through",
};

const RowTable: FC<{ title: string; rows: CompareRow[] }> = ({ title, rows }) => {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono font-bold">{title}</h4>
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-3 gap-2 px-3 py-2 text-xs font-mono border-b border-zinc-900 last:border-b-0 bg-zinc-950/50"
          >
            <span className="text-zinc-300 truncate">{row.label}</span>
            <span className="text-zinc-500 truncate">{row.oldValue || "–"}</span>
            <span className={`truncate flex items-center gap-1 ${statusColor[row.status]}`}>
              <ArrowRight size={10} className="shrink-0 opacity-50" />
              {row.newValue || "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CompareCharactersModal: FC<CompareCharactersModalProps> = ({ isOpen, onClose }) => {
  const [charA, setCharA] = useState<GenericCharacter | null>(null);
  const [charB, setCharB] = useState<GenericCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<CharacterComparison | null>(null);

  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (c: GenericCharacter) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const c = await importCharacterFromFile(file);
      setter(c);
    } catch (err: any) {
      setError(err?.message || "Fehler beim Einlesen der Datei.");
    } finally {
      e.target.value = "";
    }
  };

  const handleCompare = () => {
    if (!charA || !charB) return;
    setComparison(compareCharacters(charA, charB));
  };

  const handleClose = () => {
    setCharA(null);
    setCharB(null);
    setComparison(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <GitCompare size={18} className="text-orange-400" />
            </div>
            <h3 className="text-base font-black text-white tracking-tight font-mono">
              CHARAKTERE VERGLEICHEN
            </h3>
          </div>
          <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Charakter A */}
            <div
              onClick={() => refA.current?.click()}
              className="p-5 border-2 border-dashed border-zinc-800 hover:border-orange-500/60 rounded-xl text-center cursor-pointer transition-all"
            >
              <FileUp className="mx-auto text-zinc-600 mb-2" size={28} />
              <p className="text-xs font-mono font-bold text-white">Alter Stand</p>
              {charA && (
                <p className="text-[11px] text-emerald-400 font-mono mt-1 truncate">
                  {charA.name} (v{charA.exportVersion})
                </p>
              )}
              <input type="file" ref={refA} onChange={(e) => handleUpload(e, setCharA)} className="hidden" accept=".json" />
            </div>

            {/* Charakter B */}
            <div
              onClick={() => refB.current?.click()}
              className="p-5 border-2 border-dashed border-zinc-800 hover:border-orange-500/60 rounded-xl text-center cursor-pointer transition-all"
            >
              <FileUp className="mx-auto text-zinc-600 mb-2" size={28} />
              <p className="text-xs font-mono font-bold text-white">Neuer Stand</p>
              {charB && (
                <p className="text-[11px] text-emerald-400 font-mono mt-1 truncate">
                  {charB.name} (v{charB.exportVersion})
                </p>
              )}
              <input type="file" ref={refB} onChange={(e) => handleUpload(e, setCharB)} className="hidden" accept=".json" />
            </div>
          </div>

          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

          <button
            onClick={handleCompare}
            disabled={!charA || !charB}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold rounded-xl text-sm transition-all"
          >
            <GitCompare size={16} /> Vergleichen
          </button>

          {comparison && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-3 gap-2 px-3 text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">
                <span>Feld</span>
                <span>{comparison.nameOld}</span>
                <span>{comparison.nameNew}</span>
              </div>
              <RowTable title="Attribute" rows={comparison.attributeRows} />
              <RowTable title="Ressourcen" rows={comparison.resourceRows} />
              <RowTable title="Fertigkeiten" rows={comparison.skillRows} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
