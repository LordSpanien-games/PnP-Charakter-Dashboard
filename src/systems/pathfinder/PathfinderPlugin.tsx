import { FC } from "react";
import { AttributeDefinition, ResourceDefinition, GenericCharacter } from "./types";

export type GenerationMode = "blank" | "auto" | "manual";

export interface AttributePool {
  values: number[];
  methodLabel: string;
}

export interface PluginViewProps {
  character: GenericCharacter;
  isEditing: boolean;
  onUpdate: (updates: Partial<GenericCharacter>) => void;
}

/** Zusätzlicher Reiter neben der Hauptübersicht, z.B. für ausführliche
 * Kampfberechnungen, die auf dem echten Papierbogen nicht stehen. */
export interface SecondaryView {
  id: string;
  label: string;
  Component: FC<PluginViewProps>;
}

export interface SystemPlugin {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  color: string;
  activeColor: string;

  attributeDefinitions: AttributeDefinition[];
  resourceDefinitions: ResourceDefinition[];

  createBlankCharacter: (name: string, subTitle?: string) => GenericCharacter;
  rollAttributePool: () => AttributePool;
  supportsManualAssignment: boolean;
  buildCharacterFromPool: (
    name: string,
    subTitle: string | undefined,
    pool: number[],
    assignment?: Record<string, number>
  ) => GenericCharacter;
  detectLegacy: (raw: any) => boolean;
  migrateLegacy: (raw: any) => GenericCharacter;
  recalculate: (character: GenericCharacter) => GenericCharacter;

  /** Schlanke Hauptansicht, soll dem echten Papierbogen ähneln. */
  DashboardComponent: FC<PluginViewProps>;

  /** Optionale Zusatz-Reiter (z.B. "Kampf"). Systeme ohne Bedarf
   * (z.B. einfache OSR-Systeme) lassen dieses Feld einfach weg. */
  secondaryViews?: SecondaryView[];
}
