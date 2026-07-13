import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

interface SidebarProps {
  notes: string[];
  allNotes: string[];
  activeNote: string | null;
  focusMode: boolean;
  vaultPath: string | null;
  tags: string[];
  selectedTags: string[];
  bookmarks: string[];
  onToggleTag: (tag: string) => void;
  onToggleFocusMode: () => void;
  onSelect: (fileName: string) => void;
  onNew: () => void;
  onDelete: (fileName: string) => void;
  onRename: (oldName: string) => void;
  onToggleBookmark: (note: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface FolderNode {
  name: string;
  files: string[];
  subfolders: Map<string, FolderNode>;
}

interface TreeItem {
  id: string;
  type: "folder" | "file";
  label: string;
  depth: number;
  file?: string; // only for type "file"
}

function buildTree(files: string[]): FolderNode {
  const root: FolderNode = { name: "", files: [], subfolders: new Map() };
  for (const file of files) {
    const parts = file.replace(/\.md$/, "").split("/");
    let current = root;
    if (parts.length === 1) {
      root.files.push(file);
    } else {
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current.subfolders.has(parts[i])) {
          current.subfolders.set(parts[i], { name: parts[i], files: [], subfolders: new Map() });
        }
        current = current.subfolders.get(parts[i])!;
      }
      current.files.push(file);
    }
  }
  return root;
}

function flattenTree(
  node: FolderNode,
  openFolders: Set<string>,
  depth: number,
  parentPath: string,
): TreeItem[] {
  const items: TreeItem[] = [];
  const folderPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const sortedFolders = Array.from(node.subfolders.entries()).sort(([a], [b]) => a.localeCompare(b));
  const sortedFiles = [...node.files].sort();

  for (const [name, folder] of sortedFolders) {
    const childPath = parentPath ? `${parentPath}/${name}` : name;
    items.push({ id: `folder:${childPath}`, type: "folder", label: name, depth });
    if (openFolders.has(childPath)) {
      items.push(...flattenTree(folder, openFolders, depth + 1, childPath));
    }
  }

  for (const file of sortedFiles) {
    const label = file.split("/").pop()?.replace(/\.md$/, "") || file;
    items.push({ id: `file:${file}`, type: "file", label, depth, file });
  }

  return items;
}

