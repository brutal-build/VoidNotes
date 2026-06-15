import React, { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { vim } from "@replit/codemirror-vim";

interface NoteEditorProps {
  content: string;
  onChange: (value: string) => void;
  noteNames: string[];
  vimMode?: boolean;
}

function wikiLinkCompletion(noteNames: string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\[\[[^\]]*/);
    if (!word) return null;

    const query = word.text.slice(2).toLowerCase();
    const options = noteNames
      .filter((name) => name.toLowerCase().includes(query))
      .map((name) => ({
        label: name.replace(/\.md$/, ""),
        type: "text",
      }));

    return {
      from: word.from + 2,
      options,
    };
  };
}

const brutalTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
  },
  ".cm-content": {
    caretColor: "var(--accent)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--font-size-md)",
    lineHeight: "var(--line-height)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--accent)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--accent-muted)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-faint)",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--bg-hover)",
    color: "var(--text-muted)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--bg-hover)",
  },
  ".cm-matchingBracket": {
    backgroundColor: "var(--bg-active)",
    outline: "1px solid var(--border)",
  },
  ".cm-foldGutter": {
    color: "var(--text-faint)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: "var(--accent-muted)",
      color: "var(--text-primary)",
    },
  },
  ".cm-panels": {
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
  },
  ".cm-searchMatch": {
    backgroundColor: "var(--accent-muted)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--accent-muted)",
  },
}, { dark: false });

export default function NoteEditor({ content, onChange, noteNames, vimMode }: NoteEditorProps) {
  const wikiCompletion = useMemo(
    () => autocompletion({
      override: [wikiLinkCompletion(noteNames)],
      activateOnTyping: true,
    }),
    [noteNames]
  );

  const extensions = useMemo(() => {
    const exts = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      indentOnInput(),
      highlightSelectionMatches(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      brutalTheme,
      EditorView.lineWrapping,
      wikiCompletion,
    ];
    if (vimMode) {
      exts.unshift(vim());
    }
    return exts;
  }, [wikiCompletion, vimMode]);

  const handleChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  return (
    <CodeMirror
      value={content}
      onChange={handleChange}
      extensions={extensions}
      theme="dark"
      height="100%"
      style={{ height: "100%" }}
    />
  );
}
