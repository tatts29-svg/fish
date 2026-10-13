# Background drawer refresh

Author: Andrew Fisher

The v10.05 phone fixture reproduced an open physical-unit form collapsing and its unfocused asset number and name becoming blank after `openAsset(..., {keep: true})`. The document itself did not reload and the drawer stayed open. No automatic page reload or service worker was found; the one `location.reload()` is behind an explicit connection-retry button.

The form fields have names but no ids. The existing drawer restoration retained only the focused input with an id, and did not retain the unit panel's open folds. The reports poll redraws an open drawer every 20 seconds, including when the record has not changed. Shared-record, photo registry and photo outbox redraws have the same issue.

`patch_idle1006.apply(html)` installs `idle1006.js` before the native sync callback and routes those four background refresh paths through it. It retains expanded details, open galleries, scroll position, focused fields/caret and dirty unit-form values. Untouched values still receive current data. A dirty draft keeps its original concurrency tokens, so it cannot silently overwrite a newer unit edit. Local `bump()` and submit redraw semantics are unchanged: a saved add-unit form still clears. The helper adds no timers, persistent cache, native record changes or reloads.

`check_idle1006.cjs` runs the native phone/desktop background callbacks with every operational network write blocked. It covers the 20-second reports path, shared-record callback, both photo refresh paths, unfocused drafts, focus/caret, fold/gallery/scroll retention, local-form reset, changed-source tokens, clean-field updates, removed forms and closed drawers. These tests cannot establish whether Android separately discarded a browser process; that remains outside the reproduced app defect.

Private baseline reproduction: `/workspace/private-gc500-idle1006/probe.json`. Source SHA256: `65bba5cb7477816d587cb72025ff256f2eb8c2dbc65eb4087dccc5ad49f4622a`. Standalone candidate is a focused pre-integration test; root owns final combined release testing and publication.
