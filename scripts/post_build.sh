#!/bin/bash
set -euo pipefail

rm -f lib/package.json
mv "$(pwd)"/lib/src/* "$(pwd)"/lib
rm -rf lib/src

# Test files are excluded from tsconfig; clean any leftovers defensively.
rm -f lib/**/*.test.* lib/**/**/*.test.* 2>/dev/null || true
