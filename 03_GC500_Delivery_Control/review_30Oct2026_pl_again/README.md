# The P&L tab reviewed again — clean, clear, and where the costs are

Author: Andrew Fisher. 30 Oct 2026, 20:3x AEST. Andrew, 20:2x AEST, three hours after v12.65 went live: "I also want the p&l
reviewed again. I want it clean and clear. Easy to understand. And u understand where costs are." This is the review of the
live face (v12.65, `10e8e8c2…`) and the proposal, as a mock-up with tonight's real figures, for his yes. **Nothing on the page
has changed.** Every figure below is the live page's own model's, read at 20:24 AEST on record 12172.

## What is on the face now, and why it still is not clear

1. **The costs are cut three ways on the one tab.** The face lists cost of sales in Finance's ledger lines (2126 Rehire,
   3325 Pump-outs, 2120 · 2140 Transport, 2142 Installation, 2144 Consumables). The by-branch table under it cuts the same
   money by stream (Fencing, Event Portables, sub-hired plant, carriers, labour hire, travel). At a glance, in the Workings
   fold, cuts it a third way: the eight categories management expect. None of the three says in one place who we pay, for
   what, on which branch. "Where are the costs" has no single answer on the tab.
2. **Two different "difference so far" figures on the one tab.** At a glance and the Forecast P&L say $556,106.09; the face's
   Contribution on the record says $523,598.38. The gap is the $32,507.71 we pay Job Connect for their people: the models
   leave it out "so far" and put it in at job end, so the two columns are not the same measure. Breaks "one figure everywhere".
3. **Finance's words lead.** Ledger codes in the first column, Cost of sales, Gross margin, Contribution. Andrew's settled
   words are Revenue, Direct costs and Difference so far ("not a margin yet"), with the ledger name beside them for Finance.
4. **The eight categories are on the page but not usable as the face.** They carry only the known figure (no job end), put
   labour hire in as hours only, hide transport inside "Any other event-related expenses", and leave three categories empty
   with nothing said.
5. **Two hour counts for the Coates people**: 1,695.5 h rostered on At a glance, 1,467.5 h paid on the P&L.
6. **On a phone it is 2,800 px of four-column tables**, a note under most lines, and a by-branch table that scrolls sideways.

## The proposal (the mock-up: `mock/pl_mock_v1266.html`, `mock/pl_mock_desktop.png`, `mock/pl_mock_phone.png`)

One cut of the costs, in Andrew's words, phone first:

1. **Three tiles**: Charged to the V8s · What it costs us · Difference so far (with job end under each). One difference,
   the same figure everywhere: $523,598.38 so far (51.7%), $486,576.75 at job end (47.3%).
2. **What we charge the V8s** — revenue by stream in plain words (Our gear on hire · Hired-in gear at our rates · Delivery and
   pick-up · Toilet pump-outs · Install, demob and the people · Consumables · the event scope's accommodation and travel ·
   miscellaneous), ledger code in small grey print for Finance, two columns: So far · Job end.
3. **Where the costs are** — one table under the eight categories management expect, each line naming who we pay and what
   for, the branch in small print, So far · Job end:

   | Category | Who we pay, what for | So far | Job end | Branch | Ledger |
   |---|---|---:|---:|---|---|
   | Temporary fencing and crowd control | Advanced's gear on the dockets, at their sheet | 241,018.70 | 244,743.70 | STPS | 2126 |
   | External contractor costs | Advanced's crew: dockets and the green book | 52,391.00 | 52,391.00 | STPS | 2142 |
   | External contractor costs | Job Connect's people on the running sheet | 32,507.71 | 35,531.56 | KINP | wages |
   | Rehire costs | Event Portables: toilet hire, their labour, delivery and pick-up | 45,525.00 | 45,525.00 | KINP | 2126 |
   | Rehire costs | Event Portables: servicing on our site count | 51,372.00 | 51,372.00 | KINP | 3325 |
   | Rehire costs | Event Portables: water deliveries and the tank | 4,850.00 | 4,850.00 | KINP | 2144 |
   | Rehire costs | Premiair's boards, Royal Wolf's container (estimates) | — | 5,170.54 | KINP · STPS | 2126 |
   | Internal labour hours and overtime | Coates wages, hours only (23 Oct ruling) | 1,126.5 h | 1,467.5 h | KINP | 3210 |
   | Internal labour hours and overtime | Salary allowance, living away | — | 14,700.00 | KINP | 3210 |
   | Any other event-related expenses | Transport paid to the carriers | 33,150.09 | 56,810.65 | by the load | 2120 · 2140 |
   | Any other event-related expenses | Accommodation, 112 nights | 22,023.96 | 24,581.57 | KINP | 3520 |
   | Any other event-related expenses | Meals and expenses | 5,664.32 | 5,664.32 | KINP | 3520 |
   | Equipment · Installation-related · Buy invoicing branch | nothing recorded, said in one line | — | — | | |
   | **What it costs us** | | **488,502.78** | **541,340.34** | | |
   | **Difference so far** | | **523,598.38** | **486,576.75** | | |

   The totals are the Finance handover's to the cent (to date 488,502.78, job end 541,340.34) and the differences the
   Forecast P&L's job-end figure and the face's on-the-record figure.
4. **By branch, job end** — four small cards and the job (Charged · Costs · Difference), the KINP ruling of 29 Oct under them.
5. **Not in it yet** — six lines, the owner in the line.
6. **Three closed folds**: Finance's lines (the ledger table as it is today, gross margin and contribution for Finance),
   Fencing everything included, Workings. Nothing removed.

## What it takes to build (one release, on Andrew's yes)

- `moneySummary().categories` grows a job-end figure per line and takes the labour hire dollars (and the allowance) as money,
  not hours, so At a glance and the face read **one** model and show one difference. The Forecast P&L's "difference so far"
  then includes labour hire the way its job-end figure already does. (Business call 1 below.)
- The face script reads that model instead of cutting pl770 and fh866 its own way; the by-branch cards keep the KINP ruling.
- The ledger table moves into the Finance's lines fold unchanged; tests check every figure against the models to the cent and
  that the three folds hold every old card with its buttons; both sweeps; phone screenshot.
- The two hour counts: the face shows the paid hours (1,467.5 h) and At a glance says "rostered" where it means rostered.

## For Andrew

1. **Labour hire in the difference so far** — yes (the proposal: we pay Job Connect, so it counts so far as it does at job end),
   or keep it out so far as At a glance does today?
2. **The big figure on the tiles**: so far on the record (the proposal), or job end as the face has now?
3. **Transport** sits under "Any other event-related expenses" as its own line, because management's list has no transport
   line. Keep it there, or show it as a ninth group of its own?
