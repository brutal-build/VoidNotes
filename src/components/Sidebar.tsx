import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";
import EmptyState from "./EmptyState";
import { useContextMenu } from "../hooks/useContextMenu";

interface SidebarProps {
  notes: string[];
  allNotes: string[];
  activeNote: string | null;
  focusMode: boolean;
  vaultPath: string | null;
  tags: string[];
  selectedTags: string[];
  bookmarks: string[];
  pinnedNotes: string[];
  onToggleTag: (tag: string) => void;
  onToggleFocusMode: () => void;
  onSelect: (fileName: string) => void;
  onNew: () => void;
  onDelete: (fileName: string) => void;
  onRename: (oldName: string) => void;
  onToggleBookmark: (note: string) => void;
  onTogglePin: (note: string) => void;
  onDailyNote: () => void;
  onOpenSearch: () => void;
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
  pinnedNotes: string[],
): TreeItem[] {
  const items: TreeItem[] = [];
  const folderPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const sortedFolders = Array.from(node.subfolders.entries()).sort(([a], [b]) => a.localeCompare(b));
  const sortedFiles = [...node.files].sort((a, b) => {
    const aPinned = pinnedNotes.includes(a);
    const bPinned = pinnedNotes.includes(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return a.localeCompare(b);
  });

  for (const [name, folder] of sortedFolders) {
    const childPath = parentPath ? `${parentPath}/${name}` : name;
    items.push({ id: `folder:${childPath}`, type: "folder", label: name, depth });
    if (openFolders.has(childPath)) {
      items.push(...flattenTree(folder, openFolders, depth + 1, childPath, pinnedNotes));
    }
  }

  for (const file of sortedFiles) {
    const label = file.split("/").pop()?.replace(/\.md$/, "") || file;
    items.push({ id: `file:${file}`, type: "file", label, depth, file });
  }

  return items;
}

export default function Sidebar({ notes, allNotes, activeNote, focusMode, vaultPath, tags, selectedTags, bookmarks, pinnedNotes, onToggleTag, onToggleFocusMode, onSelect, onNew, onDelete, onRename, onToggleBookmark, onTogglePin, onDailyNote, onOpenSearch, onOpenHelp }: SidebarProps) {
  const sortedNotes = useMemo(() => {
    const pinned = notes.filter((n) => pinnedNotes.includes(n));
    const unpinned = notes.filter((n) => !pinnedNotes.includes(n));
    return [...pinned, ...unpinned];
  }, [notes, pinnedNotes]);

  const tree = useMemo(() => buildTree(sortedNotes), [sortedNotes]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const { isOpen: contextMenuOpen, x: contextMenuX, y: contextMenuY, items: contextMenuItems, showContextMenu, closeContextMenu } = useContextMenu();

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedId) {
      const el = itemRefs.current.get(focusedId);
      el?.focus();
    }
  }, [focusedId]);

  const flatItems = useMemo(
    () => flattenTree(tree, openFolders, 0, "", pinnedNotes),
    [tree, openFolders, pinnedNotes],
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

  const handleRename = useCallback((file: string) => {
    onRename(file);
  }, [onRename]);

  const handleCopyPath = useCallback((file: string) => {
    const fullPath = vaultPath ? `${vaultPath}\\${file.replace(/\//g, "\\")}` : file;
    navigator.clipboard.writeText(fullPath);
  }, [vaultPath]);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: string) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [
      { label: "Open", icon: "open", action: () => onSelect(file) },
      { label: pinnedNotes.includes(file) ? "Unpin" : "Pin", icon: pinnedNotes.includes(file) ? "pin-filled" : "pin", action: () => onTogglePin(file) },
      { label: bookmarks.includes(file) ? "Remove bookmark" : "Bookmark", icon: bookmarks.includes(file) ? "star-filled" : "star", action: () => onToggleBookmark(file) },
      { label: "Rename", icon: "rename", action: () => handleRename(file) },
      { label: "Copy path", icon: "copy", action: () => handleCopyPath(file) },
      { label: "Delete", icon: "delete", action: () => onDelete(file), danger: true },
    ];
    showContextMenu(e.clientX, e.clientY, items);
  }, [onSelect, onTogglePin, onToggleBookmark, handleRename, handleCopyPath, onDelete, pinnedNotes, bookmarks, showContextMenu]);

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
          <button className="btn-icon" onClick={onDailyNote} title="Daily note (Ctrl+D)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <button className={`btn-icon focus-toggle${focusMode ? " active" : ""}`} onClick={onToggleFocusMode} title="Toggle focus mode (F9)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </div>
      </div>
      {allNotes.length === 0 ? (
        <EmptyState
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          }
          title="No notes yet"
          description="Press Ctrl+N to create your first note."
          action={{ label: "Create Note", onClick: onNew }}
        />
      ) : (
      <div
        className="file-tree"
        role="tree"
        ref={treeRef}
        tabIndex={0}
        onKeyDown={handleTreeKeyDown}
        onFocus={() => {
          if (!focusedId && flatItems.length > 0) {
            setFocusedId(flatItems[0].id);
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setFocusedId(null);
          }
        }}
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
                ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
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
              ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
              onClick={() => item.file && onSelect(item.file)}
              onContextMenu={(e) => item.file && handleContextMenu(e, item.file)}
              onFocus={() => handleItemFocus(item.id)}
            >
              <span className="tree-file-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <span className="tree-file-name">{item.label}</span>
              {item.file && pinnedNotes.includes(item.file) && (
                <span className="tree-pin-indicator" title="Pinned">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                </span>
              )}
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
      )}

      {contextMenuOpen && createPortal(
        <ContextMenu
          x={contextMenuX}
          y={contextMenuY}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />,
        document.body
      )}
    </div>
  );
}
