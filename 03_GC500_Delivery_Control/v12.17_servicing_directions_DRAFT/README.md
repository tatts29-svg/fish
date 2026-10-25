# Servicing card directions fallback — DRAFT

Author: Andrew Fisher

The native tracker publisher fills blank directions for an unpinned reference from its existing recorded location text. It preserves existing directions and pins. It does not infer coordinates or combine separate locations into one pin. All jobs, identities, quantities and completion history stay unchanged.

Base: verified v12.16 `4ab22e6bf6a9af93c255fd3732ae8ba57f047dccfb1d3be770b4b1ac7d8d0382`.
Candidate: `1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5`, 15,348,113 bytes.

Synthetic boundaries, exact page preservation, toolchain checks and the native publication dry capture pass. Phone/desktop regressions are in progress. Nothing has been published. NOT READY TO UPLOAD.

Operational snapshots, directions, private codes, screenshots and generated crew HTML stay outside the repository. Tests take private inputs through RUN/EVIDENCE; only synthetic fixture data is in this source. The guarded updater defaults to dry capture and needs the reviewed candidate live plus explicit execution mode before one native update. It verifies unchanged signatures, tracker configuration, history, job record and exact crew HTML read-back.
