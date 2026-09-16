# GC500 Delivery Control — the hosted service

The live site (`gc500-production.up.railway.app`) is one Node process on Railway. It has no repository
of its own: the whole server is carried in the `SERVER_B64` variable (gzip + base64), decoded by the
service's start command, and the page it serves is uploaded through the admin link and kept on the
volume as `/data/app.html`. This folder puts the server under version control and adds v5.25.

```
gc500/
  server.v5.24.js      the server exactly as pulled from the running container on 16 Sep 2026
  build.js             applies the v5.25 patches + bundles the overlay → dist/
  overlay/overlay.css  the visual layer laid over the page at serve time
  overlay/overlay.js   its script: motion that follows the person + four runtime repairs
  dist/server.js       the built server (what runs)
  dist/SERVER_B64.txt  the value to put in the Railway variable
  dist/server.plain.js, dist/SERVER_B64.plain.txt   v5.24 untouched — the rollback
  test/run.js          local proof: server checks + Chromium checks + screenshots
  test/shell.html      the live page's CSS and HTML shell (no data, no app script), for the test
  test/stub.js         a stand-in for the app script, for the test
  REVIEW.md            what was reviewed, what was fixed, what is left for the build
```

## Build and test

```
cd gc500
node build.js                    # → dist/server.js, dist/SERVER_B64.txt, dist/build.json
node build.js --plain            # → the rollback bundle
NODE_PATH=/opt/node22/lib/node_modules node test/run.js   # needs playwright + chromium
```

## Deploy

Set `SERVER_B64` on the `gc500` service (project *gc500-delivery-control*, environment *production*) to
the contents of `dist/SERVER_B64.txt`. Railway redeploys on the change; the `/health` check gates it, so
a server that will not start never replaces the one that is running. `/health` answers with
`build:"v5.25"` and the overlay hash, and the deploy log's first line names the build.

Roll back: set `SERVER_B64` to `dist/SERVER_B64.plain.txt` (v5.24 as it was), or pick the previous
deployment in Railway's history. To keep v5.25 but drop the visual layer: set `OVERLAY=off`.

## How the overlay works

`app.html` is never changed. At start-up, and after every upload on the admin page, the service writes
`app.html.served` (and a gzip) = the uploaded page with `<style id="gc500-overlay">` and
`<script id="gc500-overlay-js">` laid in before `</body>`, and serves that. The ETag becomes
`"<upload etag>-<overlay hash>"`, so browsers refetch when either changes. A new build uploaded from the
admin page gets the overlay automatically; the overlay only keys on the page's own class names, and every
hook in it is optional, so a build that renames something loses that one effect and nothing else.

## Pulling the page

The uploaded page can be read out of the running container 100 KB at a time through Railway's agent
(`readContainerFileTool` on `/data/app.html`). On 16 Sep the agent's usage limit stopped that at about
a third of the file. Raising the limit in Railway → usage settings lets the rest be pulled, after which
the repairs marked "build fix" in REVIEW.md can go into the page itself rather than the overlay.
