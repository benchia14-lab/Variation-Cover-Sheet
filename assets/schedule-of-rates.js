/* ============================================================================
   SCHEDULE OF RATES — what stage 3 prices a variation from
   ============================================================================

   GENERATED from the master schedule of rates workbook by
       python3 tools/sor-to-js.py "registers/Schedule of Rates.xlsx"
   Change the workbook and re-run that rather than editing this by hand.

   Each line is measured the way the workbook measures it: a quantity added and
   a quantity deducted, the difference times the rate. `percent` lines are a
   percentage of the measured works rather than a rate. `notes` are the
   schedule's exclusions and qualifications, printed under it.
============================================================================ */

const SCHEDULE_OF_RATES = {
 "title": "Schedule of Rates",
 "source": "Schedule of Rates.xlsx",
 "gstPercent": 10,
 "preamble": [
  "Note - All rates provided below exclude spotters for EWP works"
 ],
 "sections": [
  {
   "title": "Prelims",
   "note": "Each applied as a percentage of the measured works on this schedule",
   "lines": [
    {
     "d": "Design, Co-Ordination, Modelling, Asbuilts Etc",
     "u": "%",
     "percent": 5.0,
     "group": "Design & documentation"
    },
    {
     "d": "Equipment hire",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    },
    {
     "d": "Labour hire",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    },
    {
     "d": "Fire rating",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    },
    {
     "d": "Fire treatment",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    },
    {
     "d": "Siphonic design",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    },
    {
     "d": "Seismic",
     "u": "%",
     "percent": null,
     "group": "Overheads"
    }
   ]
  },
  {
   "title": "Labour Rates - For revised Program",
   "note": "",
   "lines": [
    {
     "d": "Tradesman Normal Time",
     "u": "hrs",
     "r": 184,
     "ref": "3"
    },
    {
     "d": "Tradesman Double Time",
     "u": "hrs",
     "r": 272,
     "ref": "5"
    },
    {
     "d": "Foreman Normal Time",
     "u": "hrs",
     "r": 195,
     "ref": "6"
    },
    {
     "d": "Foreman Double Time",
     "u": "hrs",
     "r": 283,
     "ref": "8"
    },
    {
     "d": "Supervisor Normal Time",
     "u": "hrs",
     "r": 276,
     "ref": "9"
    },
    {
     "d": "Supervisor Double Time",
     "u": "hrs",
     "r": 276,
     "ref": "11"
    },
    {
     "d": "Designer Normal Time",
     "u": "hrs",
     "r": 329,
     "ref": "12"
    },
    {
     "d": "Designer Double Time",
     "u": "hrs",
     "r": 329,
     "ref": "14"
    }
   ]
  },
  {
   "title": "Stormwater Downpipe",
   "note": "",
   "lines": [
    {
     "d": "300PVC/metre",
     "u": "per metre",
     "r": 406,
     "ref": "22"
    },
    {
     "d": "225 PVC/metre",
     "u": "per metre",
     "r": 341,
     "ref": "24"
    },
    {
     "d": "150 PVC/metre",
     "u": "per metre",
     "r": 205,
     "ref": "25"
    },
    {
     "d": "100 PVC/metre",
     "u": "per metre",
     "r": 160,
     "ref": "27"
    },
    {
     "d": "65 PVC/metre",
     "u": "per metre",
     "r": 102,
     "ref": "28"
    },
    {
     "d": "300PVC Bend",
     "u": "each",
     "r": 401,
     "ref": "29"
    },
    {
     "d": "225 PVC Bend",
     "u": "each",
     "r": 273,
     "ref": "30"
    },
    {
     "d": "150 PVC Bend",
     "u": "each",
     "r": 139,
     "ref": "32"
    },
    {
     "d": "100 PVC Bend",
     "u": "each",
     "r": 101,
     "ref": "33"
    },
    {
     "d": "65 PVC Bend",
     "u": "each",
     "r": 91,
     "ref": "34"
    },
    {
     "d": "300 PVC Junction",
     "u": "each",
     "r": 479,
     "ref": "35"
    },
    {
     "d": "225 PVC Junction",
     "u": "each",
     "r": 312,
     "ref": "36"
    },
    {
     "d": "150 PVC Junction",
     "u": "each",
     "r": 142,
     "ref": "37"
    },
    {
     "d": "100 PVC Junction",
     "u": "each",
     "r": 121,
     "ref": "39"
    },
    {
     "d": "65 PVC Junction",
     "u": "each",
     "r": 94,
     "ref": "41"
    },
    {
     "d": "900 Sq Pit with Grating (1m deep)",
     "u": "each",
     "r": 5520,
     "ref": "42"
    },
    {
     "d": "900 Sq Pit with Grating (2m deep)",
     "u": "each",
     "r": 7530,
     "ref": "43"
    },
    {
     "d": "900 Sq Pit with Grating (3m deep)",
     "u": "each",
     "r": 9522,
     "ref": "44"
    },
    {
     "d": "1200 Sq Pit with Grating (1m deep)",
     "u": "each",
     "r": 8323,
     "ref": "45"
    },
    {
     "d": "1200 Sq Pit with Grating (2m deep)",
     "u": "each",
     "r": 11160,
     "ref": "46"
    },
    {
     "d": "1200 Sq Pit with Grating (3m deep)",
     "u": "each",
     "r": 13785,
     "ref": "47"
    },
    {
     "d": "300mm Wide Longitudinal Cast Iron Grating and Frame/per metre",
     "u": "each",
     "r": 1247,
     "ref": "48"
    },
    {
     "d": "200mm Wide Longitudinal Cast Iron Grating and Frame/per metre",
     "u": "each",
     "r": 1040,
     "ref": "49"
    },
    {
     "d": "100mm Wide Longitudinal Cast Iron Grating and Frame/per metre",
     "u": "each",
     "r": 694,
     "ref": "50"
    },
    {
     "d": "225 IO test and expansion joint",
     "u": "each",
     "r": 786,
     "ref": "230"
    },
    {
     "d": "150 IO test and expansion joint",
     "u": "each",
     "r": 239,
     "ref": "230"
    },
    {
     "d": "100 IO test and expansion joint",
     "u": "each",
     "r": 144,
     "ref": "230"
    },
    {
     "d": "100 Clear Out as Specified",
     "u": "each",
     "r": 390,
     "ref": "51"
    },
    {
     "d": "225 Clear Out as Specified",
     "u": "each",
     "r": 657,
     "ref": "52"
    },
    {
     "d": "100 Stainless Steel floor waste riser with collar",
     "u": "each",
     "r": 624,
     "ref": "53"
    },
    {
     "d": "Plantroom floor waste with 100mm",
     "u": "each",
     "r": 554,
     "ref": "54"
    },
    {
     "d": "100 X 65 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 520,
     "ref": "55"
    },
    {
     "d": "100 X 50 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 505,
     "ref": "56"
    },
    {
     "d": "100 Chrome Plated Floor Waste Grate",
     "u": "each",
     "r": 500,
     "ref": "57"
    },
    {
     "d": "150 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 1002,
     "ref": "58"
    },
    {
     "d": "100 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 568,
     "ref": "59"
    },
    {
     "d": "80 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 507,
     "ref": "60"
    },
    {
     "d": "50 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 324,
     "ref": "61"
    },
    {
     "d": "100 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 595,
     "ref": "62"
    },
    {
     "d": "80 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 519,
     "ref": "63"
    },
    {
     "d": "50 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 390,
     "ref": "64"
    },
    {
     "d": "100 Cap to end of pipe",
     "u": "each",
     "r": 69,
     "ref": "65"
    },
    {
     "d": "50 Cap to end of pipe",
     "u": "each",
     "r": 56,
     "ref": "66"
    }
   ]
  },
  {
   "title": "Drilled Penetrations",
   "note": "200mm Thickness Concrete Slab",
   "lines": [
    {
     "d": "Slab scanning, permits, etc",
     "u": "item",
     "r": 820
    },
    {
     "d": "50mm diameter drilled peno",
     "u": "each",
     "r": 263,
     "ref": "70"
    },
    {
     "d": "65mm diameter drilled peno",
     "u": "each",
     "r": 295,
     "ref": "71"
    },
    {
     "d": "75mm diameter drilled peno",
     "u": "each",
     "r": 346,
     "ref": "72"
    },
    {
     "d": "100mm diameter drilled peno",
     "u": "each",
     "r": 391,
     "ref": "73"
    },
    {
     "d": "125mm diameter drilled peno",
     "u": "each",
     "r": 412,
     "ref": "74"
    },
    {
     "d": "150mm diameter drilled peno",
     "u": "each",
     "r": 432,
     "ref": "75"
    },
    {
     "d": "200mm diameter drilled peno",
     "u": "each",
     "r": 537,
     "ref": "76"
    },
    {
     "d": "300mm diameter drilled peno",
     "u": "each",
     "r": 693,
     "ref": "77"
    }
   ]
  },
  {
   "title": "Fire Collar",
   "note": "",
   "lines": [
    {
     "d": "40 mm diameter fire collar",
     "u": "each",
     "r": 184,
     "ref": "80"
    },
    {
     "d": "50mm diameter fire collar",
     "u": "each",
     "r": 184,
     "ref": "81"
    },
    {
     "d": "65mm diameter fire collar",
     "u": "each",
     "r": 207,
     "ref": "82"
    },
    {
     "d": "80mm diameter fire collar",
     "u": "each",
     "r": 274,
     "ref": "83"
    },
    {
     "d": "100mm diameter fire collar",
     "u": "each",
     "r": 273,
     "ref": "84"
    },
    {
     "d": "125mm diameter fire collar",
     "u": "each",
     "r": 273,
     "ref": "85"
    },
    {
     "d": "150mm diameter fire collar",
     "u": "each",
     "r": 303,
     "ref": "86"
    },
    {
     "d": "200mm diameter fire collar",
     "u": "each",
     "r": 651,
     "ref": "87"
    },
    {
     "d": "250mm diameter fire collar",
     "u": "each",
     "r": 671,
     "ref": "88"
    },
    {
     "d": "300mm diameter fire collar",
     "u": "each",
     "r": 817,
     "ref": "89"
    }
   ]
  },
  {
   "title": "Pipe Seals",
   "note": "",
   "lines": [
    {
     "d": "20mm diameter pipe seal",
     "u": "each",
     "r": 177,
     "ref": "92"
    },
    {
     "d": "25mm diameter pipe seal",
     "u": "each",
     "r": 177,
     "ref": "93"
    },
    {
     "d": "32mm diameter pipe seal",
     "u": "each",
     "r": 177,
     "ref": "94"
    },
    {
     "d": "40mm diameter pipe seal",
     "u": "each",
     "r": 184,
     "ref": "95"
    },
    {
     "d": "50mm diameter pipe seal",
     "u": "each",
     "r": 184,
     "ref": "96"
    },
    {
     "d": "65mm diameter pipe seal",
     "u": "each",
     "r": 206,
     "ref": "97"
    },
    {
     "d": "75mm diameter pipe seal",
     "u": "each",
     "r": 274,
     "ref": "98"
    },
    {
     "d": "100mm diameter pipe seal",
     "u": "each",
     "r": 273,
     "ref": "99"
    },
    {
     "d": "125mm diameter pipe seal",
     "u": "each",
     "r": 273,
     "ref": "100"
    },
    {
     "d": "150mm diameter pipe seal",
     "u": "each",
     "r": 303,
     "ref": "101"
    },
    {
     "d": "200mm diameter pipe seal",
     "u": "each",
     "r": 650,
     "ref": "102"
    },
    {
     "d": "250mm diameter pipe seal",
     "u": "each",
     "r": 672,
     "ref": "103"
    },
    {
     "d": "300mm diameter pipe seal",
     "u": "each",
     "r": 817,
     "ref": "104"
    }
   ]
  },
  {
   "title": "Supply and Installation of Acoustic Lagging",
   "note": "",
   "lines": [
    {
     "d": "40mm pipe - acoustic",
     "u": "each",
     "r": 72,
     "ref": "109"
    },
    {
     "d": "50mm pipe- acoustic",
     "u": "each",
     "r": 76,
     "ref": "110"
    },
    {
     "d": "65mm pipe- acoustic",
     "u": "each",
     "r": 81,
     "ref": "111"
    },
    {
     "d": "75mm pipe- acoustic",
     "u": "each",
     "r": 90,
     "ref": "112"
    },
    {
     "d": "100mm pipe- acoustic",
     "u": "each",
     "r": 118,
     "ref": "113"
    },
    {
     "d": "125mm pipe- acoustic",
     "u": "each",
     "r": 125,
     "ref": "114"
    },
    {
     "d": "150mm pipe- acoustic",
     "u": "each",
     "r": 146,
     "ref": "115"
    },
    {
     "d": "225mm pipe- acoustic",
     "u": "each",
     "r": 159,
     "ref": "116"
    },
    {
     "d": "250mm pipe- acoustic",
     "u": "each",
     "r": 173,
     "ref": "117"
    },
    {
     "d": "315mm pipe- acoustic",
     "u": "each",
     "r": 205,
     "ref": "118"
    },
    {
     "d": "40mm bend- acoustic",
     "u": "each",
     "r": 48,
     "ref": "119"
    },
    {
     "d": "50mm bend- acoustic",
     "u": "each",
     "r": 48,
     "ref": "120"
    },
    {
     "d": "65mm bend- acoustic",
     "u": "each",
     "r": 55,
     "ref": "121"
    },
    {
     "d": "75mm bend- acoustic",
     "u": "each",
     "r": 55,
     "ref": "122"
    },
    {
     "d": "100mm bend- acoustic",
     "u": "each",
     "r": 69,
     "ref": "123"
    },
    {
     "d": "125mm bend- acoustic",
     "u": "each",
     "r": 50,
     "ref": "124"
    },
    {
     "d": "150mm bend- acoustic",
     "u": "each",
     "r": 97,
     "ref": "125"
    },
    {
     "d": "225mm bend- acoustic",
     "u": "each",
     "r": 111,
     "ref": "126"
    },
    {
     "d": "250mm bend- acoustic",
     "u": "each",
     "r": 125,
     "ref": "127"
    },
    {
     "d": "315mm bend- acoustic",
     "u": "each",
     "r": 152,
     "ref": "128"
    },
    {
     "d": "40mm junction- acoustic",
     "u": "each",
     "r": 58,
     "ref": "129"
    },
    {
     "d": "50mm junction- acoustic",
     "u": "each",
     "r": 58,
     "ref": "130"
    },
    {
     "d": "65mm junction- acoustic",
     "u": "each",
     "r": 65,
     "ref": "131"
    },
    {
     "d": "75mm junction- acoustic",
     "u": "each",
     "r": 65,
     "ref": "132"
    },
    {
     "d": "100mm junction- acoustic",
     "u": "each",
     "r": 79,
     "ref": "133"
    },
    {
     "d": "125mm junction- acoustic",
     "u": "each",
     "r": 96,
     "ref": "134"
    },
    {
     "d": "150mm junction- acoustic",
     "u": "each",
     "r": 112,
     "ref": "135"
    },
    {
     "d": "225mm junction- acoustic",
     "u": "each",
     "r": 129,
     "ref": "136"
    },
    {
     "d": "250mm junction- acoustic",
     "u": "each",
     "r": 148,
     "ref": "137"
    },
    {
     "d": "315mm junction- acoustic",
     "u": "each",
     "r": 177,
     "ref": "138"
    },
    {
     "d": "100mm gully trap- acoustic",
     "u": "each",
     "r": 100,
     "ref": "139"
    }
   ]
  },
  {
   "title": "Sub-Soil Drainage",
   "note": "",
   "lines": [
    {
     "d": "160 HDPE/metre",
     "u": "each",
     "r": 175,
     "ref": "142"
    },
    {
     "d": "110 HDPE/metre",
     "u": "each",
     "r": 116,
     "ref": "143"
    },
    {
     "d": "110 Clear Out as Specified",
     "u": "each",
     "r": 394,
     "ref": "144"
    }
   ]
  },
  {
   "title": "Syfonic Downpipes",
   "note": "",
   "lines": [
    {
     "d": "450 HDPE/metre",
     "u": "per metre",
     "r": 1430,
     "ref": "147"
    },
    {
     "d": "315 HDPE/metre",
     "u": "per metre",
     "r": 1205,
     "ref": "147"
    },
    {
     "d": "250 HDPE/metre",
     "u": "per metre",
     "r": 1002,
     "ref": "148"
    },
    {
     "d": "200 HDPE/metre",
     "u": "per metre",
     "r": 785,
     "ref": "149"
    },
    {
     "d": "160 HDPE/metre",
     "u": "per metre",
     "r": 379,
     "ref": "150"
    },
    {
     "d": "125 HDPE/metre",
     "u": "per metre",
     "r": 314,
     "ref": "151"
    },
    {
     "d": "110 HDPE/metre",
     "u": "per metre",
     "r": 251,
     "ref": "152"
    },
    {
     "d": "75 HDPE/metre",
     "u": "per metre",
     "r": 227,
     "ref": "153"
    },
    {
     "d": "450 HDPE Bend",
     "u": "each",
     "r": 1924,
     "ref": "154"
    },
    {
     "d": "315 HDPE Bend",
     "u": "each",
     "r": 1344,
     "ref": "154"
    },
    {
     "d": "250 HDPE Bend",
     "u": "each",
     "r": 1052,
     "ref": "155"
    },
    {
     "d": "160 HDPE Bend",
     "u": "each",
     "r": 456,
     "ref": "156"
    },
    {
     "d": "125 HDPE Bend",
     "u": "each",
     "r": 284,
     "ref": "157"
    },
    {
     "d": "110 HDPE Bend",
     "u": "each",
     "r": 260,
     "ref": "158"
    },
    {
     "d": "75 HDPE Bend",
     "u": "each",
     "r": 241,
     "ref": "159"
    },
    {
     "d": "450 HDPE Junction",
     "u": "each",
     "r": 3244,
     "ref": "160"
    },
    {
     "d": "315 HDPE Junction",
     "u": "each",
     "r": 1811,
     "ref": "160"
    },
    {
     "d": "250 HDPE Junction",
     "u": "each",
     "r": 1633,
     "ref": "161"
    },
    {
     "d": "160 HDPE Junction",
     "u": "each",
     "r": 549,
     "ref": "162"
    },
    {
     "d": "125 HDPE Junction",
     "u": "each",
     "r": 504,
     "ref": "163"
    },
    {
     "d": "110 HDPE Junction",
     "u": "each",
     "r": 325,
     "ref": "164"
    },
    {
     "d": "450 x 315 HDPE reducer",
     "u": "each",
     "r": 1284,
     "ref": "164"
    },
    {
     "d": "450 x 160 HDPE reducer",
     "u": "each",
     "r": 2313,
     "ref": "164"
    },
    {
     "d": "Syfonic roof outlet as Specified",
     "u": "each",
     "r": 623,
     "ref": "165"
    },
    {
     "d": "Syfonic planter outlet as Specified",
     "u": "each",
     "r": 860,
     "ref": "166"
    },
    {
     "d": "100 Chrome Plated Floor Waste Grate",
     "u": "each",
     "r": 499,
     "ref": "167"
    },
    {
     "d": "150 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 672,
     "ref": "168"
    },
    {
     "d": "100 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 568,
     "ref": "169"
    },
    {
     "d": "80 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 508,
     "ref": "170"
    },
    {
     "d": "50 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 324,
     "ref": "171"
    },
    {
     "d": "100 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 593,
     "ref": "172"
    },
    {
     "d": "80 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 519,
     "ref": "173"
    },
    {
     "d": "50 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 367,
     "ref": "174"
    }
   ]
  },
  {
   "title": "Trade waste",
   "note": "",
   "lines": [
    {
     "d": "160 HDPE/metre 1m deep",
     "u": "per metre",
     "r": 482,
     "ref": "177"
    },
    {
     "d": "110 HDPE/metre 1m deep",
     "u": "per metre",
     "r": 362,
     "ref": "178"
    },
    {
     "d": "160 HDPE/metre 1.5m deep",
     "u": "per metre",
     "r": 551,
     "ref": "179"
    },
    {
     "d": "110 HDPE/metre 1.5m deep",
     "u": "per metre",
     "r": 516,
     "ref": "180"
    },
    {
     "d": "160 HDPE/metre 2m deep",
     "u": "per metre",
     "r": 662,
     "ref": "181"
    },
    {
     "d": "110 HDPE/metre 2m deep",
     "u": "per metre",
     "r": 619,
     "ref": "182"
    },
    {
     "d": "160 HDPE/metre",
     "u": "per metre",
     "r": 270,
     "ref": "183"
    },
    {
     "d": "110 HDPE/metre",
     "u": "per metre",
     "r": 183,
     "ref": "184"
    },
    {
     "d": "65 HDPE/metre",
     "u": "per metre",
     "r": 129,
     "ref": "185"
    },
    {
     "d": "50 HDPE/metre",
     "u": "per metre",
     "r": 112,
     "ref": "186"
    },
    {
     "d": "160 HDPE Bend",
     "u": "each",
     "r": 416,
     "ref": "187"
    },
    {
     "d": "110 HDPE Bend",
     "u": "each",
     "r": 237,
     "ref": "188"
    },
    {
     "d": "65 HDPE Bend",
     "u": "each",
     "r": 229,
     "ref": "189"
    },
    {
     "d": "50 HDPE Bend",
     "u": "each",
     "r": 219,
     "ref": "190"
    },
    {
     "d": "160 HDPE Junction",
     "u": "each",
     "r": 500,
     "ref": "191"
    },
    {
     "d": "110 HDPE Junction",
     "u": "each",
     "r": 295,
     "ref": "192"
    },
    {
     "d": "65 HDPE Junction",
     "u": "each",
     "r": 247,
     "ref": "193"
    },
    {
     "d": "50 HDPE Junction",
     "u": "each",
     "r": 215,
     "ref": "194"
    },
    {
     "d": "110 Clear Out as Specified",
     "u": "each",
     "r": 394,
     "ref": "195"
    },
    {
     "d": "Bucket trap floor waste",
     "u": "each",
     "r": 1037,
     "ref": "232"
    },
    {
     "d": "100 Stainless Steel floor waste riser with collar",
     "u": "each",
     "r": 624,
     "ref": "196"
    },
    {
     "d": "Plantroom floor waste with 100mm",
     "u": "each",
     "r": 555,
     "ref": "197"
    },
    {
     "d": "100 X 65 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 519,
     "ref": "198"
    },
    {
     "d": "100 X 50 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 506,
     "ref": "199"
    },
    {
     "d": "100 Chrome Plated Floor Waste Grate",
     "u": "each",
     "r": 498,
     "ref": "200"
    },
    {
     "d": "110 HDPE Capped end",
     "u": "each",
     "r": 165,
     "ref": "201"
    },
    {
     "d": "65 HDPE Capped end",
     "u": "each",
     "r": 151,
     "ref": "202"
    },
    {
     "d": "Tundish exposed chrome plated 100mm x 50mm floor mounted",
     "u": "each",
     "r": 222,
     "ref": "203"
    },
    {
     "d": "InwallTundish (single point)",
     "u": "each",
     "r": 479,
     "ref": "203"
    },
    {
     "d": "50 HDPE Tundish (trap and LIT only)",
     "u": "each",
     "r": 243,
     "ref": "203"
    },
    {
     "d": "50mm AAV",
     "u": "each",
     "r": 183,
     "ref": "203"
    }
   ]
  },
  {
   "title": "Sanitary Plumbing",
   "note": "",
   "lines": [
    {
     "d": "160 PVC/metre 1m deep",
     "u": "per metre",
     "r": 397
    },
    {
     "d": "110 PVC/metre 1m deep",
     "u": "per metre",
     "r": 351
    },
    {
     "d": "160 PVC/metre 1.5m deep",
     "u": "per metre",
     "r": 518
    },
    {
     "d": "110 PVC/metre 1.5m deep",
     "u": "per metre",
     "r": 471
    },
    {
     "d": "160 PVC/metre 2m deep",
     "u": "per metre",
     "r": 633
    },
    {
     "d": "110 PVC/metre 2m deep",
     "u": "per metre",
     "r": 585
    },
    {
     "d": "300PVC/metre",
     "u": "per metre",
     "r": 406,
     "ref": "206"
    },
    {
     "d": "225 PVC/metre",
     "u": "per metre",
     "r": 341,
     "ref": "207"
    },
    {
     "d": "150 PVC/metre",
     "u": "per metre",
     "r": 205,
     "ref": "208"
    },
    {
     "d": "100 PVC/metre",
     "u": "per metre",
     "r": 160,
     "ref": "209"
    },
    {
     "d": "80 PVC/metre",
     "u": "per metre",
     "r": 121,
     "ref": "210"
    },
    {
     "d": "65 PVC/metre",
     "u": "per metre",
     "r": 101,
     "ref": "211"
    },
    {
     "d": "50 PVC/metre",
     "u": "per metre",
     "r": 97,
     "ref": "212"
    },
    {
     "d": "40 PVC /metre",
     "u": "per metre",
     "r": 84,
     "ref": "213"
    },
    {
     "d": "300PVC Bend",
     "u": "each",
     "r": 402,
     "ref": "214"
    },
    {
     "d": "225 PVC Bend",
     "u": "each",
     "r": 273,
     "ref": "215"
    },
    {
     "d": "150 PVC Bend",
     "u": "each",
     "r": 139,
     "ref": "216"
    },
    {
     "d": "100 PVC Bend",
     "u": "each",
     "r": 101,
     "ref": "217"
    },
    {
     "d": "80 PVC Bend",
     "u": "each",
     "r": 105,
     "ref": "218"
    },
    {
     "d": "65 PVC Bend",
     "u": "each",
     "r": 92,
     "ref": "219"
    },
    {
     "d": "50 PVC Bend",
     "u": "each",
     "r": 83,
     "ref": "220"
    },
    {
     "d": "40 PVC Bend",
     "u": "each",
     "r": 76,
     "ref": "221"
    },
    {
     "d": "300 PVC Junction",
     "u": "each",
     "r": 478,
     "ref": "222"
    },
    {
     "d": "225 PVC Junction",
     "u": "each",
     "r": 312,
     "ref": "223"
    },
    {
     "d": "150 PVC Junction",
     "u": "each",
     "r": 142,
     "ref": "224"
    },
    {
     "d": "100 PVC Junction",
     "u": "each",
     "r": 121,
     "ref": "225"
    },
    {
     "d": "80 PVC Junction",
     "u": "each",
     "r": 108,
     "ref": "226"
    },
    {
     "d": "65 PVC Junction",
     "u": "each",
     "r": 94,
     "ref": "227"
    },
    {
     "d": "50 PVC Junction",
     "u": "each",
     "r": 91,
     "ref": "228"
    },
    {
     "d": "40 PVC Junction",
     "u": "each",
     "r": 90,
     "ref": "229"
    },
    {
     "d": "225 IO test and expansion joint",
     "u": "each",
     "r": 787,
     "ref": "230"
    },
    {
     "d": "150 IO test and expansion joint",
     "u": "each",
     "r": 238,
     "ref": "230"
    },
    {
     "d": "100 IO test and expansion joint",
     "u": "each",
     "r": 144,
     "ref": "230"
    },
    {
     "d": "100 Clear Out as Specified",
     "u": "each",
     "r": 390,
     "ref": "230"
    },
    {
     "d": "225 Clear Out as Specified",
     "u": "each",
     "r": 658,
     "ref": "231"
    },
    {
     "d": "Bucket trap floor waste",
     "u": "each",
     "r": 1038,
     "ref": "232"
    },
    {
     "d": "100 Stainless Steel floor waste riser with collar",
     "u": "each",
     "r": 624,
     "ref": "232"
    },
    {
     "d": "Plantroom floor waste with 100mm",
     "u": "each",
     "r": 553,
     "ref": "233"
    },
    {
     "d": "100 X 65 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 520,
     "ref": "234"
    },
    {
     "d": "100 X 50 Chrome Plated Floor Waste Gully",
     "u": "each",
     "r": 505,
     "ref": "235"
    },
    {
     "d": "100 Chrome Plated Floor Waste Grate",
     "u": "each",
     "r": 499,
     "ref": "236"
    },
    {
     "d": "150 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 674,
     "ref": "237"
    },
    {
     "d": "100 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 568,
     "ref": "238"
    },
    {
     "d": "80 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 507,
     "ref": "239"
    },
    {
     "d": "50 CI Roof Outlet with Nickel Bronze Grate",
     "u": "each",
     "r": 324,
     "ref": "240"
    },
    {
     "d": "100 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 595,
     "ref": "241"
    },
    {
     "d": "80 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 518,
     "ref": "242"
    },
    {
     "d": "50 CI Balcony Outlet with Nickel Bronze Gate",
     "u": "each",
     "r": 368,
     "ref": "243"
    },
    {
     "d": "Tundish exposed chrome plated 100mm x 50mm floor mounted",
     "u": "each",
     "r": 222,
     "ref": "203"
    },
    {
     "d": "InwallTundish (single point)",
     "u": "each",
     "r": 478,
     "ref": "203"
    },
    {
     "d": "50 PVC Tundish (trap and LIT only )",
     "u": "each",
     "r": 243,
     "ref": "203"
    },
    {
     "d": "50mm AAV",
     "u": "each",
     "r": 183,
     "ref": "203"
    },
    {
     "d": "100 Cap to end of pipe",
     "u": "each",
     "r": 69,
     "ref": "244"
    },
    {
     "d": "50 Cap to end of pipe",
     "u": "each",
     "r": 55,
     "ref": "245"
    }
   ]
  },
  {
   "title": "Gas Supply",
   "note": "",
   "lines": [
    {
     "d": "200mm copper pipe/metre",
     "u": "per metre",
     "r": 670,
     "ref": "248"
    },
    {
     "d": "150mm copper pipe/metre",
     "u": "per metre",
     "r": 549,
     "ref": "248"
    },
    {
     "d": "100 Copper Pipe/metre",
     "u": "per metre",
     "r": 403,
     "ref": "249"
    },
    {
     "d": "80 Copper Pipe/metre",
     "u": "per metre",
     "r": 336,
     "ref": "250"
    },
    {
     "d": "65 Copper Pipe/metre",
     "u": "per metre",
     "r": 245,
     "ref": "251"
    },
    {
     "d": "50 Copper Pipe/metre",
     "u": "per metre",
     "r": 220,
     "ref": "252"
    },
    {
     "d": "40 Copper Pipe/metre",
     "u": "per metre",
     "r": 162,
     "ref": "253"
    },
    {
     "d": "32 Copper Pipe/metre",
     "u": "per metre",
     "r": 140,
     "ref": "254"
    },
    {
     "d": "25 Copper Pipe/metre",
     "u": "per metre",
     "r": 127,
     "ref": "255"
    },
    {
     "d": "20 Copper Pipe/metre",
     "u": "per metre",
     "r": 79,
     "ref": "256"
    },
    {
     "d": "15 Copper Pipe/metre",
     "u": "per metre",
     "r": 67,
     "ref": "257"
    },
    {
     "d": "200mm copper bend",
     "u": "each",
     "r": 567,
     "ref": "258"
    },
    {
     "d": "150mm copper bend",
     "u": "each",
     "r": 420,
     "ref": "258"
    },
    {
     "d": "100 Copper Bend",
     "u": "each",
     "r": 233,
     "ref": "259"
    },
    {
     "d": "80 Copper Bend",
     "u": "each",
     "r": 168,
     "ref": "260"
    },
    {
     "d": "65 Copper Bend",
     "u": "each",
     "r": 125,
     "ref": "261"
    },
    {
     "d": "50 Copper Bend",
     "u": "each",
     "r": 100,
     "ref": "262"
    },
    {
     "d": "40 Copper Bend",
     "u": "each",
     "r": 83,
     "ref": "263"
    },
    {
     "d": "32 Copper Bend",
     "u": "each",
     "r": 62,
     "ref": "264"
    },
    {
     "d": "25 Copper Bend",
     "u": "each",
     "r": 54,
     "ref": "265"
    },
    {
     "d": "20 Copper Bend",
     "u": "each",
     "r": 47,
     "ref": "266"
    },
    {
     "d": "15 Copper Bend",
     "u": "each",
     "r": 37,
     "ref": "267"
    },
    {
     "d": "200mm copper tee",
     "u": "each",
     "r": 519,
     "ref": "268"
    },
    {
     "d": "150mm copper tee",
     "u": "each",
     "r": 466,
     "ref": "268"
    },
    {
     "d": "100 Copper Tee",
     "u": "each",
     "r": 270,
     "ref": "269"
    },
    {
     "d": "80 Copper Tee",
     "u": "each",
     "r": 195,
     "ref": "270"
    },
    {
     "d": "65 Copper Tee",
     "u": "each",
     "r": 171,
     "ref": "271"
    },
    {
     "d": "50 Copper Tee",
     "u": "each",
     "r": 141,
     "ref": "272"
    },
    {
     "d": "40 Copper Tee",
     "u": "each",
     "r": 116,
     "ref": "273"
    },
    {
     "d": "32 Copper Tee",
     "u": "each",
     "r": 85,
     "ref": "274"
    },
    {
     "d": "25 Copper Tee",
     "u": "each",
     "r": 58,
     "ref": "275"
    },
    {
     "d": "20 Copper Tee",
     "u": "each",
     "r": 42,
     "ref": "276"
    },
    {
     "d": "15 Copper Tee",
     "u": "each",
     "r": 35,
     "ref": "277"
    },
    {
     "d": "150 Ball valve",
     "u": "each",
     "r": 2000,
     "ref": "278"
    },
    {
     "d": "100 Ball valve",
     "u": "each",
     "r": 830,
     "ref": "279"
    },
    {
     "d": "80 Ball valve",
     "u": "each",
     "r": 829,
     "ref": "280"
    },
    {
     "d": "65 Ball valve",
     "u": "each",
     "r": 646,
     "ref": "281"
    },
    {
     "d": "50 Ball valve",
     "u": "each",
     "r": 407,
     "ref": "282"
    },
    {
     "d": "40 Ball valve",
     "u": "each",
     "r": 300,
     "ref": "283"
    },
    {
     "d": "32 Ball valve",
     "u": "each",
     "r": 245,
     "ref": "284"
    },
    {
     "d": "25 Ball valve",
     "u": "each",
     "r": 183,
     "ref": "285"
    },
    {
     "d": "20 Ball valve",
     "u": "each",
     "r": 133,
     "ref": "286"
    },
    {
     "d": "15 Ball valve",
     "u": "each",
     "r": 96,
     "ref": "287"
    },
    {
     "d": "200 cap to end of pipe",
     "u": "each",
     "r": 173,
     "ref": "278"
    },
    {
     "d": "150 cap to end of pipe",
     "u": "each",
     "r": 146,
     "ref": "278"
    },
    {
     "d": "100 cap to end of pipe",
     "u": "each",
     "r": 104,
     "ref": "279"
    },
    {
     "d": "80 cap to end of pipe",
     "u": "each",
     "r": 76,
     "ref": "280"
    },
    {
     "d": "65 cap to end of pipe",
     "u": "each",
     "r": 76,
     "ref": "281"
    },
    {
     "d": "50 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "282"
    },
    {
     "d": "40 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "283"
    },
    {
     "d": "32 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "284"
    },
    {
     "d": "25 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "285"
    },
    {
     "d": "20 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "286"
    },
    {
     "d": "15 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "287"
    }
   ]
  },
  {
   "title": "Cold Water Services",
   "note": "",
   "lines": [
    {
     "d": "200mm copper pipe/metre",
     "u": "per metre",
     "r": 670,
     "ref": "248"
    },
    {
     "d": "150mm copper pipe/metre",
     "u": "per metre",
     "r": 549,
     "ref": "290"
    },
    {
     "d": "100 Copper Pipe/metre",
     "u": "per metre",
     "r": 403,
     "ref": "291"
    },
    {
     "d": "80 Copper Pipe/metre",
     "u": "per metre",
     "r": 336,
     "ref": "292"
    },
    {
     "d": "65 Copper Pipe/metre",
     "u": "per metre",
     "r": 245,
     "ref": "293"
    },
    {
     "d": "50 Copper Pipe/metre",
     "u": "per metre",
     "r": 220,
     "ref": "294"
    },
    {
     "d": "40 Copper Pipe/metre",
     "u": "per metre",
     "r": 162,
     "ref": "295"
    },
    {
     "d": "32 Copper Pipe/metre",
     "u": "per metre",
     "r": 140,
     "ref": "296"
    },
    {
     "d": "25 Copper Pipe/metre",
     "u": "per metre",
     "r": 127,
     "ref": "297"
    },
    {
     "d": "20 Copper Pipe/metre",
     "u": "per metre",
     "r": 79,
     "ref": "298"
    },
    {
     "d": "15 Copper Pipe/metre",
     "u": "per metre",
     "r": 67,
     "ref": "299"
    },
    {
     "d": "200mm copper bend",
     "u": "each",
     "r": 567,
     "ref": "258"
    },
    {
     "d": "150mm copper bend",
     "u": "each",
     "r": 420,
     "ref": "300"
    },
    {
     "d": "100 Copper Bend",
     "u": "each",
     "r": 233,
     "ref": "301"
    },
    {
     "d": "80 Copper Bend",
     "u": "each",
     "r": 168,
     "ref": "302"
    },
    {
     "d": "65 Copper Bend",
     "u": "each",
     "r": 125,
     "ref": "303"
    },
    {
     "d": "50 Copper Bend",
     "u": "each",
     "r": 100,
     "ref": "304"
    },
    {
     "d": "40 Copper Bend",
     "u": "each",
     "r": 83,
     "ref": "305"
    },
    {
     "d": "32 Copper Bend",
     "u": "each",
     "r": 62,
     "ref": "306"
    },
    {
     "d": "25 Copper Bend",
     "u": "each",
     "r": 54,
     "ref": "307"
    },
    {
     "d": "20 Copper Bend",
     "u": "each",
     "r": 47,
     "ref": "308"
    },
    {
     "d": "15 Copper Bend",
     "u": "each",
     "r": 37,
     "ref": "309"
    },
    {
     "d": "200mm copper tee",
     "u": "each",
     "r": 519,
     "ref": "268"
    },
    {
     "d": "150mm copper tee",
     "u": "each",
     "r": 466,
     "ref": "310"
    },
    {
     "d": "100 Copper Tee",
     "u": "each",
     "r": 270,
     "ref": "311"
    },
    {
     "d": "80 Copper Tee",
     "u": "each",
     "r": 195,
     "ref": "312"
    },
    {
     "d": "65 Copper Tee",
     "u": "each",
     "r": 171,
     "ref": "313"
    },
    {
     "d": "50 Copper Tee",
     "u": "each",
     "r": 141,
     "ref": "314"
    },
    {
     "d": "40 Copper Tee",
     "u": "each",
     "r": 116,
     "ref": "315"
    },
    {
     "d": "32 Copper Tee",
     "u": "each",
     "r": 85,
     "ref": "316"
    },
    {
     "d": "25 Copper Tee",
     "u": "each",
     "r": 58,
     "ref": "317"
    },
    {
     "d": "20 Copper Tee",
     "u": "each",
     "r": 42,
     "ref": "318"
    },
    {
     "d": "15 Copper Tee",
     "u": "each",
     "r": 35,
     "ref": "319"
    },
    {
     "d": "100 HDPE Pipe/metre",
     "u": "per metre",
     "r": 329,
     "ref": "320"
    },
    {
     "d": "80 HDPE Pipe/metre",
     "u": "per metre",
     "r": 266,
     "ref": "321"
    },
    {
     "d": "65 HDPE Pipe/metre",
     "u": "per metre",
     "r": 212,
     "ref": "322"
    },
    {
     "d": "50 HDPE Pipe/metre",
     "u": "per metre",
     "r": 180,
     "ref": "323"
    },
    {
     "d": "40 HDPE Pipe/metre",
     "u": "per metre",
     "r": 151,
     "ref": "324"
    },
    {
     "d": "32 HDPE Pipe/metre",
     "u": "per metre",
     "r": 137,
     "ref": "325"
    },
    {
     "d": "25 HDPE Pipe/metre",
     "u": "per metre",
     "r": 121,
     "ref": "326"
    },
    {
     "d": "20 HDPE Pipe/metre",
     "u": "per metre",
     "r": 112,
     "ref": "327"
    },
    {
     "d": "100 HDPE Bend",
     "u": "each",
     "r": 536,
     "ref": "328"
    },
    {
     "d": "80 HDPE Bend",
     "u": "each",
     "r": 345,
     "ref": "329"
    },
    {
     "d": "65 HDPE Bend",
     "u": "each",
     "r": 283,
     "ref": "330"
    },
    {
     "d": "50 HDPE Bend",
     "u": "each",
     "r": 228,
     "ref": "331"
    },
    {
     "d": "40 HDPE Bend",
     "u": "each",
     "r": 187,
     "ref": "332"
    },
    {
     "d": "32 HDPE Bend",
     "u": "each",
     "r": 158,
     "ref": "333"
    },
    {
     "d": "25 HDPE Bend",
     "u": "each",
     "r": 145,
     "ref": "334"
    },
    {
     "d": "20 HDPE Bend",
     "u": "each",
     "r": 137,
     "ref": "335"
    },
    {
     "d": "100 HDPE Tee",
     "u": "each",
     "r": 690,
     "ref": "336"
    },
    {
     "d": "80 HDPE Tee",
     "u": "each",
     "r": 432,
     "ref": "337"
    },
    {
     "d": "65 HDPE Tee",
     "u": "each",
     "r": 345,
     "ref": "338"
    },
    {
     "d": "50 HDPE Tee",
     "u": "each",
     "r": 291,
     "ref": "339"
    },
    {
     "d": "40 HDPE Tee",
     "u": "each",
     "r": 254,
     "ref": "340"
    },
    {
     "d": "32 HDPE Tee",
     "u": "each",
     "r": 191,
     "ref": "341"
    },
    {
     "d": "25 HDPE Tee",
     "u": "each",
     "r": 133,
     "ref": "342"
    },
    {
     "d": "20 HDPE Tee",
     "u": "each",
     "r": 121,
     "ref": "343"
    },
    {
     "d": "80 Gate Valve",
     "u": "each",
     "r": 829,
     "ref": "344"
    },
    {
     "d": "65 Gate Valve",
     "u": "each",
     "r": 646,
     "ref": "345"
    },
    {
     "d": "50 Ball Valve",
     "u": "each",
     "r": 407,
     "ref": "346"
    },
    {
     "d": "40 Ball Valve",
     "u": "each",
     "r": 300,
     "ref": "347"
    },
    {
     "d": "32 Ball Valve",
     "u": "each",
     "r": 245,
     "ref": "348"
    },
    {
     "d": "25 Ball Valve",
     "u": "each",
     "r": 183,
     "ref": "349"
    },
    {
     "d": "20 Ball Valve",
     "u": "each",
     "r": 133,
     "ref": "350"
    },
    {
     "d": "15 Ball Valve",
     "u": "each",
     "r": 96,
     "ref": "351"
    },
    {
     "d": "100 Swing Check Valve",
     "u": "each",
     "r": 2159,
     "ref": "352"
    },
    {
     "d": "80 Swing Check Valve",
     "u": "each",
     "r": 1441,
     "ref": "353"
    },
    {
     "d": "65 Swing Check Valve",
     "u": "each",
     "r": 960,
     "ref": "354"
    },
    {
     "d": "50 Swing Check Valve",
     "u": "each",
     "r": 641,
     "ref": "355"
    },
    {
     "d": "40 Swing Check Valve",
     "u": "each",
     "r": 504,
     "ref": "356"
    },
    {
     "d": "32mm Double Check Valve",
     "u": "each",
     "r": 1595,
     "ref": "357"
    },
    {
     "d": "25mm Double Check Valve",
     "u": "each",
     "r": 1307,
     "ref": "358"
    },
    {
     "d": "20mm Double Check Valve",
     "u": "each",
     "r": 1115,
     "ref": "359"
    },
    {
     "d": "100 RPZD",
     "u": "each",
     "r": 13680,
     "ref": "360"
    },
    {
     "d": "80 RPZD",
     "u": "each",
     "r": 11002,
     "ref": "361"
    },
    {
     "d": "50 RPZD",
     "u": "each",
     "r": 3834,
     "ref": "362"
    },
    {
     "d": "40 RPZD",
     "u": "each",
     "r": 3477,
     "ref": "363"
    },
    {
     "d": "32 RPZD",
     "u": "each",
     "r": 3274,
     "ref": "364"
    },
    {
     "d": "25 RPZD",
     "u": "each",
     "r": 2569,
     "ref": "365"
    },
    {
     "d": "20 RPZD",
     "u": "each",
     "r": 2164,
     "ref": "366"
    },
    {
     "d": "50 Bronze Gate Valve",
     "u": "each",
     "r": 407,
     "ref": "367"
    },
    {
     "d": "40 Bronze Gate Valve",
     "u": "each",
     "r": 299,
     "ref": "368"
    },
    {
     "d": "32 Bronze Gate Valve",
     "u": "each",
     "r": 247,
     "ref": "369"
    },
    {
     "d": "25 Bronze Gate Valve",
     "u": "each",
     "r": 173,
     "ref": "370"
    },
    {
     "d": "20 Bronze Gate Valve",
     "u": "each",
     "r": 136,
     "ref": "371"
    },
    {
     "d": "15 Bronze Gate Valve",
     "u": "each",
     "r": 118,
     "ref": "372"
    },
    {
     "d": "32 water meter",
     "u": "each",
     "r": 970,
     "ref": "373"
    },
    {
     "d": "25 water meter",
     "u": "each",
     "r": 900,
     "ref": "374"
    },
    {
     "d": "20 water meter",
     "u": "each",
     "r": 832,
     "ref": "375"
    },
    {
     "d": "32 Pressure limiting valve",
     "u": "each",
     "r": 486,
     "ref": "376"
    },
    {
     "d": "25 Pressure limiting valve",
     "u": "each",
     "r": 426,
     "ref": "377"
    },
    {
     "d": "20 Pressure limiting valve",
     "u": "each",
     "r": 363,
     "ref": "378"
    },
    {
     "d": "20 Hose Tap",
     "u": "each",
     "r": 141,
     "ref": "379"
    },
    {
     "d": "15 trap primer",
     "u": "each",
     "r": 754,
     "ref": "380"
    },
    {
     "d": "200 cap to end of pipe",
     "u": "each",
     "r": 173,
     "ref": "278"
    },
    {
     "d": "150 cap to end of pipe",
     "u": "each",
     "r": 146,
     "ref": "278"
    },
    {
     "d": "100 cap to end of pipe",
     "u": "each",
     "r": 104,
     "ref": "279"
    },
    {
     "d": "80 cap to end of pipe",
     "u": "each",
     "r": 76,
     "ref": "280"
    },
    {
     "d": "65 cap to end of pipe",
     "u": "each",
     "r": 76,
     "ref": "281"
    },
    {
     "d": "50 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "282"
    },
    {
     "d": "40 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "283"
    },
    {
     "d": "32 cap to end of pipe",
     "u": "each",
     "r": 53,
     "ref": "284"
    },
    {
     "d": "25 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "285"
    },
    {
     "d": "20 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "286"
    },
    {
     "d": "15 cap to end of pipe",
     "u": "each",
     "r": 41,
     "ref": "287"
    }
   ]
  },
  {
   "title": "Recycled Water Services",
   "note": "",
   "lines": [
    {
     "d": "100 Copper Pipe/metre",
     "u": "per metre",
     "r": 403,
     "ref": "384"
    },
    {
     "d": "80 Copper Pipe/metre",
     "u": "per metre",
     "r": 336,
     "ref": "385"
    },
    {
     "d": "65 Copper Pipe/metre",
     "u": "per metre",
     "r": 245,
     "ref": "386"
    },
    {
     "d": "50 Copper Pipe/metre",
     "u": "per metre",
     "r": 220,
     "ref": "387"
    },
    {
     "d": "40 Copper Pipe/metre",
     "u": "per metre",
     "r": 162,
     "ref": "388"
    },
    {
     "d": "32 Copper Pipe/metre",
     "u": "per metre",
     "r": 140,
     "ref": "389"
    },
    {
     "d": "25 Copper Pipe/metre",
     "u": "per metre",
     "r": 127,
     "ref": "390"
    },
    {
     "d": "20 Copper Pipe/metre",
     "u": "per metre",
     "r": 79,
     "ref": "391"
    },
    {
     "d": "15 Copper Pipe/metre",
     "u": "per metre",
     "r": 67,
     "ref": "392"
    },
    {
     "d": "100 Copper Bend",
     "u": "each",
     "r": 233,
     "ref": "393"
    },
    {
     "d": "80 Copper Bend",
     "u": "each",
     "r": 168,
     "ref": "394"
    },
    {
     "d": "65 Copper Bend",
     "u": "each",
     "r": 125,
     "ref": "395"
    },
    {
     "d": "50 Copper Bend",
     "u": "each",
     "r": 100,
     "ref": "396"
    },
    {
     "d": "40 Copper Bend",
     "u": "each",
     "r": 83,
     "ref": "397"
    },
    {
     "d": "32 Copper Bend",
     "u": "each",
     "r": 62,
     "ref": "398"
    },
    {
     "d": "25 Copper Bend",
     "u": "each",
     "r": 54,
     "ref": "399"
    },
    {
     "d": "20 Copper Bend",
     "u": "each",
     "r": 47,
     "ref": "400"
    },
    {
     "d": "15 Copper Bend",
     "u": "each",
     "r": 37,
     "ref": "401"
    },
    {
     "d": "100 Copper Tee",
     "u": "each",
     "r": 270,
     "ref": "402"
    },
    {
     "d": "80 Copper Tee",
     "u": "each",
     "r": 195,
     "ref": "403"
    },
    {
     "d": "65 Copper Tee",
     "u": "each",
     "r": 171,
     "ref": "404"
    },
    {
     "d": "50 Copper Tee",
     "u": "each",
     "r": 141,
     "ref": "405"
    },
    {
     "d": "40 Copper Tee",
     "u": "each",
     "r": 116,
     "ref": "406"
    },
    {
     "d": "32 Copper Tee",
     "u": "each",
     "r": 85,
     "ref": "407"
    },
    {
     "d": "25 Copper Tee",
     "u": "each",
     "r": 58,
     "ref": "408"
    },
    {
     "d": "20 Copper Tee",
     "u": "each",
     "r": 42,
     "ref": "409"
    },
    {
     "d": "15 Copper Tee",
     "u": "each",
     "r": 35,
     "ref": "410"
    },
    {
     "d": "100 HDPE Pipe/metre",
     "u": "per metre",
     "r": 329,
     "ref": "411"
    },
    {
     "d": "80 HDPE Pipe/metre",
     "u": "per metre",
     "r": 266,
     "ref": "412"
    },
    {
     "d": "65 HDPE Pipe/metre",
     "u": "per metre",
     "r": 212,
     "ref": "413"
    },
    {
     "d": "50 HDPE Pipe/metre",
     "u": "per metre",
     "r": 180,
     "ref": "414"
    },
    {
     "d": "40 HDPE Pipe/metre",
     "u": "per metre",
     "r": 151,
     "ref": "415"
    },
    {
     "d": "32 HDPE Pipe/metre",
     "u": "per metre",
     "r": 137,
     "ref": "416"
    },
    {
     "d": "25 HDPE Pipe/metre",
     "u": "per metre",
     "r": 121,
     "ref": "417"
    },
    {
     "d": "20 HDPE Pipe/metre",
     "u": "per metre",
     "r": 112,
     "ref": "418"
    },
    {
     "d": "100 HDPE Bend",
     "u": "each",
     "r": 536,
     "ref": "419"
    },
    {
     "d": "80 HDPE Bend",
     "u": "each",
     "r": 345,
     "ref": "420"
    },
    {
     "d": "65 HDPE Bend",
     "u": "each",
     "r": 283,
     "ref": "421"
    },
    {
     "d": "50 HDPE Bend",
     "u": "each",
     "r": 228,
     "ref": "422"
    },
    {
     "d": "40 HDPE Bend",
     "u": "each",
     "r": 187,
     "ref": "423"
    },
    {
     "d": "32 HDPE Bend",
     "u": "each",
     "r": 158,
     "ref": "424"
    },
    {
     "d": "25 HDPE Bend",
     "u": "each",
     "r": 145,
     "ref": "425"
    },
    {
     "d": "20 HDPE Bend",
     "u": "each",
     "r": 137,
     "ref": "426"
    },
    {
     "d": "100 HDPE Tee",
     "u": "each",
     "r": 690,
     "ref": "427"
    },
    {
     "d": "80 HDPE Tee",
     "u": "each",
     "r": 432,
     "ref": "428"
    },
    {
     "d": "65 HDPE Tee",
     "u": "each",
     "r": 345,
     "ref": "429"
    },
    {
     "d": "50 HDPE Tee",
     "u": "each",
     "r": 291,
     "ref": "430"
    },
    {
     "d": "40 HDPE Tee",
     "u": "each",
     "r": 254,
     "ref": "431"
    },
    {
     "d": "32 HDPE Tee",
     "u": "each",
     "r": 191,
     "ref": "432"
    },
    {
     "d": "25 HDPE Tee",
     "u": "each",
     "r": 133,
     "ref": "433"
    },
    {
     "d": "20 HDPE Tee",
     "u": "each",
     "r": 121,
     "ref": "434"
    },
    {
     "d": "80 Gate Valve",
     "u": "each",
     "r": 829,
     "ref": "435"
    },
    {
     "d": "65 Gate Valve",
     "u": "each",
     "r": 646,
     "ref": "436"
    },
    {
     "d": "50 Ball Valve",
     "u": "each",
     "r": 407,
     "ref": "437"
    },
    {
     "d": "40 Ball Valve",
     "u": "each",
     "r": 300,
     "ref": "438"
    },
    {
     "d": "32 Ball Valve",
     "u": "each",
     "r": 245,
     "ref": "439"
    },
    {
     "d": "25 Ball Valve",
     "u": "each",
     "r": 183,
     "ref": "440"
    },
    {
     "d": "20 Ball Valve",
     "u": "each",
     "r": 133,
     "ref": "441"
    },
    {
     "d": "15 Ball Valve",
     "u": "each",
     "r": 96,
     "ref": "442"
    },
    {
     "d": "100 Swing Check Valve",
     "u": "each",
     "r": 2159,
     "ref": "443"
    },
    {
     "d": "80 Swing Check Valve",
     "u": "each",
     "r": 1441,
     "ref": "444"
    },
    {
     "d": "65 Swing Check Valve",
     "u": "each",
     "r": 960,
     "ref": "445"
    },
    {
     "d": "50 Swing Check Valve",
     "u": "each",
     "r": 641,
     "ref": "446"
    },
    {
     "d": "40 Swing Check Valve",
     "u": "each",
     "r": 504,
     "ref": "447"
    },
    {
     "d": "32mm Double Check Valve",
     "u": "each",
     "r": 1595,
     "ref": "448"
    },
    {
     "d": "25mm Double Check Valve",
     "u": "each",
     "r": 1307,
     "ref": "449"
    },
    {
     "d": "20mm Double Check Valve",
     "u": "each",
     "r": 1115,
     "ref": "450"
    },
    {
     "d": "100 RPZD",
     "u": "each",
     "r": 13680,
     "ref": "451"
    },
    {
     "d": "80 RPZD",
     "u": "each",
     "r": 11002,
     "ref": "452"
    },
    {
     "d": "50 RPZD",
     "u": "each",
     "r": 3834,
     "ref": "453"
    },
    {
     "d": "40 RPZD",
     "u": "each",
     "r": 3477,
     "ref": "454"
    },
    {
     "d": "32 RPZD",
     "u": "each",
     "r": 3274,
     "ref": "455"
    },
    {
     "d": "25 RPZD",
     "u": "each",
     "r": 2569,
     "ref": "456"
    },
    {
     "d": "20 RPZD",
     "u": "each",
     "r": 2164,
     "ref": "457"
    },
    {
     "d": "50 Bronze Gate Valve",
     "u": "each",
     "r": 407,
     "ref": "458"
    },
    {
     "d": "40 Bronze Gate Valve",
     "u": "each",
     "r": 299,
     "ref": "459"
    },
    {
     "d": "32 Bronze Gate Valve",
     "u": "each",
     "r": 247,
     "ref": "460"
    },
    {
     "d": "25 Bronze Gate Valve",
     "u": "each",
     "r": 173,
     "ref": "461"
    },
    {
     "d": "20 Bronze Gate Valve",
     "u": "each",
     "r": 136,
     "ref": "462"
    },
    {
     "d": "15 Bronze Gate Valve",
     "u": "each",
     "r": 118,
     "ref": "463"
    },
    {
     "d": "32 water meter",
     "u": "each",
     "r": 970,
     "ref": "464"
    },
    {
     "d": "25 water meter",
     "u": "each",
     "r": 900,
     "ref": "465"
    },
    {
     "d": "20 water meter",
     "u": "each",
     "r": 832,
     "ref": "466"
    },
    {
     "d": "32 Pressure limiting valve",
     "u": "each",
     "r": 486,
     "ref": "467"
    },
    {
     "d": "25 Pressure limiting valve",
     "u": "each",
     "r": 426,
     "ref": "468"
    },
    {
     "d": "20 Pressure limiting valve",
     "u": "each",
     "r": 363,
     "ref": "469"
    },
    {
     "d": "20 Hose Tap",
     "u": "each",
     "r": 141,
     "ref": "470"
    },
    {
     "d": "15 trap primer",
     "u": "each",
     "r": 754,
     "ref": "471"
    },
    {
     "d": "25 capped",
     "u": "each",
     "r": 41,
     "ref": "472"
    }
   ]
  },
  {
   "title": "Hot Water Services",
   "note": "",
   "lines": [
    {
     "d": "100 Copper Pipe/metre",
     "u": "per metre",
     "r": 403,
     "ref": "475"
    },
    {
     "d": "80 Copper Pipe/metre",
     "u": "per metre",
     "r": 336,
     "ref": "476"
    },
    {
     "d": "65 Copper Pipe/metre",
     "u": "per metre",
     "r": 245,
     "ref": "477"
    },
    {
     "d": "50 Copper Pipe/metre",
     "u": "per metre",
     "r": 220,
     "ref": "478"
    },
    {
     "d": "40 Copper Pipe/metre",
     "u": "per metre",
     "r": 162,
     "ref": "479"
    },
    {
     "d": "32 Copper Pipe/metre",
     "u": "per metre",
     "r": 140,
     "ref": "480"
    },
    {
     "d": "25 Copper Pipe/metre",
     "u": "per metre",
     "r": 127,
     "ref": "481"
    },
    {
     "d": "20 Copper Pipe/metre",
     "u": "per metre",
     "r": 79,
     "ref": "482"
    },
    {
     "d": "15 Copper Pipe/metre",
     "u": "per metre",
     "r": 67,
     "ref": "483"
    },
    {
     "d": "100 Copper Bend",
     "u": "each",
     "r": 233,
     "ref": "484"
    },
    {
     "d": "80 Copper Bend",
     "u": "each",
     "r": 168,
     "ref": "485"
    },
    {
     "d": "65 Copper Bend",
     "u": "each",
     "r": 125,
     "ref": "486"
    },
    {
     "d": "50 Copper Bend",
     "u": "each",
     "r": 100,
     "ref": "487"
    },
    {
     "d": "40 Copper Bend",
     "u": "each",
     "r": 83,
     "ref": "488"
    },
    {
     "d": "32 Copper Bend",
     "u": "each",
     "r": 62,
     "ref": "489"
    },
    {
     "d": "25 Copper Bend",
     "u": "each",
     "r": 54,
     "ref": "490"
    },
    {
     "d": "20 Copper Bend",
     "u": "each",
     "r": 47,
     "ref": "491"
    },
    {
     "d": "15 Copper Bend",
     "u": "each",
     "r": 37,
     "ref": "492"
    },
    {
     "d": "100 Copper Tee",
     "u": "each",
     "r": 270,
     "ref": "493"
    },
    {
     "d": "80 Copper Tee",
     "u": "each",
     "r": 195,
     "ref": "494"
    },
    {
     "d": "65 Copper Tee",
     "u": "each",
     "r": 171,
     "ref": "495"
    },
    {
     "d": "50 Copper Tee",
     "u": "each",
     "r": 141,
     "ref": "496"
    },
    {
     "d": "40 Copper Tee",
     "u": "each",
     "r": 116,
     "ref": "497"
    },
    {
     "d": "32 Copper Tee",
     "u": "each",
     "r": 85,
     "ref": "498"
    },
    {
     "d": "25 Copper Tee",
     "u": "each",
     "r": 58,
     "ref": "499"
    },
    {
     "d": "20 Copper Tee",
     "u": "each",
     "r": 42,
     "ref": "500"
    },
    {
     "d": "15 Copper Tee",
     "u": "each",
     "r": 35,
     "ref": "501"
    },
    {
     "d": "80 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 215,
     "ref": "502"
    },
    {
     "d": "65 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 197,
     "ref": "503"
    },
    {
     "d": "50 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 178,
     "ref": "504"
    },
    {
     "d": "40 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 162,
     "ref": "505"
    },
    {
     "d": "32 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 150,
     "ref": "506"
    },
    {
     "d": "25 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 123,
     "ref": "507"
    },
    {
     "d": "20 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 111,
     "ref": "508"
    },
    {
     "d": "15 Thermal lagging & sheathing Pipe/metre",
     "u": "each",
     "r": 104,
     "ref": "509"
    },
    {
     "d": "80mm - Thermal Lagging / metre",
     "u": "each",
     "r": 112,
     "ref": "510"
    },
    {
     "d": "65mm - Thermal Lagging / metre",
     "u": "each",
     "r": 104,
     "ref": "511"
    },
    {
     "d": "50mm - Thermal Lagging / metre",
     "u": "each",
     "r": 96,
     "ref": "512"
    },
    {
     "d": "40mm - Thermal Lagging / metre",
     "u": "each",
     "r": 87,
     "ref": "513"
    },
    {
     "d": "32mm - Thermal Lagging / metre",
     "u": "each",
     "r": 79,
     "ref": "514"
    },
    {
     "d": "25mm - Thermal Lagging / metre",
     "u": "each",
     "r": 69,
     "ref": "515"
    },
    {
     "d": "20mm - Thermal Lagging / metre",
     "u": "each",
     "r": 58,
     "ref": "516"
    },
    {
     "d": "15mm - Thermal Lagging / metre",
     "u": "each",
     "r": 53,
     "ref": "517"
    },
    {
     "d": "80 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 215,
     "ref": "518"
    },
    {
     "d": "65 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 197,
     "ref": "519"
    },
    {
     "d": "50 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 179,
     "ref": "520"
    },
    {
     "d": "40 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 162,
     "ref": "521"
    },
    {
     "d": "32 Thermal lagging & sheathing copper Bend",
     "u": "each",
     "r": 150,
     "ref": "522"
    },
    {
     "d": "25 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 123,
     "ref": "523"
    },
    {
     "d": "20 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 112,
     "ref": "524"
    },
    {
     "d": "15 Thermal lagging & sheathing, copper Bend",
     "u": "each",
     "r": 104,
     "ref": "525"
    },
    {
     "d": "80mm - Thermal Lagging / bend",
     "u": "each",
     "r": 112,
     "ref": "526"
    },
    {
     "d": "65mm - Thermal Lagging / bend",
     "u": "each",
     "r": 104,
     "ref": "527"
    },
    {
     "d": "50mm - Thermal Lagging / bend",
     "u": "each",
     "r": 96,
     "ref": "528"
    },
    {
     "d": "40mm - Thermal Lagging / bend",
     "u": "each",
     "r": 87,
     "ref": "529"
    },
    {
     "d": "32mm - Thermal Lagging / bend",
     "u": "each",
     "r": 79,
     "ref": "530"
    },
    {
     "d": "25mm - Thermal Lagging / bend",
     "u": "each",
     "r": 69,
     "ref": "531"
    },
    {
     "d": "20mm - Thermal Lagging / bend",
     "u": "each",
     "r": 58,
     "ref": "532"
    },
    {
     "d": "15mm - Thermal Lagging / bend",
     "u": "each",
     "r": 30,
     "ref": "533"
    },
    {
     "d": "80 Thermal lagging & sheathing, copper Tee",
     "u": "each",
     "r": 249,
     "ref": "534"
    },
    {
     "d": "65 Thermal lagging & sheathing, copper Tee",
     "u": "each",
     "r": 232,
     "ref": "535"
    },
    {
     "d": "50 Thermal lagging & sheathing, copper Tee",
     "u": "each",
     "r": 214,
     "ref": "536"
    },
    {
     "d": "40 Thermal lagging & sheathing copper Tee",
     "u": "each",
     "r": 194,
     "ref": "537"
    },
    {
     "d": "32 Thermal lagging & sheathing copper Tee",
     "u": "each",
     "r": 180,
     "ref": "538"
    },
    {
     "d": "25 Thermal lagging & sheathing copper Tee",
     "u": "each",
     "r": 148,
     "ref": "539"
    },
    {
     "d": "20 Thermal lagging & sheathing, copper Tee",
     "u": "each",
     "r": 134,
     "ref": "540"
    },
    {
     "d": "15 Thermal lagging & sheathing copper Tee",
     "u": "each",
     "r": 125,
     "ref": "541"
    },
    {
     "d": "50mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 115,
     "ref": "542"
    },
    {
     "d": "40mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 105,
     "ref": "543"
    },
    {
     "d": "32mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 93,
     "ref": "544"
    },
    {
     "d": "25mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 83,
     "ref": "545"
    },
    {
     "d": "20mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 71,
     "ref": "546"
    },
    {
     "d": "15mm - Thermal Lagging / Tee",
     "u": "each",
     "r": 66,
     "ref": "547"
    },
    {
     "d": "50 Bronze Gate Valve",
     "u": "each",
     "r": 407,
     "ref": "548"
    },
    {
     "d": "40 Bronze Gate Valve",
     "u": "each",
     "r": 299,
     "ref": "549"
    },
    {
     "d": "32 Bronze Gate Valve",
     "u": "each",
     "r": 247,
     "ref": "550"
    },
    {
     "d": "25 Bronze Gate Valve",
     "u": "each",
     "r": 173,
     "ref": "551"
    },
    {
     "d": "20 Bronze Gate Valve",
     "u": "each",
     "r": 136,
     "ref": "552"
    },
    {
     "d": "15 Bronze Gate Valve",
     "u": "each",
     "r": 118,
     "ref": "553"
    },
    {
     "d": "50 STAD Valve",
     "u": "each",
     "r": 843,
     "ref": "554"
    },
    {
     "d": "40 STAD Valve",
     "u": "each",
     "r": 710,
     "ref": "555"
    },
    {
     "d": "32 STAD Valve",
     "u": "each",
     "r": 556,
     "ref": "556"
    },
    {
     "d": "24 STAD Valve",
     "u": "each",
     "r": 456,
     "ref": "557"
    },
    {
     "d": "20 STAD Valve",
     "u": "each",
     "r": 374,
     "ref": "558"
    },
    {
     "d": "15 STAD Valve",
     "u": "each",
     "r": 311,
     "ref": "559"
    },
    {
     "d": "STAD and STAF microprocessor computer balancing device",
     "u": "each",
     "r": 1730,
     "ref": "560"
    },
    {
     "d": "100 Swing Check Valve",
     "u": "each",
     "r": 2159,
     "ref": "561"
    },
    {
     "d": "80 Swing Check Valve",
     "u": "each",
     "r": 1441,
     "ref": "562"
    },
    {
     "d": "65 Swing Check Valve",
     "u": "each",
     "r": 960,
     "ref": "563"
    },
    {
     "d": "50 Swing Check Valve",
     "u": "each",
     "r": 641,
     "ref": "564"
    },
    {
     "d": "40 Swing Check Valve",
     "u": "each",
     "r": 504,
     "ref": "565"
    },
    {
     "d": "32mm Double Check Valve",
     "u": "each",
     "r": 1595,
     "ref": "566"
    },
    {
     "d": "25mm Double Check Valve",
     "u": "each",
     "r": 1307,
     "ref": "567"
    },
    {
     "d": "20mm Double Check Valve",
     "u": "each",
     "r": 1115,
     "ref": "568"
    },
    {
     "d": "100 RPZD",
     "u": "each",
     "r": 13680,
     "ref": "569"
    },
    {
     "d": "80 RPZD",
     "u": "each",
     "r": 11002,
     "ref": "570"
    },
    {
     "d": "50 RPZD",
     "u": "each",
     "r": 3834,
     "ref": "571"
    },
    {
     "d": "40 RPZD",
     "u": "each",
     "r": 3477,
     "ref": "572"
    },
    {
     "d": "32 RPZD",
     "u": "each",
     "r": 3274,
     "ref": "573"
    },
    {
     "d": "25 RPZD",
     "u": "each",
     "r": 2569,
     "ref": "574"
    },
    {
     "d": "20 RPZD",
     "u": "each",
     "r": 2164,
     "ref": "575"
    },
    {
     "d": "32 water meter (install only. Supplied by others)",
     "u": "each",
     "r": 970,
     "ref": "576"
    },
    {
     "d": "25 water meter (install only. Supplied by others)",
     "u": "each",
     "r": 900,
     "ref": "577"
    },
    {
     "d": "20 water meter (install only. Supplied by others)",
     "u": "each",
     "r": 832,
     "ref": "578"
    },
    {
     "d": "32 Pressure limiting valve",
     "u": "each",
     "r": 486,
     "ref": "579"
    },
    {
     "d": "25 Pressure limiting valve",
     "u": "each",
     "r": 426,
     "ref": "580"
    },
    {
     "d": "20 Pressure limiting valve",
     "u": "each",
     "r": 363,
     "ref": "581"
    },
    {
     "d": "20 Hose Tap",
     "u": "each",
     "r": 141,
     "ref": "582"
    },
    {
     "d": "Thermostatic mixing valve",
     "u": "each",
     "r": 1353,
     "ref": "583"
    }
   ]
  },
  {
   "title": "RIR Water Services",
   "note": "",
   "lines": [
    {
     "d": "100 Copper Pipe/metre",
     "u": "per metre",
     "r": 403,
     "ref": "586"
    },
    {
     "d": "80 Copper Pipe/metre",
     "u": "per metre",
     "r": 336,
     "ref": "587"
    },
    {
     "d": "65 Copper Pipe/metre",
     "u": "per metre",
     "r": 245,
     "ref": "588"
    },
    {
     "d": "50 Copper Pipe/metre",
     "u": "per metre",
     "r": 220,
     "ref": "589"
    },
    {
     "d": "40 Copper Pipe/metre",
     "u": "per metre",
     "r": 162,
     "ref": "590"
    },
    {
     "d": "32 Copper Pipe/metre",
     "u": "per metre",
     "r": 140,
     "ref": "591"
    },
    {
     "d": "25 Copper Pipe/metre",
     "u": "per metre",
     "r": 127,
     "ref": "592"
    },
    {
     "d": "20 Copper Pipe/metre",
     "u": "per metre",
     "r": 79,
     "ref": "593"
    },
    {
     "d": "15 Copper Pipe/metre",
     "u": "per metre",
     "r": 67,
     "ref": "594"
    },
    {
     "d": "100 Copper Bend",
     "u": "each",
     "r": 233,
     "ref": "595"
    },
    {
     "d": "80 Copper Bend",
     "u": "each",
     "r": 168,
     "ref": "596"
    },
    {
     "d": "65 Copper Bend",
     "u": "each",
     "r": 125,
     "ref": "597"
    },
    {
     "d": "50 Copper Bend",
     "u": "each",
     "r": 100,
     "ref": "598"
    },
    {
     "d": "40 Copper Bend",
     "u": "each",
     "r": 83,
     "ref": "599"
    },
    {
     "d": "32 Copper Bend",
     "u": "each",
     "r": 62,
     "ref": "600"
    },
    {
     "d": "25 Copper Bend",
     "u": "each",
     "r": 54,
     "ref": "601"
    },
    {
     "d": "20 Copper Bend",
     "u": "each",
     "r": 47,
     "ref": "602"
    },
    {
     "d": "15 Copper Bend",
     "u": "each",
     "r": 37,
     "ref": "603"
    },
    {
     "d": "100 Copper Tee",
     "u": "each",
     "r": 270,
     "ref": "604"
    },
    {
     "d": "80 Copper Tee",
     "u": "each",
     "r": 195,
     "ref": "605"
    },
    {
     "d": "65 Copper Tee",
     "u": "each",
     "r": 171,
     "ref": "606"
    },
    {
     "d": "50 Copper Tee",
     "u": "each",
     "r": 141,
     "ref": "607"
    },
    {
     "d": "40 Copper Tee",
     "u": "each",
     "r": 116,
     "ref": "608"
    },
    {
     "d": "32 Copper Tee",
     "u": "each",
     "r": 85,
     "ref": "609"
    },
    {
     "d": "25 Copper Tee",
     "u": "each",
     "r": 58,
     "ref": "610"
    },
    {
     "d": "20 Copper Tee",
     "u": "each",
     "r": 42,
     "ref": "611"
    },
    {
     "d": "15 Copper Tee",
     "u": "each",
     "r": 35,
     "ref": "612"
    },
    {
     "d": "100 HDPE Pipe/metre",
     "u": "per metre",
     "r": 329,
     "ref": "613"
    },
    {
     "d": "80 HDPE Pipe/metre",
     "u": "per metre",
     "r": 266,
     "ref": "614"
    },
    {
     "d": "65 HDPE Pipe/metre",
     "u": "per metre",
     "r": 212,
     "ref": "615"
    },
    {
     "d": "50 HDPE Pipe/metre",
     "u": "per metre",
     "r": 180,
     "ref": "616"
    },
    {
     "d": "40 HDPE Pipe/metre",
     "u": "per metre",
     "r": 151,
     "ref": "617"
    },
    {
     "d": "32 HDPE Pipe/metre",
     "u": "per metre",
     "r": 137,
     "ref": "618"
    },
    {
     "d": "25 HDPE Pipe/metre",
     "u": "per metre",
     "r": 121,
     "ref": "619"
    },
    {
     "d": "20 HDPE Pipe/metre",
     "u": "per metre",
     "r": 112,
     "ref": "620"
    },
    {
     "d": "100 HDPE Bend",
     "u": "each",
     "r": 536,
     "ref": "621"
    },
    {
     "d": "80 HDPE Bend",
     "u": "each",
     "r": 345,
     "ref": "622"
    },
    {
     "d": "65 HDPE Bend",
     "u": "each",
     "r": 283,
     "ref": "623"
    },
    {
     "d": "50 HDPE Bend",
     "u": "each",
     "r": 228,
     "ref": "624"
    },
    {
     "d": "40 HDPE Bend",
     "u": "each",
     "r": 187,
     "ref": "625"
    },
    {
     "d": "32 HDPE Bend",
     "u": "each",
     "r": 158,
     "ref": "626"
    },
    {
     "d": "25 HDPE Bend",
     "u": "each",
     "r": 145,
     "ref": "627"
    },
    {
     "d": "20 HDPE Bend",
     "u": "each",
     "r": 137,
     "ref": "628"
    },
    {
     "d": "100 HDPE Tee",
     "u": "each",
     "r": 690,
     "ref": "629"
    },
    {
     "d": "80 HDPE Tee",
     "u": "each",
     "r": 432,
     "ref": "630"
    },
    {
     "d": "65 HDPE Tee",
     "u": "each",
     "r": 345,
     "ref": "631"
    },
    {
     "d": "50 HDPE Tee",
     "u": "each",
     "r": 291,
     "ref": "632"
    },
    {
     "d": "40 HDPE Tee",
     "u": "each",
     "r": 254,
     "ref": "633"
    },
    {
     "d": "32 HDPE Tee",
     "u": "each",
     "r": 191,
     "ref": "634"
    },
    {
     "d": "25 HDPE Tee",
     "u": "each",
     "r": 133,
     "ref": "635"
    },
    {
     "d": "20 HDPE Tee",
     "u": "each",
     "r": 121,
     "ref": "636"
    },
    {
     "d": "80 Gate Valve",
     "u": "each",
     "r": 829,
     "ref": "637"
    },
    {
     "d": "65 Gate Valve",
     "u": "each",
     "r": 646,
     "ref": "638"
    },
    {
     "d": "50 Ball Valve",
     "u": "each",
     "r": 407,
     "ref": "639"
    },
    {
     "d": "40 Ball Valve",
     "u": "each",
     "r": 300,
     "ref": "640"
    },
    {
     "d": "32 Ball Valve",
     "u": "each",
     "r": 245,
     "ref": "641"
    },
    {
     "d": "25 Ball Valve",
     "u": "each",
     "r": 183,
     "ref": "642"
    },
    {
     "d": "20 Ball Valve",
     "u": "each",
     "r": 133,
     "ref": "643"
    },
    {
     "d": "15 Ball Valve",
     "u": "each",
     "r": 96,
     "ref": "644"
    },
    {
     "d": "100 Swing Check Valve",
     "u": "each",
     "r": 2159,
     "ref": "645"
    },
    {
     "d": "80 Swing Check Valve",
     "u": "each",
     "r": 1441,
     "ref": "646"
    },
    {
     "d": "65 Swing Check Valve",
     "u": "each",
     "r": 960,
     "ref": "647"
    },
    {
     "d": "50 Swing Check Valve",
     "u": "each",
     "r": 641,
     "ref": "648"
    },
    {
     "d": "40 Swing Check Valve",
     "u": "each",
     "r": 504,
     "ref": "649"
    },
    {
     "d": "32mm Double Check Valve",
     "u": "each",
     "r": 1595,
     "ref": "650"
    },
    {
     "d": "25mm Double Check Valve",
     "u": "each",
     "r": 1307,
     "ref": "651"
    },
    {
     "d": "20mm Double Check Valve",
     "u": "each",
     "r": 1115,
     "ref": "652"
    },
    {
     "d": "100 RPZD",
     "u": "each",
     "r": 13680,
     "ref": "653"
    },
    {
     "d": "80 RPZD",
     "u": "each",
     "r": 11002,
     "ref": "654"
    },
    {
     "d": "50 RPZD",
     "u": "each",
     "r": 3834,
     "ref": "655"
    },
    {
     "d": "40 RPZD",
     "u": "each",
     "r": 3477,
     "ref": "656"
    },
    {
     "d": "32 RPZD",
     "u": "each",
     "r": 3274,
     "ref": "657"
    },
    {
     "d": "25 RPZD",
     "u": "each",
     "r": 2569,
     "ref": "658"
    },
    {
     "d": "20 RPZD",
     "u": "each",
     "r": 2164,
     "ref": "659"
    },
    {
     "d": "50 Bronze Gate Valve",
     "u": "each",
     "r": 407,
     "ref": "660"
    },
    {
     "d": "40 Bronze Gate Valve",
     "u": "each",
     "r": 299,
     "ref": "661"
    },
    {
     "d": "32 Bronze Gate Valve",
     "u": "each",
     "r": 247,
     "ref": "662"
    },
    {
     "d": "25 Bronze Gate Valve",
     "u": "each",
     "r": 173,
     "ref": "663"
    },
    {
     "d": "20 Bronze Gate Valve",
     "u": "each",
     "r": 136,
     "ref": "664"
    },
    {
     "d": "15 Bronze Gate Valve",
     "u": "each",
     "r": 118,
     "ref": "665"
    },
    {
     "d": "32 water meter",
     "u": "each",
     "r": 970,
     "ref": "666"
    },
    {
     "d": "25 water meter",
     "u": "each",
     "r": 900,
     "ref": "667"
    },
    {
     "d": "20 water meter",
     "u": "each",
     "r": 832,
     "ref": "668"
    },
    {
     "d": "32 Pressure limiting valve",
     "u": "each",
     "r": 486,
     "ref": "669"
    },
    {
     "d": "25 Pressure limiting valve",
     "u": "each",
     "r": 426,
     "ref": "670"
    },
    {
     "d": "20 Pressure limiting valve",
     "u": "each",
     "r": 363,
     "ref": "671"
    },
    {
     "d": "20 Hose Tap",
     "u": "each",
     "r": 141,
     "ref": "672"
    },
    {
     "d": "15 trap primer",
     "u": "each",
     "r": 754,
     "ref": "673"
    },
    {
     "d": "25 capped",
     "u": "each",
     "r": 41,
     "ref": "674"
    }
   ]
  },
  {
   "title": "Flues/Vents/Flashings",
   "note": "",
   "lines": [
    {
     "d": "100mm plant flue - straight pipe",
     "u": "each",
     "r": 329,
     "ref": "688"
    },
    {
     "d": "200mm plant flue - straight pipe",
     "u": "each",
     "r": 572,
     "ref": "688"
    },
    {
     "d": "300mm plant flue - straight pipe",
     "u": "each",
     "r": 730,
     "ref": "689"
    },
    {
     "d": "100mm plant flue - bend",
     "u": "each",
     "r": 570,
     "ref": "690"
    },
    {
     "d": "200mm plant flue - bend",
     "u": "each",
     "r": 1049,
     "ref": "690"
    },
    {
     "d": "300mm plant flue - bend",
     "u": "each",
     "r": 1461,
     "ref": "691"
    },
    {
     "d": "100mm plant flue - junction",
     "u": "each",
     "r": 762,
     "ref": "690"
    },
    {
     "d": "200mm plant flue - junction",
     "u": "each",
     "r": 1331,
     "ref": "690"
    },
    {
     "d": "300mm plant flue - junction",
     "u": "each",
     "r": 1886,
     "ref": "691"
    },
    {
     "d": "100mm plant flue - end cap",
     "u": "each",
     "r": 286,
     "ref": "691"
    },
    {
     "d": "200mm plant flue - end cap",
     "u": "each",
     "r": 456,
     "ref": "691"
    },
    {
     "d": "300mm plant flue - end cap",
     "u": "each",
     "r": 516,
     "ref": "688"
    },
    {
     "d": "100mm plant flue - draught diverter",
     "u": "each",
     "r": 410,
     "ref": "689"
    },
    {
     "d": "200mm plant flue - draught diverter",
     "u": "each",
     "r": 649,
     "ref": "689"
    },
    {
     "d": "300mm plant flue - draught diverter",
     "u": "each",
     "r": 798,
     "ref": "691"
    },
    {
     "d": "50mm - weather apron (dectite)",
     "u": "each",
     "r": 187,
     "ref": "691"
    },
    {
     "d": "100mm - weather apron (dectite)",
     "u": "each",
     "r": 208,
     "ref": "691"
    },
    {
     "d": "150mm - weather apron (dectite)",
     "u": "each",
     "r": 229,
     "ref": "691"
    },
    {
     "d": "225mm - weather apron (dectite)",
     "u": "each",
     "r": 526,
     "ref": "691"
    },
    {
     "d": "300mm - weather apron (dectite)",
     "u": "each",
     "r": 623,
     "ref": "691"
    },
    {
     "d": "50mm - cowl (PVC)",
     "u": "each",
     "r": 42,
     "ref": "691"
    },
    {
     "d": "100mm - cowl (PVC)",
     "u": "each",
     "r": 53,
     "ref": "691"
    },
    {
     "d": "150mm - cowl (PVC)",
     "u": "each",
     "r": 71,
     "ref": "691"
    },
    {
     "d": "225mm - cowl (PVC)",
     "u": "each",
     "r": 173,
     "ref": "691"
    },
    {
     "d": "300mm - cowl (PVC)",
     "u": "each",
     "r": 381,
     "ref": "691"
    },
    {
     "d": "150mm - cowl (gas)",
     "u": "each",
     "r": 1088,
     "ref": "691"
    },
    {
     "d": "225mm - cowl (gas)",
     "u": "each",
     "r": 1339,
     "ref": "691"
    },
    {
     "d": "300mm - cowl (gas)",
     "u": "each",
     "r": 1671,
     "ref": "691"
    }
   ]
  },
  {
   "title": "Other Pricing",
   "note": "works below occcur concurrently with base build works for the relevent floor/area/service",
   "lines": [
    {
     "d": "Supply and Installation of an additional Bucket Floor Trap during construction, including additional pipe to first junction at main drainage up to 12m length (PVC only, excludes coring)",
     "u": "each",
     "r": 3457,
     "ref": "677"
    },
    {
     "d": "Extra over for acoustics to the above if required",
     "u": "each",
     "r": 2075,
     "ref": "677"
    },
    {
     "d": "Supply and installation of an additional Floor Waste Trap during construction, including additional pipe to first junction at main drainage up to 12m length (PVC only, excludes coring)",
     "u": "each",
     "r": 2427,
     "ref": "678"
    },
    {
     "d": "Extra over for acoustics to the above if required",
     "u": "each",
     "r": 2079,
     "ref": "677"
    },
    {
     "d": "Supply and installation of an additional Sink Waste during construction, including additional pipe to first junction at main drainage up to 12m length (PVC only, excludes coring)",
     "u": "each",
     "r": 1659,
     "ref": "679"
    },
    {
     "d": "Extra over for acoustics to the above if required",
     "u": "each",
     "r": 2075,
     "ref": "677"
    },
    {
     "d": "Slab Detection for Live Power Conduits & Isolation for carrying out Additional drainage coreholes (1.5hrs allowance)",
     "u": "each",
     "r": 1178,
     "ref": "680"
    },
    {
     "d": "Supply and Installation of Tundish & Drain (PVC only, adjacent to existing stack, excludes condensate dranage and coring)",
     "u": "each",
     "r": 1247,
     "ref": "681"
    },
    {
     "d": "Supply and Installation of Tundish & Drain. Max. 12 mtr run (PVC only, excludes condensate dranage and coring)",
     "u": "each",
     "r": 2427,
     "ref": "681"
    },
    {
     "d": "Extra over for acoustics to the above if required",
     "u": "each",
     "r": 2076,
     "ref": "677"
    },
    {
     "d": "Supply and Installation of Sewer/Trade Waste Grade Pipework up to 100mm dia for Drainage Lines including bends, connections, joints etc. In Ground Works",
     "u": "each",
     "r": 2147,
     "ref": "682"
    },
    {
     "d": "Cap and Make Good Redundant Drain Points (including make good/patching etc.). Up to Max 100mm core hole only and 100mm pipework",
     "u": "each",
     "r": 387,
     "ref": "684"
    },
    {
     "d": "Additional 20mm water supply point during co(max. 12 mtr run)",
     "u": "each",
     "r": 1384,
     "ref": "685"
    }
   ]
  }
 ],
 "notes": [
  "Excluded - All Core holes including engineer approval, core hole Permit applications, spotting and installing temporary peno covers",
  "Excluded - Costs for variation works not completed concurrently with base build works for a specific floor/area/service, ie out of sequence works",
  "Qualify - PVC has been used for all gravity drainage works not cast in concrete. HDPE only for grease waste and where sewer is to be castin into structure",
  "Excluded - Gravity drainage below Ground Floor and drainage turnups (to be completed by Basement contractor)",
  "Excluded - Acoustic lagging other than for drainage systems in office areas (excludes bathrooms, plantrooms, etc)"
 ]
};
