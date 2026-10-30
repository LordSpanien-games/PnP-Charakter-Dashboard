import React, { useState } from "react";
import { GenericCharacter } from "../../core/types";

import { SHADOWRUN_SKILLS } from "../../data/skills/shadowrunSkills";

interface Props {
  character: GenericCharacter;
  isEditing: boolean;
  onUpdate: (updates: Partial<GenericCharacter>) => void;
}

export const ShadowrunSkillsBlock: React.FC<Props> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Masterliste mit Charakter-Skills mergen
  const merged = SR_MASTER_SKILLS.map((def) => {
    const existing = character.skills.find(
      (s) => s.name.toLowerCase() === def.name.toLowerCase()
    );
    return {
      name: def.name,
      category: def.category,
      value: existing?.value ?? 0,
      hasValue: !!existing && Number(existing.value) > 0,
    };
  });

  // Skills die der Charakter hat, aber NICHT in der Masterliste stehen
  const extraSkills = character.skills.filter(
    (s) =>
      !SR_MASTER_SKILLS.some(
        (m) => m.name.toLowerCase() === s.name.toLowerCase()
      )
  );

  const visible = showAll ? merged : merged.filter((s) => s.hasValue);
  const learnedCount = merged.filter((s) => s.hasValue).length;

  const updateSkillValue = (
    skillName: string,
    newValue: number,
    category: string
  ) => {
    const current = [...character.skills];
    const idx = current.findIndex(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], value: newValue };
    } else {
      current.push({ name: skillName, value: newValue, category });
    }
    onUpdate({ skills: current });
  };

  const updateSkillCategory = (index: number, category: string) => {
    onUpdate({
      skills: character.skills.map((s, i) =>
        i === index ? { ...s, category: category || undefined } : s
      ),
    });
  };

  const renderGroup = (
    label: string,
    skills: typeof merged
  ) => {
    if (skills.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase text-zinc-500 font-mono">
          {label} ({skills.filter((s) => s.hasValue).length}/{skills.length})
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {skills.map((s) => (
            <div
              key={s.name}
              className={`flex items-center justify-between gap-2 text-xs font-mono px-2 py-1 rounded border transition-colors ${
                s.hasValue
                  ? "bg-cyan-950/40 border-cyan-800/50"
                  : "bg-black/20 border-zinc-800/40"
              }`}
            >
              <span
                className={`truncate ${
                  s.hasValue ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {s.name}
              </span>
              <div className="shrink-0">
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={s.value}
                    onChange={(e) =>
                      updateSkillValue(
                        s.name,
                        Number(e.target.value),
                        s.category
                      )
                    }
                    className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded text-white text-[10px] font-bold outline-none focus:border-cyan-500 py-0.5"
                  />
                ) : (
                  <span
                    className={`font-bold ${
                      s.hasValue ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {s.value > 0 ? s.value : "—"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono font-bold text-zinc-300">
            Fertigkeiten
          </div>
          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
            {learnedCount} von {merged.length} belegt
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            showAll
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30"
              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {showAll ? "Nur belegte anzeigen" : "Alle anzeigen"}
        </button>
      </div>

      {/* Masterlisten-Gruppen */}
      {renderGroup(
        "Aktionsfertigkeiten",
        visible.filter((s) => s.category === "active")
      )}
      {renderGroup(
        "Wissens-/Sprachfertigkeiten",
        visible.filter((s) => s.category === "knowledge")
      )}

      {/* Sonstige (manuell eingetragen, nicht in Masterliste) */}
      {extraSkills.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
          <div className="text-[10px] uppercase text-zinc-500 font-mono">
            Sonstige Fertigkeiten ({extraSkills.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {extraSkills.map((s, idx) => {
              const globalIdx = character.skills.findIndex(
                (cs) => cs.name.toLowerCase() === s.name.toLowerCase()
              );
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs font-mono bg-black/40 px-2 py-1 rounded border border-zinc-800"
                >
                  <span className="text-zinc-300 truncate">{s.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-white font-bold">{s.value}</span>
                    {isEditing && (
                      <select
                        value={s.category || ""}
                        onChange={(e) =>
                          updateSkillCategory(globalIdx, e.target.value)
                        }
                        className="bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-400 px-1 py-0.5"
                      >
                        <option value="">–</option>
                        <option value="active">Aktion</option>
                        <option value="knowledge">Wissen</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {visible.length === 0 && extraSkills.length === 0 && (
        <p className="text-xs text-zinc-600 font-mono italic">
          Noch keine Fertigkeiten belegt. Klicke auf „Alle anzeigen".
        </p>
      )}
    </div>
  );
};
