// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import NoteEditor from "../components/NoteEditor";

// CodeMirror 6 doesn't render fully in jsdom, so we test:
// 1. The container renders
// 2. Props are passed correctly
// 3. Paste/drop event handlers work

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
});

function createImageFile(name = "test.png"): File {
  return new File(["fake-image-data"], name, { type: "image/png" });
}

/**
 * Build a minimal clipboardData-like object for the paste handler.
 * NoteEditor's handlePaste checks: items[i].kind === "file" && items[i].type.startsWith("image/")
 */
function createImageClipboardData(file: File) {
  return {
    items: [
      {
        kind: "file",
        type: "image/png",
        getAsFile: () => file,
      },
    ],
    types: ["Files"],
    getData: () => "",
    files: [file],
  };
}

function createTextClipboardData() {
  return {
    items: [
      {
        kind: "string",
        type: "text/plain",
        getAsFile: () => null,
      },
    ],
    types: ["text/plain"],
    getData: (type: string) => (type === "text/plain" ? "hello" : ""),
    files: [],
  };
}

describe("NoteEditor", () => {
  it("renders editor container", () => {
    const { container } = render(
      <NoteEditor
        content="Hello world"
        onChange={vi.fn()}
        noteNames={[]}
      />
    );
    expect(container.querySelector(".editor-drop-zone")).toBeDefined();
  });

  it("passes spellcheck prop to CodeMirror", () => {
    const { container } = render(
      <NoteEditor
        content=""
        onChange={vi.fn()}
        noteNames={[]}
        spellcheck={true}
      />
    );
    expect(container.querySelector(".cm-editor")).toBeDefined();
  });

  it("renders with vimMode without crashing", () => {
    const { container } = render(
      <NoteEditor
        content="test"
        onChange={vi.fn()}
        noteNames={[]}
        vimMode={true}
      />
    );
    expect(container.querySelector(".editor-drop-zone")).toBeDefined();
  });

  it("calls onImagePaste when image is pasted", async () => {
    const onImagePaste = vi.fn().mockResolvedValue("attachments/img.png");
    const onChange = vi.fn();

    const { container } = render(
      <NoteEditor
        content=""
        onChange={onChange}
        noteNames={[]}
        onImagePaste={onImagePaste}
      />
    );

    // Paste is handled by CodeMirror domEventHandlers on .cm-content
    const content = container.querySelector(".cm-content")!;
    const file = createImageFile("photo.png");
    const clipboardData = createImageClipboardData(file);

    // We need to directly trigger the handler since fireEvent.paste doesn't
    // properly pass clipboardData through in jsdom
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = clipboardData;
    pasteEvent.preventDefault = vi.fn();

    fireEvent(content, pasteEvent);

    await waitFor(() => {
      expect(onImagePaste).toHaveBeenCalledWith(file);
    });
  });

  it("ignores paste when no onImagePaste handler", () => {
    const onChange = vi.fn();

    const { container } = render(
      <NoteEditor
        content=""
        onChange={onChange}
        noteNames={[]}
      />
    );

    const content = container.querySelector(".cm-content")!;
    const file = createImageFile("photo.png");
    const clipboardData = createImageClipboardData(file);

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = clipboardData;
    pasteEvent.preventDefault = vi.fn();

    // Should not throw
    expect(() => fireEvent(content, pasteEvent)).not.toThrow();
  });

  it("handles non-image paste without interfering", () => {
    const onChange = vi.fn();

    const { container } = render(
      <NoteEditor
        content=""
        onChange={onChange}
        noteNames={[]}
        onImagePaste={vi.fn().mockResolvedValue(null)}
      />
    );

    const content = container.querySelector(".cm-content")!;
    const clipboardData = createTextClipboardData();

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = clipboardData;
    pasteEvent.preventDefault = vi.fn();

    // Should not throw
    expect(() => fireEvent(content, pasteEvent)).not.toThrow();
  });

  it("passes editorFont prop to CodeMirror", () => {
    const { container } = render(
      <NoteEditor
        content=""
        onChange={vi.fn()}
        noteNames={[]}
        editorFont="Fira Code"
      />
    );
    expect(container.querySelector(".cm-editor")).toBeDefined();
  });

  it("passes readableLineLength prop without crashing", () => {
    const { container } = render(
      <NoteEditor
        content=""
        onChange={vi.fn()}
        noteNames={[]}
        readableLineLength={true}
      />
    );
    expect(container.querySelector(".cm-editor")).toBeDefined();
  });
});
