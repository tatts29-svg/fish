/* v8.16 owner shim (Author: Andrew Fisher). Codex's fixtures were written before the two toilet runs (3 Oct 2026); their
 synthetic references carry no inventory owner, which the page would now call "owner to confirm" and keep off both runs.
 This shim, appended to demob816_src.js for those fixtures only, says what the fixtures assumed: every portable is the
 supplier's, 24 a load. The page itself never uses it. */
owner816 = (a, u, evtN, evtUnk) => ({streams: evtN > 0 || evtUnk ? [{s: 'sub', n: evtN}] : [], ownerUnk: 0, co: 'Event Portables'});
