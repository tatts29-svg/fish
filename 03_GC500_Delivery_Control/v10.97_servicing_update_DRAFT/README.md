# Bounded servicing update — ready to upload

Author: Andrew Fisher.

Adds explicitly supplied servicing-only locations and moves explicitly named existing servicing references through
a private data input. It updates the main page's panel data and crew-card data together. It retains the exact
existing crew-card template, controller, every existing reference/line ID, plans, asset numbers, quantities and
unrelated page bytes. New entries in this scope are one pump-only trailer toilet; their fleet number remains blank.

The patch requires the exact v10.95 page SHA-256
`87b47dc52dc52dc9d078e8f77f79ed3c9e835244e5855e075a075aab1b338b47` and advances its footer to v10.97.
The separately owned v10.96 map draft is not incorporated and remains subject to its own publication hold.

Set `GC500_SERVICING_DATA` to the private full source JSON and `GC500_SERVICING_SCOPE` to a private JSON containing
`add_refs` and `move_refs` arrays. Keep those files, exact operational findings, QR bundles and generated PDFs out
of the repository. This release starts its private source from the full checked-in snapshot; the crew download
projection omits per-line pins used by print-map generation. After publication, that checked-in snapshot is not
the current servicing dataset. Subsequent work must reconcile the current hosted panel/card data and existing
tracker, retaining the full private source and line-specific print-map positions. Do not overwrite a newer
servicing configuration with this earlier snapshot.

```sh
bash toolchain/build.sh v10.97 v10.97_servicing_update_DRAFT/patch_v1097.py
python3 -B -I v10.97_servicing_update_DRAFT/test_patch.py
```

After the final page passes release checks and guarded publication, update the existing event tracker through
the native Servicing control. Keep its token and key. Back up the existing card/ticks first and verify the updated
configuration, exact crew HTML, unchanged old reference signatures and retained ticks. The page patch alone does
not update the tracker, job register or completion record. Do not treat this draft as uploaded or as print readiness.

Validation completed so far: guarded patch tests 10/10, print-symbol/layout checks 12/12 and print-readiness checks 10/10.
Independent source review confirms that only the two servicing JSON values and release footer differ from the
exact live base. The existing template/controller and all existing references remain unchanged. A private local
rehearsal against the frozen v5.91 server passed 39/39 checks, including same-token/key preservation, existing
completion retention, separate service days and no job-register writes. This is software evidence, not physical
phone or paper-scan evidence. Desktop and phone sweeps passed 25 routes with the existing public aliases, seven
deep links and Back; zero page/console errors or attempted writes. The native update dry run captured the page's
own payload without sending it and verified the unchanged template, contact, existing codes, completions and
job record. Guarded uploader access passed. Native publication/read-back is recorded separately.

READY TO UPLOAD: 21 Oct 2026 08:43 AEST. Candidate SHA-256 `d584e292ec8647532ef7e93e3873dd41a48efd5890a4a9e32435318e7871b1dc`, 18,622,270 bytes. Print regression 49/49 and private synthetic preview 100/100 also passed. Publication and exact native tracker read-back remain the next step.
