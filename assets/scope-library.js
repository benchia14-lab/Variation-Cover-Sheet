/* ============================================================================
   SCOPE LIBRARY — the standard inclusions, exclusions and general notes
   ============================================================================

   Stage 2 of a variation lists every line below down the left-hand column.
   Each one can be clicked to Include or Exclude it on this variation, or left
   out altogether; the preview shows the result as it will print.

   An item starts on the side of the list it is written under here, so the
   standard wording is already in place and only the exceptions need clicking.
   Anything with `start: 'off'` begins unselected.

   TO EDIT: add, remove or reword lines below. Keep each line one sentence —
   it prints as one bullet. Lines typed in the app for a single variation are
   saved with that variation, not here.

   "Passive Fire to Hydraulic Services" was supplied under both inclusions and
   exclusions. It is listed once and starts unselected, so it is a deliberate
   choice on every variation rather than a contradiction on the page.
============================================================================ */

const SCOPE_LIBRARY = {
  inclusions: [
    'Acoustic insulation to pipework within ceiling spaces of habitable areas only (no allowance for risers or non-habitable areas)',
    'Design, modelling & redocumentation including drawing updates',
    'A cold-water service connecting to base build provision(s), using Table B copper pipe & fittings for main runs & PEX pipe & fittings for branch lines & rough-ins',
    'A sanitary service connecting to base build provision(s) using uPVC pipe & fittings and HDPE for RVASS',
    'An irrigation water service provision connecting to base build potable water provision(s), using Table B copper pipe & fittings for main runs & PEX Type B pipe & fittings for branch lines & rough-ins',
    'A hot water service connecting to base build provision(s), using Table B copper pipe & fittings with thermal insulation for main runs & PEX pipe & fittings for branch lines & rough-ins',
    'Workshop and As-Installed drawings in Revit',
    'Extension of sanitary service to FF&E using uPVC pipe & fittings',
    'Extension of cold-water, hot-water and warm-water services to FF&E using Table B copper pipe & fittings for main runs & PEX pipe & fittings for branch lines & rough-ins',
    'Completion and submission of Quality Assurance documentation and ITCs for completed services and commissioning',
    'Temporary reinstatement of hard surfaces',
    'Import of cleanfill material for bedding and overlay material',
    'Removal of all spoil offsite as GSW including NDD slurry (NDD excavation)',
    'Non-disruptive digging of trenches along the required route to mitigate the risk of unintentional disruption of any services that may be undocumented',
    'Saw cutting, lifting and removal of hard surfaces (to site bin provided by others)',
    'Service locating including markup and potholing of areas requiring clarity around existing services and routes',
    'Traffic control during works for pedestrians and vehicles through carpark/driveways and thoroughfares',
    'Establishment of site, bunting and temporary fencing-off of work areas',
    'Design and calculation for sizing and routes of pipework',
    'HSEQA planning, high risk construction workshops',
    'Submission and documentation of as-builts',
    'NDD excavation',
    'Spotters',
    { text: 'Passive fire to hydraulic services', start: 'off' }
  ],

  exclusions: [
    'Electrical, data, FIP or BMS wiring (temporary or permanent)',
    'Diversion of any existing base build services',
    'Demolition and removal of existing services (abortive site and design works)',
    'Operational or preventative maintenance (other than rectification of defects during the 12-month defects liability period)',
    'Amplification of any existing services if necessary, to cope with unknown demands',
    'Grease or water treatment plant & equipment',
    'Painting and sheathing of pipework',
    'Removal or replacement of ceilings, walls, floors, etc.',
    'Removal of rubbish from site (we have allowed to place in bins provided by others)',
    'Core holes and slab scan, engineering approval',
    'Supply of spare parts',
    'Temporary services during shutdowns & connections, or additional temporaries (outside of base build)',
    'Warranties greater than 12 months',
    'Leak detection',
    'Drip trays',
    'Fire service and fire hose reels',
    'Excavation in rock, water charged ground or contaminated ground',
    'Removal of spoil',
    'Stockpile relocation',
    'De-watering of trenching after a rain event',
    'Movement of bedding material more than 15m from the work front',
    'Crane',
    'Concrete pump',
    'Arborist fees',
    'Works in contaminated/asbestos ground',
    'Removal of contaminated spoil including asbestos',
    'Permanent restoration of hard surfaces',
    'Costs and delays related to archaeological discoveries',
    'Formwork & concrete',
    'Reinstatement of DGB20',
    'Scaffolding',
    'Protection of finished services',
    'Vertical lifts of any plant, equipment or material'
  ],

  general: [
    'After hours works (working hours are Mon–Fri 6:30am–2:30pm)',
    'Any works not shown as included',
    'Validity of quote after 60 days'
  ]
};
