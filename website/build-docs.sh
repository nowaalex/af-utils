#!/usr/bin/env bash

set -euo pipefail

pnpm exec typedoc --options ../typedoc.json

pnpm exec oxfmt ./src/content/reference
