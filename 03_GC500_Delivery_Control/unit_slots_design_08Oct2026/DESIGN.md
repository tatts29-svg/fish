# Unit slots: "WC56 3|12" so every unit gets its own labour ticks (DESIGN, no code)

8 Oct 2026 · design only, nothing built · base: live v9.11 (sha256 408ae6ac…), record 4581, read only

## The answer to the project manager's question

**Yes, it's a good idea, and it fixes the actual gap.** Today a location gets one set of labour ticks per unit only
when it has two or more asset numbers recorded. Of the 36 lines that can only be ticked as a block, 34 have no number
at all, and Event Portables units never get a Coates number. Giving each unit a slot (WC56 1|12 … 12|12) whether or
not it has a number makes all 424 block line-units (27.08% of forecast labour revenue) tickable one unit at a time.

**On the day it goes live, no money figure moves.** The rule was simulated in memory on the live page against
record 4581: the slot rule was swapped in, every figure was measured, and the page's own functions were then put
back. On all 191 charge lines across 182 references, the labour charged, the pieces charged per labour line, the
labour plan's forecast and charged figures (group by group), the Costs labour figure and the P&L labour ticks all came
out identical. Only counts change (see "What the money does").

**Order: part E first, then slots.** Part E fixes which line WC09's two numbers belong to, and slots then use that
answer as it stands. Neither needs anything from the other.

**Five calls for the project manager** (details at the end):
1. Label format "WC56 3|12" (recommended) or "3/12".
2. Units beyond what was counted on site (WC31: 1 of 2 counted): warn but still allow ticking (recommended), or block.
3. Event Portables units: does Coates Install and Demob apply? This is still open from the survey. Slots don't decide it.
4. The tick grid for big quantities (T0025 Trakmat ×20, WC33 FWF ×17). It is a new layout, so it needs a mock-up on
   the real page and his yes.
5. Printed "WC56 3|12" stickers so crews can mark each unit (optional).

One check: on the record, **WC50 is 1 FWF** (asset 1211974, install ticked), so it would stay plain "WC50". The idea
shows on WC56 (FWF ×12), T0025 (Trakmat ×20) or T0158 (VMS ×9).

## 1. How it works today (live v9.11)

Everything about labour per unit goes through one function, `labourUnits(a, item)`. Whatever it returns, the rest of
the page treats as the units: the drawer ticks (`labourTicksHtml`), the money (`labourMoney`, `labourCents865`), the
forecast (`labourPlan`), the P&L ticks (`pl760Ticks`), the effort count (`effortTally`), the spread of an old tick
(`setLabour`) and Tick all (`setLabourAll`).

- **Fewer than 2 building numbers on the reference:** it returns nothing, so the line gets one set of ticks. The key
  is `REF|disc|item|line`, and one tick charges rate × the order quantity.
- **2 or more numbers:** it returns this line's numbers (v7.32 `lineNumbersOf` deals them; v7.33 `labourKeep` caps them
  at the order). If there are fewer numbers than the order, it adds one more set, `rest`, for "N more with no number
  yet". That set charges rate × N on one tick.
- **Keys:** `labourKey` builds `REF/u<number>|disc|item|line`. A unit is ticked if its own key is set **or** the old
  reference key is (v5.55). The first per-unit edit spreads an old reference tick onto every unit and then deletes it
  (v5.58).

On record 4581 there are 173 ticks: 121 reference keys, 52 unit keys (`/u<number>`), and **0** `rest` keys.

## 2. What a slot is, and when slots appear

A **slot** is one physical unit of one order line at one reference: slot k of q, where q is the line's order
quantity (`labourLineQty`). It is shown as **"WC56 3|12"**.

A line gets slots only when **all** of these are true:
- q is readable and **q ≥ 2**;
- the card prices **at least one** labour line on the item (the v5.81 rule; a Pee Panel, TL2 or container gets none);
- the reference is live: not cancelled, not moved away, not a follow-up delivery (follow-ups carry no charge lines).

Every other line keeps exactly what it has today. q = 1 stays one set; a line with no priced labour shows its chip as
today; a line counted as none arrived shows "none arrived" as today.

