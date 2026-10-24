# Author: Andrew Fisher
import os,sys
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep as checked_rep
def rep(s,a,b):return checked_rep(s,a,b,'v8.73 current asset and optional loading',sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text();assert 'function loading872Set(' in s and 'function asset873Numbers(' not in s
s=rep(s,"['driver','passenger',''].includes(x.side)","['driver','passenger','na',''].includes(x.side)")
s=rep(s,"!['driver','passenger',''].includes(side)","!['driver','passenger','na',''].includes(side)")
s=rep(s,"side==='passenger'?'Door to passenger side':'Door side not set'","side==='passenger'?'Door to passenger side':side==='na'?'Door side not applicable':'Door side not set'")
s=rep(s,"['driver','passenger'].map(side=>'<label>","['driver','passenger','na'].map(side=>'<label>")
s=rep(s,"['driver','passenger'].map(s=>(s===r.side?", "['driver','passenger','na'].map(s=>(s===r.side?")
s=rep(s,"I have checked each building/toilet’s door-to-driver/passenger-side loading instruction with the driver before loading.","I have checked each building/toilet’s loading instruction, including any Not applicable selection, with the driver before loading.")
s=rep(s,"const booked=Array.isArray(a._bookingNumbers801)?new Set(a._bookingNumbers801.map(String)):null,out=[],seen=new Set();", "const booked=Array.isArray(a._bookingNumbers801)?new Set(asset873Numbers(a)):null,out=[],seen=new Set();")
s=rep(s,"let nums=invItemNums(a,l.item).concat(subOf(a.key)","let nums=(asset873Allocated(a,l.item).length?asset873Allocated(a,l.item):invItemNums(a,l.item)).concat(subOf(a.key)")
s=rep(s,"Array.isArray(a._bookingNumbers801) ? 'Booked asset' : 'Asset no.'", "'Asset no.'")
s=rep(s,'const shown = [...new Set(nums.concat(onHire))];','const shown = asset873Numbers(a);')
pos=s.index('</script>',s.index('const DATA ='));s=s[:pos]+Path(__file__).with_name('asset873_src.js').read_text()+'\n'+s[pos:]
s=rep(s,' · v8.72',' · v8.73');p.write_text(s)
