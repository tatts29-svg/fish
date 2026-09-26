# Deploying server v5.84 (and rolling it back)

Nothing here has been run against the live service. This is for the lead to run after approval. Every step was
rehearsed locally, with v5.83 standing in for live, the start command's own logic, and the repo's
`machine_set.py`. The script is `rehearse_deploy.sh` and its output is `rehearsal_output.txt`.

| | |
|---|---|
| New server | `/tmp/claude-0/stage/server/server.js`, 216,494 bytes, sha256 **`264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14`** |
| Rollback server (live now, v5.83) | sha256 **`b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd`**, already on the volume |
| Diff | `server_v5.83_to_v5.84.diff` |
| Filtered machine manifest (step 4) | `deploy/machine_v585_noserver_keep.json` (207 files: the v5.85-dyno set without `server/gc500-server.js`) |

Shell setup for the steps below. The token comes from your own environment. It is never typed into a file and
never echoed.

```sh
export BASE=https://gc500-production.up.railway.app
export GC500_EDIT_TOKEN=...            # the edit token, from your password manager
S=/tmp/claude-0/stage/server
NEW=264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14
OLD=b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd
sha256sum $S/server.js                 # must print $NEW
```

## How the server file reaches the service, and why the order matters

- **Start command.** It copies `$DATA_DIR/machine/blobs/$SERVER_FILE` to `/app/server.js` if that blob exists and
  is non-empty. Otherwise it decodes `SERVER_B64`, which holds an older server, not v5.83. Then it runs
  `exec node /app/server.js`, so node is PID 1.
- **Blob storage.** `PUT /api/admin/machine/blob/<sha256>` (edit token) stores any file under its hash. It is
  never served on its own: `/w/` serves only paths that the registered set lists.
- **v5.83 deletes unlisted blobs.** Registering a machine set deletes every blob the set does not list. That is
  why the server used to be listed publicly as `server/gc500-server.js`: listing it was the only way to keep it.
  It also meant anyone with the view link could download the server source from `/w/<view>/server/gc500-server.js`.
- **v5.84 keeps the named blobs.** Blobs named by `SERVER_FILE` and `SERVER_FILE_KEEP` (comma-separated) are never
  deleted by a register. So the order is:
  1. upload the new blob;
  2. boot v5.84 with the variables set;
  3. only then register a set without the server path.
- **Do not import a machine set between step 1 and the end of step 3.** That covers the admin page's "Import the
  machine" and `machine_set.py`. While v5.83 is live, any import deletes the v5.84 blob you just uploaded. If
  that happens anyway, repeat step 1.
- **Downtime.** A service with a volume cannot run two deployments at once. Every redeploy, including a rollback,
  has a short gap of seconds while the old container stops and the new one starts. Choose a quiet moment.

## Step 0: before anything (read-only)

1. **Take a copy of the record off the platform.**
   `curl -sS -H "x-gc500-token: $GC500_EDIT_TOKEN" $BASE/api/export -o gc500_record_before_v584.json`
   Check that the file is a few hundred KB and opens as JSON.
2. **Confirm the live machine set is v5.85-dyno.**
   `curl -sS -H "x-gc500-token: $GC500_EDIT_TOKEN" $BASE/api/machine`
   It must show `"version":"v5.85-dyno"` and `"sha256":"e21999335372e77e…"`.
   - If it shows anything else, do not use `deploy/machine_v585_noserver_keep.json` in step 4.
   - Instead, build the filtered manifest from the manifest the live set was actually registered from, using the
     same one-liner as in step 4.
3. **Check the Railway variables** (Variables tab):
   - Note the current value of `SERVER_FILE`. Expected: `b8d38b8f…`.
   - Note whether `SERVER_FILE_KEEP` or `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` already exist.
   - Leave `SERVER_B64` alone.
4. `curl -sS $BASE/health` → record `version`, and check `"ok":true`.

## Step 1: put the v5.84 blob on the volume (v5.83 still live)

