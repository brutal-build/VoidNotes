# Void Notes — Plugin Development Guide

## Table of Contents

- [Overview](#overview)
- [Security Warning](#security-warning)
- [Plugin Structure](#plugin-structure)
- [Manifest](#manifest)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Plugin API (VoidAPI)](#plugin-api-voidapi)
  - [Editor API](#editor-api)
  - [Note API](#note-api)
  - [Vault API](#vault-api)
  - [Commands API](#commands-api)
  - [UI API](#ui-api)
  - [Event Bus](#event-bus)
  - [App API](#app-api)
- [Examples](#examples)
  - [Simple Command](#simple-command)
  - [Auto-format on Save](#auto-format-on-save)
  - [Custom Keymap](#custom-keymap)
  - [Word Counter](#word-counter)
  - [Text Snippets](#text-snippets)
  - [Note Statistics Dashboard](#note-statistics-dashboard)
- [Dynamic Plugin Loading](#dynamic-plugin-loading)
- [Plugin Management](#plugin-management)
- [Plugin Marketplace](#plugin-marketplace)
- [Best Practices](#best-practices)

---

## Overview

Void Notes has a built-in plugin system that allows users to extend the application without modifying the core source code. Plugins can:

- Register commands in the Command Palette (`Ctrl+P`)
- React to lifecycle events (app ready, note open, note save)
- Add CodeMirror 6 extensions (keymaps, decorations, autocompletion)
- Access and modify the editor, notes, and vault
- Communicate with other plugins via an event bus

Plugins are written in **JavaScript** (`.js` files) and placed in the `.plugins/` folder inside your vault.

---

## Security Warning

> **User plugins run as native JavaScript with full access to the application and your filesystem.**

This means a plugin can:
- Read, modify, or delete any file on your system
- Access the network (make HTTP requests, upload data)
- Execute system commands (via Node.js APIs available in Electron)
- Access all notes in your vault
- Modify application settings

**Only install plugins from sources you trust.** Malicious plugins can:
- Steal your notes and personal data
- Install malware or ransomware
- Delete files permanently
- Track your activity

When you first open the Plugins panel, you will be asked to acknowledge these risks. Plugins will not load until you accept.

---

## Plugin Structure

A plugin is a single `.js` file that exports a default object conforming to the `VoidPlugin` interface:

```javascript
export default {
  manifest: {
    id: "my-plugin",        // Unique identifier
    name: "My Plugin",      // Display name
    version: "1.0.0",       // Semver version
    description: "A cool plugin", // Optional description
    author: "Your Name",    // Optional author
    main: "inline"          // Always "inline" for .js files
  },

  // Lifecycle hooks (all optional)
  onInit(api) { /* Called when plugin is loaded */ },
  onAppReady(api) { /* Called when app is fully ready */ },
  onNoteLoad(api, fileName) { /* Called when a note is opened */ },
  onNoteSave(api, fileName, content) { /* Called before saving; return modified content */ },
  onUnload(api) { /* Called when plugin is disabled/unloaded */ }
};
```

---

## Manifest

The `manifest` object is **required** and must contain:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique plugin identifier (e.g., `"word-count"`) |
| `name` | `string` | Yes | Display name shown in Settings |
| `version` | `string` | Yes | Semver version (e.g., `"1.0.0"`) |
| `description` | `string` | No | Short description shown in Plugins panel |
| `author` | `string` | No | Plugin author name |
| `main` | `string` | Yes | Entry point — use `"inline"` for `.js` files |

---

## Lifecycle Hooks

All hooks are optional. They are called in this order:

### `onInit(api)`
Called once when the plugin is loaded. Use this to register commands, set up event listeners, and add editor extensions.

```javascript
onInit(api) {
  api.commands.register({ /* ... */ });
  api.events.on("note-saved", (fileName) => { /* ... */ });
  api.editor.registerExtension(myExtension);
}
```

### `onAppReady(api)`
Called after all plugins are loaded and the first note is opened. Use this for initialization that depends on the app being fully ready.

```javascript
onAppReady(api) {
  console.log("Vault path:", api.vault.getPath());
  console.log("All notes:", api.note.getAllNotes());
}
```

### `onNoteLoad(api, fileName)`
Called every time a note is opened.

```javascript
onNoteLoad(api, fileName) {
  console.log("Opened:", fileName);
}
```

### `onNoteSave(api, fileName, content)`
Called before a note is saved. If you return a string, it replaces the saved content.

```javascript
onNoteSave(api, fileName, content) {
  // Add a "last modified" comment at the top
  const now = new Date().toISOString();
  const header = `<!-- Last modified: ${now} -->\n`;
  if (content.startsWith("<!-- Last modified:")) {
    return content.replace(/<!-- Last modified:.*-->/, `<!-- Last modified: ${now} -->`);
  }
  return header + content;
}
```

### `onUnload(api)`
Called when the plugin is disabled or the app is closing. Use this to clean up resources.

```javascript
onUnload(api) {
  console.log("Plugin unloaded");
}
```

---

## Plugin API (VoidAPI)

All lifecycle hooks receive an `api` object with the following interface:

```typescript
interface VoidAPI {
  editor: EditorAPI;
  note: NoteAPI;
  vault: VaultAPI;
  commands: CommandsAPI;
  ui: UIAPI;
  events: EventBus;
  app: AppAPI;
}
```

---

### Editor API

Control the CodeMirror 6 editor instance.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getView()` | — | `EditorView \| null` | Get the raw CodeMirror EditorView instance |
| `insertText(text)` | `string` | `void` | Insert text at cursor position |
| `getValue()` | — | `string` | Get the full editor content |
| `setValue(value)` | `string` | `void` | Replace the entire editor content |
| `getSelection()` | — | `string` | Get the currently selected text |
| `replaceSelection(text)` | `string` | `void` | Replace the selection with new text |
| `registerExtension(ext)` | `Extension` | `void` | Register a CodeMirror 6 extension |
| `registerKeymap(key, run)` | `string, function` | `void` | Register a keyboard shortcut |

#### Examples

```javascript
// Insert text at cursor
api.editor.insertText("Hello, World!");

// Get selected text and transform it
const selected = api.editor.getSelection();
api.editor.replaceSelection(selected.toUpperCase());

// Register a custom keymap
api.editor.registerKeymap("Ctrl-Shift-u", (view) => {
  const { from, to } = view.state.selection.main;
  const text = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: text.toUpperCase() },
    selection: { anchor: from, head: from + text.length }
  });
  return true;
});

// Register a CodeMirror extension (e.g., custom decoration)
import { EditorView, Decoration } from "@codemirror/view";

api.editor.registerExtension(
  EditorView.decorations.of((view) => {
    const decorations = [];
    for (let i = 1; i <= view.state.doc.lines; i++) {
      const line = view.state.doc.line(i);
      if (line.text.startsWith("#")) {
        decorations.push(
          Decoration.line({ attributes: { style: "font-weight: bold" } }).range(line.from)
        );
      }
    }
    return Decoration.set(decorations);
  })
);
```

---

### Note API

Read and manage notes in the vault.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getActive()` | — | `string \| null` | Get the filename of the active note |
| `getContent()` | — | `string` | Get the content of the active note |
| `setContent(content)` | `string` | `void` | Set the content of the active note |
| `getAllNotes()` | — | `string[]` | Get a list of all note filenames |
| `load(fileName)` | `string` | `Promise<string>` | Load a note's content by filename |
| `save(fileName, content)` | `string, string` | `Promise<boolean>` | Save content to a note |
| `create(name?)` | `string?` | `Promise<string \| null>` | Create a new note, optionally with a name |
| `delete(fileName)` | `string` | `Promise<boolean>` | Delete a note |
| `rename(oldName, newName)` | `string, string` | `Promise<string \| false>` | Rename a note |

#### Examples

```javascript
// Get active note filename
const file = api.note.getActive();
console.log("Current note:", file);

// Read all notes and count total words
const notes = api.note.getAllNotes();
for (const name of notes) {
  const content = await api.note.load(name);
  const words = content.split(/\s+/).length;
  console.log(`${name}: ${words} words`);
}

// Create a new note with content
const fileName = await api.note.create("My Note");
if (fileName) {
  await api.note.save(fileName, "# My Note\n\nHello!");
}

// Modify active note content
const content = api.note.getContent();
api.note.setContent(content + "\n\n---\nAdded by plugin!");
```

---

### Vault API

Access vault information.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getPath()` | — | `string \| null` | Get the absolute path to the vault folder |
| `select()` | — | `Promise<string \| null>` | Open the vault selection dialog |

#### Examples

```javascript
const vaultPath = api.vault.getPath();
console.log("Vault is at:", vaultPath);
```

---

### Commands API

Register commands that appear in the Command Palette (`Ctrl+P`).

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `register(command)` | `CommandEntry` | `void` | Register a new command |
| `unregister(id)` | `string` | `void` | Remove a command by ID |
| `execute(id)` | `string` | `void` | Execute a command by ID |
| `getAll()` | — | `CommandEntry[]` | Get all registered commands |

#### CommandEntry Interface

```typescript
interface CommandEntry {
  id: string;          // Unique command ID (e.g., "my-plugin:hello")
  title: string;       // Display name in Command Palette
  icon?: string;       // Emoji icon (e.g., "👋")
  category?: string;   // Category label (e.g., "Tools", "Insert")
  action: (api: VoidAPI) => void | Promise<void>;  // Function to execute
}
```

#### Examples

```javascript
// Register a simple command
api.commands.register({
  id: "my-plugin:hello",
  title: "Say Hello",
  icon: "👋",
  category: "Tools",
  action: (api) => {
    alert("Hello from my plugin!");
  }
});

// Register a command that modifies the editor
api.commands.register({
  id: "my-plugin:uppercase",
  title: "Uppercase Selection",
  icon: "🔠",
  category: "Transform",
  action: (api) => {
    const selected = api.editor.getSelection();
    if (selected) {
      api.editor.replaceSelection(selected.toUpperCase());
    }
  }
});

// Register an async command
api.commands.register({
  id: "my-plugin:create-daily",
  title: "Create Daily Note",
  icon: "📅",
  category: "Notes",
  action: async (api) => {
    const today = new Date().toISOString().split("T")[0];
    const fileName = await api.note.create(today);
    if (fileName) {
      await api.note.save(fileName, `# ${today}\n\n`);
    }
  }
});
```

---

### UI API

Register UI components (future extensibility).

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `registerSidebarPanel(panel)` | `SidebarPanel` | `void` | Add a panel to the sidebar |
| `unregisterSidebarPanel(id)` | `string` | `void` | Remove a sidebar panel |
| `registerToolbarButton(btn)` | `ToolbarButton` | `void` | Add a button to the toolbar |
| `unregisterToolbarButton(id)` | `string` | `void` | Remove a toolbar button |
| `registerStatusBarItem(item)` | `StatusBarItem` | `void` | Add an item to the status bar |
| `unregisterStatusBarItem(id)` | `string` | `void` | Remove a status bar item |
| `getSidebarPanels()` | — | `SidebarPanel[]` | Get all registered sidebar panels |
| `getToolbarButtons()` | — | `ToolbarButton[]` | Get all registered toolbar buttons |
| `getStatusBarItems()` | — | `StatusBarItem[]` | Get all registered status bar items |

---

### Event Bus

Communicate between plugins or react to application events.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `on(event, handler)` | `string, function` | `void` | Listen for an event |
| `off(event, handler)` | `string, function` | `void` | Remove an event listener |
| `emit(event, ...args)` | `string, ...any` | `void` | Emit an event |
| `once(event, handler)` | `string, function` | `void` | Listen for a single occurrence |

#### Built-in Events

| Event | Arguments | Description |
|-------|-----------|-------------|
| `app-ready` | — | App is fully loaded |
| `note-loaded` | `fileName` | A note was opened |
| `note-saved` | `fileName, content` | A note was saved |

#### Examples

```javascript
// Listen for note saves
api.events.on("note-saved", (fileName, content) => {
  console.log(`Note ${fileName} was saved (${content.length} chars)`);
});

// Emit a custom event
api.events.emit("my-plugin:custom-event", { data: "hello" });

// Listen for custom events from other plugins
api.events.on("my-plugin:custom-event", (payload) => {
  console.log("Received:", payload);
});

// One-time listener
api.events.once("app-ready", () => {
  console.log("App is ready!");
});
```

---

### App API

Access application-level information.

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getTheme()` | — | `string` | Get the current theme name |
| `getVersion()` | — | `string` | Get the Void Notes version |

#### Examples

```javascript
const theme = api.app.getTheme();
console.log("Current theme:", theme);

const version = api.app.getVersion();
console.log("Void Notes version:", version);
```

---

## Examples

### Simple Command

The simplest possible plugin — registers one command.

```javascript
export default {
  manifest: {
    id: "hello",
    name: "Hello Plugin",
    version: "1.0.0",
    description: "A simple hello world plugin",
    main: "inline"
  },
  onInit(api) {
    api.commands.register({
      id: "hello:greet",
      title: "Say Hello",
      icon: "👋",
      action: () => alert("Hello from Void Notes!")
    });
  }
};
```

---

### Auto-format on Save

Automatically trim trailing whitespace on every save.

```javascript
export default {
  manifest: {
    id: "auto-format",
    name: "Auto Format",
    version: "1.0.0",
    description: "Trims trailing whitespace on save",
    main: "inline"
  },
  onInit(api) {
    // Nothing to initialize
  },
  onNoteSave(api, fileName, content) {
    // Remove trailing whitespace from each line
    const formatted = content
      .split("\n")
      .map(line => line.trimEnd())
      .join("\n");
    return formatted;
  }
};
```

---

### Custom Keymap

Add keyboard shortcuts.

```javascript
export default {
  manifest: {
    id: "custom-keys",
    name: "Custom Keymaps",
    version: "1.0.0",
    description: "Adds custom keyboard shortcuts",
    main: "inline"
  },
  onInit(api) {
    // Ctrl+Shift+U → uppercase selection
    api.editor.registerKeymap("Ctrl-Shift-u", (view) => {
      const { from, to } = view.state.selection.main;
      if (from === to) return false;
      const text = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: text.toUpperCase() }
      });
      return true;
    });

    // Ctrl+Shift+L → lowercase selection
    api.editor.registerKeymap("Ctrl-Shift-l", (view) => {
      const { from, to } = view.state.selection.main;
      if (from === to) return false;
      const text = view.state.sliceDoc(from, to);
      view.dispatch({
        changes: { from, to, insert: text.toLowerCase() }
      });
      return true;
    });
  }
};
```

---

### Word Counter

Display word count on save and add a command to show stats.

```javascript
export default {
  manifest: {
    id: "word-counter",
    name: "Word Counter",
    version: "1.0.0",
    description: "Tracks word, character, and line counts",
    main: "inline"
  },
  onInit(api) {
    api.commands.register({
      id: "word-counter:show",
      title: "Show Note Statistics",
      icon: "📊",
      category: "Tools",
      action: () => {
        const content = api.note.getContent();
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const lines = content.split("\n").length;
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;
        alert(
          `Note Statistics\n` +
          `─────────────\n` +
          `Words: ${words}\n` +
          `Characters: ${chars}\n` +
          `Lines: ${lines}\n` +
          `Paragraphs: ${paragraphs}`
        );
      }
    });

    api.commands.register({
      id: "word-counter:all",
      title: "Show Vault Statistics",
      icon: "📈",
      category: "Tools",
      action: async () => {
        const notes = api.note.getAllNotes();
        let totalWords = 0;
        let totalChars = 0;
        for (const name of notes) {
          const content = await api.note.load(name);
          totalWords += content.trim() ? content.trim().split(/\s+/).length : 0;
          totalChars += content.length;
        }
        alert(
          `Vault Statistics\n` +
          `─────────────\n` +
          `Notes: ${notes.length}\n` +
          `Total Words: ${totalWords}\n` +
          `Total Characters: ${totalChars}`
        );
      }
    });
  }
};
```

---

### Text Snippets

Insert predefined text snippets.

```javascript
export default {
  manifest: {
    id: "snippets",
    name: "Text Snippets",
    version: "1.0.0",
    description: "Quick insert common text patterns",
    main: "inline"
  },
  onInit(api) {
    const snippets = [
      { id: "hr", title: "Horizontal Rule", text: "\n---\n\n" },
      { id: "code-js", title: "JS Code Block", text: "\n```javascript\n\n```\n" },
      { id: "code-py", title: "Python Code Block", text: "\n```python\n\n```\n" },
      { id: "callout-info", title: "Info Callout", text: "\n> [!INFO] Title\n> Content here\n\n" },
      { id: "callout-warning", title: "Warning Callout", text: "\n> [!WARNING] Warning\n> Be careful!\n\n" },
      { id: "table", title: "Table Template", text: "\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n\n" },
      { id: "task", title: "Task List", text: "\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n" },
    ];

    for (const snippet of snippets) {
      api.commands.register({
        id: `snippets:insert-${snippet.id}`,
        title: `Insert ${snippet.title}`,
        icon: "📝",
        category: "Snippets",
        action: () => api.editor.insertText(snippet.text)
      });
    }
  }
};
```

---

### Note Statistics Dashboard

Log statistics on every note open and save.

```javascript
export default {
  manifest: {
    id: "stats-dashboard",
    name: "Stats Dashboard",
    version: "1.0.0",
    description: "Logs note statistics to console",
    main: "inline"
  },
  onInit(api) {
    api.events.on("note-saved", (fileName, content) => {
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      console.log(`[Stats] ${fileName}: ${words} words, ${content.length} chars`);
    });
  },
  onAppReady(api) {
    const notes = api.note.getAllNotes();
    console.log(`[Stats] Vault has ${notes.length} notes`);
    console.log(`[Stats] Theme: ${api.app.getTheme()}`);
    console.log(`[Stats] Version: ${api.app.getVersion()}`);
  },
  onNoteLoad(api, fileName) {
    console.log(`[Stats] Opened: ${fileName}`);
  }
};
```

---

## Dynamic Plugin Loading

Plugins are loaded from the `.plugins/` directory inside your vault:

```
your-vault/
├── .plugins/
│   ├── word-counter.js
│   ├── snippets.js
│   └── my-custom-plugin.js
├── notes/
│   ├── daily/
│   └── projects/
└── ...
```

### Loading Order

1. Built-in plugins (like `word-count`) are loaded first
2. Dynamic plugins from `.plugins/` are loaded alphabetically by filename
3. Each plugin's `onInit` is called in order

### Plugin Discovery

The app scans `.plugins/` for `.js` files on startup. Each file is:
1. Read from disk
2. Converted to a Blob URL
3. Dynamically imported via `import()`
4. The default export is registered as a plugin

---

## Plugin Management

Plugins can be managed in **Settings → Plugins**:

- **View** all installed plugins with their name, version, description, and commands
- **Enable/Disable** plugins with a toggle switch
- **Security warning** — first-time users must accept the risks before seeing plugins

Enabled/disabled state is persisted in `localStorage` under `void-disabled-plugins`.

Changes require an app restart to take effect.

---

## Plugin Marketplace

Void Notes has a built-in plugin marketplace that fetches available plugins from GitHub.

### How It Works

1. The app fetches [`plugins.json`](https://github.com/PixelCodeGH/VoidNotes/blob/main/public/plugins.json) from GitHub
2. Users browse plugins in the Marketplace UI (accessible from Plugins modal)
3. Clicking "Install" downloads the `.js` file and saves it to `.plugins/` in the vault
4. The plugin is loaded on the next app restart

### Adding Your Plugin to the Marketplace

1. Create your plugin `.js` file
2. Add it to the `plugins/` directory in the [VoidNotes repository](https://github.com/PixelCodeGH/VoidNotes)
3. Add an entry to `public/plugins.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What my plugin does",
  "author": "Your Name",
  "repoUrl": "https://github.com/yourusername/your-repo",
  "scriptUrl": "https://raw.githubusercontent.com/PixelCodeGH/VoidNotes/main/plugins/my-plugin.js",
  "tags": ["productivity", "tools"]
}
```

4. Open a Pull Request on GitHub

### plugins.json Format

```typescript
interface MarketplacePlugin {
  id: string;          // Unique plugin ID
  name: string;        // Display name
  version: string;     // Semver version
  description: string; // Short description
  author: string;      // Author name
  repoUrl: string;     // Source code URL
  scriptUrl: string;   // Direct URL to .js file (GitHub Raw)
  tags: string[];      // Category tags for search
}
```

### Updating Plugins

When a plugin's version in `plugins.json` is higher than the installed version, the Marketplace shows an "Update" button. Clicking it downloads the new version and replaces the old file.

### Security

The marketplace is a **community-driven** system. All plugins run with full app access. Only install plugins from sources you trust. The app shows a security warning before enabling plugins.

---

## Best Practices

### 1. Use Unique Command IDs

Prefix command IDs with your plugin ID to avoid conflicts:

```javascript
// Good
api.commands.register({ id: "my-plugin:action", /* ... */ });

// Bad — may conflict with other plugins
api.commands.register({ id: "action", /* ... */ });
```

### 2. Handle Errors Gracefully

Wrap your code in try-catch to prevent crashes:

```javascript
onInit(api) {
  api.commands.register({
    id: "my-plugin:risky",
    title: "Risky Action",
    action: async (api) => {
      try {
        // Potentially dangerous code
        const content = api.note.getContent();
        // ...
      } catch (err) {
        console.error("My Plugin error:", err);
        alert("An error occurred: " + err.message);
      }
    }
  });
}
```

### 3. Don't Block the UI

Use async operations for heavy tasks:

```javascript
// Good — async
action: async (api) => {
  const notes = api.note.getAllNotes();
  for (const name of notes) {
    const content = await api.note.load(name);
    // process...
  }
}

// Bad — blocks UI
action: (api) => {
  const notes = api.note.getAllNotes();
  for (const name of notes) {
    // synchronous operations on many files
  }
}
```

### 4. Use Events for Communication

Instead of directly calling other plugins, use the event bus:

```javascript
// Plugin A
api.events.emit("my-plugin:data-ready", { count: 42 });

// Plugin B
api.events.on("my-plugin:data-ready", (data) => {
  console.log("Received:", data.count);
});
```

### 5. Clean Up in onUnload

If you set up intervals, listeners, or external resources, clean them up:

```javascript
let interval;

onInit(api) {
  interval = setInterval(() => {
    console.log("Running...");
  }, 60000);
}

onUnload(api) {
  if (interval) clearInterval(interval);
}
```

### 6. Document Your Plugin

Include a clear manifest with description:

```javascript
manifest: {
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  description: "Clearly explain what this plugin does",
  author: "Your Name",
  main: "inline"
}
```

---

## TypeScript Support

For better IDE support, you can import types:

```typescript
import type { VoidPlugin, VoidAPI } from "../src/plugins/pluginInterface";

const plugin: VoidPlugin = {
  manifest: {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    main: "inline"
  },
  onInit(api: VoidAPI) {
    // Full autocomplete and type checking
  }
};

export default plugin;
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Plugin not loading | Check that the file is `.js` and exports a default object with `manifest` |
| Commands not showing | Make sure the plugin is enabled in Settings → Plugins |
| Changes not taking effect | Restart the app after modifying plugin files |
| TypeScript errors | Use `import type` for type-only imports |
| Plugin crashes | Check the DevTools console (`Ctrl+Shift+I`) for error messages |

---

## License

Plugins you create are your own code. Void Notes is MIT licensed — your plugins can use any license you choose.
