/* ============================================================================
   PROJECTS AND THE PROJECT DASHBOARD
   ============================================================================
   Between picking an office and working on a variation:

     #/state/VIC              every project in the office's register, each
                              with its variation count and value
     #/state/VIC/project/7    that project's variations: totals by status,
                              and a row per variation to open or update

   Everything shown comes from two flows the app already uses: Get projects,
   and the variation log's read flow. The office-wide totals come from one
   read when the log flow answers for a whole state (the "no project" branch in
   docs/PROJECT-DASHBOARD.md); without it, the projects are asked one by one.

   Values and statuses are read from each row's saved form first and the log's
   own columns second, so a log list without the new columns still works.
============================================================================ */

const Dashboard = (function(){

  const viewProjects = document.getElementById('view-projects');
  const viewProject = document.getElementById('view-dashboard');
  const pjGrid = document.getElementById('pj-grid');
  const pjStatus = document.getElementById('pj-status');
  const pjSearch = document.getElementById('pj-search');
  const pjKpis = document.getElementById('pj-kpis');
  const dbRows = document.getElementById('db-rows');
  const dbStatus = document.getElementById('db-status');
  const dbKpis = document.getElementById('db-kpis');
  const dbSearch = document.getElementById('db-search');

  const money = n => (n === null || n === undefined) ? '—'
    : Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  const shortMoney = n => {
    if(n === null || n === undefined) return '—';
    const a = Math.abs(n);
    if(a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if(a >= 1e4) return '$' + Math.round(n / 1e3).toLocaleString('en-AU') + 'k';
    return money(n);
  };
  const day = iso => {
    if(!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? String(iso).slice(0, 10) : d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const setLine = (el, text, cls) => { el.textContent = text || ''; el.className = 'status-line' + (cls ? ' ' + cls : ''); };

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }

  document.querySelectorAll('.board-logo').forEach(b => {
    if(typeof BANNER_LOGO !== 'undefined') b.innerHTML = '<img src="' + BANNER_LOGO + '" alt="Axis Services Group">';
  });
  document.querySelectorAll('[data-settings]').forEach(b => b.addEventListener('click', () => { location.hash = '#/settings'; }));

  /* ---- the office's log, held per office ---------------------------------
     { rows: by project id -> [rows] | undefined while loading | Error,
       whole: true when it came in one read } */
  const offices = {};

  function rowsFor(code){ return offices[code] || (offices[code] = { byProject: {}, loaded: false, loading: null }); }

  function group(rows){
    const by = {};
    rows.forEach(r => { const k = String(r.projectId || ''); (by[k] = by[k] || []).push(r); });
    return by;
  }

  async function loadOffice(code, force){
    const o = rowsFor(code);
    if(o.loading && !force) return o.loading;
    if(o.loaded && !force) return o;
    o.loading = (async () => {
      if(!Flows.has('logReadUrl')){ o.loaded = true; o.noLog = true; return o; }
      try {
        const rows = await Flows.listStateLog(code);
        o.byProject = group(rows);
        o.whole = true;
      } catch(err){
        // the read flow has no whole-office branch yet: ask project by project
        o.whole = false;
        const queue = projects.slice();
        const worker = async () => {
          while(queue.length){
            const p = queue.shift();
            if(currentState && currentState.code !== code) return;
            try { o.byProject[String(p.id)] = await Flows.listLog(code, p.id); }
            catch(e){ o.byProject[String(p.id)] = e; }
            if(!viewProjects.hidden) renderProjects();
          }
        };
        await Promise.all([worker(), worker(), worker(), worker()]);
      }
      o.loaded = true;
      return o;
    })();
    try { return await o.loading; } finally { o.loading = null; }
  }

  /* ---- revisions ------------------------------------------------------------
     VAR-001, VAR-001.1 and VAR-001A are one variation at three points in its
     life. Totals count each once, at its latest revision; the earlier ones
     are listed, marked superseded. */
  function revRank(row){
    const parsed = parseRef(row.variationRef);
    const rev = parsed ? parsed.revision.replace(/^[.\-_]/, '') : '';
    if(!rev) return 0;
    if(/^\d+$/.test(rev)) return 1000 + Number(rev);
    return 100 + rev.toUpperCase().charCodeAt(0);
  }
  const baseOf = row => { const p = parseRef(row.variationRef); return p ? p.base : row.variationRef; };
  const numberOf = row => { const p = parseRef(row.variationRef); return p ? p.number : 0; };

  function organise(rows){
    const groups = {};
    rows.forEach(r => { const b = baseOf(r); (groups[b] = groups[b] || []).push(r); });
    return Object.keys(groups)
      .map(b => {
        const list = groups[b].slice().sort((x, y) => revRank(x) - revRank(y));
        return { base: b, number: numberOf(list[0]), rows: list, current: list[list.length - 1] };
      })
      .sort((a, b) => a.number - b.number || a.base.localeCompare(b.base));
  }

  function summarise(rows){
    const groups = organise(rows || []);
    const s = { count: groups.length, value: 0, priced: 0, approved: 0, approvedCount: 0, pending: 0,
                pendingCount: 0, draft: 0, rejected: 0, latest: '' };
    groups.forEach(g => {
      const r = g.current;
      const v = Flows.rowValue(r);
      const st = Flows.rowStatus(r);
      if(v !== null){ s.value += v; s.priced++; }
      if(st.status === 'Approved'){ s.approvedCount++; s.approved += st.approvedValue !== '' ? st.approvedValue : (v || 0); }
      if(st.status === 'Submitted'){ s.pendingCount++; s.pending += v || 0; }
      if(st.status === 'Draft') s.draft++;
      if(st.status === 'Rejected') s.rejected++;
      const when = r.downloadedAt || r.updatedAt || '';
      if(when > s.latest) s.latest = when;
    });
    return s;
  }

  function kpiTiles(target, tiles){
    target.innerHTML = tiles.map(t =>
      '<div class="kpi ' + (t.cls || '') + '"><div class="kpi-k">' + escapeHtml(t.k) + '</div>' +
      '<div class="kpi-v">' + escapeHtml(t.v) + '</div>' +
      (t.sub ? '<div class="kpi-sub">' + escapeHtml(t.sub) + '</div>' : '') + '</div>').join('');
  }

  /* ========================================================================
     THE PROJECTS PAGE
  ======================================================================== */

  async function showProjects(){
    showOnly(viewProjects);
    const code = currentState.code;
    document.getElementById('pj-crumb-office').textContent = currentState.code;
    document.getElementById('pj-title').textContent = (currentState.name || currentState.code) + ' projects';
    pjGrid.innerHTML = '';
    pjKpis.innerHTML = '';
    setLine(pjStatus, 'Reading the project register…');
    await projectsLoading;
    if(!currentState || currentState.code !== code || viewProjects.hidden) return;

    if(!Flows.has('projectsUrl') || !projects.length){
      setLine(pjStatus, '');
      pjGrid.innerHTML = '';
      const empty = el('div', 'home-empty');
      empty.innerHTML = '<strong>' + (Flows.has('projectsUrl') ? 'No projects came back for ' + escapeHtml(code)
        : 'The project register is not connected') + '</strong>' +
        escapeHtml(projectStatus.textContent || 'Without the register, a variation can still be made with the project typed in by hand.');
      const go = el('button', 'print-btn', 'Start a variation by hand');
      go.type = 'button';
      go.style.width = 'auto';
      go.style.marginTop = '16px';
      go.addEventListener('click', () => Stages.go('cover'));
      empty.appendChild(el('div')).appendChild(go);
      pjGrid.appendChild(empty);
      return;
    }
    // what was read last time straight away, then read again: a variation
    // saved since is the thing someone comes back here to see
    renderProjects();
    setLine(pjStatus, Flows.has('logReadUrl') ? 'Reading the variation log…' : '');
    const o = await loadOffice(code, true);
    if(!currentState || currentState.code !== code) return;
    renderProjects();
    setLine(pjStatus, o.noLog ? 'The variation log is not connected, so there are no totals to show.'
      : o.whole ? '' : 'Totals read project by project. Add the log flow\'s whole-office step to load them in one go (docs/PROJECT-DASHBOARD.md).');
  }

  function renderProjects(){
    if(!currentState) return;
    const o = rowsFor(currentState.code);
    const q = pjSearch.value.trim().toLowerCase();
    const shown = projects.filter(p => !q ||
      [p.project, p.headContractor, p.attention, String(p.id)].join(' ').toLowerCase().indexOf(q) !== -1);
    const all = { count: 0, value: 0, approved: 0, pending: 0 };

    pjGrid.innerHTML = '';
    shown.forEach(p => {
      const rows = o.byProject[String(p.id)];
      const card = el('a', 'project-card');
      card.href = '#/state/' + encodeURIComponent(currentState.code) + '/project/' + encodeURIComponent(p.id);
      card.appendChild(el('div', 'pc-name')).textContent = p.project || 'Project ' + p.id;
      card.appendChild(el('div', 'pc-sub')).textContent = [p.headContractor, p.attention].filter(Boolean).join(' · ') || ' ';
      const stats = el('div', 'pc-stats');
      if(rows instanceof Error){
        stats.innerHTML = '<span class="pc-err">Could not read its log</span>';
      } else if(!rows && !o.loaded && !o.noLog){
        stats.innerHTML = '<span class="pc-loading">Loading…</span>';
      } else if(!o.noLog){
        const s = summarise(rows || []);
        all.count += s.count; all.value += s.value; all.approved += s.approved; all.pending += s.pending;
        stats.innerHTML =
          '<span><b>' + s.count + '</b> variation' + (s.count === 1 ? '' : 's') + '</span>' +
          '<span><b>' + shortMoney(s.count ? s.value : 0) + '</b> ex GST</span>' +
          (s.approvedCount ? '<span class="ok">' + s.approvedCount + ' approved</span>' : '') +
          (s.pendingCount ? '<span class="warn">' + s.pendingCount + ' pending</span>' : '') +
          (s.draft ? '<span>' + s.draft + ' draft</span>' : '');
      }
      card.appendChild(stats);
      pjGrid.appendChild(card);
    });
    if(!shown.length){
      pjGrid.appendChild(el('div', 'scope-empty', 'No project matches “' + escapeHtml(q) + '”.'));
    }
    if(!o.noLog && o.loaded){
      kpiTiles(pjKpis, [
        { k: 'Projects', v: String(projects.length) },
        { k: 'Variations', v: String(all.count) },
        { k: 'Total value ex GST', v: money(all.value) },
        { k: 'Approved', v: money(all.approved), cls: 'ok' },
        { k: 'Pending approval', v: money(all.pending), cls: 'warn' }
      ]);
    }
  }

  pjSearch.addEventListener('input', renderProjects);
  document.getElementById('pj-refresh').addEventListener('click', async () => {
    if(!currentState) return;
    projectsLoading = loadProjects();
    await projectsLoading;
    renderProjects();
    setLine(pjStatus, 'Reading the variation log…');
    const o = await loadOffice(currentState.code, true);
    renderProjects();
    setLine(pjStatus, o.whole || o.noLog ? '' : 'Totals read project by project.');
  });

  /* ========================================================================
     ONE PROJECT
  ======================================================================== */

  let shownProject = null;
  let shownRows = [];
  let dbFilter = 'all';

  function projectById(id){ return projects.find(p => String(p.id) === String(id)) || null; }

  async function showProject(id){
    showOnly(viewProject);
    const code = currentState.code;
    const officeLink = document.getElementById('db-crumb-office');
    officeLink.textContent = code;
    officeLink.href = '#/state/' + encodeURIComponent(code);
    dbRows.innerHTML = '';
    dbKpis.innerHTML = '';
    setLine(dbStatus, 'Reading the project register…');
    await projectsLoading;
    if(!currentState || currentState.code !== code || viewProject.hidden) return;
    const project = projectById(id);
    if(!project){
      shownProject = null;
      document.getElementById('db-title').textContent = 'Project not found';
      document.getElementById('db-crumb-project').textContent = String(id);
      setLine(dbStatus, 'There is no project ' + id + ' in the ' + code + ' register.', 'err');
      return;
    }
    shownProject = project;
    document.getElementById('db-title').textContent = project.project || 'Project ' + project.id;
    document.getElementById('db-crumb-project').textContent = project.project || String(project.id);
    document.getElementById('db-sub').innerHTML = [
      project.headContractor ? escapeHtml(project.headContractor) : '',
      project.attention ? 'Attention ' + escapeHtml(project.attention) : '',
      project.folderPath ? '<code>' + escapeHtml(project.folderPath) + '</code>' : ''
    ].filter(Boolean).join(' · ');
    await loadProject(false);
  }

  // The project's own log, read fresh: this is the page someone acts on.
  async function loadProject(){
    const project = shownProject;
    if(!project) return;
    if(!Flows.has('logReadUrl')){
      shownRows = [];
      renderProject();
      setLine(dbStatus, 'The variation log is not connected, so there is no history to show.');
      return;
    }
    setLine(dbStatus, 'Reading the variation log…');
    try {
      const rows = await Flows.listLog(currentState.code, project.id);
      if(shownProject !== project) return;
      shownRows = rows;
      rowsFor(currentState.code).byProject[String(project.id)] = rows;
      renderProject();
      setLine(dbStatus, rows.length ? '' : 'No variations logged for this project yet.');
    } catch(err){
      setLine(dbStatus, 'Could not read the log — ' + (err.message || 'the flow failed'), 'err');
    }
  }

  function renderProject(){
    const s = summarise(shownRows);
    kpiTiles(dbKpis, [
      { k: 'Variations', v: String(s.count),
        sub: shownRows.length > s.count ? (shownRows.length - s.count) + ' earlier revision' + (shownRows.length - s.count === 1 ? '' : 's') : '' },
      { k: 'Total value ex GST', v: money(s.value), sub: s.priced < s.count ? (s.count - s.priced) + ' not priced' : '' },
      { k: 'Approved', v: money(s.approved), sub: s.approvedCount + ' variation' + (s.approvedCount === 1 ? '' : 's'), cls: 'ok' },
      { k: 'Pending approval', v: money(s.pending), sub: s.pendingCount + ' submitted', cls: 'warn' },
      { k: 'Drafts', v: String(s.draft), sub: s.rejected ? s.rejected + ' rejected' : '' },
      { k: 'Latest', v: s.latest ? day(s.latest) : '—' }
    ]);

    const q = dbSearch.value.trim().toLowerCase();
    dbRows.innerHTML = '';
    organise(shownRows).forEach(g => {
      g.rows.forEach(row => {
        const st = Flows.rowStatus(row);
        const superseded = row !== g.current;
        const text = [row.variationRef, row.description, row.issuedBy, st.status].join(' ').toLowerCase();
        if(q && text.indexOf(q) === -1) return;
        if(dbFilter !== 'all' && (superseded || st.status !== dbFilter)) return;
        dbRows.appendChild(rowNode(row, st, superseded ? g.current : null));
      });
    });
    if(!dbRows.children.length && shownRows.length){
      dbRows.innerHTML = '<tr><td colspan="10" class="scope-empty">Nothing matches.</td></tr>';
    }
  }

  function rowNode(row, st, supersededBy){
    const tr = el('tr', (supersededBy ? 'superseded ' : '') + 'st-' + st.status.toLowerCase());
    const value = Flows.rowValue(row);
    const canWrite = !!(row.state_ && row.state_.fields) && Flows.has('logWriteUrl');
    const isRev = revRank(row) > 0;

    tr.appendChild(el('td', 'db-ref' + (isRev ? ' rev' : ''), escapeHtml(row.variationRef)));
    const desc = el('td', 'db-desc');
    desc.textContent = row.description || (row.state_ && row.state_.fields && row.state_.fields.variationdesc) || '—';
    if(supersededBy) desc.appendChild(el('div', 'db-note', 'Superseded by ' + escapeHtml(supersededBy.variationRef)));
    tr.appendChild(desc);
    tr.appendChild(el('td', 'n', escapeHtml(money(value))));

    // status
    const stCell = el('td');
    const sel = el('select', 'db-status st-' + st.status.toLowerCase());
    Flows.STATUS_NAMES.forEach(n => {
      const o = el('option');
      o.value = n;
      o.textContent = n;
      if(n === st.status) o.selected = true;
      sel.appendChild(o);
    });
    sel.disabled = !canWrite;
    if(!canWrite) sel.title = row.state_ ? 'The log write flow is not connected' : 'This row has no saved form to update';
    sel.addEventListener('change', () => updateStatus(row, { status: sel.value }));
    stCell.appendChild(sel);
    tr.appendChild(stCell);

    // approved value and date, only once approved
    const avCell = el('td', 'n');
    const adCell = el('td');
    if(st.status === 'Approved'){
      const av = el('input');
      av.type = 'text';
      av.inputMode = 'decimal';
      av.className = 'db-input mono-input';
      av.value = st.approvedValue === '' ? '' : st.approvedValue;
      av.placeholder = value !== null ? String(value) : '0.00';
      av.disabled = !canWrite;
      av.addEventListener('change', () => {
        const n = av.value.trim() === '' ? '' : Number(av.value.replace(/[^0-9.\-]/g, ''));
        updateStatus(row, { approvedValue: isNaN(n) ? '' : n });
      });
      avCell.appendChild(av);
      const ad = el('input');
      ad.type = 'date';
      ad.className = 'db-input';
      ad.value = st.approvedDate || '';
      ad.disabled = !canWrite;
      ad.addEventListener('change', () => updateStatus(row, { approvedDate: ad.value }));
      adCell.appendChild(ad);
    } else {
      avCell.textContent = '—';
      adCell.textContent = '—';
    }
    tr.appendChild(avCell);
    tr.appendChild(adCell);

    tr.appendChild(el('td', '', escapeHtml(row.issuedBy || (row.state_ && row.state_.fields && row.state_.fields['sig-name']) || '—')));
    tr.appendChild(el('td', 'db-date', escapeHtml(day(row.downloadedAt))));
    tr.appendChild(el('td', 'db-date', escapeHtml(day(row.updatedAt))));

    const act = el('td', 'db-act');
    const open = el('button', 'refresh-btn', 'Open');
    open.type = 'button';
    open.disabled = !row.state_ || !row.state_.fields;
    open.addEventListener('click', () => openRow(row));
    act.appendChild(open);
    tr.appendChild(act);
    return tr;
  }

  // A status change is a log write like any other: the whole row, as saved,
  // with the new status in it. The Status columns take it straight away; the
  // saved form takes it too, so it follows the variation when it is reopened.
  async function updateStatus(row, changes){
    const project = shownProject;
    const saved = JSON.parse(JSON.stringify(row.state_));
    const st = Object.assign(Flows.rowStatus(row), changes);
    if(changes.status === 'Approved'){
      if(!st.approvedDate) st.approvedDate = todayIso();
      if(st.approvedValue === ''){ const v = Flows.rowValue(row); if(v !== null) st.approvedValue = v; }
    }
    saved.status = st;
    const parsed = parseRef(row.variationRef);
    const payload = logPayloadFromSaved(saved, {
      projectId: String(row.projectId || project.id),
      variationRef: row.variationRef,
      baseRef: parsed ? parsed.base : row.variationRef,
      revision: parsed ? parsed.revision.replace(/^[.\-_]/, '') : '',
      state: currentState.code,
      folderPath: project.folderPath || ''
    }, {
      // the write flow sets this column from what it is sent; keep what it had
      downloadedAt: row.downloadedAt || null
    });
    setLine(dbStatus, 'Saving ' + row.variationRef + ' as ' + st.status + '…');
    try {
      await Flows.writeLog(payload);
      row.state_ = saved;
      row.status = st.status;
      row.approvedValue = st.approvedValue;
      row.approvedDate = st.approvedDate;
      row.updatedAt = payload.updatedAt;
      // the same variation open in the form takes the new status too
      if(selectedProject && String(selectedProject.id) === String(project.id) && reopenedRef &&
         Flows.sameRef(effectiveRef(), row.variationRef)){
        variationStatus = normaliseStatus(st);
        statusRef = row.variationRef;
      }
      renderProject();
      setLine(dbStatus, row.variationRef + ' is now ' + st.status + '.', 'ok');
    } catch(err){
      renderProject();
      setLine(dbStatus, 'Could not update ' + row.variationRef + ' — ' + (err.message || 'the log write flow failed'), 'err');
    }
  }

  function selectProject(project){
    if(selectedProject && String(selectedProject.id) === String(project.id)) return;
    projectSelect.value = project.id;
    applyProject(project);
  }

  async function openRow(row){
    if(currentHasContent() && !confirm('Open ' + row.variationRef + '? What is on the form now and not saved will be replaced.')) return;
    const project = shownProject;
    selectProject(project);
    logRows = shownRows;
    Stages.go('cover');
    await openLoggedVariation(row);
  }

  document.getElementById('db-new').addEventListener('click', () => {
    const project = shownProject;
    if(!project) return;
    if(currentHasContent() && !confirm('Start a new variation on ' + (project.project || 'this project') +
       '? What is on the form now and not saved will be cleared.')) return;
    clearVariation();
    selectProject(project);
    Stages.go('cover');
  });

  document.getElementById('db-refresh').addEventListener('click', () => loadProject());
  dbSearch.addEventListener('input', renderProject);
  document.querySelectorAll('#db-filter .chip').forEach(c => c.addEventListener('click', () => {
    dbFilter = c.getAttribute('data-filter');
    document.querySelectorAll('#db-filter .chip').forEach(x => x.classList.toggle('on', x === c));
    renderProject();
  }));

  return { showProjects: showProjects, showProject: showProject, summarise: summarise };
})();
