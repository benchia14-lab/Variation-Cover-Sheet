#!/usr/bin/env python3
"""Turn a filled-in State Register workbook into assets/state-register.js.

    python3 tools/register-to-js.py "registers/State Register.xlsx"

Reads the sheet, checks every ABN and ACN against its official checksum, and
rewrites the STATE_REGISTER block in place. Transcribing ten fields across
eight jurisdictions by hand is exactly the kind of job that quietly loses a
digit, so nothing here is retyped.

Refuses to write if a checksum fails — a wrong ABN on a letterhead is not a
typo you want to discover from the other side's contracts team.
"""
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('openpyxl is needed: pip install openpyxl')

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'assets' / 'state-register.js'

DEFAULT_INTRO = 'We have pleasure in issuing this Variation notice for the above item.'
DEFAULT_CLOSING = 'Should you have any queries, please do not hesitate to contact the undersigned.'

# Column order in the workbook, mapped to the keys the app reads.
COLUMNS = ['code', 'name', 'entity', 'abn', 'acn', 'phone', 'email', 'address', 'intro', 'closing']
# Not in the workbook, and not the workbook's to overwrite: a logo is a data URI
# pasted in by tools/add-logo.py and a brand colour is sampled from it. Both are
# carried across from the current file, or a register update would silently
# strip every office's logo.
CARRIED = ['logo', 'brand']
FIELDS = COLUMNS + CARRIED
HEADER_ROW = 3


def digits(value):
    return re.sub(r'\D', '', value or '')


def abn_valid(value):
    """ABN: subtract 1 from the first digit, weight, sum, and it divides by 89."""
    d = digits(value)
    if len(d) != 11:
        return False
    weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
    n = [int(c) for c in d]
    n[0] -= 1
    return sum(a * b for a, b in zip(n, weights)) % 89 == 0


def acn_valid(value):
    """ACN: eight digits weighted 8..1, the ninth is the complement mod 10."""
    d = digits(value)
    if len(d) != 9:
        return False
    total = sum(int(d[i]) * (8 - i) for i in range(8))
    return (10 - total % 10) % 10 == int(d[8])


def acn_from_abn(value):
    """An Australian company's ABN is two check digits followed by its ACN."""
    d = digits(value)
    if len(d) != 11:
        return ''
    a = d[2:]
    return '%s %s %s' % (a[0:3], a[3:6], a[6:9])


def clean(value):
    """Blank, a dash or 'N/A' all mean 'this entity has none' — and a letterhead
    that prints 'ABN: N/A' looks worse than one that omits the row, which is
    what the app does with an empty value."""
    text = '' if value is None else str(value).strip()
    return '' if text.upper() in ('N/A', 'NA', '-', '—', 'NONE') else text


def read_rows(path):
    ws = openpyxl.load_workbook(path).active
    rows = []
    for raw in ws.iter_rows(min_row=HEADER_ROW + 1, values_only=True):
        row = {key: clean(raw[i]) if i < len(raw) else '' for i, key in enumerate(COLUMNS)}
        # the trailing legend line lands in column A with nothing beside it
        if not row['code'] or not row['entity'] or len(row['code']) > 4:
            continue
        rows.append(row)
    return rows


def carried_values():
    """The logo and brand colour already in assets/state-register.js, by code."""
    source = TARGET.read_text()
    out = {}
    for block in re.findall(r'\{\s*\n(?:\s+\w+: .*\n)+?\s*\}', source):
        code = re.search(r'code: "([^"]*)"', block)
        if not code:
            continue
        keep = {}
        for field in CARRIED:
            found = re.search(r'%s: "([^"]*)"' % field, block)
            if found and found.group(1):
                keep[field] = found.group(1)
        out[code.group(1)] = keep
    return out


def check(rows):
    problems, notes = [], []
    for row in rows:
        code, abn, acn = row['code'], row['abn'], row['acn']
        if abn and not abn_valid(abn):
            problems.append('%s: ABN "%s" fails its checksum' % (code, abn))
        if acn:
            if not acn_valid(acn):
                expected = acn_from_abn(abn)
                problems.append('%s: ACN "%s" fails its checksum%s'
                                % (code, acn, ' (expected %s from the ABN)' % expected if expected else ''))
            elif abn and digits(acn) != digits(acn_from_abn(abn)):
                problems.append('%s: ACN "%s" does not match the ABN (expected %s)'
                                % (code, acn, acn_from_abn(abn)))
        if not abn:
            notes.append('%s has no ABN — the letterhead omits that row' % code)
        if not row['phone'] or not row['email'] or not row['address']:
            problems.append('%s: phone, email and address are all required' % code)
    return problems, notes


def render(rows):
    out = []
    for row in rows:
        lines = []
        for field in FIELDS:
            value = row.get(field, '')
            if field == 'intro' and value == DEFAULT_INTRO:
                lines.append('    intro: DEFAULT_INTRO')
            elif field == 'closing' and value == DEFAULT_CLOSING:
                lines.append('    closing: DEFAULT_CLOSING')
            else:
                lines.append('    %s: %s' % (field, json_string(value)))
        out.append('  {\n' + ',\n'.join(lines) + '\n  }')
    return 'const STATE_REGISTER = [\n' + ',\n'.join(out) + '\n];\n'


def json_string(value):
    import json
    return json.dumps(value, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    rows = read_rows(sys.argv[1])
    if not rows:
        sys.exit('No filled-in rows found. Is the header still on row %d?' % HEADER_ROW)

    existing = carried_values()
    kept = 0
    for row in rows:
        for field, value in existing.get(row['code'], {}).items():
            row[field] = value
            kept += 1
    if kept:
        print('note: carried %d logo/brand values across from the current file' % kept)

    problems, notes = check(rows)
    for note in notes:
        print('note: ' + note)
    if problems:
        print('\nNot written. Fix these first:')
        for p in problems:
            print('  - ' + p)
        sys.exit(1)

    source = TARGET.read_text()
    pattern = re.compile(r'^const STATE_REGISTER = \[.*?^\];\n', re.S | re.M)
    if not pattern.search(source):
        sys.exit('Could not find the STATE_REGISTER block in %s' % TARGET)
    TARGET.write_text(pattern.sub(lambda _: render(rows), source, count=1))
    print('\nWrote %d rows to %s: %s' % (len(rows), TARGET.name, ', '.join(r['code'] for r in rows)))


if __name__ == '__main__':
    main()
