# The projects page and the project dashboard

Picking an office now opens that office's **projects**, and each project opens
its **dashboard**: every variation on the job with its value and status, and
totals of what is approved and what is still pending.

```
Offices  ›  VIC  ›  Austin Hospital 1507V
                     [ Variations 2 ] [ Total $3,410 ] [ Approved $1,600 ] [ Pending $0 ] …
                     VAR-001     RPZ Valve Relocation    $1,600.00   Approved   …   Open
                       VAR-001.1 RPZ Valve Relocation    $2,240.00   Draft      …   Open
                     VAR-002     Additional floor waste  $1,170.00   Draft      …   Open
```

Everything shown comes from the two flows the app already has: **Get projects**
for the list, and the **variation log** for the variations. Three changes in
SharePoint and Power Automate make it complete. The app works before any of
them are made — they decide how much it can show and how fast.

| Change | Without it | With it |
|---|---|---|
| 1 · Five new columns in the Variation Log list | Values, statuses, approvals and commentary still show — they are read from each row's saved form | They are real columns: visible, sortable and totalled in SharePoint and Excel |
| 2 · Map them in the log **write** flow (flow 5) | The columns stay empty | Every save, status change, approval and comment fills them |
| 3 · One expression in the log **read** flow (flow 4) | The projects page asks the log once per project | One call per office |

---

## How the statuses work

| Status | Set by |
|---|---|
| **Draft** | A variation saved to the log but never downloaded |
| **Submitted** | Automatically, the first time its PDF is downloaded |
| **Approved** | On the dashboard — the status list in the table, or the **Builder commentary** window |
| **Rejected** | The same |

### Approved value and date

Entered by hand in the **Builder commentary** window, from what the builder
actually approved. They are **not** taken from the schedule of rates — the
window shows the schedule's figure beside them for reference only. The
dashboard's *Approved* total adds up the approved values entered, and says how
many approved variations do not have one yet.

The approved value can also be entered as a **percentage** of the
variation's value: type it in **Approved %**, or click **100%**, **80%**,
**50%** or **20%**, and the value is worked out (80% of $1,600.00 is
$1,280.00). Typing the value instead fills in the percentage. Only the value
is saved, so no new column is needed; the dashboard shows the share under
each approved value (*90.63% of value*).

### Builder commentary

**Builder commentary** on each row opens a window with the variation's thread:
every entry timestamped when it is added, with who it is from (the builder's
contact) and who entered it (your name, remembered on this computer, or the
signed-in Microsoft account). Each entry is saved to the log as soon as it is
added.

**Edit** and **Delete** sit on every entry. An edited entry keeps its original
timestamp and shows *edited* with when and by whom. A deleted entry leaves the
thread and the `BuilderCommentary` column, but is kept behind **Show deleted**
with when and by whom it was deleted, so the record of what the builder said
is never silently lost.

Two people can work on the same variation's commentary at once without losing
each other's changes: the window reads the row again just before it saves and
merges the two threads entry by entry, and where both changed the same entry
the later change wins. A save from the form does the same. A revision has a thread of its own; the original's stays with
the original.

A **revision** (`VAR-001.1`) is a new submission, so it starts again at Draft.
Totals count each variation once, at its latest revision; earlier revisions are
listed and marked *Superseded*.

Variations logged before this existed show as *Submitted* if their PDF was
downloaded, otherwise *Draft*. Ones saved before the schedule of rates existed
have no value and show **—** until they are reopened and saved again.

---

## 1 · Add five columns to the Variation Log list

In the list: **+ Add column**, one at a time. Type the name exactly as shown —
no spaces — so the internal name is clean; rename the display name afterwards
if you like.

| Name | Type | Notes |
|---|---|---|
| `Status` | **Choice** | Choices `Draft`, `Submitted`, `Approved`, `Rejected`, spelled exactly. Default `Draft` |
| `ValueExGst` | **Currency** (or Number, 2 decimals) | |
| `ApprovedValue` | **Currency** (or Number, 2 decimals) | |
| `ApprovedDate` | **Date and time**, *Date only* | |
| `BuilderCommentary` | **Multiple lines of text**, *plain text* | The whole thread as readable text, newest last |

`registers/Variation Log.xlsx` lists them with the rest.

**A log per state?** Add them to every state's list.

---

## 2 · Map them in flow 5 (the log write)

The app already sends them. Open flow 5 and, in **both** the *Update item*
(If yes) and the *Create item* (If no), fill the five new fields:

| Column | Value |
|---|---|
| Status Value | `@{outputs('Incoming')?['status']}` |
| ValueExGst | `@{outputs('Incoming')?['valueExGst']}` |
| ApprovedValue | `@{outputs('Incoming')?['approvedValue']}` |
| ApprovedDate | `@{outputs('Incoming')?['approvedDate']}` |
| BuilderCommentary | `@{outputs('Incoming')?['builderCommentary']}` |

Type each one in through the **expression editor (fx)** without the `@{ }`
— e.g. `outputs('Incoming')?['status']` — so it goes in as an expression,
not text.

A Choice column shows as **Status Value** in the action. `ApprovedValue` and
`ApprovedDate` arrive as `null` until a variation is approved, which clears the
cell — that is what you want.

**One thing flow 5 already does that matters more now.** It sets
`DownloadedAt` from whatever arrives, so a save that does not send it would
blank it. The dashboard sends the row's existing `DownloadedAt` back with
every status change, so changing a status never loses when it was issued.

---

## 3 · Let flow 4 (the log read) answer for a whole office

The projects page wants every variation in the office in one call, so it sends
the office with **no** project: `{ "action": "listState", "state": "VIC", "projectId": "" }`.
Today's filter cannot take that — `ProjectId eq ` with nothing after it is not
a valid query — so the app falls back to asking project by project, and says so
under the totals.

One change fixes it. In flow 4's **Get items**, replace the **Filter Query**
with this expression — through the **expression editor (fx)**:

```
if(empty(outputs('Incoming')?['projectId']),
   concat('State eq ''', outputs('Incoming')?['state'], ''''),
   concat('State eq ''', outputs('Incoming')?['state'], ''' and ProjectId eq ', outputs('Incoming')?['projectId']))
```

(In an expression a single quote inside a string is written twice, hence the
`''`.) It reads: no project → `State eq 'VIC'`; a project →
`State eq 'VIC' and ProjectId eq 7`, exactly as before. Nothing else about the
flow changes, and every existing call behaves the same.

Then, still on **Get items**:

- **Top Count** `5000`
- **… → Settings → Pagination** on, threshold `5000` — an office with years of
  variations can pass the 100-row page Get items stops at otherwise.

**A log per state?** The Switch you already have picks the list from `state`,
which is still sent, so nothing else is needed.

### Checking it

Open an office in the app. The totals should appear without the line *"Totals
read project by project…"* under them. In the flow's run history there is one
run for the page rather than one per project.

---

## What the app sends now

Flow 5 receives five more fields with every write:

| Field | Example |
|---|---|
| `status` | `Approved` |
| `valueExGst` | `2440` (a number), or `null` when nothing is priced |
| `approvedValue` | `2440`, or `null` |
| `approvedDate` | `2026-10-20`, or `null` |
| `builderCommentary` | `20 Oct 2026, 09:15 am — Glen O'Connor, Kapitol (entered by Ben Smith):` and the text, one entry after another |

Flow 4 additionally receives `"action": "listState"` with an empty `projectId`
from the projects page. The variation log's row shape in its reply is
unchanged.
