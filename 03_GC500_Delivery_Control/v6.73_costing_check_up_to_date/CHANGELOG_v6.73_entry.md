## v6.73 — 26 Sep 2026 — costing checked, said more simply; everything up to date

Andrew: "Check all costing, check everything adds up. Make sure everything makes sense. Make sure we are not over complicating the amount of info we give. Please double check bugs and errors again. Once done, please ensure everything is updated, including all server updates. I want a clean 'we are up to date, everything is done'."

### Costing — reconciled on the live record (version 1982, last change 25 Sep 2026 11:17 UTC)
| Check | Result |
|---|---|
| What we charge the V8s = contracts + labour ticked + event labour scope + fencing + other | $240,445.42 + $9,728.14 + $55,816.56 + $92,551.10 + $0 = **$398,541.22** ✓ |
| Contracts = the four branches' contract charges | STPS $81,252 + KINP $138,919 + MEAD $19,935 + NVAC $339 = $240,445 ✓ |
| Charged by branch + fencing charge lines | $240,445 + $92,551 = $332,996 ✓ (STPS $173,803 incl. fencing) |
| Eight streams add to the headline | 92,551 + 81,149 + 69,092 + 66,992 + 65,545 + 15,935 + 6,938 + 339 = $398,541 ✓ |
| Coates pays, known so far | transport $21,721.39 + accommodation $13,865.06 + meals $791.59 + misc $718.70 + fencing paid $60,476.50 + green-book labour $950 + rehire (approved) $118,575 = **$217,098.24** ✓ |
| The cost categories add to the same | rehire $118,575 + equipment $578 + fencing $61,426.50 + other $36,518.74 = $217,098.24 ✓ |
| Difference so far | $398,541.22 − $217,098.24 = **$181,442.98** ✓ (Today, Where we are, Costs & charges all show $181,443) |
| Stream differences | fencing +$31,124 · toilets −$49,483 · transport −$14,783 · people +$50,170 ✓ |

Things that read wrong or cluttered, now fixed:
- **Toilets on Today.** "Toilets and servicing · Coates pays $118,575" against $69,092 charged looked like a $49k loss with no reason given. The Event Portables quotes include the servicing, and the servicing is on no contract yet. At our card's pump-out rates it would be $85,102. Costs & charges already said so; Today now says it in one line.
- **Branch plates.** Labour, Transport, Damages and Subhire were listed on every branch, mostly as rows of dashes. Only kinds with something on them are shown now, and a branch with none says "nothing else charged yet".
- **Costs & charges.** The same sentence repeated under all 58 fencing docket rows. It's gone; each row's own description and the table's source column already say docket and card.

Not changed, but flagged for Andrew (it's the record, not the page): toilets and transport currently cost more than they charge. Toilets because the servicing isn't on a contract. Transport because the delivery charges on the contracts are $6,938 against $21,721 of carrier costs, and 34 of those carrier figures are minimums.

### Bugs and errors — re-checked
- **No script errors** on any tab, desktop or phone: no broken images, no sideways overflow.
- **Links and navigation:** every deep link works, and Back/Forward restore each tab's scroll. The drawer and showcase close without moving the page.
- **Search and the maps:**
  - Search → callout ringed at 2.6×.
  - Show on map rings P12.
  - All nine drawings open without a freeze.
- **Figures after this change:** unchanged ($398,541 / $217,098 / $181,443).

### Up to date — everything
| Piece | State |
|---|---|
| Delivery Control page | v6.73 live, byte-identical to this build (ETag 4f00748271eab6c6) |
| Media | 175 files, manifest cfc86a3d…, race call takes serving |
| Server (Railway, gc500-delivery-control / production) | deployment c4713e6d, SUCCESS, 25 Sep 23:57 UTC, 4 minutes after the last server change; `server.js` sha b8d38b8f… = the repo's `v6.30_race_day_cards/server_v5.83/server.js` = the served copy |
| The Coates Way machine | v5.85, every checked file's live ETag = its build hash |
| Commentary | one voice, GC500 Race Caller, 35 of 35 turns |
| Repo | every version committed and pushed on `claude/ampol-reporting-suite-access-h2hy90` |
