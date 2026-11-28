/* Manager shift charts. All source timestamps and labels use Queensland local time. */
(() => {
  'use strict';
  const mounts = new WeakMap();
  const dayFormat = new Intl.DateTimeFormat('en-AU', {weekday:'short', day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  const number = new Intl.NumberFormat('en-AU');
  const time = value => value ? String(value).slice(11, 16) : '—';
  const date = value => dayFormat.format(new Date(value.slice(0, 10) + 'T12:00:00Z'));
  const stamp = value => value ? date(value) + ' · ' + time(value) : '—';
  const millis = value => value ? Date.parse(String(value).replace(/(?:Z|\+10:00)$/, '') + 'Z') : NaN;
  const local = value => new Date(value).toISOString().slice(0, 19);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const numeric = val => Number.isFinite(val);
  const fmt = val => numeric(val) ? number.format(val) : '—';
  const total = vals => vals.some(numeric) ? vals.reduce((sum, val) => sum + (numeric(val) ? val : 0), 0) : null;
  const interval = bin => time(bin.start) + '–' + time(bin.end);
  const svgLine = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M2 14l4-5 4 2 6-8M13 3h3v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const controls = {stocktake:{title:'Stocktake activity', source:'Physical count records', series:[['count_events','Count entries','count']]},
    movement:{title:'Gear issued and returned', source:'Rental transactions', series:[['issued','Issued','issue'],['returned','Returned','return']]}};
  let nextId = 0;

  function movementDays(data) {
    const days = new Map();
    for (const shift of data.shifts || []) {
      const key = shift.day;
      if (!days.has(key)) days.set(key, {date:key, shifts:[]});
      days.get(key).shifts.push(shift);
    }
    return [...days.values()];
  }

  function movementProfile(day, selectedShift, asat) {
    const selected = day.shifts.filter(s => !selectedShift || s.shift === selectedShift).sort((a,b) => a.start.localeCompare(b.start));
    if (!selected.length) return null;
    const events = selected.flatMap(s => s.events || []).sort((a,b) => a.at.localeCompare(b.at));
    const bins = [];
    for (const shift of selected) {
      for (const raw of shift.bins) {
        const start = raw.start, end = raw.end || local(millis(start) + 1800000);
        const observed = numeric(raw.issued) || numeric(raw.returned);
        let coverage = 'unknown';
        if (asat && millis(start) > millis(asat)) coverage = 'future';
        const ranges = raw.covered_intervals || [];
        const complete = ranges.length===1 && millis(ranges[0].start)<=millis(start) && millis(ranges[0].end)>=millis(end)-1000;
        if (observed) coverage = complete ? 'full' : 'partial';
        bins.push({...raw, end, coverage, covered:ranges,
          events:events.filter(ev => ev.at >= start && ev.at < end)});
      }
    }
    return {start:bins[0]?.start, end:bins.at(-1)?.end, bins, issued:total(selected.map(s => s.issued)), returned:total(selected.map(s => s.returned)),
      first:events[0]?.at, last:events.at(-1)?.at};
  }

  function dayProfile(days, getProfile, names) {
    const bins = days.slice().reverse().map(day => {
      const p = getProfile(day), pieces = p?.bins || [];
      const full = pieces.length && pieces.every(b=>b.coverage==='full');
      const future = pieces.length && pieces.every(b=>b.coverage==='future');
      const observed = pieces.some(b=>names.some(f=>numeric(b[f])));
      const start = day.date+'T06:00:00', end = local(millis(start)+86400000);
      const bucket={day:day.date,start,end,coverage: full?'full':observed?'partial':future?'future':'unknown',
        first:p?.first,last:p?.last,tools:p?.tools,cons:p?.cons,unattributed_counts:p?.unattributed_counts || 0};
      for(const f of names) bucket[f]=observed && numeric(p?.[f]) ? p[f] : null;
      return bucket;
    });
    const at = k=>bins.map(b=>b[k]).filter(Boolean).sort();
    return {daily:true,bins,start:bins[0].start,end:bins.at(-1).end,first:at('first')[0],last:at('last').at(-1),
      daysWithActivity:bins.filter(b=>names.some(f=>b[f]>0)).length,
      unattributed_counts:total(bins.map(b=>b.unattributed_counts)),...Object.fromEntries(names.map(f=>[f,total(bins.map(b=>b[f]))]))};
  }

  function limitAndTicks(maximum) {
    const base = Math.pow(10, Math.floor(Math.log10(Math.max(maximum,1))));
    const step = [0.2,0.25,0.5,1,2].map(n => n*base).find(n => Number.isInteger(n) && maximum <= n*4) || Math.max(1, base);
    const count = Math.max(1, Math.ceil(maximum / step));
    return Array.from({length:count+1}, (_, i) => i*step);
  }

  // Draw only continuous measured windows. A partial interval with a record gets
  // its own point so a line cannot imply coverage across an unmeasured gap.
  function seriesGeometry(bins, field, x, y) {
    const segments = [], points = [];
    let active = null;
    for (const [i,b] of bins.entries()) {
      const value = b[field];
      if (!numeric(value)) { active = null; continue; }
      const covered = b.covered || [];
      let at = (millis(b.start)+millis(b.end))/2;
      if (b.coverage !== 'full' && !b.day) {
        if (b.last || b.events?.length) at = millis(b.last || b.events.at(-1).at);
        else if (covered.length) at = (millis(covered[0].start) + millis(covered[0].end))/2;
        else if (b.elapsed_end) at = (millis(b.start)+millis(b.elapsed_end))/2;
      }
      const point = {x:x(at), y:y(value), value, i};
      points.push(point);
      if (!active || (!b.day && b.coverage !== 'full') || (b.day && i>0 && b.start!==bins[i-1].end)) {
        active = [];
        segments.push(active);
      }
      active.push(point);
      if (!b.day && b.coverage !== 'full') active = null;
    }
    return {points, segments};
  }

  function quietPeriod(bins, fields) {
    let running, best;
    for (const b of bins) {
      if (b.coverage !== 'full' || b.unattributed_counts > 0 || fields.some(f => b[f] !== 0)) { running = null; continue; }
      if (running && running.end === b.start) running.end = b.end;
      else running = {start:b.start, end:b.end};
      if (!best || millis(running.end)-millis(running.start) > millis(best.end)-millis(best.start)) best = {...running};
    }
    return best;
  }

  function mount(host, mode, data) {
    if (!host || !controls[mode]) return;
    host.hidden=false;
    const old = mounts.get(host);
    old?.observer?.disconnect();
    const model = controls[mode], isCount = mode === 'stocktake';
    const days = (isCount ? data?.days || [] : movementDays(data || {})).slice().sort((a,b) => b.date.localeCompare(a.date));
    const asat = data?.asat || data?.as_at || '';
    const uid = 'mmg-trend-' + (++nextId);
    const series = model.series;
    const names = series.map(([field]) => field);
    const state = {day:old?.day, shift:old?.shift || '', person:old?.person || '', paused:old?.paused || false, activeBin:old?.activeBin ?? null};
    mounts.set(host,state);
    host.classList.add('shift-trend');
    host.classList.toggle('is-count', isCount);
    host.classList.toggle('is-paused', state.paused);
    host.setAttribute('aria-labelledby',uid+'-title');
    host.innerHTML = '<header class="sth"><div class="sth-title"><span class="sth-icon">'+svgLine+'</span><div><h3 id="'+uid+'-title">'+model.title+'</h3>'+
      '<p>'+model.source+(asat?' · Data to '+esc(stamp(asat))+' AEST':'')+'</p></div></div></header>';
    if (!days.length) {
      host.insertAdjacentHTML('beforeend','<p class="stx-unavailable">'+esc(data?.reason || 'Recorded shift data is unavailable for this report.')+'</p>');
      return;
    }
    const hasEntries = d => isCount ? d.profiles?.some(p => p.count_events > 0) : d.shifts.some(s => s.issued > 0 || s.returned > 0);
    if (state.day!=='all' && !days.some(d => d.date === state.day)) state.day = (days.find(hasEntries) || days[0]).date;
    host.insertAdjacentHTML('beforeend','<div class="stx-filters">'+
      '<label class="stx-field"><span>Operating day</span><select data-day><option value="all">All dates · daily totals</option>'+days.map(d => '<option value="'+esc(d.date)+'">'+esc(date(d.date))+'</option>').join('')+'</select></label>'+
      '<fieldset class="stx-shift"><legend>Shift</legend><div>'+[['','Full day'],['Day','Day'],['Night','Night']].map(([v,t])=>'<button type="button" aria-pressed="false" data-shift="'+v+'">'+t+'</button>').join('')+'</div></fieldset>'+
      (isCount?'<label class="stx-field"><span>Stocktaker</span><select data-person></select></label>':'')+
      '</div><div data-content></div>');
    const find = s => host.querySelector(s);
    const weekdays = find('[data-day]'), people = find('[data-person]'), content = find('[data-content]');
    weekdays.value = state.day;
    weekdays.onchange = () => {state.day = weekdays.value; state.activeBin = null; render();};
    for (const btn of host.querySelectorAll('[data-shift]')) btn.onclick = () => {state.shift = btn.dataset.shift; state.activeBin = null; render();};
    if (people) people.onchange = () => {state.person = people.value; state.activeBin = null; render();};
    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(entries => host.classList.toggle('stx-visible', entries[0].isIntersecting));
      state.observer.observe(host);
    } else host.classList.add('stx-visible');

    function render() {
      const day = days.find(d => d.date === state.day);
      const daily = state.day === 'all';
      const scopeDays=daily?days:[day], shifts=scopeDays.flatMap(d=>d.shifts||[]);
      if (state.shift && !shifts.some(s => s.shift===state.shift)) state.shift = '';
      for (const btn of host.querySelectorAll('[data-shift]')) {
        btn.disabled = !!btn.dataset.shift && !shifts.some(s => s.shift === btn.dataset.shift);
        btn.setAttribute('aria-pressed',String(btn.dataset.shift === state.shift));
      }
      const group=d=>state.shift?d.shifts.find(s=>s.shift===state.shift):d;
      if(isCount){
        const available = [...new Set(scopeDays.flatMap(d=>(group(d)?.profiles||[]).map(p=>p.name || '')))].sort();
        people.replaceChildren(...available.map(name=>new Option(name || 'All stocktakers',name)));
        if(!available.includes(state.person))state.person='';
        people.value=state.person;
      }
      const entry=d=>isCount?(group(d)?.profiles||[]).find(p=>(p.name||'')===state.person):movementProfile(d,state.shift,asat);
      const profile = daily ? dayProfile(scopeDays,entry,names) : entry(day);
      if (!profile?.bins?.length) {content.innerHTML='<p class="stx-unavailable">No recorded intervals are available for this selection.</p>';return;}
      const bins = profile.bins;
      const covered = bins.some(b => b.coverage==='full' || b.coverage==='partial' || names.some(f => numeric(b[f])));
      const distinct = numeric(profile.tools) && numeric(profile.cons) && covered ? profile.tools + profile.cons : null;
      const metrics = isCount ? [
        ['Count entries',covered ? fmt(profile.count_events) : '—','Recorded checks','count'],
        [daily?'Days with counts':'Distinct items',daily?(covered?fmt(profile.daysWithActivity):'—'):fmt(distinct),
          daily?'Operating dates':numeric(distinct)?fmt(profile.tools)+' tool assets · '+fmt(profile.cons)+' consumable lines':'','neutral']
      ] : [
        ['Issued',fmt(profile.issued),'Rental gear','issue'],
        ['Returned',fmt(profile.returned),'Rental gear','return']
      ];
      const firstLast = profile.first && profile.last ? [profile.first,profile.last] : [];
      content.innerHTML = '<div class="stx-metrics">'+metrics.map(([label,value,sub,tone])=>'<div class="stx-metric tone-'+tone+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(sub)+'</small></div>').join('')+
        '<div class="stx-timing">'+(firstLast.length ?
          firstLast.map((at,i)=>'<span><i class="stx-signal"></i>'+(i?'Last':'First')+(isCount?' count':' movement')+' <b title="'+esc(stamp(at))+' AEST">'+esc(at.slice(0,10)!==state.day?at.slice(8,10)+' '+new Intl.DateTimeFormat('en-AU',{month:'short',timeZone:'UTC'}).format(new Date(millis(at)))+' · ':'')+esc(time(at))+'</b></span>').join('')
          : '<span>'+(covered?'No timed '+(isCount?'counts':'movements')+' recorded':'No timed records available')+'</span>')+'</div></div>'+
        '<div class="stx-chart"><div class="stx-charthead"><div><h4>'+(isCount?'Count entries':'Rental movements')+(daily?' by operating day':' per half hour')+'</h4>'+
        '<p>'+esc(state.shift ? state.shift+' shift' : daily?'All shifts':'Full operating day')+' · '+esc(daily?date(bins[0].day)+' – '+date(bins.at(-1).day):time(profile.start)+'–'+time(profile.end)+' AEST')+(isCount && state.person?' · '+esc(state.person):'')+'</p></div>'+
        '<button type="button" class="stx-motion" data-motion></button></div>'+
        '<div class="stx-legend">'+series.map(([,label,tone])=>'<span class="tone-'+tone+'"><i></i>'+label+'</span>').join('')+'</div>'+
        '<div class="stx-coordinate"><div class="stx-y" aria-hidden="true"></div><div><div class="stx-plot"></div><div class="stx-x" aria-hidden="true"></div></div></div>'+
        '<div class="stx-inspector"><div class="stx-selected" data-bucket></div><label class="stx-slider"><span>'+(daily?'Explore dates':'Explore time')+'</span><input type="range" min="0" max="'+(bins.length-1)+'" step="1"></label></div>'+
        '<p class="stx-evidence" data-notes></p><details class="stx-detail"><summary>'+(daily?'Selected day details':'Half-hour detail')+'</summary><div data-detail></div></details></div>';
      const notes = [];
      if(!isCount) notes.push('SiteIQ selects hires by issue date. Their returns appear at the recorded return time.');
      if (isCount && profile.unattributed_counts) notes.push(fmt(profile.unattributed_counts)+' additional '+(profile.unattributed_counts===1?'check has':'checks have')+' no recorded operator.');
      if (bins.some(b=>b.coverage==='unknown' || b.coverage==='partial')) notes.push(daily?'Hatched days have partial or unavailable source coverage.':'Hatching marks gaps in source coverage.');
      if (bins.some(b=>b.coverage==='future')) notes.push('Shading marks time after the data cutoff.');
      const quiet = quietPeriod(bins,names);
      if (!daily && quiet) notes.push('Longest covered run of half hours with no recorded '+(isCount?'counts':'movements')+' · '+interval(quiet)+' AEST.');
      find('[data-notes]').textContent = notes.join(' ');
      draw(profile);
    }

    function draw(profile) {
      const daily=profile.daily, bins = profile.bins, origin=millis(bins[0].start), finish=millis(bins.at(-1).end);
      const x = at => 1000 * (at-origin) / (finish-origin);
      const peak = Math.max(0,...bins.flatMap(b=>names.map(f=>numeric(b[f])?b[f]:0)));
      const ticks = limitAndTicks(peak), y = n => 194-186*n/ticks.at(-1);
      const plot=find('.stx-plot'), axis=find('.stx-x');
      find('.stx-y').innerHTML=ticks.map(n=>'<span style="top:'+y(n)/2+'%">'+fmt(n)+'</span>').join('');
      const tickCount = bins.length > 24 ? 6 : 4;
      if(daily){
        const step=Math.max(1,Math.ceil(bins.length/5)), short=at=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(at));
        axis.innerHTML=bins.map((b,i)=>i%step===0 || i===bins.length-1?'<span class="stx-day-label" style="left:'+x((millis(b.start)+millis(b.end))/2)/10+'%">'+esc(short(millis(b.start)))+'</span>':'').join('');
      }else{
        const axisTicks=Array.from({length:tickCount+1},(_,i)=>origin+(finish-origin)*i/tickCount);
        axis.innerHTML=axisTicks.map((at,i)=>'<span style="left:'+(100*i/tickCount)+'%">'+time(local(at))+'</span>').join('');
      }
      const defs=series.map(([, ,tone])=>'<linearGradient class="tone-'+tone+'" id="'+uid+'-'+tone+'-area" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="currentColor" stop-opacity=".23"/><stop offset="100%" stop-color="currentColor" stop-opacity=".015"/></linearGradient>').join('');
      let shapes='<defs><pattern id="'+uid+'-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 8L8 0M7 9L9 7" vector-effect="non-scaling-stroke" stroke="currentColor" opacity=".35" stroke-width=".8"/></pattern>'+defs+'</defs>';
      const rect=(a,b,style)=> b>a ? '<rect x="'+x(a)+'" y="0" width="'+(x(b)-x(a))+'" height="200" '+style+'/>' : '';
      const hatch='fill="url(#'+uid+'-hatch)"';
      for (const b of bins) {
        const low=millis(b.start),high=millis(b.end);
        if (b.coverage==='future') shapes+=rect(low,high,'class="stx-future"');
        if (b.coverage==='unknown' || (daily && b.coverage==='partial')) shapes+=rect(low,high,hatch);
        if (!daily && b.coverage==='partial') {
          const cap=asat?Math.min(high,Math.max(low,millis(asat))):high;
          let at=low;
          for(const band of b.covered || []) {
            const start=Math.max(low,millis(band.start)),end=Math.min(high,millis(band.end));
            shapes+=rect(at,Math.min(cap,start),hatch);at=Math.max(at,end);
          }
          shapes+=rect(at,cap,hatch)+rect(cap,high,'class="stx-future"');
        }
      }
      for(const n of ticks) shapes+='<path class="stx-guide" d="M0 '+y(n)+'H1000"/>';
      if(!daily && !state.shift && origin < millis(state.day+'T18:00:00') && finish > millis(state.day+'T18:00:00')){
        const pivot=x(millis(state.day+'T18:00:00'));
        shapes+='<path class="stx-handover" d="M'+pivot+' 0V200"/>';
      }
      const allGeometry=series.map(([field])=>seriesGeometry(bins,field,x,y));
      const dots=[];
      series.forEach(([field,,tone],s)=>{
        const {points,segments}=allGeometry[s];
        const col='tone-'+tone;
        for(const seg of segments){
          const d=seg.map((p,i)=>(i?'L':'M')+' '+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
          if(seg.length>1){
            const area=d+' V194 H'+seg[0].x.toFixed(2)+' Z';
            shapes+='<path class="stx-wash '+col+'" fill="url(#'+uid+'-'+tone+'-area)" d="'+area+'"/>'+
              '<path class="stx-aura '+col+'" d="'+d+'"/><path class="stx-line '+col+'" pathLength="1" d="'+d+'"/>';
            if(seg.some(p=>p.value>0)) shapes+='<path class="stx-flow '+col+'" pathLength="1" d="'+d+'"/>';
          }
        }
        const high=points.reduce((best,p)=>p.value>0 && (!best || p.value>best.value)?p:best,null);
        if(high) dots.push('<i class="stx-peak '+col+'" style="left:'+high.x/10+'%;top:'+high.y/2+'%"></i>');
        for(const p of points){
          if(p.value>0 || bins[p.i].coverage!=='full' || segments.some(seg=>seg.length===1 && seg[0]===p))
            dots.push('<i class="stx-dot '+col+'" style="left:'+p.x/10+'%;top:'+p.y/2+'%"></i>');
        }
      });
      plot.innerHTML='<svg role="img" aria-labelledby="'+uid+'-graph-title" viewBox="0 0 1000 200" preserveAspectRatio="none"><title id="'+uid+'-graph-title">'+
        esc(model.title+(daily?' by operating day · ':' per half hour · ')+(daily?'All dates':date(state.day))+(state.shift?' · '+state.shift+' shift':' · Full day')+(state.person?' · '+state.person:''))+
        '</title>'+shapes+'</svg><div class="stx-marks" aria-hidden="true">'+dots.join('')+'</div><div class="stx-picker" aria-hidden="true"><i></i></div>';
      const motion=find('[data-motion]');
      const setPaused=()=>{
        host.classList.toggle('is-paused',state.paused);
        motion.setAttribute('aria-label',state.paused?'Play chart animation':'Pause chart animation');
        motion.title=state.paused?'Play animation':'Pause animation';
        motion.innerHTML=state.paused?'<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>':
          '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 3h3.2v10H3.5zm5.8 0h3.2v10H9.3z"/></svg>';
      };
      motion.onclick=()=>{state.paused=!state.paused;setPaused();};
      setPaused();
      const slider=find('.stx-slider input'),bucket=find('[data-bucket]'),pick=find('.stx-picker'),detail=find('[data-detail]');
      const lastEvent = bins.reduce((last,b,i)=>names.some(f=>b[f]>0)?i:last,-1);
      const lastMeasured = bins.reduce((last,b,i)=>names.some(f=>numeric(b[f]))?i:last,-1);
      const select = i => {
        i=Math.max(0,Math.min(bins.length-1,i));
        const b=bins[i];
        const period=daily?date(b.day):interval(b)+' AEST', afterMidnight=!daily && b.start.slice(0,10)!==state.day;
        const dateStamp=(afterMidnight?date(b.start)+' · ':'')+period;
        const isolated=!daily && !isCount && !b.covered?.length && b.events?.length;
        const condition = isolated?'Recorded movement outside export window':({full:'',partial:'Partial coverage',future:'After data cutoff',unknown:'No export coverage'}[b.coverage] || '');
        const labels=series.map(([field,label])=>fmt(b[field])+' '+label.toLowerCase());
        state.activeBin=i;
        slider.value=String(i);
        slider.setAttribute('aria-valuetext',dateStamp+' · '+labels.join(' · ')+(condition?' · '+condition:''));
        pick.style.left=x(millis(b.start))/10+'%';
        pick.style.width=(x(millis(b.end))-x(millis(b.start)))/10+'%';
        bucket.innerHTML='<div class="stx-bucket-time"><strong>'+esc(period)+'</strong><small>'+esc(daily?(state.shift?state.shift+' shift':'All shifts'):afterMidnight?date(b.start):date(state.day))+(condition?' · '+condition:'')+'</small></div>'+
          '<div class="stx-bucket-values">'+series.map(([field,label,tone])=>'<span class="tone-'+tone+'"><i></i><b>'+fmt(b[field])+'</b> '+label.toLowerCase()+'</span>').join('')+'</div>';
        const row=(value,label)=>'<tr><th scope="row">'+esc(value)+'</th><td>'+esc(label)+'</td></tr>';
        let entries='', detailTotals='';
        if(isCount){
          const lineCount=numeric(b.tools)&&numeric(b.cons)?fmt(b.tools+b.cons):'—';
          detailTotals='<p>'+lineCount+' distinct items · '+fmt(b.tools)+' tool assets · '+fmt(b.cons)+' consumable lines'+
            (b.unattributed_counts?' · '+fmt(b.unattributed_counts)+' checks with no recorded operator':'')+'</p>';
          entries=(b.minutes||[]).map(([at,qty])=>row(at,fmt(qty)+' count '+(qty===1?'entry':'entries'))).join('');
          if(b.count_events>0 && b.first && !entries) entries=row(time(b.first),'First count')+(b.last && b.last!==b.first ? row(time(b.last),'Last count'):'');
        }else{
          entries=(b.events||[]).map(ev=>row(ev.at.slice(11,19),[ev.issued?fmt(ev.issued)+' issued':'',ev.returned?fmt(ev.returned)+' returned':''].filter(Boolean).join(' · '))).join('');
        }
        if(daily){
          const first=b.first?'First '+(isCount?'count':'movement')+' '+time(b.first)+' AEST':'';
          const last=b.last?'Last '+(isCount?'count':'movement')+' '+time(b.last)+' AEST':'';
          detail.innerHTML=detailTotals+'<p>'+esc([first,last].filter(Boolean).join(' · ')||'No timed activity recorded for this selection.')+'</p>'+
            '<button type="button" class="stx-open-day">Explore half hours for this day</button>';
          detail.querySelector('button').onclick=()=>{state.day=b.day;state.activeBin=null;weekdays.value=state.day;render();weekdays.focus();};
          return;
        }
        if(entries) entries='<table><thead><tr><th scope="col">Time (AEST)</th><th scope="col">Recorded activity</th></tr></thead><tbody>'+entries+'</tbody></table>';
        else entries='<p>'+esc(b.coverage==='future'?'This interval follows the data cutoff.':b.coverage==='unknown'?'Export coverage is unavailable for this interval.':b.coverage==='partial'?'No timed entries in the observed part of this interval.':'No timed entries were recorded in this interval.')+'</p>';
        detail.innerHTML=detailTotals+entries;
      };
      const legend=find('.stx-legend');
      legend.innerHTML=series.map(([field,label,tone])=>{
        const peakBin=bins.reduce((best,b,i)=>b[field]>0 && (best<0 || b[field]>bins[best][field])?i:best,-1);
        if(peakBin<0) return '<span class="tone-'+tone+'"><i></i>'+label+'</span>';
        const bin=bins[peakBin], period=daily?date(bin.day):interval(bin)+' AEST';
        return '<button class="stx-peak-jump tone-'+tone+'" type="button" data-peak="'+peakBin+'" title="'+esc('Inspect '+label.toLowerCase()+' peak · '+period)+'"><i></i>'+label+' <small>Peak '+fmt(bin[field])+'</small></button>';
      }).join('');
      for(const btn of legend.querySelectorAll('[data-peak]'))btn.onclick=()=>{select(Number(btn.dataset.peak));slider.focus({preventScroll:true});};
      slider.oninput=()=>select(Number(slider.value));
      function pointer(event){
        const box=plot.getBoundingClientRect();
        if(!box.width)return;
        const at=origin+Math.max(0,Math.min(1,(event.clientX-box.left)/box.width))*(finish-origin);
        const pos=bins.findIndex(b=>at<millis(b.end));
        select(pos<0?bins.length-1:pos);
      }
      plot.onpointerdown=pointer;
      plot.onpointermove=e=>{if(e.pointerType==='mouse' || e.buttons===1)pointer(e);};
      select(state.activeBin ?? Math.max(0,lastEvent>=0?lastEvent:lastMeasured));
    }
    render();
  }

  function unmount(host) {
    if(!host)return;
    mounts.get(host)?.observer?.disconnect();
    mounts.delete(host);
    host.replaceChildren();
    host.hidden=true;
    host.removeAttribute('aria-labelledby');
    host.classList.remove('shift-trend','is-count','stx-visible','is-paused');
  }
  window.MMGShiftTrends={mount,unmount};
})();
