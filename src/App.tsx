import React, { useState, useEffect } from "react";
import { ensureSystemsRegistered } from "./core/bootstrap";
import { GenericCharacter } from "./core/types";
import { getSystem } from "./core/systemRegistry";
import {
  saveActiveCharacter,
  loadActiveCharacter,
  loadLastCharacterForSystem,
  exportCharacterToFile,
} from "./core/persistence";

import { Launcher } from "./components/launcher/Launcher";
import { CreateCharacterModal } from "./components/CreateCharacterModal";
import { CompareCharactersModal } from "./components/CompareCharactersModal";

ensureSystemsRegistered();

export default function App() {
  const [character, setCharacter] = useState<GenericCharacter | null>(null);
  const [view, setView] = useState<"launcher" | "dashboard">("launcher");
  const [selectedSystemId, setSelectedSystemId] = useState<string>("cairn");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Beim Start: zuletzt aktiven Charakter aus dem Browser-Cache laden
  useEffect(() => {
    const last = loadActiveCharacter();
    if (last) {
      setCharacter(last);
      setSelectedSystemId(last.systemId);
      setView("dashboard");
    }
  }, []);

  // Bei jeder Änderung automatisch im Browser-Cache sichern
  useEffect(() => {
    if (character) saveActiveCharacter(character);
  }, [character]);

  const updateCharacter = (updates: Partial<GenericCharacter>) => {
    setCharacter((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleSelectSystem = (id: string) => {
    setSelectedSystemId(id);
    const last = loadLastCharacterForSystem(id);
    if (last) {
      setCharacter(last);
    }
  };

  const handleExport = () => {
    if (!character) return;
    const bumped = exportCharacterToFile(character);
    setCharacter(bumped);
  };

  // 1. LAUNCHER
  if (view === "launcher") {
    return (
      <>
        <Launcher
          selectedSystemId={selectedSystemId}
          setSelectedSystemId={handleSelectSystem}
          currentCharacter={character}
          onSelectCharacter={(c) => {
            setCharacter(c);
            setSelectedSystemId(c.systemId);
            setView("dashboard");
          }}
          onOpenDashboard={() => setView("dashboard")}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenCompareModal={() => setIsCompareModalOpen(true)}
        />

        <CreateCharacterModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateCharacter={(c) => {
            setCharacter(c);
            setSelectedSystemId(c.systemId);
            setView("dashboard");
            setIsCreateModalOpen(false);
          }}
        />

        <CompareCharactersModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
        />
      </>
    );
  }

  // 2. DASHBOARD
  if (!character) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4 font-mono">Kein Charakter geladen</h2>
        <button
          onClick={() => setView("launcher")}
          className="px-4 py-2 bg-orange-500 text-black font-mono font-bold rounded-xl"
        >
          Zum System-Launcher
        </button>
      </div>
    );
  }

  const plugin = getSystem(character.systemId);
  if (!plugin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4 font-mono">
          Unbekanntes System: {character.systemId}
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 md:p-12 relative selection:bg-orange-500 selection:text-black">
      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white font-mono">{character.name}</h1>
            <p className="text-xs text-zinc-500 font-mono">
              {character.subTitle} · {plugin.name} · v{character.exportVersion}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("launcher")}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold"
            >
              Launcher
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border ${
                isEditing
                  ? "bg-orange-500 text-black border-orange-400"
                  : "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {isEditing ? "Bearbeiten beenden" : "Bearbeiten"}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-xl text-xs font-mono font-bold"
            >
              Exportieren
            </button>
          </div>
        </div>

        <plugin.DashboardComponent
          character={character}
          isEditing={isEditing}
          onUpdate={updateCharacter}
        />
      </div>
    </div>
  );
}
