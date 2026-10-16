/* ============================================================================
   SETTINGS LOCK
   ============================================================================

   Settings holds the Power Automate URLs and the office register. A colleague
   wandering in and changing either breaks the app for everyone, so it asks for
   a password.

   WHAT THIS IS, PLAINLY. The app is static files running in a browser, so
   everything it does is visible to anyone who opens developer tools, and this
   check can be stepped around by someone who wants to. It is a lock on a
   cupboard, not a safe. It stops accidents and casual poking, which is what
   actually goes wrong. If the settings need protecting from someone determined,
   that has to happen above the app -- Netlify's own password protection or an
   identity provider in front of the whole site.

   The password itself is never stored. What is stored is a salted hash of it,
   iterated, so the password cannot be read out of the source even though the
   hash can.

   THE SALT AND HASH ARE NOT IN THIS FILE. They sit on their own in
   assets/settings-password.js, which is the single file that gets replaced to
   change the password -- in the app under Settings, or with
   tools/set-settings-password.js. This file never changes, so there is nothing
   here to keep in step with it.

   Full detail, including how to deploy a change: docs/SETTINGS-PASSWORD.md
============================================================================ */

// settings-password.js declares SETTINGS_LOCK. If it is missing -- a half-copied
// folder -- the app must still run, unlocked, rather than dying on load.
const LOCK = (typeof SETTINGS_LOCK !== 'undefined' && SETTINGS_LOCK)
  ? SETTINGS_LOCK
  : { salt: '', hash: '', iterations: 60000 };

const SettingsLock = (() => {
  /* ---- SHA-256, so this works the same everywhere -----------------------
     Not crypto.subtle: that needs a secure context and is simply absent when
     the bundled single file is opened from disk, which is exactly where people
     try the app first. A wrong answer there would be a lock that cannot be
     opened rather than one that is not needed. --------------------------- */
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  function sha256(text){
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    const bytes = [];
    // UTF-8 by hand, surrogate pairs included, so an emoji in the password
    // hashes to what every other UTF-8 encoder would give. Without the pair
    // case a password set by the Node tool would not open the app.
    for(let i = 0; i < text.length; i++){
      let c = text.codePointAt(i);
      if(c > 0xffff) i++;
      if(c < 128) bytes.push(c);
      else if(c < 2048) bytes.push(192 | (c >> 6), 128 | (c & 63));
      else if(c < 65536) bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
      else bytes.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while(bytes.length % 64 !== 56) bytes.push(0);
    for(let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);

    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const w = new Array(64);

    for(let off = 0; off < bytes.length; off += 64){
      for(let i = 0; i < 16; i++){
        w[i] = (bytes[off+i*4] << 24) | (bytes[off+i*4+1] << 16) | (bytes[off+i*4+2] << 8) | bytes[off+i*4+3];
      }
      for(let i = 16; i < 64; i++){
        const s0 = rr(w[i-15],7) ^ rr(w[i-15],18) ^ (w[i-15] >>> 3);
        const s1 = rr(w[i-2],17) ^ rr(w[i-2],19) ^ (w[i-2] >>> 10);
        w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for(let i = 0; i < 64; i++){
        const S1 = rr(e,6) ^ rr(e,11) ^ rr(e,25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rr(a,2) ^ rr(a,13) ^ rr(a,22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  // Iterated so that guessing against the published hash costs something.
  function derive(password, salt, iterations){
    let h = sha256(salt + password);
    for(let i = 1; i < iterations; i++) h = sha256(salt + h);
    return h;
  }

  function isLocked(){
    return !!(LOCK.hash && LOCK.salt);
  }

  // What the app keys an unlock to, so that changing the password turns every
  // open session out. Public by design — it is already in the page source.
  function fingerprint(){
    return LOCK.hash || '';
  }

  function verify(password){
    if(!isLocked()) return true;
    const got = derive(String(password || ''), LOCK.salt, LOCK.iterations);
    // length-independent compare, out of habit rather than need: the hash is
    // public anyway, so there is nothing here to leak by timing
    if(got.length !== LOCK.hash.length) return false;
    let diff = 0;
    for(let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ LOCK.hash.charCodeAt(i);
    return diff === 0;
  }

  /* ---- the replacement file ---------------------------------------------
     Both ways of setting a password end here, so there is one definition of
     what settings-password.js looks like and no second copy to drift. */
  function fileSource(salt, hash, iterations){
    const hex = /^[0-9a-f]*$/;
    if(!hex.test(salt) || !hex.test(hash)) throw new Error('salt and hash must be hex');
    if(!(iterations > 0)) throw new Error('iterations must be a positive number');
    return [
      '/* Generated. The Settings password for this deployment.',
      ' *',
      ' * The password itself is not here and cannot be recovered from this file —',
      ' * only a salted hash of it. To change it, replace this one file:',
      ' *   in the app:  Settings -> D. Password on this screen -> Create the file',
      ' *   with Node:   node tools/set-settings-password.js "the password"',
      ' *',
      ' * Empty salt and hash, as below, mean Settings is open to anyone. That is how',
      ' * the app ships. See docs/SETTINGS-PASSWORD.md.',
      ' */',
      'const SETTINGS_LOCK = {',
      "  salt: '" + salt + "',",
      "  hash: '" + hash + "',",
      '  iterations: ' + iterations,
      '};',
      ''
    ].join('\n');
  }

  // A salt only has to be unguessable and unique per deployment.
  function makeSalt(){
    const bytes = new Uint8Array(16);
    if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for(let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const DEFAULT_ITERATIONS = 60000;

  return { isLocked, fingerprint, verify, derive, sha256, fileSource, makeSalt, DEFAULT_ITERATIONS };
})();
