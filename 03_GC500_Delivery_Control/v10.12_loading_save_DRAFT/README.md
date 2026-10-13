# Save confirmation, readable controls and shared quantities

Author: Andrew Fisher

State: DRAFT, not ready to upload.

Andrew requests visible Save controls wherever a selection changes a record, readable controls throughout the page, and an audit that changing quantities, prices or status updates the other views. Screenshot21657 identifies loading-side selection and an unreadable Clear button.

The release retains native setters and calculations. Loading and unloading use explicit drafts; other existing autosave fields gain adjacent Save confirmation. Shared confirmation requires the exact changed documents to be acknowledged. Device-only saves and failures remain clearly labelled. Existing specialised Save forms are retained.

The quantity review corrects typed supplier ownership in Inventory and prevents incomplete percentages from rounding to 100%. Andrew's quantity rule is shared across readers: keep an entered quantity; otherwise use the quantity explicitly stated in the description, or one for each separate described item. A rating or size is not a quantity. These description-based counts are valid scope, not missing-data warnings. Ordered quantity, receipt, installation and collection states remain distinct. Source rates, onsite records, media and the approved appearance are retained.

Build from exact v10.11 SHA256 `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557` with `patch_v1012.py`. Focused lifecycle checks, numerical fixtures, independent reviews, combined phone/desktop checks and publication readback are being completed. Tests only read the live service and restore all in-memory fixtures. Missing financial source information is not fabricated or treated as zero.
