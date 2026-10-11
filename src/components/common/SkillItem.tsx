import React, { FC } from "react";
import { X } from "lucide-react";
import { Skill, GameSystem } from "../../types";
import { Input } from "./Input";

export const SkillItem: FC<{
  skill: Skill;
  isEditing: boolean;
  system: GameSystem;
  onChange: (updates: Partial<Skill>) => void;
  onRemove?: () => void;
}> = ({ skill, isEditing, system, onChange, onRemove }) => {
  return (
    <div className="relative flex items-center justify-between p-2 rounded bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <X size={8} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <Input value={skill.name} onChange={(v) => onChange({ name: v })} className="text-xs w-full" />
            <Input value={skill.note || ""} onChange={(v) => onChange({ note: v })} className="text-[9px] w-full" placeholder="Notiz" />
          </div>
        ) : (
          <div className="truncate">
            <span className="text-xs font-medium text-zinc-300">{skill.name}</span>
            {skill.note && <span className="text-[9px] text-zinc-600 ml-2 italic">({skill.note})</span>}
          </div>
        )}
      </div>
      <div className="ml-3 shrink-0">
        {isEditing ? (
          <Input value={skill.value} onChange={(v) => onChange({ value: parseInt(v) || 0 })} className="text-xs w-12 text-center font-bold" type="number" />
        ) : (
          <div className="flex flex-col items-end">
            {system === 'shadowrun' ? (
              <span className="text-sm font-bold text-cyan-400 font-mono">{skill.value} d6</span>
            ) : system === 'pathfinder' ? (
              <span className="text-sm font-bold text-amber-400 font-mono">
                {skill.value >= 0 ? `+${skill.value}` : skill.value}
              </span>
            ) : system === 'traveller' ? (
              <span className="text-sm font-bold text-blue-300 font-mono">
                Stufe {skill.value >= 0 ? skill.value : skill.value}
              </span>
            ) : (
              <>
                <span className="text-sm font-bold text-orange-500 font-mono">{skill.value}%</span>
                <span className="text-[8px] text-zinc-650 font-mono">{Math.floor(skill.value/2)} | {Math.floor(skill.value/5)}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
