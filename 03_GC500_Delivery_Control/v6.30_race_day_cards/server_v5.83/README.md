# The hosted record on Railway

The `--hosted` edition of the asset map (`print/out/GC500_Delivery_Control_hosted.html`) is served by `server.js` — one
small Node service with no dependencies — from Andrew Fisher's Railway account. It keeps the shared record that the
page reads and writes, so a few people can update it and many can view it, from phones and laptops alike.

## How it fits together

| Piece | Where | What |
|---|---|---|
| Service `gc500` | Railway project `gc500-delivery-control`, image `node:20-alpine` | runs `server.js` (decoded from the `SERVER_B64` variable at start) |
| Volume `gc500-data` at `/data` | Railway | `app.html` (the uploaded page), `records.json` (the record), `snapshots/` (hourly, four days), `writes.log`, `files/` + `files.json` (the document library), `media/` + `media.json` (the hosted pictures), `machine/blobs/` + `machine.json` (the Coates Way machine, v5.77) |
| Domain | `gc500-production.up.railway.app` | HTTPS, Railway-issued |
| View link | `/v/<VIEW_TOKEN>` | opens the page; can read the whole record, cannot change it (the page hides its controls and refuses saves) |
| Edit link | `/e/<EDIT_TOKEN>` | opens the same page with the right to change the record; the browser remembers the key |
| Admin | `/admin/<EDIT_TOKEN>` | upload a new build of the page, download the record (Import-ready JSON), see counts and links |
| Files | `/f/<token>/<id>` | a document from the library — SWMS, drawings, plates, packs — uploaded on the admin page or from the page's Documents tab (edit link) |
| The machine | `/w/<token>/` | The Coates Way · V8 Connected (v5.77): the build's `print/out/machine` folder, imported on the admin page, served whole under the view or edit key and opened inside the page's Coates Way tab; `/api/machine` says whether it is there |

Tokens live in the service's variables (`VIEW_TOKEN`, `EDIT_TOKEN`). **A link is a key**: change a token in the
variables (and redeploy) to cut a link off. Names inside the record are typed by people, never signed in.

## Day to day

The laptop tool does all of this from a prompt: `tools\gc500 status | check | backup | upload-app | upload-docs --kind swms <files> |
list-docs | remove-doc <id> | restore <backup.json> | links` (`python tools/gc500ctl.py …` anywhere else). It reads
`tools/gc500.local.json` for the address and the two tokens. Plain-language instructions: `docs/HOW_TO_SHARE.md`.

- **New build of the page**: run `python3 print/build_asset_app.py --hosted`, open `/admin/<EDIT_TOKEN>`, upload
  `GC500_Delivery_Control_hosted.html`. Everyone gets it on their next open. Records are untouched by an upload.
- **Feed the record to the build**: `/admin/<EDIT_TOKEN>` → *Download the record* → save as `sources/ops/as_supplied.json`
  → `python3 build_all.py`. (Or press Export inside the page — same file.)
- **Documents**: on `/admin/<EDIT_TOKEN>`, pick the kind (SWMS / transport & lifting / map / pack) and as many files as you like — the whole
  `print/out` set works. The page's Documents tab lights each card it knows once its file is there (matched by file
  name: `GC500_Site_Card_A3.pdf` is `GC500_Site_Card_A3.pdf`; spaces and `&` become `_`). SWMS uploaded here, or from
  the page by someone with the edit link, appear as their own cards. Keep copies in `sources/swms/` for the build.
- **Backups**: hourly snapshots on the volume; the admin download is the one to keep off-platform. The document
  library is not snapshotted — it is a copy of files you already hold.
- **Region**: `europe-west4`. The staged move to Singapore could not be applied (a service holds one volume; the patch
  would attach two) — discard it in the dashboard and delete the unused Singapore volume. The round trip from the Gold
  Coast to Europe is under a second on a page that loads once and polls a version number; it is not worth a second volume.

## The API the page uses (all calls need `x-gc500-token`)

`GET /api/version` · `GET /api/state` · `PUT /api/doc/<collection>/<id>` (edit) · `DELETE /api/doc/<collection>/<id>` (edit) ·
`GET /api/export` · `POST /api/admin/app` (edit; the page as the body) · `GET /api/files` · `POST /api/files` (edit; the file as the
body, `x-file-name`, `x-file-kind` swms|transport|map|pack|other, `x-file-title`; 160 MB) · `DELETE /api/files/<id>` (edit). Documents are last-writer-wins; the page
polls the version every few seconds and on focus, and fetches the record when it moves.

