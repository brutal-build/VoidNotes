export type IpcErrorCode =
  | "NO_VAULT"
  | "INVALID_ARGUMENT"
  | "INVALID_NAME"
  | "OUTSIDE_VAULT"
  | "SYMLINK_ESCAPE"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "NOT_WRITABLE"
  | "CONFLICT"
  | "IO_ERROR"
  | "CANCELLED";

export interface IpcError {
  code: IpcErrorCode;
  message: string;
  retryable: boolean;
}

export type IpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: IpcError };

export interface VaultTreeEntry {
  path: string;
  name: string;
  type: "file" | "folder";
  children?: VaultTreeEntry[];
}

export interface NoteStat {
  mtime: string;
  birthtime: string;
  size: number;
}

export interface TrashEntry {
  id: string;
  originalPath: string;
  deletedAt: string;
}

export interface ExternalNoteChange {
  type: "changed" | "created" | "deleted";
  path: string;
}

export const IPC_CHANNELS = {
  vaultSelect: "vault:select",
  vaultSet: "vault:set",
  vaultGet: "vault:get",
  notesList: "notes:list",
  notesLoad: "notes:load",
  notesSave: "notes:save",
  notesCreate: "notes:create",
  notesDelete: "notes:delete",
  notesRename: "notes:rename",
  notesStat: "notes:stat",
  trashList: "trash:list",
  trashRestore: "trash:restore",
  trashDelete: "trash:delete",
  folderCreate: "folder:create",
  folderRename: "folder:rename",
  folderDelete: "folder:delete",
  appCloseReady: "app:close-ready",
  appCloseRequested: "app:close-requested",
  noteExternalChange: "notes:external-change",
} as const;

export function ok<T>(value: T): IpcResult<T> {
  return { ok: true, value };
}

export function err(code: IpcErrorCode, message: string, retryable = false): IpcResult<never> {
  return { ok: false, error: { code, message, retryable } };
}

export function isIpcResult(value: unknown): value is IpcResult<unknown> {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (result.ok === true) return Object.prototype.hasOwnProperty.call(result, "value");
  if (result.ok !== false || !result.error || typeof result.error !== "object") return false;
  const error = result.error as Record<string, unknown>;
  return typeof error.code === "string" && typeof error.message === "string" && typeof error.retryable === "boolean";
}