On record 4581, slots add per-unit ticks to the 36 block lines on 35 references: 28 FWF lines, 5 VMS, 1 Trakmat and
2 toilet-block lines (WC09 6 m blocks, WC31 16Pan). Lines that already go per unit (WC01, WC07, WC12, WC15, WC16,
WC17, WC20, WC21, WC60 and the rest) keep their number keys. They only gain the "k|q" tag.

## 3. The stable key per slot

`labourUnits` keeps returning plain strings, so every reader stays as it is:

| slot state | token `labourUnits` returns | key the tick is written under |
|---|---|---|
| bound to a Coates number n (5–8 digits) | `n` (as today) | `REF/u<n>\|disc\|item\|line` (today's key, unchanged) |
| not bound to a Coates number | `#k` | **`REF/s<k>\|disc\|item\|line`** (new) |

- `labourKey` gets one new branch: a token `#k` gives `REF/s<k>`. No asset number or Event Portables fleet number on
  the record contains `#` (checked: 0), so a token can't be mistaken for a number. The `/s` prefix never collides with
  `/u<number>`, even for a fleet number typed as an asset number (WC31's unit is "12").
- Slot numbers are **per line**, and the key carries the item. So `WC09/s1|…|FWF|install` and
  `WC09/s1|…|Toilet Block 6m|install` are different keys.
- `|` is the key separator. It is used in the **label** only and never goes into a key. The label is made from the
  slot number at display time.

## 4. How a recorded number binds to a slot

Slot k is the unit's identity. A number is something that gets attached to a slot.

1. **A person's choice wins.** The Change form's "counts as" gets a second select, "which one: 1|5 … 5|5". It is stored
   on the existing supplied entry as `supplied/<REF>.items[asked=item].slot_of = {"<number>": k}`. `setSupplied`
   already merges fields. Its clean-up filter must be told to keep an entry that has only `slot_of`, otherwise the
   choice would be dropped (risk R4).
2. **Otherwise auto, next free.** The line's numbers, exactly as `labourUnits` gives them today (v7.32 dealing,
   part E's rule, the person's "counts as", v7.68 tanks, the `labourKeep` cap at q), take the lowest free slots in that
   order.
3. **The binding is pinned the moment it matters.**
   - Writing the first `s<k>` tick on a line pins, in the same save, every number currently bound on that line.
   - Recording or reassigning a number on a line that already has `s<k>` ticks pins it to the chosen slot. The default
     is the lowest free slot with no slot tick; failing that, the lowest free slot.
   - After that, auto never moves a number. A number that arrives without a page write (a data release) still takes
     the lowest free slot. If that slot was already ticked as a slot, the drawer shows "number placed on a slot ticked
     without a number: check".
4. **Event Portables fleet numbers are labels only.** Example: WC56's 12 recorded units "Sub-hire: Event Portables",
   0721 … 0009. They go on the free slots in recorded order ("WC56 1|12 · EP 0721"), but only on a reference with one
   order line. They never become a key, because fleet numbers are not unique and are not Coates assets. The key stays
   `s<k>`.

## 5. Keeping existing ticks: the exact rule

**Read.** Slot k of line (REF, disc, item) counts as ticked for labour line L when **any** of these is set:

| | key | meaning |
|---|---|---|
| a | `REF/s<k>\|disc\|item\|L` | this slot's own tick |
| b | `REF/u<n>\|disc\|item\|L` where n is bound to slot k | the unit's tick by number (v5.55 onward) |
| c | `REF\|disc\|item\|L` | an old whole-reference tick, which always meant "every unit" |
| d | `REF/urest\|disc\|item\|L`, only if slot k has no Coates number | an old "the ones with no number yet" tick |

Pieces charged on L = **the number of slots ticked**, one piece each, put through the same `labourCents865`
(rate × pieces per card line, to the cent). Asking about the whole reference (no unit) is answered the same way as
today: ticked only when every slot is.

**Nothing counts twice.** Each key is read by at most one slot, except c and d, and those are combined with OR, not
added. Key a belongs to slot k only. Key b belongs to the one slot n is bound to; a number has exactly one slot, and a
slot has at most one number. Keys c and d may answer for several slots, but each slot still counts once. So the
pieces on a line can never go above q.

**Nothing is lost.** Every key today's page reads is still read, for the same pieces:
- `u<n>` for every number in the line's list: the list is capped at q, so every number has a slot (key b), 1 piece
  each, as today.
- The reference key: read by all q slots (key c), which gives q pieces. Today's block charges rate × q.
- `rest`: it exists only when numbers < q, so there are exactly q − n slots without a number, each reading key d, for
  q − n pieces. Today `labourRestN` gives q − n.

**Edit.** The v5.58 spread already runs through `labourUnits`, so it carries on unchanged. On the first per-slot edit
of a line that has a reference tick, it writes an explicit key for every slot that reads it, deletes the reference
key, then makes the edit. The same is added for a `rest` key (spread onto the slots with no number). There are 0 on
the record. Tick all and Untick all go through `labourUnits` too; Untick all already clears the reference key.

## 6. Proof on real references (simulated on live v9.11, record 4581, read only)

Run: `sim_slots.cjs`, view mode. `counts.blocked` 0, 0 page errors, the page's functions put back afterwards (checked
true). The scenarios changed the record **in memory only** and restored it after each one.

