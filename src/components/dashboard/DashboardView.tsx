import React, { FC } from "react";
import { CharacterData } from "../../types";
import { isPathfinder } from "../../utils/pathfinder";
import { CharacterConditionsBanner } from "../common/CharacterConditionsBanner";
import { CurrencyBar } from "./CurrencyBar";
import { PathfinderDashboardSection } from "../../systems/pathfinder/PathfinderDashboardSection";
import { ShadowrunDashboardSection } from "../../systems/shadowrun/ShadowrunDashboardSection";
import { TravellerDashboardSection } from "../../systems/traveller/TravellerDashboardSection";
import { CthulhuDashboardSection } from "../../systems/cthulhu/CthulhuDashboardSection";
import { DashboardSkillsSection } from "./DashboardSkillsSection";
import { InventorySection } from "./InventorySection";
import { CombatArsenalSection } from "./CombatArsenalSection";
import { AbilitiesSection } from "./AbilitiesSection";
import { QuickRefFooter } from "./QuickRefFooter";
import { PartySection } from "./PartySection";

export interface DashboardViewProps {
  character: CharacterData;
  isEditing: boolean;
  onUpdateData: (partial: Partial<CharacterData>) => void;
  onUpdateCharacter?: (character: CharacterData) => void;
  onOpenRogueTalentModal: () => void;
  onOpenShadowrunQualitiesModal?: () => void;
  onOpenCurrencyModal: () => void;
  onOpenDiceCalc: (title?: string, mod?: number) => void;
  onSwitchToCombatTab?: () => void;
}

export const DashboardView: FC<DashboardViewProps> = ({
  character,
  isEditing,
  onUpdateData,
  onUpdateCharacter,
  onOpenRogueTalentModal,
  onOpenShadowrunQualitiesModal,
  onOpenCurrencyModal,
  onOpenDiceCalc,
  onSwitchToCombatTab
}) => {
  const isPF = isPathfinder(character);

  return (
    <div className="space-y-8">
      {/* Active Conditions and Status Effects Banner */}
      <CharacterConditionsBanner 
        stats={character.stats} 
        system={character.system}
      />

      {/* Currency & Financial Bar */}
      <CurrencyBar 
        character={character}
        onUpdateData={onUpdateData}
        onOpenCurrencyModal={onOpenCurrencyModal}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: System-Specific Core Stats, Skills, and Combat (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Pathfinder 1e System Block */}
          {isPF && (
            <PathfinderDashboardSection 
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onUpdateData={onUpdateData}
              onOpenDiceCalc={onOpenDiceCalc}
              onSwitchToCombatTab={onSwitchToCombatTab}
              isEditing={isEditing}
            />
          )}

          {/* Shadowrun 5e System Block */}
          {character.system === 'shadowrun' && (
            <ShadowrunDashboardSection 
              character={character}
              onUpdateData={onUpdateData}
              isEditing={isEditing}
            />
          )}

          {/* Traveller 2e System Block */}
          {character.system === 'traveller' && (
            <TravellerDashboardSection 
              character={character}
              onUpdateData={onUpdateData}
              onOpenDiceCalc={() => onOpenDiceCalc("Traveller 2W6 Check", 0)}
              isEditing={isEditing}
            />
          )}

          {/* CoC / Characteristics Block */}
          {!isPF && character.characteristics && character.characteristics.length > 0 && (
            <CthulhuDashboardSection 
              character={character}
              onUpdateData={onUpdateData}
              isEditing={isEditing}
            />
          )}

          {/* Quick Skills Section */}
          <DashboardSkillsSection 
            character={character}
            isEditing={isEditing}
            onUpdateData={onUpdateData}
          />

          {/* Inventory & Equipment Section */}
          <InventorySection
            character={character}
            isEditing={isEditing}
            onUpdateData={onUpdateData}
          />

          {/* Weapons & Combat Arsenal Section */}
          <CombatArsenalSection 
            character={character}
            isEditing={isEditing}
            onUpdateData={onUpdateData}
            onOpenDiceCalc={onOpenDiceCalc}
          />
        </div>

        {/* Right Column: Abilities, Rogue Talents, Quick Ref, and Party (4 cols) */}
        <div className="lg:col-span-4 space-y-12">
          {/* Abilities & Class Features (Includes Rogue Talents button or Shadowrun Qualities button) */}
          <AbilitiesSection 
            character={character}
            isEditing={isEditing}
            onUpdateData={onUpdateData}
            onOpenRogueTalentModal={onOpenRogueTalentModal}
            onOpenShadowrunQualitiesModal={onOpenShadowrunQualitiesModal}
          />

          {/* Quick Reference Rules Footer */}
          <QuickRefFooter system={character.system} />

          {/* Party Members Section */}
          <PartySection 
            character={character}
            isEditing={isEditing}
            onUpdateData={onUpdateData}
          />
        </div>
      </div>
    </div>
  );
};
