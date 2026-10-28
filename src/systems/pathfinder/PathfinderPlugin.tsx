import { PATHFINDER_SKILLS } from "../../data/skills/pathfinderSkills";
import { PathfinderSkillsBlock } from "../../components/sheets/PathfinderSkillsBlock";
import { PathfinderLevelUpView } from "./PathfinderLevelUpView";
import React, { useState } from "react";
import { Info, Plus, Minus, ChevronDown, ChevronRight, X, Moon, BedDouble, Printer, Download } from "lucide-react";
import { SystemPlugin, AttributePool, PluginViewProps } from "../../core/SystemPlugin";
import {
  GenericCharacter,
  createEmptyGenericCharacter,
  InventoryItem,
  CombatModifier,
  CombatModifierContext,
  CombatModifierSourceType,
  Ability,
} from "../../core/types";
import { rollPool, roll4d6DropLowest } from "../../core/dice";
import { applyRest } from "../../core/rest";
import {
  ValueBadge,
  ChargeTracker,
  ValueStepper,
  SourceReferenceBadges,
  SourceReferenceEditor,
  PartyCard,
  CurrencyHistoryCard,
} from "../../core/uiKit";
import { downloadCharacterAsMarkdown } from "../../core/markdownExport";
import {
  PathfinderAttributes,
  calculateModifier,
  formatModifier,
  calculateSavingThrows,
  calculateArmorClass,
  calculateCombatManeuver,
  calculateWeaponGripVariants,
  calculateTwoWeaponFighting,
  calculateBAB,
  formatIteratives,
  getBabIteratives,
  getSneakAttackDice,
  getRageRounds,
  getFavoredEnemyBonus,
  getChannelEnergy,
  getBardicPerformanceRounds,
  getStunningFistUses,
  calculateNaturalHealingAmount,
  sumMiscCombatBonuses,
  parseLegacyWeaponDamage,
  parseMagicBonusFromName,
  makeModifierId,
  PATHFINDER_RACES,
} from "./pathfinderRules";
import { PATHFINDER_CLASSES } from "../../utils/levelUpRules";
