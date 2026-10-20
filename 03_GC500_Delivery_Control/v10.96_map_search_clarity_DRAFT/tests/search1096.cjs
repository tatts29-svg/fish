/* Author: Andrew Fisher. Search behaviour for real-world identifier and description formats. */
const assert=require('assert/strict'),S=require('../search1096');
const rows=[
 {code:'P45',description:'St John First Aid',category:'Portable buildings',identifiers:['1234567'],location:'Pit lane'},
 {code:'GN10',description:'Generator 20 kVA',category:'Generators',identifiers:['762451'],location:'Northern gate'},
 {code:'VMS 3a',description:'Variable message sign',identifiers:['1876345','123-ABC'],location:'Gold Coast Highway'},
 {code:'WC09',description:'Toilet block accessible',category:'Toilets & amenities',identifiers:[],location:'Macintosh Island'},
 {code:'P450',description:'Another building',identifiers:['9991234567']}
].map(S.prepare);
let checks=0;
for(const [q,code] of [['p-45','P45'],['P 45','P45'],['reference P45','P45'],['asset no 1234567','P45'],['1 234 567','P45'],['rego 123 abc','VMS 3a'],['VMS3A','VMS 3a'],['20 kva generator','GN10'],['building pit lane','P45'],['accessible toilet macintosh','WC09'],['message highway','VMS 3a']]){
 assert.equal(S.query(rows,q)[0]?.code,code,q);checks++;
}
assert.equal(S.query(rows,'1234568').length,0,'Wrong number is never silently fuzzy-matched');checks++;
assert.equal(S.query(rows,'<script>alert(1)</script>').length,0);checks++;
assert.equal(S.query(rows,'').length,0);checks++;
assert.equal(S.query(rows,'P45')[0].code,'P45','Exact reference precedes prefix');checks++;
console.log(JSON.stringify({pass:true,checks}));