export default function Sidebar({ notes, allNotes, activeNote, focusMode, vaultPath, tags, selectedTags, bookmarks, onToggleTag, onToggleFocusMode, onSelect, onNew, onDelete, onRename, onToggleBookmark, onOpenSearch, onOpenSettings, onOpenHelp }: SidebarProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: string } | null>(null);

  const flatItems = useMemo(
    () => flattenTree(tree, openFolders, 0, ""),
    [tree, openFolders],
  );

  const focusedIndex = useMemo(
    () => focusedId ? flatItems.findIndex((item) => item.id === focusedId) : -1,
    [focusedId, flatItems],
  );

  const toggleFolder = useCallback((folderPath: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  }, []);

  const handleRename = useCallback((file: string) => {
    onRename(file);
  }, [onRename]);

  const handleCopyPath = useCallback((file: string) => {
    const fullPath = vaultPath ? `${vaultPath}\\${file.replace(/\//g, "\\")}` : file;
    navigator.clipboard.writeText(fullPath);
  }, [vaultPath]);

  const contextMenuItems: ContextMenuItem[] = contextMenu ? [
    { label: "Open", icon: "open", action: () => onSelect(contextMenu.file) },
    { label: bookmarks.includes(contextMenu.file) ? "Remove bookmark" : "Bookmark", icon: bookmarks.includes(contextMenu.file) ? "star-filled" : "star", action: () => onToggleBookmark(contextMenu.file) },
    { label: "Rename", icon: "rename", action: () => handleRename(contextMenu.file) },
    { label: "Copy path", icon: "copy", action: () => handleCopyPath(contextMenu.file) },
    { label: "Delete", icon: "delete", action: () => onDelete(contextMenu.file), danger: true },
  ] : [];

  const handleTreeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;

    const idx = focusedIndex;
    let nextIdx = idx;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        nextIdx = idx < flatItems.length - 1 ? idx + 1 : idx;
        break;
      case "ArrowUp":
        e.preventDefault();
        nextIdx = idx > 0 ? idx - 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        nextIdx = 0;
        break;
      case "End":
        e.preventDefault();
        nextIdx = flatItems.length - 1;
        break;
      case "ArrowRight": {
        e.preventDefault();
        const item = flatItems[idx];
        if (item && item.type === "folder") {
          const folderPath = item.id.slice("folder:".length);
          if (!openFolders.has(folderPath)) {
            toggleFolder(folderPath);
          }
        }
        return;
      }
      case "ArrowLeft": {
        e.preventDefault();
        const item = flatItems[idx];
        if (item && item.type === "folder") {
          const folderPath = item.id.slice("folder:".length);
          if (openFolders.has(folderPath)) {
            toggleFolder(folderPath);
          }
        } else if (item && item.type === "file" && item.depth > 0) {
          // Navigate to parent folder
          const parts = item.file!.split("/");
          parts.pop();
          const parentPath = parts.join("/");
          const parentId = `folder:${parentPath}`;
          const parentIdx = flatItems.findIndex((i) => i.id === parentId);
          if (parentIdx >= 0) nextIdx = parentIdx;
        }
        break;
      }
      case "Enter":
        e.preventDefault();
        if (idx >= 0) {
          const item = flatItems[idx];
          if (item.type === "folder") {
            toggleFolder(item.id.slice("folder:".length));
          } else if (item.type === "file" && item.file) {
            onSelect(item.file);
          }
        }
        return;
      default:
        return;
    }

    if (nextIdx >= 0 && nextIdx < flatItems.length) {
      setFocusedId(flatItems[nextIdx].id);
    }
  }, [flatItems, focusedIndex, openFolders, toggleFolder, onSelect]);

  const handleItemFocus = useCallback((itemId: string) => {
    setFocusedId(itemId);
  }, []);

  return (
    <div className={`sidebar${focusMode ? " sidebar-focus" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Vault</span>
        <div className="sidebar-actions">
          <button className="btn-icon" onClick={onOpenSearch} title="Search (Ctrl+P)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
          <button className="btn-icon" onClick={onNew} title="New note (Ctrl+N)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
          <button className={`btn-icon focus-toggle${focusMode ? " active" : ""}`} onClick={onToggleFocusMode} title="Toggle focus mode (F9)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </div>
      </div>
      <div
        className="file-tree"
        role="tree"
        onKeyDown={handleTreeKeyDown}
      >
        {flatItems.map((item) => {
          const isFocused = item.id === focusedId;
          const folderPath = item.id.slice("folder:".length);

          if (item.type === "folder") {
            const isExpanded = openFolders.has(folderPath);
            return (
              <div
                key={item.id}
                role="treeitem"
                aria-expanded={isExpanded ? "true" : "false"}
                tabIndex={isFocused ? 0 : -1}
                className="tree-folder-header"
                style={{ paddingLeft: `${12 + item.depth * 12}px` }}
                onClick={() => toggleFolder(folderPath)}
                onFocus={() => handleItemFocus(item.id)}
              >
                <span className={`tree-folder-icon ${isExpanded ? "open" : ""}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </span>
                <span className="tree-folder-name">{item.label}</span>
              </div>
            );
          }

          // file type
          return (
            <div
              key={item.id}
              role="treeitem"
              aria-selected={item.file === activeNote ? "true" : "false"}
              tabIndex={isFocused ? 0 : -1}
              className={`tree-file ${item.file === activeNote ? "active" : ""}`}
              style={{ paddingLeft: `${12 + item.depth * 12 + 16}px` }}
              onClick={() => item.file && onSelect(item.file)}
              onContextMenu={(e) => item.file && handleContextMenu(e, item.file)}
              onFocus={() => handleItemFocus(item.id)}
            >
              <span className="tree-file-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <span className="tree-file-name">{item.label}</span>
              {item.file && bookmarks.includes(item.file) && (
                <span className="tree-bookmark-star" title="Bookmarked">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
              )}
              <span className="tree-file-actions">
                <button
                  className="btn-icon btn-delete-sm"
                  onClick={(e) => { e.stopPropagation(); item.file && onDelete(item.file); }}
                  tabIndex={-1}
                >
                  &times;
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />,
        document.body
      )}
    </div>
  );
}
