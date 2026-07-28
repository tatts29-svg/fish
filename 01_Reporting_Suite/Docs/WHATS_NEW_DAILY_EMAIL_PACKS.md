# The daily email packs — what you've got and how it works

**Coates | Cement Australia K2 Shutdown 2026 — Gladstone**
Andrew Fisher | POWERED BY SITEIQ | 25 Jul 2026

---

## The short version

Every morning, after the reports build, you now get a folder per company
with that company's report, its attachments, an addressed draft and the
record — plus one page that tells you what's ready and what isn't.

```
K2 DAILY REPORTING\
  00 MASTER DAILY REPORTS\2026-07-25\      the six site-wide masters
  01 COMPANY REPORTS\DGH Engineering\2026-07-25\
        DGH Engineering - On-Hire Report - 2026-07-25.html   goes in the body
        Daily Safety & Compliance Report - 2026-07-25.pdf    on the paperclip
        Email Draft - 2026-07-25.eml                         ready to send
        Email Record - 2026-07-25.txt                        who, what, checks
  02 EMAIL CONTROL\        Daily Email Control - 2026-07-25.html
                           Email Control Register.xlsx  (the whole shutdown)
  03 CONTACTS & SETTINGS\  the workbook that did the routing, kept with the day
```

**Nothing sends.** Open the `.eml`, read it, press Send yourself.

Today: **7 ready, 0 held, 5 with nothing on hire.**

---

## The one rule

> A DGH report can never be sent using the Cleanaway recipient list.

The company name ties the data, the folder and the recipients together.
Every address comes out of `K2_Daily_Email_Report_Allocation.xlsx` —
**not one is written into any script**. Change the workbook, run again,
the packs follow it.

Every pack is checked before it is called ready. **Fourteen checks**, and
if one fails the pack is held:

| # | Check |
|---|---|
| 1 | The company is on the on-hire register |
| 2 | The folder is this company's, and everything in it is today's |
| 3 | The company is named in the subject |
| 4 | At least one confirmed address in To |
| 5 | The four fixed oversight contacts are in Cc (client master: its own routing) |
| 6 | The report in the body is today's, and still the current one |
| 7 | There is a report to paste in |
| 8 | The Daily Safety & Compliance PDF is attached (client: all five) |
| 9 | **No other company's information anywhere in the pack** |
| 10 | Every address is on the contact register **for this company** |
| 11 | Every attachment is on disk, listed once |
| 12 | The draft reads back exactly as addressed |
| 13 | The email is small enough to actually send (under 20 MB) |
| 14 | Every PDF was built from today's report |

Check 9 doesn't look at the filename — it **reads the report** and looks
for another contractor's name in it. Check 10 is what stops an address
pasted into the wrong row: everyone on the email has to be on the
Contacts sheet against that company.

**A held pack leaves no sendable file.** Its draft is renamed
`HOLD - Email Draft - <date>.eml.txt` so it can't be double-clicked and
sent by mistake. Fix the workbook, run again, and it comes back as a
proper `.eml`.

---

## The five statuses you'll actually see

| Status | Means |
|---|---|
| **Draft Ready** | Checked and addressed. Open it and send it. |
| **Failed – Review Required** | Something's wrong. The record says what. |
| **Not Generated** | That company holds nothing on hire today. Folder and record made, no email. |
| **Sent** | You wrote it on the record after sending. |
| Generated / Checked | In the vocabulary, not used by the run. |

**Cleanaway, Industec, Synclift, Tasman Rope Access and Universal Cranes**
hold nothing on hire in the current register. They get a folder and a
record every day so the day is complete — and no email, because there's
nothing to send them. The moment gear goes out in their name, their pack
builds itself.

---

## Nothing is ever overwritten

Rule 7, taken seriously:

- A dated folder that already holds a report is left as it is.
- **A record you have signed** — anything written on the `Sent by` line —
  is never touched. A later run puts its version beside it as `(2)`.
- An **unsigned** record stays current (it's the file you open to decide),
  and the earlier one is kept as `(earlier 1)`.
- A **re-issued report** — fresh SiteIQ pull, second run of the day — is
  filed as `(2)` and the pack is rebuilt from it. But if you'd already
  signed the record, the pack **stops and asks**, because sending a second
  time is your call.
- A superseded draft is kept as `(superseded 1).eml.txt` — kept, but not
  sendable.

---

## Running it

| Button | What it does |
|---|---|
| `17_BUILD_DAILY_EMAIL_PACKS.bat` | Builds the day's packs, then proves them |
| `18_CHECK_DAILY_EMAIL_PACKS.bat` | Proves them without building anything |

`00_RUN_EVERYTHING.bat` now runs the packs as step 10, so a normal morning
needs no extra button.

`18_CHECK` is worth knowing about. It reads the routing workbook **for
itself**, opens every draft the way Outlook opens it, compares the two —
then deliberately feeds thirteen mistakes through the builder to prove
they'd be caught: a Cleanaway address pasted into the DGH row, an
oversight contact dropped, a contractor added to the client's list, an
empty To, a company renamed, a look-alike company's report, a page missing
from the middle of a report, a report re-issued after you signed for it,
and more. **203 checks. All passing.**

---

## Two address books — worth knowing

`06_SEND_TODAYS_REPORTS.bat` uses `Coates_Report_Recipients.xlsx` and
**sends automatically**. The packs use
`K2_Daily_Email_Report_Allocation.xlsx` and never send.

The two books don't agree — the recipients book has people and companies
(Walz, ISH24, extra HRS contacts) that aren't on the routing sheet. For
the daily company and Cement emails, **send from the packs**. I've put a
note on the `06` button so it's in front of you at the moment it matters.

If you'd rather the two were merged into one book, say the word — but
that's your call, not something I'd change underneath you.

---

## Four things I found and fixed along the way

**1. The bottom of every emailed page was being cut off.**
Headless Edge keeps 87 pixels of the window it's given for itself, so a
794×1123 A4 request only ever got 1036 pixels of page. The last 87px of
every sheet was missing from every report email — which is exactly where
*your Coates tool store team* sits. It's measured now, on the machine
that's running, and the strip is back on every page.

**2. Long reports were being sent short.** The page capture stopped at 16
pages. DGH's on-hire report is 22 — and the email looked complete, because
there's nothing on page 16 that says "there's more". It now asks the report
how many pages it has and photographs all of them, writes that number down
beside the pictures, and **holds the pack** if the email doesn't have them
all.

**3. Semicolons between email addresses.** `a@x; b@y; c@z` is what you type
into Outlook's To box, but inside an email file the separator is a comma —
a strict mail server reads a semicolon list as one malformed address and
**only the first person gets it**. That was in the packs and in every other
report email the kit writes. All fixed, and the packs now read every draft
back after writing it to prove all the addresses survived.

**4. PDFs older than the reports they came from.** On 24 Jul the HTML was
rebuilt at 13:59 and the PDFs were last made at 13:44 — a run with no PDF
engine leaves the old PDF sitting there looking current. The kit now says
so loudly at the time, and the packs refuse to attach one.

---

## Two things to know

**The Cost Tracking Snapshot needs the K2 workbook.** It isn't in the
folder I'm working from, so today's Cost Tracking PDF is the one from your
own machine. On your PC it rebuilds every morning as normal.

**Pillow is optional.** If Python on your machine has it, the page pictures
are trimmed exactly to the sheet. Without it there's a small white gap
between pages in the email body — invisible against the white background,
just slightly more air. `pip install pillow` if you want them flush.

---

Andrew Fisher | Shutdown Manager | Coates | POWERED BY SITEIQ
