import React, { Suspense } from "react";
import ErrorBoundary from "./ErrorBoundary";
import type { ThemeName } from "../types";

const Settings = React.lazy(() => import("./Settings"));

function LazyFallback() {
  return <div className="lazy-loading">Loading...</div>;
}

interface SettingsWrapperProps {
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
  vaultPath: string | null;
  vimMode: boolean;
  onVimModeChange: (v: boolean) => void;
  readableLineLength: boolean;
  onReadableLineLengthChange: (v: boolean) => void;
  editorFont: string;
  onEditorFontChange: (v: string) => void;
  spellcheck: boolean;
  onSpellcheckChange: (v: boolean) => void;
  autoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
  dailyNoteTemplate: string;
  onDailyNoteTemplateChange: (v: string) => void;
  activeNote: string | null;
  onExportNote: () => Promise<void>;
  onExportVaultZip: () => Promise<void>;
  onExportNoteHtml: () => Promise<void>;
  onOpenVaultStats: () => void;
  onSwitchVault: () => void;
  onClose: () => void;
}

export default function SettingsWrapper(props: SettingsWrapperProps) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <ErrorBoundary name="Settings">
        <Settings
          onClose={props.onClose}
          onSwitchVault={props.onSwitchVault}
          theme={props.theme}
          onThemeChange={props.onThemeChange}
          vaultPath={props.vaultPath}
          vimMode={props.vimMode}
          onVimModeChange={props.onVimModeChange}
          readableLineLength={props.readableLineLength}
          onReadableLineLengthChange={props.onReadableLineLengthChange}
          editorFont={props.editorFont}
          onEditorFontChange={props.onEditorFontChange}
          spellcheck={props.spellcheck}
          onSpellcheckChange={props.onSpellcheckChange}
          autoUpdate={props.autoUpdate}
          onAutoUpdateChange={props.onAutoUpdateChange}
          dailyNoteTemplate={props.dailyNoteTemplate}
          onDailyNoteTemplateChange={props.onDailyNoteTemplateChange}
          activeNote={props.activeNote}
          onExportNote={props.onExportNote}
          onExportVaultZip={props.onExportVaultZip}
          onExportNoteHtml={props.onExportNoteHtml}
          onOpenVaultStats={props.onOpenVaultStats}
        />
      </ErrorBoundary>
    </Suspense>
  );
}
