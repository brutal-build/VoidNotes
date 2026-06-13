import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { extractCodeFences, restoreCodeFences } from "../plugins/code-fence";
import { processCallouts } from "../plugins/callouts";
import { processEscapes } from "../plugins/escape";
import { processHighlights } from "../plugins/highlight";
import { processUnderline, processSpoilers } from "../plugins/discord-formats";
import { processWikiLinks } from "../plugins/wiki-links";

interface NoteParserProps {
  content: string;
  noteNames?: string[];
  onWikiLinkClick?: (target: string) => void;
}

export default function NoteParser({ content, noteNames, onWikiLinkClick }: NoteParserProps) {
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

  const processedWithStatus = useMemo(() => {
    if (!noteNames || noteNames.length === 0) return processed;
    return processed.replace(
      /<a class="wiki-link" data-target="([^"]+)"[^>]*>([^<]*)<\/a>/g,
      (_match: string, target: string, display: string) => {
        const normalized = target.endsWith(".md") ? target : `${target}.md`;
        const exists = noteNames.includes(normalized);
        const className = exists ? "wiki-link" : "wiki-link-missing";
        return `<a class="${className}" data-target="${target}">${display}</a>`;
      }
    );
  }, [processed, noteNames]);

  return (
    <div className="pane-preview visible">
      <div className="preview-wrapper">
        <div
          className="md-content"
          onClick={(e) => {
            const target = (e.target as HTMLElement).closest(".wiki-link");
            if (target && onWikiLinkClick) {
              onWikiLinkClick(target.getAttribute("data-target") || "");
            }

            const spoiler = (e.target as HTMLElement).closest("[data-spoiler]");
            if (spoiler) {
              spoiler.classList.toggle("revealed");
            }
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {processedWithStatus}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
