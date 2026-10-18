# Author: Andrew Fisher
from pathlib import Path
import sys, hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
from presentation988 import apply_presentation988
p=Path(sys.argv[1]);s=p.read_text()
if hashlib.sha256(p.read_bytes()).hexdigest()!='554538d9203e9a8863a145b592a7f6b66a4f4d6307f398de3cf7f394c0bd1939':raise SystemExit('Wrong live base')
if 'staff988-script' in s:raise SystemExit('Already applied')
s=rep(s,"+ ' · v9.87'","+ ' · v9.88'",'Version',str(p))
s=rep(s,"staff: iso => typeof StaffNames910 !== 'undefined' ? StaffNames910.day(iso) : null,","staff: iso => root.DailyStaff988?.day ? root.DailyStaff988.day(iso) : null,",'Shared daily available staff',str(p))
s=rep(s,"weekSource: week.source, staffNames, staffRecorded: staffNames.length > 0,","weekSource: week.source, staffNames, staffCount: roster?.count ?? null, staffUnnamed: roster?.unnamed || 0, staffRecorded: roster?.count != null,",'Separate available count from named count',str(p))
s=rep(s,"staffSource: 'Native named day roster · StaffNames910.day'","staffSource: 'Daily availability and programmed roster · DailyStaff988.day'",'Staff evidence source',str(p))
s=rep(s,"const names=d.staffNames.length?d.staffNames.map(n=>'<span>'+e(n)+'</span>').join(''):'<span class=\"bc984-missing\">No roster recorded</span>',rule=d.lifeSavingRule;","const names=d.staffNames.map(n=>'<span>'+e(n)+'</span>').join('')+(d.staffUnnamed?'<span class=\"bc984-missing\">'+d.staffUnnamed+' unnamed</span>':'')||'<span class=\"bc984-missing\">'+(d.staffCount===0?'No staff available':d.staffCount!==null?'Names not recorded':'No availability recorded')+'</span>',rule=d.lifeSavingRule;",'Display known and unnamed staff truthfully',str(p))
s=rep(s,'STAFF ON THIS DAY','AVAILABLE STAFF','Consistent card terminology',str(p))
s=rep(s,"(d.staffNames.length?'<b>'+d.staffNames.length+'</b> staff':'')","(d.staffCount!==null?'<b>'+d.staffCount+'</b> staff':'Not recorded')",'Card total uses availability',str(p))
s=rep(s,"'. Staff: '+(d.staffNames.join(', ')||'no roster recorded')","'. Available staff: '+(d.staffCount===null?'not recorded':d.staffCount)+'. '+(d.staffNames.join(', ')||'')",'Accessible available staff total',str(p))
old="  '<label class=\"flow891-people\"><span>People on</span><input type=\"number\" min=\"0\" max=\"50\" inputmode=\"numeric\" data-flow891-people value=\"' + (P.count == null ? '' : P.count) + '\"' + (can ? '' : ' disabled') + ' aria-label=\"People on for ' + esc(fmtDate(d.iso)) + '\">' + (can ? '<button type=\"button\" class=\"btn\" data-flow891-people-save>Save</button>' : '') + '</label></div>' +"
s=rep(s,old,"  '</div>' +",'One daily staff editor replaces duplicate count form',str(p))
s=apply_presentation988(s)
s=rep(s,'</head>\n<body','<style id="staff988-style">'+(here/'staff988.css').read_text()+'</style>\n</head>\n<body','Day staff panel style',str(p))
s=rep(s,'</body>\n</html>','<script id="availability988-script">'+(here/'availability988.js').read_text()+'</script>\n<script id="staff988-script">'+(here/'staff988.js').read_text()+'</script>\n</body>\n</html>','Daily staff model and interface',str(p))
p.write_text(s)
