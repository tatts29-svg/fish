/* Author: Andrew Fisher. iEDM infrastructure programme, 15 Oct 2026 issue: documentary evidence only. No completion, date, quantity or position is imported; current site records remain authoritative. */
(function(){
 if(typeof infrastructure951Html!=='function')return;
 const prior=infrastructure951Html;
 function review1021(){return (typeof DATA!=='undefined'&&DATA.infrastructure_review1021)||{rows:[]};}
 function row1021(key){return (review1021().rows||[]).find(r=>r.reference===key)||null;}
 // The drawer already folds the 9 Oct programme evidence under the same attribute; this adds the 15 Oct issue
 // beneath it for the three references it marks, and leaves every other drawer exactly as it was.
 infrastructure951Html=function(key){
  const base=prior(key);
  const r=row1021(key);
  if(!r)return base;
  const where=esc(r.sourceSheet)+' sheet only; the Base information sheet and the other copies are unchanged';
  return base+'<details class="inst" data-infrastructure951><summary>Infrastructure workbook evidence · '+esc(key)+' · 15 Oct 2026 issue</summary><p>'+esc(r.facility)+'</p><ul><li><strong>Source status:</strong> Not stated → '+esc(r.statusAsWritten)+' ('+where+')</li><li><strong>Source completion date:</strong> Not stated</li></ul><p>Source status only; current site records remain authoritative. Reviewed 15 Oct 2026 · '+esc(r.sourceSheet)+' · cell '+esc(r.cell)+'.</p></details>';
 };
})();
