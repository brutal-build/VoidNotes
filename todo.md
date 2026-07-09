# Void Notes - Audit

`5270 LOC` | `60 plikow` | `26 TSX + 16 TS + 1 CSS (3143 linii) + Electron`

---

## 🔴 Krytyczne

### 1. App.tsx - God Component (447 linii, 21+ useState)

App.tsx trzyma caly stan aplikacji i przepycha go przez propsy do 15+ komponentow. Kazdy nowy feature dodaje kolejne `useState` i `onXxxChange`. Settings.tsx dostaje 8 osobnych propsow zamiast jednego obiektu.

**Fix:** Zustand store. Juz masz `d3-force`, `react-force-graph` zastapiony wlasnym canvas engine - architektura na to gotowa. Jeden `useStore()` zamiast 21 useState i prop-drillingu.

### 2. Jeden plik CSS (3143 linii)

`src/styles/index.css` to monolity. Kazdy nowy komponent dodaje kolejne 50-200 linii. Przy 3143 liniach nawigacja jest trudna.

**Fix:** Rozbic na `styles/themes.css`, `styles/layout.css`, `styles/components/GraphView.css` itd. Albo CSS modules per component.

### 3. Brak testow

Zero plikow `.test.ts` / `.spec.ts`. Przy 447-liniowym App.tsx i 3143-liniowym CSS, kazda zmiana to ryzyko regresji.

**Fix:** Minimum: Vitest + React Testing Library. Testy dla pluginow (`frontmatter.ts`, `wiki-links-utils.ts`), GraphEngine, i krytycznych flow (save/load note).

---

## 🟡 Znaczace

### 4. types.ts tylko dla Electron IPC (27 linii)

Zadnych typow dla: Note, GraphData, Settings, Theme, Plugin. Wszystko to implicit interface'y w komponentach.

**Fix:** Dodac domenowe typy: `Note`, `VaultConfig`, `Theme`, `GraphFilter`, itp.

### 5. electron/main.ts (461 linii)

Jeden plik z cala logika IPC handlerow, zarzadzaniem oknami, configiem, welcome file. Trudny w nawigacji.

**Fix:** Rozbic na `electron/ipc-handlers.ts`, `electron/config.ts`, `electron/window.ts`.

### 6. Brak `@media (hover: hover)`

Na urzadzeniach dotykowych hover stany "przyklejaja sie". CSS ma `prefers-reduced-motion` i `focus-visible`, ale brakuje gate'a dla hover.

### 7. README nieaktualne

README mowi o `react-force-graph`, ale kod uzywa wlasnego graph engine z `d3-force` + canvas. `react-force-graph` nie ma nawet w `package.json`.

---

## 🔵 Ulepszenia

### 8. Plugin system - nieuzywany potencjal

Masz `src/plugins/` z `frontmatter.ts`, `properties.ts`, `wiki-links-utils.ts`. Ale nie ma interfejsu pluginu - kazdy plugin to zwykly export funkcji.

**Fix:** `interface Plugin { name, init, destroy }` + rejestracja w App. Latwiejsze rozszerzanie.

### 9. Brak virtual scroll w sidebar

Przy 1000+ notek sidebar renderuje wszystkie. `react-window` albo `@tanstack/virtual` daloby 10x lepsza wydajnosc.

### 10. ErrorBoundary tylko w App

Jest `ErrorBoundary.tsx` (102 linie) ale uzywany tylko jako wrapper App. Kazdy lazy-loaded komponent powinien miec swoj error boundary z fallback UI.

---

## Podsumowanie

| Kategoria | Ocena |
|-----------|-------|
| CSS design tokens | 9/10 |
| CSS organizacja | 3/10 |
| State management | 4/10 |
| TypeScript typowanie | 4/10 |
| Testy | 0/10 |
| Accessibility | 7/10 |
| Kod Electron | 6/10 |
| Dokumentacja | 5/10 |

### Top 3 do zrobienia

1. **Zustand store** - najwiekszy win, usuwa prop-drilling
2. **Rozbicie CSS** na moduly
3. **Domenowe typy** w `types.ts`
