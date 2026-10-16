/* ============================================================================
   POWER AUTOMATE TRANSPORT
   ============================================================================

   Three flows sit behind this app, all optional, all "When an HTTP request is
   received" triggers:

     projects   POST {state}                   -> the project register rows for
                                                  that state, from SharePoint
     file       POST {fileName, pdfBase64, …}  -> writes the PDF into the
                                                  project's SharePoint folder
     describe   POST {notes, project, …}       -> tidies the rough notes into a
                                                  formal description (optional)

   The URLs are not committed. A Power Automate trigger URL ends in a `sig=`
   parameter which is the only credential the flow has — anyone holding the URL
   can run the flow — so they are pasted into Settings and kept in this
   browser's local storage. See docs/POWER-AUTOMATE-SETUP.md.

   ---------------------------------------------------------------------------
   A word on CORS, because it decides how these calls are shaped.

   Power Automate replies from logic.azure.com, so every call here is
   cross-origin, and two separate things have to go right.

   First, the request has to arrive. A POST carrying Content-Type
   application/json makes the browser send a preflight OPTIONS first, and an
   HTTP-request trigger restricted to POST answers that with a 405 the browser
   treats as a refusal — the flow never sees the real request. So every body
   below goes out as text/plain, which is a "simple" content type the browser
   sends without a preflight. The body is still JSON; the flow just has to
   parse it with json(triggerBody()) instead of reading the trigger's parsed
   output. The setup guide spells that out.

   Second, the reply has to be readable, and only the flow can permit that, by
   returning an Access-Control-Allow-Origin header from its Response action.
   `projects` cannot work without it.

   `file` is the exception: nothing in the app needs its reply, only SharePoint
   does. So when the reply is refused, it is sent again in no-cors mode, which
   the browser delivers but will not let us read. The upload still lands; we
   just cannot confirm it, and the app says exactly that rather than claiming a
   success it has not seen.
--------------------------------------------------------------------------- */

const FLOW_SETTINGS_KEY = 'variationCoverSheet:flows';

