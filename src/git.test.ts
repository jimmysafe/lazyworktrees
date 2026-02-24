import { describe, test, expect } from "bun:test";
import { parseWorktreeList } from "./git";

describe("parseWorktreeList", () => {
  test("parses single worktree", () => {
    const input = `worktree /home/user/project
HEAD abc123
branch refs/heads/main
`;
    const result = parseWorktreeList(input);
    expect(result).toEqual([
      { path: "/home/user/project", branch: "main", isDetached: false },
    ]);
  });

  test("parses multiple worktrees", () => {
    const input = `worktree /home/user/project
HEAD abc123
branch refs/heads/main

worktree /home/user/project-feature
HEAD def456
branch refs/heads/feature/auth
`;
    const result = parseWorktreeList(input);
    expect(result).toEqual([
      { path: "/home/user/project", branch: "main", isDetached: false },
      {
        path: "/home/user/project-feature",
        branch: "feature/auth",
        isDetached: false,
      },
    ]);
  });

  test("handles detached HEAD", () => {
    const input = `worktree /home/user/project-detached
HEAD abc123
detached
`;
    const result = parseWorktreeList(input);
    expect(result).toEqual([
      {
        path: "/home/user/project-detached",
        branch: "abc123",
        isDetached: true,
      },
    ]);
  });

  test("handles bare repository entry", () => {
    const input = `worktree /home/user/bare-repo
bare

worktree /home/user/bare-repo-wt
HEAD abc123
branch refs/heads/main
`;
    const result = parseWorktreeList(input);
    expect(result).toEqual([
      { path: "/home/user/bare-repo-wt", branch: "main", isDetached: false },
    ]);
  });

  test("returns empty array for empty input", () => {
    expect(parseWorktreeList("")).toEqual([]);
  });
});
