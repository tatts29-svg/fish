/* Clock times in the exports are already Queensland local time. */
(() => {
  "use strict";
  const number = new Intl.NumberFormat("en-AU");
  const dates = new Intl.DateTimeFormat("en-AU", {day:"numeric", month:"short", year:"numeric", timeZone:"UTC"});
  const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  const units = (n, singular, plural = singular + "s") => number.format(n) + " " + (n === 1 ? singular : plural);
  const hourLabel = n => String(n).padStart(2,"0") + ":00";
  const hourRange = n => hourLabel(n) + "–" + hourLabel(n + 1);

  function element(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function stamp(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(value || "");
    if (!match) return null;
    const d = new Date(Date.UTC(+match[1], +match[2]-1, +match[3]));
    return {day:dates.format(d), clock:match[4] || null};
  }

  function point(label, value) {
    const el = element("div","store-point");
    const dt = stamp(value);
    el.append(element("dt","",label), element("dd","",dt ? dt.day : "Unavailable"));
    if (dt) el.append(element("dd","store-time",dt.clock ? dt.clock + " AEST" : "Time unavailable"));
    return el;
  }

  function clockChart(hours, peaks) {
    const figure = element("figure","store-clock");
    const caption = element("figcaption","store-clock-title","Recorded interactions by hour");
    caption.append(element("span","","Across recorded dates · AEST"));
    figure.append(caption);
    const max = Math.max(0,...hours.map(hour=>count(hour.interactions)));
    const graph = element("div","store-clock-graph");
    graph.setAttribute("aria-hidden","true");
    const series = new Map(hours.map(row=>[row.hour,row]));
    for (let hour=0; hour<24; hour++) {
      const bin = element("span","store-hour");
      const total = count(series.get(hour)?.interactions);
      bin.title = hourRange(hour) + " AEST · " + units(total,"recorded interaction");
      if (total && max) {
        const bar = element("i","store-hour-bar");
        bar.style.height = total / max * 100 + "%";
        if (peaks.includes(hour)) bar.classList.add("store-peak-hour");
        bin.append(bar);
      }
      graph.append(bin);
    }
    const scale = element("div","store-clock-scale");
    scale.setAttribute("aria-hidden","true");
    for (const h of [0,6,12,18,24]) scale.append(element("span","",hourLabel(h)));
    figure.append(graph,scale);
    if (max && peaks.length) {
      let peakTimes;
      if (peaks.length === 24) {
        peakTimes = "All 24 hours shared the peak";
      } else if (peaks.length <= 3) {
        peakTimes = (peaks.length === 1 ? "Peak hour " : "Joint peak hours ") + peaks.map(hourRange).join(", ") + " AEST";
      } else {
        peakTimes = units(peaks.length,"hour") + " shared the peak";
      }
      figure.append(element("p","store-peak-readout",peakTimes + " · " + units(max,"interaction") + (peaks.length>1 ? " in each hour" : "")));
    }
    return figure;
  }

  function readings(parent, caption, headers, rows) {
    if (!rows.length) return;
    const wrap = element("div","store-table-wrap");
    const table = element("table","store-table");
    table.append(element("caption","",caption));
    const thead = table.createTHead().insertRow();
    headers.forEach(label=>{
      const th=element("th","",label);
      th.scope="col"; thead.append(th);
    });
    const body=table.createTBody();
    rows.forEach(cells=>{
      const tr=body.insertRow();
      cells.forEach((val,i)=>{
        const cell=element(i ? "td":"th","",val);
        if (!i) cell.scope="row";
        tr.append(cell);
      });
    });
    wrap.append(table);parent.append(wrap);
  }

  function timedRange(day) {
    const first = stamp(day.first_timed_at)?.clock, last = stamp(day.last_timed_at)?.clock;
    if (first && last && first !== last) return first + "–" + last;
    return first || last || "Time unavailable";
  }

  function breakdown(days, hours, minutes) {
    const detail = element("details","store-breakdown");
    detail.append(element("summary","",minutes.length ? "View dates, hours and recorded activity times" : "View activity by date and hour"));
    // Personal detail belongs to this report node and is discarded with it when the session clears.
    function loadRows() {
      detail.removeEventListener("toggle",whenOpen);
      detail.removeEventListener("mmg-print-store",loadRows);
      readings(detail,"Recorded dates",["Date","Known times (AEST)","Interactions","Timed records","Date only"],days.map(d=>[
        stamp(d.date)?.day || "Unavailable", timedRange(d), number.format(count(d.interactions)),
        number.format(count(d.timed_events)), number.format(count(d.date_only_events))
      ]));
      readings(detail,"Recorded hours across these dates",["Hour (AEST)","Interactions","Timed records"],
        hours.filter(h=>h.events || h.interactions).map(h=>[hourRange(h.hour),number.format(count(h.interactions)),number.format(count(h.events))]));
      readings(detail,"Recorded activity times · newest first",["Date and minute (AEST)","Activity records"],
        minutes.map(row=>{
          const dt=stamp(row.at);
          return [dt?.clock ? dt.day + ", " + dt.clock : "Time unavailable",number.format(count(row.events))];
        }));
    }
    function whenOpen() { if (detail.open) loadRows(); }
    detail.addEventListener("toggle",whenOpen);
    detail.addEventListener("mmg-print-store",loadRows);
    return detail;
  }

  // The normal print flow opens the current report's details. Build deferred rows
  // synchronously before browser pagination; a queued toggle can arrive afterwards.
  window.addEventListener("beforeprint",()=>{
    const report=document.getElementById("report");
    if (!report || report.hidden) return;
    for (const detail of report.querySelectorAll(".store-breakdown")) {
      detail.dispatchEvent(new Event("mmg-print-store"));
    }
  });

  function append(panel, report) {
    const personal = report.kind === "person";
    const s = report.store_activity;
    const area = element("section","store-pattern");
    const title = personal ? "When you used the tool store" : "When the crew used the tool store";
    area.setAttribute("aria-label",title);
    area.append(element("h3","store-pattern-heading",title));
    panel.append(area);
    if (!s || s.has_coverage === false) {
      area.append(element("p","store-caveat","A dated sales or tool transaction export is needed to show store activity."));
      return;
    }
    const days = Array.isArray(s.daily) ? s.daily.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))) : [];
    const hours = Array.isArray(s.hourly) ? s.hourly.filter(h=>Number.isInteger(h.hour) && h.hour>=0 && h.hour<24).sort((a,b)=>a.hour-b.hour) : [];
    if (!count(s.active_days) && !count(s.undated_events) && !count(s.timed_events)) {
      area.append(element("p","store-caveat","No store activity is recorded in the available exports for this shutdown."));
      return;
    }
    const stats=element("dl","store-frequency");
    const interaction=element("div","store-frequency-main");
    const minuteLabel = personal ? "Minutes with activity" : "Worker check-ins by minute";
    interaction.append(element("dt","",minuteLabel),element("dd","",number.format(count(s.interactions))));
    const active=element("div","store-frequency-main");
    active.append(element("dt","","Dates with activity"),element("dd","",number.format(count(s.active_days))));
    stats.append(interaction,active,point("First record",s.first_at),point("Latest record",s.last_at));
    area.append(stats,element("p","store-definition", personal ?
      "Each minute containing one or more recorded issues, returns or consumable draws on your card counts once. These records do not measure site attendance." :
      "Each worker with recorded issues, returns or consumable draws in a minute counts once for that minute. These records do not measure site attendance."));
    if (s.interactions && hours.length) {
      area.append(clockChart(hours, Array.isArray(s.busiest_hours) ? [...new Set(s.busiest_hours)].filter(h=>Number.isInteger(h) && h>=0 && h<24).sort((a,b)=>a-b) : []));
    }
    const notes=[];
    const dateOnly=count(s.date_only_events), undated=count(s.undated_events), unattributed=count(s.unattributed_timed_events);
    if (dateOnly) notes.push(units(dateOnly,"record") + (dateOnly===1 ? " has a date only." : " have dates only."));
    if (undated) notes.push(units(undated,"record") + (undated===1 ? " has no recorded date." : " have no recorded date."));
    if (unattributed) notes.push(units(unattributed,"timed record") + (unattributed===1 ? " has no identified worker." : " have no identified worker."));
    if (dateOnly || undated || unattributed) notes.push("The hourly interaction counts use timed records with an identified worker.");
    // If either boundary has only a date, preserve any actual timed endpoints inside it.
    for (const [boundary, timed, label] of [[s.first_at,s.first_timed_at,"Earliest timed record"],[s.last_at,s.last_timed_at,"Latest timed record"]]) {
      const outer=stamp(boundary), inner=stamp(timed);
      if (outer && !outer.clock && inner?.clock) notes.push(label + " · " + inner.day + ", " + inner.clock + " AEST.");
    }
    if (notes.length) area.append(element("p","store-caveat",notes.join(" ")));
    const minutes=personal && Array.isArray(s.timed_minutes) ? s.timed_minutes : [];
    if (days.length || minutes.length || hours.some(h=>h.events || h.interactions)) area.append(breakdown(days,hours,minutes));
  }
  window.MMGStoreStory=Object.freeze({append});
})();
