/* Local, decorative motion for the scoped readouts. The report supplies every value. */
(() => {
  "use strict";
  const count = document.getElementById("hero-count");
  const reportBody = document.getElementById("report-body");
  if (!count || !reportBody) return;
  const readout = count.closest(".hero-holding");
  const lookup = document.getElementById("lookup");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "hire-sightglass");
  svg.setAttribute("viewBox", "0 0 152 29");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
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
  }
  // A fresh lookup replaces the panels; disconnect references to the previous report.
  new MutationObserver(bind).observe(reportBody, {childList:true});
  document.addEventListener("visibilitychange", bind);
  if (media.addEventListener) media.addEventListener("change", bind);
  else media.addListener(bind);
  bind();
})();
