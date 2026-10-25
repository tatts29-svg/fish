"""Author: Andrew Fisher. Add map pickup packs, native departure recording and shared remaining-stock views."""
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
 code=rep(code,'  searchFrame1210();','  searchFrame1210();\n'+(HERE/'demob1211_frame.js').read_text()+'\n  demobFrame1211();\n'+(HERE/'departure1211_frame.js').read_text()+'\n  departureFrame1211();\n'+(HERE/'vmsicons1211_frame.js').read_text()+'\n  vmsIcons1211();','pickup frame','spot')
 code=rep(code,"button.disabled=!prepared||running;","button.disabled=!prepared||running;\n  window.GC500Demob1211?.attach(card,current);",'pickup button','spot')
 code=rep(code,"serial++;current=snapshot(pin);prepared=null;", "window.GC500Demob1211?.reset();serial++;current=snapshot(pin);prepared=null;",'invalidate pickup on new area','spot')
 hook="""
  if(/^demob (remaining|departed)$/.test(query)){
   const departed=query.endsWith('departed'),refs=parent.Departure1211.all().filter(r=>departed?r.collected>0:r.arrival&&(r.remaining>0||r.unknown));
   return refs.map(r=>{const it=ITEMS.find(i=>norm(i.reg?.sourceRequest1017?i.reg.sourceKey1017:i.code)===norm(r.key)&&i.cat?.host==='trade')||ITEMS.find(i=>norm(i.code)===norm(r.key));
    return Object.assign({},it||{code:r.key,places:[],cat:{id:'departure1211',host:'trade',name:'Demob',c:'#168958'},names:[]},{reg:{...(it?.reg||{}),name:r.label+' · '+r.last},sourceLabel1210:r.key,departure1211:true});
   });
  }
  if(/^(?:coates(?: hire)? (?:fwf|fresh water flush)(?: toilets?)?|(?:fwf|fresh water flush)(?: toilets?)? coates)$/.test(query)){
   const refs=parent.MapDemob1211.coatesFWF();
   return refs.map(r=>{const it=ITEMS.find(i=>norm(i.reg?.sourceRequest1017?i.reg.sourceKey1017:i.code)===norm(r.key)&&i.cat?.host==='trade')||ITEMS.find(i=>norm(i.code)===norm(r.key));
    return Object.assign({},it||{code:r.key,places:[],cat:{id:'coatesfwf1211',host:'trade',name:'Coates FWF',c:'#ff6a13'},names:[]},{reg:{...(it?.reg||{}),name:'Coates FWF · '+r.units.length+' recorded units · '+r.units.map(u=>u.number||'asset number not recorded').join(', ')},sourceLabel1210:r.key,coates1211:true});
   });
  }
"""
 code=rep(code,"const tt=tokens(q),query=n(q);if(!tt.length)return [];", "const tt=tokens(q),query=n(q);if(!tt.length)return [];\n"+hook,'Coates FWF ownership search','spot')
 parent=(HERE/'departure1211_parent.js').read_text()+'\n'+(HERE/'demob1211_parent.js').read_text()+'\n'+(HERE/'demob1211_pdf.js').read_text()
 html=rep(html,m[0],'<script id="demob1211-script">\n'+parent+'\n</script>\n<script id="spot1117-script">'+code+'</script>','pickup modules','page')
 html=departures(html)
 f=re.search(r"\+' · v(\d+(?:\.\d+)+)'; /\* v8.19 release922",html)
 return rep(html,f[0],"+' · v12.11'; /* v8.19 release922",'footer','page')
