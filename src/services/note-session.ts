export interface NoteSession<EditorState = unknown> {
  id: string;
  buffer: string;
  dirty: boolean;
  preview: boolean;
  editorState: EditorState | null;
}

export interface NoteSessionDependencies {
  load(id: string): Promise<string>;
  save(id: string, content: string): Promise<void>;
}

export interface OpenSessionOptions<EditorState> {
  buffer?: string;
  preview?: boolean;
  editorState?: EditorState | null;
}

export function createNoteSessionCoordinator<EditorState = unknown>(dependencies: NoteSessionDependencies) {
  const sessions = new Map<string, NoteSession<EditorState>>();
  const revisions = new Map<string, number>();
  const loadVersions = new Map<string, number>();
  const saveQueues = new Map<string, Promise<void>>();

  const revision = (id: string) => revisions.get(id) ?? 0;

  function open(id: string, options: OpenSessionOptions<EditorState> = {}) {
    const existing = sessions.get(id);
    if (existing) return existing;
    const session: NoteSession<EditorState> = {
      id,
      buffer: options.buffer ?? "",
      dirty: false,
      preview: options.preview ?? false,
      editorState: options.editorState ?? null,
    };
    sessions.set(id, session);
    revisions.set(id, 0);
    return session;
  }

  function get(id: string) {
    return sessions.get(id);
  }

  function update(id: string, buffer: string, editorState?: EditorState) {
    const session = sessions.get(id);
    if (!session) throw new Error(`Unknown note session: ${id}`);
    session.buffer = buffer;
    session.dirty = true;
    if (editorState !== undefined) session.editorState = editorState;
    revisions.set(id, revision(id) + 1);
    return session;
  }

  async function load(id: string) {
    const session = sessions.get(id);
    if (!session) throw new Error(`Unknown note session: ${id}`);
    const version = (loadVersions.get(id) ?? 0) + 1;
    const startingRevision = revision(id);
    loadVersions.set(id, version);
    const content = await dependencies.load(id);
    if (sessions.get(id) !== session || loadVersions.get(id) !== version || revision(id) !== startingRevision) return false;
    session.buffer = content;
    session.dirty = false;
    return true;
  }

  function save(id: string): Promise<void> {
    const session = sessions.get(id);
    if (!session || !session.dirty) return saveQueues.get(id) ?? Promise.resolve();
    const content = session.buffer;
    const savingRevision = revision(id);
    const queued = (saveQueues.get(id) ?? Promise.resolve()).catch(() => undefined).then(async () => {
      await dependencies.save(id, content);
      if (sessions.get(id) === session && revision(id) === savingRevision) session.dirty = false;
    });
    saveQueues.set(id, queued);
    return queued;
  }

  async function flush() {
    await Promise.all(Array.from(sessions.values()).filter((session) => session.dirty).map((session) => save(session.id)));
  }

  function rename(from: string, to: string) {
    const session = sessions.get(from);
    if (!session) return undefined;
    if (sessions.has(to)) throw new Error(`Note session already exists: ${to}`);
    sessions.delete(from);
    session.id = to;
    sessions.set(to, session);
    revisions.set(to, revision(from));
    revisions.delete(from);
    loadVersions.delete(from);
    return session;
  }

  function remove(id: string) {
    const session = sessions.get(id);
    if (!session) return undefined;
    sessions.delete(id);
    revisions.delete(id);
    loadVersions.delete(id);
    return session;
  }

  return { open, get, update, load, save, flush, rename, delete: remove };
}

export function nearestNeighborAfterClose(ids: readonly string[], closingId: string): string | null {
  const index = ids.indexOf(closingId);
  if (index < 0) return null;
  return ids[index + 1] ?? ids[index - 1] ?? null;
}
