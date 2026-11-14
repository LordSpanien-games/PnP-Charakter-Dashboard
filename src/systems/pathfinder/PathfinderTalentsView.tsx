import React, { useState, useMemo, useCallback } from "react";
import { Plus, Minus, X, Edit, Trash2, ShieldCheck, Sword, RotateCcw } from "lucide-react";
import { GenericCharacter, Ability, CombatModifier } from "../../core/types";
import { SourceReferenceEditor } from "../../core/uiKit";

interface PathfinderTalentsViewProps {
  character: GenericCharacter;
  onUpdate: (patch: Partial<GenericCharacter["systemData"]>) => void;
  isEditing?: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  class: "Klassenmerkmale",
  talent: "Talente",
  race: "Rassenfähigkeiten",
  gnome: "Gnom-Fähigkeiten",
  item: "Ausrüstungs-Fähigkeiten",
  other: "Sonstige",
};

const MAX_UNDO = 5;

export default function PathfinderTalentsView({ character, onUpdate, isEditing: externalIsEditing }: PathfinderTalentsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newAbility, setNewAbility] = useState({ name: "", type: "talent" as const });
  const [newEffect, setNewEffect] = useState("");
  const [newUsage, setNewUsage] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [undoStack, setUndoStack] = useState<Ability[][]>([]);

  const abilities = character.abilities || [];

  // Verwende externen isEditing wenn vorhanden, sonst lokalen
  const editMode = externalIsEditing ?? isEditing;

  const pushUndo = useCallback((next: Ability[]) => {
    setUndoStack((prev) => {
      const updated = [abilities, ...prev].slice(0, MAX_UNDO);
      return updated;
    });
  }, [abilities]);

  const doUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[0];
    const rest = undoStack.slice(1);
    setUndoStack(rest);
    onUpdate({ abilities: previous });
  }, [undoStack, onUpdate]);

  const groupedAbilities = useMemo(() => {
    const groups: Record<string, { ability: Ability; globalIndex: number }[]> = {};
    abilities.forEach((a, globalIndex) => {
      const key = a.type || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ability: a, globalIndex });
    });
    return groups;
  }, [abilities]);

  const updateAbility = (globalIndex: number, patch: Partial<Ability>) => {
    const next = [...abilities];
    next[globalIndex] = { ...next[globalIndex], ...patch };
    pushUndo(next);
    onUpdate({ abilities: next });
  };

  const removeAbility = (globalIndex: number) => {
    const next = abilities.filter((_, i) => i !== globalIndex);
    pushUndo(next);
    onUpdate({ abilities: next });
  };

  const addAbility = (groupKey: string) => {
    if (!newAbility.name.trim()) return;
    const ability: Ability = {
      id: crypto.randomUUID(),
      name: newAbility.name.trim(),
      type: groupKey as any,
      effect: newEffect.trim() || undefined,
      usage: newUsage.trim() || undefined,
      maxUses: newMaxUses ? Number(newMaxUses) : undefined,
    };
    const next = [...abilities, ability];
    pushUndo(next);
    onUpdate({ abilities: next });
    setNewAbility({ name: "", type: groupKey as any });
    setNewEffect("");
    setNewUsage("");
    setNewMaxUses("");
  };

  const toggleEdit = () => {
    if (externalIsEditing !== undefined) return;
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-zinc-200">Talente & Fähigkeiten</h2>
        {externalIsEditing === undefined && (
          <button
            onClick={toggleEdit}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] text-zinc-300 font-mono rounded border border-zinc-600"
          >
            {editMode ? "Fertig" : "Bearbeiten"}
          </button>
        )}
        {editMode && undoStack.length > 0 && (
          <button
            onClick={doUndo}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[9px] text-zinc-300 font-mono rounded border border-zinc-600"
            title="Letzte Aktion rückgängig machen"
          >
            <RotateCcw size={12} className="mr-1" /> Zurück
          </button>
        )}
      </div>

      {Object.entries(groupedAbilities).map(([groupKey, group]) => (
        <div key={groupKey} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
              {GROUP_LABELS[groupKey] || groupKey}
            </span>
            {editMode && (
              <button
                onClick={() => addAbility(groupKey)}
                className="px-1 py-0.5 bg-amber-500 hover:bg-amber-400 text-black text-[8px] font-mono rounded"
              >
                + Neue Fähigkeit
              </button>
            )}
          </div>

          <div className="space-y-1">
            {group.map(({ ability, globalIndex }) => (
              <div
                key={globalIndex}
                className={`p-2 border rounded-lg ${
                  editMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-900/50 border-zinc-800/50"
                }`}
              >
                {editMode ? (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <input
                        value={ability.name}
                        onChange={(e) => updateAbility(globalIndex, { name: e.target.value })}
                        className="flex-1 bg-zinc-900 border border-zinc-600 rounded text-[9px] text-white font-mono px-1 py-0.5"
                      />
                      <button
                        onClick={() => removeAbility(globalIndex)}
                        className="text-red-400 hover:text-red-300 text-[9px]"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[8px] text-zinc-500 font-mono block mb-0.5">Effekt</label>
                        <input
                          value={ability.effect || ""}
                          onChange={(e) => updateAbility(globalIndex, { effect: e.target.value || undefined })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded text-[8px] text-white font-mono px-1 py-0.5"
                          placeholder="Effektbeschreibung"
                        />
                      </div>
                      <div className="min-w-[100px]">
                        <label className="text-[8px] text-zinc-500 font-mono block mb-0.5">Nutzung</label>
                        <input
                          value={ability.usage || ""}
                          onChange={(e) => updateAbility(globalIndex, { usage: e.target.value || undefined })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded text-[8px] text-white font-mono px-1 py-0.5"
                          placeholder="z.B. 1x/Tag"
                        />
                      </div>
                      <div className="min-w-[60px]">
                        <label className="text-[8px] text-zinc-500 font-mono block mb-0.5">Max.</label>
                        <input
                          type="number"
                          value={ability.maxUses ?? ""}
                          onChange={(e) => updateAbility(globalIndex, { maxUses: e.target.value ? Number(e.target.value) : undefined })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded text-[8px] text-white font-mono px-1 py-0.5 text-center"
                        />
                      </div>
                      <div className="min-w-[80px]">
                        <label className="text-[8px] text-zinc-500 font-mono block mb-0.5">Typ</label>
                        <select
                          value={ability.type || "other"}
                          onChange={(e) => updateAbility(globalIndex, { type: e.target.value as any })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded text-[8px] text-white font-mono px-1 py-0.5"
                        >
                          <option value="class">Klasse</option>
                          <option value="talent">Talent</option>
                          <option value="race">Rasse</option>
                          <option value="gnome">Gnom</option>
                          <option value="item">Item</option>
                          <option value="other">Sonstiges</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(ability.showInCombat)}
                          onChange={(e) => updateAbility(globalIndex, { showInCombat: e.target.checked })}
                          className="accent-amber-500"
                        />
                        <span className="text-[8px] text-white font-mono">Kampf</span>
                      </div>
                    </div>
                    <SourceReferenceEditor
                      value={ability.sourceReference}
                      onChange={(v) => updateAbility(globalIndex, { sourceReference: v })}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-zinc-100">{ability.name}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded ${
                        ability.type === "talent" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        ability.type === "class" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        ability.type === "race" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        ability.type === "gnome" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-zinc-600/20 text-zinc-400 border border-zinc-500/20"
                      }`}>
                        {GROUP_LABELS[ability.type || "other"] || ability.type}
                      </span>
                    </div>
                    {ability.effect && (
                      <div className="text-[9px] text-zinc-400 mt-0.5">{ability.effect}</div>
                    )}
                    {ability.usage && (
                      <div className="text-[9px] text-zinc-500 mt-0.5">{ability.usage}</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
