LUDOVIC LACHANCE - PORTFOLIO — website
======================================

WHAT'S IN THIS FOLDER
---------------------
  index.html   The page itself
  style.css    The terminal look (colours, layout, the banker's walk)
  script.js    The game logic (routes, section windows, the 2D map)
  map3d.js     The 3D city (statue, towers, lobbies and billboards, the banker)
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
The main site is a small 3D city. A marble statue of Ludovic stands on the
plaza in the middle. Each of the 8 sections is a skyscraper around it, joined
to the plaza by a road and to each other by a ring road. Walk into a tower's
front door to go inside: its lobby lays the section out on billboards, one
per entry (each case competition, each job, each pitch...).

Outside
  W A S D  or  arrow keys   walk
  Shift (hold)              run
  Space                     jump
  Enter (or E)              go inside the tower you're standing at
  1 – 8                     walk the route to that tower and go inside
  T                         guided route: walks to tower 1, then use
                            "NEXT" in each window to walk to the next one
  C                         classic view (everything on one plain page)
  M                         switch between the 3D city and the original 2D map
  Click a tower to walk there and go in; click the ground to walk to that spot.

Inside a tower
  Walk up to a billboard    the camera turns to face it so you can read it
  Enter (or click it)       open the full details window at that entry
  Esc                       close the window / leave the tower
  You can also walk back out through the EXIT door.

On phones: tap a tower or a billboard and the banker walks there; there's an
on-screen arrow pad with a JUMP button. Towers between the camera and the
banker turn see-through so he's never hidden.

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
