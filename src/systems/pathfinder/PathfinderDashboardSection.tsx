import React, { FC } from "react";
import { CharacterData } from "../../types";
import { PathfinderAttributesCard } from "../../components/PathfinderAttributesCard";
import { PathfinderSavingThrowsCard } from "../../components/PathfinderSavingThrowsCard";
import { PathfinderCombatCard } from "../../components/PathfinderCombatCard";
import { recalculatePathfinderCharacter } from "../../utils/pathfinder";

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
            ...(updatedStats ? { stats: updatedStats } : {})
          });
        }}
        onOpenDiceCalc={(saveType, mod) => {
          onOpenDiceCalc(saveType, mod);
        }}
        isEditing={isEditing}
      />
      <PathfinderCombatCard
        character={character}
        onUpdateCharacter={(updated) => handleUpdateChar(updated)}
        onOpenDiceCalc={(title, mod) => onOpenDiceCalc(title, mod)}
        onSwitchToCombatTab={onSwitchToCombatTab}
        isEditing={isEditing}
      />
    </div>
  );
};
