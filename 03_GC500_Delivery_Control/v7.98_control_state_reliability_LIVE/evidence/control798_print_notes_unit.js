// Author: Andrew Fisher. Exact-source print-note checks; no network or record writes.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const source=fs.readFileSync(process.env.PAGE,'utf8'),results=[];
const take=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);assert(i>=0&&j>i,a);return source.slice(i,j);};
const notes={P08:'Keep clear of light poles.\nSite must guide the driver.',P46:'Keep clear of light poles.\r\nSite must guide the driver.',P47:'<img src=x onerror=alert(1)> & "quote"',P51:'   ',OTHER:'Unrelated load'};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context=vm.createContext({deliveryOf:key=>({note:notes[key]}),esc});
vm.runInContext(take('function dpDeliveryNotes798(g){','function precisionTags(a){'),context);
const group=(keys,kind='deliveries')=>({kind,rows:keys.map(key=>({a:{key}}))});
function check(name,fn){fn();results.push({name,pass:true});}
check('only notes belonging to this load are included',()=>{const h=context.dpDeliveryNotes798(group(['P08']));assert(h.includes('P08'));assert(h.includes('Keep clear'));assert(!h.includes('Unrelated'));assert(!h.includes('P46'));});
check('line endings normalise and line breaks remain',()=>{const h=context.dpDeliveryNotes798(group(['P08','P46']));assert(h.includes('P08, P46'));assert(h.includes('poles.<br>Site'));assert.strictEqual((h.match(/Keep clear/g)||[]).length,1);});
check('repeated reference rows are listed once',()=>{const h=context.dpDeliveryNotes798(group(['P08','P08']));assert.strictEqual((h.match(/P08/g)||[]).length,1);});
check('independent notes retain their own references',()=>{const h=context.dpDeliveryNotes798(group(['P08','P47']));assert.strictEqual((h.match(/<label>Delivery note<\/label>/g)||[]).length,2);assert(h.includes('P47'));});
check('note and reference HTML is escaped',()=>{notes['<ref>']='Safe & sound';const h=context.dpDeliveryNotes798(group(['P47','<ref>']));assert(!h.includes('<img'));assert(h.includes('&lt;img'));assert(h.includes('&quot;quote&quot;'));assert(h.includes('&lt;ref&gt;'));assert(h.includes('Safe &amp; sound'));});
check('empty or unavailable notes add no print markup',()=>{assert.strictEqual(context.dpDeliveryNotes798(group(['P51','MISSING'])), '');assert.strictEqual(context.dpDeliveryNotes798({kind:'deliveries',rows:[null,{}]}),'');});
check('removal sheets never reuse earlier delivery instructions',()=>assert.strictEqual(context.dpDeliveryNotes798(group(['P08'],'removals')),''));
check('long text is never truncated',()=>{notes.LONG='Instruction '.repeat(1200)+'FINAL END';assert(context.dpDeliveryNotes798(group(['LONG'])).includes('FINAL END'));});
Object.assign(context,{dpPos:()=>({}),dpSec:(h,b)=>'<section><h2>'+h+'</h2>'+b+'</section>',dpTruck:()=>'<truck/>',dpWhere:()=>'<location/>',dpPics:()=>'<photo/>',dpWork:()=>'<work/>',dpRulesLine:()=>'<rules/>',dpSafe:()=>'<safety/>',dpDocsHtml:()=>'<docs/>',dpContacts:()=>'<contacts/>',dpHeader:()=>'<header/>',dpHero:()=>'<hero/>',dpFoot:()=>'<footer/>'});
vm.runInContext(take('function dpPage(d, g, doc, i, n){','/* ---------- cutting the pictures'),context);
for(const doc of ['drv','ins'])check(doc+' uses recorded note in existing location section and preserves sheet parts',()=>{const h=context.dpPage({},group(['P08']),doc,1,3);assert(h.includes('data-load="1"'));assert(h.includes('<location/><div class="dp-lines dp-delivery798">'));assert(h.includes('Keep clear'));for(const part of ['truck','location','photo','safety','docs','contacts','header','hero','footer'])assert(h.includes('<'+part+'/>'));assert(h.includes('<work/>')===(doc==='ins'));});
console.log(JSON.stringify({author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(source).digest('hex'),passed:results.length,results},null,2));
