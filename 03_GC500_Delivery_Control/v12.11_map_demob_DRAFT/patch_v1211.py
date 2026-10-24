"""Author: Andrew Fisher. Add read-only map pickup packs and recorded Coates FWF finding."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
def patch(html):
 if 'id="demob1211-script"' in html:raise ValueError('v12.11 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=(HERE/'BASE_SHA256').read_text().strip():raise ValueError('Exact live base changed; rebuild and retest')
 m=re.search(r'<script id="spot1117-script">([\s\S]*?)</script>',html)
 if not m or hashlib.sha256(m[1].encode()).hexdigest()!=(HERE/'SPOT_SHA256').read_text().strip():raise ValueError('Spot source changed')
 code=m[1]
 code=rep(code,'  searchFrame1210();','  searchFrame1210();\n'+(HERE/'demob1211_frame.js').read_text()+'\n  demobFrame1211();','pickup frame','spot')
 code=rep(code,"button.disabled=!prepared||running;","button.disabled=!prepared||running;\n  window.GC500Demob1211?.attach(card,current);",'pickup button','spot')
 code=rep(code,"serial++;current=snapshot(pin);prepared=null;", "window.GC500Demob1211?.reset();serial++;current=snapshot(pin);prepared=null;",'invalidate pickup on new area','spot')
 hook="""
  if(/^(?:coates(?: hire)? (?:fwf|fresh water flush)(?: toilets?)?|(?:fwf|fresh water flush)(?: toilets?)? coates)$/.test(query)){
   const refs=parent.MapDemob1211.coatesFWF();
   return refs.map(r=>{const it=ITEMS.find(i=>norm(i.reg?.sourceRequest1017?i.reg.sourceKey1017:i.code)===norm(r.key)&&i.cat?.host==='trade')||ITEMS.find(i=>norm(i.code)===norm(r.key));
    return Object.assign({},it||{code:r.key,places:[],cat:{id:'coatesfwf1211',host:'trade',name:'Coates FWF',c:'#ff6a13'},names:[]},{reg:{...(it?.reg||{}),name:'Coates FWF · '+r.units.length+' recorded units · '+r.units.map(u=>u.number||'asset number not recorded').join(', ')},sourceLabel1210:r.key,coates1211:true});
   });
  }
"""
 code=rep(code,"const tt=tokens(q),query=n(q);if(!tt.length)return [];", "const tt=tokens(q),query=n(q);if(!tt.length)return [];\n"+hook,'Coates FWF ownership search','spot')
 parent=(HERE/'demob1211_parent.js').read_text()+'\n'+(HERE/'demob1211_pdf.js').read_text()
 html=rep(html,m[0],'<script id="demob1211-script">\n'+parent+'\n</script>\n<script id="spot1117-script">'+code+'</script>','pickup modules','page')
 f=re.search(r"\+' · v(\d+(?:\.\d+)+)'; /\* v8.19 release922",html)
 return rep(html,f[0],"+' · v12.11'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.11 map pickup pack and Coates FWF finder applied')
