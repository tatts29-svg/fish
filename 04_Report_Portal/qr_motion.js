/* Local, decorative motion for the scoped readouts. The report supplies every value. */
(() => {
  "use strict";
  const reportBody = document.getElementById("report-body");
  if (!reportBody) return;
  const targets = ".movement-figure,.direction-dials,.direction-pill,.store-pattern";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let observer;
  function watch(node) {
    if (observer) {
      if (!node.classList.contains("glass-seen") && !node.classList.contains("glass-final")) node.classList.add("glass-pending");
      observer.observe(node);
    }
    else if (!document.hidden) node.classList.add("glass-final");
  }
  function bind() {
    observer?.disconnect();
    observer = null;
    const instruments = document.querySelectorAll(targets);
    instruments.forEach(node => node.classList.remove("motion-near"));
    if (reduced.matches) {
      instruments.forEach(node => node.classList.add("glass-final"));
      return;
    }
    if (document.hidden) {
      instruments.forEach(node => {if (node.classList.contains("glass-seen")) node.classList.add("glass-final");});
      return;
    }
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(changes => {
        for (const {target, isIntersecting} of changes) {
          if (!target.isConnected) continue;
          target.classList.toggle("motion-near", isIntersecting);
          if (isIntersecting) {
            target.classList.remove("glass-pending");
            target.classList.add("glass-seen");
          } else if (target.classList.contains("glass-seen")) target.classList.add("glass-final");
        }
      });
    }
    instruments.forEach(watch);
  }
  new MutationObserver(bind).observe(reportBody, {childList:true});
  document.addEventListener("mmg-instrument-mounted", event => watch(event.target));
  document.addEventListener("visibilitychange", bind);
  window.addEventListener("beforeprint", () => document.querySelectorAll(targets).forEach(node => node.classList.add("glass-final")));
  if (reduced.addEventListener) reduced.addEventListener("change", bind);
  else reduced.addListener(bind);
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

  function gradient(id, stops, orientation = "horizontal") {
    const radial = orientation === "radial";
    const tag = radial ? "radialGradient" : "linearGradient";
    const axis = radial ? 'cx="48%" cy="37%" r="65%"' : orientation === "vertical" ? 'x2="0%" y2="100%"' : 'x2="100%" y2="0%"';
    return '<' + tag + ' id="' + id + '" ' + axis + '>' + stops.map(([offset, color, opacity=1]) =>
      '<stop offset="' + offset + '%" stop-color="' + color + '" stop-opacity="' + opacity + '"/>').join("") + '</' + tag + '>';
  }

  function glassDefs(id, series) {
    const body = 'var(--'+series+')', edge = 'var(--'+series+'-mid)', rim = 'var(--'+series+'-rim)';
    // Light catches the two walls and the foot. The middle remains transparent.
    return gradient(id+'liquid', [[0,edge,.85],[12,body,.51],[25,body,.28],[50,body,.2],[82,body,.39],[100,edge,.86]]) +
      gradient(id+'core', [[0,body,.05],[68,edge,.4],[100,rim,.82]], "vertical") +
      gradient(id+'surface', [[0,'#fff9f2'],[43,rim,.98],[72,body,.91],[100,edge,.83]], "radial") +
      gradient(id+'floor', [[0,body,.49],[55,edge,.18],[100,body,0]], "radial") +
      gradient(id+'wall', [[0,'#afc5d1',.27],[12,'#d8e6ee',.1],[46,'#8497a5',.025],[86,'#97afbb',.08],[100,'#bbd0da',.28]]);
  }

  function vessel(x, width, top, floor, wallInk) {
    const mid=x+width/2, ry=width*.14, floorLip=floor-ry, lip=top+ry;
    return '<path class="glass-outline" d="M'+x+' '+lip+'a'+width/2+' '+ry+' 0 0 1 '+width+' 0V'+floorLip+
      'a'+width/2+' '+ry+' 0 0 1 '+(-width)+' 0Z" fill="'+wallInk+'"/>'+
      '<ellipse class="glass-mouth" cx="'+mid+'" cy="'+lip+'" rx="'+width/2+'" ry="'+ry+'"/>'+
      '<path class="glass-wire" d="M'+(x+width*.095)+' '+(lip+2)+'V'+(floorLip-2)+'"/>';
  }

  function liquid(id, clip, x, width, top, floor, phase=0) {
    const h=floor-top, rx=width/2, ry=Math.min(rx*.32,h*.24), mid=x+rx, surface=top+ry;
    const side='M'+x+' '+surface+'Q'+mid+' '+(surface+2*ry)+' '+(x+width)+' '+surface+
      'V'+(floor-ry)+'Q'+mid+' '+(floor+ry)+' '+x+' '+(floor-ry)+'Z';
    const paint=name=>'url(#'+id+name+')';
    const travel=Math.max(0,h-2*ry-3);
    let bubbles='', pops='';
    if (travel>3 && width>=6) {
      const streams=[[.28,1], [.64,.73], [.46,.48]];
      for (const [i,[lane,relative]] of streams.slice(0,h<22 ? 1 : width<20 ? 2 : 3).entries()) {
        const cx=x+width*lane, radius=Math.min(width*.042,1.16)*relative;
        const cy=surface+travel, delay=-((i*1.47+phase*.31+.4)%4.8);
        const idle='style="--glass-lift:'+(-travel)+'px;--glass-phase:'+delay+'s"';
        bubbles+='<g '+idle+'><circle class="direction-rising glass-pearl" cx="'+cx+'" cy="'+cy+'" r="'+radius+'"/></g>';
        pops+='<ellipse class="direction-pop" cx="'+cx+'" cy="'+surface+'" rx="'+Math.min(rx*.17,1.75)+'" ry="'+Math.min(ry*.27,.62)+'" '+idle+'/>';
      }
    }
    return '<g class="direction-water" clip-path="url(#'+clip+')" style="--glass-travel:'+(h-ry)+'px;--glass-base:'+floor+'px;--glass-order:'+phase+'">'+
      '<g class="glass-rise"><path d="'+side+'" fill="'+paint('liquid')+'"/>'+
      '<rect x="'+(x+width*.29)+'" y="'+surface+'" width="'+(width*.42)+'" height="'+(floor-surface)+'" fill="'+paint('core')+'"/>'+
      '<path class="glass-wet-edge" d="M'+(x+.55)+' '+surface+'V'+(floor-ry)+'M'+(x+width-.55)+' '+surface+'V'+(floor-ry)+'"/>'+bubbles+'</g>'+
      '<g class="glass-cap-lift"><ellipse class="glass-cap" cx="'+mid+'" cy="'+surface+'" rx="'+rx+'" ry="'+ry+'" fill="'+paint('surface')+'"/>'+
      '<path class="glass-meniscus" d="M'+(x+width*.05)+' '+surface+'Q'+mid+' '+(surface+ry*1.8)+' '+(x+width*.95)+' '+surface+'"/>'+pops+'</g></g>';
  }

  function sightGlass(fraction, returned) {
    const id='direction-glass-'+(++instance)+'-', svg=document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox','0 0 40 110');svg.setAttribute('preserveAspectRatio','none');
    svg.setAttribute('focusable','false');svg.setAttribute('aria-hidden','true');svg.classList.add('direction-tube');
    const series=returned?'returned':'issued', floor=96, depth=(fraction??0)*80, surface=floor-depth;
    const ticks=Array.from({length:9},(_,i)=>'<path d="M'+(i%2 ? 29.7 : 27.8)+' '+(floor-10*i)+'H34"/>').join('');
    const chamber='x="5.25" y="'+surface+'" width="29.5" height="'+depth+'"';
    svg.innerHTML='<defs>'+glassDefs(id,series)+'<clipPath id="'+id+'wetclip"><rect '+chamber+'/></clipPath>'+
      '<pattern id="'+id+'unknown" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="#9daeba" stroke-width=".75"/></pattern></defs>'+
      (depth ? '<ellipse class="glass-pool" cx="20" cy="100" rx="19" ry="3" fill="url(#'+id+'floor)"/>' : '')+
      vessel(3.3,33.4,10,99,'url(#'+id+'wall)')+
      (depth ? liquid(id,id+'wetclip',5.25,29.5,surface,floor,returned ? 1 : 0)
        : fraction===null ? '<rect x="5.25" y="16" width="29.5" height="80" fill="url(#'+id+'unknown)"/>' : '')+
      '<g class="glass-ruler">'+ticks+'</g>';
    return svg;
  }

  function movementPaint(defs, index, role) {
    const id='movement-'+index+'-';
    defs.insertAdjacentHTML('beforeend',glassDefs(id,role));
  }

  function movementVessel(defs, index, x, w, top, bottom, height, delay) {
    const id='movement-'+index+'-', clip='movement-cut-'+delay+'-'+index;
    const g=document.createElementNS(ns,'g');
    g.setAttribute('class',index ? 'movement-return' : 'movement-issue');
    g.innerHTML=vessel(x-.35,w+.7,top-2,bottom+1,'url(#'+id+'wall)');
    if (height>0) {
      defs.insertAdjacentHTML('beforeend','<clipPath id="'+clip+'"><rect x="'+x+'" y="'+(bottom-height)+'" width="'+w+'" height="'+height+'"/></clipPath>');
      g.insertAdjacentHTML('beforeend',liquid(id,clip,x,w,bottom-height,bottom,Math.min(delay*2+index,7)));
    }
    return g;
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
      gauge.dataset.series = isReturn ? 'returned' : 'issued';
      if (!measured(value)) gauge.classList.add('direction-unmeasured');
      const number = node('strong','direction-dial-number',measured(value) ? format.format(value) : '—');
      if (measured(value)) number.dataset.countTo=String(value);
      else number.setAttribute('aria-label','Count unavailable');
      gauge.append(number, sightGlass(measured(value) ? value/max : null, isReturn), node('span','direction-dial-label',label));
      pair.append(gauge);
    }
    figure.append(pair);
    host.classList.add('direction-instrument');
    host.replaceChildren(figure);
    figure.dispatchEvent(new Event('mmg-instrument-mounted', {bubbles:true}));
  }

  function pill(host, value, total, series = 'issued') {
    host.dataset.series = series === 'returned' ? 'returned' : 'issued';
    host.classList.add('direction-pill');
    host.setAttribute('aria-hidden','true');
    host.replaceChildren();
    const known = measured(value) && measured(total) && total > 0 && value <= total;
    host.classList.toggle('direction-unmeasured', !known);
    if (known && value > 0) {
      const fill = node('span','direction-pill-fill');
      fill.style.width = ((value / total) * 100) + '%';
      const liquid = node('span','direction-pill-liquid');
      for (let i=0; i<3; i++) liquid.append(node('i','direction-pill-bubble'));
      fill.append(liquid,node('span','direction-pill-lens'));
      host.append(fill);
    }
    host.dispatchEvent(new Event('mmg-instrument-mounted', {bubbles:true}));
  }

  window.MMGReportInstruments = Object.freeze({mount, pill, movementPaint, movementVessel, clear:host => host.replaceChildren()});
})();

