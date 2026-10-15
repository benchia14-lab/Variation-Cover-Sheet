# The two registers

The app is driven by two lists of reference data. They live in different places
on purpose.

| | Where it lives | Why there | Who edits it |
|---|---|---|---|
| **Office register** — section 1 of the letter | `assets/state-register.js` in this repo | Eight rows that change once a year. Keeping them local means the letterhead works with no network, no flow and no licence. | Anyone, via **Settings → State register** |
| **Project register** — section 2 | A SharePoint list | Hundreds of rows that change weekly, and the same list holds the folder each variation gets filed into. | Project admin, in SharePoint |

---

## 1 · The state register

One row per office — mostly a state or territory, but NZ is a row too.
Picking one on the opening screen fills the whole letterhead from that row.

| Field | Fills | Required |
|---|---|---|
| `code` | The tile label, **and the value matched against the `State` column in SharePoint** | yes |
| `name` | The state spelled out, under the tile label | yes |
| `entity` | Letterhead heading + signature block. A row with no entity is greyed out on the picker | yes |
| `abn` | `ABN:` row of the letterhead — hidden when blank | no |
| `acn` | `ACN:` row — hidden when blank | no |
| `phone` | Letterhead + signature block | yes |
| `address` | Letterhead. Newlines are preserved | yes |
| `email` | Letterhead + signature block | yes |
| `logo` | A data URI, overriding the shared logo for this state only | no |
| `intro` | Default opening line of the letter | no |
| `closing` | Default closing line | no |

### Filling it in

Two ways, whichever suits.

**In the app** — **Settings → State register**, type into the grid, **Save
register**. Edits take effect immediately but live only in your browser. To
give them to everyone, click **Export as file**, open the downloaded
`state-register-rows.js`, and paste its `const STATE_REGISTER = [ … ];` block
over the one in `assets/state-register.js`. Commit and redeploy.

**In Excel** — `registers/State Register.xlsx` holds the register as it now
stands, one row per office, with the yellow cells being the ones to edit. A cell
turns pink when a row has been started but is still missing something the
letterhead needs. Fill it in, hand it back, and `tools/register-to-js.py` puts
it into `assets/state-register.js` for everyone at once — checking every ABN and
ACN against its official checksum on the way, and refusing to write if one
fails. This is the easier route if the ABNs and addresses live with someone
other than you. `registers/StateRegister.csv` is the same thing as plain CSV.

`code` must match SharePoint exactly. If the list says `Vic`, the tile must say
`Vic` — `VIC` will return nothing.

---

## 2 · The project register (SharePoint list)

### The fast way: import the workbook

`registers/Variation Project Register.xlsx` is already laid out as the list,
with four example rows and every column explained in a cell comment. SharePoint
can build the list from it directly:

1. In your SharePoint site: **New → List → From Excel**
2. **Upload file**, pick the workbook, and choose the **ProjectRegister** table
   when it asks
