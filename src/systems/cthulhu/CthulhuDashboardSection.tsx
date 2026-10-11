import React, { FC } from "react";
import { Activity, Plus, Minus } from "lucide-react";
import { CharacterData } from "../../types";

export interface CthulhuDashboardSectionProps {
  character: CharacterData;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  isEditing: boolean;
}

export const CthulhuDashboardSection: FC<CthulhuDashboardSectionProps> = ({
  character,
  onUpdateData,
  isEditing
}) => {
  if (!character.characteristics || character.characteristics.length === 0) {
    return null;
  }

  const isCoC = character.system === 'coc7e' || character.system === 'coc1920';

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Activity className="text-orange-500" size={24} />
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Attribute & Charakteristika</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {character.characteristics.map((c, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-2 rounded flex flex-col items-center group relative">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">{c.label}</span>
            <div className="flex items-center gap-1">
              {!isEditing && (
                <button 
                  onClick={() => {
                    const newVal = (parseInt(c.value as string) || 0) - 1;
                    const newChars = [...(character.characteristics || [])];
                    newChars[i] = { ...c, value: newVal };
                    onUpdateData({ characteristics: newChars });
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-orange-500 transition-all"
                  title="-1"
                >
                  <Minus size={10} />
                </button>
              )}
              <span className="text-lg font-black text-white">{c.value}</span>
              {!isEditing && (
                <button 
                  onClick={() => {
                    const newVal = (parseInt(c.value as string) || 0) + 1;
                    const newChars = [...(character.characteristics || [])];
                    newChars[i] = { ...c, value: newVal };
                    onUpdateData({ characteristics: newChars });
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-orange-500 transition-all"
                  title="+1"
                >
                  <Plus size={10} />
                </button>
              )}
            </div>
            {isCoC && (
              <div className="flex gap-2 mt-1 border-t border-zinc-800 pt-1 w-full justify-center">
                <span className="text-[8px] text-zinc-500 font-mono" title="Halber Wert">
                  {Math.floor(Number(c.value)/2)}
                </span>
                <span className="text-[8px] text-zinc-600 font-mono" title="Fünftel Wert">
                  {Math.floor(Number(c.value)/5)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
