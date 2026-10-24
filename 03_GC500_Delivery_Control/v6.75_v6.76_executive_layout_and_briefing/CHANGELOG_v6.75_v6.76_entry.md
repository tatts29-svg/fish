# GC500 Delivery Control — v6.75 and v6.76 (26 Sep 2026)

**The executive audit, stages 2–4: the first screen, and a five-scene briefing.** Built on v6.74 (the accuracy
fixes). The figures are the same and are read through the same functions. What changed is how they are presented.

Author: Andrew Fisher

## v6.75 — the first screen (audit sections 6–7)

- **Executive / Operations layout.** Both layouts use one page and one set of figures.
  - **Executive (default):** the header folds to one row, about 127 px instead of 273. It shows the project, the phase and day ("Build phase · day 20 of 68"), "Event opens Fri 23 Oct · 27 days" in calendar days, one freshness indicator ("LIVE last confirmed 18:35") and search.
  - **Operations:** the full working header, exactly as before, with the clock, the countdown pod and the next delivery day.
  - **Switching:** use Tools › Layout, the "Full header" button, or a link with `?layout=ops` / `?layout=exec`. The choice is kept on the device.
- **Where we are is the executive summary.** "The job at a glance" leads the page with:
  - one scoped sentence;
  - four measures, each with its unit and cohort:
    - due-delivery adherence: 196 of 196 units, 57 of 57 references;
    - quantity recorded: 200 units, whole job 764 quantified + 26 awaiting quantity, with no percentage until confirmed;
    - due-work exceptions: 4;
    - commercial completeness: forecast incomplete;
  - at most three decisions, each with owner and due date shown as "to confirm";
  - the next seven days, with the next milestone labelled separately.

  The group and branch plates fold underneath (open by default in Operations). The headline plates now read "764 quantified units + 26 references awaiting quantity" and "Fence work on dockets", and no longer show a 25 % "on the job".
- **Today is the action page.** The same actions and seven days come first. In Executive, the banner, lights, dial, programme card and the money, map, document and roads teasers step back behind one row of links. Operations keeps them all.
- **One word for the date.** "Event opens" / "days to the event" replaces "race day" everywhere, including the LED board ("27 DAYS TO GC500").
- **View-only fencing.** A view-only link no longer shows the quote-entry form.
- **Phone.** The completion working table no longer overflows (global 640 px table minimum overridden).

## v6.76 — the executive briefing (audit section 8) and fallbacks (section 9)

- **Executive briefing · 5 scenes.** Open it from Where we are (beside Start showcase) or from Tools. The scenes are:
  1. The job at a glance.
  2. Progress on the ground: the latest drop photographs from the record, one per reference, with the time each was recorded.
  3. The next seven days, with fencing types behind the programme.
  4. Commercial control: client charges, known supplier costs and the difference so far. It is called "forecast incomplete", never margin. The lines to settle are shown, not netted.
  5. The team and the ask: who is running it, and at most three decisions.
- **How the briefing behaves:**
  - Every figure is read once when the briefing opens, and the snapshot time is printed on every scene.
  - It advances by hand only (arrows, space, PageUp/PageDown, Back/Next). Escape or Close returns focus to the button that opened it.
  - The rest of the page is inert while it is open.
  - There is no sound, no 3D and no live third-party call.
  - The ten-scene showcase is unchanged.
- **Graceful 3D/map failure.** On a view-only link, a map or 3D view that cannot start now says "This view is unavailable on this device right now. The drawings and the 2D plan are unaffected". The raw reason and the key-setup notes sit in a "Technical detail" fold. Editors still see the full reason.

## Checked

- Syntax: all page scripts pass `node --check`.
- Briefing test (desk 1366×768 and phone 390×844): all 5 scenes render with no horizontal overflow. Arrow keys advance, Finish closes, focus returns to the opening button, Escape closes, no inert element is left behind, and there are no errors.
- Navigation sweep (desk and phone): deep links, back/forward, drawer, search, showcase open/Escape/Back, reload, per-tab overflow.
- Header width checked at 1280, 1366 and 390 px.

## Not done in this release (and why)

- **Image derivatives (thumbnail and medium sizes).** These need server-side resizing on Railway. The drop photographs are still served at full size, lazily loaded.
- **About as a live issue register, document variants grouped under one drawing, and the pre-start coverage matrix.** These need decisions on document identity and aliases before anything is merged. Nothing was merged or deleted.
- **A recorded 30–45 s build film (DJI Action 4).** This needs footage from site.
