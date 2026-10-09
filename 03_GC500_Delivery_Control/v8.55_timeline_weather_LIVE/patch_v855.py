"""Author: Andrew Fisher. Selected native Timeline weather presentation."""
from pathlib import Path
import hashlib,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='85fd27d0a9528f20fcd2c9bcc1c1d4ab460d25ef079291491cf39041ba0dfb86','Live base changed or patch repeated'
s=raw.decode();s=rep(s,'</head>\n<body>','<style id="timeline-weather855">'+(ROOT/'weather855.css').read_text()+'</style>\n</head>\n<body>','Selected weather artwork','v8.55')
s=rep(s,'<meta name="gc500-release" content="v8.54">','<meta name="gc500-release" content="v8.55">','Metadata','v8.55')
s=rep(s,"+ ' · v8.54'; /* v8.19 - the footer names the release once */","+ ' · v8.55'; /* v8.19 - the footer names the release once */",'Footer','v8.55');p.write_text(s)
