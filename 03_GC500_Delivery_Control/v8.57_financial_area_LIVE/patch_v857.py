# Author: Andrew Fisher.
import sys,os,re,hashlib
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','toolchain'))
from rep import rep as guarded_rep
def rep(s,old,new):return guarded_rep(s,old,new,old[:65],sys.argv[1])
p=sys.argv[1];s=open(p,encoding='utf-8-sig').read()
assert 'function financeTab857(' not in s
assert hashlib.sha256(open(p,'rb').read()).hexdigest()=='51e3a3876ab8fa20908b81dbc77face665e350871d2bf758e3bd8bf4731ab624'
s=rep(s,"function go(tab){ return holdAssets(() => go776Held(go793(tab))); }","function go(tab){ return holdAssets(() => go776Held(go793(financeTab857(tab)))); }")
s=rep(s,"['costs','Costs']","['costs','Costs & P&L']")
s=rep(s,"const here = hidden.find(([k]) => k === state.tab);","const here = hidden.find(([k]) => k === state.tab && !['costs','pricing'].includes(k));")
s=rep(s,"const hidden = TABS.filter(([k]) => inMore(k) && (!TABS_OFF.has(k) || editOk(k)));","const hidden = TABS.filter(([k]) => k !== 'pricing' && inMore(k) && (!TABS_OFF.has(k) || editOk(k)));")
s=rep(s,"TABS.filter(([k]) => (!TABS_OFF.has(k) || editOk(k)) && (k !== 'edit' || editOk(k))).map","TABS.filter(([k]) => k !== 'pricing' && (!TABS_OFF.has(k) || editOk(k)) && (k !== 'edit' || editOk(k))).map")
s=rep(s,"function renderCosts(){\nconst result = holdAssets(renderCosts_held);","function renderCosts(){\n financeHome857();\n if(financeSubView857())return;\nconst result = holdAssets(renderCosts_held);\n document.getElementById('pane-costs').insertAdjacentHTML('afterbegin',financeLinks857());")
s=rep(s," hzTodayPod(); /* v6.10 - the banner's day pod reads the same record this pass drew */"," financeOperational857();\n hzTodayPod(); /* v6.10 - the banner's day pod reads the same record this pass drew */")
a=s.index('  function groupMoney(card) {');b=s.index('  function programmeDetails(card)',a)
s=rep(s,s[a:b],"  function groupMoney(card) { return ''; } /* v8.57: financial presentation lives in Costs. */\n")
s=rep(s,'Open a count or explore by type and costs','Open a count or explore by type')
s=rep(s,'Source, schedule and costs','Source and schedule')
s=rep(s,'What was supplied is not what was asked for. This is the one that costs money.','What was supplied differs from what was asked for. Review the supplied equipment.')
source=open(os.path.join(os.path.dirname(__file__),'finance857.js')).read()
s=rep(s,'function renderCosts(){',source+'\nfunction renderCosts(){')
head_end=s.index('</head>'); head_anchor=s[head_end-120:head_end+7]
s=rep(s,head_anchor,head_anchor[:-7]+'<style id="finance857-style">.finance857-nav{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}.finance857-nav .btn{min-height:44px}#finance857-section{min-width:0}#finance857-section>section{display:block}</style>\n</head>')
# Footer identifier only; preserve native model versions.
s=rep(s,'· v8.56','· v8.57')
open(p,'w',encoding='utf-8-sig').write(s)
