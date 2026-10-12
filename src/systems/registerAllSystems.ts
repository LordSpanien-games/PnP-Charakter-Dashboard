import { registerSystem } from "../core/systemRegistry";
import { CairnPlugin, Cairn2Plugin } from "./cairn/CairnPlugin";
// import { PathfinderPlugin } from "./pathfinder/PathfinderPlugin"; // folgt im nächsten Schritt

export const registerAllSystems = (): void => {
  registerSystem(CairnPlugin);
  registerSystem(Cairn2Plugin);
  // registerSystem(PathfinderPlugin);
  // Neues System? Einfach hier eine Zeile ergänzen:
  // registerSystem(DsaPlugin);
};
