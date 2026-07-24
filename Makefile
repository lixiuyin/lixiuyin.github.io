# Build the CV PDF and deploy the site.
#
#   make            build CV, then commit & push everything
#   make cv         compile assets/CV.tex -> assets/CV.pdf only
#   make serve      preview locally at http://localhost:8000 and open the browser
#   make deploy     git add . && commit && push only
#   make clean      remove LaTeX build artifacts
#   make reset-history   squash ALL history into one "initial commit" and force-push (destructive!)
#
# Override the commit message:  make MSG="fix typo"

MSG ?= chore: update site
BRANCH ?= main
PORT ?= 8000

.PHONY: all cv serve deploy clean reset-history

all: cv deploy clean

cv:
	cd assets && xelatex -halt-on-error -interaction=nonstopmode CV.tex

# Serve the site locally and open it in the default browser.
# The browser opens after a 1s delay so the server has time to bind the port.
serve:
	@echo "Serving at http://localhost:$(PORT) — opening browser…"
	@( sleep 1; open "http://localhost:$(PORT)" 2>/dev/null || xdg-open "http://localhost:$(PORT)" 2>/dev/null ) &
	@python3 -m http.server $(PORT)

deploy:
	git add .
	@git diff --cached --quiet || git commit -m "$(MSG)"
	git push -u origin HEAD

clean:
	rm -f assets/CV.aux assets/CV.log assets/CV.out

# Wipe ALL commit history, leaving a single "initial commit", then force-push.
# IRREVERSIBLE on the remote — old commits are gone. Requires typing "yes".
reset-history:
	@printf 'This ERASES all git history on "%s" and force-pushes ONE "initial commit". Type yes to confirm: ' "$(BRANCH)"; \
		read ans; [ "$$ans" = yes ] || { echo "Aborted."; exit 1; }
	git checkout --orphan _fresh_history
	# Clear inherited index entries without deleting working-tree files, then
	# rebuild the index so the current .gitignore is applied to every path.
	git rm -r -f --cached .
	git add .
	git commit -m "initial commit"
	git branch -M $(BRANCH)
	git push -f origin $(BRANCH)
	@echo "Done — history on $(BRANCH) is now a single commit."
