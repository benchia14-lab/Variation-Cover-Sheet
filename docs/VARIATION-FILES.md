# Variation files — saving a whole variation to SharePoint and opening it again

A **variation file** is one `.json` file holding everything on all five tabs:

- the cover sheet — every field, the letterhead as issued, the drawings table
- inclusions, exclusions, general notes and qualifications, as picked
- every schedule of rates tab — names, quantities, comments, adjusted rates, notes
- the attachments themselves — drawings, markups, screenshots and emails

It is named after the variation and sits beside the PDF in the project's folder:

```
/Shared Documents/Projects/25-135/
    VAR-042 - RPZ Valve Relocation - Direction of Variation.pdf
    VAR-042 - RPZ Valve Relocation - Variation File.json
```

The variation log already brings the form back. It cannot bring back the
attachments, because a SharePoint list has nowhere to keep files. The variation
file can.

---

## How it works

| | What happens | Flow |
|---|---|---|
| **Save** | **Download PDF** files the PDF and then the variation file into the project folder (untick *Save it to the project's SharePoint folder with the PDF* on the review tab to stop that). **Save to SharePoint now** does the file alone, any time. | Flow 2 — **File the PDF**, unchanged |
| **Download** | **Download the file** on the review tab saves a copy to this computer. Needs no flow at all. | — |
| **Recall from the log** | Cover sheet → **Previous variations** → **Open**. The log row names its variation file; the app fetches it and restores everything, attachments included. If it cannot, it falls back to the log's copy of the form and says so. | Flow 6 — **Open a variation file** |
| **Recall by name** | Cover sheet → *Carry on with a saved variation:* **open one from SharePoint**, then give the file name. Shown only once flow 6 is connected. | Flow 6 |
| **Open from this computer** | The opening screen's **Open a saved variation file…**, or the cover sheet's **open a file from this computer**. It opens under its own office and project. | — |

A variation that comes back with a reference opens as itself, exactly like
reopening from the log: **Save to log** updates it, and a revision issues it as
a new entry.

---

## Saving needs nothing new

Flow 2 already writes whatever `fileName` it is given, with
`base64ToBinary(pdfBase64)` as the content, into the project's folder. The
variation file goes the same way: the app sends the JSON, base64-encoded, in
`pdfBase64`, with a `fileName` ending `Variation File.json`. Two fields tell the
two apart if your flow ever needs to:

| Field | PDF | Variation file |
|---|---|---|
| `fileKind` | `pdf` | `variation-file` |
| `fileName` | `… - Direction of Variation.pdf` | `… - Variation File.json` |

**One thing to check.** If you added the validation from the setup guide's
security section — *"respond 400 if `fileName` doesn't end `.pdf`"* — widen it
to allow `.json` too, or the PDF will file and the variation file will be
refused:

```
@{or(endsWith(outputs('Incoming')?['fileName'], '.pdf'), endsWith(outputs('Incoming')?['fileName'], 'Variation File.json'))}
```

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
{ "action": "open", "state": "VIC", "projectId": "7",
  "folderPath": "/Shared Documents/Projects/25-135",
  "fileName": "VAR-042 - RPZ Valve Relocation - Variation File.json" }
```

### Step 2 — take the folder from SharePoint, not from the browser

Exactly as flow 2, step 2: **SharePoint → Get item** on the project register
with **Id** `@{outputs('Incoming')?['projectId']}`, then **Compose** named
`Folder`:

```
@{coalesce(body('Get_item')?['FolderPath'], outputs('Incoming')?['folderPath'])}
```

Reading the folder from the register means nobody holding the URL can read a
file out of any folder they like.

### Step 3 — only ever a variation file

**Control → Condition**:

```
@{and(endsWith(outputs('Incoming')?['fileName'], 'Variation File.json'), not(contains(outputs('Incoming')?['fileName'], '/')), not(contains(outputs('Incoming')?['fileName'], '..')))}
```

**If no:** a **Response** with status `400` and body `{ "error": "not a variation file" }`.
This stops the flow being used to read anything else in the library.

### Step 4 — read it

In **If yes**, **SharePoint → Get file content using path**:

| Field | Value |
|---|---|
| Site Address | the site holding the project documents (the same as flow 2) |
| File Path | `@{concat(outputs('Folder'), '/', outputs('Incoming')?['fileName'])}` |
| Infer Content Type | **No** |

With *Infer Content Type* off, SharePoint hands back
`{ "$content-type": "application/octet-stream", "$content": "<base64>" }`, which
is what the app expects. (It also accepts the JSON itself, or a string, so a
flow that does it differently still works.)

### Step 5 — reply

**Response**, status `200`, body:

```
@{body('Get_file_content_using_path')}
```

Add the same two headers as flow 1, [step 6](POWER-AUTOMATE-SETUP.md#step6) —
`Content-Type: application/json` and `Access-Control-Allow-Origin`. Without the
second, the browser cannot read the reply, and unlike filing there is nothing to
fall back to: opening needs the answer.

### Step 6 — when the file is not there

Add a second **Response** after *Get file content using path*, status `404`,
body `{ "error": "not found" }`, and set its **Configure run after** to *has
failed* only. The app then says *"There is no variation file called … in that
folder"* instead of a timeout.

### Step 7 — connect it

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
   review tab. The two lines under the button should read *Filed to SharePoint:
   …pdf* and *Variation file saved to SharePoint: …json*.
2. Look in the project folder: both files are there.
3. On another computer (or a private window), pick the same office and project,
   open the variation from **Previous variations**. The status should read
   *Opened VAR-… with its attachments*, and the Documentation tab should show the
   drawing.

## Notes

- **Size.** Attachments are inside the file, so a variation with large drawing
  sets makes a large file — roughly the size of the attachments plus a third.
  Power Automate's HTTP trigger takes up to 100 MB.
- **Overwrites.** Saving again replaces the file of the same name, as Create
  file does for the PDF. A revision (`VAR-042.1`) has its own name, so its own file.
- **The log row.** The log write now also sends `variationFile` (the file's
  name). Map it to a column if you want to see it in the list; the app does not
  need you to, because the name is also inside the saved form.
