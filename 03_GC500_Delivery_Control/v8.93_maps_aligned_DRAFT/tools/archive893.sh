#!/usr/bin/env bash
# Author: Andrew Fisher. Packs the v8.93 Map explorer binaries that are too big for git (the scene with the window clip
# fixed, the tile pyramid, the underlay patches and the pictures) into an encrypted archive, split into parts under 90 MB,
# and proves the round trip. Supersedes v8.90's assets890 archive: the whole explorer asset set is in here.
#   archive893.sh <assets dir> <out dir> <password file>
# The password is read from the file by openssl only; it is never printed, copied or stored here.
set -euo pipefail
mkdir -p "$2"; ASSETS="$(cd "$1" && pwd)"; OUT="$(cd "$2" && pwd)"; PASS="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"   # absolute: tar runs inside the assets folder
tmp="$(mktemp -d -p "$OUT")"
( cd "$ASSETS" && tar --exclude='vt/boot.json' -cf "$tmp/assets893.tar" drawing-scene.bin original-preview.webp sheet-overview.webp underlay vt )
sha256sum "$tmp/assets893.tar" | cut -c1-64 > "$tmp/assets893.tar.sha256"
openssl enc -aes-256-cbc -pbkdf2 -iter 300000 -salt -pass "file:$PASS" -in "$tmp/assets893.tar" -out "$tmp/assets893.tar.enc"
( cd "$tmp" && split -b 85m -d -a 2 assets893.tar.enc assets893.tar.enc.part )
# round trip: join, decrypt, compare
cat "$tmp"/assets893.tar.enc.part* > "$tmp/rejoined.enc"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -pass "file:$PASS" -in "$tmp/rejoined.enc" -out "$tmp/roundtrip.tar"
cmp "$tmp/assets893.tar" "$tmp/roundtrip.tar"
rm -f "$OUT"/assets893.tar.enc.part* "$OUT/assets893.tar.sha256" "$OUT/assets893_parts.sha256"
mv "$tmp"/assets893.tar.enc.part* "$OUT/"; mv "$tmp/assets893.tar.sha256" "$OUT/"
( cd "$OUT" && sha256sum assets893.tar.enc.part* > assets893_parts.sha256 )
echo "tar bytes: $(stat -c %s "$tmp/assets893.tar")  tar sha256: $(cat "$OUT/assets893.tar.sha256")"
ls -la "$OUT"/assets893.tar.enc.part*
rm -rf "$tmp"
echo "round trip OK"
