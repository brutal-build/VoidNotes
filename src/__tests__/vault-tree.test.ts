import { describe, expect, it } from "vitest";
import { buildVaultTree, flattenVisibleTree, treeItemId, type VaultTreeNode } from "../services/vault-tree";

describe("vault tree foundations", () => {
  it("uses full paths as stable identities and models empty folders", () => {
    const tree = buildVaultTree(["a/shared/note.md", "b/shared/note.md"], ["empty", "a/blank"]);
    expect(treeItemId("folder", "a/shared")).not.toBe(treeItemId("folder", "b/shared"));
    expect(tree.children.map((item) => item.path)).toEqual(["a", "b", "empty"]);
    const a = tree.children[0];
    expect(a.type).toBe("folder");
    if (a.type !== "folder") throw new Error("expected folder");
    expect(a.children.map((item) => item.path)).toContain("a/blank");
  });

  it("flattens only expanded descendants in semantic navigation order", () => {
    const tree = buildVaultTree(["root.md", "folder/a.md", "folder/deep/b.md"], []);
    expect(flattenVisibleTree(tree, new Set()).map((item) => item.path)).toEqual(["folder", "root.md"]);
    expect(flattenVisibleTree(tree, new Set(["folder"])).map((item) => item.path)).toEqual(["folder", "folder/deep", "folder/a.md", "root.md"]);
  });
});
