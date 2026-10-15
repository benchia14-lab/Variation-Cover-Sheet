#!/usr/bin/env node
/* Set the password that guards the Settings screen.

       node tools/set-settings-password.js "the password"
       node tools/set-settings-password.js --clear

   This needs Node installed. If you do not have it, you do not need it: the
   app does the same job under Settings -> C. Password on this screen, and
   downloads the same file.

   It writes assets/settings-password.js — a salt and a hash, nothing else. The
   password itself is never written anywhere and never printed, so it is safe to
   run with the output on screen.

   Deploying the change depends on how the site gets to Netlify:
     drag-and-drop   put the new assets/settings-password.js in the folder you
                     drag, and drag the folder again
     linked to git   commit and push assets/settings-password.js
   Either way, rebuild the standalone copy if you hand that out:
     python3 build-single-file.py

   --clear leaves Settings open to anyone, which is how the app ships.

   The hashing and the file's layout both come from assets/settings-lock.js, so
   this script and the app cannot drift apart: there is one implementation and
   one template, loaded here rather than copied.
*/
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOCK_CODE = path.join(ASSETS, 'settings-lock.js');
const PASSWORD_FILE = path.join(ASSETS, 'settings-password.js');

function loadLock(){
  if(!fs.existsSync(LOCK_CODE)){
    console.error('missing: ' + LOCK_CODE);
    process.exit(1);
  }
  // The browser's own implementation, run here. Node has webcrypto, which is
  // what makeSalt() reaches for.
  const ctx = { crypto: crypto.webcrypto };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(LOCK_CODE, 'utf8') + ';this.SettingsLock = SettingsLock;', ctx);
  return ctx.SettingsLock;
}

function write(source){
  fs.writeFileSync(PASSWORD_FILE, source, 'utf8');
}

function deployNote(){
  console.log('');
  console.log('Written to assets/settings-password.js. It is not live until you deploy:');
  console.log('  drag-and-drop   put this file in the assets folder of the folder you drag,');
  console.log('                  then drag that folder onto Netlify again');
  console.log('  linked to git   git add assets/settings-password.js && git commit && git push');
  console.log('Hand out the standalone copy as well? Rebuild it:  python3 build-single-file.py');
}

const SettingsLock = loadLock();
const arg = process.argv[2];

if(arg === '--clear'){
  write(SettingsLock.fileSource('', '', SettingsLock.DEFAULT_ITERATIONS));
  console.log('Password removed — Settings will be open to anyone.');
  deployNote();
  process.exit(0);
}

if(!arg || arg === '--help' || arg === '-h'){
  console.log('usage: node tools/set-settings-password.js "the password"');
  console.log('       node tools/set-settings-password.js --clear');
  process.exit(arg ? 0 : 1);
}

if(arg.length < 8){
  console.error('That password is ' + arg.length + ' characters. Use at least 8.');
  console.error('The hash ships in the page source, so a short password is guessable offline.');
  process.exit(1);
}

const salt = SettingsLock.makeSalt();
const started = Date.now();
const hash = SettingsLock.derive(arg, salt, SettingsLock.DEFAULT_ITERATIONS);
write(SettingsLock.fileSource(salt, hash, SettingsLock.DEFAULT_ITERATIONS));

console.log('Password set.');
console.log('  salt       ' + salt);
console.log('  hash       ' + hash);
console.log('  iterations ' + SettingsLock.DEFAULT_ITERATIONS + '  (' + (Date.now() - started) + ' ms to check)');
deployNote();
console.log('');
console.log('Keep the password somewhere safe — it is not recoverable from the file.');
console.log('Anyone with Settings open in a tab stays in until they close it.');
