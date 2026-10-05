"""Author: Andrew Fisher. Selected native Timeline weather presentation."""
from pathlib import Path
import hashlib,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='69dbf48d271dc73a17d9f3eb437eb3a425e68f075f954a8e769f92f69087c584','Live base changed or patch repeated'
s=raw.decode();s=rep(s,'</head>\n<body>','<style id="timeline-weather856">'+(ROOT/'weather856.css').read_text()+'</style>\n</head>\n<body>','Selected weather artwork','v8.56')
storm_old=next(line for line in s.splitlines() if line.strip().startswith("if(kind==='storm')out+="))
storm_new="""  if(kind==='storm')out+='<g class="wm-storm-flash856"><rect width="192" height="250" fill="#d5edff" opacity=".1"/></g><g class="wm-lightning856"><path d="M157 32L129 63L147 57L133 92L171 53L154 60L175 32Z" fill="#b3e9ff" stroke="#b3e9ff" stroke-width="5" stroke-linejoin="round" opacity=".35"/><path d="M157 32L129 63L147 57L133 92L171 53L154 60L175 32Z" fill="#f3fbff"/><path d="M158 37L135 60L151 54L139 78L164 57L152 64L168 37Z" fill="#ffe8a6" opacity=".8"/></g>';"""
s=rep(s,storm_old,storm_new,'Larger animated storm lightning','v8.56')
sun_old="  if(kind==='sun'||kind==='part'){"
rays='<g class="wm-sun-rays856">'+''.join('<path d="M146 17V10" stroke="#fff5b8" stroke-width="1.1" stroke-linecap="round" transform="rotate('+str(i*22.5)+' 146 42)"/>' for i in range(16))+'</g>'
sun_new=sun_old+'\n   out+='+repr(rays)+';'
s=rep(s,sun_old,sun_new,'Moving sun corona','v8.56')
s=rep(s,'<meta name="gc500-release" content="v8.55">','<meta name="gc500-release" content="v8.56">','Metadata','v8.56')
s=rep(s,"+ ' · v8.55'; /* v8.19 - the footer names the release once */","+ ' · v8.56'; /* v8.19 - the footer names the release once */",'Footer','v8.56');p.write_text(s)
