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

  // the approved value as a share of the variation's value, e.g. '80'
  const pctOf = (approved, of) => of > 0 && approved !== '' ? String(Math.round(approved / of * 10000) / 100) : '';
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

  // deleted variations are left out of everything on the dashboard
  function organise(rows){
    const groups = {};
    rows.filter(r => !Flows.isDeleted(r)).forEach(r => { const b = baseOf(r); (groups[b] = groups[b] || []).push(r); });
    return Object.keys(groups)
      .map(b => {
        const list = groups[b].slice().sort((x, y) => revRank(x) - revRank(y));
        return { base: b, number: numberOf(list[0]), rows: list, current: list[list.length - 1] };
      })
      .sort((a, b) => a.number - b.number || a.base.localeCompare(b.base));
  }

  function summarise(rows){
    const groups = organise(rows || []);
    const s = { count: groups.length, rows: groups.reduce((n, g) => n + g.rows.length, 0), value: 0, priced: 0, approved: 0, approvedCount: 0, awaitingValue: 0, pending: 0,
                pendingCount: 0, draft: 0, rejected: 0, latest: '' };
    groups.forEach(g => {
      const r = g.current;
      const v = Flows.rowValue(r);
      const st = Flows.rowStatus(r);
      if(v !== null){ s.value += v; s.priced++; }
      // what the builder approved, as entered -- never the schedule's figure
      if(st.status === 'Approved'){
        s.approvedCount++;
        if(st.approvedValue !== '') s.approved += st.approvedValue; else s.awaitingValue++;
      }
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
      setLine(dbStatus, rows.some(r => !Flows.isDeleted(r)) ? '' : 'No variations logged for this project yet.');
    } catch(err){
      setLine(dbStatus, 'Could not read the log — ' + (err.message || 'the flow failed'), 'err');
    }
  }

  function renderProject(){
    const s = summarise(shownRows);
    kpiTiles(dbKpis, [
      { k: 'Variations', v: String(s.count),
        sub: s.rows > s.count ? (s.rows - s.count) + ' earlier revision' + (s.rows - s.count === 1 ? '' : 's') : '' },
      { k: 'Total value ex GST', v: money(s.value), sub: s.priced < s.count ? (s.count - s.priced) + ' not priced' : '' },
      { k: 'Approved', v: money(s.approved), cls: 'ok',
        sub: s.approvedCount + ' variation' + (s.approvedCount === 1 ? '' : 's') +
             (s.awaitingValue ? ' · ' + s.awaitingValue + ' without an approved value' : '') },
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
    if(!dbRows.children.length && shownRows.some(r => !Flows.isDeleted(r))){
      dbRows.innerHTML = '<tr><td colspan="11" class="scope-empty">Nothing matches.</td></tr>';
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

    // approved value and date: entered in the commentary window, shown here
    const share = pctOf(st.approvedValue, Number(Flows.rowValue(row)) || 0);
    tr.appendChild(el('td', 'n', st.approvedValue === '' ? '—' : escapeHtml(money(st.approvedValue)) +
      (share !== '' ? '<span class="db-pct">' + escapeHtml(share) + '% of value</span>' : '')));
    tr.appendChild(el('td', 'db-date', st.approvedDate ? escapeHtml(day(st.approvedDate)) : '—'));

    tr.appendChild(el('td', '', escapeHtml(row.issuedBy || (row.state_ && row.state_.fields && row.state_.fields['sig-name']) || '—')));
    tr.appendChild(el('td', 'db-date', escapeHtml(day(row.downloadedAt))));
    tr.appendChild(el('td', 'db-date', escapeHtml(day(row.updatedAt))));

    const cmt = el('td', 'db-act');
    const live = liveCommentary(st.commentary);
    const n = live.length;
    const talk = el('button', 'refresh-btn db-talk' + (n ? ' has' : ''),
      'Builder commentary' + (n ? ' <span class="db-badge">' + n + '</span>' : ''));
    talk.type = 'button';
    talk.disabled = !row.state_ || !row.state_.fields;
    talk.title = n ? 'Last: ' + day(live[n - 1].at) : 'No commentary yet';
    talk.addEventListener('click', () => openCommentary(row));
    cmt.appendChild(talk);
    tr.appendChild(cmt);

    const act = el('td', 'db-act');
    const open = el('button', 'refresh-btn', 'Open');
    open.type = 'button';
    open.disabled = !row.state_ || !row.state_.fields;
    open.addEventListener('click', () => openRow(row));
    act.appendChild(open);
    const del = el('button', 'refresh-btn db-del', 'Delete');
    del.type = 'button';
    del.disabled = !canWrite;
    del.title = canWrite ? 'Remove it from this dashboard' : open.disabled ? 'This row has no saved form to update' : 'The log write flow is not connected';
    del.addEventListener('click', () => deleteRow(row));
    act.appendChild(del);
    tr.appendChild(act);
    return tr;
  }

  // the form's list of previous variations, when it is on the same project
  function refreshEditorLog(code, projectId){
    if(currentState && currentState.code === code && selectedProject &&
       String(selectedProject.id) === String(projectId)) refreshLog();
  }

  /* Deleting takes a variation off the dashboard and nothing else: its log
     row, its PDF in the project folder and its variation file all stay, and
     it keeps its number. The row is marked deleted in its saved form; the
     administrator can put it back from Administrator settings. */
  async function deleteRow(row){
    const desc = row.description || (row.state_ && row.state_.fields && row.state_.fields.variationdesc) || '';
    if(!confirm('Delete ' + row.variationRef + (desc ? ' — ' + desc : '') + '?\n\n' +
      'It will be removed from this project\'s dashboard. Its PDF and variation file are kept, ' +
      'and the administrator can restore it from Administrator settings.')) return;
    const st = await updateRow(row, { deleted: { at: new Date().toISOString(), by: whoAmI() } });
    if(!st) return;
    setLine(dbStatus, row.variationRef + ' was deleted. The administrator can restore it from Administrator settings → Deleted variations.', 'ok');
    refreshEditorLog(currentState.code, row.projectId);
  }

  /* Every change from the dashboard is a log write like any other: the whole
     row, as saved, with the change in it. The log's own columns take it
     straight away, and the saved form takes it too, so it follows the
     variation when it is reopened.

     The row is read again first. Someone else may have added commentary or
     approved it since this page loaded, and the write replaces the row -- so
     what is there now is the base, and the commentary threads are merged. */
  // One change to one row, written back whole: the office and project are
  // passed in, so the administrator's bin can use it for any office.
  async function writeChange(code, project, row, changes){
    let base = row;
    try {
      const fresh = await Flows.listLog(code, project.id);
      base = fresh.find(r => Flows.sameRef(r.variationRef, row.variationRef) && r.state_ && r.state_.fields) || row;
    } catch(e){ /* the copy on screen will do */ }

    const saved = JSON.parse(JSON.stringify(base.state_));
    const statusChanges = Object.assign({}, changes);
    // deleted is the form's, not the status's: { at, by } marks it, null clears it
    if('deleted' in statusChanges){
      if(statusChanges.deleted) saved.deleted = statusChanges.deleted; else delete saved.deleted;
      delete statusChanges.deleted;
    }
    const st = Object.assign(Flows.rowStatus(base), statusChanges);
    st.commentary = mergeCommentary(Flows.rowStatus(base).commentary, Flows.rowStatus(row).commentary, statusChanges.commentary);
    saved.status = st;
    const parsed = parseRef(row.variationRef);
    const payload = logPayloadFromSaved(saved, {
      projectId: String(row.projectId || project.id),
      variationRef: row.variationRef,
      baseRef: parsed ? parsed.base : row.variationRef,
      revision: parsed ? parsed.revision.replace(/^[.\-_]/, '') : '',
      state: code,
      folderPath: project.folderPath || row.folderPath || ''
    }, {
      // the write flow sets this column from what it is sent; keep what it had
      downloadedAt: base.downloadedAt || row.downloadedAt || null
    });
    await Flows.writeLog(payload);
    Object.assign(row, { state_: saved, status: st.status, approvedValue: st.approvedValue,
                         approvedDate: st.approvedDate, updatedAt: payload.updatedAt });
    return st;
  }

  async function updateRow(row, changes, statusEl){
    const project = shownProject;
    const say = (t, c) => setLine(statusEl || dbStatus, t, c);
    say('Saving ' + row.variationRef + '…');
    try {
      const st = await writeChange(currentState.code, project, row, changes);
      // the same variation open in the form takes the change too
      if(selectedProject && String(selectedProject.id) === String(project.id) && reopenedRef &&
         Flows.sameRef(effectiveRef(), row.variationRef)){
        variationStatus = normaliseStatus(st);
        statusRef = row.variationRef;
      }
      renderProject();
      return st;
    } catch(err){
      renderProject();
      say('Could not save ' + row.variationRef + ' — ' + (err.message || 'the log write flow failed'), 'err');
      return null;
    }
  }

  async function updateStatus(row, changes){
    const st = await updateRow(row, changes);
    if(st) setLine(dbStatus, row.variationRef + ' is now ' + st.status + '.', 'ok');
  }

  /* ---- the commentary window ----------------------------------------------- */

  const modal = document.getElementById('bc-modal');
  const bcStatus = document.getElementById('bc-status');
  const bcValue = document.getElementById('bc-value');
  const bcDate = document.getElementById('bc-date');
  const bcPct = document.getElementById('bc-pct');
  const bcQuick = document.getElementById('bc-pct-quick');

  /* The approved value can be typed as a share of the variation's own value
     (100% of it, 80%, 20% ...) or as the figure itself; each fills in the
     other. Only the value is saved -- the percentage is worked out again
     from it, so the two can never disagree. */
  let modalValue = 0;
  const cleanNum = v => String(v).trim().replace(/[$,%\s]/g, '');
  const round2 = n => Math.round(n * 100) / 100;
  function fromPct(){
    const p = cleanNum(bcPct.value);
    if(p === '' || isNaN(Number(p)) || !(modalValue > 0)) return;
    bcValue.value = round2(modalValue * Number(p) / 100).toFixed(2);
    markQuick();
  }
  function fromValue(){
    const v = cleanNum(bcValue.value);
    bcPct.value = v === '' || isNaN(Number(v)) ? '' : pctOf(Number(v), modalValue);
    markQuick();
  }
  function markQuick(){
    bcQuick.querySelectorAll('[data-pct]').forEach(b =>
      b.classList.toggle('on', cleanNum(bcPct.value) !== '' && Number(cleanNum(bcPct.value)) === Number(b.dataset.pct)));
  }
  bcPct.addEventListener('input', fromPct);
  bcValue.addEventListener('input', fromValue);
  bcQuick.addEventListener('click', e => {
    const b = e.target.closest('[data-pct]');
    if(!b) return;
    bcPct.value = b.dataset.pct;
    fromPct();
  });
  const bcThread = document.getElementById('bc-thread');
  const bcFrom = document.getElementById('bc-from');
  const bcBy = document.getElementById('bc-by');
  const bcText = document.getElementById('bc-text');
  const bcLine = document.getElementById('bc-status-line');
  const NAME_KEY = 'variationCoverSheet:userName';
  let modalRow = null;

  Flows.STATUS_NAMES.forEach(n => {
    const o = el('option');
    o.value = n;
    o.textContent = n;
    bcStatus.appendChild(o);
  });

  // who is entering it: the signed-in Microsoft account where there is one
  // the account boot.js confirmed with Microsoft before the app loaded
  function signedInName(){
    const a = window.AXIS_USER;
    return (a && (a.name || a.username)) || '';
  }
  function rememberedName(){
    try { return localStorage.getItem(NAME_KEY) || ''; } catch(e){ return ''; }
  }

  let showDeleted = false;
  const stampText = iso => new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: '2-digit', month: 'short',
                                                                  year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const whoAmI = () => bcBy.value.trim() || rememberedName() || signedInName() || '';

  function renderThread(list){
    const all = mergeCommentary(list);
    const live = all.filter(c => !c.deleted);
    const gone = all.length - live.length;
    bcThread.innerHTML = '';
    document.getElementById('bc-count').textContent = live.length ? '(' + live.length + ')' : '';
    const shown = showDeleted ? all : live;
    if(!shown.length) bcThread.appendChild(el('li', 'bc-empty', 'No commentary yet.'));
    // newest first: the latest word from the builder is what is being read for
    shown.slice().reverse().forEach(c => bcThread.appendChild(entryNode(c)));
    if(gone){
      const li = el('li', 'bc-gone');
      const t = el('button', 'link-btn', showDeleted ? 'Hide deleted' : 'Show ' + gone + ' deleted');
      t.type = 'button';
      t.addEventListener('click', () => { showDeleted = !showDeleted; renderThread(all); });
      li.appendChild(t);
      bcThread.appendChild(li);
    }
  }

  function entryNode(c){
    const li = el('li', 'bc-entry' + (c.deleted ? ' deleted' : ''));
    const meta = el('div', 'bc-meta');
    meta.innerHTML = '<span class="bc-when">' + escapeHtml(stampText(c.at)) + '</span>' +
      (c.from ? '<span class="bc-from">' + escapeHtml(c.from) + '</span>' : '') +
      (c.by ? '<span class="bc-by">entered by ' + escapeHtml(c.by) + '</span>' : '') +
      (c.editedAt ? '<span class="bc-edited">edited ' + escapeHtml(stampText(c.editedAt)) +
        (c.editedBy ? ' by ' + escapeHtml(c.editedBy) : '') + '</span>' : '') +
      (c.deleted ? '<span class="bc-deleted">deleted ' + escapeHtml(stampText(c.deletedAt)) +
        (c.deletedBy ? ' by ' + escapeHtml(c.deletedBy) : '') + '</span>' : '');
    li.appendChild(meta);
    const text = li.appendChild(el('div', 'bc-text'));
    text.textContent = c.text;
    if(c.deleted || !Flows.has('logWriteUrl')) return li;

    const acts = meta.appendChild(el('span', 'bc-acts'));
    const btn = (label, fn) => {
      const b = acts.appendChild(el('button', 'link-btn', label));
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    };
    btn('Edit', () => {
      // edited in place: the text and who it was from
      li.classList.add('editing');
      acts.hidden = true;
      const from = el('input');
      from.type = 'text';
      from.value = c.from || '';
      from.placeholder = 'From';
      const area = el('textarea');
      area.value = c.text;
      const row = el('div', 'bc-edit-acts');
      const save = row.appendChild(el('button', 'print-btn', 'Save changes'));
      const cancel = row.appendChild(el('button', 'refresh-btn', 'Cancel'));
      save.type = cancel.type = 'button';
      text.replaceWith(el('div', 'bc-edit'));
      const box = li.querySelector('.bc-edit');
      box.appendChild(from);
      box.appendChild(area);
      box.appendChild(row);
      area.focus();
      cancel.addEventListener('click', () => renderThread(Flows.rowStatus(modalRow).commentary));
      save.addEventListener('click', async () => {
        const value = area.value.trim();
        if(!value){ area.focus(); return; }
        if(value === c.text && from.value.trim() === (c.from || '')){ renderThread(Flows.rowStatus(modalRow).commentary); return; }
        save.disabled = true;
        const changed = Object.assign({}, c, { text: value, from: from.value.trim(),
                                               editedAt: new Date().toISOString(), editedBy: whoAmI() });
        const st = await updateRow(modalRow, { commentary: [changed] }, bcLine);
        save.disabled = false;
        if(st){ renderThread(st.commentary); setLine(bcLine, 'Commentary edited and saved.', 'ok'); }
      });
    });
    btn('Delete', async () => {
      if(!confirm('Delete this commentary from ' + stampText(c.at) + '? It is removed from the thread and from the log.')) return;
      const gone = Object.assign({}, c, { deleted: true, deletedAt: new Date().toISOString(), deletedBy: whoAmI() });
      const st = await updateRow(modalRow, { commentary: [gone] }, bcLine);
      if(st){ renderThread(st.commentary); setLine(bcLine, 'Commentary deleted.', 'ok'); }
    });
    return li;
  }

  function fillApproval(st){
    bcStatus.value = st.status;
    bcValue.value = st.approvedValue === '' ? '' : st.approvedValue;
    bcDate.value = st.approvedDate || '';
    // a percentage only means something against a priced variation
    const priced = modalValue > 0;
    bcPct.disabled = !priced;
    bcPct.placeholder = priced ? '100' : '—';
    bcPct.title = priced ? '' : 'This variation has no value to take a percentage of';
    bcQuick.hidden = !priced;
    fromValue();
  }

  function openCommentary(row){
    modalRow = row;
    const st = Flows.rowStatus(row);
    document.getElementById('bc-title').textContent = row.variationRef;
    document.getElementById('bc-sub').textContent = [row.description ||
      (row.state_ && row.state_.fields && row.state_.fields.variationdesc), shownProject && shownProject.project]
      .filter(Boolean).join(' · ');
    modalValue = Number(Flows.rowValue(row)) || 0;
    document.getElementById('bc-sor-value').textContent = money(modalValue);
    fillApproval(st);
    showDeleted = false;
    renderThread(st.commentary);
    bcFrom.value = (shownProject && shownProject.attention) ? shownProject.attention +
      (shownProject.headContractor ? ', ' + shownProject.headContractor : '') : '';
    bcBy.value = rememberedName() || signedInName() || '';
    bcText.value = '';
    setLine(bcLine, '');
    const canWrite = Flows.has('logWriteUrl');
    ['bc-save-approval', 'bc-add'].forEach(id => { document.getElementById(id).disabled = !canWrite; });
    if(!canWrite) setLine(bcLine, 'The log write flow is not connected, so nothing here can be saved.', 'err');
    modal.hidden = false;
    setTimeout(() => bcText.focus(), 0);
  }

  function closeCommentary(){
    modal.hidden = true;
    modalRow = null;
  }

  document.getElementById('bc-close').addEventListener('click', closeCommentary);
  modal.addEventListener('click', e => { if(e.target === modal) closeCommentary(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) closeCommentary(); });

  document.getElementById('bc-save-approval').addEventListener('click', async () => {
    if(!modalRow) return;
    const raw = bcValue.value.trim().replace(/[$,\s]/g, '');
    if(raw && isNaN(Number(raw))){
      setLine(bcLine, 'The approved value has to be a number — e.g. 12500 or 12,500.00.', 'err');
      bcValue.focus();
      return;
    }
    const changes = { status: bcStatus.value, approvedValue: raw === '' ? '' : Math.round(Number(raw) * 100) / 100,
                      approvedDate: bcDate.value };
    if(changes.status === 'Approved' && (changes.approvedValue === '' || !changes.approvedDate)){
      if(!confirm('Mark it Approved without ' + (changes.approvedValue === '' ? 'an approved value' : 'an approved date') + '?')) return;
    }
    const button = document.getElementById('bc-save-approval');
    button.disabled = true;
    const st = await updateRow(modalRow, changes, bcLine);
    button.disabled = false;
    if(st){
      fillApproval(st);
      renderThread(st.commentary);
      setLine(bcLine, 'Saved — ' + st.status + (st.approvedValue !== '' ? ', ' + money(st.approvedValue) : '') +
        (st.approvedDate ? ' on ' + day(st.approvedDate) : '') + '.', 'ok');
    }
  });

  document.getElementById('bc-add').addEventListener('click', async () => {
    if(!modalRow) return;
    const text = bcText.value.trim();
    if(!text){ bcText.focus(); return; }
    const by = bcBy.value.trim();
    try { if(by) localStorage.setItem(NAME_KEY, by); } catch(e){}
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                    at: new Date().toISOString(), from: bcFrom.value.trim(), by: by, text: text };
    const button = document.getElementById('bc-add');
    button.disabled = true;
    const st = await updateRow(modalRow, { commentary: [entry] }, bcLine);
    button.disabled = false;
    if(st){
      bcText.value = '';
      renderThread(st.commentary);
      setLine(bcLine, 'Added and saved at ' + new Date(entry.at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) + '.', 'ok');
    }
  });

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

  /* ========================================================================
     DELETED VARIATIONS -- the administrator's bin, in Administrator settings
  ======================================================================== */

  const binOffice = document.getElementById('bin-office');
  const binStatus = document.getElementById('bin-status');
  const binWrap = document.getElementById('bin-wrap');
  const binRows = document.getElementById('bin-rows');

  function prepareBin(){
    const keep = binOffice.value || (currentState ? currentState.code : '');
    binOffice.innerHTML = StateRegister.rows().map(r =>
      '<option value="' + escapeHtml(r.code) + '">' + escapeHtml(r.code + (r.name ? ' — ' + r.name : '')) + '</option>').join('');
    if(keep) binOffice.value = keep;
  }

  // every row of an office's log: in one read where the flow can, otherwise
  // project by project for the office whose projects are loaded
  async function officeRows(code){
    try { return await Flows.listStateLog(code); }
    catch(err){
      if(!currentState || currentState.code !== code || !projects.length){
        throw new Error('the log flow cannot read a whole office at once yet. Open one of ' + code +
          '\'s projects first and come back, or add the whole-office step (docs/PROJECT-DASHBOARD.md).');
      }
      const all = [];
      for(const p of projects){ all.push(...await Flows.listLog(code, p.id)); }
      return all;
    }
  }

  async function loadBin(){
    const code = binOffice.value;
    binWrap.hidden = true;
    binRows.innerHTML = '';
    if(!code) return;
    if(!Flows.has('logReadUrl')){ setLine(binStatus, 'The variation log is not connected.', 'err'); return; }
    setLine(binStatus, 'Reading ' + code + '\'s variation log…');
    let rows;
    try { rows = await officeRows(code); }
    catch(err){ setLine(binStatus, 'Could not read the log — ' + (err.message || 'the flow failed'), 'err'); return; }
    if(binOffice.value !== code) return;
    const gone = rows.filter(r => Flows.isDeleted(r))
      .sort((a, b) => String(b.state_.deleted.at || '').localeCompare(String(a.state_.deleted.at || '')));
    if(!gone.length){ setLine(binStatus, 'Nothing has been deleted from ' + code + '\'s dashboards.', 'ok'); return; }
    setLine(binStatus, gone.length + ' deleted variation' + (gone.length === 1 ? '' : 's') + ' in ' + code + '.');
    gone.forEach(row => binRows.appendChild(binRow(code, row)));
    binWrap.hidden = false;
  }

  function projectOf(code, row){
    const p = currentState && currentState.code === code && projects.find(x => String(x.id) === String(row.projectId));
    return p || { id: row.projectId, project: row.project || '', folderPath: row.folderPath || '' };
  }

  function binRow(code, row){
    const tr = el('tr');
    const project = projectOf(code, row);
    const d = row.state_.deleted;
    tr.appendChild(el('td', '', escapeHtml(project.project || row.project || 'Project ' + row.projectId)));
    tr.appendChild(el('td', 'bin-ref', escapeHtml(row.variationRef)));
    tr.appendChild(el('td', '', escapeHtml(row.description || (row.state_.fields && row.state_.fields.variationdesc) || '—')));
    tr.appendChild(el('td', 'n', escapeHtml(money(Flows.rowValue(row)))));
    tr.appendChild(el('td', 'bin-when', escapeHtml(d.at ? new Date(d.at).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—') +
      (d.by ? '<br>by ' + escapeHtml(d.by) : '')));
    const act = el('td');
    const btn = el('button', 'refresh-btn', 'Restore');
    btn.type = 'button';
    btn.disabled = !Flows.has('logWriteUrl');
    btn.addEventListener('click', async () => {
      if(!confirm('Restore ' + row.variationRef + ' to its project\'s dashboard?')) return;
      btn.disabled = true;
      setLine(binStatus, 'Restoring ' + row.variationRef + '…');
      try {
        await writeChange(code, project, row, { deleted: null });
        // the office's totals are read again next time they are shown
        rowsFor(code).loaded = false;
        refreshEditorLog(code, row.projectId);
        tr.remove();
        setLine(binStatus, row.variationRef + ' is back on ' + (project.project || 'its project') + '\'s dashboard.', 'ok');
        if(!binRows.children.length) binWrap.hidden = true;
      } catch(err){
        btn.disabled = false;
        setLine(binStatus, 'Could not restore ' + row.variationRef + ' — ' + (err.message || 'the log write flow failed'), 'err');
      }
    });
    act.appendChild(btn);
    tr.appendChild(act);
    return tr;
  }

  document.getElementById('bin-load').addEventListener('click', loadBin);
  binOffice.addEventListener('change', () => { binWrap.hidden = true; setLine(binStatus, ''); });

  return { showProjects: showProjects, showProject: showProject, summarise: summarise, prepareBin: prepareBin };
})();
