VARIATION COVER SHEET — THE FOLDER YOU DEPLOY
=============================================

This folder is the website. Drag this whole folder onto Netlify:

    Netlify -> your site -> Deploys -> drag the folder onto the drop zone

New site instead: Sites -> Add new site -> Deploy manually, then drag it.

Drag the FOLDER, not the files inside it.


KEEP THIS FOLDER
----------------
There is no connection between Netlify and the repository, so the site only
ever changes when you drag this folder again. Keep this one folder as the real
one, make changes in it, and drag it after each change. Two half-updated
copies is the way this goes wrong.


WHAT CHANGES, AND WHEN YOU NEED TO RE-DRAG
------------------------------------------
assets/settings-password.js   the Settings password.
                              Set it in the app: Settings -> C -> Create the
                              file, then drop the download in here over the
                              old one. Re-drag.

assets/state-register.js      the per-office letterhead (section 1).
                              Settings -> B -> Export as file, paste the block
                              in. Re-drag.

Everything else in here is the app itself. Re-drag after any change to it.

The Power Automate flow URLs are NOT in this folder and never should be. Each
person pastes them into Settings once, on each device they use. They are
credentials: anyone holding one can run the flow.


IF YOU LOCK YOURSELF OUT OF SETTINGS
------------------------------------
Open assets/settings-password.js in Notepad. Blank the two quoted values so
they read

    salt: '',
    hash: '',

Save, re-drag the folder. Settings is open again and you can set a new
password from inside it.


The full guides are in the repository under docs/, and as Word documents in
docs/word/. They are deliberately not in this folder, because everything in
here is published on the public web address.
