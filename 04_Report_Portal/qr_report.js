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
    if (transaction) transaction.abort();
    transaction = null;
    selection = ""; pdfRequest = null; pdf = null; snapshot = null;
    dialogGeneration++;
    if (dialog.open) dialog.close();
    stopCamera();
    $("report").hidden = true;
    $("report-body").replaceChildren();
    $("report-heading").textContent = "";
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
  function hires(parent,r) {
    const panel = section(parent,personal ? "Gear on your card" : "Gear on hire",
      r.asat ? "On-hire position at " + when(r.asat) + " AEST. Open a tool to see its asset numbers and recorded issue times." : "Open a tool to see its asset numbers and recorded issue times.",true);
    if (!r.hires.length) {panel.append(el("p","empty",personal ? "No gear is recorded on hire to your card." : "No gear is recorded on hire to this company.")); return;}
    for (const tool of r.hires) {
      const d = group(tool.name,tool.count);
      const items = el("ul","data-list");
      for (const asset of tool.items) {
        const line = el("li");
        line.append(el("span","label",asset.item || "Asset number unavailable"),el("span","date",when(asset.date,asset.time) || "Issue time unavailable"));
        items.append(line);
      }
      d.append(items); panel.append(d);
    }
  }
  function returnsPanel(parent, r) {
    const ret = r.returns;
    const panel = section(parent,"Your return record","Recorded issues and completed hires in the available transaction periods.");
    if (!r.coverage?.transactions_asat) {panel.append(el("p","empty","A dated transaction export is unavailable."));return;}
    if (finite(ret.score)) {
      const score = el("div","score");
      const value = el("strong","",fmt(ret.score));
      value.append(el("span",""," / 5"));
      const meter = el("meter");
      meter.min=0; meter.max=5; meter.value=ret.score;
      meter.setAttribute("aria-label","Same-day return score");
      score.append(value,meter); panel.append(score);
    } else {
      panel.append(el("p","empty","Score unavailable. At least five eligible completed hires are needed."));
    }
    panel.append(factList([["Same-day returns",fmt(ret.same_day) + " of " + fmt(ret.eligible) + " eligible hires"],["Recorded issues",fmt(ret.issues)],["Recorded returns",fmt(ret.returned)]]));
    if (ret.method) panel.append(el("p","sub",ret.method));
    if (ret.due_dates_available && finite(ret.due_assessed)) {
      panel.append(el("p","sub",fmt(ret.returned_by_due)+" of "+fmt(ret.due_assessed)+" completed hires with recorded due dates were returned by the due date."));
    } else panel.append(el("p","sub","SiteIQ supplies no due dates for these hires. Contractual lateness cannot be assessed."));
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
  function activityPanel(parent,r) {
    const panel = section(parent,"Your tool-store timeline","Each date is supported by a recorded transaction. These records do not establish site attendance.",true);
    if (!r.activity.length) {panel.append(el("p","empty","No dated transactions were found for your card.")); return;}
    const events = el("ol","timeline");
    for (const day of [...r.activity].sort((a,b) => b.date.localeCompare(a.date))) {
      const li = el("li");
      const values = [[day.issued,"tool issues"],[day.returned,"tool returns"],[day.consumable_units,"consumable units issued"],[day.consumable_returns,"consumable units returned"]]
        .filter(([qty]) => finite(qty) && qty > 0).map(([qty,label]) => fmt(qty)+" "+label);
      li.append(el("strong","",when(day.date)),el("p","sub",values.join(" · ") || "Transaction recorded"));
      events.append(li);
    }
    panel.append(events);
  }
  function historyPanel(parent,r) {
    const panel = section(parent,"Your hire history","Issues and returns linked to your card in the available transaction export.",true);
    if (r.rental_history?.length) {
      const d = group("View individual hires",r.rental_history.length);
      table(d,["Tool / asset","Issue","Return"],r.rental_history.map(t => [
        [t.name,t.item].filter(Boolean).join(" · "),when(t.issued_at) || "Issue unrecorded",when(t.returned_at) || "Return unrecorded"
      ]));
      panel.append(d);
    } else {panel.append(el("p","empty","No individual hire transactions were linked in this export."));}
    const past = section(parent,"Earlier MMG shutdowns","Earlier records appear when they can be linked to your identity.",true);
    if (!r.history?.length) {past.append(el("p","empty","No verified earlier shutdown is linked to this report.")); return;}
    for (const h of r.history) {
      const d = group(h.schedule,null);
      d.append(factList([["Tool issues",fmt(h.issues)],["Recorded returns",fmt(h.returned)],["Same-day returns",fmt(h.same_day)+" of "+fmt(h.eligible)+" eligible hires"],["Consumable units",fmt(h.consumable_units)],["Recorded activity dates",fmt(h.activity_days)]]));
      past.append(d);
    }
  }
  function render(r) {
    if (r.kind !== (personal ? "person" : "company") || !Array.isArray(r.hires)) throw new Error("The selected report is unavailable.");
    const body = $("report-body"); body.replaceChildren();
    $("report-heading").textContent = personal ? "Your time at MMG Dugald River" : r.name;
    $("report-subtitle").textContent = personal ? [r.name,r.company].filter(Boolean).join(" · ") : "Equipment currently on hire to " + r.name + ".";
    const pairs = [[personal ? "Assets on your card" : "Assets currently on hire",fmt(r.hire_count)]];
    if (personal) pairs.push(["Recorded activity dates",fmt(r.activity.length)],["Consumable units issued",fmt(r.coverage?.sales_asat ? r.consumable_summary.units : null)]);
    else pairs.push(["Tool descriptions",fmt(r.hires.length)]);
    stats(body,pairs);
    hires(body,r);
    if (personal) {
      activityPanel(body,r); returnsPanel(body,r); consumablesPanel(body,r); historyPanel(body,r);
      const cov = r.coverage || {};
      const words = [];
      const periods = cov.transaction_periods ?? [{start:cov.period_start,end:cov.period_end}];
      for (const period of periods) if (period.start && period.end) {
        words.push("Tool transactions from "+when(period.start)+" to "+when(period.end)+".");
      }
      if (cov.transactions_asat) words.push("Tool transaction pull "+when(cov.transactions_asat)+".");
      if (cov.sales_asat) words.push("Sales pull "+when(cov.sales_asat)+".");
      if (words.length) section(body,"Record coverage",words.join(" ")+" Times are AEST.",true);
    }
    $("pull").textContent = r.asat ? "SiteIQ rental stock pull " + when(r.asat) + " AEST" : "SiteIQ rental stock pull time unavailable.";
    $("lookup").hidden = true; $("report").hidden = false;
    snapshot=r;
    $("report-heading").focus();
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
    if (media) {media.getTracks().forEach(t => t.stop());media=null;}
    if (personal) {$("preview").srcObject=null;$("scan-box").hidden=true;}
  }
  async function decoder() {
    if (!decoderRequest) {
      decoderRequest=new Promise((resolve,reject) => {
        const s=document.createElement("script");s.src="badge_decoder.js";
        s.onload=()=> resolve(window.jsQR);s.onerror=()=> {decoderRequest=null;reject(new Error("The QR decoder could not load."));};document.head.append(s);
      });
    }
    return decoderRequest;
  }
  async function startCamera() {
    stopCamera();status();const mine=scanGeneration;
    const view=$("preview");$("scan-box").hidden=false;
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"}}});
      if (mine!==scanGeneration){stream.getTracks().forEach(t=>t.stop());return;}
      media=stream;view.srcObject=stream;await view.play();
      let detector=null;
      try {if (window.BarcodeDetector) detector=new BarcodeDetector();} catch(_) {}
      let decode=null;
      if (!detector) decode=await decoder();
      const canvas=el("canvas");
      const cx=canvas.getContext("2d",{willReadFrequently:true});
      async function tick() {
        if (mine!==scanGeneration) return;
        let value="";
        if (view.readyState>=2 && view.videoWidth) {
          if (detector) {
            try {value=(await detector.detect(view))[0]?.rawValue || "";}
            catch(_) {detector=null;try {decode=await decoder();} catch(_){stopCamera();status("Enter the code printed on your card.",true);return;}}
          } else if (decode) {
            canvas.width=Math.min(720,view.videoWidth);
            canvas.height=Math.round(canvas.width*view.videoHeight/view.videoWidth);
            cx.drawImage(view,0,0,canvas.width,canvas.height);
            const pixels=cx.getImageData(0,0,canvas.width,canvas.height);
            value=decode(pixels.data,canvas.width,canvas.height,{inversionAttempts:"dontInvert"})?.data || "";
          }
        }
        if (mine!==scanGeneration) return;
        if (value && !/^https?:\/\//i.test(value) && value.length<=identity.maxLength) {
          stopCamera();identity.value=value;form.requestSubmit();return;
        }
        if (value) status("Scan the barcode on your own SiteIQ card.");
        scanTimer=setTimeout(tick,275);
      }
      if (mine===scanGeneration) tick();
    } catch(err) {
      if(mine===scanGeneration){stopCamera();status("Camera unavailable. Enter the code printed on your SiteIQ card or use a handheld scanner.",true);}
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
