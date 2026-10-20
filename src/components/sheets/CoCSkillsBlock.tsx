import React, { FC, useState, ChangeEvent } from "react";

interface CoCSkillDef {
  name: string;
  base: number;
}

export const OFFICIAL_COC_SKILLS: CoCSkillDef[] = [
  { name: "Anthropologie", base: 1 },
  { name: "Archäologie", base: 1 },
  { name: "Artillerie", base: 1 },
  { name: "Ausweichen", base: 0 },       // dynamisch: GE/2
  { name: "Bibliotheksnutzung", base: 20 },
  { name: "Buchführung", base: 5 },
  { name: "Charme", base: 15 },
  { name: "Cthulhu-Mythos", base: 0 },
  { name: "Erste Hilfe", base: 30 },
  { name: "Fahren (Auto)", base: 20 },
  { name: "Feilschen", base: 5 },
  { name: "Handfeuerwaffen", base: 20 },
  { name: "Handwerk / Kunst", base: 5 },
  { name: "Horchen", base: 20 },
  { name: "Klettern", base: 20 },
  { name: "Mechanische Reparaturen", base: 10 },
  { name: "Medizin", base: 1 },
  { name: "Muttersprache", base: 0 },    // dynamisch: BI
  { name: "Naturkunde", base: 10 },
  { name: "Nahkampf (Handgemenge)", base: 25 },
  { name: "Okkultismus", base: 5 },
  { name: "Orientierung", base: 10 },
  { name: "Psychoanalyse", base: 1 },
  { name: "Psychologie", base: 10 },
  { name: "Reiten", base: 5 },
  { name: "Schusswaffen (Gewehr)", base: 25 },
  { name: "Schwimmen", base: 20 },
  { name: "Schweres Gerät", base: 1 },
  { name: "Spurensuche", base: 10 },
  { name: "Springen", base: 20 },
  { name: "Tarnung", base: 20 },
  { name: "Überzeugen", base: 10 },
  { name: "Überreden", base: 5 },
  { name: "Verborgenes Erkennen", base: 25 },
  { name: "Werfen", base: 20 },
  { name: "Wissenschaft (Astronomie)", base: 1 },
  { name: "Wissenschaft (Biologie)", base: 1 },
  { name: "Wissenschaft (Chemie)", base: 1 },
  { name: "Wissenschaft (Geologie)", base: 1 },
  { name: "Wissenschaft (Geschichte)", base: 5 },
  { name: "Wissenschaft (Kryptografie)", base: 1 },
  { name: "Wissenschaft (Physik)", base: 1 },
];

interface MergedCoCSkill {
  name: string;
  base: number;
  val: number;
  half: number;
  fifth: number;
  checked: boolean;
}

interface Props {
  mergedSkills: MergedCoCSkill[];
  isEditable: boolean;
  onUpdateSkill: (name: string, val: number) => void;
  onToggleCheck: (name: string) => void;
  /** Print-Modus: immer alle Skills, kein Toggle */
  printMode?: boolean;
}