```sh
curl -sS -X PUT -H "x-gc500-token: $GC500_EDIT_TOKEN" -H 'Content-Type: application/octet-stream' \
     --data-binary @$S/server.js $BASE/api/admin/machine/blob/$NEW
# expect: {"sha256":"2643631…","bytes":216494,"already":false}
curl -sS -H "x-gc500-token: $GC500_EDIT_TOKEN" $BASE/api/admin/machine | python3 -c \
  "import sys,json; b={x['sha256'] for x in json.load(sys.stdin)['blobs']}; print('new', '$NEW' in b, 'old', '$OLD' in b)"
# expect: new True old True
```

The server checks the bytes against the hash before writing, so a truncated upload is refused rather than stored.

## Step 2: point the service at it (one deploy)

In Railway → service `gc500` → Variables, set all three, then Deploy the staged change once:

| Variable | Value | Why |
|---|---|---|
| `SERVER_FILE` | `264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14` | boot v5.84 |
| `SERVER_FILE_KEEP` | `b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd` | keeps v5.83 on the volume for rollback |
| `RAILWAY_DEPLOYMENT_DRAINING_SECONDS` | `10` | Railway's default is **0**: SIGTERM, then SIGKILL at once, so the new shutdown flush gets no time. v5.84 needs well under a second; 10 is headroom. |

The start command does not change.

## Step 3: verify

1. **Deploy log, first line.** It must start with `GC500 hosted record on :… · server v5.84 — HARDENED`. The
   same line must end with:
   - `records v<the version from step 0>`
   - `· server blob 2 kept off the public set`
   - no `!!! RECOVERED FROM SNAPSHOT`.

   If it says `server v5.83`, the blob was not found: check the variable for a typo or a missing character.
2. **Health.** `curl -sS $BASE/health` must show `"build":"v5.84"`, `"record_recovered":null`, `"ok":true` and the
   same `version` as step 0.
3. **Compression.** About 30–60 s after boot, the page's brotli copy is ready (one-off, ~16 s of CPU).
   Test it without printing the token:
   ```sh
   read -rs VIEW; curl -sS -o /dev/null -D - -H 'Accept-Encoding: br, gzip' "$BASE/v/$VIEW" | \
     grep -iE '^(HTTP|content-encoding|content-length|strict-transport|referrer-policy|vary)'; unset VIEW
   ```
   Expect `content-encoding: br`, about 1.44 MB, `strict-transport-security: max-age=15552000`,
   `referrer-policy: strict-origin` and `vary: Accept-Encoding`.
   - Right after boot it says `gzip`. Wait and try again.
   - The machine files compress in the background for the first few minutes.
4. **Browser.** Open the view link and the edit link.
   - Check the footer shows live sync.
   - Open the Coates Way tab and the live map. The map is the one thing local tests could not exercise; see
     NOTES.md on the referrer policy.
   - Make one small edit on the edit link and reload another browser to see it.

## Step 4: take the server out of the public machine set

Only do this once step 3 has passed. v5.84 must be running with `SERVER_FILE` set, because v5.83 would delete
the blobs here.

```sh
# regenerate the filtered manifest if step 0.2 showed a different live set (point M at that manifest)
M=/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/machine_v585_manifest.json
python3 -c "import json;m=json.load(open('$M'));m['files']=[f for f in m['files'] if f['path']!='server/gc500-server.js'];json.dump(m,open('$S/deploy/machine_v585_noserver_keep.json','w'),indent=1);print(len(m['files']),'files')"
T=/home/user/fish/03_GC500_Delivery_Control/satellite_explorer/tools
python3 $T/machine_set.py --base $BASE --token-env GC500_EDIT_TOKEN --keep $S/deploy/machine_v585_noserver_keep.json \
  --entry index.html --label "The Coates Way · V8 Connected + Satellite plan explorer" --version v5.85-dyno-noserver --dry-run
# expect: set: 207 files, 164.2 MB, digest 6928b042e6dc   (dry run: no network)
python3 $T/machine_set.py --base $BASE --token-env GC500_EDIT_TOKEN --keep $S/deploy/machine_v585_noserver_keep.json \
  --entry index.html --label "The Coates Way · V8 Connected + Satellite plan explorer" --version v5.85-dyno-noserver
# expect: blobs: 0 uploaded, 207 already on the volume
#         register: 200 {... 'removed': 0, 'kept_unlisted': 2}
```

