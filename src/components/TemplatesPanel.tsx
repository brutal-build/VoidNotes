import React, { useCallback } from "react";

interface TemplatesPanelProps {
  onInsertTemplate: (content: string) => void;
  onClose: () => void;
}

const DEFAULT_TEMPLATES = [
  { name: "Daily Note", content: `# {{date}}\n\n## Tasks\n- [ ] \n\n## Notes\n\n## Links\n` },
  { name: "Meeting Notes", content: `# Meeting: {{title}}\n\n**Date:** {{date}}\n**Attendees:** \n\n## Agenda\n\n## Discussion\n\n## Action Items\n- [ ] \n` },
  { name: "Project", content: `# Project: {{title}}\n\n## Overview\n\n## Goals\n\n## Tasks\n- [ ] \n\n## Resources\n` },
  { name: "Book Notes", content: `# {{title}}\n\n**Author:** \n**Rating:** /5\n**Date Read:** {{date}}\n\n## Summary\n\n## Key Takeaways\n` },
  { name: "Journal", content: `# {{date}}\n\n## How I'm Feeling\n\n## What Happened Today\n\n## Gratitude\n` },
];

function replaceVars(template: string): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  return template.replace(/\{\{date\}\}/g, date).replace(/\{\{title\}\}/g, "Untitled");
}

export default function TemplatesPanel({ onInsertTemplate, onClose }: TemplatesPanelProps) {
  const handleInsert = useCallback((content: string) => {
    onInsertTemplate(replaceVars(content));
    onClose();
  }, [onInsertTemplate, onClose]);

  return (
    <div className="templates-panel">
      <div className="templates-header">
        <h3 className="templates-title">Templates</h3>
        <button className="btn-icon" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="templates-list">
        {DEFAULT_TEMPLATES.map((template) => (
          <button key={template.name} className="template-item" onClick={() => handleInsert(template.content)}>
            <span className="template-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            <span className="template-name">{template.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
