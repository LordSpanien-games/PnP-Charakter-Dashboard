import React, { FC, ChangeEvent } from "react";
import { 
  Shield, 
  Heart, 
  Sparkles, 
  Crosshair, 
  BookOpen, 
  User, 
  Briefcase 
} from "lucide-react";
import { 
  Skill, 
  Weapon, 
  Ability,
  Stat
} from "../../types";
import { SheetProps } from "./types";

export const GenericSheet: FC<SheetProps> = ({
  data,
  onUpdateData,
  isEditable,
  paperStyle,
  activePage
}) => {
  const paperBgClass = paperStyle === 'parchment'
    ? 'bg-[#fcfaf5] text-stone-900 shadow-xl border border-stone-300'
    : 'bg-white text-black shadow-lg border border-zinc-200';

  const handleUpdateChar = (idx: number, newVal: number) => {
    const list = [...(data.characteristics || [])];
    if (list[idx]) {
      list[idx] = { ...list[idx], value: newVal };
      onUpdateData({ characteristics: list });
    }
  };

  const handleUpdateSkill = (idx: number, newVal: number) => {
    const list = [...(data.skills || [])];
    if (list[idx]) {
      list[idx] = { ...list[idx], value: newVal };
      onUpdateData({ skills: list });
    }
  };

  return (
    <>
      {(activePage === 'all' || activePage === 'page1') && (
        <div className={`printable-sheet max-w-[960px] mx-auto mb-8 p-6 md:p-8 rounded-xl font-sans text-[11px] leading-tight ${paperBgClass} print:m-0 print:p-4 print:border-none print:shadow-none print:w-full print:max-w-none`}>
          {/* HEADER */}
          <div className="border-b-2 border-stone-800 pb-3 mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                Universal Charakterbogen • {(data?.system || "generic").toUpperCase()}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 mt-0.5">
                {isEditable ? (
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdateData({ name: e.target.value })}
                    className="bg-transparent border-b border-stone-400 outline-none w-full max-w-md font-black"
                  />
                ) : (
                  data.name
                )}
              </h1>
              <p className="text-stone-600 text-xs mt-0.5">{data.subTitle || "Abenteurer"}</p>
            </div>

            <div className="flex items-center gap-3">
              {data.currency && (
                <div className="bg-stone-100 border border-stone-300 rounded px-3 py-1 text-center">
                  <span className="text-[8px] uppercase text-stone-500 block">{data.currency.unit || "Währung"}</span>
                  <span className="font-bold text-sm text-stone-900">{data.currency.amount}</span>
                </div>
              )}
            </div>
          </div>

          {/* ATTRIBUTE */}
          {data.characteristics && data.characteristics.length > 0 && (
            <div className="border border-stone-300 rounded-lg p-3 bg-stone-50/50 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-stone-700" />
                Attribute & Kennwerte
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {data.characteristics.map((c, idx) => (
                  <div key={idx} className="bg-white border border-stone-300 rounded p-1.5 text-center shadow-xs">
                    <span className="text-[9px] uppercase text-stone-500 block font-semibold">{c.label}</span>
                    {isEditable ? (
                      <input
                        type="number"
                        value={typeof c.value === 'number' ? c.value : parseInt(String(c.value), 10) || 0}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateChar(idx, parseInt(e.target.value, 10) || 0)}
                        className="w-full text-center font-black text-base bg-stone-50 border border-stone-300 rounded outline-none"
                      />
                    ) : (
                      <span className="font-black text-base text-stone-900">{c.value}</span>
                    )}
                    {c.modifier && (
                      <span className="text-[9px] text-stone-600 font-bold block">{c.modifier}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VITALS / STATS */}
          {data.stats && data.stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {data.stats.map((s, idx) => (
                <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-center">
                  <span className="text-[9px] uppercase text-stone-500 block font-semibold">{s.label}</span>
                  <span className="font-black text-lg text-stone-900">{s.value}</span>
                  {s.damage !== undefined && (
                    <span className="text-[9px] text-red-600 font-medium block">Schaden: {s.damage}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FERTIGKEITEN */}
          {data.skills && data.skills.length > 0 && (
            <div className="border border-stone-300 rounded-lg p-3 bg-stone-50/50 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1 mb-2 flex items-center gap-1.5">
                <BookOpen size={14} className="text-stone-700" />
                Fertigkeiten & Talente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.skills.map((skill, idx) => (
                  <div key={idx} className="bg-white border border-stone-200 rounded p-1.5 flex justify-between items-center text-xs">
                    <div className="truncate mr-2">
                      <span className="font-semibold text-stone-900 block truncate">{skill.name}</span>
                      {skill.note && <span className="text-[9px] text-stone-500">{skill.note}</span>}
                    </div>
                    {isEditable ? (
                      <input
                        type="number"
                        value={skill.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateSkill(idx, parseInt(e.target.value, 10) || 0)}
                        className="w-10 text-center font-bold border border-stone-300 rounded bg-stone-50"
                      />
                    ) : (
                      <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">{skill.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WAFFEN */}
          {((data.weapons?.melee?.length || 0) > 0 || (data.weapons?.ranged?.length || 0) > 0) && (
            <div className="border border-stone-300 rounded-lg p-3 bg-stone-50/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-200 pb-1 mb-2 flex items-center gap-1.5">
                <Crosshair size={14} className="text-stone-700" />
                Waffen & Angriffe
              </h2>
              <div className="space-y-1.5">
                {[...(data.weapons?.melee || []), ...(data.weapons?.ranged || [])].map((w, idx) => (
                  <div key={idx} className="bg-white border border-stone-300 rounded p-2 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-stone-900">{w.name}</strong>
                      <span className="text-stone-500 text-[10px] ml-2">{w.note}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span>Angriff: <strong>{w.attack}</strong></span>
                      <span>Schaden: <strong>{w.damage}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
