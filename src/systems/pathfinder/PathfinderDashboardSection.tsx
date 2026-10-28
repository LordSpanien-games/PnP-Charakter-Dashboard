import React, { FC, useMemo } from "react";
import { GenericCharacter } from "../../core/types";
import { PathfinderAttributesCard } from "../../components/PathfinderAttributesCard";
import { PathfinderSavingThrowsCard } from "../../components/PathfinderSavingThrowsCard";
import { PathfinderCombatCard } from "../../components/PathfinderCombatCard";
import {
  calculatePathfinderModifier,
  getAttributeScore,
  recalculatePathfinderCharacter,
} from "../../utils/pathfinder";
import { PATHFINDER_SKILLS } from "../../data/skills/pathfinderSkills";
import { PathfinderSkillsBlock } from "../../components/sheets/PathfinderSkillsBlock";

// ── Props die das Plugin-System erwartet ──────────────────
interface Props {
  character: GenericCharacter;
  isEditing: boolean;
  onUpdate: (updates: Partial<GenericCharacter>) => void;
}

export const PathfinderDashboardSection: FC<Props> = ({
  character,
  isEditing,
  onUpdate,
}) => {
  const attributeMap = useMemo(() => {
    const keys = ["ST", "GE", "KO", "IN", "WE", "CH"] as const;
    const map: Record<string, { score: number; mod: number }> = {};
    keys.forEach((k) => {
      const score = getAttributeScore(character as any, k);
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
      const ranks = typeof rawVal === "number"
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
    onUpdate({ skills: currentSkills });
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
    onUpdate({ skills: currentSkills });
  };

  return (
    <div className="space-y-6">
      <PathfinderAttributesCard
        character={character as any}
        onUpdateCharacteristics={(newChars) => {
          const recalculated = recalculatePathfinderCharacter(character as any, newChars);
          onUpdate(recalculated as any);
        }}
        onOpenDiceCalc={() => {}}
        isEditing={isEditing}
      />
      <PathfinderSavingThrowsCard
        character={character as any}
        onUpdateSavingThrows={(newSaves, updatedStats) => {
          onUpdate({
            savingThrows: newSaves as any,
            ...(updatedStats ? { stats: updatedStats as any } : {}),
          } as any);
        }}
        onOpenDiceCalc={() => {}}
        isEditing={isEditing}
      />
      <PathfinderCombatCard
        character={character as any}
        onUpdateCharacter={(updated) => onUpdate(updated as any)}
        onOpenDiceCalc={() => {}}
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
