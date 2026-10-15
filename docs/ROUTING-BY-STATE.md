# Sending each state to its own project register

What this builds: a person opens the site, picks their office, and the project
dropdown fills with **that state's projects only** — read live from that state's
own SharePoint list.

This is flow 1 (*Get projects*) rewritten. Nothing in the app changes: it has
always posted the chosen state to the flow. The flow just has to decide where to
look.

---

## Before you start

- A **Variation Project Register** list on each state's SharePoint site, all with
  the same columns. Copying the structure between sites is covered in *The Two
  Registers*, section 4 — use **New → List → From existing list**, never an
  Excel export and import.
- The site URL for each state, e.g.
  `https://axisplumbingptyltd.sharepoint.com/sites/AXPVIC`.
- Flow 1 already built and connected, even if it currently points at one list.

---

## What the app sends

The moment someone clicks an office tile, the app posts this to flow 1:

```json
{ "state": "VIC" }
```

That is the whole input. Everything below is about turning `VIC` into a site and
a list name.

---

## The flow, step by step

### 1 · Trigger

**When an HTTP request is received.** Leave the Request Body JSON Schema empty —
we parse the body ourselves. Under Advanced parameters set **Method** to `POST`.

### 2 · Read the state out of the request

**Data Operation → Compose**, named `State`. Inputs:

```
@{json(triggerBody())?['state']}
```

> The body is read with `json(triggerBody())` rather than the trigger's own
> parsed output because the app sends its JSON as `text/plain`. That is
> deliberate — `application/json` makes the browser send a preflight `OPTIONS`
> first, and an HTTP trigger locked to POST answers that with a 405 the browser
> treats as a refusal, so the flow never sees the real request at all.

### 3 · The map of states to lists

**Data Operation → Compose**, named `Sites`. Paste this into Inputs as-is — it is
an object, not a string, so do not wrap it in quotes:

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

Correct the site URLs to your own. Delete any state you do not trade in — a
state that is not in the map simply gets an empty dropdown.

The keys must match the codes on the office tiles exactly, including case:
`VIC`, `NSW`, `QLD`, `SA`, `WA`, `NT`, `ACT`, `NZ`.

### 4 · Pick the one that matches

**Data Operation → Compose**, named `Target`. Inputs:

```
@{outputs('Sites')?[outputs('State')]}
```

This is the whole of "if they pick X, go to X's list". The key inside `?[ ]` is
an expression, so the office chosen on the opening screen selects the entry.
`VIC` returns that state's `{ site, list }` pair; a state not in the map returns
nothing, which the next step handles.

### 5 · Somewhere to put the rows

**Variable → Initialize variable**:

| Field | Value |
|---|---|
| Name | `Rows` |
| Type | **Array** |
| Value | leave empty |

### 6 · Is this a state we know?

**Control → Condition**:

| Side | Enter |
|---|---|
| Left | `if(empty(outputs('Target')), 'none', 'found')` — **via the expression editor (fx)**, not typed into the box |
| Operator | **is equal to** |
| Right | `found` — typed straight into the box |

Three things to check, because each on its own sends every run down the wrong
branch:

- **The operator is `is equal to`**, not *is not equal to*.
- **`found` matches the expression exactly, including case.** Comparison is
  case-sensitive, so `Found` never matches.
- **There is only one row in the condition.** The designer leaves an empty
  `Choose a value / Choose a value` row behind if you add one by accident, and
  joined with **And** it drags the whole condition false. Remove it from the `…`
  menu at the end of that row.

> **Why it is written that way.** The obvious version — count the rows, compare
> to zero — fails in two different ways. An operand typed into the box is text;
> one added through the expression editor is whatever the expression returns. So
> a number on one side and text on the other gives you either a loud failure
> (`is greater than` requires matching types) or a silent wrong answer
> (`is equal to` does not, and simply calls values of different types unequal).
> Two strings that can only be strings removes the question.

### 7 · The True branch — read that state's list

**SharePoint → Get items.** Click **Enter custom value** on the first two
dropdowns rather than picking from the list:

| Field | Value |
|---|---|
| Site Address | `@{outputs('Target')?['site']}` |
| List Name | `@{outputs('Target')?['list']}` |
| Filter Query | `Active eq 1` — or leave it empty |
| Top Count | `500` |

There is **no `State eq` filter**. The list *is* the state.

Then, still inside the True branch:

**Variable → Set variable** — Name `Rows`, Value:

```
@{body('Get_items')?['value']}
```

### 8 · The False branch — leave it empty

Nothing goes here. `Rows` stays empty, so an unmapped state gives an empty
dropdown rather than another state's projects, and no action fails.

### 9 · Reply

**Response**:

- **Status Code** — `200`
- **Body**:

  ```
  { "projects": @{variables('Rows')} }
  ```

- **Headers** (Advanced parameters):

  | Header | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Access-Control-Allow-Origin` | `https://your-site.netlify.app` |

**That header is the step everything hinges on.** Without it the request still
reaches the flow and the flow still answers, but the browser refuses to hand the
reply to the app, and you get *"The browser could not reach the flow"* — which
looks like a network problem and is not one.

Use the site's real origin: scheme and host, no trailing slash, no path.

---

## Test it

**Save**, then in the app: **Settings → Test projects flow**. It reports how
many projects came back and names the first one.

Then open each office in turn and check the dropdown holds that state's projects
and nothing else.

---

## Two things this changes

**Drop the `State` column if you like.** With a list per state the column is
redundant, and the app treats a row with no state as belonging to whichever
register it came from. Keep it if you find it useful for reporting.

**Project ids now collide across states.** Each SharePoint list numbers its own
items from 1, so project id 2 is a VIC job *and* an NSW one. The app already
handles this by narrowing on state before project — but it means `State` must be
written to the variation log and filtered on in the log flows. With one shared
register that was belt and braces; with a list per state it is load-bearing.

---

## If something does not work

| What you see | What it is |
|---|---|
| Dropdown empty for every state | `Target` resolved to nothing. Check the `Sites` keys match the tile codes exactly, including case |
| Dropdown empty for one state only | That state is missing from the map, or its key is misspelt |
| *"The browser could not reach the flow"* | The `Access-Control-Allow-Origin` header on the Response, nine times in ten. Otherwise the flow is off, or the URL was truncated when pasted |
| Get items fails with an invalid site | `Target` is empty and the True branch ran anyway — the condition is inverted or its right-hand value does not match `found` |
| Projects load but every field except the name is blank | Not this flow. The column names are not arriving in a form the app recognises — pick a project and read the line under the dropdown, which names what actually came back |
| One state shows another's projects | The map has two states pointing at the same site or list |
