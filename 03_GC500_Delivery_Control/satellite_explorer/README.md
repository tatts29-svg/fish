# GC500 Satellite Plan Explorer — source and hosting record

Built 25 Sep 2026. Live at `/w/<token>/explorer/index.html` on the dashboard service (3D proof at `/w/<token>/poc3d/index.html`).

- `explorer/` — the page (`index.html`, `explorer.js`, `scene-worker.js`), its README (what it is, alignment
  evidence, performance, hosting, limits), the review folder and the small assets. The preserved scene
  (`drawing-scene.bin`, 13.6 MB, the bytes of the original viewer's `drawing-scene.json.gz`), the underlay and the
  tile pyramid are not in git: `tools/prerender.js` then `tools/pack_vt.js` rebuild the pyramid from the scene.
- `poc3d/` — the Google Photorealistic 3D Tiles proof in CesiumJS (key from the service at runtime).
- `tools/` — registration (`register_main.py`, `refine_main.py`), pyramid build and packing, the Playwright tests,
  and `machine_set.py`, which builds, uploads and registers the machine set on the service.
- `server_v5.79/` — the service as deployed (`server.js`, one change against v5.78: the machine page policy) and the
  registered set's manifest. The service boots from the `SERVER_FILE` blob on its volume and falls back to `SERVER_B64`.
