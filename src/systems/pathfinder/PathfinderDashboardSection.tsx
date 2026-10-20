import React, { FC, useMemo, ChangeEvent } from "react";
import { CharacterData } from "../../types";
import { PathfinderAttributesCard } from "../../components/PathfinderAttributesCard";
import { PathfinderSavingThrowsCard } from "../../components/PathfinderSavingThrowsCard";
import { PathfinderCombatCard } from "../../components/PathfinderCombatCard";
import {
  recalculatePathfinderCharacter,
  calculatePathfinderModifier,
  formatPathfinderModifier,
  getAttributeScore,
  PATHFINDER_CORE_ATTRIBUTES
} from "../../utils/pathfinder";

interface StandardPFSkillDef {
  name: string;
  attr: 'ST' | 'GE' | 'KO' | 'IN' | 'WE' | 'CH';
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
  isEditing
}) => {
  const handleUpdateChar = onUpdateCharacter || ((c: CharacterData) => onUpdateData(c));

  // Attribute-Modifikatoren für Skill-Berechnung
  const attributeMap = useMemo(() => {
    const keys = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'] as const;
    const map: Record<string, { score: number; mod: number }> = {};
    for (const key of keys) {
      const score = getAttributeScore(character, key);
      map[key] = { score, mod: calculatePathfinderModifier(score) };
    }
    return map;
  }, [character]);

  // Alle 33 offiziellen Fertigkeiten mit Charakter-Daten zusammenführen
  const mergedSkills = useMemo(() => {
    const userSkills = character.skills || [];
    return OFFICIAL_PATHFINDER_SKILLS.map(def => {
      const existing = userSkills.find(s => {
        const sName = (s?.name || (s as any)?.label || "").toLowerCase();
        const defName = def.name.toLowerCase();
        return sName === defName || (sName.length >= 5 && sName.startsWith(defName.slice(0, 5)));
      });
      const attrMod = attributeMap[def.attr]?.mod || 0;
      const rawVal = existing ? existing.value : 0;
      const ranks = typeof rawVal === 'number' ? rawVal : (parseInt(String(rawVal).replace(/[^0-9-]/g, ''), 10) || 0);
      const isClassSkill = existing?.trained ?? false;
      const classBonus = (isClassSkill && ranks > 0) ? 3 : 0;
      const totalBonus = attrMod + ranks + classBonus;
      return { ...def, ranks, isClassSkill, classBonus, attrMod, totalBonus };
    });
  }, [character.skills, attributeMap]);

  const handleUpdateSkillRanks = (skillName: string, newRanks: number) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex(s => (s?.name || '').toLowerCase() === skillName.toLowerCase());
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], value: newRanks };
    } else {
      currentSkills.push({ name: skillName, value: newRanks, trained: false });
    }
    onUpdateData({ skills: currentSkills });
  };

  const handleToggleClassSkill = (skillName: string) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex(s => (s?.name || '').toLowerCase() === skillName.toLowerCase());
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], trained: !currentSkills[idx].trained };
    } else {
      currentSkills.push({ name: skillName, value: 0, trained: true });
    }
    onUpdateData({ skills: currentSkills });
  };

  const totalRanks = useMemo(() => mergedSkills.reduce((acc, s) => acc + s.ranks, 0), [mergedSkills]);

  return (
    <div className="space-y-6">
      {/* Attribute, Rettungswürfe, Kampfwerte */}
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
            ...(updatedStats ? { stats: updatedStats } : {})
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

      {/* FERTIGKEITEN-TABELLE */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">
              Fertigkeiten (Skills)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {totalRanks} Ränge vergeben • KF = Klassenfertigkeit (+3 bei ≥1 Rang)
            </p>
          </div>
          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs">
            {mergedSkills.filter(s => s.ranks > 0).length} / {mergedSkills.length} aktiv
          </span>
        </div>

        {/* Tabellen-Header */}
        <div className="grid grid-cols-12 gap-1 text-[9px] uppercase font-bold text-zinc-500 border-b border-zinc-700 pb-1.5 px-1 mb-1">
          <div className="col-span-1 text-center" title="Klassenfertigkeit">KF</div>
          <div className="col-span-5">Fertigkeit</div>
          <div className="col-span-1 text-center">Attr</div>
          <div className="col-span-1 text-center text-amber-400">Ges</div>
          <div className="col-span-1 text-center">Attr-M</div>
          <div className="col-span-1 text-center">Rang</div>
          <div className="col-span-1 text-center">KF+3</div>
          <div className="col-span-1 text-center">Sonst</div>
        </div>

        {/* Skill-Zeilen – alle 33 immer sichtbar */}
        <div className="space-y-0.5 text-[11px]">
          {mergedSkills.map(skill => (
            <div
              key={skill.name}
              className={`grid grid-cols-12 gap-1 items-center px-1 py-1 rounded-lg transition-colors ${
                skill.ranks > 0
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'hover:bg-zinc-800/40'
              }`}
            >
              {/* Klassenfertigkeit-Checkbox */}
              <div className="col-span-1 text-center">
                <input
                  type="checkbox"
                  checked={skill.isClassSkill}
                  disabled={!isEditing}
                  onChange={() => handleToggleClassSkill(skill.name)}
                  className="cursor-pointer h-3 w-3 accent-amber-500"
                  title="Als Klassenfertigkeit markieren"
                />
              </div>

              {/* Fertigkeitsname */}
              <div className="col-span-5 flex items-center gap-1 text-zinc-200 truncate">
                <span className="truncate">{skill.name}</span>
                {skill.armorPenalty && (
                  <span className="text-[8px] text-zinc-500 font-mono shrink-0" title="Rüstungsmalus">*</span>
                )}
                {skill.trainedOnly && (
                  <span className="text-[8px] text-amber-500 font-mono shrink-0" title="Nur geübt">†</span>
                )}
              </div>

              {/* Attribut-Kürzel */}
              <div className="col-span-1 text-center font-mono text-[10px] text-zinc-500">
                {skill.attr}
              </div>

              {/* Gesamtbonus */}
              <div className="col-span-1 text-center font-mono font-black text-amber-400 text-[11px]">
                {formatPathfinderModifier(skill.totalBonus)}
              </div>

              {/* Attribut-Modifikator */}
              <div className="col-span-1 text-center font-mono text-zinc-500 text-[10px]">
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      handleUpdateSkillRanks(skill.name, val);
                    }}
                    className="w-full text-center bg-zinc-800 border border-zinc-600 rounded font-mono font-bold text-[10px] text-white outline-none focus:border-amber-500"
                  />
                ) : (
                  <span className="font-mono text-[10px] text-zinc-300">{skill.ranks}</span>
                )}
              </div>

              {/* Klassenfertigkeitsbonus */}
              <div className="col-span-1 text-center font-mono text-zinc-500 text-[10px]">
                {skill.classBonus > 0 ? "+3" : "0"}
              </div>

              {/* Sonstiger Bonus */}
              <div className="col-span-1 text-center font-mono text-zinc-500 text-[10px]">
                {skill.name === "Heimlichkeit" ? "+4" : "0"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 text-[9px] text-zinc-600 flex justify-between">
          <span>* = Rüstungsmalus gilt</span>
          <span>† = Nur von geübten Charakteren einsetzbar</span>
        </div>
      </div>
    </div>
  );
};