Collections are whatever the page writes (`delivery`, `costs`, `contracts`, `branch`, `purchaseOrders` …); the service stores any
name that passes its id rule. Its own `/api/export` folds only the collections it knows: **v5.16** adds `purchaseOrders`
(the fencing subhire's orders with the invoice numbers typed against them). Until v5.16 is uploaded, a live v5.14 service still
stores and syncs purchase orders between open pages; only its export leaves them out — the page's own Export carries them.

## Driver drop cards (v5.13)

A drop card is a per-load, read-only page handed to a carrier's driver. It is the one thing in this system that
goes to somebody outside Coates, so it is built to refuse:

- **Its own token namespace.** A card lives at `/d/<token>` on a 24-byte random token. A view link cannot make a
  card, list the cards or withdraw one — only the edit link can. A card token opens its own card and nothing else:
  not `/api/state`, not `/api/version`, not another card.
- **Frozen, and it fetches nothing.** The card is served exactly as it was posted, under
  `Content-Security-Policy: default-src 'none'; img-src data:; style-src 'unsafe-inline'` — no scripts, no network,
  pictures only as data URIs. `X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`; never cached.
- **It stops on its day.** `expires` is an ISO day (a date written the Australian way is refused, not guessed at).
  Past it the card returns **410** with a page carrying the load number and a number to ring — a driver at a gate
  gets a phone number, not a 404. A guessed token gets the same page.
- **Every open is counted**, and making, opening and withdrawing a card are all written to `writes.log`.
- Cap: 2 MB a card (a bigger POST is refused with a readable 413, not a cut socket), 400 cards kept.

`GET /d/<token>` (no token header) · `GET /api/cards` (edit) · `POST /api/cards` (edit; `{load, title, run_date,
expires, html, contact:{name, phone}}`) · `DELETE /api/cards/<token>` (edit).

`tests/test_drop_cards.mjs` runs 29 checks against this server, including every refusal above.

## SMS (v5.14 — live since the v5.19 deploy of 14 Sep 2026; the start-up line reads `texting on, 500 a day, from …`)

`POST /api/sms` — edit token only, ClickSend REST v3 over basic auth, a hard cap of `SMS_DAILY_CAP` messages a day
counted in Queensland time and refused before anything leaves, all-or-nothing on bad numbers, a landline named as
a landline, a curly quote or an em dash caught before it halves a message to 70 characters, every message kept on
the record (`/data/sms.json`, last 500) with the number, the words, the cost and ClickSend's message id.
`GET /api/sms` lists what has gone and what is left of the day; `GET /api/sms/account` asks ClickSend for the
balance. A `dry_run: true` body reads the numbers back and sends nothing. **Nothing sends itself** — there is no
schedule and no trigger; a message leaves because somebody holding the edit link pressed Send for it.

The credentials are Railway variables Andrew Fisher sets himself — `CLICKSEND_USERNAME`, `CLICKSEND_API_KEY`, and
optionally `SMS_FROM` (a registered alpha tag of up to 11 characters, or a `+61…` number ClickSend has verified as
his own) and `SMS_DAILY_CAP` (default 500). They are never in the HTML, never in this repository, never in a log
line and never pasted into a chat. The start-up line says `texting on, 500 a day, from …` or `texting not set up`.

Since 1 July 2026 an alphanumeric sender name to Australian mobiles must be registered with the ACMA Sender ID
Register (through ClickSend: Sender IDs › Alpha Tags; Coates' ABN and an authorised representative), or it arrives
labelled "Unverified". A verified own number, or a ClickSend number, needs no registration.

`CLICKSEND_BASE` is honoured only when `NODE_ENV` is not `production` — it is what lets `tests/test_sms.mjs` and
`tests/test_sms_panel.py` stand a pretend ClickSend on localhost and prove the cap, the refusals and the record
without a message ever leaving the building.

## The weather for the board (v5.17)

Where we are leads with Andrew Fisher's picture of the Coates #26 and the VMS trailer, and the board face in it
carries the day, the days to race day and — on today — the weather and wind at Surfers Paradise. Andrew Fisher,
12 Sep 2026: the current weather and wind conditions would be good, and he has an account with weatherapi.com.

`GET /api/weather` — view or edit token, same as the rest of the API so the address cannot be used by strangers to
spend his weather quota. The service calls weatherapi.com's `current.json`, hands back only the dozen fields the
board shows, and holds the reading for **ten minutes**, so a room full of phones is one call upstream.

`GET /api/weather/forecast` (v5.83, 26 Sep 2026) — same token rule. The service calls weatherapi.com's `forecast.json`
(seven days asked for; the plan decides how many come back) and hands back one trimmed row a day — the date, the
condition code and its words, the high and the low, the chance of rain, the rain in millimetres, the top wind, sunrise
and sunset — held for **an hour**. The Timeline's day cards paint it onto the days it covers and nothing onto the rest.

**The key is a Railway variable Andrew Fisher sets himself: `WEATHERAPI_KEY`.** It is never in the HTML, never in
this repository, never in a log line and never pasted into a chat — the page asks the service, the service asks
weatherapi.com. Optionally `WEATHER_Q` sets the place (default `Surfers Paradise, Queensland, Australia`). The
start-up line says `weather on, Surfers Paradise…` or `weather off — set WEATHERAPI_KEY to turn it on`.

### The live map's key (server v5.39, 18 Sep 2026)

`GET /api/map-key` — view or edit token. Answers `{provider: "mapbox", token: "pk.…"}` from the Railway variable
**`MAPBOX_TOKEN`**, which Andrew Fisher sets himself. This one IS handed to the browser, on purpose: it is a
Mapbox **public** token (`pk.`), and the phone fetches the map tiles straight from Mapbox with it — that is what a
public token is for. What keeps it ours is the **URL restriction** on the token in the Mapbox console, which must
list this service's address (`https://gc500-production.up.railway.app`); from any other address Mapbox refuses it.
A secret token (`sk.`) is never handed out whatever the variable holds (503 and the words). With no variable the
endpoint answers **404** and the page falls back to a key pasted on the hosted page (`mapKeys/mapbox` in the shared
record); with neither, the Live button explains itself and the photograph stays. The token is never in the HTML,
never in the record export, and the page sends Mapbox only its origin as referrer (never the path with the link's
token in it). Start-up line: `live map on (Mapbox public token)` or `live map off — set MAPBOX_TOKEN to turn it on`.

With no key the endpoint answers **503** and the words *"no weather key is set on this service yet"* — the
variable's name is deliberately not in the answer, because whoever holds the link is not always whoever runs the
service. The upstream error text is never passed through either, in case the key is in it. Whatever goes wrong,
the board shows **no weather at all** and the caption under the picture says why: it never invents a temperature,
a wind or a sky.

On a laptop copy there is no service, so the page can use a key kept in **that browser only** (a button under the
picture). It is held outside the record — it is never exported, never merged, never printed and never sent
anywhere except weatherapi.com. `tests/test_board_and_weather.py` holds all of this, including that none of the
three built editions contains a key.

## Re-filing a document (v5.20 — built, tested, NOT YET DEPLOYED)

Andrew Fisher, 15 Sep 2026: he had added the fencing dockets under Other on the admin page and nothing matched;
they showed as the number with .jpg on the end. The bytes were right; only the Kind box was wrong, and sending fifteen photographs
again to fix a dropdown is work nobody should do.

`POST /api/files/<id>/kind` — edit token only, `x-file-kind` header, one of the kinds this service files under.
It changes that one word on the file's card and nothing else: same bytes, same name, same hash, same upload time,
and a `refiled` note saying what it was and who changed it. A view token gets 403; an unknown kind gets 400; every
re-filing goes in `writes.log` as `op: "re-file"` like any other change. The admin page shows a one-tap **File as
Fencing docket** on any file whose name carries a number, and its Kind box pre-selects Fencing docket when every
file chosen is named like a docket number — an offer, overridden the moment a person touches the box.

**The page does not depend on this.** From build 25 it matches a signed paper to its docket by the number in the
file name whatever kind it went up under, so this endpoint is tidiness, not repair.

**The live service is v5.19, deployed 14 Sep 2026 16:30 Brisbane.** Everything in this section is in the
repository and waiting — the admin page is drawn by this server, so it changes on a Railway deploy and on nothing
else. The app HTML that Andrew Fisher uploads through `/admin/` is a different thing and updates without one.

## Where this should actually live

This service currently runs on **Andrew Fisher's personal Railway account**, holding Coates event data — asset
numbers, rental contracts, delivery records. Coates cannot control, audit or recover it. A link is a key, and names
are typed rather than signed in.

Coates-approved hosting inside the Coates tenant would remove that and would also replace link-based access with
real sign-in; the code would move unchanged, being dependency-free Node. **Andrew Fisher decided on 11 Sep 2026
not to take it to Coates IT.** It runs here, on his account, for this event.

For the record, it **cannot** be SharePoint either: SharePoint stores files and does not run server code, and
SharePoint Online hands an uploaded `.html` file to the browser as a download rather than rendering it. The PDFs
belong in a SharePoint library; a link to this service belongs on a SharePoint page.

Access is by email: the view link to everyone who needs to read it, the edit link to the few who record. A link
is a key, so the two go in separate emails.

## How the server actually reaches the service (read back from Railway on 19 Sep 2026)

The service is the `node:20-alpine` image with no repository behind it: the whole server travels as **one
variable, `SERVER_B64`** — `server.js` with its comments stripped, gzipped, base64 — and the **start command**
turns it back into a file and runs it. The command as it should stand (and as this package proves it in
`tests/test_server_deploy.py`, by running it) is in `START_COMMAND.txt`:

    sh -c 'mkdir -p /app; printf %s "$SERVER_B64" | wc -c >&2 && printf %s "$SERVER_B64" | tr -d "[:space:]" | tr "_-" "/+" | base64 -d | gunzip > /app/server.js && exec node /app/server.js'

The **first line of every deploy log is the number of characters the variable arrived with** (`wc -c`). It must
equal the `chars` that `make_server_b64.py` prints (28,852 for server v5.40). Anything less is a paste that was
cut short: the decode fails, the deploy fails, and **the server that was running keeps running** — that is what
the failed deploys of 14 Sep (three) and 16–17 Sep (two) were; the site never went down. The second line is the
server's own start-up line, which names its version (`server v5.40 — …`) and says what is switched on
(`texting on…`, `weather on…`, `live map on (Mapbox public token)`), then `records v<n> · files <n>`.

**What the twelve `SERVER_B64_01…12` variables were.** On 17 Sep 2026 at 06:24 Brisbane a server built
*outside this package* went live — its start-up line reads *"server v5.25 — the overlay laid over the page at
serve time (visual upgrades + runtime repairs, OVERLAY=off to stop it) + records written one at a time and
flushed on shutdown + …"* followed by this package's v5.24 feature list. It came from the same source as the
ChatGPT review pack of that morning (`GC500_Audit_and_Upgrade_20260917.zip`, whose own notes say it deploys
nothing); it lays an enhancement layer over whatever page is uploaded, at serve time, and this package has
never seen that layer or tested the page under it. Its blob was **43,068 characters — over the cap** — so it
went up as twelve equal pieces of 3,589 in `SERVER_B64_01…12`, with `SERVER_B64` set to the reference line
`${{SERVER_B64_01}}${{SERVER_B64_02}}…${{SERVER_B64_12}}` (Railway renders references into one value at
deploy), and a start command that first printed each piece's length and sha256 prefix. `SERVER_B64_A`,
`SERVER_B64_B` and `SB1` are earlier attempts at the same thing; nothing reads them. That server ran until the
v5.40 deploy; **this package does not hold its source**, so the only way back to it was the twelve pieces
themselves, which is why the deploy note says to delete them last.

**Andrew Fisher, 19 Sep 2026: remove them and have just one.** So: one variable, this package's server,
the plain start command. The steps for a phone are in `DEPLOY_server_v5.40.md` at the package root. The
**pieces fallback** stays in the tool for the day a single paste keeps arriving short:
`python3 hosting/railway/make_server_b64.py --pieces-only 12` writes `hosting/railway/pieces/` — one file per
variable, named after the version the blob decodes to (`V540_01…12`), the reference line to put in
`SERVER_B64`, and a CHECK list of each piece's length and hash. The start command needs no change for pieces;
it reads `SERVER_B64` whether that is a value or a reference.

This was read from the service with the Railway connector, **read only** (service config, variable *names*,
deploy history, deploy logs — variable values are not shown to a connected app). Nothing on the service was
changed from here; the deploy is his, from the admin page and the Variables tab, as always.

## Running it anywhere else

`PORT=8080 DATA_DIR=./data VIEW_TOKEN=<16+ chars> EDIT_TOKEN=<16+ chars> node server.js` — nothing else to install.