### WC09: FWF ×4 (Event Portables), Pee Panel ×6 (no labour on the card), Toilet Block 6m ×2 · numbers 1268858, 1311146 · 0 ticks

| | today (v9.11) | slots on v9.11 | slots with part E's deal |
|---|---|---|---|
| Toilet Block 6m | one set for both blocks, key `WC09\|…\|Toilet Block 6m\|L` | 1\|2, 2\|2 unbound: `WC09/s1…`, `WC09/s2…` | **1\|2 = 1268858, 2\|2 = 1311146**: keys `WC09/u1268858…`, `WC09/u1311146…`, part E's own keys |
| FWF | one set ×4 | 1\|4 … 4\|4: `WC09/s1…s4\|…\|FWF\|L` | same |
| Pee Panel | units 1268858, 1311146, rest; no labour, so no ticks | unchanged (no priced line, so no slots) | no numbers (part E) |
| ticks to map | 0 | 0 | 0 |

- Part E was stood in for in memory by a "counts as Toilet Block 6m" choice for both numbers. That gives the same deal
  part E makes. Ticking block 1 install charged **1 piece**; ticking FWF 2|4 install charged **1 piece**.
- Without slots, a WC09 block tick charges 2 pieces.
- The order doesn't matter. If slots go live first and somebody ticks `s1` before part E lands, then part E's numbers
  are pinned in that save to the next free slots (rule 4.3). Each slot still counts once. Today there are 0 ticks on
  WC09, so nothing moves either way.

### WC16 (and WC17, WC20): toilet blocks with two numbers each, already per unit

| | today | with slots |
|---|---|---|
| WC16 units | 1322587, 1322588 | **WC16 1\|2 · 1322587**, **WC16 2\|2 · 1322588** |
| keys | `WC16/u1322587\|…\|Toilet Block 6m\|install` etc. | the same keys (simulated: both read ticked) |
| ticks recorded | 6 (install, steps, levelling on each) | the same 6, the same pieces (2 per line) |
| still to tick | cleaning ×2, demob ×2 | cleaning 1\|2, 2\|2 and demob 1\|2, 2\|2; one block cleaned gives cleaning 1 piece (simulated) |

- WC17: 1327224 is 1|2, 1327223 is 2|2. The 6 ticks stay on the same keys.
- WC20: block 1311341 is 1|2 and tank 1327228 is 1|2; block 1327225 is 2|2 and tank 1328982 is 2|2. These match
  the "Set 1 / Set 2" pairs already recorded on WC20's units. 10 ticks, unchanged.
- No key changes, no write, and the pieces and money are identical (measured).

### WC56: FWF ×12 (Event Portables), no Coates numbers, one old whole-reference install tick

