Author: Andrew Fisher

Combined v8.29 source package, LIVE 4 Oct 2026 at 02:45 AEST. Exact public host and asset readbacks match the reviewed release. See RELEASE_REVIEW.txt for final checks and their limits.

The release wrapper first applies the frozen v8.28 map host component to the reviewed final v8.27 host, verifies the exact component output, then applies the Fencing source coverage and existing-quote-card estimate presentation. It changes the existing release marker/footer to v8.29. Map bridge/button/tab pause/resume hooks remain intact. Map asset registration is a separate root-owned action using the map owner's exact manifest; this wrapper never registers or uploads assets.

Use the standard build toolchain with patch_v829_release.py. Set GC500_V829_PRIVATE_CONFIG to the authorised private config, and GC500_TOOLCHAIN to the existing toolchain directory when the package is not its sibling. The wrapper supports one working-copy path or separate input/output paths. All paths/hashes are mandatory; missing or changed inputs fail before the output is written. Source bytes are staged after hash verification, never read again from moving source paths.

The private config holds expected_base_sha256, expected_map_sha256, and exactly five inputs: map_patch, map_host, map_catalogue, support_map, estimate_view. Each input has only path and sha256. The catalogue, content-derived supporting-summary join map and source-specific view are private build inputs and must not enter Git. The generic public files contain no document contents, record snapshot, financial row, contact or credential.

The UI preserves native records, financial functions, supplied quotes, quote form controls, rates and source quantities. Programme work quantities include reused stock. No unique hire inventory or full-job total is invented. The new source links distinguish an original docket from a supporting commercial summary. Quote entry continues through the existing operator action; viewing the estimate performs no save.

Validation is separate: offline model/presentation/source guards are recorded privately. Final standard artifact, desktop/phone/print and map regression checks passed before publication. No tests may send messages, publish daily cards, mutate operational records or confirm costs.