/* Only measured totals opt in. The accessible text is the final reading throughout. */
(() => {
  "use strict";
  const report=document.getElementById("report");
  const body=document.getElementById("report-body");
  if (!report || !body || !("IntersectionObserver" in window) || !Element.prototype.animate) return;

  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const format=new Intl.NumberFormat("en-AU",{maximumFractionDigits:2});
  const seen=new WeakSet();
  const playing=new Map();

  function finish(target) {
    const run=playing.get(target);
    if (!run) return;
    cancelAnimationFrame(run.frame);
    run.clock.cancel();
    if (target.contains(run.exact)) target.replaceChildren(run.exact.firstChild);
    target.classList.remove("measured-count-running");
    playing.delete(target);
    observer.unobserve(target);
  }

  function start(target) {
    if (seen.has(target) || report.hidden || document.hidden || reduce.matches || !report.contains(target)) return;
    seen.add(target);
    const value=Number(target.dataset.countTo);
    const places=(target.textContent.split(".")[1] || "").length;
    const scale=10**places, units=Math.round(value*scale);
    if (!Number.isSafeInteger(units) || units<=0 || !target.firstChild) {
      observer.unobserve(target);
      return;
    }
    const exact=document.createElement("span");
    exact.className="measured-count-exact";
    exact.append(target.firstChild);
    const drawing=document.createElement("span");
    drawing.className="measured-count-drawing";
    drawing.setAttribute("aria-hidden","true");
    drawing.dataset.reading="0";
    target.classList.add("measured-count-running");
    target.replaceChildren(exact,drawing);

    // An empty Web Animation evaluates precisely the same easing as the CSS.
    // A cylinder's number follows its actual rise, including its stagger and an
    // entrance that may already have started before the number is visible.
    const rise=target.closest(".direction-dial")?.querySelector(".glass-rise");
    const clock=drawing.animate([],{duration:1000,delay:150,easing:"cubic-bezier(.2,.75,.2,1)",fill:"both"});
    const run={exact,clock,frame:0};
    let synced=!rise;
    playing.set(target,run);
    function step() {
      if (!target.isConnected || !report.contains(target) || report.hidden || document.hidden || reduce.matches) {
        finish(target);
        return;
      }
      if (!synced) {
        const source=rise.getAnimations().find(animation=>animation.animationName==="reportGlassRise");
        const figure=rise.closest(".direction-dials");
        if (!source && (figure.classList.contains("glass-seen") || figure.classList.contains("glass-final"))) {
          finish(target);return;
        }
        if (!source || source.startTime===null) {run.frame=requestAnimationFrame(step);return;}
        const {delay,duration}=source.effect.getTiming();
        clock.effect.updateTiming({delay,duration,easing:source.effect.getKeyframes()[0].easing});
        clock.startTime=source.startTime;
        synced=true;
      }
      const {localTime,endTime,progress}=clock.effect.getComputedTiming();
      if (localTime>=endTime) {finish(target);return;}
      const text=format.format(Math.min(units-1, Math.floor(units*(progress || 0)))/scale);
      if (drawing.dataset.reading!==text) drawing.dataset.reading=text;
      run.frame=requestAnimationFrame(step);
    }
    run.frame=requestAnimationFrame(step);
  }

  const observer=new IntersectionObserver(entries=>{
    for (const entry of entries) {
      if (entry.isIntersecting) start(entry.target);
      else finish(entry.target);
    }
  });
  function refresh() {
    observer.disconnect();
    for (const target of playing.keys()) finish(target);
    if (report.hidden || document.hidden) return;
    for (const target of report.querySelectorAll("[data-count-to]")) {
      if (reduce.matches) seen.add(target);
      else if (!seen.has(target)) observer.observe(target);
    }
  }
  const updates=new MutationObserver(refresh);
  updates.observe(body,{childList:true});
  updates.observe(report,{attributes:true,attributeFilter:["hidden"]});
  document.addEventListener("visibilitychange",refresh);
  if (reduce.addEventListener) reduce.addEventListener("change",refresh);
  else reduce.addListener(refresh);
  window.addEventListener("beforeprint",()=>{
    observer.disconnect();
    for (const target of playing.keys()) finish(target);
    for (const target of report.querySelectorAll("[data-count-to]")) seen.add(target);
  });
  refresh();
})();
