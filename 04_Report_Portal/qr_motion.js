/* Local, decorative motion for the scoped readouts. The report supplies every value. */
(() => {
  "use strict";
  const reportBody = document.getElementById("report-body");
  if (!reportBody) return;
  const lookup = document.getElementById("lookup");
  const namespace = "http://www.w3.org/2000/svg";

  // The chart renderer already supplies each true bar height and top cap.
  // Add bubbles inside those bounds without altering its geometry or data.
  function decorateChart(figure) {
    for (const bar of figure.querySelectorAll("svg > g:not(.wet-column)")) {
      const rect = bar.querySelector("rect");
      const caps = bar.querySelectorAll("ellipse");
      if (!rect || caps.length !== 2) continue;
      const top = Number(caps[1].getAttribute("cy"));
      const bottom = Number(caps[0].getAttribute("cy"));
      const width = rect.width.baseVal.value;
      const travel = Math.min(23, bottom - top - 2);
      if (travel < 5 || width < 4) continue;
      const x = rect.x.baseVal.value;
      bar.classList.add("wet-column");
      bar.style.setProperty("--float", (-travel + 1).toFixed(2) + "px");
      [0.36,0.65].forEach((fraction, i) => {
        const group = document.createElementNS(namespace, "g");
        const bubble = document.createElementNS(namespace, "circle");
        const pop = document.createElementNS(namespace, "ellipse");
        group.setAttribute("class", "column-stream");
        group.setAttribute("transform", `translate(${x + width * fraction} ${top})`);
        bubble.setAttribute("class", "column-bubble");
        bubble.setAttribute("cy", travel);
        bubble.setAttribute("r", Math.min(i ? 1.05 : 1.45, width * .12, travel * .18));
        pop.setAttribute("class", "column-pop");
        pop.setAttribute("rx", Math.min(1.7, width * .15));
        pop.setAttribute("ry", ".6");
        group.append(bubble, pop);bar.append(group);
      });
    }
  }

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let observer;
  function watch(node) {
    if (!node) return;
    if (observer) observer.observe(node);
    else node.classList.add("motion-near");
  }
  function bind() {
    observer?.disconnect();
    document.querySelectorAll(".motion-near").forEach(node => node.classList.remove("motion-near"));
    const charts = reportBody.querySelectorAll(".movement-figure");
    charts.forEach(decorateChart);
    if (document.hidden || media.matches) return;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(changes => {
        changes.forEach(change => change.target.classList.toggle("motion-near", change.isIntersecting));
      }, {threshold:0});
    }
    watch(lookup);
    reportBody.querySelectorAll(".panel").forEach(watch);
    charts.forEach(watch);
    document.querySelectorAll(".direction-dials,.direction-pill").forEach(watch);
  }
  // A fresh lookup replaces the panels; disconnect references to the previous report.
  new MutationObserver(bind).observe(reportBody, {childList:true});
  document.addEventListener("mmg-instrument-mounted", event => {
    if (!document.hidden && !media.matches) watch(event.target);
  });
  document.addEventListener("visibilitychange", bind);
  if (media.addEventListener) media.addEventListener("change", bind);
  else media.addListener(bind);
  bind();
})();

