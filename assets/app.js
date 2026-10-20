/* ============================================================================
   VARIATION COVER SHEET
   ============================================================================
   The shape of a session:

     pick a state  ->  section 1 fills from the state register (local)
                   ->  the project list is pulled for that state (SharePoint,
                       via a Power Automate flow)
     pick a project ->  head contractor, recipient address, attention, project,
                       issued by and position fill from that register row
     everything else is typed
     Download PDF  ->  the PDF is saved locally AND posted to the filing flow,
                       which drops it in the project's SharePoint folder

   Each step degrades on its own: with no flows configured this is still a
   working cover sheet generator that produces the same PDF.
============================================================================ */

const textIds = ['project','varref','variationdesc','siref','clauseref','aconexref','contractordirection','emailref','desc-final',
                  'co-name','co-abn','co-acn','co-phone','co-address','co-email',
                  'recipient-name','recipient-address','attention',
                  'intro-text','closing-text','sig-name','sig-title'];
const els = {};
textIds.forEach(id => els[id] = document.getElementById(id));

const viewPicker = document.getElementById('view-picker');
const viewEditor = document.getElementById('view-editor');
const viewSettings = document.getElementById('view-settings');
const viewAdmin = document.getElementById('view-admin');

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function todayStr(){
  return new Date().toLocaleDateString('en-AU', { day:'2-digit', month:'long', year:'numeric' });
}

/* ==========================================================================
   LIVE PREVIEW
   ========================================================================== */

function toggleEl(elId, value, text, display){
  const el = document.getElementById(elId);
  if(value && value.trim().length){ el.textContent = (text !== undefined ? text : value); el.style.display = display || 'block'; }
  else { el.style.display = 'none'; }
}

function toggleRow(rowId, valId, value){
  const row = document.getElementById(rowId);
  const val = document.getElementById(valId);
  if(value && value.trim().length){ row.style.display = 'flex'; val.textContent = value; }
  else { row.style.display = 'none'; }
}

function toggleTableRow(rowId, valId, value, html){
  const row = document.getElementById(rowId);
  const val = document.getElementById(valId);
  if(value && value.trim().length){
    row.style.display = 'table-row';
    if(html){ val.innerHTML = html; } else { val.textContent = value; }
  } else {
    row.style.display = 'none';
  }
}

function render(){
  const v = id => els[id].value.trim();

  document.getElementById('p-date').textContent = todayStr();

  const recName = v('recipient-name');
  const recAddr = v('recipient-address');
  toggleEl('p-recipient', [recName, recAddr].filter(Boolean).join('\n'));

  toggleRow('p-attn-row', 'p-attn', v('attention'));
  const shownRef = (typeof effectiveRef === 'function') ? effectiveRef() : v('varref');
  toggleRow('p-re-row', 'p-re', [shownRef, v('variationdesc')].filter(Boolean).join(' — '));

  toggleEl('p-intro', v('intro-text'));
  toggleEl('p-closing', v('closing-text'));

  toggleTableRow('tr-project', 'p-project', v('project'));
  toggleTableRow('tr-siref', 'p-siref', v('siref'));
  toggleTableRow('tr-clauseref', 'p-clauseref', v('clauseref'));
  toggleTableRow('tr-aconexref', 'p-aconexref', v('aconexref'));
  toggleTableRow('tr-contractordirection', 'p-contractordirection', v('contractordirection'));
  toggleTableRow('tr-emailref', 'p-emailref', v('emailref'));
  toggleTableRow('tr-desc', 'p-desc', v('desc-final'));
  // priced in stage 3; the row appears once there is something to show
  toggleTableRow('tr-value', 'p-value', (typeof Stages !== 'undefined') ? Stages.valueLine() : '');

  const coName = v('co-name');
  document.getElementById('p-co-name').textContent = coName || 'Company name';
  toggleRow('p-co-abn-row', 'p-co-abn', v('co-abn'));
  toggleRow('p-co-acn-row', 'p-co-acn', v('co-acn'));
  toggleRow('p-co-address-row', 'p-co-address', v('co-address'));
  toggleRow('p-co-phone-row', 'p-co-phone', v('co-phone'));
  toggleRow('p-co-email-row', 'p-co-email', v('co-email'));

  document.getElementById('p-footer-co').textContent = coName || 'Company name';
  toggleEl('p-footer-ref', shownRef, 'Ref ' + shownRef, 'inline');

  toggleEl('p-sig-name', v('sig-name'));
  toggleEl('p-sig-title', v('sig-title'));
  toggleEl('p-sig-co', coName);
  toggleEl('p-sig-phone', v('co-phone'));
  toggleEl('p-sig-email', v('co-email'));
}

textIds.forEach(id => els[id].addEventListener('input', render));

/* ==========================================================================
   STATE — the choice everything else hangs off
   ========================================================================== */

let currentState = null;          // the register row for the chosen state
const LETTERHEAD_FIELDS = {
  entity: 'co-name', abn: 'co-abn', acn: 'co-acn',
  phone: 'co-phone', address: 'co-address', email: 'co-email'
};

const stateGrid = document.getElementById('state-grid');
const pickerStatus = document.getElementById('picker-status');

function renderStatePicker(){
  const rows = StateRegister.rows();
  stateGrid.innerHTML = rows.map(row => {
    const ready = StateRegister.isConfigured(row);
    const mark = row.logo || DEFAULT_LOGO;
    // An office with no letterhead yet has no mark to show either, so it falls
    // back to its code rather than borrowing another office's logo.
    const face = ready
      ? '<span class="tile-logo"><img src="' + mark + '" alt=""></span>'
      : '<span class="tile-logo"><span class="tile-code">' + escapeHtml(row.code) + '</span></span>';
    return '<button type="button" class="state-tile' + (ready ? '' : ' unset') + '"' +
        ' data-state="' + escapeHtml(row.code) + '"' +
        (row.brand ? ' style="--tile-brand:' + escapeHtml(row.brand) + '"' : '') + '>' +
      face +
      '<span class="tile-name">' + escapeHtml(row.name) + '</span>' +
      '<span class="tile-entity">' + (ready ? escapeHtml(row.entity) : 'Not filled in yet — add it in Settings') + '</span>' +
    '</button>';
  }).join('');

  const unset = rows.filter(r => !StateRegister.isConfigured(r)).length;
  pickerStatus.textContent = unset
    ? unset + ' of ' + rows.length + ' offices have no letterhead yet — you can still pick one and type it in.'
    : '';
  pickerStatus.className = 'status-line';
}

stateGrid.addEventListener('click', (e) => {
  const tile = e.target.closest('.state-tile');
  if(tile) location.hash = '#/state/' + encodeURIComponent(tile.getAttribute('data-state'));
});

// Fills section 1 from the register row. Called on entry to the editor and by
// "Reset to register" after someone has typed over it.
function applyLetterhead(row){
  Object.keys(LETTERHEAD_FIELDS).forEach(key => {
    els[LETTERHEAD_FIELDS[key]].value = row[key] || '';
  });
  els['intro-text'].value = row.intro || '';
  els['closing-text'].value = row.closing || '';
  applyLogo(row.logo || uploadedLogo || DEFAULT_LOGO);
  document.getElementById('logo-caption').textContent = (row.entity || 'Company') + ' logo';
  document.getElementById('chip-state').textContent = row.code;
  render();
  syncPrefilled();
}

document.getElementById('letterhead-reset').addEventListener('click', () => {
  if(currentState) applyLetterhead(StateRegister.get(currentState.code) || currentState);
});

/* ==========================================================================
   PROJECTS — pulled from the SharePoint register via Power Automate
   ========================================================================== */

const projectSelect = document.getElementById('project-select');
const projectSource = document.getElementById('project-source');
const projectStatus = document.getElementById('project-status');
const projectRefresh = document.getElementById('project-refresh');
const projectManualWrap = document.getElementById('project-manual-wrap');
const filingNote = document.getElementById('filing-note');

let projects = [];
let selectedProject = null;
let projectsLoading = Promise.resolve();   // the register read in flight, if any

// register field -> the form field it fills. The order is the order the form
// asks for them, so a complaint about what is missing reads top to bottom.
const PULLED_FIELDS = [
  { key: 'headContractor',   id: 'recipient-name',    label: 'Head contractor' },
  { key: 'recipientAddress', id: 'recipient-address', label: 'Recipient address' },
  { key: 'attention',        id: 'attention',         label: 'Attention' },
  { key: 'issuedBy',         id: 'sig-name',          label: 'Issued by' },
  { key: 'position',         id: 'sig-title',         label: 'Position' }
];

// The tag marks a field the register actually filled. It used to go up for all
// of them the moment a project was chosen, which said "this came from the
// register" over an empty box -- exactly the wrong thing to claim.
function showPulledTags(filled){
  PULLED_FIELDS.forEach(f => {
    document.getElementById('tag-' + f.id).hidden = !(filled && filled[f.key]);
  });
}

function setManualMode(on){
  projectManualWrap.hidden = !on;
  projectSelect.disabled = on;
}

function updateFilingNote(){
  if(!Flows.has('fileUrl')){
    filingNote.className = 'filing-note off';
    filingNote.innerHTML = '<strong>Not filing to SharePoint.</strong> Download PDF will save the file to ' +
      'this computer only until the filing flow is added in Settings.';
    return;
  }
  filingNote.className = 'filing-note';
  const folder = selectedProject && selectedProject.folderPath;
  filingNote.innerHTML = folder
    ? 'On download, this variation is filed to <code>' + escapeHtml(folder) + '</code>'
    : 'On download, this variation is sent to the filing flow. ' +
      (selectedProject
        ? 'This project has no folder path in the register, so the flow will use its fallback folder.'
        : 'Pick a project to see which folder it lands in.');
}

// One register row -> the fields it owns. Everything else on the form is the
// user's to fill in, and stays untouched.
function applyProject(project){
  selectedProject = project;

  if(!project){
    showPulledTags(null);
    projectStatus.textContent = '';
    projectStatus.className = 'status-line';
    updateFilingNote();
    render();
    return;
  }

  els['project'].value = project.project || '';

  // Assign whatever the register holds, empty included. Skipping the empties
  // would leave the previous project's contractor and contact sitting in the
  // form after switching -- wrong details on a letter, and no sign of it.
  const filled = {};
  PULLED_FIELDS.forEach(f => {
    const value = project[f.key] || '';
    els[f.id].value = value;
    els[f.id].classList.remove('field-invalid');
    filled[f.key] = !!value;
  });
  showPulledTags(filled);

  // never overwrite a clause reference already typed for this variation
  if(project.clauseRef && !els['clauseref'].value.trim()) els['clauseref'].value = project.clauseRef;

  reportMissing(project, filled);
  updateFilingNote();
  render();

  // a different project means a different history, and the reference that was
  // reopened no longer belongs to what is on screen
  reopenedRef = '';
  refOverridden = false;
  showReopened();
  setLogStatus('');
  setMode('new');
  syncPrefilled();
  refreshLog().then(checkVarref);
}

// Say plainly when the register row came back without the fields the letter
// needs. Silence here is what turns into "why won't it let me export" at the
// bottom of the form, with nothing on screen explaining which box is empty or
// why.
// Three different faults look identical from the form -- an empty box -- and
// they are fixed in three different places. Say which one this is.
function reportMissing(project, filled){
  const missing = PULLED_FIELDS.filter(f => !filled[f.key]);
  if(!missing.length){
    projectStatus.textContent = '';
    projectStatus.className = 'status-line';
    return;
  }

  const columns = Flows.describeRow(project.raw);
  const withValues = columns.filter(c => !c.empty).length;

  // Is there a column carrying data that we simply did not recognise? Only
  // then can the mapping help: it renames what arrived, it cannot conjure a
  // column the flow never sent.
  const claimed = new Set(Object.keys(Flows.ALIASES)
    .map(k => project[k] && Flows.normKey(project[k])).filter(Boolean));
  const spare = columns.filter(c => !c.empty && !claimed.has(Flows.normKey(c.value)));

  const names = missing.map(f => f.label).join(', ');
  projectStatus.className = 'status-line err';

  if(spare.length){
    projectStatus.textContent = 'Missing: ' + names + '. The row does carry ' +
      spare.slice(0, 4).map(c => c.key).join(', ') + (spare.length > 4 ? '…' : '') +
      ' — if that is where these live, point the app at them in Settings → Match the register columns.';
    return;
  }

  // Nothing spare: the flow is not sending these at all. No amount of mapping
  // in the app will change that, so do not send anyone to the mapping panel.
  projectStatus.textContent = 'Missing: ' + names + '. Your flow only returns ' +
    columns.filter(c => !c.empty).map(c => c.key).join(', ') +
    (columns.length > withValues
      ? ' (and ' + columns.filter(c => c.empty).map(c => c.key).join(', ') + ', all empty)'
      : '') +
    ' — so these details are not in the response. Fix the flow\u2019s Select step, not the app. ' +
    'Settings → Test projects flow → Show what the flow returned has the detail.';
}

function renderProjectOptions(){
  if(!projects.length){
    projectSelect.innerHTML = '<option value="">No projects in the register for this office</option>';
    return;
  }
  projectSelect.innerHTML = '<option value="">Select a project…</option>' + projects.map(p =>
    '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.project) + '</option>'
  ).join('');
}

