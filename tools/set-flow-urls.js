#!/usr/bin/env node
/* Build the Power Automate trigger URLs into the app.

       node tools/set-flow-urls.js --projects "https://…" --file "https://…" \
                                   --log-read "https://…" --log-write "https://…" \
                                   --describe "https://…"
       node tools/set-flow-urls.js --clear
       node tools/set-flow-urls.js --show

   Needs Node. If you do not have it, you do not need it: the app does the same
   job under Settings -> C -> Build the URLs in.

   It writes assets/flow-config.js. Any flag you leave out keeps whatever that
   file already holds, so you can set one flow without retyping the others.

   THESE ARE CREDENTIALS. A trigger URL's sig= value is the whole
   authentication, and this file ends up in what gets deployed, readable by
   anyone served the page. Only do this behind a sign-in.

   This script writes into your checkout, and the repository this app lives in
   is public. Committing a filled-in assets/flow-config.js would put all five
   URLs on the open internet and in the git history, where deleting the file
   afterwards does not remove them. Run --clear once you have deployed, or use
   the in-app route (Settings -> C), which never touches the repository.

   The file's layout comes from assets/flow-urls.js itself, so this script and
   the app cannot drift apart: one definition, loaded here rather than copied.
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ASSETS = path.join(__dirname, '..', 'assets');
const URLS_FILE = path.join(ASSETS, 'flow-config.js');
const MODULE_FILE = path.join(ASSETS, 'flow-urls.js');

const FLAGS = {
  '--projects': 'projectsUrl',
  '--file': 'fileUrl',
  '--log-read': 'logReadUrl',
  '--log-write': 'logWriteUrl',
  '--describe': 'describeUrl'
};

function load(){
  for(const f of [URLS_FILE, MODULE_FILE]){
    if(!fs.existsSync(f)) { console.error('missing: ' + f); process.exit(1); }
  }
  // The data file, then the module that reads and rewrites it — the app's own
  // definition of both, rather than a copy living here.
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(URLS_FILE, 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(MODULE_FILE, 'utf8')
    + ';this.FLOW_URLS = FLOW_URLS; this.FlowUrls = FlowUrls;', ctx);
  return ctx;
}

const { FLOW_URLS, FlowUrls } = load();
const args = process.argv.slice(2);

function show(urls){
  FlowUrls.KEYS.forEach(k => {
    const v = (urls[k] || '').trim();
    console.log('  ' + k.padEnd(14) + (v ? v.slice(0, 60) + (v.length > 60 ? '…' : '') : '(not set)'));
  });
}

if(args[0] === '--show'){
  console.log('Built into assets/flow-config.js:');
  show(FLOW_URLS);
  process.exit(0);
}

if(!args.length || args[0] === '--help' || args[0] === '-h'){
  console.log('usage: node tools/set-flow-urls.js --projects "https://…" [--file …] [--log-read …]');
  console.log('                                   [--log-write …] [--describe …]');
  console.log('       node tools/set-flow-urls.js --clear');
  console.log('       node tools/set-flow-urls.js --show');
  process.exit(args.length ? 0 : 1);
}

const next = {};
FlowUrls.KEYS.forEach(k => { next[k] = (FLOW_URLS[k] || '').trim(); });

if(args[0] === '--clear'){
  FlowUrls.KEYS.forEach(k => { next[k] = ''; });
}else{
  for(let i = 0; i < args.length; i += 2){
    const key = FLAGS[args[i]];
    if(!key){
      console.error('Unknown option "' + args[i] + '". Known: ' + Object.keys(FLAGS).join(', '));
      process.exit(1);
    }
    if(i + 1 >= args.length){
      console.error(args[i] + ' needs a URL after it.');
      process.exit(1);
    }
    next[key] = args[i + 1];
  }
}

let source;
try {
  source = FlowUrls.fileSource(next);          // validates each one
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
fs.writeFileSync(URLS_FILE, source, 'utf8');

const count = FlowUrls.KEYS.filter(k => next[k]).length;
console.log(count ? count + ' of 5 URLs built in:' : 'Cleared — no URLs are built in.');
if(count) show(next);
console.log('');
console.log('Written to assets/flow-config.js. Not live until you deploy:');
console.log('  python3 tools/make-deploy-folder.py     then drag the folder onto Netlify');
console.log('');
if(count){
  console.log('!! assets/flow-config.js now holds real credentials and THIS REPOSITORY IS PUBLIC.');
  console.log('!! Do not commit it. Run --clear once the deploy is done.');
  console.log('!! git update-index --assume-unchanged assets/flow-config.js  hides it from accidents.');
}
