/* Author: Andrew Fisher. Read-only Pricing source provenance.
   Native source_row links identify aliases; quantities and names never do. */
function pricingAliases834(assets){
 const list=(assets||[]).filter(a=>a&&!a._cancelled), byKey=new Map(list.map(a=>[a.key,a]));
 return list.filter(a=>typeof a.source_row==='string'&&a.source_row!==a.key&&byKey.has(a.source_row))
   .map(a=>({ref:a.key,source:a.source_row}));
}
function pricingAliasNotice834(assets){
 const n=pricingAliases834(assets).length;
 return n?`<p class="maphint" data-pricing-alias-basis><b>Schedule comparison — allocation review needed.</b> ${n} source-linked alias record${n===1?' is':'s are'} still included in these comparison quantities and card subtotals. This is not a reconciled unique-equipment total. The affected item rows name their source links; customer contract Revenue is calculated separately.</p>`:'';
}
function pricingAliasRows834(assets){
 const keys=new Set((assets||[]).map(a=>a.key));
 // A grouped item may not contain its canonical source, so resolve the source
 // link against the current register and only display aliases in this group.
 const aliases=pricingAliases834(allAssets()).filter(a=>keys.has(a.ref));
 return aliases.length?`<div class="w" data-pricing-alias-row><span class="chip cand">Source-linked alias</span> ${aliases.map(a=>esc(a.ref)+' → '+esc(a.source)).join(' · ')}; included in this schedule comparison pending allocation review.</div>`:'';
}
function pricingAliasCostNote834(){
 const n=pricingAliases834(allAssets()).length;
 return n?` Includes ${n} source-linked alias record${n===1?'':'s'}; the comparison still needs allocation reconciliation (see Pricing).`:'';
}
