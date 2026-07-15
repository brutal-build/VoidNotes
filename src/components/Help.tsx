import React from "react";

interface HelpProps {
  onClose: () => void;
}

export default function Help({ onClose }: HelpProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Help & Documentation</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="help-content">
            <h3>Getting Started</h3>
            <p>
              Void Notes stores all your notes as plain Markdown files in a local folder called a <strong>Vault</strong>.
              When you first launch the app, you'll be asked to choose a folder. All notes you create will be saved there.
            </p>

            <h3>Markdown Syntax</h3>
            <p>Void Notes supports standard Markdown plus these extensions:</p>
            <table className="help-table">
              <thead>
                <tr><th>Syntax</th><th>Result</th></tr>
              </thead>
              <tbody>
                <tr><td><code>**bold**</code></td><td><strong>bold</strong></td></tr>
                <tr><td><code>*italic*</code></td><td><em>italic</em></td></tr>
                <tr><td><code>__underline__</code></td><td><u>underline</u></td></tr>
                <tr><td><code>==highlight==</code></td><td><span className="md-highlight">highlight</span></td></tr>
                <tr><td><code>||spoiler||</code></td><td><span className="spoiler-hidden revealed">spoiler</span></td></tr>
                <tr><td><code>[[note-name]]</code></td><td><span className="wiki-link">note-name</span></td></tr>
                <tr><td><code>`inline code`</code></td><td><code>inline code</code></td></tr>
              </tbody>
            </table>

            <h3>Callouts</h3>
            <p>Create styled callout blocks:</p>
            <pre className="help-code">{`> [!INFO] Title
> Content here

> [!WARNING] Caution
> Be careful!

> [!TIP] Pro tip
> Try this trick.`}</pre>

            <h3>Frontmatter</h3>
            <p>Add YAML metadata at the top of any note:</p>
            <pre className="help-code">{`---
title: My Note
tags: [project, idea]
date: 2026-01-01
---

Your note content here...`}</pre>

            <h3>Keyboard Shortcuts</h3>
            <table className="help-table">
              <thead>
                <tr><th>Shortcut</th><th>Action</th></tr>
              </thead>
              <tbody>
                <tr><td><kbd>Ctrl+S</kbd></td><td>Save current note</td></tr>
                <tr><td><kbd>Ctrl+E</kbd></td><td>Toggle Edit / Preview</td></tr>
                <tr><td><kbd>Ctrl+P</kbd></td><td>Open Command Palette (search)</td></tr>
                <tr><td><kbd>Ctrl+N</kbd></td><td>Create new note</td></tr>
                <tr><td><kbd>Ctrl+,</kbd></td><td>Open Settings</td></tr>
                <tr><td><kbd>F1</kbd></td><td>Open this help page</td></tr>
              </tbody>
            </table>

            <h3>Wiki Links</h3>
            <p>
              Link between notes using <code>[[note-name]]</code>. When you type <code>[[</code> in the editor,
              an autocomplete menu will appear showing all your notes. Clicking a wiki link in Preview mode
              will navigate to that note.
            </p>

            <h3>Backlinks</h3>
            <p>
              When note A links to note B, a "Backlinks" panel appears on the right side of note B showing
              that note A references it. This helps you discover connections between your notes.
            </p>

            <h3>File Tree</h3>
            <p>
              The sidebar shows all your Markdown files. You can organize them into folders - 
              the tree supports collapsible folders. Use the <strong>+</strong> button or <kbd>Ctrl+N</kbd> to create new notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
