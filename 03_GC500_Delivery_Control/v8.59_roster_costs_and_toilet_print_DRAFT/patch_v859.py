# Author: Andrew Fisher.
import sys,os,hashlib
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','toolchain'))
from rep import rep as replace
p=sys.argv[1];s=open(p,encoding='utf-8-sig').read()
assert hashlib.sha256(open(p,'rb').read()).hexdigest()=='3b37cef6118920d6e518314356de34caeb6e685c878c34a02c6f63317a9f00e7'
assert 'function rosterAllowance859(' not in s
def rep(a,b):
 global s
 s=replace(s,a,b,a[:70],p)
rep('function renderRunsheet(){ return holdAssets(renderRunsheet_held); }',"function rosterAllowance859(name){const r=(S.finance745||{}).labourAllowance858;return r&&String(name).trim().toLowerCase()===String(r.person||r.by||'').trim().toLowerCase()?labourAllowance858():0;}\nfunction renderRunsheet(){ return holdAssets(renderRunsheet_held); }")
rep("if(tab==='pricing'){state.financeView857='pricing';return 'costs';}","if(tab==='runsheet'){state.financeView857='runsheet';return 'costs';}\n  if(tab==='pricing'){state.financeView857='pricing';return 'costs';}")
rep("['timeline','Timeline'],['runsheet','Running sheet'],['questions','Questions']", "['timeline','Timeline'],['questions','Questions']")
rep('financeLinks857()+labourAllowanceCard858()', 'financeLinks857()')
rep('<th class="num">×2</th><th class="num">Rate $/h</th>', '<th class="num">×2</th><th class="num">Salary allowance (forecast)</th><th class="num">Rate $/h</th>')
rep('<th class="num">×2</th><th class="num">Pay</th>', '<th class="num">×2</th><th class="num">Salary allowance (forecast)</th><th class="num">Pay</th>')
rep('${hh(r.split && r.split.at_2)}</td>', '${hh(r.split && r.split.at_2)}</td><td class="num">${rosterAllowance859(r.name)?\'<span class="w">Included in job total</span>\':\'—\'}</td>')
rep("${hh(sumSplit('at_2'))}</td><td></td>", "${hh(sumSplit('at_2'))}</td><td class=\"num\">—</td><td></td>")
rep('${hh(x.at_2)}</td>', '${hh(x.at_2)}</td><td class="num">${mz(rosterAllowance859(x.name))}</td>')
rep('${hh(T.all.at_2)}</td>', '${hh(T.all.at_2)}</td><td class="num">${mz(labourAllowance858())}</td>')
rep('money(x.total)', 'money(x.total + rosterAllowance859(x.name))')
rep('money(T.all.total)', 'money(T.all.total + labourAllowance858())')
rep('Running sheet — ${esc(fmtDate(iso))}', 'Roster costs — ${esc(fmtDate(iso))}')
rep('Running totals — the whole job', 'Roster cost totals — the whole job')
rep('Wages worked out here are not added to the known-cost total on Costs until the rates are confirmed.', 'Salary allowance is a whole-job forecast, included once in these totals and in the P&amp;L forecast. It is separate from base salary and hotel accommodation. Unpriced wages remain incomplete; calculated forecasts are not confirmed payroll costs.')
# Author: Andrew Fisher. Keep the preview available for mobile printing and retry.
rep("EPP819.after = () => { supplierPrint841After(w,supplier841); };\n\twindow.addEventListener('afterprint', EPP819.after, {once: true});\nEPP819.timer = setTimeout(() => { try { supplierPrint841Go(w,supplier841); } catch (e) {} }, 80);", "// v8.59: Print runs directly from the user's tap; no delayed browser dialog.\nEPP819.after = null; EPP819.timer = 0;")
rep("if (t.closest('[data-ep819-go]')) { if (epOpen819()) { try { supplierPrint841Go(document.getElementById('ep819print')); } catch (x) {} } return; }", "if (t.closest('[data-ep819-go]')) { if (epOpen819()) { try { supplierPrint841Go(document.getElementById('ep819print')); } catch (x) { flash('Print could not open. Try Print / Save as PDF again, or use your browser Print menu.'); } } return; }")
# Reconcile forecast captions with the models, and keep an unknown base salary explicit.
rep('labour per piece still to tick is charged as the work is done and is not carried here', 'remaining priced installation, levelling, steps and demob are included once in forecast Revenue; not billed or marked complete')
rep('(Job Connect) · before', '(priced labour and salary allowance forecast) · before')
rep("gap('The fence team of six on the event labour scope'", "if(labourAllowance858())gap('Coates salary — base salary cost', 'The salary allowance forecast does not include base salary or employer on-costs; Finance confirmation remains required.', 'Finance — aggregate salary cost');\n gap('The fence team of six on the event labour scope'")
rep('${r.pay != null ? esc(money(r.pay))','${r.type===\'salary\'&&!r.pay?\'<span class="w">Base salary pending</span>\':r.pay != null ? esc(money(r.pay))')
rep('${x.pay ? esc(money(x.pay))','${x.type===\'salary\'&&!x.pay?\'<span class="w">Base salary pending</span>\':x.pay ? esc(money(x.pay))')
rep('· v8.58', '· v8.59')
open(p,'w',encoding='utf-8-sig').write(s)
