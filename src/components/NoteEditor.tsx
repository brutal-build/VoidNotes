import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentMore, indentLess, undo, redo } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { autocompletion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { vim } from "@replit/codemirror-vim";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

interface NoteEditorProps {
  content: string;
  onChange: (value: string) => void;
  noteNames: string[];
  vimMode?: boolean;
  readableLineLength?: boolean;
  editorFont?: string;
  spellcheck?: boolean;
  onImagePaste?: (file: File) => Promise<string | null>;
}

function wrapSelection(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const insertText = `${before}${selected}${after}`;
  view.dispatch({
    changes: { from, to, insert: insertText },
    selection: { anchor: from + before.length, head: from + before.length + selected.length },
  });
}

function prefixLine(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  view.dispatch({
    changes: { from: line.from, insert: prefix },
  });
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

// Custom Tab: insert tab at cursor (no selection) or indent lines (selection)
const tabBinding = {
  key: "Tab",
  run: (view: EditorView) => {
    if (view.state.readOnly) return false;
    const { from, to } = view.state.selection.main;
    if (from === to) {
      view.dispatch({
        changes: { from, insert: "\t" },
        selection: { anchor: from + 1 },
      });
    } else {
      indentMore(view);
    }
    return true;
  },
  shift: indentLess,
};

// Filter out the default Tab binding since we provide our own
const filteredDefaultKeymap = defaultKeymap.filter((k) => k.key !== "Tab");

export default function NoteEditor({ content, onChange, noteNames, vimMode, readableLineLength, editorFont, spellcheck = true, onImagePaste }: NoteEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const onImagePasteRef = useRef(onImagePaste);
  onImagePasteRef.current = onImagePaste;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const getView = useCallback(() => editorRef.current?.view, []);

  const editorContextMenuItems: ContextMenuItem[] = contextMenu ? [
    { label: "Undo", icon: "undo", action: () => { const view = getView(); if (view) undo(view); }, shortcut: "Ctrl+Z" },
    { label: "Redo", icon: "redo", action: () => { const view = getView(); if (view) redo(view); }, shortcut: "Ctrl+Y" },
    { label: "Cut", icon: "cut", action: () => { document.execCommand("cut"); } },
    { label: "Copy", icon: "copy", action: () => { document.execCommand("copy"); } },
    { label: "Paste", icon: "paste", action: () => { document.execCommand("paste"); } },
    { label: "Select All", icon: "select-all", action: () => { document.execCommand("selectAll"); } },
    { label: "Bold", icon: "bold", action: () => { const view = getView(); if (view) wrapSelection(view, "**", "**"); } },
    { label: "Italic", icon: "italic", action: () => { const view = getView(); if (view) wrapSelection(view, "*", "*"); } },
    { label: "Heading 1", action: () => { const view = getView(); if (view) prefixLine(view, "# "); } },
    { label: "Heading 2", action: () => { const view = getView(); if (view) prefixLine(view, "## "); } },
    { label: "Heading 3", action: () => { const view = getView(); if (view) prefixLine(view, "### "); } },
  ] : [];

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!onImagePaste) return;
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        const resultPath = await onImagePaste(file);
        if (resultPath) {
          const view = editorRef.current?.view;
          if (view) {
            const insertText = `![](${resultPath})`;
            view.dispatch({
              changes: { from: view.state.selection.main.head, insert: insertText },
            });
          }
        }
        break;
      }
    }
  }, [onImagePaste]);

  const wikiCompletion = useMemo(
    () => autocompletion({
      override: [wikiLinkCompletion(noteNames)],
      activateOnTyping: true,
    }),
    [noteNames]
  );

  const dynamicTheme = useMemo(() => {
    const styles: Record<string, any> = {
      "&": {
        backgroundColor: "transparent",
        color: "var(--text-primary)",
      },
      ".cm-content": {
        caretColor: "var(--accent)",
        fontFamily: editorFont || "var(--font-mono)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--line-height)",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--accent)",
      },
      "&.cm-focused .cm-selectionBackground, .cm-content ::selection, .cm-selectionBackground": {
        backgroundColor: "var(--selection-bg)",
      },
      ".cm-selectionMatch": {
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
        backgroundColor: "var(--accent-muted)",
      },
      ".cm-matchingBracket": {
        backgroundColor: "var(--bg-active)",
        outline: "1px solid var(--border)",
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
    };

    if (readableLineLength) {
      styles[".cm-content"] = {
        ...styles[".cm-content"],
        maxWidth: "80ch",
      };
    }

    return EditorView.theme(styles, { dark: false });
  }, [readableLineLength, editorFont]);

  const extensions = useMemo(() => {
    const imagePasteHandler = EditorView.domEventHandlers({
      paste(event, view) {
        const handler = onImagePasteRef.current;
        if (!handler) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            handler(file).then((resultPath) => {
              if (resultPath) {
                view.dispatch({
                  changes: { from: view.state.selection.main.head, insert: `![](${resultPath})` },
                });
              }
            });
            return true;
          }
        }
        return false;
      },
    });

    const exts = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      indentOnInput(),
      highlightSelectionMatches(),
      imagePasteHandler,
      keymap.of([tabBinding, ...filteredDefaultKeymap, ...historyKeymap, ...searchKeymap]),
      dynamicTheme,
      EditorView.lineWrapping,
      wikiCompletion,
    ];
    if (vimMode) {
      exts.unshift(vim());
    }
    return exts;
  }, [wikiCompletion, vimMode, dynamicTheme]);

  const handleChange = useCallback((value: string) => {
    onChange(value);
  }, [onChange]);

  return (
    <div className="editor-drop-zone" onDrop={handleDrop} onContextMenu={handleContextMenu}>
      <CodeMirror
        ref={editorRef}
        value={content}
        onChange={handleChange}
        extensions={extensions}
        height="100%"
        style={{ height: "100%" }}
        spellCheck={spellcheck}
      />
      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={editorContextMenuItems}
          onClose={() => setContextMenu(null)}
        />,
        document.body
      )}
    </div>
  );
}
