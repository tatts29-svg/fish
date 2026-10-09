/* Author: Andrew Fisher. Docket classification source review, 9 October 2026.
 * The exact current record and the registered source hashes must still match.
 * This adds evidence only; the native v8.47 guard controls every confirmation.
 */
const FENCE_CCB_REVIEW957 = {
 sources: [
  {id:'36591.jpg',sha256:'e4c006b4c8ef3d9ee580ce7c25a2bb5f927c960cf03d8f73fe05a525af40fbd7',title:'Original fencing docket 36591'},
  {id:'36594.jpg',sha256:'21e4c6fef9a68ac9a76edb0b18f2eb976f318ab0c3d03f383403cbd84c1a5a9c',title:'Original fencing docket 36594'},
  {id:'GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx',sha256:'836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db',title:'Current 2026 Coates fencing programme reviewed 9 October'}
 ],
 rows: [
  {
   record_id:'F-AFV-0034',docket_no:'36591',
   expected:{date:'2026-10-09',location:'Club 500 Creek Protection',quantities:{ccb_event:105,flat_feet:42},components:{cc_barrier:42,base:19,flat_feet_ccb:19},
    note:'Standard CC barrier 105 m / 42 barriers. Flat feet CCB 42 m / 19 pieces and 19 bases as written; actual quantities preserved separately. Programme CON WK2 row 14 confirms Event category and flat-feet identity. Current card C53/C63 confirms flat-feet rate per metre, labour included; supplier flat-feet cost not supplied. Crossed-out Transport label is not a transport charge.'},
   source_ids:['36591.jpg','GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'],
   decision:{state:'confirmed',type:'ccb_event',method:'assessed',confidence:'high',
    basis:'Original docket 36591 names Club 500 Creek Protection and records 105 m / 42 standard CCBs. The matching current programme CON WK2!D14:E14 identifies this exact task; L14 is under the Event heading L5. Preserve actual 105 m rather than planned 87 m. N14/O14 separately identifies flat-feet CCB for the same task; the docket\'s 42 m / 19 flat-feet pieces remain separate. This confirms the standard CCB Event category from the exact task, not a surveyed position.'}
  },
  {
   record_id:'F-AFV-0037',docket_no:'36594',
   expected:{date:'2026-10-09',location:'Smoking Zones — The Hill / Club 500',quantities:{ccb_event:22.5},components:{cc_barrier:9},
    note:'CC barrier 22.5 m / 9 barriers: 6 at The Hill and 3 at Club 500. Event classification supported by programme CON WK3 smoking rows 10/22/27 and existing confirmed smoking agreement 36567. Actual quantities from this paper.'},
   source_ids:['36594.jpg','GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'],
   decision:{state:'confirmed',type:'ccb_event',method:'assessed',confidence:'high',
    basis:'Original docket 36594 records Smoking Zones at The Hill and Club 500, 22.5 m / 9 CCBs. The current programme classifies smoking-zone tasks as Event at CON WK3!E10/L10, E22/L22 and E27/L27, under header L5; the event-week smoking row EVENT WEEK!E11/M11 also uses Event under M5. This agrees with the established smoking-zone category. Preserve this docket\'s actual quantity and distinct locations; the classification assessment does not assign a surveyed point or copy a planned quantity.'}
  }
 ]
};
function installCcbReview957(data){
 const catalogue=data&&data.fence_ccb_review847;
 if(!catalogue||catalogue.schema!==1||!Array.isArray(catalogue.sources)||!Array.isArray(catalogue.rows))return;
 for(const source of FENCE_CCB_REVIEW957.sources)if(!catalogue.sources.some(s=>s&&s.id===source.id))catalogue.sources.push(source);
 for(const row of FENCE_CCB_REVIEW957.rows)if(!catalogue.rows.some(r=>r&&(r.record_id===row.record_id||r.docket_no===row.docket_no)))catalogue.rows.push(row);
}
installCcbReview957(DATA);
