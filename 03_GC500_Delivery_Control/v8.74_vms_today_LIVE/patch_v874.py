# Author: Andrew Fisher. Same instruments and native progress, separate VMS scope.
import sys,os
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep as checked_rep
def rep(s,a,b):return checked_rep(s,a,b,'v8.74 VMS progress',sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text();assert 'function asset873Numbers(' in s and "id: 'vms', name:" not in s
s=rep(s,"{id: 'equipment', name: 'Equipment', group: 'Forklifts & access'", "{id: 'vms', name: 'VMS boards', group: 'VMS boards', unit: 'boards',\n      scope: 'Variable message signs', accepts: /\\bvms\\b|variable\\s*message/i},\n    {id: 'equipment', name: 'Equipment', group: 'Forklifts & access'")
s=rep(s,"Generators: 'generators', 'Lighting towers': 'lighting', Fencing: 'fencing'}", "Generators: 'generators', 'Lighting towers': 'lighting', 'VMS boards': 'vms', Fencing: 'fencing'}")
s=rep(s,"const ids = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'equipment'];", "const ids = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment'];")
s=rep(s,"const cards = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'equipment'];", "const cards = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment'];")
s=rep(s,'VMS, barriers, furniture and track mat remain in Equipment detail.','VMS has its own card; barriers, furniture and track mat remain in Equipment detail.')
s=rep(s,'VMS, access, water barriers, furniture, track mat and other equipment retain separate quantities and units.','VMS has its own card. Access, water barriers, furniture, track mat and other equipment retain separate quantities and units.')
s=rep(s,"equipment: 'M2 17H15V20H2ZM4 17V7H12L15 17M6 10H11M18 4V20H22M3 21A2 2 0 1 0 7 21M10 21A2 2 0 1 0 14 21'", "vms: 'M3 3H21V15H3ZM7 7H9M11 7H13M15 7H17M7 11H9M11 11H13M15 11H17M7 15V21M17 15V21',\n    equipment: 'M2 17H15V20H2ZM4 17V7H12L15 17M6 10H11M18 4V20H22M3 21A2 2 0 1 0 7 21M10 21A2 2 0 1 0 14 21'")
s=rep(s,' · v8.73',' · v8.74');p.write_text(s)
