import React, { FC } from "react";
import { Scroll, Plus } from "lucide-react";
import { CharacterData } from "../../types";
import { SkillItem } from "../common/SkillItem";

export interface DashboardSkillsSectionProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
}

export const DashboardSkillsSection: FC<DashboardSkillsSectionProps> = ({
  character,
  isEditing,
  onUpdateData
}) => {
  if (!character.skills || character.skills.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Scroll className="text-orange-500" size={24} />
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Fertigkeiten</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {character.skills.map((skill, i) => (
          <SkillItem 
            key={i} 
            skill={skill} 
            isEditing={isEditing}
            system={character.system}
            onChange={(updates) => {
              const newSkills = [...(character.skills || [])];
              newSkills[i] = { ...skill, ...updates };
              onUpdateData({ skills: newSkills });
            }}
            onRemove={() => {
              const newSkills = (character.skills || []).filter((_, idx) => idx !== i);
              onUpdateData({ skills: newSkills });
            }}
          />
        ))}
        {isEditing && (
          <button 
            onClick={() => onUpdateData({ skills: [...(character.skills || []), { name: "Neue Fertigkeit", value: 5 }] })}
            className="p-2 border border-dashed border-zinc-800 rounded text-zinc-500 hover:text-orange-500 flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Plus size={14} /> Fertigkeit hinzufügen
          </button>
        )}
      </div>
    </section>
  );
};