async function loadProjects(){
  if(!currentState) return;

  selectedProject = null;
  showPulledTags(null);
  reopenedRef = '';
  showReopened();
  logHistory.hidden = true;

  if(!Flows.has('projectsUrl')){
    projects = [];
    projectSelect.innerHTML = '<option value="">No projects flow configured</option>';
    projectSource.textContent = 'Not connected to SharePoint';
    projectStatus.textContent = 'This copy of the app has no projects flow set up, so the register cannot be read. '
      + 'Tell whoever set the app up — the connection is in Administrator settings, not something to fix here.';
    projectStatus.className = 'status-line';
    document.getElementById('project-connect-wrap').hidden = false;
    setManualMode(true);
    updateFilingNote();
    return;
  }

  projectRefresh.disabled = true;
  projectSelect.disabled = true;
  projectSelect.innerHTML = '<option value="">Loading projects…</option>';
  projectStatus.textContent = '';
  projectStatus.className = 'status-line';
  projectSource.textContent = 'Reading the ' + currentState.code + ' register…';

  const forState = currentState.code;
  try {
    const rows = await Flows.getProjects(forState);
    // The state can be changed while the request is in flight; a late answer
    // for the state we have left must not repopulate the dropdown.
    if(!currentState || currentState.code !== forState) return;
    projects = rows;
    document.getElementById('project-connect-wrap').hidden = true;
    renderProjectOptions();
    setManualMode(!rows.length);
    projectSelect.disabled = !rows.length;
    projectSource.textContent = rows.length
      ? rows.length + (rows.length === 1 ? ' project' : ' projects') + ' in the ' + forState + ' register · updated ' +
        new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })
      : 'The register has no ' + forState + ' projects';
    if(!rows.length){
      projectStatus.textContent = 'Nothing came back for ' + forState + '. If one register holds every ' +
        'state, check its State column matches ' + forState + ' exactly. If there is a register per ' +
        'state, check the flow has a case for ' + forState + '. Or type the project in below.';
    }
  } catch(err){
    if(!currentState || currentState.code !== forState) return;
    projects = [];
    projectSelect.innerHTML = '<option value="">Could not load projects</option>';
    projectSource.textContent = 'Not connected';
    projectStatus.textContent = err.message || 'The projects flow could not be reached.';
    projectStatus.className = 'status-line err';
    setManualMode(true);
  } finally {
    if(currentState && currentState.code === forState){
      projectRefresh.disabled = false;
      updateFilingNote();
    }
  }
}

projectSelect.addEventListener('change', () => {
  const chosen = projects.find(p => p.id === projectSelect.value) || null;
  applyProject(chosen);
  projectSelect.classList.remove('field-invalid');
});

projectRefresh.addEventListener('click', loadProjects);

/* ==========================================================================
   PREFILLED DETAILS

   The letterhead, the recipient and the sign-off all arrive from a register and
   are the same on every variation for a job. On the form they are a screen of
   boxes nobody edits, between the person and the fields they actually came to
   fill in. So they collapse to a summary.

   Collapsed, not removed: the inputs stay in the page holding their values,
   because the preview and the PDF are both built from them. Only the form side
   hides.
   ========================================================================== */

const PREFILLED_KEY = 'variationCoverSheet:showPrefilled';
const prefilledBar = document.getElementById('prefilled-bar');
const prefilledSummary = document.getElementById('prefilled-summary');
const prefilledToggle = document.getElementById('prefilled-toggle');
const prefilledGroups = ['pf-letterhead', 'pf-recipient', 'pf-signoff']
  .map(id => document.getElementById(id));

let showPrefilled = false;
try { showPrefilled = localStorage.getItem(PREFILLED_KEY) === '1'; } catch(e){}

// Collapsing is only honest when something really did fill them in. With no
// office chosen, or a project typed by hand, these are the person's to complete
// and hiding them would hide required fields behind a button.
function prefilledAreFilled(){
  const letterhead = !!(currentState && els['co-name'].value.trim());
  const recipient = !!(selectedProject && els['recipient-name'].value.trim());
  return letterhead && recipient;
}

function summarise(){
  const v = id => els[id].value.trim();
  const parts = [];
  if(v('co-name')) parts.push(['Letterhead', v('co-name')]);
  const to = [v('recipient-name'), v('attention')].filter(Boolean).join(', ');
  if(to) parts.push(['To', to]);
  const by = [v('sig-name'), v('sig-title')].filter(Boolean).join(' \u2014 ');
  if(by) parts.push(['Issued by', by]);
  return parts.map(([k, val]) =>
    '<span class="pf-item"><span class="pf-k">' + k + '</span>' + escapeHtml(val) + '</span>').join('');
}

function syncPrefilled(){
  const collapsible = prefilledAreFilled();
  const hide = collapsible && !showPrefilled;

  prefilledGroups.forEach(g => { if(g) g.hidden = hide; });
  prefilledBar.hidden = !collapsible;
  prefilledToggle.textContent = showPrefilled ? 'Hide again' : 'Edit these';
  prefilledSummary.innerHTML = hide
    ? summarise()
    : '<span class="pf-open">Letterhead, recipient and sign-off are filled from the registers \u2014 ' +
      'change them here for this letter only.</span>';
}

prefilledToggle.addEventListener('click', () => {
  showPrefilled = !showPrefilled;
  try { localStorage.setItem(PREFILLED_KEY, showPrefilled ? '1' : '0'); } catch(e){}
  syncPrefilled();
  if(showPrefilled) prefilledGroups[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Opens the groups because something inside them needs attention -- a required
// field left empty must never be hidden behind a button.
function revealPrefilled(){
  if(showPrefilled) return;
  showPrefilled = true;
  try { localStorage.setItem(PREFILLED_KEY, '1'); } catch(e){}
  syncPrefilled();
}

/* ==========================================================================
   REQUIRED FIELDS
   ========================================================================== */

const REQUIRED_FIELDS = [
  { id: 'co-phone', label: 'Phone' },
  { id: 'co-address', label: 'Address' },
  { id: 'co-email', label: 'Email' },
  { id: 'recipient-name', label: 'Head contractor / company' },
  { id: 'recipient-address', label: 'Recipient address' },
  { id: 'attention', label: 'Attention' },
  // when the dropdown is in use the error belongs on the dropdown, not on the
  // hidden text input nobody can see
  { id: 'project', label: 'Project', getEl: () => (projectManualWrap.hidden ? projectSelect : els['project']) }
];
REQUIRED_FIELDS.forEach(f => { if(!f.getEl) f.getEl = () => els[f.id]; });

const printStatus = document.getElementById('print-status');
const printBtn = document.getElementById('print-btn');
const printBtnOriginalLabel = printBtn.textContent;
const fileState = document.getElementById('file-state');

function clearInvalid(){
  REQUIRED_FIELDS.forEach(f => f.getEl().classList.remove('field-invalid'));
}

REQUIRED_FIELDS.forEach(f => {
  els[f.id].addEventListener('input', () => {
    els[f.id].classList.remove('field-invalid');
    projectSelect.classList.remove('field-invalid');
  });
});

// The variation file sits beside the PDF and is named after it.
function variationFileName(){
  const varref = (typeof effectiveRef === 'function') ? effectiveRef() : els['varref'].value.trim();
  const desc = els['variationdesc'].value.trim();
  return ([varref, desc].filter(Boolean).join(' - ') || 'Variation') + ' - Variation File.json';
}

function buildPrintFilename(){
  const varref = effectiveRef();
  const desc = els['variationdesc'].value.trim();
  if(!varref && !desc) return 'Variation Cover Sheet';
  return [varref, desc, 'Direction of Variation'].filter(Boolean).join(' - ');
}

/* ==========================================================================
   DRAWING REFERENCE ROWS
   ========================================================================== */

const dwgRowsContainer = document.getElementById('dwg-rows');
const dwgAddBtn = document.getElementById('dwg-add-btn');
const dwgPanel = document.getElementById('dwg-panel');
const dwgPreviewBody = document.getElementById('dwg-preview-body');

function focusFirstInput(row){
  const input = row.querySelector('.dwg-input');
  if(input) input.focus();
}

function attachDwgRowEvents(row){
  row.querySelectorAll('.dwg-input').forEach(inp => {
    inp.addEventListener('input', renderDwgPreview);
    inp.addEventListener('keydown', (e) => {
      if(e.key !== 'Enter') return;
      e.preventDefault();
      const rows = Array.from(dwgRowsContainer.children);
      const idx = rows.indexOf(row);
      if(idx === rows.length - 1){ focusFirstInput(addDwgRow()); }
      else { focusFirstInput(rows[idx + 1]); }
    });
  });
  row.querySelector('.dwg-remove').addEventListener('click', () => {
    row.remove();
    if(dwgRowsContainer.children.length === 0){ addDwgRow(); }
    renderDwgPreview();
  });
}

function addDwgRow(){
  const row = document.createElement('div');
  row.className = 'dwg-row';
  row.innerHTML =
    '<input type="text" class="dwg-input dwg-number" placeholder="e.g. H-201">' +
    '<input type="text" class="dwg-input dwg-name" placeholder="e.g. Hydraulic Services Layout">' +
    '<input type="text" class="dwg-input dwg-old mono-input" placeholder="C">' +
    '<input type="text" class="dwg-input dwg-new mono-input" placeholder="D">' +
    '<button type="button" class="dwg-remove" title="Remove row">&times;</button>';
  dwgRowsContainer.appendChild(row);
  attachDwgRowEvents(row);
  return row;
}

function collectDrawings(){
  return Array.from(dwgRowsContainer.children).map(row => ({
    number: row.querySelector('.dwg-number').value.trim(),
    name: row.querySelector('.dwg-name').value.trim(),
    oldRev: row.querySelector('.dwg-old').value.trim(),
    newRev: row.querySelector('.dwg-new').value.trim()
  })).filter(r => r.number || r.name || r.oldRev || r.newRev);
}

function renderDwgPreview(){
  const rows = collectDrawings();
  if(!rows.length){ dwgPanel.style.display = 'none'; return; }
  dwgPanel.style.display = 'block';
  dwgPreviewBody.innerHTML = rows.map(r =>
    '<tr>' +
      '<td>' + (escapeHtml(r.number) || '—') + '</td>' +
      '<td>' + (escapeHtml(r.name) || '—') + '</td>' +
      '<td class="rev">' + (escapeHtml(r.oldRev) || '—') + '</td>' +
      '<td class="rev">' + (escapeHtml(r.newRev) || '—') + '</td>' +
    '</tr>'
  ).join('');
}

dwgAddBtn.addEventListener('click', () => focusFirstInput(addDwgRow()));
addDwgRow();
renderDwgPreview();

/* ==========================================================================
   FIELD SUGGESTIONS — what this browser has typed before
   ========================================================================== */

const AC_FIELDS = ['co-phone','co-address','co-email','recipient-address','attention','project'];
const AC_KEY = 'variationCoverSheet:history';
const AC_MAX = 20;
const AC_MAX_LENGTH = 400;
let acHistory = {};

try { acHistory = JSON.parse(localStorage.getItem(AC_KEY) || '{}') || {}; } catch(e){ acHistory = {}; }

function acPersist(){
  try { localStorage.setItem(AC_KEY, JSON.stringify(acHistory)); } catch(e){}
}
function acGetHistory(id){ return acHistory[id] || []; }
function acSaveHistory(id, value){
  value = (value || '').trim();
  if(!value || value.length > AC_MAX_LENGTH) return;
  if(acGetHistory(id)[0] === value) return;
  acHistory[id] = [value].concat(acGetHistory(id).filter(v => v !== value)).slice(0, AC_MAX);
  acPersist();
}
function acRemoveHistory(id, value){
  acHistory[id] = acGetHistory(id).filter(v => v !== value);
  acPersist();
}

AC_FIELDS.forEach(id => {
  const input = els[id] || document.getElementById(id);
  const list = document.getElementById('ac-' + id);
  if(!input || !list) return;

  function showList(){
    const query = input.value.trim().toLowerCase();
    const hist = acGetHistory(id);
    const filtered = query ? hist.filter(v => v.toLowerCase().includes(query)) : hist;
    if(!filtered.length){ list.style.display = 'none'; return; }
    list.innerHTML = filtered.map(v =>
      '<div class="ac-item" data-val="' + escapeHtml(v) + '">' +
        '<span class="ac-item-text">' + escapeHtml(v) + '</span>' +
        '<span class="ac-item-remove" data-remove="' + escapeHtml(v) + '" title="Remove">&times;</span>' +
      '</div>'
    ).join('');
    list.style.display = 'block';
  }

  input.addEventListener('focus', showList);
  input.addEventListener('input', showList);
  input.addEventListener('blur', () => {
    setTimeout(() => { list.style.display = 'none'; }, 150);   // let a click land first
    acSaveHistory(id, input.value);
  });

  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const removeVal = e.target.getAttribute('data-remove');
    if(removeVal !== null){ acRemoveHistory(id, removeVal); showList(); return; }
    const item = e.target.closest('.ac-item');
    if(item){
      input.value = item.getAttribute('data-val');
      list.style.display = 'none';
      render();
    }
  });
});

/* ==========================================================================
   LOGO
   ========================================================================== */

const LOGO_KEY = 'variationCoverSheet:logo';
const logoFile = document.getElementById('logo-file');
const logoPreview = document.getElementById('logo-preview');
const letterheadLogo = document.getElementById('letterhead-logo');
let uploadedLogo = '';
try { uploadedLogo = localStorage.getItem(LOGO_KEY) || ''; } catch(e){}

function applyLogo(src){
  const html = src ? '<img src="' + src + '" alt="Logo">' : '';
  logoPreview.innerHTML = html;
  letterheadLogo.innerHTML = html;
}

logoFile.addEventListener('change', () => {
  const file = logoFile.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedLogo = e.target.result;
    try { localStorage.setItem(LOGO_KEY, uploadedLogo); } catch(err){}
    applyLogo(uploadedLogo);
  };
  reader.readAsDataURL(file);
});

/* ==========================================================================
   DESCRIPTION OF WORKS
   ========================================================================== */

const aiBtn = document.getElementById('ai-btn');
const aiStatus = document.getElementById('ai-status');

// The fallback when no wording flow is configured. It is punctuation and
// capitalisation only — it does not reword anything, and the status line says
// so, because a description that claims to be polished but is not is worse
// than obviously rough notes.
function tidyLocally(raw){
  return raw
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      let text = line.replace(/\s+/g, ' ');
      text = text.charAt(0).toUpperCase() + text.slice(1);
      if(!/[.!?]$/.test(text)) text += '.';
      return text;
    })
    .join(' ');
}

