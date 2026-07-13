# Changelog

## v0.3.0 — Expanded (2026-07-13)

### Nowe funkcje

- **macOS Glass Theme** — nowy motyw z przezroczystymi panelami, efektem szkla (`backdrop-filter`) i ciemnym gradientowym tlem. Panele, modal, sidebar i top-bar maja polprzezroczyste tlo, a obszary nakladek maja silniejsze blur.
- **Panel kosza (Trash)** — podglad zawartosci notatek przed przywroceniem/usunieciem, stylowane przyciski Restore i Delete z ikonami SVG, potwierdzenie permanent delete przez dialog.
- **Dialog tworzenia notatki** — klikniecie New Note otwiera teraz InputDialog z polem na nazwe (tak samo jak New Folder). Automatyczne dopisywanie rozszerzenia `.md`.
- **Gwiazdka przy bookmarkach** — zbookmarkowane pliki w drzewie maja ikone gwiazdki w kolorze akcentu.
- **Dialog system** — nowe komponenty `ConfirmDialog`, `InputDialog`, `Dialog` z pelnym ostylowaniem CSS. Zastapily natywne `window.confirm()` i `window.prompt()`.
- **Tworzenie brakujacej notatki wiki** — klikniecie w link `[[...]]` do nieistniejacej notatki pyta o stworzenie przez dialog.
- **Wykrywanie zmian zewnetrznych** — file watcher monitoruje katalog vault i powiadamia renderer o zmianach, tworzeniu i usuwaniu plikow spoza aplikacji.

### Poprawki bledow

- **Autosave race condition** — session coordinator z wersjonowanymi loadami i kolejkowanymi zapisami eliminuje ryzyko nadpisywania nowszych danych.
- **Dirty-close dialog** — przy zamykaniu karty z niezapisanymi zmianami pojawia sie ConfirmDialog z opcjami Save / Discard / Cancel.
- **Theme name mismatch** — motyw `obsidian` zapisywal sie niepoprawnie w localStorage.
- **Z-index context menu** — przy motywie macOS context menu pojawialo sie pod edytorem. Naprawione przez `createPortal(..., document.body)`.
- **Preview pane macOS** — panel podgladu nie mial efektu szkla w motywie macOS.
- **Stylowanie dialogow** — dialogi Delete Note i New Folder nie mialy CSS.
- **"Destination already exists"** — tworzenie nowej notatki zwracalo blad gdy plik juz istnial. Teraz auto-inkrementuje nazwe (Untitled 1, 2...).
- **Ctrl+E w edytorze** — przejscie do preview nie dzialalo bez klikniecia poza edytor. Usuniety niepotrzebny warunek `!inEditor`.
- **Focus mode button** — przycisk "Show sidebar" nachodzil na kontrolki okna (minimalizuj/maksymalizuj/zamknij). Przeniesiony do breadcrumb obok nazwy notatki.
- **Graph simulation leak** — wielokrotne otwieranie/zamykanie grafu nie zostawia juz running simulation.
- **Trash restore/delete style** — przyciski w koszu nie mialy CSS; teraz w pelni ostylowane.

### Usprawnienia UI/UX

- **Dostepnosc** — sidebar z ARIA tree markup i pelna obsluga klawiatury (strzalki, Enter, Space).
- **`prefers-reduced-motion`** — wszystkie animacje respektuja systemowe ustawienia redukcji ruchu.
- **`transition: all`** — zastapione konkretnymi propertasami (`background-color`, `color`, `opacity` itd.) dla lepszej wydajnosci.
- **Empty states** — panele bez zawartosci pokazuja komunikaty zamiast pustych obszarow.
- **Z-index i overlay rules** — ujednolicone warstwy dla modali, tooltipow, menu kontekstowych.
- **Bookmark cleanup** — usuniecie notatki automatycznie usuwa ja z bookmarkow.

### Architektura / Performance

- **VaultIndex** — globalne wyszukiwanie uzywa indeksu zamiast skanowania liniowego.
- **Incremental backlinks** — refresh backlinks uzywa przyrostowego indeksowania zamiast przeliczania wszystkiego od nowa.
- **Code splitting** — `React.lazy()` dla NoteEditor, GraphView, GlobalSearch, Settings i innych modali.
- **Session coordinator** — wydzielona warstwa do zarzadzania stanem edytora per karta z izolacja race condition.
- **Wersja** — 0.2.5 → 0.3.0

### Pod maska

- Error logging w pustych catch blokach (`electron/main.ts`, `electron/window.ts`).
- `EditorState` interface do persystencji stanu CodeMirror.
- Nowy kanal IPC `trash:load` do ladowania zawartosci notatki z kosza.
