# lazyworktrees Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Bun CLI that lists git worktrees and lets users interactively select one to navigate to.

**Architecture:** Single-file CLI parses `git worktree list --porcelain`, presents an interactive select menu via `@clack/prompts` (rendered to stderr), and prints the selected path to stdout.

**Tech Stack:** Bun, TypeScript, @clack/prompts

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts` (empty placeholder)

**Step 1: Initialize the Bun project**

Create `package.json`:

```json
{
  "name": "lazyworktrees",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "lazyworktrees": "./src/index.ts"
  },
  "scripts": {
    "dev": "bun run src/index.ts",
    "test": "bun test"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "dependencies": {
    "@clack/prompts": "^0.10"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

Create `src/index.ts`:

```ts
#!/usr/bin/env bun
console.error("lazyworktrees: not yet implemented");
process.exit(1);
```

**Step 2: Install dependencies**

Run: `bun install`
Expected: lockfile created, node_modules populated

**Step 3: Verify the placeholder runs**

Run: `bun run src/index.ts`
Expected: prints "lazyworktrees: not yet implemented" to stderr, exits 1

**Step 4: Commit**

```bash
git add package.json tsconfig.json bun.lock src/index.ts .gitignore
git commit -m "feat: scaffold lazyworktrees project with bun"
```

---

### Task 2: Git Worktree Parsing

**Files:**
- Create: `src/git.ts`
- Create: `src/git.test.ts`

**Step 1: Write the failing tests**

Create `src/git.test.ts`:

```ts
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
    // bare entries should be skipped
    expect(result).toEqual([
      { path: "/home/user/bare-repo-wt", branch: "main", isDetached: false },
    ]);
  });

  test("returns empty array for empty input", () => {
    expect(parseWorktreeList("")).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/git.test.ts`
Expected: FAIL — `parseWorktreeList` not found

**Step 3: Implement the parser**

Create `src/git.ts`:

```ts
export interface Worktree {
  path: string;
  branch: string;
  isDetached: boolean;
}

export function parseWorktreeList(output: string): Worktree[] {
  if (!output.trim()) return [];

  const worktrees: Worktree[] = [];
  const blocks = output.trim().split("\n\n");

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    let path = "";
    let branch = "";
    let isDetached = false;
    let isBare = false;
    let head = "";

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        path = line.slice("worktree ".length);
      } else if (line.startsWith("branch ")) {
        const ref = line.slice("branch ".length);
        branch = ref.replace("refs/heads/", "");
      } else if (line === "detached") {
        isDetached = true;
      } else if (line === "bare") {
        isBare = true;
      } else if (line.startsWith("HEAD ")) {
        head = line.slice("HEAD ".length);
      }
    }

    if (isBare) continue;

    if (isDetached) {
      branch = head.slice(0, 7);
    }

    worktrees.push({ path, branch, isDetached });
  }

  return worktrees;
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/git.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/git.ts src/git.test.ts
git commit -m "feat: add git worktree porcelain parser with tests"
```

---

### Task 3: Git Command Helpers

**Files:**
- Modify: `src/git.ts`
- Create: `src/git-commands.test.ts`

**Step 1: Write failing tests for git helpers**

Create `src/git-commands.test.ts`:

```ts
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
```

**Step 2: Run tests to verify they fail**

Run: `bun test src/git-commands.test.ts`
Expected: FAIL — `isGitRepo` and `getWorktrees` not exported

**Step 3: Implement git command helpers**

Add to `src/git.ts`:

```ts
export async function isGitRepo(cwd?: string): Promise<boolean> {
  const proc = Bun.spawn(["git", "rev-parse", "--git-dir"], {
    cwd,
    stdout: "ignore",
    stderr: "ignore",
  });
  const code = await proc.exited;
  return code === 0;
}

export async function getWorktrees(): Promise<Worktree[]> {
  const proc = Bun.spawn(["git", "worktree", "list", "--porcelain"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return parseWorktreeList(output);
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test src/git-commands.test.ts`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add src/git.ts src/git-commands.test.ts
git commit -m "feat: add isGitRepo and getWorktrees helpers"
```

---

### Task 4: CLI Entry Point

**Files:**
- Modify: `src/index.ts`

**Step 1: Implement the full CLI**

Replace `src/index.ts` with:

```ts
#!/usr/bin/env bun

import { select, isCancel, cancel, intro, outro } from "@clack/prompts";
import { isGitRepo, getWorktrees } from "./git";

async function main() {
  if (!(await isGitRepo())) {
    console.error("Not a git repository.");
    process.exit(1);
  }

  const worktrees = await getWorktrees();

  if (worktrees.length <= 1) {
    console.error("No worktrees found.");
    process.exit(1);
  }

  const cwd = process.cwd();

  // Determine max branch name length for alignment
  const maxBranchLen = Math.max(...worktrees.map((wt) => wt.branch.length));

  // Render clack UI to stderr so stdout stays clean for the path
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = process.stderr.write.bind(process.stderr);

  intro("Select a worktree");

  const selected = await select({
    message: "Switch to:",
    options: worktrees.map((wt) => {
      const isCurrent = wt.path === cwd;
      const label = wt.branch.padEnd(maxBranchLen + 2) + wt.path;
      return {
        value: wt.path,
        label: isCurrent ? `${label}  (current)` : label,
      };
    }),
  });

  if (isCancel(selected)) {
    cancel();
    process.stdout.write = originalWrite;
    process.exit(1);
  }

  outro(`Switching to ${selected}`);

  // Restore stdout and print path
  process.stdout.write = originalWrite;
  console.log(selected);
}

main();
```

**Step 2: Manually test the CLI**

Run (inside the lazyworktrees repo, which only has one worktree):
```bash
bun run src/index.ts
```
Expected: stderr prints "No worktrees found." and exits 1

Run (from a non-git directory):
```bash
cd /tmp && bun /path/to/lazyworktrees/src/index.ts
```
Expected: stderr prints "Not a git repository." and exits 1

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: implement CLI entry point with interactive worktree selection"
```

---

### Task 5: Make Binary Executable + .gitignore

**Files:**
- Modify: `src/index.ts` (chmod)
- Create: `.gitignore`

**Step 1: Make the entry point executable and create .gitignore**

```bash
chmod +x src/index.ts
```

Create `.gitignore`:

```
node_modules/
```

**Step 2: Test running via bun link**

```bash
bun link
```

Then in a git repo with multiple worktrees, run:
```bash
lazyworktrees
```

Expected: interactive selection appears, selecting one prints the path to stdout

**Step 3: Commit**

```bash
git add .gitignore src/index.ts
git commit -m "feat: make CLI executable and add .gitignore"
```

---

### Task 6: End-to-End Verification

**Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

**Step 2: E2E test with a real worktree**

Create a temp repo with worktrees and test:

```bash
cd /tmp
mkdir wt-test && cd wt-test && git init && git commit --allow-empty -m "init"
git worktree add ../wt-test-feature -b feature
cd /tmp/wt-test
bun /path/to/lazyworktrees/src/index.ts
```

Expected: interactive select showing `main` and `feature` worktrees. Selecting one prints the path.

**Step 3: Test the shell function pattern**

```bash
cd "$(bun /path/to/lazyworktrees/src/index.ts)"
pwd
```

Expected: you're in the selected worktree directory

**Step 4: Clean up test repos**

```bash
cd /tmp/wt-test && git worktree remove ../wt-test-feature
rm -rf /tmp/wt-test
```

**Step 5: Final commit if any fixes needed**
