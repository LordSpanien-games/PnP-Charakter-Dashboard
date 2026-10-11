import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { CharacterData, GameSystem, LocalCharacterMeta } from "./types";
import { FLOKI_DATA } from "./data";
import {
  isPathfinder,
  calculateSavingThrows,
  syncPathfinderStats,
  formatPathfinderModifier,
  getOrInitializePathfinderCharacteristics,
  recalculatePathfinderCharacter
} from "./utils/pathfinder";
import { listLocalCharacters, saveLocalCharacter } from "./services/characterStorageService";
import { initializeCharacterInventory, syncInventoryToWeapons, extractDailyUsesFromText } from "./utils/inventorySync";

// System-specific & Page Components
import { SkillsPage } from "./components/SkillsPage";
import { DiceCalculator } from "./components/DiceCalculator";
import { OriginalCharacterSheet } from "./components/OriginalCharacterSheet";
import { PathfinderCombatView } from "./systems/pathfinder/PathfinderCombatView";

// Modular Dashboard Components
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { DashboardView } from "./components/dashboard/DashboardView";
import { FloatingActionButtons } from "./components/dashboard/FloatingActionButtons";
import { Launcher, PRESET_CHARACTERS } from "./components/launcher/Launcher";

// Modals
import { CreateCharacterModal } from "./components/CreateCharacterModal";
import { CurrencyCalculatorModal } from "./components/CurrencyCalculatorModal";
import { BackupModal } from "./components/BackupModal";
import { LocalCharacterVaultModal } from "./components/LocalCharacterVaultModal";
import { LevelUpModal } from "./components/LevelUpModal";
import { RogueTalentsModal } from "./components/RogueTalentsModal";
import { ShadowrunQualitiesModal } from "./components/ShadowrunQualitiesModal";
import { CharacterHistoryModal } from "./components/CharacterHistoryModal";
import { RestAndRecoveryModal } from "./components/RestAndRecoveryModal";

