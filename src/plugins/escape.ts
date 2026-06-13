/**
 * escape.ts
 *
 * Obsługa backslash escape:
 *   \*  → literalna gwiazdka (nie italic)
 *   \\  → literalny backslash
 *   \[  → literalny nawias
 *   \]  → literalny nawias
 *   \|  → literalny pipe
 *
 * WAŻNE: Wywoływaj PO extractCodeFences.
 */

export function processEscapes(text: string): string {
  return text.replace(
    /\\([\\*_{}\[\]()#+\-.!`~>])/g,
    (_match, char) => `&#${char.charCodeAt(0)};`
  );
}
