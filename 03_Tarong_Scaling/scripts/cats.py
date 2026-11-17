import re
PLANT_PROD={'Access - Knuckle Booms':'Elevated work platforms','Access - Scissor Lifts':'Elevated work platforms','Access - Straight Booms':'Elevated work platforms',
 'Air Compressors - Diesel Small':'Compressors','Compaction - Rammers & Vibrating Plates':'Compaction & earthmoving','Compaction - Rollers - Double Drum Smooth':'Compaction & earthmoving',
 'Earthmoving - Water Carts':'Compaction & earthmoving','Materials Handling - Telehandler':'Forklifts & telehandlers','Generators - Diesel Small':'Generators','Generators - Petrol':'Generators',
 'Lighting Towers':'Lighting towers','Portable - Toilets':'Site facilities','Site Storage':'Site facilities','Traffic - Management - Electronic - Attenuators':'Traffic management',
 'Traffic - Plates, Bridges, Grids':'Traffic management','Trailers':'Trucks & trailers','Trailers - Fuel':'Trucks & trailers','Trucks & Vehicles':'Trucks & trailers','Welders - Motorised':'Generators'}
PLANT_KW=[('Forklifts & telehandlers',r'forklift|telehandler'),('Elevated work platforms',r'boom lift|knuckle boom|scissor lift|ewp'),('Lighting towers',r'lighting tower|light tower'),
 ('Generators',r'generator'),('Compressors',r'compressor')]
TOOL=[('Communications',r'radio|motorola'),
 ('Safety & emergency',r'fire extinguisher|spotter|vest|webbing|danger|barrier|first aid|eye wash|spill'),
 ('Bolting & torque',r'\bnm\b|adj .*sq dr|torque'),
 ('Height safety',r'restraint line|srl|nano-?lok|harness|lanyard|anchor|tether|inertia|fall arrest|static line|rope grab|scaffold hook|stop the drop'),
 ('Lifting & rigging',r'bull bag|mule bag|lift bag'),
 ('Measuring & testing',r'inspection camera|spirit|mlbx'),
 ('Power tools',r'grease gun|post driver|mixer'),
 ('Air tools & hoses',r'needle ?gun'),
 ('Hand tools',r'\btaps?\b|\bdie\b|stilsen|chalk line|straight edge|divider|stamp|creeper|strapping tool|crowsfoot|crowfoot'),
 ('Store & site equipment',r'gang box|pallet truck|cooler|ducting|carrier|cabinet|bin\b|umbrella|sandwich|boat hook|pedestal|stand\b'),
 ('Gas detection & confined space',r'gas detect|gas monitor|confined space|tripod|rescue|davit|ventilat|blower|mx6|bump test'),
 ('Height safety',r'harness|lanyard|anchor|tether|inertia|fall arrest|static line|rope grab|scaffold hook|stop the drop'),
 ('Lighting',r'\blight|\blamp|torch|flood'),
 ('Batteries & chargers',r'^(\d+ )?(milwaukee |motorola )?(m12 |18v )?batter|charger|\d\s*ah\b|\dah batter|^battery'),
 ('Power tools',r'cordless|battery|drill|grinder|saw|nibbler|impact wrench|impact driver|screw ?driver cordless|riveter|rivet tool|sander|polisher|router|planer|heat gun|vacuum|vac\b|blower|hammer drill|rotary hammer|breaker|demolition|core|magnetic drill|mag drill|caulking gun|band ?saw|shear|multi.?tool|fuel'),
 ('Bolting & torque',r'torque|bolting|\btension|hydraulic wrench|nut ?split|multiplier|hytorc'),
 ('Lifting & rigging',r'chain block|lever hoist|hoist|cumalong|winch|sling|shackle|beam clamp|plate clamp|trolley|jack|lifting|spreader|tirfor|come.?along|load cell'),
 ('Electrical & leads',r'lead|power pack|distribution board|rcd|earth leakage|adaptor plug|cable|transformer|power board|spider box|fan\b|fans'),
 ('Welding & cutting',r'weld|oxy|acet|lpg|torch kit|plasma|gouging|cutting & brazing|regulator|gas equipment'),
 ('Air tools & hoses',r'air |manifold|hose|pneumatic'),
 ('Respiratory & PPE',r'respirator|speedglas|adflo|face shield|mask|ear|glove|helmet|visor|goggle'),
 ('Measuring & testing',r'tape measure|rule|level|micrometer|vernier|caliper|gauge|meter|laser|square|feeler|dial|thermometer|tester|detector|measur'),
 ('Ladders & access',r'ladder|step|platform|trestle'),
 ('Pumps, plumbing & cleaning',r'pump|plumb|pipe|water blast|pressure clean|broom|mop|floor|drain'),
 ('Hand tools',r'screw ?driver set|socket|spanner|wrench|ratchet|podger|screwdriver|plier|hammer|mallet|bar\b|pry|crowbar|chisel|punch|file|hacksaw|snip|cutter|scissor|knife|clamp|vice|allen|hex key|key set|tool ?bag|toolbag|tool box|toolbox|tool kit|kit|bit holder|extension|adaptor|universal joint|crowfoot|bolt cutter|sledge|wedge|scraper|brush|magnet|pick|shovel|spade|rake|wheelbarrow|trolley|apron|belt|bucket'),
]
def tool_cat(desc,prod,fam):
    d=desc.lower().strip()
    if prod in PLANT_PROD and not re.search(r'cutter',d): return ('Plant',PLANT_PROD[prod])
    for n,p in PLANT_KW:
        if re.search(p,d): return ('Plant',n)
    for n,p in TOOL:
        if re.search(p,d): return ('Tools',n)
    m={'Concrete':'Power tools','Demolition':'Power tools','Landscaping Equipment':'Hand tools','Floor Equipment':'Pumps, plumbing & cleaning','Water Blasters':'Pumps, plumbing & cleaning',
       'Measurement Equipment':'Measuring & testing','Generators - Accessories':'Electrical & leads','Welders - Accessories':'Welding & cutting','Welders - Electric':'Welding & cutting',
       'Jacking':'Lifting & rigging','Winches':'Lifting & rigging','Chain Blocks':'Lifting & rigging','Materials Handling - Forklift - Pallet Truck':'Lifting & rigging','Materials Handling - General':'Lifting & rigging','Crane & Fork Attachment':'Lifting & rigging'}
    return ('Tools',m.get(prod,'General equipment'))
