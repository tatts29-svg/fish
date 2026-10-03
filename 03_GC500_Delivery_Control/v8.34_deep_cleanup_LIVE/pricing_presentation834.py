"""Author: Andrew Fisher. Explain existing alias scope without changing comparisons."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

MARKER='function pricingAliases834('
ANCHOR='function renderPricing(){'
ROW_OLD=' <td><b>${esc(g.item)}</b>${g.plant ?'
ROW_NEW=' <td><b>${esc(g.item)}</b>${pricingAliasRows834(g.assets)}${g.plant ?'
NOTICE_OLD=' <div class="kpis">\n <div class="kpi"><div class="v">${assets.length}</div><div class="l">Equipment on the job</div>'
NOTICE_NEW=' ${pricingAliasNotice834(assets)}\n'+NOTICE_OLD.replace('Equipment on the job', 'Active schedule records')
COST_OLD=' — an estimate from the schedule, not the bill.</p>'
COST_NEW=' — an estimate from the schedule, not the bill.${pricingAliasCostNote834()}</p>'

HEADING_OLD='<h3>Rate card — 2026 circuit</h3>'
HEADING_NEW='<h3>Rate card — ${RM && RM.card_year ? esc(RM.card_year) + " " : ""}${esc(CARD_WORD)}</h3>'
# Match the obsolete sentence structurally, without publishing source-person/date
# strings or altering the following authoritative RM charge-rule explanation.
NOTICE_START=" ? `The rental contracts bill every building at 70 days of the card's daily rate"
NOTICE_END=" — so every line below is the ${esc(CARD_WORD)} card, matched by hand to what the schedule asks for"
NOTICE_BASIS=" ? `The street card is selected for this comparison` : `The circuit card is selected for this comparison`} — hire follows each reference's current charge window and exceptions, shown under When a thing is charged for below" + NOTICE_END
SUBTOTAL_OLD='<div class="l">Charge — resolved subtotal</div>'
SUBTOTAL_NEW='<div class="l">${pricingAliases834(assets).length ? \'Schedule subtotal · allocation review\' : \'Charge — resolved subtotal\'}</div>'
UNITS_OLD='Units are what is actually hired, not how many references carry the item'
UNITS_NEW="${pricingAliases834(assets).length ? 'Units follow the source records, including the source-linked aliases identified above pending allocation review' : 'Units follow the source records for each reference'}"

def apply_patch(text,path='candidate'):
    if MARKER in text or text.count(ANCHOR)!=1:
        raise ValueError('Wrong Pricing boundary or alias presentation already installed')
    if text.count(NOTICE_START)!=1 or text.count(NOTICE_END)!=1:
        raise ValueError('Obsolete Pricing notice not found exactly once')
    a=text.index(NOTICE_START); b=text.index(NOTICE_END,a)+len(NOTICE_END)
    old=text[a:b]
    if '` : `' not in old or len(old)>1000:
        raise ValueError('Unexpected Pricing notice structure')
    text=rep(text,old,NOTICE_BASIS,'Current charge-window basis, not blanket days',path)
    text=rep(text,ANCHOR,Path(__file__).with_name('pricing_basis834_src.js').read_text()+'\n'+ANCHOR,'Read-only alias provenance',path)
    for old,new,why in [(ROW_OLD,ROW_NEW,'Alias status on affected item rows'),(NOTICE_OLD,NOTICE_NEW,'Comparison scope qualification'),(COST_OLD,COST_NEW,'Qualify Costs comparison only'),(HEADING_OLD,HEADING_NEW,'Selected current card heading'),(SUBTOTAL_OLD,SUBTOTAL_NEW,'Unreconciled comparison label'),(UNITS_OLD,UNITS_NEW,'Source quantity qualification')]:
        text=rep(text,old,new,why,path)
    return text
