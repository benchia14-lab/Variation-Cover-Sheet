# Variation files — keeping a whole variation in SharePoint and opening it again

A **variation file** is one `.json` file holding everything on all five tabs:

- the cover sheet — every field, the letterhead as issued, the drawings table
- inclusions, exclusions, general notes and qualifications, as picked
- every schedule of rates tab — names, quantities, comments, adjusted rates, notes
- the drawing and day sheet tables
- the attachments themselves — drawings, markups, day sheets, screenshots and
  emails, each with the drawing or day sheet it was attached to

It is kept as an **attachment on the variation's own row in the variation
log** — the same row the dashboard shows, written by the same push. The PDF
still goes to the project folder; the variation file does not.

```
Variation log  ›  VAR-042  (Warrnambool Hospital 25-135)
    Attachments:  VAR-042 - RPZ Valve Relocation - Variation File.json

/Shared Documents/Projects/25-135/
    VAR-042 - RPZ Valve Relocation - Direction of Variation.pdf
```

The log's columns bring the form back. Only the variation file brings back the
attachments.

---

## How it works

| | What happens | Flow |
|---|---|---|
| **Save** | **Download PDF** writes the log row and sends the variation file with it, and the flow attaches it to that row (untick *Attach it to this variation's row in the SharePoint log with the PDF* on the review tab to stop that). **Attach to the log now** does the same at any time. Each save replaces the row's previous variation file. | Flow 5 — **log write**, with the steps below added |
| **Download** | **Download the file** on the review tab saves a copy to this computer. Needs no flow at all. | — |
| **Recall from the log** | Dashboard **Open**, or cover sheet → **Previous variations** → **Open**. The app fetches the row's variation file and restores everything, attachments included. If it cannot, it falls back to the log's copy of the form and says so. | Flow 6 — **Open a variation file** |
| **Recall by reference** | Cover sheet → *Carry on with a saved variation:* **open one from SharePoint**, then give the reference. Shown only once flow 6 is connected. | Flow 6 |
| **Open from this computer** | The opening screen's **Open a saved variation file…**, or the cover sheet's **open a file from this computer**. It opens under its own office and project. | — |

A variation that comes back with a reference opens as itself, exactly like
reopening from the log: **Save to log** updates it, and a revision issues it as
a new entry.

---

## Before you start: turn attachments on

**List settings → Advanced settings → Attachments: Enabled** on the variation
log (on each state's log, if there is one per state). That built-in
*Attachments* column is where the file goes; no column of your own is needed.

---

## Flow 5 · the log write — four more steps

The app now sends, with the row, an `attachment`:

```json
"attachment": { "fileName": "VAR-042 - RPZ Valve Relocation - Variation File.json",
                "contentBase64": "eyJhcHAiOiJ2YXJpYXRpb24tY292ZXItc2hlZXQi…" }
```

It is there only on a push that carries the file — Download PDF, or *Attach to
the log now*. A save from the dashboard (status, approval, commentary) never
sends one, and leaves the row's attachment alone.

Add these **after** the Create / Update condition, and **before** the
Response:

1. **SharePoint → Get items**, renamed `Get_row` — the row just written,
   found the same way as step 2:
   - Site Address and List Name: the same as step 2
   - Filter Query: the same as step 2
   - Top Count: `1`

2. **Control → Condition** — is there a file?

   | Side | Enter |
   |---|---|
   | Left | `if(empty(outputs('Incoming')?['attachment']), 'none', 'file')` — **via the expression editor (fx)** |
   | Operator | **is equal to** |
   | Right | `file` — typed straight into the box |

   **If no:** nothing.

3. In **If yes**, clear out the row's old variation file:
   - **SharePoint → Get attachments** — Site Address and List Name as above,
     **Id** `@{first(body('Get_row')?['value'])?['ID']}`
   - **Data Operation → Filter array** — **From**
     `@{body('Get_attachments')}`, and in advanced mode:
     `@endsWith(item()?['DisplayName'], 'Variation File.json')`
   - **Control → Apply to each** (the new designer calls it *For each*) over
     `@{body('Filter_array')}`, and inside it **SharePoint → Delete
     attachment** — Site Address and List Name as above, **Id** as above,
     **File Identifier** `@{item()?['Id']}`

   (*Add attachment* refuses a file name the row already has, and a renamed
   variation would otherwise leave its old file behind. Clearing first keeps
   exactly one variation file per row.)

4. Still in **If yes**, after the loop (not inside it): **SharePoint → Add
   attachment**

   | Field | Value |
   |---|---|
   | Site Address, List Name | as above |
   | Id | `@{first(body('Get_row')?['value'])?['ID']}` |
   | File Name | `@{outputs('Incoming')?['attachment']?['fileName']}` |
   | File Content | `@{base64ToBinary(outputs('Incoming')?['attachment']?['contentBase64'])}` |

Leave the **Response** last, running only when everything before it
**succeeded** (its default). If attaching fails, the flow then fails rather
than answering *ok*. The app sees that, saves the row again **without** the
file, and tells whoever pressed the button to download the variation file
instead. A failed attachment never costs the row its update.

---

## Flow 6 · Open a variation file

**Create → Instant cloud flow → When an HTTP request is received.** Trigger
settings exactly as in flow 1 (*Who can trigger: Anyone*, method POST).

### Step 1 — parse the request

**Data Operation → Compose**, named `Incoming`:

```
@{json(triggerBody())}
```

The app sends:

```json
{ "action": "open", "state": "VIC", "projectId": "7", "variationRef": "VAR-042",
  "fileName": "VAR-042 - RPZ Valve Relocation - Variation File.json" }
```

`fileName` is only a hint (it can be empty). The row's variation file is found
by its ending, so a variation renamed since it was saved still opens.

### Step 2 — the variation's row

**SharePoint → Get items** on the variation log — the same list, and the same
**Filter Query**, as flow 5's step 2 (state, project and reference). Top
Count `1`.

### Step 3 — its variation file

- **SharePoint → Get attachments** — **Id**
  `@{first(body('Get_items')?['value'])?['ID']}`
- **Data Operation → Filter array** — **From** `@{body('Get_attachments')}`,
  advanced mode `@endsWith(item()?['DisplayName'], 'Variation File.json')`
- **SharePoint → Get attachment content** — **Id** as above, **File
  Identifier** `@{last(body('Filter_array'))?['Id']}`

Only a file ending `Variation File.json`, on the row the request names, can
ever come back: nobody holding the URL can read anything else in the list or
the library.

### Step 4 — reply

**Response**, status `200`, body:

```
{ "$content": "@{base64(body('Get_attachment_content'))}" }
```

Add the same two headers as flow 1, [step 6](POWER-AUTOMATE-SETUP.md#step6) —
`Content-Type: application/json` and `Access-Control-Allow-Origin`. Without the
second, the browser cannot read the reply, and unlike filing there is nothing to
fall back to: opening needs the answer.

### Step 5 — when there is no file

Add a second **Response** after *Get attachment content*, status `404`, body
`{ "error": "not found" }`, with **Configure run after** set to *has failed*
**and** *is skipped*. No row, or a row with no variation file, both end there,
and the app says *"There is no variation file attached to VAR-042 in the log"*
and opens the log's copy of the form instead.

### Step 6 — connect it

Copy the trigger URL. Then either:

- **Administrator settings → Open a variation file**, paste it, **Save endpoints**,
  and **Build the URLs in** as for the other flows; or
- on Netlify, add an environment variable **`OPEN_VARIATION_FILE_URL`** holding
  the URL and redeploy (see [DEPLOY-NETLIFY.md](DEPLOY-NETLIFY.md)).

**Connect to the flows** in Administrator settings then lists it with the
others. The cover sheet's *open one from SharePoint* link appears once it is
connected.

---

## Checking it end to end

1. Issue a test variation with a drawing attached: **Download PDF** on the
   review tab. The log line on the cover sheet should read *Saved to the log
   as VAR-…, with its variation file attached.*
2. Open the variation log in SharePoint: the row has a paperclip, and the
   attachment is the `… - Variation File.json`. The project folder holds the
   PDF only.
3. On another computer (or a private window), pick the same office and
   project, and open the variation from the dashboard. The status should read
   *Opened VAR-… with its attachments*, and the Documentation tab should show
   the drawing.

## Notes

- **Size.** Attachments are inside the file, so a variation with large drawing
  sets makes a large file — roughly the size of the attachments plus a third.
  Power Automate's HTTP trigger takes up to 100 MB. Through the Netlify proxy
  (flow URLs held on the server) a request is capped at about 6 MB; a bigger
  one is refused, and the app saves the row without the file and says so.
- **One file per row.** Saving again replaces the row's variation file. A
  revision (`VAR-042.1`) is its own row, so it keeps its own.
- **Variations saved before this change** have their variation file in the
  project folder. They still reopen from the log, without their attachments;
  open the folder's `.json` with *open a file from this computer* to get those
  back, then **Attach to the log now** to move it onto the row.
- **The log row.** The log write also sends `variationFile` (the file's name).
  Map it to a column if you want to see it in the list; the app does not need
  you to.