| step | install pieces | demob pieces |
|---|---|---|
| today: one set, install ticked (`WC56\|…\|FWF\|install`) | 12 | 0 |
| slots, on release: 1\|12 … 12\|12, every slot reads the reference tick (key c) | **12** (same) | 0 |
| first per-slot edit: spread writes `WC56/s1…s12\|…\|install`, deletes the reference key | 12 | 0 |
| unit 3 not actually installed: untick 3\|12; tick demob on 1\|12 | **11** | **1** |

Labels can show the recorded Event Portables fleet numbers: "WC56 1|12 · EP 0721". Keys stay `s<k>`.

### Two more checks

- **WC07** (FWF ×20, 20 numbers, one old reference install tick). Already per unit by number. The reference tick is
  read by all 20 numbered slots, so install stays at 20 pieces. Its first per-unit edit spreads to `u<number>` keys as
  today.
- **WC31** (16Pan Block ×2, 1 counted on site, no Coates number; the Event Portables unit "12" is not a building
  number). Today one tick charges 2. With slots, ticking 1|2 install charges **1** (simulated), so the over-charge risk
  goes. 2|2 carries the chip "only 1 of 2 counted on site" (call 2).

## 7. Demob and cleaning per slot

- They are the same slots and the same key shape, with line `demob` or `cleaning`. The forecast already puts them
  under "later" (`LABOUR_LATER`); per slot it does the same.
- A relocation is still not demobbed twice: `labourPlan` skips demob on a relocation, per slot as it does per set
  today.
- No gate: demob on a slot is not blocked when install isn't ticked. The drawer shows a chip, "demob ticked, install
  not", so a crew can tick what it actually did.
- Demob runs and the demob sheet are not changed by this design. `owner816` still plans by reference and number.
  Slots add the "k|q" tag where a numbered unit is listed.

## 8. Where "WC56 3|12" shows

| surface | change | phase |
|---|---|---|
| Drawer labour section (`labourTicksHtml`) | q ≤ 4: the existing unit cards, headed "WC16 1\|2 · 1322587". q ≥ 5: one row per labour line with a box per slot (1 … q) plus "7 of 20 installed". This is a **new layout, so it needs a mock-up and the PM's yes**. | 1 |
| Change form "counts as" | a "which one: 1\|q … q\|q" select, defaulting to the next free slot | 1 |
| Costs labour card, labour plan, Accruals | counts read per slot; "entries" becomes "units" where the count equals the order | 1 (wording only) |
| Journal line for a tick | "Labour ticked: install on FWF (WC56 3\|12)" | 1 |
| Equipment / inventory | the slot tag beside each numbered unit; unnumbered stay counted as today | 1 |
| Loading door-side rows, truck sheet, drop page, demob sheet | **no change to row ids** (`u<number>` / `item:<item>`), so recorded door sides keep reading. The slot tag is added beside numbered rows only. Splitting an item row into slots would orphan door sides already recorded. | 1 (tag only) |
| Timeline cards, run sheets | stay by reference and quantity ("FWF ×12"), plus "installed 7 of 12". No per-unit rows, so run sheets don't grow. | 1 |
| Drop photos per slot, door side per slot | not now; both are keyed by number today | later, on request |
| Printed "WC56 3\|12" stickers for crews to mark units | optional (call 5) | later |

## 9. How part E fits

Slots read the numbers that `labourUnits` gives after `lineNumbersOf`. So part E's deal **is** the binding, with no
special case. WC09's blocks become 1|2 = 1268858 and 2|2 = 1311146 under part E's own keys. Part E's door-side read
(`loading872Side`) is untouched, because slots don't change loading row ids. Part E's count changes (Toilet Block 6m
13 → 15 on Equipment, plan +3 expected and +2 later) are part E's own. Slots add their own count changes on top
(below). Recommended order: part E, then slots, each rebuilt on the live page of its day.

## 10. What the money does

**At release, nothing moves.** Measured on record 4581: 0 of 191 charge lines differ in labour charged or in pieces
per labour line. 0 labour-plan groups differ in forecast or charged. The Costs labour figure, the P&L labour total and
the forecast total are all the same. Charged stays at 26.85% of forecast.

This holds because rate × q on one tick equals q slots × rate × 1, both rounded per card line to the cent by
`labourCents865`.

**Counts that move (not money), measured:**

