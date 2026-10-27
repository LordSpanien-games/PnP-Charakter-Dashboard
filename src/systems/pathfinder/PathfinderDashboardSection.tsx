import React, { FC, useState, useMemo } from "react";
import { CharacterData } from "../../types";
import { PathfinderAttributesCard } from "../../components/PathfinderAttributesCard";
import { PathfinderSavingThrowsCard } from "../../components/PathfinderSavingThrowsCard";
import { PathfinderCombatCard } from "../../components/PathfinderCombatCard";
import {
  recalculatePathfinderCharacter,
  calculatePathfinderModifier,
  formatPathfinderModifier,
  getAttributeScore,
} from "../../utils/pathfinder";
import { PATHFINDER_SKILLS } from "../../data/skills/pathfinderSkills";
import { PathfinderSkillsBlock } from "../../components/sheets/PathfinderSkillsBlock";

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
  isEditing,
}) => {
  const handleUpdateChar = onUpdateCharacter || ((c: CharacterData) => onUpdateData(c));

  const attributeMap = useMemo(() => {
    const keys = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
    const map: Record<string, { score: number; mod: number }> = {};
    keys.forEach((k) => {
      const score = getAttributeScore(character, k);
      map[k] = { score, mod: calculatePathfinderModifier(score) };
    });
    return map;
  }, [character]);

  const mergedSkills = useMemo(() => {
    const userSkills = character.skills || [];
    return PATHFINDER_SKILLS.map((def) => {
      const existing = userSkills.find((s) => {
        const sName = (s?.name || "").toLowerCase().trim();
        const defName = def.name.toLowerCase().trim();
        if (sName === defName) return true;
        if (def.aliases?.some((a) => a.toLowerCase().trim() === sName)) return true;
        return false;
      });
      const attrMod = attributeMap[def.attr]?.mod || 0;
      const rawVal = existing ? existing.value : 0;
      const ranks =
        typeof rawVal === "number"
          ? rawVal
          : parseInt(String(rawVal).replace(/[^0-9-]/g, ""), 10) || 0;
      const isClassSkill = existing?.trained ?? false;
      const classBonus = isClassSkill && ranks > 0 ? 3 : 0;
      const totalBonus = attrMod + ranks + classBonus + (existing?.miscBonus ?? 0);
      return {
        ...def,
        ranks,
        isClassSkill,
        classBonus,
        attrMod,
        totalBonus,
        miscBonus: existing?.miscBonus ?? 0,
      };
    });
  }, [character.skills, attributeMap]);

  const handleUpdateSkillRanks = (skillName: string, newRanks: number) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex(
      (s) => (s?.name || "").toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], value: newRanks };
    } else {
      currentSkills.push({ name: skillName, value: newRanks, trained: false });
    }
    onUpdateData({ skills: currentSkills });
  };

  const handleToggleClassSkill = (skillName: string) => {
    const currentSkills = [...(character.skills || [])];
    const idx = currentSkills.findIndex(
      (s) => (s?.name || "").toLowerCase() === skillName.toLowerCase()
    );
    if (idx >= 0) {
      currentSkills[idx] = { ...currentSkills[idx], trained: !currentSkills[idx].trained };
    } else {
      currentSkills.push({ name: skillName, value: 0, trained: true });
    }
    onUpdateData({ skills: currentSkills });
  };

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
            ...(updatedStats ? { stats: updatedStats } : {}),
          });
        }}
        onOpenDiceCalc={(saveType, mod) => onOpenDiceCalc(saveType, mod)}
        isEditing={isEditing}
      />

      <PathfinderCombatCard
        character={character}
        onUpdateCharacter={(updated) => handleUpdateChar(updated)}
        onOpenDiceCalc={(title, mod) => onOpenDiceCalc(title, mod)}
        onSwitchToCombatTab={onSwitchToCombatTab}
        isEditing={isEditing}
      />

      <PathfinderSkillsBlock
        mergedSkills={mergedSkills}
        isEditable={isEditing}
        onUpdateSkillRanks={handleUpdateSkillRanks}
        onToggleClassSkill={handleToggleClassSkill}
        printMode={false}
      />
    </div>
  );
};
