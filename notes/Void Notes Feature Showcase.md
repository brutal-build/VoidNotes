---
title: Void Notes Feature Showcase
tags: [demo, features, markdown]
date: 2026-06-13
---

# Void Notes Feature Showcase

Welcome to **Void Notes** — your minimalist second-brain notepad. This note demonstrates every formatting feature available.

---

## Text Formatting

| Style | Syntax | Result |
|-------|--------|--------|
| Bold | `**text**` | **bold text** |
| Italic | `*text*` | *italic text* |
| Underline | `__text__` | __underlined__ |
| Strikethrough | `~~text~~` | ~~deleted~~ |
| Inline Code | `` `code` `` | `console.log()` |
| Highlight | `==text==` | ==important== |
| Spoiler | `\|\|text\|\|` | ||click to reveal|| |

Combine them: **bold and *italic* together** or __underlined **and bold**__.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4

---

## Lists

### Unordered
- First item
- Second item
  - Nested item A
  - Nested item B
- Third item

### Ordered
1. Step one
2. Step two
3. Step three

### Task List
- [x] Create vault
- [x] Write notes
- [ ] Organize knowledge
- [ ] Build second brain

---

## Blockquotes

> "The best way to predict the future is to create it."
> — Peter Drucker

> Multi-line blockquote with **bold** and *italic* inside.
> Second line continues here.

---

## Code Blocks

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("Void Notes"));
```

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

list(fibonacci(10))
```

```css
.theme-dark {
  --bg: #1e1e1e;
  --text: #e0e0e0;
  --accent: #8a70d6;
}
```

---

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown Editor | Done | High |
| Wiki Links | Done | High |
| Split View | Done | Medium |
| Tag Filtering | Done | Medium |
| Themes | Done | Low |
| Graph View | Planned | Low |

---

## Callouts

> [!INFO] Information
> This is an informational callout. Use it for tips and notes.

> [!WARNING] Warning
> Be careful with destructive actions. Always keep backups.

> [!TIP] Pro Tip
> Use `Ctrl+Shift+E` to toggle split view for side-by-side editing.

> [!ERROR] Danger Zone
> Deleting a note is permanent. There is no trash bin.

---

## Wiki Links

Link to other notes using double brackets:
- [[Test formatowania Void Notes]] — this note
- [[Untitled]] — a basic note
- [[non-existent]] — a missing link (dashed style)

---

## Horizontal Rules

Content above the line.

---

Content below the line.

---

## Images & Links

[GitHub Repository](https://github.com/brutal-build/VoidNotes)

---

## Frontmatter

This note uses YAML frontmatter for metadata:

```yaml
---
title: Void Notes Feature Showcase
tags: [demo, features, markdown]
date: 2026-06-13
---
```

Tags from frontmatter appear in the sidebar for filtering.

---

## Inline Tags

You can also use hashtags in the text: #productivity #notes #secondbrain #markdown

These are automatically detected and added to the tag index.

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save note |
| `Ctrl+E` | Toggle Edit / Preview |
| `Ctrl+Shift+E` | Split view |
| `Ctrl+P` | Command palette |
| `Ctrl+N` | New note |
| `Ctrl+Shift+N` | Daily note |
| `Ctrl+,` | Settings |
| `F1` | Help |
| `F9` | Focus mode |

---

*Last updated: June 2026 — Void Notes v0.2.5*