| count | today | with slots |
|---|---|---|
| labour plan lines (`labourPlan().slots`) | 657 | 999 |
| plan lines charged / expected / to come / later | 192 / 100 / 94 / 271 | 236 / 145 / 179 / 439 |
| P&L labour ticks (`pl760Ticks`) | 192 | 236 |
| effort tally, offered / ticked | 686 / 192 | 1032 / 236 |

- Effort offered goes up by 346. That is the survey's gap (424 line-units less the 78 block sets they replace).
- The plan goes up by 342. The plan leaves some lines out, such as demob on relocations; that 4-line difference was
  not traced line by line.
- Charged goes up by 44: the 7 Event Portables FWF block install ticks become 51 slots.

**After release, money moves only by ticks, and in the right direction:**
- **Earlier and fuller revenue.** A half-done location can be ticked unit by unit, so the 27.08% of forecast labour
  sitting in blocks starts coming in as units are done, not when the last one is.
- **Less over-charge.** A block ticked early charges every unit; a slot charges one. On WC31, one tick charges 1 block,
  not 2.
- **The forecast total doesn't change.** q slots forecast the same as the block.

## 11. Risks

| # | risk | how it is handled |
|---|---|---|
| R1 | A binding moves after slot ticks exist, and a tick ends up on the wrong unit or a count drops | pinning on write (4.3); auto never moves a pinned number; test it: tick `s1`, record a number, untick `s1`, and check the number stays put |
| R2 | **Already true on live:** a moved reference carries only `REF\|…` labour keys (`moveRecord` and `recordOn` filter on `REF + '\|'`), so `REF/u<n>` ticks (52 on record) are left behind, and `/s<k>` would be too | widen both filters to `REF + '/'` as part of the slots release; report the existing gap separately |
| R3 | The first per-slot edit on a big block writes many keys (T0025 would write 20 per line spread) | the same v5.58 path as today, now on more keys; test on the phone through the outbox |
| R4 | `setSupplied` deletes an entry that has no supplied, count or nums, which would drop a slot-only choice | keep entries that have `slot_of` |
| R5 | A data release changes q (Schedule 6 is pending). If q drops, ticks on slots above q stop being read. | never hide a record: list "ticks on slots beyond the order" in the drawer and on the Questions page. If q rises, an old reference tick also covers the new slots, which is today's block behaviour too. |
| R6 | Deleting a number leaves its `u<n>` ticks unread (true today as well) | warn before removing a number that carries ticks |
| R7 | A big layout on the phone (20 × 2 boxes) | grid layout, mock-up on the real page and the PM's yes first (layout rule) |
| R8 | Counts across the page move (plan, labour card, effort tally, Finance per-piece line counts) | say so in the release README, as part E does; the money compare must be identical |
| R9 | Event Portables units now get Coates Install and Demob per unit, which makes the open question more visible | call 3; slots charge exactly what the block did, never more |
| R10 | "3/12" reads as a date on paper | use "3\|12" (call 1) |
| R11 | Speed: 999 plan lines, against 657 today | `labourPlan` is memoised; measure tab open times in the sweep |

## 12. What a build would touch (for whoever builds it, after the PM's yes)

- `labourUnits`: for a line with slots, return q tokens, numbered slots first by binding, then `#k`.
- `labourKey`: the `#k` → `/s<k>` branch.
- `labourTicked`: the read rule above, with keys a to d.
- `setLabour`: the `rest` spread, and pinning on the first `s<k>` write.
- `setNumberItem` and `setSupplied`: the slot choice and the keep filter.
- `labourTicksHtml`: headings and the grid.
- `moveRecord` and `recordOn`: the `/` prefix.
- Journal words.
- Tests: rerun `sim_slots.cjs` against the build, money identical via `compare_money895.cjs`, both sweeps, and a phone
  screenshot of the WC56 and T0025 drawers.

## Files (scratchpad, read only on the live page and the record)

- `/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/design/DESIGN.md`: this file
- `/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/design/sim_slots.cjs`: the in-memory simulation (view mode, swaps and restores)
- `/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/design/sim.json`: its output (equalities, counts, tokens, keys; no money)
- `/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/survey/`: the survey this design builds on
