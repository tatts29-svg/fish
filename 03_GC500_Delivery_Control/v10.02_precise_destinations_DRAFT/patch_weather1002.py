"""Author: Andrew Fisher. Full-width Build/Demob weather strips that start on today's date."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(text):
    if 'weather1002-source' in text:raise ValueError('Weather v10.02 already applied')
    start=text.index('function pickDay(days){')
    end=text.index('\nconst etaSort =',start)
    text=rep(text,text[start:end],"function pickDay(days){\n if (state.day && days.some(d => d.iso === state.day)) return state.day;\n return WeatherStrip1002.nearest(days,todayIso());\n}",'Today even on a day without loads','weather1002')
    text=rep(text,"(days.find(d => d.iso >= today && !d.empty) || days.find(d => d.iso >= today) || days[days.length - 1] || {}).iso || ''","WeatherStrip1002.nearest(days,today) || ''",'Today control uses the same day','weather1002')
    text=rep(text,'title="today, or the next day the schedule touches"','title="Today, or the nearest programme date"','Truthful programme bounds','weather1002')
    text=rep(text,"function demobSel816(M){ if (!DM816.sel || !M.day[DM816.sel]) { const t = todayIso(); DM816.sel = M.days.find(d => d >= t) || M.days[0]; } return DM816.sel; }","function demobSel816(M){ if (!DM816.sel || !M.day[DM816.sel]) DM816.sel = WeatherStrip1002.nearest(M.days,todayIso()); return DM816.sel; }",'Demob uses today or closest scheduled day','weather1002')
    text=rep(text,'window.TimelineStrip937={reveal};','window.TimelineStrip937={reveal:pane=>WeatherStrip1002.reveal(pane)};','Centre selected Build card even when already visible','weather1002')
    previous=(HERE.parent/'v9.83_build_layout_LIVE/build983.js').read_text()
    scroll=previous[previous.index(' if(fresh&&selected&&fresh.clientWidth>0){'):previous.index('\n if(!reduced()&&selected&&selected.animate)')]
    text=rep(text,scroll,' WeatherStrip1002.reveal(pane);','Manual day navigation keeps the selected card centred','weather1002')
    text=rep(text,"const render=renderDemob816;renderDemob816=function(){const previousScroll=document.querySelector('#pane-demob .strip816')?.scrollLeft||0;rendering=true;try{const result=render.apply(this,arguments);mount();const strip=document.querySelector('#pane-demob .strip816');if(strip)strip.scrollLeft=previousScroll;return result;}finally{rendering=false;}};","const render=renderDemob816;renderDemob816=function(){rendering=true;try{const result=render.apply(this,arguments);mount();WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;}finally{rendering=false;}};",'Demob selects and reveals one day consistently','weather1002')
    text=rep(text,"document.addEventListener('DOMContentLoaded', () => { route(); Refresh904.update(); }, {once: true});","document.addEventListener('DOMContentLoaded', () => { WeatherStrip1002.resetRefresh(); route(); Refresh904.update(); }, {once: true});",'Refresh returns Build to today while preserving explicit new deep links','weather1002')
    text=rep(text,"else { route(); Refresh904.update(); }","else { WeatherStrip1002.resetRefresh(); route(); Refresh904.update(); }",'Already-ready bootstrap matches refresh selection','weather1002')
    text=rep(text,'if(now===lastDay)return false;lastDay=now;if(active()){renderTimeline();return true;}','if(now===lastDay)return false;lastDay=now;state.day=null;if(active()){renderTimeline();return true;}',"New AEST morning selects today's Build card",'weather1002')
    text=rep(text,'if(now!==lastDay){lastDay=now;if(active()&&!document.hidden)renderDemob816();}','if(now!==lastDay){lastDay=now;DM816.sel=null;if(active()&&!document.hidden)renderDemob816();}',"New AEST morning selects today's Demob card",'weather1002')
    # Define the helper before any card extension can render; none of its methods run until the page is ready.
    return rep(text,'</head>\n<body','<style id="weather1002-style">\n'+(HERE/'weather1002.css').read_text()+'</style>\n<script id="weather1002-source">\n'+(HERE/'weather1002.js').read_text()+'</script>\n</head>\n<body','Full-width approved weather cards and shared centring','weather1002')