def departures(html):
 def change(old,new,label):
  nonlocal html
  html=rep(html,old,new,label,'departure/current stock')
 change('const PARTIAL_ENABLED=false; // Enable only after every current-stock view shares typed subtraction.',
        'const PARTIAL_ENABLED=true; // v12.11: typed current-stock readers and physical identities share the collection record.', 'partial collection')
 change("if(!request.id||s.record.history.some(h=>h.collection996?.id===request.id))", r"""const departed=request.departedAt1211,actual=Date.parse(departed);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+10:00$/.test(departed||'')||!Number.isFinite(actual)||departed.slice(0,10)!==request.date||new Date(actual+36000000).toISOString().slice(0,19)!==departed.slice(0,19)||actual<Date.parse(s.reading.arrival.at)||actual>Date.now())return bad('Enter the actual departure date and time in AEST, after arrival and no later than now.');
 if(!request.id||s.record.history.some(h=>h.collection996?.id===request.id))""",'actual departure time')
 change("ids=[...new Set((item.unitIds||[]).map(String))];", "ids=(item.unitIds||[]).map(String);if(new Set(ids).size!==ids.length)return bad('Select each asset only once.');",'duplicate identity guard')
 change("  selected.push({type:remaining.type,n,unitIds:ids,", """  if(n<remaining.n&&n>ids.length&&!UNNUMBERED_RX.test(remaining.type))return bad('Identify the collected assets before recording a partial collection of this item type.');
  selected.push({type:remaining.type,n,unitIds:ids,""",'unidentified partial guard')
 change("id:request.id,date:request.date,programmeDate:portion?.iso", "id:request.id,date:request.date,departedAt1211:request.departedAt1211,programmeDate:portion?.iso",'save actual departure time')
 start=html.index("function open(key){\n if(!mayWrite('a pick-up')")
 end=html.index('root.DemobCollection996=',start)
 html=rep(html,html[start:end],(HERE/'collection1211_open.js').read_text()+'\n','departure control','collection')
 change("const modelOf=key=>{const a=assetOf(key);return a?gcModel925(a,{loading:false}):{rows:[],groups:[]};};",
        "const modelOf=key=>{const a=assetOf(key),m=a?gcModel925(a,{loading:false}):{rows:[],groups:[]};return a&&root.Departure1211?root.Departure1211.remainingModel(a,m):m;};",'inventory remaining identity')
 change("function physical(a){return a&&typeof gcUnits925==='function'?gcUnits925(a,{loading:false}):[];}",
        "function physical(a){const rows=a&&typeof gcUnits925==='function'?gcUnits925(a,{loading:false}):[];return a&&root.Departure1211?root.Departure1211.remainingModel(a,{rows}).rows:rows;}",'inventory legacy identity')
 change("if (a.product==='Toilet'||a.discipline==='Toilets & amenities'||typeof Scope1017!=='undefined'&&Scope1017.has(a)) for(const item of askedBy.keys()) onBy.set(item,CurrentStock996.quantity(a,item,asOf,toiletArrival962(a,item,asOf,onBy.get(item)||0)));",
        "for(const item of askedBy.keys()){const received=a.product==='Toilet'||a.discipline==='Toilets & amenities'||typeof Scope1017!=='undefined'&&Scope1017.has(a)?toiletArrival962(a,item,asOf,onBy.get(item)||0):onBy.get(item)||0;onBy.set(item,CurrentStock996.quantity(a,item,asOf,received));}",'timeline current quantities')
 change("return project(input,day,addDays(day,PROG_NEXT_DAYS));", "const result=project(input,day,addDays(day,PROG_NEXT_DAYS));return root.Departure1211?root.Departure1211.vms(result,day):result;",'physical VMS remaining status')
 change("board.status=done?'Complete':installed?", "board.departure1211=status.departure1211||null;board.status=status.departure1211?'Left site · '+status.departure1211.at:done?'Complete':installed?",'physical VMS departure words')
 change("+Items933.cardPhotos(a,u,model)+'<details", "+(window.Departure1211?Departure1211.unitHtml(a.key,u.id,u.item):'')+Items933.cardPhotos(a,u,model)+'<details",'physical unit departure badge')
 change('<h3>Equipment at this location</h3>', '<h3>Equipment recorded at this location</h3>', 'retain historical unit context')
 change(".filter(h => h && h.state === 'on site' && h.at).map(h => h.at)", ".filter(h => h && !h.collection996 && h.state === 'on site' && h.at).map(h => h.at)", 'pump clearance arrival boundary')
 change("for(let i=rows.length-1;i>=0;i--)if(rows[i].at<=cut)return rows[i];", "for(let i=rows.length-1;i>=0;i--)if(rows[i].at<=cut&&!(field==='history'&&rows[i].collection996&&!rows[i].collection996.complete))return rows[i];", 'replay ignores partial collection as light change')
 for label,ending in [('arrival list', "if (dayStampOf(h.at) === iso) { at = h.at; by = h.by || null; } });"),('arrival day',"at = h.at; });")]:
  prefix="let run1059 = false; (d.history || []).forEach((h, i, hs) => {"
  at=html.index(prefix,html.index('function arrivalsOn0' if label=='arrival list' else 'function greenDayOf'))
  end=html.index(ending,at)+len(ending)
  old=html[at:end]
  change(old,old.replace('(d.history || []).forEach','(d.history || []).filter(h=>!h.collection996).forEach'),label+' excludes departures')
 change(" hist.forEach((h, i) => {\n const from", " hist.forEach((h, i) => {\n if(h.collection996){const c=h.collection996;push(at(h.at),'light',k,'Left site: '+c.items.map(i=>i.n+' × '+i.type).join(', ')+' · departure '+(window.Departure1211?Departure1211.stamp(c):c.date),h.by);return;}\n const from", 'native activity journal departure')
 return html

if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.11 map pickup pack and Coates FWF finder applied')