aiBtn.addEventListener('click', async () => {
  const raw = document.getElementById('desc-raw').value.trim();
  if(!raw){
    aiStatus.textContent = 'Add some rough notes first.';
    aiStatus.className = 'status-line err';
    return;
  }

  if(!Flows.has('describeUrl')){
    els['desc-final'].value = tidyLocally(raw);
    render();
    aiStatus.textContent = 'Tidied locally — sentences and punctuation only. Add a wording flow in Settings for a real rewrite.';
    aiStatus.className = 'status-line';
    return;
  }

  aiBtn.disabled = true;
  const originalLabel = aiBtn.innerHTML;
  aiBtn.innerHTML = 'Writing…';
  aiStatus.textContent = '';
  aiStatus.className = 'status-line';

  try {
    const text = await Flows.describe({
      notes: raw,
      state: currentState ? currentState.code : '',
      project: els['project'].value.trim(),
      clauseRef: els['clauseref'].value.trim()
    });
    els['desc-final'].value = text;
    render();
    aiStatus.textContent = 'Description generated — edit it freely before downloading.';
    aiStatus.className = 'status-line ok';
  } catch(err){
    // Short, because this is the form, not the administrator's screen. The
    // full diagnosis is one click away under Connect to the flows, where
    // somebody can actually act on it.
    aiStatus.textContent = 'The wording flow is not available right now \u2014 '
      + Flows.plainMessage(err) + '. Your notes are untouched; write the description '
      + 'directly, or use them as they are.';
    aiStatus.className = 'status-line err';
  } finally {
    aiBtn.disabled = false;
    aiBtn.innerHTML = originalLabel;
  }
});

/* ==========================================================================
   THE PDF — real A4 pages
   ==========================================================================
   html2pdf rasterises whatever it is handed and slices that one image at page
   boundaries, so the letterhead could only ever land on page 1. Build the
   document as actual pages instead -- each with its own letterhead, footer and
   page number -- and hand it over already paginated.
   ========================================================================== */

function stripIds(node){
  if(node.removeAttribute) node.removeAttribute('id');
  if(node.querySelectorAll){
    Array.prototype.forEach.call(node.querySelectorAll('[id]'), el => el.removeAttribute('id'));
  }
  return node;
}

function isShown(el){
  return !!el && getComputedStyle(el).display !== 'none';
}

// `extend`, when given, adds pages after the letter (stages 2-4). It is handed
// the same page machinery the letter uses, so every page of the variation
// carries the letterhead and is numbered as one document.
function buildPdfDocument(extend){
  const sheet = document.querySelector('#view-editor .sheet');
  const holder = document.createElement('div');
  holder.className = 'pdf-holder';
  const doc = document.createElement('div');
  doc.className = 'pdf-doc';
  holder.appendChild(doc);
  document.body.appendChild(holder);   // must be laid out to be measured

  let wrapEl = null;   // the fixed-height area a page's content has to fit in
  let bodyEl = null;   // where blocks actually go
  let pageBreakPending = false;
  // uploaded PDFs, spliced in after this many generated pages once rendered
  const externals = [];

  function addPage(){
    const page = document.createElement('div');
    page.className = 'pdf-page';
    page.appendChild(stripIds(sheet.querySelector('.letterhead').cloneNode(true)));

    wrapEl = document.createElement('div');
    wrapEl.className = 'pdf-page-body';
    bodyEl = document.createElement('div');
    bodyEl.className = 'letter-body';
    wrapEl.appendChild(bodyEl);
    page.appendChild(wrapEl);

    const footer = stripIds(sheet.querySelector('.sheet-footer').cloneNode(true));
    const num = document.createElement('span');
    num.className = 'pdf-page-num';
    footer.insertBefore(num, footer.lastElementChild);
    page.appendChild(footer);

    doc.appendChild(page);
    return bodyEl;
  }

  function overflows(){
    return wrapEl.scrollHeight > wrapEl.clientHeight;
  }

  // append a block, moving it to a fresh page if it does not fit on this one
  function place(node){
    if(pageBreakPending){ pageBreakPending = false; addPage(); }
    bodyEl.appendChild(node);
    if(overflows() && bodyEl.childNodes.length > 1){
      bodyEl.removeChild(node);
      addPage();
      bodyEl.appendChild(node);
    }
    return node;
  }

  // ---- reference table: rows flow between pages, never split mid-row
  function newRefTable(){
    const table = document.createElement('table');
    table.className = 'ref-table';
    return table;
  }

  function placeRefRows(rows){
    if(!rows.length) return;
    let table = place(newRefTable());
    rows.forEach(tr => {
      table.appendChild(tr);
      if(!overflows()) return;
      table.removeChild(tr);
      if(!table.rows.length) table.remove();
      addPage();
      table = bodyEl.appendChild(newRefTable());
      table.appendChild(tr);
      // a row too tall for a page of its own has to be split by words,
      // otherwise the overflow would be silently clipped
      if(overflows()) table = splitRefRow(tr, table);
    });
  }

  function splitRefRow(tr, table){
    const labelCell = tr.querySelector('.k');
    const valueCell = tr.querySelector('.v');
    const words = valueCell ? valueCell.textContent.split(/\s+/).filter(Boolean) : [];
    if(!valueCell || words.length < 2) return table;   // nothing sensible to split

    const labelHtml = labelCell ? labelCell.innerHTML : '';
    let row = tr, cell = valueCell, taken = 0;

    while(taken < words.length){
      // the largest number of words that still fits on this page
      let lo = 1, hi = words.length - taken, fits = 1;
      while(lo <= hi){
        const mid = (lo + hi) >> 1;
        cell.textContent = words.slice(taken, taken + mid).join(' ');
        if(overflows()){ hi = mid - 1; } else { fits = mid; lo = mid + 1; }
      }
      cell.textContent = words.slice(taken, taken + fits).join(' ');
      taken += fits;
      if(taken >= words.length) break;

      addPage();
      table = bodyEl.appendChild(newRefTable());
      row = document.createElement('tr');
      const k = document.createElement('td');
      k.className = 'k';
      k.innerHTML = labelHtml + '<br>(continued)';
      cell = document.createElement('td');
      cell.className = 'v';
      row.appendChild(k);
      row.appendChild(cell);
      table.appendChild(row);
    }
    return table;
  }

  // ---- drawing table: the column headings repeat on every page it runs onto
  function placeDwgPanel(panel){
    const title = panel.querySelector('.dwg-panel-title');
    const srcTable = panel.querySelector('.dwg-preview-table');
    const thead = srcTable.querySelector('thead');
    const rows = Array.prototype.slice.call(srcTable.querySelectorAll('tbody tr'));
    let tbody = null;

    function freshPanel(continued){
      const wrap = document.createElement('div');
      wrap.className = 'dwg-panel';
      const heading = title.cloneNode(true);
      if(continued) heading.textContent = title.textContent + ' (continued)';
      wrap.appendChild(heading);
      const table = document.createElement('table');
      table.className = 'dwg-preview-table';
      if(thead) table.appendChild(thead.cloneNode(true));
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    }

    place(freshPanel(false));
    rows.forEach(tr => {
      tbody.appendChild(tr);
      if(!overflows()) return;
      tbody.removeChild(tr);
      addPage();
      bodyEl.appendChild(freshPanel(true));
      tbody.appendChild(tr);
    });
  }

  // ---- flow the letter, block by block, in the order it reads on screen
  addPage();

  const pick = sel => sheet.querySelector(sel);
  const pushIfShown = sel => {
    const el = pick(sel);
    if(isShown(el)) place(stripIds(el.cloneNode(true)));
  };

  pushIfShown('#p-date');
  pushIfShown('#p-recipient');
  pushIfShown('#p-attn-row');
  pushIfShown('#p-re-row');
  pushIfShown('#p-intro');

  placeRefRows(Array.prototype.slice.call(sheet.querySelectorAll('.ref-table tr'))
    .filter(isShown).map(tr => stripIds(tr.cloneNode(true))));

  const dwgPanelEl = pick('#dwg-panel');
  if(isShown(dwgPanelEl)) placeDwgPanel(stripIds(dwgPanelEl.cloneNode(true)));

  pushIfShown('#p-closing');

  // the rule and the sign-off travel together -- a signature block orphaned
  // from its rule reads as a different document
  const signOff = document.createElement('div');
  signOff.appendChild(stripIds(pick('.sig-line-rule').cloneNode(true)));
  signOff.appendChild(stripIds(pick('.sig-block').cloneNode(true)));
  place(signOff);

  if(extend){
    extend({
      place: place,
      overflows: overflows,
      body: () => bodyEl,
      // the next block starts a fresh page
      newPage: () => { pageBreakPending = true; },
      // a section that has to start on a page of its own, and the leftover
      // space of the last one is not worth a page: only break when something
      // is already on this page
      startSection: () => { if(bodyEl.childNodes.length) pageBreakPending = true; },
      // an uploaded PDF goes in whole after the pages laid out so far
      external: (pageCount, payload) => {
        externals.push({ afterPage: doc.querySelectorAll('.pdf-page').length, pageCount: pageCount, payload: payload });
        pageBreakPending = true;
      }
    });
  }

  // numbered as the PDF will read, uploaded pages included
  const pages = Array.prototype.slice.call(doc.querySelectorAll('.pdf-page'));
  const total = pages.length + externals.reduce((n, x) => n + x.pageCount, 0);
  pages.forEach((page, i) => {
    const before = externals.filter(x => x.afterPage <= i).reduce((n, x) => n + x.pageCount, 0);
    const num = page.querySelector('.pdf-page-num');
    if(num) num.textContent = 'Page ' + (i + 1 + before) + ' of ' + total;
  });

  doc.externals = externals;
  return doc;
}

// Capture each A4 page on its own and place it whole. Handing html2pdf the
// stacked document instead makes it slice one tall image at its own page
// intervals, which drifts out of step with the page divs and emits spurious
// pages -- a five-page letter came out as nine.
async function renderPages(doc, opt){
  const pages = Array.prototype.slice.call(doc.querySelectorAll('.pdf-page'));
  if(!pages.length) throw new Error('nothing to render');

  // the first page also yields the jsPDF document the rest are added to
  const pdf = await html2pdf().set(opt).from(pages[0]).toPdf().get('pdf');
  while(pdf.internal.getNumberOfPages() > 1) pdf.deletePage(pdf.internal.getNumberOfPages());

  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  for(let i = 1; i < pages.length; i++){
    const canvas = await html2pdf().set(opt).from(pages[i]).toCanvas().get('canvas');
    pdf.addPage();
    pdf.addImage(canvas.toDataURL(opt.image.type === 'jpeg' ? 'image/jpeg' : 'image/png', opt.image.quality),
                 opt.image.type === 'jpeg' ? 'JPEG' : 'PNG', 0, 0, width, height);
  }

  return pdf;
}

/* ==========================================================================
   FILING — hand the finished PDF to Power Automate
   ========================================================================== */

// Power Automate's HTTP trigger will take a large body, but base64 adds a third
// again to the size and a 25MB upload over a site connection is a bad surprise
// at the end of a form. Warn rather than refuse: the local copy has already
// downloaded, so the worst case is filing it by hand.
const FILE_SIZE_WARN_BYTES = 20 * 1024 * 1024;

function buildFilingPayload(pdfBase64, fileName, fileKind){
  return {
    fileName: fileName,
    // 'pdf', or 'variation-file' for the JSON that holds the whole variation.
    // Both go into the project's folder by the same flow.
    fileKind: fileKind || 'pdf',
    pdfBase64: pdfBase64,
    state: currentState ? currentState.code : '',
    stateEntity: els['co-name'].value.trim(),
    projectId: selectedProject ? selectedProject.id : '',
    project: els['project'].value.trim(),
    // folderPath is ready for Create file: relative to the site, decoded from
    // whatever the register held. The other two are there so a flow that wants
    // the full server path, or the site the folder lives on, need not re-derive
    // them from a URL.
    folderPath: selectedProject ? (selectedProject.folderPath || '') : '',
    folderServerPath: selectedProject ? (selectedProject.folderServerPath || '') : '',
    sitePath: selectedProject ? (selectedProject.sitePath || '') : '',
    siteUrl: selectedProject ? (selectedProject.siteUrl || '') : '',
    variationRef: els['varref'].value.trim(),
    variationDescription: els['variationdesc'].value.trim(),
    headContractor: els['recipient-name'].value.trim(),
    attention: els['attention'].value.trim(),
    issuedBy: els['sig-name'].value.trim(),
    position: els['sig-title'].value.trim(),
    siteInstructionRef: els['siref'].value.trim(),
    clauseRef: els['clauseref'].value.trim(),
    aconexRef: els['aconexref'].value.trim(),
    contractorDirection: els['contractordirection'].value.trim(),
    emailRef: els['emailref'].value.trim(),
    descriptionOfWorks: els['desc-final'].value.trim(),
    drawings: collectDrawings(),
    issuedDate: new Date().toISOString()
  };
}

