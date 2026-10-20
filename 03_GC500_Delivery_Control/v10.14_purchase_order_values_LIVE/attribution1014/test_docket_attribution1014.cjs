/* Author: Andrew Fisher. Exact record guards and capped programme credit. */
'use strict';
const assert=require('assert'),{catalogue}=require('./docket_attribution1014.js'),clone=v=>JSON.parse(JSON.stringify(v));
const reviewed={record_id:'F-test',docket_no:'test',expected:{id:'F-test',docket_no:'test',date:'2026-10-09',week:'Week 2',programme_sheet:'CON WK2',location:'Existing location',quantities:{clean:132.5},components:{mesh_panel:53,base:53,clamp:53},note:'Source note unchanged',source:'Signed source'},attribution:{from_week:'Week 2',to_week:'Week 1',target_id:'same-task',actual:{clean:132.5},allowance:{clean:135,v_gates:1},credit:{clean:132.5}}};
const current={schema:1,rows:[clone(reviewed),{record_id:'other',docket_no:'other'}]},before=clone(current),original={...clone(reviewed.expected),usable:true,scope:'programme'},corrected={...clone(original),quantities:{clean:137.5},components:{mesh_panel:55,base:53,clamp:53}};
let checks=0;const check=(name,fn)=>{fn();checks++;};
check('old record is unchanged',()=>assert.strictEqual(catalogue([original],current,reviewed),current));
check('exact correction keeps task and capped credit',()=>{const out=catalogue([corrected],current,reviewed),row=out.rows[0];assert.equal(row.attribution.target_id,'same-task');assert.deepEqual(row.attribution.actual,{clean:137.5});assert.deepEqual(row.attribution.credit,{clean:135});assert.equal(row.expected.components.base,53);assert.equal(row.expected.components.clamp,53);assert.equal(row.attribution.allowance.v_gates,1);assert.strictEqual(out.rows[1],current.rows[1]);});
check('catalogue input not mutated',()=>assert.deepEqual(current,before));
for(const [field,value]of [['date','2026-10-10'],['week','Week 3'],['programme_sheet','CON WK3'],['location','Different'],['note','Different'],['source','Different'],['id','Other'],['docket_no','Other'],['quantities',{clean:140}],['components',{mesh_panel:55,base:55,clamp:53}]] )check('reject changed '+field,()=>assert.strictEqual(catalogue([{...corrected,[field]:value}],current,reviewed),current));
check('duplicate record rejected',()=>assert.strictEqual(catalogue([corrected,clone(corrected)],current,reviewed),current));
check('duplicate catalogue row rejected',()=>{const c={...current,rows:[...current.rows,clone(reviewed)]};assert.strictEqual(catalogue([corrected],c,reviewed),c);});
check('changed allowance rejected',()=>{const c=clone(current);c.rows[0].attribution.allowance.clean=140;assert.strictEqual(catalogue([corrected],c,reviewed),c);});
check('changed task rejected',()=>{const c=clone(current);c.rows[0].attribution.target_id='other-task';assert.strictEqual(catalogue([corrected],c,reviewed),c);});
check('other docket unchanged',()=>assert.strictEqual(catalogue([{...corrected,id:'other',docket_no:'other'}],current,reviewed),current));
console.log(JSON.stringify({pass:true,checks}));
