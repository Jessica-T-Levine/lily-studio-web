/*
  Lily Studio · Halloween Costumes in 3D (for the Lily's Playhouse world) · version 1 · Hop Hop the firefly APPROVED by Jessica, Oct 25, 2026
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

  root.LilyHalloweenCostumes3D = Object.freeze({ version: "1", firefly, glowPal });
})(typeof window !== "undefined" ? window : globalThis);
