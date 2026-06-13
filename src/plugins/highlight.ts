export function processHighlights(markdown: string): string {
  return markdown.replace(
    /==([^=]+)==/g,
    '<span class="md-highlight">$1</span>'
  );
}
