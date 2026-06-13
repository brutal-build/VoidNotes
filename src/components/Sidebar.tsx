import React, { useState, useMemo } from "react";

interface SidebarProps {
  notes: string[];
  activeNote: string | null;
  onSelect: (fileName: string) => void;
  onNew: () => void;
  onDelete: (fileName: string) => void;
  onOpenSearch: () => void;
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
        const folderName = parts[i];
        if (!current.subfolders.has(folderName)) {
          current.subfolders.set(folderName, { name: folderName, files: [], subfolders: new Map() });
        }
        current = current.subfolders.get(folderName)!;
      }
      current.files.push(file);
    }
  }

  return root;
}

function FolderView({ node, activeNote, onSelect, onDelete, depth = 0 }: {
  node: FolderNode;
  activeNote: string | null;
  onSelect: (f: string) => void;
  onDelete: (f: string) => void;
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
              &#9654;
            </span>
            <span className="tree-folder-name">{name}</span>
          </div>
          {openFolders.has(name) && (
            <div className="tree-children">
              <FolderView
                node={folder}
                activeNote={activeNote}
                onSelect={onSelect}
                onDelete={onDelete}
                depth={depth + 1}
              />
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
        >
          <span className="tree-file-icon">&#128196;</span>
          <span className="tree-file-name">
            {file.split("/").pop()?.replace(/\.md$/, "") || file}
          </span>
          <span className="tree-file-actions">
            <button
              className="btn-icon"
              title="Delete"
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

export default function Sidebar({ notes, activeNote, onSelect, onNew, onDelete, onOpenSearch }: SidebarProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Vault</span>
        <div className="sidebar-actions">
          <button className="btn-icon" title="Search (Ctrl+P)" onClick={onOpenSearch}>
            &#128269;
          </button>
          <button className="btn-icon" title="New Note (Ctrl+N)" onClick={onNew}>
            &#43;
          </button>
        </div>
      </div>
      <div className="file-tree">
        <FolderView
          node={tree}
          activeNote={activeNote}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