function bytesToBase64(bytes){
  let binary = '';
  const chunk = 0x8000;
  for(let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fileToSharePoint(pdfBytes, fileName){
  if(!Flows.has('fileUrl')){
    fileState.textContent = 'Downloaded. Not filed — no filing flow configured.';
    fileState.className = 'save-state';
    return;
  }

  fileState.textContent = 'Filing to SharePoint…';
  fileState.className = 'save-state';

  const base64 = bytesToBase64(pdfBytes);
  const approxBytes = Math.floor(base64.length * 3 / 4);

  if(approxBytes > FILE_SIZE_WARN_BYTES){
    fileState.textContent = 'Filing ' + Math.round(approxBytes / 1048576) + ' MB — this may take a minute…';
  }

  try {
    const result = await Flows.fileVariation(buildFilingPayload(base64, fileName));
    if(result.status === 'confirmed'){
      const where = (result.response && (result.response.path || result.response.webUrl)) || '';
      fileState.textContent = 'Filed to SharePoint' + (where ? ': ' + where : '') + '.';
      fileState.className = 'save-state';
    } else {
      // no-cors: it went out, but the browser would not show us the reply
      fileState.textContent = 'Sent to the filing flow. The browser could not read the reply, so check ' +
        'SharePoint to confirm it landed' +
        (result.firstTime ? ' — and that only one copy arrived, since finding this out cost a second send' : '') +
        ' (see the setup guide, step 6).';
      fileState.className = 'save-state';
    }
  } catch(err){
    fileState.textContent = 'Downloaded, but NOT filed — ' + (err.message || 'the filing flow failed') +
      ' Save the PDF to SharePoint by hand this time.';
    fileState.className = 'save-state err';
  }
}

const PDF_OPTIONS = {
  margin: 0,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    // html2canvas offsets its capture window by the page's scroll position by
    // default. html2pdf renders what it is given into a fixed-position holder,
    // which does not scroll with the page, so on a scrolled page the two
    // disagree and it captures empty space -- a blank PDF. Pinning the capture
    // window to the origin is what makes the letter come out at all.
    scrollX: 0,
    scrollY: 0
  },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: [] }
};

// Lays out and renders the whole variation -- letter, scope, schedule and the
// attachments -- and returns the finished file. Uploaded PDFs are spliced in
// whole with pdf-lib, so a drawing keeps its vectors and its own sheet size.
async function buildVariationPdf(){
  if(typeof html2pdf === 'undefined'){ throw new Error('html2pdf not loaded'); }
  const fileName = buildPrintFilename() + '.pdf';
  const extend = (typeof Stages !== 'undefined') ? Stages.appendToPdf : null;
  const pdfDoc = buildPdfDocument(extend);
  try {
    const pdf = await renderPages(pdfDoc, Object.assign({ filename: fileName }, PDF_OPTIONS));
    pdf.setProperties({ title: buildPrintFilename() });
    let bytes = new Uint8Array(pdf.output('arraybuffer'));
    const externals = pdfDoc.externals || [];
    if(externals.length){
      if(typeof PDFLib === 'undefined') throw new Error('pdf-lib not loaded');
      const generated = await PDFLib.PDFDocument.load(bytes);
      const out = await PDFLib.PDFDocument.create();
      const ownPages = await out.copyPages(generated, generated.getPageIndices());
      let next = 0;
      for(let i = 0; i <= ownPages.length; i++){
        for(const x of externals.filter(e => e.afterPage === i)){
          const src = await PDFLib.PDFDocument.load(x.payload, { ignoreEncryption: true });
          const copied = await out.copyPages(src, src.getPageIndices());
          copied.forEach(pg => out.addPage(pg));
        }
        if(i < ownPages.length) out.addPage(ownPages[next++]);
      }
      out.setTitle(buildPrintFilename());
      bytes = await out.save();
    }
    return { bytes: bytes, fileName: fileName };
  } catch(err){
    err.pdfDoc = pdfDoc;   // kept for the print-dialog fallback
    throw err;
  } finally {
    // the print-dialog fallback puts it back if it needs it
    if(pdfDoc.parentNode) pdfDoc.parentNode.remove();
  }
}

function saveBytes(bytes, fileName){
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// `built` is the file the review screen already rendered, when it is still
// current: the download is then exactly what was previewed, with no wait.
async function downloadPdf(built){
  printBtn.disabled = true;
  printBtn.textContent = 'Generating PDF…';
  printStatus.textContent = '';
  printStatus.className = 'status-line';
  fileState.textContent = '';
  fileState.className = 'save-state';

  try {
    const result = built || await buildVariationPdf();
    // Save the local copy first. Filing can fail; the download should not be
    // held hostage to SharePoint being reachable.
    saveBytes(result.bytes, result.fileName);
    // The log records what was issued, so it is written only once the PDF
    // exists -- not when the button was pressed.
    if(Flows.has('logWriteUrl') && els['varref'].value.trim()){
      await saveToLog({ downloadedAt: new Date().toISOString(), fileName: result.fileName });
    }
    await fileToSharePoint(result.bytes, result.fileName);
    // and everything behind it, so the variation can be opened again in full
    if(typeof VariationFile !== 'undefined' && VariationFile.withPdf()) await VariationFile.saveToSharePoint();
  } catch(err){
    console.error(err);
    printStatus.textContent = 'Could not build the PDF — opening the print dialog instead, choose "Save as PDF" there. ' +
      'Uploaded PDFs are not included that way; attach them separately.';
    printStatus.className = 'status-line err';
    const pdfDoc = err.pdfDoc;
    if(pdfDoc){
      document.body.appendChild(pdfDoc.parentNode || pdfDoc);
      document.body.classList.add('pdf-fallback');
    }
    window.print();
    document.body.classList.remove('pdf-fallback');
    if(pdfDoc && pdfDoc.parentNode) pdfDoc.parentNode.remove();
  } finally {
    printBtn.disabled = false;
    printBtn.textContent = printBtnOriginalLabel;
  }
}

// The cover sheet's own required fields. Returns true when they are all there;
// otherwise marks them, opens the cover sheet and puts the cursor in the first.
function checkCoverSheet(statusEl){
  clearInvalid();
  const missing = REQUIRED_FIELDS.filter(f => !els[f.id].value.trim());
  if(!missing.length){ statusEl.textContent = ''; return true; }
  if(typeof Stages !== 'undefined' && Stages.current() !== 'cover') Stages.go('cover');
  // it may be sitting in a collapsed group; open it before pointing at it
  revealPrefilled();
  missing.forEach(f => f.getEl().classList.add('field-invalid'));
  coverStatus.textContent = 'Fill in: ' + missing.map(f => f.label).join(', ') + '.';
  coverStatus.className = 'status-line err';
  setTimeout(() => {
    missing[0].getEl().scrollIntoView({ behavior: 'smooth', block: 'center' });
    missing[0].getEl().focus();
  }, 0);
  return false;
}

const coverStatus = document.getElementById('cover-status');

document.getElementById('to-scope-btn').addEventListener('click', () => {
  if(checkCoverSheet(coverStatus)) Stages.go('scope');
});

printBtn.addEventListener('click', () => {
  if(!checkCoverSheet(printStatus)) return;
  downloadPdf(Stages.currentBuild());
});

/* ==========================================================================
   THE VARIATION LOG
   ==========================================================================
   Every variation the generator produces becomes a row in a second SharePoint
   list, keyed by the project and the variation reference together. Entering a
   reference creates the row; Download PDF and "Save to log" update it.

   Reopening is the point of it: pick a past variation, or type a reference that
   already exists, and the form comes back exactly as it was issued.
   ========================================================================== */

const LOG_FIELDS = textIds.concat(['desc-raw']);

function collectFormState(){
  const fields = {};
  LOG_FIELDS.forEach(id => { fields[id] = els[id] ? els[id].value : ''; });
  fields['desc-raw'] = document.getElementById('desc-raw').value;
  return {
    version: 1,
    office: currentState ? currentState.code : '',
    projectId: selectedProject ? selectedProject.id : '',
    fields: fields,
    drawings: collectDrawings(),
    // stages 2 and 3; attachments are not logged -- they are files, not fields.
    // They are in the variation file, and this names it, so reopening from the
    // log can fetch the whole thing back.
    stages: (typeof Stages !== 'undefined') ? Stages.collect() : null,
    variationFile: variationFileName()
  };
}

// Restores a variation as issued, letterhead included -- reopening VAR-042 to
// re-issue it should reproduce the letter, not today's defaults.
function applyFormState(saved){
  const fields = (saved && saved.fields) || {};
  LOG_FIELDS.forEach(id => {
    const el = els[id] || document.getElementById(id);
    if(el && fields[id] !== undefined) el.value = fields[id];
  });

  dwgRowsContainer.innerHTML = '';
  ((saved && saved.drawings) || []).forEach(d => {
    const row = addDwgRow();
    row.querySelector('.dwg-number').value = d.number || '';
    row.querySelector('.dwg-name').value = d.name || '';
    row.querySelector('.dwg-old').value = d.oldRev || '';
    row.querySelector('.dwg-new').value = d.newRev || '';
  });
  if(!dwgRowsContainer.children.length) addDwgRow();

  if(typeof Stages !== 'undefined') Stages.apply(saved && saved.stages);

  clearInvalid();
  render();
  renderDwgPreview();
}

/* --------------------------------------------------------------------------
   Variation numbers

   The reference is allocated, not typed: the log already holds every variation
   on this project, so the next one is the highest base number plus one. The
   format is copied from the highest-numbered reference that exists rather than
   imposed, so a job running V-12 keeps running V-13 and one running VAR-007
   gets VAR-008.

   A revision hangs off a base: numeric revisions read VAR-001.1, letter ones
   VAR-001A, which is how both are written on site.
-------------------------------------------------------------------------- */

const DEFAULT_REF_FORMAT = 'VAR-001';

// "VAR-007" -> prefix VAR-, number 7, width 3, no revision
// "VAR-007.1" / "VAR-007A" -> the same base, carrying a revision
function parseRef(ref){
  const m = /^(.*?)(\d+)([.\-_]?[0-9A-Za-z]*)$/.exec(String(ref || '').trim());
  if(!m) return null;
  return {
    prefix: m[1],
    number: parseInt(m[2], 10),
    width: m[2].length,
    revision: m[3] || '',
    base: m[1] + m[2]
  };
}

function formatRef(prefix, number, width){
  return prefix + String(number).padStart(width, '0');
}

// Numbers come from the log's base references; a revision is not a new number.
function nextRef(refs){
  const parsed = refs.map(parseRef).filter(Boolean);
  if(!parsed.length){
    const seed = parseRef(DEFAULT_REF_FORMAT);
    return formatRef(seed.prefix, seed.number, seed.width);
  }
  const highest = parsed.reduce((a, b) => (b.number > a.number ? b : a));
  return formatRef(highest.prefix, highest.number + 1, highest.width);
}

function composeRef(base, revision){
  const rev = String(revision || '').trim();
  if(!rev) return base;
  // .1 for a numbered revision, A appended for a lettered one
  return /^\d+$/.test(rev) ? base + '.' + rev : base + rev;
}

const logHistory = document.getElementById('log-history');
const logSelect = document.getElementById('log-select');
const logLoad = document.getElementById('log-load');
const logCount = document.getElementById('log-count');
const logStatus = document.getElementById('log-status');
const logSaveBtn = document.getElementById('log-save');
const varrefStatus = document.getElementById('varref-status');
const reopenedBar = document.getElementById('reopened-bar');

let logRows = [];
let reopenedRef = '';      // the reference this form was loaded from, if any
let issueMode = 'new';     // 'new' or 'revise'
let refOverridden = false; // the number was typed by hand, so stop allocating it

const modeToggle = document.getElementById('mode-toggle');
const varrevField = document.getElementById('varrev-field');
const varrev = document.getElementById('varrev');
const varrefEdit = document.getElementById('varref-edit');
const effectiveRefEl = document.getElementById('effective-ref');

// What actually goes on the letter, in the filename and into the log.
function effectiveRef(){
  const base = els['varref'].value.trim();
  if(!base) return '';
  return issueMode === 'revise' ? composeRef(base, varrev.value) : base;
}

function baseRefsInLog(){
  return logRows.map(r => { const p = parseRef(r.variationRef); return p ? p.base : ''; })
                .filter(Boolean);
}

// Numbers come from one project's history within one office. Without both,
// there is no sequence to continue and nothing may be allocated -- guessing
// would hand out VAR-001 on a job already up to forty.
function canAllocate(){
  return Flows.has('logReadUrl') && !!currentState && !!selectedProject;
}

// Locked while the app is allocating, typeable when it cannot. A read-only box
// the app is not filling is just a field nobody can complete.
function syncRefLock(){
  const auto = canAllocate() && issueMode === 'new' && !refOverridden && !reopenedRef;
  els['varref'].readOnly = auto;
  // Nothing to allocate in revise mode -- the base is whichever variation is
  // being revised -- so the Edit/Auto toggle has nothing to say there.
  varrefEdit.hidden = !canAllocate() || issueMode !== 'new';
  varrefEdit.textContent = auto ? 'Edit' : 'Auto';
  els['varref'].placeholder = auto ? '' : 'e.g. VAR-042';
}

function allocateRef(){
  syncRefLock();
  if(!canAllocate() || issueMode !== 'new' || refOverridden || reopenedRef) return;
  els['varref'].value = nextRef(baseRefsInLog());
  updateEffectiveRef();
  render();
}

function updateEffectiveRef(){
  const base = els['varref'].value.trim();
  const rev = varrev.value.trim();
  const full = effectiveRef();

  if(issueMode === 'revise' && base && rev){
    effectiveRefEl.hidden = false;
    effectiveRefEl.innerHTML = 'This will be issued as <strong>' + escapeHtml(full) + '</strong>' +
      ' — a new entry in the log, alongside ' + escapeHtml(base) + '.';
  } else if(issueMode === 'revise' && base){
    effectiveRefEl.hidden = false;
    effectiveRefEl.innerHTML = 'Re-issuing <strong>' + escapeHtml(base) + '</strong> — this updates its ' +
      'existing log entry. Add a revision to issue it as a separate one.';
  } else {
    effectiveRefEl.hidden = true;
  }
  checkVarref();
}

function setMode(mode, opts){
  issueMode = mode;
  Array.prototype.forEach.call(modeToggle.querySelectorAll('.mode-btn'), b => {
    b.classList.toggle('on', b.getAttribute('data-mode') === mode);
  });
  varrevField.hidden = mode !== 'revise';
  syncRefLock();
  updateModeHint();
  if(mode === 'new'){
    varrev.value = '';
    if(!(opts && opts.keepRef)){
      reopenedRef = '';
      reopenedFromLog = false;
      refOverridden = false;
      showReopened();
      allocateRef();
    }
  }
  updateEffectiveRef();
  render();
}

modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if(!btn) return;
  const mode = btn.getAttribute('data-mode');
  if(mode === issueMode) return;
  setMode(mode);
});

