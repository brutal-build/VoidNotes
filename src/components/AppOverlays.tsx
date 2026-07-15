import React from "react";
import { InputDialog } from "./ui/InputDialog";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import Toast from "./Toast";

interface AppOverlaysProps {
  /** Rename */
  showRename: boolean;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  /** New note */
  showNewNote: boolean;
  onCreateNote: (name: string) => void;
  onCancelNewNote: () => void;
  /** New folder */
  showNewFolder: boolean;
  onCreateFolder: (name: string) => void;
  onCancelNewFolder: () => void;
  /** Wiki create */
  showWikiCreate: boolean;
  wikiTarget: string | null;
  onWikiConfirm: (name: string) => void;
  onWikiCancel: () => void;
  /** Close confirm */
  showCloseConfirm: boolean;
  closingTabId: string | null;
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onCancelClose: () => void;
  /** Delete confirm */
  showDeleteConfirm: boolean;
  deletingFile: string | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  /** Toast */
  toasts: { id: number; type: "success" | "error" | "warning" | "info"; message: string }[];
  onDismissToast: (id: number) => void;
}

export default function AppOverlays(props: AppOverlaysProps) {
  const wikiName = props.wikiTarget?.split("/").pop()?.replace(/\.md$/, "") || "";
  const closingName = props.closingTabId?.split("/").pop()?.replace(/\.md$/, "") || "";
  const deletingName = props.deletingFile?.split("/").pop()?.replace(/\.md$/, "") || "";

  return (
    <>
      <InputDialog
        open={props.showNewNote}
        title="New Note"
        message="Enter note name:"
        placeholder="note-name"
        confirmLabel="Create"
        onConfirm={(name) => { props.onCreateNote(name); }}
        onCancel={props.onCancelNewNote}
      />
      <InputDialog
        open={props.showNewFolder}
        title="New Folder"
        message="Enter folder name:"
        placeholder="folder-name"
        confirmLabel="Create"
        onConfirm={props.onCreateFolder}
        onCancel={props.onCancelNewFolder}
      />
      <InputDialog
        open={props.showWikiCreate}
        title="Create Note"
        message={`Note "${wikiName}" does not exist. Create it?`}
        placeholder="Enter note name"
        defaultValue={props.wikiTarget?.replace(/\.md$/, "") || ""}
        confirmLabel="Create"
        onConfirm={props.onWikiConfirm}
        onCancel={props.onWikiCancel}
      />
      <ConfirmDialog
        open={props.showCloseConfirm}
        title="Unsaved Changes"
        message={`"${closingName}" has unsaved changes.`}
        variant="save-discard"
        onConfirm={props.onSaveAndClose}
        onDiscard={props.onDiscardAndClose}
        onCancel={props.onCancelClose}
      />
      <ConfirmDialog
        open={props.showDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${deletingName}"? The file will be moved to trash.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={props.onConfirmDelete}
        onCancel={props.onCancelDelete}
      />
      <div className="toast-container">
        {props.toasts.map((t) => (
          <Toast key={t.id} id={t.id} type={t.type} message={t.message} onDismiss={props.onDismissToast} />
        ))}
      </div>
    </>
  );
}
