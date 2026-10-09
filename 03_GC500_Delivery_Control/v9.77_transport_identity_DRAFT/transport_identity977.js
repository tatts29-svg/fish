/* Author: Andrew Fisher. Use the reviewed current P36 identity; retain historical source numbers. */
(function(W){'use strict';
function numbers(asset,model,original){
 const raw=[...new Set((original||[]).map(String))];
 if(!asset||asset.key!=='P36'||!model||!Array.isArray(model.rows))return raw;
 const current=model.rows.filter(u=>u.physical&&u.item==='Building 6m'&&u.assetNo),history=model.rows.filter(u=>u.source==='history'&&u.physical===false&&u.item==='Building 6m'&&u.assetNo);
 if(current.length!==1||current[0].assetNo!=='1282487'||!history.some(u=>u.assetNo==='1327222')||!raw.includes('1282487')||!raw.includes('1327222'))return raw;
 return ['1282487'];
}
const api={numbers};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(W)W.TransportIdentity977=api;
})(typeof window!=='undefined'?window:null);
function transportBuildingNumbers977(a){const raw=[...new Set((a.asset_numbers||[]).map(String))];return typeof TransportIdentity977!=='undefined'&&typeof gcModel925==='function'?TransportIdentity977.numbers(a,gcModel925(a),raw):raw;}