// Said right under the toggle, because that is where someone is looking when
// they press it. This used to refuse an empty log and report it beside the Save
// button a screen further down, which read as the button doing nothing at all.
function updateModeHint(){
  const hint = document.getElementById('mode-hint');
  if(issueMode === 'new'){
    hint.textContent = canAllocate()
      ? 'The next number in the sequence, taken from this project\u2019s log.'
      : 'Type the reference yourself \u2014 numbering needs the variation log connected and a project chosen.';
    return;
  }
  hint.textContent = logRows.length
    ? 'Open the variation you are revising from the list above, then give it a revision.'
    : 'Nothing is logged against this project yet, so there is nothing to open. Type the reference ' +
      'you are revising and give it a revision \u2014 which is how you carry a variation issued before ' +
      'this app into the log.';
}

varrefEdit.addEventListener('click', () => {
  if(els['varref'].readOnly){
    refOverridden = true;
    syncRefLock();
    els['varref'].focus();
    els['varref'].select();
  } else {
    refOverridden = false;      // back to automatic: take the next number again
    allocateRef();
  }
});

varrev.addEventListener('input', () => { updateEffectiveRef(); render(); });

function setLogStatus(text, cls){
  logStatus.textContent = text;
  logStatus.className = cls ? 'status-line ' + cls : 'status-line';
}

/* ---- reading -------------------------------------------------------- */

// A row the log cannot place is left out rather than shown under whichever
// project happens to be open. Said on the list's own line, not the status line
// beside Save: that one carries the result of saving, and overwriting it would
// swallow the confirmation a moment after it appeared.
function countLine(rows){
  const total = rows.length;
  const base = total
    ? total + (total === 1 ? ' variation' : ' variations') + ' logged'
    : 'Nothing logged against this project yet.';
  const stranded = rows.unattributable || 0;
  if(!stranded) return escapeHtml(base);
  return escapeHtml(base) + ' <span class="stranded">\u00b7 ' + stranded +
    (stranded === 1 ? ' entry is' : ' entries are') + ' not listed \u2014 ' +
    (stranded === 1 ? 'it has' : 'they have') + ' no ProjectId and no project in the saved form, ' +
    'so ' + (stranded === 1 ? 'it cannot' : 'they cannot') + ' be placed. Map ProjectId in the log ' +
    'write flow.</span>';
}

async function refreshLog(){
  logRows = [];
  logSelect.innerHTML = '<option value="">Select one to reopen\u2026</option>';
  logLoad.disabled = true;
  logCount.textContent = '';

  if(!canAllocate()){
    logHistory.hidden = true;
    syncRefLock();
    return;
  }

  const forProject = selectedProject.id;
  logCount.textContent = 'Reading the log\u2026';
  logHistory.hidden = false;
  try {
    const rows = await Flows.listLog(currentState.code, forProject);
    if(!selectedProject || selectedProject.id !== forProject) return;   // switched while in flight
    logRows = rows;
    if(!rows.length){
      logCount.innerHTML = countLine(rows);
      allocateRef();
      updateModeHint();
      return;
    }
    logSelect.innerHTML = '<option value="">Select one to reopen\u2026</option>' + rows.map(r =>
      '<option value="' + escapeHtml(r.variationRef) + '">' +
        escapeHtml(r.variationRef) + (r.description ? '  \u2014  ' + escapeHtml(r.description) : '') +
      '</option>').join('');
    logCount.innerHTML = countLine(rows);
    allocateRef();
    updateModeHint();
  } catch(err){
    if(err.unconfigured){ logHistory.hidden = true; return; }
    logCount.textContent = 'Could not read the log \u2014 ' + (err.message || 'the flow failed');
  }
}

logSelect.addEventListener('change', () => { logLoad.disabled = !logSelect.value; });

logLoad.addEventListener('click', () => openFromLog(logSelect.value));

async function openFromLog(ref){
  if(!ref) return;
  const summary = logRows.find(r => Flows.sameRef(r.variationRef, ref));

  if(currentHasContent() && !confirm(
      'Open ' + ref + '? Anything typed on this form and not saved to the log will be replaced.')) return;

  setLogStatus('Opening ' + ref + '\u2026');
  try {
    // The list row may carry the payload already; only fetch when it does not
    const full = (summary && summary.state_) ? summary
               : await Flows.getLog(currentState.code, selectedProject.id, ref);
    if(!full){ setLogStatus('No log entry found for ' + ref + '.', 'err'); return; }
    if(!full.state_){
      setLogStatus('Found ' + ref + ', but its saved form could not be read — the Payload column is ' +
                   'empty or not valid JSON. Nothing has been changed.', 'err');
      return;
    }
    // Parsed, but not a saved form. Restoring it would clear the boxes it does
    // not mention and look like the log losing the variation, so refuse and say
    // what is actually in the column.
    if(!full.state_.fields){
      setLogStatus('Found ' + ref + ', but its Payload column does not hold the form — it holds ' +
                   Object.keys(full.state_).slice(0, 6).join(', ') +
                   '. In the log write flow, map Payload to the payload FIELD of the request, not to ' +
                   'the Compose action of the same name. Nothing has been changed.', 'err');
      return;
    }
    // The log holds the form; the variation file holds the form AND the
    // attachments. Fetch the file when there is one and a flow to read it,
    // and fall back to the log's copy if that fails.
    let fromFile = null;
    if(full.state_.variationFile && Flows.has('openFileUrl') && typeof VariationFile !== 'undefined'){
      setLogStatus('Opening ' + ref + ' \u2014 fetching its variation file\u2026');
      try { fromFile = await VariationFile.fetch(full.state_.variationFile); }
      catch(e){ fromFile = null; }
    }
    applyFormState(fromFile ? fromFile.form : full.state_);
    if(fromFile) Stages.applyDocs(fromFile.documents);
    reopenedRef = full.variationRef;
    reopenedFromLog = true;
    // the form now holds a variation that exists, so the reference is its base
    // and anything further is a revision of it
    const parsed = parseRef(full.variationRef);
    els['varref'].value = parsed ? parsed.base : full.variationRef;
    setMode('revise', { keepRef: true });
    varrev.value = '';
    showReopened();
    setLogStatus('Opened ' + full.variationRef + (fromFile ? ' with its attachments' : ' from the log') +
                 '. Add a revision to issue it as a new entry, or save to update it.' +
                 (!fromFile && full.state_.variationFile ? ' Its attachments are in "' + full.state_.variationFile +
                   '" in the project folder' + (Flows.has('openFileUrl') ? ', which could not be fetched.' : '.') : ''), 'ok');
    updateEffectiveRef();
    render();
  } catch(err){
    setLogStatus('Could not open ' + ref + ' — ' + (err.message || 'the flow failed'), 'err');
  }
}

/* A variation file opened from this computer or from SharePoint. It carries
   the office and project it was made under, so those are put back first -- the
   letterhead, the register row, the log -- and then the form exactly as saved,
   then the attachments. Like reopening from the log, a numbered variation comes
   back as itself: saving updates it, a revision issues it anew. */
async function restoreVariation(file){
  const saved = file.form || {};
  const office = saved.office && StateRegister.get(saved.office);
  if(office && (!currentState || currentState.code !== office.code)){
    currentState = office;
    applyLetterhead(office);
    document.getElementById('chip-state').textContent = office.code;
    projectsLoading = loadProjects();
  }
  if(!currentState) throw new Error('The file does not say which office it is from, and none is open.');
  await projectsLoading;

  const project = saved.projectId !== undefined && saved.projectId !== ''
    ? projects.find(p => String(p.id) === String(saved.projectId)) : null;
  if(project){
    projectSelect.value = project.id;
    applyProject(project);
  }
  const ref = (saved.fields && saved.fields.varref) || '';
  // claimed before the log comes back, so the number is not reallocated over it
  reopenedRef = ref;
  applyFormState(saved);
  Stages.applyDocs(file.documents);
  if(ref){
    reopenedFromLog = false;
    const parsed = parseRef(ref);
    els['varref'].value = parsed ? parsed.base : ref;
    setMode('revise', { keepRef: true });
    // the form keeps the base; the revision travels in the file's summary
    varrev.value = (file.summary && file.summary.revision) || '';
    showReopened();
  }
  updateEffectiveRef();
  render();
  return { project: project, unmatchedProject: !project && !!saved.projectId };
}

function currentHasContent(){
  return ['variationdesc','siref','desc-raw','desc-final'].some(id => {
    const el = els[id] || document.getElementById(id);
    return el && el.value.trim();
  }) || collectDrawings().length > 0;
}

// The banner covers two situations that look the same to the code and read very
// differently to a person: a variation opened out of the log, and one just
// saved into it. Either way the form now belongs to an entry that saving will
// update, which is the thing worth saying.
let reopenedFromLog = false;

function showReopened(){
  if(!reopenedBar) return;
  reopenedBar.hidden = !reopenedRef;
  if(!reopenedRef) return;
  reopenedBar.querySelector('.reopened-text').innerHTML = reopenedFromLog
    ? 'Reopened <strong>' + escapeHtml(reopenedRef) + '</strong> from the log \u2014 saving updates that entry'
    : '<strong>' + escapeHtml(reopenedRef) + '</strong> is in the log \u2014 saving again updates it';
}

/* ---- the reference tells you whether it already exists --------------- */

function checkVarref(){
  const ref = effectiveRef();
  varrefStatus.textContent = '';
  varrefStatus.className = 'status-line';
  if(!ref || !logRows.length) return;

  const hit = logRows.find(r => Flows.sameRef(r.variationRef, ref));
  if(!hit) return;
  if(Flows.sameRef(reopenedRef, ref)) return;   // the banner already says this

  varrefStatus.className = 'status-line err';
  varrefStatus.textContent = ref + ' is already logged' +
    (hit.description ? ' (' + hit.description + ')' : '') +
    ' — saving would overwrite it. ' +
    (issueMode === 'revise' ? 'Use a different revision.' : 'Open it above instead, or Edit the reference.');
}

els['varref'].addEventListener('input', () => {
  if(!els['varref'].readOnly) refOverridden = true;
  updateEffectiveRef();
});

/* ---- writing --------------------------------------------------------- */

function buildLogPayload(extra){
  const saved = collectFormState();
  const v = id => (els[id] ? els[id].value.trim() : '');
  return Object.assign({
    // the two halves of the key; the flow matches on both
    projectId: selectedProject ? String(selectedProject.id) : '',
    variationRef: effectiveRef(),
    baseRef: v('varref'),
    revision: issueMode === 'revise' ? varrev.value.trim() : '',

    project: v('project'),
    state: currentState ? currentState.code : '',
    stateEntity: v('co-name'),
    variationDescription: v('variationdesc'),
    headContractor: v('recipient-name'),
    recipientAddress: v('recipient-address'),
    attention: v('attention'),
    issuedBy: v('sig-name'),
    position: v('sig-title'),
    siteInstructionRef: v('siref'),
    clauseRef: v('clauseref'),
    aconexRef: v('aconexref'),
    contractorDirection: v('contractordirection'),
    emailRef: v('emailref'),
    descriptionOfWorks: v('desc-final'),
    notes: document.getElementById('desc-raw').value.trim(),
    drawings: saved.drawings,
    drawingsText: saved.drawings
      .map(d => [d.number, d.name, d.oldRev && d.newRev ? d.oldRev + ' \u2192 ' + d.newRev : '']
      .filter(Boolean).join('  ')).join('\n'),
    folderPath: selectedProject ? (selectedProject.folderPath || '') : '',
    variationFile: variationFileName(),

    // the whole form, so reopening restores it exactly whatever the columns do
    payload: JSON.stringify(saved),
    updatedAt: new Date().toISOString()
  }, extra || {});
}

async function saveToLog(reason){
  let ref = effectiveRef();
  if(!Flows.has('logWriteUrl')){
    setLogStatus('This app has no variation log set up — tell whoever set it up.', 'err');
    return false;
  }
  if(!selectedProject){
    setLogStatus('Pick a project first — the log is keyed by project and reference.', 'err');
    return false;
  }
  if(!ref){
    setLogStatus('Give it a variation reference first — that is what the log is keyed on.', 'err');
    els['varref'].classList.add('field-invalid');
    els['varref'].focus();
    return false;
  }

  setLogStatus('Saving to the log\u2026');
  try {
    // Between allocating a number and saving it, someone else on the same
    // project may have taken it. Re-read the log and step past it rather than
    // overwrite their variation -- the number on screen changing is a far
    // smaller surprise than losing a colleague's work.
    if(issueMode === 'new' && !reopenedRef && !refOverridden && Flows.has('logReadUrl')){
      try {
        const fresh = await Flows.listLog(currentState.code, selectedProject.id);
        if(fresh.some(r => Flows.sameRef(r.variationRef, ref))){
          logRows = fresh;
          const bumped = nextRef(baseRefsInLog());
          els['varref'].value = bumped;
          updateEffectiveRef();
          render();
          ref = effectiveRef();
          setLogStatus(bumped + ' \u2014 the number you had was taken while you were working, so this ' +
                       'has moved up. Nothing of yours was lost.', 'err');
        }
      } catch(e){ /* the save itself is what matters; a failed re-check must not block it */ }
    }

    const wasReopened = Flows.sameRef(reopenedRef, ref) && reopenedFromLog;
    const result = await Flows.writeLog(buildLogPayload(reason || {}));
    reopenedRef = ref;
    reopenedFromLog = wasReopened;
    showReopened();
    setLogStatus(result.status === 'confirmed'
      ? 'Saved to the log as ' + ref + '.'
      : 'Sent to the log. The browser could not read the reply, so check the list to confirm ' +
        '(the Response action needs the CORS header).', 'ok');
    refreshLog().then(checkVarref);
    return true;
  } catch(err){
    setLogStatus('Not saved — ' + (err.message || 'the log flow failed') +
                 ' Your work is still on screen.', 'err');
    return false;
  }
}

