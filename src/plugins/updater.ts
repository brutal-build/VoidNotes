export const APP_VERSION = "1.0.0";
export const GITHUB_REPO = "brutal-build/VoidNotes";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface UpdateInfo {
  tagName: string;
  version: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  exeAsset: { name: string; downloadUrl: string } | null;
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map(Number);
}

export function isNewer(remote: string, local: string): boolean {
  const r = parseVersion(remote);
  const l = parseVersion(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": `VoidNotes/${APP_VERSION}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const tagName: string = data.tag_name;
    const version = tagName.replace(/^v/, "");

    if (!isNewer(version, APP_VERSION)) return null;

    const exe = (data.assets || []).find((a: any) =>
      a.name.endsWith(".exe") || a.name.endsWith(".msi")
    );

    return {
      tagName,
      version,
      body: data.body || "",
      htmlUrl: data.html_url,
      publishedAt: data.published_at,
      exeAsset: exe ? {
        name: exe.name,
        downloadUrl: exe.browser_download_url,
      } : null,
    };
  } catch (err) {
    console.error("Update check failed:", err);
    return null;
  }
}
