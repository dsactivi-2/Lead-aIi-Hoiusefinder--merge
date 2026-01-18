SHELL := /bin/bash

.PHONY: init kb-refresh kb-search note completeness smoke

init:
	@mkdir -p kb/sources
	@if [ ! -f kb/sources/01_openai_cookbook_agents.urls ]; then \
		echo "https://cookbook.openai.com/topic/agents" > kb/sources/01_openai_cookbook_agents.urls; \
	fi

kb-refresh:
	@./tools/refresh_kb_all.sh

kb-search:
	@./tools/kb_search.sh

note:
	@./tools/note.sh

completeness:
	@./tools/check_completeness.sh

smoke: init completeness kb-refresh
	@Q="agents" ./tools/kb_search.sh
	@echo "SUCCESS"
