import React, { FC, useState } from "react";
import { 
  Printer, 
  Save, 
  Edit3, 
  Eye, 
  FileText, 
  Layers
} from "lucide-react";
import { 
  CharacterData, 
  GameSystem
} from "../types";
import { ErrorBoundary } from "./ErrorBoundary";
import { PathfinderSheet } from "./sheets/PathfinderSheet";
import { CallOfCthulhuSheet } from "./sheets/CallOfCthulhuSheet";
import { ShadowrunSheet } from "./sheets/ShadowrunSheet";
import { TravellerSheet } from "./sheets/TravellerSheet";
import { GenericSheet } from "./sheets/GenericSheet";

interface OriginalCharacterSheetProps {
  data: CharacterData;
  onUpdateData: (updates: Partial<CharacterData>) => void;
  onSaveToVault?: () => void;
}

export const OriginalCharacterSheet: FC<OriginalCharacterSheetProps> = ({
  data,
  onUpdateData,
  onSaveToVault
}) => {
  const [isEditable, setIsEditable] = useState(true);
  const [paperStyle, setPaperStyle] = useState<'parchment' | 'clean'>('parchment');
  const [activePage, setActivePage] = useState<'all' | 'page1' | 'page2'>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerSave = () => {
    if (onSaveToVault) {
      onSaveToVault();
    }
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 3000);
  };

  const resolveSystem = (): GameSystem => {
    if (data?.system) return data.system;
    if (data?.savingThrows || (data?.subTitle || '').toLowerCase().includes('pathfinder') || (data?.name || '').toLowerCase().includes('floki') || (data?.subTitle || '').toLowerCase().includes('dieb') || (data?.subTitle || '').toLowerCase().includes('gnom')) {
      return 'pathfinder';
    }
    if ((data?.subTitle || '').toLowerCase().includes('cthulhu')) return 'coc7e';
    if (data?.cyberdeck || (data?.subTitle || '').toLowerCase().includes('shadowrun') || (data?.subTitle || '').toLowerCase().includes('runner')) return 'shadowrun';
    if ((data?.subTitle || '').toLowerCase().includes('traveller') || (data?.subTitle || '').toLowerCase().includes('scout')) return 'traveller';
    return 'pathfinder';
  };

  const effectiveSystem = resolveSystem();

  const getSystemBadge = () => {
    switch (effectiveSystem) {
      case 'pathfinder':
        return "Offizieller Pathfinder 1e Bogen";
      case 'coc7e':
        return "Call of Cthulhu 7E Prüferbogen";
      case 'coc1920':
        return "Call of Cthulhu 1920er Bogen";
      case 'shadowrun':
        return "Shadowrun Runner-Akte (Matrix & Meat)";
      case 'traveller':
        return "Traveller Imperial Service Dossier";
      case 'generic':
      default:
        return "Universal Rollenspielbogen";
    }
  };

  const renderSpecificSheet = () => {
    const sheetData = data?.system ? data : { ...data, system: effectiveSystem };
    const sheetProps = {
      data: sheetData,
      onUpdateData,
      isEditable,
      paperStyle,
      activePage
    };

    switch (effectiveSystem) {
      case 'pathfinder':
        return <PathfinderSheet {...sheetProps} />;
      case 'coc7e':
      case 'coc1920':
        return <CallOfCthulhuSheet {...sheetProps} />;
      case 'shadowrun':
        return <ShadowrunSheet {...sheetProps} />;
      case 'traveller':
        return <TravellerSheet {...sheetProps} />;
      case 'generic':
      default:
        return <GenericSheet {...sheetProps} />;
    }
  };

  return (
    <div className="w-full">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print mb-8 p-4 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <FileText size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">
                Original-Charakterbogen
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {getSystemBadge()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              System-angepasste Originalansicht • Vollständig ausfüllbar • Druck- & PDF-Export optimiert
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* System Switcher (Optional fast test/preview) */}
          <div className="flex items-center bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className="text-[10px] text-zinc-500 mr-2 uppercase">System:</span>
            <select
              value={effectiveSystem}
              onChange={(e) => onUpdateData({ system: e.target.value as GameSystem })}
              className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer text-xs"
              title="Aktives Spielsystem für den Charakterbogen wechseln"
            >
              <option value="pathfinder" className="bg-zinc-900 text-zinc-100">Pathfinder 1E</option>
              <option value="coc7e" className="bg-zinc-900 text-zinc-100">Call of Cthulhu 7E</option>
              <option value="coc1920" className="bg-zinc-900 text-zinc-100">Call of Cthulhu 1920er</option>
              <option value="shadowrun" className="bg-zinc-900 text-zinc-100">Shadowrun</option>
              <option value="traveller" className="bg-zinc-900 text-zinc-100">Traveller</option>
              <option value="generic" className="bg-zinc-900 text-zinc-100">Universal</option>
            </select>
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditable(!isEditable)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isEditable 
                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20" 
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
            title={isEditable ? "Ausfüll-Modus aktiv: Klicken Sie auf beliebige Felder, um sie direkt zu bearbeiten." : "Ansichts-Modus"}
            id="btn-toggle-fillable-mode"
          >
            {isEditable ? <Edit3 size={15} /> : <Eye size={15} />}
            <span>{isEditable ? "Ausfüllbar: AKTIV" : "Nur-Lese Modus"}</span>
          </button>

          {/* Paper Style Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setPaperStyle('parchment')}
              className={`px-2.5 py-1 rounded-lg transition-all ${paperStyle === 'parchment' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Thematische Farb-Optik"
            >
              📜 Stilisiert
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('clean')}
              className={`px-2.5 py-1 rounded-lg transition-all ${paperStyle === 'clean' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              title="Klarer Schwarz/Weiß Druck-Look"
            >
              📄 Reinweiß / S/W
            </button>
          </div>

          {/* Page Filter Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActivePage('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activePage === 'all' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Alle Seiten
            </button>
            <button
              type="button"
              onClick={() => setActivePage('page1')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activePage === 'page1' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Seite 1
            </button>
            <button
              type="button"
              onClick={() => setActivePage('page2')}
              className={`px-2.5 py-1 rounded-lg transition-all ${activePage === 'page2' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Seite 2
            </button>
          </div>

          {/* Direct Save */}
          <button
            type="button"
            onClick={handleTriggerSave}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
            title="Charakterdaten direkt speichern"
            id="btn-save-original-sheet"
          >
            <Save size={15} className="text-emerald-400" />
            <span>Speichern</span>
          </button>

          {/* Print / PDF Export Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-102"
            title="Öffnet das Druckmenü des Browsers. Wählen Sie dort 'Als PDF speichern' für ein perfektes A4-Dokument!"
            id="btn-print-pdf-export"
          >
            <Printer size={16} className="stroke-[2.5]" />
            <span>Als PDF exportieren / Drucken</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="no-print mb-4 p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl flex items-center justify-between">
          <span>✓ Alle Eingaben wurden im Charakter hinterlegt und synchronisiert!</span>
        </div>
      )}

      {/* RENDER DEDICATED SYSTEM SHEET */}
      <div id="character-sheet-printable-area" className="w-full">
        <ErrorBoundary>
          {renderSpecificSheet()}
        </ErrorBoundary>
      </div>
    </div>
  );
};
