#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-source status symbols for the embedded Map explorer."""
from pathlib import Path
import hashlib
import json
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep as replace_once
BASE={'explorer.js':'5a66caa035b46c82dae5a70a0ddd36f52ef05e128d7c8d42eaab3f8e944070e5',
      'explorer-merge.js':'1dd20a619be4c534ac7ef3a6ed58c90df96287232b9217e745e088207b8ee50e',
      'index.html':'f83fb82aab5ecb07e801a47cb95e6736f0e86383d8769370c7479b756980c0a6'}
def rep(text,old,new):return replace_once(text,old,new,'v10.09 map completion','explorer')
def section(text,start,end,new):
    begin=text.index(start);finish=text.index(end,begin)
    return rep(text,text[begin:finish],new+'\n')
def apply(source,output):
    source,output=Path(source),Path(output)
    originals={name:(source/name).read_bytes() for name in BASE}
    for name,raw in originals.items():
        if hashlib.sha256(raw).hexdigest()!=BASE[name]:raise ValueError('Wrong source or already patched: '+name)
    page=originals['explorer.js'].decode()
    page=section(page,'function done782Pull() {','/* v8.87 - every 4 s', '''function done782Pull() {
  try { const w=window.parent;document.documentElement.classList.toggle('d782still',!!(w&&w!==window&&w.document.documentElement.getAttribute('data-motion')==='off')); } catch (_) {}
  complete897Pull();
}''')
    page=rep(page,'done782Pull(); complete897Pull(); /* v8.97 */','done782Pull(); /* v10.09: one verified status snapshot */')
    page=rep(page,"function done782List() { if (!DONE782_ON || !DONE782.size || typeof ITEMS === 'undefined' || !ITEMS) return []; return ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)); }", "function done782List() { if (!DONE782_ON || !DONE782.size || typeof ITEMS === 'undefined' || !ITEMS) return []; return ITEMS.filter(it => it.places.length && isComplete897(it) && DONE782.has(it.code)); }")
    page=rep(page,"const n = (typeof ITEMS !== 'undefined' && ITEMS ? ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)).length : 0);", "const n = (typeof ITEMS !== 'undefined' && ITEMS ? ITEMS.filter(it => it.places.length && isComplete897(it) && DONE782.has(it.code)).length : 0);")
    page=section(page,'function done782Draw(ctx, M, dn) {','let done782At', '''function done782Draw(ctx, M, dn) { const out=[];
  for (const it of dn) { if (!isComplete897(it)||marks.some(m=>m.it.code===it.code)) continue;
    for (const bb of it.places) { const g0=toGeo((bb[0]+bb[2])/2,(bb[1]+bb[3])/2),c=applyM(M,g0.x,g0.y);
      if(c.x < -40 || c.y < -40 || c.x > canvas.width+40 || c.y > canvas.height+40)continue;
      badge1009(ctx,c.x,c.y,mapStatus1009(it));if(out.length<240)out.push([c.x/dpr,c.y/dpr]);
    }
  }
  done782Place(out);
}''')
    page=section(page,'/* v8.97 - COMPLETION ON THE MAPS.','let marksDrawn = false;',
       (HERE/'status1009.js').read_text()+'''\nlet COMPLETE897=new Set(),complete897Sig='';
(()=>{const st=document.createElement('style');st.id='map1009-style';st.textContent='''+json.dumps((HERE/'status1009.css').read_text())+''';document.head.appendChild(st);})();
function complete897Keys(){const snap=statusSnapshot1009(mapHostStatus1009());return snap.available?[...snap.rows.values()].filter(row=>row.state==='complete').map(row=>row.key):null;}
function complete897Pull(){
  const next=statusSnapshot1009(mapHostStatus1009());if(next.signature===complete897Sig){selectedStatus1009();return;}
  MAP1009=next;complete897Sig=next.signature;COMPLETE897=new Set([...next.rows.values()].filter(row=>row.state==='complete').map(row=>row.key));
  DONE782=new Set(COMPLETE897);done782Sig=[...DONE782].sort().join(',');done782Chip();complete897Sync();
}
function isComplete897(it){const state=mapStatus1009(it);return !!state&&state.state==='complete';}
function ok897(it,where){const status=mapStatus1009(it);return status?'<em class="ok897'+(where?' '+where:'')+'" data-map1009-state="'+status.state+'" style="--status1009:'+status.colour+'" title="'+esc(status.detail)+'">'+mapGlyph1009(status)+' '+esc(status.label)+'</em>':'';}
function complete897Sync(){
  const put=(host,where)=>{if(!host)return;const b=host.querySelector('b');if(!b)return;const it=ITEMS.find(x=>x.code===norm(b.textContent||'')),el=host.querySelector('.ok897'),html=ok897(it,where);
    if(el){if(html)el.outerHTML=html;else el.remove();}else if(html)b.insertAdjacentHTML('afterend',html);};
  document.querySelectorAll('#results [data-code],#findList [data-code]').forEach(b=>put(b,''));
  const card=$('xcard');if(card&&!card.hidden){if(typeof window.GC500ExplorerRefreshCard897==='function')window.GC500ExplorerRefreshCard897();else put(card.querySelector('.xc-t'),'card');}
  selectedStatus1009();requestPaint();
}
function tick897(ctx,x,y,r,it){const status=mapStatus1009(it);if(!status)return;const k=Math.SQRT1_2,offset=(r+22*dpr)*k;badge1009(ctx,x+offset,y+offset,status);}
window.GC500Explorer897=Object.freeze({keys:()=>[...COMPLETE897],isComplete:code=>COMPLETE897.has(norm(String(code||''))),pull:complete897Pull,
  get state(){return {n:COMPLETE897.size,doneLayer:DONE782_ON,ticked:marks.filter(m=>isComplete897(m.it)&&m.it.places.length).map(m=>m.it.code)};}});
''')
    # The established category ring and geometry remain. A separate orange selection line cannot imply completion.
    page=rep(page,"const rk = Math.round(r * 2) / 2, gk = m.c + (sel ? 's' : 'n') + rk;", "const paintColour1009=sel?'#ff821f':m.c;const rk = Math.round(r * 2) / 2, gk = paintColour1009 + (sel ? 's' : 'n') + rk;")
    page=rep(page,"g.addColorStop(0, m.c + '00'); g.addColorStop(.45, m.c + (sel ? '66' : '3a')); g.addColorStop(1, m.c + '00');", "g.addColorStop(0, paintColour1009 + '00'); g.addColorStop(.45, paintColour1009 + (sel ? '66' : '3a')); g.addColorStop(1, paintColour1009 + '00');")
    page=rep(page,"ctx.stroke(); tick897(ctx, c.x, c.y, r, m.it);   /* v8.97 */", "ctx.stroke();if(sel){ctx.save();ctx.strokeStyle='#ff821f';ctx.lineWidth=2.5*dpr;ctx.beginPath();ctx.arc(c.x,c.y,r+4*dpr,0,Math.PI*2);ctx.stroke();ctx.restore();}tick897(ctx,c.x,c.y,r,m.it);")
    page=rep(page,'r: r / dpr, c: m.c};','r: r / dpr+4, c: \'#ff821f\'};')
    page=rep(page,"    if (showText || sel) { const txt = m.it.code, w = textWidth887(ctx, txt) + 12 * dpr, h = 18 * dpr, x = c.x + r * .75, y = c.y - r * .75 - h / 2; ctx.fillStyle = 'rgba(15,13,12,.85)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5 * dpr); ctx.fill(); ctx.strokeStyle = m.c; ctx.lineWidth = dpr; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 6 * dpr, y + h / 2); }", '    if(showText||sel)label1009(ctx,m.it,c,r,sel,m.c);')
    page=rep(page,'  selected = null; stopPulse(); highlight = null;', '  selected = null; selectedStatus1009(); stopPulse(); highlight = null;')
    page=rep(page,"  const it = ITEMS.find(x => x.code === norm(code)); if (!it) return false; stopPulse(); selected = it;", "  const it = ITEMS.find(x => x.code === norm(code)); if (!it) return false; complete897Pull();stopPulse();selected=it;selectedStatus1009();")
    page=rep(page,'function showCategory(id) {\n','function showCategory(id) {\ncomplete897Pull();\n')
    merge=originals['explorer-merge.js'].decode()
    merge=rep(merge,"  function refresh(noSearch996 = false) {\n    if (!window.__ready || typeof buildItems !== 'function') return false;", "  function refresh(noSearch996 = false) {\n    if (!window.__ready || typeof buildItems !== 'function') return false;\n    if(typeof complete897Pull==='function')complete897Pull();")
    output.mkdir(parents=True,exist_ok=True)
    changed={'explorer.js':page.encode(),'explorer-merge.js':merge.encode()}
    index=originals['index.html'].decode()
    for name,raw in changed.items():index=rep(index,name+'?v='+BASE[name][:12],name+'?v='+hashlib.sha256(raw).hexdigest()[:12])
    changed['index.html']=index.encode()
    evidence={'author':'Andrew Fisher','changedFiles':{}}
    for name,raw in changed.items():
        (output/name).write_bytes(raw)
        evidence['changedFiles']['explorer/'+name]={'base':BASE[name],'candidate':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
    (HERE/'evidence/source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n')
    return evidence
if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('Usage: patch_maps1009.py EXACT_SOURCE_DIRECTORY OUTPUT_DIRECTORY')
    print(json.dumps(apply(sys.argv[1],sys.argv[2]),indent=2))
