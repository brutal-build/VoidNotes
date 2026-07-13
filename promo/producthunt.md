# Product Hunt — Void Notes v0.3.0

## Przed launch

1. Zrob konto na ProductHunt: https://www.producthunt.com/
2. Ustaw profil: `@brutalbuild`, bio: "16 y/o solo dev from Poland. Building local-first desktop tools."
3. Linki w profilu: GitHub + Ko-fi
4. **Zaplanuj launch na wtorek/srode/czwartek** (pon i pt to martwe dni na PH). Godzina: 00:01 PST (09:01 czasu polskiego) — wtedy resetuje sie daily ranking.

---

## Listing — Product Hunt

### Name
```
Void Notes
```

### Tagline (max 60 znakow)
```
A local-first Markdown second-brain with macOS glass UI — free & open-source
```
(60 znakow — idealnie)

### Topics / Categories
Wybierz z listy PH:
- **Developer Tools** (glowny)
- **Productivity**
- **Note-taking**
- **Open Source**

---

### Description (opis na stronie produktu)

```
Void Notes is a local-first Markdown knowledge management app for Windows. Think Obsidian, but with native glass-morphism UI, a trash system with note preview, and custom-styled dialogs.

Your notes stay as plain .md files on your disk. No cloud, no account, no telemetry.

FEATURES:

- macOS Glass Theme — translucent panels with real CSS backdrop-filter blur. 6 themes total (Obsidian, Light, Dracula, Nord, Solarized, macOS Glass)
- Wiki Links [[like this]] with autocomplete and automatic backlinks
- Interactive Graph View — d3-force physics, filters, zoom/pan
- Tab System — VS Code-style tabs with drag reorder and dirty-state indicators
- Trash with Preview — click a deleted note to read its content before restoring or permanently deleting
- Custom Dialog System — every prompt (new note, delete, rename, wiki creation, trash) uses themed React dialogs instead of native browser popups
- Tags & Properties — YAML frontmatter editor, filterable tag sidebar
- Bookmarks with star icons in the file tree
- Focus Mode (F9), Vim Keybindings, Spellcheck, Command Palette (Ctrl+P)
- Global Search (Ctrl+Shift+F) with indexed lookups
- 5 built-in templates (Daily Note, Meeting, Project, Book Notes, Journal)
- External file change detection — watcher monitors your vault directory

TECH STACK:
Electron 35 • React 19 • CodeMirror 6 • TypeScript • d3-force • Zustand • Vitest

73 tests | 16 test files | MIT License | ~1 MB installer | Windows x64
```

---

### Maker Comment (pierwszy komentarz — automatycznie postuje sie przy publikacji)

To jest NAJWAZNIEJSZA czesc Product Hunt launchu. Maker comment = pierwszy komnetarz pod twoim listingiem. PH community ocenia produkt glownie po maker comment.

```
Hi Product Hunt! I'm Sebastian, a 16-year-old solo developer from Poland.

**Why I built this:**

I've been using Obsidian for a while but got frustrated with two things: (1) no native glass-morphism UI despite years of community requests, and (2) the app getting increasingly bloated with each update. I wanted something simpler, faster, and visually distinct.

So over the past month I built Void Notes from scratch — a local-first, open-source Markdown second-brain for Windows.

**What I'm most proud of in this release (v0.3.0):**

1. **macOS Glass Theme** — real CSS backdrop-filter blur on every panel. Not fake transparency hacks — actual glass morphism with a dark gradient wallpaper behind translucent surfaces. It looks incredible on Windows 11.

2. **Trash with preview** — I kept accidentally deleting notes and having no way to check what was inside before restoring. Now you can click any trashed note to preview its content inline.

3. **Custom dialog system** — I hate browser `alert()`/`confirm()` popups in desktop apps. Every single dialog in Void Notes is a proper React component with full theme support. Delete note, new folder, wiki creation, permanent trash delete — all styled.

4. **Accessibility from day one** — ARIA tree markup in the sidebar, keyboard navigation, `prefers-reduced-motion` on every animation. I wanted this to be usable by everyone, not just mouse users.

**What makes it different from Obsidian:**
- Glass UI (actual blur, not Electron vibrancy)
- Simpler — fewer plugins, less configuration, just works
- Trash system with content preview
- 100% free and MIT licensed

**What's next:**
- Linux support
- Mobile companion app
- Plugin system (opt-in, not forced)

**Tech stack:** Electron 35, React 19, CodeMirror 6, d3-force, Zustand, TypeScript.

**Repo:** https://github.com/brutal-build/VoidNotes
**Download:** https://github.com/brutal-build/VoidNotes/releases (~1 MB .exe)

I'm still in high school and this is my biggest project yet. Would love your honest feedback — what features would you want to see? What's missing?

Thanks for checking it out! ️ (yes, that's a joke about the no-emoji rule in the UI — the app itself has zero emojis, just SVG icons)

---

PS: If you like it, a GitHub star means a lot to a solo dev. And if you really like it, I have a Ko-fi: https://ko-fi.com/brutalbuild
```

---

### Screenshoty / Media (wrzucasz przy tworzeniu listingu)

PH wymaga minimum 1 obrazka, ale 5-8 = duzo lepszy conversion:

1. **Hero shot** — cala apka w macOS Glass Theme (sidebar + editor + right panel + top bar). To bedzie pierwsze co ludzie widza.
2. **Theme switcher** — kolaż 6 themes w jednym obrazku (2x3 grid). Pokazuje range.
3. **Graph View** — full graph z connected nodes, podswietlonym hoverem. Ludzie kochaja graph views.
4. **Trash with preview** — trash panel z rozwinietym preview notatki. To twoj unikalny feature.
5. **Dialog system** — 3 dialogs side-by-side (ConfirmDialog, InputDialog, new note) zeby pokazac ze to nie natywne popupy.
6. **Focus Mode** — czysty edytor na pelnym ekranie z breadcrumb buttonem.
7. **GIF** (jako pierwsze zdjecie jesli masz) — 5-10 sekund: przelaczanie themes + klikniecie trash preview + graph drag.

---

### Pricing
Wybierz na PH: **Free**

---

### Co zrobic w dzien launchu

1. **00:01 PST / 09:01 PL** — klikasz "Launch". PH automatycznie publikuje listing + maker comment.
2. **Przez pierwsza godzine** — odpowiadaj na kazdy komentarz. PH ranking algorytm mocno wazy engagement w pierwszej godzinie.
3. **Wyslij link do znajomych / na Discordy** — kazdy upvote z PH konta sie liczy. Nawet 5-10 osob z twojego circle zrobi roznice.
4. **Postaw na Reddit** (r/ObsidianMD) w ten sam dzien — link do PH w komentarzu pod redditowym postem.
5. **Tweet / X post** — taguj @ProductHunt, uzyj #buildinpublic

---

## Przydatne linki

- PH launch checklist: https://www.producthunt.com/launch
- Twoj przyszly listing: https://www.producthunt.com/products/void-notes (po stworzeniu)
- PH community rules: https://www.producthunt.com/rules
