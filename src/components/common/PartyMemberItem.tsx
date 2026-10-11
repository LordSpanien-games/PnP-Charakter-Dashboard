import React, { FC } from "react";
import { X, Sparkles } from "lucide-react";
import { PartyMember } from "../../types";
import { Input } from "./Input";

export const PartyMemberItem: FC<{
  member: PartyMember;
  isEditing: boolean;
  onChange: (updates: Partial<PartyMember>) => void;
  onRemove?: () => void;
}> = ({ member, isEditing, onChange, onRemove }) => {
  return (
    <div className="relative p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors group flex flex-col justify-between">
      {isEditing && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <X size={8} />
        </button>
      )}

      <div>
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <Input value={member.name} onChange={(v) => onChange({ name: v })} className="text-xs font-bold w-full" />
          ) : (
            <h5 className="text-xs font-bold text-zinc-200 group-hover:text-orange-400 transition-colors">{member.name}</h5>
          )}
          {isEditing ? (
            <Input value={member.role} onChange={(v) => onChange({ role: v })} className="text-[9px] w-20" placeholder="Rolle" />
          ) : (
            <span className="text-[9px] text-zinc-500 font-mono">{member.role}</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 flex gap-1">
            <Input value={member.system || ""} onChange={(v) => onChange({ system: v })} className="text-[9px] w-1/2" placeholder="System" />
            <Input value={member.subTitle || ""} onChange={(v) => onChange({ subTitle: v })} className="text-[9px] w-1/2" placeholder="Untertitel" />
          </div>
        ) : (
          (member.system || member.subTitle) && (
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {member.system && <span className="uppercase text-[8px] bg-zinc-800 px-1 py-0.5 rounded mr-1.5">{member.system}</span>}
              {member.subTitle}
            </p>
          )
        )}

        {isEditing ? (
          <textarea 
            value={member.synergyNote || ""} 
            onChange={(e) => onChange({ synergyNote: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded p-1 text-[10px] text-zinc-400 mt-1.5 focus:outline-none focus:border-orange-500"
            placeholder="Taktischer Synergie-Hinweis..."
            rows={2}
          />
        ) : (
          member.synergyNote && (
            <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950/50 p-1.5 rounded border border-zinc-850 flex items-start gap-1.5">
              <Sparkles size={11} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{member.synergyNote}</p>
            </div>
          )
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono">
        <span className="text-zinc-600">Status</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Einsatzbereit
        </span>
      </div>
    </div>
  );
};
