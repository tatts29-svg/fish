"""Author: Andrew Fisher. Stable Demob weather, card packing and native team availability."""
from pathlib import Path
import hashlib,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE));sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='ec4640ad3d8e8f99250247f40c98958d0b123b590e7c431973460f715f00d24d'
def apply(source):
 if hashlib.sha256(source.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live v12.98 base')
 from weather_integration1299 import apply as weather
 from integration1299 import apply as availability
 from clarity_integration1299 import apply as clarity
 source=weather(source);source=availability(source);source=clarity(source)
 return rep(source,"+' · v12.98';","+' · v12.99';",'footer','Demob v12.99')
if __name__=='__main__':
 path=Path(sys.argv[1]);path.write_text(apply(path.read_text()))
