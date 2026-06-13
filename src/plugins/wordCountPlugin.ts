import { VoidPlugin, VoidAPI } from "./pluginInterface";
import { EditorView, keymap } from "@codemirror/view";

const wordCountPlugin: VoidPlugin = {
  manifest: {
    id: "word-count",
    name: "Word Count",
    version: "1.0.0",
    description: "Shows word/char/line counts and adds utility commands",
    main: "built-in",
  },

  onInit(api: VoidAPI): void {
    api.commands.register({
      id: "word-count:show",
      title: "Show Word Count",
      icon: "\u{1F4DD}",
      category: "Tools",
      action: () => {
        const content = api.note.getContent();
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const lines = content.split("\n").length;
        alert(`Words: ${words}\nCharacters: ${chars}\nLines: ${lines}`);
      },
    });

    api.commands.register({
      id: "word-count:insert-date-header",
      title: "Insert Date Header",
      icon: "\u{1F524}",
      category: "Insert",
      action: () => {
        const today = new Date().toISOString().split("T")[0];
        api.editor.insertText(`# ${today}\n\n`);
      },
    });

    api.commands.register({
      id: "word-count:insert-hr",
      title: "Insert Horizontal Rule",
      icon: "\u{2E3B}",
      category: "Insert",
      action: () => {
        api.editor.insertText("\n---\n\n");
      },
    });

    api.editor.registerExtension(
      keymap.of([
        {
          key: "Ctrl-Shift-w",
          run: () => {
            const content = api.editor.getValue();
            const words = content.trim() ? content.trim().split(/\s+/).length : 0;
            console.log(`[Word Count] Words: ${words}`);
            return true;
          },
        },
      ])
    );

    api.events.on("note-saved", (fileName: string) => {
      console.log(`[Word Count] Note saved: ${fileName}`);
    });
  },

  onAppReady(api: VoidAPI): void {
    console.log("[Word Count] Ready. Vault:", api.vault.getPath());
  },

  onNoteLoad(api: VoidAPI, fileName: string): void {
    console.log("[Word Count] Loaded:", fileName);
  },
};

export default wordCountPlugin;
