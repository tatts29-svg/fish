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
    for (const [key, value] of Object.entries({viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", "stroke-width":"1.7", "stroke-linecap":"round", "stroke-linejoin":"round", "aria-hidden":"true"})) svg.setAttribute(key,value);
    shape.setAttribute("d",path);
    svg.append(shape); btn.prepend(svg);
  }
  const icons = {
    print:"M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01",
    save:"M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5",
    share:"M12 15V3m-4 4 4-4 4 4M6 10H4v11h16V10h-2",
    email:"M3 5h18v14H3zM3 6l9 7 9-7",
    camera:"M3 7h4l2-3h6l2 3h4v13H3zM15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"
  };
  for (const [id,path] of Object.entries(icons)) buttonIcon(id,path);
  function endLookup() {
    ratingObserver?.disconnect();ratingObserver=null;
    if (transaction) transaction.abort();
    transaction = null;
    selection = ""; pdfRequest = null; pdf = null; snapshot = null;
    dialogGeneration++;
    if (dialog.open) dialog.close();
    stopCamera();
    $("report").hidden = true;
    $("report-body").replaceChildren();
    $("report-heading").textContent = "";
    $("hero-count").textContent = "";
    $("report-subtitle").textContent = "";
    $("pull").textContent = "SiteIQ pull time available with the report.";
    $("lookup").hidden = false;
    identity.value = "";
    form.querySelector("[type=submit]").disabled = !personal && identity.disabled;
    form.removeAttribute("aria-busy");
    status();
  }
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
    const panel = el("section",full ? "panel full" : "panel");
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
    const group = el("div","stats");
    for (const [title,value] of pairs) {
      const card = el("div","stat");
      card.append(el("strong","stat-value",value),el("span","stat-label",title));
      group.append(card);
    }
    parent.append(group);
  }
  function table(parent, headings, rows, numeric = []) {
    const wrap = el("div","table-wrap");
    const tbl = el("table");
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
  }
  function group(name, count) {
    const d = el("details","tool-group");
    const header = el("summary");
    header.append(el("span","summary-name",name));
    if (count !== null) header.append(el("span","badge",fmt(count)));
    d.append(header); return d;
  }
  function personalHires(parent,r) {
    const panel=section(parent,"Currently on hire to you",null,true);
    panel.id="current-gear";panel.tabIndex=-1;panel.classList.add("personal-hires");
    const captured=r.asat ? "SiteIQ rental stock at "+when(r.asat)+" AEST" : "SiteIQ rental stock time unavailable";
    panel.append(el("p","note",captured));
    if (!r.hires.length) {
      panel.append(el("p","no-holdings","No equipment was recorded on hire to you at this stock pull."));
      return;
    }
    for (const tool of r.hires) {
      const group=el("section","holding-group");
      const title=el("h3","",tool.name);
      if(tool.count>1) title.append(el("span","badge",units(tool.count,"asset")));
      group.append(title);
      table(group,["Asset number","On hire since (AEST)"],tool.items.map(a=>[
        a.item || "Number unavailable",when(a.date,a.time) || "Issue date unavailable"
      ]));
      panel.append(group);
    }
  }
  function hires(parent,r) {
    const panel = section(parent,"Gear on hire",
      r.asat ? "On-hire position at " + when(r.asat) + " AEST. Open a tool to see its asset numbers and recorded issue times." : "Open a tool to see its asset numbers and recorded issue times.",true);
    panel.id="current-gear";panel.tabIndex=-1;
    if (!r.hires.length) {panel.append(el("p","empty","No gear is recorded on hire to this company.")); return;}
    const more = r.hires.length>6 ? group("More tool descriptions",r.hires.length-5) : null;
    for (const [index,tool] of r.hires.entries()) {
      const d = group(tool.name,tool.count);
      const items = el("ul","data-list");
      for (const asset of tool.items) {
        const line = el("li");
        line.append(el("span","label",asset.item || "Asset number unavailable"),el("span","date",when(asset.date,asset.time) || "Issue time unavailable"));
        items.append(line);
      }
      d.append(items);
      (more && index>=5 ? more : panel).append(d);
    }
    if (more) {more.classList.add("more-tools");panel.append(more);}
  }
  function stars(value) {
    const chart=svgNode("svg",{viewBox:"0 0 278 54",class:"rating-stars","aria-hidden":"true",focusable:"false"});
    const defs=svgNode("defs"),path="M24 3.1 30.3 16.3 45.1 18.4 34.4 28.9 37 43.7 24 36.7 11 43.7 13.6 28.9 2.9 18.4 17.7 16.3Z";
    const clip=svgNode("clipPath",{id:"rating-star-cut"});
    clip.append(svgNode("path",{d:path}));defs.append(clip);
    for(const [id,colours] of [
      ["rating-copper",["#ffe6b0","#ff9953","#fe7635","#bf491c"]],
      ["rating-steel",["#586474","#354150","#27313b","#1b232d"]]
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
      face.append(svgNode("path",{d:path,fill:"url(#rating-steel)",stroke:"#8b99a9","stroke-width":"1.35","stroke-linejoin":"round"}));
      if(amount>0){
        const cut=svgNode("g",{"clip-path":"url(#rating-star-cut)"});
        // The symmetric star spans x=2.9..45.1. A half rating ends at the centre point.
        const w=2.9+(45.1-2.9)*amount;
        cut.append(svgNode("rect",{x:0,y:0,width:w,height:48,fill:"url(#rating-copper)",class:"rating-fill"}));
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
  function returnsPanel(parent,r) {
    const ret=r.returns;
    const panel=section(parent,"Your return record",null,true);
    panel.id="return-rating";panel.tabIndex=-1;panel.classList.add("return-panel");
    if (!r.coverage?.transactions_asat) {
      panel.append(el("p","empty","A dated transaction export is needed before your return record can be shown."));return;
    }
    const earned=finite(ret.score) && ret.score>=1 && ret.score<=5 && ret.eligible>=5;
    const stage=el("div","rating-stage");
    const art=el("div","rating-display");
    if(earned){
      const score=el("strong","rating-value",fmt(ret.score));
      score.append(el("span",""," / 5"));
      art.append(el("p","rating-label","Same-day return rating"),score,stars(ret.score));
    } else {
      art.append(el("p","rating-label","Same-day return rating"),el("strong","qualifying-label","Building your rating"));
      const progress=el("div","qualifying-track");progress.setAttribute("aria-hidden","true");
      for(let i=0;i<5;i++)progress.append(el("span",i<ret.eligible?"qualified":""));
      art.append(progress);
    }
    stage.append(art);
    const evidence=el("div","rating-evidence");
    if(earned){
      evidence.append(el("strong","",fmt(ret.same_day)+" of "+fmt(ret.eligible)+" eligible hires"),el("p","","returned on their issue date."));
    } else {
      evidence.append(el("strong","",fmt(ret.eligible)+" of 5 eligible completed hires"),el("p","","A score appears once five hires have a recorded issue and return in the same export period."));
    }
    stage.append(evidence);panel.append(stage);
    const details=group("How your return record is calculated",null);
    details.append(factList([["Tool issues in the records",fmt(ret.issues)],["Tool returns in the records",fmt(ret.returned)]]));
    if(ret.method)details.append(el("p","explain",ret.method));
    if(ret.due_dates_available && finite(ret.due_assessed)){
      details.append(el("p","explain",fmt(ret.returned_by_due)+" of "+fmt(ret.due_assessed)+" completed hires with recorded due dates were returned by the due date."));
    } else details.append(el("p","explain","SiteIQ supplies no due dates for these hires."));
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
    const toolDays=days.some(d=>d.issued>0 || d.returned>0);
    const series=toolDays ? ["issued","returned"] : ["consumable_units","consumable_returns"];
    const maximum=Math.max(...days.flatMap(d=>series.map(k=>d[k]||0)));
    if (!(maximum>0)) return;
    const power=10**Math.floor(Math.log10(maximum));
    const step=[1,2,5,10].map(n=>n*power).find(n=>n>=maximum);
    const top=16, bottom=111, left=30, right=424, band=(right-left)/days.length;
    const figure=el("figure","movement-figure");
    const cap=el("figcaption");
    cap.append(el("strong","",toolDays ? "Tool movements" : "Consumable movements"),el("span","",days.length===1 ? "One recorded date" : "Latest "+units(days.length,"recorded date")));
    figure.append(cap);
    const chart=svgNode("svg",{viewBox:"0 0 434 140",role:"img","aria-label":(toolDays?"Tool":"Consumable")+" issues and returns by date. "+days.map(d=>shortDay(d.date)+", "+fmt(d[series[0]])+" issued and "+fmt(d[series[1]])+" returned").join(". ")});
    const defs=svgNode("defs");
    const colours=[["#96431f","#ff954b","#ffc293","#ed672b","#9f3d16"],["#69727f","#b9c7d5","#eef3f7","#9ba9b9","#626e7e"]];
    colours.forEach((cs,index)=>{
      const gradient=svgNode("linearGradient",{id:"movement-"+index});
      ["0%","19%","39%","67%","100%"].forEach((offset,i)=>gradient.append(svgNode("stop",{offset,"stop-color":cs[i]})));
      defs.append(gradient);
    });
    chart.append(defs);
    for (const tick of [0, ...(step%2===0?[step/2]:[]), step]) {
      const y=bottom-(bottom-top)*tick/step;
      chart.append(svgNode("line",{x1:left,y1:y,x2:right,y2:y,class:"chart-rule"}));
      const label=svgNode("text",{x:left-5,y:y+4,"text-anchor":"end",class:"axis-value"});label.textContent=fmt(tick);chart.append(label);
    }
    days.forEach((day,i)=>{
      const mid=left+band*(i+.5),w=Math.min(band*.25,18);
      series.forEach((key,j)=>{
        const n=day[key]||0;
        if (n<=0) return;
        const height=(bottom-top)*n/step, y=bottom-height, x=mid+(j===0 ? -w-1.2 : 1.2);
        const bar=svgNode("g");
        const cap=Math.min(2,height*.17);
        bar.append(svgNode("rect",{x,y:y+cap,width:w,height:Math.max(0,height-cap*2),fill:"url(#movement-"+j+")"}));
        bar.append(svgNode("ellipse",{cx:x+w/2,cy:bottom-cap,rx:w/2,ry:cap,fill:"url(#movement-"+j+")"}));
        bar.append(svgNode("ellipse",{cx:x+w/2,cy:y+cap,rx:w/2,ry:cap,fill:j===0?"#ffb37e":"#d4dfe7"}));
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
    legend.append(el("span","key-issue","Issued"),el("span","key-return","Returned"));figure.append(legend);
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
    const days=chapter?.activity || r.activity || [];
    const panel=section(parent,personal ? "Your shutdown at the tool store" : "The shutdown at the tool store",null,true);
    panel.classList.add("record-panel");panel.id="shutdown-story";
    const head=panel.querySelector("h2");
    const first=chapter?.first_date || days.at(-1)?.date;
    const last=chapter?.last_date || days[0]?.date;
    const span=spanOf(first,last);
    if (span) head.before(el("p","section-date",span));
    if (!chapter && !days.length) {
      panel.append(el("p","empty","Dated activity for this shutdown is unavailable in these exports."));
      return;
    }
    const spread=el("div","story-spread");panel.append(spread);
    const copy=el("div","story-copy");spread.append(copy);
    if (days.length) {
      const transactions=chapter?.coverage?.transactions_asat || r.coverage?.transactions_asat;
      const issues=chapter?.issues ?? r.returns?.issues, returns=chapter?.returned ?? r.returns?.returned;
      const drew=chapter?.consumable_units ?? r.consumable_summary?.units;
      const lines=[];
      if (transactions && finite(issues) && finite(returns)) lines.push(units(issues,"tool issue")+" and "+units(returns,"tool return"));
      if (!lines.length && finite(drew)) lines.push(units(drew,"consumable unit issued","consumable units issued"));
      copy.append(el("p","story-lede",lines.length ? "The records show "+lines.join(", ")+" in the available exports." : "The tool store recorded activity on "+units(days.length,"date")+"."));
      const latest=days.reduce((a,b)=>a.date>b.date?a:b);
      copy.append(el("p","latest","Latest recorded date · "+when(latest.date)),el("p","latest-events",dailyWords(latest)||"Recorded tool-store transaction"));
      movementChart(spread,days);
    } else {
      copy.append(el("p","empty",personal?"No dated transactions are linked to your card for this shutdown.":"No dated transactions are linked to this company for this shutdown."));
    }
    panel.append(el("p","note",personal?"Dates reflect recorded tool-store activity. Attendance and hours worked are not supplied.":"Tool and consumable transactions describe the store activity recorded for this company."));
    activityTable(panel,days);
    if (!personal && chapter) itemMix(panel,chapter);
    recordedPeriod(panel,chapter?.coverage || r.coverage);
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
      const span=spanOf(ch.first_date,ch.last_date);
      if(span)chapter.append(el("p","section-date",span));
      const pairs=[["Recorded activity dates",fmt(ch.activity_days)],["Tool issues",fmt(ch.issues)],["Tool returns",fmt(ch.returned)],["Same-day returns",fmt(ch.same_day)+" of "+fmt(ch.eligible)+" eligible hires"],["Consumable units issued",fmt(ch.consumable_units)]];
      if(finite(ch.consumable_returns))pairs.push(["Consumable units returned",fmt(ch.consumable_returns)]);
      if(ch.coverage?.rental_asat && finite(ch.hire_count))pairs.push(["Assets on hire at "+when(ch.coverage.rental_asat),fmt(ch.hire_count)]);
      chapter.append(factList(pairs));
      activityTable(chapter,ch.activity||[]);itemMix(chapter,ch);recordedPeriod(chapter,ch.coverage);
    }
  }
  function historyPanel(parent,r) {
    if (!r.rental_history?.length) return;
    const panel=section(parent,"Individual hire records","Issue and return times recorded against the assets on your card.",true);
    const d=group("View individual hires",r.rental_history.length);
    table(d,["Tool / asset","Issue","Return"],r.rental_history.map(t=>[
      [t.name,t.item].filter(Boolean).join(" · "),when(t.issued_at)||"Issue unrecorded",when(t.returned_at)||"Return unrecorded"
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
  function render(r) {
    if (r.kind !== (personal ? "person" : "company") || !Array.isArray(r.hires)) throw new Error("The selected report is unavailable.");
    const body=$("report-body");body.replaceChildren();
    const chapter=(r.story||[]).find(c=>c.current);
    $("report-heading").textContent=r.name;
    const who=personal && r.company ? r.company+" · " : "";
    $("report-subtitle").textContent=who+(r.asat ? "Rental stock as at "+when(r.asat)+" AEST" : "Rental stock pull time unavailable");
    $("hero-count").textContent=fmt(r.hire_count);
    if(personal) {
      $("hero-label").textContent=(r.hire_count===1 ? "Asset" : "Assets")+" on hire to you";
      personalHires(body,r);returnsPanel(body,r);
    }
    const cov=chapter?.coverage || r.coverage || {};
    const pairs=[
      ["Recorded activity dates",fmt(chapter?.activity_days ?? r.activity?.length)],
      ["Tool issues",fmt(cov.transactions_asat ? (chapter?.issues ?? r.returns?.issues) : null)],
      ["Consumable units issued",fmt(cov.sales_asat ? (chapter?.consumable_units ?? r.consumable_summary?.units) : null)]
    ];
    stats(body,pairs);
    const recordNav=el("nav","record-links screen-only");recordNav.setAttribute("aria-label","Report sections");
    for(const [id,title] of [["shutdown-story","This shutdown"],["current-gear","Current gear"],...(!personal?[["work-milestones","Work milestones"]]:[]),["past-chapters","Earlier shutdowns"]]){
      const link=el("a","",title);link.href="#"+id;recordNav.append(link);
    }
    body.append(recordNav);
    currentStory(body,r,chapter);
    if(!personal)hires(body,r);
    if(personal){consumablesPanel(body,r);historyPanel(body,r);}
    if(!personal)companyMilestones(body,r);
    earlierChapters(body,r);
    $("pull").textContent=r.asat ? "SiteIQ rental stock pull "+when(r.asat)+" AEST" : "SiteIQ rental stock pull time unavailable.";
    $("lookup").hidden=true;$("report").hidden=false;snapshot=r;$("report-heading").focus();
  }
  async function lookup(event) {
    event?.preventDefault();
    const value = identity.value;
    if (!value || !form.reportValidity()) return;
    if (transaction) transaction.abort();
    stopCamera();
    transaction = new AbortController();
    const mine = transaction; selection=value; pdf=null; pdfRequest=null;
    form.setAttribute("aria-busy","true"); form.querySelector("[type=submit]").disabled=true;
    status("Opening report…");
    try {
      const data = await json(await fetch(...endpoint(false)));
      if (mine !== transaction) return;
      render(data); identity.value=""; status();
    } catch (err) {
      if (mine !== transaction || err.name === "AbortError") return;
      selection=""; $("report-body").replaceChildren(); $("report-heading").textContent=""; $("report-subtitle").textContent="";
      status(err.message,true);
    } finally {
      if (mine === transaction) {form.removeAttribute("aria-busy");form.querySelector("[type=submit]").disabled=false;}
    }
  }
  form.addEventListener("submit",lookup);
  $("reset").addEventListener("click",() => {endLookup();identity.focus();});
  $("print").addEventListener("click",() => window.print());
  window.addEventListener("beforeprint",() => {
    printClosed=Array.from($("report").querySelectorAll("details:not([open])"));
    printClosed.forEach(d => {d.open=true;});
  });
  window.addEventListener("afterprint",() => {printClosed.forEach(d => {d.open=false;});printClosed=[];});
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
    status("Preparing PDF…");
    try {const blob=await getPDF();download(blob);status("PDF ready. Use your browser’s downloads or save menu to keep it.");}
    catch(err){if(err.name!=="AbortError")status(err.message,true);}
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
    try {await navigator.share({files:[pdfFile(pdf)],title:fileInfo().title});}
    catch(err){if(err.name!=="AbortError")$("send-status").textContent="Your device could not share the PDF. Save it and attach the file in your preferred app.";}
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
  function usableBarcode(value) {
    return typeof value === "string" && value.length > 0 && value.length <= identity.maxLength
      && value === value.trim() && !/[\u0000-\u001f\u007f-\u009f]/u.test(value)
      && !/^(?:[a-z][\w+.-]*:|[\\/]{2}|www\.)/i.test(value);
  }
  async function startCamera() {
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
            const value = values.length === 1 && usableBarcode(values[0]) ? values[0] : "";
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
    document.addEventListener("visibilitychange",()=> {if(document.hidden)stopCamera();});
  } else {companies();$("retry-companies").addEventListener("click",companies);}
  window.addEventListener("pagehide",endLookup);
  window.addEventListener("pageshow",e => {if(e.persisted)endLookup();});
})();
