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

## Usage

Run inside any git repository:

```bash
lazyworktrees
```

This will display an interactive list of your worktrees. Select one to navigate to it.

You can also run it without installing globally:

```bash
bun run dev
```
