"""Author: Andrew Fisher. Verified historical observations and stable native Demob weather."""
from pathlib import Path
import copy,json,re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(s):
 if 'root.WeatherCards1299=api' in s:raise ValueError('Weather v12.99 already applied')
 def r(t,old,new,label):return rep(t,old,new,label,'weather v12.99')
 def script(sid,fn):
  nonlocal s
  matches=list(re.finditer(r'(<script\b[^>]*\bid="'+re.escape(sid)+r'"[^>]*>)(.*?)(</script>)',s,re.S))
  if len(matches)!=1:raise ValueError('Expected one script '+sid)
  m=matches[0];s=s[:m.start(2)]+fn(m[2])+s[m.end(2):]
 def history(t):
  at=t.index('const ARCHIVE = ')+len('const ARCHIVE = ');archive,end=json.JSONDecoder().raw_decode(t[at:]);before=copy.deepcopy(archive)
  if len(archive['days'])!=46 or archive['coverage']['through']!='2026-10-22':raise ValueError('Requires original46-day reviewed archive')
  ext=json.loads((HERE/'weather_additions1299.json').read_text())
  if len(ext['days'])!=13 or set(ext['days'])&set(archive['days']):raise ValueError('Unexpected historical additions')
  from weather_archive1299 import extension
  if extension(archive)!=ext:raise ValueError('Frozen extension does not reproduce verified source conversion')
  archive['sources'].update(ext['sources']);archive['days'].update(ext['days']);archive['coverage']['through']=ext['coverage']['through']
  assert all(archive['days'][d]==v for d,v in before['days'].items())
  assert all(archive['sources'][d]==v for d,v in before['sources'].items())
  t=t[:at]+json.dumps(archive,indent=2,ensure_ascii=False)+t[at+end:]
  t=(HERE/'weather1299_src.js').read_text()+'\n'+t
  t=r(t,"return {kind,label,tag:past?'BOM RECORDED':'FORECAST',hi:","return {kind,label,tag:past?(f.partial?'BOM PARTIAL':'BOM RECORDED'):(wxOutlook(iso)?'OUTLOOK':'FORECAST'),hi:",'partial and outlook provenance labels')
  old="function weatherHtml(w){return '<span><span class=\"bc984-label\">WEATHER <small>'+w.tag+'</small></span><span class=\"bc984-condition\">'+e(w.label)+'</span></span>'+(w.hi!==null||w.lo!==null?'<span class=\"bc984-temperature\">'+(w.hi!==null?w.hi+'°':'')+(w.lo!==null?'<span>'+(w.hi!==null?'/ ':'')+w.lo+'°</span>':'')+'</span>':'');}"
  new="function weatherHtml(w){const bound=root.WeatherCards1299.boundLabel(w);return '<span><span class=\"bc984-label\">WEATHER <small>'+w.tag+'</small></span><span class=\"bc984-condition\">'+e(w.label)+'</span></span>'+(w.hi!==null||w.lo!==null?'<span class=\"bc984-temperature\">'+(w.hi!==null?w.hi+'°':'')+(w.lo!==null?'<span>'+(w.hi!==null?'/ ':'')+w.lo+'°</span>':'')+(bound?'<small class=\"weather-bound1299\">'+bound+'</small>':'')+'</span>':'');}"
  t=r(t,old,new,'label a lone minimum or maximum')
  return t
 # The helper precedes the existing Build/Demob shared weather renderer.
 sys.path.insert(0,str(HERE))
 script('past984-script',history)
 def demob(t):
  anchor="let paused=false,printing=false,suspended=false,rendering=false,lastDay=todayIso();const watched=new Set(),readings=new Map();"
  t=r(t,anchor,anchor+"\nconst weatherStable1299=root.WeatherCards1299.create({active:()=>active()&&!document.hidden&&!suspended&&!(typeof TPOD==='object'&&TPOD.frozen),now:()=>Date.now(),day:()=>todayIso(),loaders:()=>[typeof wxfLoad==='function'?wxfLoad:null,typeof wxoLoad==='function'?wxoLoad:null],paint:()=>{if(!rendering)refreshWeather();}});",'bounded native forecast request and stable weather keys')
  t=r(t,"function mount(){\n const pane=document.getElementById('pane-demob')", "function mount(){\n weatherStable1299.request();\n const pane=document.getElementById('pane-demob')",'load forecasts on direct Demob entry')
  t=r(t,"old.replaceWith(card);watched.add(card);card.dataset.bc984Visible='false';observer?.observe(card);", "old.replaceWith(card);watched.add(card);weatherStable1299.remember(card,BuildCards984.weather(iso));card.dataset.bc984Visible='false';observer?.observe(card);",'remember the weather already rendered')
  t=r(t,"if(d)more.innerHTML=detail(d);sync();", "if(d){const content=detail(d);if(more.innerHTML!==content)more.innerHTML=content;}sync();",'preserve unchanged detail content')
  old="function refreshWeather(){const pane=document.getElementById('pane-demob');if(!pane)return;for(const c of pane.querySelectorAll('.dc996-day')){const w=BuildCards984.weather(c.dataset.dday816);c.dataset.bc984Weather=w.kind||'unknown';c.querySelectorAll('.wm-card-scene,.bc984-weather-foreground,.bc984-rain-sheet,.bc984-sun-rays,.bc984-cloud-veil').forEach(n=>n.remove());c.querySelector('.bc984-card').insertAdjacentHTML('afterbegin',V.sky(w)+V.foreground(w.kind));c.querySelector('.bc984-weather-reading').innerHTML=V.weatherHtml(w);}const d=readings.get(DM816.sel),more=pane.querySelector('.dc996-more');if(d&&more)more.innerHTML=detail(d);sync();}"
  new="""function refreshWeather(){
 const pane=document.getElementById('pane-demob');if(!pane)return;
 for(const c of pane.querySelectorAll('.dc996-day')){
  const w=BuildCards984.weather(c.dataset.dday816);if(!weatherStable1299.changed(c,w))continue;
  c.dataset.bc984Weather=w.kind||'unknown';c.querySelectorAll('.wm-card-scene,.bc984-weather-foreground,.bc984-rain-sheet,.bc984-sun-rays,.bc984-cloud-veil').forEach(n=>n.remove());
  c.querySelector('.bc984-card').insertAdjacentHTML('afterbegin',V.sky(w)+V.foreground(w.kind));c.querySelector('.bc984-weather-reading').innerHTML=V.weatherHtml(w);
  c.setAttribute('aria-label',(c.getAttribute('aria-label')||'').replace(/Weather: [\\s\\S]*$/,'Weather: '+w.label));
 }
 const d=readings.get(DM816.sel),more=pane.querySelector('.dc996-more');if(d&&more){const content=detail(d);if(more.innerHTML!==content)more.innerHTML=content;}sync();
}"""
  t=r(t,old,new,'update changed weather only without resetting animations')
  t=r(t,"if(active()&&!document.hidden)renderDemob816();}return result;};", "if(active()&&!document.hidden)renderDemob816();}weatherStable1299.request();return result;};",'throttled refresh while Demob remains open')
  t=r(t,"document.addEventListener('visibilitychange',sync);document.addEventListener('gc500motionchange',sync);", "document.addEventListener('visibilitychange',()=>{sync();weatherStable1299.request();});document.addEventListener('gc500motionchange',sync);",'resume forecast freshness after returning')
  return t
 script('demob-weather996-source',demob)
 s=r(s,'<style id="demob-weather996-style">','<style id="weather1299-style">\n'+(HERE/'weather1299_src.css').read_text()+'\n</style>\n<style id="demob-weather996-style">','single-bound weather labels')
 return s
