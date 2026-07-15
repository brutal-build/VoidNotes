import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";

interface MermaidDiagramProps {
  code: string;
}

type MermaidType = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

let mermaidInitialized = false;
let mermaidModule: MermaidType | null = null;

async function ensureMermaid(): Promise<MermaidType> {
  if (mermaidModule) return mermaidModule;
  const mod = await import("mermaid");
  mermaidModule = (mod as unknown as { default: MermaidType }).default;
  return mermaidModule;
}

function isDarkTheme(themeName: string): boolean {
  return themeName !== "light";
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = await ensureMermaid();
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: isDarkTheme(theme) ? "dark" : "default",
            securityLevel: "sandbox",
          });
          mermaidInitialized = true;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Mermaid render error");
          setSvg(null);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code, theme]);

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-title">Diagram Error</div>
        <pre className="mermaid-error-msg">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
