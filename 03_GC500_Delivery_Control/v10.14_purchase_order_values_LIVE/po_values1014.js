/* Author: Andrew Fisher. P/O labels read the current shared order; no copied amounts or ledger changes. */
function poLabel1014(number) {
 const key = String(number == null ? '' : number), order = poOf(key), raw = order && order.amount;
 const known = (typeof raw === 'number' || typeof raw === 'string') && String(raw).trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0;
 return esc(key) + (known ? ' · ' + esc(money(Number(raw))) : '');
}