const Flows = (() => {
  const KEYS = ['projectsUrl', 'fileUrl', 'describeUrl', 'logReadUrl', 'logWriteUrl'];
  const MAP_KEY = 'columnMap';   // saved alongside the URLs, same shape rules
  let settings = load();

  function load(){
    const blank = { projectsUrl: '', fileUrl: '', describeUrl: '',
                    logReadUrl: '', logWriteUrl: '', columnMap: {} };
    try {
      const raw = localStorage.getItem(FLOW_SETTINGS_KEY);
      if(!raw) return blank;
      const parsed = JSON.parse(raw);
      KEYS.forEach(k => { if(typeof parsed[k] === 'string') blank[k] = parsed[k].trim(); });
      if(parsed[MAP_KEY] && typeof parsed[MAP_KEY] === 'object') blank.columnMap = parsed[MAP_KEY];
      return blank;
    } catch(e){ return blank; }
  }

  function get(){ return Object.assign({}, settings); }

  function save(next){
    KEYS.forEach(k => { if(next[k] !== undefined) settings[k] = String(next[k] || '').trim(); });
    if(next.columnMap !== undefined) settings.columnMap = next.columnMap || {};
    try { localStorage.setItem(FLOW_SETTINGS_KEY, JSON.stringify(settings)); return true; }
    catch(e){ return false; }
  }

  // Counts a flow the site serves for us as configured, because to everything
  // that asks, it is.
  function has(key){ return configured(key); }

  // Turns fetch's deliberately vague failures into something a site manager can
  // act on. A cross-origin refusal and a dead network both surface as the same
  // bare TypeError, so the message names both possibilities rather than
  // guessing wrong.
  function transportError(err){
    if(err && err.name === 'TypeError'){
      const e = new Error('The browser could not reach the flow. Either the flow\u2019s Response action is ' +
        'not returning the Access-Control-Allow-Origin header (see the setup guide, step 6), the flow ' +
        'is turned off, or you are offline.');
      e.cors = true;
      return e;
    }
    return err;
  }

  // Power Automate reports a failed run as {"error":{"code":…,"message":…}}, so
  // the message is a level down. Reading data.error straight out handed an
  // object to new Error(), which the app then showed as "[object Object]" --
  // hiding the one thing a person needs while they are getting a flow working.
  function digOutMessage(value, depth){
    if(value === null || value === undefined || depth > 4) return '';
    if(typeof value === 'string') return value.trim();
    if(typeof value !== 'object') return '';
    for(const key of ['message', 'Message', 'error', 'Error', 'description', 'detail']){
      const found = digOutMessage(value[key], (depth || 0) + 1);
      if(found) return found;
    }
    return '';
  }

  async function failureMessage(res){
    const fallback = 'The flow returned ' + res.status + '.';
    let text = '';
    try { text = await res.text(); } catch(e){ return fallback; }
    if(!text.trim()) return fallback;

    let message = '';
    try { message = digOutMessage(JSON.parse(text), 0); }
    catch(e){ message = text.trim(); }           // not JSON: show what came back
    if(!message) message = text.trim();
    // these run messages carry the failing action's name and are worth reading
    // whole, but not worth flooding a status line with
    if(message.length > 400) message = message.slice(0, 400) + '\u2026';
    return res.status + ': ' + message;
  }

  /* ---- the server-side proxy -------------------------------------------
     When the site is deployed with netlify/functions/flow.js, the trigger URLs
     live in Netlify's environment variables and never reach the browser. The
     app then names the flow it wants instead of holding its URL.

     This is asked once, on load, and the answer decides nothing permanent: a
     flow the proxy cannot serve falls back to the URL box in Settings, and a
     deployment with no function at all behaves exactly as it always did. So a
     function that fails to deploy costs the feature, not the app. */
  const PROXY_PATH = '/.netlify/functions/flow';
  let proxy = { available: false, configured: {} };

  // Which flow each setting is called by the proxy.
  const PROXY_TARGETS = {
    projectsUrl: 'projects',
    fileUrl: 'file',
    logReadUrl: 'logRead',
    logWriteUrl: 'logWrite',
    describeUrl: 'describe'
  };

  async function probeProxy(){
    // Opened off the disk there is no server to ask, and asking costs a
    // noticeable pause before the first screen.
    if(location.protocol === 'file:') return proxy;
    try {
      // The app waits for this before it draws anything, so it must not be able
      // to hang. A site with no function answers 404 at once; a sick one might
      // not answer at all, and that must cost a moment, not the app.
      const give_up = new AbortController();
      const timer = setTimeout(() => give_up.abort(), 2500);
      let res;
      try { res = await fetch(PROXY_PATH, { method: 'GET', cache: 'no-store', signal: give_up.signal }); }
      finally { clearTimeout(timer); }
      if(!res.ok) return proxy;
      const data = await res.json();
      if(data && data.ok && data.configured && typeof data.configured === 'object'){
        proxy = { available: true, configured: data.configured };
      }
    } catch(e){
      // no function deployed, or no network: both mean "carry on as before"
    }
    return proxy;
  }

  // Does this flow go through the proxy? Only if the function is there AND that
  // particular environment variable is actually set on the site.
  function viaProxy(settingKey){
    const target = PROXY_TARGETS[settingKey];
    return !!(proxy.available && target && proxy.configured[target]);
  }

  function proxyUrl(settingKey){
    return PROXY_PATH + '?target=' + encodeURIComponent(PROXY_TARGETS[settingKey]);
  }

  /* Every flow call goes through here. Three places a URL can come from, most
     specific first:

       1. the site's own function — the URL never reaches the browser
       2. a URL pasted into Settings — this browser only, so it is the way to
          point one flow somewhere else without redeploying for everybody
       3. a URL built into the app — assets/flow-urls.js, the same for everyone
          who opens the site, and the reason most people paste nothing

     Built-in comes last so that a deliberate override in front of you always
     wins over what the build happened to ship with. */
  function endpointFor(settingKey){
    if(viaProxy(settingKey)) return proxyUrl(settingKey);
    if(settings[settingKey]) return settings[settingKey];
    return FlowUrls.get(settingKey);
  }

  // Where a flow's URL is coming from, for anything that has to explain itself.
  function sourceOf(settingKey){
    if(viaProxy(settingKey)) return 'site';
    if(settings[settingKey]) return 'pasted';
    if(FlowUrls.get(settingKey)) return 'builtin';
    return 'none';
  }

  // Configured at all, by any route.
  function configured(settingKey){
    return sourceOf(settingKey) !== 'none';
  }

  function proxyState(){
    return { available: proxy.available, configured: Object.assign({}, proxy.configured) };
  }

  async function postJson(url, payload){
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        // text/plain, not application/json — see the CORS note at the top
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
    } catch(err){
      throw transportError(err);
    }
    if(!res.ok){
      const error = new Error(await failureMessage(res));
      error.status = res.status;
      throw error;
    }
    const text = await res.text();
    if(!text.trim()) return {};
    try { return JSON.parse(text); }
    catch(e){ throw new Error('The flow replied with something that is not JSON. Check the Response action Body.'); }
  }

  /* ---------------------------------------------------------------------
     Projects
     --------------------------------------------------------------------- */

  // SharePoint's own column names come through Power Automate mangled
  // (`Head_x0020_Contractor`) or renamed (`Title`), and how much shaping the
  // flow does is up to whoever builds it. Rather than dictate one spelling,
  // accept the ones that actually turn up and normalise here.
  const ALIASES = {
    id:               ['id', 'ID', 'projectId', 'ProjectID', 'Project_x0020_ID'],
    project:          ['project', 'Project', 'projectName', 'ProjectName', 'Title',
                       'Project_x0020_Name'],
    headContractor:   ['headContractor', 'HeadContractor', 'Head_x0020_Contractor',
                       'headContractorCompany', 'Company', 'company', 'Contractor'],
    recipientAddress: ['recipientAddress', 'RecipientAddress', 'Recipient_x0020_Address',
                       'Address', 'address'],
    attention:        ['attention', 'Attention', 'Attn', 'attn', 'Contact', 'contact'],
    issuedBy:         ['issuedBy', 'IssuedBy', 'Issued_x0020_By', 'issuedby'],
    position:         ['position', 'Position', 'Title2', 'JobTitle', 'Job_x0020_Title'],
    folderPath:       ['folderPath', 'FolderPath', 'Folder_x0020_Path', 'folder',
                       'Folder', 'saveFolder', 'SaveFolder', 'LibraryPath'],
    siteUrl:          ['siteUrl', 'SiteUrl', 'Site_x0020_Url', 'site', 'SiteAddress'],
    state:            ['state', 'State', 'stateCode', 'StateCode'],
    clauseRef:        ['clauseRef', 'ClauseRef', 'Clause_x0020_Ref', 'defaultClause'],
    active:           ['active', 'Active', 'IsActive']
  };

  // Column names arrive in whatever spelling SharePoint settled on, and the
  // differences are all punctuation and case: Head Contractor, HeadContractor,
  // Head_x0020_Contractor, head_contractor. Flatten both sides to letters and
  // digits and they all meet.
  function normKey(name){
    return String(name).replace(/_x[0-9a-fA-F]{4}_/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function readValue(value){
    if(value === undefined || value === null) return '';
    // SharePoint person and lookup columns arrive as objects
    if(typeof value === 'object'){
      const inner = value.DisplayName || value.Value || value.Title || value.displayName
                 || value.Email || value.EMail;
      return inner ? String(inner).trim() : '';
    }
    return String(value).trim();
  }

  // An index of the row's own keys, flattened, so a lookup is one hash away
  // rather than a scan per alias.
  function indexRow(row){
    const byNorm = {};
    Object.keys(row).forEach(k => {
      const n = normKey(k);
      if(byNorm[n] === undefined) byNorm[n] = row[k];
    });
    return byNorm;
  }

  function pick(row, index, names, field){
    // An explicit mapping set in Settings wins over every guess. It is the only
    // thing that can rescue a list whose columns came through as field_1,
    // field_2 -- which is what SharePoint's "From Excel" import produces, and
    // no amount of name matching can infer meaning from that.
    const mapped = settings.columnMap && settings.columnMap[field];
    if(mapped){
      const direct = readValue(row[mapped]);
      if(direct) return direct;
      const viaNorm = readValue(index[normKey(mapped)]);
      if(viaNorm) return viaNorm;
    }
    for(const name of names){
      const text = readValue(index[normKey(name)]);
      if(text) return text;
    }
    return '';
  }

  /* --------------------------------------------------------------------
     Folder paths

     The natural way to fill in a Folder Path column is to open the folder in
     SharePoint and copy the address bar, which gives a view URL, not a path:

       /sites/AXPVIC/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2F…&viewid=…

     Handed to Create file that fails, and the register is not obviously wrong
     to look at. The real path is sitting in the id= parameter, percent-encoded,
     so dig it out rather than asking everyone to hand-write paths.
     -------------------------------------------------------------------- */
  function decodePath(value){
    let text = String(value || '').trim();
    if(!text) return '';

    // a view URL: the folder is the id= parameter
    const marker = text.indexOf('id=');
    if(marker !== -1 && /AllItems\.aspx|Forms\//i.test(text)){
      text = text.slice(marker + 3).split('&')[0];
    } else if(/^https?:\/\//i.test(text)){
      try { text = new URL(text).pathname; } catch(e){}
    }

    try { text = decodeURIComponent(text); } catch(e){}
    text = text.replace(/\+/g, ' ').trim();
    if(text && text.charAt(0) !== '/') text = '/' + text;
    return text.replace(/\/+$/, '');
  }

  // "/sites/AXPVIC/Shared Documents/x" -> site "/sites/AXPVIC", folder
  // "/Shared Documents/x". Create file wants the second, relative to the Site
  // Address it is already pointed at.
  function splitSitePath(fullPath){
    const m = /^(\/sites\/[^/]+|\/teams\/[^/]+)(\/.*)?$/i.exec(fullPath || '');
    if(!m) return { sitePath: '', folder: fullPath || '' };
    return { sitePath: m[1], folder: m[2] || '/' };
  }

  function normaliseProject(row, position){
    const index = indexRow(row);
    const out = {};
    Object.keys(ALIASES).forEach(key => { out[key] = pick(row, index, ALIASES[key], key); });
    if(!out.id) out.id = 'p' + position;

    const full = decodePath(out.folderPath);
    const parts = splitSitePath(full);
    out.folderServerPath = full;          // /sites/AXPVIC/Shared Documents/…
    out.folderPath = parts.folder;        // /Shared Documents/…  — what Create file wants
    out.sitePath = parts.sitePath;        // /sites/AXPVIC
    out.folderRaw = String(row && out.folderPath ? (pick(row, index, ALIASES.folderPath, 'folderPath')) : '');

    out.raw = row;
    return out;
  }

  // What the rows actually contained, for the mapping UI and for telling
  // someone why a field came back empty.
  //
  // Empty keys are KEPT, and that is the point. A flow whose Select step asks
  // for the wrong SharePoint column returns the right key with nothing in it;
  // hiding those made the response look as though the column had never been
  // requested, which sends you to fix the wrong thing.
  //
  // Keys are pooled across every row and the sample is the first non-empty
  // value found anywhere, so a column that happens to be blank on the first
  // project still shows what it holds.
  function describeRows(rows){
    const list = Array.isArray(rows) ? rows : [rows];
    const order = [];
    const samples = {};
    list.forEach(row => {
      if(!row || typeof row !== 'object') return;
      Object.keys(row).forEach(key => {
        if(samples[key] === undefined){ order.push(key); samples[key] = ''; }
        if(!samples[key]) samples[key] = readValue(row[key]);
      });
    });
    return order.map(key => {
      const value = samples[key] || '';
      return {
        key: key,
        value: value.length > 80 ? value.slice(0, 80) + '\u2026' : value,
        empty: !value
      };
    });
  }

  function describeRow(row){ return describeRows([row]); }

  // The register fields the app fills in, in the order the form asks for them.
  const MAPPABLE = [
    { field: 'project',          label: 'Project name' },
    { field: 'headContractor',   label: 'Head contractor / company' },
    { field: 'recipientAddress', label: 'Recipient address' },
    { field: 'attention',        label: 'Attention' },
    { field: 'issuedBy',         label: 'Issued by (name)' },
    { field: 'position',         label: 'Position' },
    { field: 'folderPath',       label: 'SharePoint folder path' }
  ];

  // The flow may answer with {projects:[…]}, with Get items' own {value:[…]},
  // or with a bare array. All three are things a reasonable flow returns.
  function extractRows(data){
    if(Array.isArray(data)) return data;
    if(!data || typeof data !== 'object') return [];
    for(const key of ['projects', 'value', 'items', 'records', 'body']){
      if(Array.isArray(data[key])) return data[key];
    }
    return [];
  }

  async function getProjects(state){
    if(!configured('projectsUrl')){
      const err = new Error('No projects flow configured — add its URL in Settings.');
      err.unconfigured = true;
      throw err;
    }
    const data = await postJson(endpointFor('projectsUrl'), { state: state });
    const rows = extractRows(data).map(normaliseProject);

    // A row with no state belongs to whichever register it came from -- which
    // is how a register per state works, where the list is the state and the
    // column is redundant. A row that names a DIFFERENT state does not belong
    // here, and is dropped rather than shown.
    //
    // There is deliberately no fallback to the unfiltered rows when nothing
    // matches. It used to fall back, so a register whose State column was wrong
    // showed every state's projects under one letterhead; an empty dropdown
    // that says why is the better failure.
    const forState = rows.filter(r =>
      !r.state || r.state.toUpperCase() === String(state).toUpperCase());
    const usable = forState.filter(r => r.project);
    usable.sort((a, b) => a.project.localeCompare(b.project));
    return usable;
  }

  /* ---------------------------------------------------------------------
     Filing the PDF
     --------------------------------------------------------------------- */

  // Falling back to no-cors means sending the same PDF a second time. That is
  // acceptable once, to find out whether this flow's reply is readable; doing
  // it on every variation would double every upload for the whole life of a
  // misconfigured flow. So the verdict is remembered per URL, and a flow known
  // to be unreadable is written to blind from the start.
  //
  // Keyed by URL, so regenerating the trigger key or fixing the Response
  // headers and pasting the new URL starts the question over.
  const BLIND_KEY = 'variationCoverSheet:blindFlows';

  function blindUrls(){
    try { return JSON.parse(localStorage.getItem(BLIND_KEY) || '[]') || []; }
    catch(e){ return []; }
  }
  function isBlind(url){ return blindUrls().indexOf(url) !== -1; }
  function markBlind(url){
    const list = blindUrls();
    if(list.indexOf(url) !== -1) return;
    list.push(url);
    try { localStorage.setItem(BLIND_KEY, JSON.stringify(list.slice(-10))); } catch(e){}
  }

  // The same request, sent blind. no-cors means the browser will not show us
  // the reply, but it does still deliver the body to the flow.
  function postBlind(url, payload){
    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload)
    });
  }

  // Returns 'confirmed' when the flow answered, or 'sent' when the browser
  // delivered it blind. Never claims more than it knows.
  async function fileVariation(payload){
    const url = endpointFor('fileUrl');
    if(!url){
      const err = new Error('No filing flow configured — add its URL in Settings.');
      err.unconfigured = true;
      throw err;
    }
    if(isBlind(url)){
      await postBlind(url, payload);
      return { status: 'sent' };
    }
    try {
      const data = await postJson(url, payload);
      return { status: 'confirmed', response: data };
    } catch(err){
      if(!err.cors) throw err;
      markBlind(url);
      await postBlind(url, payload);
      return { status: 'sent', firstTime: true };
    }
  }

  /* ---------------------------------------------------------------------
     The variation log

     A second SharePoint list, one row per variation, keyed by the project and
     the variation reference together -- VAR-001 on one job is a different
     variation from VAR-001 on another, so neither half identifies a row on its
     own.

     Every row carries two representations of the same thing. The flat columns
     are what a person reads and reports on in SharePoint. `payload` is the
     whole form as JSON, and is what the app reads back, so a variation returns
     exactly as it was issued even if someone renames a column or the form
     grows a field the list has not got yet.
     --------------------------------------------------------------------- */

  const LOG_ALIASES = {
    // Title is the PROJECT here, not the reference. The log reads state,
    // project, variation -- so the project is what SharePoint shows as each
    // row's name, and the reference has a column of its own. Title must not be
    // a fallback for the reference: it would read every variation on a job as
    // being called after the job.
    variationRef:    ['variationRef', 'VariationRef', 'Variation_x0020_Ref', 'ref'],
    project:         ['project', 'Project', 'ProjectName', 'Project_x0020_Name', 'Title'],
    projectId:       ['projectId', 'ProjectId', 'ProjectID', 'Project_x0020_Id'],
    state:           ['state', 'State'],
    description:     ['variationDescription', 'VariationDescription', 'Description', 'description'],
    headContractor:  ['headContractor', 'HeadContractor', 'Head_x0020_Contractor'],
    issuedBy:        ['issuedBy', 'IssuedBy', 'Issued_x0020_By'],
    issuedDate:      ['issuedDate', 'IssuedDate', 'Issued_x0020_Date'],
    updatedAt:       ['updatedAt', 'UpdatedAt', 'Modified'],
    downloadedAt:    ['downloadedAt', 'DownloadedAt', 'Downloaded_x0020_At'],
    payload:         ['payload', 'Payload', 'FormJson', 'Form_x0020_Json', 'json']
  };

  // The Payload column should hold the form state. It very often holds the
  // whole request body instead: the write flow's Compose action and the column
  // are both called Payload, so picking "Payload" from dynamic content stores
  // the request rather than the form state inside it. That parses perfectly
  // well and carries no fields, which restores nothing and reports nothing.
  //
  // Unwrap one level when that has happened, rather than making someone rebuild
  // a flow over a name collision.
  function readPayload(text){
    if(!text) return null;
    let data;
    try { data = JSON.parse(text); } catch(e){ return null; }
    if(!data || typeof data !== 'object') return null;
    if(data.fields) return data;

    // the request body, with the real state as a string under .payload
    if(typeof data.payload === 'string'){
      try {
        const inner = JSON.parse(data.payload);
        if(inner && inner.fields) return inner;
      } catch(e){}
    }
    // ... or already parsed, if the flow stored an object
    if(data.payload && typeof data.payload === 'object' && data.payload.fields) return data.payload;

    return data;   // parsed but unrecognised; the caller reports it rather than
                   // silently applying nothing
  }

  function normaliseLogRow(row, position){
    const index = indexRow(row);
    const out = {};
    Object.keys(LOG_ALIASES).forEach(key => { out[key] = pick(row, index, LOG_ALIASES[key], key); });
    if(!out.id) out.id = 'l' + position;
    out.raw = row;
    // The form state travels as a JSON string in one column. A row whose
    // payload will not parse is still listed -- it has a reference and a
    // description -- but cannot be loaded, and says so rather than restoring
    // half a variation.
    out.state_ = readPayload(out.payload);

    // The saved form carries the project and office it was issued under, so a
    // row whose columns were never filled can still be attributed. Without
    // this the only options are to trust the flow -- which shows one project's
    // variations under another -- or to discard rows that are perfectly good.
    if(out.state_){
      if(!out.projectId && out.state_.projectId) out.projectId = String(out.state_.projectId);
      if(!out.state && out.state_.office) out.state = String(out.state_.office);
    }
    return out;
  }

  // Filters strictly: a row that cannot be shown to belong here does not belong
  // here.
  //
  // This used to fall back to trusting the flow's own filter whenever no row
  // carried the field, which let one project's variations appear under another
  // -- the exact mix-up the hierarchy exists to prevent. Rows are attributed
  // from their saved form when the columns are blank, so there is now rarely
  // anything unattributable left; what is left is dropped and counted, because
  // an unexplained empty list is recoverable and a wrong variation number on a
  // letter is not.
  function narrow(rows, field, wanted){
    if(!wanted || !rows.length) return { kept: rows, dropped: 0, unlabelled: 0 };
    const want = String(wanted).trim().toLowerCase();
    let unlabelled = 0;
    const kept = rows.filter(r => {
      const value = String(r[field] === undefined || r[field] === null ? '' : r[field]).trim();
      if(!value){ unlabelled++; return false; }
      return value.toLowerCase() === want;
    });
    return { kept: kept, dropped: rows.length - kept.length, unlabelled: unlabelled };
  }

  function sameRef(a, b){
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  // Both calls go to the one read flow. Without a reference it lists what the
  // project has; with one it is asking for that variation in full.
  async function readLog(query){
    if(!configured('logReadUrl')){
      const err = new Error('No variation log configured — add its URL in Settings.');
      err.unconfigured = true;
      throw err;
    }
    const data = await postJson(endpointFor('logReadUrl'), query);
    const rows = extractRows(data).map(normaliseLogRow).filter(r => r.variationRef);

    // Narrow state, then project, in that order -- the same hierarchy the form
    // walks. The flow is asked to filter too, but this is what the numbering
    // trusts, and a number allocated from the wrong project's history is the
    // kind of mistake that reaches a head contractor before anyone notices.
    //
    // Project ids are only unique within the list they came from. Run a
    // register per state, as a site per state invites, and id 2 is a VIC
    // project AND an NSW one; filtering on the id alone would silently pool
    // their variation numbers.
    const byState = narrow(rows, 'state', query.state);
    const byProject = narrow(byState.kept, 'projectId', query.projectId);
    const scoped = byProject.kept;
    scoped.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));

    // hung off the array so the caller can explain an unexpectedly short list
    scoped.received = rows.length;
    scoped.unattributable = byState.unlabelled + byProject.unlabelled;
    return scoped;
  }

  function listLog(state, projectId){
    return readLog({ action: 'list', state: state, projectId: projectId });
  }

  async function getLog(state, projectId, variationRef){
    const rows = await readLog({ action: 'get', state: state, projectId: projectId,
                                 variationRef: variationRef });
    return rows.find(r => sameRef(r.variationRef, variationRef)) || null;
  }

  async function writeLog(payload){
    if(!configured('logWriteUrl')){
      const err = new Error('No variation log configured — add its URL in Settings.');
      err.unconfigured = true;
      throw err;
    }
    try {
      const data = await postJson(endpointFor('logWriteUrl'), payload);
      return { status: 'confirmed', response: data };
    } catch(err){
      if(!err.cors) throw err;
      markBlind(endpointFor('logWriteUrl'));
      await postBlind(endpointFor('logWriteUrl'), payload);
      return { status: 'sent' };
    }
  }

  /* ---------------------------------------------------------------------
     Description wording (optional)
     --------------------------------------------------------------------- */

  async function describe(payload){
    if(!configured('describeUrl')){
      const err = new Error('No wording flow configured.');
      err.unconfigured = true;
      throw err;
    }
    const data = await postJson(endpointFor('describeUrl'), payload);
    const text = data && (data.description || data.text || data.result || data.output);
    if(!text) throw new Error('The wording flow replied without a description.');
    return String(text).trim();
  }

  return { get, save, has, probeProxy, proxyState, viaProxy, sourceOf, builtIn: FlowUrls.get,
           getProjects, fileVariation, describe,
           listLog, getLog, writeLog, sameRef, LOG_ALIASES,
           normaliseProject, extractRows, describeRow, describeRows, normKey,
           MAPPABLE, ALIASES, decodePath, splitSitePath };
})();
