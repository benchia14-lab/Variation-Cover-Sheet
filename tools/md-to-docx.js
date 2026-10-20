#!/usr/bin/env node
/**
 * Turn the Markdown guides in docs/ into Word documents.
 *
 *   node tools/md-to-docx.js                     # all of docs/*.md -> docs/word/
 *   node tools/md-to-docx.js docs/DEPLOY-NETLIFY.md --out somewhere/
 *
 * The guides are the thing someone actually follows while clicking through
 * SharePoint and Power Automate, so they need to survive being opened on a
 * machine with no Markdown viewer, and to print. Headings, tables, code blocks
 * and inline code all carry meaning here — a plain text dump would lose the
 * distinction between "type this exactly" and "this is prose".
 *
 * Needs the docx npm package: npm install docx
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, LevelFormat, PageNumber, Footer, convertInchesToTwip,
} = require('docx');

const BODY_FONT = 'Arial';
const CODE_FONT = 'Consolas';
const INK = '1C2B3A';
const STEEL = '2A4258';
const MUTED = '6B6459';
const CODE_BG = 'F2F0EA';
const HEAD_BG = '4C5C6D';
const RULE = 'C9C2B4';

// A4 portrait, 1" margins -> the width a table may occupy, in DXA
const CONTENT_WIDTH = 11906 - convertInchesToTwip(1) * 2;

// References between the guides should point at their Word counterparts, since
// that is what the reader has in front of them.
const DOC_TITLES = {
  'DEPLOY-NETLIFY.md': '1 - Deploy to Netlify',
  'SHAREPOINT-REGISTERS.md': '2 - The Two Registers',
  'POWER-AUTOMATE-SETUP.md': '3 - Building the Flows',
  'ROUTING-BY-STATE.md': '4 - Routing Each State to Its Own List',
  'SETTINGS-PASSWORD.md': '5 - Locking Settings with a Password',
  'FLOW-URLS-ON-THE-SERVER.md': '6 - Keeping the Flow URLs on the Server',
  'FLOW-URLS-BUILT-IN.md': '7 - Building the Flow URLs into the App',
  'SIGN-IN.md': '8 - Microsoft Sign-In',
  'VARIATION-FILES.md': '9 - Saving and Reopening Variation Files',
};

/* ---------------------------------------------------------------- inline --- */

// Split a line into styled runs. Code spans are taken first so that a ** or _
// inside one is left alone -- these guides are full of expressions like
// json(triggerBody()) where punctuation is content, not markup.
function inlineRuns(text, opts = {}) {
  const base = { font: BODY_FONT, size: 20, color: INK, ...opts };
  const out = [];
  const pattern = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  let last = 0, m;

  const plain = (s) => { if (s) out.push(new TextRun({ ...base, text: s })); };

  while ((m = pattern.exec(text)) !== null) {
    plain(text.slice(last, m.index));
    last = pattern.lastIndex;
    const tok = m[0];

    if (tok.startsWith('`')) {
      out.push(new TextRun({
        ...base, text: tok.slice(1, -1), font: CODE_FONT,
        size: base.size && base.size < 20 ? 16 : 18, color: STEEL,
        shading: { type: ShadingType.CLEAR, fill: CODE_BG },
      }));
    } else if (tok.startsWith('[')) {
      const label = tok.slice(1, tok.indexOf(']'));
      const href = tok.slice(tok.indexOf('](') + 2, -1);
      if (/^https?:/i.test(href)) {
        out.push(new ExternalHyperlink({
          link: href,
          children: [new TextRun({ ...base, text: label, color: '2A5DB0', underline: {} })],
        }));
      } else {
        // an anchor or a sibling file: no target once this is a Word document,
        // so keep the words and drop the link rather than shipping a dead one
        out.push(new TextRun({ ...base, text: label, bold: true }));
      }
    } else if (tok.startsWith('**')) {
      // recurse: these guides bold whole phrases that contain code spans, and
      // taken flat the backticks print literally
      out.push(...inlineRuns(tok.slice(2, -2), { ...opts, bold: true }));
    } else {
      out.push(...inlineRuns(tok.slice(1, -1), { ...opts, italics: true }));
    }
  }
  plain(text.slice(last));
  return out.length ? out : [new TextRun({ ...base, text: '' })];
}

