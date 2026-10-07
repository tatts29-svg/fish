// Author: Andrew Fisher. v8.89 master D001 issued 2 Oct: sheet, register, pins, directions and pictures; no live writes.
// MEDIA889 = folder holding the new pictures (made by make_master889.py); they are served locally until they are uploaded.
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
const C=JSON.parse(fs.readFileSync(path.join(__dirname,'..','changes889.json'),'utf8'));
(async()=>{let s;try{const mob=!!process.env.MOB;s=await open({pageFile:process.env.PAGE,W:mob?390:1600,H:mob?844:1000,mobile:mob,dpr:mob?2:1});const p=s.page,R=[];const ok=(n,v)=>R.push({name:n,pass:!!v});
const dir=process.env.MEDIA889;let served=0;
if(dir)for(const m of C.media){const f=path.join(dir,m.file);if(fs.existsSync(f))await p.route('**/m/Coates-GC500-2026/'+m.file,r=>{served++;r.fulfill({status:200,contentType:m.type,body:fs.readFileSync(f)});});}
await p.waitForFunction(()=>SYNC.status==='live'&&typeof masterUnit==='function');await p.waitForTimeout(400);
const X=await p.evaluate(async C=>{const out={};const d1=DATA.sheets.find(x=>x.key==='D001'),ms=DATA.sheets.find(x=>x.key==='MASTER');
 out.sheet=JSON.stringify(d1.src).includes(C.sheet_media.sha256)&&/issued 2 Oct/.test(d1.subtitle); // the page resolves {media} to its address at load
 out.mediaUrl=String(DATA.media[C.sheet_media.sha256]||'');
 out.oldGone=!('d0df399ee0f4adb179772cddaec164db1be0c026aac10473883d1211a5afc567' in DATA.media);
 const reg=[];(function walk(o){if(o&&typeof o==='object'){if(o.id==='D001-26003-03-MASTER.pdf'&&o.kind==='map')reg.push(o);Object.values(o).forEach(walk);}})(DATA);
 out.register=reg.length===1&&reg[0].sha256===C.pdf_sha256&&reg[0].bytes===C.pdf_bytes&&reg[0].replaces&&reg[0].replaces.sha256===C.old_master_sha256;
 const want=C.master_loc;out.pins=Object.keys(want).map(k=>{const m=MASTER_LOC[k];return {k,same:!!m&&JSON.stringify(m.pt)===JSON.stringify(want[k].pt)&&JSON.stringify(m.ll)===JSON.stringify(want[k].ll)};});
 const p45=masterFixFor('P45');out.p45Fix=!!p45&&p45.lat===want.P45.ll[0]&&p45.lon===want.P45.ll[1];
 out.p45Drive=String(dayPinCell(assetOf('P45'))||'').includes(String(want.P45.ll[0]));
 out.wc10=!!masterUnit('WC10')&&ms.markers.some(x=>x.label==='WC10')&&!!MASTER_LOC.WC10.sec;
 out.wc32=!!masterUnit('WC32')&&/not drawn on the 2 Oct issue/.test(MASTER_LOC.WC32.how);
 out.single=!MASTER_LOC.WC69.pts&&!MASTER_LOC.WC40.pts;
 out.inset=[['CP1',0.91719],['WC81',0.91736],['T0265',0.90381]].every(([k,fx])=>Math.abs(MASTER_LOC[k].pt[0]-fx)<0.00002);
 const load=src=>new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth,im.naturalHeight]);im.onerror=()=>res(null);im.src=src;});
 out.sheetPx=await load(DATA.media[C.sheet_media.sha256]);out.thumbPx=await load(DATA.media[want.P45.img[0]]);
 out.thumbsKnown=Object.values(want).every(v=>(v.img||[]).every(sha=>typeof DATA.media[sha]==='string'));
 return out;},C);
ok('D001 sheet is the 2 Oct issue',X.sheet&&/\/m\/Coates-GC500-2026\//.test(X.mediaUrl));
ok('old sheet picture leaves the media list',X.oldGone);
ok('drawing register shows the 2 Oct issue and what it replaces',X.register);
ok('every changed pin carries the 2 Oct position',X.pins.every(x=>x.same));
ok('P45 navigation pin unchanged (Andrew 8 Oct: all navigation pin points are correct)',X.p45Fix);
ok('P45 drive and walk links still go to its confirmed pin',X.p45Drive);
ok('WC10 has a master position, a sector and a pin on the master sheet',X.wc10);
ok('WC32 keeps its pin, noted as not on the 2 Oct issue',X.wc32);
ok('WC69 and WC40 carry one tag each',X.single);
ok('inset pins follow the inset (28 px on the picture)',X.inset);
ok('every new picture is named in the media list',X.thumbsKnown);
if(dir){ok('new sheet picture loads at 2600 x 1837',X.sheetPx&&X.sheetPx[0]===2600&&X.sheetPx[1]===1837);ok('new P45 close-up loads',X.thumbPx&&X.thumbPx[0]===771);}
await p.evaluate(()=>go('map'));await p.waitForTimeout(1500);
ok('Map tab opens with the new master',await p.evaluate(()=>state.tab==='map'));
ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);
R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));if(R.some(r=>!r.pass))console.log(JSON.stringify(X.pins.filter(x=>!x.same)));console.log((mob?'phone':'desktop')+': '+R.filter(r=>r.pass).length+'/'+R.length+(dir?' (media served locally: '+served+')':''));if(R.some(r=>!r.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
