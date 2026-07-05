#!/usr/bin/env bash
#
# Regenerate the MCP tools/prompts reference page from the proxymock
# binary's live tool registry, so it never drifts from the actual MCP
# server surface. Run this whenever the proxymock MCP tools change.
#
#   ./scripts/gen-mcp-docs.sh          # use `proxymock` on PATH
#   PROXYMOCK=/path/to/proxymock ./scripts/gen-mcp-docs.sh
#
# The binary comes from the speedscale repo (`go build ./speedctl/cmd/proxymock`)
# or a normal proxymock install (~/.speedscale/proxymock).
set -euo pipefail

cd "$(dirname "$0")/.."

OUT="docs/proxymock/how-it-works/mcp-tools.md"

# Resolve the proxymock binary: explicit override, then PATH, then the
# default install location.
BIN="${PROXYMOCK:-}"
if [ -z "${BIN}" ]; then
  if command -v proxymock >/dev/null 2>&1; then
    BIN="$(command -v proxymock)"
  elif [ -x "${HOME}/.speedscale/proxymock" ]; then
    BIN="${HOME}/.speedscale/proxymock"
  else
    echo "error: proxymock binary not found. Install it or set PROXYMOCK=/path/to/proxymock" >&2
    exit 1
  fi
fi

echo "Generating ${OUT} from ${BIN}..." >&2
"${BIN}" mcp docs > "${OUT}"
echo "Done. Review the diff and commit ${OUT}." >&2
