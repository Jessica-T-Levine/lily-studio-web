/*
  Lily Studio · Halloween Costumes in 3D (for the Lily's Playhouse world) · version 2 (v1 plus Hop Hop's friends, one by one) · Hop Hop the firefly APPROVED by Jessica, Oct 25, 2026
  ---------------------------------------------------------------------------------------------------------------
  Hop Hop the firefly, made for the 3D Hop Hop in lily-creatures-v5.js (LilyCreatures.frog). Same look as the
  approved 2D firefly (lily-halloween-costumes-v1.js): thin antennae with glowing tips, sheer sparkly wings
  (two on each side, on his back), and his own chest circle glows.

  The 3D frog library is never edited. The costume is drawn AROUND him with the same camera the frog uses,
  so it turns, tips and hops with him:

    const C3 = LilyHalloweenCostumes3D;
    C3.firefly(ctx, x, y, s, yaw, pitch, pose, anim, "back");    // wings and antennae that are behind him
    LilyCreatures.frog.draw(ctx, x, y, s, yaw, pitch, pose);       // Hop Hop himself (same numbers)
    C3.firefly(ctx, x, y, s, yaw, pitch, pose, anim, "front");   // wings and antennae in front of him
    // ...the world's night tint...
    C3.firefly(ctx, x, y, s, yaw, pitch, pose, anim, "lights");  // his glowing chest and antenna tips (stay bright)

  If you keep a saved picture of him (like the Playhouse does), draw the glowing chest from that picture instead:
  draw him once more with pal: LilyHalloweenCostumes3D.glowPal("ours") on black, take the "difference" with your saved
  picture on black, and add that with "lighter"; then call firefly(..., "tips") for his antenna tips and the soft halo.

  x, y, s, yaw, pitch, pose = exactly what you pass to LilyCreatures.frog.draw (pose.jump, pose.squash, pose.roll, pose.pal).
  anim = { t: seconds, air: true while hopping, sec: -1..1, wob: -1..1, glow: 0 by day .. 1 at night }
         (sec and wob: use LilyHalloweenCostumes.hopMotion from the 2D library, or leave them 0).
  Frog units: x forward, y to his left/right, z up; the origin is the middle of his feet.
*/
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // rotate v around the unit axis k by angle a (Rodrigues)
  const rot = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), d = dot(k, v) * (1 - c); return [v[0] * c + kv[0] * s + k[0] * d, v[1] * c + kv[1] * s + k[1] * d, v[2] * c + kv[2] * s + k[2] * d]; };
  const PAL = n => { const L = root.LilyCreatures && root.LilyCreatures.frog && root.LilyCreatures.frog.colors; const p = L && L[n || "ours"]; return p || { size: 1, wide: 1, tall: 1, gap: 1, drop: 0, bump: 1 }; };

  // his shape, the same numbers as lily-creatures-v5.js (body, eye bumps, chest)
  const BODY_C = [2, 0, 19], BODY_R = [20, 21, 18.5], BUMP_C = [9, 9, 37.2], BUMP_R = 8.6, TILT = -0.15;

  function camera(x, y, s, yaw, pitch, pose) {
    const P = PAL(pose.pal), sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const st = pose.jump || 0, sq = pose.squash || 0, roll = pose.roll || 0;
    const sx = 1 + 0.12 * sq, sz = (1 - 0.2 * sq) * (1 + 0.08 * st), cr = Math.cos(roll), sr = Math.sin(roll);
    const S = s * (P.size || 1);
    // the frog's own squash/stretch and roll, so the costume moves with him
    const body = v => { const a = [v[0], v[1] * cr - v[2] * sr, v[1] * sr + v[2] * cr]; return [a[0] * sx, a[1] * sx, a[2] * sz]; };
    const scr = v => { const w = body(v); return { x: x + (w[0] * sy + w[1] * cy) * S, y: y + (-(w[2] * cp) - (w[0] * cy - w[1] * sy) * sp) * S }; };
    const depth = v => { const w = body(v); return (w[0] * cy - w[1] * sy) * cp - w[2] * sp; };   // bigger = farther from you
    const ndepth = n => (n[0] * cy - n[1] * sy) * cp - n[2] * sp;
    const tallUp = BODY_R[2] * ((P.tall || 1) - 1);
    return { P, S, scr, depth, ndepth, tallUp, st };
  }

  // a point on his round body in direction d (and the way the surface faces there), tilted like the 3D frog
  function onBody(K, d) {
    const P = K.P, d0 = norm(d), R = [BODY_R[0] * (1 + 0.1 * K.st), BODY_R[1] * (P.wide || 1), BODY_R[2] * (1 - 0.05 * K.st) * (P.tall || 1)];
    let q = [R[0] * d0[0], R[1] * d0[1], R[2] * d0[2]], n = norm([d0[0] / R[0], d0[1] / R[1], d0[2] / R[2]]);
    const c = Math.cos(TILT), s = Math.sin(TILT), ry = v => [c * v[0] - s * v[2], v[1], s * v[0] + c * v[2]];
    q = ry(q); n = ry(n);
    return { p: [BODY_C[0] + q[0], BODY_C[1] + q[1], BODY_C[2] + 1.6 + K.tallUp + q[2]], n };
  }

  // ---------- the wings: long, narrow, rainbow-tinted glass with little sparkles ----------
  function wingShape(base, D, Wd, L, w) {   // outline points in 3D: a long teardrop from base along D, w wide along Wd
    const pts = [];
    for (let i = 0; i <= 18; i++) { const u = i / 18, half = w * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.9); pts.push(add(add(base, D, L * u), Wd, half)); }
    for (let i = 18; i >= 0; i--) { const u = i / 18, half = w * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.9); pts.push(add(add(base, D, L * u), Wd, -half)); }
    return pts;
  }
  function wingsOf(K, A) {
    const out = [], flut = A.air ? Math.sin(A.t * 30) * 0.32 : Math.sin(A.t * 6) * 0.07 + (A.wob || 0) * 0.1;
    [-1, 1].forEach(side => {
      const at = onBody(K, [-0.62, side * 0.36, 0.7]).p;                 // on his upper back
      const back = [-1, 0, 0.12];
      [[1, 36, 7.6, [-0.32, side * 0.56, 0.76], 0], [0.85, 27, 6.2, [-0.58, side * 0.78, 0.18], 0.4]].forEach(([a, L, w, d, ph]) => {
        let D = norm(d);
        D = rot(D, norm(back), -side * (flut + ph * 0.0));                // flutter: around the line from front to back
        let Wd = norm(cross([1, 0, 0.15], D));                             // flat side faces front and back, like fairy wings
        if (Wd[2] < 0) Wd = [-Wd[0], -Wd[1], -Wd[2]];
        out.push({ side, a, L, w, base: at, D, Wd, pts: wingShape(at, D, Wd, L, w), mid: add(at, D, L * 0.5) });
      });
    });
    return out;
  }
  function drawWing(c, K, W, A) {
    const P = W.pts.map(K.scr), a = W.a;
    const b0 = K.scr(W.base), b1 = K.scr(add(W.base, W.D, W.L));
    c.save();
    c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath();
    const g = c.createLinearGradient(b0.x, b0.y, b1.x, b1.y);
    g.addColorStop(0, `rgba(200,235,255,${0.32 * a})`); g.addColorStop(0.5, `rgba(225,210,255,${0.28 * a})`); g.addColorStop(1, `rgba(210,255,235,${0.3 * a})`);
    c.fillStyle = g; c.fill();
    c.strokeStyle = `rgba(255,255,255,${0.85 * a})`; c.lineWidth = Math.max(0.6, 1.1 * K.S); c.lineJoin = "round"; c.stroke();
    // the vein down the middle
    const v0 = K.scr(add(W.base, W.D, 1)), vm = K.scr(add(add(W.base, W.D, W.L * 0.5), W.Wd, -W.w * 0.2)), v1 = K.scr(add(W.base, W.D, W.L * 0.92));
    c.strokeStyle = `rgba(190,200,240,${0.45 * a})`; c.lineWidth = Math.max(0.4, 0.7 * K.S);
    c.beginPath(); c.moveTo(v0.x, v0.y); c.quadraticCurveTo(vm.x, vm.y, v1.x, v1.y); c.stroke();
    // little twinkling sparkles (they fade when the wing is seen edge-on, so a side view stays clean)
    const faceOn = clamp(Math.abs(K.ndepth(norm(cross(W.D, W.Wd)))) * 2.5, 0, 1);
    if (faceOn > 0.02) [[-0.3, 0.35], [0.25, 0.55], [-0.15, 0.75], [0.3, 0.2], [0, 0.88]].forEach(([fx, fy], i) => {
      const tw = 0.5 + 0.5 * Math.sin(A.t * 4 + i * 1.9 + W.L), q = K.scr(add(add(W.base, W.D, W.L * fy), W.Wd, W.w * fx * 1.6)), r = (0.7 + tw * 0.7) * K.S;
      c.fillStyle = `rgba(255,255,255,${(0.35 + 0.65 * tw) * a * faceOn})`;
      c.beginPath(); c.moveTo(q.x, q.y - r * 1.8); c.lineTo(q.x + r * 0.4, q.y - r * 0.4); c.lineTo(q.x + r * 1.8, q.y); c.lineTo(q.x + r * 0.4, q.y + r * 0.4);
      c.lineTo(q.x, q.y + r * 1.8); c.lineTo(q.x - r * 0.4, q.y + r * 0.4); c.lineTo(q.x - r * 1.8, q.y); c.lineTo(q.x - r * 0.4, q.y - r * 0.4); c.closePath(); c.fill();
    });
    c.restore();
  }

  // ---------- the antennae: thin, springy, with a tiny glowing ball at each tip ----------
  function antennaeOf(K, A) {
    const P = K.P, out = [];
    [-1, 1].forEach((side, j) => {
      const bump = [BUMP_C[0], side * BUMP_C[1] * (P.gap || 1), BUMP_C[2] + K.tallUp - (P.drop || 0)], br = BUMP_R * (P.bump || 1);
      const base = add(bump, norm([-0.45, side * 0.25, 0.86]), br * 0.92);          // from the top of each eye bump, a little toward the back
      const sw = Math.sin(A.t * 2.6 + j * 2.2) * 1.2 + (A.wob || 0) * side * 1.6, up = 17 - (A.sec || 0) * 3.5;
      const tip = add(base, [2.5 + sw * 0.4, side * (9 + sw), up]);
      const c1 = add(base, [-1, side * 1.5, 8]), c2 = add(base, [1.5, side * (6 + sw * 0.5), up - 3]);
      const curl = add(tip, [1.2, side * 2.6, -2.2]);                                 // a little curl at the end, like the 2D design
      out.push({ side, base, c1, c2, tip, curl, mid: add(base, [0, side * 4, 9]), ph: j });
    });
    return out;
  }
  function drawAntenna(c, K, N) {
    const a = K.scr(N.base), b = K.scr(N.c1), d = K.scr(N.c2), t = K.scr(N.tip), q = K.scr(add(N.tip, [0.6, N.side * 2.2, 1.4])), e = K.scr(N.curl);
    c.save(); c.strokeStyle = "#3E3550"; c.lineWidth = Math.max(0.7, 1.5 * K.S); c.lineCap = "round";
    c.beginPath(); c.moveTo(a.x, a.y); c.bezierCurveTo(b.x, b.y, d.x, d.y, t.x, t.y); c.quadraticCurveTo(q.x, q.y, e.x, e.y); c.stroke();
    c.restore();
  }
  function drawTip(c, K, N, A) {
    const p = 0.7 + 0.3 * Math.sin(A.t * 1.6 + N.ph), e = K.scr(N.curl), R = (6 + 3 * A.glow) * K.S;
    const g = c.createRadialGradient(e.x, e.y, 0.5 * K.S, e.x, e.y, R); g.addColorStop(0, `rgba(255,250,200,${0.95 * p})`); g.addColorStop(1, "rgba(240,255,170,0)");
    c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#FFFBD6"; c.beginPath(); c.arc(e.x, e.y, 1.7 * K.S, 0, Math.PI * 2); c.fill();
  }

  // ---------- his glowing chest: HIS OWN tummy patch lights up (exact same place, size and shape) ----------
  // The 3D frog paints his pale tummy patch with the palette's three "belly" colors. We draw him a second time with
  // glowing colors in that patch (cream-white in the middle, soft yellow-green at the edge) and keep only what
  // changed, so the glow can only ever be exactly his tummy patch, from every angle and in every pose.
  // Each glow color is a little brighter than his own tummy color in every channel, so by day:
  // his normal picture + the change = exactly the glowing picture.
  const GLOW_BELLY = [[234, 246, 172], [252, 255, 206], [255, 255, 244]].map(a => a.map(v => v / 255));
  const glowPals = {};
  function glowPal(name) {
    const L = root.LilyCreatures && root.LilyCreatures.frog && root.LilyCreatures.frog.colors, base = L && L[name || "ours"];
    if (!base) return null;
    if (!glowPals[name]) glowPals[name] = Object.assign({}, base, { belly: GLOW_BELLY });
    return glowPals[name];
  }
  let cvA = null, cvB = null;
  function drawChest(c, K, A, x, y, s, yaw, pitch, pose) {
    const LC = root.LilyCreatures, gp = glowPal(pose.pal || "ours"); if (!LC || !LC.frog || !gp) return;
    let k = 1; try { const T = c.getTransform(); k = Math.hypot(T.a, T.b) || 1; } catch (_) {}
    const S = K.S, Lw = 44 * S, Top = 70 * S, Bot = 12 * S;           // a box around him, in screen units
    const w = Math.max(2, Math.ceil(2 * Lw * k)), h = Math.max(2, Math.ceil((Top + Bot) * k));
    if (w > 4096 || h > 4096) return;
    if (!cvA) { cvA = document.createElement("canvas"); cvB = document.createElement("canvas"); }
    [cvA, cvB].forEach(cv => { if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } });
    const a = cvA.getContext("2d"), b = cvB.getContext("2d");
    [a, b].forEach(g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.setTransform(k, 0, 0, k, 0, 0); });   // on black, so his soft outline cancels out exactly
    const P0 = Object.assign({}, pose, { shadow: false });
    LC.frog.draw(b, Lw, Top, s, yaw, pitch, P0);                               // him, as he is
    LC.frog.draw(a, Lw, Top, s, yaw, pitch, Object.assign({}, P0, { pal: gp }));   // him, tummy glowing
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = "difference"; a.drawImage(cvB, 0, 0);   // keep only the change: his tummy patch
    const pulse = 0.8 + 0.2 * Math.sin(A.t * 1.6);
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha *= Math.min(1, 0.9 + 0.1 * pulse + 0.35 * A.glow);
    c.drawImage(cvA, x - Lw, y - Top, w / k, h / k);
    c.restore();
    chestHalo(c, K, A);
  }
  // the small soft light around his chest (bigger and brighter at night)
  function chestHalo(c, K, A) {
    const S = K.S, pulse = 0.8 + 0.2 * Math.sin(A.t * 1.6);
    const T = onBody(K, [1, 0, -0.62]), face = -K.ndepth(T.n), vis = clamp((face - 0.1) / 0.5, 0, 1);
    if (vis <= 0.01) return;
    const o = K.scr(T.p), kk = 0.35 + 0.55 * A.glow, R = 30 * S;
    c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha *= vis;
    const g = c.createRadialGradient(o.x, o.y, 3 * S, o.x, o.y, R);
    g.addColorStop(0, `rgba(255,246,190,${0.5 * pulse * kk})`); g.addColorStop(0.5, `rgba(240,255,170,${0.18 * pulse * kk})`); g.addColorStop(1, "rgba(240,255,170,0)");
    c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, R, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function firefly(c, x, y, s, yaw, pitch, pose, anim, layer) {
    pose = pose || {};
    const A = Object.assign({ t: 0, air: false, sec: 0, wob: 0, glow: 0 }, anim || {});
    const K = camera(x, y, s, yaw, pitch, pose);
    if (layer === "tips") { chestHalo(c, K, A); antennaeOf(K, A).forEach(N => drawTip(c, K, N, A)); return; }   // when the chest glow comes from your own saved picture
    if (layer === "lights") { drawChest(c, K, A, x, y, s, yaw, pitch, pose); antennaeOf(K, A).forEach(N => drawTip(c, K, N, A)); return; }
    const front = layer === "front";
    // which parts are behind him: farther from you than the middle of his body (for the wings) or his head (antennae)
    const dBody = K.depth(onBody(K, [0, 0, 0.2]).p), dHead = K.depth([6, 0, 36 + K.tallUp]);
    const items = [];
    wingsOf(K, A).forEach(W => { const d = K.depth(W.mid); if ((d < dBody) === front) items.push({ d, draw: () => drawWing(c, K, W, A) }); });
    antennaeOf(K, A).forEach(N => { const d = K.depth(N.mid); if ((d < dHead) === front) items.push({ d, draw: () => drawAntenna(c, K, N) }); });
    items.sort((a, b) => b.d - a.d).forEach(it => it.draw());   // far to near
  }


  // =====================================================================================================================
  // v2: HOP HOP'S FRIENDS. Each friend's costume is drawn AROUND the 3D frog, like the firefly: a "back" layer before him,
  // a "front" layer after him, with the same camera. Solid parts (the pumpkin) are small meshes, drawn far to near.
  //   LilyHalloweenCostumes3D.dress(ctx, name, x, y, s, yaw, pitch, pose, anim, "back" | "front")
  // =====================================================================================================================
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = c => "rgb(" + c.map(v => Math.round(clamp(v, 0, 255))).join(",") + ")";
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  // body-space point of a friend's body at height z (centre, and the half-widths of the body there)
  function bodyAt(K, z) {
    const P = K.P, zc = 20.6 + K.tallUp, rz = BODY_R[2] * (P.tall || 1), q = clamp((z - zc) / rz, -1, 1), k = Math.sqrt(Math.max(0, 1 - q * q));
    return { rx: BODY_R[0] * k, ry: BODY_R[1] * (P.wide || 1) * k, zc };
  }
  // a shaded mesh: surf(u, v) -> point in frog space, u 0..1 (up) and v 0..1 (around). Drawn far to near, only the faces that face you.
  function drawMesh(c, K, surf, nu, nv, shade, pick, inner) {
    const grid = [];
    for (let i = 0; i <= nu; i++) { const row = []; for (let j = 0; j <= nv; j++) row.push(surf(i / nu, (j % nv) / nv)); grid.push(row); }
    const quads = [];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = grid[i][j], b = grid[i][j + 1], d = grid[i + 1][j], e = grid[i + 1][j + 1];
      const n = norm(cross(sub(b, a), sub(d, a))), mid = [(a[0] + b[0] + d[0] + e[0]) / 4, (a[1] + b[1] + d[1] + e[1]) / 4, (a[2] + b[2] + d[2] + e[2]) / 4];
      quads.push({ pts: [a, b, e, d], n, dep: K.depth(mid), u: (i + 0.5) / nu, v: (j + 0.5) / nv });
    }
    if (pick) { for (let i = quads.length - 1; i >= 0; i--) if (!pick(quads[i])) quads.splice(i, 1); }
    quads.sort((p, q) => q.dep - p.dep);
    const sy = Math.sin(K.yaw), cy = Math.cos(K.yaw), sp = Math.sin(K.pitch), cp = Math.cos(K.pitch);
    quads.forEach(q => {
      const face = -K.ndepth(q.n); if (face < -0.02 && !inner) return;
      const nx = q.n[0] * sy + q.n[1] * cy, ny = -(q.n[2] * cp) - (q.n[0] * cy - q.n[1] * sy) * sp;
      const lit = clamp(nx * -0.35 + ny * -0.6 + face * 0.72, 0, 1);
      const col = face < -0.02 ? inner : shade(lit, q, face); const P = q.pts.map(K.scr);
      c.fillStyle = col; c.strokeStyle = col; c.lineWidth = Math.max(0.5, 0.6 * K.S); c.lineJoin = "round";
      c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); c.stroke();
    });
  }
  const PUMPKIN_D = [217, 100, 30], PUMPKIN_M = [255, 150, 60], PUMPKIN_L = [255, 190, 98];
  const pumpkinShade = (lobes) => (lit, q, face) => {
    const groove = 0.5 + 0.5 * Math.cos(q.v * lobes * 2 * Math.PI);           // 1 on a lobe's crown, 0 in a groove
    const t = clamp(0.18 + 0.72 * lit + 0.12 * groove - 0.14 * (1 - groove) , 0, 1);
    const col = t < 0.55 ? mix(PUMPKIN_D, PUMPKIN_M, t / 0.55) : mix(PUMPKIN_M, PUMPKIN_L, (t - 0.55) / 0.45);
    return rgb(col);
  };

  // little pumpkin: the whole body is a pumpkin (the head and the feet stay out), with a leafy collar
  function pumpkinSuit(c, K, A, layer) {
    const P = K.P, zb = 3.4, zt = 28 + K.tallUp * 0.8, lobes = 8, lq = layer === "front";
    if (lq) {
      const surf = (u, v) => {
        const z = zb + (zt - zb) * u, b = bodyAt(K, z), th = v * 2 * Math.PI;
        const bulge = Math.pow(Math.sin(Math.PI * clamp(0.1 + 0.9 * u, 0, 1)), 0.5);          // round bottom, full middle
        const lobe = 1 + 0.1 * (1 - 0.85 * u * u * u) * Math.cos(th * lobes), fat = 1 + 0.15 * Math.pow(Math.sin(Math.PI * u), 1.3) * (1 - 0.35 * u);   // fullest low down, tucked in at the top
        const tuck = u * u, rx = Math.max(b.rx * (1.06 - 0.04 * tuck) + 1.6 - 0.9 * tuck, 8 + 12 * bulge) * lobe * fat, ry = Math.max(b.ry * (1.06 - 0.04 * tuck) + 1.6 - 0.9 * tuck, 8 + 12 * bulge) * lobe * fat;
        return [2 + Math.cos(th) * rx, Math.sin(th) * ry, z];
      };
      const hi = K.S > 2.2; drawMesh(c, K, surf, hi ? 22 : 10, hi ? 112 : 56, pumpkinShade(lobes));
    }
  }
  // little pumpkin cap, sitting on top of his head above the eyes, with a stem, a leaf and a curly vine
  function pumpkinCap(c, K, A, layer) {
    if (layer !== "front") return;
    const P = K.P, sec = A.sec || 0, eyeTop = BUMP_C[2] + K.tallUp - (P.drop || 0) + BUMP_R * (P.bump || 1);
    const cx = 5, cz = eyeTop - 2.2 - sec * 1.8, rx = 11.5, ry = 12.5 * Math.max(1, P.gap || 1), rz = 9, lobes = 6, tilt = -0.12 + sec * 0.08 + (A.wob || 0) * 0.04;
    const cs = Math.cos(tilt), sn = Math.sin(tilt);
    const T = (px, py, pz) => [cx + px, py * cs - pz * sn, cz + py * sn + pz * cs];      // tipped sideways a little
    drawMesh(c, K, (u, v) => {
      const ph = -0.45 + u * (Math.PI * 0.5 + 0.45), th = v * 2 * Math.PI, lobe = 1 + 0.09 * Math.cos(th * lobes), cph = Math.cos(ph) * lobe;
      return T(cph * Math.cos(th) * rx, cph * Math.sin(th) * ry, (ph < 0 ? Math.sin(ph) * 0.55 : Math.pow(Math.sin(ph), 0.9)) * rz);
    }, K.S > 2.2 ? 18 : 8, K.S > 2.2 ? 84 : 40, pumpkinShade(lobes));
    const top = T(0, 0, rz - 0.6);
    const stem = [add(top, [0, 0, -1.4]), add(top, [0.4, 0, 3.2]), add(top, [1.8, 0.4, 5.6])].map(K.scr);
    c.strokeStyle = "#6E9A4B"; c.lineWidth = Math.max(1, 3 * K.S); c.lineCap = "round"; c.beginPath(); c.moveTo(stem[0].x, stem[0].y); c.quadraticCurveTo(stem[1].x, stem[1].y, stem[2].x, stem[2].y); c.stroke();
    const sw = Math.sin(A.t * 3.1) * 0.1 + sec * 0.25, L0 = add(top, [0, 0.6, 1.2]);
    const a = K.scr(L0), b = K.scr(add(L0, [0.6, 3.5, 5 + sw * 4])), d = K.scr(add(L0, [0.8, 10 + sw * 3, 3.2 + sw * 4])), e = K.scr(add(L0, [0.6, 7, -0.6]));
    c.fillStyle = "#8CC56B"; c.strokeStyle = "rgba(70,120,50,0.5)"; c.lineWidth = Math.max(0.4, 0.5 * K.S);
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(b.x, b.y, d.x, d.y); c.quadraticCurveTo(e.x, e.y, a.x, a.y); c.closePath(); c.fill(); c.stroke();
    // the curly vine
    const v0 = add(top, [0.2, -0.6, 0.4]), q = [v0, add(v0, [-0.5, -5, 2.2]), add(v0, [-0.2, -8.6, -0.6]), add(v0, [0.4, -6.4, -3.2])].map(K.scr);
    c.strokeStyle = "#6E9A4B"; c.lineWidth = Math.max(0.7, 1.2 * K.S); c.beginPath(); c.moveTo(q[0].x, q[0].y); c.bezierCurveTo(q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y); c.stroke();
  }


  // starry hat for Blue: soft and too big (25%). It pulls down over the top of her head (slipping over one eye), then the
  // soft cone falls back over the back of her head and hangs, with the pompom at the end swinging.
  const HAT_L = [156, 143, 224], HAT_D = [92, 84, 168], CUFF_D = [78, 72, 154], CUFF_L = [124, 114, 204];
  function starHat(c, K, A, layer) {
    const isFront = layer === "front", pickQ = q => (q.dep > K.dBody) !== isFront;     // the parts hanging behind him are drawn before him
    const P = K.P, sec = A.sec || 0, wob = A.wob || 0, hi = K.S > 2.2, gap = P.gap || 1, big = 1.25;
    const eyeTop = BUMP_C[2] + K.tallUp - (P.drop || 0) + BUMP_R * (P.bump || 1), dz = eyeTop - 45.8;       // 0 for Hop Hop's own shape
    const sw = Math.sin(A.t * 2.4) * 2.2 + sec * 4 + wob * 2.5;                                               // the hanging end swings
    const roll = 0.3 + sec * 0.05 + wob * 0.05;                                                              // one side lower: over one eye
    const O = [-1.5, 0.6, 32.5 + dz];                                                                        // the middle of the cuff
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const T = p => [p[0], p[1], p[2] + (p[0] - O[0]) * (0.3 + sec * 0.03) - (p[1] - O[1]) * (0.26 + roll * 0.3 - 0.3)];   // tipped: the front rides up over her eyes, the back drops down her head, and the left side sits lower
    const B = [[-1.5, 0.6, 32.5 + dz], [-9, 1.5, 64 + dz], [-37 - sw * 0.8, 5 + sw, 62 + dz - sec * 2], [-29 - sw, 7 + sw * 1.2, 22 + dz - sec * 3]];   // soft cone path: up, over, and hanging down the back
    const bz = (u, k) => { const m = 1 - u, w = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u]; return [0, 1, 2].map(i => w[0] * B[0][i] + w[1] * B[1][i] + w[2] * B[2][i] + w[3] * B[3][i]); };
    const C = u => bz(u);
    const Cd = u => norm(sub(bz(Math.min(1, u + 0.01)), bz(Math.max(0, u - 0.01))));
    const rr = u => (20.5 * big * 0.8) * Math.pow(Math.max(0, 1 - u), 1.05) * Math.max(1, gap * 0.97) + 2.4;
    const frame = u => { const t = Cd(u); let e1 = cross(t, [0, 1, 0]); if (Math.hypot(e1[0], e1[1], e1[2]) < 0.05) e1 = cross(t, [1, 0, 0]); e1 = norm(e1); return [e1, norm(cross(t, e1))]; };
    const tube = (u0, u1, grow) => (u, v) => { const uu = u0 + (u1 - u0) * u, th = v * 2 * Math.PI, f = frame(uu), r = rr(uu) + grow, cc = C(uu);
      return T([cc[0] + r * (Math.cos(th) * f[0][0] + Math.sin(th) * f[1][0]), cc[1] + r * (Math.cos(th) * f[0][1] + Math.sin(th) * f[1][1]), cc[2] + r * (Math.cos(th) * f[0][2] + Math.sin(th) * f[1][2])]); };
    const hatShade = (lit) => rgb(mix(HAT_D, HAT_L, clamp(0.1 + lit * 0.95, 0, 1)));
    drawMesh(c, K, tube(0.04, 1, 0), hi ? 30 : 16, hi ? 64 : 36, hatShade, pickQ, rgb([58, 52, 122]));
    // the folded cuff that hugs her head
    drawMesh(c, K, tube(0, 0.085, 1.6), 3, hi ? 64 : 36, (lit) => rgb(mix(CUFF_D, CUFF_L, clamp(0.15 + lit, 0, 1))), pickQ, rgb([52, 46, 108]));
    // gold stars on the soft cone (only the ones that face you)
    [[0.2, 0.05, 2.9], [0.34, 0.32, 2.4], [0.52, 0.62, 1.9], [0.3, 0.8, 2.2], [0.64, 0.15, 1.6], [0.42, 0.96, 1.8], [0.16, 0.45, 2.1]].forEach(([u, v, r0]) => {
      const th = v * 2 * Math.PI, f = frame(u), cc = C(u), rad = rr(u), dir = [Math.cos(th) * f[0][0] + Math.sin(th) * f[1][0], Math.cos(th) * f[0][1] + Math.sin(th) * f[1][1], Math.cos(th) * f[0][2] + Math.sin(th) * f[1][2]];
      const pos = T(add(cc, dir, rad + 0.3)), face = -K.ndepth(dir);
      if (face < 0.05 || (K.depth(pos) > K.dBody) !== !isFront) return;
      const tw = 0.7 + 0.3 * Math.sin(A.t * 3 + u * 7 + v * 5), r = r0 * 1.5 * (0.9 + 0.1 * tw) * big * K.S, q0 = K.scr(pos), al = clamp(face * 2.2, 0, 1);
      c.save(); c.globalAlpha *= al; c.fillStyle = "#FFE27A"; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2 + 0.2, rr2 = i % 2 ? r * 0.45 : r; const X = q0.x + Math.cos(a) * rr2 * (0.55 + 0.45 * face), Y = q0.y + Math.sin(a) * rr2; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.closePath(); c.fill(); c.restore();
    });
    // the pompom at the end of the hanging tip
    const tp3 = T(add(C(1), [0, 0, -2.2]));
    if ((K.depth(tp3) > K.dBody) !== !isFront) return;
    const tq = K.scr(tp3), pr = 4.6 * big * K.S;
    const pg = c.createRadialGradient(tq.x - pr * 0.3, tq.y - pr * 0.3, pr * 0.1, tq.x, tq.y, pr);
    pg.addColorStop(0, "#FFFBE0"); pg.addColorStop(1, "#F2D98A");
    c.fillStyle = pg; c.beginPath(); c.arc(tq.x, tq.y, pr, 0, Math.PI * 2); c.fill();
  }


  // ---------- Golden's little bee: big pink heart wings + an antennae headband ----------
  function beeWings(c, K, A, layer) {
    const isFront = layer === "front", flut = A.air ? (0.5 - 0.5 * Math.cos(A.t * 34)) * 0.5 : 0.1 + 0.1 * Math.sin(A.t * 5) + (A.wob || 0) * 0.08;
    const at0 = onBody(K, [-0.7, 0, 0.55]).p;
    [[1, 46, 13, [-0.5, 0.84, 0.36], 1, 0], [0.8, 36, 10, [-0.62, 0.78, -0.04], 0.6, 0.4]].forEach(([a, L, w, d, big, ph]) => {
      [-1, 1].forEach(side => {
        const at = add(at0, [0, side * 5, 0]);
        let D = norm([d[0], side * d[1], d[2]]);
        D = rot(D, norm([-1, 0, 0.1]), -side * flut * 0.8);
        const Z = [0.35, 0, 1]; let Wd = norm(sub(Z, [D[0] * dot(D, Z), D[1] * dot(D, Z), D[2] * dot(D, Z)]));
        const mid = add(at, D, L * 0.55);
        if ((K.depth(mid) > K.dBody) === isFront) return;                    // behind him: drawn before him, in front: after
        const prof = u => w * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.7) * (1 - 0.16 * Math.exp(-Math.pow((u - 0.97) / 0.05, 2)));
        const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(add(add(at, D, L * u), Wd, prof(u))); }
        for (let i = 20; i >= 0; i--) { const u = i / 20; pts.push(add(add(at, D, L * u), Wd, -prof(u))); }
        const P2 = pts.map(K.scr), b0 = K.scr(at), b1 = K.scr(add(at, D, L)), al = a;
        c.save(); c.beginPath(); P2.forEach((q, i) => i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)); c.closePath();
        const g = c.createLinearGradient(b0.x, b0.y, b1.x, b1.y);
        g.addColorStop(0, `rgba(255,214,234,${0.9 * al})`); g.addColorStop(1, `rgba(255,232,244,${0.93 * al})`);
        c.fillStyle = g; c.fill(); c.strokeStyle = `rgba(255,255,255,${0.95 * al})`; c.lineWidth = Math.max(0.7, 1.4 * K.S); c.lineJoin = "round"; c.stroke();
        if (big === 1) {
          const v0 = K.scr(add(at, D, 3)), vm = K.scr(add(add(at, D, L * 0.5), Wd, -w * 0.25)), v1 = K.scr(add(at, D, L * 0.82));
          c.strokeStyle = `rgba(230,150,190,${0.5 * al})`; c.lineWidth = Math.max(0.5, 0.9 * K.S);
          c.beginPath(); c.moveTo(v0.x, v0.y); c.quadraticCurveTo(vm.x, vm.y, v1.x, v1.y); c.stroke();
          const sp = K.scr(add(add(at, D, L * 0.72), Wd, w * 0.35)), faceOn = clamp(Math.abs(K.ndepth(norm(cross(D, Wd)))) * 2.5, 0, 1);
          c.fillStyle = `rgba(255,255,255,${0.7 * faceOn})`; c.beginPath(); c.ellipse(sp.x, sp.y, 1.4 * K.S, 3 * K.S, -0.2, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      });
    });
  }
  function beeBand(c, K, A, layer) {
    const isFront = layer === "front";
    // is this spot really hidden behind her head, as seen from here? (a straight look from the camera to the spot, through her round body)
    const cy = Math.cos(K.yaw), sy = Math.sin(K.yaw), cp = Math.cos(K.pitch), sp = Math.sin(K.pitch), fv = [cy * cp, -sy * cp, -sp];
    const gapB = K.P.gap || 1, brB = BUMP_R * (K.P.bump || 1), bzB = BUMP_C[2] + K.tallUp - (K.P.drop || 0);
    const blob = (v, C, R, sh) => { const q = [0, 1, 2].map(i => (v[i] - C[i]) / R[i]), u = [0, 1, 2].map(i => -fv[i] / R[i]);
      const a = dot(u, u), b = dot(q, u), cc = dot(q, q) - sh; if (cc <= 0) return true; const disc = b * b - a * cc; return disc > 0 && b < 0; };
    const BODY_BLOB = [[BODY_C[0], 0, BODY_C[2]], [BODY_R[0], BODY_R[1] * ((K.P.wide) || 1), BODY_R[2] * ((K.P.tall) || 1)]];
    const hidden = v => blob(v, BODY_BLOB[0], BODY_BLOB[1], 0.94) || [-1, 1].some(sd => blob(v, [BUMP_C[0], sd * BUMP_C[1] * gapB, bzB], [brB, brB, brB], 0.9));   // her body and both eyes can hide it
    const mine = v => hidden(v) !== isFront;
    const P = K.P, sec = A.sec || 0, wob = A.wob || 0, gap = P.gap || 1, bx = 4.5;
    const Ry0 = BODY_R[1] * (P.wide || 1), Rz0 = BODY_R[2] * (P.tall || 1), ex = Math.pow((bx - BODY_C[0]) / BODY_R[0], 2);
    const bumpZ = BUMP_C[2] + K.tallUp - (P.drop || 0), br = BUMP_R * (P.bump || 1);
    const sm = (a, b) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + 12));                          // a soft "higher of the two"
    // the band lies ON the head: over the top of the body and arching over the tops of both eyes, down the sides
    const zAt = y => {
      const body = BODY_C[2] + Rz0 * Math.sqrt(Math.max(0, 1 - ex - Math.pow(y / Ry0, 2))) + 1.4;
      const zt = bumpZ + br + 8.5, zb = BODY_C[2] + 3 + K.tallUp * 0.4, arc = zb + (zt - zb) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y) / (Ry0 * 1.02), 3.4)), 0.5);                          // one smooth arch over the tops of both eyes
      return sm(arc, body);
    };
    const Yw = Ry0 * 0.86, N = 40, sc = v => K.scr(v);
    const sideY = z => Ry0 * Math.sqrt(Math.max(0.02, 1 - ex - Math.pow((z - BODY_C[2]) / Rz0, 2))) + 0.9;           // the surface of her head at height z
    const zEnd = BODY_C[2] + 17 + K.tallUp * 0.9;                                                                       // where the straight sides stop
    const arch = y => { const zt = bumpZ + br + 8.5, f = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y) / Yw, 3.2)), 0.5); return sm(zEnd + (zt - zEnd) * f, BODY_C[2] + Rz0 * Math.sqrt(Math.max(0, 1 - ex - Math.pow(y / Ry0, 2))) + 1.4); };
    const tipZ = zEnd - 5.5, tipY = sideY(tipZ), pts = [];
    const curl = k => { const t = k / 5, e = t * t * (3 - 2 * t); return [zEnd - 5.5 * t, Yw + (tipY - Yw) * e]; };          // a gentle curve inward so the tip touches her head
    for (let k = 5; k >= 1; k--) { const [z, y] = curl(k); pts.push([bx, -y, z]); }
    for (let i = 0; i <= N; i++) { const y = -Yw + 2 * Yw * i / N; pts.push([bx, y, arch(y)]); }
    for (let k = 1; k <= 5; k++) { const [z, y] = curl(k); pts.push([bx, y, z]); }
    const pt = s2 => { const y = Yw * s2; return [bx, y, arch(y)]; };
    c.save(); c.strokeStyle = "#5A4630"; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = Math.max(1, 2.6 * K.S);
    let open = false;
    for (let i = 0; i < pts.length; i++) {
      const v = pts[i], ok = mine(v), q = sc(v);
      if (ok) { if (!open) { c.beginPath(); c.moveTo(q.x, q.y); open = true; } else c.lineTo(q.x, q.y); }
      else if (open) { c.stroke(); open = false; }
    }
    if (open) c.stroke();
    [-1, 1].forEach((side, j) => {
      const base = pt(side * 0.55); if (!mine(base)) return;
      const sw = Math.sin(A.t * 5 + j * 2) * 1.2 + wob * side * 1.6, up = 21 - sec * 3;
      const tip = add(base, [1.5 + sw * 0.3, side * (6 + sw), up]), c1 = add(base, [0, side * 1.5, 9]), c2 = add(base, [1, side * 5, up - 5]);
      const a = sc(base), b = sc(c1), d = sc(c2), t = sc(tip);
      c.lineWidth = Math.max(0.9, 1.8 * K.S); c.beginPath(); c.moveTo(a.x, a.y); c.bezierCurveTo(b.x, b.y, d.x, d.y, t.x, t.y); c.stroke();
      c.fillStyle = "#5A4630"; c.beginPath(); c.arc(t.x, t.y, 3.4 * K.S, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#F6CD5A"; c.beginPath(); c.arc(t.x - 0.9 * K.S, t.y - 1 * K.S, 1.2 * K.S, 0, Math.PI * 2); c.fill();
    });
    c.restore();
  }

  function beeAll(c, K, A, layer) {                      // from behind the wings are nearer to you than the headband, so they go on top of it
    const bandD = K.depth([4.5, 0, 46 + K.tallUp]), wingD = K.depth(add(onBody(K, [-0.7, 0, 0.55]).p, [-12, 0, 16]));
    if (bandD > wingD) { beeBand(c, K, A, layer); beeWings(c, K, A, layer); } else { beeWings(c, K, A, layer); beeBand(c, K, A, layer); }
  }

  const WHO3 = { mint: [pumpkinSuit, pumpkinCap], blue: [starHat], golden: [beeAll] };
  function dress(c, name, x, y, s, yaw, pitch, pose, anim, layer) {
    const list = WHO3[name]; if (!list) return false;
    pose = Object.assign({}, pose || {}, { pal: pose && pose.pal || name });
    const A = Object.assign({ t: 0, air: false, sec: 0, wob: 0, glow: 0 }, anim || {});
    const K = camera(x, y, s, yaw, pitch, pose); K.yaw = yaw; K.pitch = pitch; K.dBody = K.depth(onBody(K, [0, 0, 0.2]).p);
    list.forEach(fn => fn(c, K, A, layer));
    return true;
  }

  root.LilyHalloweenCostumes3D = Object.freeze({ version: "2", firefly, glowPal, dress, WHO: Object.keys(WHO3) });
})(typeof window !== "undefined" ? window : globalThis);
