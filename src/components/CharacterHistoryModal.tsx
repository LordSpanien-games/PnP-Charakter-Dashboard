import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  X,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Download,
  ArrowRight,
  Shield,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { CharacterData } from '../types';
import {
  CharacterHistoryVersion,
  getCharacterHistory,
  restoreCharacterVersion,
  loadLocalCharacter,
  downloadCharacterFile
} from '../services/characterStorageService';

interface CharacterHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCharacter: CharacterData;
  characterRelativePath?: string;
  onRestore: (restored: CharacterData) => void;
}

export const CharacterHistoryModal: FC<CharacterHistoryModalProps> = ({
  isOpen,
  onClose,
  currentCharacter,
  characterRelativePath,
  onRestore
}) => {
  const [versions, setVersions] = useState<CharacterHistoryVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CharacterHistoryVersion | null>(null);
  const [previewData, setPreviewData] = useState<CharacterData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRollbackVersion, setConfirmRollbackVersion] = useState<CharacterHistoryVersion | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const effectivePath =
    characterRelativePath ||
    `${currentCharacter.system || 'custom'}/${currentCharacter.name.replace(/\s+/g, '_')}.json`;

  const fetchHistory = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const list = await getCharacterHistory(effectivePath);
      setVersions(list);
      if (list.length > 0 && !selectedVersion) {
        setSelectedVersion(list[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load version history:', err);
      setStatusMessage({ text: 'Historie konnte nicht vollständig geladen werden', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, effectivePath]);

  // Load preview when selectedVersion changes
  useEffect(() => {
    if (selectedVersion) {
      setIsLoadingPreview(true);
      loadLocalCharacter(selectedVersion.versionPath)
        .then((data) => {
          setPreviewData(data);
        })
        .catch((e) => {
          console.warn('Could not load version preview:', e);
          setPreviewData(null);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    } else {
      setPreviewData(null);
    }
  }, [selectedVersion]);

  if (!isOpen) return null;

  const handleExecuteRestore = async (version: CharacterHistoryVersion) => {
    setIsRestoring(true);
    setStatusMessage(null);
    try {
      const restored = await restoreCharacterVersion(effectivePath, version.versionPath);
      setStatusMessage({ text: `Version erfolgreich wiederhergestellt!`, type: 'success' });
      onRestore(restored);
      setConfirmRollbackVersion(null);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Fehler beim Rollback', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'gerade eben';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `vor ${diffMin} Min.`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-start justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <History size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold font-mono tracking-wide text-white">
                  Versions-Historie
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                  {versions.length} / 10 Versionen
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                {currentCharacter.name} • Es werden immer automatisch die letzten 10 Stände gespeichert.
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

        {/* Status Message */}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Column: Version Timeline */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-zinc-800/80 overflow-y-auto p-4 space-y-2.5 bg-zinc-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Verfügbare Versionen
              </span>
              <button
                type="button"
                onClick={fetchHistory}
                disabled={isLoading}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Historie neu einlesen"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
              </button>
            </div>

            {/* Current Live Version marker */}
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Aktiver Charakterstand
                </span>
                <span className="text-[10px] text-zinc-400">Jetzt geöffnet</span>
              </div>
              <p className="text-white font-bold truncate">{currentCharacter.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentCharacter.subTitle || 'Kein Untertitel'}</p>
            </div>

            {versions.length === 0 ? (
              <div className="text-center py-8 px-3 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                <Clock size={28} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-zinc-400 font-mono">Noch keine Historie archiviert</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                  Sobald du Änderungen an diesem Charakter vornimmst oder eine Stufe aufsteigst, wird der vorherige Stand automatisch als Version gesichert.
                </p>
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                const formattedDate = new Date(ver.timestamp).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                        : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        Version {versions.length - idx}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatRelativeTime(ver.timestamp)}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white font-mono truncate">
                      {ver.subTitle || ver.characterName}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1">
                      <span>{formattedDate}</span>
                      <span>{(ver.size / 1024).toFixed(1)} KB</span>
                    </div>

                    {ver.statsPreview && ver.statsPreview.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ver.statsPreview.slice(0, 3).map((st, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Version Inspector & Diff */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-y-auto p-5 bg-zinc-950">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">
                      Ausgewählte Historien-Version
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                      {selectedVersion.characterName}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      {selectedVersion.subTitle || 'Kein Untertitel'} • Gespeichert am{' '}
                      {new Date(selectedVersion.timestamp).toLocaleString('de-DE')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {previewData && (
                      <button
                        type="button"
                        onClick={() => downloadCharacterFile(previewData)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-750 transition-colors text-xs font-mono"
                        title="Diesen Stand als JSON-Backup herunterladen"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {isLoadingPreview ? (
                  <div className="py-12 text-center text-xs font-mono text-zinc-500">
                    <RefreshCw size={20} className="mx-auto animate-spin mb-2 text-cyan-400" />
                    <span>Lade Versionsdetails...</span>
                  </div>
                ) : previewData ? (
                  <div className="space-y-3.5 text-xs font-mono">
                    {/* Key Attributes Comparison */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                        Wichtige Werte in dieser Version:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {previewData.stats?.map((stat, i) => (
                          <div
                            key={i}
                            className="bg-black/40 border border-zinc-800/80 p-2 rounded-lg flex flex-col"
                          >
                            <span className="text-[9px] text-zinc-500 uppercase">{stat.label}</span>
                            <span className="text-sm font-black text-white">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Characteristics / Attributes if present */}
                    {previewData.characteristics && previewData.characteristics.length > 0 && (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 space-y-2">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                          Attribute:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {previewData.characteristics.map((c, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs"
                            >
                              <strong className="text-cyan-300">{c.label}:</strong> {c.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Currency & XP in this version */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">Vermögen</span>
                        <span className="text-sm font-bold text-amber-400">
                          {(previewData.currency?.amount || 0).toLocaleString('de-DE')}{' '}
                          {previewData.currency?.unit || 'GM'}
                        </span>
                      </div>

                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Erfahrungspunkte (EP)
                        </span>
                        <span className="text-sm font-bold text-orange-400">
                          {(previewData.experience?.current || 0).toLocaleString('de-DE')} EP
                        </span>
                      </div>
                    </div>

                    {/* Weapons / Abilities Count */}
                    <div className="text-[11px] text-zinc-500 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-800/60 flex items-center justify-between">
                      <span>
                        Waffen:{' '}
                        <strong className="text-zinc-300">
                          {(previewData.weapons?.melee?.length || 0) + (previewData.weapons?.ranged?.length || 0)}
                        </strong>
                      </span>
                      <span>
                        Talente/Kräfte:{' '}
                        <strong className="text-zinc-300">{previewData.abilities?.length || 0}</strong>
                      </span>
                      <span>
                        Fertigkeiten:{' '}
                        <strong className="text-zinc-300">{previewData.skills?.length || 0}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-zinc-500">
                    Konnte detaillierte Vorschau nicht laden
                  </div>
                )}

                {/* Rollback Action Section */}
                <div className="pt-4 border-t border-zinc-800/80">
                  {confirmRollbackVersion?.id === selectedVersion.id ? (
                    <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono">
                        <AlertCircle size={16} />
                        <span>Bist du sicher?</span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                        Dein Charakterbogen wird auf den Stand vom{' '}
                        <strong>
                          {new Date(selectedVersion.timestamp).toLocaleString('de-DE')}
                        </strong>{' '}
                        zurückgesetzt. Dein momentaner Zustand wird davor automatisch als neue Historienversion gesichert.
                      </p>
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmRollbackVersion(null)}
                          disabled={isRestoring}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono cursor-pointer"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExecuteRestore(selectedVersion)}
                          disabled={isRestoring}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          {isRestoring ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          <span>Ja, Rollback durchführen</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRollbackVersion(selectedVersion)}
                      className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
                    >
                      <RotateCcw size={15} />
                      <span>Diese Version wiederherstellen (Rollback)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 font-mono">
                <History size={40} className="text-zinc-700 mb-3" />
                <h4 className="text-sm font-bold text-zinc-300">Wähle links eine Version aus</h4>
                <p className="text-xs max-w-sm mt-1">
                  Hier kannst du historische Stände ansehen und deinen Charakter mit einem Klick auf einen früheren Zeitpunkt zurücksetzen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/60 text-[11px] font-mono text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">🛡️</span>
            <span>
              <strong>Automatischer 10-Versionen Puffer:</strong> Ältere Versionen jenseits der 10 neuesten werden automatisch bereinigt.
            </span>
          </div>
          <span className="text-zinc-500">
            Speicherort: ./characters/.history/
          </span>
        </div>
      </motion.div>
    </div>
  );
};
