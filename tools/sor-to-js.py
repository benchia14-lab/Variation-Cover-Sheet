#!/usr/bin/env python3
"""Turn the master schedule of rates workbook into assets/schedule-of-rates.js.

    python3 tools/sor-to-js.py "registers/Schedule of Rates.xlsx"

The workbook is read the way it is laid out:

    A item no.   B description   C add   D ded   E diff   F unit   G rate   H total

A row with a description and no unit or rate starts a new section. A row with
a unit and a rate is a line in the current section. Everything under the
"Exclusions/Qualifications" heading is printed under the schedule as notes.

A rate below 1 against a unit of "item" is a percentage (0.05 is 5%) and is
applied to the measured works, which is what "Design, Co-Ordination ... (5%)"
means in the sheet. Every such line is moved into a Prelims section at the
top, with the percentage as its starting value (the "(5%)" in its wording is
dropped, since the percentage can be changed for a variation), followed by
the lines in PRELIM_LINES below, which start with no percentage.

Rates are copied, never retyped: re-run this whenever the workbook changes and
commit the result.
"""
import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('openpyxl is needed: pip install openpyxl')

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'assets' / 'schedule-of-rates.js'

HEADER = '''/* ============================================================================
   SCHEDULE OF RATES — what stage 3 prices a variation from
   ============================================================================

   GENERATED from the master schedule of rates workbook by
       python3 tools/sor-to-js.py "registers/Schedule of Rates.xlsx"
   Change the workbook and re-run that rather than editing this by hand.

   Each line is measured the way the workbook measures it: a quantity added and
   a quantity deducted, the difference times the rate. `percent` lines are a
   percentage of the measured works rather than a rate. `notes` are the
   schedule's exclusions and qualifications, printed under it.
============================================================================ */

'''


# Prelims the workbook does not carry, each one line applied as a percentage
# of the measured works, chosen per variation. Worded like the workbook's own
# design allowance: one line naming everything it covers. Edit and re-run.
PRELIM_LINES = ['Overheads - Equipment Hire, Labour Hire, Fire Rating and Treatment, '
                'Siphonic Design, Seismic Etc']


def clean(value):
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def main(path):
    ws = openpyxl.load_workbook(path, data_only=False).worksheets[0]
    preamble = []
    sections = []
    notes = []
    in_notes = False
    current = None

    for r in range(2, ws.max_row + 1):
        ref, desc, unit, rate = (ws.cell(r, c).value for c in (1, 2, 6, 7))
        if desc is None or not str(desc).strip():
            continue
        lines = [clean(x) for x in str(desc).split('\n') if clean(x)]
        unit = clean(unit)
        has_rate = isinstance(rate, (int, float))

        if in_notes:
            notes.append(' '.join(lines))
            continue

        if not has_rate:
            title = lines[0]
            sub = ' '.join(lines[1:])
            if re.match(r'exclusions\s*/\s*qualifications', title, re.I):
                in_notes = True
                continue
            if title.upper() == 'CONTRACT RATES':
                # the heading of the whole sheet, not a section
                if sub:
                    preamble.append(sub)
                continue
            # "OTHER PRICING - works below occur ..." -> a title and its note
            m = re.match(r'^([A-Z][A-Z ]+?)\s+-\s+(.*)$', title)
            if m and not sub:
                title, sub = m.group(1).title(), m.group(2)
            current = {'title': title, 'note': sub, 'lines': []}
            sections.append(current)
            continue

        if current is None:
            sys.exit('row %d has a rate before any section heading' % r)
        line = {'d': ' '.join(lines), 'u': unit, 'r': rate}
        if unit.lower() == 'item' and 0 < rate < 1:
            line = {'d': ' '.join(lines), 'u': '%', 'percent': round(rate * 100, 4)}
        if ref is not None:
            line['ref'] = str(ref).strip()
        current['lines'].append(line)

    # every percentage line, wherever the workbook put it, becomes a prelim
    prelims = []
    for s in sections:
        keep = []
        for line in s['lines']:
            if 'percent' in line:
                d = re.sub(r'\s*\(\s*[\d.]+\s*%\s*\)\s*$', '', line['d']).strip()
                prelims.append(dict(line, d=d))
            else:
                keep.append(line)
        s['lines'] = keep
    prelims += [{'d': name, 'u': '%', 'percent': None} for name in PRELIM_LINES]
    sections.insert(0, {'title': 'Prelims',
                        'note': 'Each applied as a percentage of the measured works on this schedule',
                        'lines': prelims})

    sections = [s for s in sections if s['lines']]
    data = {
        'title': 'Schedule of Rates',
        'source': Path(path).name,
        'gstPercent': 10,
        'preamble': preamble,
        'sections': sections,
        'notes': notes,
    }
    body = json.dumps(data, ensure_ascii=False, indent=1)
    TARGET.write_text(HEADER + 'const SCHEDULE_OF_RATES = ' + body + ';\n', encoding='utf-8')
    count = sum(len(s['lines']) for s in sections)
    print('%s: %d sections, %d lines, %d notes' % (TARGET.relative_to(ROOT), len(sections), count, len(notes)))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
