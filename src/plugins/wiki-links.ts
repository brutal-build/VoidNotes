export function processWikiLinks(markdown: string): string {
  return markdown.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, target, label) => {
      const display = label || target;
      return `<a class="wiki-link" data-target="${target}">${display}</a>`;
    }
  );
}
