LUDO <GO> — portfolio website
=============================

WHAT'S IN THIS FOLDER
---------------------
  index.html   The page itself
  style.css    The terminal look (colours, layout, the banker's walk)
  script.js    The game logic (routes, section windows, the 2D map)
  map3d.js     The 3D map (the banker, roads, signs, camera)
  lib\         three.min.js, the free 3D library the map uses (don't edit)
  data.js      ALL YOUR CONTENT  <-- this is the file you edit
  files\       Put your PDFs here (resume + pitch PDFs)


HOW TO RUN IT
-------------
Easiest: double-click index.html. It opens in your web browser. No installs needed.

In Visual Studio (the purple one):
  1. File > Open > Folder...  and pick the "Portfolio project" folder
  2. In Solution Explorer, right-click index.html > "View in Browser"
     (or press Ctrl+Shift+W)

In Visual Studio Code (the blue one):
  1. File > Open Folder...  and pick the "Portfolio project" folder
  2. Install the free "Live Server" extension (Extensions tab, search
     "Live Server" by Ritwick Dey), then right-click index.html >
     "Open with Live Server". The page refreshes itself every time you save.

After you edit a file, save it and refresh the browser (F5).


HOW IT WORKS
------------
The main site is the 3D map. The banker starts at HQ in the middle. The 8
sections are signs in a circle around him, joined to HQ by roads and to each
other by a ring road.

  W A S D  or  arrow keys   walk
  Shift (hold)              run
  Space                     jump
  Enter (or E)              open the sign you're standing near
  1 – 8                     walk the route to that section and open it
  T                         guided route: walks to section 1, then use
                            "NEXT" in each window to walk to the next one
  Esc                       close a section
  C                         classic view (everything on one plain page)
  M                         switch between the 3D map and the original 2D map

You can also click any sign (the banker walks there first and opens it), or
click anywhere on the ground to walk to that spot. On phones there's an
on-screen arrow pad with a JUMP button.

THE ORIGINAL 2D MAP
The first version of the map is still there. Get to it with the "M 2D MAP"
button at the bottom right, the M key, or the "Or explore the original 2D map"
link on the start screen. Its address ends in  ?map=2d#map  so you can link to
it directly. Browsers that can't do 3D get the 2D map automatically.


HOW TO PUT YOUR CONTENT IN
--------------------------
Open data.js. Everything in [brackets] is a placeholder. Replace it with your
real information, keeping the "quotation marks" around each piece of text.

  - name, title, about, badges   -> About Me
  - sections                     -> the 8 sections, in order around the circle
  - pitches                      -> your stock pitches (shown in the Pitches section)

For a pitch, write the call as exactly "Buy", "Hold" or "Sell" and it turns
green, amber or red automatically. "team" and "role" show on the pitch page
so visitors know it was a group pitch.

To add another pitch: copy one whole { ... } pitch block, paste it after the
last one (with a comma between blocks) and give it a new id like "p5".

To add another case competition, venture, job or extracurricular: copy one { title: ... } block
inside that section's "items" list and paste it below (comma between blocks).

Socials: for email, just type the address (e.g. "you@example.com").
For LinkedIn or a website, paste the full link starting with https://


PDFS
----
Drop your PDFs into the "files" folder, then point to them in data.js, e.g.
  resumePdf: "files/resume.pdf"      (the RESUME button in About Me)
  pdf: "files/linde-pitch.pdf"       (a pitch's full PDF)


PUTTING IT ONLINE (when you're ready)
-------------------------------------
Free and easy: go to app.netlify.com/drop and drag this whole folder onto the
page. You get a live link in seconds. GitHub Pages also works.
