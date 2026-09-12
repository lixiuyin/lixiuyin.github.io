# Safe local workflow for the Chinese-first personal website and CV.
#
#   make              show available commands (no build, commit, or push)
#   make check        validate scripts, content consistency, links, and both CVs
#   make cv           compile assets/CV.tex -> assets/CV.pdf
#   make cv-zh        compile the named general Chinese CV into assets/cv/
#   make cv-roles     compile the Agent development and evaluation variants
#   make clean-zh     remove its build artifacts, retaining the named PDF
#   make clean-roles  remove role-CV build artifacts, retaining the PDFs
#   make serve        preview locally and reuse an existing project server
#   make stop         stop this project's local preview server
#   make deploy       check, commit the explicit deploy allowlist, and push
#   make publish      build both CVs, check everything, deploy, and clean
#   make clean        remove LaTeX build artifacts while retaining CV.pdf
#   make reset-history  destructively replace branch history after confirmation
#
# Override the commit message with: make publish MSG="fix: typo"

.DEFAULT_GOAL := help

MSG ?= chore: update site
BRANCH ?= main
PORT ?= 8000
PYTHON ?= python3
LATEXMK ?= latexmk
ZH_CV_ROLE := Agent开发与评测
ZH_CV_NAME := 李袖印_香港大学_$(ZH_CV_ROLE)_实习时长6个月
ZH_CV_DIR := cv/$(ZH_CV_ROLE)
DEV_CV_ROLE := Agent开发
DEV_CV_NAME := 李袖印_香港大学_$(DEV_CV_ROLE)_实习时长6个月
DEV_CV_DIR := cv/$(DEV_CV_ROLE)
EVAL_CV_ROLE := Agent评测
EVAL_CV_NAME := 李袖印_香港大学_$(EVAL_CV_ROLE)_实习时长6个月
EVAL_CV_DIR := cv/$(EVAL_CV_ROLE)

DEPLOY_FILES := \
	.gitignore \
	.nojekyll \
	Makefile \
	README.md \
	README.en.md \
	index.html \
	main.js \
	robots.txt \
	sitemap.xml \
	zh.html \
	assets/CV.tex \
	assets/CV.pdf \
	assets/CV_zh.tex \
	assets/$(ZH_CV_DIR)/$(ZH_CV_NAME).tex \
	assets/$(ZH_CV_DIR)/$(ZH_CV_NAME).pdf \
	scripts/check-content.mjs \
	scripts/check-cv-pdfs.mjs \
	scripts/check-content.test.mjs \
	scripts/check-website-star.test.mjs \
	scripts/README.md \
	scripts/redact-pdf-text.py \
	scripts/sync-homepage.mjs \
	assets/favicon.svg \
	assets/apple-touch-icon.png \
	assets/photo.jpg \
	assets/hku-crest.svg \
	assets/hku-crest.pdf \
	assets/sdu-crest.svg \
	assets/sdu-crest.pdf \
	assets/zh-name.woff2

.PHONY: all help check sync-homepage cv cv-zh cv-dev cv-eval cv-roles \
	clean-zh clean-roles serve stop deploy publish clean reset-history

all: cv cv-zh
	@$(MAKE) check

help:
	@printf '%s\n' \
		'make              Show this help (safe default)' \
		'make check        Validate the site, reviewed claims, and both CVs' \
		'make sync-homepage Update the redirect-free zh.html mirror from index.html' \
		'make cv           Compile assets/CV.tex -> assets/CV.pdf' \
		'make cv-zh        Compile the named general Chinese CV into assets/cv/' \
		'make cv-dev       Compile the Agent-development CV' \
		'make cv-eval      Compile the Agent-evaluation CV' \
		'make cv-roles     Compile both role-specific Chinese CVs' \
		'make clean-zh     Remove Chinese CV build artifacts; retain the named PDF' \
		'make clean-roles  Remove role-CV build artifacts; retain their PDFs' \
		'make serve        Preview at http://localhost:$(PORT)' \
		'make stop         Stop this project preview on port $(PORT)' \
		'make deploy       Check, commit allowed site files, and push $(BRANCH)' \
		'make publish      Build both CVs, check, deploy, and clean' \
		'make clean        Remove LaTeX build artifacts' \
		'make reset-history  DESTRUCTIVE: replace $(BRANCH) history after confirmation' \
		'' \
		'Options: PORT=8001  MSG="commit message"  BRANCH=main'

