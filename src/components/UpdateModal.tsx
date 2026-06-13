import React from "react";
import { UpdateInfo } from "../plugins/updater";

interface UpdateModalProps {
  info: UpdateInfo;
  onClose: () => void;
}

export default function UpdateModal({ info, onClose }: UpdateModalProps) {
  const releaseDate = new Date(info.publishedAt).toLocaleDateString();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Update Available</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="update-banner">
            <span className="update-version">v{info.version}</span>
            <span className="update-date">Released {releaseDate}</span>
          </div>

          {info.body && (
            <div className="update-changelog">
              <div className="update-changelog-title">What's new:</div>
              <div className="update-changelog-body">
                {info.body.split("\n").filter(l => l.trim()).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="update-actions">
            {info.exeAsset && (
              <a
                className="btn-secondary update-download-btn"
                href={info.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download {info.exeAsset.name}
              </a>
            )}
            {!info.exeAsset && (
              <a
                className="btn-secondary update-download-btn"
                href={info.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download from GitHub
              </a>
            )}
            <button className="btn-secondary" onClick={onClose}>
              Remind Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
