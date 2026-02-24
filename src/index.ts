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
