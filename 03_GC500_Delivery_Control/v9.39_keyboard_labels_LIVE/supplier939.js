/* Author: Andrew Fisher. Display supplier names without exposing stored identity slugs. */
function supplierLabel939(owner){
 if(root.Units925&&typeof root.Units925.company==='function')return root.Units925.company(owner);
 const key=txt(owner);
 const known={'coates':'Coates','event-portables':'Event Portables','prem-air-hire':'PremAir Hire','unknown':'Supplier to confirm'};
 return known[key]||key.replace(/^other:/,'').split('-').filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
}
