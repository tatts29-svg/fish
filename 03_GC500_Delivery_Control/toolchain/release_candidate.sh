#!/usr/bin/env bash
# Author: Andrew Fisher. Build/check only; never publish.
set -euo pipefail
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$here/release_candidate.py" "$@"
