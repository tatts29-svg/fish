# Author: Andrew Fisher. Source-supported machine/accessory and container movement identity.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_other_transport_sources977(s):
    if 'function transportMachineKnown977(' in s:
        raise ValueError('Other transport source977 already applied')
    helpers=Path(__file__).with_name('other_transport_sources977.js').read_text()
    s=rep(s,'function otherTransportInput831(){',helpers+'\nfunction otherTransportInput831(){','Reviewed exact other-transport source helpers',__file__)
    s=rep(s,"if(a.discipline==='Access & plant'&&rentalRows.some(r=>/\\bextension\\b/i.test(str(r.what||r.description))))holdReasons.push('Current number identifies fork extensions; requested machine and accessory allocation needs confirmation');", "if(a.discipline==='Access & plant'&&rentalRows.some(r=>/\\bextension\\b/i.test(str(r.what||r.description)))&&!transportMachineKnown977(a,rentalRows,sources))holdReasons.push('Current number identifies fork extensions; requested machine and accessory allocation needs confirmation');",'Known current machine is distinct from extension',__file__)
    s=rep(s,"if(family==='Containers'&&!exclusion)holdReasons.push('Container contract movement coverage needs exact register allocation; do not add another allowance');", "if(family==='Containers'&&!exclusion&&!transportContainerKnown977(a,sources))holdReasons.push('Container contract movement coverage needs exact register allocation; do not add another allowance');",'Exact docket-linked container movement guard',__file__)
    s=rep(s,"const currentOwners=hire.asset_no_is_plant_number?buildings.filter(b=>!b.exclusion&&b.numbers.includes(str(hire.asset_no))):[];", "const currentOwners=transportContainerOwners977(hire,buildings)|| (hire.asset_no_is_plant_number?buildings.filter(b=>!b.exclusion&&b.numbers.includes(str(hire.asset_no))):[]);",'Use exact supplied container task/docket identity',__file__)
    return s
