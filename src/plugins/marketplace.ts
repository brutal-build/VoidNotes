export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  repoUrl: string;
  scriptUrl: string;
  tags: string[];
}

export interface InstalledPlugin {
  id: string;
  version: string;
  installedAt: string;
}

const MARKETPLACE_URL = "https://raw.githubusercontent.com/PixelCodeGH/VoidNotes/main/public/plugins.json";
const LOCAL_FALLBACK = "/plugins.json";

function getInstalled(): Map<string, InstalledPlugin> {
  try {
    const stored = localStorage.getItem("void-installed-plugins");
    if (!stored) return new Map();
    const arr: InstalledPlugin[] = JSON.parse(stored);
    return new Map(arr.map((p) => [p.id, p]));
  } catch {
    return new Map();
  }
}

function saveInstalled(installed: Map<string, InstalledPlugin>): void {
  localStorage.setItem("void-installed-plugins", JSON.stringify(Array.from(installed.values())));
}

export function getInstalledPlugins(): InstalledPlugin[] {
  return Array.from(getInstalled().values());
}

export function isInstalled(id: string): boolean {
  return getInstalled().has(id);
}

export function getInstalledVersion(id: string): string | null {
  return getInstalled().get(id)?.version ?? null;
}

export function needsUpdate(id: string, remoteVersion: string): boolean {
  const local = getInstalledVersion(id);
  if (!local) return false;
  return local !== remoteVersion;
}

export async function fetchMarketplace(): Promise<MarketplacePlugin[]> {
  try {
    const res = await fetch(MARKETPLACE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data as MarketplacePlugin[];
  } catch {
    try {
      const res = await fetch(LOCAL_FALLBACK, { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      return data as MarketplacePlugin[];
    } catch {
      return [];
    }
  }
}

export async function installPlugin(plugin: MarketplacePlugin): Promise<boolean> {
  try {
    const res = await fetch(plugin.scriptUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const script = await res.text();

    const ok = await window.electronAPI.savePluginFile(plugin.id, script);
    if (!ok) return false;

    const installed = getInstalled();
    installed.set(plugin.id, {
      id: plugin.id,
      version: plugin.version,
      installedAt: new Date().toISOString(),
    });
    saveInstalled(installed);
    return true;
  } catch (err) {
    console.error(`Failed to install plugin "${plugin.id}":`, err);
    return false;
  }
}

export async function updatePlugin(plugin: MarketplacePlugin): Promise<boolean> {
  return installPlugin(plugin);
}

export async function uninstallPlugin(id: string): Promise<boolean> {
  try {
    const ok = await window.electronAPI.deletePluginFile(id);
    if (!ok) return false;

    const installed = getInstalled();
    installed.delete(id);
    saveInstalled(installed);
    return true;
  } catch (err) {
    console.error(`Failed to uninstall plugin "${id}":`, err);
    return false;
  }
}
