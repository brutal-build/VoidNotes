import React, { useState } from "react";

export type AppMode = "minimalistic";

interface ModeSelectionProps {
  onSelect: (mode: AppMode) => void;
}

const MODES: { id: AppMode; label: string; desc: string[]; icon: string }[] = [
  {
    id: "minimalistic",
    label: "Minimalistic",
    icon: "\u{2728}",
    desc: [
      "Markdown editor with syntax highlighting",
      "Live preview and split view",
      "Wiki links with autocomplete",
      "Tags, callouts, frontmatter",
      "Themes and Vim keybindings",
      "Auto-save, focus mode, keyboard shortcuts",
    ],
  },
];

export default function ModeSelection({ onSelect }: ModeSelectionProps) {
  const [selected, setSelected] = useState<AppMode>("minimalistic");

  return (
    <div className="mode-selection">
      <div className="mode-selection-inner">
        <div className="mode-selection-header">
          <h1 className="mode-selection-title">Void Notes</h1>
          <p className="mode-selection-subtitle">Choose your experience</p>
        </div>

        <div className="mode-cards">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className={`mode-card ${selected === mode.id ? "active" : ""}`}
              onClick={() => setSelected(mode.id)}
            >
              <div className="mode-card-icon">{mode.icon}</div>
              <h2 className="mode-card-label">{mode.label}</h2>
              <ul className="mode-card-list">
                {mode.desc.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button className="vault-setup-btn mode-confirm-btn" onClick={() => onSelect(selected)}>
          Continue with {MODES.find((m) => m.id === selected)?.label}
        </button>
      </div>
    </div>
  );
}
