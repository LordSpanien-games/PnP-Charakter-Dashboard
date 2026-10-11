import React, { FC } from "react";
import { CharacterData } from "../../types";
import { ShadowrunLimitsCard } from "../../components/ShadowrunLimitsCard";
import { ShadowrunBodyModsCard } from "../../components/ShadowrunBodyModsCard";
import { ShadowrunCyberdeckCard } from "../../components/ShadowrunCyberdeckCard";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export interface ShadowrunDashboardSectionProps {
  character: CharacterData;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  isEditing: boolean;
}

export const ShadowrunDashboardSection: FC<ShadowrunDashboardSectionProps> = ({
  character,
  onUpdateData,
  isEditing
}) => {
  return (
    <div className="space-y-6">
      <ShadowrunLimitsCard
        character={character}
        onUpdateLimits={(newLimits) => onUpdateData({ limits: newLimits })}
        isEditing={isEditing}
      />

      <ShadowrunBodyModsCard
        character={character}
        onUpdateBodyMods={(newMods) => {
          const totalSpent = newMods.reduce((acc, mod) => acc + (Number(mod.essenceCost) || 0), 0);
          const remaining = Math.max(0, parseFloat((6.0 - totalSpent).toFixed(2)));

          const hasEssence = character.stats.some(
            s => s.label.toLowerCase() === 'essenz' || s.label.toLowerCase() === 'essence'
          );
          const updatedStats = hasEssence
            ? character.stats.map(s =>
                (s.label.toLowerCase() === 'essenz' || s.label.toLowerCase() === 'essence')
                  ? { ...s, value: remaining }
                  : s
              )
            : [...character.stats, { label: "Essenz", value: remaining }];

          onUpdateData({ 
            bodyMods: newMods,
            stats: updatedStats
          });
        }}
        isEditing={isEditing}
      />

      <ErrorBoundary fallbackTitle="Matrix Cyberdeck Interface">
        <ShadowrunCyberdeckCard
          character={character}
          onUpdateCyberdeck={(deck) => onUpdateData({ cyberdeck: deck })}
          isEditing={isEditing}
        />
      </ErrorBoundary>
    </div>
  );
};
