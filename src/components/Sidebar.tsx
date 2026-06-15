import React, { useState, useMemo, useCallback } from "react";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

interface SidebarProps {
  notes: string[];
  allNotes: string[];
  activeNote: string | null;
  focusMode: boolean;
  vaultPath: string | null;
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onToggleFocusMode: () => void;
  onSelect: (fileName: string) => void;
  onNew: () => void;
  onDelete: (fileName: string) => void;
  onRename: (oldName: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface FolderNode {
  name: string;
  files: string[];
  subfolders: Map<string, FolderNode>;
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

function FolderView({ node, activeNote, onSelect, onDelete, onContextMenu, depth = 0 }: {
  node: FolderNode;
  activeNote: string | null;
  onSelect: (f: string) => void;
  onDelete: (f: string) => void;
  onContextMenu: (e: React.MouseEvent, file: string) => void;
  depth?: number;
}) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (name: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const sortedFolders = useMemo(() =>
    Array.from(node.subfolders.entries()).sort(([a], [b]) => a.localeCompare(b)),
    [node.subfolders]
  );
  const sortedFiles = useMemo(() => [...node.files].sort(), [node.files]);

  return (
    <>
      {sortedFolders.map(([name, folder]) => (
        <div key={name} className="tree-folder">
          <div
            className="tree-folder-header"
            style={{ paddingLeft: `${12 + depth * 12}px` }}
            onClick={() => toggleFolder(name)}
          >
            <span className={`tree-folder-icon ${openFolders.has(name) ? "open" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </span>
            <span className="tree-folder-name">{name}</span>
          </div>
          {openFolders.has(name) && (
            <div className="tree-children">
              <FolderView node={folder} activeNote={activeNote} onSelect={onSelect} onDelete={onDelete} onContextMenu={onContextMenu} depth={depth + 1} />
            </div>
          )}
        </div>
      ))}
      {sortedFiles.map((file) => (
        <div
          key={file}
          className={`tree-file ${file === activeNote ? "active" : ""}`}
          style={{ paddingLeft: `${12 + depth * 12 + 16}px` }}
          onClick={() => onSelect(file)}
          onContextMenu={(e) => onContextMenu(e, file)}
        >
          <span className="tree-file-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <span className="tree-file-name">{file.split("/").pop()?.replace(/\.md$/, "") || file}</span>
          <span className="tree-file-actions">
            <button
              className="btn-icon btn-delete-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(file); }}
            >
              &times;
            </button>
          </span>
        </div>
      ))}
    </>
  );
}

export default function Sidebar({ notes, allNotes, activeNote, focusMode, vaultPath, tags, selectedTags, onToggleTag, onToggleFocusMode, onSelect, onNew, onDelete, onRename, onOpenSearch, onOpenSettings, onOpenHelp }: SidebarProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: string } | null>(null);

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
    { label: "Open", icon: "\u{1F4C4}", action: () => onSelect(contextMenu.file) },
    { label: "Rename", icon: "\u{270F}\u{FE0F}", action: () => handleRename(contextMenu.file) },
    { label: "Copy path", icon: "\u{1F4CB}", action: () => handleCopyPath(contextMenu.file) },
    { label: "Delete", icon: "\u{1F5D1}\u{FE0F}", action: () => onDelete(contextMenu.file), danger: true },
  ] : [];

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
      <div className="file-tree">
        <FolderView node={tree} activeNote={activeNote} onSelect={onSelect} onDelete={onDelete} onContextMenu={handleContextMenu} />
      </div>

      {tags.length > 0 && (
        <div className="sidebar-tags">
          <div className="sidebar-tags-title">Tags</div>
          <div className="sidebar-tags-list">
            {tags.map((tag) => (
              <button
                key={tag}
                className={`sidebar-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => onToggleTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <button className="sidebar-footer-btn" onClick={onOpenSettings}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          Settings
        </button>
        <button className="sidebar-footer-btn" onClick={onOpenHelp}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Help
        </button>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
