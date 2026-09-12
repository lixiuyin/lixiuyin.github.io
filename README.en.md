# lixiuyin.github.io

**English** | [简体中文](README.md)

The Chinese personal homepage of Xiuyin Li, published at <https://lixiuyin.github.io> and maintained primarily for internship applications in Agent development, Agent evaluation, and applied AI.

The root URL serves the Chinese homepage directly without a redirect. `zh.html` is a generated compatibility mirror of `index.html` and also renders the page directly. Both use the root URL as canonical, preserving older links while avoiding redirect loops caused by stale caches.

## Page content

The public internship-oriented page contains:

- availability and technical interests;
- recruiter-oriented project experience;
- technical skills;
- education and honors;
- contact and project-repository links.

Project descriptions emphasize Agent architecture, tool use, RAG, memory, reliability evaluation, and failure analysis. The website can present a broader project set than a one-page CV. Research-methods, teaching, and personal-interest sections may remain archived in source but are not exposed in the current internship-facing page.

## Repository layout

```text
index.html             # authored Chinese homepage and styles, served at /
zh.html                # generated, redirect-free compatibility mirror
main.js                # navigation, scrollspy, theme, and disclosure behavior
assets/                # reviewed public images, icons, crests, and other assets
  CV.tex / CV.pdf      # English internship resume source and output
  CV_zh.tex            # shared source for the general Chinese resume
  cv/                  # Chinese CV sources and outputs grouped by role
  transcripts/         # private transcripts for local use only
scripts/               # synchronization and content-regression checks
materials/             # private portfolio, project deliverables, and archives
notes/                 # private job-search data, reports, and rebuild scripts
tmp/                   # disposable temporary outputs
Makefile               # checks, preview, builds, and controlled deployment
robots.txt
sitemap.xml
.nojekyll
README.md              # default Chinese repository guide
README.en.md           # English repository guide
```

`materials/`, `notes/`, `tmp/`, role-specific CVs, and transcripts are local working content normally protected by `.gitignore`. Public deployment uses only the explicit allowlist in `Makefile`; do not upload the repository or `assets/` wholesale to third-party hosting services. Each local workspace directory has its own `README.md` maintenance entry point.

## Editing

- Homepage content and styling: `index.html`
- Legacy Chinese URL compatibility: run `make sync-homepage` after editing `index.html`; do not edit `zh.html` independently
- Interactions: `main.js`
- Content consistency rules: `scripts/check-content.mjs` and its tests
- General Chinese resume: `assets/CV_zh.tex`
- English resume: `assets/CV.tex`

## Local preview

```bash
make serve
make stop

# or serve manually
python3 -m http.server 8000
```

`make serve` opens `http://localhost:8000` and reuses an existing server for this project. If another process owns the port, use a different value such as `make serve PORT=8001`.

## Checks

```bash
make check
```

The check pipeline covers homepage-mirror synchronization, JavaScript syntax, shared claim and contact consistency, STAR-oriented project copy regressions, XML/SVG validity, local resource links, Git diff formatting, and the presence and freshness of locally maintained CV artifacts.

This is an offline consistency gate, not proof of semantic correctness, upstream freshness, or successful deployment. Before updating a project metric, inspect the corresponding repository source, configuration, report, and evaluation boundary, then synchronize the site and CV wording.

## CV builds

When the corresponding local LaTeX sources are present, build them with XeLaTeX and `latexmk`:

```bash
make cv
make cv-zh
make cv-roles
```

- `make cv` builds `assets/CV.pdf`.
- `make cv-zh` builds the named general Chinese PDF under `assets/cv/Agent开发与评测/` through its same-name wrapper.
- `make cv-dev` and `make cv-eval` build the role-specific variants; `make cv-roles` builds both.
- The Agent-development and Agent-evaluation variants are local application files and are not part of the publication allowlist.
- `assets/cv/` is organized by role into `Agent开发`, `Agent评测`, and `Agent开发与评测`; its README documents source, original, phone-redacted, and anonymous-output naming.

## Deployment

GitHub Pages publishes the repository root from the `main` branch:

```bash
make deploy
make publish
make publish MSG="fix: update profile"
```

- `make deploy` runs checks, stages only the explicit allowlist, commits, and pushes.
- `make publish` builds CVs before deployment and cleans generated build files afterward.
- Both targets refuse to deploy from the wrong branch or with unexpected staged files.
- Plain `make` only prints help and performs no write or network action.

Passing local checks or producing PDFs does not prove the live site is current. After an explicitly requested push, verify the served root page, the redirect-free `zh.html` mirror, and every intended public artifact; GitHub Pages and browser caches may briefly serve an older version.

## Evidence maintenance

- Keep project roles, architecture, metrics, and scope aligned across the site and every maintained CV.
- Lead with implemented mechanisms and verifiable capabilities; keep detailed caveats in expandable evidence notes or project reports.
- Every evaluation number must be traceable to a fixed report or commit with model, sample, configuration, and date boundaries.
- Meeting Agent's durable task recovery and WebAgent's checkpoint recovery are different mechanisms and must not be conflated.
- Automated checks only establish configured invariants; they do not replace real UI, live deployment, or external-link verification.

## Public URLs

- Homepage: <https://lixiuyin.github.io>
- Compatibility URL: <https://lixiuyin.github.io/zh.html>
