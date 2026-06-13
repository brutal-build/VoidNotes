export interface Callout {
  type: string;
  title: string;
  body: string;
}

const CALLOUT_ICONS: Record<string, string> = {
  info: "\u2139\uFE0F",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
  tip: "\uD83D\uDCA1",
  note: "\uD83D\uDCDD",
};

export function processCallouts(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCallout = false;
  let calloutType = "";
  let calloutTitle = "";
  let bodyLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^>\s*\[!([A-Z]+)\]\s*(.*)/);

    if (match) {
      if (inCallout) {
        result.push(renderCallout(calloutType, calloutTitle, bodyLines.join("\n")));
        bodyLines = [];
      }
      inCallout = true;
      calloutType = match[1].toLowerCase();
      calloutTitle = match[2] || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
    } else if (inCallout) {
      if (line.startsWith(">")) {
        bodyLines.push(line.replace(/^>\s?/, ""));
      } else if (line.trim() === "") {
        result.push(renderCallout(calloutType, calloutTitle, bodyLines.join("\n")));
        inCallout = false;
        bodyLines = [];
        result.push(line);
      } else {
        result.push(renderCallout(calloutType, calloutTitle, bodyLines.join("\n")));
        inCallout = false;
        bodyLines = [];
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  if (inCallout) {
    result.push(renderCallout(calloutType, calloutTitle, bodyLines.join("\n")));
  }

  return result.join("\n");
}

function renderCallout(type: string, title: string, body: string): string {
  const icon = CALLOUT_ICONS[type] || "\uD83D\uDCDD";
  return `<div class="callout callout-${type}"><div class="callout-title">${icon} ${title}</div><div class="callout-body">${body}</div></div>`;
}
