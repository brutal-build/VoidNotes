import type { Plugin } from "../types";

/**
 * Plugin registry for Void Notes.
 * Plugins are registered once and initialized when the vault is ready.
 */
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private initialized = false;

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered, skipping.`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
    if (this.initialized) {
      try { plugin.init(); } catch (e) { console.error(`Plugin "${plugin.name}" init failed:`, e); }
    }
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;
    try { plugin.destroy(); } catch (e) { console.error(`Plugin "${name}" destroy failed:`, e); }
    this.plugins.delete(name);
  }

  initAll(): void {
    this.initialized = true;
    for (const plugin of Array.from(this.plugins.values())) {
      try { plugin.init(); } catch (e) { console.error(`Plugin "${plugin.name}" init failed:`, e); }
    }
  }

  destroyAll(): void {
    this.initialized = false;
    for (const plugin of Array.from(this.plugins.values())) {
      try { plugin.destroy(); } catch (e) { console.error(`Plugin "${plugin.name}" destroy failed:`, e); }
    }
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}

export const pluginRegistry = new PluginRegistry();
