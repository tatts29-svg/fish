#!/usr/bin/env bash
# Author: Andrew Fisher. Reproduce the reviewed v10.21 page; this script never uploads or changes native records.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
control="$(cd "$here/.." && pwd)"
version="v10.21-reviewed"
base_input=""
print_only=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --base) base_input="${2:?--base needs the archived exact v10.18 HTML}"; shift 2 ;;
    --version) version="${2:?--version needs an output label}"; shift 2 ;;
    --print-only) print_only=1; shift ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; exit 2 ;;
  esac
done
if [[ ! "$version" =~ ^[A-Za-z0-9._-]+$ ]]; then
  printf 'The output version label must contain only letters, digits, dots, underscores or hyphens.\n' >&2
  exit 2
fi
release_patch() {
  local release="$1" file="$2" found="" candidate
  for state in LIVE DRAFT; do
    candidate="$control/${release}_${state}/$file"
    if [ -f "$candidate" ]; then
      if [ -n "$found" ]; then
        printf 'Both LIVE and DRAFT sources exist for %s; resolve the source before building.\n' "$release" >&2
        return 1
      fi
      found="$candidate"
    fi
  done
  if [ -z "$found" ]; then printf 'Missing release source: %s/%s\n' "$release" "$file" >&2; return 1; fi
  printf '%s\n' "$found"
}
patches=(
  "$(release_patch v10.19_po_values_prestarts_signed patch_v1019.py)"
  "$(release_patch v10.20_gate6_compound patch_v1020.py)"
  "$(release_patch v10.21_schedule7_1 patch_v1021.py)"
  "$here/po/patch_po_review1021.py"
  "$here/map/patch_provenance1021.py"
)
for patch in "${patches[@]}"; do
  if [ ! -f "$patch" ]; then printf 'Missing patch: %s\n' "$patch" >&2; exit 1; fi
done
if [ "$print_only" -eq 1 ]; then printf '%s\n' "${patches[@]}"; exit 0; fi
out="$control/build/GC500_$version"
base="$out/base_live.html"
page="$out/GC500_Delivery_Control_hosted.html"
if [ -z "$base_input" ]; then
  # Shared builder fetches the live page, applies the five ordered patches, scrubs attributions and checks the page.
  "$control/toolchain/build.sh" "$version" "${patches[@]}"
else
  # After publication, reproduce from the retained original base, never from a newer live release.
  python3 - "$base_input" <<'PY'
from pathlib import Path
import hashlib,sys
expected='2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d'
if hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()!=expected:
    raise SystemExit('Archived source is not the exact v10.18 page; nothing built')
PY
  mkdir -p "$out"
  cp "$base_input" "$base"
  cp "$base" "$page"
  for patch in "${patches[@]}"; do python3 "$patch" "$page"; done
  python3 "$control/toolchain/scrub_attributions.py" "$page"
  python3 "$control/toolchain/check_page.py" "$page" --base "$base"
fi
python3 - "$base" "$page" <<'PY'
from pathlib import Path
import hashlib,sys
expected=[
    '2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d',
    '06d6e6b0956c793299c99b5e48a7ee1c3fe16616f20a60ff0696d410f111848d',
]
for name,wanted in zip(sys.argv[1:],expected):
    p=Path(name); raw=p.read_bytes(); got=hashlib.sha256(raw).hexdigest()
    if got!=wanted: raise SystemExit(f'Unexpected build hash for {p.name}: {got}; expected {wanted}')
    print(f'{p}: {len(raw)} bytes; SHA-256 {got}')
print('Reproduced reviewed candidate. No upload or native-record operation was performed.')
PY
