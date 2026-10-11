import React, { FC } from "react";
import { CharacterData } from "../../types";
import { TravellerDashboardCard } from "../../components/TravellerDashboardCard";

export interface TravellerDashboardSectionProps {
  character: CharacterData;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onOpenDiceCalc: () => void;
  isEditing: boolean;
}

export const TravellerDashboardSection: FC<TravellerDashboardSectionProps> = ({
  character,
  onUpdateData,
  onOpenDiceCalc,
  isEditing
}) => {
  return (
    <div className="space-y-6">
      <TravellerDashboardCard
        character={character}
        onUpdateStats={(newStats) => onUpdateData({ stats: newStats })}
        onUpdateCharacteristics={(newChars) => onUpdateData({ characteristics: newChars })}
        onOpenDiceCalc={onOpenDiceCalc}
        isEditing={isEditing}
      />
    </div>
  );
};