check:
	@echo "Checking site, reviewed content, and both CVs…"
	@node scripts/sync-homepage.mjs --check
	@node --check main.js
	@$(PYTHON) -c 'compile(open("scripts/redact-pdf-text.py", encoding="utf-8").read(), "scripts/redact-pdf-text.py", "exec")'
	@node scripts/check-content.mjs
	@node scripts/check-cv-pdfs.mjs
	@node --test scripts/check-content.test.mjs scripts/check-website-star.test.mjs
	@xmllint --noout sitemap.xml assets/favicon.svg
	@git diff --check
	@for name in CV; do \
		test -s assets/$$name.pdf || { echo "assets/$$name.pdf is missing or empty. Rebuild both CVs."; exit 1; }; \
		test ! assets/$$name.tex -nt assets/$$name.pdf || { echo "assets/$$name.pdf is older than its source. Rebuild both CVs."; exit 1; }; \
	done
	@for source in assets/cv/*/*_实习时长6个月.tex; do \
		test -f "$$source" || continue; \
		pdf="$${source%.tex}.pdf"; \
		test -s "$$pdf" && test ! "$$source" -nt "$$pdf" || { echo "Rebuild the missing or stale role CV: $$pdf"; exit 1; }; \
	done
	@test -s index.html || { echo "index.html is missing or empty."; exit 1; }
	@! grep -q 'class="lang-toggle"' index.html || { echo "The public Chinese page must not expose an English-page switch."; exit 1; }
	@! grep -q 'href="assets/CV.pdf"' index.html || { echo "The public Chinese page must not expose the English CV."; exit 1; }
	@grep -q '<h2 id="interests-heading">关注方向</h2>' index.html || { echo "The internship page must retain the concise areas-of-interest section."; exit 1; }
	@grep -q '<h2 id="projects-heading">项目经历</h2>' index.html || { echo "The internship page must retain the recruiter-oriented project section."; exit 1; }
	@! grep -q 'href="#research"' index.html || { echo "The internship page must not expose the research-methods section in navigation."; exit 1; }
	@grep -q '研究与方法经历暂不在日常实习版本中展示' index.html || { echo "The hidden research-methods source archive is missing."; exit 1; }
	@grep -q '教学经历暂不在日常实习版本中展示' index.html || { echo "The hidden teaching source archive is missing."; exit 1; }
	@! grep -q '<section id="beyond"' index.html || { echo "The internship page must not expose the personal-interest section."; exit 1; }
	@! grep -q '<section id="contact"' index.html || { echo "The duplicate contact section must remain removed."; exit 1; }
	@status=0; \
	for page in index.html zh.html; do \
		for ref in $$(sed -nE 's/.*(href|src)="([^"]+)".*/\2/p' $$page); do \
			case "$$ref" in http://*|https://*|mailto:*|'#'*|'&#'*) continue ;; esac; \
			path=$${ref%%\?*}; path=$${path%%\#*}; \
			if [ -n "$$path" ] && [ ! -e "$$path" ]; then \
				echo "Missing local resource in $$page: $$path"; status=1; \
			fi; \
		done; \
	done; \
	test "$$status" -eq 0
	@echo "Checks passed."

sync-homepage:
	@node scripts/sync-homepage.mjs --write

cv:
	@echo "Building assets/CV.pdf…"
	@cd assets && $(LATEXMK) -xelatex -halt-on-error -interaction=nonstopmode CV.tex

# One general Chinese PDF, using the existing wrapper and shared source.
cv-zh:
	@test -f assets/CV_zh.tex || { echo "Missing Chinese CV source: assets/CV_zh.tex"; exit 1; }
	@echo "Building assets/$(ZH_CV_DIR)/$(ZH_CV_NAME).pdf…"
	@cd assets && $(LATEXMK) -xelatex -halt-on-error -interaction=nonstopmode -outdir="$(ZH_CV_DIR)" "$(ZH_CV_DIR)/$(ZH_CV_NAME).tex"
	@test -s "assets/$(ZH_CV_DIR)/$(ZH_CV_NAME).pdf" || { echo "Chinese CV build did not produce the named PDF"; exit 1; }

cv-dev:
	@test -f "assets/$(DEV_CV_DIR)/$(DEV_CV_NAME).tex" || { echo "Missing Agent-development CV source"; exit 1; }
	@echo "Building assets/$(DEV_CV_DIR)/$(DEV_CV_NAME).pdf…"
	@cd assets && $(LATEXMK) -xelatex -halt-on-error -interaction=nonstopmode -outdir="$(DEV_CV_DIR)" "$(DEV_CV_DIR)/$(DEV_CV_NAME).tex"
	@test -s "assets/$(DEV_CV_DIR)/$(DEV_CV_NAME).pdf" || { echo "Agent-development CV build failed"; exit 1; }

cv-eval:
	@test -f "assets/$(EVAL_CV_DIR)/$(EVAL_CV_NAME).tex" || { echo "Missing Agent-evaluation CV source"; exit 1; }
	@echo "Building assets/$(EVAL_CV_DIR)/$(EVAL_CV_NAME).pdf…"
	@cd assets && $(LATEXMK) -xelatex -halt-on-error -interaction=nonstopmode -outdir="$(EVAL_CV_DIR)" "$(EVAL_CV_DIR)/$(EVAL_CV_NAME).tex"
	@test -s "assets/$(EVAL_CV_DIR)/$(EVAL_CV_NAME).pdf" || { echo "Agent-evaluation CV build failed"; exit 1; }

cv-roles: cv-dev cv-eval

clean-zh:
	@cd assets && $(LATEXMK) -c -outdir="$(ZH_CV_DIR)" "$(ZH_CV_DIR)/$(ZH_CV_NAME).tex"
	@echo "Removed Chinese CV build artifacts; retained the named PDF."

clean-roles:
	@cd assets && $(LATEXMK) -c -outdir="$(DEV_CV_DIR)" "$(DEV_CV_DIR)/$(DEV_CV_NAME).tex"
	@cd assets && $(LATEXMK) -c -outdir="$(EVAL_CV_DIR)" "$(EVAL_CV_DIR)/$(EVAL_CV_NAME).tex"
	@echo "Removed role-CV build artifacts; retained both PDFs."

# Serve the site locally and open it in the default browser. If this same
# project is already being served on the requested port, reuse that server.
serve:
	@pid=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null | head -n 1); \
	if [ -n "$$pid" ]; then \
		cwd=$$(lsof -a -p "$$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
		if [ "$$cwd" = "$(CURDIR)" ]; then \
			echo "Already serving at http://localhost:$(PORT) — opening browser…"; \
			( open "http://localhost:$(PORT)" 2>/dev/null || xdg-open "http://localhost:$(PORT)" 2>/dev/null || true ); \
			exit 0; \
		fi; \
		echo "Port $(PORT) is used by another process (PID $$pid). Try: make serve PORT=8001"; \
		exit 1; \
	fi; \
	echo "Serving at http://localhost:$(PORT) — opening browser…"; \
	( sleep 1; open "http://localhost:$(PORT)" 2>/dev/null || xdg-open "http://localhost:$(PORT)" 2>/dev/null || true ) & \
	$(PYTHON) -m http.server $(PORT)

stop:
	@command -v lsof >/dev/null 2>&1 || { echo "lsof is required for make stop."; exit 1; }; \
	pid=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null | head -n 1); \
	if [ -z "$$pid" ]; then \
		echo "No preview server is listening on port $(PORT)."; \
		exit 0; \
	fi; \
	cwd=$$(lsof -a -p "$$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'); \
	if [ "$$cwd" != "$(CURDIR)" ]; then \
		echo "Refusing to stop PID $$pid: it is not serving this project."; \
		exit 1; \
	fi; \
	kill "$$pid"; \
	echo "Stopped the preview server on port $(PORT) (PID $$pid)."

deploy: check
	@current=$$(git branch --show-current); \
	if [ "$$current" != "$(BRANCH)" ]; then \
		echo "Refusing to deploy from branch '$$current'; expected '$(BRANCH)'."; \
		exit 1; \
	fi
	@# Explicitly allow these reviewed files even when ignored; never stage assets/ wholesale.
	@git add -f -- $(DEPLOY_FILES)
	@unexpected=0; \
	for path in $$(git -c core.quotePath=false diff --cached --name-only); do \
		case " $(DEPLOY_FILES) " in *" $$path "*) ;; \
			*) echo "Refusing to commit unexpected staged file: $$path"; unexpected=1 ;; \
		esac; \
	done; \
	test "$$unexpected" -eq 0
	@if git diff --cached --quiet; then \
		echo "No site changes to commit."; \
	else \
		git commit -m "$(MSG)"; \
	fi
	@git push -u origin HEAD

