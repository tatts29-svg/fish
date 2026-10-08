# Compact Timeline and numbered daily drop map — draft

Author: Andrew Fisher.

**DRAFT. Andrew has now authorised taking the lead on a numbered daily drop map and its presentation. This extends the reserved v9.08 scope and supersedes the former preview-only hold. The existing compact prototype is a starting point; the map is still being designed and this source is not ready to publish. Keep it separate from v9.07.**

This corrects the rejected centred Timeline layout. Load number and arrival time sit together, the reference and description read from the left, the existing five progress lights sit alongside the details on wide screens, and navigation/QR, Progress and Print are compact. Loading, unloading, crew and traffic remain their existing native folds, grouped beneath the load. Phone layout stacks at natural height.

The patch rearranges the page's existing DOM elements, retaining their attributes, accessible names, input identities, status lights and event handlers. The native action-group and control-container hooks remain. Unknown extension children, including the planned read-only allocation description, are retained. No record, forecast, personnel, asset, price, traffic status, print layout or Today code changes.

Build using `patch_v908.py BASE OUTPUT`. It accepts v9.04–v9.07 feature-compatible bases, uses exact shared replacement guards, refuses repeated application, and changes the footer to v9.08. A later Claude allocation change can be present in the base without replacement of its functions.

Before any publication, start from the then-current live page. If another release has advanced past v9.08, coordinate a new version, rebase and update the footer monotonically; this held v9.08 draft must never replace a newer live release with an older version number.

Checks:

- `test_patch908.py BASE` verifies exact preservation of all existing source/data after removing the presentation additions, allowed base versions and refusal guards.
- `test_timeline908.cjs` uses the read-only browser harness. It checks native controls/lights/text preservation, extension compatibility, 390/1440/2560/3840 px geometry, fold operation, load open/close, Progress dialog focus restoration and correct Print target with printing intercepted.
- Original prototype measured roughly 305–313 px height on desktop and 702 px on phone, with five lights, four folds and no overflow. Final draft evidence remains private and is recorded after its checks complete.

No publication or operational write is performed by these files. A released candidate still needs the complete map implementation, review and final integration checks.
