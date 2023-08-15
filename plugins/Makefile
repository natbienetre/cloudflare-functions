build: run-build

lint: run-lint

ci-test:
	YARN_RUN="install --frozen-lockfile" $(MAKE) _run
	YARN_RUN="lint --format junit --output-file eslint.junit.xml"  $(MAKE) _run

run-%:
	YARN_RUN=$* $(MAKE) _run

YARN_RUN ?= --version
CACHE_FOLDER ?= $(CURDIR)/.yarn/cache

_run:
	cd cloudflare-auto-session && yarn --cache-folder=$(CACHE_FOLDER) $(YARN_RUN)
	cd cloudflare-env-var-password && yarn --cache-folder=$(CACHE_FOLDER) $(YARN_RUN)
