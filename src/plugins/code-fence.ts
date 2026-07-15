/**
 * code-fence.ts
 *
 * Chroni bloki kodu (``` i `inline`) przed preprocessingiem.
 * Zamienia je na placeholder-y, przetwarza tekst, potem przywraca.
 */

interface CodeFence {
  id: string;
  content: string;
  isBlock: boolean;
}

let counter = 0;

function nextId(): string {
  return `\x00CF${counter++}\x00`;
}

export function extractCodeFences(text: string): { protected: string; fences: Map<string, CodeFence> } {
  counter = 0;
  const fences = new Map<string, CodeFence>();
  let result = text;

  // Bloki kodu ``` (wieloliniowe) - najpierw je chowamy
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, body) => {
    const id = nextId();
    fences.set(id, { id, content: `\`\`\`${lang}\n${body}\`\`\``, isBlock: true });
    return id;
  });

  // Inline code `...` - potem chowamy inline
  result = result.replace(/`([^`\n]+)`/g, (_match, body) => {
    const id = nextId();
    fences.set(id, { id, content: `\`${body}\``, isBlock: false });
    return id;
  });

  return { protected: result, fences };
}

export function restoreCodeFences(text: string, fences: Map<string, CodeFence>): string {
  let result = text;
  for (const [id, fence] of fences) {
    result = result.replace(id, fence.content);
  }
  return result;
}
