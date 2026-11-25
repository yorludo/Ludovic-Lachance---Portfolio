/* =====================================================================
   LUDOVIC LACHANCE - PORTFOLIO — 3D map (uses lib/three.min.js)
   script.js decides whether to use this or the original 2D map.
   ===================================================================== */
(function () {
  "use strict";

  var AMBER = 0xffffff, AMBER_DIM = 0x6f8278;   // accents (white); the name tag is the blue highlight colour
  var FONT = '"JetBrains Mono", Consolas, monospace';

  function supported() {
    if (!window.THREE) return false;
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  var S = null; // state, created by init()

  function init(container, sections, opts) {
    opts = opts || {};
    var N = sections.length;
    var R = 14, STAND = 3.6, ringR = R - STAND, NEAR = 5.2;
    var WALK = 6.2, RUN = 11.5, GRAVITY = 30, JUMP_V = 10.5;

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "map3d-canvas";
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    // soft golden-hour sky, with haze that fades the far edges into it
    var sky = document.createElement("canvas"); sky.width = 4; sky.height = 256;
    var sg = sky.getContext("2d"), grad = sg.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#6fa3cf"); grad.addColorStop(0.55, "#b9d6e3"); grad.addColorStop(1, "#f1dfb9");
    sg.fillStyle = grad; sg.fillRect(0, 0, 4, 256);
    scene.background = new THREE.CanvasTexture(sky);
    scene.fog = new THREE.Fog(0xb9ccb8, 48, 110);
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xdcecf5, 0x3d5a2a, 0.55));
    var key = new THREE.DirectionalLight(0xffe9c4, 0.72);
    key.position.set(10, 22, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc = key.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 70;
    scene.add(key);

    // grass lawn: a mottled green texture, repeated
    var lawnC = document.createElement("canvas"); lawnC.width = lawnC.height = 256;
    var lg = lawnC.getContext("2d");
    lg.fillStyle = "#4f8a3c"; lg.fillRect(0, 0, 256, 256);
    var greens = ["#467d35", "#5b9443", "#538c3e", "#3f7230", "#66a04b"];
    for (var g = 0; g < 2600; g++) {
      lg.fillStyle = greens[g % greens.length];
      lg.globalAlpha = 0.35 + (g % 7) * 0.06;
      lg.fillRect((g * 97.3) % 256, (g * 57.7 + (g % 13) * 11) % 256, 2 + (g % 3), 3 + (g % 4));
    }
    lg.globalAlpha = 1;
    var lawnTex = new THREE.CanvasTexture(lawnC);
    lawnTex.wrapS = lawnTex.wrapT = THREE.RepeatWrapping; lawnTex.repeat.set(40, 40); lawnTex.anisotropy = 8;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    function canvasTex(w, h, draw) {
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      draw(c.getContext("2d"), w, h);
      var t = new THREE.CanvasTexture(c); t.anisotropy = 8;
      t.userData = { canvas: c, draw: draw };
      return t;
    }
    function redraw(t) { var c = t.userData.canvas; var x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height); t.userData.draw(x, c.width, c.height); t.needsUpdate = true; }

    // HQ: a round stone plaza with a gold ring
    var plaza = new THREE.Mesh(new THREE.CircleGeometry(2.9, 64), new THREE.MeshStandardMaterial({ color: 0xc9b58f, roughness: 0.95 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.025; plaza.receiveShadow = true; scene.add(plaza);
    var hq = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.45, 64), new THREE.MeshBasicMaterial({ color: AMBER_DIM, side: THREE.DoubleSide }));
    hq.rotation.x = -Math.PI / 2; hq.position.y = 0.03; scene.add(hq);
    var hqTex = canvasTex(256, 128, function (x, w) {
      x.fillStyle = "#ffffff"; x.textAlign = "center";
      x.font = "800 64px " + FONT; x.fillText("HQ", w / 2, 70);
      x.font = "700 20px " + FONT; x.fillText("START", w / 2, 108);
    });
    var hqLabel = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ transparent: true, map: hqTex }));
    hqLabel.rotation.x = -Math.PI / 2; hqLabel.position.y = 0.04; scene.add(hqLabel);

    // roads
    var roadMat = new THREE.MeshStandardMaterial({ color: 0xbfae88, roughness: 1 });
    var dashMat = new THREE.MeshBasicMaterial({ color: 0xf6ead0, transparent: true, opacity: 0.7 });
    var ring = new THREE.Mesh(new THREE.RingGeometry(ringR - 0.7, ringR + 0.7, 128), roadMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.receiveShadow = true; scene.add(ring);
    for (var d = 0; d < 64; d += 2) {
      var seg = new THREE.Mesh(new THREE.RingGeometry(ringR - 0.05, ringR + 0.05, 6, 1, d / 64 * Math.PI * 2, Math.PI * 2 / 64), dashMat);
      seg.rotation.x = -Math.PI / 2; seg.position.y = 0.03; scene.add(seg);
    }

    var nodes = [];
    var visited = opts.visited || {};

    function drawScreen(s, i) {
      return function (x, w, h) {
        x.fillStyle = "#0f1b17"; x.fillRect(0, 0, w, h);
        x.fillStyle = "#172722"; x.fillRect(0, 0, w, 54);
        x.fillStyle = "#ffffff"; x.fillRect(14, 12, 62, 30);
        x.fillStyle = "#13201b"; x.font = "800 24px " + FONT; x.fillText(s.fkey || "F" + (i + 1), 24, 36);
        x.fillStyle = "#ffffff"; x.font = "700 24px " + FONT; x.fillText(s.code || "", 92, 36);
        // name, wrapped
        x.fillStyle = "#eef2ec"; x.font = "800 " + (s.label.length > 16 ? 32 : 40) + "px " + FONT;
        var words = s.label.split(" "), line = "", y = 118;
        words.forEach(function (wd) {
          if ((line + wd).length > 15) { x.fillText(line.trim(), 22, y); y += 44; line = ""; }
          line += wd + " ";
        });
        x.fillText(line.trim(), 22, y);
        x.fillStyle = "#9a9a9a"; x.font = "500 22px " + FONT; x.fillText(s.blurb || "", 22, y + 36);
        // sparkline
        x.strokeStyle = i % 3 ? "#5fd38d" : "#ff7a6b"; x.lineWidth = 3; x.beginPath();
        var yy = 285; x.moveTo(20, yy);
        for (var p = 1; p <= 18; p++) { yy = Math.max(255, Math.min(312, yy + Math.sin(i * 7 + p * 1.7) * 18)); x.lineTo(20 + p * 26, yy); }
        x.stroke();
        // status
        var v = !!visited[s.id];
        x.fillStyle = v ? "#5fd38d" : "#ffffff"; x.font = "700 20px " + FONT;
        x.fillText(v ? "✓ VIEWED" : "● NEW", w - 140, h - 14);
      };
    }

    sections.forEach(function (s, i) {
      var ang = -Math.PI / 2 + i * (Math.PI * 2 / N);
      var dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      var pos = dir.clone().multiplyScalar(R);
      var stand = dir.clone().multiplyScalar(ringR);

      var len = R - 1.2;
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, len), roadMat);
      spoke.position.copy(dir.clone().multiplyScalar(len / 2)); spoke.position.y = 0.015;
      spoke.rotation.y = -ang + Math.PI / 2; spoke.receiveShadow = true; scene.add(spoke);
      for (var k = 2; k < len; k += 1.6) {
        var dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.8), dashMat);
        dash.position.copy(dir.clone().multiplyScalar(k)); dash.position.y = 0.03; dash.rotation.y = spoke.rotation.y; scene.add(dash);
      }
      var stop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32), new THREE.MeshBasicMaterial({ color: AMBER }));
      stop.position.set(stand.x, 0.04, stand.z); scene.add(stop);

      var kiosk = new THREE.Group();
      var base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0x8d8576, roughness: 0.9 }));
      base.position.y = 0.55; base.castShadow = true; base.receiveShadow = true; kiosk.add(base);
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x2c3a35, metalness: 0.3, roughness: 0.6 }));
      post.position.set(0, 1.9, -0.2); post.castShadow = true; kiosk.add(post);
      var frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 0.18), new THREE.MeshStandardMaterial({ color: 0x1b2824, roughness: 0.5, metalness: 0.4 }));
      frame.position.set(0, 3.6, -0.1); frame.rotation.x = -0.12; frame.castShadow = true; kiosk.add(frame);
      var tex = canvasTex(512, 340, drawScreen(s, i));
      var screen = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.15), new THREE.MeshBasicMaterial({ map: tex }));
      screen.position.set(0, 3.6, 0); screen.rotation.x = -0.12; kiosk.add(screen);
      var edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 2.4, 0.18)), new THREE.LineBasicMaterial({ color: AMBER_DIM }));
      edges.position.copy(frame.position); edges.rotation.copy(frame.rotation); kiosk.add(edges);
      var glow = new THREE.PointLight(AMBER, 0, 7); glow.position.set(0, 3.2, 1.6); kiosk.add(glow);
      kiosk.position.copy(pos);
      kiosk.lookAt(pos.x, 0, pos.z + 10);   // every screen faces the viewer
      scene.add(kiosk);
      nodes.push({ i: i, ang: ang, pos: pos, stand: stand, kiosk: kiosk, edges: edges, glow: glow, tex: tex });
    });

    // ---------- scenery: grass tufts, flowers, trees ----------
    function onPath(x, z) {
      var r = Math.sqrt(x * x + z * z);
      if (r < 3.4) return true;                                  // HQ plaza
      if (Math.abs(r - ringR) < 1.25) return true;               // ring road
      for (var q = 0; q < nodes.length; q++) {
        var n = nodes[q];
        if (Math.hypot(x - n.pos.x, z - n.pos.z) < 2.4) return true;      // sign
        var along = x * Math.cos(n.ang) + z * Math.sin(n.ang);
        var side = -x * Math.sin(n.ang) + z * Math.cos(n.ang);
        if (along > 0 && along < R && Math.abs(side) < 1.2) return true;  // spoke road
      }
      return false;
    }
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var tmp = new THREE.Object3D(), col = new THREE.Color();

    var TUFTS = 5200;
    var tuft = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.55, 3), new THREE.MeshStandardMaterial({ roughness: 1 }), TUFTS);
    var tuftCols = [0x3f7a2e, 0x4c8a36, 0x5a9a40, 0x67a648, 0x44742b];
    for (var t = 0, placed = 0; placed < TUFTS && t < TUFTS * 3; t++) {
      var a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 46, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (onPath(x, z)) continue;
      var hgt = 0.6 + rnd() * 0.9;
      tmp.position.set(x, 0.27 * hgt, z); tmp.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.3, (rnd() - 0.5) * 0.5); tmp.scale.set(1, hgt, 1);
      tmp.updateMatrix(); tuft.setMatrixAt(placed, tmp.matrix);
      tuft.setColorAt(placed, col.setHex(tuftCols[Math.floor(rnd() * tuftCols.length)])); placed++;
    }
    tuft.count = placed; scene.add(tuft);

    var FLOWERS = 420;
    var flower = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ roughness: 0.7 }), FLOWERS);
    var petal = [0xffffff, 0xf7d64a, 0xf29bb4, 0xc9a7f0, 0xff9f6b];
    for (var f = 0, fp = 0; fp < FLOWERS && f < FLOWERS * 4; f++) {
      var fa = rnd() * Math.PI * 2, fr = 4 + Math.sqrt(rnd()) * 36, fx = Math.cos(fa) * fr, fz = Math.sin(fa) * fr;
      if (onPath(fx, fz)) continue;
      tmp.position.set(fx, 0.2, fz); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(0.8 + rnd() * 0.6); tmp.updateMatrix();
      flower.setMatrixAt(fp, tmp.matrix); flower.setColorAt(fp, col.setHex(petal[Math.floor(rnd() * petal.length)])); fp++;
    }
    flower.count = fp; scene.add(flower);

    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5636, roughness: 0.9 });
    var leafMats = [0x2f6630, 0x3b7536, 0x4a843d, 0x285a32].map(function (c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }); });
    function tree(x, z, sz) {
      var tr = new THREE.Group();
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * sz, 0.24 * sz, 1.4 * sz, 6), trunkMat);
      trunk.position.y = 0.7 * sz; trunk.castShadow = true; tr.add(trunk);
      var lm = leafMats[Math.floor(rnd() * leafMats.length)];
      if (rnd() < 0.45) {   // pine
        for (var c = 0; c < 3; c++) {
          var cone = new THREE.Mesh(new THREE.ConeGeometry((1.3 - c * 0.3) * sz, 1.5 * sz, 7), lm);
          cone.position.y = (1.6 + c * 0.75) * sz; cone.castShadow = true; tr.add(cone);
        }
      } else {              // round leafy tree
        [[0, 2.1, 0, 1.15], [0.55, 1.75, 0.2, 0.8], [-0.5, 1.8, -0.25, 0.75]].forEach(function (b) {
          var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(b[3] * sz, 1), lm);
          blob.position.set(b[0] * sz, b[1] * sz, b[2] * sz); blob.castShadow = true; tr.add(blob);
        });
      }
      tr.position.set(x, 0, z); tr.rotation.y = rnd() * 6.3; scene.add(tr);
    }
    // a loose ring of trees between the signs, and a denser wood further out
    nodes.forEach(function (n, q) {
      var mid = n.ang + Math.PI / N;
      tree(Math.cos(mid) * (R + 3.5), Math.sin(mid) * (R + 3.5), 0.95 + rnd() * 0.3);
    });
    for (var w = 0; w < 70; w++) {
      var ta = rnd() * Math.PI * 2, trr = 23 + rnd() * 22;
      tree(Math.cos(ta) * trr, Math.sin(ta) * trr, 0.9 + rnd() * 0.7);
    }
    // a few round bushes by the paths
    var bushMat = new THREE.MeshStandardMaterial({ color: 0x3d7531, roughness: 0.9, flatShading: true });
    for (var bsh = 0, bp = 0; bp < 26 && bsh < 200; bsh++) {
      var ba = rnd() * Math.PI * 2, br = 5 + rnd() * 13, bx = Math.cos(ba) * br, bz = Math.sin(ba) * br;
      if (onPath(bx, bz) || onPath(bx + 0.8, bz) || onPath(bx - 0.8, bz) || onPath(bx, bz + 0.8) || onPath(bx, bz - 0.8)) continue;
      var bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + rnd() * 0.3, 1), bushMat);
      bush.position.set(bx, 0.35, bz); bush.scale.y = 0.75; bush.castShadow = true; scene.add(bush); bp++;
    }

    // ---------- the banker ----------
    function mat(c, r) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.7 : r }); }
    var SUIT = mat(0x1f3556, 0.6), SUIT_D = mat(0x172a46, 0.6), PANTS = mat(0x1d2738, 0.7), SKIN = mat(0xe7c29f, 0.8),
        HAIR = mat(0x20160f, 0.6), SHIRT = mat(0xf5f5f5, 0.6), TIE = mat(0xb3243a, 0.5), SHOE = mat(0x080808, 0.35), CASE = mat(0x5c3a1e, 0.55);
    function box(w, h, dd, m) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m); b.castShadow = true; return b; }

    var banker = new THREE.Group();
    var body = new THREE.Group(); banker.add(body);
    function leg(xx) {
      var hip = new THREE.Group(); hip.position.set(xx, 1.0, 0);
      var l = box(0.26, 0.95, 0.28, PANTS); l.position.y = -0.47; hip.add(l);
      var sh = box(0.3, 0.14, 0.44, SHOE); sh.position.set(0, -0.98, 0.08); hip.add(sh);
      body.add(hip); return hip;
    }
    var legL = leg(-0.17), legR = leg(0.17);
    var torso = box(0.78, 0.95, 0.44, SUIT); torso.position.y = 1.47; body.add(torso);
    var hem = box(0.8, 0.12, 0.46, SUIT_D); hem.position.y = 1.02; body.add(hem);
    var shirt = box(0.24, 0.42, 0.02, SHIRT); shirt.position.set(0, 1.72, 0.225); body.add(shirt);
    var tie = box(0.09, 0.42, 0.02, TIE); tie.position.set(0, 1.68, 0.238); body.add(tie);
    var knot = box(0.12, 0.08, 0.03, TIE); knot.position.set(0, 1.9, 0.236); body.add(knot);
    var pocket = box(0.13, 0.05, 0.02, SHIRT); pocket.position.set(0.24, 1.66, 0.226); body.add(pocket);
    var neck = box(0.2, 0.14, 0.2, SKIN); neck.position.y = 2.0; body.add(neck);
    var head = box(0.46, 0.5, 0.44, SKIN); head.position.y = 2.3; body.add(head);
    var hair = box(0.5, 0.16, 0.48, HAIR); hair.position.set(0, 2.58, -0.02); body.add(hair);
    var hairBack = box(0.5, 0.3, 0.12, HAIR); hairBack.position.set(0, 2.42, -0.2); body.add(hairBack);
    var eyeL = box(0.06, 0.06, 0.02, mat(0x141414)); eyeL.position.set(-0.11, 2.33, 0.225); body.add(eyeL);
    var eyeR = eyeL.clone(); eyeR.position.x = 0.11; body.add(eyeR);
    function arm(xx, withCase) {
      var sh = new THREE.Group(); sh.position.set(xx, 1.86, 0);
      var a = box(0.2, 0.82, 0.24, SUIT); a.position.y = -0.4; sh.add(a);
      var cuff = box(0.21, 0.06, 0.25, SHIRT); cuff.position.y = -0.82; sh.add(cuff);
      var hand = box(0.17, 0.17, 0.18, SKIN); hand.position.y = -0.92; sh.add(hand);
      if (withCase) {
        var bc = box(0.16, 0.42, 0.62, CASE); bc.position.set(0, -1.22, 0); sh.add(bc);
        var clasp = box(0.17, 0.05, 0.08, mat(0xd4a62a, 0.3)); clasp.position.set(0, -1.06, 0); sh.add(clasp);
      }
      body.add(sh); return sh;
    }
    var armL = arm(-0.5, false), armR = arm(0.5, true);
    var tagTex = canvasTex(256, 64, function (x, w, h) {
      x.fillStyle = "#8fd3ff"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#13201b"; x.font = "800 32px " + FONT; x.textAlign = "center";
      x.fillText((opts.name || "").toUpperCase(), w / 2, 43);
    });
    var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, depthTest: false }));
    tag.scale.set(1.6, 0.4, 1); tag.position.y = 3.15; banker.add(tag);
    // soft shadow disc under the banker (stays on the ground while jumping)
    var shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: 0x1f3317, transparent: true, opacity: 0.35 }));
    shadowDisc.rotation.x = -Math.PI / 2; shadowDisc.position.y = 0.035; scene.add(shadowDisc);
    banker.scale.setScalar(1.35);
    banker.position.set(0, 0, 1.2);
    scene.add(banker);

    // fonts may arrive after first draw: redraw text once they're ready
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      nodes.forEach(function (n) { redraw(n.tex); }); redraw(hqTex); redraw(tagTex);
    });

    S = {
      renderer: renderer, scene: scene, camera: camera, container: container, nodes: nodes, banker: banker,
      body: body, legL: legL, legR: legR, armL: armL, armR: armR, shadowDisc: shadowDisc,
      N: N, R: R, ringR: ringR, NEAR: NEAR, WALK: WALK, RUN: RUN, GRAVITY: GRAVITY, JUMP_V: JUMP_V,
      keys: {}, run: false, path: null, pathDone: null, target: null, arriveT: 0,
      vy: 0, jumping: false, heading: Math.PI, walkPhase: 0, active: null, paused: false, running: false,
      raf: null, clock: new THREE.Clock(), onActive: opts.onActive || function () {}, onOpen: opts.onOpen || function () {},
      visited: visited, drawScreen: drawScreen, redraw: redraw,
      camPos: new THREE.Vector3(0, 23, 25), camLook: new THREE.Vector3(0, 0.5, 2.7)
    };
    bindInput();
    resize();
    return true;
  }

  /* ---------- routes ---------- */
  function arc(fromI, toI) {
    var N = S.N, steps = toI - fromI;
    if (steps > N / 2) steps -= N;
    if (steps < -N / 2) steps += N;
    var a0 = S.nodes[fromI].ang, a1 = a0 + steps * (Math.PI * 2 / N), n = Math.abs(steps) * 10, pts = [];
    for (var k = 1; k <= n; k++) { var a = a0 + (a1 - a0) * k / n; pts.push(new THREE.Vector3(Math.cos(a) * S.ringR, 0, Math.sin(a) * S.ringR)); }
    return pts;
  }
  function nearestStop(within) {
    var best = null, bd = within;
    S.nodes.forEach(function (n) { var d = flatDist(S.banker.position, n.stand); if (d < bd) { bd = d; best = n.i; } });
    return best;
  }
  function flatDist(a, b) { var dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); }

  function cancel() {
    S.path = null; S.pathDone = null; S.arriveT = 0;
    if (S.target) { S.target = null; }
  }
  function travelTo(k, open) {
    if (!S || k < 0 || k >= S.N) return;
    cancel();
    var tgt = S.nodes[k].stand.clone();
    var from = nearestStop(1.6);
    if (from === k) S.path = [tgt];
    else if (from !== null && Math.min(Math.abs(k - from), S.N - Math.abs(k - from)) <= 2) S.path = arc(from, k);
    else if (flatDist(S.banker.position, tgt) < flatDist(S.banker.position, new THREE.Vector3()) * 0.9) S.path = [tgt];
    else S.path = [new THREE.Vector3(0, 0, 0), tgt];
    S.target = k;
    S.pathDone = open ? function () { S.onOpen(k); } : null;
  }
  function walkToPoint(p) {
    cancel();
    var lim = S.R + 6, d = Math.sqrt(p.x * p.x + p.z * p.z);
    if (d > lim) p.multiplyScalar(lim / d);
    S.path = [new THREE.Vector3(p.x, 0, p.z)];
  }
  function teleport(k) {
    if (!S) return;
    cancel();
    var st = S.nodes[k].stand;
    S.banker.position.set(st.x, 0, st.z);
    S.vy = 0; S.jumping = false;
    snapCamera();
  }
  function jump() {
    if (!S || S.paused || S.jumping) return;
    S.vy = S.JUMP_V; S.jumping = true;
  }

  /* ---------- input ---------- */
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
    S.renderer.domElement.addEventListener("click", function (e) {
      if (S.paused) return;
      var rect = S.renderer.domElement.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, S.camera);
      var hits = ray.intersectObjects(S.nodes.map(function (n) { return n.kiosk; }), true);
      if (hits.length) {
        var obj = hits[0].object, node = null;
        while (obj && !node) { node = S.nodes.filter(function (n) { return n.kiosk === obj; })[0] || null; obj = obj.parent; }
        if (node) {
          // near the sign: open right away · far: walk the route there, then open
          if (S.active === node.i) S.onOpen(node.i);
          else travelTo(node.i, true);
          return;
        }
      }
      var p = new THREE.Vector3();
      if (ray.ray.intersectPlane(plane, p)) walkToPoint(p);
    });
    S.renderer.domElement.addEventListener("mousemove", function (e) {
      if (S.paused) return;
      var rect = S.renderer.domElement.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, S.camera);
      var over = ray.intersectObjects(S.nodes.map(function (n) { return n.kiosk; }), true).length > 0;
      S.renderer.domElement.style.cursor = over ? "pointer" : "crosshair";
    });
  }

  /* ---------- loop ---------- */
  function snapCamera() {
    var b = S.banker.position;
    S.camPos.set(b.x * 0.35, 23, b.z * 0.35 + 25);
    S.camLook.set(b.x * 0.5, 0.5, b.z * 0.5 + 1.5);
  }

  function step() {
    var dt = Math.min(0.05, S.clock.getDelta()), moving = false;
    var b = S.banker.position;
    var speed = S.run ? S.RUN : S.WALK;
    var kx = (S.keys.r ? 1 : 0) - (S.keys.l ? 1 : 0), kz = (S.keys.d ? 1 : 0) - (S.keys.u ? 1 : 0);

    if (!S.paused && (kx || kz)) {
      if (S.path || S.arriveT) cancel();
      var l = Math.sqrt(kx * kx + kz * kz);
      b.x += kx / l * speed * dt; b.z += kz / l * speed * dt;
      S.heading = Math.atan2(kx, kz); moving = true;
    } else if (S.path && S.path.length) {
      var t = S.path[0], dx = t.x - b.x, dz = t.z - b.z, d = Math.sqrt(dx * dx + dz * dz), stp = (S.run ? S.RUN : S.WALK * 1.1) * dt;
      S.heading = Math.atan2(dx, dz);
      if (d <= stp) {
        b.x = t.x; b.z = t.z; S.path.shift();
        if (!S.path.length) {
          S.path = null; S.target = null;
          if (S.pathDone) { S.arriveT = 0.36; if (!S.jumping) { S.vy = 5.5; S.jumping = true; } }
        }
      } else { b.x += dx / d * stp; b.z += dz / d * stp; }
      moving = true;
    }
    if (S.arriveT > 0) {
      S.arriveT -= dt;
      if (S.arriveT <= 0 && S.pathDone) { var done = S.pathDone; S.pathDone = null; S.arriveT = 0; done(); }
    }

    var lim = S.R + 6, dist = Math.sqrt(b.x * b.x + b.z * b.z);
    if (dist > lim) { b.x *= lim / dist; b.z *= lim / dist; }

    // jumping
    if (S.jumping) {
      S.vy -= S.GRAVITY * dt; b.y += S.vy * dt;
      if (b.y <= 0) { b.y = 0; S.vy = 0; S.jumping = false; }
    }
    S.shadowDisc.position.x = b.x; S.shadowDisc.position.z = b.z;
    var sScale = 1 - Math.min(0.6, b.y / 6); S.shadowDisc.scale.setScalar(sScale);
    S.shadowDisc.material.opacity = 0.35 * sScale;

    // turn
    var diff = S.heading - S.banker.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    S.banker.rotation.y += diff * Math.min(1, dt * 12);

    // limbs
    if (moving) S.walkPhase += dt * (S.run ? 14 : 9.5);
    var amp = S.run ? 0.95 : 0.6;
    var swing = moving ? Math.sin(S.walkPhase) * amp : 0;
    var legTargetL = swing, legTargetR = -swing, armTargetL = -swing * 0.75, armTargetR = swing * 0.45;
    if (S.jumping) { legTargetL = -0.55; legTargetR = 0.35; armTargetL = -2.4; armTargetR = -0.6; }
    S.legL.rotation.x += (legTargetL - S.legL.rotation.x) * 0.35;
    S.legR.rotation.x += (legTargetR - S.legR.rotation.x) * 0.35;
    S.armL.rotation.x += (armTargetL - S.armL.rotation.x) * 0.3;
    S.armR.rotation.x += (armTargetR - S.armR.rotation.x) * 0.3;
    S.body.position.y = (moving && !S.jumping) ? Math.abs(Math.sin(S.walkPhase)) * (S.run ? 0.14 : 0.08) : Math.sin(S.clock.elapsedTime * 2) * 0.01;
    S.body.rotation.x = S.run && moving && !S.jumping ? 0.12 : 0;

    // which sign is the banker near?
    var near = null, nd = S.NEAR;
    S.nodes.forEach(function (n) {
      var dd = Math.min(flatDist(b, n.pos), flatDist(b, n.stand) + 0.8);
      if (dd < nd) { nd = dd; near = n.i; }
    });
    S.nodes.forEach(function (n) {
      var on = n.i === near || n.i === S.target;
      n.edges.material.color.setHex(on ? AMBER : AMBER_DIM);
      n.glow.intensity += ((n.i === near ? 1.6 : 0) - n.glow.intensity) * 0.15;
    });
    if (near !== S.active) { S.active = near; S.onActive(near); }

    // camera
    var goal = new THREE.Vector3(b.x * 0.35, 23, b.z * 0.35 + 25);
    S.camPos.lerp(goal, 1 - Math.pow(0.02, dt));
    S.camLook.lerp(new THREE.Vector3(b.x * 0.5, 0.5, b.z * 0.5 + 1.5), 1 - Math.pow(0.02, dt));
    S.camera.position.copy(S.camPos); S.camera.lookAt(S.camLook);

    S.renderer.render(S.scene, S.camera);
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
    // keep the whole ring in view on narrow / portrait screens
    S.camera.fov = w / h < 1 ? 62 : 45;
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
    cancel: cancel,
    jump: jump,
    activeIndex: function () { return S ? S.active : null; },
    setPaused: function (p) { if (S) { S.paused = !!p; if (p) S.keys = {}; } },
    setKey: function (dir, on) { if (S) S.keys[{ up: "u", down: "d", left: "l", right: "r" }[dir]] = !!on; },
    // the visited object is shared with script.js, so a redraw picks up changes
    refreshScreens: function () { if (S) S.nodes.forEach(function (n) { S.redraw(n.tex); }); }
  };
})();
