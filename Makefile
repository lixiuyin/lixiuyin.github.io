# Safe local workflow for the academic website and CV.
#
#   make              show available commands (no build, commit, or push)
#   make check        validate scripts, metadata files, links, and the CV artifact
#   make cv           compile assets/CV.tex -> assets/CV.pdf
#   make serve        preview locally and reuse an existing project server
#   make stop         stop this project's local preview server
#   make deploy       check, commit the explicit deploy allowlist, and push
#   make publish      build the CV, check everything, deploy, and clean
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

DEPLOY_FILES := \
	.gitignore \
	.nojekyll \
	Makefile \
	README.md \
	index.html \
	main.js \
	robots.txt \
	sitemap.xml \
	assets/CV.tex \
	assets/CV.pdf \
	assets/favicon.svg \
	assets/og-banner.jpg \
	assets/photo.jpg \
	assets/zh-name.woff2

.PHONY: all help check cv serve stop deploy publish clean reset-history

all: cv check

help:
	@printf '%s\n' \
		'make              Show this help (safe default)' \
		'make check        Validate the site and CV artifact' \
		'make cv           Compile assets/CV.tex -> assets/CV.pdf' \
		'make serve        Preview at http://localhost:$(PORT)' \
		'make stop         Stop this project preview on port $(PORT)' \
		'make deploy       Check, commit allowed site files, and push $(BRANCH)' \
		'make publish      Build CV, check, deploy, and clean' \
		'make clean        Remove LaTeX build artifacts' \
		'make reset-history  DESTRUCTIVE: replace $(BRANCH) history after confirmation' \
		'' \
		'Options: PORT=8001  MSG="commit message"  BRANCH=main'

check:
	@echo "Checking site and CV…"
	@node --check main.js
	@xmllint --noout sitemap.xml assets/favicon.svg
	@git diff --check
	@test -s assets/CV.pdf || { echo "assets/CV.pdf is missing or empty. Run: make cv"; exit 1; }
	@test ! assets/CV.tex -nt assets/CV.pdf || { echo "assets/CV.pdf is older than CV.tex. Run: make cv"; exit 1; }
	@status=0; \
	for ref in $$(sed -nE 's/.*(href|src)="([^"]+)".*/\2/p' index.html); do \
		case "$$ref" in http://*|https://*|mailto:*|'#'*|'&#'*) continue ;; esac; \
		path=$${ref%%\?*}; path=$${path%%\#*}; \
		if [ -n "$$path" ] && [ ! -e "$$path" ]; then \
			echo "Missing local resource: $$path"; status=1; \
		fi; \
	done; \
	test "$$status" -eq 0
	@echo "Checks passed."

cv:
	@echo "Building assets/CV.pdf…"
	@cd assets && $(LATEXMK) -xelatex -halt-on-error -interaction=nonstopmode CV.tex

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
	@git add -- $(DEPLOY_FILES)
	@unexpected=0; \
	for path in $$(git diff --cached --name-only); do \
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

publish: cv
	@$(MAKE) deploy
	@$(MAKE) clean

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
