import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractCodeFences, restoreCodeFences } from "../plugins/code-fence";
import { processCallouts } from "../plugins/callouts";
import { processEscapes } from "../plugins/escape";
import { processHighlights } from "../plugins/highlight";
import { processUnderline, processSpoilers } from "../plugins/discord-formats";
import { processWikiLinks } from "../plugins/wiki-links";

interface NoteParserProps {
  content: string;
  onWikiLinkClick?: (target: string) => void;
}

export default function NoteParser({ content, onWikiLinkClick }: NoteParserProps) {
  const processed = useMemo(() => {
    const { protected: safe, fences } = extractCodeFences(content);

    let text = safe;
    text = processCallouts(text);
    text = processEscapes(text);
    text = processHighlights(text);
    text = processUnderline(text);
    text = processSpoilers(text);
    text = processWikiLinks(text);

    text = restoreCodeFences(text, fences);
    return text;
  }, [content]);

  return (
    <div className="pane-preview visible">
      <div
        className="md-content"
        onClick={(e) => {
          const target = (e.target as HTMLElement).closest(".wiki-link");
          if (target && onWikiLinkClick) {
            onWikiLinkClick(target.getAttribute("data-target") || "");
          }
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {processed}
        </ReactMarkdown>
      </div>
    </div>
  );
}
