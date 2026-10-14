/* Author: Andrew Fisher. Reuse successful shared reads to retry failed source evidence.
   No extra poller, no native writes, and no use of unverified files. Existing file
   loading invalidates derived models and preserves the reader's open view. */
let docsRecoveryAttempt1016 = -Infinity;
function docsRecovery1016(force = false) {
 if (SYNC.status !== 'live' || !SYNC.backend || !SYNC.backend.files || DOCS.busy || DOCS.state !== 'failed') return false;
 const now = Date.now(), delay = force ? 1000 : 15000;
 // An explicit retry bypasses the automatic backoff, but repeated taps and the
 // successful-read callback for that same tap still produce one request.
 if (now - docsRecoveryAttempt1016 < delay) return false;
 docsRecoveryAttempt1016 = now;
 Promise.resolve(docsRefresh(true)).catch(() => {});
 return true;
}
