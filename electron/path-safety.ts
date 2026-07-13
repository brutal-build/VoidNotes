import * as fs from "fs";
import * as path from "path";

export type PathErrorCode =
  | "EMPTY_NAME"
  | "ABSOLUTE_PATH"
  | "PATH_TRAVERSAL"
  | "INVALID_CHARACTER"
  | "TRAILING_CHARACTER"
  | "RESERVED_NAME"
  | "OUTSIDE_VAULT"
  | "SYMLINK_ESCAPE";

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; code: PathErrorCode; message: string };

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const INVALID_WINDOWS_CHARACTERS = /[<>:"|?*\u0000-\u001f]/;

function failure(code: PathErrorCode, message: string): ValidationResult {
  return { ok: false, code, message };
}

export function validateEntryName(name: string, kind: "file" | "folder"): ValidationResult {
  if (!name || !name.trim()) return failure("EMPTY_NAME", `${kind === "file" ? "Note" : "Folder"} name is required.`);
  if (path.win32.isAbsolute(name) || path.posix.isAbsolute(name)) return failure("ABSOLUTE_PATH", "Absolute paths are not allowed.");
  if (name === "." || name === ".." || name.includes("/") || name.includes("\\")) return failure("PATH_TRAVERSAL", "Path separators and traversal segments are not allowed.");
  if (INVALID_WINDOWS_CHARACTERS.test(name)) return failure("INVALID_CHARACTER", "The name contains a character that Windows does not allow.");
  if (/[. ]$/.test(name)) return failure("TRAILING_CHARACTER", "Names cannot end with a dot or space.");
  if (WINDOWS_RESERVED_NAMES.test(name)) return failure("RESERVED_NAME", "This name is reserved by Windows.");
  return { ok: true, value: name };
}

export function validateRelativePath(relativePath: string, kind: "file" | "folder"): ValidationResult {
  if (!relativePath || !relativePath.trim()) return failure("EMPTY_NAME", "A relative path is required.");
  if (path.win32.isAbsolute(relativePath) || path.posix.isAbsolute(relativePath)) return failure("ABSOLUTE_PATH", "Absolute paths are not allowed.");

  const parts = relativePath.replace(/\\/g, "/").split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    return failure("PATH_TRAVERSAL", "Traversal and empty path segments are not allowed.");
  }

  for (let index = 0; index < parts.length; index += 1) {
    const partKind = index === parts.length - 1 ? kind : "folder";
    const result = validateEntryName(parts[index], partKind);
    if (!result.ok) return result;
  }

  return { ok: true, value: parts.join(path.sep) };
}

export function isPathInside(root: string, candidate: string, platform: NodeJS.Platform = process.platform): boolean {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const normalizedRoot = pathApi.resolve(root);
  const normalizedCandidate = pathApi.resolve(candidate);
  const relative = pathApi.relative(normalizedRoot, normalizedCandidate);
  return relative === "" || (!relative.startsWith("..") && !pathApi.isAbsolute(relative));
}

async function realpathExistingAncestor(candidate: string): Promise<{ canonical: string; remainder: string[] }> {
  const remainder: string[] = [];
  let current = candidate;

  while (true) {
    try {
      return { canonical: await fs.promises.realpath(current), remainder: remainder.reverse() };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      remainder.push(path.basename(current));
      current = parent;
    }
  }
}

export async function resolveVaultPath(vaultRoot: string, relativePath: string, kind: "file" | "folder"): Promise<ValidationResult> {
  const relativeValidation = validateRelativePath(relativePath, kind);
  if (!relativeValidation.ok) return relativeValidation;

  const canonicalRoot = await fs.promises.realpath(vaultRoot);
  const requested = path.resolve(canonicalRoot, relativeValidation.value);
  if (!isPathInside(canonicalRoot, requested)) return failure("OUTSIDE_VAULT", "The requested path is outside the vault.");

  const { canonical, remainder } = await realpathExistingAncestor(requested);
  const canonicalTarget = path.resolve(canonical, ...remainder);
  if (!isPathInside(canonicalRoot, canonicalTarget)) return failure("SYMLINK_ESCAPE", "The requested path follows a symlink outside the vault.");

  return { ok: true, value: canonicalTarget };
}
