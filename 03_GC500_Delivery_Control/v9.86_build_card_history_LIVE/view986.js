/* Author: Andrew Fisher. Compact daily work readings; supporting evidence stays folded. */
(function(root){'use strict';
const e=value=>esc(String(value??''));
function card(work){
 if(!work)return '';
 const rows=work.rows||[],shown=rows.slice(0,3);
 return '<span class="bc986-work"><span class="bc984-label bc986-work-heading">'+e(work.heading)+'</span>'+
 (shown.length?shown.map(row=>'<span class="bc986-work-row"><span class="bc986-work-label">'+e(row.label)+'</span><span class="bc986-work-value">'+e(row.value)+'</span></span>').join(''):'<span class="bc986-work-empty">'+(work.heading==='WORK RECORDED'?'No work recorded':'Nothing scheduled')+'</span>')+
 (rows.length>shown.length?'<span class="bc986-work-more">+'+(rows.length-shown.length)+' more · More info</span>':'')+'</span>';
}
function details(work){
 if(!work)return '';
 const rows=work.rows||[],details=work.details||[];
 return '<section class="bc986-work-details"><b>'+e(work.heading)+'</b>'+
 (rows.length?'<dl>'+rows.map(row=>'<div><dt>'+e(row.label)+'</dt><dd>'+e(row.value)+'</dd></div>').join('')+'</dl>':'<p>'+(work.heading==='WORK RECORDED'?'No work recorded':'Nothing scheduled')+'</p>')+
 (details.length?'<ul>'+details.map(row=>'<li><span>'+e(row.label)+'</span>'+(row.refs?.length?' <span class="bc986-work-refs">'+row.refs.map(e).join(', ')+'</span>':'')+(row.source?' <small>'+e(row.source)+'</small>':'')+'</li>').join('')+'</ul>':'')+
 ((work.issues||[]).length?'<p>'+work.issues.map(e).join(' ')+'</p>':'')+'</section>';
}
root.BuildWorkView986={card,details};
})(window);
