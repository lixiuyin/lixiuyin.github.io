# lixiuyin.github.io

Personal academic homepage for **Xiuyin Li** — served at <https://lixiuyin.github.io>.

A static page (`index.html` + `style.css`, no framework — just a little vanilla JS
for the sticky nav and collapsible sections) plus a LaTeX résumé (`assets/CV.tex`)
compiled to the `assets/CV.pdf` that the page links to.

## What's on the page
Bio, research interests, publications (a placeholder until the first one lands), news, the B.S. thesis,
a curated **Selected Projects** showcase, education, awards, and skills. The projects section is a *superset*
of the one-page `CV.pdf` — it lists more, with the strongest as full entries and the rest summarized in a
trailing *Additional projects* line.

## Structure
```
index.html         # the page (content)
style.css          # styles
assets/CV.tex      # résumé source (XeLaTeX) — local-only, not committed/deployed
assets/CV.pdf      # compiled résumé, linked from the page
assets/photo.jpg   # profile photo (web); photo.png is the high-res version used by the CV
Makefile           # build the CV + commit/push helpers
CLAUDE.md          # repo guidance for Claude Code (content-sync rules, conventions)
.nojekyll          # serve files as-is (skip Jekyll processing)
```

## Edit
- **Page content** → `index.html`
- **Styling** → `style.css`
- **Résumé** → `assets/CV.tex`, then rebuild with `make cv`

## Local preview
```bash
make serve                    # serve at http://localhost:8000 and open it in the browser
python3 -m http.server 8000   # or serve manually, then open http://localhost:8000
```

## Build the CV
Requires XeLaTeX (TeX Live / MacTeX).
```bash
make cv     # compiles assets/CV.tex -> assets/CV.pdf
```

## Deploy
Published with GitHub Pages from the `main` branch (root); the site goes live at
<https://lixiuyin.github.io> a minute or two after each push.

```bash
make                    # build the CV, then commit & push everything
make deploy             # commit & push only (no CV rebuild)
make MSG="fix: typo"    # same, with a custom commit message
```

## Make targets
| Command | Action |
|---|---|
| `make` | Build the CV, then commit & push everything |
| `make cv` | Compile `assets/CV.tex` → `assets/CV.pdf` |
| `make serve` | Serve locally at `:8000` and open the browser |
| `make deploy` | `git add .` + commit + push |
| `make clean` | Remove LaTeX build artifacts (`.aux`, `.log`, `.out`) |
| `make reset-history` | **Destructive:** squash all history into one `initial commit` and force-push (asks for `yes`) |

The default commit message is `chore: update site`; override it with `make MSG="…"`.
