#!/usr/bin/env bash

set -euo pipefail

pnpm exec typedoc --options ../typedoc.json

# Astro content routes do not include the source .md extension.
find ./src/content/reference -type f -name '*.md' -exec \
    sed -E -i 's#(\]\([^)]*)\.md([#\)])#\1\2#g' {} +
