/* v8.10 - invalid addresses cannot leave a different reference or day in front.
   Author: Andrew Fisher. These are viewing decisions only; the record is untouched. */
function routeDayValid810(day){
 if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
 const d = new Date(day + 'T00:00:00Z');
 return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === day;
}
function routeReject810(tab, message){
 if (state.drawerClose && $('#drawer').classList.contains('on')) state.drawerClose();
 state.sel = null; state.unit = null; state.found = null; state.fview = null;
 go(tab);
 /* Routing suppresses setHash: replace the rejected address with the page actually shown.
    Keep the history entry's number, so Back and Forward keep their ordinary behaviour. */
 try { history.replaceState(history.state, '', '#' + state.tab); } catch (e) {}
 flash(message);
}
