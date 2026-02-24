import { describe, test, expect } from "bun:test";
import { isGitRepo, getWorktrees } from "./git";

describe("isGitRepo", () => {
  test("returns true in a git repo", async () => {
    const result = await isGitRepo();
    expect(result).toBe(true);
  });

  test("returns false outside a git repo", async () => {
    const result = await isGitRepo("/tmp");
    expect(result).toBe(false);
  });
});

describe("getWorktrees", () => {
  test("returns at least one worktree in current repo", async () => {
    const worktrees = await getWorktrees();
    expect(worktrees.length).toBeGreaterThanOrEqual(1);
    expect(worktrees[0].branch).toBeTruthy();
    expect(worktrees[0].path).toBeTruthy();
  });
});
