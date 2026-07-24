# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal academic homepage for Xiuyin Li, served via GitHub Pages at <https://lixiuyin.github.io>.
A hand-written static site — **no framework, no build step for the page itself**, no JS dependencies.
The only "build" is compiling the LaTeX résumé to a PDF.

## Purpose — who this is for

Xiuyin is a **Master of Data Science student at HKU** (expected Dec 2026, after a B.S. in Statistics at
Shandong University); the site centers his interests on **technical AI safety**, particularly the reliable
learning and evaluation of adaptive LLM agents. Both the homepage and the CV exist to support
**Research Assistant applications now** and a **future PhD application** (post-training and adaptation from
reliable feedback, data and verifiable tasks for interactive learning environments, and robust evaluation
of agent behavior under distribution shifts and repeated adaptation). The audience is academic: faculty, PI labs, and
admissions committees. This shapes content decisions:

- **Foreground research substance** — methods, results, quantitative outcomes (metrics, scale, ablations),
  and what was done from first principles. Lead with research and projects that signal PhD readiness.
- **Academic register** — precise, modest, evidence-backed. Avoid marketing/startup phrasing and buzzwords;
  prefer concrete contributions over adjectives.
- When deciding what to emphasize, cut, or how to phrase something, optimize for **a PI/committee skimming
  for research potential**, not a general/industry recruiter.
- **Claims must be accurate and verifiable.** Every metric, method name, and role label should match the
  project's actual source or report — verify against the source when adding or editing an entry, and never
  invent numbers (a faithful "R²≈0.95" beats a precise-looking but mislabeled figure). Role labels
  (`Project Lead` / `Personal`) reflect the user's real role; he is the authority on it, so
  confirm rather than guess.

## Commands

```bash
make serve                    # local preview at http://localhost:8000, opens the browser
python3 -m http.server 8000   # or serve manually (just opening index.html works too)

make cv         # compile assets/CV.tex -> assets/CV.pdf (needs XeLaTeX from TeX Live/MacTeX)
make            # = make cv deploy clean: build CV, then commit & push everything, then clean artifacts
make deploy     # git add . + commit + push only (no CV rebuild)
make clean      # remove LaTeX build artifacts (.aux, .log, .out)
make MSG="fix: typo"   # any target above, with a custom commit message (default: "chore: update site")
```

There is no lint or test suite — it's static HTML/CSS. `make reset-history` also exists but is
**destructive** (squashes all git history into one commit and force-pushes) — never run it unless the user
explicitly asks.

## Deployment

GitHub Pages serves the **root of `main`** directly.
Any push to `main` goes live in a minute or two. `make`/`make deploy` push to `main`, so a commit *is* a
deploy — there is no staging branch. Be deliberate about what you commit. A root `.nojekyll` file disables
Jekyll processing, so the raw files (including any starting with `_`) are served exactly as committed.

## Architecture & the one thing to get right

The site is three files plus assets:
- `index.html` — a sticky top nav, then all page content inline: a `.bio` block followed by semantic
  `<section>`s with ids `interests`, `research`, `projects`, `education`, `teaching`, `awards`, `skills`,
  `beyond` (the personal *Beyond Research* section), and `contact`. **All styling is inlined in a `<style>`
  block in `<head>`** (no separate stylesheet, so no render-blocking CSS request); it loads only `main.js`.
  The served HTML carries all content (important for SEO), with **no JS dependencies**.
- **Styles live in that `<style>` block** (formerly a separate `style.css`, inlined to cut the single
  render-blocking request). Theme is driven by CSS custom properties in `:root` (`--accent` navy, `--maxw`
  860px content width, serif/Georgia typography). Dark mode is driven by `[data-theme="dark"]` on `<html>`
  (set by an inline head script from the saved choice or the OS, and toggled by a nav button — see Interactive
  bits); `@media print` forces the vars back to light. So re-theming means editing one variable block. Reuse
  these variables and the existing `.entry` /
  `.entry-title` / `.entry-meta` patterns rather than introducing new ad-hoc styles. **To change styling, edit
  the `<style>` block in `index.html` directly** — there is no separate stylesheet to edit.
- `main.js` — three tiny vanilla, first-party scripts (loaded with `defer`, wrapped in one IIFE): one sets the
  footer year; one drives the collapsible sections and keeps the nav's scroll-offset in sync with the
  (wrap-aware) bar height; one (scrollspy) highlights the nav link for the section currently in view. Progressive
  enhancement — with JS off, every section/entry simply shows and the nav still links to every section.
- `assets/CV.tex` — the résumé source, a **separate, parallel copy of the same career content** (based on the
  Aras Gungore LaTeX template). `assets/CV.pdf` is the compiled output linked from the page; GitHub Pages does
  not run LaTeX, so rebuild it locally after every source change. **`CV.tex` is git-ignored (see the assets/
  allowlist below) — the LaTeX source is kept local and is *not* deployed; only the compiled `CV.pdf` ships.**
  So editing `CV.tex` leaves `git status` clean until you `make cv` and commit the regenerated `CV.pdf`.

**Interactive bits** (vanilla, progressive-enhancement — the page still works with JS off):
- **Skip link** (`.skip-link`) — the first focusable element; off-screen until keyboard-focused, then jumps
  past the nav to `#top`. Mouse users never see it.
