import React, { FC, useState, ChangeEvent } from "react";
import { Skill } from "../../types";
import { formatPathfinderModifier } from "../../utils/pathfinder";

interface StandardPFSkillDef {
  name: string;
  attr: "ST" | "GE" | "KO" | "IN" | "WE" | "CH";
  armorPenalty?: boolean;
  trainedOnly?: boolean;
}

export const OFFICIAL_PATHFINDER_SKILLS: StandardPFSkillDef[] = [
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

interface MergedSkill extends StandardPFSkillDef {
  ranks: number;
  isClassSkill: boolean;
  classBonus: number;
  attrMod: number;
  totalBonus: number;
  miscBonus: number;
}

interface Props {
  mergedSkills: MergedSkill[];
  isEditable: boolean;
  onUpdateSkillRanks: (name: string, ranks: number) => void;
  onToggleClassSkill: (name: string) => void;
  /** Print-Modus: kein Toggle-Button, immer komplette Liste */
  printMode?: boolean;
}

export const PathfinderSkillsBlock: FC<Props> = ({
  mergedSkills,
  isEditable,
  onUpdateSkillRanks,
  onToggleClassSkill,
  printMode = false,
}) => {
  const [showAll, setShowAll] = useState(true);

  const visible = (showAll || printMode)
    ? mergedSkills
    : mergedSkills.filter((s) => s.ranks > 0);

  const learnedCount = mergedSkills.filter((s) => s.ranks > 0).length;
  const totalRanks = mergedSkills.reduce((acc, s) => acc + s.ranks, 0);

  return (
    <div className="border-2 border-stone-800 rounded-lg p-3 bg-stone-100/50 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-1.5 mb-2">
        <h2 className="text-xs font-black uppercase tracking-wider font-display text-stone-900">
          Fertigkeiten (Skills)
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[9px] font-sans text-stone-600">
            <span>KF = Klassenfertigkeit (+3 bei ≥1 Rang)</span>
            <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              Ränge: {totalRanks} | Belegt: {learnedCount}/{mergedSkills.length}
            </span>
          </div>
          {/* Toggle nur außerhalb Print */}
          {!printMode && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={`no-print text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                showAll
                  ? "bg-amber-100 border-amber-400 text-amber-900 hover:bg-amber-200"
                  : "bg-stone-200 border-stone-400 text-stone-700 hover:bg-stone-300"
              }`}
            >
              {showAll ? "◀ Nur belegte" : "▶ Alle anzeigen"}
            </button>
          )}
        </div>
      </div>

      {/* Tabellen-Header */}
      <div className="grid grid-cols-12 gap-1 text-[8px] uppercase font-bold text-stone-500 border-b border-stone-300 pb-1 px-1">
        <div className="col-span-1 text-center" title="Klassenfertigkeit">KF</div>
        <div className="col-span-5">Fertigkeitsname</div>
        <div className="col-span-1 text-center">Attr</div>
        <div className="col-span-1 text-center font-bold text-stone-800">Ges</div>
        <div className="col-span-1 text-center">Attr</div>
        <div className="col-span-1 text-center">Rang</div>
        <div className="col-span-1 text-center">KF+3</div>
        <div className="col-span-1 text-center">Sonst</div>
      </div>

      {/* Skill Rows */}
      <div className={`space-y-0.5 pr-1 text-[10px] ${!printMode ? "max-h-[640px] overflow-y-auto" : ""}`}>
        {visible.map((skill) => (
          <div
            key={skill.name}
            className={`grid grid-cols-12 gap-1 items-center p-1 rounded transition-colors ${
              skill.ranks > 0 ? "bg-amber-50/80 font-medium" : "hover:bg-white"
            }`}
          >
            {/* KF Checkbox */}
            <div className="col-span-1 text-center">
              <input
                type="checkbox"
                checked={skill.isClassSkill}
                disabled={!isEditable}
                onChange={() => onToggleClassSkill(skill.name)}
                className="cursor-pointer h-3 w-3 accent-amber-700"
                title="Als Klassenfertigkeit markieren"
              />
            </div>

            {/* Name */}
            <div className="col-span-5 truncate flex items-center gap-1 text-stone-800">
              <span className={`truncate ${skill.ranks === 0 && !showAll ? "text-stone-400" : ""}`}>
                {skill.name}
              </span>
              {skill.armorPenalty && (
                <span className="text-[7px] text-stone-400 font-mono" title="Rüstungsmalus">*</span>
              )}
              {skill.trainedOnly && (
                <span className="text-[7px] text-amber-700 font-mono" title="Nur geübt">†</span>
              )}
            </div>

            {/* Attribut */}
            <div className="col-span-1 text-center font-mono text-[9px] text-stone-500">
              {skill.attr}
            </div>

            {/* Gesamtbonus */}
            <div className="col-span-1 text-center font-mono font-black text-amber-900 bg-white border border-stone-300 rounded text-[10px]">
              {formatPathfinderModifier(skill.totalBonus)}
            </div>

            {/* AttrMod */}
            <div className="col-span-1 text-center font-mono text-stone-500 text-[9px]">
              {formatPathfinderModifier(skill.attrMod)}
            </div>

            {/* Ränge */}
            <div className="col-span-1 text-center">
              {isEditable ? (
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={skill.ranks}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateSkillRanks(skill.name, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full text-center bg-white border border-stone-300 rounded font-mono font-bold text-[10px] outline-none focus:border-amber-600"
                />
              ) : (
                <span className={`font-mono text-[9px] ${skill.ranks === 0 ? "text-stone-300" : "text-stone-800"}`}>
                  {skill.ranks === 0 ? "—" : skill.ranks}
                </span>
              )}
            </div>

            {/* KF+3 */}
            <div className="col-span-1 text-center font-mono text-stone-500 text-[9px]">
              {skill.classBonus > 0 ? "+3" : "0"}
            </div>

            {/* Misc */}
            <div className="col-span-1 text-center font-mono text-stone-400 text-[9px]">
              {skill.miscBonus !== 0 ? formatPathfinderModifier(skill.miscBonus) : "0"}
            </div>
          </div>
        ))}
      </div>

      {/* Legende */}
      <div className="mt-2 text-[8px] text-stone-500 border-t border-stone-200 pt-1 flex justify-between">
        <span>* = Rüstungsmalus gilt</span>
        <span>† = Nur von geübten Charakteren einsetzbar</span>
      </div>
    </div>
  );
};
