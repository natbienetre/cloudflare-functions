PLUGINS = cloudflare-auto-session cloudflare-env-var-password

build: run-build

lint: run-lint

publish:
	@git diff-index --quiet HEAD -- || (echo "Working directory is not clean" && exit 1)
	YARN_RUN="npm publish" $(MAKE) _run

ci-test:
	YARN_RUN="install --immutable" $(MAKE) _run
	YARN_RUN="lint --format junit --output-file eslint.junit.xml"  $(MAKE) _run

run-%:
	YARN_RUN=$* $(MAKE) _run

YARN_RUN ?= --version
CACHE_FOLDER ?= $(CURDIR)/.yarn/cache

_run:
	$(foreach plugin,$(PLUGINS),cd $(plugin) && yarn $(YARN_RUN) && cd ..;)
