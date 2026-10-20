/* ============================================================================
   THE VARIATION FILE — the whole variation, in one JSON file
   ============================================================================
   Everything on all five stages: the cover sheet's fields and letterhead, the
   inclusions and exclusions, every schedule of rates tab, and the attachments
   themselves. Saved beside the PDF in the project's SharePoint folder (through
   the same filing flow) and/or downloaded, and opened again from either.

   The variation log already restores the form. What only this file can bring
   back is the attachments, which a SharePoint list has nowhere to keep.

   Shape:
     { app, kind: 'variation', version, savedAt,
       summary:   { office, projectId, project, variationRef, revision, ... },
       form:      what collectFormState() returns -- the same as the log holds,
       documents: [{ bucket, kind, name, caption, base64 | dataUrl | email }] }
============================================================================ */

const VariationFile = (function(){

  const VERSION = 1;
  const PREF_KEY = 'variationCoverSheet:saveFileWithPdf';
  const reviewStatus = document.getElementById('vf-status');
  const withPdfBox = document.getElementById('vf-with-pdf');

  try { withPdfBox.checked = localStorage.getItem(PREF_KEY) !== 'no'; } catch(e){ withPdfBox.checked = true; }
  withPdfBox.addEventListener('change', () => {
    try { localStorage.setItem(PREF_KEY, withPdfBox.checked ? 'yes' : 'no'); } catch(e){}
  });

  function say(el, text, cls){
    if(!el) return;
    el.textContent = text;
    el.className = 'status-line' + (cls ? ' ' + cls : '');
  }

  function build(){
    const form = collectFormState();
    return {
      app: 'variation-cover-sheet',
      kind: 'variation',
      version: VERSION,
      savedAt: new Date().toISOString(),
      summary: {
        office: form.office,
        projectId: form.projectId,
        project: els['project'].value.trim(),
        variationRef: effectiveRef(),
        revision: issueMode === 'revise' ? varrev.value.trim() : '',
        description: els['variationdesc'].value.trim(),
        valueExGst: form.stages ? form.stages.valueExGst : 0
      },
      form: form,
      documents: Stages.collectDocs()
    };
  }

  function text(){ return JSON.stringify(build(), null, 1); }

  function download(){
    const name = variationFileName();
    const blob = new Blob([text()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    say(reviewStatus, 'Downloaded "' + name + '" (' + Math.max(1, Math.round(blob.size / 1024)) + ' KB).', 'ok');
  }

  // Through the filing flow, into the project's folder beside the PDF.
  async function saveToSharePoint(){
    if(!Flows.has('fileUrl')){
      say(reviewStatus, 'Not saved to SharePoint — this app has no filing flow set up. Download the file instead.', 'err');
      return false;
    }
    if(!selectedProject){
      say(reviewStatus, 'Pick a project on the cover sheet first — the file goes into that project\'s folder.', 'err');
      return false;
    }
    const name = variationFileName();
    say(reviewStatus, 'Saving "' + name + '" to SharePoint…');
    try {
      const body = new TextEncoder().encode(text());
      const result = await Flows.fileVariation(buildFilingPayload(bytesToBase64(body), name, 'variation-file'));
      const where = result.status === 'confirmed' && result.response && (result.response.path || result.response.webUrl);
      say(reviewStatus, result.status === 'confirmed'
        ? 'Variation file saved to SharePoint' + (where ? ': ' + where : '') + '.'
        : 'Variation file sent to the filing flow — check the project folder to confirm it landed.', 'ok');
      return true;
    } catch(err){
      say(reviewStatus, 'The variation file was NOT saved to SharePoint — ' + (err.message || 'the filing flow failed') +
        ' Download it instead, so nothing is lost.', 'err');
      return false;
    }
  }

  function parse(raw){
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch(e){ throw new Error('That file is not a variation file — it is not valid JSON.'); }
    data = Flows.unwrapFile(data, 0) || data;
    if(!data || data.kind !== 'variation' || !data.form || !data.form.fields){
      throw new Error('That file is JSON, but not a variation file saved by this app.');
    }
    return data;
  }

  // the project's folder, asked for by name
  async function fetch(fileName){
    const project = selectedProject;
    return parse(await Flows.openVariationFile({
      action: 'open',
      state: currentState ? currentState.code : '',
      projectId: project ? String(project.id) : '',
      folderPath: project ? (project.folderPath || '') : '',
      sitePath: project ? (project.sitePath || '') : '',
      siteUrl: project ? (project.siteUrl || '') : '',
      fileName: fileName
    }));
  }

  async function open(data, statusEl){
    if(currentHasContent() && !confirm('Open this variation file? Anything on the form now and not saved will be replaced.')) return;
    say(statusEl, 'Opening…');
    const result = await restoreVariation(data);
    const s = data.summary || {};
    const docsCount = (data.documents || []).length;
    Stages.go('cover');
    say(coverOpenStatus, 'Opened ' + (s.variationRef || 'the variation') + (s.description ? ' — ' + s.description : '') +
      ', saved ' + new Date(data.savedAt).toLocaleString('en-AU') + '. ' +
      (docsCount ? docsCount + ' attachment' + (docsCount === 1 ? '' : 's') + ' restored. ' : '') +
      (result.unmatchedProject ? 'Its project (' + (s.project || s.projectId) + ') is not in the register any more — pick one before filing.' : ''),
      result.unmatchedProject ? 'err' : 'ok');
  }

  // ---- from this computer ----------------------------------------------------
  const picker = document.getElementById('vf-file');
  let pickerStatus = null;
  function chooseFile(statusEl){
    pickerStatus = statusEl;
    picker.value = '';
    picker.click();
  }
  picker.addEventListener('change', async () => {
    const file = picker.files && picker.files[0];
    if(!file) return;
    try {
      const data = parse(await file.text());
      await open(data, pickerStatus);
    } catch(err){
      console.error(err);
      say(pickerStatus, err.message || 'That file could not be opened.', 'err');
    }
  });

  // ---- from SharePoint, by name ---------------------------------------------
  const coverOpenStatus = document.getElementById('vf-open-status');
  async function openFromSharePoint(){
    if(!selectedProject){ say(coverOpenStatus, 'Pick the project first — the file is looked for in its folder.', 'err'); return; }
    const suggested = variationFileName();
    const name = prompt('The variation file\'s name in the project folder:', suggested);
    if(!name) return;
    say(coverOpenStatus, 'Fetching "' + name + '" from SharePoint…');
    try {
      await open(await fetch(name.trim()), coverOpenStatus);
    } catch(err){
      say(coverOpenStatus, 'Could not open it — ' + (err.message || 'the flow failed'), 'err');
    }
  }

  document.getElementById('vf-save').addEventListener('click', saveToSharePoint);
  document.getElementById('vf-download').addEventListener('click', download);
  document.getElementById('vf-open-disk').addEventListener('click', () => chooseFile(coverOpenStatus));
  document.getElementById('vf-open-sp').addEventListener('click', openFromSharePoint);
  document.getElementById('picker-open-file').addEventListener('click', () => chooseFile(document.getElementById('picker-status')));

  // the SharePoint button only means something with the flow to back it
  function sync(){
    document.getElementById('vf-open-sp').hidden = !Flows.has('openFileUrl');
  }
  sync();

  return { build: build, download: download, saveToSharePoint: saveToSharePoint, fetch: fetch, parse: parse,
           open: open, sync: sync, withPdf: () => withPdfBox.checked && Flows.has('fileUrl') };
})();
