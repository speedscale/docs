#!/usr/bin/env bash
set -euo pipefail

build_dir="${1:?build directory required}"
destination="${2:?S3 destination required}"

aws s3 sync "$build_dir/" "$destination" \
  --exclude '*' --include '*.md' --delete \
  --content-type 'text/markdown; charset=utf-8' \
  --cache-control 'public, max-age=300' --metadata-directive REPLACE

# Copy refreshes metadata even when an object's content is unchanged.
aws s3 cp "$build_dir/" "$destination" --recursive \
  --exclude '*' --include '*.md' \
  --content-type 'text/markdown; charset=utf-8' \
  --cache-control 'public, max-age=300' --metadata-directive REPLACE
