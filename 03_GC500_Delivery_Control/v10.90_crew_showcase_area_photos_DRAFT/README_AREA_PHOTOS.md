# Optional area photographs

Author: Andrew Fisher.

Area-photo implementation for the v10.90 integration. Base: exact live v10.89 SHA-256 `2254fce73cefb76fdecb371509d7d37e1873d394d77193975842288f14ed3eae`. This component does not publish a page, change existing records on load, or add photographs to Showcase.

An optional **Area photos** section appears in the normal reference drawer before any photograph exists. An editor can take a photo, choose one from the device, or reuse an existing service image. The person explicitly selects current identified items or reference-level context at this or other references. Select all applies only to the items currently shown.

## Record and projections

The existing service file ID remains the key of one native `photoLinks` document. Its original `ref`, `unit`, `slot`, caption and provenance stay intact. The added field is:

```js
area1090: {
  version: 1,
  label: "Optional label",
  targets: [
    {ref, unitId, signature, label},
    {scope: "reference", ref, items, signature, label}
  ],
  by, at,
  primaryDetached: false
}
```

Each unit target stores the canonical unit ID and a photo-time signature of ID, reference, owner, fleet number and description. An explicit reference target stores its reference and item-type snapshot, with no unit ID or quantity; it can link quantity-only references to the same photograph. It appears in the reference gallery and never attaches to individual or newly added units. Identity changes or movement leave the recorded selection in Manage for review. They do not attach it to a replacement or follow a new location. Work ticks and captions are outside the signature.

Reference galleries, selected item context galleries, normal map/photo readers and drop-sheet print views derive from that one document. Documents keeps its single primary reference for grouping/navigation and adds contextual labels and individually navigable related-reference links to the existing row. Search includes those related references. No duplicated files, stored counters, new map pins, new geometry or new completion facts are created.

Area context is excluded from individual photo evidence, asset-number inference, pin choices, legacy fold-to-one-unit behaviour and individual photo-slot accounting. If an existing individual photo is shared, its original individual evidence remains until explicitly detached. The primary metadata stays available for audit. Legacy photos acquire no area metadata unless a person explicitly shares them.

## Editing and removal

Manage edits the one record. Unselecting an item removes only that membership. Existing-file reuse adds memberships and preserves earlier memberships and the primary home. An older legacy-only photo is adopted with its original home; multiple conflicting legacy homes are rejected for manual review.

Native caption edits keep the original home and all area metadata. Older item Remove actions and Documents file-delete controls route shared photos to Manage. Other legacy removal/replacement/Put back paths are guarded. **Remove photo everywhere** explicitly tombstones the photo document across all associations and retains the media file. To replace a shared image, add a new area photo and explicitly remove the old one; there is no implicit replacement across other references.

The manager checks current capability, operator, exact photo snapshot and stamp before saving. A stale manager refuses to overwrite newer received changes. Native invalidation redraws linked views. Draft tokens prevent a delayed upload completion from deleting a newly opened editor.

## Upload durability

New uploads use the existing generated-name camera/photo outbox. The explicit area snapshot is deep-copied into its durable entry before upload and carried into the existing durable `linkPlan`. The original file, file receipt, native local save and shared-record acknowledgement barriers remain unchanged.

Retries do not replay the original membership plan over an existing photo document. Later caption, membership and removal changes remain authoritative. Existing-file reuse uploads no media. No fixture upload or production record write is required by the tests.

## Boundaries

- Individual targeting requires a current identified physical unit. Quantity-only or unidentified items can be selected as explicit reference-level context at any active reference; no fictional unit identities are created.
- The five existing location photo places remain the limit for new reference-level uploads. Area context does not consume selected units' own photo places.
- The existing service has last-writer-wins photo documents. Local snapshot/stamp checks reject received competing changes, but this component does not add atomic server compare-and-swap for two unseen simultaneous client edits.
- Native serialization, hydration, staging and a captured native write preserve the nested metadata. No production metadata-retention write was made. The repository’s verified-live server v5.91 generic document handler retains the entire JSON object, and its photoLinks map export retains nested metadata.
- A whole-area photo records context only. It never establishes that unselected items were shown, where an item was placed, its plate number or that work was complete.

## Integration and checks

`patch_area_photos1090.py` exports `patch(text, path)`, refuses repeat application and uses the shared exact-once patch helper. It does not alter the footer or release base guard.

Only these existing named modules change, as approved by the integration owner:

- `units925-script`: discoverable area panel and individual-evidence filter.
- `source-reference973-script`: exclude context from identity evidence.
- `tidy1051-script`: exclude context from accessory photo inference.

The main unnamed script receives durable outbox metadata and explicit context labels. The new `area1090-script` contains the scoped projections, guards, manager and small styling additions. All other existing named scripts/styles, including servicing, backgrounds and Showcase, remain unchanged.

Tests:

```sh
node --test test_area_photos1090.cjs
CHROMIUM_PATH=/usr/bin/chromium PAGE=/private/candidate.html \
  OUTDIR=/private/area-photo-evidence \
  node test_area_photos1090_runtime.cjs
```

The runtime test uses the existing GET-only harness and an in-browser native document-write capture. It covers exact `toDocs`/`fromDocs`, staging and captured `syncSend`, one-file reuse, projections/evidence, stale edits, scoped removal, view-only controls, escaping, and phone layout. Root owns combined candidate preservation checks, release sweeps and publication.
