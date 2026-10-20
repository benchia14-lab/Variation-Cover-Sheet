# Variation Cover Sheet Generator

Produces a variation cover sheet as a real A4 PDF, filling most of it from two
registers so the person issuing it types only what is actually new.

```
open index.html            # works straight off the disk
python3 -m http.server     # or serve the folder, then http://localhost:8000
```

**To hand it to someone else**, bundle it into one file first:

```
python3 build-single-file.py      # -> Variation Cover Sheet.html
```

Stylesheet, scripts, the html2pdf library and the logo all inline, so the result
is a single file that runs with no server, no install and no network. Email it,
drop it on a shared drive, double-click it. Flow URLs are per browser *and* per
file location, so everyone pastes theirs once — and a rebuilt copy saved over
the old one keeps them.

## How a variation gets issued

**1 · Pick an office.** Eight tiles, one per state and territory. The choice
decides two things: which letterhead prints, and which slice of the project
register gets pulled. Both follow immediately.

**1b · The office's projects.** Every project in the register, each with its
number of variations and their value, and the office's totals across them.
Click one for its **dashboard**: every variation with its value ex GST and
status (Draft, Submitted, Approved, Rejected), approved and pending totals,
revisions grouped under the variation they revise, **Open** to carry on with
one and **+ New variation** to start another. Status is set on the dashboard;
a variation becomes *Submitted* when its PDF is downloaded. **Builder
commentary** on each row opens a window with the variation's timestamped
thread of what the builder has said, and the approved value and date, typed in
by hand rather than taken from the schedule. Each is saved to the log as it is
entered. Setup:
[docs/PROJECT-DASHBOARD.md](docs/PROJECT-DASHBOARD.md).

**2 · Pick a project.** The dropdown is the SharePoint project register, read
live through Power Automate: one register filtered to the state you chose, or a
register per state that the flow picks between. Either way you only ever see
your own state's projects.

Picking one fills in six fields at once — project, head contractor, recipient
address, attention, issued by, position. They then **fold away into a one-line
summary**, because they are the same on every variation for that job and only
stand between you and the fields you came to fill in. **Edit these** opens them
when a letter needs something different. The letter on the right always shows
them in full.

**3 · Type the rest.** Variation reference, site instruction, clause, Aconex
reference, drawings, description of works. These are per-variation and nothing
can pre-fill them.

**4 · Next: inclusions & exclusions.** The cover sheet no longer downloads on its
own; it is stage 1 of five, shown in the step bar along the top:

| Stage | What happens |
|---|---|
| 1 · Cover sheet | The letter, as above |
| 2 · Inclusions & exclusions | Every line on offer, none selected to start with, in four collapsible groups: Inclusions and Exclusions (`assets/scope-library.js`), General, and the schedule of rates' own Exclusions / Qualifications. Open a group and click **Include** or **Exclude** on a line (or **Add** for the notes); click again to leave it off. Lines can be added for one variation |
| 3 · Schedule of rates | The master schedule (`assets/schedule-of-rates.js`, generated from `registers/Schedule of Rates.xlsx`). One **tab per zone or area**: **+ New schedule** adds one, each is named, and it can be duplicated or deleted. Search the rates, enter **Add** and **Ded**, add a **comment** to any line, and **type over a rate** to adjust it for this variation (the contract rate stays shown, with a reset). Diff × Rate is totalled per section, plus the 5% design item when applied. Only measured lines print, each schedule on its own pages, with a summary of all of them first when there is more than one; GST is charged once on the total. Items not in the schedule go under *Additional items* with their own rate. The total also prints on the cover sheet as *Variation Value* |
| 4 · Documentation | **A · Drawings & markups** and **B · Approval & correspondence**: PDFs, images, and emails saved as `.eml`. A screenshot can be pasted straight in with Ctrl+V. Each gets a title and can be reordered |
| 5 · Review & download | Every page of the finished PDF, drawn in the page with pdf.js (not the browser's PDF viewer, which is blocked or blank in too many setups), with a checklist of each stage. **Download PDF** saves exactly what is shown and files it, as before |

**The PDF is kept under 3 MB** so it can go by email. Every generated page is
a picture, captured once and then compressed a step at a time until the file
fits; uploaded drawings stay exactly as uploaded unless they are what breaks
the budget, and then they are redrawn at 150 dpi (lower only if still needed).
The size is shown under **Download PDF**, with a warning if even the smallest
setting cannot get it under — which only happens when the attachments
themselves are too big. Photos are scaled to 2400 px on upload.

The PDF is one document: the letter, then the inclusions and exclusions, the
schedule of rates, and an index page per attachment section followed by the
attachments themselves. Every generated page carries the letterhead, and the
page numbers count the uploaded PDF pages too. Uploaded PDFs are bound in whole
(with pdf-lib), so a drawing keeps its vectors and its sheet size.

Stages 2 and 3 are saved to the variation log with the rest of the form, so
reopening a variation restores them. Attachments are not logged — they are
files — and have to be added again when re-issuing.

**Variation files.** Everything on all five tabs, attachments included, can be
kept as one `.json` file. **Download PDF** saves it into the project's
SharePoint folder beside the PDF (through the existing filing flow), and the
review tab can also save it on its own or download it. Reopening from
**Previous variations** fetches it back, attachments and all, once the optional
*Open a variation file* flow is connected; a downloaded copy opens from this
computer with no flow at all. Setup: [docs/VARIATION-FILES.md](docs/VARIATION-FILES.md).

**To update the rates**, replace `registers/Schedule of Rates.xlsx` and run

```
python3 tools/sor-to-js.py "registers/Schedule of Rates.xlsx"
```

then commit `assets/schedule-of-rates.js`. A rate is copied into a variation
when it is measured, so variations already logged keep the rates they were
issued at.

**5 · Download PDF.** The file saves to your machine *and* goes to the filing
flow, which writes it into that project's SharePoint folder. The line under the
button says which of those happened.

The letter on the right is the document, not a mock-up of it — the same markup
is what gets captured into the PDF.

## What comes from where

Everything narrows in one order — **state, then project, then variation
number** — which is the order the form asks for them and the order the log is
filtered in. Project ids are only unique within the register they came from, so
a register per state would otherwise pool two jobs' variation numbers under the
same id.

Variation numbers are allocated, not typed: the app reads the project's log and
takes the next one in sequence, copying whatever format is already in use. A
revision of an existing variation (`VAR-001.1`, `VAR-001A`) is its own entry and
does not consume a number.

Every variation is also logged. Entering a reference and saving writes a row to
a SharePoint list keyed by the project and that reference; **Previous
variations** on the form reopens any of them with every field, drawing and note
as issued.

| Section | Source |
|---|---|
| 1 · Letterhead | The state register — `assets/state-register.js`, shipped with the app |
| 2 · Project & recipient | The SharePoint project register, via Power Automate |
| 3 · Reference details | Typed |
| 4 · Drawing reference | Typed |
| 5 · Description of works | Typed, optionally reworded by a flow |
| 6 · Letter text | Intro and closing default per state; *Issued by* and *Position* come from the project register |

## Who can open it

Microsoft sign-in, per the Internal Tool Sign-In Standard: anyone not signed in
with an Axis account is sent to `login.html` first.
[docs/SIGN-IN.md](docs/SIGN-IN.md) covers it, including what it does **not**
protect — the check runs in the browser, so the page itself is still served to
anyone who asks for it.

## Setting it up

1. **Fill in the state register** — open `registers/State Register.xlsx`, fill
   the yellow cells for each state you trade in, and paste the values into
   `assets/state-register.js`. Or do it in the app: Settings → State register →
   Export as file. Either way, commit it so everyone gets the same letterhead.
2. **Build the SharePoint list** — upload
   `registers/Variation Project Register.xlsx` via **New → List → From Excel**,
   then fix three column types. Full detail in
   [docs/SHAREPOINT-REGISTERS.md](docs/SHAREPOINT-REGISTERS.md).
3. **Put it online** — [docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md). Do this
   before the flows: they need the site's address baked into a CORS header.
4. **Build the flows** — [docs/POWER-AUTOMATE-SETUP.md](docs/POWER-AUTOMATE-SETUP.md).
5. **Paste the flow URLs** — Settings → Power Automate flows, then
   **Test projects flow**.
6. **Lock the administrator screen** — Settings → Administrator settings → C →
   **Create the file**, drop
   the downloaded `settings-password.js` into `assets/`, deploy again. Optional,
   and off until you set it. [docs/SETTINGS-PASSWORD.md](docs/SETTINGS-PASSWORD.md)
   says what it does and does not protect.

Step 5 is per person per device unless the site holds the URLs for you — see
[docs/FLOW-URLS-ON-THE-SERVER.md](docs/FLOW-URLS-ON-THE-SERVER.md), which puts
them in Netlify's environment variables behind a small function so no browser
ever sees one. Either way a Power Automate trigger URL is a credential and never
goes near the repository.

## It works with the flows missing

Every connection degrades on its own rather than taking the app with it.

| Missing | What happens |
|---|---|
| The server-side function | Every flow falls back to the URL pasted in Settings, exactly as before |
| Projects flow | The dropdown is replaced by a plain text field. Everything else is unchanged |
| Filing flow | The PDF downloads as normal and says it wasn't filed |
| The CORS header on the filing flow | The file is still delivered, blind; the app says to confirm it in SharePoint rather than naming the path |
| Wording flow | "Write professionally" tidies punctuation locally, and says that's all it did |
| The variation log flows | The generator works exactly as before; nothing is recorded and nothing can be reopened |
| A state's register row | The tile is greyed out; picking it gives you an empty letterhead to type into |
| All three | A working cover sheet generator that produces the same PDF |

No flow failure is ever silent, and none of them stops you getting the PDF.

## The PDF

Built as real A4 pages rather than one long image sliced up, so the letterhead
repeats on every page, footers carry `Page n of m`, the reference table flows
between pages without splitting a row, and the drawing table repeats its column
headings when it runs on. If `html2pdf` can't run at all, the button falls back
to the browser's print dialog with the same paginated document.

## Layout of the code

```
index.html                markup for all four views
assets/app.js             form, preview, pagination, filing, settings, routing
assets/state-register.js  section 1 — the per-state letterhead rows
assets/flows.js           the Power Automate client
assets/settings-password.js  salt and hash of the Settings password, or empty
assets/settings-lock.js   checks it; the half that never changes
assets/logo.js            default letterhead mark as a data URI
assets/styles.css         styling, including the A4 page geometry
assets/flow-config.js     flow URLs built into the deployment, or blank
assets/flow-urls.js       reads them; the half that never changes
login.html, msal-browser.min.js, app-config.js, axis services group.jpg
                          the Internal Tool Sign-In Standard's files, unedited
favicon.ico, apple-touch-icon.png   the Axis mark
netlify/functions/flow.js calls the flows server-side, so their URLs stay
                          in Netlify's environment and never reach a browser
vendor/                   html2pdf.js 0.10.1, bundled locally
registers/                fill-in workbooks and CSV seeds for both registers
docs/                     setup guides in Markdown; docs/word/ holds .docx copies
                          (ROUTING-BY-STATE.md stands alone: flow 1, one list per state)
tools/register-to-js.py   office register workbook -> assets/state-register.js
tools/add-logo.py         keys a logo's background off and stores it per office
tools/md-to-docx.js       regenerates docs/word/*.docx from the Markdown guides
                          (the only thing here with a dependency: npm install)
tools/make-deploy-folder.py      builds the folder that gets dragged onto Netlify
tools/set-settings-password.js   the same thing from a terminal, if you have Node
tools/set-flow-urls.js    builds the flow URLs in from a terminal
build-single-file.py      bundles all of the above into one standalone .html
netlify.toml              unused today — see docs/DEPLOY-NETLIFY.md
```

Nothing here is compiled and nothing is installed to run the app. `npm install`
is needed only to regenerate the Word copies of the guides.

## Where things are stored

In the browser's local storage, per browser and per device: the flow URLs, any
state-register edits made in Settings, an uploaded logo, and the dropdown
suggestions built from what you have typed before. The Settings unlock, when a
password is set, is kept for the tab's session only. Nothing else is kept —
a variation lives in its PDF and in SharePoint, not in the app.