3. Name the list **Variation Project Register**, then **Create**
4. Fix the three column types SharePoint guesses wrong — see
   [After the import](#after-the-import) below
5. Delete the four example rows and put your own projects in

That is the whole list in about two minutes. Build it by hand instead if you
prefer — the columns are below either way.

### The columns

One row per live project.

| Display name | Internal name | Type | Holds |
|---|---|---|---|
| Title | `Title` | Single line of text | **The project name.** This is the dropdown label and the Project row of the letter |
| State | `State` | Choice — `VIC, NSW, QLD, SA, WA, NT, ACT, NZ` | Which state's letterhead this project belongs to |
| Head Contractor | `HeadContractor` | Single line of text | Fills *Head contractor / company* |
| Recipient Address | `RecipientAddress` | Multiple lines, **plain text** | Fills *Recipient address*. Use line breaks as you want them printed |
| Attention | `Attention` | Single line of text | Fills *Attention* |
| Issued By | `IssuedBy` | Single line of text *(or Person)* | Fills *Issued by (name)* |
| Position | `Position` | Single line of text | Fills *Position* |
| Folder Path | `FolderPath` | Single line of text | **Where the PDF gets filed.** See below |
| Site Url | `SiteUrl` | Single line of text | Only if this project's folder is on a different SharePoint site. Blank = the flow's default site |
| Clause Ref | `ClauseRef` | Single line of text | Optional. Pre-fills *Clause ref* when it is the same on every variation for this project |
| Active | `Active` | Yes/No, default Yes | Set to No to retire a project without deleting its history |

`registers/ProjectRegister.csv` holds the same four example rows as plain CSV,
if you would rather paste into the list in grid view than import the workbook.

### After the import <a name="after-the-import"></a>

SharePoint guesses a type for every column it imports, and gets three of them
wrong. Open **List settings** (gear → List settings) and change:

| Column | Change it to | Why |
|---|---|---|
| `State` | **Choice**, with `VIC, NSW, QLD, SA, WA, NT, ACT, NZ` | Stops `Vic`, `vic` and `Victoria` all appearing and none of them matching |
| `RecipientAddress` | **Multiple lines of text**, plain text — **not** enhanced rich text | Rich text arrives wrapped in `<div>` tags, which print literally on the letter |
| `Active` | **Yes/No**, default Yes | So the flow can filter with `Active eq 1` |

Then give the columns readable headings. Editing the **display name** does not
touch the internal name, so rename freely:

`HeadContractor` → Head Contractor · `RecipientAddress` → Recipient Address ·
`IssuedBy` → Issued By · `FolderPath` → Folder Path · `SiteUrl` → Site Url ·
`ClauseRef` → Clause Ref

Leave `Title` alone — every SharePoint list has one and the flow reads it by
that name.

Last, confirm the internal names really did come through clean. Click a column
in List settings and read the end of the address bar: `…&Field=HeadContractor`
is right, `…&Field=Head_x0020_Contractor` means it was created with a space at
some point. The app copes with either; your flow's filter query is what gets
ugly.

### Two traps worth avoiding

**Internal names.** SharePoint derives the internal name from whatever you
*first* type. Create a column called `Head Contractor` and the internal name
becomes `Head_x0020_Contractor` forever. Create it as `HeadContractor`, then
rename the display name to `Head Contractor`, and you get a clean internal name
with a readable heading. Do this for every column — it makes the flow's filter
queries readable.

(The app copes with either spelling. The flow is what gets ugly.)

**Rich text.** Make *Recipient Address* **plain** multi-line text, not enhanced
rich text. Rich text arrives wrapped in `<div>` tags, which would print
literally on the letter.

### Folder Path

Either of these works:

**Open the folder in SharePoint and paste the address bar.** You get a view URL
like `…/Forms/AllItems.aspx?id=%2Fsites%2FAXPVIC%2FShared%20Documents%2F…`.
The app digs the real path out of the `id=` parameter and decodes it, so this is
fine to paste and is the easiest thing to get right.

**Or write the path yourself**, relative to the site, starting with the document
library:

```
/Shared Documents/25-135 Warrnambool Hospital/Variations
```

If the library was renamed after it was created, the path still uses its
*original* name — `/Shared Documents/` is by far the most common example.

Whichever you use, the app hands the filing flow three forms of it:
`folderPath` relative to the site (what **Create file** wants), `folderServerPath`
including `/sites/<name>`, and `sitePath` on its own.

If projects are spread across several SharePoint sites, fill in **Site Url**
too (`https://contoso.sharepoint.com/sites/VicProjects`) and have the flow use
it instead of a fixed site address.

---

## 3 · The variation log

The third list, and the one that makes a variation recoverable. One row per
variation the generator produces, keyed by the project and the variation
reference together.

`registers/Variation Log.xlsx` documents all 25 columns, each with a comment
saying what it holds and what type it must be. They are in the order the log
reads: **state, project, then the variation reference**, the same hierarchy the
form walks.

`Title` holds the **project name** — SharePoint shows it as each row's name, so
the register reads by job. Rename its display name to `Project` once the list
exists; the internal name stays `Title`, which is what the flows refer to. The
variation reference has its own column, `VariationRef`, and that is what the
write flow matches on. Matching on `Title` would find the project's first
variation every time and overwrite it.

**Build this one by hand — New → List → Blank list.** Not From Excel: that
names the internal columns `field_1`, `field_2` and so on, which is exactly what
made the project register return nothing. Type each name without spaces, rename
the display name afterwards.

The column that matters most is **`Payload`** — **Multiple lines of text,
plain**. It holds the whole form as JSON and is what a reopened variation is
rebuilt from, so a variation returns exactly as it was issued even if someone
renames a column later. About 1–3 kB per variation, against a 63,999 character
limit.

Turn on **versioning** (List settings → Versioning settings). Re-issuing a
variation updates its row, and versioning is what keeps the history of those
edits without the register filling with duplicates.

## 4 · Copying a list to the other states

Once VIC's lists are right, every other state wants the same structure. There is
one way to do this that keeps the column names, and one that quietly destroys
them.

### Do: New → List → From existing list

On the destination site — say `…/sites/AXPNSW`:

1. **New → List**
2. **From existing list**
3. Pick the site holding the VIC list, then the list itself
4. Name it (`Variation Project Register`, or `Variation History - NSW`)
5. **Create**

This copies every column with its **internal name intact**, along with the
column types, choices, defaults and views. It does not copy the items, which is
what you want — a new state starts empty.

### Don't: export to Excel and import it

**This is what renames everything to `field_1`, `field_2`.** An Excel import has
no idea what the columns were called internally; it only sees headings, so it
invents a name per column and hangs your heading on top as the display name.
The list looks right and every flow that names a column stops finding it.

It is the same trap whichever direction you go, and it is why the VIC project
register ended up with `field_N` names in the first place.

### After each copy, check four things

**The internal names came across.** List settings → click a column → read the end
of the address bar. `…&Field=HeadContractor` is right; `…&Field=field_2` means it
did not come from a list copy.

**Versioning is on** for the variation log. List settings → Versioning settings.
This is a list *setting*, not a column, so it does not travel with a copy.

**The State choice column** still offers every state. It copies, but it is worth
confirming the new list has the right default.

**The flow points at the new list.** Each state's Switch case needs its own Site
Address and List Name — see the flow guide, step 3b and the log flows.

### If you want it scripted

For eight states, once, PnP PowerShell is exact and repeatable:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser

Connect-PnPOnline -Url https://axisplumbingptyltd.sharepoint.com/sites/AXPVIC -Interactive
Get-PnPSiteTemplate -Out axis-lists.xml -Handlers Lists `
  -ListsToExtract "Variation Project Register","Variation History - VIC"

Connect-PnPOnline -Url https://axisplumbingptyltd.sharepoint.com/sites/AXPNSW -Interactive
Invoke-PnPSiteTemplate -Path axis-lists.xml
```

Repeat the last two lines per state. The template is XML you can read, keep and
re-apply, so a ninth office later is one command rather than a morning of
clicking.

### One thing to settle before you copy

Whatever the VIC list's internal names are now, the copies inherit them. If VIC
still carries `field_1`…`field_10`, so will every state — **consistently**, which
is what the flows actually need: one Switch, the same column names everywhere.

Ugly but consistent beats tidy but mixed. If you would rather have clean names,
rebuild VIC's columns first and copy afterwards; doing it the other way round
means eight lists to correct instead of one.

## 5 · Optional: a separate log of issues

The filing flow receives every field on the letter, not just the file. If you
want a searchable record of variations issued — rather than a folder of PDFs —
add a second list, **Variations Issued**, and have the flow create an item in it
alongside the file:

| Column | Type | From the payload |
|---|---|---|
| Title | Single line | `variationRef` |
| Description | Single line | `variationDescription` |
| Project | Lookup → Variation Project Register | `projectId` |
| State | Choice | `state` |
| Head Contractor | Single line | `headContractor` |
| Attention | Single line | `attention` |
| Issued By | Single line | `issuedBy` |
| Position | Single line | `position` |
| Issued Date | Date and time | `issuedDate` |
| Site Instruction Ref | Single line | `siteInstructionRef` |
| Clause Ref | Single line | `clauseRef` |
| Aconex Ref | Single line | `aconexRef` |
| Contractors Direction | Single line | `contractorDirection` |
| Description of Works | Multiple lines, plain | `descriptionOfWorks` |
| Document | Hyperlink | the `Path` the Create file action returns |

That list is what turns the folder into a register you can report on.
