import { registerAllSystems } from "../systems/registerAllSystems";

let initialized = false;

export const ensureSystemsRegistered = (): void => {
  if (initialized) return;
  registerAllSystems();
  initialized = true;
};
