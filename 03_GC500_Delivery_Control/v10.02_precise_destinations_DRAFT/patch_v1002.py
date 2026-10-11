"""Author: Andrew Fisher. Source-backed supplier destinations shared by all supplier exports."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
sys.path.insert(0,str(HERE))
from patch_weather1002 import apply as weather_apply
BASE_SHA='67dc74f271b2c3927eb8ebaaa65d849b5879c9827fa382358194a20effe2cc7b'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest()!=BASE_SHA:raise ValueError('Requires exact live v10.01; refuses repeat application')
    core=(HERE.parent/'v9.96_supplier_sync_LIVE/subhire/supplier996.js').read_text()
    old=core[core.index('function where(a){'):core.index('\nfunction context(){')]
    text=rep(text,old,(HERE/'where1002.js').read_text().strip(),'Use reviewed destination with shared-location guards','v10.02')
    text=rep(text,'const api={dailyPlan1000,plannedRemaining1000,remainingIn1000,remainingText1000,family,remainingDates,project,pack,', (HERE/'destinations1002.js').read_text().strip()+'\nconst api={destination1002,dailyPlan1000,plannedRemaining1000,remainingIn1000,remainingText1000,family,remainingDates,project,pack,','Shared pure destination resolver','v10.02')
    text=rep(text,"location:request.name+' team area',locationBasis:","location:destination1002(request.id,{sourceText:request.name+' team area',baseLocation:request.name+' team area',coordinates:'',moveAt:''}),locationBasis:",'Source-only requests share reviewed destination','v10.02')
    text=rep(text,(HERE.parent/'v10.01_qr_daily_routes_LIVE/plan1001.js').read_text().strip(),(HERE/'plan1002.js').read_text().strip(),'Correct geographic route headings','v10.02')
    old_pdf=next((HERE.parent/'v9.96_supplier_sync_LIVE/subhire').glob('*pdf*.js')).read_text()
    old_meta=next(line for line in old_pdf.splitlines() if "const label=kind==='inventory'" in line).replace("author:'Andrew Fisher'","author:'the project manager'")
    text=rep(text,old_meta,old_meta.replace("author:'the project manager'","author:'Author: Andrew Fisher'.slice(8)"),'Supplier PDF author metadata','v10.02')
    text=weather_apply(text)
    return rep(text,"+ ' · v10.01'","+ ' · v10.02'",'Release footer','v10.02')
if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
