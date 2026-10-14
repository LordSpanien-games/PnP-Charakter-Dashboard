import { GenericCharacter, Ability, InventoryItem } from "./types";

export interface RestSummary {
  refreshedAbilities: string[];
  refreshedItems: string[];
}

/**
 * Generische Rast-Funktion: Setzt alle Fähigkeiten mit Tagesnutzung
 * (maxUses/currentUses) und alle Inventar-Ladungen mit rechargeType "rest"
 * wieder auf ihren Maximalwert. Funktioniert identisch für jedes System-
 * Plugin, da sie nur auf generischen Feldern arbeitet - kein Dateneingriff
 * pro Regelsystem nötig.
 */
export const applyRest = (
  character: GenericCharacter
): { character: GenericCharacter; summary: RestSummary } => {
  const refreshedAbilities: string[] = [];
  const refreshedItems: string[] = [];

  const abilities: Ability[] = character.abilities.map((a) => {
    if (a.maxUses !== undefined && a.currentUses !== a.maxUses) {
      refreshedAbilities.push(a.name);
      return { ...a, currentUses: a.maxUses };
    }
    return a;
  });

  const inventory: InventoryItem[] = character.inventory.map((it) => {
    if (it.charges && it.charges.rechargeType === "rest" && it.charges.current !== it.charges.max) {
      refreshedItems.push(it.name);
      return { ...it, charges: { ...it.charges, current: it.charges.max } };
    }
    return it;
  });

  return {
    character: { ...character, abilities, inventory },
    summary: { refreshedAbilities, refreshedItems },
  };
};