- **Sticky top nav** (`.topnav`) links to the main sections; the jump offset is `scroll-padding-top`, set by
  `main.js` to the *live* nav height so headings land snugly at any width (the bar wraps on phones). A scrollspy
  sets `aria-current="location"` on the link whose section crosses the viewport's mid-line (the CSS targets
  `[aria-current]`, so the visual highlight and the screen-reader cue come from one source).
- **Theme toggle** (`.theme-toggle`) — an SVG sun/moon button in its own right-edge cluster (`.topnav-right`,
  kept out of `.topnav-links` so it reads as a control, not another destination). An inline head script sets
  `[data-theme]` on `<html>` from `localStorage('theme')` (or the OS setting on first visit) before first
  paint (no flash) and syncs the `theme-color` meta to match; the button flips light↔dark and persists the
  choice. CSS reads `[data-theme="dark"]` and swaps the icon via `display`; with JS off the page stays light.
- **Collapsible sections** — add `data-collapse-after="N"` (plus optional `data-collapse-noun="…"`) to any
  `.entry`-based `<section>` to show the first N entries and tuck the rest behind a toggle. That number is the
  single knob; with JS off, every entry simply shows.
- **Print** — `@media print` hides the nav and toggles and **expands the collapsed entries**, so saving the
  page to PDF includes every project rather than only the top three.

**Content lives in two places that must be kept in sync.** The homepage (`index.html`) and the résumé
(`assets/CV.tex`) describe the same projects, education, skills, and awards.

**`assets/CV.tex` is the compact source for one-page résumé content.** Keep facts shared with `index.html`
consistent in both places, while adapting the level of detail to each format. Then run `make cv` so
`CV.pdf` reflects the source before deployment.

**Projects are an exception to strict parity — the site is a superset.** The one-page CV shows only the
strongest few projects (space-limited); `index.html` should list *more*, never fewer — it is the full
showcase. So **never trim a site-only project just to match the CV.** But for any project that appears in
*both*, the site's description must be **at least as complete as the CV's (never thinner)** and kept
consistent with it — when a shared project's CV entry gains a detail (e.g. a tech-stack note), propagate
that detail into the site. The site orders projects on its own logic (e.g. reverse-chronological) — only
the *content* of shared projects must stay consistent; their order need not match the CV.

**Selected Projects layout.** The `#projects` section opens with the strongest projects as full `.entry` blocks — each carrying an
`.entry-meta` role/date label (`Project Lead`, `Independent`, …). Lower-signal or older work is
folded into a single trailing `.entry` titled *Additional Projects*: a compact, role-neutral bulleted list
(`ul.more-projects`), one project per item with a concise implementation/result summary. That list is the usual home
for the site's superset breadth — add an `<li>` there rather than spinning up a thin full entry. `data-collapse-after="3"` shows only
the top three by default; the rest (including *Additional projects*) sit behind the toggle.

**CV-only vs site-only content:**
- **CV-only — do NOT propagate to the site:** the full coursework lists, language-test scores (IELTS/CET),
  and the header objective line ("Seeking RA … Aspiring AI PhD"). The site's Education is intentionally
  GPA-only, and its bio paragraph already conveys the objective.
- **Site-only — the CV has no equivalent:** the bio paragraph, expanded research-interest descriptions,
  additional projects, and the *Personal* line. These live only in `index.html`.
- **Publications (once they exist):** list on *both*; `CV.tex` is the source → propagate to the site like
  any other shared content.

## Identity & SEO metadata (`<head>` + root files)

The `<head>` carries Open Graph + Twitter-card tags and a JSON-LD `Person` schema; the repo root has
`robots.txt` and `sitemap.xml`. The same identity is encoded in several places — so when you change the
name, role, affiliation, bio, or research interests in `index.html`, **also update the matching `og:*` /
`twitter:*` `content`, the JSON-LD fields, and `meta name="description"`/`"author"`** so they don't drift.

The site is intentionally discoverable under all of **Xiuyin Li · Li Xiuyin · 李袖印 · lixiuyin** — these
variants appear across the `<h1>`, `meta description`, `meta author`, and JSON-LD `alternateName`; keep all
four represented. `og:image` is `assets/og-banner.jpg` (a 1200×630 social card, separate from the portrait).

## assets/ — gitignore allowlist & gotchas

`.gitignore` ignores everything under `assets/` **except** `*.pdf`, `*.woff2`, and common image formats — then a
trailing `assets/*.tex` rule **re-ignores the LaTeX source**, so **`CV.tex` is deliberately *not* tracked or
deployed** (only the compiled `CV.pdf` ships). LaTeX build artifacts (`.aux`/`.log`/`.out`) are ignored too, so
nothing is committed by accident. If you add a new asset type that *should* ship (e.g. a `.bib`), add an
allowlist exception **after** the `assets/*` line or it won't be tracked or deployed. (To ship the CV source
itself, remove the `assets/*.tex` line.)

- **Portrait.** The page loads `photo.jpg`; `CV.tex` includes the same image extension-less with
  `\includegraphics{photo}`.
- **`zh-name.woff2`** is a 3-glyph subset of Source Han Serif SC (OFL), embedded via `@font-face` so the
  Chinese name 李袖印 renders identically on every device (the system Songti SC fallback differs Mac vs iOS,
  and Apple's Songti can't be legally embedded). Don't swap it for a system-font fallback or drop the file.
