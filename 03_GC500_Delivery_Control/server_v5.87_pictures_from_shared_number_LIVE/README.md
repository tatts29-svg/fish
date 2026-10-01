# Server v5.87 — pictures from a sender that can send them (LIVE 21:50 AEST — verified end to end 21:56)

Author: Andrew Fisher · 1 Oct 2026, 21:45 AEST · one patch on the live server v5.86 (`f5b9a3f7…`)

## Why

Andrew, 1 Oct: plain texts from his Own Number arrive; picture messages from it never do. ClickSend accepted all four
picture messages that day (08:54, 09:03, 19:07, 20:53) and its own history records each as **FAILED, status 301**.
ClickSend's help page *How to send MMS Messages*: "Choose a shared number or your dedicated MMS number from the From
dropdown" — MMS goes from a **shared number or a dedicated MMS number**, not an Own Number. Its API notes: leave `from`
blank to use the pool of shared numbers. Andrew's Manage Senders page (screenshot, 21:22) shows a **Shared number — use
for MMS, SMS — Ready to use**. No purchase needed.

## What it changes

One new Railway variable, `MMS_FROM`:

| `MMS_FROM` | Picture messages go from | Plain texts go from |
|---|---|---|
| `shared` | a ClickSend shared number (`from` left out of the request) | `SMS_FROM` — unchanged |
| a number | that number (a dedicated MMS number, if one is ever bought) | `SMS_FROM` — unchanged |
| not set | `SMS_FROM`, exactly as v5.86 | `SMS_FROM` — unchanged |

So replies to a text still reach Andrew's phone; only pictures come from the shared number. Six lines of `server.js`
change (`diff` against v5.86): the sender worked out once at start; the MMS brief (`from`, `from_needed`, a new
`from_shared`); the 501 guard; the dry-run plan; the send itself; the labels (`/health` → v5.87, start-up banner). The
delivery lookup, the logs, the caps and every other route are untouched.

## Build and checks

```
python3 patch_server_v587.py ../v7.77_text_delivery_DRAFT/server_v5.86/server.js server.js
```
`server.js` **237,432 bytes, SHA-256 `d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc`**, `node --check` passes.

- `test_mms_sender.js` (local server + pretend ClickSend, no live call, no real message): **14/14** — shared: no `from`
  on any picture message, media and recipient still sent, texts still from `SMS_FROM`, brief and dry run name the shared
  number, banner says so; unset: exactly v5.86; a number: pictures from it, texts from `SMS_FROM`; no sender: 501 before
  ClickSend; shared alone is enough. (`test_mms_sender_results.txt`)
- Codex's v5.86 delivery suite run against v5.87 (labels only changed): **45/45** (`test_delivery_v586_on_v587_results.txt`).

## To go live (after both reviews)

1. Codex stages the blob `d5a0d777…` on the volume (edit key).
2. On Railway: `MMS_FROM` = `shared`; `SERVER_FILE` = `d5a0d777…`; `SERVER_FILE_KEEP` keeps `f5b9a3f7…` (v5.86) and
   the existing entries. One redeploy; `/health` → v5.87; deploy log `sha256sum /app/server.js` = `d5a0d777…`.
3. One test picture message to Andrew's phone (authorised: "You can both send messages to text"), then v5.86's delivery
   lookup on its ID. Rollback: `SERVER_FILE` back to `f5b9a3f7…` (and remove `MMS_FROM`).

## Activated — 1 Oct 2026, 21:50 AEST

- **Codex's sign-off (21:50):** rebuilt byte-identical from the reviewed v5.86; syntax passes; 14/14 sender checks and
  45/45 delivery checks run independently; no live message sent. Blob `d5a0d777…` staged and inventory-verified on the
  volume; v5.86 `f5b9a3f7…` present for rollback.
- **Claude, one Railway change:** `MMS_FROM=shared`; `SERVER_FILE=d5a0d777…`; `SERVER_FILE_KEEP` = `f5b9a3f7…` (v5.86),
  `76afbd99…`, `264363…`, `b8d38b…` (every earlier entry kept). One redeploy, deployment `81618338…`, SUCCESS.
- **Deploy log:** `server from volume blob d5a0d777…`; `sha256sum /app/server.js` =
  `d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc` (blob route, not the SERVER_B64 fallback). The
  banner shows "pictures from a ClickSend shared number", texting is unchanged, and 5 server blobs are kept off the public set.
- **`/health`:** `"build":"v5.87"`, record version 3521 (unchanged), files 308. Page unchanged: v7.77 `35e4b00b…`.
- **Before the switch:** the GC500 picture at 21:48:59 went on v5.86 from the Own Number and FAILED/301 (the old cause).
- **End-to-end test (Codex, 21:54–21:56):** after Andrew confirmed the recipient was his own phone (the handset that got
  the Quick MMS), exactly one authorised picture (the map image) was sent through GC500 on v5.87. It went from
  QUEUED to SENT/200, then **DELIVERED, status 201, no error code**, and Andrew confirmed the picture arrived on his phone.
  Follow-ups were GET only, with no resend.

**Result: picture texting is fixed.** No graphics, record or journal changes in this release.

