/* =====================================================================
   LUDOVIC LACHANCE - PORTFOLIO — behaviour
   You normally don't need to edit this file: content lives in data.js.
   ===================================================================== */
(function () {
  "use strict";

  var P = window.PORTFOLIO;
  if (!P) {
    document.body.innerHTML = "<p style='color:#FFFFFF;padding:24px;font-family:monospace'>data.js did not load. Make sure data.js is in the same folder as index.html.</p>";
    return;
  }

  /* ---------- world geometry ---------- */
  var WORLD = 1600;
  var HUB = { x: 800, y: 800 };
  var R = 400;              // radius of the ring the sections sit on
  var STAND = 112;          // the banker stops this far in front of a section
  var ZONE = 150;           // how close counts as "at" a section
  var WALK_SPEED = 330;     // px / second when following a route
  var KEY_SPEED = 290;      // px / second with WASD / arrows
  var LIMIT = R + 230;      // how far from HQ you can wander
  var STORE_KEY = "ludo-go-v1";

  /* ---------- 3D or 2D map? ----------
     The 3D map is the default. Add ?map=2d to the address (or use the
     "2D MAP" button) for the original flat map. Browsers without 3D
     support fall back to the 2D map automatically. */
  var params = (function () { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } })();
  var use3D = params.get("map") !== "2d" && !!(window.Map3D && window.Map3D.supported());

  /* ---------- helpers ---------- */
  function $(s) { return document.querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function pitchById(id) { for (var i = 0; i < P.pitches.length; i++) if (P.pitches[i].id === id) return P.pitches[i]; return null; }
  function sectionIndex(id) { for (var i = 0; i < P.sections.length; i++) if (P.sections[i].id === id) return i; return -1; }
  function callClass(call) {
    var c = String(call || "").trim().toLowerCase();
    if (c === "buy" || c === "outperform" || c === "overweight") return "call-buy";
    if (c === "sell" || c === "underperform" || c === "underweight") return "call-sell";
    if (c === "hold" || c === "neutral" || c === "market perform") return "call-hold";
    return "";
  }
  function socialsSection() { var i = sectionIndex("socials"); return i >= 0 ? P.sections[i] : null; }
  function socialHref(l) {
    if (!l || !l.url) return "";
    if (l.kind === "email" && l.url.indexOf("mailto:") !== 0) return "mailto:" + l.url;
    return l.url;
  }
  function socialByKind(kind) {
    var s = socialsSection();
    if (!s) return null;
    for (var i = 0; i < s.links.length; i++) if (s.links[i].kind === kind) return s.links[i];
    return null;
  }
  function resumeSection() { var i = sectionIndex("resume"); return i >= 0 ? P.sections[i] : null; }

  /* ---------- the investment banker ---------- */
  var BANKER_SVG =
    '<svg viewBox="0 0 60 104" width="60" height="104" aria-hidden="true">' +
    '<ellipse cx="30" cy="100" rx="16" ry="3.5" fill="#000" opacity="0.6"/>' +
    '<ellipse cx="30" cy="100" rx="22" ry="5" fill="#FFFFFF" opacity="0.12"/>' +
    '<g class="bob">' +
      // back arm
      '<g class="arm arm-b"><rect x="27" y="35" width="7" height="24" rx="3.5" fill="#14243A"/><circle cx="30.5" cy="60" r="3.2" fill="#D6A985"/></g>' +
      // back leg
      '<g class="leg leg-b"><rect x="26.5" y="60" width="7.5" height="32" rx="3" fill="#1A2232"/><path d="M25.5 92 H37 A3 3 0 0 1 40 95 V96.5 H25.5 Z" fill="#050505"/></g>' +
      // front leg
      '<g class="leg leg-f"><rect x="26.5" y="60" width="7.5" height="32" rx="3" fill="#25324A"/><path d="M25.5 92 H37 A3 3 0 0 1 40 95 V96.5 H25.5 Z" fill="#111"/><path d="M27 93.5 H37" stroke="#3A3A3A" stroke-width="0.8"/></g>' +
      // jacket
      '<path d="M19 39 Q19 32 25.5 31 H35 Q41.5 32 41.5 39 L42.5 64 H18 Z" fill="#1F3556"/>' +
      '<path d="M18 61 H42.4 V64 H18 Z" fill="#182B47"/>' +
      // shirt, tie, lapel, pocket square
      '<path d="M28 31 H36 L32 42 Z" fill="#F5F5F5"/>' +
      '<path d="M31.3 32.6 H33.1 L34 43.5 L32.2 46.5 L30.5 43.5 Z" fill="#B3243A"/>' +
      '<path d="M36 31.3 L32 42 L30 63" stroke="#10213A" stroke-width="1" fill="none"/>' +
      '<path d="M36.4 43.2 H40.2 L39.7 45.3 H36.8 Z" fill="#F5F5F5"/>' +
      // neck + head
      '<rect x="28" y="26" width="6" height="6" fill="#D6A985"/>' +
      '<circle cx="31.5" cy="19" r="9" fill="#E7C29F"/>' +
      // slicked-back hair
      '<path d="M22.4 19.5 Q21.8 9 31.5 9 Q39.6 9 40.6 15.2 Q36 12.6 31 13.6 Q27.5 14.6 26.6 19.8 L23.6 22 Z" fill="#20160F"/>' +
      '<path d="M27 11.2 Q32 9.6 37.5 11.6" stroke="#3A2A1C" stroke-width="0.8" fill="none"/>' +
      // ear, eye, brow, smile
      '<ellipse cx="27.8" cy="19.6" rx="1.7" ry="2.1" fill="#D6A985"/>' +
      '<circle cx="35.6" cy="18.6" r="1.1" fill="#141414"/>' +
      '<path d="M34 15.9 H37.4" stroke="#20160F" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M35 23.1 Q36.7 24 38.2 23" stroke="#7A4B33" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
      // front arm + briefcase
      '<g class="arm arm-f">' +
        '<rect x="27" y="34" width="7.5" height="25" rx="3.7" fill="#28456F"/>' +
        '<rect x="27.2" y="55" width="7.1" height="2.2" fill="#F5F5F5"/>' +
        '<circle cx="30.8" cy="60" r="3.3" fill="#E7C29F"/>' +
        '<path d="M28 61.5 V59 A1.5 1.5 0 0 1 29.5 57.5 H32.5 A1.5 1.5 0 0 1 34 59 V61.5" stroke="#2E1B0E" stroke-width="1.6" fill="none"/>' +
        '<rect x="20" y="61.5" width="22" height="14.5" rx="2" fill="#5C3A1E" stroke="#2E1B0E" stroke-width="1"/>' +
        '<path d="M20.5 66 H41.5" stroke="#4A2E17" stroke-width="0.8"/>' +
        '<rect x="29.4" y="64.8" width="3.2" height="2.6" fill="#D4A62A"/>' +
      "</g>" +
    "</g></svg>";

  /* ---------- section icons ---------- */
  var ICONS = {
    about: '<circle cx="12" cy="8" r="4"/><path d="M4 21 C5 16 19 16 20 21"/>',
    pitches: '<path d="M4 19 L9 13 L13 16 L20 7"/><path d="M15 7 H20 V12"/>',
    cases: '<path d="M8 4 H16 V9 A4 4 0 0 1 8 9 Z"/><path d="M8 6 H5 A3 3 0 0 0 8 10 M16 6 H19 A3 3 0 0 1 16 10"/><path d="M12 13 V17 M8 20 H16"/>',
    ventures: '<path d="M9 18 H15 M10 21 H14"/><path d="M12 3 A6 6 0 0 0 8 13.5 C9 14.5 9 15.5 9 16 H15 C15 15.5 15 14.5 16 13.5 A6 6 0 0 0 12 3 Z"/>',
    resume: '<path d="M6 3 H14 L19 8 V21 H6 Z"/><path d="M14 3 V8 H19 M9 12 H16 M9 15 H16 M9 18 H13"/>',
    experience: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7 V5 A2 2 0 0 1 10 3 H14 A2 2 0 0 1 16 5 V7 M3 12 H21"/>',
    extracurriculars: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3 20 C3.8 15.5 14.2 15.5 15 20"/><path d="M15.5 14.6 C18.8 14.4 21 16.4 21.4 19"/>',
    skills: '<path d="M4 20 V10 M10 20 V4 M16 20 V13 M22 20 H2"/>',
    socials: '<path d="M21 12 A8 8 0 0 1 9 19 L4 20 L5 16 A8 8 0 1 1 21 12 Z"/><path d="M8.5 11 H15.5 M8.5 14 H13"/>'
  };
  var SOCIAL_ICONS = {
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/>',
    linkedin: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.3"/><path d="M5.8 16.2 C6.6 14.3 11.4 14.3 12.2 16.2 M15 10 H18.5 M15 13 H18.5"/>',
    github: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2 V16.8"/><path d="M18 10.2 C18 14 12 13 6.6 16.9"/>',
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12 H21 M12 3 C15 6 15 18 12 21 C9 18 9 6 12 3"/>',
    other: '<path d="M10 14 A4 4 0 0 0 16 14 L19 11 A4 4 0 0 0 13 5 L12 6 M14 10 A4 4 0 0 0 8 10 L5 13 A4 4 0 0 0 11 19 L12 18"/>'
  };
  function icon(path, size, color) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || "#FFFFFF") +
      '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
  }

  /* small deterministic random, so decorations look the same every visit */
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function sparkPath(w, h, n) {
    var pts = [], y = h * (0.3 + rnd() * 0.4);
    for (var i = 0; i < n; i++) {
      y = Math.max(2, Math.min(h - 2, y + (rnd() - 0.48) * h * 0.45));
      pts.push((i * (w / (n - 1))).toFixed(1) + "," + y.toFixed(1));
    }
    return pts.join(" ");
  }

  /* ---------- saved progress ---------- */
  var visited = {};
  try { visited = JSON.parse(localStorage.getItem(STORE_KEY) || "{}").visited || {}; } catch (e) { visited = {}; }
  function markVisited(id) {
    if (visited[id]) return;
    visited[id] = true;
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ visited: visited })); } catch (e) { /* ignore */ }
    refreshVisited();
  }
  function visitedCount() { var n = 0; P.sections.forEach(function (s) { if (visited[s.id]) n++; }); return n; }

  /* ---------- nodes on the ring ---------- */
  var N = P.sections.length;
  var nodes = P.sections.map(function (s, i) {
    var a = (-90 + i * (360 / N)) * Math.PI / 180;
    var dir = { x: Math.cos(a), y: Math.sin(a) };
    return {
      sec: s, i: i, angle: a, dir: dir,
      pos: { x: HUB.x + dir.x * R, y: HUB.y + dir.y * R },
      stand: { x: HUB.x + dir.x * (R - STAND), y: HUB.y + dir.y * (R - STAND) }
    };
  });

  /* =====================================================================
     SCREENS + ROUTER
     #            boot screen
     #map         the map
     #s/<id>      the map with a section open   (#s/pitches/<pitchId> for one pitch)
     #classic     one plain page
     ===================================================================== */
  var screens = { boot: $("#screen-boot"), map: $("#screen-map"), classic: $("#screen-classic") };
  var currentScreen = null;
  var openId = null;

  /* header + browser-tab title: the open section's name, otherwise "Ludovic Lachance - Portfolio" */
  var SITE_TITLE = P.name + " - Portfolio";
  var headerKey = undefined;
  function setHeader(sec, idx) {
    var key = sec ? sec.id : "";
    document.title = sec ? sec.label + " | " + SITE_TITLE : SITE_TITLE;
    if (key === headerKey) return;
    headerKey = key;
    var brand = $(".term-brand"), block = $("#brand-name"), go = $(".brand-go");
    function paint() {
      if (sec) {
        block.innerHTML = '<span class="brand-fkey">' + esc(sec.fkey || "F" + (idx + 1)) + "</span>" + esc(sec.label.toUpperCase());
        go.textContent = ""; go.hidden = true;
      } else {
        block.textContent = SITE_TITLE.toUpperCase();
        go.textContent = ""; go.hidden = true;
      }
      brand.classList.remove("swap");
    }
    if (block.textContent) { brand.classList.add("swap"); setTimeout(paint, 180); } else paint();
  }

  function showScreen(name) {
    if (currentScreen === name) return;
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle("active", k === name); });
    currentScreen = name;
    if (name === "map") {
      if (use3D) window.Map3D.start();
      else { resize(); snapCamera(); startLoop(); }
    } else {
      if (use3D) window.Map3D.stop();
      else stopLoop();
    }
    if (name === "boot") runBoot();
    if (name === "classic") { renderClassic(); screens.classic.scrollTop = 0; }
  }

  function route() {
    var h = (location.hash || "").replace(/^#/, "");
    var parts = h.split("/");
    if (parts[0] === "map") { showScreen("map"); closePanel(); return; }
    if (parts[0] === "s" && sectionIndex(parts[1]) >= 0) {
      showScreen("map");
      openSection(parts[1], parts[2] || null);
      return;
    }
    if (parts[0] === "classic") { closePanel(); showScreen("classic"); return; }
    closePanel();
    showScreen("boot");
  }
  window.addEventListener("hashchange", route);

  /* =====================================================================
     BOOT
     ===================================================================== */
  var booted = false;
  function runBoot() {
    if (booted) return;
    booted = true;
    var lines = [
      "> CONNECTING TO " + SITE_TITLE.toUpperCase() + " ...",
      "> LOADING PROFILE ............ OK",
      "> LOADING " + P.pitches.length + " PITCHES ............ OK",
      "> MAPPING " + N + " SECTIONS ........... OK",
      "> READY. WALK THE ROUTE OR PRESS 1–" + N + " TO TRAVEL."
    ];
    var log = $("#boot-log"), i = 0;
    log.textContent = "";
    (function next() {
      if (i >= lines.length) return;
      log.textContent += (i ? "\n" : "") + lines[i++];
      setTimeout(next, 260);
    })();
  }

  /* =====================================================================
     MAP: build
     ===================================================================== */
  var mapEl = $("#map");
  var worldEl = $("#world");
  var bankerEl = $("#banker");

  function buildWorld() {
    var s = "";
    // background word (no grid lines, charts or other words)
    s += '<text x="800" y="1500" fill="#121212" font-family="JetBrains Mono, monospace" font-size="64" font-weight="800" text-anchor="middle" letter-spacing="8">RESEARCH</text>';
    s += '<text x="800" y="140" fill="#121212" font-family="JetBrains Mono, monospace" font-size="64" font-weight="800" text-anchor="middle" letter-spacing="8">TSX</text>';
    // routes: ring road + spokes from HQ
    var roads = '<circle cx="800" cy="800" r="' + (R - STAND) + '" fill="none" stroke="__C__" stroke-width="__W__"' + "__D__/>";
    nodes.forEach(function (n) {
      roads += '<line x1="800" y1="800" x2="' + n.stand.x.toFixed(1) + '" y2="' + n.stand.y.toFixed(1) + '" stroke="__C__" stroke-width="__W__" stroke-linecap="round"__D__/>';
      roads += '<line x1="' + n.stand.x.toFixed(1) + '" y1="' + n.stand.y.toFixed(1) + '" x2="' + n.pos.x.toFixed(1) + '" y2="' + n.pos.y.toFixed(1) + '" stroke="__C__" stroke-width="__W__" stroke-linecap="round"__D__/>';
    });
    s += roads.replace(/__C__/g, "#181818").replace(/__W__/g, "34").replace(/__D__/g, "");
    s += roads.replace(/__C__/g, "#232323").replace(/__W__/g, "26").replace(/__D__/g, "");
    s += roads.replace(/__C__/g, "#FFFFFF").replace(/__W__/g, "1.6").replace(/__D__/g, ' stroke-dasharray="10 12" opacity="0.55"');
    // little route markers where the banker stops
    nodes.forEach(function (n) {
      s += '<circle cx="' + n.stand.x.toFixed(1) + '" cy="' + n.stand.y.toFixed(1) + '" r="9" fill="#101C18" stroke="#FFFFFF" stroke-width="1.5"/>';
      s += '<text x="' + n.stand.x.toFixed(1) + '" y="' + (n.stand.y + 3.5).toFixed(1) + '" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="10" font-weight="800" text-anchor="middle">' + (n.i + 1) + "</text>";
    });
    $("#world-art").innerHTML = s;

    // section windows
    var html = "";
    nodes.forEach(function (n) {
      var s2 = n.sec;
      html += '<button type="button" class="node" data-i="' + n.i + '" style="left:' + n.pos.x.toFixed(0) + "px;top:" + n.pos.y.toFixed(0) + 'px" aria-label="' + esc((n.i + 1) + ". " + s2.label) + '">' +
        '<span class="node-head"><span class="node-fkey">' + esc(s2.fkey || "F" + (n.i + 1)) + '</span><span class="node-code">' + esc(s2.code || "") + '</span></span>' +
        '<span class="node-body"><span class="node-icon">' + icon(ICONS[s2.id] || ICONS.resume, 22) + "</span>" +
        '<span class="node-text"><span class="node-label">' + esc(s2.label) + '</span><span class="node-blurb">' + esc(s2.blurb || "") + "</span></span></span>" +
        '<svg class="node-spark" viewBox="0 0 196 26" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + sparkPath(196, 26, 18) + '" fill="none" stroke="' + (rnd() > 0.4 ? "#2BD47D" : "#FF5C5C") + '" stroke-width="1.2" opacity="0.7"/></svg>' +
        '<span class="node-status"></span></button>';
    });
    $("#nodes").innerHTML = html;

    $("#banker-art").innerHTML = BANKER_SVG;
    $("#boot-banker").innerHTML = BANKER_SVG;
  }

  function buildChrome() {
    setHeader(null);
    $("#boot-name").textContent = P.name.toUpperCase() + " -\u2060\u00a0PORTFOLIO";   // wraps as "NAME" / "- PORTFOLIO" on phones
    $("#banker-tag").textContent = (P.shortName || P.name.split(" ")[0]).toUpperCase();

    // ticker tape: built only from your own content
    var items = [];
    P.sections.forEach(function (s, i) { items.push("<span><b>" + (i + 1) + "</b> " + esc(s.label.toUpperCase()) + "</span>"); });
    P.pitches.forEach(function (p) {
      var cc = callClass(p.call);
      items.push("<span><b>" + esc(p.ticker) + "</b> " + esc(p.company) + ' <span class="' + (cc === "call-buy" ? "up" : cc === "call-sell" ? "down" : "") + '">' + esc(p.call) + "</span></span>");
    });
    items.push("<span>WALK WITH <b>WASD</b> OR <b>ARROWS</b> · <b>ENTER</b> TO OPEN · <b>T</b> FOR THE GUIDED ROUTE</span>");
    var one = items.join("");
    $("#tape-track").innerHTML = one + one;
    $("#travel-max").textContent = N;
    mapEl.setAttribute("aria-label", "Map. Use W A S D or the arrow keys to walk, Enter to open a section, 1 to " + N + " to travel.");
  }

  function refreshVisited() {
    $("#visited-count").textContent = visitedCount() + "/" + N;
    if (use3D) window.Map3D.refreshScreens();
    Array.prototype.forEach.call(document.querySelectorAll(".node"), function (el) {
      var s = P.sections[+el.getAttribute("data-i")];
      var v = !!visited[s.id];
      el.classList.toggle("visited", v);
      el.querySelector(".node-status").textContent = v ? "✓ VIEWED" : "● NEW";
    });
  }

  /* =====================================================================
     MAP: movement, routes, camera
     ===================================================================== */
  var me = { x: HUB.x, y: HUB.y + 40 };   // the banker starts in the middle
  var cam = { x: HUB.x, y: HUB.y };
  var zoom = 1;
  var follow = 1;
  var vw = 0, vh = 0;
  var keys = {};
  var path = null;          // list of points to walk through
  var pathDone = null;      // what to do on arrival
  var targetEl = null;
  var activeNode = null;
  var rafId = null;
  var lastTs = 0;
  var arriveTimer = null;

  function resize() {
    vw = mapEl.clientWidth;
    vh = mapEl.clientHeight;
    zoom = Math.max(0.42, Math.min(1, Math.min(vw / (2 * R + 440), vh / (2 * R + 300))));
    var fits = (R + 150) * zoom * 2 <= Math.min(vw, vh) + 40;
    follow = fits ? 0.3 : 1;
  }
  window.addEventListener("resize", function () { if (currentScreen === "map") resize(); });

  function camGoal() {
    return { x: HUB.x + (me.x - HUB.x) * follow, y: HUB.y + (me.y - HUB.y) * follow };
  }
  function snapCamera() { var g = camGoal(); cam.x = g.x; cam.y = g.y; render(); }

  function render() {
    worldEl.style.transform = "translate(" + (vw / 2 - cam.x * zoom).toFixed(1) + "px," + (vh / 2 - cam.y * zoom).toFixed(1) + "px) scale(" + zoom.toFixed(3) + ")";
    bankerEl.style.transform = "translate(" + (me.x - 42).toFixed(1) + "px," + (me.y - 140).toFixed(1) + "px)";
  }

  function setWalking(on) { bankerEl.classList.toggle("walking", on); }
  function face(dx) { if (Math.abs(dx) > 0.5) bankerEl.classList.toggle("face-left", dx < 0); }

  function clampToWorld(p) {
    var d = dist(p, HUB);
    if (d > LIMIT) { p.x = HUB.x + (p.x - HUB.x) * LIMIT / d; p.y = HUB.y + (p.y - HUB.y) * LIMIT / d; }
  }

  function cancelRoute() {
    path = null;
    pathDone = null;
    if (arriveTimer) { clearTimeout(arriveTimer); arriveTimer = null; }
    bankerEl.classList.remove("arrived");
    if (targetEl) { targetEl.classList.remove("target"); targetEl = null; }
  }

  // points along the ring road between two section stops
  function arcPoints(fromI, toI) {
    var steps = toI - fromI;
    if (steps > N / 2) steps -= N;
    if (steps < -N / 2) steps += N;
    var a0 = nodes[fromI].angle, a1 = a0 + steps * (2 * Math.PI / N);
    var pts = [], seg = Math.max(4, Math.abs(steps) * 8), r = R - STAND;
    for (var k = 1; k <= seg; k++) {
      var a = a0 + (a1 - a0) * (k / seg);
      pts.push({ x: HUB.x + Math.cos(a) * r, y: HUB.y + Math.sin(a) * r });
    }
    return pts;
  }

  function nearestStop(p, within) {
    var best = null, bd = within;
    nodes.forEach(function (n) { var d = dist(p, n.stand); if (d < bd) { bd = d; best = n.i; } });
    return best;
  }

  // the route the banker follows to reach section k
  function routeTo(k) {
    var tgt = nodes[k].stand;
    var from = nearestStop(me, 70);
    if (from === k) return [tgt];
    if (from !== null) {
      var steps = Math.abs(k - from); steps = Math.min(steps, N - steps);
      if (steps <= 2) return arcPoints(from, k);                    // along the ring
    }
    if (dist(me, tgt) < dist(me, HUB) * 0.9) return [tgt];          // already close: go straight
    var pts = [];
    if (dist(me, HUB) > 24) pts.push({ x: HUB.x, y: HUB.y });       // back to HQ...
    pts.push(tgt);                                                  // ...then out along the spoke
    return pts;
  }

  function travelTo(k, open) {
    if (k < 0 || k >= N) return;
    if (use3D) { window.Map3D.travelTo(k, open); return; }
    cancelRoute();
    path = routeTo(k);
    targetEl = document.querySelector('.node[data-i="' + k + '"]');
    if (targetEl) targetEl.classList.add("target");
    pathDone = open ? function () { location.hash = "s/" + nodes[k].sec.id; } : null;
  }

  function walkToPoint(p) {
    cancelRoute();
    var q = { x: p.x, y: p.y };
    clampToWorld(q);
    path = [q];
  }

  function step(ts) {
    var dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000);
    lastTs = ts;
    var moving = false;

    var kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    var panelOpen = !$("#panel").hidden;

    if (!panelOpen && (kx || ky)) {
      if (path || arriveTimer) cancelRoute();
      var len = Math.sqrt(kx * kx + ky * ky);
      me.x += (kx / len) * KEY_SPEED * dt;
      me.y += (ky / len) * KEY_SPEED * dt;
      clampToWorld(me);
      face(kx);
      moving = true;
    } else if (path && path.length) {
      var t = path[0];
      var dx = t.x - me.x, dy = t.y - me.y, d = Math.sqrt(dx * dx + dy * dy);
      var stepLen = WALK_SPEED * dt;
      face(dx);
      if (d <= stepLen) {
        me.x = t.x; me.y = t.y;
        path.shift();
        if (!path.length) {
          path = null;
          if (targetEl) { targetEl.classList.remove("target"); targetEl = null; }
          if (pathDone) {
            var done = pathDone;
            pathDone = null;
            bankerEl.classList.add("arrived");
            arriveTimer = setTimeout(function () {
              arriveTimer = null;
              bankerEl.classList.remove("arrived");
              done();
            }, 340);
          }
        }
      } else {
        me.x += dx / d * stepLen;
        me.y += dy / d * stepLen;
      }
      moving = true;
    }
    setWalking(moving);

    // which section is the banker standing at?
    var near = null, nd = ZONE;
    nodes.forEach(function (n) { var dd = Math.min(dist(me, n.pos), dist(me, n.stand) + 30); if (dd < nd) { nd = dd; near = n; } });
    if (near !== activeNode) setActive(near);

    // camera eases toward the banker
    var g = camGoal();
    var ease = 1 - Math.pow(0.0015, dt);
    cam.x += (g.x - cam.x) * ease;
    cam.y += (g.y - cam.y) * ease;
    render();
    rafId = requestAnimationFrame(step);
  }
  function setActive(near, text) {
    if (activeNode) { var oldEl = document.querySelector('.node[data-i="' + activeNode.i + '"]'); if (oldEl) oldEl.classList.remove("active"); }
    activeNode = near;
    var pr = $("#prompt");
    if (near) {
      var el = document.querySelector('.node[data-i="' + near.i + '"]');
      if (el) el.classList.add("active");
      pr.innerHTML = text ? promptHtml(text) : "▶ " + esc(near.sec.label.toUpperCase()) + " &nbsp;—&nbsp; PRESS <kbd>ENTER</kbd>" + (use3D ? " OR CLICK THE SIGN" : "");
      pr.hidden = false;
    } else if (text) { pr.innerHTML = promptHtml(text); pr.hidden = false; }
    else pr.hidden = true;
  }
  // the 3D city sends plain text; key names become key caps
  function promptHtml(t) {
    return esc(t).replace(/\b(ENTER|ESC)\b/g, "<kbd>$1</kbd>").replace(/ — /g, " &nbsp;—&nbsp; ");
  }
  // Enter / click on the prompt: in the 3D city a door takes you inside; a billboard opens its details
  function activate() {
    if (use3D && window.Map3D.primary()) return;
    if (!activeNode) return;
    var h = use3D ? window.Map3D.activeHash() : null;
    pendingEntry = use3D ? window.Map3D.activeEntry() : null;
    location.hash = h || "s/" + activeNode.sec.id;
  }

  function startLoop() { if (!rafId) { lastTs = 0; rafId = requestAnimationFrame(step); } }
  function stopLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; keys = {}; }

  /* ---------- input ---------- */
  var KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (currentScreen === "boot" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); location.hash = "map"; return; }
    if (currentScreen === "boot" && e.code === "KeyC") { location.hash = "classic"; return; }
    if (currentScreen !== "map") return;

    var panelOpen = !$("#panel").hidden;
    if (panelOpen) {
      if (e.key === "Escape") { e.preventDefault(); location.hash = "map"; }
      return;
    }
    var dir = KEYMAP[e.code];
    if (dir) { if (!use3D) keys[dir] = true; e.preventDefault(); return; }   // the 3D map reads movement keys itself
    if (e.key === "Enter" || e.code === "KeyE" || (!use3D && e.key === " " && activeNode)) {
      if (!activeNode && !use3D) return;
      e.preventDefault();
      activate();
      return;
    }
    var num = parseInt(e.key, 10);
    if (num >= 1 && num <= N) { e.preventDefault(); travelTo(num - 1, true); return; }
    if (e.code === "KeyT") { startTour(); return; }
    if (e.code === "KeyC") { location.hash = "classic"; return; }
    if (e.code === "KeyM") { var sw = document.querySelector("[data-map-switch]"); if (sw) location.href = sw.href; return; }
    if (e.key === "Escape") { if (use3D) window.Map3D.cancel(); else cancelRoute(); }
  });
  document.addEventListener("keyup", function (e) { var dir = KEYMAP[e.code]; if (dir) keys[dir] = false; });
  window.addEventListener("blur", function () { keys = {}; });

  // click / tap on the map
  mapEl.addEventListener("click", function (e) {
    if (use3D) return;   // the 3D map handles its own clicks
    if (e.target.closest(".dpad") || e.target.closest(".prompt")) return;
    var node = e.target.closest(".node");
    if (node) { travelTo(+node.getAttribute("data-i"), true); return; }
    var rect = mapEl.getBoundingClientRect();
    walkToPoint({
      x: cam.x + (e.clientX - rect.left - vw / 2) / zoom,
      y: cam.y + (e.clientY - rect.top - vh / 2) / zoom
    });
  });
  $("#prompt").addEventListener("click", function () { activate(); });

  // touch d-pad
  Array.prototype.forEach.call(document.querySelectorAll(".dpad button"), function (b) {
    var d = b.getAttribute("data-dir");
    if (d === "jump") {
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); if (use3D) window.Map3D.jump(); });
      return;
    }
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); if (use3D) window.Map3D.setKey(d, true); else keys[d] = true; });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, function () { if (use3D) window.Map3D.setKey(d, false); else keys[d] = false; }); });
  });

  // guided route: walk to section 1, then "Next" carries on around the ring
  function startTour() { travelTo(0, true); }
  $("#tour-btn").addEventListener("click", startTour);

  /* =====================================================================
     SECTION WINDOW
     ===================================================================== */
  var panel = $("#panel");
  var pendingEntry = null;

  function openSection(id, pitchId) {
    var i = sectionIndex(id);
    var n = nodes[i];
    // arrived by link (not by walking)? put the banker at the section
    if (use3D) {
      if (window.Map3D.activeIndex() !== i) window.Map3D.teleport(i);
      window.Map3D.setPaused(true);
    } else if (dist(me, n.stand) > ZONE) {
      cancelRoute();
      me.x = n.stand.x; me.y = n.stand.y;
      snapCamera();
    }
    keys = {};
    markVisited(id);
    var s = n.sec;
    setHeader(s, i);
    $("#panel-fkey").textContent = s.fkey || "F" + (i + 1);
    $("#panel-title").textContent = s.label;
    $("#panel-body").innerHTML = renderSection(s, pitchId, false);
    $("#panel-body").scrollTop = 0;
    // opened from a billboard? scroll to that entry
    if (pendingEntry != null && !pitchId) {
      var boxes = $("#panel-body").querySelectorAll(".box");
      if (boxes[pendingEntry]) $("#panel-body").scrollTop = boxes[pendingEntry].getBoundingClientRect().top - $("#panel-body").getBoundingClientRect().top - 12;
    }
    pendingEntry = null;
    var prev = nodes[(i - 1 + N) % N].sec, next = nodes[(i + 1) % N].sec;
    $("#panel-prev").textContent = "◀ " + prev.label.toUpperCase();
    $("#panel-next").textContent = "NEXT: " + next.label.toUpperCase() + " ▶";
    var wasHidden = panel.hidden;
    panel.hidden = false;
    openId = id;
    if (wasHidden) { try { $("#panel-close").focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    setHeader(null);
    if (use3D) window.Map3D.setPaused(false);
    openId = null;
    try { mapEl.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function goAdjacent(delta) {
    var i = sectionIndex(openId);
    if (i < 0) return;
    var k = (i + delta + N) % N;
    location.hash = "map";
    travelTo(k, true);    // walks the ring road to the next stop, then opens it
  }

  $("#panel-close").addEventListener("click", function () { location.hash = "map"; });
  $("#panel-next").addEventListener("click", function () { goAdjacent(1); });
  $("#panel-prev").addEventListener("click", function () { goAdjacent(-1); });
  panel.addEventListener("click", function (e) {
    if (e.target === panel) { location.hash = "map"; return; }
    var row = e.target.closest("[data-pitch]");
    if (row) location.hash = "s/pitches/" + row.getAttribute("data-pitch");
    var back = e.target.closest("[data-back]");
    if (back) location.hash = "s/pitches";
  });

  /* =====================================================================
     SECTION CONTENT (used by the window and the classic view)
     ===================================================================== */
  function renderSection(s, pitchId, classic) {
    if (s.type === "about") return renderAbout(classic);
    if (s.type === "pitches") return pitchId && !classic ? renderPitch(pitchById(pitchId)) : renderPitchList(s, classic);
    if (s.type === "entries") return renderEntries(s);
    if (s.type === "resume") return renderResume(s);
    if (s.type === "skills") return renderSkills(s);
    if (s.type === "socials") return renderSocials(s);
    return "";
  }

  function countOf(id) {
    var i = sectionIndex(id);
    if (i < 0) return 0;
    var s = P.sections[i];
    return s.items ? s.items.length : 0;
  }

  function renderAbout(classic) {
    var email = socialByKind("email"), cvPdf = P.resumePdf || "";
    var avatar = P.photo
      ? '<div class="about-avatar about-photo"><img src="' + esc(P.photo) + '" alt="' + esc(P.name) + '"></div>'
      : '<div class="about-avatar banker-art">' + BANKER_SVG + "</div>";
    var h = '<div class="about-top">' + avatar +
      '<div><div class="about-name">' + esc(P.name) + "</div>" + (P.title ? '<div class="about-title">' + esc(P.title) + "</div>" : "") + "</div></div>";
    h += '<p class="about-text">' + esc(P.about) + "</p>";
    h += '<div class="stat-row">' +
      '<div class="stat"><b>' + P.pitches.length + "</b><span>Pitches</span></div>" +
      '<div class="stat"><b>' + countOf("cases") + "</b><span>Case comps</span></div>" +
      '<div class="stat"><b>' + countOf("ventures") + "</b><span>Ventures</span></div></div>";
    h += '<div><div class="label">Focus</div><div class="chip-row" style="margin-top:8px">' +
      P.badges.map(function (b) { return '<span class="chip' + (/^\[.*\]$/.test(b) ? "" : " chip-amber") + '">' + esc(b) + "</span>"; }).join("") + "</div></div>";
    h += '<div class="btn-row">' +
      (socialHref(email) ? '<a class="t-btn t-btn-amber" href="' + esc(socialHref(email)) + '">EMAIL ME</a>' : "") +
      (cvPdf ? '<a class="t-btn" href="' + esc(cvPdf) + '" target="_blank" rel="noopener">RESUME (PDF)</a>' : "") +
      (classic ? "" : '<a class="t-btn" href="#s/socials">ALL SOCIALS</a>') + "</div>";
    return h;
  }

  function renderPitchList(s, classic) {
    var h = s.intro ? '<p class="sec-intro">' + esc(s.intro) + "</p>" : "";
    if (classic) {
      P.pitches.forEach(function (p) { h += renderPitchCard(p); });
      return h;
    }
    h += '<div class="p-table" role="table" aria-label="Pitches">' +
      '<div class="p-row p-head" role="row"><span>TICKER</span><span>COMPANY</span><span class="p-sector">SECTOR</span><span>CALL</span><span class="p-go">TARGET</span></div>';
    P.pitches.forEach(function (p) {
      h += '<button type="button" class="p-row" role="row" data-pitch="' + esc(p.id) + '">' +
        '<span class="p-tick">' + esc(p.ticker) + '</span><span class="p-name">' + esc(p.company) + "</span>" +
        '<span class="p-dim p-sector">' + esc(p.sector) + '</span><span><span class="chip ' + callClass(p.call) + '">' + esc(p.call) + "</span></span>" +
        '<span class="p-go">' + esc(p.target || "") + ' ▶</span></button>';
    });
    h += "</div>";
    return h;
  }

  function renderPitchCard(p) {
    return '<div class="box"><div class="box-top"><div><h3>' + esc(p.ticker) + " · " + esc(p.company) + '</h3><div class="meta">' +
      esc([p.sector, p.date, p.target ? "Target " + p.target : ""].filter(Boolean).join(" · ")) + "</div>" +
      (p.team ? '<div class="meta">Team pitch · ' + esc(p.team) + (p.role ? " · My role: " + esc(p.role) : "") + "</div>" : "") +
      '</div><span class="chip ' + callClass(p.call) + '">' + esc(p.call) + "</span></div>" +
      "<p>" + esc(p.thesis) + "</p>" +
      (p.points && p.points.length ? "<ul>" + p.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      (p.pdf ? '<a href="' + esc(p.pdf) + '" target="_blank" rel="noopener">Full pitch (PDF) →</a>' : "") + "</div>";
  }

  function renderPitch(p) {
    if (!p) return "<p>Pitch not found.</p>";
    var h = '<button type="button" class="t-btn" data-back style="align-self:flex-start">◀ ALL PITCHES</button>';
    h += '<div class="pd-top"><div><div class="pd-tick">' + esc(p.ticker) + (p.exchange ? ' <span class="pd-exch">' + esc(p.exchange) + "</span>" : "") + '</div><div class="pd-name">' + esc(p.company) + "</div></div>" +
      '<div class="chip-row"><span class="chip ' + callClass(p.call) + '">' + esc(p.call) + '</span><span class="chip">TARGET ' + esc(p.target) + "</span>" +
      '<span class="chip">' + esc(p.sector) + '</span><span class="chip">' + esc(p.jurisdiction) + "</span></div></div>";
    var metaBits = [];
    if (p.date) metaBits.push("PITCHED " + esc(p.date).toUpperCase());
    if (p.team) metaBits.push("TEAM PITCH · " + esc(p.team).toUpperCase());
    if (p.role) metaBits.push("MY ROLE: " + esc(p.role).toUpperCase());
    if (metaBits.length) h += '<div class="meta pd-meta">' + metaBits.join("<br>") + "</div>";
    h += '<div class="box"><div class="label">Thesis</div><p>' + esc(p.thesis) + "</p></div>";
    if (p.metrics && p.metrics.length) {
      h += '<div class="metric-grid">' + p.metrics.map(function (m) { return '<div class="metric"><span>' + esc(m.label) + "</span><b>" + esc(m.value) + "</b></div>"; }).join("") + "</div>";
    }
    if (p.points && p.points.length) {
      h += '<div class="box"><div class="label">Key points</div><ul>' + p.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";
    }
    if (p.catalysts && p.catalysts.length) {
      h += '<div class="box"><div class="label">Catalysts</div>' + p.catalysts.map(function (c) {
        return '<div class="cat-row"><span class="cat-date">' + esc(c.date) + "</span><span>" + esc(c.text) + "</span></div>";
      }).join("") + "</div>";
    }
    h += '<div class="btn-row">' + (p.pdf
      ? '<a class="t-btn t-btn-amber" href="' + esc(p.pdf) + '" target="_blank" rel="noopener">FULL PITCH (PDF)</a>'
      : '<span class="t-btn is-disabled">FULL PITCH (PDF) — COMING SOON</span>') + "</div>";
    return h;
  }

  function paras(t) {
    return String(t || "").split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean)
      .map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
  }

  function renderEntries(s) {
    var h = s.intro ? '<p class="sec-intro">' + esc(s.intro) + "</p>" : "";
    s.items.forEach(function (it) {
      h += '<div class="box"><div class="box-top"><div><h3>' + esc(it.title) + '</h3><div class="meta">' + esc([it.org, it.date].filter(Boolean).join(" · ")) + "</div></div>" +
        (it.result ? '<span class="chip chip-amber">' + esc(it.result) + "</span>" : "") + "</div>" +
        (it.image ? '<img class="entry-img" src="' + esc(it.image) + '" alt="' + esc(it.imageAlt || it.title) + '" loading="lazy">' : "") +
        paras(it.text) +
        (it.bullets && it.bullets.length ? "<ul>" + it.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" : "") +
        (it.skills && it.skills.length ? '<div class="chip-row skill-tags" aria-label="Transferable skills">' +
          it.skills.map(function (k) { return '<span class="chip chip-amber">' + esc(k) + "</span>"; }).join("") + "</div>" : "") +
        (it.link ? '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">' + esc(it.linkLabel || "See more") + " →</a>" : "") + "</div>";
    });
    return h;
  }

  function renderResume(s) {
    var h = s.summary ? '<p class="about-text">' + esc(s.summary) + "</p>" : "";
    h += '<div class="box">' + s.highlights.map(function (r) {
      return '<div class="hl"><span class="hl-kind">' + esc(r.kind) + "</span><span>" + esc(r.text) + "</span></div>";
    }).join("") + "</div>";
    h += '<div class="btn-row">' + (s.pdf
      ? '<a class="t-btn t-btn-amber" href="' + esc(s.pdf) + '" target="_blank" rel="noopener">DOWNLOAD RESUME (PDF)</a>'
      : '<span class="t-btn is-disabled">RESUME PDF — COMING SOON</span>') + "</div>";
    return h;
  }

  function renderSkills(s) {
    var h = s.intro ? '<p class="sec-intro">' + esc(s.intro) + "</p>" : "";
    s.groups.forEach(function (g) {
      h += '<div><div class="label">' + esc(g.name) + '</div><div class="skill-row" style="margin-top:8px">' +
        g.items.map(function (x) { return '<span class="skill">' + esc(x) + "</span>"; }).join("") + "</div></div>";
    });
    return h;
  }

  function renderSocials(s) {
    var h = s.intro ? '<p class="sec-intro sec-intro-white">' + esc(s.intro) + "</p>" : "";
    s.links.forEach(function (l) {
      var href = socialHref(l);
      var sub = href ? l.url.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "") : "Coming soon";
      h += '<a class="social' + (href ? "" : " is-disabled") + '" href="' + esc(href || "#") + '"' + (href && l.kind !== "email" ? ' target="_blank" rel="noopener"' : "") + ">" +
        '<span class="social-icon">' + icon(SOCIAL_ICONS[l.kind] || SOCIAL_ICONS.other, 20) + "</span>" +
        '<span class="social-text"><span class="social-label">' + esc(l.label) + '</span><span class="social-sub">' + esc(sub) + "</span></span></a>";
    });
    return h;
  }

  /* =====================================================================
     CLASSIC VIEW
     ===================================================================== */
  function renderClassic() {
    var h = '<div class="classic-hero">' + (P.photo ? '<img class="classic-photo" src="' + esc(P.photo) + '" alt="' + esc(P.name) + '">' : "") +
      "<div><h1><span>" + esc(SITE_TITLE.toUpperCase()) + "</span></h1>" + (P.title ? '<p class="meta">' + esc(P.title) + "</p>" : "") + "</div></div>";
    P.sections.forEach(function (s, i) {
      h += '<section class="classic-sec"><h2>' + (i + 1) + " · " + esc(s.label.toUpperCase()) + "</h2>" + renderSection(s, null, true) + "</section>";
    });
    $("#classic-body").innerHTML = h;
  }

  /* ---------- clock ---------- */
  function tick() {
    var d = new Date();
    var p2 = function (n) { return ("0" + n).slice(-2); };
    $("#clock").textContent = p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }
  setInterval(tick, 1000);
  tick();

  /* ---------- start ---------- */
  buildChrome();
  buildWorld();

  if (use3D) {
    mapEl.classList.add("is-3d");
    window.Map3D.init(mapEl, P.sections, {
      name: P.shortName || P.name.split(" ")[0],
      visited: visited,
      portfolio: P,
      onActive: function (i, text) { setActive(i === null ? null : nodes[i], text); },
      onOpen: function (i, hash, entry) { pendingEntry = entry == null ? null : entry; location.hash = hash || "s/" + P.sections[i].id; },
      onVisit: function (i) { markVisited(P.sections[i].id); }
    });
  }
  // switch between the 3D map and the original 2D map
  var base = location.pathname;
  Array.prototype.forEach.call(document.querySelectorAll("[data-map-switch]"), function (a) {
    a.href = use3D ? base + "?map=2d#map" : base + "#map";
    a.innerHTML = use3D ? "<kbd>M</kbd> 2D MAP" : "<kbd>M</kbd> 3D MAP";
  });
  Array.prototype.forEach.call(document.querySelectorAll(".only-3d"), function (el) { el.hidden = !use3D; });
  var bootSwitch = document.getElementById("boot-2d");
  if (bootSwitch) bootSwitch.href = base + "?map=2d#map";

  refreshVisited();
  route();
})();