- **Stop if `kept_unlisted` is not 2.** Re-run step 1 if the new blob is gone, and do not restart.
- **Check the source is no longer public.** `read -rs VIEW; curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/w/$VIEW/server/gc500-server.js"; unset VIEW`
  must print **404**. Before this step it printed 200.
- **Check the machine page.** Open the Coates Way tab again; it must still open.

**From now on:**
- Machine imports (admin page or `machine_set.py`) must not include the server. Drop the
  `--add-file server.js=server/gc500-server.js` argument.
- Keep `SERVER_FILE` set. Unless a blob is named in `SERVER_FILE` or `SERVER_FILE_KEEP`, the next import deletes it.
- A later server build follows the same pattern:
  1. upload the new blob;
  2. set `SERVER_FILE` to the new hash and `SERVER_FILE_KEEP` to the one it replaces;
  3. deploy.

## Rollback

**R1. Back to v5.83 (any time after step 2).**
1. Set `SERVER_FILE=b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd` and
   `SERVER_FILE_KEEP=264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14`, then Deploy.
2. The deploy log's first line then reads `server v5.83 — THE FORECAST`, and `/health` has no `build` field.

This was rehearsed locally in both directions. Railway's own Rollback on the previous deployment should also work,
but setting the variable is explicit and needs no knowledge of what that deployment captured.

**Warnings while v5.83 is back:**
- **Do not import a machine set.** v5.83 has no keep list, so an import deletes both server blobs. The restart
  after that would then boot the old `SERVER_B64` server.
- If an import is needed while on v5.83, first put the server back in the set:
  `machine_set.py --keep machine_v585_manifest.json …` (the original manifest, with `server/gc500-server.js`).
  Both blobs are still on the volume because v5.84 kept them.

**Files v5.84 leaves behind are harmless to v5.83,** which ignores them:
- `app.html.br` and `app.html.br.etag`
- `machine/cz/`
- `snapshots/files-*.json` and `snapshots/*-boot.json`. v5.83 counts the boot snapshots among its 96 when rotating,
  so it may drop a few old hourly ones sooner.

Delete them only if you want the space back; that is about 8 MB.

**R2. If v5.84 will not start.** The deploy log says `!!!!! GC500 REFUSING TO START: <file> …`.
- This is v5.84 refusing to start empty over a damaged store, so it is not a code fault. Do not roll back to
  v5.83 just to get it up: v5.83 would start with that store empty and overwrite it on the next write.
- Instead:
  1. Look at the named file.
  2. If it is `cards.json`, `reports.json` or `scoped_reports.json` and it cannot be repaired, moving it aside
     (renaming it) is the owner's decision. The service then starts without it.
- A damaged `records.json` or `files.json` does not stop the start. It is loaded from the newest valid snapshot,
  with `!!!!! … RECOVERED FROM SNAPSHOT` in the log and `record_recovered` on `/health`. The damaged file is kept
  as `<name>.corrupt-<time>`.

**R3. Undo step 4 only (put the server back in the public set).** Not normally wanted:
```sh
python3 $T/machine_set.py --base $BASE --token-env GC500_EDIT_TOKEN --keep "$M" --entry index.html \
  --label "The Coates Way · V8 Connected + Satellite plan explorer" --version v5.85-dyno
```

## After the deploy: what to watch

- **CPU in the first minutes:** brotli for the page (once per upload, ~16 s), then the machine set, one file at a
  time. It all runs in zlib's thread pool, so requests keep being answered.
- **Disk:** about 1.4 MB for the page's `.br` and about 6 MB for `machine/cz/`. Locally the 160 MB set's `.bin`
  files do not compress and get a 0-byte `.x` marker.
- **New answers:** 507 on a record write means the disk refused it. The page keeps the change queued, as it
  already did for v5.58's refusal. 429 means an address hit the wrong-key limit.
- **`SERVER_B64` is now only a fallback, and a stale one.** v5.84 gzips to about 67 KB with its comments, well
  past the 32,768-character limit of a single variable. The blob is the delivery route. If you ever want the
  fallback current, `hosting/railway/make_server_b64.py --pieces-only` is the existing tool.
