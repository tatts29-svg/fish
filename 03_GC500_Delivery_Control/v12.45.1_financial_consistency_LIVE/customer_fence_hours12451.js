/* Author: Andrew Fisher. Approved customer fencing hours use the documented crew total. */
(function(root){
'use strict';
function project(row, recorded, product){
  if(!row || row.key!=='fence')return row;
  const {customer_hours_review12451,...original}=row;
  const source={...original,
    scope_hours12451:row.scope_hours12451 ?? row.hours,
    scope_amount12451:row.scope_amount12451 ?? row.amount,
    scope_amount_exact12451:row.scope_amount_exact12451 ?? row.amount_exact
  };
  const review=message=>({...source,hours:null,amount_exact:null,amount:null,
    customer_hours12451:false,customer_hours_review12451:message});
  const customer=recorded?.customer;
  if(customer?.complete!==true || !Number.isFinite(customer.hours) || customer.hours<=0)
    return review('Documented customer fencing hours are incomplete or need review. The unconfirmed charge is excluded from the known subtotal.');
  if(!Number.isFinite(row.rate) || row.rate<0 || typeof product!=='function')
    return review('The customer fencing rate needs review. The unconfirmed charge is excluded from the known subtotal.');
  const amount=product(customer.hours,row.rate);
  if(!Number.isFinite(amount) || amount<0)return review('The customer fencing amount needs review.');
  return {...source,hours:customer.hours,amount_exact:amount,amount,customer_hours12451:true};
}
const api=Object.freeze({project});
root.CustomerFenceHours12451=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
