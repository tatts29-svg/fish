#!/usr/bin/env bash
# Author: Andrew Fisher. Packs the v8.90 Map explorer binaries that are too big for git (the scene, the tile pyramid, the
# underlay patches and the pictures) into an encrypted archive, split into parts under 90 MB, and proves the round trip.
#   archive890.sh <assets dir> <out dir> <password file>
# The password is read from the file by openssl only; it is never printed, copied or stored here.
set -euo pipefail
ASSETS="$1"; OUT="$2"; PASS="$3"
mkdir -p "$OUT"; tmp="$(mktemp -d -p "$OUT")"
( cd "$ASSETS" && tar -cf "$tmp/assets890.tar" drawing-scene.bin original-preview.webp sheet-overview.webp underlay vt --exclude='vt/boot.json' )
sha256sum "$tmp/assets890.tar" | cut -c1-64 > "$tmp/assets890.tar.sha256"
openssl enc -aes-256-cbc -pbkdf2 -iter 300000 -salt -pass "file:$PASS" -in "$tmp/assets890.tar" -out "$tmp/assets890.tar.enc"
( cd "$tmp" && split -b 85m -d -a 2 assets890.tar.enc assets890.tar.enc.part )
# round trip: join, decrypt, compare
cat "$tmp"/assets890.tar.enc.part* > "$tmp/rejoined.enc"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -pass "file:$PASS" -in "$tmp/rejoined.enc" -out "$tmp/roundtrip.tar"
cmp "$tmp/assets890.tar" "$tmp/roundtrip.tar"
rm -f "$OUT"/assets890.tar.enc.part* "$OUT/assets890.tar.sha256" "$OUT/assets890_parts.sha256"
mv "$tmp"/assets890.tar.enc.part* "$OUT/"; mv "$tmp/assets890.tar.sha256" "$OUT/"
( cd "$OUT" && sha256sum assets890.tar.enc.part* > assets890_parts.sha256 )
echo "tar bytes: $(stat -c %s "$tmp/assets890.tar")  tar sha256: $(cat "$OUT/assets890.tar.sha256")"
ls -la "$OUT"/assets890.tar.enc.part*
rm -rf "$tmp"
echo "round trip OK"
