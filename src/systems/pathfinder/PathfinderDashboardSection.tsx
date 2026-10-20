import React, { FC, useState, useMemo } from "react";
import { CharacterData } from "../../types";
import { PathfinderAttributesCard } from "../../components/PathfinderAttributesCard";
import { PathfinderSavingThrowsCard } from "../../components/PathfinderSavingThrowsCard";
import { PathfinderCombatCard } from "../../components/PathfinderCombatCard";
import {
  recalculatePathfinderCharacter,
  calculatePathfinderModifier,
  formatPathfinderModifier,
  getAttributeScore,
} from "../../utils/pathfinder";

interface StandardPFSkillDef {
  name: string;
  attr: "ST" | "GE" | "KO" | "IN" | "WE" | "CH";
  armorPenalty?: boolean;
  trainedOnly?: boolean;
}

const OFFICIAL_PATHFINDER_SKILLS: StandardPFSkillDef[] = [
  { name: "Akrobatik", attr: "GE", armorPenalty: true },
  { name: "Auftreten (Gesang/Tanz)", attr: "CH" },
  { name: "Beruf (Seemann/Kaufmann)", attr: "WE", trainedOnly: true },
  { name: "Bluffen", attr: "CH" },
  { name: "Diplomatie", attr: "CH" },
  { name: "Einschüchtern", attr: "CH" },
  { name: "Entfesslungskunst", attr: "GE", armorPenalty: true },
  { name: "Fälschen", attr: "IN" },
  { name: "Fingerfertigkeit", attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Fliegen", attr: "GE", armorPenalty: true },
  { name: "Handwerk (Alchemie/Waffen)", attr: "IN" },
  { name: "Heilkunde", attr: "WE" },
  { name: "Heimlichkeit", attr: "GE", armorPenalty: true },
  { name: "Klettern", attr: "ST", armorPenalty: true },
  { name: "Magischen Gegenstand benutzen", attr: "CH", trainedOnly: true },
  { name: "Mechanismus ausschalten", attr: "GE", armorPenalty: true, trainedOnly: true },
  { name: "Mit Tieren umgehen", attr: "CH", trainedOnly: true },
  { name: "Motiv erkennen", attr: "WE" },
  { name: "Reiten", attr: "GE", armorPenalty: true },
  { name: "Schätzen", attr: "IN" },
  { name: "Schwimmen", attr: "ST", armorPenalty: true },
  { name: "Sprachenkunde", attr: "IN", trainedOnly: true },
  { name: "Überleben", attr: "WE" },
  { name: "Verkleiden", attr: "CH" },
  { name: "Wahrnehmung", attr: "WE" },
  { name: "Wissen (Arkanes)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Dungeonkunde)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Geschichte)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Geografie)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Lokales)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Natur)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Religion)", attr: "IN", trainedOnly: true },
  { name: "Wissen (Die Ebenen)", attr: "IN", trainedOnly: true },
  { name: "Zauberkunde", attr: "IN", trainedOnly: true },
];

export interface PathfinderDashboardSectionProps {
  character: CharacterData;
  onUpdateCharacter?: (character: CharacterData) => void;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenDiceCalc: (title?: string, mod?: number) => void;
  onSwitchToCombatTab?: () => void;
  isEditing: boolean;
}

export const PathfinderDashboardSection: FC<PathfinderDashboardSectionProps> = ({
  character,
  onUpdateCharacter,
  onUpdateData,
  onOpenDiceCalc,
  onSwitchToCombatTab,
  isEditing,
}) => {
  const handleUpdateChar = onUpdateCharacter || ((c: CharacterData) => onUpdateData(c));
  const [showAllSkills, setShowAllSkills] = useState(false);

  const attributeMap = useMemo(() => {
    const keys = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
    const map: Record<string, { score: number; mod: number }> = {};
    keys.forEach((k) => {
      const score = getAttributeScore(character, k);
      map[k] = { score, mod: calculatePathfinderModifier(score) };
    });
    return map;
  }, [character]);

  const mergedSkills = useMemo(() => {
    const userSkills = character.skills || [];
    return OFFICIAL_PATHFINDER_SKILLS.map((def) => {
      const existing = userSkills.find((s) => {
        const sName = (s?.name || "").toLowerCase();
        const defName = def.name.toLowerCase();
        return sName === defName || (sName.length >= 5 && sName.startsWith(defName.slice(0, 5)));
      });
      const attrMod = attributeMap[def.attr]?.mod || 0;
      const ranks = existing ? (typeof existing.value === "number" ? existing.value : parseInt(String(existing.value).replace(/[^0-9-]/g, ""), 10) || 0) : 0;
      const isClassSkill = existing?.trained ?? false;
      const classBonus = isClassSkill && ranks > 0 ? 3 : 0;
      const totalBonus = attrMod + ranks + classBonus;
      return { ...def, ranks, isClassSkill, classBonus, attrMod, totalBonus };
    });
  }, [character.skills, attributeMap]);

  const handleUpdateSkillRanks = (skillName: string, newRanks: number) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex((s) => (s?.name || "").toLowerCase() === skillName.toLowerCase());
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], value: newRanks };
    } else {
      currentSkills.push({ name: skillName, value: newRanks, trained: false });
    }
    onUpdateData({ skills: currentSkills });
  };

  const handleToggleClassSkill = (skillName: string) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex((s) => (s?.name || "").toLowerCase() === skillName.toLowerCase());
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], trained: !currentSkills[idx].trained };
    } else {
      currentSkills.push({ name: skillName, value: 0, trained: true });
    }
    onUpdateData({ skills: currentSkills });
  };

  const visibleSkills = showAllSkills ? mergedSkills : mergedSkills.filter((s) => s.ranks > 0);
  const learnedCount = mergedSkills.filter((s) => s.ranks > 0).length;

  return (
    <div className="space-y-6">
      <PathfinderAttributesCard
        character={character}
        onUpdateCharacteristics={(newChars) => {
          const recalculated = recalculatePathfinderCharacter(character, newChars);
          handleUpdateChar(recalculated);
        }}
        onOpenDiceCalc={() => onOpenDiceCalc()}
        isEditing={isEditing}
      />

      <PathfinderSavingThrowsCard
        character={character}
        onUpdateSavingThrows={(newSaves, updatedStats) => {
          onUpdateData({
            savingThrows: newSaves,
            ...(updatedStats ? { stats: updatedStats } : {}),
          });
        }}
        onOpenDiceCalc={(saveType, mod) => onOpenDiceCalc(saveType, mod)}
        isEditing={isEditing}
      />

      <PathfinderCombatCard
        character={character}
        onUpdateCharacter={(updated) => handleUpdateChar(updated)}
        onOpenDiceCalc={(title, mod) => onOpenDiceCalc(title, mod)}
        onSwitchToCombatTab={onSwitchToCombatTab}
        isEditing={isEditing}
      />

      {/* ── FERTIGKEITEN DASHBOARD-BLOCK ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        {/* Header + Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Fertigkeiten</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {learnedCount} von {mergedSkills.length} belegt
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllSkills((v) => !v)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showAllSkills
                ? "bg-orange-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {showAllSkills ? "Nur belegte anzeigen" : "Alle anzeigen"}
          </button>
        </div>

        {/* Skills-Tabelle */}
        {visibleSkills.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono italic">
            Noch keine Fertigkeitsränge vergeben. Klicke auf „Alle anzeigen".
          </p>
        ) : (
          <>
            {/* Tabellen-Header */}
            <div className="grid grid-cols-12 gap-1 text-[9px] uppercase font-bold text-zinc-500 border-b border-zinc-800 pb-1 px-1">
              <div className="col-span-1 text-center" title="Klassenfertigkeit">KF</div>
              <div className="col-span-5">Fertigkeit</div>
              <div className="col-span-1 text-center">Attr</div>
              <div className="col-span-1 text-center font-bold text-zinc-300">Ges</div>
              <div className="col-span-1 text-center">AttrMod</div>
              <div className="col-span-1 text-center">Ränge</div>
              <div className="col-span-2 text-center text-[8px]">Flags</div>
            </div>

            <div className="space-y-0.5 max-h-[520px] overflow-y-auto pr-1">
              {visibleSkills.map((skill) => (
                <div
                  key={skill.name}
                  className={`grid grid-cols-12 gap-1 items-center px-1 py-1 rounded text-xs transition-colors ${
                    skill.ranks > 0
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "hover:bg-zinc-800/60"
                  }`}
                >
                  {/* KF Checkbox */}
                  <div className="col-span-1 flex justify-center">
                    <input
                      type="checkbox"
                      checked={skill.isClassSkill}
                      disabled={!isEditing}
                      onChange={() => handleToggleClassSkill(skill.name)}
                      className="cursor-pointer h-3 w-3 accent-amber-500"
                      title="Als Klassenfertigkeit markieren"
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-5 truncate text-zinc-200 font-mono text-[11px] flex items-center gap-1">
                    <span className="truncate">{skill.name}</span>
                    {skill.armorPenalty && (
                      <span className="text-[8px] text-zinc-500" title="Rüstungsmalus">✦</span>
                    )}
                    {skill.trainedOnly && (
                      <span className="text-[8px] text-amber-500" title="Nur geübt">†</span>
                    )}
                  </div>

                  {/* Attribut-Kürzel */}
                  <div className="col-span-1 text-center text-[9px] text-zinc-500 font-mono">
                    {skill.attr}
                  </div>

                  {/* Gesamtbonus */}
                  <div className="col-span-1 text-center font-black text-amber-400 font-mono text-[11px]">
                    {formatPathfinderModifier(skill.totalBonus)}
                  </div>

                  {/* AttrMod */}
                  <div className="col-span-1 text-center text-[9px] text-zinc-500 font-mono">
                    {formatPathfinderModifier(skill.attrMod)}
                  </div>

                  {/* Ränge (editierbar) */}
                  <div className="col-span-1 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={skill.ranks}
                        onChange={(e) =>
                          handleUpdateSkillRanks(skill.name, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full text-center bg-zinc-950 border border-zinc-700 rounded font-mono font-bold text-[10px] text-white outline-none focus:border-amber-500 py-0.5"
                      />
                    ) : (
                      <span className="font-mono text-zinc-300 text-[10px]">{skill.ranks}</span>
                    )}
                  </div>

                  {/* Flags */}
                  <div className="col-span-2 flex justify-center gap-1 text-[8px]">
                    {skill.isClassSkill && skill.ranks > 0 && (
                      <span className="px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded font-mono">KF+3</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-zinc-600 font-mono">
              ✦ = Rüstungsmalus &nbsp;|&nbsp; † = Nur geübt &nbsp;|&nbsp; KF+3 = Klassenfertigkeitsbonus
            </p>
          </>
        )}
      </div>
    </div>
  );
};
