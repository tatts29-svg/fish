# Restore the previously live map views

Author: Andrew Fisher.

Andrew explicitly requested “Restore both while checking 2026” after rejecting the plan-only change, 2 Nov 2026. This helper restores the four exact previously live machine files. It creates no new feature or version claim. The coordinating owner restores the parent page separately, after the machine restoration succeeds. Claude's reserved v12.84 work is outside this scope.

This is a dedicated rollback implementation derived from the reviewed v12.83 guarded machine publisher. It does not weaken that publisher or its constants. The rollback has its own immutable starting and target hashes:

- Current parent: `10eeb707df306b79c9ee5e870dab64b3037e39806bdd8147e665bc789c01ceff`.
- Current machine: `1744a9f1a2fb3fc39c8aaae8c91c7e94e9a9c3a463c868eb6d2ea41504069c6a`.
- Required restored machine: `8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6`.

`machine_rollback.py` pins both current and restored hashes and sizes for `explorer/index.html`, `explorer/explorer.js`, `explorer/explorer-merge.js` and `poc3d/index.html`. Every other descriptor, all 236 paths, the schema and entry remain unchanged. Even a newly edited candidate plus matching evidence is refused unless its bytes match the exact original pins. The resulting union must reproduce the original machine hash above, with the original `v10.65-map-navigation` metadata.

`publish_machine_rollback.py` defaults to a no-write preparation. `--preflight` additionally checks edit access, server readiness and the full protected inventory without writing. `--publish` is explicit. It checks the current parent and machine at startup and again immediately before the single manifest registration; only the four reviewed blob PUTs and that registration POST are permitted. It rechecks the inputs, the hash-pinned shared machine tool, server readiness and complete inventory before registration. Served bytes and post-registration inventory must match before a successful receipt is written. The live GET-to-POST race still requires one coordinated release owner.

Private original files and full retained manifests remain outside the repository. Supply their paths rather than publishing their contents:

```sh
python publish_machine_rollback.py \
  --keep CURRENT_MANIFEST_JSON \
  --candidate-dir PRIVATE_ORIGINALS_DIRECTORY \
  --evidence SOURCE_BOUND_JSON \
  --expected-base 1744a9f1a2fb3fc39c8aaae8c91c7e94e9a9c3a463c868eb6d2ea41504069c6a \
  --machine-tool ../satellite_explorer/tools/machine_set.py \
  --out FRESH_PRIVATE_RECEIPT_DIRECTORY \
  --preflight
```

The coordinator adds `--publish` only for the authorised restoration. The edit credential comes from the existing private environment binding and is never included in arguments or receipts. Machine restoration runs first while the pinned v12.83 parent is still current; the separately guarded page restoration follows. No operational record is changed.

Local preparation verified the original four source files and reproduced the target union with all 232 other descriptors intact. `python test_publish_rollback.py` passes 31 fully mocked checks, including immutable restoration pins, the exact target union, changed page/machine rejection, inventory races, protected blobs, changed inputs, refused writes, and exact public read-back. These checks make no production request. Runtime regression evidence and the actual restoration receipt are the coordinating owner's responsibility. Restoring the previous map views does not establish the capture date of any imagery; the 2026 source investigation remains separate.
