#!/usr/bin/env bash
# The page exactly as the service serves it on the public view link. Read-only; no key needed.
#   toolchain/fetch_live.sh out.html
set -euo pipefail
out="${1:?give an output file}"
curl -sS --fail --max-time 180 -o "$out" "https://gc500-production.up.railway.app/v/Coates-GC500-2026"
bytes=$(wc -c < "$out")
[ "$bytes" -gt 1000000 ] || { echo "the live page came back as only $bytes bytes - stopping" >&2; exit 1; }
echo "live page: $bytes bytes -> $out"
