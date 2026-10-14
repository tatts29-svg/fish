"""Author: Andrew Fisher. Component dependency and repeat guards on an explicit input."""
from pathlib import Path
import sys
from patch_flows1016 import apply

source=Path(sys.argv[1]).read_text()
result=apply(source)
script='\n<script id="routes1016-script">\n'+Path(__file__).with_name('flows1016.js').read_text()+'\n</script>'
assert result.count('id="routes1016-script"') == 1
assert result.replace(script,'') == source
try:
    apply(result)
except ValueError:
    pass
else:
    raise AssertionError('Repeat accepted')
try:
    apply(source.replace('root.Flows1013=','root.missingFlows='))
except ValueError:
    pass
else:
    raise AssertionError('Missing dependency accepted')
print('PASS 4 route patch guards')
