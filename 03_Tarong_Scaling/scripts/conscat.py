"""Two-level consumable categories: (Category, Sub-category). Ordered - first match wins."""
import re
RULES = [
 # --- one-off / scope items first
 ('One-off: purchased tools & equipment', 'Power tools (bought)', r'power pack|onkey|cordless sprayer|stihl|\bskin\b|tool only|\bbare\b|sawzall|circular saw|hammer drill|impact (driver|wrench)|grinder.*fuel|fuel .*(grinder|blower|jigsaw)|table saw|saw table|mitre saw|saw mitre|compound|combo kit|blower|mower|pruner|post driver|mixer professional|charger'),
 ('One-off: purchased tools & equipment', 'Measuring & test equipment', r'tape measure|reaming pen|spirit|\blevel|dumpy|tripod|laser|angle finder|thermometer|\bscale\b|vernier|feeler|square|torque tester'),
 ('One-off: purchased tools & equipment', 'Hand tools (bought)', r'\bratchet \d|ratchet 1/2|sq dr|torque ?wrench|\bnm\b|wrench|plier|nipper|multi grips|puller|crimper|trowel|clamp xl|bar clamp|extension bar|caulking gun|grease gun|blow gun|chicago air|cutter steel|knips'),
 ('One-off: purchased tools & equipment', 'Site equipment (bought)', r'garden cart|creeper|pedestal|esky|cooler hard|ladder|wagon|platform truck|lifting cage|safety gate|stand set|lead stand|gazebo|umbrella|wind region|bundle|apron|chaps|penlight|cooler marine|bunded pallet|cigarette|ceasefire|bug zapper|ute mat'),
 ('One-off: project materials', 'Timber & sheet', r'pine|timber|framing|\bply\b|plywood|hardwood|gyprock|composite panel|aluminium angle'),
 ('One-off: project materials', 'Fencing & posts', r'fence post|picket|star picket|post y'),
 ('One-off: project materials', 'Bulk fixings & building', r'endwall|access door|chemical stud|decking|batten|roofing|form oil|mortar|strapping punched|brace strapping|allthread|mesh reinforcing'),
 # --- PPE
 ('PPE', 'Gloves - welding', r'(tig|mig|weld).*glove|glove.*(tig|weld)|gauntlet'),
 ('PPE', 'Gloves - cut resistant', r'glove.*cut|cut.*glove|maxicut|g-force|hi ?vis cut'),
 ('PPE', 'Gloves - disposable', r'nitrile|disposable.*glove|black ace'),
 ('PPE', 'Gloves - general', r'glove'),
 ('PPE', 'Eye protection', r'glass|spec|goggle|lens|bolle|swordfish|visispec|foam gasket'),
 ('PPE', 'Face & welding shields', r'face shield|visor|welding helmet|welding lens|magnification lens'),
 ('PPE', 'Hearing protection', r'ear ?plug|earmuff|ear muff'),
 ('PPE', 'Head protection', r'hard ?hat|sweatband|helmet|chin strap|brim|squids'),
 ('PPE', 'Respiratory protection', r'respir|mask|\bp2\b|filter|cartridge|dust guard|fit test'),
 ('PPE', 'Disposable coveralls', r'coverall|chemguard'),
 ('PPE', 'Hi-vis & clothing', r'shirt|vest|jacket|pant|sock|beanie|hi.?vis|boot|overall|poncho|rainsuit|cap\b|welding jacket|proban'),
 ('PPE', 'Knee & body protection', r'knee pad|knee'),
 # --- Health, hygiene & welfare
 ('Health, hygiene & welfare', 'Heat stress & hydration', r'sqwincher|electrolyte|hydrat|zooper|ice|cooling|scarf|towel|camelbak|tablet cleaning'),
 ('Health, hygiene & welfare', 'Sun & insect protection', r'sunscreen|suncreen|sunblock|spf|repellent|aeroguard|bushman|lip'),
 ('Health, hygiene & welfare', 'First aid', r'first aid|band.?aid|plaster|bandage|eye wash|burn|saline'),
 ('Health, hygiene & welfare', 'Hand care & hygiene', r'\bhand\b|hand san|soap|sanitis|wipe|tissue|toilet|glen ?20|disinfect'),
 ('Health, hygiene & welfare', 'Crib & kitchen', r'fork|spoon|knife|cup|plate|coffee|tea\b|sugar|milk|straw|food container|kettle|jug|water|dishwash|tub\b'),
 # --- Safety & site control
 ('Safety & site control', 'Height safety & tool tethering', r'scaffolders kit|tool belt|wrist-?anchor|belt-?loop|bolt-?safe|pouch|harness|srl|nano-?lok|scaffold hook|tool lanyard|tool catch|tool holder|tether|lanyard|anchor strap|e-catch'),
 ('Safety & site control', 'Lockout, tags & padlocks', r'padlock|lockout|lock\b|tag|hasp'),
 ('Safety & site control', 'Barricading & signage', r'caution|vinyl sticker|bollard|barrier|bunting|flag|webbing|danger|chain|sign|cone'),
 ('Safety & site control', 'Fire & emergency', r'fire ext|fire blanket|air horn|spill'),
 # --- Hot work
 ('Welding & hot work', 'Welding consumables', r'electrode|wire.*mig|mig wire|tig rod|nozzle|diffuser|tip|gas diffuser|tweco'),
 ('Welding & hot work', 'Gouging, cutting & ignition', r'gouging|flint|lighter|oxygen|cutting nozzle|tip cleaner'),
 ('Welding & hot work', 'Welding screens & blankets', r'weld|arc ?guard|arc safe|curtain|blanket'),
 # --- Cutting, grinding & drilling
 ('Cutting, grinding & drilling', 'Cut-off discs', r'cut.?off|c/wheel|inox.*wheel|cutting disc|1\.6 x|1\.0 x|1mm disc'),
 ('Cutting, grinding & drilling', 'Grinding & flap discs', r'grind|flap|disc|backing pad|sanding|\bmop\b|klingspor|cubitron'),
 ('Cutting, grinding & drilling', 'Wire brushes & wheels', r'wire brush|wire wheel|twist knot|bevel brush|end brush|bristle blaster|bordo'),
 ('Cutting, grinding & drilling', 'Saw blades', r'blade|hacksaw|jigsaw|recip'),
 ('Cutting, grinding & drilling', 'Driver bits', r'nutsetter|spade set|driver bit|torsion|bit holder|power bit|insert bit|bit set'),
 ('Cutting, grinding & drilling', 'Drill bits', r'drill|jobber|\bbits?\b|countersink'),
 ('Cutting, grinding & drilling', 'Holesaws, cutters & cores', r'hole ?saw|annular|core|arbor|step drill'),
 ('Cutting, grinding & drilling', 'Chisels & SDS', r'chisel|sds'),
 ('Cutting, grinding & drilling', 'Taps & dies', r'\btaps?\b|\bdies?\b'),
 # --- Lifting & rigging
 ('Lifting, rigging & covers', 'Slings & shackles', r'sling|shackle|rigging'),
 ('Lifting, rigging & covers', 'Ratchet straps & tie-downs', r'ratchet strap|tie down|ratchet'),
 ('Lifting, rigging & covers', 'Rope & line', r'rope|brick line|string line|\bline\b'),
 ('Lifting, rigging & covers', 'Tarps & covers', r'stretch|cargo net|shade cloth|sahde cloth|tarpaulin|tarp|cover|plastic sheet|film'),
 # --- Chemicals
 ('Marking & office', 'Marking (field)', r'paint mark|marking paint|spray ?& ?mark|line mark'),
 ('Chemicals, adhesives & paint', 'Tapes', r'tape'),
 ('Chemicals, adhesives & paint', 'Sealants & silicones', r'silicon|sealant|soft seal|rtv|gasket'),
 ('Chemicals, adhesives & paint', 'Adhesives & epoxies', r'glue|adhesive|loctite|epoxy|araldite|devcon|aktivator'),
 ('Chemicals, adhesives & paint', 'Lubricants & oils', r'cutting fluid|fluid cutting|lubric|wd-?40|grease|oil|anti seize|cutting fluid|crc|rp7'),
 ('Chemicals, adhesives & paint', 'Cleaners & solvents', r'acetone|thinner|degreas|solvent|brake clean|citrus|cleaner'),
 ('Chemicals, adhesives & paint', 'Paint & coatings', r'gal spray|paint(?! marker)|enamel|primer|zinc|galv|coating'),
 ('Chemicals, adhesives & paint', 'Brushes & rollers', r'brush|roller'),
 # --- Fixings & hardware
 ('Plumbing, hose & fittings', 'Fittings & valves', r'hose connector'),
 ('Fixings & hardware', 'Cable ties', r'cable tie|zip tie|tie cable'),
 ('Fixings & hardware', 'Screws & bolts', r'screw|bolt|tek|coach'),
 ('Fixings & hardware', 'Nuts, washers & rivets', r'\bnuts?\b|nyloc|washer|rivet'),
 ('Fixings & hardware', 'Anchors & shims', r'anchor|shim|wedge'),
 ('Fixings & hardware', 'Strapping & clips', r'buckle|strap|clip|seal|tensioner|band-?it|swage|pin\b'),
 ('Fixings & hardware', 'Nails & general hardware', r'nail|hook|hinge|bracket'),
 # --- Electrical, batteries & lighting
 ('Electrical, batteries & lighting', 'Batteries', r'batter'),
 ('Electrical, batteries & lighting', 'Torches & headlamps', r'torch|headlamp|lamp head|\blamp'),
 ('Electrical, batteries & lighting', 'Electrical consumables', r'extension lead|lead hook|cable|plug|electrical|globe|fan\b|duct'),
 # --- Marking & office
 ('Marking & office', 'Marking (field)', r'paint marker|marker|crayon|chalk|sharpie|soapstone|keel|uni px'),
 ('Marking & office', 'Office stationery', r'pen\b|pens|pencil|paper|note|clipboard|folder|envelope|stapl|toner|ink|label|ruler|book'),
 # --- Cleaning & site housekeeping
 ('Cleaning & housekeeping', 'Rags & absorbents', r'rag|absorb|wiper'),
 ('Cleaning & housekeeping', 'Bins, bags & buckets', r'bag|bin|bucket|pail|jerry|fuel can|tray|container'),
 ('Cleaning & housekeeping', 'Brooms & cleaning', r'broom|dustpan|scour|mop|clean|detergent|fly'),
 # --- Plumbing
 ('Plumbing, hose & fittings', 'Hose & tube', r'hose|tube|pipe'),
 ('Plumbing, hose & fittings', 'Fittings & valves', r'coupl|elbow|adaptor|barb|valve|bspt|bspp|npt|fitting|connect|gauge'),
 ('Plumbing, hose & fittings', 'Rubber & sealing', r'rubber|hemp|insertion|o-ring'),
 ('Hand tools & accessories', 'Spare parts', r'wheel assy|spare wheels|replacement|jaws'),
 # --- Hand tools
 ('Hand tools & accessories', 'Hand tools & accessories', r'file\b|drift|snip|knife|scraper|pliers|spanner|hammer|tool|cutter|saw\b|stamp|punch|scissor'),
]
def classify(desc):
    d = str(desc).lower()
    for cat, sub, pat in RULES:
        if re.search(pat, d): return cat, sub
    return 'General store items', 'General store items'
