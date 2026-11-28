"use strict";
(() => {
  const $ = id => document.getElementById(id);
  if (document.body.dataset.setup === "1") {
    $("refresh").addEventListener("click",() => location.reload());
    return;
  }
  const personal = document.body.dataset.scope === "personal";
  const form = $("lookup-form");
  const identity = $("identity");
  const dialog = $("send-dialog");
  const number = new Intl.NumberFormat("en-AU", {maximumFractionDigits: 2});
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  let selection = "";
  let transaction = null;
  let pdfRequest = null;
  let pdf = null;
  let snapshot = null;
  let media = null;
  let scanTimer = 0;
  let scanGeneration = 0;
  let dialogGeneration = 0;
  let printClosed = [];
  let decoderRequest;
  let ratingObserver=null;
  let sectionFrame=0;
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const fmt = value => finite(value) ? number.format(value) : "—";
  function when(value, time = "") {
    if (!value) return "";
    // These are SiteIQ project-local dates. Do not convert them to the phone's timezone.
    const s = String(value);
    const date = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
    if (!date) return s;
    const clock = date[4] || String(time || "").slice(0, 5);
    return [Number(date[3]), months[Number(date[2]) - 1], date[1]].join(" ") + (clock ? ", " + clock : "");
  }
  function status(text = "", error = false) {
    $("message").classList.toggle("error", error);
    $("message").textContent = text;
  }
  function buttonIcon(id, path) {
    const btn = $(id);
    if (!btn) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const shape = document.createElementNS(svg.namespaceURI, "path");
    for (const [key, value] of Object.entries({viewBox:"0 0 16 16", fill:"none", stroke:"currentColor", "stroke-width":"1.8", "stroke-linecap":"round", "stroke-linejoin":"round", "aria-hidden":"true"})) svg.setAttribute(key,value);
    shape.setAttribute("d",path);
    svg.append(shape); btn.prepend(svg);
  }
  // MyGear HQ's 16-unit print, download and navigation glyphs.
  const icons = {
    print:"M5 5V2h6v3M4 12H2V6h12v6h-2M4 9h8v5H4zM11.5 7h.01",
    save:"M8 1.5v9M4.5 7L8 10.5 11.5 7M2.5 12.5v2h11v-2",
    reset:"M13.5 8H3M7 4L3 8l4 4",
    "close-dialog":"M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4",
    share:"M8 10V2M5.2 4.8 8 2l2.8 2.8M4.5 6.6H2.5v7.5h11V6.6h-2",
    email:"M1.5 3.5h13v9h-13zM2 4l6 4.6L14 4",
    camera:"M1.5 5h3l1.3-2h4.4l1.3 2h3v8.2h-13zM10.5 8.8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"
  };
  for (const [id,path] of Object.entries(icons)) buttonIcon(id,path);
  // Use an absolute deadline so a backgrounded or suspended tab still expires.
  const idleDialog = $("idle-dialog");
  const minute = 60_000;
  let expiresAt = 0;
  let idleTimer = 0;
  let printing = false;
  function syncDeadline() {
    clearTimeout(idleTimer);
    if (!expiresAt || printing) return;
    const left = expiresAt - Date.now();
    if (left <= 0) {
      endLookup("Screen cleared after 5 minutes without activity.");
    } else if (left <= minute) {
      if (!document.hidden && !idleDialog.open) idleDialog.showModal();
      idleTimer = setTimeout(syncDeadline, left);
    } else {
      idleTimer = setTimeout(syncDeadline, left - minute);
    }
  }
  function renewDeadline() {
    expiresAt = Date.now() + 5 * minute;
    $("clear-entry").hidden = false;
    syncDeadline();
  }
  function activity(event) {
    if (!expiresAt || printing || document.hidden) return;
    if (Date.now() >= expiresAt) {
      syncDeadline();
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    } else if (!idleDialog.open) {
      renewDeadline();
    }
  }
  for (const type of ["pointerdown", "keydown", "input", "click", "wheel", "touchmove"]) {
    document.addEventListener(type, activity, {capture:true, passive:false});
  }
  identity.addEventListener("input", () => { if (identity.value) renewDeadline(); });
  identity.addEventListener("change", () => { if (identity.value) renewDeadline(); });
  $("keep-open").addEventListener("click", () => {
    if (Date.now() >= expiresAt) {syncDeadline(); return;}
    idleDialog.close();
    renewDeadline();
  });
  idleDialog.addEventListener("cancel", event => {
    event.preventDefault();
    endLookup("Screen cleared.");
  });
  function endLookup(message = "") {
    clearTimeout(idleTimer);
    expiresAt = 0;
    printing = false;
    printClosed = [];
    if (idleDialog.open) idleDialog.close();
    ratingObserver?.disconnect();ratingObserver=null;
    if (transaction) transaction.abort();
    transaction = null;
    selection = ""; pdfRequest = null; pdf = null; snapshot = null;
    dialogGeneration++;
    if (dialog.open) dialog.close();
    $("send-status").textContent = "";
    $("email-draft").removeAttribute("href");
    $("dialog-save").disabled = true;
    $("native-share").hidden = true;
    $("email-draft").hidden = true;
    stopCamera();
    $("report").hidden = true;
    $("report-body").replaceChildren();
    $("section-nav").replaceChildren();
    $("trail-current").textContent = "Lookup";
    clearIdentity();
    $("hero-count").textContent = "";
    $("hero-label").textContent = personal ? "Assets on hire to you" : "Assets on hire now";
    $("report-subtitle").textContent = "";
    $("pull").textContent = "SiteIQ pull time available with the report.";
    $("lookup").hidden = false;
    identity.value = "";
    $("clear-entry").hidden = true;
    form.querySelector("[type=submit]").disabled = !personal && identity.disabled;
    form.removeAttribute("aria-busy");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    status(message);
    if (message && !document.hidden) {
      $("lookup-title").focus({preventScroll:true});
      window.scrollTo(0, 0);
    }
  }
  for (const id of ["reset","finish-report","clear-entry","finish-idle"]) {
    $(id).addEventListener("click", () => endLookup("Screen cleared."));
  }
  // Section navigation does not put report sections in the browser Back list.
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    const target = link && $(link.hash.slice(1));
    if (target) {
      event.preventDefault();
      history.replaceState(null, "", link.hash);
      target.focus({preventScroll:true});
      target.scrollIntoView({block:"start"});
    }
  });
  async function json(response) {
    let data;
    try { data = await response.json(); } catch (_) { /* A session may have expired. */ }
    if (!response.ok || !data) throw new Error(data?.error || "The report could not be opened. Scan the access QR again or try another network connection.");
    return data;
  }
  const requestOptions = () => ({credentials:"same-origin", cache:"no-store", referrerPolicy:"no-referrer"});
  async function companies() {
    $("retry-companies").hidden = true;
    try {
      const data = await json(await fetch("companies",requestOptions()));
      if (!Array.isArray(data.companies)) throw new Error("The company list could not be read.");
      identity.replaceChildren(new Option("Choose a company",""));
      for (const row of data.companies) identity.add(new Option(row.name, row.id));
      identity.disabled = !data.companies.length;
      form.querySelector("[type=submit]").disabled = identity.disabled;
      status(identity.disabled ? "There are no companies in the available MMG exports." : "");
    } catch (err) {
      identity.replaceChildren(new Option("Company list unavailable",""));
      identity.disabled = true;
      form.querySelector("[type=submit]").disabled = true;
      $("retry-companies").hidden = false;
      status(err.message, true);
    }
  }
  function endpoint(pdfFile) {
    const path = pdfFile ? "report.pdf" : "report";
    const options = {...requestOptions(), signal:transaction.signal};
    if (personal) {
      options.method = "POST";
      options.headers = {"Content-Type":"application/json", "X-Portal":"1"};
      options.body = JSON.stringify({barcode:selection});
      return [path,options];
    }
    return [path + "?" + new URLSearchParams({company:selection}),options];
  }
  function section(parent, heading, note, full = false) {
    const panel = el("section",full ? "panel readout full" : "panel readout");
    panel.append(el("h2","",heading));
    if (note) panel.append(el("p","note",note));
    parent.append(panel);
    return panel;
  }
  function factList(pairs) {
    const list = el("ul","data-list");
    for (const [title,value] of pairs) {
      const row = el("li");
      row.append(el("span","label",title),el("span","metric",value));
      list.append(row);
    }
    return list;
  }
  function stats(parent, pairs) {
    const group = el("div","stats kpis");
    for (const [title,value] of pairs) {
      const card = el("div","stat kpi ro");
      card.append(el("strong","stat-value kv",value),el("span","stat-label kl",title));
      group.append(card);
    }
    parent.append(group);
  }
  function table(parent, headings, rows, numeric = []) {
    const wrap = el("div","table-wrap table-scroll");
    const tbl = el("table","paper");
    const thRow = tbl.createTHead().insertRow();
    for (const [i,title] of headings.entries()) {
      const th = el("th",numeric.includes(i) ? "num" : "",title);
      th.scope = "col"; thRow.append(th);
    }
    const body = tbl.createTBody();
    for (const row of rows) {
      const tr = body.insertRow();
      for (const [i,val] of row.entries()) tr.append(el("td",numeric.includes(i) ? "num" : "",val));
    }
    wrap.append(tbl); parent.append(wrap);
    return tbl;
  }
  function group(name, count) {
    const d = el("details","tool-group readout-group");
    const header = el("summary");
    header.append(el("span","summary-name",name));
    if (count !== null) header.append(el("span","badge",fmt(count)));
    d.append(header); return d;
  }
  function rentalSnapshot(r) {
    const stamp = r.asat || r.coverage?.rental_asat;
    return stamp ? "Rental stock snapshot · " + when(stamp) + " AEST" : "Rental stock snapshot time unavailable";
  }
  function issueKey(asset) {
    return asset.date ? asset.date + " " + (asset.time || "24:00") : "~";
  }
  function orderedHoldings(r) {
    const hires = r.hires.map(tool => ({...tool, items:[...tool.items].sort((a,b) =>
      issueKey(a).localeCompare(issueKey(b)) || String(a.item).localeCompare(String(b.item)))}));
    hires.sort((a,b) => issueKey(a.items[0] || {}).localeCompare(issueKey(b.items[0] || {})) || a.name.localeCompare(b.name));
    return {...r, hires};
  }
  function gearTable(parent,tool,r) {
    // A description may span several variants. A single group reference is safe only
    // when every asset in the group maps to the very same published image.
    const media=tool.items.map(asset=>r.product_art?.[asset.item]);
    if (media[0] && media.every(url=>url===media[0])) {
      const ref=window.QRHandover.artwork(r,{item:tool.items[0].item,name:tool.name});
      if (ref) parent.append(ref);
    }
    const headings=["Asset number","Issued (AEST)"];
    if (!personal) headings.push("Held by");
    headings.push("Item query");
    const rows=tool.items.map(asset => {
      const stamp=asset.date ? when(asset.date,asset.time) + (asset.time ? "" : " · time unavailable") : "Issue date unavailable";
      const row=[asset.item || "Number unavailable",stamp];
      if (!personal) row.push(asset.holder || "Individual holder unconfirmed");
      return [...row,""];
    });
    const tbl=table(parent,headings,rows);
    tbl.classList.add("holding-assets");
    tbl.tHead.rows[0].lastElementChild.classList.add("screen-only");
    for (const [index,asset] of tool.items.entries()) {
      const row=tbl.tBodies[0].rows[index];
      Array.from(row.cells).forEach((td,i)=>td.dataset.label=headings[i]);
      const cell=row.lastElementChild;
      cell.classList.add("screen-only");
      cell.append(window.QRItemQuery.button({scope:personal ? "personal" : "company", subject:r.name,
        company:personal ? r.company : "", assetName:tool.name,assetId:asset.item,
        snapshot:r.asat ? when(r.asat)+" AEST" : ""}));
    }
  }
  function gearList(panel,r) {
    const list=el("div","gear-list");
    const groups=r.hires;
    if (groups.length>6 || groups.reduce((sum,g)=>sum+g.items.length,0)>=12) {
      const heading=panel.querySelector("h2");
      const head=el("div","gear-heading");
      heading.replaceWith(head);
      const toggle=el("button","gear-find-toggle screen-only","Find gear");
      toggle.type="button";
      toggle.setAttribute("aria-controls","gear-find");
      toggle.setAttribute("aria-expanded","false");
      head.append(heading,toggle);
      const form=el("div","gear-find screen-only");
      form.id="gear-find";form.hidden=true;
      const field=el("input");
      field.id="gear-query";field.type="search";field.autocomplete="off";field.spellcheck=false;
      field.placeholder=personal ? "Equipment or asset number" : "Equipment, asset number or holder";
      field.setAttribute("aria-label","Filter by "+field.placeholder.toLowerCase());
      const result=el("span","gear-find-result");
      result.setAttribute("role","status");
      form.append(field,result);
      panel.append(form);
      let beforeSearch=null;
      function filter() {
        const words=field.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
        const entries=list.querySelectorAll(".gear-entry");
        if (words.length && !beforeSearch) {
          beforeSearch=new Map(Array.from(list.querySelectorAll("details"),d=>[d,d.open]));
        }
        let matches=0;
        entries.forEach((entry,i)=>{
          const tool=groups[i];
          let visible=0;
          entry.querySelectorAll("tbody tr").forEach((tr,j)=>{
            const terms=([tool.name,tool.items[j].item,tool.items[j].holder].filter(Boolean).join(" ")).toLocaleLowerCase();
            const match=words.every(word=>terms.includes(word));
            tr.classList.toggle("gear-omit",!match);
            if (match) visible++;
          });
          matches+=visible;
          entry.classList.toggle("gear-omit",Boolean(words.length) && !visible);
          if (words.length && visible && entry.tagName==="DETAILS") entry.open=true;
        });
        const more=list.querySelector(".more-tools");
        if (more && words.length) more.open=true;
        list.classList.toggle("gear-searching",Boolean(words.length));
        if (!words.length && beforeSearch) {
          beforeSearch.forEach((open,d)=>{d.open=open;});
          beforeSearch=null;
        }
        result.textContent=words.length ? (matches ? units(matches,"matching asset") : "No matching assets") : "";
      }
      field.addEventListener("input",filter);
      toggle.addEventListener("click",()=>{
        form.hidden=!form.hidden;
        toggle.setAttribute("aria-expanded",String(!form.hidden));
        toggle.textContent=form.hidden ? "Find gear" : "Close search";
        if (form.hidden) {field.value="";filter();} else field.focus();
      });
      field.addEventListener("keydown",event=>{
        if(event.key==="Escape"){event.preventDefault();toggle.click();toggle.focus();}
      });
    }
    panel.append(list);
    return list;
  }
  function personalHires(parent,r) {
    const panel=section(parent,"Currently on hire to you",rentalSnapshot(r),true);
    panel.id="current-gear";panel.tabIndex=-1;panel.classList.add("personal-hires");
    if (!r.hires.length) {
      panel.append(el("p","no-holdings",r.asat || r.coverage?.rental_asat ? "No equipment is listed against your card in this rental stock export." : "A dated rental stock export is needed to confirm your current gear."));
      return;
    }
    const list=gearList(panel,r);
    for (const tool of r.hires) {
      const group=el("section","holding-group readout gear-entry");
      const title=el("h3","",tool.name);
      title.append(el("span","badge",units(tool.count,"asset")));
      group.append(title);
      gearTable(group,tool,r);
      list.append(group);
    }
  }
  function hires(parent,r) {
    const panel=section(parent,"Gear on hire",rentalSnapshot(r),true);
    panel.id="current-gear";panel.tabIndex=-1;
    if (!r.hires.length) {
      panel.append(el("p","empty",r.asat || r.coverage?.rental_asat ? "No equipment is listed against this company in this rental stock export." : "A dated rental stock export is needed to confirm this company’s current gear."));
      return;
    }
    const list=gearList(panel,r);
    const more = r.hires.length>6 ? group("More tool descriptions",r.hires.length-5) : null;
    for (const [index,tool] of r.hires.entries()) {
      const d=group(tool.name,null);
      d.classList.add("gear-entry");
      d.querySelector("summary").append(el("span","badge",units(tool.count,"asset")));
      gearTable(d,tool,r);
      (more && index>=5 ? more : list).append(d);
    }
    if (more) {more.classList.add("more-tools");list.append(more);}
  }
  function handoverPanel(parent,r) {
    const label=personal ? "Before you leave" : "Before your crew leaves";
    const panel=section(parent,label,null,true);
    if (r.asat || r.coverage?.rental_asat) {
      const link=el("a","handover-current",r.hire_count ? "Review "+units(r.hire_count,"asset")+" still on hire" : "View the clear on-hire list");
      link.href="#current-gear";
      panel.append(link);
    }
    panel.id="handover";
    const list=el("ul","handover-actions");
    const instructions=personal ? [
      ["At shift end","Return any gear you no longer need to the tool store."],
      ["Before you leave site","Return all gear on your card."]
    ] : [
      ["At shift end","Ask your crew to return any unneeded gear to the tool store."],
      ["Before anyone leaves site","Check that all gear on their card has been returned."]
    ];
    for (const [heading,body] of instructions) {
      const item=el("li");
      item.append(el("strong","",heading),el("p","",body));
      list.append(item);
    }
    panel.append(list,el("p","handover-updates note","The tool store updates reports throughout the day and night. Gear returned after the stock snapshot can still appear on this list. Speak to the tool store controller at any time for a fresh copy or if anything looks wrong."));
  }
  const validCount = n => Number.isSafeInteger(n) && n >= 0;
  function earnedRating(record) {
    return validCount(record?.eligible) && record.eligible >= 5 && finite(record.score) &&
      record.score >= 1 && record.score <= 5;
  }
  function stars(value, prefix="rating") {
    const chart=svgNode("svg",{viewBox:"0 0 278 54",class:"rating-stars","aria-hidden":"true",focusable:"false"});
    const defs=svgNode("defs"),path="M24 3.1 30.3 16.3 45.1 18.4 34.4 28.9 37 43.7 24 36.7 11 43.7 13.6 28.9 2.9 18.4 17.7 16.3Z";
    const clip=svgNode("clipPath",{id:prefix+"-star-cut"});
    clip.append(svgNode("path",{d:path}));defs.append(clip);
    for(const [id,colours] of [
      [prefix+"-copper",["#ffe6b0","#ff9953","#fe7635","#bf491c"]],
      [prefix+"-steel",["#586474","#354150","#27313b","#1b232d"]]
    ]) {
      const grad=svgNode("linearGradient",{id,x1:"0",x2:".4",y1:"0",y2:"1"});
      colours.forEach((c,i)=>grad.append(svgNode("stop",{offset:[0,.32,.56,1][i],"stop-color":c})));
      defs.append(grad);
    }
    chart.append(defs);
    for(let i=0;i<5;i++){
      const amount=Math.max(0,Math.min(1,value-i));
      const anchor=svgNode("g",{transform:"translate("+(i*56+2)+" 3)"});
      const face=svgNode("g",{class:"rating-face"});
      face.append(svgNode("path",{d:path,fill:"url(#"+prefix+"-steel)",stroke:"#8b99a9","stroke-width":"1.35","stroke-linejoin":"round"}));
      if(amount>0){
        const cut=svgNode("g",{"clip-path":"url(#"+prefix+"-star-cut)"});
        // The symmetric star spans x=2.9..45.1. A half rating ends at the centre point.
        const w=2.9+(45.1-2.9)*amount;
        cut.append(svgNode("rect",{x:0,y:0,width:w,height:48,fill:"url(#"+prefix+"-copper)",class:"rating-fill"}));
        const clippedGlint=svgNode("svg",{x:0,y:0,width:w,height:48,overflow:"hidden"});
        clippedGlint.append(svgNode("path",{d:"M-13 0H-6L-23 48H-30Z",fill:"white",class:"rating-reflection"}));
        cut.append(clippedGlint);face.append(cut);
      }
      anchor.append(face);chart.append(anchor);
    }
    return chart;
  }
  function revealRating(panel) {
    if(ratingObserver)ratingObserver.disconnect();
    if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    ratingObserver=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)) {
        panel.classList.add("rating-seen");
        ratingObserver?.disconnect();ratingObserver=null;
      }
    },{threshold:.12});
    ratingObserver.observe(panel);
  }
  function coveredTransactions(cov) {
    if (!cov?.transactions_asat) return false;
    const periods=cov.transaction_periods ?? [{start:cov.period_start,end:cov.period_end}];
    return periods.some(p=>p.start && p.end);
  }
  function coveredActivity(days,cov) {
    const tools=coveredTransactions(cov), sales=Boolean(cov?.sales_asat);
    if (tools && sales) return days;
    return days.map(d=>({...d,issued:tools ? d.issued : null,returned:tools ? d.returned : null,
      consumable_units:sales ? d.consumable_units : null,consumable_returns:sales ? d.consumable_returns : null}))
      .filter(d=>dailyWords(d));
  }
  function returnsPanel(parent,r) {
    const ret=(personal ? r.returns : r.return_rating) || {};
    const panel=section(parent,personal ? "Your return record" : "Crew return record",null,true);
    panel.id="return-rating";panel.tabIndex=-1;panel.classList.add("return-panel");
    if (!coveredTransactions(r.coverage)) {
      panel.append(el("p","empty","A tool transaction export with a dated reporting period is needed to show your return record."));return;
    }
    panel.append(el("p","note","Tool transaction export · "+when(r.coverage.transactions_asat)+" AEST"));
    const earned=earnedRating(ret), qualifying=validCount(ret.eligible) && ret.eligible<5;
    const stage=el("div","rating-stage");
    const art=el("div","rating-display");
    if(earned){
      const score=el("strong","rating-value",fmt(ret.score));
      score.append(el("span",""," / 5"));
      art.append(el("p","rating-label","Same-day return rating"),score,stars(ret.score));
    } else if(qualifying) {
      art.append(el("p","rating-label","Same-day return rating"),el("strong","qualifying-label",personal ? "Building your rating" : "Building the crew rating"));
      const progress=el("div","qualifying-track");progress.setAttribute("aria-hidden","true");
      for(let i=0;i<5;i++)progress.append(el("span",i<ret.eligible?"qualified":""));
      art.append(progress);
    } else {
      art.append(el("strong","qualifying-label","Rating unavailable"));
    }
    stage.append(art);
    const evidence=el("div","rating-evidence");
    if(earned){
      evidence.append(el("strong","",fmt(ret.same_day)+" of "+fmt(ret.eligible)+" eligible hires"),el("p","","returned on their issue date."));
    } else if(qualifying) {
      evidence.append(el("strong","",fmt(ret.eligible)+" of 5 eligible completed hires"),el("p","","A score appears once five hires have a recorded issue and return in the same export period."));
    }
    stage.append(evidence);panel.append(stage);
    panel.append(el("p","note","Same-day means the issue and return share a calendar date in Queensland. Gear issued before midnight and returned after midnight counts as a next-day return, even on the same night shift. The rating measures timing, and due dates are assessed separately when recorded."));
    if (!personal) {
      panel.append(el("p","explain","The crew score combines eligible completed hires for this company. It uses one plus four times the share returned on their issue date, rounded to the nearest half star."));
      revealRating(panel);
      return;
    }
    const details=group("How your return record is calculated",null);
    details.append(factList([["Tool issues in the records",fmt(ret.issues)],["Tool returns in the records",fmt(ret.returned)]]));
    if(ret.method)details.append(el("p","explain",ret.method));
    if(ret.due_assessed>0){
      details.append(el("p","explain",fmt(ret.returned_by_due)+" of "+fmt(ret.due_assessed)+" completed hires with recorded due dates were returned by the due date."));
    } else details.append(el("p","explain",ret.due_dates_available ? "No completed returns have a due date available for assessment." : "SiteIQ supplies no due dates for these hires."));
    panel.append(details);
    revealRating(panel);
  }
  function consumablesPanel(parent, r) {
    const c = r.consumable_summary;
    const panel = section(parent,"Your consumable use","Quantities issued to your card in the sales records.");
    if (!r.coverage?.sales_asat) {panel.append(el("p","empty","A dated sales export is unavailable."));return;}
    panel.append(factList([["Units issued",fmt(c.units)],["Units returned",fmt(c.returned_units)],["Dates with a recorded draw",fmt(c.active_days)],["Units per recorded draw date",fmt(c.units_per_draw_day)]]));
    if (finite(c.previous_units_per_draw_day) && finite(c.recent_units_per_draw_day)) {
      panel.append(factList([
        ["Units per draw date, "+when(c.previous_start)+" to "+when(c.previous_end),fmt(c.previous_units_per_draw_day)],
        ["Units per draw date, "+when(c.recent_start)+" to "+when(c.recent_end),fmt(c.recent_units_per_draw_day)]
      ]));
    }
    if (finite(c.dated_units) && c.dated_units !== c.units) {
      panel.append(el("p","sub",fmt(c.dated_units)+" of "+fmt(c.units)+" issued units have usable dates for the daily rate."));
    }
    if (c.benchmark) {
      const b=c.benchmark;
      const label={high:"High-volume consumable use",within_range:"Within the comparison range",insufficient:"Insufficient comparison data"}[b.status];
      if (label) {
        const d=group("Your draw volume · "+label,null);
        const dates=when(b.period_start)+" to "+when(b.period_end);
        if (b.period_start && b.period_end) d.append(el("p","explain",dates+" · "+fmt(b.own_units)+" units recorded on your card."));
        d.append(el("p","explain",b.status==="insufficient" ? "This comparison requires at least ten other borrowers with dated draws and records from at least two dates." : "High volume means the number of units drawn exceeded the anonymous 90th-percentile benchmark for the same period. The reference uses at least ten other borrowers and two dates with dated draws. Different jobs can require different quantities."));
        panel.append(d);
      }
    }
    if (r.consumables.length) {
      const d = group("Consumable lines",r.consumables.length);
      table(d,["Consumable","Issued","Returned"],r.consumables.map(c => [c.name,fmt(c.quantity),fmt(c.returned)]),[1,2]); panel.append(d);
    } else {panel.append(el("p","empty","No consumable lines were found for your card in this export."));}
  }
  const units = (value, one, many = one + "s") => fmt(value) + " " + (value === 1 ? one : many);
  const shortDay = value => when(value).split(" ").slice(0,2).join(" ");
  function spanOf(first, last) {
    if (!first || !last) return "";
    if (first === last) return when(first);
    return (first.slice(0,4) === last.slice(0,4) ? shortDay(first) : when(first)) + " – " + when(last);
  }
  function dailyWords(d) {
    return [[d.issued,"tool issue"],[d.returned,"tool return"],[d.consumable_units,"consumable unit issued","consumable units issued"],[d.consumable_returns,"consumable unit returned","consumable units returned"]]
      .filter(([n])=>finite(n) && n>0).map(([n,one,many])=>units(n,one,many)).join(" · ");
  }
  function svgNode(tag,attrs={}) {
    const g=document.createElementNS("http://www.w3.org/2000/svg",tag);
    for(const [k,v] of Object.entries(attrs)) g.setAttribute(k,v);
    return g;
  }
  function movementChart(parent, activity) {
    const days=[...activity].sort((a,b)=>a.date.localeCompare(b.date)).slice(-7);
    if (!days.length) return;
    const toolDays=days.some(d=>[d.issued,d.returned].some(n=>validCount(n) && n>0));
    const series=toolDays ? ["issued","returned"] : ["consumable_units","consumable_returns"];
    const observed=toolDays ? validCount : n=>finite(n) && n>=0 && n<=Number.MAX_SAFE_INTEGER;
    const maximum=Math.max(0,...days.flatMap(d=>series.map(k=>d[k]).filter(observed)));
    if (!(maximum>0)) return;
    const power=10**Math.floor(Math.log10(maximum));
    const step=Math.min(Number.MAX_SAFE_INTEGER,[1,2,5,10].map(n=>n*power).find(n=>n>=maximum) || maximum);
    const top=16, bottom=111, left=30, right=424, band=(right-left)/days.length;
    const figure=el("figure","movement-figure");
    const cap=el("figcaption");
    cap.append(el("strong","",toolDays ? "Tool movements" : "Consumable movements"),el("span","",days.length===1 ? "One recorded date" : "Latest "+units(days.length,"recorded date")));
    figure.append(cap);
    const reading=n=>observed(n) ? fmt(n) : "unavailable";
    const chart=svgNode("svg",{viewBox:"0 0 434 140",role:"img","aria-label":(toolDays?"Tool":"Consumable")+" issues and returns by date. "+days.map(d=>shortDay(d.date)+", issued "+reading(d[series[0]])+", returned "+reading(d[series[1]])).join(". ")});
    const defs=svgNode("defs");
    const colours=[["#224c2a","#b5ed72","#d9fb98","#61a843","#3d722f"],["#214c3e","#a6e9bd","#d0fad5","#62ad87","#396c54"]];
    colours.forEach((cs,index)=>{
      const gradient=svgNode("linearGradient",{id:"movement-"+index});
      ["0%","19%","39%","67%","100%"].forEach((offset,i)=>gradient.append(svgNode("stop",{offset,"stop-color":cs[i]})));
      defs.append(gradient);
    });
    chart.append(defs);
    for (const tick of [0, ...(step%2===0?[step/2]:[]), step]) {
      const y=bottom-(bottom-top)*tick/step;
      chart.append(svgNode("line",{x1:left,y1:y,x2:right,y2:y,class:"chart-rule"}));
      const label=svgNode("text",{x:left-5,y:y+4,"text-anchor":"end",class:"axis-value"});
      label.textContent=tick>=1000 ? new Intl.NumberFormat("en-AU",{notation:"compact",maximumFractionDigits:1}).format(tick) : fmt(tick);
      chart.append(label);
    }
    days.forEach((day,i)=>{
      const mid=left+band*(i+.5),w=Math.min(band*.25,18);
      series.forEach((key,j)=>{
        const n=day[key], x=mid+(j===0 ? -w-1.2 : 1.2);
        if (!observed(n)) {
          chart.append(svgNode("line",{class:"chart-unavailable",x1:x+w*.25,x2:x+w*.75,y1:bottom-2,y2:bottom-2,stroke:"currentColor"}));
          return;
        }
        if (!n) return;
        const height=(bottom-top)*(n/step), y=bottom-height, bounds="movement-cut-"+i+"-"+j;
        const cut=svgNode("clipPath",{id:bounds});
        cut.append(svgNode("rect",{x,y,width:w,height}));defs.append(cut);
        const bar=svgNode("g",{class:j ? "movement-return" : "movement-issue","clip-path":"url(#"+bounds+")"});
        const cap=Math.min(2,height*.17);
        bar.append(svgNode("rect",{x,y:y+cap,width:w,height:Math.max(0,height-cap*2),fill:"url(#movement-"+j+")"}));
        bar.append(svgNode("ellipse",{cx:x+w/2,cy:bottom-cap,rx:w/2,ry:cap,fill:"url(#movement-"+j+")"}));
        bar.append(svgNode("ellipse",{cx:x+w/2,cy:y+cap,rx:w/2,ry:cap,fill:j===0?"#d9fb98":"#d0fad5"}));
        if(height>=13 && w>=7){
          bar.append(svgNode("line",{x1:x+w*.24,y1:y+cap*2,x2:x+w*.24,y2:bottom-cap*2,stroke:"white","stroke-opacity":".32","stroke-width":".65"}));
          const bubble=svgNode("circle",{cx:x+w*.62,cy:y+7,r:Math.min(1.5,w*.1),class:"chart-bubble"});
          bar.append(bubble);
        }
        chart.append(bar);
      });
      const l=svgNode("text",{x:mid,y:131,"text-anchor":"middle",class:"axis-date"});
      l.textContent=shortDay(day.date);chart.append(l);
    });
    figure.append(chart);
    const legend=el("div","movement-legend");
    legend.append(el("span","key-issue","Issued"),el("span","key-return","Returned"));
    if (days.some(d=>series.some(k=>!observed(d[k])))) legend.append(el("span","key-unknown","Unavailable"));
    figure.append(legend);
    parent.append(figure);
  }
  function itemMix(parent,summary) {
    for (const [title,lines,keys] of [
      ["Tool issues and returns by description",summary.equipment||[],["issued","returned"]],
      ["Consumables issued and returned",summary.consumables||[],["quantity","returned"]]
    ]) {
      if (!lines.length) continue;
      const d=group(title,lines.length);
      table(d,["Description","Issued","Returned"],lines.map(t=>[t.name,fmt(t[keys[0]]),fmt(t[keys[1]])]),[1,2]);
      parent.append(d);
    }
  }
  function activityTable(parent,days) {
    if (!days.length) return;
    const d=group("Daily tool-store record",days.length);
    const events=el("ol","timeline");
    for(const day of [...days].sort((a,b)=>b.date.localeCompare(a.date))) {
      const li=el("li");
      li.append(el("strong","",when(day.date)),el("p","sub",dailyWords(day)||"Transaction recorded"));
      events.append(li);
    }
    d.append(events);parent.append(d);
  }
  function recordedPeriod(parent,cov) {
    if (!cov) return;
    const dates=(cov.transaction_periods ?? [{start:cov.period_start,end:cov.period_end}]).filter(p=>p.start && p.end);
    const facts=dates.map(p=>["Tool transaction period",when(p.start)+" – "+when(p.end)]);
    for(const [key,label] of [["rental_asat","Rental stock pull"],["transactions_asat","Tool transaction pull"],["sales_asat","Sales pull"]]) {
      if(cov[key]) facts.push([label,when(cov[key])]);
    }
    if (!facts.length) return;
    const details=group("Source dates and export times (AEST)",null);details.append(factList(facts));parent.append(details);
  }
  function currentStory(parent,r,chapter) {
    const coverage=chapter?.coverage || r.coverage || {};
    const days=coveredActivity(chapter?.activity || r.activity || [],coverage);
    const panel=section(parent,personal ? "Your shutdown at the tool store" : "The shutdown at the tool store",null,true);
    panel.classList.add("record-panel");panel.id="shutdown-story";
    const head=panel.querySelector("h2");
    const dates=days.map(day=>day.date).sort();
    const span=spanOf(r.store_activity?.first_at?.slice(0,10) || dates[0],r.store_activity?.last_at?.slice(0,10) || dates.at(-1));
    if (span) head.before(el("p","section-date",span));
    window.MMGStoreStory.append(panel,r);
    if ((!coveredTransactions(coverage) && !coverage.sales_asat) || (!chapter && !days.length)) {
      if (!r.store_activity?.has_coverage) panel.append(el("p","empty","Dated activity for this shutdown is unavailable in these exports."));
      return;
    }
    const spread=el("div","story-spread");panel.append(spread);
    const copy=el("div","story-copy");spread.append(copy);
    if (days.length) {
      const transactions=coveredTransactions(coverage);
      const issues=chapter?.issues ?? r.returns?.issues, returns=chapter?.returned ?? r.returns?.returned;
      const drew=chapter?.consumable_units ?? r.consumable_summary?.units;
      const lines=[];
      if (transactions && finite(issues) && finite(returns)) lines.push(units(issues,"tool issue")+" and "+units(returns,"tool return"));
      if (!lines.length && coverage.sales_asat && finite(drew)) lines.push(units(drew,"consumable unit issued","consumable units issued"));
      copy.append(el("p","story-lede",lines.length ? "The records show "+lines.join(", ")+" in the available exports." : "The tool store recorded activity on "+units(days.length,"date")+"."));
      const latest=days.reduce((a,b)=>a.date>b.date?a:b);
      copy.append(el("p","latest","Latest recorded date · "+when(latest.date)),el("p","latest-events",dailyWords(latest)||"Recorded tool-store transaction"));
      movementChart(spread,days);
    } else if (!r.store_activity?.active_days) {
      copy.append(el("p","empty",personal?"No dated transactions are linked to your card for this shutdown.":"No dated transactions are linked to this company for this shutdown."));
    }
    panel.append(el("p","note",personal?"Dates reflect recorded tool-store activity. Attendance and hours worked are not supplied.":"Tool and consumable transactions describe the store activity recorded for this company."));
    const favourites=[];
    for (const [label,lines,key,unit] of [
      ["Most-issued tool", coveredTransactions(coverage) ? (chapter?.equipment || r.equipment || []) : [], "issued","issue"],
      ["Most-issued consumable", coverage.sales_asat ? (chapter?.consumables || r.consumables || []) : [], "quantity","unit"]
    ]) {
      const high=lines.reduce((n,row)=>Math.max(n,Number(row[key]) || 0),0);
      if (!high) continue;
      const leaders=lines.filter(row=>row[key]===high).map(row=>row.name).filter(Boolean);
      if (leaders.length) favourites.push([label+(leaders.length>1 ? " (tied)" : ""),leaders.join(" · ")+" — "+units(high,unit)+(leaders.length>1 ? " each" : "")]);
    }
    if (favourites.length) {
      const mix=group("Equipment and supplies used most",null);
      mix.append(factList(favourites));panel.append(mix);
    }
    activityTable(panel,days);
    if (!personal && chapter) itemMix(panel,{equipment:coveredTransactions(coverage) ? chapter.equipment : [],consumables:coverage.sales_asat ? chapter.consumables : []});
    recordedPeriod(panel,coverage);
  }
  function earlierChapters(parent,r) {
    const prior=(r.story||[]).filter(c=>!c.current);
    const chapters=prior.length ? prior : r.history || [];
    const panel=section(parent,"Earlier shutdowns",null,true);
    panel.id="past-chapters";
    if (!chapters.length) {
      panel.append(el("p","empty",personal?"No verified earlier MMG shutdown is linked to your card.":"No verified earlier MMG shutdown is linked to this company."));
      return;
    }
    const list=el("div","chapter-list");panel.append(list);
    for (const ch of chapters) {
      const chapter=group(ch.schedule,null);list.append(chapter);
      const cov=ch.coverage || {};
      const metric=(value,stamp)=>stamp && finite(value) ? fmt(value) : "Unavailable";
      const tools=coveredTransactions(cov);
      const days=coveredActivity(ch.activity || [],cov);
      const dates=days.map(day=>day.date).sort();
      const span=spanOf(r.store_activity?.first_at?.slice(0,10) || dates[0],r.store_activity?.last_at?.slice(0,10) || dates.at(-1));
      if(span)chapter.append(el("p","section-date",span));
      const sameDay=tools && finite(ch.same_day) && finite(ch.eligible)
        ? fmt(ch.same_day)+" of "+fmt(ch.eligible)+" eligible completed hires" : "Unavailable";
      const pairs=[
        ["Recorded activity dates",metric(ch.activity ? days.length : ch.activity_days,tools || cov.sales_asat)],
        ["Tool issues",metric(ch.issues,tools)],
        ["Tool returns",metric(ch.returned,tools)],
        ["Same-day returns",sameDay],
        ["Consumable units issued",metric(ch.consumable_units,cov.sales_asat)],
        ["Consumable units returned",metric(ch.consumable_returns,cov.sales_asat)]
      ];
      if(cov.rental_asat) pairs.push(["Assets on hire at "+when(cov.rental_asat)+" AEST",metric(ch.hire_count,cov.rental_asat)]);
      chapter.append(factList(pairs));
      activityTable(chapter,days);
      itemMix(chapter,{equipment:tools ? ch.equipment : [],consumables:cov.sales_asat ? ch.consumables : []});
      recordedPeriod(chapter,cov);
    }
  }
  function historyPanel(parent,r) {
    if (!r.rental_history?.length) return;
    const panel=section(parent,"Individual hire records","Issue and return times recorded against the assets on your card.",true);
    if(r.coverage?.transactions_asat) panel.append(el("p","note","Tool transaction export · "+when(r.coverage.transactions_asat)+" AEST. Check the current gear list for the rental stock position."));
    const d=group("View individual hires",r.rental_history.length);
    table(d,["Tool / asset","Issued (AEST)","Returned (AEST)"],r.rental_history.map(t=>[
      [t.name,t.item].filter(Boolean).join(" · "),when(t.issued_at)||"Issue date unavailable",when(t.returned_at)||"No return in this export"
    ]));
    panel.append(d);
  }
  function companyMilestones(parent,r) {
    const panel=section(parent,"Company work milestones","Work updates contributed by the company and reviewed by the tool store.",true);
    panel.id="work-milestones";
    const notes=r.work_notes||[];
    if(notes.length) {
      const list=el("ol","milestone-list");
      for (const note of notes) {
        const li=el("li"), time=el("time","",when(note.date));
        time.dateTime=note.date;
        li.append(time,el("h3","",note.title),el("p","",note.description));list.append(li);
      }
      panel.append(list);
    } else {panel.append(el("p","empty","There are no approved work milestones for this company yet."));}
    const d=group("Add a work milestone",null);d.classList.add("work-contribution");
    const form=el("form","work-form");
    form.append(el("p","","Describe the work completed. Leave out names and personal details."));
    for(const [key,label,max] of [["date","Work date",0],["title","Title",90],["description","Work completed",600]]) {
      const input=el(key==="description"?"textarea":"input");input.id="work-"+key;input.name=key;input.required=true;
      if(key==="date") input.type="date";else input.maxLength=max;
      if(key==="description")input.rows=3;
      const tag=el("label","",label);tag.htmlFor=input.id;form.append(tag,input);
    }
    const submit=el("button","primary","Submit for review");submit.type="submit";
    const feedback=el("p","message");feedback.setAttribute("role","status");
    form.append(submit,feedback);d.append(form);panel.append(d);
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      if(!form.reportValidity() || submit.disabled || !transaction) return;
      const mine=transaction;
      const body=Object.fromEntries(new FormData(form));body.company=selection;
      if(!body.title.trim() || !body.description.trim()){feedback.textContent="Enter a title and description for the milestone.";return;}
      submit.disabled=true;feedback.textContent="Sending milestone…";
      try {
        const result=await json(await fetch("work-note",{...requestOptions(),signal:mine.signal,method:"POST",headers:{"Content-Type":"application/json","X-Portal":"1"},body:JSON.stringify(body)}));
        if(mine!==transaction) return;
        if(result.ok!==true)throw new Error("The milestone could not be submitted. Try again.");
        form.reset();feedback.textContent="Sent to the tool store for review.";
      } catch(err){if(mine===transaction && err.name!=="AbortError")feedback.textContent=err.message;}
      finally{if(mine===transaction)submit.disabled=false;}
    });
  }
  function clearIdentity() {
    window.QRItemQuery?.reset();
    $("report-heading").textContent="";
    $("name-rating").replaceChildren();
    $("direction-strap").replaceChildren();
    $("direction-instrument").replaceChildren();
  }
  function render(r) {
    if (r.kind !== (personal ? "person" : "company") || !Array.isArray(r.hires)) throw new Error("The selected report is unavailable.");
    clearIdentity();
    const body=$("report-body");body.replaceChildren();
    const chapter=(r.story||[]).find(c=>c.current);
    $("report-heading").textContent=r.name;
    const who=personal && r.company ? r.company+" · " : "";
    $("report-subtitle").textContent=who+rentalSnapshot(r);
    const cov=chapter?.coverage || r.coverage || {};
    const tools=coveredTransactions(cov);
    const holdingsAvailable=Boolean(r.asat || cov.rental_asat || r.hires.length);
    $("hero-count").textContent=fmt(holdingsAvailable ? r.hire_count : null);
    const handover=r.handover || {};
    const shift=handover.shift;
    $("hero-label").textContent=!holdingsAvailable ? "Rental snapshot needed" : !r.hire_count ? "Nothing outstanding at this snapshot" :
      (!personal && finite(handover.current_holders) ? units(handover.current_holders,"identified holder") : units(r.hires.length,"equipment type"));
    const eligible=personal ? r.returns?.eligible : r.return_rating?.eligible;
    const score=personal ? r.returns?.score : r.return_rating?.score;
    const earned=tools && earnedRating(personal ? r.returns : r.return_rating);
    const ratingStatus=earned ? fmt(score)+" / 5 · same-day returns" :
      tools && validCount(eligible) && eligible<5 ? "Building rating · "+fmt(eligible)+" of 5 hires" : "Rating awaiting records";
    $("name-rating").append(stars(earned ? score : 0,"identity"),el("span","rating-status",ratingStatus));
    $("direction-strap").textContent=personal ?
      (cov.sales_asat ? units(r.consumable_summary.units,"consumable unit")+" issued this shutdown" : "Consumables · sales data unavailable") :
      (finite(handover.unassigned_assets) && handover.unassigned_assets>0 ? units(handover.unassigned_assets,"asset")+" without a confirmed individual holder" :
      "Crew holdings at the rental stock snapshot");
    const periods=cov.transaction_periods ?? [{start:cov.period_start,end:cov.period_end}];
    const lastPeriod=periods.filter(p=>p.start && p.end).map(p=>p.end).sort().at(-1);
    const cutoff=lastPeriod && cov.transactions_asat ? [lastPeriod,cov.transactions_asat].sort()[0] : null;
    const workerCaption=cutoff ? "Transactions to "+when(cutoff)+" AEST" : "Tool transactions";
    window.MMGReportInstruments.mount($("direction-instrument"),{
      issued:personal ? (tools ? r.returns.issues : null) : shift?.issued,
      returned:personal ? (tools ? r.returns.returned : null) : shift?.returned,
      company:!personal,caption:personal ? workerCaption : shift ? "Last completed "+shift.name.toLowerCase()+" shift" : "Shift figures unavailable"
    });
    const ordered=orderedHoldings(r);
    if (personal) {
      personalHires(body,ordered);
    } else {
      window.QRHandover.shift(body,r);
      window.QRHandover.oldest(body,r);
      hires(body,ordered);
    }
    window.QRHandover.receipt(body,r);
    currentStory(body,r,chapter);
    returnsPanel(body,r);
    handoverPanel(body,r);
    const days=coveredActivity(chapter?.activity || r.activity || [],cov);
    const pairs=[
      ["Recorded activity dates",r.store_activity?.has_coverage ? fmt(r.store_activity.active_days) : tools || cov.sales_asat ? fmt(days.length) : "Unavailable"],
      ["Tool issues",tools ? fmt(chapter?.issues ?? r.returns?.issues) : "Unavailable"],
      ["Consumable units issued",cov.sales_asat ? fmt(chapter?.consumable_units ?? r.consumable_summary?.units) : "Unavailable"]
    ];
    stats(body,pairs);
    if(personal){consumablesPanel(body,r);historyPanel(body,r);}
    if(!personal)companyMilestones(body,r);
    earlierChapters(body,r);
    const links = personal ? [] : [["shift-review","Crew shift"],["oldest-held","Longest held"]];
    links.push(["current-gear","Current gear"],["return-receipt","Last return"],["shutdown-story","Store activity"],["return-rating","Return record"]);
    links.push(["handover","Shift handover"]);
    if (!personal) links.push(["work-milestones","Work milestones"]);
    links.push(["past-chapters","Earlier shutdowns"]);
    const sectionNav = $("section-nav");
    sectionNav.replaceChildren();
    for (const [id,title] of links) {
      const section = $(id);
      section.tabIndex = -1;
      const link = el("a","",title);
      link.href = "#" + id;
      if(id==="current-gear")link.setAttribute("aria-current","location");
      sectionNav.append(link);
    }
    $("trail-current").textContent = "Report";
    $("pull").textContent=r.asat ? "SiteIQ rental stock pull "+when(r.asat)+" AEST" : "SiteIQ rental stock pull time unavailable.";
    $("lookup").hidden=true;$("report").hidden=false;snapshot=r;$("report-heading").focus();
  }
  function syncSection() {
    sectionFrame=0;
    if ($("report").hidden) return;
    const links=Array.from($("section-nav").querySelectorAll("a"));
    if (!links.length) return;
    const top=Math.min(100,innerHeight*.18);
    let active=links[0];
    for (const link of links) {
      if ($(link.hash.slice(1)).getBoundingClientRect().top<=top) active=link;
    }
    if (window.scrollY+innerHeight>=document.documentElement.scrollHeight-2) active=links.at(-1);
    for (const link of links) {
      if(link===active)link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    }
  }
  window.addEventListener("scroll",()=>{
    if (!sectionFrame && !$("report").hidden) sectionFrame=requestAnimationFrame(syncSection);
  },{passive:true});
  async function lookup(event) {
    event?.preventDefault();
    if (personal) identity.value = stripBadgePadding(identity.value);
    const value = identity.value;
    if (!value || !form.reportValidity()) return;
    renewDeadline();
    if (transaction) transaction.abort();
    stopCamera();
    transaction = new AbortController();
    clearIdentity();
    const mine = transaction; selection=value; pdf=null; pdfRequest=null;
    form.setAttribute("aria-busy","true"); form.querySelector("[type=submit]").disabled=true;
    status("Opening report…");
    try {
      const data = await json(await fetch(...endpoint(false)));
      if (mine === transaction) syncDeadline();
      if (mine !== transaction) return;
      render(data); identity.value=""; status();
    } catch (err) {
      if (mine !== transaction || err.name === "AbortError") return;
      selection=""; clearIdentity(); $("hero-count").textContent=""; $("hero-label").textContent=""; $("report-body").replaceChildren(); $("report-subtitle").textContent="";
      status(err.message,true);
    } finally {
      if (mine === transaction) {form.removeAttribute("aria-busy");form.querySelector("[type=submit]").disabled=false;}
    }
  }
  form.addEventListener("submit",lookup);
  $("print").addEventListener("click",() => window.print());
  window.addEventListener("beforeprint",() => {
    syncDeadline();
    if (!snapshot || printing) return;
    if (idleDialog.open) idleDialog.close();
    printing = true;
    clearTimeout(idleTimer);
    printClosed=Array.from($("report").querySelectorAll("details:not([open])"));
    printClosed.forEach(d => {d.open=true;});
  });
  window.addEventListener("afterprint",() => {
    if (!printing) return;
    printClosed.forEach(d => {d.open=false;});
    printClosed = [];
    printing = false;
    renewDeadline();
  });
  function fileInfo() {
    const label = personal ? "personal" : "company";
    return {name:"mmg-"+label+"-on-hire-report.pdf", title:personal ? "My MMG tool-store report" : "MMG company on-hire report"};
  }
  async function getPDF() {
    if (!snapshot || !selection) throw new Error("Open your report first.");
    if (pdf) return pdf;
    if (pdfRequest) return pdfRequest;
    const mine=transaction;
    pdfRequest=(async () => {
      const response=await fetch(...endpoint(true));
      if (!response.ok) await json(response);
      const blob=await response.blob();
      if (await blob.slice(0,5).text() !== "%PDF-") throw new Error("The PDF is unavailable. Try again or use Print.");
      if (mine === transaction) syncDeadline();
      if (mine !== transaction) throw new DOMException("Report closed","AbortError");
      pdf=blob; return blob;
    })();
    try {return await pdfRequest;} finally {if (mine===transaction) pdfRequest=null;}
  }
  function download(blob) {
    const url=URL.createObjectURL(blob);
    const link=el("a");link.download=fileInfo().name;link.href=url;
    document.body.append(link);link.click();link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1500);
  }
  $("save").addEventListener("click",async () => {
    const mine = transaction;
    status("Preparing PDF…");
    try {
      const blob = await getPDF();
      if (mine !== transaction) return;
      download(blob);
      status("PDF ready. Use your browser’s downloads or save menu to keep it.");
    } catch(err) {if(mine === transaction && err.name !== "AbortError") status(err.message,true);}
  });
  const pdfFile=blob => new File([blob],fileInfo().name,{type:"application/pdf"});
  async function sendDialog(email) {
    const mine=++dialogGeneration;
    $("send-title").textContent=email ? "Email this PDF" : "Share this PDF";
    $("send-status").textContent="Preparing PDF…";
    $("native-share").hidden=true;$("dialog-save").disabled=true;$("email-draft").hidden=true;
    dialog.showModal();
    try {
      const blob=await getPDF();
      if (!dialog.open || mine !== dialogGeneration) return;
      let native=false;
      try {native=!!(navigator.share && navigator.canShare?.({files:[pdfFile(blob)]}));} catch(_) {}
      $("native-share").hidden=!native;
      $("native-share").textContent=email ? "Choose email app" : "Share PDF";
      $("dialog-save").disabled=false;
      $("email-draft").hidden=!email;
      $("email-draft").href="mailto:?subject="+encodeURIComponent(fileInfo().title);
      $("send-status").textContent=email
        ? (native ? "Choose your email app to attach the PDF, or save the file and attach it to an email draft." : "Save the PDF, open an email draft, then attach the saved file before sending.")
        : (native ? "Choose an app to share the PDF, or save a copy." : "Save the PDF, then share the file from your downloads.");
    } catch(err) {if (mine===dialogGeneration && err.name!=="AbortError") $("send-status").textContent=err.message;}
  }
  $("share").addEventListener("click",() => sendDialog(false));
  $("email").addEventListener("click",() => sendDialog(true));
  $("close-dialog").addEventListener("click",() => dialog.close());
  dialog.addEventListener("close",() => {dialogGeneration++;});
  $("dialog-save").addEventListener("click",()=> {if(pdf)download(pdf);});
  $("native-share").addEventListener("click",async () => {
    if (!pdf) return;
    const mine = dialogGeneration;
    try {await navigator.share({files:[pdfFile(pdf)],title:fileInfo().title});}
    catch(err){if(mine === dialogGeneration && err.name!=="AbortError")$("send-status").textContent="Your device could not share the PDF. Save it and attach the file in your preferred app.";}
  });
  function stopCamera() {
    scanGeneration++;
    clearTimeout(scanTimer);
    if (media) {
      media.getTracks().forEach(track => track.stop());
      media = null;
    }
    if (personal) {
      $("preview").pause();
      $("preview").srcObject = null;
      $("scan-box").hidden = true;
    }
  }
  function loadBarcodeLibrary() {
    if (!decoderRequest) {
      decoderRequest = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "badge_zxing.js";
        script.onload = () => resolve(window.ZXing);
        script.onerror = () => {
          decoderRequest = null;
          script.remove();
          reject(new Error("Could not load the barcode reader."));
        };
        document.head.append(script);
      });
    }
    return decoderRequest;
  }
  const barcodeFormats = ["code_128", "code_39", "ean_13", "ean_8", "qr_code"];
  async function nativeBarcodeReader() {
    try {
      if (!window.BarcodeDetector) return null;
      const available = await window.BarcodeDetector.getSupportedFormats();
      if (barcodeFormats.every(format => available.includes(format))) {
        return new window.BarcodeDetector({formats: barcodeFormats});
      }
    } catch (_) { /* The locally bundled decoder also handles these formats. */ }
    return null;
  }
  async function localBarcodeReader() {
    const library = await loadBarcodeLibrary();
    const reader = new library.MultiFormatReader();
    reader.setHints(new Map([
      [library.DecodeHintType.POSSIBLE_FORMATS, barcodeFormats.map(format => library.BarcodeFormat[format.toUpperCase()])],
      [library.DecodeHintType.TRY_HARDER, true]
    ]));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {willReadFrequently: true});
    return function readFrame(video) {
      const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(video.videoHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.drawImage(video, 0, 0, width, height);
      const source = new library.HTMLCanvasElementLuminanceSource(canvas);
      try {
        const result = reader.decodeWithState(new library.BinaryBitmap(new library.HybridBinarizer(source)));
        return result.getText();
      } catch (_) {
        return ""; // An empty, blurred or moving frame is normal between reads.
      }
    };
  }
  function stripBadgePadding(value) {
    return value.replace(/^ +| +$/g, "");
  }
  function scannedBarcode(raw) {
    if (typeof raw !== "string") return "";
    const value = stripBadgePadding(raw);
    if (!value || value.length > identity.maxLength || value !== value.trim()
        || /[\u0000-\u001f\u007f-\u009f]/u.test(value)
        || /^(?:[a-z][\w+.-]*:|[\\/]{2}|www\.)/i.test(value)) return "";
    return value;
  }
  async function startCamera() {
    renewDeadline();
    stopCamera();
    status("");
    const mine = scanGeneration;
    const view = $("preview");
    $("scan-box").hidden = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: {facingMode: {ideal: "environment"}, width: {ideal: 1280}, height: {ideal: 720}}
      });
      if (mine !== scanGeneration) {stream.getTracks().forEach(track => track.stop()); return;}
      media = stream;
      view.srcObject = stream;
      await view.play();
      let detector = await nativeBarcodeReader();
      let readFrame = detector ? null : await localBarcodeReader();
      let prior = "";
      async function tick() {
        if (mine !== scanGeneration) return;
        try {
          if (view.readyState >= 2 && view.videoWidth && view.videoHeight) {
            let values = [];
            if (detector) {
              try {
                values = [...new Set((await detector.detect(view)).map(hit => hit.rawValue))];
              } catch (_) {
                detector = null;
                readFrame = await localBarcodeReader();
              }
            }
            if (mine !== scanGeneration) return;
            if (readFrame) values = [readFrame(view)];
            const value = values.length === 1 ? scannedBarcode(values[0]) : "";
            if (value && value === prior) {
              stopCamera();
              identity.value = value;
              identity.focus();
              status("Barcode read. Check the number, then select View my report.");
              return;
            }
            if (values.length > 1) status("Hold one barcode inside the frame.");
            else if (values[0] && !value) status("Scan your assigned barcode number.");
            prior = value;
          }
          scanTimer = setTimeout(tick, 220);
        } catch (_) {
          if (mine === scanGeneration) {
            stopCamera();
            status("The scanner could not read this barcode. Enter your assigned barcode number.", true);
          }
        }
      }
      if (mine === scanGeneration) await tick();
    } catch (_) {
      if (mine === scanGeneration) {
        stopCamera();
        status("Camera unavailable. Allow camera access or enter your assigned barcode number.", true);
      }
    }
  }
  if (personal) {
    $("camera").hidden=!(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
    $("camera").addEventListener("click",startCamera);
    $("stop-scan").addEventListener("click",stopCamera);

  } else {companies();$("retry-companies").addEventListener("click",companies);}
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
    syncDeadline();
  });
  window.addEventListener("focus", syncDeadline);
  window.addEventListener("pagehide", () => endLookup());
  window.addEventListener("pageshow", event => {if (event.persisted) endLookup("Screen cleared.");});
  window.addEventListener("popstate", () => {if (expiresAt) endLookup("Screen cleared.");});
})();
