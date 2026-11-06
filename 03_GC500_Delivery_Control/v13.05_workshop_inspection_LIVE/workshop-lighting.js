/* Author: Andrew Fisher.
 * A bounded inspection fill using the existing workshop lights. No new lights,
 * shadows, exposure changes, materials, texture work or animation clock.
 */
const ROLES = ['key', 'fill', 'rim'];
const GAINS = Object.freeze({key: .94, fill: 1.25, rim: 1.03});
const validIntensity = value => Number.isFinite(value) && value >= 0;
const smooth = t => t * t * (3 - 2 * t);

export function installWorkshopLighting({lights, reducedMotion = false, onChange = () => {}, duration = .35} = {}) {
  if (!lights || ROLES.some(role => !validIntensity(lights[role]?.intensity))) {
    throw new Error('Inspection lighting requires the three existing finite key, fill and rim lights.');
  }
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Inspection light duration must be positive.');
  if (typeof onChange !== 'function') throw new Error('Inspection lighting needs a change callback.');
  const channels = ROLES.map(role => ({role, light: lights[role], gain: GAINS[role], base: 0, written: 0}));
  let owned = false, disposed = false, amount = 0, target = 0, from = 0, elapsed = 0;
  const reduced = () => typeof reducedMotion === 'function' ? !!reducedMotion() : !!reducedMotion;

  function capture() {
    for (const channel of channels) {
      // A later host quality/tuning write is authoritative. Do not take an old
      // snapshot on construction: the host may finish its lighting setup later.
      if (!validIntensity(channel.light.intensity)) return false;
    }
    for (const channel of channels) channel.base = channel.written = channel.light.intensity;
    owned = true; return true;
  }
  function observeExternal() {
    for (const channel of channels) {
      const current = channel.light.intensity;
      if (current !== channel.written && validIntensity(current)) {
        channel.base = current; channel.written = current;
      }
    }
  }
  function paint(value) {
    let changed = false;
    for (const channel of channels) {
      const next = value === 0 ? channel.base : channel.base * (1 + (channel.gain - 1) * value);
      if (channel.light.intensity !== next) {
        channel.light.intensity = next; changed = true;
      }
      channel.written = next;
    }
    if (changed) onChange();
    return changed;
  }
  function restore() {
    if (!owned) return false;
    observeExternal();
    const changed = paint(0);
    owned = false; amount = target = from = elapsed = 0;
    return changed;
  }
  function update(dt, {active = false, inspection = false} = {}) {
    if (disposed) return false;
    if (!active) return restore();
    const nextTarget = inspection ? 1 : 0;
    if (!owned) {
      if (!nextTarget || !capture()) return false;
      amount = target = from = elapsed = 0;
    }
    observeExternal();
    if (nextTarget !== target) { from = amount; target = nextTarget; elapsed = 0; }
    if (reduced()) amount = target;
    else if (amount !== target) {
      // Reuse the host's bounded seconds. A negative/non-finite step never
      // moves the preset; no extra RAF, timer or performance sampler is made.
      elapsed = Math.min(duration, elapsed + (Number.isFinite(dt) ? Math.max(0, dt) : 0));
      amount = elapsed >= duration ? target : from + (target - from) * smooth(elapsed / duration);
    }
    const changed = paint(amount);
    if (amount === 0 && target === 0) owned = false;
    return changed;
  }
  return {
    update, restore,
    dispose() { if (disposed) return; restore(); disposed = true; },
    get active() { return owned; },
    get transitioning() { return owned && amount !== target; },
    get diagnostics() {
      return {active: owned, transitioning: owned && amount !== target, amount, target, duration, disposed,
        intensityOnly: true, lightCount: channels.length, gains: {...GAINS},
        baseline: Object.fromEntries(channels.map(channel => [channel.role, channel.base]))};
    },
  };
}
