/* Author: Andrew Fisher. QR coordinates must round-trip to the actual plotted map point. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.env.BASE,'utf8'),core=html.slice(html.indexOf('function areaCore1206(){'),html.indexOf("if(typeof module!=='undefined')module.exports=areaCore1206;")),target=fs.readFileSync(path.join(__dirname,'../pickup1213_map.js'),'utf8').split(' async function pickupPicture1213')[0],context={};vm.createContext(context);vm.runInContext(core+'\n'+target,context);const C=context.areaCore1206();let count=0;
function check(name,ok){assert(ok,name);console.log('PASS '+name);count++;}
for(const centre of [{lat:-28,lon:153.43},{lat:-27.98,lon:153.42},{lat:0,lon:0},{lat:60,lon:179.99}]){const F=C.frame(centre),point=[17,-21],r=context.pickupTarget1213({F},{code:'EXAMPLE',points:[point]}),actual=F.local(C.merc(r.ll));check('navigation round-trip at latitude '+centre.lat,Math.hypot(actual[0]-point[0],actual[1]-point[1])<.00001);}
const F=C.frame({lat:-28,lon:153.43}),r=context.pickupTarget1213({F},{code:'EXAMPLE',points:[[20,20],[4,-7],[-18,0]]});check('multiple occurrences use a real nearby point, never their centroid',r.point[0]===4&&r.point[1]===-7&&r.basis.includes('Nearest mapped occurrence'));
const none=context.pickupTarget1213({F},{code:'EXAMPLE',points:[]});check('unplotted footprint explicitly falls back to the selected spot',Math.abs(none.ll.lat+28)<1e-8&&Math.abs(none.ll.lon-153.43)<1e-8&&none.basis.includes('selected spot'));
const valid=context.pickupTarget1213({F},{code:'EXAMPLE',points:[[NaN,5],[10,12]]});check('invalid coordinates cannot become a QR destination',valid.point[0]===10&&valid.point[1]===12);
console.log(count+'/'+count);
