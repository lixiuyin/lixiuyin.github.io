# lixiuyin.github.io

Personal academic homepage for **Xiuyin Li** — served at <https://lixiuyin.github.io>.

A static page (`index.html` with inline CSS, plus a small `main.js` file for the
sticky nav, scrollspy, theme toggle, and collapsible sections) and a LaTeX résumé
(`assets/CV.tex`) compiled to the `assets/CV.pdf` that the page links to.

## What's on the page
Bio, research interests, research experience (the B.S. thesis and a synthetic-control
collaboration), a curated **Selected Projects** showcase, education, teaching, honors
& awards, technical skills, personal interests, and contact details. The projects
section is a *superset* of the one-page `CV.pdf`: the strongest projects have full
entries, with additional work summarized under **Additional Projects**.

## Structure
```
index.html         # page content and styles
main.js            # progressive-enhancement behavior
assets/CV.tex      # résumé source (XeLaTeX)
assets/CV.pdf      # compiled résumé, linked from the page
assets/photo.jpg   # profile photo used by the page and CV
Makefile           # safe checks, CV build, preview, and deployment helpers
robots.txt         # crawler rules
sitemap.xml        # page map for search engines
.nojekyll          # serve raw files as-is, skipping Jekyll processing
```

`assets/` also carries `favicon.svg`, `og-banner.jpg` (the 1200×630 social card),
and `zh-name.woff2` (a three-glyph font subset so the Chinese name renders
identically everywhere).

## Edit
- **Page content** → `index.html`
- **Styling** → the `<style>` block in `index.html`
- **Interactions** → `main.js`
- **Résumé** → `assets/CV.tex`, then rebuild with `make cv`

## Local preview
```bash
make serve                    # serve at http://localhost:8000 and open it in the browser
make stop                     # stop this project's preview server
python3 -m http.server 8000   # or serve manually, then open http://localhost:8000
```

## Build the CV
Requires `latexmk` with XeLaTeX (TeX Live / MacTeX).
```bash
make cv     # compiles assets/CV.tex -> assets/CV.pdf
```

## Deploy
Published with GitHub Pages from the `main` branch (root); the site goes live at
<https://lixiuyin.github.io> a minute or two after each push.

```bash
make publish                         # build CV, check, commit, push, and clean
make deploy                          # check, commit, and push without rebuilding the CV
make publish MSG="fix: typo"         # publish with a custom commit message
```

Both deployment commands refuse to run outside `main`, stage only the explicit
site-file allowlist, and stop if unrelated files were already staged. Running
plain `make` is safe: it only displays the command summary.

## Make targets
| Command | Action |
|---|---|
| `make` / `make help` | Display available commands; make no changes |
| `make check` | Validate JavaScript, XML/SVG, Git whitespace, local resources, and the CV artifact |
| `make cv` | Compile `assets/CV.tex` → `assets/CV.pdf` |
| `make serve` | Serve locally at `:8000`, reusing an existing project server |
| `make stop` | Stop this project's preview server on the selected port |
| `make deploy` | Check, stage the deploy allowlist, commit, and push |
| `make publish` | Build the CV, deploy, then remove build artifacts |
| `make clean` | Remove LaTeX build artifacts while retaining `CV.pdf` |
| `make reset-history` | **Destructive maintenance only:** replace `main` history with one commit after an exact confirmation phrase |

The default commit message is `chore: update site`; override it with `make MSG="…"`.

`make reset-history` is deliberately excluded from every normal dependency. It
checks the current branch and remote tip, then uses `--force-with-lease`; run it
only when rewriting the repository history is explicitly intended.
