"""Author: Andrew Fisher. v11.10 - the Showcase plays smoothly: no freeze at a scene change.

Andrew, 22 Oct 2026: "ensure the showcase has no lag. No freezing. No rendering issues or bugs" - the team will watch
it on the race days.

Measured on the live page (v11.09) in a four-minute playback on a 4x-throttled CPU: 25 long tasks of 11-19 s each,
251 s of the 240 s frozen, only 7 scenes advanced. Unthrottled, the countdown, lead, crew and fencing scenes each
took 9-10 s to render, every time; the other 21 scenes 75-190 ms. The cause: showScene() starts with
completionAsOf() and lightTally(allAssets()) for every key, and the four original scenes are rendered outside
holdAssets(), so the asset list is rebuilt dozens of times per scene (the same reads cost 90-180 ms inside a hold;
all 25 scenes together cost under one second inside one hold). showRender() itself measured 9.7 s.

The fix, appended after every other Showcase module so it wraps what the page has by then:
  1. Every scene is rendered inside one holdAssets() and its HTML is memoised per scene, day and record epoch
     (REC_EPOCH1066, which sharedCache975 bumps on every record change). A scene change is a cache read.
  2. When the Showcase opens, the scenes are warmed in the background, one per 40 ms, so the first pass through the
     deck is as smooth as the second; a record change re-warms lazily on the next read.
  3. Nothing about what a scene says changes: same functions, same record, same words. Only when they are computed.
Footer v11.09 -> v11.10.

    python3 patch_v1110.py page.html      (in place, on the live v11.09 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '4741d5cddb17582515cd0be85b9491ab5a4b068b9c58f05d306c7a83fefa4de5'

MODULE = r"""<script>
/* Author: Andrew Fisher. v11.10 - Showcase scenes computed once per record state, inside one asset hold. */
(function(root){
'use strict';
if(typeof showScene!=='function'||typeof holdAssets!=='function')return;
const memo=new Map();
let warmTimer=null;
const dayOf=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d:todayIso();
const epoch=()=>typeof REC_EPOCH1066!=='undefined'?REC_EPOCH1066:0;
const inner=showScene;
function cached(key,day){
 const d=dayOf(day),e=epoch(),hit=memo.get(key);
 if(hit&&hit.day===d&&hit.epoch===e)return hit.html;
 const html=holdAssets(()=>inner(key,d));
 memo.set(key,{day:d,epoch:e,html});
 return html;
}
showScene=function(key,day){return cached(key,day);};
/* warm the deck in the background: one scene per tick, never two in one task */
function warm(){
 warmTimer=null;
 if(typeof SHOW==='undefined'||!SHOW.open)return;
 const d=dayOf(typeof state!=='undefined'?state.asOf:null),e=epoch();
 const next=SHOW_ORDER.find(k=>{const h=memo.get(k);return !(h&&h.day===d&&h.epoch===e);});
 if(!next)return;
 try{cached(next,d);}catch(err){memo.set(next,{day:d,epoch:e,html:''});}
 warmTimer=setTimeout(warm,40);
}
function scheduleWarm(){if(warmTimer)clearTimeout(warmTimer);warmTimer=setTimeout(warm,250);}
const openBefore=showOpen;
showOpen=function(){const r=openBefore.apply(this,arguments);scheduleWarm();return r;};
const closeBefore=showClose;
showClose=function(){if(warmTimer){clearTimeout(warmTimer);warmTimer=null;}return closeBefore.apply(this,arguments);};
const cacheBefore=sharedCache975;
sharedCache975=function(){const r=cacheBefore.apply(this,arguments);if(typeof SHOW!=='undefined'&&SHOW.open)scheduleWarm();return r;};
root.ShowcaseSmooth1110={size:()=>memo.size,warm:scheduleWarm,cached:(k,d)=>{const h=memo.get(k);return !!(h&&h.day===dayOf(d)&&h.epoch===epoch());}};
})(window);
</script>
</body>"""


def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.10 requires the live v11.09 page ' + BASE_SHA256)
    at = text.rfind('</body>')
    if at < 0: raise ValueError('no </body>')
    text = text[:at] + MODULE + text[at + len('</body>'):]
    return rep(text, "+' · v11.09'; /* v8.19 release922", "+' · v11.10'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
