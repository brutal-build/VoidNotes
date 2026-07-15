import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { extractCodeFences, restoreCodeFences } from "../plugins/code-fence";
import { processCallouts } from "../plugins/callouts";
import { processEscapes } from "../plugins/escape";
import { processHighlights } from "../plugins/highlight";
import { processUnderline, processSpoilers } from "../plugins/discord-formats";
import { processWikiLinks } from "../plugins/wiki-links";

const MermaidDiagram = React.lazy(() => import("./MermaidDiagram"));

interface NoteParserProps {
  content: string;
  noteNames?: string[];
  onWikiLinkClick?: (target: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

// Cache for resolved image data URIs to avoid repeated IPC calls
const imageCache = new Map<string, string>();

function extractImagePaths(markdown: string): string[] {
  const paths: string[] = [];
  const regex = /!\[.*?\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const src = match[1];
    if (src && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:")) {
      paths.push(src);
    }
  }
  return [...new Set(paths)];
}

export default function NoteParser({ content, noteNames, onWikiLinkClick, style, className }: NoteParserProps) {
  const [resolvedContent, setResolvedContent] = useState<string | null>(null);
  const pendingRef = useRef(false);

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

  // Resolve image paths to base64 data URIs
  useEffect(() => {
    let cancelled = false;
    const paths = extractImagePaths(processed);
    if (paths.length === 0) {
      setResolvedContent(processed);
      return;
    }

    const resolve = async () => {
      let result = processed;
      for (const imgPath of paths) {
        if (cancelled) return;
        if (imageCache.has(imgPath)) {
          result = result.replace(`![](${imgPath})`, `![](${imageCache.get(imgPath)})`);
          continue;
        }
        try {
          const fileResult = await window.electronAPI.readFile(imgPath);
          if (!cancelled && fileResult.ok) {
            const bytes = new Uint8Array(fileResult.value);
            const ext = imgPath.split(".").pop() ?? "png";
            let binary = "";
            const CHUNK = 8192;
            for (let i = 0; i < bytes.length; i += CHUNK) {
              binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
            }
            const dataUri = `data:image/${ext};base64,${btoa(binary)}`;
            imageCache.set(imgPath, dataUri);
            result = result.replace(`![](${imgPath})`, `![](${dataUri})`);
          } else if (!cancelled && !fileResult.ok) {
            console.warn(`[NoteParser] Failed to load image "${imgPath}": ${fileResult.error}`);
          }
        } catch (e) {
          console.warn(`[NoteParser] Error loading image "${imgPath}":`, e);
        }
      }
      if (!cancelled) setResolvedContent(result);
    };
    pendingRef.current = true;
    resolve();
    return () => { cancelled = true; };
  }, [processed]);

  const displayContent = resolvedContent ?? processed;

  const processedWithStatus = useMemo(() => {
    if (!noteNames || noteNames.length === 0) return displayContent;
    return displayContent.replace(
      /<a class="wiki-link" data-target="([^"]+)"[^>]*>([^<]*)<\/a>/g,
      (_match: string, target: string, display: string) => {
        const normalized = target.endsWith(".md") ? target : `${target}.md`;
        const exists = noteNames.includes(normalized);
        const className = exists ? "wiki-link" : "wiki-link-missing";
        return `<a class="${className}" data-target="${target}">${display}</a>`;
      }
    );
  }, [displayContent, noteNames]);

  return (
    <div className={`pane-preview visible ${className || ""}`} style={style}>
      <div className="preview-wrapper">
        <div
          className="md-content"
          onClick={(e) => {
            const target = (e.target as HTMLElement).closest(".wiki-link, .wiki-link-missing");
            if (target && onWikiLinkClick) {
              onWikiLinkClick(target.getAttribute("data-target") || "");
            }

            const spoiler = (e.target as HTMLElement).closest("[data-spoiler]");
            if (spoiler) {
              spoiler.classList.toggle("revealed");
            }
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const lang = match ? match[1] : "";
                const codeStr = String(children).replace(/\n$/, "");

                if (lang === "mermaid") {
                  return (
                    <Suspense fallback={<div className="mermaid-loading">Loading diagram...</div>}>
                      <MermaidDiagram code={codeStr} />
                    </Suspense>
                  );
                }

                if (match) {
                  return (
                    <pre className={`language-${lang}`}>
                      <code className={className} {...props}>{codeStr}</code>
                    </pre>
                  );
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {processedWithStatus}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