logSaveBtn.addEventListener('click', () => saveToLog());

document.getElementById('reopened-new').addEventListener('click', () => {
  if(currentHasContent() && !confirm('Start a new variation? What is on the form now will be cleared.')) return;
  // keep the letterhead and the project, clear what belongs to one variation
  ['varref','variationdesc','siref','clauseref','aconexref','contractordirection','emailref',
   'desc-final'].forEach(id => { els[id].value = ''; });
  document.getElementById('desc-raw').value = '';
  dwgRowsContainer.innerHTML = '';
  addDwgRow();
  reopenedRef = '';
  refOverridden = false;
  setLogStatus('');
  varrefStatus.textContent = '';
  logSelect.value = '';
  logLoad.disabled = true;
  clearInvalid();
  setMode('new');
  renderDwgPreview();
  els['variationdesc'].focus();
});

/* ==========================================================================
   SETTINGS
   ========================================================================== */

const flowInputs = {
  projectsUrl: document.getElementById('flow-projects'),
  fileUrl: document.getElementById('flow-file'),
  logReadUrl: document.getElementById('flow-log-read'),
  logWriteUrl: document.getElementById('flow-log-write'),
  describeUrl: document.getElementById('flow-describe'),
  openFileUrl: document.getElementById('flow-open-file')
};
Object.values(flowInputs).forEach(el => { el.dataset.placeholder = el.placeholder; });
const flowsStatus = document.getElementById('flows-status');
const statesStatus = document.getElementById('states-status');
const stateEditorBody = document.getElementById('state-editor-body');

// Names for the flows as the Settings labels call them, so the notice names
// what someone is actually looking at.
const FLOW_LABELS = {
  projectsUrl: 'Get projects',
  fileUrl: 'File the PDF',
  logReadUrl: 'Variation log — read',
  logWriteUrl: 'Variation log — write',
  describeUrl: 'Write professionally',
  openFileUrl: 'Open a variation file'
};

/* A deployment can hold the trigger URLs server-side (netlify/functions/flow.js).
   Where it does, the box below is not what gets called, and saying so is the
   difference between "this is blank, is it broken?" and "that one is handled". */
/* The built-in URLs are read-only, which is the point — but a wrong one then
   has no way back except rebuilding from source. This is the way back, and it
   is behind the Settings password like everything else on this screen. It
   lasts until Settings is left. */
let urlsUnlocked = false;

/* Whether the real URLs are on screen at all. They are masked by default, so a
   shoulder, a screenshot or a shared screen does not give a trigger URL away.

   WHAT THIS IS. It hides them in the interface. It does not hide them from the
   page: they are in the deployed file, and anyone who can open the site can
   read them in view-source. Stopping that is the server's job, not this
   screen's — see docs/SIGN-IN.md. */
let urlsRevealed = false;

// Enough to tell which flow a URL belongs to and that something is set, with
// nothing anyone could use.
function maskUrl(url){
  const text = String(url || '');
  if(!text) return '';
  const sigAt = text.indexOf('sig=');
  const body = sigAt === -1 ? text : text.slice(0, sigAt + 4);
  const head = body.length > 58 ? body.slice(0, 34) + '…' + body.slice(-20) : body;
  const sigLength = sigAt === -1 ? 0 : text.length - sigAt - 4;
  return head + (sigLength ? '•'.repeat(Math.min(sigLength, 24)) + '  (hidden)' : '  (hidden)');
}

function describeProxy(){
  const note = document.getElementById('proxy-note');
  const served = Object.keys(flowInputs).filter(k => Flows.viaProxy(k));

  Object.keys(flowInputs).forEach(k => {
    const box = flowInputs[k];
    const field = box.closest('.field');
    const source = Flows.sourceOf(k);
    field.classList.toggle('field-served', source === 'site');
    field.classList.toggle('field-builtin', source === 'builtin');
    field.classList.toggle('field-masked', source === 'builtin' && !urlsRevealed);
    // Locked, both of them. A URL the site serves is not what gets called, and
    // one built into the app is the same for everybody — a stray keystroke in
    // either box is a flow that stops working for reasons nobody can see.
    box.readOnly = (source === 'site') || (source === 'builtin' && (!urlsRevealed || !urlsUnlocked));
    // An empty box reads as broken even when everything is working, so every
    // flow says where its URL comes from rather than leaving a blank one.
    if(source === 'site'){
      box.value = 'Called through this site — the URL is held in Netlify, not here.';
    }else if(source === 'builtin'){
      // Masked until an administrator asks for it. Once revealed, editing it
      // overrides it for this browser only.
      box.value = urlsRevealed ? Flows.builtIn(k) : maskUrl(Flows.builtIn(k));
      box.placeholder = box.dataset.placeholder || box.placeholder;
    }else{
      box.placeholder = box.dataset.placeholder || box.placeholder;
    }
  });

  const unlock = document.getElementById('flows-unlock');
  const reveal = document.getElementById('flows-reveal');
  const anyBuiltIn = Object.keys(flowInputs).some(k => Flows.sourceOf(k) === 'builtin');
  reveal.hidden = !anyBuiltIn;
  reveal.textContent = urlsRevealed ? 'Hide URLs' : 'Show URLs (admin)';
  // Nothing to unlock while they are still hidden: editing a row of dots would
  // only ever save a row of dots.
  unlock.hidden = !anyBuiltIn || !urlsRevealed;
  unlock.textContent = urlsUnlocked ? 'Lock again' : 'Unlock to change';

  if(!served.length){ note.hidden = true; return; }
  const missing = Object.keys(flowInputs).filter(k => !Flows.viaProxy(k));
  document.getElementById('proxy-note-detail').textContent =
    served.map(k => FLOW_LABELS[k]).join(', ')
    + (served.length === 1 ? ' is' : ' are') + ' called through this site, which keeps the '
    + 'trigger URLs off every browser. Nothing to paste for '
    + (served.length === 1 ? 'it' : 'those') + '.'
    + (missing.length ? ' Still pasted here: ' + missing.map(k => FLOW_LABELS[k]).join(', ') + '.' : '');
  note.hidden = false;
}

/* The administrator screen. Everything here is shared by everyone using the
   app, which is why it is one door further in than Settings. */
function loadSettingsForm(){
  const current = Flows.get();
  Object.keys(flowInputs).forEach(k => { flowInputs[k].value = current[k] || ''; });
  describeProxy();
  flowsStatus.textContent = '';
  flowsStatus.className = 'status-line';

  // Offer the mapping straight away when a project list is already loaded, so
  // someone sent here by the "none of its columns were recognised" message
  // finds the thing they were sent for rather than an empty panel.
  if(projects.length) renderColumnMap(projects.map(p => p.raw));
  else { colmapWrap.hidden = true; rawrowWrap.hidden = true; }
  colmapStatus.textContent = '';
  colmapStatus.className = 'status-line';
}

/* The ordinary Settings screen: the office letterhead, and nothing that could
   stop the app working for everybody else. */
function loadRegisterForm(){
  const rows = StateRegister.rows();
  stateEditorBody.innerHTML =
    '<tr><th>Code</th><th>Entity, ABN, ACN</th><th>Phone, email</th><th>Address</th></tr>' +
    rows.map((row, i) =>
      '<tr data-index="' + i + '" data-code="' + escapeHtml(row.code) + '">' +
        '<td class="code">' + escapeHtml(row.code) + '</td>' +
        '<td>' +
          '<input type="text" data-field="entity" placeholder="Registered company name" value="' + escapeHtml(row.entity || '') + '">' +
          '<input type="text" data-field="abn" placeholder="ABN" value="' + escapeHtml(row.abn || '') + '" style="margin-top:4px;">' +
          '<input type="text" data-field="acn" placeholder="ACN (optional)" value="' + escapeHtml(row.acn || '') + '" style="margin-top:4px;">' +
        '</td>' +
        '<td>' +
          '<input type="text" data-field="phone" placeholder="Phone" value="' + escapeHtml(row.phone || '') + '">' +
          '<input type="text" data-field="email" placeholder="Email" value="' + escapeHtml(row.email || '') + '" style="margin-top:4px;">' +
        '</td>' +
        '<td><textarea data-field="address" placeholder="Street&#10;Suburb STATE 0000" style="min-height:64px;">' + escapeHtml(row.address || '') + '</textarea></td>' +
      '</tr>'
    ).join('');
  statesStatus.textContent = StateRegister.hasOverrides()
    ? 'This browser is using saved edits rather than the shipped file.'
    : '';
  statesStatus.className = 'status-line';
}

function readStateEditor(){
  const base = StateRegister.rows();
  return Array.from(stateEditorBody.querySelectorAll('tr[data-code]')).map(tr => {
    const code = tr.getAttribute('data-code');
    const row = Object.assign({}, base.find(r => r.code === code) || { code: code });
    tr.querySelectorAll('[data-field]').forEach(input => {
      row[input.getAttribute('data-field')] = input.value.trim();
    });
    return row;
  });
}

/* ---------------------------------------------------------------------------
   Connect to the flows

   The site can hold the trigger URLs itself, which is the point of
   netlify/functions/flow.js — but the consequence is that the URL boxes stay
   empty, and an empty box looks exactly like a broken one. This asks the site
   what it can run, actually runs what it can, and says so flow by flow, so the
   answer to "is this working?" is on screen rather than inferred.
--------------------------------------------------------------------------- */
const connectStatus = document.getElementById('flows-connect-status');
const connectReport = document.getElementById('flows-connect-report');

function reportRow(name, mark, how, state){
  const li = document.createElement('li');
  li.className = state;
  li.innerHTML = '<span class="fr-name"></span><span class="fr-mark"></span><span class="fr-how"></span>';
  li.querySelector('.fr-name').textContent = name;
  li.querySelector('.fr-mark').textContent = mark;
  li.querySelector('.fr-how').textContent = how;
  return li;
}

// Proves a flow end to end where that is free of side effects. The two writing
// flows are not called: filing a PDF would leave a file in SharePoint and the
// log write would leave a row, and a connection test has no business doing
// either. For those, reaching the flow is as far as a test should go.
/* Which office to test against. Settings can be opened without picking one
   first, and an empty state is not a harmless default: it reaches the flow as
   State eq '' and builds a filter SharePoint rejects. Both tests use this. */
function testState(){
  return (currentState && currentState.code)
    || (StateRegister.rows().find(StateRegister.isConfigured) || {}).code
    || 'VIC';
}

/* A connection check must send what the app itself sends. Asking a flow to
   handle an input the app never produces is not a test of anything — it fails
   on perfectly good flows, and the failure looks exactly like a real one.

   This one cost real hours: the log-read test sent an empty state and an empty
   project, which built "State eq '' and ProjectId eq " and was rejected by
   SharePoint, while every genuine call the app made that day succeeded. So the
   log read is tested with a project that actually exists — the first one the
   projects flow just returned — and skipped honestly when there is none. */
async function tryFlow(key, found){
  if(key === 'projectsUrl'){
    const where = testState();
    const rows = await Flows.getProjects(where);
    found.state = where;
    found.projects = rows;
    return rows.length
      ? rows.length + (rows.length === 1 ? ' project' : ' projects') + ' came back for ' + where
      : 'reached it, but no ' + where + ' projects came back — check the State column in the list';
  }
  if(key === 'logReadUrl'){
    const project = (found.projects || [])[0];
    if(!project || project.id === undefined || project.id === ''){
      // Nothing to ask about. Saying so is better than inventing an empty
      // project id and calling whatever comes back a verdict on the flow.
      return 'configured — not called, because no project came back to ask about';
    }
    const rows = await Flows.listLog(found.state || testState(), project.id);
    // listLog hands back the narrowed array with the raw count hung off it.
    const got = (rows && rows.received !== undefined) ? rows.received : rows.length;
    return 'reached it for "' + project.project + '" — ' + got + ' row' + (got === 1 ? '' : 's') + ' in the log';
  }
  return '';
}

async function connectFlows(){
  const buttons = [document.getElementById('flows-connect'), document.getElementById('project-connect')]
    .filter(Boolean);
  buttons.forEach(b => { b.disabled = true; });
  connectReport.hidden = true;
  connectReport.innerHTML = '';
  connectStatus.textContent = 'Asking the site which flows it can run…';
  connectStatus.className = 'status-line';

  const proxy = await Flows.probeProxy();
  describeProxy();

  const rows = [];
  // What the projects test learned, so the log-read test can ask about a real
  // project rather than an imaginary one.
  const found = {};
  let worked = 0, failed = 0;

  for(const key of ['projectsUrl', 'fileUrl', 'logReadUrl', 'logWriteUrl', 'describeUrl', 'openFileUrl']){
    const name = FLOW_LABELS[key];
    const source = Flows.sourceOf(key);

    if(source === 'none'){
      rows.push(reportRow(name, '—', proxy.available
        ? 'not set on this site, not built in, nothing pasted here'
        : 'not built in, and nothing pasted here', 'off'));
      continue;
    }
    const how = source === 'site' ? 'through this site'
      : source === 'builtin' ? 'built into the app'
      : 'from the URL saved in this browser';
    try {
      const detail = await tryFlow(key, found);
      worked++;
      rows.push(reportRow(name, '\u2713', detail ? how + ' — ' + detail : how + ' — configured', 'ok'));
    } catch(err){
      failed++;
      rows.push(reportRow(name, '\u2717', how + ' — ' + (err.message || 'could not be reached'), 'bad'));
    }
  }

  rows.forEach(r => connectReport.appendChild(r));
  connectReport.hidden = false;

  /* What actually happened comes first. The function being absent only matters
     when nothing else is working — said any earlier it reads as the cause of a
     failure it had nothing to do with. */
  if(failed){
    connectStatus.textContent = worked + ' of ' + (worked + failed) + ' working. '
      + 'The ones marked \u2717 are configured but answered with an error — the message beside each says what.';
    connectStatus.className = 'status-line err';
  }else if(worked){
    connectStatus.textContent = 'Connected. ' + worked + ' flow' + (worked === 1 ? '' : 's') + ' working.';
    connectStatus.className = 'status-line ok';
  }else if(proxy.available){
    connectStatus.textContent = 'This site answered, but none of its five environment variables are set, '
      + 'nothing is built into the app, and nothing is pasted here.';
    connectStatus.className = 'status-line err';
  }else{
    connectStatus.textContent = 'Nothing is configured: this site holds no flow URLs, none are built into '
      + 'the app, and none are pasted here. Build them in below, or paste them above.';
    connectStatus.className = 'status-line err';
  }

  buttons.forEach(b => { b.disabled = false; });
  // Whatever changed, the dropdown should now reflect it.
  if(currentState) loadProjects();
  updateFilingNote();
}

