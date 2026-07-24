# lixiuyin.github.io

Personal academic homepage for **Xiuyin Li** — served at <https://lixiuyin.github.io>.

A static page (`index.html` with inline CSS, plus a small `main.js` file for the
sticky nav, theme toggle, and collapsible projects) and a LaTeX résumé (`assets/CV.tex`)
compiled to the `assets/CV.pdf` that the page links to.

## What's on the page
Bio, research interests, the B.S. thesis, a curated **Selected Projects** showcase,
education, awards, skills, and personal interests. The projects section is a
*superset* of the one-page `CV.pdf`: the strongest projects have full entries,
with four more summarized under **Additional Projects**.

## Structure
```
index.html         # page content and styles
main.js            # progressive-enhancement behavior
assets/CV.tex      # résumé source (XeLaTeX)
assets/CV.pdf      # compiled résumé, linked from the page
assets/photo.jpg   # profile photo used by the page and CV
Makefile           # build the CV + commit/push helpers
CLAUDE.md          # repo guidance for Claude Code (content-sync rules, conventions)
```

## Edit
- **Page content** → `index.html`
- **Styling** → the `<style>` block in `index.html`
- **Interactions** → `main.js`
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
