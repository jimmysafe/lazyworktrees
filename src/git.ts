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
