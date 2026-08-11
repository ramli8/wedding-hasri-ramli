# RTK - Token Optimization Instructions

## CRITICAL: Always Use `rtk` Prefix for Terminal Commands

RTK is a CLI proxy that reduces LLM token consumption by **60–90%** by filtering and compressing command output before it reaches your context.

**Binary location:** `~/.local/bin/rtk` (make sure it's in PATH)

---

## Mandatory Command Rewrites

Whenever you execute shell commands, **always** prepend `rtk` as follows:

### File Operations
| Instead of | Use |
|---|---|
| `ls` | `rtk ls` |
| `ls -la` | `rtk ls` |
| `cat <file>` | `rtk read <file>` |
| `head <file>` | `rtk read <file>` |
| `tail <file>` | `rtk read <file>` |
| `grep <pattern>` | `rtk grep <pattern>` |
| `rg <pattern>` | `rtk grep <pattern>` |
| `find <pattern>` | `rtk find <pattern>` |
| `diff file1 file2` | `rtk diff file1 file2` |

### Git
| Instead of | Use |
|---|---|
| `git status` | `rtk git status` |
| `git diff` | `rtk git diff` |
| `git log` | `rtk git log` |
| `git add` | `rtk git add` |
| `git commit -m "msg"` | `rtk git commit -m "msg"` |
| `git push` | `rtk git push` |
| `git pull` | `rtk git pull` |

### GitHub CLI
| Instead of | Use |
|---|---|
| `gh pr list` | `rtk gh pr list` |
| `gh pr view <n>` | `rtk gh pr view <n>` |
| `gh issue list` | `rtk gh issue list` |
| `gh run list` | `rtk gh run list` |

### Test Runners
| Instead of | Use |
|---|---|
| `cargo test` | `rtk cargo test` |
| `npm test` | `rtk err npm test` |
| `pytest` | `rtk pytest` |
| `go test` | `rtk go test` |
| `vitest run` | `rtk vitest run` |
| `playwright test` | `rtk playwright test` |

### Build & Lint
| Instead of | Use |
|---|---|
| `cargo build` | `rtk cargo build` |
| `cargo clippy` | `rtk cargo clippy` |
| `tsc` | `rtk tsc` |
| `eslint` | `rtk lint` |
| `biome check` | `rtk lint biome` |
| `prettier --check .` | `rtk prettier --check .` |
| `ruff check` | `rtk ruff check` |
| `golangci-lint run` | `rtk golangci-lint run` |
| `next build` | `rtk next build` |

### Package Managers
| Instead of | Use |
|---|---|
| `pnpm list` | `rtk pnpm list` |
| `pip list` | `rtk pip list` |
| `pip install` | `rtk pip install` |

### Docker & Kubernetes
| Instead of | Use |
|---|---|
| `docker ps` | `rtk docker ps` |
| `docker images` | `rtk docker images` |
| `docker logs <c>` | `rtk docker logs <c>` |
| `docker compose ps` | `rtk docker compose ps` |
| `kubectl get pods` | `rtk kubectl pods` |
| `kubectl logs <pod>` | `rtk kubectl logs <pod>` |
| `kubectl get services` | `rtk kubectl services` |

### Networking & Data
| Instead of | Use |
|---|---|
| `curl <url>` | `rtk curl <url>` |
| `wget <url>` | `rtk wget <url>` |

---

## Global Flags (optional)

- `-u` / `--ultra-compact` — ASCII icons, extra token savings (e.g. `rtk -u ls`)
- `rtk summary <command>` — heuristic summary for any command not listed above
- `rtk proxy <command>` — raw passthrough with token tracking

---

## Rules for AI Agent

1. **Never run bare `ls`, `cat`, `grep`, `git`, `docker`, `kubectl`, etc.** Always use the `rtk` equivalent.
2. If a command is not listed above, use `rtk summary <command>` to get a compressed output.
3. If `rtk` is not installed yet, install it first:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
   export PATH="$HOME/.local/bin:$PATH"
   ```
4. Verify installation with: `rtk --version`
5. Check token savings with: `rtk gain`

---

## Why This Matters

Without RTK, a single 30-minute coding session can consume ~118,000 tokens on command outputs alone.
With RTK, that drops to ~24,000 tokens — an **80% reduction**.

| Command | Standard | With RTK | Savings |
|---|---|---|---|
| `ls` / `tree` (10x) | 2,000 | 400 | -80% |
| `cat` / `read` (20x) | 40,000 | 12,000 | -70% |
| `grep` / `rg` (8x) | 16,000 | 3,200 | -80% |
| `git status` (10x) | 3,000 | 600 | -80% |
| `cargo test` / `npm test` (5x) | 25,000 | 2,500 | -90% |
| **Total** | **~118,000** | **~23,900** | **-80%** |