publish: cv cv-zh
	@$(MAKE) deploy
	@$(MAKE) clean clean-zh

clean:
	@cd assets && $(LATEXMK) -c CV.tex >/dev/null
	@rm -f assets/missfont.log
	@echo "Removed LaTeX build artifacts; retained assets/CV.pdf."

# Emergency maintenance only. This target is intentionally isolated from all
# normal dependencies and uses an explicit remote-tip lease to avoid overwriting
# remote changes that appeared after the confirmation prompt.
reset-history:
	@current=$$(git branch --show-current); \
	if [ "$$current" != "$(BRANCH)" ]; then \
		echo "Refusing to rewrite history from branch '$$current'; expected '$(BRANCH)'."; \
		exit 1; \
	fi; \
	remote_tip=$$(git rev-parse "origin/$(BRANCH)" 2>/dev/null) || { \
		echo "Cannot resolve origin/$(BRANCH). Fetch the remote before retrying."; exit 1; \
	}; \
	printf '%s\n' \
		'WARNING: this replaces the entire remote branch history with one commit.' \
		'Existing commit IDs and open links to old commits will no longer be valid.'; \
	printf 'Type "rewrite $(BRANCH) history" to continue: '; \
	read answer; \
	[ "$$answer" = "rewrite $(BRANCH) history" ] || { echo "Aborted."; exit 1; }; \
	git checkout --orphan _fresh_history; \
	git rm -r -f --cached .; \
	git add .; \
	git commit -m "initial commit"; \
	git branch -M "$(BRANCH)"; \
	git push --force-with-lease="$(BRANCH):$$remote_tip" origin "$(BRANCH)"; \
	echo "History on $(BRANCH) was replaced with one commit."
