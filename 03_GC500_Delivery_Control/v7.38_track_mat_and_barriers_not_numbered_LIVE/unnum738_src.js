/* v7.38 - TRACK MAT AND WATER-FILLED BARRIERS CARRY NO ASSET NUMBERS (see patch_v738.py). Andrew Fisher, 29 Sep 2026:
   "Also track mats and water barriers don't have asset numbers."
   They are counted by quantity - metres of barrier, sheets of mat - never by a number on each piece. The walk-around and
   Questions already left them out; the inventory still counted every one as "no number yet" (Trakmat 20, TL2 76), and
   the Change form, the day list, the drawer and the driver and install sheets still asked for one. They now say "not
   numbered" and ask for nothing. A number already recorded against one is still shown. */
const UNNUMBERED_RX = /water-filled|ground protection|track ?mat|trakmat/i;
function unnumbered(a){ return !!a && (UNNUMBERED_RX.test(a.discipline || '') || UNNUMBERED_RX.test(a.product || '') || chargeLines(a).some(l => UNNUMBERED_RX.test(l.item || ''))); }
