import { useState } from "react";

export function useModalState() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showWikiCreateDialog, setShowWikiCreateDialog] = useState(false);
  const [wikiTarget, setWikiTarget] = useState<string | null>(null);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  return {
    errorMessage,
    setErrorMessage,
    showNewNoteDialog,
    setShowNewNoteDialog,
    showNewFolderDialog,
    setShowNewFolderDialog,
    showWikiCreateDialog,
    setShowWikiCreateDialog,
    wikiTarget,
    setWikiTarget,
    showCloseConfirmDialog,
    setShowCloseConfirmDialog,
    closingTabId,
    setClosingTabId,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    deletingFile,
    setDeletingFile,
    showTrash,
    setShowTrash,
  };
}
