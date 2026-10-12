import React, { FC, useRef, ChangeEvent, useState } from "react";
import { motion } from "motion/react";
import { Rocket, UserPlus, FileUp, ArrowRight, GitCompare } from "lucide-react";
import { GenericCharacter } from "../../core/types";
import { getAllSystems } from "../../core/systemRegistry";
import { importCharacterFromFile } from "../../core/persistence";

export interface LauncherProps {
  selectedSystemId: string;
  setSelectedSystemId: (id: string) => void;
  onSelectCharacter: (character: GenericCharacter) => void;
  currentCharacter: GenericCharacter | null;
  onOpenDashboard: () => void;
  onOpenCreateModal: () => void;
  onOpenCompareModal: () => void;
}

export const Launcher: FC<LauncherProps> = ({
  selectedSystemId,
  setSelectedSystemId,
  onSelectCharacter,
  currentCharacter,
  onOpenDashboard,
  onOpenCreateModal,
  onOpenCompareModal,
}) => {
  const systems = getAllSystems();
  const current = systems.find((s) => s.id === selectedSystemId) || systems[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const character = await importCharacterFromFile(file);
      onSelectCharacter(character);
    } catch (err: any) {
      setImportError(err?.message || "Fehler beim Importieren der Datei.");
    } finally {
      e.target.value = "";
    }
  };

  if (systems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <p className="font-mono text-sm text-zinc-400">
          Kein Spielsystem registriert. Bitte prüfe <code>registerAllSystems()</code>.
        </p>
      </div>
    );
  }

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Rocket size={13} className="text-orange-400" />
                System-Launcher
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                {systems.length} Regelsysteme registriert
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              P&P <span className="text-orange-500">System-Launcher</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Wähle dein Spielsystem, erstelle einen neuen Charakter oder importiere einen bestehenden.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={onOpenCompareModal}
              className="flex items-center gap-2 px-3.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 font-mono font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
              title="Zwei Charakter-Dateien miteinander vergleichen"
            >
              <GitCompare size={15} className="text-orange-400" />
              <span>Charaktere vergleichen</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-3 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Neuen Charakter anlegen</span>
            </button>

            {currentCharacter && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-2.5 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer group"
              >
                <span>Aktiven Bogen öffnen: <strong>{currentCharacter.name}</strong></span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* System-Auswahl: dynamisch aus der Registry */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-mono flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Spielsystem wählen</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {systems.map((sys) => {
              const isSelected = selectedSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setSelectedSystemId(sys.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected ? sys.activeColor : `${sys.color} text-zinc-300 hover:text-white`
                  }`}
                >
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold inline-block mb-1.5 ${
                    isSelected ? "bg-black/30 text-current" : "bg-zinc-800/80 text-zinc-400"
                  }`}>
                    {sys.badge}
                  </span>
                  <h4 className="text-xs font-bold font-mono leading-tight truncate">{sys.name}</h4>
                  <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{sys.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* JSON-Import */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold font-mono flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Bestehenden Charakter importieren (JSON)</span>
          </label>
          <div
            className="p-8 border-2 border-dashed border-zinc-800 hover:border-orange-500/60 rounded-2xl text-center transition-all group cursor-pointer bg-zinc-900/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="mx-auto text-zinc-600 group-hover:text-orange-400 mb-3 transition-colors" size={36} />
            <h3 className="text-white font-mono font-bold text-sm mb-1">
              .json-Datei hierher ziehen oder klicken
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Alte und neue Charakterdateien werden automatisch erkannt und bei Bedarf ins aktuelle Format überführt.
            </p>
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".json" />
          </div>
          {importError && (
            <p className="text-xs text-red-400 font-mono px-1">{importError}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