/* ---- showing the real URLs ------------------------------------------------
   No second password here: this whole screen is already behind one, and asking
   again for something you have just proved is friction pretending to be
   security. The toggle is for shoulders and shared screens — it keeps the URLs
   off the display until you actually want to look at them. */
function setRevealed(on){
  urlsRevealed = on;
  if(!on) urlsUnlocked = false;
  loadSettingsForm();
}

document.getElementById('flows-reveal').addEventListener('click', () => {
  setRevealed(!urlsRevealed);
});

document.getElementById('flows-unlock').addEventListener('click', () => {
  if(!urlsUnlocked && !confirm(
      'These URLs are built into the app and are the same for everyone using it.\n\n' +
      'Changing one here only changes it in your browser. To change it for everybody, ' +
      'edit it and then use "Build the URLs in" below, and deploy what that gives you.\n\n' +
      'Unlock them?')) return;
  urlsUnlocked = !urlsUnlocked;
  loadSettingsForm();
});

document.getElementById('flows-connect').addEventListener('click', connectFlows);
document.getElementById('project-connect').addEventListener('click', async () => {
  const button = document.getElementById('project-connect');
  const was = button.textContent;
  button.textContent = 'Connecting…';
  await connectFlows();
  button.textContent = was;
  if(!Flows.has('projectsUrl')){
    projectStatus.textContent = 'Still not connected. Open Settings — Connect to the flows there says why.';
    projectStatus.className = 'status-line err';
  }
});

document.getElementById('flows-save').addEventListener('click', () => {
  const next = {};
  // A box the site serves holds an explanation, not a URL. Saving that would
  // store a sentence where a URL belongs and break the flow the day the site
  // stopped serving it.
  Object.keys(flowInputs).forEach(k => {
    if(Flows.viaProxy(k)) return;                     // the box holds an explanation
    if(Flows.sourceOf(k) === 'builtin' && !urlsRevealed) return;   // a mask, not a URL
    const typed = flowInputs[k].value.trim();
    // Saving a box that is only showing what the build already carries would
    // pin this browser to today's URL and quietly ignore the next deploy.
    next[k] = (typed && typed === Flows.builtIn(k)) ? '' : typed;
  });
  const ok = Flows.save(next);
  if(typeof VariationFile !== 'undefined') VariationFile.sync();
  flowsStatus.textContent = ok
    ? 'Saved to this browser.'
    : 'Could not save — this browser is blocking local storage, so the URLs will be forgotten when the tab closes.';
  flowsStatus.className = ok ? 'status-line ok' : 'status-line err';
  updateFilingNote();
});

/* ---- column mapping -------------------------------------------------------
   Populated from a real answer, so the choices are the column names the flow
   actually returns rather than a list of what it might have been called. */

const colmapWrap = document.getElementById('colmap-wrap');
const colmapBody = document.getElementById('colmap-body');
const colmapStatus = document.getElementById('colmap-status');
let colmapColumns = [];

const rawrowWrap = document.getElementById('rawrow-wrap');
const rawrowBody = document.getElementById('rawrow-body');

// The ground truth, before any matching. When the app and the flow disagree
// about what arrived, this is the thing to read.
function renderRawRow(columns){
  if(!columns.length){ rawrowWrap.hidden = true; return; }
  rawrowBody.innerHTML = '<tr><th>Column</th><th>Value in the first project</th></tr>' +
    columns.map(c =>
      '<tr><td class="code" style="white-space:normal;">' + escapeHtml(c.key) + '</td>' +
      '<td>' + (c.empty
        ? '<em style="color:#A0402E;">empty — the flow sent this column with nothing in it</em>'
        : escapeHtml(c.value)) + '</td></tr>'
    ).join('');
  rawrowWrap.hidden = false;
}

function renderColumnMap(sampleRows){
  colmapColumns = Flows.describeRows(sampleRows);
  renderRawRow(colmapColumns);
  if(!colmapColumns.length){ colmapWrap.hidden = true; return; }

  const saved = Flows.get().columnMap || {};
  colmapBody.innerHTML =
    '<tr><th>Fills this field</th><th>Column from your register</th></tr>' +
    Flows.MAPPABLE.map(m => {
      const auto = colmapColumns.find(c =>
        (Flows.ALIASES[m.field] || []).some(a => Flows.normKey(a) === Flows.normKey(c.key)));
      const chosen = saved[m.field] || '';
      const options = ['<option value="">' +
          (auto ? 'Matched by name: ' + escapeHtml(auto.key) : '\u2014 not matched \u2014') +
        '</option>'].concat(colmapColumns.map(c =>
          '<option value="' + escapeHtml(c.key) + '"' + (chosen === c.key ? ' selected' : '') + '>' +
            escapeHtml(c.key) + '  \u2014  ' + (c.empty ? '(empty)' : escapeHtml(c.value)) +
          '</option>'));
      return '<tr>' +
        '<td class="code" style="white-space:normal;">' + escapeHtml(m.label) + '</td>' +
        '<td><select data-field="' + m.field + '">' + options.join('') + '</select></td>' +
      '</tr>';
    }).join('');
  colmapWrap.hidden = false;
}

document.getElementById('colmap-save').addEventListener('click', () => {
  const map = {};
  colmapBody.querySelectorAll('select[data-field]').forEach(sel => {
    if(sel.value) map[sel.getAttribute('data-field')] = sel.value;
  });
  const ok = Flows.save({ columnMap: map });
  colmapStatus.textContent = ok
    ? 'Saved. Go back, refresh the project list and pick the project again.'
    : 'Could not save — this browser is blocking local storage.';
  colmapStatus.className = ok ? 'status-line ok' : 'status-line err';
});

document.getElementById('colmap-clear').addEventListener('click', () => {
  Flows.save({ columnMap: {} });
  renderColumnMap(projects.length ? projects.map(p => p.raw) : []);
  colmapStatus.textContent = 'Cleared — back to matching on column names alone.';
  colmapStatus.className = 'status-line';
});

document.getElementById('flows-test').addEventListener('click', async () => {
  const servedBySite = Flows.viaProxy('projectsUrl');
  const url = servedBySite ? '' : flowInputs.projectsUrl.value.trim();
  if(!servedBySite && !url){
    flowsStatus.textContent = 'Paste the projects flow URL first, or use Connect to the flows if this site holds it.';
    flowsStatus.className = 'status-line err';
    return;
  }
  if(!servedBySite){
    Flows.save({ projectsUrl: url, fileUrl: flowInputs.fileUrl.value, describeUrl: flowInputs.describeUrl.value });
  }
  const where = testState();
  flowsStatus.textContent = 'Asking the flow for ' + where + ' projects…';
  flowsStatus.className = 'status-line';
  try {
    const rows = await Flows.getProjects(where);
    flowsStatus.textContent = 'Connected. ' + rows.length + ' ' + where +
      (rows.length === 1 ? ' project' : ' projects') + ' came back' +
      (rows.length ? ', first is "' + rows[0].project + '".' : '. Check the State column in the SharePoint list.');
    flowsStatus.className = 'status-line ok';
    if(rows.length) renderColumnMap(rows.map(r => r.raw));
  } catch(err){
    flowsStatus.textContent = err.message || 'The flow could not be reached.';
    flowsStatus.className = 'status-line err';
  }
});

document.getElementById('states-save').addEventListener('click', () => {
  const ok = StateRegister.save(readStateEditor());
  statesStatus.textContent = ok
    ? 'Saved to this browser. Use Export to hand the same values to everyone else.'
    : 'Could not save — this browser is blocking local storage.';
  statesStatus.className = ok ? 'status-line ok' : 'status-line err';
  renderStatePicker();
});

document.getElementById('states-export').addEventListener('click', () => {
  StateRegister.save(readStateEditor());
  const blob = new Blob([StateRegister.toFileSource()], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'state-register-rows.js';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  statesStatus.textContent = 'Downloaded. Paste it over the STATE_REGISTER block in assets/state-register.js, then deploy the folder again.';
  statesStatus.className = 'status-line ok';
});

document.getElementById('states-reset').addEventListener('click', () => {
  if(!confirm('Discard this browser’s edits and go back to the values in assets/state-register.js?')) return;
  StateRegister.clear();
  loadRegisterForm();
  renderStatePicker();
  statesStatus.textContent = 'Back to the shipped values.';
  statesStatus.className = 'status-line';
});

/* ==========================================================================
   ROUTING
   ========================================================================== */

const stepper = document.getElementById('stepper');
const stageViews = ['view-scope', 'view-rates', 'view-docs', 'view-review'].map(id => document.getElementById(id));

function showOnly(view){
  [viewPicker, viewEditor, viewSettings, viewAdmin].concat(stageViews).forEach(v => { v.hidden = v !== view; });
  stepper.hidden = !(view === viewEditor || stageViews.indexOf(view) !== -1);
  window.scrollTo(0, 0);
}

function showPicker(){
  currentState = null;
  renderStatePicker();
  showOnly(viewPicker);
}

/* ---------------------------------------------------------------------------
   Building the flow URLs into the app

   The URLs have to live somewhere the browser can read, and on a static site
   that means inside what gets deployed. This takes the five boxes in section A
   and hands back a copy of the app carrying them, in whichever shape this
   deployment uses — the same job the password button does, and for the same
   reason: there is no build step here to do it for us.
--------------------------------------------------------------------------- */
const urlsStatus = document.getElementById('urls-status');
const urlsNext = document.getElementById('urls-next');
const urlsSteps = document.getElementById('urls-next-steps');

function describeBuiltIn(){
  const built = Object.keys(flowInputs).filter(k => !!Flows.builtIn(k));
  document.getElementById('urls-current').textContent = built.length
    ? built.length + ' of 5 URLs ' + (built.length === 1 ? 'is' : 'are') + ' built into this copy of the app: '
      + built.map(k => FLOW_LABELS[k]).join(', ') + '. Everyone opening this site uses them.'
    : 'No URLs are built into this copy — everyone has to paste their own, or the site has to serve them.';
}

function showUrlSteps(forPage){
  urlsSteps.innerHTML = '';
  const steps = forPage
    ? ['The download is a complete copy of this site with the URLs in it, named <code>index.html</code>.',
       'Netlify → your site → <strong>Deploys</strong> → drag that <code>index.html</code> onto the drop zone.',
       'If you deploy a folder, put the file in the folder first, keeping <code>netlify/</code> beside it.']
    : ['Open the <code>assets</code> folder of the folder you drag onto Netlify.',
       'Move the downloaded <code>flow-config.js</code> in there, replacing the one already present.',
       'Netlify → your site → <strong>Deploys</strong> → drag the whole folder onto the drop zone.'];
  steps.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = s;
    urlsSteps.appendChild(li);
  });
  urlsNext.hidden = false;
}

// What is on screen in section A, which is what gets built in. A box the site
// serves holds an explanation rather than a URL, so its built-in value is kept
// instead of that sentence.
function urlsFromForm(){
  const out = {};
  Object.keys(flowInputs).forEach(k => {
    // A box showing a mask, or an explanation, holds no URL. Keep what is
    // already built in rather than baking the dots into the next build.
    const masked = Flows.sourceOf(k) === 'builtin' && !urlsRevealed;
    out[k] = (Flows.viaProxy(k) || masked) ? Flows.builtIn(k) : flowInputs[k].value;
  });
  return out;
}

async function buildUrlsIn(urls){
  let source;
  try{
    source = FlowUrls.fileSource(urls);        // validates every one of them
  }catch(e){
    urlsStatus.textContent = e.message;
    urlsStatus.className = 'status-line err';
    return false;
  }
  try{
    if(isBundledPage()){
      await rewriteDeployedPage(URLS_DECLARATION, declarationOnly(source, 'const FLOW_URLS'), 'flow URL');
      showUrlSteps(true);
    }else{
      download(source, 'flow-config.js', 'text/javascript');
      showUrlSteps(false);
    }
  }catch(e){
    urlsStatus.textContent = e.message;
    urlsStatus.className = 'status-line err';
    return false;
  }
  return true;
}

document.getElementById('urls-build').addEventListener('click', async () => {
  urlsNext.hidden = true;
  const urls = urlsFromForm();
  const count = FlowUrls.KEYS.filter(k => String(urls[k] || '').trim()).length;
  if(!count){
    urlsStatus.textContent = 'All five boxes in section A are empty — there is nothing to build in. '
      + 'Paste the URLs up there first.';
    urlsStatus.className = 'status-line err';
    return;
  }
  urlsStatus.textContent = 'Building…';
  urlsStatus.className = 'status-line';
  if(await buildUrlsIn(urls)){
    urlsStatus.textContent = 'Downloaded, with ' + count + ' URL' + (count === 1 ? '' : 's')
      + ' built in. Nothing has changed until you deploy it.';
    urlsStatus.className = 'status-line ok';
  }
});

