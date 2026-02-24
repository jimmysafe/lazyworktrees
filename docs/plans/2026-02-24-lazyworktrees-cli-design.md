# lazyworktrees CLI Design

## Summary

A Bun-based CLI tool that lists git worktrees in the current repository and lets the user interactively select one to navigate to.

## Architecture

Single-file CLI (`src/index.ts`) that:

1. Runs `git worktree list --porcelain` to get all worktrees
2. Parses the porcelain output into structured data (path + branch)
3. Presents an interactive select menu via `@clack/prompts`
4. Prints the selected path to **stdout** (all UI output goes to **stderr**)

## Flow

```
Run `lazyworktrees`
  -> Not in a git repo? -> stderr: "Not a git repository" + exit 1
  -> Only 1 worktree (main, no extras)? -> stderr: "No worktrees found" + exit 1
  -> Multiple worktrees? -> Show select menu (on stderr)
    -> User selects one -> Print path to stdout
    -> User cancels (Ctrl+C) -> exit 1, no output
```

## Display Format

Each entry in the select list shows branch name (left-aligned) and path (dimmed, right):

```
feature/auth  ~/projects/myrepo-auth
main          ~/projects/myrepo         (current)
```

The worktree matching the current working directory is marked with `(current)`.

## Shell Integration

Users add to `.zshrc`/`.bashrc`:

```sh
wt() { cd "$(lazyworktrees)" }
```

The binary is named `lazyworktrees`, the shell function is `wt`.

## Project Structure

```
lazyworktrees/
├── package.json          # name: lazyworktrees, bin: lazyworktrees
├── tsconfig.json
├── src/
│   └── index.ts          # All CLI logic
```

## Dependencies

- **Runtime:** `@clack/prompts`
- **Dev:** `typescript`, `@types/bun`

## Error Handling

| Condition | Behavior |
|-----------|----------|
| Not a git repo | stderr message + exit 1 |
| Only main worktree (no added worktrees) | stderr "No worktrees found" + exit 1 |
| User cancels selection (Ctrl+C) | Silent exit 1 |
| `git` not installed | stderr message + exit 1 |

## Decisions

- **stdout vs stderr:** All interactive UI renders to stderr. Only the final selected path goes to stdout. This enables `cd "$(lazyworktrees)"` to work cleanly.
- **Include main worktree:** Yes, all worktrees shown including the original.
- **Porcelain format:** Used instead of human-readable `git worktree list` for reliable parsing.
