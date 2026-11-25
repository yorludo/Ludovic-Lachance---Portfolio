/* =====================================================================
   LUDOVIC LACHANCE - PORTFOLIO — 3D city (uses lib/three.min.js)
   A statue of Ludovic stands in the middle. Each section is a skyscraper
   you can walk into; inside, its content is laid out on billboards.
   script.js decides whether to use this or the original 2D map.
   ===================================================================== */
(function () {
  "use strict";

  var WHITE = 0xffffff, DIM = 0x6f8278, BLUE = 0x8fd3ff;
  var FONT = '"JetBrains Mono", Consolas, monospace';
  var C = { bg: "#0f1b17", head: "#172722", text: "#eef2ec", muted: "#9daaa2", blue: "#8fd3ff", line: "#35493f", ink: "#13201b", green: "#5fd38d" };

  function supported() {
    if (!window.THREE) return false;
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  var S = null; // state, created by init()

  /* ---------------------------------------------------------------
     small helpers
     --------------------------------------------------------------- */
  function canvasTex(w, h, draw) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 8;
    t.userData = { canvas: c, draw: draw };
    return t;
  }
  function redraw(t) { var c = t.userData.canvas, x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height); t.userData.draw(x, c.width, c.height); t.needsUpdate = true; }
  function mat(c, r, extra) { var m = new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.7 : r }); if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; }); return m; }
  function box(w, h, d, m) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = true; return b; }
  function flatDist(a, b) { var dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); }
  function angDiff(a, b) { var d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); }

  // wrap text into lines that fit maxW; returns the lines (cut to maxLines with an ellipsis)
  function wrapLines(x, text, maxW, maxLines) {
    var words = String(text || "").split(/\s+/), lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (x.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
    }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length && x.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/[\s,;:.]+$/, "") + "…";
    }
    return lines;
  }
  function chip(x, txt, cx, cy, opt) {
    opt = opt || {};
    x.font = (opt.weight || 700) + " " + (opt.size || 22) + "px " + FONT;
    var w = x.measureText(txt).width + 22, h = (opt.size || 22) + 16;
    if (opt.fill) { x.fillStyle = opt.fill; x.fillRect(cx, cy, w, h); }
    x.strokeStyle = opt.stroke || C.line; x.lineWidth = 2; x.strokeRect(cx + 1, cy + 1, w - 2, h - 2);
    x.fillStyle = opt.color || C.blue; x.fillText(txt, cx + 11, cy + h - 12);
    return w;
  }

  /* ---------------------------------------------------------------
     a person (the banker, and his statue) built from boxes
     --------------------------------------------------------------- */
  function buildPerson(M) {
    var root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    function leg(xx) {
      var hip = new THREE.Group(); hip.position.set(xx, 1.0, 0);
      var l = box(0.26, 0.95, 0.28, M.pants); l.position.y = -0.47; hip.add(l);
      var sh = box(0.3, 0.14, 0.44, M.shoe); sh.position.set(0, -0.98, 0.08); hip.add(sh);
      body.add(hip); return hip;
    }
    var legL = leg(-0.17), legR = leg(0.17);
    var torso = box(0.78, 0.95, 0.44, M.suit); torso.position.y = 1.47; body.add(torso);
    var hem = box(0.8, 0.12, 0.46, M.suitD); hem.position.y = 1.02; body.add(hem);
    var shirt = box(0.24, 0.42, 0.02, M.shirt); shirt.position.set(0, 1.72, 0.225); body.add(shirt);
    var tie = box(0.09, 0.42, 0.02, M.tie); tie.position.set(0, 1.68, 0.238); body.add(tie);
    var knot = box(0.12, 0.08, 0.03, M.tie); knot.position.set(0, 1.9, 0.236); body.add(knot);
    var pocket = box(0.13, 0.05, 0.02, M.shirt); pocket.position.set(0.24, 1.66, 0.226); body.add(pocket);
    var neck = box(0.2, 0.14, 0.2, M.skin); neck.position.y = 2.0; body.add(neck);
    var head = box(0.46, 0.5, 0.44, M.skin); head.position.y = 2.3; body.add(head);
    var hair = box(0.5, 0.16, 0.48, M.hair); hair.position.set(0, 2.58, -0.02); body.add(hair);
    var hairBack = box(0.5, 0.3, 0.12, M.hair); hairBack.position.set(0, 2.42, -0.2); body.add(hairBack);
    var eyeL = box(0.06, 0.06, 0.02, M.eye); eyeL.position.set(-0.11, 2.33, 0.225); body.add(eyeL);
    var eyeR = eyeL.clone(); eyeR.position.x = 0.11; body.add(eyeR);
    function arm(xx, withCase) {
      var sh = new THREE.Group(); sh.position.set(xx, 1.86, 0);
      var a = box(0.2, 0.82, 0.24, M.suit); a.position.y = -0.4; sh.add(a);
      var cuff = box(0.21, 0.06, 0.25, M.shirt); cuff.position.y = -0.82; sh.add(cuff);
      var hand = box(0.17, 0.17, 0.18, M.skin); hand.position.y = -0.92; sh.add(hand);
      if (withCase) {
        var bc = box(0.16, 0.42, 0.62, M.bcase); bc.position.set(0, -1.22, 0); sh.add(bc);
        var clasp = box(0.17, 0.05, 0.08, M.clasp); clasp.position.set(0, -1.06, 0); sh.add(clasp);
      }
      body.add(sh); return sh;
    }
    var armL = arm(-0.5, false), armR = arm(0.5, true);
    return { root: root, body: body, legL: legL, legR: legR, armL: armL, armR: armR };
  }

  /* ---------------------------------------------------------------
     billboards: what each section shows inside its tower
     --------------------------------------------------------------- */
  function splitHalf(text) {
    var parts = String(text || "").match(/[^.!?]+[.!?]+["”’)]*\s*/g) || [text];
    var total = text.length, acc = 0, a = [], b = [];
    parts.forEach(function (p) { (acc < total * 0.5 ? a : b).push(p); acc += p.length; });
    return [a.join("").trim(), b.join("").trim()];
  }

  function boardsFor(sec, P) {
    var B = [];
    if (sec.type === "about") {
      var halves = splitHalf(P.about || "");
      B.push({ kind: "about", kicker: "WHO I AM", title: P.name, sub: "Finance & Accounting Co-op · University of Ottawa", body: halves[0], photo: P.photo });
      B.push({ kind: "text", kicker: "BEYOND THE OFFICE", title: "Outside of school & work", body: halves[1] });
      var cases = 0, ventures = 0;
      P.sections.forEach(function (s) { if (s.id === "cases") cases = (s.items || []).length; if (s.id === "ventures") ventures = (s.items || []).length; });
      B.push({ kind: "stats", kicker: "FOCUS", title: "Where I'm headed", stats: [[P.pitches.length, "Pitches"], [cases, "Case comps"], [ventures, "Ventures"]], tags: P.badges || [] });
      B.push({ kind: "text", kicker: "RESUME & CONTACT", title: "Let's connect", body: "My full resume (PDF) and email are one click away. Press Enter to open the About Me window with the resume and contact buttons.", tags: ["Resume (PDF)", "Email"] });
    } else if (sec.type === "pitches") {
      P.pitches.forEach(function (p, k) {
        B.push({ kind: "pitch", kicker: "PITCH " + (k + 1) + "/" + P.pitches.length, title: p.ticker + " · " + p.company,
          sub: [p.exchange, p.sector, p.date].filter(Boolean).join(" · "), badge: (p.call || "").toUpperCase() + " · TARGET " + (p.target || ""),
          metrics: (p.metrics || []).slice(0, 8), foot: [p.role, p.team].filter(Boolean).join(" · "), hash: "s/pitches/" + p.id });
      });
    } else if (sec.type === "entries") {
      (sec.items || []).forEach(function (it, k) {
        B.push({ kind: "entry", kicker: (k + 1) + "/" + sec.items.length, title: it.title, sub: [it.org, it.date].filter(Boolean).join(" · "),
          badge: it.result || "", bullets: it.bullets && it.bullets.length ? it.bullets : (it.text ? it.text.split(/\n\n+/) : []),
          tags: it.skills || [], image: it.image || "", entry: k });
      });
    } else if (sec.type === "skills") {
      (sec.groups || []).forEach(function (g, k) {
        B.push({ kind: "chips", kicker: "SKILLS " + (k + 1) + "/" + sec.groups.length, title: g.name, tags: g.items || [], entry: k });
      });
    } else if (sec.type === "socials") {
      (sec.links || []).forEach(function (l, k) {
        var what = { email: "Write to me — I usually reply within a day.", linkedin: "Connect with me and see my latest experience.", github: "Browse my projects and the code behind this site." }[l.kind] || "";
        B.push({ kind: "text", kicker: "REACH OUT " + (k + 1) + "/" + sec.links.length, title: l.label, body: l.url, big: true, note: what, foot2: sec.intro, entry: k });
      });
    }
    return B;
  }

  function drawBoard(b, sec) {
    return function (x, w, h) {
      x.fillStyle = C.bg; x.fillRect(0, 0, w, h);
      x.fillStyle = C.head; x.fillRect(0, 0, w, 64);
      x.textBaseline = "alphabetic";
      // header: section key + kicker
      x.fillStyle = "#ffffff"; x.fillRect(22, 14, 64, 36);
      x.fillStyle = C.ink; x.font = "800 24px " + FONT; x.textAlign = "center"; x.fillText(sec.fkey || "", 54, 41); x.textAlign = "left";
      x.fillStyle = "#ffffff"; x.font = "700 24px " + FONT; x.fillText(sec.label.toUpperCase(), 104, 41);
      x.fillStyle = C.blue; x.textAlign = "right"; x.fillText(b.kicker || "", w - 24, 41); x.textAlign = "left";

      var L = 40, R = w - 40, y = 132, textR = R, imgBottom = 0;
      // optional picture on the right
      var img = b._img;
      if ((b.photo || b.image) && img && img.complete && img.naturalWidth) {
        var iw = b.photo ? 290 : 360, ih = b.photo ? 290 : Math.round(360 * img.naturalHeight / img.naturalWidth);
        var ix = R - iw, iy = 96;
        x.fillStyle = "#ffffff"; x.fillRect(ix - 5, iy - 5, iw + 10, ih + 10);
        x.drawImage(img, ix, iy, iw, ih);
        textR = ix - 34; imgBottom = iy + ih + 12;
      }
      var tw = textR - L;
      // title
      var size = 50; x.font = "800 " + size + "px " + FONT;
      while (size > 32 && x.measureText(b.title).width > tw * 1.9) { size -= 2; x.font = "800 " + size + "px " + FONT; }
      x.fillStyle = "#ffffff";
      wrapLines(x, b.title, tw, 2).forEach(function (ln) { x.fillText(ln, L, y); y += size + 8; });
      if (b.sub) { x.fillStyle = C.muted; x.font = "500 26px " + FONT; wrapLines(x, b.sub, tw, 2).forEach(function (ln) { x.fillText(ln, L, y); y += 34; }); }
      if (b.badge) { y += 6; chip(x, b.badge, L, y, { color: "#ffffff", stroke: "#ffffff", size: 24 }); y += 58; }
      y += 10;
      var bottom = h - 28 - (b.tags && b.tags.length && b.kind !== "chips" ? 56 : 0);

      if (b.kind === "pitch") {
        var cols = 4, cw = (R - L) / cols;
        (b.metrics || []).forEach(function (m, k) {
          var cx = L + (k % cols) * cw, cy = y + Math.floor(k / cols) * 92;
          x.fillStyle = C.muted; x.font = "500 20px " + FONT; x.fillText(String(m.label).toUpperCase(), cx, cy + 20);
          x.fillStyle = "#ffffff"; x.font = "800 34px " + FONT; x.fillText(m.value, cx, cy + 62);
        });
        y += Math.ceil((b.metrics || []).length / cols) * 92 + 10;
        if (b.foot) { x.fillStyle = C.blue; x.font = "600 22px " + FONT; wrapLines(x, b.foot, R - L, 2).forEach(function (ln) { x.fillText(ln, L, y + 10); y += 30; }); }
      } else if (b.kind === "stats") {
        (b.stats || []).forEach(function (s, k) {
          var cx = L + k * 230;
          x.fillStyle = "#ffffff"; x.font = "800 84px " + FONT; x.fillText(String(s[0]), cx, y + 80);
          x.fillStyle = C.muted; x.font = "600 22px " + FONT; x.fillText(String(s[1]).toUpperCase(), cx, y + 116);
        });
        y += 160;
        var cx2 = L, cy2 = y;
        (b.tags || []).forEach(function (t) {
          x.font = "700 24px " + FONT; var wch = x.measureText(t).width + 22;
          if (cx2 + wch > R) { cx2 = L; cy2 += 54; }
          chip(x, t, cx2, cy2, { size: 24 }); cx2 += wch + 12;
        });
        return;
      } else if (b.kind === "chips") {
        var cx3 = L, cy3 = y;
        (b.tags || []).forEach(function (t) {
          x.font = "700 32px " + FONT; var wch = x.measureText(t).width + 22;
          if (cx3 + wch > R) { cx3 = L; cy3 += 70; }
          if (cy3 + 54 > h - 20) return;
          chip(x, t, cx3, cy3, { size: 32 }); cx3 += wch + 14;
        });
        return;
      } else if (b.kind === "entry") {
        x.font = "400 24px " + FONT;
        var lh = 33;
        for (var i = 0; i < (b.bullets || []).length; i++) {
          var room = Math.floor((bottom - y) / lh);
          if (room < 1) break;
          var lines = wrapLines(x, b.bullets[i], (y < imgBottom ? textR : R) - L - 30, room);
          x.fillStyle = C.blue; x.fillText("•", L, y);
          x.fillStyle = C.text;
          lines.forEach(function (ln) { x.fillText(ln, L + 28, y); y += lh; });
          y += 10;
        }
      } else { // text / about
        x.font = (b.big ? "600 34px " : "400 25px ") + FONT;
        var lh2 = b.big ? 46 : 35;
        if (b.photo) { x.font = "400 23px " + FONT; lh2 = 31; }
        var lines2 = wrapLines(x, b.body, (b.photo ? textR : R) - L, Math.max(1, Math.floor((bottom - y) / lh2)));
        x.fillStyle = b.big ? C.blue : C.text;
        lines2.forEach(function (ln) { x.fillText(ln, L, y); y += lh2; });
        if (b.note) { y += 18; x.fillStyle = C.text; x.font = "400 28px " + FONT; wrapLines(x, b.note, R - L, 3).forEach(function (ln) { x.fillText(ln, L, y); y += 38; }); }
        if (b.foot2) { x.fillStyle = C.muted; x.font = "400 24px " + FONT; wrapLines(x, b.foot2, R - L, 2).forEach(function (ln, k) { x.fillText(ln, L, h - 80 + k * 32); }); }
      }
      // tags along the bottom
      if (b.tags && b.tags.length) {
        var tx = L, ty = h - 72;
        b.tags.forEach(function (t) {
          x.font = "700 22px " + FONT; var wch = x.measureText(t).width + 22;
          if (tx + wch > R) return;
          chip(x, t, tx, ty); tx += wch + 10;
        });
      }
    };
  }

  /* ---------------------------------------------------------------
     init: the city
     --------------------------------------------------------------- */
  function init(container, sections, opts) {
    opts = opts || {};
    var P = opts.portfolio || { pitches: [], sections: sections, badges: [] };
    var N = sections.length;
    var R = 25, TW = 7.5, DOOR_R = R - TW / 2, STOP_R = DOOR_R - 1.3, ringR = 14.5, PLAZA = 5.4;
    var NEAR_DOOR = 3.4, LIMIT = 38;
    var WALK = 6.6, RUN = 12.5, GRAVITY = 30, JUMP_V = 10.5;

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "map3d-canvas";
    container.appendChild(renderer.domElement);
    var fade = document.createElement("div"); fade.className = "map3d-fade"; container.appendChild(fade);

    var scene = new THREE.Scene();
    var sky = document.createElement("canvas"); sky.width = 4; sky.height = 256;
    var sg = sky.getContext("2d"), grad = sg.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#6fa3cf"); grad.addColorStop(0.55, "#b9d6e3"); grad.addColorStop(1, "#f1dfb9");
    sg.fillStyle = grad; sg.fillRect(0, 0, 4, 256);
    scene.background = new THREE.CanvasTexture(sky);
    scene.fog = new THREE.Fog(0xb9ccb8, 70, 150);
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);

    scene.add(new THREE.HemisphereLight(0xdcecf5, 0x3d5a2a, 0.55));
    var key = new THREE.DirectionalLight(0xffe9c4, 0.75);
    key.position.set(18, 40, 22); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera; sc.left = -44; sc.right = 44; sc.top = 44; sc.bottom = -44; sc.near = 1; sc.far = 120;
    scene.add(key);

    // grass lawn
    var lawnC = document.createElement("canvas"); lawnC.width = lawnC.height = 256;
    var lg = lawnC.getContext("2d");
    lg.fillStyle = "#4f8a3c"; lg.fillRect(0, 0, 256, 256);
    var greens = ["#467d35", "#5b9443", "#538c3e", "#3f7230", "#66a04b"];
    for (var g = 0; g < 2600; g++) {
      lg.fillStyle = greens[g % greens.length]; lg.globalAlpha = 0.35 + (g % 7) * 0.06;
      lg.fillRect((g * 97.3) % 256, (g * 57.7 + (g % 13) * 11) % 256, 2 + (g % 3), 3 + (g % 4));
    }
    lg.globalAlpha = 1;
    var lawnTex = new THREE.CanvasTexture(lawnC);
    lawnTex.wrapS = lawnTex.wrapT = THREE.RepeatWrapping; lawnTex.repeat.set(60, 60); lawnTex.anisotropy = 8;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    // plaza + roads
    var stoneMat = mat(0xc9b58f, 0.95), roadMat = mat(0xbfae88, 1);
    var dashMat = new THREE.MeshBasicMaterial({ color: 0xf6ead0, transparent: true, opacity: 0.7 });
    var plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA, 64), stoneMat);
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.025; plaza.receiveShadow = true; scene.add(plaza);
    var plazaRing = new THREE.Mesh(new THREE.RingGeometry(PLAZA - 0.35, PLAZA - 0.2, 96), new THREE.MeshBasicMaterial({ color: DIM, side: THREE.DoubleSide }));
    plazaRing.rotation.x = -Math.PI / 2; plazaRing.position.y = 0.03; scene.add(plazaRing);
    var ring = new THREE.Mesh(new THREE.RingGeometry(ringR - 0.8, ringR + 0.8, 160), roadMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.receiveShadow = true; scene.add(ring);
    for (var d = 0; d < 80; d += 2) {
      var seg = new THREE.Mesh(new THREE.RingGeometry(ringR - 0.05, ringR + 0.05, 6, 1, d / 80 * Math.PI * 2, Math.PI * 2 / 80), dashMat);
      seg.rotation.x = -Math.PI / 2; seg.position.y = 0.03; scene.add(seg);
    }

    var visited = opts.visited || {};
    var nodes = [];

    /* ---------- the statue of Ludovic ---------- */
    var marble = mat(0xece8df, 0.38), marbleD = mat(0xd9d3c6, 0.45), marbleK = mat(0xc9c2b4, 0.5);
    var statue = new THREE.Group();
    var step1 = box(4.2, 0.4, 4.2, mat(0xb8ae9c, 0.9)); step1.position.y = 0.175; step1.receiveShadow = true; statue.add(step1);
    var plinth = box(3.0, 1.9, 3.0, mat(0xd6cfc1, 0.8)); plinth.position.y = 0.4 + 0.95; plinth.receiveShadow = true; statue.add(plinth);
    var cap = box(3.4, 0.3, 3.4, mat(0xe2dccf, 0.7)); cap.position.y = 2.3 + 0.15; statue.add(cap);
    var plateTex = canvasTex(512, 256, function (x, w, h) {
      x.fillStyle = "#cfc7b6"; x.fillRect(0, 0, w, h);
      x.strokeStyle = "#a99f8b"; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28);
      x.fillStyle = "#4a4336"; x.textAlign = "center";
      var parts = String(P.name || "").toUpperCase().split(" ");
      x.font = "800 50px " + FONT; x.fillText(parts[0] || "", w / 2, 102);
      x.fillText(parts.slice(1).join(" "), w / 2, 160);
      x.font = "600 24px " + FONT; x.fillText("PORTFOLIO", w / 2, 210);
    });
    for (var f = 0; f < 4; f++) {
      var plate = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.6 }));
      var fa = f * Math.PI / 2;
      plate.position.set(Math.sin(fa) * 1.51, 1.38, Math.cos(fa) * 1.51); plate.rotation.y = fa; statue.add(plate);
    }
    var fig = buildPerson({ pants: marble, shoe: marbleD, suit: marble, suitD: marbleD, shirt: marble, tie: marbleD, skin: marble, hair: marbleD, eye: marbleK, bcase: marbleD, clasp: marbleK });
    fig.armL.rotation.set(0, 0, -2.55);        // waving
    fig.armR.rotation.set(0.15, 0, 0);
    fig.legL.rotation.x = 0.12; fig.legR.rotation.x = -0.12;
    fig.root.scale.setScalar(2.2); fig.root.position.y = 2.6; statue.add(fig.root);
    var hedgeMat = mat(0x3d7531, 0.9, { flatShading: true });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (c) {
      var hb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), hedgeMat); hb.scale.y = 0.75;
      hb.position.set(c[0] * 2.7, 0.4, c[1] * 2.7); hb.castShadow = true; statue.add(hb);
    });
    scene.add(statue);

    /* ---------- the towers ---------- */
    var HEIGHTS = [30, 24, 34, 26, 32, 22, 28, 25];
    function facadeTextures(i) {
      var lit = [], seed2 = 11 + i * 31;
      function r2() { seed2 = (seed2 * 16807) % 2147483647; return (seed2 - 1) / 2147483646; }
      for (var k = 0; k < 64; k++) lit.push(r2());
      var base = canvasTex(256, 256, function (x, w, h) {
        x.fillStyle = "#26363c"; x.fillRect(0, 0, w, h);
        for (var cy = 0; cy < 8; cy++) for (var cx = 0; cx < 8; cx++) {
          var v = lit[cy * 8 + cx];
          x.fillStyle = v > 0.72 ? "#f6e7c4" : v > 0.45 ? "#5d7d8a" : "#3d5560";
          x.fillRect(cx * 32 + 4, cy * 32 + 5, 24, 22);
        }
        x.fillStyle = "#e9eeea"; for (var m = 0; m < 8; m++) { x.fillRect(m * 32, 0, 3, h); x.fillRect(0, m * 32, w, 3); }
      });
      var glow = canvasTex(256, 256, function (x, w, h) {
        x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
        for (var cy = 0; cy < 8; cy++) for (var cx = 0; cx < 8; cx++) if (lit[cy * 8 + cx] > 0.72) { x.fillStyle = "#ffe9b8"; x.fillRect(cx * 32 + 4, cy * 32 + 5, 24, 22); }
      });
      [base, glow].forEach(function (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
      return { base: base, glow: glow };
    }
    function signDraw(s, i) {
      return function (x, w, h) {
        x.fillStyle = C.bg; x.fillRect(0, 0, w, h);
        x.strokeStyle = "#ffffff"; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
        x.fillStyle = "#ffffff"; x.fillRect(28, 30, 96, 56);
        x.fillStyle = C.ink; x.font = "800 36px " + FONT; x.textAlign = "center"; x.fillText(s.fkey || "F" + (i + 1), 76, 71);
        x.textAlign = "left"; x.fillStyle = "#ffffff";
        var size = s.label.length > 18 ? 46 : 58; x.font = "800 " + size + "px " + FONT;
        x.fillText(s.label.toUpperCase(), 148, 76);
        var v = !!visited[s.id];
        x.fillStyle = v ? C.green : C.blue; x.font = "700 30px " + FONT;
        x.fillText(v ? "✓ VIEWED" : "● NEW", 148, 128);
        x.fillStyle = C.muted; x.font = "500 28px " + FONT; x.textAlign = "right"; x.fillText(s.blurb || "", w - 30, 128); x.textAlign = "left";
      };
    }

    sections.forEach(function (s, i) {
      var ang = -Math.PI / 2 + i * (Math.PI * 2 / N);
      var dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      var pos = dir.clone().multiplyScalar(R);
      var stand = dir.clone().multiplyScalar(STOP_R);
      var H = HEIGHTS[i % HEIGHTS.length];

      // road from the plaza out to the tower's front door
      var len = DOOR_R - PLAZA + 0.2, mid = (DOOR_R + PLAZA) / 2;
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, len), roadMat);
      spoke.position.copy(dir.clone().multiplyScalar(mid)); spoke.position.y = 0.015;
      spoke.rotation.y = -ang + Math.PI / 2; spoke.receiveShadow = true; scene.add(spoke);
      for (var k = PLAZA + 1; k < DOOR_R - 1; k += 1.7) {
        var dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.85), dashMat);
        dash.position.copy(dir.clone().multiplyScalar(k)); dash.position.y = 0.03; dash.rotation.y = spoke.rotation.y; scene.add(dash);
      }
      var stopMat = new THREE.MeshBasicMaterial({ color: WHITE });
      var stop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 32), stopMat);
      stop.position.set(stand.x, 0.04, stand.z); scene.add(stop);

      var tower = new THREE.Group(), mats = [];
      function tm(m) { m.transparent = true; mats.push(m); return m; }
      var fac = facadeTextures(i);
      fac.base.repeat.set(TW / 8, (H - 4.5) / 8); fac.glow.repeat.copy(fac.base.repeat);
      var shaftMat = tm(new THREE.MeshStandardMaterial({ map: fac.base, emissiveMap: fac.glow, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.25 }));
      var shaft = box(TW, H - 4.5, TW, shaftMat); shaft.position.y = 4.5 + (H - 4.5) / 2; shaft.receiveShadow = true; tower.add(shaft);
      var podMat = tm(mat(0x1d3038, 0.15, { metalness: 0.5, emissive: new THREE.Color(0x0e2a30), emissiveIntensity: 1 }));
      var podium = box(TW + 0.8, 4.5, TW + 0.8, podMat); podium.position.y = 2.25; tower.add(podium);
      var trimMat = tm(mat(0xe9eeea, 0.6));
      var band = box(TW + 1.0, 0.35, TW + 1.0, trimMat); band.position.y = 4.55; tower.add(band);
      var crown = box(TW + 0.5, 0.6, TW + 0.5, trimMat); crown.position.y = H + 0.3; tower.add(crown);
      var cornerGeo = new THREE.BoxGeometry(0.25, H - 4.5, 0.25);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (c) {
        var col = new THREE.Mesh(cornerGeo, trimMat); col.position.set(c[0] * TW / 2, 4.5 + (H - 4.5) / 2, c[1] * TW / 2); tower.add(col);
      });
      // entrance (the tower's local +z faces the statue)
      var doorMat = tm(new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffe7b0, emissiveIntensity: 0.9, roughness: 0.4 }));
      var door = box(2.8, 3.2, 0.2, doorMat); door.position.set(0, 1.6, TW / 2 + 0.42); door.castShadow = false; tower.add(door);
      var awning = box(4.6, 0.25, 1.6, trimMat); awning.position.set(0, 3.45, TW / 2 + 1.1); tower.add(awning);
      var signTex = canvasTex(1024, 160, signDraw(s, i));
      var signMat = tm(new THREE.MeshBasicMaterial({ map: signTex }));
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0), signMat); sign.position.set(0, 4.05, TW / 2 + 0.43); tower.add(sign);
      // rooftop billboard (both faces)
      var roofTex = canvasTex(1024, 160, signDraw(s, i));
      var roofMat = tm(new THREE.MeshBasicMaterial({ map: roofTex, side: THREE.DoubleSide }));
      var roofFrame = box(8.2, 1.6, 0.3, tm(mat(0x1b2824, 0.5))); roofFrame.position.set(0, H + 2.0, 0); tower.add(roofFrame);
      var roof1 = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 1.25), roofMat); roof1.position.set(0, H + 2.0, 0.16); tower.add(roof1);
      var roof2 = roof1.clone(); roof2.position.z = -0.16; roof2.rotation.y = Math.PI; tower.add(roof2);
      var leg1 = box(0.2, 1.3, 0.2, trimMat); leg1.position.set(-3, H + 0.9, 0); tower.add(leg1);
      var leg2 = leg1.clone(); leg2.position.x = 3; tower.add(leg2);
      var glow = new THREE.PointLight(WHITE, 0, 10); glow.position.set(0, 2.5, TW / 2 + 3); tower.add(glow);

      tower.position.copy(pos);
      tower.lookAt(0, 0, 0);
      scene.add(tower);

      // floating label above the entrance, always facing the camera
      var labTex = canvasTex(640, 120, function (x, w, h) {
        x.fillStyle = "rgba(15,27,23,0.92)"; x.fillRect(0, 0, w, h);
        x.strokeStyle = "#ffffff"; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
        x.fillStyle = "#ffffff"; x.fillRect(18, 24, 74, 72);
        x.fillStyle = C.ink; x.font = "800 34px " + FONT; x.textAlign = "center"; x.fillText(s.fkey || "", 55, 72);
        x.fillStyle = "#ffffff"; x.textAlign = "left"; x.font = "800 " + (s.label.length > 18 ? 34 : 42) + "px " + FONT; x.fillText(s.label.toUpperCase(), 110, 74);
      });
      var label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labTex, transparent: true, depthTest: false }));
      label.renderOrder = 5;
      label.scale.set(6.4, 1.2, 1);
      var lp = dir.clone().multiplyScalar(DOOR_R - 1.6); label.position.set(lp.x, 7.2, lp.z); scene.add(label);

      nodes.push({ i: i, ang: ang, dir: dir, pos: pos, stand: stand, H: H, tower: tower, mats: mats, opacity: 1,
        glow: glow, signTex: signTex, roofTex: roofTex, labTex: labTex, label: label, stopMat: stopMat });
    });

    /* ---------- scenery ---------- */
    function inTower(x, z, pad) {
      for (var q = 0; q < nodes.length; q++) {
        var n = nodes[q], dx = x - n.pos.x, dz = z - n.pos.z;
        var lx = dx * Math.cos(n.ang) + dz * Math.sin(n.ang), lz = -dx * Math.sin(n.ang) + dz * Math.cos(n.ang);
        if (Math.abs(lx) < TW / 2 + 0.4 + pad && Math.abs(lz) < TW / 2 + 0.4 + pad) return n;
      }
      return null;
    }
    function onPath(x, z) {
      var r = Math.sqrt(x * x + z * z);
      if (r < PLAZA + 0.4) return true;
      if (Math.abs(r - ringR) < 1.35) return true;
      if (inTower(x, z, 1.4)) return true;
      for (var q = 0; q < nodes.length; q++) {
        var n = nodes[q];
        var along = x * Math.cos(n.ang) + z * Math.sin(n.ang), side = -x * Math.sin(n.ang) + z * Math.cos(n.ang);
        if (along > 0 && along < DOOR_R + 1 && Math.abs(side) < 1.4) return true;
      }
      return false;
    }
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var tmp = new THREE.Object3D(), colr = new THREE.Color();
    var TUFTS = 7000;
    var tuft = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.55, 3), new THREE.MeshStandardMaterial({ roughness: 1 }), TUFTS);
    var tuftCols = [0x3f7a2e, 0x4c8a36, 0x5a9a40, 0x67a648, 0x44742b];
    for (var t = 0, placed = 0; placed < TUFTS && t < TUFTS * 3; t++) {
      var a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 60, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (onPath(x, z)) continue;
      var hgt = 0.6 + rnd() * 0.9;
      tmp.position.set(x, 0.27 * hgt, z); tmp.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.3, (rnd() - 0.5) * 0.5); tmp.scale.set(1, hgt, 1);
      tmp.updateMatrix(); tuft.setMatrixAt(placed, tmp.matrix); tuft.setColorAt(placed, colr.setHex(tuftCols[Math.floor(rnd() * tuftCols.length)])); placed++;
    }
    tuft.count = placed; scene.add(tuft);
    var FLOWERS = 520;
    var flower = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ roughness: 0.7 }), FLOWERS);
    var petal = [0xffffff, 0xf7d64a, 0xf29bb4, 0xc9a7f0, 0xff9f6b];
    for (var fl = 0, fp = 0; fp < FLOWERS && fl < FLOWERS * 4; fl++) {
      var fa2 = rnd() * Math.PI * 2, fr = 6 + Math.sqrt(rnd()) * 44, fx = Math.cos(fa2) * fr, fz = Math.sin(fa2) * fr;
      if (onPath(fx, fz)) continue;
      tmp.position.set(fx, 0.2, fz); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(0.8 + rnd() * 0.6); tmp.updateMatrix();
      flower.setMatrixAt(fp, tmp.matrix); flower.setColorAt(fp, colr.setHex(petal[Math.floor(rnd() * petal.length)])); fp++;
    }
    flower.count = fp; scene.add(flower);
    var trunkMat = mat(0x7a5636, 0.9);
    var leafMats = [0x2f6630, 0x3b7536, 0x4a843d, 0x285a32].map(function (c) { return mat(c, 0.85, { flatShading: true }); });
    function tree(x, z, sz) {
      var tr = new THREE.Group();
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * sz, 0.24 * sz, 1.4 * sz, 6), trunkMat);
      trunk.position.y = 0.7 * sz; trunk.castShadow = true; tr.add(trunk);
      var lm = leafMats[Math.floor(rnd() * leafMats.length)];
      if (rnd() < 0.45) {
        for (var c = 0; c < 3; c++) { var cone = new THREE.Mesh(new THREE.ConeGeometry((1.3 - c * 0.3) * sz, 1.5 * sz, 7), lm); cone.position.y = (1.6 + c * 0.75) * sz; cone.castShadow = true; tr.add(cone); }
      } else {
        [[0, 2.1, 0, 1.15], [0.55, 1.75, 0.2, 0.8], [-0.5, 1.8, -0.25, 0.75]].forEach(function (b) {
          var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(b[3] * sz, 1), lm); blob.position.set(b[0] * sz, b[1] * sz, b[2] * sz); blob.castShadow = true; tr.add(blob);
        });
      }
      tr.position.set(x, 0, z); tr.rotation.y = rnd() * 6.3; scene.add(tr);
    }
    nodes.forEach(function (n) {   // trees in the gaps between towers, and along the ring
      var m = n.ang + Math.PI / N;
      tree(Math.cos(m) * (R - 1), Math.sin(m) * (R - 1), 1.1 + rnd() * 0.3);
      tree(Math.cos(m - 0.12) * (R + 4), Math.sin(m - 0.12) * (R + 4), 1.0 + rnd() * 0.4);
      tree(Math.cos(m + 0.1) * (ringR + 3.2), Math.sin(m + 0.1) * (ringR + 3.2), 0.85 + rnd() * 0.3);
    });
    for (var w = 0; w < 110; w++) {
      var ta = rnd() * Math.PI * 2, trr = 36 + rnd() * 30, tx = Math.cos(ta) * trr, tz = Math.sin(ta) * trr;
      if (!inTower(tx, tz, 2)) tree(tx, tz, 0.9 + rnd() * 0.8);
    }
    var bushMat = mat(0x3d7531, 0.9, { flatShading: true });
    for (var bsh = 0, bp = 0; bp < 34 && bsh < 300; bsh++) {
      var ba = rnd() * Math.PI * 2, br = 7 + rnd() * 14, bx = Math.cos(ba) * br, bz = Math.sin(ba) * br;
      if (onPath(bx, bz) || onPath(bx + 0.8, bz) || onPath(bx - 0.8, bz) || onPath(bx, bz + 0.8) || onPath(bx, bz - 0.8)) continue;
      var bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + rnd() * 0.3, 1), bushMat); bush.position.set(bx, 0.35, bz); bush.scale.y = 0.75; bush.castShadow = true; scene.add(bush); bp++;
    }

    /* ---------- the banker ---------- */
    var M = { suit: mat(0x1f3556, 0.6), suitD: mat(0x172a46, 0.6), pants: mat(0x1d2738, 0.7), skin: mat(0xe7c29f, 0.8), hair: mat(0x20160f, 0.6),
      shirt: mat(0xf5f5f5, 0.6), tie: mat(0xb3243a, 0.5), shoe: mat(0x080808, 0.35), bcase: mat(0x5c3a1e, 0.55), clasp: mat(0xd4a62a, 0.3), eye: mat(0x141414) };
    var person = buildPerson(M), banker = person.root;
    var tagTex = canvasTex(256, 64, function (x, w, h) {
      x.fillStyle = "#8fd3ff"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#13201b"; x.font = "800 32px " + FONT; x.textAlign = "center"; x.fillText((opts.name || "").toUpperCase(), w / 2, 43);
    });
    var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, depthTest: false }));
    tag.scale.set(1.6, 0.4, 1); tag.position.y = 3.15; tag.renderOrder = 10; banker.add(tag);
    var shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: 0x1f3317, transparent: true, opacity: 0.35 }));
    shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = 0.035; scene.add(shadowDisc);
    banker.scale.setScalar(1.35);
    banker.position.set(0, 0, PLAZA + 1.6);
    scene.add(banker);

    S = {
      P: P, sections: sections, renderer: renderer, scene: scene, camera: camera, container: container, fade: fade,
      nodes: nodes, banker: banker, person: person, shadowDisc: shadowDisc,
      N: N, R: R, TW: TW, DOOR_R: DOOR_R, STOP_R: STOP_R, ringR: ringR, PLAZA: PLAZA, NEAR_DOOR: NEAR_DOOR, LIMIT: LIMIT,
      WALK: WALK, RUN: RUN, GRAVITY: GRAVITY, JUMP_V: JUMP_V,
      keys: {}, run: false, path: null, pathDone: null, target: null, arriveT: 0,
      vy: 0, jumping: false, heading: 0, walkPhase: 0, active: null, activeBoard: null, promptKey: "", paused: false, running: false,
      raf: null, clock: new THREE.Clock(), visited: visited,
      onActive: opts.onActive || function () {}, onOpen: opts.onOpen || function () {}, onVisit: opts.onVisit || function () {},
      inside: -1, interiors: {}, busy: false, inTower: inTower, tag: tag,
      camPos: new THREE.Vector3(0, 34, 40), camLook: new THREE.Vector3(0, 2, 4)
    };

    // fonts may arrive after the first draw: redraw text once they're ready
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      nodes.forEach(function (n) { redraw(n.signTex); redraw(n.roofTex); redraw(n.labTex); });
      redraw(tagTex); redraw(plateTex);
      Object.keys(S.interiors).forEach(function (k) { S.interiors[k].boards.forEach(function (b) { redraw(b.tex); }); redraw(S.interiors[k].wallTex); });
    });

    bindInput();
    resize();
    snapCamera();

    return true;
  }

  /* ---------------------------------------------------------------
     a tower's lobby (built the first time you walk in)
     --------------------------------------------------------------- */
  var ROW = 8.2, COLX = 4.9, BW = 5.8, BH = 3.6, BY = 4.7;
  function buildInterior(i) {
    var sec = S.sections[i], boards = boardsFor(sec, S.P);
    var n = boards.length, rows = Math.max(1, Math.ceil(n / 2));
    var zFront = 9, zBack = -(rows - 1) * ROW - 7, W = 22, D = zFront - zBack, WALL_H = 8;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1411);
    scene.fog = new THREE.Fog(0x0b1411, 34, 80);
    scene.add(new THREE.HemisphereLight(0xeaf3ff, 0x1b2a24, 0.75));
    var key = new THREE.DirectionalLight(0xfff3dc, 0.55); key.position.set(6, 20, 14); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    var sc = key.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 34; sc.bottom = -34; sc.far = 70;
    scene.add(key);

    // polished tile floor
    var tile = canvasTex(256, 256, function (x, w, h) {
      x.fillStyle = "#1a2a25"; x.fillRect(0, 0, w, h);
      x.strokeStyle = "#2a3d36"; x.lineWidth = 3; x.strokeRect(0, 0, w, h);
      x.strokeStyle = "#22342d"; x.lineWidth = 2; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
    });
    tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(W / 4, D / 4);
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.3, metalness: 0.25 }));
    fl.rotation.x = -Math.PI / 2; fl.position.z = (zFront + zBack) / 2; fl.receiveShadow = true; scene.add(fl);
    var runner = new THREE.Mesh(new THREE.PlaneGeometry(2.4, D - 1), mat(0x22342d, 0.9));
    runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.01, (zFront + zBack) / 2); runner.receiveShadow = true; scene.add(runner);

    var wallMat = mat(0xe4e8e3, 0.85), trim = mat(0xffffff, 0.5), dark = mat(0x1b2824, 0.5);
    var left = box(0.4, WALL_H, D, wallMat); left.position.set(-W / 2, WALL_H / 2, (zFront + zBack) / 2); left.receiveShadow = true; scene.add(left);
    var right = left.clone(); right.position.x = W / 2; scene.add(right);
    var back = box(W, WALL_H, 0.4, wallMat); back.position.set(0, WALL_H / 2, zBack); back.receiveShadow = true; scene.add(back);
    // ceiling: faces down, so it's only seen from inside (on phones, where the camera sits lower)
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D + 14), new THREE.MeshStandardMaterial({ color: 0xdfe4df, roughness: 0.9, emissive: 0x2a3330 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WALL_H, (zFront + zBack) / 2 + 7); scene.add(ceil);
    for (var z = zFront - 3; z > zBack + 2; z -= 5) {   // tall window strips on the side walls
      [-1, 1].forEach(function (sd) {
        var win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5.6), new THREE.MeshStandardMaterial({ color: 0x9fc4d6, emissive: 0x6f9fb6, emissiveIntensity: 0.55, roughness: 0.2 }));
        win.position.set(sd * (W / 2 - 0.21), 4.2, z); win.rotation.y = -sd * Math.PI / 2; scene.add(win);
      });
    }
    // front: a low planter wall with the exit arch in the middle
    [-1, 1].forEach(function (sd) {
      var pl = box(W / 2 - 2.2, 1.0, 0.8, dark); pl.position.set(sd * (W / 4 + 1.1), 0.5, zFront); scene.add(pl);
      for (var b = 0; b < 5; b++) {
        var sh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat(0x3d7531, 0.9, { flatShading: true }));
        sh.position.set(sd * (3.2 + b * 1.6), 1.25, zFront); sh.scale.y = 0.7; scene.add(sh);
      }
      var post = box(0.35, 4.2, 0.5, trim); post.position.set(sd * 2.0, 2.1, zFront); scene.add(post);
    });
    var lintel = box(4.4, 0.4, 0.5, trim); lintel.position.set(0, 4.3, zFront); scene.add(lintel);
    var exitTex = canvasTex(256, 64, function (x, w) {
      x.fillStyle = C.bg; x.fillRect(0, 0, w, 64); x.fillStyle = C.green; x.font = "800 34px " + FONT; x.textAlign = "center"; x.fillText("EXIT", w / 2, 45);
    });
    var exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: exitTex }));
    exitSign.position.set(0, 4.85, zFront - 0.05); exitSign.rotation.y = Math.PI; scene.add(exitSign);
    var mat2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ color: 0x2e4a3f }));
    mat2.rotation.x = -Math.PI / 2; mat2.position.set(0, 0.02, zFront - 0.9); scene.add(mat2);

    // back wall banner: the section's name
    var wallTex = canvasTex(1536, 384, function (x, w, h) {
      x.fillStyle = C.bg; x.fillRect(0, 0, w, h);
      x.fillStyle = "#ffffff"; x.fillRect(48, 70, 150, 92);
      x.fillStyle = C.ink; x.font = "800 58px " + FONT; x.textAlign = "center"; x.fillText(sec.fkey || "", 123, 136);
      x.textAlign = "left"; x.fillStyle = "#ffffff"; x.font = "800 " + (sec.label.length > 18 ? 74 : 92) + "px " + FONT; x.fillText(sec.label.toUpperCase(), 232, 146);
      x.fillStyle = C.muted; x.font = "500 34px " + FONT;
      var intro = sec.intro || sec.blurb || "";
      wrapLines(x, intro, w - 100, 3).forEach(function (ln, k) { x.fillText(ln, 50, 238 + k * 46); });
    });
    var banner = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: wallTex }));
    banner.position.set(0, 5.2, zBack + 0.22); scene.add(banner);
    var bannerFrame = box(14.3, 3.8, 0.1, trim); bannerFrame.position.set(0, 5.2, zBack + 0.16); bannerFrame.castShadow = false; scene.add(bannerFrame);

    for (var zl = zFront - 4; zl > zBack + 2; zl -= ROW) { var pl2 = new THREE.PointLight(0xfff1d8, 0.5, 18); pl2.position.set(0, 7, zl); scene.add(pl2); }
    [[-W / 2 + 1.3, zBack + 1.3], [W / 2 - 1.3, zBack + 1.3], [-W / 2 + 1.3, zFront - 1.5], [W / 2 - 1.3, zFront - 1.5]].forEach(function (p) {
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.9, 12), mat(0xe4e8e3, 0.6)); pot.position.set(p[0], 0.45, p[1]); pot.castShadow = true; scene.add(pot);
      var leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), mat(0x3b7536, 0.85, { flatShading: true })); leaves.position.set(p[0], 1.75, p[1]); leaves.castShadow = true; scene.add(leaves);
    });

    // billboards
    var list = boards.map(function (b, k) {
      var row = Math.floor(k / 2), col = k % 2;
      var bx = (n % 2 === 1 && k === n - 1) ? 0 : (col === 0 ? -COLX : COLX);
      var bz = -row * ROW;
      var g = new THREE.Group();
      var frameMat = mat(0xffffff, 0.45, { emissive: new THREE.Color(0xffffff), emissiveIntensity: 0 });
      var frame = box(BW + 0.24, BH + 0.24, 0.2, frameMat); frame.position.y = BY; g.add(frame);
      var tex = canvasTex(1024, 640, drawBoard(b, sec));
      var screen = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex }));
      screen.position.set(0, BY, 0.11); g.add(screen);
      var backPanel = box(BW, BH, 0.05, dark); backPanel.position.set(0, BY, -0.12); g.add(backPanel);
      [-1, 1].forEach(function (sd) { var pst = box(0.22, BY - BH / 2 + 0.1, 0.22, dark); pst.position.set(sd * (BW / 2 - 0.7), (BY - BH / 2) / 2, -0.05); g.add(pst); });
      var foot = box(BW - 0.6, 0.12, 1.2, dark); foot.position.set(0, 0.06, -0.05); g.add(foot);
      var spot = new THREE.PointLight(0xffffff, 0, 9); spot.position.set(0, BY, 2.4); g.add(spot);
      g.position.set(bx, 0, bz); scene.add(g);
      if ((b.photo || b.image) && location.protocol !== "file:") {   // (browsers block pictures in 3D when opened from disk)
        var img = new Image();
        img.onload = function () { redraw(tex); };
        img.src = b.photo || b.image;
        b._img = img;
      }
      return { b: b, x: bx, z: bz, group: g, frameMat: frameMat, spot: spot, tex: tex, screen: screen };
    });
    return { i: i, scene: scene, boards: list, zFront: zFront, zBack: zBack, W: W, wallTex: wallTex };
  }

  /* ---------------------------------------------------------------
     entering & leaving towers
     --------------------------------------------------------------- */
  function moveBankerTo(scene) { scene.add(S.banker); scene.add(S.shadowDisc); }
  function withFade(fn) {
    S.busy = true; S.keys = {};
    S.fade.classList.add("on");
    setTimeout(function () {
      fn();
      snapCamera();
      requestAnimationFrame(function () { S.fade.classList.remove("on"); setTimeout(function () { S.busy = false; }, 250); });
    }, 300);
  }
  function enterBuilding(i, instant) {
    if (!S || S.inside === i) return;
    cancel();
    var go = function () {
      if (!S.interiors[i]) S.interiors[i] = buildInterior(i);
      var I = S.interiors[i];
      S.inside = i;
      moveBankerTo(I.scene);
      S.banker.position.set(0, 0, I.zFront - 3.2); S.banker.rotation.y = Math.PI; S.heading = Math.PI;
      S.vy = 0; S.jumping = false; S.activeBoard = null;
      S.onVisit(i);
    };
    if (instant) { go(); snapCamera(); } else withFade(go);
  }
  function exitBuilding(instant) {
    if (!S || S.inside < 0) return;
    cancel();
    var i = S.inside;
    var go = function () {
      S.inside = -1; S.activeBoard = null;
      moveBankerTo(S.scene);
      var n = S.nodes[i], p = n.dir.clone().multiplyScalar(S.STOP_R - 0.8);
      S.banker.position.set(p.x, 0, p.z);
      S.heading = Math.atan2(-n.dir.x, -n.dir.z); S.banker.rotation.y = S.heading;
      S.vy = 0; S.jumping = false;
    };
    if (instant) { go(); snapCamera(); } else withFade(go);
  }

  /* ---------------------------------------------------------------
     routes (outside): out to the ring road, around it, up to the door
     --------------------------------------------------------------- */
  function ringPoint(a) { return new THREE.Vector3(Math.cos(a) * S.ringR, 0, Math.sin(a) * S.ringR); }
  function cancel() { if (!S) return; S.path = null; S.pathDone = null; S.arriveT = 0; S.target = null; }
  function travelTo(k) {
    if (!S || k < 0 || k >= S.N) return;
    if (S.inside === k) return;
    var startRoute = function () {
      cancel();
      var b = S.banker.position, n = S.nodes[k], tgt = n.stand.clone();
      var r = Math.sqrt(b.x * b.x + b.z * b.z), a = Math.atan2(b.z, b.x);
      var pts = [];
      if (Math.abs(angDiff(a, n.ang)) < 0.25 && r > S.PLAZA - 1) pts = [tgt];
      else {
        pts.push(ringPoint(a));
        var da = angDiff(n.ang, a), steps = Math.max(2, Math.ceil(Math.abs(da) / 0.12));
        for (var s = 1; s <= steps; s++) pts.push(ringPoint(a + da * s / steps));
        pts.push(tgt);
      }
      S.path = pts; S.target = k;
      S.pathDone = function () { enterBuilding(k); };
    };
    if (S.inside >= 0) { exitBuilding(); setTimeout(startRoute, 620); } else startRoute();
  }
  function walkToPoint(p) {
    cancel();
    if (S.inside >= 0) {
      var I = S.interiors[S.inside];
      p.x = Math.max(-I.W / 2 + 0.9, Math.min(I.W / 2 - 0.9, p.x));
      p.z = Math.max(I.zBack + 1, Math.min(I.zFront - 0.6, p.z));
    } else {
      var d = Math.sqrt(p.x * p.x + p.z * p.z);
      if (d > S.LIMIT) p.multiplyScalar(S.LIMIT / d);
    }
    S.path = [new THREE.Vector3(p.x, 0, p.z)];
  }
  function teleport(k) {
    if (!S) return;
    cancel();
    if (S.inside !== k) {
      if (S.inside >= 0) exitBuilding(true);
      enterBuilding(k, true);
    }
  }
  function jump() { if (!S || S.paused || S.jumping || S.busy) return; S.vy = S.JUMP_V; S.jumping = true; }

  /* ---------------------------------------------------------------
     input
     --------------------------------------------------------------- */
  var KEYMAP = { ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r" };
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      if (!S || !S.running) return;
      if (e.key === "Shift") S.run = true;
      if (S.paused || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = KEYMAP[e.code];
      if (k) { S.keys[k] = true; e.preventDefault(); return; }
      if (e.code === "Space") { e.preventDefault(); jump(); }
    });
    document.addEventListener("keyup", function (e) {
      if (!S) return;
      if (e.key === "Shift") S.run = false;
      var k = KEYMAP[e.code]; if (k) S.keys[k] = false;
    });
    window.addEventListener("blur", function () { if (S) { S.keys = {}; S.run = false; } });

    var ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function aim(e) {
      var rect = S.renderer.domElement.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, S.camera);
    }
    function pickTower() {
      var hits = ray.intersectObjects(S.nodes.map(function (n) { return n.tower; }), true);
      for (var h = 0; h < hits.length; h++) {
        var o = hits[h].object;
        while (o) {
          for (var q = 0; q < S.nodes.length; q++) if (S.nodes[q].tower === o && S.nodes[q].opacity > 0.5) return S.nodes[q];
          o = o.parent;
        }
      }
      return null;
    }
    function pickBoard() {
      var I = S.interiors[S.inside];
      var hits = ray.intersectObjects(I.boards.map(function (b) { return b.group; }), true);
      if (!hits.length) return null;
      var o = hits[0].object;
      while (o) { for (var q = 0; q < I.boards.length; q++) if (I.boards[q].group === o) return I.boards[q]; o = o.parent; }
      return null;
    }
    S.renderer.domElement.addEventListener("click", function (e) {
      if (!S || S.paused || S.busy) return;
      aim(e);
      if (S.inside >= 0) {
        var bd = pickBoard();
        if (bd) {
          if (S.activeBoard === bd) { S.onOpen(S.inside, bd.b.hash || null, bd.b.entry); return; }
          cancel(); S.path = [new THREE.Vector3(bd.x, 0, bd.z + 2.5)];
          S.pathDone = function () { S.onOpen(S.inside, bd.b.hash || null, bd.b.entry); };
          return;
        }
      } else {
        var node = pickTower();
        if (node) { if (S.active === node.i) enterBuilding(node.i); else travelTo(node.i); return; }
      }
      var p = new THREE.Vector3();
      if (ray.ray.intersectPlane(plane, p)) walkToPoint(p);
    });
    S.renderer.domElement.addEventListener("mousemove", function (e) {
      if (!S || S.paused) return;
      aim(e);
      var over = S.inside >= 0 ? !!pickBoard() : !!pickTower();
      S.renderer.domElement.style.cursor = over ? "pointer" : "crosshair";
    });
  }

  /* ---------------------------------------------------------------
     camera
     --------------------------------------------------------------- */
  function camGoal(pos, look) {
    var b = S.banker.position;
    if (S.inside >= 0) {
      var I = S.interiors[S.inside], ab = S.activeBoard;
      if (ab) {   // frame the billboard you're standing at
        pos.set(ab.x, BY + 2.9, ab.z + (S.portrait ? 13 : 9.4)); look.set(ab.x, BY - 0.2, ab.z);
      } else {
        pos.set(b.x * 0.55, 10.5, Math.min(b.z + 12.5, I.zFront + 11)); look.set(b.x * 0.55, 2.6, b.z - 3.5);
        if (S.portrait) { pos.set(b.x * 0.3, 7.5, Math.min(b.z + 12, I.zFront + 11)); look.set(b.x * 0.3, 3.0, b.z - 6); }
      }
    } else {
      pos.set(b.x * 0.55, 30, b.z * 0.55 + 34); look.set(b.x * 0.62, 2, b.z * 0.62 + 1);
      if (S.portrait) { pos.y += 12; pos.z += 14; }
    }
  }
  function snapCamera() {
    var p = new THREE.Vector3(), l = new THREE.Vector3();
    camGoal(p, l); S.camPos.copy(p); S.camLook.copy(l);
  }

  /* ---------------------------------------------------------------
     loop
     --------------------------------------------------------------- */
  function step() {
    var dt = Math.min(0.05, S.clock.getDelta()), moving = false;
    var b = S.banker.position;
    var speed = S.run ? S.RUN : S.WALK;
    var kx = (S.keys.r ? 1 : 0) - (S.keys.l ? 1 : 0), kz = (S.keys.d ? 1 : 0) - (S.keys.u ? 1 : 0);
    var I = S.inside >= 0 ? S.interiors[S.inside] : null;
    var px = b.x, pz = b.z;

    if (!S.paused && !S.busy && (kx || kz)) {
      if (S.path || S.arriveT) cancel();
      var l = Math.sqrt(kx * kx + kz * kz);
      b.x += kx / l * speed * dt; b.z += kz / l * speed * dt;
      S.heading = Math.atan2(kx, kz); moving = true;
    } else if (!S.busy && !S.paused && S.path && S.path.length) {
      var t = S.path[0], dx = t.x - b.x, dz = t.z - b.z, d = Math.sqrt(dx * dx + dz * dz), stp = (S.run ? S.RUN : S.WALK * 1.15) * dt;
      S.heading = Math.atan2(dx, dz);
      if (d <= stp) {
        b.x = t.x; b.z = t.z; S.path.shift();
        if (!S.path.length) {
          S.path = null; S.target = null;
          if (S.pathDone) { S.arriveT = 0.32; if (!S.jumping) { S.vy = 5.5; S.jumping = true; } }
        }
      } else { b.x += dx / d * stp; b.z += dz / d * stp; }
      moving = true;
    }
    if (S.arriveT > 0) {
      S.arriveT -= dt;
      if (S.arriveT <= 0 && S.pathDone) { var done = S.pathDone; S.pathDone = null; S.arriveT = 0; done(); }
    }

    // collisions
    if (I) {
      b.x = Math.max(-I.W / 2 + 0.75, Math.min(I.W / 2 - 0.75, b.x));
      b.z = Math.max(I.zBack + 0.9, b.z);
      if (b.z > I.zFront - 0.5) {
        if (Math.abs(b.x) < 1.7) { if (b.z > I.zFront + 0.2 && !S.busy) exitBuilding(); }
        else b.z = I.zFront - 0.5;
      }
      I.boards.forEach(function (bd) {   // can't walk through a billboard stand
        var ox = 3.1 - Math.abs(b.x - bd.x), oz = 0.75 - Math.abs(b.z - bd.z);
        if (ox > 0 && oz > 0) { if (ox < oz) b.x += ox * Math.sign(b.x - bd.x || 1); else b.z += oz * Math.sign(b.z - bd.z || 1); }
      });
    } else {
      var r = Math.sqrt(b.x * b.x + b.z * b.z);
      if (r > S.LIMIT) { b.x *= S.LIMIT / r; b.z *= S.LIMIT / r; }
      if (r < 2.7) { var rr = r || 0.01; b.x *= 2.7 / rr; b.z *= 2.7 / rr; }   // the statue
      var hit = S.inTower(b.x, b.z, 0.1);
      if (hit) {
        // walking into the front door takes you inside; any other wall stops you
        var lx = (b.x - hit.pos.x) * Math.cos(hit.ang) + (b.z - hit.pos.z) * Math.sin(hit.ang);
        var lz = -(b.x - hit.pos.x) * Math.sin(hit.ang) + (b.z - hit.pos.z) * Math.cos(hit.ang);
        b.x = px; b.z = pz;
        if (lx < 0 && Math.abs(lz) < 1.6 && !S.busy) enterBuilding(hit.i);
      }
    }

    if (S.jumping) { S.vy -= S.GRAVITY * dt; b.y += S.vy * dt; if (b.y <= 0) { b.y = 0; S.vy = 0; S.jumping = false; } }
    S.shadowDisc.position.x = b.x; S.shadowDisc.position.z = b.z;
    var sScale = 1 - Math.min(0.6, b.y / 6); S.shadowDisc.scale.setScalar(sScale); S.shadowDisc.material.opacity = 0.35 * sScale;

    var diff = angDiff(S.heading, S.banker.rotation.y);
    S.banker.rotation.y += diff * Math.min(1, dt * 12);
    var Pp = S.person;
    if (moving) S.walkPhase += dt * (S.run ? 14 : 9.5);
    var amp = S.run ? 0.95 : 0.6, swing = moving ? Math.sin(S.walkPhase) * amp : 0;
    var lL = swing, lR = -swing, aL = -swing * 0.75, aR = swing * 0.45;
    if (S.jumping) { lL = -0.55; lR = 0.35; aL = -2.4; aR = -0.6; }
    Pp.legL.rotation.x += (lL - Pp.legL.rotation.x) * 0.35; Pp.legR.rotation.x += (lR - Pp.legR.rotation.x) * 0.35;
    Pp.armL.rotation.x += (aL - Pp.armL.rotation.x) * 0.3; Pp.armR.rotation.x += (aR - Pp.armR.rotation.x) * 0.3;
    Pp.body.position.y = (moving && !S.jumping) ? Math.abs(Math.sin(S.walkPhase)) * (S.run ? 0.14 : 0.08) : Math.sin(S.clock.elapsedTime * 2) * 0.01;
    Pp.body.rotation.x = S.run && moving && !S.jumping ? 0.12 : 0;

    // what's near: a tower door outside, a billboard inside
    var near = null, prompt = null;
    if (I) {
      var ab = null, best = 99;
      I.boards.forEach(function (bd) {
        var dxb = Math.abs(b.x - bd.x), dzb = b.z - bd.z;
        if (dxb < 3.3 && dzb > 0.6 && dzb < 4.6) { var dd = dxb + Math.abs(dzb - 2.4); if (dd < best) { best = dd; ab = bd; } }
      });
      I.boards.forEach(function (bd) {
        var on = bd === ab;
        bd.frameMat.emissiveIntensity += ((on ? 0.6 : 0) - bd.frameMat.emissiveIntensity) * 0.2;
        bd.spot.intensity += ((on ? 0.9 : 0) - bd.spot.intensity) * 0.2;
      });
      S.activeBoard = ab;
      S.tag.visible = !ab;            // the name tag would sit on top of the billboard
      var sec = S.sections[S.inside];
      if (ab) { near = S.inside; prompt = "▶ " + ab.b.title + " — PRESS ENTER FOR DETAILS"; }
      else if (b.z > I.zFront - 3.2 && Math.abs(b.x) < 3) prompt = "WALK OUT THE DOOR OR PRESS ESC TO GO BACK OUTSIDE";
      else prompt = sec.label.toUpperCase() + " · WALK UP TO A BILLBOARD · ESC TO LEAVE";
    } else {
      S.tag.visible = true;
      var nd = S.NEAR_DOOR;
      S.nodes.forEach(function (n) { var dd = flatDist(b, n.stand); if (dd < nd) { nd = dd; near = n.i; } });
      S.nodes.forEach(function (n) {
        var on = n.i === near || n.i === S.target;
        n.glow.intensity += ((n.i === near ? 2.2 : 0) - n.glow.intensity) * 0.15;
        n.stopMat.color.setHex(on ? BLUE : WHITE);
      });
      if (near !== null) prompt = "▶ " + S.sections[near].label.toUpperCase() + " — PRESS ENTER TO GO INSIDE";
    }
    var pk = near + "|" + prompt + "|" + S.inside;
    if (pk !== S.promptKey) { S.promptKey = pk; S.active = near; S.onActive(near, prompt); }

    // camera; towers between the camera and the banker turn see-through
    camGoal(S._g || (S._g = new THREE.Vector3()), S._l || (S._l = new THREE.Vector3()));
    S.camPos.lerp(S._g, 1 - Math.pow(0.02, dt));
    S.camLook.lerp(S._l, 1 - Math.pow(0.02, dt));
    S.camera.position.copy(S.camPos); S.camera.lookAt(S.camLook);
    if (!I) {
      S.nodes.forEach(function (n) {
        var front = n.pos.z > b.z + 4 && Math.abs(n.pos.x - b.x * 0.55) < 21;
        var goal = front ? 0.2 : 1;
        if (Math.abs(goal - n.opacity) > 0.005) {
          n.opacity += (goal - n.opacity) * Math.min(1, dt * 6);
          n.mats.forEach(function (m) { m.opacity = n.opacity; m.depthWrite = n.opacity > 0.9; });
        }
        n.label.material.opacity = front ? 0.4 : 1;
      });
    }

    S.renderer.render(I ? I.scene : S.scene, S.camera);
    S.raf = requestAnimationFrame(step);
  }

  function start() { if (!S || S.running) return; S.running = true; resize(); S.clock.getDelta(); S.raf = requestAnimationFrame(step); }
  function stop() { if (!S) return; S.running = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; S.keys = {}; S.run = false; }
  function resize() {
    if (!S) return;
    var w = S.container.clientWidth || window.innerWidth, h = S.container.clientHeight || window.innerHeight;
    S.renderer.setSize(w, h, false);
    S.renderer.domElement.style.width = "100%"; S.renderer.domElement.style.height = "100%";
    S.camera.aspect = w / h;
    S.portrait = w / h < 1;
    S.camera.fov = S.portrait ? 64 : 45;
    S.camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  window.Map3D = {
    supported: supported,
    init: init,
    start: start,
    stop: stop,
    resize: resize,
    travelTo: travelTo,
    teleport: teleport,
    cancel: function () { if (!S) return; if (S.path || S.pathDone) cancel(); else if (S.inside >= 0) exitBuilding(); },
    jump: jump,
    // Enter: outside at a door → go in; inside at the exit → leave; otherwise false (script.js opens the details window)
    primary: function () {
      if (!S || S.busy) return true;
      if (S.inside < 0) { if (S.active !== null) { enterBuilding(S.active); return true; } return false; }
      var b = S.banker.position, I = S.interiors[S.inside];
      if (!S.activeBoard && b.z > I.zFront - 3.2 && Math.abs(b.x) < 3) { exitBuilding(); return true; }
      return false;
    },
    activeIndex: function () { return S ? (S.inside >= 0 ? S.inside : S.active) : null; },
    activeHash: function () { return S && S.activeBoard ? S.activeBoard.b.hash || null : null; },
    activeEntry: function () { return S && S.activeBoard && S.activeBoard.b.entry != null ? S.activeBoard.b.entry : null; },
    isInside: function () { return S ? S.inside : -1; },
    setPaused: function (p) { if (S) { S.paused = !!p; if (p) S.keys = {}; } },
    setKey: function (dir, on) { if (S) S.keys[{ up: "u", down: "d", left: "l", right: "r" }[dir]] = !!on; },
    refreshScreens: function () { if (S) S.nodes.forEach(function (n) { redraw(n.signTex); redraw(n.roofTex); }); }
  };
})();