/* ----------------------------------------------------------------- blocks --- */

function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    spacing: { before: i === 0 ? 120 : 0, after: i === lines.length - 1 ? 160 : 0 },
    shading: { type: ShadingType.CLEAR, fill: CODE_BG },
    indent: { left: 220, right: 220 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: HEAD_BG, space: 8 },
    },
    children: [new TextRun({ text: line || ' ', font: CODE_FONT, size: 17, color: INK })],
  }));
}

function splitRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

function table(rows) {
  const header = rows[0];
  const body = rows.slice(1);
  const cols = header.length;

  // Weight columns by the longest cell each holds, so a column of one-word
  // values does not get the same space as one holding a sentence.
  const weights = header.map((_, i) => {
    const longest = Math.max(...rows.map(r => (r[i] || '').length), 1);
    return Math.min(Math.max(longest, 8), 60);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map(w => Math.floor(CONTENT_WIDTH * w / total));
  widths[cols - 1] = CONTENT_WIDTH - widths.slice(0, -1).reduce((a, b) => a + b, 0);

  const cell = (text, i, isHead) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: isHead ? HEAD_BG : 'FFFFFF' },
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [new Paragraph({
      spacing: { before: 0, after: 0 },
      children: inlineRuns(text, isHead ? { bold: true, color: 'FFFFFF', size: 18 } : { size: 18 }),
    })],
  });

  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left:   { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right:  { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: RULE },
    },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((c, i) => cell(c, i, true)) }),
      ...body.map(r => new TableRow({
        children: Array.from({ length: cols }, (_, i) => cell(r[i] || '', i, false)),
      })),
    ],
  });
}

/* ------------------------------------------------------------------ parse --- */

function parse(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;

  // Markdown lets a list item wrap onto following lines with no marker of its
  // own. Taken literally each of those becomes its own paragraph, which drops
  // the rest of the sentence out of the bullet and back to the left margin.
  // Swallow them into the item that owns them.
  function continuation() {
    const extra = [];
    i++;
    while (i < lines.length && lines[i].trim()
           && !/^\s*([-*]\s|\d+\.\s|#{1,4}\s|>|```|\|)/.test(lines[i])
           && !/^(---|\*\*\*|___)\s*$/.test(lines[i])) {
      extra.push(lines[i].trim());
      i++;
    }
    return extra.length ? ' ' + extra.join(' ') : '';
  }

  while (i < lines.length) {
    let line = lines[i];

    // Fenced code and tables, wherever they sit. Markdown indents them under a
    // list item they belong to; anchoring on column 0 left those as raw
    // backticks and pipes in the document, which is worse than useless in a
    // guide whose whole point is "type this exactly".
    const fence = /^(\s*)```/.exec(line);
    if (fence) {
      const pad = fence[1].length;
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++].slice(pad));
      i++;
      out.push(...codeBlock(buf));
      continue;
    }

    // pipe table: a header row followed by the --- separator
    if (/^\s*\|/.test(line) && /^\s*\|[\s:\-|]+\|?\s*$/.test(lines[i + 1] || '')) {
      const rows = [splitRow(line.trim())];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++].trim()));
      out.push(table(rows));
      out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
      continue;
    }

    // strip the HTML anchors used for in-page links
    line = line.replace(/<a\s+name="[^"]*"><\/a>/g, '').replace(/<a\s+name="[^"]*"\s*\/?>/g, '');

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const depth = heading[1].length;
      const level = [HeadingLevel.TITLE, HeadingLevel.HEADING_1,
                     HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][depth - 1];
      out.push(new Paragraph({
        heading: level,
        spacing: { before: depth === 1 ? 0 : 320, after: depth === 1 ? 240 : 140 },
        children: inlineRuns(heading[2], {
          bold: true, color: depth === 1 ? INK : STEEL,
          size: [40, 30, 24, 21][depth - 1],
        }),
      }));
      i++;
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      out.push(new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 1 } },
        children: [],
      }));
      i++;
      continue;
    }

    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      out.push(new Paragraph({
        numbering: { reference: 'bullets', level: Math.min(Math.floor(bullet[1].length / 2), 2) },
        spacing: { after: 80 },
        children: inlineRuns(bullet[2] + continuation()),
      }));
      continue;
    }

    const numbered = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
    if (numbered) {
      out.push(new Paragraph({
        numbering: { reference: 'steps', level: Math.min(Math.floor(numbered[1].length / 3), 2) },
        spacing: { after: 80 },
        children: inlineRuns(numbered[3] + continuation()),
      }));
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      out.push(new Paragraph({
        indent: { left: 340 },
        spacing: { after: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: RULE, space: 10 } },
        children: inlineRuns(quote[1], { italics: true, color: MUTED }),
      }));
      i++;
      continue;
    }

    if (!line.trim()) { i++; continue; }

    // a paragraph runs until a blank line; Markdown's soft wraps are not breaks
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim()
           && !/^(#{1,4}\s|\s*```|\s*\||\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i])
           && !/^(---|\*\*\*|___)\s*$/.test(lines[i])) {
      buf.push(lines[i++]);
    }
    out.push(new Paragraph({
      spacing: { after: 160, line: 276 },
      children: inlineRuns(buf.join(' ')),
    }));
  }
  return out;
}

