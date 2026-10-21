/* ============================================================================
   AGREED SCHEDULES OF RATES — a project's own rates, read from its Excel
   ============================================================================
   Rates are agreed project by project, in a copy of the master schedule
   workbook with that project's rates typed in. This reads such a workbook --
   fetched from SharePoint by the Get agreed rates flow, or dropped onto the
   schedule of rates by hand -- and lays its rates over the master:

     a line the workbook has        is charged at the workbook's rate
     a line it does not have        keeps the master rate, marked as such
     a line the master does not have is added, under its own section

   so a full copy of the schedule and a short list of only the rates that
   differ both work.

   The workbook is read the way tools/sor-to-js.py reads the master: a row
   with a description and no rate starts a section, a row with a unit and a
   rate is a line, a rate below 1 against a unit of "item" is a percentage,
   and everything under "Exclusions/Qualifications" is notes. The columns are
   found by their headings (Description, Unit, Rates), so a copy with a column
   moved still reads.
============================================================================ */

const AgreedRates = (function(){

  const clean = v => String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim();
  const norm = v => clean(v).toLowerCase();
  // "Design ... Etc (5%)" and "Design ... Etc" are the same prelim
  const bare = v => norm(v).replace(/\s*\(\s*[\d.]+\s*%\s*\)\s*$/, '');

  function number(v){
    if(typeof v === 'number') return isFinite(v) ? v : null;
    const text = clean(v).replace(/[$,\s]/g, '');
    if(!text) return null;
    const n = Number(text);
    return isFinite(n) ? n : null;
  }

  // the heading row: the first with a Description and a Rate column
  function findColumns(rows){
    for(let r = 0; r < Math.min(rows.length, 25); r++){
      const row = rows[r] || [];
      const at = re => row.findIndex(c => re.test(clean(c)));
      const d = at(/^description$/i), rate = at(/^rates?$/i), unit = at(/^units?$/i);
      if(d !== -1 && rate !== -1) return { start: r + 1, ref: d > 0 ? d - 1 : -1, d: d, u: unit, r: rate };
    }
    // the master's own layout: A item, B description, F unit, G rate
    return { start: 1, ref: 0, d: 1, u: 5, r: 6 };
  }

  function parseRows(rows){
    const col = findColumns(rows);
    const sections = [];
    const notes = [];
    let current = null, inNotes = false;

    for(let r = col.start; r < rows.length; r++){
      const row = rows[r] || [];
      const raw = row[col.d];
      if(raw === null || raw === undefined || !clean(raw)) continue;
      const lines = String(raw).split(/\r?\n/).map(clean).filter(Boolean);
      const unit = col.u === -1 ? '' : clean(row[col.u]);
      const rate = number(row[col.r]);

      if(inNotes){ notes.push(lines.join(' ')); continue; }

      if(rate === null){
        let title = lines[0];
        let sub = lines.slice(1).join(' ');
        if(/exclusions\s*\/\s*qualifications/i.test(title)){ inNotes = true; continue; }
        if(title.toUpperCase() === 'CONTRACT RATES') continue;
        const m = /^([A-Z][A-Z ]+?)\s+-\s+(.*)$/.exec(title);
        if(m && !sub){ title = m[1].replace(/\w\S*/g, w => w[0] + w.slice(1).toLowerCase()); sub = m[2]; }
        current = { title: title, note: sub, lines: [] };
        sections.push(current);
        continue;
      }
      if(!current){ current = { title: 'Rates', note: '', lines: [] }; sections.push(current); }
      const d = lines.join(' ');
      if(unit.toLowerCase() === 'item' && rate > 0 && rate < 1){
        current.lines.push({ d: d, u: '%', percent: Math.round(rate * 1e6) / 1e4 });
      } else {
        current.lines.push({ d: d, u: unit, r: rate });
      }
    }
    return { sections: sections.filter(s => s.lines.length), notes: notes };
  }

  // An .xlsx (or .csv) as bytes -> the schedule it holds. Throws, saying why,
  // when it is not one.
  function readWorkbook(bytes){
    if(typeof XLSX === 'undefined') throw new Error('the spreadsheet reader did not load');
    let wb;
    try { wb = XLSX.read(bytes, { type: 'array' }); }
    catch(e){ throw new Error('it could not be opened as a spreadsheet'); }
    // the first sheet that reads as a schedule
    for(const name of wb.SheetNames){
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
      const parsed = parseRows(rows);
      const count = parsed.sections.reduce((n, s) => n + s.lines.length, 0);
      if(count) return Object.assign(parsed, { sheet: name, count: count });
    }
    throw new Error('no rates were found in it — it needs Description, Unit and Rates columns like the master schedule');
  }

  /* The master with the agreed rates laid over it. Returns the schedule to
     use, in the master's shape, and what changed. */
  function overlay(master, agreed){
    const schedule = JSON.parse(JSON.stringify(master));
    const report = { read: 0, differ: 0, added: 0, masterOnly: 0, prelims: 0 };
    const sectionOf = title => schedule.sections.find(s => norm(s.title) === norm(title));
    const prelims = schedule.sections.find(s => s.title === 'Prelims');

    // descriptions that appear once in the whole master can be matched even
    // when the workbook files them under a differently named section
    const once = {};
    schedule.sections.forEach(s => s.lines.forEach(l => {
      if(l.percent !== undefined) return;
      const k = norm(l.d);
      once[k] = once[k] === undefined ? { s: s, l: l } : null;
    }));

    const used = new Set();
    agreed.sections.forEach(as => {
      as.lines.forEach(al => {
        report.read++;
        if(al.percent !== undefined){
          const p = prelims && prelims.lines.find(l => bare(l.d) === bare(al.d));
          if(p){ p.percent = al.percent; p.agreed = true; report.prelims++; }
          return;
        }
        const sec = sectionOf(as.title);
        // a description repeated within a section ("Extra over for acoustics
        // to the above") is matched in order: first to first, second to second
        let hit = sec && sec.lines.find(l => l.percent === undefined && !used.has(l) && norm(l.d) === norm(al.d));
        if(!hit && once[norm(al.d)] && !used.has(once[norm(al.d)].l)) hit = once[norm(al.d)].l;
        if(hit){
          used.add(hit);
          if(Number(hit.r) !== Number(al.r)) report.differ++;
          hit.r = al.r;
          if(al.u) hit.u = al.u;
          hit.agreed = true;
          return;
        }
        // not in the master: it goes in as the workbook has it
        let into = sec;
        if(!into){
          into = { title: as.title, note: as.note || '', lines: [] };
          schedule.sections.push(into);
        }
        into.lines.push({ d: al.d, u: al.u, r: al.r, agreed: true, added: true });
        report.added++;
      });
    });

    schedule.sections.forEach(s => s.lines.forEach(l => {
      if(l.percent === undefined && !l.agreed){ l.masterRate = true; report.masterOnly++; }
    }));
    return { schedule: schedule, report: report };
  }

  function describe(report){
    const parts = [report.read + ' line' + (report.read === 1 ? '' : 's') + ' read'];
    parts.push(report.differ + ' at a rate different from the master');
    if(report.added) parts.push(report.added + ' not in the master, added');
    if(report.masterOnly) parts.push(report.masterOnly + ' not in the file, left at the master rate');
    return parts.join(' · ');
  }

  return { readWorkbook: readWorkbook, overlay: overlay, describe: describe, parseRows: parseRows };
})();
