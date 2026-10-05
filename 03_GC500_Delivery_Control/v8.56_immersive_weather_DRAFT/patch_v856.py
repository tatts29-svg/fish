"""Author: Andrew Fisher. Selected native Timeline weather presentation."""
from pathlib import Path
import hashlib,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='69dbf48d271dc73a17d9f3eb437eb3a425e68f075f954a8e769f92f69087c584','Live base changed or patch repeated'
s=raw.decode();s=rep(s,'</head>\n<body>','<style id="timeline-weather856">'+(ROOT/'weather856.css').read_text()+'</style>\n</head>\n<body>','Selected weather artwork','v8.56')
s=rep(s,'<meta name="gc500-release" content="v8.55">','<meta name="gc500-release" content="v8.56">','Metadata','v8.56')
s=rep(s,"+ ' · v8.55'; /* v8.19 - the footer names the release once */","+ ' · v8.56'; /* v8.19 - the footer names the release once */",'Footer','v8.56');p.write_text(s)
