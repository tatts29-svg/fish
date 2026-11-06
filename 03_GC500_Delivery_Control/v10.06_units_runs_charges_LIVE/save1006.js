/* Author: Andrew Fisher. Existing drawer badge follows the native save queue.
   This describes recorded changes, not text in a form awaiting its Save button. */
function drawerSync798Word(){
 if (SYNC.unkept) return 'Not saved · keep this page open';
 if (SYNC.readonly) return SYNC.status === 'live' ? 'View only' : 'Offline · view only';
 if (syncWaiting()) return SYNC.status === 'live' ? 'Saving recorded changes…' : 'Changes waiting to sync';
 const ready = SYNC.on && SYNC.status === 'live' && SYNC.at &&
   Object.keys(SYNC_COLLS).every(name => SYNC.first && SYNC.first.has(name));
 if (ready) return 'Recorded changes saved';
 if (SYNC.status === 'connecting' || SYNC.status === 'live') return 'Checking shared record…';
 if (SYNC.status === 'unreachable' || SYNC.status === 'revoked') return 'Shared record unavailable';
 return 'Local copy only';
}
