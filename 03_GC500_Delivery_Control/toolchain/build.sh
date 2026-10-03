#!/usr/bin/env bash
# Build a GC500 release from the LIVE page. The live page is the one source of truth: whoever builds next starts
# from exactly what is on the service, so two builders can never undo each other's work.
#
#   toolchain/build.sh v7.44 path/to/patch_v744.py [more patches...]
#
# Writes build/GC500_v7.44/GC500_Delivery_Control_hosted.html (build/ is ignored by git), then runs the checks.
# With no patch it rebuilds the live page as it is - useful to prove the toolchain round-trips byte for byte.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
ver="${1:?give the version, e.g. v7.44}"; shift || true
out="$here/../build/GC500_${ver}"; mkdir -p "$out"
base="$out/base_live.html"; page="$out/GC500_Delivery_Control_hosted.html"
"$here/fetch_live.sh" "$base"
cp "$base" "$page"
for p in "$@"; do
  echo "== applying $p"
  python3 "$p" "$page"
done
if [ "$#" -gt 0 ]; then python3 "$here/scrub_attributions.py" "$page" | tail -1; fi
python3 "$here/check_page.py" "$page" --base "$base"
echo "BUILT $page"
