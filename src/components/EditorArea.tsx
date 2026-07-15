import React, { Suspense } from "react";
import TabBar from "./TabBar";
import NoteParser from "./NoteParser";
import TrafficLights from "./TrafficLights";
import StatusBar from "./StatusBar";
import RightPanel from "./RightPanel";
import type { PanelTab } from "../types";

const NoteEditor = React.lazy(() => import("./NoteEditor"));

interface EditorAreaProps {
  focusMode: boolean;
  openTabs: { id: string }[];
  activeTabId: string | null;
  activeNote: string | null;
  rawContent: string;
  previewMode: boolean;
  saved: boolean;
  notes: string[];
  vimMode: boolean;
  readableLineLength: boolean;
  editorFont: string;
  spellcheck: boolean;
  showRightPanel: boolean;
  activePanelTab: PanelTab;
  splitView: { splitView: boolean; splitDown: boolean; splitRatio: number; handleSplitMouseDown: (e: React.MouseEvent) => void; toggleSplitView: () => void; setSplitDown: (fn: (v: boolean) => boolean) => void; setSplitView: (v: boolean) => void };
  noteBacklinks: string[];
  sortedTags: string[];
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabReorder: (from: number, to: number) => void;
  onContentChange: (content: string) => void;
  onPreviewToggle: () => void;
  onRightPanelToggle: () => void;
  onFocusModeExit: () => void;
  onActivePanelTabChange: (tab: PanelTab) => void;
  onNavigate: (note: string) => void;
  onImagePaste: (file: File) => Promise<string | null>;
}

export default function EditorArea(props: EditorAreaProps) {
  const noteName = props.activeNote?.split("/").pop()?.replace(/\.md$/, "") || "";

  return (
    <div className="editor-area">
      {!props.focusMode && props.openTabs.length > 0 && (
        <TabBar
          tabs={props.openTabs as any}
          activeTab={props.activeTabId}
          onSelect={props.onTabSelect}
          onClose={props.onTabClose}
          onReorder={props.onTabReorder}
        />
      )}
      <div className="top-bar">
        <div className="top-bar-left">
          {props.focusMode && (
            <button className="btn-icon focus-restore-btn-inline" onClick={props.onFocusModeExit} title="Show sidebar (F9)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}
          <div className="breadcrumb">{props.activeNote ? <span className="breadcrumb-current">{noteName}</span> : <span>No note open</span>}</div>
          {props.focusMode && <span className="focus-mode-hint">Exit Focus Mode (Esc)</span>}
        </div>
        <div className="top-bar-actions">
          <button className={`btn-mode ${!props.splitView.splitView ? "active" : ""}`} onClick={() => { props.onPreviewToggle(); props.splitView.setSplitView(false); props.splitView.setSplitDown(() => false); }}>{props.previewMode ? "Edit" : "Preview"}</button>
          <button className={`btn-mode ${props.showRightPanel ? "active" : ""}`} onClick={props.onRightPanelToggle} title="Toggle right panel">Panel</button>
          <div className="top-bar-separator" />
          <TrafficLights />
        </div>
      </div>
      <div className="main-content">
        <div className={`pane-container ${props.splitView.splitView ? "split-view" : ""} ${props.splitView.splitDown ? "split-down" : ""}`}>
          {props.splitView.splitView && props.activeNote ? (
            <>
              <div className="pane-editor pane-enter" style={{ "--pane-ratio": props.splitView.splitRatio } as React.CSSProperties}>
                <div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={props.rawContent} onChange={props.onContentChange} noteNames={props.notes} vimMode={props.vimMode} readableLineLength={props.readableLineLength} editorFont={props.editorFont} spellcheck={props.spellcheck} onImagePaste={props.onImagePaste} /></Suspense></div>
              </div>
              <div className="split-divider split-divider-h" onMouseDown={props.splitView.handleSplitMouseDown} />
              <NoteParser content={props.rawContent} noteNames={props.notes} className="pane-preview" style={{ "--pane-ratio": 1 - props.splitView.splitRatio } as React.CSSProperties} onWikiLinkClick={props.onNavigate} />
            </>
          ) : props.splitView.splitDown && props.activeNote ? (
            <>
              <div className="pane-editor pane-enter" style={{ "--pane-ratio": props.splitView.splitRatio } as React.CSSProperties}>
                <div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={props.rawContent} onChange={props.onContentChange} noteNames={props.notes} vimMode={props.vimMode} readableLineLength={props.readableLineLength} editorFont={props.editorFont} spellcheck={props.spellcheck} onImagePaste={props.onImagePaste} /></Suspense></div>
              </div>
              <div className="split-divider split-divider-v" onMouseDown={props.splitView.handleSplitMouseDown} />
              <NoteParser content={props.rawContent} noteNames={props.notes} className="pane-preview" style={{ "--pane-ratio": 1 - props.splitView.splitRatio } as React.CSSProperties} onWikiLinkClick={props.onNavigate} />
            </>
          ) : (
            <>
              {!props.previewMode && props.activeNote && <div className="pane-editor pane-enter"><div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={props.rawContent} onChange={props.onContentChange} noteNames={props.notes} vimMode={props.vimMode} readableLineLength={props.readableLineLength} editorFont={props.editorFont} spellcheck={props.spellcheck} onImagePaste={props.onImagePaste} /></Suspense></div></div>}
              {props.previewMode && props.activeNote && <NoteParser content={props.rawContent} noteNames={props.notes} onWikiLinkClick={props.onNavigate} />}
            </>
          )}
        </div>
        {props.showRightPanel && props.activeNote && (
          <RightPanel
            activeNote={props.activeNote}
            content={props.rawContent}
            backlinks={props.noteBacklinks}
            tags={props.sortedTags}
            onNavigate={props.onNavigate}
            activePanelTab={props.activePanelTab}
            onPanelTabChange={props.onActivePanelTabChange}
            onContentSave={props.onContentChange}
            splitView={props.splitView.splitView}
            splitDown={props.splitView.splitDown}
            onToggleSplit={props.splitView.toggleSplitView}
            onToggleSplitDown={() => { props.splitView.setSplitDown(v => !v); props.splitView.setSplitView(false); }}
          />
        )}
      </div>
      {!props.focusMode && <StatusBar content={props.rawContent} noteCount={props.notes.length} activeNote={props.activeNote} saved={props.saved} />}
    </div>
  );
}
