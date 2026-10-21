# Agreed schedules of rates, project by project

Rates are agreed per project, in Excel. The app keeps the **master** schedule
(`registers/Schedule of Rates.xlsx`) for any project that has none, and uses a
project's **agreed** rates where the project register says there are some.

```
Project register                         Project folder
┌──────────────────┬─────────────────┐   /Shared Documents/Projects/25-135/
│ Title            │ RatesFile       │      Agreed Schedule of Rates.xlsx  ◄─┐
│ Warrnambool 25-… │ /Shared Docum…  │ ─────────────────────────────────────┘
│ Austin 1507V     │ (blank)         │   ← master rates
└──────────────────┴─────────────────┘
```

---

## How it works in the app

| | What happens |
|---|---|
| **Automatically** | When a project with a `RatesFile` is picked, the Schedule of rates stage loads its agreed rates. A banner says *Agreed rates for Warrnambool Hospital — Agreed Schedule of Rates.xlsx, loaded 10:42*, with what the file changed: *41 at a rate different from the master · 2 not in the master, added*. |
| **Load agreed rates** | Fetches the file again, after it has been changed in SharePoint. |
| **Upload a schedule…** | Or drop an Excel file anywhere on the Schedule of rates stage. That workbook is used for this variation. |
| **Use master rates** | Back to the master for this variation. |

**Each line says which rate it is on:** *agreed*, *master rate* (the file did
not list it), or *agreed · not in master* (a line only the project has). Typing
over a rate still works, and the rate shown beside it is the agreed one.

**The file can be the whole schedule or only what differs.** A line the file
has is charged at the file's rate; a line it does not have keeps the master
rate; a line the master does not have is added under its section. A
percentage line — the design allowance as `0.04` against `item` — sets that
prelim's starting percentage.

**Nothing is repriced behind anyone's back.** A rate is copied onto a line
when the line is measured, so a variation keeps the rates it was priced at:

- Choosing rates here — the button, a dropped file, *Use master rates* —
  reprices the measured lines still on their schedule rate (a typed-over rate
  is left alone) and says how many.
- When rates arrive on their own — picking the project, reopening a variation
  after the file changed — nothing is repriced. The banner says *Reprice 3
  measured lines to these rates* and leaves it to the user.

**What a variation remembers.** Which rates it used is saved with it. Agreed
rates are fetched again from the project when it is reopened. An uploaded
workbook is kept with the variation in the log when it is small (a few dozen
lines) and always in the variation file; a large upload that does not fit the
log keeps its measured rates, and the banner asks for the file to be dropped
again to see the rest.

---

## The agreed workbook

A copy of the master schedule with the project's rates typed in. The app reads
it the way the master is read:

- a heading row with **Description**, **Unit** and **Rates** (other columns —
  Add, Ded, Diff, Total, item numbers — are ignored, and can be anywhere);
- a row with a description and no rate starts a section — the section names
  should match the master's (*Labour Rates - For revised Program*, *Cold Water
  Services* …) so lines land in the right place;
- a row with a unit and a rate is a line, matched to the master by its
  description within its section;
- a rate below 1 against `item` is a percentage (`0.05` = 5%);
- *Exclusions/Qualifications* and everything under it is ignored — those are
  chosen in stage 2.

Only the first sheet that holds rates is read. `.xlsx`, `.xlsm` and `.csv`
all work.

---

## Setting it up

### 1 · A RatesFile column in the project register

**+ Add column → Single line of text**, named `RatesFile`. For each project
with agreed rates, put the file's location in it. Either form works:

- the path within the site: `/Shared Documents/Projects/25-135/Agreed Schedule of Rates.xlsx`
- the file's full address, from the file's **… → Details → Path** (copy) — not
  a **Share** link, which is a different kind of address

Copy it with the copy button beside **Path**, not by selecting the text you
can see: SharePoint shortens a long path on screen to
`/Shared Documents/15.Projects_VIC/…/Schedule of Rates.xlsx`, and a path
with `…` in it points at a folder that does not exist. The app says so if
the register holds one, rather than asking the flow.

Leave it blank for projects on the master rates.

### 2 · One line in the Get projects flow

In its **Select** step, add (with a comma after the line before it):

```
"ratesFile": "@{item()?['RatesFile']}"
```

As with `pmEmail`: a Select passes on only what it names. Check in
**Administrator settings → Test projects flow** that `ratesFile` comes back.

### 3 · Flow 7 · Get agreed rates

**Create → Instant cloud flow → When an HTTP request is received**, trigger
settings as flow 1.

1. **Compose**, named `Incoming`: `@{json(triggerBody())}`

   The app sends `{ "action": "rates", "state": "VIC", "projectId": "7", "ratesFile": "…", "folderPath": "…" }`.

2. **SharePoint → Get item** on the project register, **Id**
   `@{outputs('Incoming')?['projectId']}`.

   The file is read from the register here, not from what the browser sent, so
   nobody holding the URL can ask for any other file.

3. **Compose**, named `File` — the path within the site, whichever form the
   column holds. In the **expression editor (fx)**:

   ```
   if(startsWith(toLower(body('Get_item')?['RatesFile']), 'http'),
      concat('/', join(skip(split(decodeUriComponent(uriPath(body('Get_item')?['RatesFile'])), '/'), 3), '/')),
      body('Get_item')?['RatesFile'])
   ```

   (A full address `https://…/sites/AXPVIC/Shared Documents/…/file.xlsx`
   becomes `/Shared Documents/…/file.xlsx`.)

4. **Condition** — a spreadsheet, and nothing else:

   ```
   @{or(endsWith(toLower(outputs('File')), '.xlsx'), endsWith(toLower(outputs('File')), '.xlsm'), endsWith(toLower(outputs('File')), '.csv'))}
   ```

   **If no:** **Response**, status `404`, body `{ "error": "no agreed rates" }`.

5. In **If yes**, **SharePoint → Get file content using path**:

   | Field | Value |
   |---|---|
   | Site Address | the site holding the project documents |
   | File Path | `@{outputs('File')}` |
   | Infer Content Type | **No** |

6. **Response**, status `200`, with the same two headers as flow 1
   ([step 6](POWER-AUTOMATE-SETUP.md#step6)). For its **Body**, pick
   **File Content** (from *Get file content using path*) from the dynamic
   content list. The flow then sends the workbook itself, which the app reads
   as it is. JSON with the file in base64 also works, if you would rather:

   ```
   { "file": "@{base64(body('Get_file_content_using_path'))}" }
   ```

7. A second **Response** after *Get file content using path*, status `404`,
   body `{ "error": "not found" }`, **Configure run after → has failed** only.
   The app then says the file named in the register is not there, and uses the
   master rates.

8. **Connect it:** Administrator settings → **Get agreed rates**, paste the
   URL and **Build the URLs in** like the others, or a Netlify environment
   variable `GET_AGREED_RATES_URL`.

### Checking it

Pick a project with a `RatesFile` and open **Schedule of rates**. The banner
should name the file and say how many rates it changed. Search for a line you
know was agreed differently: it should show the agreed rate, tagged *agreed*.
