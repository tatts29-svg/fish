/* v5.94 — THE RECORD SNAPSHOTS, READ BEHIND THE EDIT KEY. Author: Andrew Fisher, 27 Oct 2026. The hourly snapshots
   above were only ever named on the admin page (the newest three), so a change the live record has lost, such as a
   laptop's work written over by a stale page, could not be read back from them. Now the edit key can list the record
   snapshots and read one, byte for byte, as it lies on the volume:
     GET /api/admin/snapshots         [{name, bytes, mtime}], newest first (modification time, then name)
     GET /api/admin/snapshot/<name>   that file as application/json
   Only records-YYYYMMDDHH.json (hourly, UTC hour) and records-YYYYMMDDHHMM-boot.json (one at each start) are ever
   listed or served. files-* and ticks-* are not: a ticks snapshot carries every tracker's signing secret and the crew
   card tokens. The name is matched whole, exactly as it arrives in the address (never decoded first), before it is
   joined to the folder, so no path, encoded slash or other prefix can reach any other file; a name that does not
   match, or is not there, is 404. Nothing here writes into the snapshot folder: a records-* file put there could be
   loaded at a later start. A view link gets 403 and no key 401, as on every other /api/admin read. */
const RECORD_SNAP_RE = /^records-\d{10}(\d{2}-boot)?\.json$/;
async function recordSnapshots() {
  let names = [];
  try { names = (await fs.promises.readdir(SNAP_DIR)).filter(n => RECORD_SNAP_RE.test(n)); } catch (e) { return []; }
  const rows = await Promise.all(names.map(async n => {
    try { const st = await fs.promises.lstat(path.join(SNAP_DIR, n)); return st.isFile() ? { name: n, bytes: st.size, mtime: st.mtime.toISOString(), t: st.mtimeMs } : null; }
    catch (e) { return null; }   /* rotated away while being listed */
  }));
  return rows.filter(Boolean).sort((a, b) => b.t - a.t || b.name.localeCompare(a.name)).map(r => ({ name: r.name, bytes: r.bytes, mtime: r.mtime }));
}
async function sendRecordSnapshot(res, name) {
  if (!RECORD_SNAP_RE.test(name)) return send(res, 404, { error: 'no such snapshot' });
  const f = path.join(SNAP_DIR, name);
  let body;
  try {
    const st = await fs.promises.lstat(f);
    if (!st.isFile()) return send(res, 404, { error: 'no such snapshot' });
    body = await fs.promises.readFile(f);
  } catch (e) {
    if (e.code === 'ENOENT') return send(res, 404, { error: 'no such snapshot' });
    throw e;
  }
  return send(res, 200, body, { 'Content-Type': 'application/json; charset=utf-8' });
}
