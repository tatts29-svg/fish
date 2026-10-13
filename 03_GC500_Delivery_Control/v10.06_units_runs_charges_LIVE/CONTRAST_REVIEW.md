# Form readability and save status

Author: Andrew Fisher

The reference drawer's supplied-description and quantity fields had a white background with near-white text in dark mode (1.13:1 contrast). They now use the page's matching foreground/background colours. The same hard-coded-white pattern is corrected in existing cost-entry and staff-count controls. Field sizes, data, validation and save handlers are unchanged. The separate unit form remains owned by the identity module.

The simplified drawer had removed the older connection badge. A single compact status line now shows recorded changes saved, saving, waiting to sync, or not saved. It follows the existing native queue, in-flight writes, hydration and persistence state through `syncFooter`; it adds no timer and makes no write. Text still awaiting a form's Save button is not described as recorded. The unit form's explicit Save acknowledgement remains separate.

Read-only phone checks cover light/dark WC72 and P25 drawer fields, real cost-form markup, staff-count markup, placeholders, focus, save-state edge cases, and exact native-record preservation. Minimum tested normal-text contrast is 15.85:1 in dark mode and 17.82:1 in light mode. The phone screenshot was inspected, including the focused supplied-description field. No operational write was attempted.

Files: `contrast1006.css`, `save1006.js`, `patch_contrast1006.py`, `check_contrast1006.cjs`, and `evidence/contrast1006-phone.*`. Root integrates this patch last into the combined candidate and reruns affected checks there.
