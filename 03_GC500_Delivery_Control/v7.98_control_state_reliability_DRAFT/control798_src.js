/* v7.98 — keep the open drawer's connection badge current without rebuilding its fields.
   Author: Andrew Fisher. The existing sync footer owns status/capability changes; no new timer. */
function drawerSync798Word(){
 return SYNC.status === 'live' ? (SYNC.readonly ? 'Live · view only' : 'Live')
 : SYNC.status === 'file' ? 'No service behind this copy'
 : SYNC.status === 'connecting' ? 'Connecting'
 : SYNC.status === 'unreachable' ? (SYNC.readonly ? 'Offline · view only' : 'Offline · will send')
 : 'Snapshot';
}
function drawerSync798Refresh(){
 const word = document.querySelector('#drawer.on .ptag.sync b');
 if (!word) return;
 const next = drawerSync798Word();
 if (word.textContent !== next) word.textContent = next;
}
