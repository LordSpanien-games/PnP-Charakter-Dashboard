import { SystemPlugin } from "./SystemPlugin";

const registry = new Map<string, SystemPlugin>();

export const registerSystem = (plugin: SystemPlugin): void => {
  registry.set(plugin.id, plugin);
};

export const getSystem = (id: string): SystemPlugin | undefined => registry.get(id);

export const getAllSystems = (): SystemPlugin[] => Array.from(registry.values());

export const detectSystemForLegacyJson = (raw: any): SystemPlugin | undefined => {
  for (const plugin of registry.values()) {
    try {
      if (plugin.detectLegacy(raw)) return plugin;
    } catch {
      // defekten Detector ignorieren, weiter probieren
    }
  }
  return undefined;
};
