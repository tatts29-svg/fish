# server v5.85 — a text with a picture of the map (MMS)

**Staged 1 Oct 2026 08:11 AEST; not activated yet.** The 228,182-byte server blob is present and validated. Railway owner must set `SERVER_FILE` to the source hash below and retain the full rollback hash `264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14` in `SERVER_FILE_KEEP`, preserving existing entries, then redeploy once. Current `/health` still reports v5.84. Use `/health` to verify v5.85: the source startup banner was not updated. No further machine registration until the staged blob is protected.

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "I want a picture of the map of where it goes … enter in mobile number and it will text it to
you, MMS, I don't mind the cost."

The live service is v5.84 (`/health` → `"build":"v5.84"`, checked 1 Oct 2026). v5.85 is v5.84 plus one thing:
picture messages. Nothing else in the file changes (`server_v5.84_to_v5.85.diff`, 165 lines).

| | |
|---|---|
| Source | `server.js`, 228,182 bytes, sha256 `76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` |
| Made by | `python3 patch_server_v585.py server.js` on the v5.84 file (sha256 `264363128b6c4bc1fd…`) |
| Tests | `node test_mms.js` — 37 / 37 pass, local only (a throw-away DATA_DIR, test tokens, a pretend ClickSend) |

## What it adds

- **`POST /api/mms`** — the edit link only, as texting is. `{to, text, subject, picture, dry_run}`. The picture is
  the JPEG the page drew (a data URL), at most 250 kB — ClickSend's wall for MMS media. It is kept under its SHA-256
  in `$DATA_DIR/mms/` and sent to ClickSend `/mms/send` as `media_file: <service>/p/<sha256>.jpg`. Counted against
  the same daily cap as texts (`SMS_DAILY_CAP`, one a recipient), on the same log (`sms.json`) with `kind: 'mms'`,
  the price ClickSend answers recorded. All-or-nothing on bad numbers, a landline named as a landline, the same
  number twice is one message — exactly as texts behave. `dry_run: true` keeps the picture and answers the plan
  without sending.
- **`GET /api/mms`** (edit) — set up or not, the sender, today's allowance, the limits, the last 20 pictures sent.
- **`GET|HEAD /p/<sha256>.jpg`** — the picture, `image/jpeg`, `Cache-Control: public, max-age=86400`. No key on it:
  ClickSend has to fetch it, and the name is the hash of the bytes — 64 hex characters nobody can guess; nothing is
  ever there but what an editor sent. Only names that are exactly a hash reach the folder. Pictures older than 14
  days are swept (at start, then every 6 hours).
- The service's own address for the picture link: `PUBLIC_BASE` when set, else the request's
  `X-Forwarded-Proto`/`X-Forwarded-Host` (Railway's edge sets them) or `Host`.
- ClickSend requires `from` for MMS: `SMS_FROM` must be set, or `/api/mms` answers 501 saying so plainly. The
  Railway service has `SMS_FROM` set.
- Walls: body 1,500 characters (500 when not in the plain alphabet), subject 20 (trimmed), picture 1 kB–250 kB,
  JPEG only (`FF D8 FF`), request body 700 kB.

## Cost

ClickSend MMS to an Australian mobile is priced per message (about $0.30–0.40 each on the account's rate; the
exact figure comes back in the answer and is on the log). Andrew, 1 Oct: "I don't mind the cost." The daily cap
still applies.

## Deploying (the lead, with the edit key — not done from here)

The same three steps as `v6.77_v6.78_DRAFT_awaiting_approval/server_v5.84/DEPLOY.md`, with the new hash:

1. `PUT /api/admin/machine/blob/76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` with the file
   as the body (edit key). The server checks the bytes against the hash before writing.
2. Railway → service `gc500` → Variables: `SERVER_FILE = 76afbd99…57684`, and add the old hash
   (`264363128b…`) to `SERVER_FILE_KEEP` so the rollback stays on the volume. Optionally `PUBLIC_BASE =
   https://gc500-production.up.railway.app` (not needed: the edge headers give it). Deploy once — a service with a
   volume has a gap of seconds while the container turns over; pick a quiet moment.
3. `GET /health` → `"build":"v5.85"`. Then the page's Text box shows the tick "Send the picture too".

Rollback: `SERVER_FILE` back to the v5.84 hash and deploy. Nothing on the volume is changed by v5.85 except the
new `mms/` folder and `kind: 'mms'` entries on `sms.json`.

## Not done here

- No real ClickSend call was made. The pretend ClickSend fetched the picture over HTTP exactly as the real one
  must; on the live service it will fetch over HTTPS from the public address.
- ClickSend's MMS `from`: the docs say a sender id; the account's `SMS_FROM` (an alpha tag) is what goes. If
  ClickSend refuses an alpha sender for MMS in Australia, the answer comes back word for word in the box and on the
  log, and a dedicated number would need to be set as `SMS_FROM`.
