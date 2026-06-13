export default {
  manifest: {
    id: "text-snippets",
    name: "Text Snippets",
    version: "1.0.0",
    description: "Quick insert common markdown patterns (tables, callouts, code blocks)",
    author: "Void Notes",
    main: "inline"
  },
  onInit(api) {
    var snippets = [
      { id: "hr", title: "Horizontal Rule", icon: "\u{2500}", text: "\n---\n\n" },
      { id: "code-js", title: "JS Code Block", icon: "\u{1F4BB}", text: "\n```javascript\n\n```\n" },
      { id: "code-py", title: "Python Code Block", icon: "\u{1F40D}", text: "\n```python\n\n```\n" },
      { id: "code-css", title: "CSS Code Block", icon: "\u{1F3A8}", text: "\n```css\n\n```\n" },
      { id: "callout-info", title: "Info Callout", icon: "\u{2139}\u{FE0F}", text: "\n> [!INFO] Title\n> Content here\n\n" },
      { id: "callout-warning", title: "Warning Callout", icon: "\u{26A0}\u{FE0F}", text: "\n> [!WARNING] Warning\n> Be careful!\n\n" },
      { id: "callout-tip", title: "Tip Callout", icon: "\u{1F4A1}", text: "\n> [!TIP] Pro Tip\n> Try this trick.\n\n" },
      { id: "callout-error", title: "Error Callout", icon: "\u{274C}", text: "\n> [!ERROR] Danger Zone\n> This cannot be undone.\n\n" },
      { id: "table", title: "Table Template", icon: "\u{1F4CA}", text: "\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n\n" },
      { id: "task", title: "Task List", icon: "\u{2611}\u{FE0F}", text: "\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n" },
      { id: "blockquote", title: "Blockquote", icon: "\u{1F4AC}", text: "\n> Quote here\n> — Author\n\n" }
    ];

    snippets.forEach(function(s) {
      api.commands.register({
        id: "text-snippets:" + s.id,
        title: "Insert " + s.title,
        icon: s.icon,
        category: "Snippets",
        action: (function(text) {
          return function() { api.editor.insertText(text); };
        })(s.text)
      });
    });
  }
};