document.getElementById('urls-strip').addEventListener('click', async () => {
  if(!confirm('Build a copy with no URLs in it? Once deployed, everyone has to paste their own again.')) return;
  urlsNext.hidden = true;
  const blank = {};
  FlowUrls.KEYS.forEach(k => { blank[k] = ''; });
  if(await buildUrlsIn(blank)){
    urlsStatus.textContent = 'Downloaded with no URLs in it. Nothing has changed until you deploy it.';
    urlsStatus.className = 'status-line ok';
  }
});

/* ---------------------------------------------------------------------------
   Settings password gate

   Settings holds the flow URLs and the office register, so it is not something
   a site visitor or a colleague should wander into. The check lives in
   assets/settings-lock.js; with no password set there it passes straight
   through and Settings behaves exactly as it always did.

   The unlock is remembered for the browser session only — closing the tab locks
   it again — and is keyed to the hash itself, so changing the password shuts out
   anyone who was already inside.
--------------------------------------------------------------------------- */
const UNLOCK_KEY = 'vcs-settings-unlocked';
const adminGate = document.getElementById('admin-gate');
const adminBody = document.getElementById('admin-body');
const gatePassword = document.getElementById('admin-password');
const gateStatus = document.getElementById('admin-gate-status');

function adminUnlocked(){
  if(!SettingsLock.isLocked()) return true;
  try{
    return sessionStorage.getItem(UNLOCK_KEY) === SettingsLock.fingerprint();
  }catch(e){
    // Private browsing can refuse sessionStorage. Then the password is asked
    // for every time, which is inconvenient but never wrong.
    return false;
  }
}

function markUnlocked(){
  try{ sessionStorage.setItem(UNLOCK_KEY, SettingsLock.fingerprint()); }catch(e){}
}

/* Settings is the ordinary screen: the office letterhead and nothing else.
   Everything that decides how the app talks to Power Automate lives one door
   further in, because it is shared by everyone using the app and nobody but the
   administrator should be able to change it. */
/* The one line that answers "is the right build deployed, and does it carry
   the flows?" — readable by anyone, in a private window, with no password and
   without naming a single URL. Guessing from whether a dropdown happens to
   fill is how an hour disappears. */
function describeBuild(){
  const el = document.getElementById('build-stamp');
  const info = (typeof BUILD_INFO !== 'undefined' && BUILD_INFO) ? BUILD_INFO : null;
  const built = info && info.builtAt ? info.builtAt : '';
  const names = (info && info.flowNames) || [];
  const total = 5;

  if(names.length === total){
    el.className = 'build-stamp good';
    el.innerHTML = '<strong>All ' + total + ' Power Automate flows are built into this copy.</strong> '
      + 'Nobody has to paste anything — everyone opening this site uses the same flows.'
      + (built ? ' <span style="opacity:.75">Built ' + escapeHtml(built) + '.</span>' : '');
    return;
  }
  el.className = 'build-stamp bad';
  el.innerHTML = '<strong>' + names.length + ' of ' + total + ' flows are built into this copy.</strong> '
    + (names.length ? 'Present: ' + escapeHtml(names.join(', ')) + '. ' : '')
    + 'Whoever deployed this needs to build the missing ones in and deploy again — '
    + 'they cannot be added from here.'
    + (built ? ' <span style="opacity:.75">Built ' + escapeHtml(built) + '.</span>' : '');
}

function showSettings(){
  loadRegisterForm();
  describeBuild();
  showOnly(viewSettings);
}

function showAdmin(){
  const open = adminUnlocked();
  adminGate.hidden = open;
  adminBody.hidden = !open;
  if(open){
    loadSettingsForm();
    describePasswordState();
    describeBuiltIn();
  }else{
    // Never leave a typed password sitting in the field behind a Back.
    gatePassword.value = '';
    gateStatus.textContent = '';
    gateStatus.className = 'status-line';
  }
  showOnly(viewAdmin);
  if(!open) gatePassword.focus();
}

/* ---------------------------------------------------------------------------
   Setting the password from inside Settings

   The password has to end up in a file, because the app is static — there is no
   server to remember it. So this makes the file and tells them where to put it.
   The same thing tools/set-settings-password.js does, for anyone without Node,
   which on a drag-and-drop deploy is everyone.
--------------------------------------------------------------------------- */
const pwNew = document.getElementById('pw-new');
const pwConfirm = document.getElementById('pw-confirm');
const pwStatus = document.getElementById('pw-status');
const pwNextPage = document.getElementById('pw-next-page');
const pwNextFolder = document.getElementById('pw-next-folder');

/* Two shapes get deployed and they need different things replaced.
   The folder keeps its scripts in assets/, so one small file changes. The
   single bundled file has everything inside it, and what gets dragged onto
   Netlify is that one file — so the whole page has to be reissued. */
function isBundledPage(){
  return !document.querySelector('script[src]');
}

function describePasswordState(){
  document.getElementById('pw-current').textContent = SettingsLock.isLocked()
    ? 'A password is set on this deployment. Anyone opening Settings has to type it.'
    : 'No password is set — Settings is open to anyone who finds the site.';
  document.getElementById('pw-how').textContent = isBundledPage()
    ? 'This site is deployed as one file. Setting a password means replacing that file, so what '
      + 'downloads below is a complete copy of the site with the new password already in it. The '
      + 'password itself is never in it — only a hash, which cannot be read back out.'
    : 'This site is deployed as a folder. Setting a password means replacing one small file in it, '
      + 'assets/settings-password.js. The password itself is never in that file — only a hash, '
      + 'which cannot be read back out.';
}

function download(text, name, type){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* Only the real declarations, which the generated files hold and nothing else
   writes. Each fileSource() builds the same text out of quoted fragments, so the
   copies of these words living inside them cannot match these. */
const LOCK_DECLARATION =
  /const SETTINGS_LOCK = \{\s*salt: '[0-9a-f]*',\s*hash: '[0-9a-f]*',\s*iterations: \d+,?\s*\};/g;
const URLS_DECLARATION =
  /const FLOW_URLS = \{\s*projectsUrl: '[^']*',\s*fileUrl: '[^']*',\s*logReadUrl: '[^']*',\s*logWriteUrl: '[^']*',\s*describeUrl: '[^']*'(?:,\s*openFileUrl: '[^']*')?,?\s*\};/g;

// The declaration on its own, without the comment header the file also carries.
function declarationOnly(source, keyword){
  return source.slice(source.indexOf(keyword)).trim();
}

/* Reissue the whole page with something different built into it. The page is
   fetched rather than read out of the DOM: the DOM has been changed by
   everything that has happened since load, and serialising it would bake in
   whatever is on screen — including, on this screen, the flow URLs. */
async function rewriteDeployedPage(pattern, replacement, what){
  let html;
  try{
    const res = await fetch(location.href, { cache: 'no-store' });
    if(!res.ok) throw new Error('the server answered ' + res.status);
    html = await res.text();
  }catch(e){
    throw new Error('Could not read this page back to copy it (' + e.message + '). '
      + 'Opening the file straight off the disk stops that; try it on the website instead.');
  }
  const found = html.match(pattern);
  if(!found || found.length !== 1){
    throw new Error('This page does not look like one this button can rewrite — found '
      + (found ? found.length : 0) + ' ' + what + ' blocks in it, expected exactly one.');
  }
  // A function replacement, not a string: a URL can contain $& and friends,
  // which String.replace would otherwise treat as instructions.
  download(html.replace(pattern, () => replacement), 'index.html', 'text/html');
}

async function offerReplacementPage(salt, hash, iterations){
  await rewriteDeployedPage(
    LOCK_DECLARATION,
    declarationOnly(SettingsLock.fileSource(salt, hash, iterations), 'const SETTINGS_LOCK'),
    'password');
}

function offerLockFile(salt, hash, iterations){
  download(SettingsLock.fileSource(salt, hash, iterations), 'settings-password.js', 'text/javascript');
}

// Whichever this deployment needs. Resolves to the note to show next.
async function offerPasswordChange(salt, hash, iterations){
  if(isBundledPage()){
    await offerReplacementPage(salt, hash, iterations);
    return pwNextPage;
  }
  offerLockFile(salt, hash, iterations);
  return pwNextFolder;
}

function hidePasswordNotes(){
  pwNextPage.hidden = true;
  pwNextFolder.hidden = true;
}

document.getElementById('pw-make').addEventListener('click', () => {
  const entered = pwNew.value;
  const again = pwConfirm.value;
  hidePasswordNotes();
  if(entered.length < 8){
    pwStatus.textContent = 'Use at least 8 characters. The hash ships inside the page, so a short password can be guessed at offline — a few words you will remember beats a mangled one you will not.';
    pwStatus.className = 'status-line err';
    return;
  }
  if(entered !== again){
    pwStatus.textContent = 'The two do not match.';
    pwStatus.className = 'status-line err';
    return;
  }
  pwStatus.textContent = 'Working…';
  pwStatus.className = 'status-line';
  // Same half-second of hashing the lock screen does, so give it a frame first.
  requestAnimationFrame(() => setTimeout(async () => {
    const salt = SettingsLock.makeSalt();
    const iterations = SettingsLock.DEFAULT_ITERATIONS;
    let note;
    try{
      note = await offerPasswordChange(salt, SettingsLock.derive(entered, salt, iterations), iterations);
    }catch(e){
      pwStatus.textContent = e.message;
      pwStatus.className = 'status-line err';
      return;
    }
    pwNew.value = '';
    pwConfirm.value = '';
    pwStatus.textContent = (note === pwNextPage ? 'index.html' : 'settings-password.js')
      + ' downloaded. It is not in use yet.';
    pwStatus.className = 'status-line ok';
    note.hidden = false;
  }, 0));
});

document.getElementById('pw-remove').addEventListener('click', async () => {
  if(!confirm('Take the password off? Once you deploy what this downloads, anyone who finds the site can open Settings.')) return;
  hidePasswordNotes();
  let note;
  try{
    note = await offerPasswordChange('', '', SettingsLock.DEFAULT_ITERATIONS);
  }catch(e){
    pwStatus.textContent = e.message;
    pwStatus.className = 'status-line err';
    return;
  }
  pwStatus.textContent = 'Downloaded with no password in it. It is not in use until you deploy it.';
  pwStatus.className = 'status-line ok';
  note.hidden = false;
});

document.getElementById('admin-gate-form').addEventListener('submit', e => {
  e.preventDefault();
  const entered = gatePassword.value;
  if(!entered){
    gateStatus.textContent = 'Enter the password.';
    gateStatus.className = 'status-line err';
    return;
  }
  const button = document.getElementById('admin-unlock');
  gateStatus.textContent = 'Checking…';
  gateStatus.className = 'status-line';
  button.disabled = true;
  // Deliberately slow to verify — about half a second of hashing — so the
  // browser has to be given a frame to paint "Checking…" before it blocks.
  requestAnimationFrame(() => setTimeout(() => {
    const ok = SettingsLock.verify(entered);
    button.disabled = false;
    if(!ok){
      gatePassword.value = '';
      gatePassword.focus();
      gateStatus.textContent = 'That password is not right.';
      gateStatus.className = 'status-line err';
      return;
    }
    gatePassword.value = '';
    markUnlocked();
    showAdmin();
  }, 0));
});

function openState(code, stage){
  const row = StateRegister.get(code);
  if(!row){ location.hash = ''; return; }
  const switching = !currentState || currentState.code !== row.code;
  currentState = row;
  // Only on a real change of state. Coming back from Settings must not wipe a
  // phone number someone deliberately typed over for this one letter.
  if(switching){
    applyLetterhead(row);
    projectsLoading = loadProjects();
  }
  document.getElementById('chip-state').textContent = row.code;
  // Without a projects flow no project is ever selected, so nothing else calls
  // this and the field would sit locked with nothing able to fill it.
  syncRefLock();
  Stages.show(stage || 'cover');
}

function routeFromHash(){
  const hash = location.hash;
  if(hash === '#/settings/admin'){ showAdmin(); return; }
  if(hash === '#/settings'){ showSettings(); return; }
  const match = /^#\/state\/([^/]+)(?:\/([a-z]+))?$/.exec(hash);
  if(match){ openState(decodeURIComponent(match[1]), match[2]); return; }
  showPicker();
}

window.addEventListener('hashchange', routeFromHash);

document.getElementById('picker-settings-btn').addEventListener('click', () => { location.hash = '#/settings'; });
document.getElementById('back-to-picker').addEventListener('click', () => { location.hash = ''; });
document.getElementById('chip-change').addEventListener('click', () => { location.hash = ''; });
document.getElementById('open-admin').addEventListener('click', () => {
  location.hash = '#/settings/admin';
});

document.getElementById('admin-back').addEventListener('click', () => {
  urlsUnlocked = false;
  urlsRevealed = false;
  location.hash = '#/settings';
});

document.getElementById('settings-back').addEventListener('click', () => {
  urlsUnlocked = false;
  urlsRevealed = false;
  location.hash = currentState ? '#/state/' + encodeURIComponent(currentState.code) : '';
});

/* ---------------------------------------------------------------------------
   Boot
--------------------------------------------------------------------------- */
document.getElementById('banner-logo').innerHTML =
  '<img src="' + BANNER_LOGO + '" alt="Axis Services Group">';
applyLogo(uploadedLogo || DEFAULT_LOGO);
syncRefLock();
updateModeHint();
render();

// Ask the site whether it holds the flow URLs for us before drawing a screen
// that depends on the answer — picking a state fires the projects flow, and it
// has to know by then which way to call it. probeProxy resolves either way and
// gives up after a moment, so this cannot leave the app unstarted.
// The stages (stages.js) load after this file, and a probe that answers at once
// would otherwise route before they exist -- so wait for every script too.
function whenLoaded(fn){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}
Flows.probeProxy().then(() => whenLoaded(start), () => whenLoaded(start));

function start(){
  if(typeof VariationFile !== 'undefined') VariationFile.sync();
  routeFromHash();
  syncPrefilled();
}
