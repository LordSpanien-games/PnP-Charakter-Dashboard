import React, { FC } from "react";
import { Users, Plus } from "lucide-react";
import { CharacterData } from "../../types";
import { PartyMemberItem } from "../common/PartyMemberItem";

export interface PartySectionProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
}

export const PartySection: FC<PartySectionProps> = ({
  character,
  isEditing,
  onUpdateData
}) => {
  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="text-orange-500" size={20} />
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Die Party</h2>
        </div>
        {isEditing && (
          <button 
            onClick={() => onUpdateData({ 
              party: [...(character.party || []), { name: "Neuer Gefährte", role: "Begleiter", playerName: "", class: "", race: "", occupation: "" }] 
            })}
            className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors cursor-pointer"
            title="Gefährten hinzufügen"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {(character.party || []).length > 0 ? (
          (character.party || []).map((member, i) => (
            <PartyMemberItem 
              key={i} 
              member={member} 
              isEditing={isEditing}
              onChange={(updates) => {
                const newParty = [...(character.party || [])];
                newParty[i] = { ...member, ...updates };
                onUpdateData({ party: newParty });
              }}
              onRemove={() => {
                const newParty = (character.party || []).filter((_, idx) => idx !== i);
                onUpdateData({ party: newParty });
              }}
            />
          ))
        ) : (
          <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl">
            <Users className="text-zinc-800 mx-auto mb-2" size={32} />
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Keine Gefährten eingetragen</p>
          </div>
        )}
      </div>
    </section>
  );
};
