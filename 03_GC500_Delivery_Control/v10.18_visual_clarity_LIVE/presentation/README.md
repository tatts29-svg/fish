# Shared presentation and interaction clarity

Author: Andrew Fisher · 14 Oct 2026 · source frozen for combined validation

Exact reviewed base: live v10.17, SHA256 `d30833b57d59b2347c106193fa052edfda6c953801c513069af0ab6e05e00b5d`.

The earlier pointer handler forced a synchronous `offsetWidth` read after changing a class and assigned an animation directly to each pressed control. That could replace the control's own animation, and it omitted ordinary links, disclosure headings, input labels and keyboard activation. The replacement uses one independent, pointer-transparent halo. Tap acknowledgement lasts 420 ms; selected activation lasts 900 ms; only opacity animates. It changes no records or control behaviour and does not claim that a Save has reached the shared record.

Existing authored tab, weather-day, picked-asset and status glows remain. Other selected controls, checked labels and expanded disclosure headings have a steady edge glow. Keyboard focus remains visible. Native selected text, input values and the Save lifecycle keep their own behaviour. Table figures use tabular numbers and no text shadow; instrument lettering retains its existing style.

The feedback layer lives inside an open native dialog when needed, with coordinates converted to the dialog's scrolled/transformed padding box. It cannot intercept input. Scroll, resize, offscreen targets, hidden documents and printing clear it. Reduced motion and the app's Motion Off setting use a brief static acknowledgement. There is no continuous new animation or page-wide mutation scan.

Confirmed contrast correction: the Build arrival-plan PDF link used `#ff6a13` on `#f8f6f4`, approximately 2.66:1 at 14px. It now uses the existing dark-orange `#9a3f0a` plus an underline, approximately 6.31:1. The paired light/dark palettes elsewhere remain intact. Measured standalone Equipment and Documents phone actions were 24–25px high; the scoped phone rules provide 44px minimum targets while retaining their existing flex rows. Dense table controls and print layout are unchanged.

`patch_presentation1018.py` applies the script and CSS and removes only the former pointer handler. It refuses a repeated patch or a base without the v10.17 financial-scope safeguard. Integration/publication belongs to the release owner.

Validation: `check_presentation1018.cjs` passed 32/32 focused checks against the final presentation-only candidate, with zero browser errors or operational write attempts. Tests cover native pointer/keyboard/checkbox/select/disclosure behaviour, existing target transform and animation preservation, native-dialog alignment, reduced motion, Motion Off, scroll/hidden/offscreen cleanup, 360/390/1440/3840px viewport containment, 44px phone targets, the corrected link, and byte-identical native operational state. One expected map-session POST was blocked before transport. Browser closed. The phone arrival-link screenshot was inspected.

Private evidence: `/tmp/private-gc500-visual1018/presentation/focused-final.json` and `focused-final-arrival.png`. Full 22-route, financial parity and combined release checks are recorded separately by the release owner. This does not invent detail in low-resolution source photographs or change map coordinates.

Final combined validation: the unchanged focused suite passed **32/32** on SHA256 `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d`, including the release owner’s rendering-cache and supplier-recursion corrections. Zero script errors or operational write attempts; native operational state remained byte-identical and the browser closed. The corrected arrival link was inspected again on the phone. Private combined evidence: `/tmp/private-gc500-visual1018/presentation/focused-combined.json` and `focused-combined-arrival.png`.
