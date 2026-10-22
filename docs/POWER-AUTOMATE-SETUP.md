# Building the flows, step by step

Two flows make the app work, and a third is optional.

| Flow | Does | Without it |
|---|---|---|
| **1 · Get projects** | Reads the SharePoint project register for one state | The dropdown is empty; every project detail is typed by hand |
| **2 · File the variation** | Writes the finished PDF into the project's folder | The PDF still downloads; it just isn't filed |
| **4 · Variation log (read)** | Lists and reopens past variations for a project | No history; every variation starts from blank |
| **5 · Variation log (write)** | Creates or updates a variation's row in the log | Nothing is recorded, and nothing can be reopened |
| **3 · Write professionally** | Turns rough notes into a formal description | The button falls back to tidying punctuation locally |

Flows 4 and 5 are a pair — the log is no use readable but not writable, or the
reverse. Build them together or not at all.

Before you start, build the project register — [SHAREPOINT-REGISTERS.md](SHAREPOINT-REGISTERS.md).

### One thing to know up front

**"When an HTTP request is received" and "Response" are premium actions.** They
need a Power Automate Premium licence (or a per-flow plan) on the account that
*owns* the flow. Everyone using the app runs on the owner's licence, so you need
one licence, not one per person. If your tenant has no premium licensing this
design will not work, and the fallback in
[§ If you can't use premium](#if-you-cant-use-premium) is the way round it.

**The flows read a text body, not a JSON one.** The app deliberately sends its
JSON with `Content-Type: text/plain`. That sounds backwards, and here is why:
`application/json` makes the browser send a preflight `OPTIONS` request first,
and an HTTP trigger locked to POST answers `OPTIONS` with a 405 that the browser
reads as a refusal — the flow never sees the real request at all. `text/plain`
is one of three content types the browser is allowed to send without asking
permission first, so the request arrives.

The cost is one expression: the flow reads `json(triggerBody())` instead of the
trigger's own parsed output. Every step below does this. Don't "fix" it.

---

## Flow 1 · Get projects

**Create → Instant cloud flow → When an HTTP request is received.**

### Step 1 — the trigger

Open the trigger card. Leave **Request Body JSON Schema** empty (we parse the
body ourselves). Under **Advanced parameters → Method**, choose **POST**.

Under **Who can trigger the flow**, pick **Anyone** — the `sig=` value in the
URL is what protects it. Save the flow once now; the URL only appears after the
first save.

### Step 2 — read the state out of the request

Add **Data Operation → Compose**. Name it `State`. Inputs:

```
@{json(triggerBody())?['state']}
```

### Step 3 — send the state to its own list

The app posts `{"state":"VIC"}` the moment someone picks an office, so the flow
already knows where to look. All it has to do is choose. Two ways; the first is
far less work for eight states.

#### A · A lookup map (recommended)

One place holding every state's site and list, and no branching at all.

**1. Compose**, named `Sites`. Paste this as the Inputs — it is an object, not a
string, so do not wrap it in quotes:

```json
{
  "VIC": { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPVIC", "list": "Variation Project Register" },
  "NSW": { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPNSW", "list": "Variation Project Register" },
  "QLD": { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPQLD", "list": "Variation Project Register" },
  "SA":  { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPSA",  "list": "Variation Project Register" },
  "WA":  { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPWA",  "list": "Variation Project Register" },
  "NT":  { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPNT",  "list": "Variation Project Register" },
  "ACT": { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPACT", "list": "Variation Project Register" },
  "NZ":  { "site": "https://axisplumbingptyltd.sharepoint.com/sites/AXPNZ",  "list": "Variation Project Register" }
}
```

**2. Compose**, named `Target` — the one row that matches:

```
@{outputs('Sites')?[outputs('State')]}
```

The key is an expression, so the state chosen on the opening screen picks the
entry. A state that is not in the map gives nothing, which step 4 handles.

**3. Initialize variable**, named `Rows`, type **Array**, value empty.

**4. Condition** — is this a state we know?

| Side | Enter |
|---|---|
| Left | `if(empty(outputs('Target')), 'none', 'found')` — via the expression editor (fx) |
| Operator | **is equal to** |
| Right | `found` — typed into the box |

*(The same shape as flow 5's condition, and for the same reason: two strings
that cannot be read as anything else. See [why](#why-the-condition-is-written-that-way).)*

**If yes**, inside the True branch:

- **SharePoint → Get items**, using **Enter custom value** on both:
  - Site Address — `@{outputs('Target')?['site']}`
  - List Name — `@{outputs('Target')?['list']}`
  - Filter Query — `Active eq 1`, or leave it empty
  - Top Count — `500`
- **Set variable** `Rows` to `@{body('Get_items')?['value']}`

**If no**, leave the False branch empty. `Rows` stays empty and the app shows an
empty dropdown rather than another state's projects.

Adding a ninth office later is one line in the map.

#### B · A Switch, if you prefer to see the branches

Two **Initialize variable** actions (String): `SiteAddress` and `ListName`. A
**Switch** on `@{outputs('State')}`, a case per state setting both, and a
**Default** that sets nothing. Then one **Get items** with **Enter custom
value** on Site Address and List Name.

Same result, about fifteen more actions to click together.

#### C · One register holding every state

If you would rather keep a single list, no routing is needed:

- **Site Address** — the site holding it
- **List Name** — `Variation Project Register`
- **Filter Query** — `State eq '@{outputs('State')}' and Active eq 1`
- **Top Count** — `500`

Drop `and Active eq 1` if you did not add that column.

#### With a list per state

No `State eq` filter is wanted: the list *is* the state. You can leave the
`State` column out of those registers entirely — the app treats a row with no
state as belonging to the register it came from.

**One thing this changes.** Each list numbers its own items from 1, so project
id 2 exists in VIC *and* in NSW. That is why the variation log narrows on state
before project, and why `State` must be written to the log and filtered on in
flows 4 and 5. With a single register that is belt and braces; with a list per
state it is load-bearing.

If a filter errors, the column's *internal* name is not what you typed. Check
List settings → click the column → read `Field=` at the end of the address bar.

### Step 4 — hand the rows over

**The simplest thing that works: don't shape them at all.** Skip straight to
step 5 and return Get items' own output. Every column arrives under its real
SharePoint name, and the app matches names ignoring case, spaces, underscores
and `_x0020_` escapes, so it copes.

This is the recommended route, and not only because it is shorter. The
alternative below means hand-typing every column name into a Select map, and a
name typed slightly wrong does not fail — it returns *empty*. The flow goes
green, the projects load, and only the fields on the form are blank, which
sends you looking in the app for a fault that is in the flow.

If you do shape them, check the result in **Settings → Test projects flow →
What the flow returned** before moving on. It lists every column the flow sent
and flags any that arrived empty.

### Step 4b — shape the rows (optional)

Add **Data Operation → Select**. **From** is `value` from Get items. Switch the
map to text mode (the icon on the right) and paste:

```json
{
  "id": "@{item()?['ID']}",
  "project": "@{item()?['Title']}",
  "state": "@{item()?['State']?['Value']}",
  "headContractor": "@{item()?['HeadContractor']}",
  "recipientAddress": "@{item()?['RecipientAddress']}",
  "attention": "@{item()?['Attention']}",
  "issuedBy": "@{item()?['IssuedBy']}",
  "position": "@{item()?['Position']}",
  "pmEmail": "@{item()?['PmEmail']}",
  "ratesFile": "@{item()?['RatesFile']}",
  "folderPath": "@{item()?['FolderPath']}",
  "siteUrl": "@{item()?['SiteUrl']}",
  "clauseRef": "@{item()?['ClauseRef']}"
}
```

**If your flow already has this Select step, add the `pmEmail` line** — a Select
only passes on the fields it names, so without it the PM email never reaches the
app, and the cover sheet says *Missing: PM email* when a project is picked.

`State` is a Choice column, so it arrives as an object and needs `?['Value']`.
Plain text columns don't. If you made `IssuedBy` a **Person** column, use
`@{item()?['IssuedBy']?['DisplayName']}`.

*(The app understands raw SharePoint output too: it matches column names
ignoring case, spaces, underscores and SharePoint's `_x0020_` escapes, so
`Head Contractor`, `HeadContractor` and `Head_x0020_Contractor` all land in the
same field. Shaping it here still helps — the next person reading the flow can
tell what it returns.)*

**The one case no flow can rescue by name** is a list built with SharePoint's
**From Excel** import, which often calls its columns `field_1`, `field_2` and so
on. Nothing can infer meaning from that. Either add this Select step so the flow
hands over proper names, or leave the flow as it is and map the columns once in
the app: **Settings → Test projects flow → Match the register columns**, which
lists the real column names beside a sample value from your register.

### Step 5 — reply

Add **Response**.

- **Status Code** — `200`
- **Body** — whichever matches how you got the rows:

  | You built | Body |
  |---|---|
  | A lookup map, or a Switch (step 3 A or B) | `{ "projects": @{variables('Rows')} }` |
  | One register, no routing (step 3 C) | `{ "projects": @{body('Get_items')?['value']} }` |
  | Either, plus the Select in step 4b | `{ "projects": @{body('Select')} }` |

### Step 6 — the header that makes it readable <a name="step6"></a>

Still on the Response card, open **Advanced parameters → Headers** and add two:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Access-Control-Allow-Origin` | `https://your-app-url` |

**This is the step everything hinges on.** Without it the request still reaches
the flow and the flow still answers, but the browser refuses to hand the reply
to the app and you get *"The browser could not reach the flow"* — which looks
like a network problem and isn't one.

Use the app's real origin — scheme and host, no trailing slash, e.g.
`https://axis-variations.netlify.app`. `*` works and is one line shorter; it
also lets any website on the internet read your project register through a
visitor's browser. Name the origin.

### Step 7 — copy the URL

**Save**, then reopen the trigger card and copy the **HTTP POST URL**.

In the app: **Settings → Get projects**, paste, **Save endpoints**, then
**Test projects flow**. It should say how many projects came back and name the
first one.

---

## Flow 2 · File the variation

**Create → Instant cloud flow → When an HTTP request is received.** Trigger
settings exactly as in flow 1.

### Step 1 — parse the payload

**Data Operation → Compose**, named `Incoming`:

```
@{json(triggerBody())}
```

Everything below refers to it as `outputs('Incoming')?['fieldName']`. The full
list of fields is in [§ What the app sends](#what-the-app-sends).

### Step 2 — take the folder from SharePoint, not from the browser

**SharePoint → Get item**:

- **Site Address** — the register's site
- **List Name** — `Variation Project Register`
- **Id** — `@{outputs('Incoming')?['projectId']}`

Then **Compose**, named `Folder`:

```
@{coalesce(body('Get_item')?['FolderPath'], outputs('Incoming')?['folderPath'], '/Shared Documents/Variations/Unfiled')}
```

The app does send `folderPath`, so you *can* skip this step and use it
directly. Reading it back from the list is better: it means a person with the
flow URL can't direct a file into any folder they like by editing the request,
and a folder corrected in SharePoint takes effect without anyone reloading the
app. The `coalesce` keeps an unmatched project out of the bin by parking it in
a fallback folder.

### Step 3 — write the file

**SharePoint → Create file**:

| Field | Value |
|---|---|
| Site Address | the site holding the project documents |
| Folder Path | `@{outputs('Folder')}` |
| File Name | `@{outputs('Incoming')?['fileName']}` |
| File Content | `@{base64ToBinary(outputs('Incoming')?['pdfBase64'])}` |

`base64ToBinary` is the whole trick. Hand it the base64 string directly and you
get a PDF full of text that no reader will open.

**If a file of that name already exists, Create file overwrites it.** That is
usually what you want when someone re-issues `VAR-042` after a correction. If
you'd rather keep both, set File Name to:

```
@{concat(outputs('Incoming')?['variationRef'], ' - ', formatDateTime(utcNow(),'yyyy-MM-dd HHmm'), ' - ', outputs('Incoming')?['variationDescription'], '.pdf')}
```

### Step 4 — log it (optional)

If you built the **Variations Issued** list, add **SharePoint → Create item**
here and map the payload fields to it. `Document` gets `@{body('Create_file')?['Path']}`.

### Step 5 — reply

**Response**, status `200`, body:

```
{ "path": @{body('Create_file')?['Path']}, "webUrl": @{body('Create_file')?['{Link}']} }
```

Add the same two headers as [step 6 above](#step6). The app shows the path it
gets back, so the person can see where the file went.

Without the header, filing still works — the app sends the file a second time
in a mode the browser allows but won't let it read, and says *"Sent to the
filing flow… check SharePoint to confirm it landed"* instead of naming the path.
Everything lands; you just lose the confirmation.

It only sends twice **once**. The app remembers, per URL, that this flow's reply
can't be read and writes to it blind from then on, so a misconfigured flow
doesn't double every upload forever. But that first variation does arrive twice.
With the default File Name that's harmless — Create file overwrites, so you end
up with one file. With the **timestamped** File Name below you get two copies a
second apart, and one of them needs deleting. Add the header and the question
never comes up.

### Step 6 — connect it

Copy the URL into **Settings → File the PDF**, save, and issue a test
variation. The line under the Download PDF button tells you what happened.

---

## Flow 4 · The variation log — read

One row per variation the generator produces, in a second SharePoint list.
Build the list first: **Variation Log**, columns as in
`registers/Variation Log.xlsx`.

**Create it by hand — New → List → Blank list — not From Excel.** The import
names internal columns `field_1`, `field_2` and so on, which is what made the
project register fill nothing. Type each column name without spaces, then rename
the display name afterwards; the internal name keeps the clean spelling.

Three columns must be **Multiple lines of text, plain**: `RecipientAddress`,
`DescriptionOfWorks`, `Notes`, `DrawingsText` and above all `Payload`, which
holds the whole form as JSON and is what a reopened variation is rebuilt from.

### The flow

**When an HTTP request is received** → trigger settings as in flow 1.

1. **Compose**, named `Incoming`: `@{json(triggerBody())}`
2. **SharePoint → Get items**
   - List Name: `Variation Log`
   - Filter Query:
     `State eq '@{outputs('Incoming')?['state']}' and ProjectId eq @{outputs('Incoming')?['projectId']}`
   - Top Count: `500`

<a name="perstatelog"></a>
> **A log per state?** If the log lives on each state's own site — a
> `Variation History - VIC` beside a `Variation History - NSW` — then a flow
> pointed at one site and list serves that state only, and every other state's
> variations land in the wrong log or fail outright.
>
> Do the same as step 3b: `Initialize variable` for `SiteAddress` and
> `ListName`, a **Switch** on `@{outputs('Incoming')?['state']}` setting both
> per case, then one **Get items** with **Enter custom value** on Site Address
> and List Name. Give the Switch a Default that sets nothing, so an unmapped
> state reads an empty log rather than another state's.
>
> **Flows 4 and 5 must switch the same way and agree.** Read from one list and
> write to another and the app shows a history it cannot add to.
>
> Keep the `State eq` clause in the filter even then. It costs nothing and
> catches a Switch case pointed at the wrong list, which is otherwise silent.
3. **Response**, status `200`, body `@{body('Get_items')}`, with the same two
   headers as [step 6](#step6).

That is the whole flow. It deliberately ignores the `variationRef` the app
sends: filtering on the project alone returns that project's history in one
call, payloads included, so opening a past variation needs no second round
trip. The app picks the reference it wants out of what comes back.

`ProjectId` is a Number column, so its value is **not** quoted in the filter.
`State` and `VariationRef` are text, so those two are. Get either wrong and the query
fails outright rather than returning the wrong rows, which is the better way
round.

### Why state as well as project

State, then project, then variation number — the same order the form asks for
them, and the order the app narrows the log in.

Filtering on the project alone looks sufficient, because a SharePoint list
numbers its items uniquely. It stops being sufficient the moment there is more
than one project register: a site per state invites a register per state, and
then project id 2 is a VIC job **and** an NSW one. Their variations would pool,
and the next number allocated on either could belong to the other.

The app narrows state before project regardless of what the flow filters on, so
this holds even if the filter query is wrong. Filtering in the flow as well
keeps the response small and means the app is enforcing the rule rather than
repairing it.

**For the projects page**, the filter should also answer for a whole office when
no project is sent — one expression in place of the filter above; see
[PROJECT-DASHBOARD.md § 3](PROJECT-DASHBOARD.md#3--let-flow-4-the-log-read-answer-for-a-whole-office).

If a project ever accumulates so many variations that the response gets heavy,
add `and VariationRef eq '@{outputs('Incoming')?['variationRef']}'` to the filter
when `variationRef` is present. Nothing in the app needs changing for that.

## Flow 5 · The variation log — write

**When an HTTP request is received** → trigger settings as in flow 1.

1. **Compose**, named `Incoming`: `@{json(triggerBody())}`
2. **SharePoint → Get items** — find the row if it already exists
   - Site Address and List Name: whatever flow 4 reads from. With a log per
     state, switch on the state here too — the two flows must resolve to the
     same list
   - Filter Query:
     `State eq '@{outputs('Incoming')?['state']}' and ProjectId eq @{outputs('Incoming')?['projectId']} and VariationRef eq '@{outputs('Incoming')?['variationRef']}'`
   - Top Count: `1`
3. **Condition** — did a row come back?

   | Side | Enter |
   |---|---|
   | Left | `if(empty(body('Get_items')?['value']), 'none', 'found')` — **via the expression editor (fx)** |
   | Operator | **is equal to** |
   | Right | `found` — typed straight into the box |

   **If yes → SharePoint → Update item.** Id is
   `@{first(body('Get_items')?['value'])?['ID']}`.

   **If no → SharePoint → Create item.**

   ### Why the condition is written that way

   Counting the rows and comparing the count to zero is the obvious version, and
   both spellings of it fail — differently, which is what makes this worth
   understanding once.

   A condition operand **typed into the box** is text. One added through the
   **expression editor** is whatever the expression returns. So
   `length(…)` against `0` puts a number on one side and, often, text on the
   other. Power Automate's operators then split two ways:

   - `is greater than` **requires matching types**, so it fails loudly:
     *"the template language function 'greater' expects two parameter of
     matching types … 'String' and 'Integer' that do not match"*.
   - `is equal to` / `is not equal to` **do not**. Values of different types are
     simply not equal. So `"0"` *is not equal to* `0` comes back **true**, the
     flow takes the True branch on an empty result, and Update item runs with
     nothing to update:
     *"The resolved string values for the following parameters are invalid, they
     may not be null or empty: 'id'"*.

   That second one is the dangerous shape: no error until the branch it should
   never have taken.

   The form above removes the question. `if(empty(…), 'none', 'found')` returns
   one of two strings, and `found` typed into a box can only be a string —
   there is no number anywhere for the designer to infer. `empty()` covers both
   an empty array and a null one.

   Three things to check once it is in, because each on its own sends every run
   down the wrong branch:

   - **The operator is `is equal to`.** Inverted, an empty result goes to Update
     item and fails on a missing id — the same symptom as before.
   - **The right-hand value matches the expression exactly, including case.**
     Comparison is case-sensitive: `Found` does not equal `found`, so a
     capitalised value never matches and every run creates.
   - **There is only one row in the condition.** The designer leaves an empty
     `Choose a value / Choose a value` row behind when you add one by accident;
     joined with **And** it drags the whole condition false. Remove it from the
     `…` menu at the end of that row.

   Two mappings are worth being deliberate about before the rest.

   **`Payload` takes `@{outputs('Incoming')?['payload']}`** — the payload
   *field* of the request, which is the form as a JSON string. Not the Compose
   action. This is why the Compose is called `Incoming` rather than `Payload`:
   with both named the same, picking "Payload" from dynamic content stores the
   entire request instead, which parses perfectly, carries no form, and restores
   nothing when the variation is reopened.

   **`ProjectId` takes `@{outputs('Incoming')?['projectId']}`.** Leave it empty
   and rows cannot be attributed to a project, so the app has to work it out
   from the saved form — and anything it cannot place is left out of that
   project's history rather than shown under the wrong one.

   Then the rest. **`Title` takes `project`, not the
   reference** — the log reads by project, so that is what SharePoint shows as
   each row's name. The reference goes in `VariationRef`, with `BaseRef` and
   `Revision` beside it. Then `ProjectId`, `State`, `VariationDescription`,
   `HeadContractor`,
   `RecipientAddress`, `Attention`, `IssuedBy`, `Position`, `PmEmail` (from `pmEmail`),
   `SiteInstructionRef`, `ClauseRef`, `AconexRef`, `ContractorDirection`,
   `EmailRef`, `DescriptionOfWorks`, `Notes` (from `notes`), `DrawingsText`,
   `FolderPath`, `DownloadedAt`, `UpdatedAt`, and `Payload` — and, for the
   project dashboard, `Status`, `ValueExGst`, `ApprovedValue` and
   `ApprovedDate` (see [PROJECT-DASHBOARD.md](PROJECT-DASHBOARD.md)).

4. **Variation file (optional).** To keep each variation's file — attachments
   and all — on its row, add the four steps in
   [VARIATION-FILES.md](VARIATION-FILES.md#flow-5--the-log-write--four-more-steps)
   here, and turn on attachments for the list.

5. **Response**, status `200`, body `{ "ok": true }`, with the same two headers.

**Match on `VariationRef`, never on `Title`.** `Title` holds the project name,
which every variation on that job shares — matching on it would find the
project's first variation every time and overwrite it, quietly, on every save.

Matching on the project **and** the reference together is what keeps the log
honest: re-issuing VAR-101 updates its row rather than adding a second one, and
VAR-101 on another job stays a separate variation. Turn on versioning for the
list (List settings → Versioning settings) and you get the full edit history
behind each row without the register itself filling up with duplicates.

### Numbering follows from this

Once both log flows are connected the app stops asking for a variation number
and allocates it: picking a project reads the log, and the reference is the
highest base number on that project plus one. The format is copied from what is
already there, so a job running `V-12` gets `V-13` and one running `VAR-007`
gets `VAR-008`. **Edit** beside the reference overrides it by hand.

Revisions do not consume a number. `VAR-001.1` is its own row in the log, sits
alongside `VAR-001`, and the next new variation still takes `VAR-003`. `BaseRef`
is what groups them.

Two things worth knowing before you rely on it:

**It counts the log, not the folder.** A project that already has variations
issued before this app existed starts again at 001, because the log has never
heard of them. Two ways round it, both one-off:

- Press **Edit** beside the reference and type the real next number. From then
  on it carries on from there.
- Or, if the next thing you issue is a revision of one of those older
  variations, choose **A revision of a previous one**, type the old reference
  and give it a revision. `VAR-045` plus revision `1` logs `VAR-045.1`, and the
  next new variation is then offered `VAR-046`.

Revising something the log has never seen is allowed for exactly this reason:
the variation exists, it is just not in here yet.

**Two people starting a variation on the same project at the same second will
both be offered the same number.** The app re-reads the log at the moment of
saving and steps past a number that has been taken since, telling you it has
moved — so nobody's work is overwritten. The number on screen can therefore
change between starting and saving, which is the intended trade.

### Connect it

**Settings → Variation log** — paste both URLs, save. Then on the form:

- Picking a project lists that project's logged variations under **Previous
  variations**
- Typing a reference that already exists warns you before you overwrite it
- **Save to log** writes the current form; **Download PDF** writes it too, once
  the PDF actually exists
- Opening a past variation restores every field, drawings and notes included,
  and says so until you start a new one

## Flow 3 · Write professionally (optional)

**When an HTTP request is received** → `Compose` named `Incoming`
(`@{json(triggerBody())}`) → your text generator → **Response**.

The payload carries `notes`, `project`, `state` and `clauseRef`. Reply with:

```
{ "description": @{<the generated text>} }
```

plus the same headers. The app also accepts `text`, `result` or `output` as the
key.

Use **AI Builder → Create text with GPT** or an **Azure OpenAI** action,
whichever your tenant has. A prompt along these lines works:

> Rewrite the following site notes as a single formal paragraph for a
> construction variation notice. Australian English. State only what the notes
> state — do not invent quantities, dates, drawing numbers or causes. No
> greeting, no sign-off.
>
> Notes: `@{outputs('Incoming')?['notes']}`

Leave this flow out entirely and the button still works: it capitalises
sentences and adds full stops locally, and says so, so nobody mistakes tidied
notes for a rewrite.

---

## Flow 7 · Get agreed rates (optional)

Fetches the Excel file the project register's `RatesFile` column names, so a
project prices its variations at its own agreed rates. The whole recipe is in
[AGREED-RATES.md](AGREED-RATES.md).

---

## Flow 6 · Open a variation file (optional)

Reads a variation's file back off its row in the variation log, so a
variation reopens with its attachments. Saving one is part of flow 5. The
whole recipe is in [VARIATION-FILES.md](VARIATION-FILES.md).

---

## What the app sends <a name="what-the-app-sends"></a>

**To flow 1:**

```json
{ "state": "VIC" }
```

**To flow 4:** `{ "action": "list", "state": "VIC", "projectId": "2", "variationRef": "VAR-101" }`
— `variationRef` is present only when reopening one, and the flow above ignores it.

**To flow 5:** every field in the table above, plus `variationRef`, `projectId`,
`notes`, `drawingsText` and `payload` (the whole form as JSON) — and, on a push
that carries it, `attachment: { fileName, contentBase64 }`, the variation file
for the row (see [VARIATION-FILES.md](VARIATION-FILES.md)).

**To flow 3:**

```json
{ "notes": "…", "state": "VIC", "project": "…", "clauseRef": "…" }
```

**To flow 2**, on every Download PDF:

| Field | Example |
|---|---|
| `fileName` | `VAR-042 - RPZ Valve Relocation - Direction of Variation.pdf` |
| `pdfBase64` | the whole PDF, base64 |
| `state` / `stateEntity` | `VIC` / `Axis Services VIC Pty Ltd` |
| `projectId` / `project` | `7` / `Warrnambool Hospital Redevelopment 25-135` |
| `folderPath` / `siteUrl` | from the register row |
| `variationRef` / `variationDescription` | `VAR-042` / `RPZ Valve Relocation` |
| `headContractor` / `attention` | `Kapitol Group` / `Glen O'Connor` |
| `issuedBy` / `position` | `Ben Smith` / `Project Engineer` |
| `pmEmail` | `ben.smith@axisplumbing.com.au` |
| `siteInstructionRef`, `clauseRef`, `aconexRef`, `contractorDirection`, `emailRef` | as typed |
| `descriptionOfWorks` | the final description |
| `drawings` | `[{ "number": "H-201", "name": "…", "oldRev": "C", "newRev": "D" }]` |
| `issuedDate` | ISO 8601, UTC |
| `fileKind` | `pdf` |

---

## Security

**The trigger URL is the credential.** It ends in `sig=…`, and anyone holding
the whole URL can run the flow — read your project register, or write a file
into your document library. There is no second check.

So:

- **Never commit the URLs.** They are typed into Settings and kept in the
  browser's local storage, which is why each person pastes them once per device
  rather than having them baked into the page.
- **Name a real origin** in `Access-Control-Allow-Origin` rather than using `*`.
  It is not a security boundary — anything outside a browser ignores it
  entirely — but it stops a stray website reading your register through a
  colleague's browser.
- **Regenerate on leak.** Trigger card → **Regenerate key**. Every saved copy of
  the old URL stops working immediately, and everyone re-pastes.
- **Validate in flow 2.** Add a Condition after Compose: if `fileName` is empty,
  or doesn't end `.pdf`, or `pdfBase64` is empty, respond `400` and stop. It
  costs one action and closes off writing arbitrary files into the library.
  (The variation file no longer goes through flow 2 — it is attached to the
  log row by flow 5.)

## If you can't use premium <a name="if-you-cant-use-premium"></a>

HTTP triggers are premium. Without them:

- **Projects** — export the register to `assets/` as a static JSON file the app
  is deployed with, and refresh it on a schedule. The list goes stale between
  refreshes, which for a project register is usually fine.
- **Filing** — drop the filing flow and have people save the downloaded PDF into
  the SharePoint folder themselves, or point a **standard** SharePoint trigger
  ("When a file is created in a folder") at a shared drop folder and have it
  move and rename from there.

Neither is as good. They need no licence.

---

## When something doesn't work

| What you see | What it is |
|---|---|
| *"The browser could not reach the flow"* on **Test projects flow** | Nine times in ten, the missing `Access-Control-Allow-Origin` header ([step 6](#step6)). Otherwise: flow turned off, or the URL truncated when pasted |
| Flow run history shows **no runs at all** | The request never arrived. Check the trigger's Method is POST and the URL was copied whole, `sig=` and all |
| Flow runs, returns 200, app still shows nothing | The Response body isn't the shape the app expects. It wants `{"projects": […]}`, a bare array, or Get items' own `{"value": […]}` |
| *"No projects in the register for this state"* | The flow answered with an empty list. Check the `State` column matches the state code exactly — `Vic` is not `VIC` |
| Projects load, but every field except the name is blank | Pick a project and read the line under the dropdown. It says either "the row does carry X, Y" (the data is there under another name — map it in **Settings → Match the register columns**) or "your flow only returns X, Y" (the data never arrived — fix the flow, the app cannot help). **Settings → Test projects flow → What the flow returned** shows every column the flow sent, including any it sent empty |
| The flow returns only `id`, `project`, `state` | Its Select map has only those three lines. Add the rest, or delete the Select step entirely and return Get items' output (step 4) |
| The Select map has every line, but they come back empty | The column names inside the expressions do not match the list's *internal* names. Check each in List settings → click the column → read `Field=` at the end of the address bar. Or delete the Select and let the raw names through |
| The columns come back as `field_1`, `field_2`, … | SharePoint's **From Excel** import names them that way, and nothing can infer meaning from it. Either add the Select step so the flow returns proper names, or map them once in **Settings → Match the register columns** |
| The filed PDF won't open | `base64ToBinary` is missing from File Content |
| *"the template language function 'greater' expects two parameter of matching types"* | The log write flow's Condition is comparing a string with a number. Use the `if(empty(…), 'none', 'found')` form in flow 5, step 3 |
| *"parameters are invalid, they may not be null or empty: 'id'"* on **Update item** | The Condition took the True branch on an empty result, so there is no row to update. Check all three: operator is `is equal to`, the typed value matches the expression's case exactly, and there is no leftover empty condition row |
| Every run creates a new row, none ever updates | The condition never matches. Almost always case — `Found` typed against an expression returning `found` |
| A reopened variation fills in the project and letterhead but leaves the reference details and descriptions blank | `Payload` holds the whole request instead of its `payload` field. Map it to `@{outputs('Incoming')?['payload']}`. The app unwraps this case now, but the column is still storing the wrong thing |
| One project's variations appear under another | `ProjectId` is not being written, and the read flow is not filtering on it either. Map `ProjectId` in the write flow and put `State`/`ProjectId` in the read flow's Filter Query |
| A state's variations are missing, or land in another state's log | With a log per state, flows 4 and 5 are pointed at one fixed site and list. Switch on the state in both, as in step 3b, and make sure the two resolve to the same list |
| The list says some entries "could not be matched to a project" | Those rows have no `ProjectId` and no project in their saved form — written before `ProjectId` was mapped. Fill the column in on those rows, or re-save them from the app |
| *"502: The server did not receive a response from an upstream server"* in the app | The flow itself failed; 502 is the gateway reporting that. The run history has the real reason — open the red action |
| The app says *"Not saved — 500: …"* with a long message | That is the flow's own run error, passed through verbatim. It names the action that failed; open that action in the run history |
| *"Sent to the filing flow. The browser could not read the reply"* | The file went. The Response on flow 2 is missing the CORS header — filing worked, confirmation didn't. Add the header and it names the path instead |
| Two copies of the very first variation, seconds apart | The same missing header. The app sent it twice to find out the reply was unreadable, and won't do it again on that URL. Delete one, add the header |
| Filing is slow or times out on long letters | The PDF travels as base64, a third larger than the file. A 10-page letter is a few MB. The app warns past 20 MB |
| Everything worked yesterday, nothing works today | Someone regenerated the key, the flow was turned off after failures, or the flow owner's licence lapsed |

---

## When a flow answers 502

A 502 (or 504) from a flow is not about the request. The trigger accepted it
and the flow started — it just never reached its **Response** action, because
it failed on the way there or took longer than the ~120 second limit.

The gateway’s own words ("did not receive a response from an upstream
server") name nothing useful. **Power Automate → the flow → Run history → the
run from that moment** does: the red action is the cause, and its inputs show
exactly what it was handed.

### Read the whole run history before changing anything

Export it (**Run history → Download**, or the … menu) and look at the spread
of outcomes, not just the run that failed. On this app’s log-read flow the
export read:

```
51 x Succeeded    State eq 'VIC' and ProjectId eq 1
 4 x Failed       State eq '' and ProjectId eq
 2 x Failed       (a stray newline)
```

A flow that succeeds fifty-one times and fails on one shape of input does not
have a bug in it. Something is **sending** it input it never gets in normal
use. That was the case here: the app’s own connection check was asking the log
flow about an empty project, which built an invalid filter. The flow was never
the problem, and changing it only broke what was working.

So: **compare the failing run’s inputs with a successful one’s.** If the
difference is the input rather than the flow, fix whatever is sending it.

### If you changed the $filter on earlier advice, put it back

An earlier version of this guide suggested a conditional `$filter` expression
to tolerate empty values. That was the wrong end of the problem: the app only
ever sends a real state and a real project id, so the empty case never arises.

It also wrote the working filter as

```
State eq '@{...state}' and ProjectId eq @{...projectId}
```

where `...state` was shorthand for *your own reference to the payload*. Pasted
literally, that is not an expression and Power Automate says so: **"This
expression has a problem."** Written out properly it is one of these two,
depending on which box you are typing into.

**In the expression editor (the `fx` button)** — paste this, as one line:

```
concat('State eq ''', outputs('Payload')?['state'], ''' and ProjectId eq ', outputs('Payload')?['projectId'])
```

**In the plain Filter Query box**, without opening the expression editor — the
`@{ }` wrapper is what marks an expression inside ordinary text:

```
State eq '@{outputs('Payload')?['state']}' and ProjectId eq @{outputs('Payload')?['projectId']}
```

Either produces `State eq 'VIC' and ProjectId eq 1`, which is exactly what the
successful runs in the history sent.

Two things to match to your own flow:

- **`Payload`** is the name of the action that parses the incoming JSON. If it
  is a **Compose**, `outputs('Payload')` is right; if it is a **Parse JSON**, use
  `body('Payload')`.
- **`ProjectId` is a Number column** here, so its value is not quoted, while
  `State` is text and is. The tripled quotes around the text value are not a
  typo — a single quote inside a Power Automate string literal is written by
  doubling it.

### When it is the Write professionally flow

The app sends it `notes`, `project`, `state` and `clauseRef`, which is the shape
this guide specifies, so a 502 here is the flow itself rather than its input.
Open the run and look at the generator action. The usual causes, in order:

- **AI Builder credits.** *Create text with GPT* needs them, and a tenant with
  none — or none left this month — fails the action outright. This is the most
  common one by some distance.
- **The content filter** rejected the prompt or the result. Site notes about
  demolition or damage can trip it.
- **No Response on the path taken.** Same as below.
- **It took too long.** Generation plus the rest of the flow has to finish
  inside the ~120 second synchronous limit.

Nothing is blocked while it is broken: the button falls back to tidying the
notes locally and says so, and the notes themselves are never touched.

### Every branch needs its own Response

The other common cause of a 502. A flow that branches (a reference supplied →
return that variation; none → return the list) needs a **Response** action in
*both* halves. A branch that ends without one returns nothing, and nothing is
a 502.
