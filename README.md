# lazyworktrees

A sleek CLI tool for quickly switching between git worktrees.

## Requirements

- [Bun](https://bun.sh/) runtime

## Installation

```bash
git clone <repo-url>
cd lazyworktrees
bun install
bun link
```

After linking, the `lazyworktrees` command is available globally.

Then add this shell function to your `~/.zshrc` (or `~/.bashrc`):

```bash
wt() { cd "$(lazyworktrees)" }
```

Reload your shell:

```bash
source ~/.zshrc
```

## Usage

Run `wt` inside any git repository to interactively select and switch to a worktree:

```bash
wt
```

The CLI prints the selected worktree path to stdout while rendering the UI to stderr, so the `wt` shell function can `cd` into it.

You can also run it directly without the alias:

```bash
lazyworktrees
```

Or without installing globally:

```bash
bun run dev
```
