import { registerSystem } from "../core/systemRegistry";
import { CairnPlugin, Cairn2Plugin } from "./cairn/CairnPlugin";
import { PathfinderPlugin } from "./pathfinder/PathfinderPlugin";
import { ShadowrunPlugin } from "./shadowrun/ShadowrunPlugin";
import { CoC7ePlugin, CoC1920Plugin } from "./cthulhu/CthulhuPlugin";

export const registerAllSystems = (): void => {
  registerSystem(CairnPlugin);
  registerSystem(Cairn2Plugin);
  registerSystem(PathfinderPlugin);
  registerSystem(ShadowrunPlugin);
  registerSystem(CoC1920Plugin); // vor CoC7e registrieren, da dessen detectLegacy exakter prüft
  registerSystem(CoC7ePlugin);
  // Neues System? Einfach hier eine Zeile ergänzen:
  // registerSystem(DsaPlugin);
};
