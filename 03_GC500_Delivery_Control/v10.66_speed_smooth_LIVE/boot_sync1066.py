"""Author: Andrew Fisher. Fetch early; apply shared snapshots after extensions initialise."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    text = rep(text, 'function syncStart(db){', '''function syncApplied1066(){return !!SYNC.on&&Object.keys(SYNC_COLLS).every(name=>SYNC.first.has(name));}
function syncStart(db){''', 'recognise only completed native collection hydration', path)
    text = rep(text,
        "const u = db.collection(name).onSnapshot(snap => { SYNC.at = Date.now(); applyRemote(name, snap); if (SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); } },",
        "const u = db.collection(name).onSnapshot(snap => { SYNC.at = Date.now(); applyRemote(name, snap); if (!(SYNC.backend&&SYNC.backend.rest)&&syncApplied1066()&&SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); } },",
        'REST acknowledges live only after every callback succeeds', path)
    text = rep(text,
        'const deliver = coll => (listeners[coll] || []).forEach(fn => { try { fn(snapOf(coll)); } catch (e) {} });\n const deliverAll = () => Object.keys(listeners).forEach(deliver);',
        '''let deliveryRetry1066=false;
 const deliveryFailed1066=()=>{deliveryRetry1066=true;SYNC.status='unreachable';syncFooter();};
 const deliver = coll => {let ok=true;for(const fn of listeners[coll]||[])try{fn(snapOf(coll));}catch(e){ok=false;}return ok;};
 const deliverAll = () => {let ok=true;for(const name of Object.keys(listeners))if(!deliver(name))ok=false;return ok;};
 // All inline extensions, including the native quantity-scope merge hooks,
 // must exist before the first snapshot can be applied. Network reads stay early.
 const applicationReady1066=()=>document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();''',
        'retain callback failure evidence and wait for full source initialisation', path)
    text = rep(text,
        "if (SYNC.status === 'unreachable' && version >= 0) { SYNC.status = 'live'; syncFooter(); if (syncWaiting()) syncSend(); }",
        "if (SYNC.status !== 'live' && version >= 0 && v.version === version && !deliveryRetry1066 && syncApplied1066()) { SYNC.status = 'live'; syncFooter(); if (syncWaiting()) syncSend(); }",
        'never recover live from an unapplied snapshot', path)
    text = rep(text,
        "if (!force && v.version === version) { syncFooter(); if (r.ok) docsRecovery1016(); return; }",
        "if (!force && v.version === version && !deliveryRetry1066 && syncApplied1066()) { syncFooter(); if (r.ok) docsRecovery1016(); return; }",
        'retry unchanged server versions after a failed delivery', path)
    text = rep(text,
        "if (st.version < seen) { syncFooter(); return; } /* v7.41 - a late answer, older than a write already acknowledged here */\n version = st.version; if (version > seen) seen = version; docs = st.docs;\n deliverAll();",
        '''await applicationReady1066();
 if(!SYNC.on||SYNC.status==='revoked')return;
 // Recheck after the readiness wait: an acknowledged write may have advanced seen.
 if (st.version < seen) { syncFooter(); return; } /* v7.41 - a late answer, older than a write already acknowledged here */
 docs = st.docs;
 if(!deliverAll()||!syncApplied1066()){deliveryFailed1066();return;}
 version = st.version; if (version > seen) seen = version; deliveryRetry1066=false;''',
        'commit the read cursor only after successful native hydration', path)
    text = rep(text,
        'if (version >= 0) setTimeout(() => deliver(name), 0);',
        'if (version >= 0) setTimeout(() => {if(!deliver(name))deliveryFailed1066();}, 0);',
        'retain failures when an existing snapshot reaches a late listener', path)
    text = rep(text,
        'redeliver: deliverAll,',
        "redeliver: () => {if(version<0||document.readyState==='loading'||!SYNC.on||SYNC.status==='revoked')return false;const ok=deliverAll();if(!ok)deliveryFailed1066();return ok;},",
        'explicit redelivery cannot hide a callback failure', path)
    return text
