/* Local, decorative motion for the scoped readouts. The report supplies every value. */
(() => {
  "use strict";
  const count = document.getElementById("hero-count");
  const reportBody = document.getElementById("report-body");
  if (!reportBody) return;
  const readout = count?.closest(".hero-holding");
  const lookup = document.getElementById("lookup");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "hire-sightglass");
  svg.setAttribute("viewBox", "0 0 152 29");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  if (readout && !document.querySelector(".direction-summary")) {
    const streams = [[17,2.7],[37,1.85],[55,2.35],[77,1.8],[97,2.8],[118,1.75],[135,2.15]]
      .map(([x,r]) => `<g class="glass-stream" transform="translate(${x} 0)">
        <circle class="glass-bubble" cy="22" r="${r}" fill="url(#hire-bubble)" stroke="#41785c" stroke-width=".85"/>
        <ellipse class="glass-pop" cy="9.4" rx="2.2" ry=".75" fill="none" stroke="#e8ffdf" stroke-width=".9"/></g>`)
      .join("");
    svg.innerHTML = `<defs>
      <linearGradient id="hire-metal" x2="0" y2="1"><stop stop-color="#a6afb6"/><stop offset=".18" stop-color="#48525f"/><stop offset=".48" stop-color="#242b32"/><stop offset=".78" stop-color="#11151a"/><stop offset="1" stop-color="#596270"/></linearGradient>
      <linearGradient id="hire-well" x2="0" y2="1"><stop stop-color="#05080c"/><stop offset=".52" stop-color="#212833"/><stop offset="1" stop-color="#0c0f14"/></linearGradient>
      <linearGradient id="hire-fluid" x2="0" y2="1"><stop stop-color="#ddffcf"/><stop offset=".13" stop-color="#baf3bb"/><stop offset=".42" stop-color="#98e5a4"/><stop offset=".74" stop-color="#4b966c"/><stop offset="1" stop-color="#36705c"/></linearGradient>
      <linearGradient id="hire-rim"><stop stop-color="#77ad7c"/><stop offset=".23" stop-color="#e7ffda"/><stop offset=".52" stop-color="#98e5a4"/><stop offset=".75" stop-color="#dbffda"/><stop offset="1" stop-color="#80c48b"/></linearGradient>
      <radialGradient id="hire-bubble" cx=".32" cy=".23" r=".9"><stop stop-color="#f1ffe9"/><stop offset=".25" stop-color="#c9ffc4"/><stop offset=".55" stop-color="#90d99c"/><stop offset="1" stop-color="#4c8867"/></radialGradient>
      <clipPath id="hire-window-cut"><rect x="3" y="3" width="146" height="23" rx="11.5"/></clipPath>
    </defs>
    <rect x=".5" y=".5" width="151" height="28" rx="14" fill="url(#hire-metal)"/>
    <rect x="2" y="2" width="148" height="25" rx="12.5" fill="url(#hire-well)"/>
    <g clip-path="url(#hire-window-cut)">
      <g class="glass-contents">
        <path d="M1 9.4Q8 11.6 25 9.4T53 9.3 82 9.4 110 9.2 151 9.4V29H1Z" fill="url(#hire-fluid)"/>
        <path d="M1 9.4Q8 11.6 25 9.4T53 9.3 82 9.4 110 9.2 151 9.4" fill="none" stroke="url(#hire-rim)" stroke-width="1.65"/>
        <path class="glass-glint" d="M-12 9.7q5 1.1 11-.1t9-.2" fill="none" stroke="#f2ffe9" stroke-width="1.25" stroke-linecap="round"/>
        ${streams}
      </g>
      <path d="M6 4.7H146" stroke="#fff" stroke-opacity=".18"/>
      <path d="M8 25H142" stroke="#e5f2ff" stroke-opacity=".1"/>
      <path d="M16 3H31L19 25H8Z" fill="#fff" opacity=".055"/>
    </g>`;
    count.after(svg);
    // This window only distinguishes active from empty. It has no percentage scale.
    function setHolding() {
      const value = count.textContent.trim().replace(/,/g, "");
      readout.classList.toggle("has-holdings", /^\d+$/.test(value) && Number(value) > 0);
    }
    new MutationObserver(setHolding).observe(count, {childList:true, characterData:true, subtree:true});
    setHolding();
  }

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
        const group = document.createElementNS(svg.namespaceURI, "g");
        const bubble = document.createElementNS(svg.namespaceURI, "circle");
        const pop = document.createElementNS(svg.namespaceURI, "ellipse");
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
    watch(readout);
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
    const depth = Math.max(0, fraction || 0) * 83;
    const surface = 97 - depth;
    const curve = Math.min(2.25, depth * .28);
    const liquid = 'M5.25 ' + surface + ' Q20 ' + (surface + 2 * curve) + ' 34.75 ' + surface +
      ' V98.5C34.75 103 5.25 103 5.25 98.5Z';
    let contents = '';
    if (depth > 0) {
      // Rising bubbles start inside the actual fill and stop just below its meniscus.
      const streams = [[12,1.55,-.4],[22,1.15,-2.08],[28,.85,-2.88],[17,.6,-3.44]];
      const bubbles = depth < 7 ? '' : streams.slice(0, depth < 24 ? 2 : 4).map(([x,r,delay]) =>
        '<g style="--glass-lift:' + (3 - depth).toFixed(2) + 'px;--glass-phase:' + delay + 's">' +
          '<g class="direction-rising"><circle cx="' + x + '" cy="96.7" r="' + r + '" fill="' + mid +
          '" stroke="' + rim + '" stroke-width=".55"/><circle cx="' + (x-r*.3) + '" cy="' + (96.7-r*.3) +
          '" r="' + (r*.26) + '" fill="#f3ffdc"/></g></g>').join('');
      const pops = depth < 7 ? '' : streams.slice(0,2).map(([x,,delay]) =>
        '<ellipse class="direction-pop" cx="' + x + '" cy="' + (surface+.25) +
        '" rx="1.65" ry=".48" fill="none" stroke="#f4ffdf" stroke-width=".64" style="--glass-phase:' +
        delay + 's"/>').join('');
      contents =
        '<path d="' + liquid + '" fill="' + paint('liquid') + '"/>' +
        '<path d="' + liquid + '" fill="' + paint('depth') + '"/>' +
        '<g clip-path="' + paint('wetclip') + '">' + bubbles + '</g>' +
        '<ellipse cx="20" cy="' + surface + '" rx="14.75" ry="' + curve + '" fill="' + paint('meniscus') +
        '" stroke="' + rim + '" stroke-width=".6"/>' +
        '<path class="direction-glint" d="M10 ' + surface + 'q4-1.5 8-.45t6 .35" stroke="#f2ffdc" fill="none" stroke-width=".7" stroke-linecap="round"/>' + pops;
    }
    const ticks = [22,34,46,58,70,82,94].map((y,i)=>
      '<path d="M' + (i%2 ? 30.7 : 29.3) + ' ' + y + 'H32.9"/>').join('');
    svg.innerHTML = '<defs>' +
      gradient(id+'metal',[[0,'#21302a'],[7,'#576a5e'],[19,'#c0cbbd'],[29,'#788c78'],[48,'#3a4a3e'],[71,'#334239'],[85,'#839781'],[94,'#455446'],[100,'#243129']]) +
      gradient(id+'opening',[[0,'#15251d'],[22,'#899e89'],[46,'#4c6050'],[77,'#283b30'],[100,'#6f8474']],true) +
      gradient(id+'hollow',[[0,'#101c16'],[19,'#2c3830'],[49,'#18241c'],[78,'#142119'],[100,'#2a3b2c']]) +
      gradient(id+'wall',[[0,'#c2d9c7',.5],[7,'#adcab8',.13],[14,'#13231b',.48],[24,'#e9ffec',.14],[48,'#bed4c1',.04],[82,'#152219',.24],[94,'#b6cdbc',.18],[100,'#b4cebc',.42]]) +
      gradient(id+'liquid',[[0,deep],[5,shade],[11,mid],[24,light],[40,hue],[56,mid],[78,shade],[92,deep],[100,mid]]) +
      gradient(id+'depth',[[0,rim,.15],[33,light,.015],[76,deep,.05],[100,deep,.37]],true) +
      gradient(id+'meniscus',[[0,mid],[13,light],[39,rim],[70,light],[100,shade]]) +
      '<clipPath id="' + id + 'wetclip"><path d="' + liquid + '"/></clipPath></defs>' +
      '<ellipse cx="20" cy="106.2" rx="16.6" ry="2.3" fill="#071109" opacity=".45"/>' +
      '<path d="' + wall + '" fill="' + paint('hollow') + '" stroke="#92ac99" stroke-width=".68"/>' +
      '<g stroke="#b5ccb6" stroke-opacity=".27" stroke-width=".56">' + ticks + '</g>' +
      contents + '<path d="' + wall + '" fill="' + paint('wall') + '"/>' +
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
    return Math.max(step, Math.ceil(peak / step) * step);
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
    if (measured(value) && measured(total) && value > 0 && total > 0) {
      const fill = node('span','direction-pill-fill');
      fill.style.width = Math.min(100, (value / total) * 100) + '%';
      for (let i=0; i<3; i++) fill.append(node('i','direction-pill-bubble'));
      host.append(fill);
    }
    host.dispatchEvent(new Event('mmg-instrument-mounted', {bubbles:true}));
  }

  window.MMGReportInstruments = Object.freeze({mount, pill, clear:host => host.replaceChildren()});
})();
