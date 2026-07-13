# Reddit — r/ObsidianMD Post

## Sposob postowania

Post jako **Image/Video post** — wrzuc screenshota macOS Glass Theme (caly interfejs + blur efekt). Tytul i tresc ponizej w pierwszym komentarzu. Obrazki zawsze dostaja wiecej upvotow niz text-only posty.

---

## Tytul (title pola przy uploadzie obrazka)

```
I got tired of waiting for a glass-morphism theme in Obsidian, so I built my own note-taking app with native blur effects
```

---

## Tresc (pierwszy komentarz pod postem)

```
I've been using Obsidian for a while and really wanted a proper glass-morphism UI with native backdrop-filter blur. After a month of work, I shipped **Void Notes** — a free, open-source, local-first Markdown second-brain.

**What makes it different:**
- **macOS Glass Theme** — translucent panels with real CSS backdrop-filter blur (not fake transparency like Electron vibrancy hacks). Sidebar, modals, right panel, and even the context menu are properly glass-styled.
- **Trash with preview** — accidentally delete a note? You can preview its content inside the trash panel before restoring or permanently deleting. No guessing what that "Untitled 12.md" was.
- **Custom dialog system** — no more native `window.confirm()` popups. All dialogs (new note, new folder, delete, rename, wiki creation, permanent trash delete) are React components with full theme support.
- **6 themes** — Obsidian, Light, Dracula, Nord, Solarized, and macOS Glass. Themes use CSS custom properties, so adding new ones is just a few lines of :root tokens.
- **Graph view** with d3-force, bookmarks with star icons in the file tree, wiki links [[like this]], backlinks, tags, templates, focus mode, Vim keybindings, and a file watcher for external changes.

**Tech stack:** Electron 35 + React 19 + CodeMirror 6 + TypeScript + d3-force.
**Tests:** 73 tests passing, 16 test files.
**License:** MIT. Your notes stay as plain .md files on your disk. No cloud, no account, no telemetry.

GitHub: https://github.com/brutal-build/VoidNotes
Download: https://github.com/brutal-build/VoidNotes/releases (Windows .exe, ~1 MB)

Happy to answer questions. What features would you want in a local-first Obsidian alternative?
```

---

## Zasady r/ObsidianMD

- Subreddit wymaga ~50-100 karmy zeby postowac (combined karma: post + comment). Sprawdz swoja na https://old.reddit.com/user/brutal-build
- Jesli za malo karmy — najpierw przez tydzien komentuj na postach innych ludzi (pomocne odpowiedzi, nie spam). 5-10 sensownych komentarzy = wystarczajaco karmy.
- r/ObsidianMD nie ma stricte anti-promo regulaminu jak niektore subreddity, ale post musi dostarczac wartosc. Format "zbudowalem alternatywe" przechodzi bo to developer content, nie marketing.
- **Nie wstawiaj linku w tytule** — link w komentarzu jest ok.
- Odpowiadaj na kazdy komentarz. To zwieksza engagement i widocznosc posta.

---

## Alternatywne tytuly (jesli pierwszy nie przejdzie)

```
I built a free Obsidian-like app with actual glass-morphism UI — Void Notes v0.3.0 just released
```
```
Solo dev, 16 years old — I built a local-first Markdown second-brain with 6 themes and a glass UI
```
```
After a month of building, my Obsidian-inspired note app now has glass themes, trash preview, and custom dialogs
```

---

## Screenshot ktory wrzucasz

Zrob screena calego okna Void Notes w macOS Glass Theme z:
- Sidebar widoczny (z bookmark gwiazdka)
- Notatka otwarta w edytorze (jakis markdown content)
- Prawy panel otwarty (backlinks tab)
- Top bar + Traffic Lights widoczne

To pokazuje blur efekt na panelach — to jest twoj visual hook.
