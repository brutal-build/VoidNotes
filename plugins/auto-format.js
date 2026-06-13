export default {
  manifest: {
    id: "auto-format",
    name: "Auto Format",
    version: "1.0.0",
    description: "Trims trailing whitespace and fixes spacing on save",
    author: "Void Notes",
    main: "inline"
  },
  onInit(api) {
    api.commands.register({
      id: "auto-format:trim",
      title: "Trim Trailing Whitespace",
      icon: "\u{2702}\u{FE0F}",
      category: "Format",
      action: function() {
        var content = api.editor.getValue();
        var formatted = content.split("\n").map(function(line) {
          return line.trimEnd();
        }).join("\n");
        if (formatted !== content) {
          api.editor.setValue(formatted);
        }
      }
    });

    api.commands.register({
      id: "auto-format:normalize-blank-lines",
      title: "Normalize Blank Lines",
      icon: "\u{1F4C4}",
      category: "Format",
      action: function() {
        var content = api.editor.getValue();
        var formatted = content.replace(/\n{3,}/g, "\n\n");
        if (formatted !== content) {
          api.editor.setValue(formatted);
        }
      }
    });
  },
  onNoteSave: function(api, fileName, content) {
    var lines = content.split("\n");
    var formatted = lines.map(function(line) {
      return line.trimEnd();
    }).join("\n");
    return formatted;
  }
};
