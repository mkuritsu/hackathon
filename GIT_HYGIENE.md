# Git Hygiene

How we branch, review, and ship during the hackathon. Keep it simple, keep
`main` demoable at all times.

## Branch model

```
main        prod / demo. ALWAYS works. Always presentable. The last-known-good
            checkpoint we can fall back to on stage.
  ^
staging     integration. Where everyone's changes meet and we're allowed to
            break things. Nothing reaches main except from here.
  ^
<person>    per-person feature branches. Where individual work happens.
```

Flow of changes: `<person>` → **MR** → `staging` → (integrate + verify) → **MR** → `main`.

### Rules
- **Never commit or push directly to `main`.** `main` only ever moves via a
  reviewed MR from `staging`.
- **`main` must always build and run.** It is the demo. If it's broken, that's
  a fire.
- **`staging` is allowed to break.** That's the point — break it there, not on main.
- **Approvals:** commits do **not** need approval — commit freely on your branch
  and into staging. **Only MRs need review/approval**, and it matters most for
  the `staging → main` MR (that's the gate protecting the demo).
- Tag presentable checkpoints on `main` (e.g. `git tag demo-checkpoint-1`) so we
  can always roll back to a known-good state.

### Branch naming
- Person branches: `gui/...`, `ai/...`, `fe/...`, `product/...` or `<name>/<topic>`.
- Keep topics small and focused: `gui/d1-schema`, `ai/analyst-prompt`, `fe/dashboard`.

### Commit messages
- Short, one-line subject. Body only if it carries real info. No filler.
- Commits don't need sign-off; just keep them sane.

---

## glab CLI cheat sheet

We use the GitLab CLI (`glab`) for all MR work. Auth once:

```sh
glab auth status            # confirm you're logged in
glab auth login             # if not
```

### Start a person branch off staging
```sh
git checkout staging
git pull
git checkout -b gui/my-topic
# ... work, commit freely ...
git push -u origin gui/my-topic
```

### Open an MR from your branch into staging
```sh
glab mr create \
  --source-branch gui/my-topic \
  --target-branch staging \
  --title "Short title" \
  --description "What and why." \
  --remove-source-branch
```

### Review / check out someone's MR
```sh
glab mr list                # see open MRs
glab mr view <id>           # details
glab mr checkout <id>       # pull it locally to test
```

### Merge an MR (once approved)
```sh
glab mr merge <id>
```

### Promote staging → main (the protected gate)
```sh
glab mr create \
  --source-branch staging \
  --target-branch main \
  --title "Promote to main: <what>" \
  --description "Release notes. Confirm it builds + demos." 
# review, then:
glab mr merge <id>
```

### Handy
```sh
glab mr list --target-branch main   # what's queued for prod
glab ci status                      # pipeline status if CI is set up
git tag demo-checkpoint-1 && git push origin demo-checkpoint-1
```

---

## TL;DR
- Work on your own branch → MR into `staging`.
- Break things on `staging`, not `main`.
- `staging → main` only via reviewed MR; `main` is always the working demo.
- Commits: no approval. MRs: approval required (especially into `main`).
