# Void Notes - UI fixes

## Problem 1: Split drag lag

**Root cause**: `setSplitRatio()` calls on mouseup trigger a full React re-render (App + CodeMirror + all children). The `splitRatio` lives in Zustand store, and when it changes, every component subscribed to ANY store selector re-renders.

**Fix**: Remove `splitRatio` from Zustand. Keep it as local state in App.tsx. Also the pane-editor/pane-preview elements' `flex` values in the JSX are computed from `splitRatio` prop which forces re-render.

### Steps:

1. **Remove splitRatio from Zustand store** (`src/store/useAppStore.ts`):
   - Delete `splitRatio`, `splitView`, `setSplitRatio`, `setSplitView` from the store interface and implementation
   - Keep `splitView` and `splitRatio` as local `useState` in App.tsx (already partially done)

2. **Make split drag zero-render**:
   - During drag: update `element.style.flex` directly (already done)
   - On mouseup: commit ratio to local state via `setSplitRatio(finalRatio)` (currently goes to store)
   - BUT the editor re-renders because `splitRatio` is used in JSX `style={{ flex: \`0 0 ${splitRatio * 100}%\` }}`
   - Solution: use a `useRef` for the ratio during drag, only sync to state on mouseup

3. **Fix the divider position issue**: the `.split-divider-v` might not be positioned correctly in split-down mode. Check that `.pane-container.split-down` truly has `flex-direction: column`.

---

## Problem 2: Scrollbar too far from editor text edge

**Root cause**: The `.editor-wrapper` has `padding: 0 var(--space-lg)` (16px on each side). The CodeMirror scrollbar (`cm-scroller`) is inside the editor which is inside the wrapper. The wrapper's padding pushes the entire editor inward, so the scrollbar appears 16px away from the panel edge.

**Fix**: Move scrollbar styling. The scrollbar should be at the very right edge of the pane, not inside the padded wrapper.

### Steps:

1. **Change editor-wrapper padding** to only apply top/bottom:
   ```css
   .editor-wrapper {
     width: 100%;
     padding: 0;  /* remove horizontal padding */
   }
   ```

2. **Add horizontal padding to cm-content instead** via the CodeMirror theme in NoteEditor.tsx:
   ```ts
   styles[".cm-content"] = {
     padding: "0 var(--space-lg)",
     ...
   };
   ```
   OR add it to the `.cm-scroller`:
   ```css
   .pane-editor .cm-scroller {
     padding: var(--space-lg) var(--space-lg);
   }
   ```

3. **The scrollbar** (which is on `.cm-scroller`) will now be at the edge of the pane, but the text will still have padding from the content area.

4. **Also check**: the `.pane-preview` might have similar padding issues - the preview scrollbar should be at the edge too.

---

## Problem 3: Check CSS for `.pane-preview`

The preview panel's scrollbar likely has the same issue. Make sure:

```css
.pane-preview {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);  /* keep content padding but let scrollbar be at edge */
}
```

The scrollbar is on the `.pane-preview` element itself, so its padding should only apply to the content inside, not push the scrollbar inward. If currently using `padding` it's fine - scrollbar stays at edge. Only `margin` would push it inward.

---

## Quick verification steps:

1. `npm run dev`
2. Open a note, enable Split → or Split ↓
3. Drag the divider - should be butter-smooth, no stutter
4. Check scrollbar position - should be flush with the pane edge, not indented
5. Toggle right panel - text should stay left-aligned, not jump
