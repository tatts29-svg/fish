/* Author: Andrew Fisher. A saved availability message follows the exact attempted document. */
(function(root){
 'use strict';
 function status(attempt, env){
  if(!attempt)return {state:'none',text:''};
  if(attempt.error)return {state:'error',text:attempt.error};
  if(attempt.dirty)return {state:'dirty',text:'Unsaved changes'};
  if(attempt.kept===false)return {state:'error',text:'Not saved · keep this page open'};
  if(attempt.kept!==true)return {state:'pending',text:'Saving availability…'};
  if(!attempt.expected||env.current!==attempt.expected)return {state:'changed',text:'Availability changed · review the current record'};
  const shared=env.on&&env.last===attempt.expected&&!env.inflight&&!env.queued;
  if(shared)return {state:'shared',text:env.connection==='live'?'SAVED · shared record updated':'SAVED · shared record confirmed; connection unavailable'};
  if(env.readonly)return {state:'offline',text:'Saved on this device · shared record is view only'};
  if(env.connection==='revoked'||env.connection==='unreachable')return {state:'offline',text:'Saved on this device · shared record unavailable'};
  if(!env.on||env.connection!=='live')return {state:'offline',text:'Saved on this device · waiting to sync'};
  return {state:'pending',text:'Saved on this device · syncing…'};
 }
 const api={status};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.StaffSave1008=api;
})(typeof window!=='undefined'?window:globalThis);
