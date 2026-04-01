#!/usr/bin/env bun

import { SelectPrompt, isCancel } from "@clack/core";
import color from "picocolors";
import { isGitRepo, getWorktrees } from "./git";

const S_BAR = "│";
const S_BAR_END = "└";
const S_RADIO_ACTIVE = "●";
const S_RADIO_INACTIVE = "○";
const S_STEP_SUBMIT = "◇";
const S_STEP_CANCEL = "◆";
const S_STEP_ACTIVE = "◆";

function stderr(msg: string) {
  process.stderr.write(`${msg}\n`);
}

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
  const maxBranchLen = Math.max(...worktrees.map((wt) => wt.branch.length));

  const options = worktrees.map((wt) => {
    const isCurrent = wt.path === cwd;
    const branch = wt.branch.padEnd(maxBranchLen + 2);
    const path = color.dim(wt.path);
    const suffix = isCurrent ? color.dim("  (current)") : "";
    return {
      value: wt.path,
      label: `${branch}${path}${suffix}`,
    };
  });

  // Intro
  stderr(`${color.gray(S_BAR)}`);
  stderr(`${color.green(S_STEP_ACTIVE)}  Select a worktree`);

  const selected = await new SelectPrompt({
    options,
    output: process.stderr,
    render() {
      const title = `${color.gray(S_BAR)}  Switch to:`;

      switch (this.state) {
        case "submit":
          return `${title}\n${color.gray(S_BAR)}  ${color.dim(options[this.cursor].label)}`;
        case "cancel":
          return `${title}\n${color.gray(S_BAR)}  ${color.strikethrough(color.dim(options[this.cursor].label))}`;
        default: {
          // Use a sliding window to prevent terminal overflow and duplicate rendering
          const maxVisible = Math.max(1, (process.stderr.rows || 24) - 4);
          const total = options.length;
          let start: number;
          let end: number;

          if (total <= maxVisible) {
            start = 0;
            end = total;
          } else {
            const half = Math.floor(maxVisible / 2);
            start = this.cursor - half;
            end = start + maxVisible;
            if (start < 0) {
              start = 0;
              end = maxVisible;
            } else if (end > total) {
              end = total;
              start = end - maxVisible;
            }
          }

          const lines: string[] = [];
          if (start > 0) {
            lines.push(color.dim(`↑ ${start} more`));
          }
          for (let i = start; i < end; i++) {
            const opt = options[i];
            if (i === this.cursor) {
              lines.push(`${color.green(S_RADIO_ACTIVE)} ${opt.label}`);
            } else {
              lines.push(`${color.dim(S_RADIO_INACTIVE)} ${color.dim(opt.label)}`);
            }
          }
          if (end < total) {
            lines.push(color.dim(`↓ ${total - end} more`));
          }

          const opts = lines.join(`\n${color.cyan(S_BAR)}  `);
          return `${title}\n${color.cyan(S_BAR)}  ${opts}\n${color.cyan(S_BAR_END)}`;
        }
      }
    },
  }).prompt();

  if (isCancel(selected)) {
    stderr(`${color.gray(S_BAR)}`);
    process.exit(1);
  }

  // Outro
  stderr(`${color.gray(S_BAR)}`);
  stderr(`${color.gray(S_BAR_END)}  ${color.dim(`Switching to ${selected}`)}`);

  // Only the path goes to stdout
  console.log(selected);
}

main();
