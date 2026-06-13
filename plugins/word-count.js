export default {
  manifest: {
    id: "word-count",
    name: "Word Count",
    version: "1.0.0",
    description: "Shows word/char/line counts and adds utility commands",
    author: "Void Notes",
    main: "inline"
  },
  onInit(api) {
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
        alert("Words: " + words + "\nCharacters: " + chars + "\nLines: " + lines);
      }
    });

    api.commands.register({
      id: "word-count:insert-date",
      title: "Insert Date Header",
      icon: "\u{1F524}",
      category: "Insert",
      action: () => {
        const today = new Date().toISOString().split("T")[0];
        api.editor.insertText("# " + today + "\n\n");
      }
    });

    api.commands.register({
      id: "word-count:insert-hr",
      title: "Insert Horizontal Rule",
      icon: "\u{2E3B}",
      category: "Insert",
      action: () => {
        api.editor.insertText("\n---\n\n");
      }
    });

    api.events.on("note-saved", function(fileName) {
      console.log("[Word Count] Saved: " + fileName);
    });
  },
  onAppReady(api) {
    console.log("[Word Count] Ready. Vault: " + api.vault.getPath());
  }
};
