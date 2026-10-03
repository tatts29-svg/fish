Author: Andrew Fisher
Portable wider GC500 release wrapper — v8.26

This source package contains generic presentation code and a loader. Private operational policy and Finance direction are required external build inputs. They are not embedded in this package, a sample configuration, or its public manifest. Missing inputs, changed hashes, an unexpected base or repeated anchors stop the build before its input page is modified.

Install
Place this folder beside the repository toolchain directory, retaining every file and SOURCE_MANIFEST.json. Do not copy full built pages, runtime snapshots, private configuration, policy payloads, original documents, contacts or financial rows into the source folder.

Required private manifest
Create a private JSON file with exactly two keys:
- expected_base_sha256: the exact verified standard v8.21 page SHA256.
- inputs: fencing, equipment_demob, finance_wording, contract_supplement and checklist, each with path and sha256.
Paths can be absolute or relative to that private manifest. Every SHA256 must be the full lower-case 64-character hash of its owner-frozen file. The Finance input is the reviewed seven-entry before/after JSON. The three JavaScript inputs are the entire frozen owner files; the loader preserves their bytes rather than splitting policy from behaviour at runtime.

Build using the existing toolchain
GC500_PRIVATE_BUILD_INPUTS=/authorised/private/build-inputs.json toolchain/build.sh v8.26 path/to/patch_v826_release.py

The exact ordered stages are Fencing822, Equipment/Demob823/824, Costs825 plus reviewed Finance words, the reviewed private accessory source supplement, the qualified quote-period warning, selected-load checks826, then the approved Demob fold adapter. The existing release marker and final footer label become v8.26. The native model, schedule, data collections, provider APIs and print buttons remain in place. The original v8.21 code and supplier-card styling boundary are already on the required base.

The Fencing, Equipment/Demob and checklist modules contain operational or financial policy, so they remain required private build inputs even though much of their code is generic. Finance wording and the reviewed accessory row payload are also kept private. The private scan identifies the relevant literal locations for the release owner. Only the reviewed source supplement and generic quote warning are included. No other supplement is accepted silently; any later change needs its own approved integration and exact source evidence.

Verification and publication
Run the shared syntax/secret checks, the affected owner checks, both navigation sweeps and the standing checks on the exact standard-toolchain candidate. Inspect phone/desktop views and printed sheets. Source hashes alone are not release approval. Root owns final scope, privacy review, fresh-live verification and publication. This wrapper itself never accesses the network, sends a message or changes the shared record.

LIVE 4 Oct 2026 at 01:55 AEST. Exact public page cde8d4295b58d6f0ec85d46b49091698afd847bc4f49a4bad90a2c14d17c595e, 9,654,140 bytes. See RELEASE_REVIEW.txt for final checks and limitations.