/* The glass is decorative. Text carries the exact counts, scope and scale. */
(() => {
  "use strict";

  const ns = "http://www.w3.org/2000/svg";
  const format = new Intl.NumberFormat("en-AU");
  let instance = 0;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function measured(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function gradient(id, stops, vertical = false) {
    const direction = vertical ? 'x2="0%" y2="100%"' : 'x2="100%" y2="0%"';
    return '<linearGradient id="' + id + '" ' + direction + '>' +
      stops.map(([offset, color, opacity = 1]) =>
        '<stop offset="' + offset + '%" stop-color="' + color + '" stop-opacity="' + opacity + '"/>'
      ).join("") + '</linearGradient>';
  }

  function sightGlass(fraction, returned) {
    const id = 'direction-glass-' + (++instance) + '-';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 40 110');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('direction-tube');
    const mint = returned ? ['#214c3e','#62ad87','#a6e9bd','#d0fad5','#7dc79b','#396c54']
                          : ['#224c2a','#61a843','#b5ed72','#d9fb98','#8bd253','#3d722f'];
    const [deep, mid, light, rim, hue, shade] = mint;
    const paint = name => 'url(#' + id + name + ')';
    const wall = 'M3.15 9Q20 3.55 36.85 9V99.1C36.85 105.1 3.15 105.1 3.15 99.1Z';
    // The retaining rings sit outside this calibrated 80-unit chamber.
    const bottom = 96, span = 80;
    const depth = (fraction ?? 0) * span;
    const surface = bottom - depth;
    const curve = Math.min(2.1, depth / 2);
    const chamber = 'x="5.25" y="' + surface + '" width="29.5" height="' + depth + '"';
    let contents = '';
    if (depth > 0) {
      const streams = [[12,1.55,-.4],[22,1.15,-2.08],[28,.85,-2.88],[17,.6,-3.44]];
      const bubbles = depth < 7 ? '' : streams.slice(0, depth < 24 ? 2 : 4).map(([x,r,delay]) =>
        '<g style="--glass-lift:' + (3 + curve - depth) + 'px;--glass-phase:' + delay + 's">' +
          '<g class="direction-rising"><circle cx="' + x + '" cy="94.5" r="' + r + '" fill="' + mid +
          '" stroke="' + rim + '" stroke-width=".55"/><circle cx="' + (x-r*.3) + '" cy="' + (94.5-r*.3) +
          '" r="' + (r*.26) + '" fill="#f3ffdc"/></g></g>').join('');
      const pops = depth < 7 ? '' : streams.slice(0,2).map(([x,,delay]) =>
        '<ellipse class="direction-pop" cx="' + x + '" cy="' + (surface+curve) +
        '" rx="1.65" ry=".48" fill="none" stroke="#f4ffdf" stroke-width=".64" style="--glass-phase:' +
        delay + 's"/>').join('');
      contents = '<g class="direction-water" clip-path="' + paint('wetclip') + '">' +
        '<rect ' + chamber + ' fill="' + paint('liquid') + '"/><rect ' + chamber + ' fill="' + paint('depth') + '"/>' + bubbles +
        '<ellipse cx="20" cy="' + (surface+curve) + '" rx="14.75" ry="' + curve + '" fill="' + paint('meniscus') +
        '" stroke="' + rim + '" stroke-width=".6"/>' +
        '<path class="direction-glint" d="M10 ' + (surface+curve) + 'q4-1.5 8-.45t6 .35" stroke="#f2ffdc" fill="none" stroke-width=".7" stroke-linecap="round"/>' + pops + '</g>';
    } else if (fraction === null) {
      contents = '<rect x="5.25" y="16" width="29.5" height="80" fill="' + paint('unknown') + '"/>';
    }
    const ticks = Array.from({length:9}, (_,i)=>
      '<path d="M' + (i%2 ? 30.7 : 29.3) + ' ' + (bottom - i*span/8) + 'H32.9"/>').join('');
    svg.innerHTML = '<defs>' +
      gradient(id+'metal',[[0,'#21302a'],[7,'#576a5e'],[19,'#c0cbbd'],[29,'#788c78'],[48,'#3a4a3e'],[71,'#334239'],[85,'#839781'],[94,'#455446'],[100,'#243129']]) +
      gradient(id+'opening',[[0,'#15251d'],[22,'#899e89'],[46,'#4c6050'],[77,'#283b30'],[100,'#6f8474']],true) +
      gradient(id+'hollow',[[0,'#101c16'],[19,'#2c3830'],[49,'#18241c'],[78,'#142119'],[100,'#2a3b2c']]) +
      gradient(id+'wall',[[0,'#c2d9c7',.5],[7,'#adcab8',.13],[14,'#13231b',.48],[24,'#e9ffec',.14],[48,'#bed4c1',.04],[82,'#152219',.24],[94,'#b6cdbc',.18],[100,'#b4cebc',.42]]) +
      gradient(id+'liquid',[[0,deep],[5,shade],[11,mid],[24,light],[40,hue],[56,mid],[78,shade],[92,deep],[100,mid]]) +
      gradient(id+'depth',[[0,rim,.15],[33,light,.015],[76,deep,.05],[100,deep,.37]],true) +
      gradient(id+'meniscus',[[0,mid],[13,light],[39,rim],[70,light],[100,shade]]) +
      '<pattern id="' + id + 'unknown" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 8L8 0M7 9L9 7" stroke="#b1bdaf" stroke-width="1"/></pattern>' +
      '<clipPath id="' + id + 'wetclip"><rect ' + chamber + '/></clipPath></defs>' +
      '<ellipse cx="20" cy="106.2" rx="16.6" ry="2.3" fill="#071109" opacity=".45"/>' +
      '<path d="' + wall + '" fill="' + paint('hollow') + '" stroke="#92ac99" stroke-width=".68"/>' +
      contents + '<g stroke="#b5ccb6" stroke-opacity=".4" stroke-width=".56">' + ticks + '</g>' +
      '<path d="' + wall + '" fill="' + paint('wall') + '"/>' +
      '<path d="M5.1 15.1V95M33.7 14V96" fill="none" stroke="#dcf7e1" stroke-opacity=".45" stroke-width=".62"/>' +
      '<path d="M8.4 15.5V95" stroke="#e5ffdf" stroke-opacity=".36" stroke-width="1.23" stroke-linecap="round"/>' +
      '<path d="M2.6 96.8Q20 102 37.4 96.8V101.3C36.1 107.4 4.1 107.3 2.6 101.3Z" fill="' + paint('metal') + '" stroke="#788b78" stroke-width=".55"/>' +
      '<path d="M3 98.6Q20 104 37 98.6" fill="none" stroke="#243327" stroke-width=".8"/>' +
      '<path d="M3.5 100.4Q20 105.7 36.5 100.4" fill="none" stroke="#dbe5d1" stroke-opacity=".48" stroke-width=".55"/>' +
      '<path d="M2.4 6.6C2.4 .65 37.6 .65 37.6 6.6V10.9C36.7 16.5 3.3 16.5 2.4 10.9Z" fill="' + paint('metal') + '" stroke="#a0b29f" stroke-opacity=".73" stroke-width=".54"/>' +
      '<ellipse cx="20" cy="6.3" rx="17.45" ry="4" fill="' + paint('opening') + '" stroke="#b7c1ad" stroke-width=".55"/>' +
      '<ellipse cx="20" cy="6.35" rx="14.3" ry="2.6" fill="#19241d" stroke="#607361" stroke-width=".58"/>' +
      '<path d="M3 10.7Q20 16.1 37 10.7" fill="none" stroke="#29392d" stroke-width=".85"/>' +
      '<path d="M3.2 11.9Q20 17.1 36.8 11.9" fill="none" stroke="#aab9a5" stroke-opacity=".65" stroke-width=".48"/>';
    return svg;
  }

  // Both cylinders use the same count axis. A small worker chart retains the preview's 0–12 range.
  function scaleFor(issued, returned, company) {
    const peak = Math.max(measured(issued) ? issued : 0, measured(returned) ? returned : 0);
    if (!company && peak <= 12) return 12;
    const step = 10 ** Math.max(1, Math.floor(Math.log10(Math.max(peak,1))) - 1);
    return Math.min(Number.MAX_SAFE_INTEGER, Math.max(step, Math.ceil(peak / step) * step));
  }

  function mount(host, {issued, returned, company = false, caption = ""}) {
    const available = measured(issued) || measured(returned);
    const max = scaleFor(issued, returned, company);
    const figure = node('figure', 'direction-dials');
    const legend = caption || (company ? 'Shift movements' : 'Tool movements');
    figure.append(node('figcaption','direction-axis', available ? legend + ' · scale 0–' + format.format(max) : legend));
    const pair = node('div','direction-dial-pair');
    for (const [label,value,isReturn] of [['Issued',issued,false],['Returned',returned,true]]) {
      const gauge = node('div', 'direction-dial');
      if (!measured(value)) gauge.classList.add('direction-unmeasured');
      const number = node('strong','direction-dial-number',measured(value) ? format.format(value) : '—');
      if (!measured(value)) number.setAttribute('aria-label','Count unavailable');
      gauge.append(number, sightGlass(measured(value) ? value/max : null, isReturn), node('span','direction-dial-label',label));
      pair.append(gauge);
    }
    figure.append(pair);
    host.classList.add('direction-instrument');
    host.replaceChildren(figure);
    figure.dispatchEvent(new Event('mmg-instrument-mounted', {bubbles:true}));
  }

  function pill(host, value, total) {
    host.classList.add('direction-pill');
    host.setAttribute('aria-hidden','true');
    host.replaceChildren();
    const known = measured(value) && measured(total) && total > 0 && value <= total;
    host.classList.toggle('direction-unmeasured', !known);
    if (known && value > 0) {
      const fill = node('span','direction-pill-fill');
      fill.style.width = ((value / total) * 100) + '%';
      for (let i=0; i<3; i++) fill.append(node('i','direction-pill-bubble'));
      host.append(fill);
    }
    host.dispatchEvent(new Event('mmg-instrument-mounted', {bubbles:true}));
  }

  window.MMGReportInstruments = Object.freeze({mount, pill, clear:host => host.replaceChildren()});
})();
