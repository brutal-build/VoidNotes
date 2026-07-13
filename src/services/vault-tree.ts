export type VaultTreeNode = VaultTreeFolder | VaultTreeFile;

export interface VaultTreeFolder {
  type: "folder";
  name: string;
  path: string;
  children: VaultTreeNode[];
}

export interface VaultTreeFile {
  type: "file";
  name: string;
  path: string;
}

const normalize = (path: string) => path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

export function treeItemId(type: VaultTreeNode["type"], path: string): string {
  return `vault-${type}-${encodeURIComponent(normalize(path))}`;
}

export function buildVaultTree(files: string[], emptyFolders: string[] = []): VaultTreeFolder {
  const root: VaultTreeFolder = { type: "folder", name: "", path: "", children: [] };
  const folders = new Map<string, VaultTreeFolder>([["", root]]);
  const ensureFolder = (rawPath: string): VaultTreeFolder => {
    const path = normalize(rawPath);
    const existing = folders.get(path);
    if (existing) return existing;
    const slash = path.lastIndexOf("/");
    const parent = ensureFolder(slash < 0 ? "" : path.slice(0, slash));
    const folder: VaultTreeFolder = { type: "folder", name: path.slice(slash + 1), path, children: [] };
    folders.set(path, folder);
    parent.children.push(folder);
    return folder;
  };
  for (const folder of emptyFolders) ensureFolder(folder);
  for (const rawFile of files) {
    const path = normalize(rawFile);
    const slash = path.lastIndexOf("/");
    const parent = ensureFolder(slash < 0 ? "" : path.slice(0, slash));
    parent.children.push({ type: "file", name: path.slice(slash + 1).replace(/\.md$/i, ""), path });
  }
  const sort = (folder: VaultTreeFolder) => {
    folder.children.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1);
    folder.children.forEach((node) => { if (node.type === "folder") sort(node); });
  };
  sort(root);
  return root;
}

export function flattenVisibleTree(root: VaultTreeFolder, expanded: ReadonlySet<string>): VaultTreeNode[] {
  const visible: VaultTreeNode[] = [];
  const visit = (folder: VaultTreeFolder) => folder.children.forEach((node) => {
    visible.push(node);
    if (node.type === "folder" && expanded.has(node.path)) visit(node);
  });
  visit(root);
  return visible;
}
