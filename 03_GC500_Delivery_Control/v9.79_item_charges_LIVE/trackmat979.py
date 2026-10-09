# Author: Andrew Fisher. Integrate with claimed release; original sources remain private.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_trackmat979(s):
 if 'function trackmatDeliveryCoverage979(' in s: raise ValueError('Already applied')
 if 'function transportContainerOwners977(' not in s: raise ValueError('Wrong base')
 s=rep(s,'function otherTransportInput831(){',Path(__file__).with_name('trackmat979.js').read_text()+'\nfunction otherTransportInput831(){','Existing Trakmat load coverage helper',__file__)
 s=rep(s,'  if(invalidBindings.length){','  const trackmat979=trackmatDeliveryCoverage979(buildings,sources,assets);if(trackmat979)coverageOverrides.push(trackmat979);\n  if(invalidBindings.length){','Exact single-load Trakmat delivery coverage',__file__)
 return s
