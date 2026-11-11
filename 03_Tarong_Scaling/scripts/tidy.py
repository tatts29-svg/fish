"""Description tidy-up for client-facing output: no customer labels, no barcodes/stock codes,
consistent capitalisation, so the same item always reads (and groups) the same way."""
import re
UGLPAT = re.compile(r"\(\s*UGL[^)]*\)?|UGL\s+OWN(ED)?\.?|UGL|\bOWN(ED)?\b|\bOne Team\b|\b[ABC]\s+CREW\b|\bMECHANICAL\s+(PIPING|FITTERS)?\b|\bMechanical\b|\bSCAFFOLD(ING|ERS)\b(?!\s*KIT)|\bQA\b", re.I)
WORDS = set('AND FOR THE WITH OF TO IN ON BOX CUT SET KIT PAD BAG CAP TIP RED TAN ZIP TIE GUN SAW BIT ROW NUT ROD BAR PEN INK OIL AIR ICE TEA CUP DRY WET HOT LID MAT BIN JUG MOP TOP END NEW LOW MAX MIN ONE TWO HEX TAP DIE HAT EAR ARC FLAT BLUE GREY GRAY PINK GOLD LONG WIDE HIGH FINE SOFT HARD HEAD BASE LESS FOOD TOOL ONLY SKIN BARE MID GEN PRO PLUS ALL NO SUIT PACK PK CTN BLK WHT BLACK WHITE GREEN YELLOW ORANGE CLEAR SMOKE ROUND DOUBLE SINGLE HEAVY DUTY LARGE SMALL MEDIUM XL'.split())
KEEP = set('LED PVC UV HD AA AAA SDS HSS ABE CO2 RCD IP44 PPE SRL CSK SQ DR TIG MIG LPG CRC WD-40 PSF AF HC RT EWP 4WD 2WD USB AC DC MDF PU HV CEE FR XL XXL 2XL 3XL'.split())
UNITS = {'MM':'mm','CM':'cm','M':'m','ML':'mL','L':'L','LT':'L','LTR':'L','KG':'kg','G':'g','GM':'g','AH':'Ah','NM':'Nm','V':'V','W':'W','T':'t','MTR':'m','PC':'pc','PK':'pk','KVA':'kVA'}
def _word(w):
    if '/' in w and not re.search(r'\d', w):
        return '/'.join(_word(x) for x in w.split('/'))
    m = re.fullmatch(r'(\d[\d.,]*)([A-Za-z]+)', w)
    if m and m.group(2).upper() in UNITS: return m.group(1) + UNITS[m.group(2).upper()]
    core = re.sub(r'[^A-Za-z0-9\-/]', '', w)
    if not core: return w
    if core.upper() in KEEP or re.search(r'\d', core): return w.upper() if re.search(r'\d', core) else w
    if core.isupper() and len(core) <= 3 and core not in WORDS: return w      # short acronym
    return w[:1].upper() + w[1:].lower() if w[:1].isalpha() else w[:1] + w[1:2].upper() + w[2:].lower()
def tidy_case(s):
    letters = [c for c in s if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.7:
        s = ' '.join(_word(w) for w in s.split(' '))
    return s
def clean(s):
    s = str(s).replace('_x0002_', '-').replace('\n', ' ').replace('“', '"').replace('”', '"')
    if re.search('ugl', s, re.I): s = UGLPAT.sub(' ', s)
    s = re.sub(r'^(Motorola Radio)\s+871\w+$', r'\1', s.strip(), flags=re.I)
    s = re.sub(r'\(\s*FSQ Works\s*\)', '', s, flags=re.I)
    s = re.sub(r'GP No:?\s*\S+', '', s, flags=re.I)
    s = re.sub(r'\s*-?\s*Greener Choice', '', s, flags=re.I)
    s = re.sub(r'^\d{5,}\s+', '', s.strip())
    s = re.sub(r'\s+\.\s+', ' ', s)
    s = re.sub(r'\(\s+', '(', s); s = re.sub(r'\s+\)', ')', s); s = re.sub(r'\(\s*\)', '', s)
    s = re.sub(r'\s+', ' ', s).strip(' -.:')
    s = tidy_case(s)
    s = re.sub(r'(?<=\d)\s*[xX]\s*(?=\d)', ' x ', s)
    return s
def key(s): return re.sub(r'[^a-z0-9]', '', clean(s).lower())
