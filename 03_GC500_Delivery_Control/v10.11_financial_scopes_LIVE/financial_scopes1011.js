/* Author: Andrew Fisher. One synchronous asset/identity scope per financial read.
 * The existing holdAssets owns freshness and finally cleanup. There is no new
 * persistent cache, state mutation, rate calculation or source allocation here.
 */
(function (root) {
 'use strict';
 const entries = [
  'fh866Model', 'branchFinancial978', 'acc761Model', 'moneySummary',
  'pl770Model', 'cj764Model', 'rh766Model', 'pl752Rows',
  'contractFigures', 'contractRowsByBranch', 'branchRollup',
  'contractReferenceBranches1010', 'currentFwfOwners1010',
  'generatorBranch1004', 'finance928ContractOwner'
 ];
 function scoped(read, hold) {
  return function () {
   const receiver = this, args = arguments;
   return hold(() => Reflect.apply(read, receiver, args));
  };
 }
 function install(target, hold) {
  // Validate before replacing anything, so a changed base cannot half-install.
  if (typeof hold !== 'function') throw new Error('Financial scopes require holdAssets');
  for (const name of entries) if (typeof target[name] !== 'function') throw new Error('Financial scope entry missing: ' + name);
  for (const name of entries) target[name] = scoped(target[name], hold);
 }
 const api = Object.freeze({entries: Object.freeze(entries), scoped, install});
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 if (root) {
  if (root.FinancialScopes1011) throw new Error('Financial scopes already installed');
  install(root, holdAssets);
  root.FinancialScopes1011 = api;
 }
})(typeof window !== 'undefined' ? window : null);
