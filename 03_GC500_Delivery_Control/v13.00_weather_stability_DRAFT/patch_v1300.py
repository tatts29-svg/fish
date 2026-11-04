"""Author: Andrew Fisher. Keep Demob weather stable across native day redraws."""
from pathlib import Path
import hashlib, re, sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE));sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='ae11b779720acbaf6b4e8d32061cc7da5c9218e9eaa017cceb0343defa73e8ee'
def apply(source):
 if hashlib.sha256(source.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live v12.99 base')
 from weather_integration1300 import apply as weather
 from weather_resize1300 import apply as resize
 source=weather(source)
 for script_id in ['weather1002-source','timeline937-script']:
  matches=list(re.finditer(r'(<script\b[^>]*\bid="'+re.escape(script_id)+r'"[^>]*>)(.*?)(</script>)',source,re.S))
  if len(matches)!=1:raise ValueError('Expected one '+script_id)
  m=matches[0];source=source[:m.start(2)]+resize(m[2])+source[m.end(2):]
 from observer_integration1300 import apply as observers
 source=observers(source)
 return rep(source,"+' · v12.99';","+' · v13.00';",'footer','Demob weather v13.00')
if __name__=='__main__':
 path=Path(sys.argv[1]);path.write_text(apply(path.read_text()))
