/**
 * discord-formats.ts
 *
 * Discord-style inline formatting:
 *   __underline__  → <u>underline</u>
 *   ||spoiler||    → <span class="spoiler-hidden" onclick="this.classList.toggle('revealed')">spoiler</span>
 *
 * WAŻNE: Wywoływaj PO extractCodeFences, żeby nie psuć bloków kodu.
 */

export function processUnderline(text: string): string {
  // __tekst__ → <u>tekst</u>
  // Nie łapie __ na początku/wyrazie (to bold w GFM), tylko podwójne __ otaczające tekst
  return text.replace(
    /__(.+?)__/g,
    '<u>$1</u>'
  );
}

export function processSpoilers(text: string): string {
  // ||tekst|| → spoiler (obsługa kliku w NoteParser)
  // Przed wywołaniem tego pliku escape już nie zamienia '|' na &#124;,
  // więc zwykłe || przechodzi bez przeszkód.
  return text.replace(
    /\|\|(.+?)\|\|/g,
    '<span class="spoiler-hidden" data-spoiler>$1</span>'
  );
}