/* ------------------------------------------------------------------ build --- */

function retarget(md) {
  // point cross-references at the Word versions the reader actually has
  let out = md;
  for (const [file, title] of Object.entries(DOC_TITLES)) {
    out = out.split(file).join(`${title}.docx`);
  }
  return out;
}

async function convert(srcPath, outDir) {
  const name = path.basename(srcPath);
  const title = DOC_TITLES[name] || name.replace(/\.md$/, '');
  const children = parse(retarget(fs.readFileSync(srcPath, 'utf8')));

  const doc = new Document({
    creator: 'Axis Services',
    title,
    description: 'Variation Cover Sheet setup guide',
    numbering: {
      config: [{
        // Markdown's bullets carry no numbering definition of their own, and
        // the library's default leaves the glyph and its text on different
        // indents, so wrapped lines start under the bullet instead of beside
        // it. Define the hanging indent explicitly.
        reference: 'bullets',
        levels: [0, 1, 2].map(level => ({
          level,
          format: LevelFormat.BULLET,
          text: ['\u2022', '\u25E6', '\u25AA'][level],
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 400 * (level + 1), hanging: 240 } } },
        })),
      }, {
        reference: 'steps',
        levels: [0, 1, 2].map(level => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 420 * (level + 1), hanging: 260 } } },
        })),
      }],
    },
    styles: { default: { document: { run: { font: BODY_FONT, size: 20, color: INK } } } },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              children: [`${title}    |    Page `, PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
              font: BODY_FONT, size: 16, color: MUTED,
            })],
          })],
        }),
      },
      children,
    }],
  });

  const outPath = path.join(outDir, `${title}.docx`);
  fs.writeFileSync(outPath, await Packer.toBuffer(doc));
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outDir = outIdx !== -1 ? args[outIdx + 1] : path.join(__dirname, '..', 'docs', 'word');
  const files = args.filter((a, n) => !a.startsWith('--') && n !== outIdx + 1);

  fs.mkdirSync(outDir, { recursive: true });
  const sources = files.length
    ? files
    : Object.keys(DOC_TITLES).map(f => path.join(__dirname, '..', 'docs', f));

  for (const src of sources) {
    const out = await convert(src, outDir);
    console.log(`${path.basename(src).padEnd(26)} -> ${path.basename(out)}  (${(fs.statSync(out).size / 1024).toFixed(0)} kB)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