export default function App() {
  const [data, setData] = useState<CharacterData | null>(FLOKI_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [view, setView] = useState<'launcher' | 'dashboard' | 'onboarding'>('launcher');
  const [dashboardTab, setDashboardTab] = useState<'sheet' | 'skills' | 'calc' | 'original' | 'combat'>('sheet');
  const [selectedSystem, setSelectedSystem] = useState<GameSystem>('pathfinder');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isRogueTalentModalOpen, setIsRogueTalentModalOpen] = useState(false);
  const [isShadowrunQualitiesModalOpen, setIsShadowrunQualitiesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [activeHistoryRelativePath, setActiveHistoryRelativePath] = useState<string>('');
  const [saveToast, setSaveToast] = useState<{ message: string; subMessage?: string } | null>(null);
  const [localCharactersList, setLocalCharactersList] = useState<LocalCharacterMeta[]>([]);
  const [isLoadingLocalChars, setIsLoadingLocalChars] = useState(false);

  const refreshLocalCharacters = async () => {
    setIsLoadingLocalChars(true);
    try {
      const list = await listLocalCharacters();
      setLocalCharactersList(list);
    } catch (e) {
      console.warn("Could not fetch local characters:", e);
    } finally {
      setIsLoadingLocalChars(false);
    }
  };

  useEffect(() => {
    refreshLocalCharacters();
  }, []);

  const updateData = (updates: Partial<CharacterData>) => {
    if (!data) return;
    setData(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  // Ensure Pathfinder saving throws and characteristics are always synchronized
  useEffect(() => {
    if (!data || !isPathfinder(data)) return;

    const charsNeedInit = !data.characteristics || data.characteristics.length < 6;
    const currentChars = charsNeedInit ? getOrInitializePathfinderCharacteristics(data) : data.characteristics;

    const expectedSaves = calculateSavingThrows({ ...data, characteristics: currentChars }, data.savingThrows);

    const savesNeedUpdate = !data.savingThrows ||
      !data.savingThrows.fortitude ||
      !data.savingThrows.reflex ||
      !data.savingThrows.will ||
      data.savingThrows.fortitude.abilityMod !== expectedSaves.fortitude.abilityMod ||
      data.savingThrows.fortitude.total !== expectedSaves.fortitude.total ||
      data.savingThrows.reflex.abilityMod !== expectedSaves.reflex.abilityMod ||
      data.savingThrows.reflex.total !== expectedSaves.reflex.total ||
      data.savingThrows.will.abilityMod !== expectedSaves.will.abilityMod ||
      data.savingThrows.will.total !== expectedSaves.will.total;

    const statsNeedSync = (data.stats || []).some(s => {
      const l = (s?.label || '').toLowerCase();
      if (l.includes('zäh') || l.includes('fort')) {
        return s.label !== 'Zähigkeit (Konstitution)' || s.value !== formatPathfinderModifier(expectedSaves.fortitude.total);
      }
      if (l.includes('ref')) {
        return s.label !== 'Reflex (Geschicklichkeit)' || s.value !== formatPathfinderModifier(expectedSaves.reflex.total);
      }
      if (l.includes('will')) {
        return s.label !== 'Wille (Weisheit)' || s.value !== formatPathfinderModifier(expectedSaves.will.total);
      }
      return false;
    });

    if (charsNeedInit || savesNeedUpdate || statsNeedSync) {
      setData(prev => {
        if (!prev) return null;
        const updatedChars = charsNeedInit ? currentChars : prev.characteristics;
        const updatedSaves = calculateSavingThrows({ ...prev, characteristics: updatedChars }, prev.savingThrows);
        const updatedStats = syncPathfinderStats(prev.stats, updatedSaves);
        return {
          ...prev,
          characteristics: updatedChars,
          savingThrows: updatedSaves,
          stats: updatedStats
        };
      });
    }
  }, [data?.system, data?.characteristics, data?.savingThrows]);

  // Ensure Shadowrun Essenz is always synced with body modifications
  useEffect(() => {
    if (!data || data.system !== 'shadowrun' || !data.bodyMods) return;
    const totalSpent = data.bodyMods.reduce((acc, mod) => acc + (Number(mod.essenceCost) || 0), 0);
    const remaining = Math.max(0, parseFloat((6.0 - totalSpent).toFixed(2)));
    const essStat = data.stats.find(s => s.label.toLowerCase() === 'essenz' || s.label.toLowerCase() === 'essence');
    if (essStat && Number(essStat.value) !== remaining) {
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          stats: prev.stats.map(s =>
            (s.label.toLowerCase() === 'essenz' || s.label.toLowerCase() === 'essence')
              ? { ...s, value: remaining }
              : s
          )
        };
      });
    }
  }, [data?.bodyMods, data?.system]);

  // Ensure inventory is initialized and synchronized
  useEffect(() => {
    if (!data) return;

    let needsUpdate = false;
    let updatedInventory = data.inventory;

    if (!data.inventory || data.inventory.length === 0) {
      updatedInventory = initializeCharacterInventory(data);
      needsUpdate = true;
    } else {
      const scannedInventory = data.inventory.map(item => {
        if (item.maxUses === undefined) {
          const detected = extractDailyUsesFromText(item.notes, item.name);
          if (detected !== undefined) {
            needsUpdate = true;
            return {
              ...item,
              maxUses: detected,
              currentUses: item.currentUses !== undefined ? item.currentUses : detected
            };
          }
        } else if (item.currentUses === undefined) {
          needsUpdate = true;
          return { ...item, currentUses: item.maxUses };
        }
        return item;
      });
      if (needsUpdate) updatedInventory = scannedInventory;
    }

    let updatedAbilities = data.abilities;
    if (data.abilities) {
      let abilitiesChanged = false;
      const scannedAbilities = data.abilities.map(ab => {
        if (ab.maxUses === undefined) {
          const detected = extractDailyUsesFromText(ab.usage, ab.name) ?? extractDailyUsesFromText(ab.effect, ab.name);
          if (detected !== undefined) {
            abilitiesChanged = true;
            return {
              ...ab,
              maxUses: detected,
              currentUses: ab.currentUses !== undefined ? ab.currentUses : detected
            };
          }
        } else if (ab.currentUses === undefined) {
          abilitiesChanged = true;
          return { ...ab, currentUses: ab.maxUses };
        }
        return ab;
      });
      if (abilitiesChanged) {
        updatedAbilities = scannedAbilities;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      setData(prev => {
        if (!prev) return null;
        const syncedWeapons = updatedInventory ? syncInventoryToWeapons(updatedInventory) : prev.weapons;
        return {
          ...prev,
          inventory: updatedInventory,
          abilities: updatedAbilities,
          weapons: (syncedWeapons.melee.length > 0 || syncedWeapons.ranged.length > 0) ? syncedWeapons : prev.weapons
        };
      });
    }
  }, [data?.name, data?.system, data?.inventory, data?.abilities]);

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyLevelUp = async (updatedCharacter: CharacterData) => {
    let finalized = updatedCharacter;
    if (isPathfinder(updatedCharacter)) {
      finalized = recalculatePathfinderCharacter(updatedCharacter);
    }
    setData(finalized);
    setSaveToast({
      message: 'Stufenaufstieg erfolgreich angewendet!',
      subMessage: `${finalized.name} • ${finalized.subTitle || ''}`
    });
    setTimeout(() => setSaveToast(null), 4000);

    try {
      const res = await saveLocalCharacter(updatedCharacter);
      if (res.success && res.relativePath) {
        setSaveToast({
          message: 'Stufenaufstieg angewendet & lokal gesichert!',
          subMessage: `characters/${res.relativePath}`
        });
        refreshLocalCharacters();
        setTimeout(() => setSaveToast(null), 4500);
      }
    } catch (e) {
      console.warn("Auto-save after level up skipped:", e);
    }
  };

  const handleApplyRest = async (updates: Partial<CharacterData>, summaryMessage: string) => {
    if (!data) return;
    const updatedCharacter = { ...data, ...updates };
    setData(updatedCharacter);
    setSaveToast({ message: 'Rast abgeschlossen!', subMessage: summaryMessage });
    setTimeout(() => setSaveToast(null), 5000);
    try {
      const res = await saveLocalCharacter(updatedCharacter);
      if (res.success && res.relativePath) refreshLocalCharacters();
    } catch (e) {
      console.warn("Auto-save after rest skipped:", e);
    }
  };

  const handleSaveLocal = async () => {
    if (!data) return;
    try {
      const res = await saveLocalCharacter(data);
      setSaveToast({
        message: `Erfolgreich lokal gespeichert!`,
        subMessage: `characters/${res.relativePath}`,
      });
      refreshLocalCharacters();
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err: any) {
      console.warn("Direct save failed, downloading JSON backup:", err);
      handleDownload();
      setSaveToast({
        message: `Als Backup-JSON heruntergeladen`,
        subMessage: `${data.name}_data.json`,
      });
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  // 1. LAUNCHER VIEW
  if (view === 'launcher' || view === 'onboarding') {
    return (
      <>
        <Launcher
          selectedSystem={selectedSystem}
          setSelectedSystem={setSelectedSystem}
          onSelectCharacter={(newChar) => {
            setData(newChar);
            setSelectedSystem(newChar.system || 'pathfinder');
            setView('dashboard');
          }}
          currentCharacter={data}
          onOpenDashboard={() => setView('dashboard')}
          localCharactersList={localCharactersList}
          refreshLocalCharacters={refreshLocalCharacters}
          isLoadingLocalChars={isLoadingLocalChars}
          onOpenVaultModal={() => setIsVaultModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        <CreateCharacterModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateCharacter={(newChar) => {
            setData(newChar);
            setSelectedSystem(newChar.system);
            setView('dashboard');
            setIsCreateModalOpen(false);
          }}
        />

        <LocalCharacterVaultModal
          isOpen={isVaultModalOpen}
          onClose={() => {
            setIsVaultModalOpen(false);
            refreshLocalCharacters();
          }}
          currentData={data}
          onLoadCharacter={(char) => {
            if (isPathfinder(char)) {
              char.stats = syncPathfinderStats(char.stats, char.savingThrows);
            }
            setData(char);
            setSelectedSystem(char.system || 'pathfinder');
            setView('dashboard');
            refreshLocalCharacters();
          }}
          onSaveCurrentSuccess={(savedPath) => {
            setSaveToast({
              message: 'Erfolgreich lokal gespeichert!',
              subMessage: savedPath,
            });
            setActiveHistoryRelativePath(savedPath);
            refreshLocalCharacters();
            setTimeout(() => setSaveToast(null), 4000);
          }}
          onOpenHistoryForCharacter={(charMeta) => {
            setActiveHistoryRelativePath(charMeta.relativePath);
            setIsHistoryModalOpen(true);
          }}
        />

        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          currentCharacter={data}
          selectedSystem={selectedSystem}
        />
      </>
    );
  }

  // 2. DASHBOARD VIEW
  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4 font-mono">Kein Charakter ausgewählt</h2>
        <button
          onClick={() => setView('launcher')}
          className="px-4 py-2 bg-orange-500 text-black font-mono font-bold rounded-xl"
        >
          Zum System-Launcher
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 md:p-12 relative selection:bg-orange-500 selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <DashboardHeader
          data={data}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          updateData={updateData}
          dashboardTab={dashboardTab}
          setDashboardTab={setDashboardTab}
          onSaveLocal={handleSaveLocal}
          onOpenHistory={() => {
            const sysFolder = data.system === 'pathfinder' ? 'pathfinder' : data.system === 'coc7e' ? 'coc_7e' : data.system === 'coc1920' ? 'coc_1920' : data.system === 'shadowrun' ? 'shadowrun' : data.system === 'traveller' ? 'traveller' : 'custom';
            const rel = activeHistoryRelativePath || `${sysFolder}/${data.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`;
            setActiveHistoryRelativePath(rel);
            setIsHistoryModalOpen(true);
          }}
          onOpenLevelUp={() => setIsLevelUpModalOpen(true)}
          onOpenVault={() => setIsVaultModalOpen(true)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenLauncher={() => setView('launcher')}
          onOpenImport={() => setIsCreateModalOpen(true)}
          onOpenRestModal={() => setIsRestModalOpen(true)}
          presetCharacters={PRESET_CHARACTERS}
          onSelectPreset={(preset) => {
            if (isPathfinder(preset.data)) {
              preset.data.stats = syncPathfinderStats(preset.data.stats, preset.data.savingThrows);
            }
            setData(preset.data);
            setSelectedSystem(preset.system);
          }}
        />

        {dashboardTab === 'sheet' ? (
          <DashboardView
            character={data}
            isEditing={isEditing}
            onUpdateData={updateData}
            onUpdateCharacter={(newChar) => setData(newChar)}
            onOpenRogueTalentModal={() => setIsRogueTalentModalOpen(true)}
            onOpenShadowrunQualitiesModal={() => setIsShadowrunQualitiesModalOpen(true)}
            onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
            onOpenDiceCalc={() => setDashboardTab('calc')}
            onSwitchToCombatTab={() => setDashboardTab('combat')}
          />
        ) : dashboardTab === 'combat' ? (
          <PathfinderCombatView
            character={data}
            onUpdateCharacter={(newChar) => setData(newChar)}
            onUpdateData={updateData}
            onOpenDiceCalc={(title, mod) => setDashboardTab('calc')}
            isEditing={isEditing}
          />
        ) : dashboardTab === 'skills' ? (
          <SkillsPage
            data={data}
            isEditing={isEditing}
            onUpdateData={updateData}
          />
        ) : dashboardTab === 'calc' ? (
          <DiceCalculator
            data={data}
          />
        ) : (
          <OriginalCharacterSheet
            data={data}
            onUpdateData={updateData}
            onSaveToVault={handleSaveLocal}
          />
        )}
      </div>

      <FloatingActionButtons
        dashboardTab={dashboardTab}
        onToggleOriginalSheet={() => setDashboardTab(dashboardTab === 'original' ? 'sheet' : 'original')}
        onOpenLevelUpModal={() => setIsLevelUpModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onSaveLocal={handleSaveLocal}
        onOpenRestModal={() => setIsRestModalOpen(true)}
      />

      <footer className="border-t border-zinc-900 py-12 text-center mt-16">
        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-700 font-mono">
          Character Reference System // {data.name} v9.0 • Modular Architecture
        </p>
      </footer>

      <CreateCharacterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCharacter={(newChar) => {
          setData(newChar);
          setSelectedSystem(newChar.system);
          setView('dashboard');
          setIsCreateModalOpen(false);
        }}
      />

      <CurrencyCalculatorModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        character={data}
        onUpdateCurrency={(newCurrency) => {
          updateData({ currency: newCurrency });
        }}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentCharacter={data}
        selectedSystem={selectedSystem}
      />

      <LocalCharacterVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          refreshLocalCharacters();
        }}
        currentData={data}
        onLoadCharacter={(char) => {
          if (isPathfinder(char)) {
            char.stats = syncPathfinderStats(char.stats, char.savingThrows);
          }
          setData(char);
          setSelectedSystem(char.system || 'pathfinder');
          setView('dashboard');
          refreshLocalCharacters();
        }}
        onSaveCurrentSuccess={(savedPath) => {
          setSaveToast({
            message: 'Erfolgreich lokal gespeichert!',
            subMessage: savedPath,
          });
          setActiveHistoryRelativePath(savedPath);
          refreshLocalCharacters();
          setTimeout(() => setSaveToast(null), 4000);
        }}
        onOpenHistoryForCharacter={(charMeta) => {
          setActiveHistoryRelativePath(charMeta.relativePath);
          setIsHistoryModalOpen(true);
        }}
      />

      <LevelUpModal
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        character={data}
        onApplyLevelUp={handleApplyLevelUp}
      />

      <RogueTalentsModal
        isOpen={isRogueTalentModalOpen}
        onClose={() => setIsRogueTalentModalOpen(false)}
        character={data}
        onUpdateAbilities={(newAbilities) => updateData({ abilities: newAbilities })}
      />

      {data && (
        <ShadowrunQualitiesModal
          isOpen={isShadowrunQualitiesModalOpen}
          onClose={() => setIsShadowrunQualitiesModalOpen(false)}
          character={data}
          onUpdateAbilities={(newAbilities) => updateData({ abilities: newAbilities })}
        />
      )}

      <CharacterHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentCharacter={data}
        characterRelativePath={activeHistoryRelativePath}
        onRestore={(restored) => {
          if (isPathfinder(restored)) {
            restored.stats = syncPathfinderStats(restored.stats, restored.savingThrows);
          }
          setData(restored);
          setSaveToast({
            message: 'Version erfolgreich wiederhergestellt!',
            subMessage: `${restored.name} (${restored.system || 'pathfinder'})`,
          });
          refreshLocalCharacters();
          setTimeout(() => setSaveToast(null), 4000);
        }}
      />

      {data && isRestModalOpen && (
        <RestAndRecoveryModal
          isOpen={isRestModalOpen}
          onClose={() => setIsRestModalOpen(false)}
          character={data}
          onApplyRest={handleApplyRest}
        />
      )}

      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 font-mono text-xs max-w-md pointer-events-auto"
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white">{saveToast.message}</div>
              {saveToast.subMessage && (
                <div className="text-[11px] text-emerald-300/80 truncate">
                  📁 {saveToast.subMessage}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
