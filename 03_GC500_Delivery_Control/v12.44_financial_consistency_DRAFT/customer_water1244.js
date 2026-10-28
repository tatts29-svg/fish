/* Author: Andrew Fisher. Customer water is included in pump-outs; supplier costs remain separate. */
(function(root){
'use strict';
const keys = new Set(['service|Water Truck','service|Water Truck - Pre fill','service|Water delivery','service|3000 Ltr Free Drinking Water Tank']);
function project(service){
 if(!service || !Array.isArray(service.lines) || !Array.isArray(service.at_cost)) return service;
 const included = new Set(service.at_cost.filter(line=>line && keys.has(line.key)).map(line=>line.key));
 if(!included.size) return service;
 const line = value => !value || !included.has(value.key) ? value : Object.assign({},value,{
  included1244:true,source_amount1244:value.included1244?value.source_amount1244:value.amount,
  source_rate1244:value.included1244?value.source_rate1244:value.rate,
  source_from1244:value.included1244?value.source_from1244:value.from,
  amount:0,rate:0,from:'included',typed_under:null
 });
 const lines=service.lines.map(line),at_cost=service.at_cost.map(line),cents=v=>Math.round(v*100)/100;
 const out=Object.assign({},service,{lines,at_cost,total:cents(lines.reduce((sum,x)=>sum+x.amount,0)),
  at_cost_total:cents(at_cost.reduce((sum,x)=>sum+x.amount,0))});
 if(Array.isArray(service.under))out.under=service.under.filter(value=>!included.has(value.key));
 return out;
}
function description(line,format=String){
 if(!line)return '';
 if(!line.baseplan12416||!line.card_line||typeof line.qty!=='number'||!Number.isFinite(line.qty)||typeof line.qty_site12416!=='number'||!Number.isFinite(line.qty_site12416))return line.description||'';
 return line.card_line+' · customer charge: '+format(line.qty)+' services (Baseplan); site record: '+format(line.qty_site12416)+' services';
}
const api={project,description};root.CustomerWater1244=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
