import { pluginSystem } from "./pluginSystem";
import { VoidPlugin } from "./pluginInterface";
import wordCountPlugin from "./wordCountPlugin";

const builtInPlugins: VoidPlugin[] = [
  wordCountPlugin,
];

function getDisabledPlugins(): Set<string> {
  try {
    const stored = localStorage.getItem("void-disabled-plugins");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDisabledPlugins(disabled: Set<string>): void {
  localStorage.setItem("void-disabled-plugins", JSON.stringify(Array.from(disabled)));
}

export function isPluginEnabled(id: string): boolean {
  return !getDisabledPlugins().has(id);
}

export function setPluginEnabled(id: string, enabled: boolean): void {
  const disabled = getDisabledPlugins();
  if (enabled) {
    disabled.delete(id);
  } else {
    disabled.add(id);
  }
  saveDisabledPlugins(disabled);
}

export function getAllPluginManifests(): { plugin: VoidPlugin; enabled: boolean }[] {
  const disabled = getDisabledPlugins();
  return builtInPlugins.map((p) => ({
    plugin: p,
    enabled: !disabled.has(p.manifest.id),
  }));
}

export async function loadPlugins(): Promise<void> {
  const disabled = getDisabledPlugins();

  for (const plugin of builtInPlugins) {
    if (!disabled.has(plugin.manifest.id)) {
      await pluginSystem.registerPlugin(plugin);
    }
  }

  try {
    const pluginNames = await window.electronAPI.listPlugins();
    for (const name of pluginNames) {
      try {
        if (disabled.has(name)) continue;
        const content = await window.electronAPI.loadPlugin(name);
        if (!content) continue;
        const blob = new Blob([content], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const mod = await import(/* webpackIgnore: true */ url);
        URL.revokeObjectURL(url);
        const plugin: VoidPlugin = mod.default ?? mod.plugin ?? mod;
        if (plugin?.manifest?.id) {
          await pluginSystem.registerPlugin(plugin);
        }
      } catch (e) {
        console.error(`Failed to load plugin "${name}":`, e);
      }
    }
  } catch {}
}

export async function unloadPlugins(): Promise<void> {
  for (const plugin of pluginSystem.getAllPlugins()) {
    pluginSystem.unregisterPlugin(plugin.manifest.id);
  }
}

export function getDynamicPluginManifests(): { name: string; enabled: boolean }[] {
  const disabled = getDisabledPlugins();
  return [];
}
