import React, { FC } from "react";
import { FileText, TrendingUp, FolderOpen, Save, Moon } from "lucide-react";

export interface FloatingActionButtonsProps {
  dashboardTab: 'sheet' | 'skills' | 'calc' | 'original' | 'combat';
  onToggleOriginalSheet: () => void;
  onOpenLevelUpModal: () => void;
  onOpenVaultModal: () => void;
  onSaveLocal: () => void;
  onOpenRestModal?: () => void;
}

export const FloatingActionButtons: FC<FloatingActionButtonsProps> = ({
  dashboardTab,
  onToggleOriginalSheet,
  onOpenLevelUpModal,
  onOpenVaultModal,
  onSaveLocal,
  onOpenRestModal
}) => {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
      <button 
        onClick={onToggleOriginalSheet}
        className={`p-4 rounded-full shadow-2xl transition-all border ${
          dashboardTab === 'original' 
            ? 'bg-amber-500 text-black border-amber-400 scale-105 shadow-amber-500/30' 
            : 'bg-zinc-800 text-white hover:bg-zinc-700 border-amber-500/40 group'
        }`}
        title={dashboardTab === 'original' ? "Zurück zum interaktiven Dashboard" : "Zum originalen Charakterbogen (ausfüllbar & druckfertig)"}
        aria-label="Original Charakterbogen"
        id="btn-floating-original-sheet"
      >
        <FileText size={24} className={dashboardTab === 'original' ? 'text-black' : 'text-amber-400 group-hover:scale-110 transition-transform'} />
      </button>

      <button 
        onClick={onOpenLevelUpModal}
        className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 shadow-2xl transition-all border border-amber-500/40 group hover:border-amber-400 hover:scale-105"
        title="Stufenaufstiegs-Assistent & Regel-Leitfaden"
        aria-label="Stufenaufstiegs-Assistent"
        id="btn-level-up-floating"
      >
        <TrendingUp size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
      </button>

      <button 
        onClick={onOpenVaultModal}
        className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 shadow-2xl transition-all border border-orange-500/40 group"
        title="Lokale Charakter-Bibliothek (./characters/)"
        aria-label="Lokale Charakter-Bibliothek"
        id="btn-trigger-vault-floating"
      >
        <FolderOpen size={24} className="text-orange-400 group-hover:scale-110 transition-transform" />
      </button>

      {onOpenRestModal && (
        <button 
          onClick={onOpenRestModal}
          className="p-4 rounded-full bg-indigo-900/80 text-white hover:bg-indigo-800 shadow-2xl transition-all border border-indigo-500/50 group hover:border-indigo-400 hover:scale-105"
          title="Rast & Schlafen: Trefferpunkte nach Regelwerk heilen und tägliche Nutzungen auffüllen"
          aria-label="Rast & Schlafen"
          id="btn-trigger-rest-floating"
        >
          <Moon size={24} className="text-indigo-400 group-hover:scale-110 transition-transform stroke-[2.2]" />
        </button>
      )}

      <button 
        onClick={onSaveLocal}
        className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 shadow-2xl transition-all border border-emerald-500/40 group"
        title="Direkt im lokalen Ordner speichern (./characters/)"
        aria-label="Direkt lokal speichern"
        id="btn-trigger-save-local-floating"
      >
        <Save size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};
