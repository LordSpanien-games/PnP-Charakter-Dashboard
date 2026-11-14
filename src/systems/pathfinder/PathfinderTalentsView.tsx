import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { PluginViewProps } from "../../core/SystemPlugin";
import { GenericCharacter, Ability } from "../../core/types";
import {
  ValueBadge,
  ChargeTracker,
  SourceReferenceBadges,
  SourceReferenceEditor,
} from "../../core/uiKit";
import { makeId } from "./pathfinderRules";

const TYPE_LABELS: Record<string, string> = {
  class: "Klassenmerkmale",
  talent: "Talente",
  race: "Rassenfähigkeiten",
  gnome: "Rassenfähigkeiten",
  item: "Ausrüstungs-Fähigkeiten",
  other: "Weitere Fähigkeiten",
};

export const PathfinderTalentsView: React.FC<PluginViewProps> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const [abilities, setAbilities] = useState<Ability[]>(character.abilities || []);

  const updateAbility = (id: string, patch: Partial<Ability>) => {
    const next = abilities.map((a) => (a.id === id ? { ...a, ...patch } : a));
    setAbilities(next);
    onUpdate({ abilities: next });
  };

  const removeAbility = (id: string) => {
    const next = abilities.filter((a) => a.id !== id);
    setAbilities(next);
    onUpdate({ abilities: next });
  };

  const setAbilityUse = (id: string, newCurrent: number) => {
    const ability = abilities.find((a) => a.id === id);
    if (!ability) return;
    const max = ability.maxUses ?? 0;
    if (max <= 0) return;
    const nextCurrent = Math.min(max, Math.max(0, newCurrent));
    const next = abilities.map((a) =>
      a.id === id ? { ...a, currentUses: nextCurrent } : a
    );
    setAbilities(next);
    onUpdate({ abilities: next });
  };

  const addAbility = () => {
    const newAbility: Ability = {
      id: makeId(),
      name: "Neues Talent",
      type: "talent",
      effect: "",
      usage: "",
      maxUses: undefined,
      currentUses: undefined,
      sourceReference: undefined,
    };
    const next = [...abilities, newAbility];
    setAbilities(next);
    onUpdate({ abilities: next });
  };

  const groups: Record<string, Ability[]> = {};
  abilities.forEach((a) => {
    const key = a.type || "other";
    (groups[key] = groups[key] || []).push(a);
  });

  const orderedKeys = ["class", "talent", "race", "gnome", "item", "other"].filter(
    (k) => groups[k]?.length
  );
  Object.keys(groups).forEach((k) => {
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
          Talente &amp; Fähigkeiten
        </h2>
        {isEditing && (
          <button
            onClick={addAbility}
            className="flex items-center gap-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold rounded-lg text-xs"
          >
            <Plus size={14} /> Talent hinzufügen
          </button>
        )}
      </div>

      {abilities.length === 0 ? (
        <p className="text-xs text-zinc-600 font-mono">
          Keine Talente oder Fähigkeiten hinterlegt.{" "}
          {isEditing && "Klicken Sie auf "}{"Talent hinzufügen"}{", um eines hinzuzufügen."}
        </p>
      ) : (
        <>
          {orderedKeys.map((key) => (
            <div key={key} className="space-y-3">
              <div className="text-xs font-bold text-zinc-300 font-mono uppercase mb-2">
                {TYPE_LABELS[key] || key}
              </div>
              <div className="space-y-1">
                {groups[key].map((ability, index) => (
                  <div
                    key={ability.id}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {ability.name}
                        </span>
                        {ability.usage && (
                          <ValueBadge
                            label="Nutzung"
                            value={ability.usage}
                            color="text-purple-300"
                          />
                        )}
                        {ability.sourceReference && (
                          <SourceReferenceBadges
                            value={ability.sourceReference}
                          />
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeAbility(index)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {ability.effect && (
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {ability.effect}
                      </p>
                    )}

                    {ability.maxUses !== undefined && ability.maxUses > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Verwendungen:
                        </span>
                        <ChargeTracker
                          current={ability.currentUses ?? ability.maxUses}
                          max={ability.maxUses}
                          onToggle={(newCurrent) =>
                            setAbilityUse(ability.id, newCurrent)
                          }
                        />
                      </div>
                    )}

                    {isEditing && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-zinc-500 font-mono block">
                            Name
                          </label>
                          <input
                            value={ability.name}
                            onChange={(e) =>
                              updateAbility(ability.id, { name: e.target.value })
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-zinc-500 font-mono block">
                            Effekt
                          </label>
                          <input
                            value={ability.effect || ""}
                            onChange={(e) =>
                              updateAbility(ability.id, {
                                effect: e.target.value || undefined,
                              })
                            }
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                            placeholder="z.B. +1 auf Angriffswert"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-zinc-500 font-mono block">
                            Nutzung
                          </label>
                          <input
                            value={ability.usage || ""}
                            onChange={(e) =>
                              updateAbility(ability.id, {
                                usage: e.target.value || undefined,
                              })
                            }
                            className="w-32 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                            placeholder="z.B. 1x/Tag"
                          />
                          <label className="text-[9px] text-zinc-500 font-mono block">
                            Max.
                          </label>
                          <input
                            type="number"
                            value={ability.maxUses ?? ""}
                            onChange={(e) =>
                              updateAbility(ability.id, {
                                maxUses:
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                            className="w-24 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] text-zinc-500 font-mono block">
                            Typ
                          </label>
                          <select
                            value={ability.type || "other"}
                            onChange={(e) =>
                              updateAbility(ability.id, {
                                type: e.target.value as any,
                              })
                            }
                            className="w-32 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-white font-mono px-1 py-0.5"
                          >
                            <option value="class">Klassenmerkmal</option>
                            <option value="talent">Talent</option>
                            <option value="race">Rassenfähigkeit</option>
                            <option value="gnome">Gnom-Fähigkeit</option>
                            <option value="item">Ausrüstungs-Fähigkeit</option>
                            <option value="other">Sonstige</option>
                          </select>
                        </div>
                        <div>
                          <SourceReferenceEditor
                            value={ability.sourceReference}
                            onChange={(v) =>
                              updateAbility(ability.id, { sourceReference: v })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