export const CoCSkillsBlock: FC<Props> = ({
  mergedSkills,
  isEditable,
  onUpdateSkill,
  onToggleCheck,
  printMode = false,
}) => {
  const [showAll, setShowAll] = useState(true);

  const visible = (showAll || printMode)
    ? mergedSkills
    : mergedSkills.filter((s) => s.val > s.base);

  const improvedCount = mergedSkills.filter((s) => s.val > s.base).length;
  const checkedCount = mergedSkills.filter((s) => s.checked).length;

  return (
    <div className="border-2 border-[#2d3a27] rounded-lg p-3 bg-[#edf2e8]/60 shadow-xs mb-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#2d3a27] pb-1.5 mb-2 gap-2 flex-wrap">
        <h2 className="text-xs font-black uppercase tracking-wider font-display text-[#1b2716]">
          Investigator-Fertigkeiten (Skills)
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-[9px] font-sans text-stone-600">
            <span>[X] = Erfolgreich angewandt → Steigerungswurf in Entwicklungsphase</span>
            <span className="font-mono text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-300 whitespace-nowrap">
              Werte: Normal / Schwer (½) / Extrem (⅕)
            </span>
          </div>
          {/* Statistik */}
          <span className="text-[9px] font-mono text-[#3d5035] bg-[#dce8d5] border border-[#a1b897] px-1.5 py-0.5 rounded whitespace-nowrap">
            {improvedCount} gesteigert • {checkedCount} markiert
          </span>
          {/* Toggle nur außerhalb Print */}
          {!printMode && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={`no-print text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                showAll
                  ? "bg-[#dce8d5] border-[#6d9160] text-[#1b2716] hover:bg-[#c8dbbf]"
                  : "bg-white border-stone-300 text-stone-700 hover:bg-stone-100"
              }`}
            >
              {showAll ? "◀ Nur gesteigerte" : "▶ Alle anzeigen"}
            </button>
          )}
        </div>
      </div>

      {/* Spalten-Header */}
      <div className="grid grid-cols-12 gap-1 text-[8px] uppercase font-bold text-stone-500 border-b border-[#a1b897] pb-1 px-1 mb-1">
        <div className="col-span-1 text-center">[X]</div>
        <div className="col-span-5">Fertigkeit</div>
        <div className="col-span-2 text-center text-[7px]">Basis%</div>
        <div className="col-span-2 text-center font-bold text-stone-700">Normal</div>
        <div className="col-span-1 text-center text-[7px]">½</div>
        <div className="col-span-1 text-center text-[7px]">⅕</div>
      </div>

      {/* Skill-Zeilen – 3 Spalten für kompaktes Layout */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] ${!printMode ? "max-h-[580px] overflow-y-auto pr-1" : ""}`}>
        {visible.map((skill) => {
          const isImproved = skill.val > skill.base;
          return (
            <div
              key={skill.name}
              className={`flex items-center justify-between p-1 rounded border transition-colors ${
                isImproved
                  ? "bg-amber-50/70 border-amber-200 font-medium"
                  : "bg-white border-stone-200"
              }`}
            >
              {/* Erfahrungs-Checkbox + Name */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={skill.checked}
                  disabled={!isEditable}
                  onChange={() => onToggleCheck(skill.name)}
                  className="cursor-pointer h-3 w-3 accent-[#2d3a27] shrink-0"
                  title="Erfolgreich eingesetzt – für Steigerungswurf markieren"
                />
                <span className="truncate text-stone-900" title={skill.name}>
                  {skill.name}
                </span>
                <span className="text-[8px] text-stone-400 font-mono shrink-0">
                  ({skill.base}%)
                </span>
              </div>

              {/* Werte: Normal / Halb / Fünftel */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {isEditable ? (
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={skill.val}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) onUpdateSkill(skill.name, v);
                    }}
                    className="w-9 h-5 text-center font-bold font-mono text-[10px] bg-stone-50 border border-stone-300 rounded outline-none focus:border-[#2d3a27]"
                  />
                ) : (
                  <span className={`w-8 inline-block text-center font-bold font-mono text-[10px] ${isImproved ? "text-stone-900" : "text-stone-500"}`}>
                    {skill.val}
                  </span>
                )}
                <span className="text-stone-400 font-mono text-[8px]">/</span>
                <span className="w-6 h-5 bg-stone-100 border border-stone-200 rounded flex items-center justify-center font-mono text-[9px] text-stone-700">
                  {skill.half}
                </span>
                <span className="text-stone-400 font-mono text-[8px]">/</span>
                <span className="w-6 h-5 bg-[#dbe6d5] border border-[#a1b897] rounded flex items-center justify-center font-mono font-bold text-[9px] text-[#1c2a17]">
                  {skill.fifth}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entwicklungsphase Hinweis */}
      <div className="mt-2 pt-1 border-t border-[#a1b897] text-[8px] text-[#3d5035] font-sans italic">
        Entwicklungsphase: Für jede [X]-markierte Fertigkeit 1W100 würfeln. Ergebnis &gt; aktueller Wert → +1W10 auf die Fertigkeit.
      </div>
    </div>
  );
};
