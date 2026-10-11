// Author: Andrew Fisher. Empty-work days still count as today; programme bounds remain truthful.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const events={},root={addEventListener(type,callback){events[type]=callback;}},context={window:root,document:{querySelector(){return null;}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'weather1002.js'),'utf8'),context);
const nearest=root.WeatherStrip1002.nearest,checks=[];const check=(name,result,expected)=>{assert.equal(result,expected,name);checks.push(name);};
const days=[{iso:'2026-10-12',empty:false},{iso:'2026-10-11',empty:true},{iso:'2026-10-10',empty:false}],before=JSON.stringify(days);
check('Sunday with no loads remains today',nearest(days,'2026-10-11'),'2026-10-11');
check('Before programme uses its first real date',nearest(days,'2026-10-01'),'2026-10-10');
check('After programme uses its last real date',nearest(days,'2026-11-01'),'2026-10-12');
check('A gap chooses the closer real working day',nearest(['2026-10-30','2026-11-02'],'2026-11-01'),'2026-11-02');
check('Equal-distance gap chooses upcoming working day',nearest(['2026-10-28','2026-10-30'],'2026-10-29'),'2026-10-30');
check('No dates do not invent today',nearest([],'2026-10-11'),null);
check('Source dates and ordering remain unchanged',JSON.stringify(days),before);
assert.doesNotThrow(()=>events.resize());checks.push('Head-script resize before application state is safe');
assert.doesNotThrow(()=>events.pageshow());checks.push('Head-script pageshow before application state is safe');
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:checks.length,names:checks}));
