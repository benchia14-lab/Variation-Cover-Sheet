/* ============================================================================
   THE STAGES OF A VARIATION
   ============================================================================
   The cover sheet is stage 1 of five:

     1 cover sheet          app.js — the letter itself
     2 inclusions/exclusions  pick from SCOPE_LIBRARY (scope-library.js)
     3 schedule of rates      price it from SCHEDULE_OF_RATES (schedule-of-rates.js)
     4 documentation          drawings & markups, then the approval trail
     5 review & download      the finished PDF, previewed, then saved and filed

   Every stage after the first adds pages to the same PDF, laid out by the same
   page builder as the letter (buildPdfDocument), so every page carries the
   letterhead and the page numbers run through the whole document. Uploaded
   PDFs are bound in whole, after the pages generated before them.

   Stages 2 and 3 are saved to the variation log with the rest of the form.
   Attachments are not: they are files, and the log is a list of fields.
============================================================================ */

const Stages = (function(){

  const ORDER = ['cover', 'scope', 'rates', 'docs', 'review'];
  const VIEWS = {
    cover: document.getElementById('view-editor'),
    scope: document.getElementById('view-scope'),
    rates: document.getElementById('view-rates'),
    docs: document.getElementById('view-docs'),
    review: document.getElementById('view-review')
  };
  let stage = 'cover';

  const num = v => {
    const n = parseFloat(String(v === undefined || v === null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  };
  const money = n => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  const qtyText = n => (Math.round(n * 100) / 100).toLocaleString('en-AU');
  let nextId = 1;
  const newId = () => 'i' + (nextId++);

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ------------------------------------------------------------------------
     Navigation
  ------------------------------------------------------------------------ */

  const stepButtons = Array.prototype.slice.call(document.querySelectorAll('#stepper .step'));

  function go(next){
    if(!currentState) return;
    location.hash = '#/state/' + encodeURIComponent(currentState.code) + (next === 'cover' ? '' : '/' + next);
  }

  // called by the router, so the browser's back button walks the stages too
  function show(next){
    if(ORDER.indexOf(next) === -1) next = 'cover';
    if(stage === 'review' && next !== 'review') dropBuild();
    stage = next;
    showOnly(VIEWS[next]);
    const at = ORDER.indexOf(next);
    stepButtons.forEach(b => {
      const i = ORDER.indexOf(b.getAttribute('data-stage'));
      b.classList.toggle('on', i === at);
      b.classList.toggle('done', i < at);
    });
    const side = VIEWS[next].querySelector('.form-side');
    if(side) side.scrollTop = 0;
    if(next === 'cover') render();
    if(next === 'scope') renderScope();
    if(next === 'rates') renderRates();
    if(next === 'docs') renderDocs();
    if(next === 'review') enterReview();
  }

  stepButtons.forEach(b => b.addEventListener('click', () => go(b.getAttribute('data-stage'))));
  document.querySelectorAll('[data-go]').forEach(b => {
    b.addEventListener('click', () => go(b.getAttribute('data-go')));
  });

  /* ------------------------------------------------------------------------
     Preview sheets — the letter's own letterhead and footer around a body
  ------------------------------------------------------------------------ */

  function letterSheet(){ return document.querySelector('#view-editor .sheet'); }

  function fillSheet(target, bodyNodes){
    const src = letterSheet();
    target.innerHTML = '';
    target.appendChild(stripIds(src.querySelector('.letterhead').cloneNode(true)));
    const inner = el('div', 'sheet-inner');
    const body = el('div', 'letter-body');
    bodyNodes.forEach(n => body.appendChild(n));
    inner.appendChild(body);
    target.appendChild(inner);
    target.appendChild(stripIds(src.querySelector('.sheet-footer').cloneNode(true)));
  }

  function sectionTitle(text, sub){
    const wrap = el('div', 'doc-title');
    wrap.appendChild(el('div', 'doc-title-main')).textContent = text;
    const line = [effectiveRef(), els['variationdesc'].value.trim()].filter(Boolean).join(' — ');
    const subText = sub || line;
    if(subText) wrap.appendChild(el('div', 'doc-title-sub')).textContent = subText;
    return wrap;
  }

  /* ========================================================================
     STAGE 2 · INCLUSIONS & EXCLUSIONS
  ======================================================================== */

  // Inclusions and exclusions can be moved to either side; the last two
  // groups are notes, which are either on the variation or not (`single`).
  // The qualifications are the schedule of rates' own, so they stay in step
  // with the workbook they came from.
  const GROUPS = [
    { key: 'inclusions', title: 'Inclusions', print: 'in' },
    { key: 'exclusions', title: 'Exclusions', print: 'out' },
    { key: 'general', title: 'General', print: 'gen', single: 'gen' },
    { key: 'qualifications', title: 'Exclusions / Qualifications', print: 'qual', single: 'qual' }
  ];
  const groupOf = key => GROUPS.find(g => g.key === key) || GROUPS[0];

  let scopeItems = [];
  let scopeFilter = 'all';
  const openGroups = {};    // collapsed unless opened

  function libraryLines(key){
    if(key === 'qualifications') return (typeof SCHEDULE_OF_RATES !== 'undefined' && SCHEDULE_OF_RATES.notes) || [];
    return (typeof SCOPE_LIBRARY !== 'undefined' && SCOPE_LIBRARY[key]) || [];
  }

  // every line on offer, none of them chosen: each variation picks its own
  function defaultScope(){
    const items = [];
    GROUPS.forEach(g => {
      libraryLines(g.key).forEach(entry => {
        items.push({ id: newId(), text: typeof entry === 'string' ? entry : entry.text, group: g.key, state: 'off' });
      });
    });
    return items;
  }
  scopeItems = defaultScope();

  // what prints, and under which heading -- an inclusion can be excluded on
  // this variation and the other way round, so the heading follows the state
  function scopePrinted(){
    return {
      in: scopeItems.filter(i => i.state === 'in'),
      out: scopeItems.filter(i => i.state === 'out'),
      gen: scopeItems.filter(i => i.state === 'gen'),
      qual: scopeItems.filter(i => i.state === 'qual')
    };
  }

  const scopeList = document.getElementById('scope-list');
  const scopeSearch = document.getElementById('scope-search');
  const scopeCounts = document.getElementById('scope-counts');

  function setItemState(item, state){
    item.state = item.state === state ? 'off' : state;
    renderScope();
  }

  function cycleItem(item){
    const single = groupOf(item.group).single;
    if(single){ item.state = item.state === single ? 'off' : single; }
    else { item.state = { in: 'out', out: 'off', off: 'in' }[item.state] || 'in'; }
    renderScope();
  }

  function groupCounts(items){
    const n = st => items.filter(i => i.state === st).length;
    const parts = [];
    if(n('in')) parts.push(n('in') + ' included');
    if(n('out')) parts.push(n('out') + ' excluded');
    if(n('gen') + n('qual')) parts.push((n('gen') + n('qual')) + ' added');
    return (parts.length ? parts.join(' · ') + ' of ' : '') + items.length;
  }

  function renderScopeList(){
    const q = scopeSearch.value.trim().toLowerCase();
    const matches = item => {
      if(q && item.text.toLowerCase().indexOf(q) === -1) return false;
      if(scopeFilter === 'all') return true;
      if(scopeFilter === 'on') return item.state !== 'off';
      return item.state === scopeFilter;
    };
    const scrollAt = scopeList.closest('.form-side').scrollTop;
    scopeList.innerHTML = '';
    GROUPS.forEach(g => {
      const items = scopeItems.filter(i => i.group === g.key);
      const shown = items.filter(matches);
      if(!shown.length) return;
      // a search or a filter opens every group it finds something in
      const open = !!(q || scopeFilter !== 'all' || openGroups[g.key]);
      const head = el('button', 'scope-group-head' + (open ? ' open' : ''));
      head.type = 'button';
      head.innerHTML = '<span class="sor-caret">' + (open ? '▾' : '▸') + '</span>' +
        '<span class="sg-title">' + escapeHtml(g.title) + '</span>' +
        '<span class="scope-group-count">' + escapeHtml(groupCounts(items)) + '</span>';
      head.addEventListener('click', () => {
        openGroups[g.key] = !open;
        renderScopeList();
      });
      scopeList.appendChild(head);
      if(!open) return;

      shown.forEach(item => {
        const row = el('div', 'scope-item st-' + item.state);
        const text = el('button', 'si-text');
        text.type = 'button';
        text.title = 'Click to change';
        text.textContent = item.text;
        text.addEventListener('click', () => cycleItem(item));
        row.appendChild(text);

        const actions = el('div', 'si-actions');
        const btn = (label, state, cls) => {
          const b = el('button', 'si-btn ' + cls + (item.state === state ? ' on' : ''), label);
          b.type = 'button';
          b.addEventListener('click', () => setItemState(item, state));
          actions.appendChild(b);
        };
        const single = groupOf(item.group).single;
        if(single){
          btn(item.state === single ? '✓ Added' : 'Add', single, 'si-gen');
        } else {
          btn(item.state === 'in' ? '✓ Include' : 'Include', 'in', 'si-in');
          btn(item.state === 'out' ? '✕ Exclude' : 'Exclude', 'out', 'si-out');
        }
        if(item.custom){
          const rm = el('button', 'si-remove', '&times;');
          rm.type = 'button';
          rm.title = 'Remove this line';
          rm.addEventListener('click', () => {
            scopeItems = scopeItems.filter(i => i !== item);
            renderScope();
          });
          actions.appendChild(rm);
        }
        row.appendChild(actions);
        scopeList.appendChild(row);
      });
    });
    if(!scopeList.children.length){
      scopeList.appendChild(el('div', 'scope-empty', q ? 'Nothing in the list matches “' + escapeHtml(q) + '”.' : 'Nothing here.'));
    }
    scopeList.closest('.form-side').scrollTop = scrollAt;

    const p = scopePrinted();
    scopeCounts.innerHTML = '<strong>' + p.in.length + '</strong> included · <strong>' + p.out.length +
      '</strong> excluded · <strong>' + (p.gen.length + p.qual.length) + '</strong> notes';
  }

  function scopeBlocks(){
    const p = scopePrinted();
    const blocks = [];
    GROUPS.forEach(g => {
      const list = p[g.print];
      if(!list.length) return;
      const items = list.map(i => {
        const d = el('div', 'scope-line');
        d.textContent = i.text;
        return d;
      });
      blocks.push({ heading: g.title, items: items });
    });
    return blocks;
  }

  function renderScopePreview(){
    const nodes = [sectionTitle('Inclusions & Exclusions')];
    const blocks = scopeBlocks();
    blocks.forEach(b => {
      const wrap = el('div', 'scope-block');
      wrap.appendChild(el('p', 'dwg-panel-title', escapeHtml(b.heading)));
      b.items.forEach(i => wrap.appendChild(i));
      nodes.push(wrap);
    });
    if(!blocks.length){
      nodes.push(el('p', 'scope-empty', 'Nothing is included or excluded yet — click lines on the left to add them.'));
    }
    fillSheet(document.getElementById('scope-sheet'), nodes);
  }

  function renderScope(){
    renderScopeList();
    renderScopePreview();
  }

  scopeSearch.addEventListener('input', renderScopeList);
  document.querySelectorAll('#scope-filter .chip').forEach(c => {
    c.addEventListener('click', () => {
      scopeFilter = c.getAttribute('data-filter');
      document.querySelectorAll('#scope-filter .chip').forEach(x => x.classList.toggle('on', x === c));
      renderScopeList();
    });
  });

  const scopeNew = document.getElementById('scope-new');
  document.querySelectorAll('[data-add]').forEach(b => {
    b.addEventListener('click', () => {
      const text = scopeNew.value.trim().replace(/\s+/g, ' ');
      if(!text){ scopeNew.focus(); return; }
      const state = b.getAttribute('data-add');
      const group = state === 'in' ? 'inclusions' : state === 'out' ? 'exclusions' : 'general';
      openGroups[group] = true;
      // added at the end of its group, where it will print
      const lastOfGroup = scopeItems.map(i => i.group).lastIndexOf(group);
      scopeItems.splice(lastOfGroup + 1, 0, { id: newId(), text: text, group: group, state: state, custom: true });
      scopeNew.value = '';
      renderScope();
    });
  });

  document.getElementById('scope-reset').addEventListener('click', () => {
    if(!confirm('Start the list again? Every line is unselected and lines you added for this variation are removed.')) return;
    scopeItems = defaultScope();
    renderScope();
  });
  document.getElementById('scope-expand').addEventListener('click', () => {
    const anyClosed = GROUPS.some(g => !openGroups[g.key]);
    GROUPS.forEach(g => { openGroups[g.key] = anyClosed; });
    renderScopeList();
  });
  document.getElementById('scope-clear').addEventListener('click', () => {
    scopeItems.forEach(i => { i.state = 'off'; });
    renderScope();
  });

  /* ========================================================================
     STAGE 3 · SCHEDULE OF RATES
     ------------------------------------------------------------------------
     Measured the way the master schedule is: for each line, a quantity added
     and a quantity deducted, the difference times the rate. Only measured
     lines print. Lines that are not in the schedule go under "Additional
     items" with a rate typed for this one job.

     A variation can carry several schedules -- one per zone, level or area --
     kept as tabs. Each prints on its own pages under its own name, and with
     more than one, a summary of them all comes first. GST is charged once,
     on the total of every schedule.

     Any line can carry a comment, and its rate can be adjusted for this
     variation; the contract rate stays alongside it so the change shows.
  ======================================================================== */

  const SOR = (typeof SCHEDULE_OF_RATES !== 'undefined') ? SCHEDULE_OF_RATES
    : { title: 'Schedule of Rates', sections: [], notes: [], preamble: [], gstPercent: 10 };
  const keyOf = (section, desc) => section + '\u0000' + desc;

  // Per schedule, what has been measured, keyed by section and description.
  // The rate and unit are copied in when a line is first touched, so a
  // variation reopened after the workbook changes keeps the rates it was
  // issued at; `r0` is the contract rate, `r` what is charged.
  function newSchedule(name){
    return {
      id: newId(),
      name: name,
      measured: {},          // key -> { section, d, u, r, r0, c, add, ded }
      percents: {},          // key -> { section, d, percent }
      extras: [],            // { id, d, c, u, r, add, ded }
      notes: ''
    };
  }

  let book = null;           // { schedules: [...], active, gstPercent }
  let rates = null;          // the schedule on the open tab

  function defaultBook(){
    const first = newSchedule('Schedule 1');
    return { schedules: [first], active: 0, gstPercent: SOR.gstPercent === undefined ? 10 : SOR.gstPercent };
  }
  book = defaultBook();
  rates = book.schedules[0];

  const diffOf = e => num(e.add) - Math.abs(num(e.ded));
  const isMeasured = e => !!e && !!(num(e.add) || num(e.ded));

  function computeSchedule(sch){
    const sections = [];
    SOR.sections.forEach(s => {
      const lines = [];
      s.lines.forEach(l => {
        if(l.percent !== undefined) return;
        const e = sch.measured[keyOf(s.title, l.d)];
        if(isMeasured(e)) lines.push(lineCalc(e));
      });
      if(lines.length) sections.push({ title: s.title, lines: lines, total: lines.reduce((n, l) => n + l.amount, 0) });
    });
    // measured lines no longer in the schedule are kept under their old section
    Object.keys(sch.measured).forEach(k => {
      const e = sch.measured[k];
      if(!isMeasured(e) || findLine(e.section, e.d)) return;
      let sec = sections.find(s => s.title === e.section);
      if(!sec){ sec = { title: e.section, lines: [], total: 0 }; sections.push(sec); }
      const l = lineCalc(e);
      sec.lines.push(l);
      sec.total += l.amount;
    });
    const extras = sch.extras.filter(e => e.d.trim() && isMeasured(e)).map(lineCalc);
    if(extras.length) sections.push({ title: 'Additional Items', lines: extras, total: extras.reduce((n, l) => n + l.amount, 0) });

    const works = sections.reduce((n, s) => n + s.total, 0);
    const percents = Object.keys(sch.percents).map(k => sch.percents[k])
      .map(p => ({ d: p.d, percent: p.percent, amount: works * p.percent / 100 }));
    const exGst = works + percents.reduce((n, p) => n + p.amount, 0);
    return { schedule: sch, sections: sections, works: works, percents: percents, exGst: exGst };
  }

  // every schedule, and the variation's totals across them
  function computeRates(){
    const list = book.schedules.map(computeSchedule);
    const exGst = list.reduce((n, c) => n + c.exGst, 0);
    const gst = exGst * num(book.gstPercent) / 100;
    return { list: list, exGst: exGst, gst: gst, incGst: exGst + gst };
  }

  function lineCalc(e){
    const diff = diffOf(e);
    return { d: e.d, c: (e.c || '').trim(), u: e.u, r: num(e.r), add: num(e.add), ded: Math.abs(num(e.ded)),
             diff: diff, amount: diff * num(e.r) };
  }

  function findLine(section, desc){
    const s = SOR.sections.find(x => x.title === section);
    return s ? s.lines.find(l => l.d === desc) : null;
  }

  const priced = c => c.sections.length > 0;
  function hasPricing(g){ return g.list.some(priced); }

  /* ---- the tabs -------------------------------------------------------------- */

  const sorTabs = document.getElementById('sor-tabs');
  const sorName = document.getElementById('sor-name');

  function openTab(i){
    book.active = Math.max(0, Math.min(i, book.schedules.length - 1));
    rates = book.schedules[book.active];
    renderRates();
  }

  function renderTabs(){
    const g = computeRates();
    sorTabs.innerHTML = '';
    book.schedules.forEach((sch, i) => {
      const t = el('button', 'sor-tab' + (i === book.active ? ' on' : ''));
      t.type = 'button';
      t.innerHTML = '<span class="sor-tab-name">' + escapeHtml(sch.name || 'Untitled') + '</span>' +
        '<span class="sor-tab-total">' + (g.list[i].exGst ? money(g.list[i].exGst) : '—') + '</span>';
      t.title = 'Double-click to rename';
      t.addEventListener('click', () => { if(i !== book.active) openTab(i); });
      t.addEventListener('dblclick', () => { sorName.focus(); sorName.select(); });
      sorTabs.appendChild(t);
    });
    const add = el('button', 'sor-tab sor-tab-add', '+ New schedule');
    add.type = 'button';
    add.title = 'Add a schedule for another zone or area';
    add.addEventListener('click', () => {
      book.schedules.push(newSchedule('Schedule ' + (book.schedules.length + 1)));
      openTab(book.schedules.length - 1);
      sorName.focus();
      sorName.select();
    });
    sorTabs.appendChild(add);
    sorName.value = rates.name;
    document.getElementById('sor-delete').disabled = book.schedules.length < 2;
  }

  sorName.addEventListener('input', () => {
    rates.name = sorName.value;
    const t = sorTabs.querySelector('.sor-tab.on .sor-tab-name');
    if(t) t.textContent = rates.name || 'Untitled';
    updateRates();
  });

  document.getElementById('sor-duplicate').addEventListener('click', () => {
    const copy = JSON.parse(JSON.stringify(rates));
    copy.id = newId();
    copy.name = (rates.name || 'Schedule') + ' (copy)';
    copy.extras.forEach(e => { e.id = newId(); });
    book.schedules.splice(book.active + 1, 0, copy);
    openTab(book.active + 1);
    sorName.focus();
    sorName.select();
  });

  document.getElementById('sor-delete').addEventListener('click', () => {
    if(book.schedules.length < 2) return;
    if(!confirm('Delete the schedule "' + (rates.name || 'Untitled') + '" and everything measured on it?')) return;
    book.schedules.splice(book.active, 1);
    openTab(book.active);
  });

  /* ---- the editor ---------------------------------------------------------- */

  const sorSections = document.getElementById('sor-sections');
  const sorSearch = document.getElementById('sor-search');
  const sorOnly = document.getElementById('sor-only');
  const sorGst = document.getElementById('sor-gst');
  const sorNotes = document.getElementById('sor-notes');
  const sorSummary = document.getElementById('sor-summary');
  const sorExtras = document.getElementById('sor-extras');
  document.getElementById('sor-preamble').textContent = (SOR.preamble || []).join(' ');
  document.getElementById('sor-preamble').hidden = !(SOR.preamble || []).length;
  const openSections = {};

  // touched: measured, commented on, or re-rated
  const touched = e => !!e && (isMeasured(e) || (e.c || '').trim() || num(e.r) !== num(e.r0));

  function measuredIn(s){
    return s.lines.filter(l => {
      if(l.percent !== undefined) return !!rates.percents[keyOf(s.title, l.d)];
      return isMeasured(rates.measured[keyOf(s.title, l.d)]);
    }).length;
  }

  function textInput(value, ph, cls, onInput){
    const i = el('input');
    i.type = 'text';
    i.className = 'dwg-input ' + (cls || '');
    i.value = value === undefined || value === null ? '' : value;
    i.placeholder = ph;
    i.addEventListener('input', () => onInput(i.value, i));
    return i;
  }

  const qtyInput = (value, ph, onInput) => {
    const i = textInput(value, ph, 'mono-input sor-q', onInput);
    i.inputMode = 'decimal';
    return i;
  };

  function scheduleRow(s, l){
    const k = keyOf(s.title, l.d);
    const row = el('div', 'sor-row');
    const desc = el('div', 'sor-desc');
    desc.appendChild(el('span', 'sor-d')).textContent = l.d;

    if(l.percent !== undefined){
      row.classList.add('sor-row-pct');
      desc.appendChild(el('span', 'sor-meta', qtyText(l.percent) + '% of the measured works on this schedule'));
      row.appendChild(desc);
      const lab = el('label', 'sor-apply');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.checked = !!rates.percents[k];
      cb.addEventListener('change', () => {
        if(cb.checked) rates.percents[k] = { section: s.title, d: l.d, percent: l.percent };
        else delete rates.percents[k];
        row.classList.toggle('on', cb.checked);
        updateRates();
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' Apply'));
      row.appendChild(lab);
      row.classList.toggle('on', cb.checked);
      row.appendChild(el('div', 'sor-amount')).setAttribute('data-pct', k);
      return row;
    }

    const meta = desc.appendChild(el('span', 'sor-meta', escapeHtml(l.u)));
    // shown only once the rate has been typed over
    const adj = meta.appendChild(el('span', 'sor-adj', ' · contract ' + money(l.r) + ' '));
    const reset = adj.appendChild(el('button', 'sor-reset', 'reset'));
    reset.type = 'button';
    reset.title = 'Back to the contract rate';
    row.appendChild(desc);
    const cur = rates.measured[k] || {};
    const entry = () => rates.measured[k] ||
      (rates.measured[k] = { section: s.title, d: l.d, u: l.u, r: l.r, r0: l.r, c: '', add: '', ded: '' });
    const sync = () => {
      const e = rates.measured[k];
      if(e && !touched(e)) delete rates.measured[k];
      row.classList.toggle('on', isMeasured(rates.measured[k]));
      const adjusted = !!rates.measured[k] && num(rates.measured[k].r) !== num(rates.measured[k].r0);
      rateBox.classList.toggle('adjusted', adjusted);
      adj.hidden = !adjusted;
      updateRates();
    };
    const set = (field, v) => { entry()[field] = v; sync(); };

    row.appendChild(textInput(cur.c, 'Comment…', 'sor-c', v => set('c', v)));

    const rateBox = el('div', 'sor-rate-box');
    const rate = textInput(cur.r !== undefined ? cur.r : l.r, String(l.r), 'mono-input sor-r', v => set('r', v));
    rate.inputMode = 'decimal';
    rate.title = 'Contract rate ' + money(l.r) + ' — type over it to adjust for this variation';
    reset.addEventListener('click', () => {
      const e = rates.measured[k];
      if(!e) return;
      e.r = e.r0;
      rate.value = e.r0;
      sync();
    });
    rateBox.appendChild(rate);
    row.appendChild(rateBox);

    row.appendChild(qtyInput(cur.add, 'Add', v => set('add', v)));
    row.appendChild(qtyInput(cur.ded, 'Ded', v => set('ded', v)));
    row.appendChild(el('div', 'sor-amount')).setAttribute('data-key', k);
    row.classList.toggle('on', isMeasured(cur.d ? cur : null));
    const adjusted = cur.d !== undefined && num(cur.r) !== num(cur.r0);
    rateBox.classList.toggle('adjusted', adjusted);
    adj.hidden = !adjusted;
    return row;
  }

  const ROW_HEAD = '<div>Description</div><div>Comment</div><div class="r">Rate</div><div>Add</div><div>Ded</div><div class="r">Total</div>';

  function buildRatesEditor(){
    const q = sorSearch.value.trim().toLowerCase();
    const only = sorOnly.checked;
    const scrollAt = sorSections.closest('.form-side').scrollTop;
    sorSections.innerHTML = '';
    let shownAny = false;

    SOR.sections.forEach(s => {
      const lines = s.lines.filter(l => {
        if(q && l.d.toLowerCase().indexOf(q) === -1 && s.title.toLowerCase().indexOf(q) === -1) return false;
        if(only){
          if(l.percent !== undefined) return !!rates.percents[keyOf(s.title, l.d)];
          return touched(rates.measured[keyOf(s.title, l.d)]);
        }
        return true;
      });
      if(!lines.length) return;
      shownAny = true;
      // searching or filtering opens every section with a hit
      const open = !!(q || only || openSections[s.title]);

      const box = el('div', 'sor-section' + (open ? ' open' : ''));
      const head = el('button', 'sor-section-head');
      head.type = 'button';
      const count = measuredIn(s);
      head.innerHTML = '<span class="sor-caret">' + (open ? '▾' : '▸') + '</span>' +
        '<span class="sor-title">' + escapeHtml(s.title) + '</span>' +
        '<span class="sor-count">' + (count ? count + ' measured' : s.lines.length + ' rates') + '</span>' +
        '<span class="sor-sec-total" data-sec="' + escapeHtml(s.title) + '"></span>';
      head.addEventListener('click', () => {
        openSections[s.title] = !open;
        buildRatesEditor();
        updateRates();
      });
      box.appendChild(head);

      if(open){
        if(s.note) box.appendChild(el('div', 'sor-note')).textContent = s.note;
        const grid = el('div', 'sor-grid');
        grid.appendChild(el('div', 'sor-row sor-row-head', ROW_HEAD));
        lines.forEach(l => grid.appendChild(scheduleRow(s, l)));
        box.appendChild(grid);
      }
      sorSections.appendChild(box);
    });
    if(!shownAny){
      sorSections.appendChild(el('div', 'scope-empty', only ? 'Nothing measured on this schedule yet.' : 'Nothing in the schedule matches.'));
    }
    sorSections.closest('.form-side').scrollTop = scrollAt;
  }

  function buildExtras(){
    sorExtras.innerHTML = '';
    if(rates.extras.length){
      sorExtras.appendChild(el('div', 'sor-xrow sor-row-head',
        '<div>Description</div><div>Comment</div><div>Unit</div><div class="r">Rate</div><div>Add</div><div>Ded</div><div class="r">Total</div><div></div>'));
    }
    rates.extras.forEach(e => {
      const row = el('div', 'sor-xrow');
      const field = (key, cls, ph, decimal) => {
        const i = textInput(e[key], ph, cls, v => { e[key] = v; updateRates(); });
        if(decimal) i.inputMode = 'decimal';
        row.appendChild(i);
        return i;
      };
      field('d', '', 'Description');
      field('c', 'sor-c', 'Comment…');
      field('u', '', 'each');
      field('r', 'mono-input sor-r', '0.00', true);
      field('add', 'mono-input sor-q', 'Add', true);
      field('ded', 'mono-input sor-q', 'Ded', true);
      row.appendChild(el('div', 'sor-amount')).setAttribute('data-extra', e.id);
      const rm = el('button', 'dwg-remove', '&times;');
      rm.type = 'button';
      rm.title = 'Remove line';
      rm.addEventListener('click', () => {
        rates.extras = rates.extras.filter(x => x !== e);
        buildExtras();
        updateRates();
      });
      row.appendChild(rm);
      sorExtras.appendChild(row);
    });
  }

  document.getElementById('sor-extra-add').addEventListener('click', () => {
    rates.extras.push({ id: newId(), d: '', c: '', u: '', r: '', add: '', ded: '' });
    buildExtras();
    updateRates();
    const inputs = sorExtras.querySelectorAll('.sor-xrow:last-child input');
    if(inputs.length) inputs[0].focus();
  });

  sorSearch.addEventListener('input', () => { buildRatesEditor(); updateRates(); });
  sorOnly.addEventListener('change', () => { buildRatesEditor(); updateRates(); });
  sorGst.addEventListener('input', () => { book.gstPercent = sorGst.value; updateRates(); });
  sorNotes.addEventListener('input', () => { rates.notes = sorNotes.value; updateRates(); });

  // the totals of one schedule
  function scheduleRows(c){
    const rows = [['Measured works', c.works]];
    c.percents.forEach(p => rows.push([p.d, p.amount]));
    rows.push([(c.schedule.name || 'Schedule') + ' total (ex GST)', c.exGst, 'strong']);
    return rows;
  }

  // the variation's totals, across every schedule
  function grandRows(g){
    return [
      ['Total (ex GST)', g.exGst, 'strong'],
      ['GST (' + qtyText(num(book.gstPercent)) + '%)', g.gst],
      ['Total (inc GST)', g.incGst, 'grand']
    ];
  }

  const sumRowsHtml = rows => rows.map(r =>
    '<div class="sor-sum-row ' + (r[2] || '') + '"><span>' + escapeHtml(r[0]) + '</span><span>' + money(r[1]) + '</span></div>').join('');

  // the numbers only -- the inputs are left alone so the caret stays put
  function updateRates(){
    const g = computeRates();
    const c = g.list[book.active];
    sorSections.querySelectorAll('[data-key]').forEach(cell => {
      const e = rates.measured[cell.getAttribute('data-key')];
      const amount = e ? diffOf(e) * num(e.r) : 0;
      cell.textContent = amount ? money(amount) : '—';
      cell.classList.toggle('neg', amount < 0);
    });
    sorSections.querySelectorAll('[data-pct]').forEach(cell => {
      const p = rates.percents[cell.getAttribute('data-pct')];
      cell.textContent = p ? money(c.works * p.percent / 100) : '—';
    });
    sorSections.querySelectorAll('[data-sec]').forEach(cell => {
      const sec = c.sections.find(s => s.title === cell.getAttribute('data-sec'));
      cell.textContent = sec ? money(sec.total) : '';
    });
    sorExtras.querySelectorAll('[data-extra]').forEach(cell => {
      const e = rates.extras.find(x => x.id === cell.getAttribute('data-extra'));
      const amount = e ? diffOf(e) * num(e.r) : 0;
      cell.textContent = amount ? money(amount) : '—';
      cell.classList.toggle('neg', amount < 0);
    });
    sorTabs.querySelectorAll('.sor-tab-total').forEach((cell, i) => {
      cell.textContent = g.list[i] && g.list[i].exGst ? money(g.list[i].exGst) : '—';
    });
    let html = sumRowsHtml(scheduleRows(c));
    if(g.list.length > 1){
      html += '<div class="sor-sum-sep">All ' + g.list.length + ' schedules</div>';
    }
    sorSummary.innerHTML = html + sumRowsHtml(grandRows(g));
    renderRatesPreview(g);
    render();   // the cover sheet carries the value
  }

  function renderRates(){
    sorGst.value = book.gstPercent;
    sorNotes.value = rates.notes || '';
    renderTabs();
    buildRatesEditor();
    buildExtras();
    updateRates();
  }

  /* ---- what prints ----------------------------------------------------------- */

  // The comment column only prints on a schedule where something was said.
  function rateHead(withComment){
    return '<thead><tr><th>Description</th>' + (withComment ? '<th>Comment</th>' : '') +
      '<th class="n">Add</th><th class="n">Ded</th><th class="n">Diff</th>' +
      '<th>Unit</th><th class="n">Rate</th><th class="n">Total</th></tr></thead>';
  }
  const hasComments = c => c.sections.some(s => s.lines.some(l => l.c));

  // One table per section, built as real nodes so the PDF can flow its rows.
  function rateTables(c){
    const withComment = hasComments(c);
    return c.sections.map(s => {
      const rows = s.lines.map(l => {
        const tr = el('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(l.d) + '</td>' +
          (withComment ? '<td class="sor-cmt">' + escapeHtml(l.c) + '</td>' : '') +
          '<td class="n">' + (l.add ? qtyText(l.add) : '') + '</td>' +
          '<td class="n">' + (l.ded ? '-' + qtyText(l.ded) : '') + '</td>' +
          '<td class="n">' + qtyText(l.diff) + '</td>' +
          '<td>' + escapeHtml(l.u || '') + '</td>' +
          '<td class="n">' + money(l.r) + '</td>' +
          '<td class="n">' + money(l.amount) + '</td>';
        return tr;
      });
      const tot = el('tr', 'sor-total-row');
      tot.innerHTML = '<td colspan="' + (withComment ? 7 : 6) + '">' + escapeHtml(s.title) + ' total</td><td class="n">' + money(s.total) + '</td>';
      rows.push(tot);
      return { title: s.title, rows: rows, head: rateHead(withComment), cls: withComment ? ' with-cmt' : '' };
    });
  }

  function totalsTable(rows){
    const t = el('table', 'sor-totals');
    t.innerHTML = rows.map(r =>
      '<tr class="' + (r[2] || '') + '"><td>' + escapeHtml(r[0]) + '</td><td class="n">' + money(r[1]) + '</td></tr>').join('');
    return t;
  }

  // with one schedule its own totals run straight on into GST; with several,
  // each shows its subtotal and GST comes once, on the summary
  function scheduleTotalsNode(c, g){
    return totalsTable(g.list.length > 1 ? scheduleRows(c) : scheduleRows(c).concat(grandRows(g)));
  }

  function summaryNodes(g){
    const t = el('table', 'dwg-preview-table sor-table sor-summary-table');
    t.innerHTML = '<thead><tr><th>Schedule</th><th class="n">Total (ex GST)</th></tr></thead><tbody>' +
      g.list.filter(priced).map(c => '<tr><td>' + escapeHtml(c.schedule.name || 'Untitled') + '</td><td class="n">' + money(c.exGst) + '</td></tr>').join('') +
      '</tbody>';
    return [t, totalsTable(grandRows(g))];
  }

  // the schedule's own note, then whatever was typed for this schedule (its
  // exclusions and qualifications are chosen in stage 2 with the others)
  function notesNodes(c){
    const out = [];
    const pre = (SOR.preamble || []).join(' ');
    if(pre){ const p = el('p', 'sor-notes'); p.textContent = pre; out.push(p); }
    const text = (c.schedule.notes || '').trim();
    if(text){ const p = el('p', 'sor-notes'); p.textContent = text; out.push(p); }
    return out;
  }

  const scheduleTitle = (c, g) => (SOR.title || 'Schedule of Rates') +
    (g.list.length > 1 || (c.schedule.name && c.schedule.name !== 'Schedule 1') ? ' — ' + (c.schedule.name || 'Untitled') : '');

  function renderRatesPreview(g){
    const c = g.list[book.active];
    const nodes = [sectionTitle(scheduleTitle(c, g))];
    const tables = rateTables(c);
    tables.forEach(t => {
      const panel = el('div', 'dwg-panel');
      panel.appendChild(el('p', 'dwg-panel-title', escapeHtml(t.title)));
      const table = el('table', 'dwg-preview-table sor-table' + t.cls, t.head);
      const body = el('tbody');
      t.rows.forEach(r => body.appendChild(r));
      table.appendChild(body);
      panel.appendChild(table);
      nodes.push(panel);
    });
    if(!tables.length){
      nodes.push(el('p', 'scope-empty', 'Nothing measured on this schedule yet — enter an Add or Ded quantity against a line and it appears here.'));
    } else {
      nodes.push(scheduleTotalsNode(c, g));
      notesNodes(c).forEach(n => nodes.push(n));
    }
    if(g.list.length > 1 && hasPricing(g)){
      nodes.push(el('p', 'dwg-panel-title scope-pdf-head', 'Summary of schedules'));
      summaryNodes(g).forEach(n => nodes.push(n));
    }
    fillSheet(document.getElementById('rates-sheet'), nodes);
  }

  // the PDF: a summary first when there is more than one, then each schedule
  function appendRatesToPdf(builder){
    const g = computeRates();
    if(!hasPricing(g)) return;
    const priced_ = g.list.filter(priced);
    if(g.list.length > 1){
      builder.startSection();
      builder.place(sectionTitle((SOR.title || 'Schedule of Rates') + ' — Summary'));
      summaryNodes(g).forEach(n => builder.place(n));
    }
    priced_.forEach(c => {
      builder.startSection();
      builder.place(sectionTitle(scheduleTitle(c, g)));
      rateTables(c).forEach(t => placeTable(builder, t.title, t.head, t.rows, 'dwg-preview-table sor-table' + t.cls));
      builder.place(scheduleTotalsNode(c, g));
      notesNodes(c).forEach(n => builder.place(n));
    });
  }

  /* ---- saving with the variation ------------------------------------------- */

  function collectRates(){
    return {
      version: 2,
      gstPercent: book.gstPercent,
      schedules: book.schedules.map(sch => ({
        name: sch.name,
        measured: Object.keys(sch.measured).map(k => sch.measured[k]),
        percents: Object.keys(sch.percents).map(k => sch.percents[k]),
        extras: sch.extras.map(e => ({ d: e.d, c: e.c, u: e.u, r: e.r, add: e.add, ded: e.ded })),
        notes: sch.notes
      }))
    };
  }

  function loadSchedule(saved, fallbackName){
    const sch = newSchedule(saved.name || fallbackName);
    (saved.measured || []).forEach(e => {
      // saved before rates could be adjusted: what was charged was the contract rate
      const m = Object.assign({}, e);
      if(m.r0 === undefined) m.r0 = m.r;
      if(m.c === undefined) m.c = '';
      sch.measured[keyOf(e.section, e.d)] = m;
    });
    (saved.percents || []).forEach(p => { sch.percents[keyOf(p.section, p.d)] = Object.assign({}, p); });
    sch.extras = (saved.extras || []).map(e => Object.assign({ id: newId() }, e, { c: e.c || '' }));
    sch.notes = saved.notes || '';
    return sch;
  }

  function applyRates(saved){
    book = defaultBook();
    if(saved && Array.isArray(saved.schedules) && saved.schedules.length){
      book.schedules = saved.schedules.map((s, i) => loadSchedule(s, 'Schedule ' + (i + 1)));
    } else if(saved && Array.isArray(saved.measured)){
      // one schedule, as saved before there could be several
      book.schedules = [loadSchedule(saved, 'Schedule 1')];
    }
    if(saved && saved.gstPercent !== undefined) book.gstPercent = saved.gstPercent;
    rates = book.schedules[0];
  }

  /* ========================================================================
     STAGE 4 · DOCUMENTATION
  ======================================================================== */

  const BUCKETS = [
    { key: 'drawings', letter: 'A', title: 'Drawings & Markups' },
    { key: 'approvals', letter: 'B', title: 'Approval & Correspondence' }
  ];
  const docs = { drawings: [], approvals: [] };
  const docsStatus = document.getElementById('docs-status');

  function readAs(file, how){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error || new Error('could not read the file'));
      if(how === 'buffer') r.readAsArrayBuffer(file);
      else if(how === 'url') r.readAsDataURL(file);
      else r.readAsText(file);
    });
  }

  const baseName = name => String(name || '').replace(/\.[^.]+$/, '');

  async function addFiles(bucket, files){
    const problems = [];
    for(const file of Array.prototype.slice.call(files)){
      const name = file.name || 'Pasted image.png';
      const lower = name.toLowerCase();
      try {
        if(file.type === 'application/pdf' || /\.pdf$/.test(lower)){
          const bytes = new Uint8Array(await readAs(file, 'buffer'));
          if(typeof PDFLib === 'undefined') throw new Error('the PDF library did not load');
          const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
          docs[bucket].push({ id: newId(), kind: 'pdf', name: name, caption: baseName(name), bytes: bytes,
            pageCount: pdf.getPageCount(), thumb: await pdfThumb(bytes) });
        } else if(/^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp)$/.test(lower)){
          const url = await readAs(file, 'url');
          docs[bucket].push({ id: newId(), kind: 'image', name: name, caption: baseName(name), dataUrl: await asPngOrJpeg(url) });
        } else if(/\.msg$/.test(lower)){
          problems.push(name + ' is an Outlook .msg, which a browser cannot open. In Outlook, use File › Save As › ' +
            '"Text Only" or print the email to PDF, and add that instead.');
        } else if(/\.eml$/.test(lower) || file.type === 'message/rfc822'){
          const email = parseEml(await readAs(file, 'text'));
          docs[bucket].push({ id: newId(), kind: 'email', name: name, caption: email.subject || baseName(name), email: email });
        } else if(/\.txt$/.test(lower) || file.type === 'text/plain'){
          const text = await readAs(file, 'text');
          docs[bucket].push({ id: newId(), kind: 'email', name: name, caption: baseName(name), email: { body: text } });
        } else {
          problems.push(name + ' is not a PDF, image or email, so it cannot be bound into the PDF.');
        }
      } catch(err){
        console.error(err);
        problems.push(name + ' could not be read' + (err && err.message ? ' — ' + err.message : '') + '.');
      }
    }
    docsStatus.textContent = problems.join(' ');
    docsStatus.className = 'status-line' + (problems.length ? ' err' : '');
    renderDocs();
  }

  // html2canvas cannot draw every format a browser can show (webp, bmp), so
  // anything that is not already PNG or JPEG is redrawn on the way in. A photo
  // straight off a phone is 12 megapixels; a page shows it at a fraction of
  // that, so anything bigger than the page can use is scaled down here too --
  // which keeps the variation file a sensible size as well as the PDF.
  const MAX_IMAGE_EDGE = 2400;
  function asPngOrJpeg(url){
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const fits = Math.max(w, h) <= MAX_IMAGE_EDGE;
        const jpeg = /^data:image\/jpe?g/i.test(url);
        if(fits && (jpeg || /^data:image\/png/i.test(url))){ resolve(url); return; }
        const k = fits ? 1 : MAX_IMAGE_EDGE / Math.max(w, h);
        const c = document.createElement('canvas');
        c.width = Math.round(w * k);
        c.height = Math.round(h * k);
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        if(jpeg){ ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        // photos stay photos; screenshots stay crisp
        resolve(jpeg ? c.toDataURL('image/jpeg', 0.85) : c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  /* ---- reading a saved email (.eml) ------------------------------------ */

  function parseHeaders(text){
    const out = {};
    text.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(line => {
      const i = line.indexOf(':');
      if(i < 1) return;
      const key = line.slice(0, i).trim().toLowerCase();
      if(!(key in out)) out[key] = line.slice(i + 1).trim();
    });
    return out;
  }

  function decodeBytes(bytes, charset){
    try { return new TextDecoder(charset || 'utf-8').decode(bytes); }
    catch(e){ return new TextDecoder('utf-8').decode(bytes); }
  }

  function binaryToBytes(bin){
    const b = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i) & 0xff;
    return b;
  }

  function utf8Bytes(text){ return new TextEncoder().encode(text); }

  function decodeQP(text, charset){
    const soft = text.replace(/=\r?\n/g, '');
    const bytes = [];
    for(let i = 0; i < soft.length; i++){
      const ch = soft[i];
      if(ch === '=' && /^[0-9A-F]{2}$/i.test(soft.substr(i + 1, 2))){
        bytes.push(parseInt(soft.substr(i + 1, 2), 16));
        i += 2;
      } else {
        utf8Bytes(ch).forEach(b => bytes.push(b));
      }
    }
    return decodeBytes(new Uint8Array(bytes), charset);
  }

  // =?utf-8?B?...?= and =?utf-8?Q?...?= in subject and address lines
  function decodeWords(value){
    return String(value || '').replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=\s*/gi, (all, charset, enc, data) => {
      try {
        if(enc.toUpperCase() === 'B') return decodeBytes(binaryToBytes(atob(data)), charset);
        return decodeQP(data.replace(/_/g, ' '), charset);
      } catch(e){ return all; }
    });
  }

  function htmlToText(html){
    const d = new DOMParser().parseFromString(html, 'text/html');
    d.querySelectorAll('style,script,head').forEach(n => n.remove());
    d.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
    d.querySelectorAll('p,div,tr,li,h1,h2,h3,h4,blockquote').forEach(n => n.append('\n'));
    return (d.body ? d.body.textContent : '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function partText(headers, body, depth){
    const type = headers['content-type'] || 'text/plain';
    const boundary = /boundary="?([^";]+)"?/i.exec(type);
    if(/multipart\//i.test(type) && boundary && depth < 6){
      let html = null;
      const parts = body.split('--' + boundary[1]);
      for(let i = 1; i < parts.length; i++){
        let part = parts[i];
        if(part.indexOf('--') === 0) break;
        part = part.replace(/^\r?\n/, '');
        const cut = part.search(/\r?\n\r?\n/);
        if(cut === -1) continue;
        const found = partText(parseHeaders(part.slice(0, cut)), part.slice(cut).replace(/^\r?\n\r?\n/, ''), depth + 1);
        if(found && found.plain) return found;
        if(found && !html) html = found;
      }
      return html;
    }
    if(/attachment/i.test(headers['content-disposition'] || '')) return null;
    if(!/text\/(plain|html)/i.test(type)) return null;
    const charset = (/charset="?([^";]+)"?/i.exec(type) || [])[1];
    const enc = (headers['content-transfer-encoding'] || '').toLowerCase();
    let text = body;
    if(enc === 'base64') text = decodeBytes(binaryToBytes(atob(body.replace(/\s+/g, ''))), charset);
    else if(enc === 'quoted-printable') text = decodeQP(body, charset);
    return /text\/html/i.test(type) ? { plain: false, text: htmlToText(text) } : { plain: true, text: text.trim() };
  }

  function parseEml(raw){
    const cut = raw.search(/\r?\n\r?\n/);
    const headers = parseHeaders(cut === -1 ? raw : raw.slice(0, cut));
    let body = '';
    try {
      const found = partText(headers, cut === -1 ? '' : raw.slice(cut).replace(/^\r?\n\r?\n/, ''), 0);
      body = found ? found.text : '';
    } catch(e){ body = ''; }
    return {
      from: decodeWords(headers.from),
      to: decodeWords(headers.to),
      cc: decodeWords(headers.cc),
      date: headers.date || '',
      subject: decodeWords(headers.subject),
      body: body
    };
  }

  /* ---- the upload lists --------------------------------------------------- */

  document.querySelectorAll('.drop-zone').forEach(zone => {
    const bucket = zone.getAttribute('data-bucket');
    const input = zone.querySelector('input[type=file]');
    input.addEventListener('change', () => { addFiles(bucket, input.files); input.value = ''; });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('over');
      if(e.dataTransfer && e.dataTransfer.files.length) addFiles(bucket, e.dataTransfer.files);
    });
  });

  // a screenshot pasted anywhere on this stage is approval evidence, nine
  // times out of ten -- that is what someone snips from an email or Teams
  document.addEventListener('paste', e => {
    if(stage !== 'docs' || !e.clipboardData) return;
    if(/^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
    const files = Array.prototype.slice.call(e.clipboardData.items || [])
      .filter(i => i.kind === 'file' && /^image\//.test(i.type)).map(i => i.getAsFile()).filter(Boolean);
    if(!files.length) return;
    e.preventDefault();
    const stamp = new Date().toLocaleString('en-AU');
    addFiles('approvals', files.map((f, i) => new File([f], 'Screenshot ' + stamp + (i ? ' (' + (i + 1) + ')' : '') + '.png', { type: f.type })));
  });

  function docKindLabel(d){
    if(d.kind === 'pdf') return 'PDF · ' + d.pageCount + (d.pageCount === 1 ? ' page' : ' pages');
    if(d.kind === 'image') return 'Image';
    return d.email && d.email.from ? 'Email' : 'Text';
  }

  function docThumb(d){
    const t = el('div', 'doc-thumb doc-thumb-' + d.kind);
    if(d.kind === 'image' || d.thumb){
      const img = el('img');
      img.src = d.kind === 'image' ? d.dataUrl : d.thumb;
      img.alt = '';
      t.appendChild(img);
    } else {
      t.textContent = d.kind === 'pdf' ? 'PDF' : '✉';
    }
    return t;
  }

  function renderDocList(bucket){
    const list = document.getElementById('doc-list-' + bucket);
    list.innerHTML = '';
    docs[bucket].forEach((d, i) => {
      const card = el('div', 'doc-card');
      card.appendChild(docThumb(d));
      const mid = el('div', 'doc-mid');
      const cap = el('input');
      cap.type = 'text';
      cap.value = d.caption;
      cap.placeholder = 'Title';
      cap.addEventListener('input', () => { d.caption = cap.value; renderDocsPreview(); });
      mid.appendChild(cap);
      mid.appendChild(el('div', 'doc-meta')).textContent = docKindLabel(d) + ' · ' + d.name;
      card.appendChild(mid);
      const acts = el('div', 'doc-acts');
      const act = (label, title, fn, disabled) => {
        const b = el('button', 'row-btn', label);
        b.type = 'button';
        b.title = title;
        b.disabled = !!disabled;
        b.addEventListener('click', fn);
        acts.appendChild(b);
      };
      const move = by => {
        const arr = docs[bucket];
        arr.splice(i + by, 0, arr.splice(i, 1)[0]);
        renderDocs();
      };
      act('↑', 'Move up', () => move(-1), i === 0);
      act('↓', 'Move down', () => move(1), i === docs[bucket].length - 1);
      act('&times;', 'Remove', () => { docs[bucket].splice(i, 1); renderDocs(); });
      card.appendChild(acts);
      list.appendChild(card);
    });
  }

  function renderDocsPreview(){
    const pane = document.getElementById('docs-preview');
    pane.innerHTML = '';
    BUCKETS.forEach(b => {
      const sec = el('div', 'docs-section');
      sec.appendChild(el('p', 'dwg-panel-title', 'Attachment ' + b.letter + ' — ' + escapeHtml(b.title)));
      if(!docs[b.key].length){
        sec.appendChild(el('div', 'docs-empty', 'Nothing attached yet.'));
      } else {
        const grid = el('div', 'docs-grid');
        docs[b.key].forEach((d, i) => {
          const tile = el('div', 'docs-tile');
          if(d.kind === 'email'){
            const mail = el('div', 'docs-mail');
            const e = d.email || {};
            mail.innerHTML = (e.from ? '<div><b>From</b> ' + escapeHtml(e.from) + '</div>' : '') +
              (e.date ? '<div><b>Date</b> ' + escapeHtml(e.date) + '</div>' : '') +
              (e.subject ? '<div><b>Subject</b> ' + escapeHtml(e.subject) + '</div>' : '') +
              '<p>' + escapeHtml((e.body || '').slice(0, 400)) + '</p>';
            tile.appendChild(mail);
          } else {
            tile.appendChild(docThumb(d));
          }
          tile.appendChild(el('div', 'docs-cap')).textContent = b.letter + (i + 1) + ' · ' + (d.caption || d.name);
          tile.appendChild(el('div', 'doc-meta')).textContent = docKindLabel(d);
          grid.appendChild(tile);
        });
        sec.appendChild(grid);
      }
      pane.appendChild(sec);
    });
  }

  function renderDocs(){
    BUCKETS.forEach(b => renderDocList(b.key));
    renderDocsPreview();
  }

  /* ========================================================================
     THE PDF — the pages stages 2 to 4 add after the letter
  ======================================================================== */

  // a table whose rows flow over pages, its heading and column titles
  // repeated on each page it runs onto
  function placeTable(builder, title, theadHtml, rows, tableClass){
    let tbody = null;
    let panel = null;
    function fresh(continued){
      panel = el('div', 'dwg-panel');
      panel.appendChild(el('p', 'dwg-panel-title', escapeHtml(title + (continued ? ' (continued)' : ''))));
      const table = el('table', tableClass, theadHtml);
      tbody = el('tbody');
      table.appendChild(tbody);
      panel.appendChild(table);
      return panel;
    }
    builder.place(fresh(false));
    rows.forEach(tr => {
      tbody.appendChild(tr);
      if(!builder.overflows()) return;
      tbody.removeChild(tr);
      if(!tbody.children.length){
        // not even one row fits under the heading: take the heading over too
        panel.remove();
        builder.newPage();
        builder.place(fresh(false));
      } else {
        builder.newPage();
        builder.place(fresh(true));
      }
      tbody.appendChild(tr);
    });
  }

  // a long block of text split into page-sized paragraphs
  function placeText(builder, text, cls){
    const paras = String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    paras.forEach(p => {
      // a paragraph longer than a page would be clipped, so cut it by lines
      const lines = p.split('\n');
      let chunk = [];
      const flush = () => {
        if(!chunk.length) return;
        const node = el('p', cls);
        node.textContent = chunk.join('\n');
        builder.place(node);
        chunk = [];
      };
      lines.forEach(line => {
        chunk.push(line);
        if(chunk.join('\n').length > 1400) flush();
      });
      flush();
    });
  }

  function appendToPdf(builder){
    // ---- inclusions & exclusions
    const blocks = scopeBlocks();
    if(blocks.length){
      builder.startSection();
      builder.place(sectionTitle('Inclusions & Exclusions'));
      blocks.forEach(b => {
        // the heading travels with its first line, never alone at a page foot
        const lead = el('div');
        lead.appendChild(el('p', 'dwg-panel-title scope-pdf-head', escapeHtml(b.heading)));
        lead.appendChild(b.items[0]);
        builder.place(lead);
        b.items.slice(1).forEach(i => builder.place(i));
      });
    }

    // ---- schedule(s) of rates
    appendRatesToPdf(builder);

    // ---- attachments: an index page per bucket, then each document
    BUCKETS.forEach(b => {
      const list = docs[b.key];
      if(!list.length) return;
      builder.startSection();
      builder.place(sectionTitle('Attachment ' + b.letter + ' — ' + b.title));
      const rows = list.map((d, i) => {
        const tr = el('tr');
        tr.innerHTML = '<td class="rev">' + b.letter + (i + 1) + '</td><td>' + escapeHtml(d.caption || d.name) +
          '</td><td>' + escapeHtml(docKindLabel(d)) + '</td>';
        return tr;
      });
      placeTable(builder, 'Documents attached', '<thead><tr><th>No.</th><th>Title</th><th>Type</th></tr></thead>',
        rows, 'dwg-preview-table');

      list.forEach((d, i) => {
        const label = b.letter + (i + 1) + ' · ' + (d.caption || d.name);
        if(d.kind === 'pdf'){
          builder.external(d.pageCount, d.bytes);
          return;
        }
        builder.newPage();
        builder.place(el('p', 'attach-cap')).textContent = label;
        if(d.kind === 'image'){
          const wrap = builder.body().parentNode;
          // the page body less its top padding and the caption above
          const room = wrap.clientHeight - 26 - 40;
          const img = el('img', 'attach-img');
          img.src = d.dataUrl;
          img.style.maxHeight = room + 'px';
          const box = el('div', 'attach-img-box');
          box.appendChild(img);
          builder.place(box);
        } else {
          const e = d.email || {};
          const head = [['From', e.from], ['To', e.to], ['Cc', e.cc], ['Date', e.date], ['Subject', e.subject]].filter(r => r[1]);
          if(head.length){
            const t = el('table', 'ref-table email-head');
            t.innerHTML = head.map(r => '<tr><td class="k">' + r[0] + '</td><td class="v">' + escapeHtml(r[1]) + '</td></tr>').join('');
            builder.place(t);
          }
          placeText(builder, e.body || '', 'email-body');
        }
      });
    });
  }

  /* ========================================================================
     STAGE 5 · REVIEW
  ======================================================================== */

  const reviewPages = document.getElementById('review-pages');
  const pdfSizeLine = document.getElementById('pdf-size');
  const reviewBuilding = document.getElementById('review-building');
  const reviewList = document.getElementById('review-list');
  let built = null;      // { bytes, fileName } of what the preview shows
  let buildToken = 0;

  function dropBuild(){
    built = null;
    buildToken++;
    reviewPages.innerHTML = '';
  }

  // The finished file, drawn page by page with pdf.js. Not the browser's own
  // PDF viewer in a frame: that is switched off or blank in enough places
  // (Edge policies, phones, some sign-in setups) that the preview could not
  // be trusted to show anything.
  async function drawPdfPages(bytes, token){
    if(typeof pdfjsLib === 'undefined') throw new Error('the PDF viewer did not load');
    // pdf.js takes ownership of the buffer it is given, so hand it a copy
    const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    const width = Math.max(320, Math.min(reviewPages.clientWidth - 4, 860));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for(let n = 1; n <= doc.numPages; n++){
      if(token !== buildToken) return;
      const page = await doc.getPage(n);
      const scale = width / page.getViewport({ scale: 1 }).width;
      const vp = page.getViewport({ scale: scale * ratio });
      const canvas = el('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.floor(vp.width / ratio) + 'px';
      const wrap = el('div', 'review-page');
      wrap.appendChild(canvas);
      wrap.appendChild(el('div', 'review-page-num', 'Page ' + n + ' of ' + doc.numPages));
      reviewPages.appendChild(wrap);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    }
    doc.destroy();
  }

  // the first sheet of an uploaded PDF, small, for the documentation stage
  async function pdfThumb(bytes){
    if(typeof pdfjsLib === 'undefined') return '';
    try {
      const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 320 / page.getViewport({ scale: 1 }).width });
      const canvas = el('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      doc.destroy();
      return canvas.toDataURL('image/png');
    } catch(e){ return ''; }
  }

  function missingCover(){
    return REQUIRED_FIELDS.filter(f => !els[f.id].value.trim()).map(f => f.label);
  }

  function renderReviewList(){
    const p = scopePrinted();
    const c = computeRates();
    const drawings = docs.drawings, approvals = docs.approvals;
    const missing = missingCover();
    const ref = [effectiveRef(), els['variationdesc'].value.trim()].filter(Boolean).join(' — ');
    const items = [
      { stage: 'cover', title: 'Cover sheet', ok: !missing.length,
        text: missing.length ? 'Still needs: ' + missing.join(', ') : (ref || els['project'].value.trim() || 'Ready') },
      { stage: 'scope', title: 'Inclusions & exclusions', ok: true, warn: !(p.in.length + p.out.length),
        text: p.in.length + ' included · ' + p.out.length + ' excluded · ' + (p.gen.length + p.qual.length) + ' notes' },
      { stage: 'rates', title: 'Schedule of rates', ok: true, warn: !hasPricing(c),
        text: hasPricing(c) ? money(c.exGst) + ' ex GST · ' + money(c.incGst) + ' inc GST' +
          (c.list.length > 1 ? ' · ' + c.list.length + ' schedules' : '') : 'Nothing measured — no schedule page will print' },
      { stage: 'docs', title: 'Drawings & markups', ok: true, warn: !drawings.length,
        text: drawings.length ? drawings.length + ' attached' : 'None attached' },
      { stage: 'docs', title: 'Approval & correspondence', ok: true, warn: !approvals.length,
        text: approvals.length ? approvals.length + ' attached' : 'None attached — consider adding the email or direction that approved it' }
    ];
    reviewList.innerHTML = '';
    items.forEach(it => {
      const li = el('li', 'review-item ' + (!it.ok ? 'bad' : it.warn ? 'warn' : 'ok'));
      li.innerHTML = '<span class="ri-mark">' + (!it.ok ? '!' : it.warn ? '–' : '✓') + '</span>' +
        '<span class="ri-body"><span class="ri-title">' + escapeHtml(it.title) + '</span>' +
        '<span class="ri-text">' + escapeHtml(it.text) + '</span></span>';
      const edit = el('button', 'link-btn', 'Edit');
      edit.type = 'button';
      edit.addEventListener('click', () => go(it.stage));
      li.appendChild(edit);
      reviewList.appendChild(li);
    });
  }

  async function enterReview(){
    renderReviewList();
    render();
    dropBuild();
    const token = buildToken;
    reviewBuilding.hidden = false;
    pdfSizeLine.textContent = '';
    VIEWS.review.querySelector('.preview-side').scrollTop = 0;
    reviewBuilding.className = 'review-building';
    reviewBuilding.textContent = 'Building the preview…';
    printBtn.disabled = true;
    printStatus.textContent = '';
    fileState.textContent = '';
    try {
      const result = await buildVariationPdf();
      if(token !== buildToken) return;   // left the stage while it was building
      built = result;
      const size = describePdfSize(result);
      pdfSizeLine.textContent = size.text;
      pdfSizeLine.className = 'status-line ' + size.cls;
      // the download is ready as soon as the file is; the pages draw after
      printBtn.disabled = false;
      reviewBuilding.textContent = 'Drawing the pages…';
      await drawPdfPages(result.bytes, token);
      if(token === buildToken) reviewBuilding.hidden = true;
    } catch(err){
      console.error(err);
      if(token !== buildToken) return;
      reviewBuilding.textContent = built
        ? 'The PDF is built and Download PDF works, but the pages could not be drawn here (' + (err.message || 'unknown error') + ').'
        : 'The preview could not be built (' + (err.message || 'unknown error') + '). Download PDF will fall back to the print dialog.';
      reviewBuilding.className = 'review-building err';
    } finally {
      if(token === buildToken) printBtn.disabled = false;
    }
  }

  document.getElementById('review-rebuild').addEventListener('click', enterReview);

  /* ========================================================================
     SAVING AND REOPENING (with the rest of the form, in the variation log)
  ======================================================================== */

  function collect(){
    return {
      scope: scopeItems.map(i => ({ text: i.text, group: i.group, state: i.state, custom: !!i.custom })),
      rates: collectRates(),
      valueExGst: Math.round(computeRates().exGst * 100) / 100
    };
  }

  // a variation saved before these stages existed comes back with the defaults
  function apply(saved){
    scopeItems = (saved && Array.isArray(saved.scope))
      ? saved.scope.map(i => ({ id: newId(), text: i.text, group: i.group, state: i.state, custom: !!i.custom }))
      : defaultScope();
    // lines the library has gained since it was saved are offered, unselected
    defaultScope().forEach(d => {
      if(!scopeItems.some(i => i.group === d.group && i.text === d.text)){
        const last = scopeItems.map(i => i.group).lastIndexOf(d.group);
        scopeItems.splice(last === -1 ? scopeItems.length : last + 1, 0, d);
      }
    });
    applyRates(saved && saved.rates);
    docs.drawings = [];
    docs.approvals = [];
    if(stage === 'scope') renderScope();
    if(stage === 'rates') renderRates();
    if(stage === 'docs') renderDocs();
  }

  /* ---- attachments, for the variation file ---------------------------------
     The log cannot hold files, so they travel only in the variation file: a
     PDF as base64, an image as the data URL it already is, an email as text. */
  function collectDocs(){
    const out = [];
    BUCKETS.forEach(b => docs[b.key].forEach(d => {
      const item = { bucket: b.key, kind: d.kind, name: d.name, caption: d.caption };
      if(d.kind === 'pdf'){ item.pageCount = d.pageCount; item.base64 = bytesToBase64(d.bytes); }
      else if(d.kind === 'image'){ item.dataUrl = d.dataUrl; }
      else { item.email = d.email; }
      out.push(item);
    }));
    return out;
  }

  function applyDocs(list){
    docs.drawings = [];
    docs.approvals = [];
    (list || []).forEach(item => {
      const bucket = docs[item.bucket] ? item.bucket : 'drawings';
      const d = { id: newId(), kind: item.kind, name: item.name || 'Attachment', caption: item.caption || '' };
      if(item.kind === 'pdf'){
        const bin = atob(item.base64 || '');
        d.bytes = new Uint8Array(bin.length);
        for(let i = 0; i < bin.length; i++) d.bytes[i] = bin.charCodeAt(i);
        d.pageCount = item.pageCount || 1;
        d.thumb = '';
        // thumbnails are not saved; draw them again in the background
        pdfThumb(d.bytes).then(t => { d.thumb = t; if(stage === 'docs') renderDocs(); });
      } else if(item.kind === 'image'){
        d.dataUrl = item.dataUrl;
      } else {
        d.email = item.email || { body: '' };
      }
      docs[bucket].push(d);
    });
    if(stage === 'docs') renderDocs();
  }

  function valueLine(){
    const c = computeRates();
    if(!c.exGst) return '';
    return money(c.exGst) + ' ex GST (' + money(c.incGst) + ' inc GST)';
  }

  return {
    show: show,
    go: go,
    current: () => stage,
    currentBuild: () => built,
    collect: collect,
    apply: apply,
    collectDocs: collectDocs,
    applyDocs: applyDocs,
    appendToPdf: appendToPdf,
    valueLine: valueLine
  };
})();
