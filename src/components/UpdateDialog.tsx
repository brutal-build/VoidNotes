import React, { useState } from "react";
import { Dialog } from "./ui/Dialog";
import type { UpdateInfo } from "../shared/ipc-contract";

interface UpdateDialogProps {
  updateInfo: UpdateInfo | null;
  downloadProgress: number;
  updateDownloaded: boolean;
  onUpdate: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}

export default function UpdateDialog({
  updateInfo,
  downloadProgress,
  updateDownloaded,
  onUpdate,
  onSkip,
  onDismiss,
}: UpdateDialogProps) {
  const [showNotes, setShowNotes] = useState(false);

  if (!updateInfo) return null;

  const notesPreview = updateInfo.releaseNotes
    ? updateInfo.releaseNotes.slice(0, 2000) + (updateInfo.releaseNotes.length > 2000 ? "..." : "")
    : "No release notes available.";

  let title = `Update Available - v${updateInfo.version}`;

  return (
    <Dialog
      open={true}
      title={title}
      onEscape={onDismiss}
      onBackdrop={onDismiss}
      className="update-dialog"
    >
      <div className="update-body">
        {updateDownloaded ? (
          <p className="dialog-message">
            Update v{updateInfo.version} has been downloaded and is ready to install.
            Click "Restart to Install" to apply the update. The application will restart automatically.
          </p>
        ) : downloadProgress > 0 ? (
          <div className="update-progress-section">
            <p className="dialog-message">Downloading update...</p>
            <div className="update-progress-bar">
              <div
                className="update-progress-fill"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div
              className="update-progress-text"
              aria-live="polite"
              aria-atomic="true"
            >
              {downloadProgress}%
            </div>
          </div>
        ) : (
          <>
            <p className="dialog-message">
              A new version of Void Notes is available. Would you like to update now?
            </p>

            <button
              type="button"
              className="dialog-button-secondary"
              onClick={() => setShowNotes(!showNotes)}
              style={{ marginBottom: "var(--space-md)" }}
            >
              {showNotes ? "Hide Release Notes" : "Show Release Notes"}
            </button>

            {showNotes && (
              <div className="update-notes">
                <pre className="update-notes-content">{notesPreview}</pre>
              </div>
            )}
          </>
        )}
      </div>

      <div className="dialog-actions">
        {updateDownloaded ? (
          <>
            <button
              type="button"
              onClick={onDismiss}
              className="dialog-button-secondary"
            >
              Later
            </button>
            <button
              type="button"
              onClick={onUpdate}
              className="dialog-button-primary"
            >
              Restart to Install
            </button>
          </>
        ) : downloadProgress > 0 ? (
          <button
            type="button"
            onClick={onDismiss}
            className="dialog-button-secondary"
          >
            Downloading...
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onSkip}
              className="dialog-button-secondary"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={onUpdate}
              className="dialog-button-primary"
            >
              Update
            </button>
          </>
        )}
      </div>
    </Dialog>
  );
}
