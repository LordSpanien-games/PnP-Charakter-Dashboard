import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderOpen,
  X,
  Search,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
  FileJson,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Plus,
  Save,
  AlertCircle,
  History
} from 'lucide-react';
import { CharacterData, GameSystem } from '../types';
import {
  LocalCharacterMeta,
  listLocalCharacters,
  loadLocalCharacter,
  saveLocalCharacter,
  deleteLocalCharacter,
  downloadCharacterFile,
  checkLocalServerAvailable
} from '../services/characterStorageService';

interface LocalCharacterVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: CharacterData | null;
  onLoadCharacter: (char: CharacterData) => void;
  onSaveCurrentSuccess?: (savedPath: string) => void;
  onOpenHistoryForCharacter?: (charMeta: LocalCharacterMeta) => void;
}

const SYSTEM_LABELS: Record<string, { label: string; icon: string; color: string; folder: string }> = {
  pathfinder: { label: 'Pathfinder', icon: '⚔️', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10', folder: 'characters/pathfinder/' },
  coc_7e: { label: 'Cthulhu 7e', icon: '🐙', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', folder: 'characters/coc_7e/' },
  coc_1920: { label: 'Cthulhu 1920s', icon: '🕵️', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', folder: 'characters/coc_1920/' },
  shadowrun: { label: 'Shadowrun', icon: '💻', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', folder: 'characters/shadowrun/' },
  traveller: { label: 'Traveller', icon: '🚀', color: 'border-sky-500/40 text-sky-400 bg-sky-500/10', folder: 'characters/traveller/' },
  custom: { label: 'Sonstige', icon: '📁', color: 'border-zinc-600 text-zinc-400 bg-zinc-800', folder: 'characters/custom/' },
};

export const LocalCharacterVaultModal: FC<LocalCharacterVaultModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onLoadCharacter,
  onSaveCurrentSuccess,
  onOpenHistoryForCharacter,
}) => {
  const [characters, setCharacters] = useState<LocalCharacterMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [serverActive, setServerActive] = useState(true);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteChar, setConfirmDeleteChar] = useState<LocalCharacterMeta | null>(null);

  const fetchCharacters = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const isOnline = await checkLocalServerAvailable();
      setServerActive(isOnline);
      const list = await listLocalCharacters();
      setCharacters(list);
    } catch (err: any) {
      console.error('Failed to load characters:', err);
      setStatusMessage({ text: err?.message || 'Fehler beim Laden der Charaktere', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = async () => {
    if (!currentData) return;
    setIsSavingCurrent(true);
    setStatusMessage(null);
    try {
      const result = await saveLocalCharacter(currentData);
      setStatusMessage({ text: result.message, type: 'success' });
      if (onSaveCurrentSuccess) {
        onSaveCurrentSuccess(result.fullLocalPath);
      }
      await fetchCharacters();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Fehler beim Speichern', type: 'error' });
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleLoad = async (meta: LocalCharacterMeta) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const loaded = await loadLocalCharacter(meta.relativePath);
      onLoadCharacter(loaded);
      onClose();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Konnte Datei nicht laden', type: 'error' });
      setIsLoading(false);
    }
  };

  const requestDelete = (meta: LocalCharacterMeta) => {
    setConfirmDeleteChar(meta);
  };

  const executeDelete = async (meta: LocalCharacterMeta) => {
    setDeletingId(meta.id);
    setConfirmDeleteChar(null);
    try {
      await deleteLocalCharacter(meta.relativePath);
      setStatusMessage({ text: `Datei characters/${meta.relativePath} erfolgreich gelöscht`, type: 'success' });
      await fetchCharacters();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Löschen fehlgeschlagen', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCharacters = characters.filter((c) => {
    const matchesSystem = selectedSystemFilter === 'all' || c.system === selectedSystemFilter;
    const matchesSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subTitle && c.subTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSystem && matchesSearch;
  });

  const getSystemInfo = (sys: string) => {
    return SYSTEM_LABELS[sys] || { label: sys, icon: '📁', color: 'border-zinc-700 text-zinc-300 bg-zinc-800', folder: `characters/${sys}/` };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-start justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
              <FolderOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold font-mono tracking-wide text-white">
                  Lokale Charakter-Bibliothek
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ./characters/
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Direkt auf deiner Festplatte gespeichert, unterteilt nach Spielsystem (Pathfinder, Cthulhu, Shadowrun, Traveller).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-mono flex items-center gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border-red-800/60 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick Toolbar: Save open sheet / Refresh */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {currentData ? (
              <button
                type="button"
                onClick={handleSaveCurrent}
                disabled={isSavingCurrent}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                title={`Speichert ${currentData.name} in characters/${currentData.system || 'custom'}/${currentData.name.replace(/\\s+/g, '_')}.json`}
              >
                <Save size={14} />
                <span>
                  {isSavingCurrent
                    ? 'Speichere...'
                    : `Aktuellen Bogen (${currentData.name}) in ./characters/ speichern`}
                </span>
              </button>
            ) : (
              <div className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
                <HardDrive size={14} />
                <span>Kein aktiver Bogen geöffnet</span>
              </div>
            )}

            {currentData && (
              <button
                type="button"
                onClick={() => downloadCharacterFile(currentData)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs rounded-xl flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                title="Als separate JSON-Datei herunterladen"
              >
                <Download size={13} />
                <span>Backup-JSON</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCharacters}
              disabled={isLoading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              title="Dateien neu einlesen"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-orange-400' : ''} />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/10 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSystemFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                selectedSystemFilter === 'all'
                  ? 'bg-orange-500 text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Alle Systeme ({characters.length})
            </button>
            {Object.entries(SYSTEM_LABELS).map(([sysKey, info]) => {
              const count = characters.filter((c) => c.system === sysKey).length;
              return (
                <button
                  key={sysKey}
                  onClick={() => setSelectedSystemFilter(sysKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    selectedSystemFilter === sysKey
                      ? 'bg-orange-500 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <span className="opacity-75 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              type="text"
              placeholder="Charaktername oder Dateiname filtern..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Character List Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <FolderOpen size={36} className="mx-auto text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-zinc-300 font-mono">Keine Charaktere in diesem Ordner gefunden</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto font-mono">
                {selectedSystemFilter !== 'all'
                  ? `In '${SYSTEM_LABELS[selectedSystemFilter]?.folder}' liegt derzeit noch keine Datei. Klicke oben auf 'Aktuellen Bogen speichern', um einen Bogen hier abzulegen!`
                  : 'Im Ordner ./characters/ wurden noch keine Charakter-Dateien gefunden.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCharacters.map((char) => {
                const sysInfo = getSystemInfo(char.system);
                const isCurrentlyActive = currentData?.name === char.name;

                return (
                  <div
                    key={char.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isCurrentlyActive
                        ? 'bg-orange-500/5 border-orange-500/40 shadow-lg shadow-orange-500/5'
                        : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* System badge & Active indicator */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${sysInfo.color}`}
                        >
                          <span>{sysInfo.icon}</span>
                          <span>{sysInfo.label}</span>
                        </span>

                        {isCurrentlyActive && (
                          <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                            Aktuell geöffnet
                          </span>
                        )}
                      </div>

                      {/* Character Name & Subtitle */}
                      <h4 className="text-base font-bold text-white font-mono tracking-tight">
                        {char.name}
                      </h4>
                      {char.subTitle && (
                        <p className="text-xs text-zinc-400 font-mono line-clamp-1 mt-0.5">
                          {char.subTitle}
                        </p>
                      )}

                      {/* File Path */}
                      <div className="mt-2 text-[10px] font-mono text-zinc-400 bg-black/40 px-2.5 py-1 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                        <span className="truncate" title={`characters/${char.relativePath}`}>
                          📁 characters/{char.relativePath}
                        </span>
                        <span className="text-zinc-400 shrink-0 ml-2">
                          {(char.size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      {/* Quick Stats Preview */}
                      {char.previewStats && char.previewStats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {char.previewStats.map((stat, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-750"
                            >
                              {stat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-800/80">
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(char.lastModified).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {onOpenHistoryForCharacter && (
                          <button
                            type="button"
                            onClick={() => onOpenHistoryForCharacter(char)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono border border-zinc-800"
                            title="Letzte 10 gespeicherte Versionen dieses Charakters ansehen & wiederherstellen"
                          >
                            <History size={13} className="text-amber-400" />
                            <span className="hidden sm:inline">Historie</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => requestDelete(char)}
                          disabled={deletingId === char.id}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Diesen Charakter aus dem Ordner ./characters/ löschen"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLoad(char)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <span>Laden</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* IN-APP CONFIRM DELETE DIALOG */}
        <AnimatePresence>
          {confirmDeleteChar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-zinc-950 border border-red-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-mono text-white">Charakterdatei löschen?</h3>
                    <p className="text-xs text-zinc-400 font-mono">Bist du sicher, dass du diesen Charakter entfernen möchtest?</p>
                  </div>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-500">Charakter:</span>
                    <strong className="text-white">{confirmDeleteChar.name}</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-500">Dateipfad:</span>
                    <span className="text-orange-400 font-mono text-[11px] truncate max-w-[200px]">
                      characters/{confirmDeleteChar.relativePath}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-500">Spielsystem:</span>
                    <span className="text-zinc-300 font-semibold">{confirmDeleteChar.system}</span>
                  </div>
                </div>

                <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-3 text-[11px] font-mono text-zinc-300 leading-relaxed">
                  <p className="text-red-300 font-bold mb-1">ℹ️ Hinweis zur Wiederherstellung:</p>
                  Die Datei wird aus dem aktiven Ordner gelöscht. Bis zu 10 vorherige Snapshots bleiben im Sicherungsverzeichnis <strong>.history/</strong> archiviert, falls du den Stand reaktivieren möchtest.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteChar(null)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => executeDelete(confirmDeleteChar)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Ja, Charakter löschen</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Advice */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">💡</span>
            <span>
              Dateien liegen physisch im Ordner <strong>./characters/&lt;spielsystem&gt;/</strong> deines Projekts.
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Automatisches Backup der letzten 10 Versionen in .history/ aktiv.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
