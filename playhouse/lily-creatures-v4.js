/*
  Lily Studio Creature Library, version 4
  ----------------------------------------
  One master design for every Lily Studio creature. Every game, Watch page and video loads this
  one file, so all the creatures live in the same world and look the same everywhere.

  Creatures in v4:
    bee    Our bee in 3D (approved Sept 28, 2026, bee-3d-preview-v2), plus her six friend colors.
    bunny  Nee Nee the Bunny in 3D. NEW APPROVED MASTER DESIGN (Jessica, Sept 30, 2026), from bunny-3d-v10:
           one smooth solid body (like Hop Hop), soft cheek swells with a rosy glow, slim back thighs, a tiny
           button nose, long pink-lined ears, one round cotton-ball tail. Naps with her head on the ground;
           holds a carrot by its leafy end and eats the whole thing, greens too. Bunny friends: 9 colors and
           ear styles (up, bent, lop) with different ear lengths and widths.

    frog   Hop Hop the Frog in 3D. APPROVED MASTER DESIGN (Jessica, Sept 29, 2026), from hop-hop-3d-v19:
           one smooth solid body, round eye bumps on top with forward-looking eyes, rosy cheeks, a small
           smile, a soft light-green tummy, chubby back legs, a full low tummy, and a gentle butt from the back.

  What changed from v3: Nee Nee is rebuilt as one smooth solid body (bunny-3d-v10/v11), with friend colors
  (pose.pal) and ear styles (pose.ears). The bee and frog are exactly the same as v3.
  The old parts bunny stays inside as the fallback for devices without WebGL.
  Bunny friend colors: ours (Nee Nee, cream), caramel, gray, cocoa, spotted (cream with caramel ears
  and back legs), oreo (white with cocoa ears and back legs), pink, lavender, mint.
  LilyCreatures.bunny.colors lists them.

  How a game uses it:
    <script src="lily-creatures-v4.js"></script>
    LilyCreatures.bee.draw(ctx, x, y, s, yaw, pitch, pose);
    LilyCreatures.bunny.draw(ctx, x, y, s, yaw, pitch, pose);
    LilyCreatures.frog.draw(ctx, x, y, s, yaw, pitch, pose);

  Frog pose (all optional):
    t        the clock in seconds (blinking and the happy dance)
    jump     0..1 mid-hop stretch        squash  0..1 crouch or landing squish
    happy    >0 happy closed eyes and a bigger smile
    dance    true = his happy: a short wiggle (feet planted), then a tiny hop; loops every 2 s.
             LilyCreatures.frog.dance(t).lift tells a game how high he is (for his shadow).
    blink    true = eyes shut (leave out and he blinks on his own)
    lookX, lookY  -1..1 where his pupils look      lick  true = open mouth (snack)   oops  true = "oh!" mouth
    roll     a little side-to-side tip (radians)   shadow  true draws his shadow at (x, y)
    Frog size: about 44 units wide.

    x, y   the screen point on the ground (or perch) right under the creature
    s      screen pixels per creature unit (bee: her body is 36 units long; bunny: about 30)
    yaw    which way she faces compared to the camera: 0 = away from you, PI = toward you,
           PI/2 = toward the right side of the screen, -PI/2 = toward the left
    pitch  how much the camera looks down on her (0 = level, about 0.3 = a little above)
    pose   what she's doing (see each creature below). Anything left out uses a calm default.

  Rules:
    - Never edit a published version. Changes go into a new file (lily-creatures-v5.js), and each
      game switches to the new version on purpose, one at a time.
    - The library only draws. Each game keeps its own movement, sounds and world.
*/
// ===================== Hop Hop the Frog: APPROVED MASTER DESIGN (Sept 29, 2026, hop-hop-3d-v19) =====================
// One solid soft 3D body drawn with WebGL (falls back to a simpler drawing if a device has no WebGL).
(function (root) {
  "use strict";
  let ctx = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mqReduce = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } })();
  // follows LilyCreatures.settings.reduceMotion (so a game can switch it), else the device setting
  const motionOff = () => (root.LilyCreatures && root.LilyCreatures.settings ? !!root.LilyCreatures.settings.reduceMotion : mqReduce);

  // tiny 3D math (3x3 matrices stored row by row), the same helpers the creature library uses
  const M3 = {
    I: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(a, b) { const r = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; },
    app(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; },
    rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
    scale(x, y, z) { return [x, 0, 0, 0, y, 0, 0, 0, z]; },
    fromNormal(n) {
      let t1 = [-n[1], n[0], 0];
      const l1 = Math.hypot(t1[0], t1[1]) || 1; t1 = [t1[0] / l1, t1[1] / l1, 0];
      const t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
      return [n[0], t1[0], t2[0], n[1], t1[1], t2[1], n[2], t1[2], t2[2]];
    }
  };
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  // His colors, taken from the flat Hop Hop: green body lit from above, a pale green tummy,
  // darker green legs, rosy cheeks and big round eyes on two bumps.
  const LOOKS = {
    skin:  ["#9ADFA6", "#5DBA73", "#3E9658"],
    bump:  ["#A4E4AF", "#62BC76", "#419A5B"],
    belly: ["#F4FCF0", "#CDEFC6", "#A9DBA2"],
    leg:   ["#5EB072", "#3F9458", "#2C6E40"]
  };
  const INK = "#2E2440";
  const BUMP_C = [9, 9, 37.2], BUMP_R = [8.4, 8.8, 8.8];   // v19: round eye bumps sitting up on top of his head, like the 2D design   // v6: eye bumps closer together
  const BODY_C = [2, 0, 19], BODY_R = [20, 21, 18.5];   // v8: nice and round from the side

  function build(o) {
    const parts = [];
    const st = o.jump, sq = o.squash;
    let cur = { M: M3.mul(M3.scale(1 + 0.12 * sq, 1 + 0.12 * sq, (1 - 0.2 * sq) * (1 + 0.08 * st)), M3.rotX(o.roll || 0)), t: [0, 0, 0] };
    const W = p => { const q = M3.app(cur.M, p); return [q[0] + cur.t[0], q[1] + cur.t[1], q[2] + cur.t[2]]; };
    const Wn = n => norm3(M3.app(cur.M, n));
    const blob = (c, size, look, R, extra) => parts.push(Object.assign({ kind: "blob", c: W(c), A: M3.mul(M3.mul(cur.M, R || M3.I()), M3.scale(size[0], size[1], size[2])), look }, extra || {}));
    // a point on his round body in a direction from its middle, and the way the surface faces there
    const bodyR = [BODY_R[0] * (1 + 0.1 * st), BODY_R[1], BODY_R[2] * (1 - 0.05 * st)];
    const onBody = d => { d = norm3(d); return { p: [BODY_C[0] + bodyR[0] * d[0], BODY_C[1] + bodyR[1] * d[1], BODY_C[2] + bodyR[2] * d[2]], n: norm3([d[0] / bodyR[0], d[1] / bodyR[1], d[2] / bodyR[2]]) }; };
    const disc = (c, n, size) => { const nn = Wn(n), Q = M3.fromNormal(nn); return { c: W(c), n: nn, t1: [Q[1], Q[4], Q[7]], t2: [Q[2], Q[5], Q[8]], A: M3.mul(Q, M3.scale(size[0], size[1], size[2])) }; };

    [-1, 1].forEach(side => {
      // back feet: hidden when he sits (Jessica's note, v2); they only show, kicked out behind him, mid-hop
      const fc = lerp3([6, side * 19.5, 1.4], [-19, side * 11, 5], st);
      if (st > 0.05) blob(fc, [8.5 * st, 3 * st, 1.4 * st], "leg", M3.mul(M3.rotZ(side * lerp(0.35, 0, st)), M3.rotY(lerp(0, -0.45, st))));
      // back legs (the round haunches at his sides)
      blob(lerp3([-3, side * 17.5, 7.5], [-10, side * 13, 8.5], st), lerp3([11, 7, 8], [12, 5.5, 6.5], st), "leg", M3.rotY(lerp(0, -0.35, st)));
    });
    // his round body
    blob(BODY_C, bodyR, "skin", null, { id: "body" });
    // v4: his little round butt, low on his back between the back legs (Jessica's note)
    blob(lerp3([-10.5, 0, 8.5], [-12, 0, 10], st), [8.5, 12.5, 8], "skin", M3.rotY(lerp(0.15, -0.2, st)), { bias: 0.5 });
    // pale tummy low on his chest, below the smile and cheeks, kept inside his outline
    // v3: a soft, very light green glow (shaded like the cheeks, no hard edge), 25% smaller
    { const tp = onBody([1, 0, -0.47]); parts.push(Object.assign({ kind: "tummy", clip: "body", bias: 5 }, disc(add3(tp.p, tp.n, 0.2), tp.n, [0.2, 8.4, 6.2]))); }
    // front legs (no separate feet: the leg's own rounded end touches the ground)
    [-1, 1].forEach(side => {
      const sh = W([8.5, side * 11.5, 12.5]);
      const footL = lerp3([13.5, side * 12.5, 3.2], [9, side * 11, 7], st);
      const fW = W(footL);
      const d = [fW[0] - sh[0], fW[1] - sh[1], fW[2] - sh[2]], len = Math.hypot(d[0], d[1], d[2]) || 1;
      parts.push({ kind: "blob", c: [(sh[0] + fW[0]) / 2, (sh[1] + fW[1]) / 2, (sh[2] + fW[2]) / 2], A: M3.mul(M3.fromNormal([d[0] / len, d[1] / len, d[2] / len]), M3.scale(len / 2 + 1.2, 3.2, 3.0)), look: "leg", bias: 0.4 });
    });
    // cheeks: a soft rosy glow on each side of his face
    [-1, 1].forEach(side => {
      const sp = onBody([0.66, side * 0.62, 0.14]);   // v4: a little higher, on his face under each eye bump
      const dd = disc(add3(sp.p, sp.n, 0.2), sp.n, [0.2, 3.9, 2.8]);
      parts.push(Object.assign({ kind: "blush", clip: "body", bias: -1 }, dd));
    });
    // his smile, following the curve of his round front
    const mid = onBody([1, 0, o.happy > 0 ? -0.2 : -0.16]), L = onBody([0.9, -0.3, o.happy > 0 ? 0.02 : -0.03]), R = onBody([0.9, 0.3, o.happy > 0 ? 0.02 : -0.03]);
    // v3: the smile is traced along his round surface point by point, so it stays centered on his face from every side
    const dm = [1, 0, o.happy > 0 ? -0.2 : -0.16], dl = [0.9, -0.3, o.happy > 0 ? 0.02 : -0.03], dr = [0.9, 0.3, o.happy > 0 ? 0.02 : -0.03];
    const ctrl = [2 * dm[0] - (dl[0] + dr[0]) / 2, 2 * dm[1] - (dl[1] + dr[1]) / 2, 2 * dm[2] - (dl[2] + dr[2]) / 2];
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c2 = u * u;
      const q = onBody([a * dl[0] + b * ctrl[0] + c2 * dr[0], a * dl[1] + b * ctrl[1] + c2 * dr[1], a * dl[2] + b * ctrl[2] + c2 * dr[2]]);
      pts.push({ p: W(q.p), n: Wn(q.n) });
    }
    parts.push({ kind: "mouth", c: W(mid.p), pts, n: Wn(mid.n), clip: "body", bias: -1.2 });
    // eye bumps on top, each with a big round eye
    [-1, 1].forEach(side => {
      const bc = [7, side * 10.5, 33.5], br = [8.5, 9, 9];
      blob(bc, br, "bump", null, { id: "bump" + side });
      const en = norm3([0.68, side * 0.54, 0.3]);   // v3: facing a little outward, like a real frog
      const ec = [bc[0] + en[0] * br[0] * 0.97, bc[1] + en[1] * br[1] * 0.97, bc[2] + en[2] * br[2] * 0.97];
      const e = disc(ec, en, [0.08, 5.9, 6.2]);
      parts.push(Object.assign({ kind: "eye", clip: "bump" + side, bias: -0.6 }, e));
    });
    return parts;
  }

  // the simple drawing (separate shaded parts), used only if a device has no WebGL
  function draw2D(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    ctx = c;
    const t = pose.t || 0;
    const o = {
      jump: pose.jump || 0, squash: pose.squash || 0, happy: pose.happy || 0, roll: pose.roll || 0,
      blink: pose.blink != null ? !!pose.blink : ((t % 3.4) + 3.4) % 3.4 < 0.12,
      lookX: clamp(pose.lookX || 0, -1, 1), lookY: clamp(pose.lookY || 0, -1, 1), lick: !!pose.lick, oops: !!pose.oops
    };
    if (pose.shadow) {
      ctx.fillStyle = "rgba(40, 70, 60, 0.24)";
      ctx.beginPath(); ctx.ellipse(x, y, 25 * s, 25 * s * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); ctx.fill();
    }
    const parts = build(o);
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const P = [sy, cy, 0, -cy * sp, sy * sp, -cp];
    const scr = v => ({ x: x + (v[0] * sy + v[1] * cy) * s, y: y + (-(v[2] * cp) - (v[0] * cy - v[1] * sy) * sp) * s });
    const depth = v => (v[0] * cy - v[1] * sy) * cp - v[2] * sp;
    const facing = n => depth(n) < -0.05;
    const edgeFade = n => clamp((-depth(n) - 0.05) / 0.35, 0, 1);
    const ellipseOf = (cc, A) => {
      const a = new Array(6);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) a[r * 3 + k] = P[r * 3] * A[k] + P[r * 3 + 1] * A[3 + k] + P[r * 3 + 2] * A[6 + k];
      const s11 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2], s22 = a[3] * a[3] + a[4] * a[4] + a[5] * a[5], s12 = a[0] * a[3] + a[1] * a[4] + a[2] * a[5];
      const m = (s11 + s22) / 2, dd = Math.sqrt(Math.max(0, ((s11 - s22) / 2) ** 2 + s12 * s12));
      const q = scr(cc);
      return { x: q.x, y: q.y, rx: Math.sqrt(m + dd) * s, ry: Math.max(0.3, Math.sqrt(Math.max(0, m - dd)) * s), ang: 0.5 * Math.atan2(2 * s12, s11 - s22) };
    };
    parts.forEach(p => { p.d = depth(p.c) + (p.bias || 0); });
    parts.sort((a, b) => b.d - a.d);
    const named = {};
    parts.forEach(p => { if (p.id) named[p.id] = ellipseOf(p.c, p.A); });
    const clipTo = id => { const e = named[id]; if (!e) return; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, e.ry, e.ang, 0, Math.PI * 2); ctx.clip(); };
    const onDisc = (p, u, v) => scr(add3(add3(p.c, p.t1, u), p.t2, v));
    const A0 = ctx.globalAlpha;

    parts.forEach(p => {
      if (p.kind === "blob") {
        const e = ellipseOf(p.c, p.A);
        if (e.rx < 0.05) return;
        ctx.save(); if (p.clip) clipTo(p.clip);
        const Lk = LOOKS[p.look] || LOOKS.skin, R = Math.max(e.rx, e.ry);
        const g = ctx.createRadialGradient(e.x - R * 0.3, e.y - R * 0.38, R * 0.05, e.x, e.y, R * 1.15);
        g.addColorStop(0, Lk[0]); g.addColorStop(0.5, Lk[1]); g.addColorStop(1, Lk[2]);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, e.ry, e.ang, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.kind === "tummy") {
        if (!facing(p.n)) return;
        const e = ellipseOf(p.c, p.A);
        ctx.save(); clipTo(p.clip);
        ctx.globalAlpha = A0 * clamp((-depth(p.n) - 0.3) / 0.4, 0, 1);   // v4: fades well before his edge
        ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.scale(1, e.ry / e.rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, e.rx);
        g.addColorStop(0, "rgba(222, 247, 210, 0.8)"); g.addColorStop(0.5, "rgba(206, 241, 194, 0.58)"); g.addColorStop(1, "rgba(190, 234, 178, 0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, e.rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.kind === "blush") {
        if (!facing(p.n)) return;
        const e = ellipseOf(p.c, p.A);
        ctx.save(); clipTo(p.clip);
        ctx.globalAlpha = A0 * edgeFade(p.n);
        ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.scale(1, e.ry / e.rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, e.rx);
        g.addColorStop(0, "rgba(255, 128, 172, 0.82)"); g.addColorStop(0.6, "rgba(255, 136, 178, 0.52)"); g.addColorStop(1, "rgba(255, 150, 185, 0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, e.rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (p.kind === "mouth") {
        const c0 = scr(p.c);
        ctx.save(); clipTo(p.clip);
        ctx.strokeStyle = INK; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(0.8, 1.7 * s);
        if (o.lick || o.oops) {
          if (depth(p.n) > -0.25) { ctx.restore(); return; }
          ctx.globalAlpha = A0 * Math.min(1, edgeFade(p.n) * 1.5);
          ctx.beginPath(); ctx.ellipse(c0.x, c0.y, (o.lick ? 3.4 : 2.6) * s, (o.lick ? 2.6 : 2.6) * s, 0, 0, Math.PI * 2);
          if (o.lick) { ctx.fillStyle = "#6B2E4A"; ctx.fill(); } else ctx.stroke();
        } else {
          // draw only the part of the smile that faces you, fading gently near his edge
          for (let i = 0; i < p.pts.length - 1; i++) {
            const A1 = p.pts[i], B1 = p.pts[i + 1];
            const f = clamp((Math.min(-depth(A1.n), -depth(B1.n)) - 0.3) / 0.25, 0, 1);   // v4: no stray dot at his edge
            if (f <= 0.01) continue;
            ctx.globalAlpha = A0 * f;
            const a1 = scr(A1.p), b1 = scr(B1.p);
            ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.stroke();
          }
        }
        ctx.restore();
      } else if (p.kind === "eye") {
        if (!facing(p.n)) return;
        // v3: eyes only show when they face you well, and fade out smoothly well before the edge (no thin slivers)
        const fade = clamp((-depth(p.n) - 0.38) / 0.18, 0, 1);
        if (fade <= 0.01) return;
        const e = ellipseOf(p.c, p.A);
        ctx.save(); clipTo(p.clip);
        ctx.globalAlpha = A0 * fade;   // eyes fade away smoothly as they turn out of view
        ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = "round"; ctx.lineWidth = Math.max(0.9, 2.2 * s);
        if (o.happy > 0) {
          const a = onDisc(p, -4.4, -1.2), b = onDisc(p, 0, 4.2), c2 = onDisc(p, 4.4, -1.2);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c2.x, c2.y); ctx.stroke();
        } else if (o.blink) {
          const a = onDisc(p, -4.4, 0), b = onDisc(p, 0, -3), c2 = onDisc(p, 4.4, 0);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c2.x, c2.y); ctx.stroke();
        } else {
          // white of the eye, a big dark pupil that looks around, and a sparkle
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, e.ry, e.ang, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(46, 36, 64, 0.14)"; ctx.lineWidth = Math.max(0.5, 0.5 * s); ctx.stroke();
          ctx.clip();   // keep the pupil inside the white
          const pc = add3(add3(p.c, p.t1, o.lookX * 2.3), p.t2, o.lookY * 2.3);
          const pe = ellipseOf(add3(pc, p.n, 0.05), M3.mul(M3.fromNormal(p.n), M3.scale(0.05, 3.3, 3.4)));
          ctx.fillStyle = INK;
          ctx.beginPath(); ctx.ellipse(pe.x, pe.y, pe.rx, pe.ry, pe.ang, 0, Math.PI * 2); ctx.fill();
          if (fade > 0.3) {
            const hl = scr(add3(add3(pc, p.t1, 1.2), p.t2, 1.3));
            ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(hl.x, hl.y, Math.max(0.5, 1.1 * s * fade), 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
      }
    });
  }


  // ---------------------------------------------------------------------------------------------
  // v5: ONE SOLID BODY. Hop Hop is now drawn as a single smooth 3D shape (all his parts melt into
  // each other like soft clay), with his face, cheeks and tummy painted right onto that surface.
  // This uses the graphics card (WebGL). If a device can't do that, the older drawing above is used.
  // ---------------------------------------------------------------------------------------------
  const VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform vec2 uAnchor; uniform float uS;
uniform vec3 uR, uU, uF, uL;
uniform mat3 uInvM; uniform float uMinScale;
uniform float uSway, uTwist, uBob;
uniform vec3 uLowC, uLowR;   // v17: fuller low tummy so his belly nearly touches the ground when he sits   // v15: happy wiggle (his body bends; his feet stay planted)
// v15: bend him like soft jelly. Nothing moves at the ground; the higher up, the more he sways and twists.
vec3 wiggle(vec3 p){
  float h = clamp(p.z / 38.0, 0.0, 1.0); float k = h * h * (3.0 - 2.0 * h);
  p.y -= uSway * k;
  float a = -uTwist * k, ca = cos(a), sa = sin(a);
  p.xy = mat2(ca, sa, -sa, ca) * p.xy;
  p.z /= (1.0 - uBob); p.xy /= (1.0 + 0.5 * uBob * k);
  return p;
}
uniform mat3 uBodyRot;
uniform vec3 uBodyC, uBodyR, uButtC, uButtR; uniform mat3 uButtRot; uniform float uButtSep;
uniform vec3 uBumpC, uBumpR;
uniform vec3 uHaunchC, uHaunchR; uniform mat3 uHaunchRot;
uniform vec3 uLegA, uLegB, uPawC, uPawR; uniform float uLegR, uLegR2;
uniform vec3 uLegBUp, uPawCUp, uPawRUp; uniform vec2 uArmUp;   // v13: arms can lift (x = his left, y = his right)
uniform vec3 uHipA, uHipB, uHPawC, uHPawR; uniform float uHipR, uHipR2;
uniform vec3 uFootA, uFootB; uniform float uFootR;
uniform vec3 uEyeC, uEyeN; uniform float uEyeR; uniform vec2 uLook; uniform float uEyeMode;
uniform float uMouthMode, uMouthZ, uMouthR, uMouthA, uMouthS;
uniform vec3 uCheekC, uTummyC;

float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-4); }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2; vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv);
  float y2 = y * y * l2; float z2 = z * z * l2; float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1; }
// distance to part of a circle (for closed eyes and the smile), with round ends
float arcD(vec2 p, vec2 c, float r, float a0, float a1){
  vec2 d = p - c; float a = atan(d.y, d.x);
  if (a >= a0 && a <= a1) return abs(length(d) - r);
  return min(length(p - (c + r * vec2(cos(a0), sin(a0)))), length(p - (c + r * vec2(cos(a1), sin(a1))))); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// returns (distance, how much of the dark "leg" green to use)
vec2 model(vec3 w){
  vec3 p = wiggle(uInvM * w);
  vec3 q = vec3(p.x, abs(p.y), p.z);            // he is the same on both sides
  float skin = sdEll(uBodyRot * (p - uBodyC), uBodyR);   // v9: body tipped a little so his bottom lifts at the back
  // v6: a smaller, gentle two-part butt (a soft little dip between the two sides)
  vec3 bp = uButtRot * (p - uButtC);
  float butt = smin(sdEll(bp - vec3(0.0, uButtSep, 0.0), uButtR), sdEll(bp + vec3(0.0, uButtSep, 0.0), uButtR), 3.6);   // v9: softer dip
  skin = smin(skin, butt, 4.5);
  skin = smin(skin, sdEll(p - uLowC, uLowR), 5.0);
  // v6: eye bumps closer together, blended softly into each other and his head (no hard fold)
  float bumps = smin(sdEll(p - uBumpC, uBumpR), sdEll(p - vec3(uBumpC.x, -uBumpC.y, uBumpC.z), uBumpR), 2.6);
  skin = smin(skin, bumps, 4.0);
  // v10: back legs shaped like the front legs (soft rounded leg + paw), a little smaller than before
  float leg = smin(sdRoundCone(q, uHipA, uHipB, uHipR, uHipR2), sdEll(q - uHPawC, uHPawR), 1.6);
  float up = p.y >= 0.0 ? uArmUp.y : uArmUp.x;
  vec3 lb = mix(uLegB, uLegBUp, up), pcw = mix(uPawC, uPawCUp, up), prr = mix(uPawR, uPawRUp, up);
  leg = min(leg, smin(sdRoundCone(q, uLegA, lb, uLegR, mix(uLegR2, 3.3, up)), sdEll(q - pcw, prr), 1.6));   // v6: chubby arm, thicker at the top, with a soft paw
  if (uFootR > 0.05) leg = min(leg, sdCap(q, uFootA, uFootB, uFootR));
  float d = smin(skin, leg, 3.2);
  float lw = clamp(0.5 + 0.5 * (skin - leg) / 2.2, 0.0, 1.0);
  return vec2(d * uMinScale, lw);
}
vec3 nrm(vec3 p){ const vec2 e = vec2(0.02, 0.0);
  return normalize(vec3(model(p + e.xyy).x - model(p - e.xyy).x, model(p + e.yxy).x - model(p - e.yxy).x, model(p + e.yyx).x - model(p - e.yyx).x)); }
float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i = 1; i <= 5; i++){ float h = 0.9 * float(i); o += (h - model(p + n * h).x) * s; s *= 0.6; } return clamp(1.0 - 0.09 * o, 0.0, 1.0); }
vec3 ramp(vec3 dk, vec3 md, vec3 lt, float t){ return t < 0.55 ? mix(dk, md, t / 0.55) : mix(md, lt, (t - 0.55) / 0.45); }
vec3 hex(float r, float g, float b){ return vec3(r, g, b) / 255.0; }

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float X = (px.x - uAnchor.x) / uS, Y = (uAnchor.y - px.y) / uS;
  vec3 ro = X * uR + Y * uU - uF * 90.0;
  float t = 0.0, dmin = 1e9, hit = 0.0;
  for (int i = 0; i < 90; i++){
    float d = model(ro + uF * t).x;
    dmin = min(dmin, d);
    if (d < 0.004) { hit = 1.0; break; }
    t += d; if (t > 180.0) break;
  }
  float px1 = 1.0 / uS;                          // one screen pixel in frog units
  float alpha = hit > 0.5 ? 1.0 : 1.0 - smoothstep(0.0, px1 * 1.2, dmin);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  if (hit < 0.5) {                               // soft edge: step to the closest point for its color
    t = 0.0; for (int i = 0; i < 90; i++){ float d = model(ro + uF * t).x; if (d <= dmin + 1e-3) break; t += d; if (t > 180.0) break; }
  }
  vec3 w = ro + uF * t;
  vec2 m = model(w);
  vec3 n = nrm(w);
  vec3 p = wiggle(uInvM * w);                    // point on him, in his own (un-squished, un-wiggled) shape
  float side = p.y < 0.0 ? -1.0 : 1.0;
  vec3 q = vec3(p.x, abs(p.y), p.z);

  float lit = clamp(0.5 * dot(n, uL) + 0.5, 0.0, 1.0);
  lit = pow(lit, 1.15);
  float occ = ao(w, n);

  vec3 skinC = ramp(hex(62.,150.,88.), hex(93.,186.,115.), hex(160.,226.,172.), lit);
  vec3 legC  = ramp(hex(44.,110.,64.), hex(63.,148.,88.), hex(104.,184.,124.), lit);
  vec3 col = mix(skinC, legC, m.y);

  // tummy: a soft, very light green glow low on his chest
  float td = length(vec3((p.x - uTummyC.x) / 6.5, p.y / 8.0, (p.z - uTummyC.z) / 4.6));
  float tw = (1.0 - smoothstep(0.35, 1.0, td)) * (1.0 - m.y) * step(0.0, p.x) * 0.85;
  col = mix(col, ramp(hex(170.,222.,160.), hex(210.,242.,198.), hex(236.,251.,228.), lit), tw);

  col *= mix(0.72, 1.0, occ);

  // rosy cheeks
  float cd = length((q - uCheekC) * vec3(1.0, 1.0, 1.39)) / 3.9;
  float cw = (1.0 - smoothstep(0.2, 1.0, cd)) * 0.72 * (1.0 - m.y);
  col = mix(col, vec3(1.0, 0.52, 0.67), cw);

  // eyes, painted onto the eye bumps
  vec3 en = normalize(vec3(uEyeN.x, uEyeN.y * side, uEyeN.z));
  vec3 ec = vec3(uEyeC.x, uEyeC.y * side, uEyeC.z);
  vec3 t1 = normalize(vec3(-en.y, en.x, 0.0)); vec3 t2 = cross(en, t1);
  vec3 dp = p - ec; float eu = dot(dp, t1), ev = dot(dp, t2), ez = dot(dp, en);
  vec3 ink = hex(46.,36.,64.);
  float aa = px1 * 1.1;
  if (ez > -2.0 && length(dp) < uEyeR + 2.5) {     // only on the front of each eye bump
    if (uEyeMode < 0.5) {
      float er = length(vec2(eu, ev * 0.95));
      float white = 1.0 - smoothstep(uEyeR - aa, uEyeR + aa, er);
      col = mix(col, mix(vec3(0.93), vec3(1.0), lit), white);
      col = mix(col, ink, smoothstep(uEyeR - aa * 2.5, uEyeR, er) * white * 0.18);
      vec2 pc = vec2(uLook.x * 2.3, uLook.y * 2.3);
      float pr = length(vec2(eu, ev) - pc);
      col = mix(col, ink, (1.0 - smoothstep(3.35 - aa, 3.35 + aa, pr)) * white);
      float sr = length(vec2(eu, ev) - pc - vec2(1.2 * -side * 0.0 + 1.2, 1.3));
      col = mix(col, vec3(1.0), (1.0 - smoothstep(1.1 - aa, 1.1 + aa, sr)) * white);
    } else {
      // v6: happy = a neat rainbow arch; blink = a soft closed curve. Thinner, rounder lines.
      float dl = uEyeMode > 1.5 ? arcD(vec2(eu, ev), vec2(0.0, -2.4), 3.7, 0.42, 2.72)
                                : arcD(vec2(eu, ev), vec2(0.0, 2.6), 3.7, -2.72, -0.42);
      col = mix(col, ink, 1.0 - smoothstep(0.72 - aa, 0.72 + aa, dl));
    }
  }

  // his smile, painted on the front of his face
  if (p.x > 11.0 && m.y < 0.5) {                     // only on the front of his face
    float my = p.y, mz = p.z;
    if (uMouthMode < 1.5) {
      float dl = arcD(vec2(my, mz), vec2(0.0, uMouthZ + uMouthR), uMouthR, -1.5708 - uMouthA, -1.5708 + uMouthA);
      col = mix(col, ink, 1.0 - smoothstep(0.72 - aa, 0.72 + aa, dl));
    } else if (uMouthMode < 2.5) {
      float e = length(vec2(my / 2.55, (mz - uMouthZ) / 1.95));
      col = mix(col, hex(107.,46.,74.), 1.0 - smoothstep(1.0 - aa / 1.95, 1.0 + aa / 1.95, e));
    } else {
      float e = abs(length(vec2(my, mz - uMouthZ)) - 1.95);
      col = mix(col, ink, 1.0 - smoothstep(0.72 - aa, 0.72 + aa, e));
    }
  }

  // a soft shine on top, and gentle darkening right at his outline so he reads as round
  vec3 h = normalize(uL - uF);
  col += vec3(1.0) * pow(max(dot(n, h), 0.0), 40.0) * 0.12;
  col *= mix(0.9, 1.0, smoothstep(0.0, 0.45, -dot(n, uF)));
  gl_FragColor = vec4(col * alpha, alpha);
}`;

  let GL = null, glFailed = false;
  function glSetup() {
    if (GL || glFailed) return GL;
    try {
      const cv = document.createElement("canvas");
      const gl = cv.getContext("webgl", { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: true });
      if (!gl) throw new Error("no webgl");
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = {}; const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(prog, i); U[info.name] = gl.getUniformLocation(prog, info.name); }
      GL = { cv, gl, U };
    } catch (e) { glFailed = true; if (root.console) console.warn("Hop Hop: using the simple drawing (" + e.message + ")"); }
    return GL;
  }

  const inv3 = m => {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C || 1;
    return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  };
  const colMajor = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];   // row-by-row -> WebGL order

  function drawGL(c, x, y, s, yaw, pitch, pose) {
    const G = glSetup(); if (!G) return false;
    const { gl, U, cv } = G;
    const t = pose.t || 0, st = pose.jump || 0, sl = st * 0.7225 /* v19: legs move 15% less, then another 15% less, in a hop */, sq = pose.squash || 0, happy = pose.happy || 0;
    const blink = pose.blink != null ? !!pose.blink : ((t % 3.4) + 3.4) % 3.4 < 0.12;
    // how many real screen pixels one frog unit covers (so he's sharp on retina screens)
    let k = 1; try { const T = c.getTransform(); k = Math.hypot(T.a, T.b) || 1; } catch (_) {}
    const S = Math.min(s * k, 720 / 76);   // cap the work on big screens (still smooth when scaled up)
    const L = 38, TOP = 58, BOT = 8;               // his box, in frog units around his feet
    const W = Math.max(2, Math.ceil(2 * L * S)), H = Math.max(2, Math.ceil((TOP + BOT) * S));
    if (W > 4096 || H > 4096) return false;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H);
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const R = [sy, cy, 0], Up = [cy * sp, -sy * sp, cp], F = [cy * cp, -sy * cp, -sp];
    const Ld = norm3([-0.45 * R[0] + 0.75 * Up[0] - 0.5 * F[0], -0.45 * R[1] + 0.75 * Up[1] - 0.5 * F[1], -0.45 * R[2] + 0.75 * Up[2] - 0.5 * F[2]]);
    const sx = 1 + 0.12 * sq, sz = (1 - 0.2 * sq) * (1 + 0.08 * st);
    const M = M3.mul(M3.scale(sx, sx, sz), M3.rotX(pose.roll || 0));
    const u = (name, ...v) => { const l = U[name]; if (l == null) return; if (v.length === 1) gl.uniform1f(l, v[0]); else if (v.length === 2) gl.uniform2f(l, v[0], v[1]); else gl.uniform3f(l, v[0], v[1], v[2]); };
    const u3 = (name, a) => u(name, a[0], a[1], a[2]);
    const um = (name, m) => { if (U[name] != null) gl.uniformMatrix3fv(U[name], false, new Float32Array(colMajor(m))); };
    u("uRes", W, H); u("uAnchor", L * S, TOP * S); u("uS", S);
    u3("uR", R); u3("uU", Up); u3("uF", F); u3("uL", Ld);
    um("uInvM", inv3(M)); u("uMinScale", Math.min(sx, sz));
    // his shape (the same sizes as the approved parts, now joined into one body)
    const bodyR = [BODY_R[0] * (1 + 0.1 * st), BODY_R[1], BODY_R[2] * (1 - 0.05 * st)];
    const TILT = -0.15, BR = M3.rotY(TILT), BC = [BODY_C[0], BODY_C[1], BODY_C[2] + 1.6];
    u3("uBodyC", BC); u3("uBodyR", bodyR); um("uBodyRot", M3.rotY(-TILT));
    u3("uButtC", lerp3([-6.6, 0, 9.4], [-8.5, 0, 10.5], st)); u3("uButtR", [6, 7, 6.2]); u("uButtSep", 3.3); um("uButtRot", M3.rotY(-lerp(0.1, -0.2, st)));   // v8: butt tucked in so it only shows from the back
    u3("uBumpC", BUMP_C); u3("uBumpR", BUMP_R);
    u3("uHipA", lerp3([-5, 16, 9.5], [-6, 12.5, 10], sl)); u3("uHipB", lerp3([-1.5, 16.8, 5.0], [-14, 12, 7], sl)); u("uHipR", 7.2); u("uHipR2", 5.3);   // v11: rounder, chubbier back legs
    u3("uHPawC", lerp3([0.8, 17.2, 2.2], [-18, 12, 6.4], sl)); u3("uHPawR", [5.2, 4.6, 2.2]);
    u3("uLegA", [11, 11, 12.5]); u3("uLegB", lerp3([16, 11.5, 3.8], [12, 11, 7.5], sl)); u("uLegR", 5.0); u("uLegR2", 3.9);   // v7: wider front legs
    u3("uPawC", lerp3([17.2, 11.8, 2.0], [13, 11.2, 5.6], sl)); u3("uPawR", [4.3, 4.0, 2.0]);
    u3("uLegBUp", [14.5, 18.5, 18]); u3("uPawCUp", [15, 20.2, 21]); u3("uPawRUp", [3.4, 3.6, 3.4]);
    u("uArmUp", clamp(pose.armL || 0, 0, 1), clamp(pose.armR || 0, 0, 1));
    u3("uLowC", lerp3([6, 0, 8.2], [6, 0, 10], st)); u3("uLowR", [12.5, 16.5, 7.4]);
    u("uSway", pose.sway || 0); u("uTwist", pose.twist || 0); u("uBob", clamp(pose.bob || 0, -0.2, 0.2));
    u3("uFootA", lerp3([-6, 12, 4], [-12, 11, 6], st)); u3("uFootB", lerp3([-6, 12, 4], [-26, 11, 4.5], st)); u("uFootR", 0);   // v9: no stick feet when he hops
    // face
    const bn = [0.9, 0.2, 0.3],   /* v19: eyes look forward, centered on each bump, like the 2D design */ bl = Math.hypot(...bn), en = [bn[0] / bl, bn[1] / bl, bn[2] / bl];
    const bc = BUMP_C, br = BUMP_R;
    const ek = 1 / Math.hypot(en[0] / br[0], en[1] / br[1], en[2] / br[2]);
    u3("uEyeC", [bc[0] + en[0] * ek, bc[1] + en[1] * ek, bc[2] + en[2] * ek]); u3("uEyeN", en); u("uEyeR", 5.6);
    u("uLook", clamp(pose.lookX || 0, -1, 1), clamp(pose.lookY || 0, -1, 1));
    u("uEyeMode", happy > 0 ? 2 : blink ? 1 : 0);
    u("uMouthMode", pose.lick ? 2 : pose.oops ? 3 : 0);
    // v6: the smile is 25% smaller. It is a piece of a circle: half-width w, depth d (a bigger dip when he's happy)
    const mw = 4.95, md = happy > 0 ? 2.6 : 1.55, mr = (mw * mw + md * md) / (2 * md);
    const mouthMid = pose.lick || pose.oops ? 16.4 : (happy > 0 ? 15.6 : 16.3);
    u("uMouthZ", mouthMid); u("uMouthR", mr); u("uMouthA", Math.asin(Math.min(1, mw / mr)));
    const onB = d => { d = norm3(d); const q = M3.app(BR, [bodyR[0] * d[0], bodyR[1] * d[1], bodyR[2] * d[2]]); return [BC[0] + q[0], BC[1] + q[1], BC[2] + q[2]]; };
    u3("uCheekC", onB([0.66, 0.62, 0.14])); u3("uTummyC", onB([1, 0, -0.62]));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (pose.shadow) {
      c.fillStyle = "rgba(40, 70, 60, 0.24)";
      c.beginPath(); c.ellipse(x, y, 25 * s, 25 * s * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); c.fill();
    }
    c.drawImage(cv, x - L * s, y - TOP * s, W / k, H / k);
    return true;
  }

  // v16: HAPPY = a short wiggle, then a tiny hop, then he sits smiling for a moment. Loops every 2 seconds.
  // During the wiggle his feet stay planted (only his body sways). dance(t).lift is his hop height (for shadows).
  const DANCE_LEN = 2.0;
  function dance(t) {
    const u = ((t % DANCE_LEN) + DANCE_LEN) % DANCE_LEN, TAU = Math.PI * 2;
    const m = { lift: 0, sway: 0, twist: 0, squash: 0 };
    if (u < 0.6) {                                   // short wiggle: two quick sways, easing in and out
      const e = Math.sin(Math.PI * u / 0.6);
      m.sway = 2.4 * Math.sin(TAU * u / 0.3) * e;
      m.twist = 0.05 * Math.sin(TAU * u / 0.3 + 0.6) * e;
    } else if (u < 0.72) {                           // little crouch to get ready
      m.squash = 0.18 * Math.sin(Math.PI * (u - 0.6) / 0.24);
    } else if (u < 1.08) {                           // tiny hop
      m.lift = Math.sin(Math.PI * (u - 0.72) / 0.36) * 3.5;
    } else if (u < 1.22) {                           // soft landing squish
      m.squash = 0.16 * Math.sin(Math.PI * (u - 1.08) / 0.14);
    }                                                // then he just sits there, happy
    return m;
  }

  function draw(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    if (pose.dance) {
      const t = pose.t || 0;
      if (motionOff()) pose = Object.assign({ happy: 1 }, pose);
      else {
        const m = dance(t);
        pose = Object.assign({ happy: 1 }, pose, { sway: m.sway, twist: m.twist, squash: Math.max(pose.squash || 0, m.squash) });
        y -= m.lift * Math.cos(pitch) * s;           // the tiny hop
      }
    }
    // v12: happy wiggle. pose.wiggle (0..1) = rock side to side, with a quick little body wiggle and jiggle
    const wg = clamp(pose.wiggle || 0, 0, 1);
    if (wg > 0 && !motionOff()) {
      const t = pose.t || 0;
      pose = Object.assign({}, pose, {
        roll: (pose.roll || 0) + Math.sin(t * 5) * 0.09 * wg,
        squash: Math.max(pose.squash || 0, Math.abs(Math.sin(t * 10)) * 0.1 * wg)
      });
      yaw += Math.sin(t * 10) * 0.09 * wg;
    }
    if (!root.__hopHopForce2D && drawGL(c, x, y, s, yaw, pitch, pose)) return;
    draw2D(c, x, y, s, yaw, pitch, pose);
  }

  root.__lilyFrogV3 = Object.freeze({ draw, dance, danceLength: DANCE_LEN, length: 44 });   // picked up by LilyCreatures below
})(typeof window !== "undefined" ? window : globalThis);

// ===================== Nee Nee the Bunny: APPROVED MASTER DESIGN (Sept 30, 2026, bunny-3d-v10) =====================
// One solid soft 3D body drawn with WebGL, face painted on (like Hop Hop). If a device has no WebGL, the older
// parts bunny further down is used instead, so nothing breaks. Design history: bunny-3d-v1 .. v10.
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mqReduce = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } })();
  const motionOff = () => (root.LilyCreatures && root.LilyCreatures.settings ? !!root.LilyCreatures.settings.reduceMotion : mqReduce);

  // ---------- tiny 3D math (3x3 matrices stored row by row) ----------
  const M3 = {
    I: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(a, b) { const r = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; },
    app(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; },
    rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
    scale(x, y, z) { return [x, 0, 0, 0, y, 0, 0, 0, z]; },
    T(m) { return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]; }
  };
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const inv3 = m => {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C || 1;
    return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  };
  const colMajor = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
  const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  // Nee Nee's own colors (the approved cream bunny)
  const NEE_NEE = { fur: ["#FFFFFF", "#FFF7F0", "#EEDBD6"], tail: ["#FFFFFF", "#FFFFFF", "#F2E6EA"] };

  // ---------- the shader: one smooth body, face painted on ----------
  const VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform vec2 uAnchor; uniform float uS;
uniform vec3 uR, uU, uF, uL;
uniform mat3 uInvM; uniform float uMinScale;
// parts (all in her own space: x = forward, y = her right, z = up)
uniform vec3 uBodyC, uBodyR, uChestC, uChestR, uHeadC, uHeadR, uTailC; uniform float uTailR;
uniform mat3 uUpInv, uHeadInv; uniform vec3 uUpOff, uHeadOff;   // upper body (sits up) and head (looks around)
uniform vec3 uHaunchC, uHaunchR, uFootC, uFootR; uniform mat3 uFootInv;
uniform vec3 uShoulderL, uShoulderR, uPawL, uPawR, uPawRad; uniform float uLegR;
uniform vec3 uCheekC, uCheekR;                 // right cheek in head space (left is its mirror)
uniform vec3 uEarC0, uEarC1, uEarR; uniform mat3 uEarInv0, uEarInv1;
uniform vec3 uEarCurl0, uEarCurl1;   // v4: each ear's curl: (total bend in radians, where the curl starts, how long the curved part is)
// face
uniform vec3 uEyeC0, uEyeN0, uEyeC1, uEyeN1; uniform vec2 uEyeSize; uniform float uEyeMode;
uniform vec3 uNoseC; uniform vec2 uNoseSize; uniform float uChew;
// colors
uniform vec3 uFur0, uFur1, uFur2, uTail0, uTail1, uTail2, uAlt0, uAlt1, uAlt2; uniform float uHasAlt;

float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-4); }
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2; vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv);
  float y2 = y * y * l2; float z2 = z * z * l2; float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1; }
// v4: bend an ear like soft felt: from 'zs' along the ear it curves (a round arc of length 'len') toward its
// front (pink) side by 'bend' radians, then carries on straight. This turns a point back into the flat ear's own space.
vec3 curlEar(vec3 el, vec3 c){
  float b = c.x, zs = c.y, len = c.z;
  if (b < 0.001) return el;
  float R = len / b;
  float dx = R - el.x, dz = el.z - zs;
  float th = atan(dz, dx);
  if (th < 0.0 && dx < 0.0) th += 6.2831853;   // v5: the flap hanging down below the fold still counts as flap
  if (th <= b) return vec3(R - length(vec2(dx, dz)), el.y, zs + R * th);
  vec2 E = vec2(R - R * cos(b), zs + R * sin(b)), T = vec2(sin(b), cos(b)), Nn = vec2(cos(b), -sin(b));
  vec2 d = vec2(el.x, el.z) - E;
  return vec3(dot(d, Nn), el.y, zs + len + dot(d, T));
}
// v5: an ear is its straight lower part plus its curled upper part, whichever is closer (so no piece gets cut off).
// 'rest' is the point in the flat ear's own space (used to paint the pink inside).
float earSD(vec3 el, vec3 c, out vec3 rest){
  rest = el;
  if (c.x < 0.001) return sdEll(el, uEarR);
  float d0 = max(sdEll(el, uEarR), el.z - c.y);
  vec3 q = curlEar(el, c);
  float d1 = max(sdEll(q, uEarR), c.y - q.z);
  if (d1 < d0) { rest = q; return d1; }
  return d0;
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float arcD(vec2 p, vec2 c, float r, float a0, float a1){
  vec2 d = p - c; float a = atan(d.y, d.x);
  if (a >= a0 && a <= a1) return abs(length(d) - r);
  return min(length(p - (c + r * vec2(cos(a0), sin(a0)))), length(p - (c + r * vec2(cos(a1), sin(a1))))); }

// returns (distance, how much "second color" (ears + back legs), how much tail)
vec3 model(vec3 w){
  vec3 p = uInvM * w;
  vec3 q = vec3(p.x, abs(p.y), p.z);
  // upper body and head (they tip up together when she sits up)
  vec3 pu = uUpInv * p - uUpOff;
  float fur = smin(sdEll(pu - uBodyC, uBodyR), sdEll(pu - uChestC, uChestR), 4.0);
  vec3 ph = uHeadInv * p - uHeadOff;
  vec3 phs = vec3(ph.x, abs(ph.y), ph.z);
  float head = sdEll(ph - uHeadC, uHeadR);
  head = smin(head, sdEll(phs - uCheekC, uCheekR), 1.1);          // soft cheek swells, melted into her face
  head = smin(head, sdEll(ph - vec3(uNoseC.x - 0.2, 0.0, uNoseC.z), vec3(0.7, uNoseSize.x * 0.95, uNoseSize.y)), 0.45);   // v6: a tiny button nose that pokes out
  fur = smin(fur, head, 3.2);                                      // a soft neck: head melts into her chest
  // front legs and paws
  float legs = min(sdRoundCone(p, uShoulderL, uPawL, uLegR, uLegR * 0.9), sdRoundCone(p, uShoulderR, uPawR, uLegR, uLegR * 0.9));
  legs = smin(legs, min(sdEll(p - uPawL, uPawRad), sdEll(p - uPawR, uPawRad)), 0.9);
  fur = smin(fur, legs, 1.1);
  // big hind feet
  vec3 pf = uFootInv * (q - uFootC);
  fur = smin(fur, sdEll(pf, uFootR), 0.9);
  // round haunches (back legs) and long ears: can take a second color (spotted, oreo)
  float haunch = sdEll(q - uHaunchC, uHaunchR);
  vec3 r0, r1;
  float ears = min(earSD(uEarInv0 * (p - uEarC0), uEarCurl0, r0), earSD(uEarInv1 * (p - uEarC1), uEarCurl1, r1)) * 0.8;
  float alt = min(haunch, ears);
  float d = smin(fur, haunch, 1.4);
  d = smin(d, ears, 1.1);
  float aw = uHasAlt * clamp(0.5 + 0.5 * (fur - alt) / 1.4, 0.0, 1.0);
  // cotton tail: one round, fluffy ball
  float tail = length(p - uTailC) - uTailR;
  float tw = clamp(0.5 + 0.5 * (d - tail) / 0.9, 0.0, 1.0);
  d = smin(d, tail, 1.0);
  return vec3(d * uMinScale, aw, tw);
}
vec3 nrm(vec3 p){ const vec2 e = vec2(0.015, 0.0);
  return normalize(vec3(model(p + e.xyy).x - model(p - e.xyy).x, model(p + e.yxy).x - model(p - e.yxy).x, model(p + e.yyx).x - model(p - e.yyx).x)); }
float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i = 1; i <= 5; i++){ float h = 0.6 * float(i); o += (h - model(p + n * h).x) * s; s *= 0.6; } return clamp(1.0 - 0.11 * o, 0.0, 1.0); }
vec3 ramp(vec3 dk, vec3 md, vec3 lt, float t){ return t < 0.55 ? mix(dk, md, t / 0.55) : mix(md, lt, (t - 0.55) / 0.45); }
vec3 hex(float r, float g, float b){ return vec3(r, g, b) / 255.0; }

// paint a dark eye on her face (eye space: u across, v up)
vec3 paintEye(vec3 col, vec3 p, vec3 ec, vec3 en, float aa, float lit){
  vec3 t1 = normalize(cross(vec3(0.0, 0.0, 1.0), en)); vec3 t2 = cross(en, t1);
  vec3 dp = p - ec; float eu = dot(dp, t1), ev = dot(dp, t2), ez = dot(dp, en);
  if (ez < -1.2 || length(dp) > 4.0) return col;
  vec3 ink = hex(59., 45., 85.);
  if (uEyeMode < 0.5) {
    float er = length(vec2(eu / uEyeSize.x, ev / uEyeSize.y));
    float a = 1.0 - smoothstep(1.0 - aa / uEyeSize.x, 1.0 + aa / uEyeSize.x, er);
    col = mix(col, ink, a);
    float hr = length(vec2(eu - uEyeSize.x * 0.28, ev - uEyeSize.y * 0.4));
    col = mix(col, vec3(1.0), (1.0 - smoothstep(0.42 - aa, 0.42 + aa, hr)) * a);
  } else {
    // happy = a little rainbow arch; blink / asleep = a soft closed curve
    float dl = uEyeMode > 1.5 ? arcD(vec2(eu, ev), vec2(0.0, -1.1), 1.45, 0.35, 2.79)
                              : arcD(vec2(eu, ev), vec2(0.0, 1.0), 1.45, -2.79, -0.35);
    col = mix(col, ink, 1.0 - smoothstep(0.26 - aa, 0.26 + aa, dl));
  }
  return col;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float X = (px.x - uAnchor.x) / uS, Y = (uAnchor.y - px.y) / uS;
  vec3 ro = X * uR + Y * uU - uF * 90.0;
  float t = 0.0, dmin = 1e9, hit = 0.0;
  for (int i = 0; i < 110; i++){
    float d = model(ro + uF * t).x;
    dmin = min(dmin, d);
    if (d < 0.003) { hit = 1.0; break; }
    t += d; if (t > 180.0) break;
  }
  float px1 = 1.0 / uS;
  float alpha = hit > 0.5 ? 1.0 : 1.0 - smoothstep(0.0, px1 * 1.2, dmin);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  if (hit < 0.5) { t = 0.0; for (int i = 0; i < 110; i++){ float d = model(ro + uF * t).x; if (d <= dmin + 1e-3) break; t += d; if (t > 180.0) break; } }
  vec3 w = ro + uF * t;
  vec3 m = model(w);
  vec3 n = nrm(w);
  vec3 p = uInvM * w;
  float aa = px1 * 1.1;

  float lit = pow(clamp(0.5 * dot(n, uL) + 0.5, 0.0, 1.0), 1.1);
  float occ = ao(w, n);
  vec3 col = ramp(uFur2, uFur1, uFur0, lit);
  col = mix(col, ramp(uAlt2, uAlt1, uAlt0, lit), m.y);
  col = mix(col, ramp(uTail2, uTail1, uTail0, lit), m.z);
  col *= mix(0.8, 1.0, occ);

  // pink inside her ears (the front face of each ear)
  for (int e = 0; e < 2; e++) {
    vec3 el; float ed = e == 0 ? earSD(uEarInv0 * (p - uEarC0), uEarCurl0, el) : earSD(uEarInv1 * (p - uEarC1), uEarCurl1, el);
    if (el.x > 0.0 && sdEll(el, uEarR) < 0.35) {   // v3: only on the ear itself (not her body or cheek behind it)
      float ei = length(vec2(el.y / (uEarR.y * 0.52), (el.z + 0.4) / (uEarR.z * 0.72)));
      float fw = smoothstep(0.1, 0.55, el.x / uEarR.x);
      float k = (1.0 - smoothstep(0.78, 1.0, ei)) * fw;
      col = mix(col, ramp(hex(245., 175., 197.), hex(255., 196., 214.), hex(255., 216., 228.), lit), k);
    }
  }

  // face (in head space)
  vec3 ph = uHeadInv * p - uHeadOff;
  if (ph.x > uHeadC.x) {
    // rosy cheeks
    vec3 phs = vec3(ph.x, abs(ph.y), ph.z);
    vec3 cs = uCheekC + normalize(uCheekC - uHeadC) * 1.2;
    float cd = length((phs - cs) * vec3(0.9, 1.0, 1.15)) / 2.1;
    col = mix(col, vec3(1.0, 0.55, 0.69), (1.0 - smoothstep(0.05, 1.0, cd)) * 0.72);
    // twitchy pink nose
    vec2 nd = vec2(ph.y / uNoseSize.x, (ph.z - uNoseC.z) / uNoseSize.y);
    float nr = length(nd + vec2(0.0, 0.35 * nd.x * nd.x));
    if (ph.x > uNoseC.x - 1.5) {
      float na = 1.0 - smoothstep(1.0 - aa / uNoseSize.y, 1.0 + aa / uNoseSize.y, nr);
      col = mix(col, ramp(hex(240., 127., 160.), hex(255., 154., 182.), hex(255., 194., 212.), lit), na);
      // tiny mouth: a little line down from the nose, then a soft "w"
      float mz = uNoseC.z - uNoseSize.y;
      vec2 mp = vec2(ph.y, ph.z);
      float ml = abs(mp.x) < 0.12 && mp.y < mz && mp.y > mz - 0.9 ? abs(mp.x) : 1e3;
      float r = 0.72;
      float mw = min(arcD(mp, vec2(-r, mz - 0.9 + r * 0.25 - uChew * 0.3), r, -2.6, -0.15),
                     arcD(mp, vec2( r, mz - 0.9 + r * 0.25 - uChew * 0.3), r, -2.99, -0.54));
      float md = min(ml, mw);
      col = mix(col, hex(59., 45., 85.), (1.0 - smoothstep(0.16 - aa, 0.16 + aa, md)) * 0.75);
    }
  }
  col = paintEye(col, p, uEyeC0, uEyeN0, aa, lit);
  col = paintEye(col, p, uEyeC1, uEyeN1, aa, lit);

  // a soft shine on top, and a gentle darkening at her outline so she reads as round
  vec3 h = normalize(uL - uF);
  col += vec3(1.0) * pow(max(dot(n, h), 0.0), 36.0) * 0.1;
  col *= mix(0.9, 1.0, smoothstep(0.0, 0.45, -dot(n, uF)));
  gl_FragColor = vec4(col * alpha, alpha);
}`;

  let GL = null, glFailed = false;
  function glSetup() {
    if (GL || glFailed) return GL;
    try {
      const cv = document.createElement("canvas");
      const gl = cv.getContext("webgl", { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: true });
      if (!gl) throw new Error("no webgl");
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = {}; const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(prog, i); U[info.name] = gl.getUniformLocation(prog, info.name); }
      GL = { cv, gl, U };
    } catch (e) { glFailed = true; if (root.console) console.warn("Nee Nee 3D: using the simple drawing (" + e.message + ")"); }
    return GL;
  }

  // ---------- her pose: where every part is (same numbers as the approved v8 bunny) ----------
  function rig(o) {
    const st = o.stretch, up = o.up, fl = o.flop;
    const R = {};
    // hind feet: kick back when she hops
    R.footC = [-2 - st * 9, 5.2, 1.4 + st * 2]; R.footR = [7.2, 2.5, 1.5]; R.footInv = M3.T(M3.rotY(-0.5 * st));
    R.haunchC = [-5 - st * 2, 6.1, 6.2]; R.haunchR = [6.6, 3.8, 5.8];   // v2: slimmer thighs, tucked in so they don't stick out behind her
    R.tailC = [-14 - st * 1.5 + up * 2, 0, 9.5 + up * 1.5]; R.tailR = 4.2;
    // front paws: on the ground, washing her face, or holding a carrot up to her mouth
    const holding = o.carrot !== null && o.carrot !== undefined;
    const groomT = o.groom > 0 && !motionOff() ? Math.sin(o.t * 9) : 0;
    const paws = [-1, 1].map(side => {
      let p = [8 + st * 4, side * 3, 1.6 + st * 3];
      const upP = [7.5, side * 2.3, 10.5], gP = [10.5, side * 2.5, 15 + side * groomT * 1.2];
      const u = holding ? 1 : up;
      p = p.map((v, i) => lerp(v, upP[i], u));
      if (!holding && o.groom > 0.05) p = p.map((v, i) => lerp(v, gP[i], o.groom));
      return p;
    });
    R.pawL = paws[0]; R.pawR = paws[1]; R.pawRad = [2.7, 1.9, 1.8];
    // upper body: tips up from the hip when she sits up
    const upM = M3.rotY(0.62 * up), piv = [-6, 0, 3];
    const upW = v => { const r = M3.app(upM, [v[0] - piv[0], v[1] - piv[1], v[2] - piv[2]]); return [r[0] + piv[0], r[1] + piv[1], r[2] + piv[2]]; };
    // the shader turns a point back into her upper body's own space: local = inv(upM) * p - upOff
    R.upInv = M3.T(upM);
    { const q = M3.app(R.upInv, piv); R.upOff = [q[0] - piv[0], q[1] - piv[1], q[2] - piv[2]]; }
    R.bodyC = [-2, 0, 9.5]; R.bodyR = [12.6 * (1 + st * 0.12), 9, 9.2];
    R.chestC = [5, 0, 10]; R.chestR = [7.2, 7, 7.6];
    R.shoulderL = upW([6.5, -3.1, 7.5]); R.shoulderR = upW([6.5, 3.1, 7.5]);
    // head: stays level when she sits up; turns a little when she looks around
    // v2: when she naps, her head comes down and forward until her chin rests on the ground
    const neck = upW([6 + fl * 2.5, 0, 14 - fl * 7.5]);
    const headLocal = M3.mul(M3.rotZ(o.look * 0.55), M3.rotY(-0.5 * up - 0.3 * fl + (o.groom > 0.05 ? -0.15 * o.groom : 0)));
    const headM = M3.mul(upM, headLocal);
    const neck0 = [6, 0, 14];
    const headW = v => { const r = M3.app(headM, [v[0] - neck0[0], v[1] - neck0[1], v[2] - neck0[2]]); return [r[0] + neck[0], r[1] + neck[1], r[2] + neck[2]]; };
    R.headInv = M3.T(headM);
    { const q = M3.app(R.headInv, neck); R.headOff = [q[0] - neck0[0], q[1] - neck0[1], q[2] - neck0[2]]; }
    const inHead = c => c;   // head-space points are just her head's own numbers
    const HC = [9, 0, 17.5], HR = [7.2, 6.9, 6.9];
    R.headC = inHead(HC); R.headR = HR;
    // cheek swells (right side; the left is its mirror in head space)
    const ch = 1 + o.chew * 0.2;
    const cd = [5.2, 4.53, -3.71], cn = 1 / Math.hypot(cd[0] / HR[0], cd[1] / HR[1], cd[2] / HR[2]);
    const surf = [HC[0] + cd[0] * cn, HC[1] + cd[1] * cn, HC[2] + cd[2] * cn];
    const cu = norm3([cd[0] / (HR[0] * HR[0]), cd[1] / (HR[1] * HR[1]), cd[2] / (HR[2] * HR[2])]);
    const CR = 2.9 * ch, sink = CR - 0.9;
    R.cheekC = inHead([surf[0] - cu[0] * sink, surf[1] - cu[1] * sink, surf[2] - cu[2] * sink]); R.cheekR = [CR * 0.9, CR, CR * 0.85];
    // eyes (world space) and nose (head space)
    [-1, 1].forEach((side, i) => {
      const en = norm3([0.74, side * 0.52, 0.44]);
      const ep = [HC[0] + en[0] * HR[0] * 0.995, HC[1] + en[1] * HR[1] * 0.995, HC[2] + en[2] * HR[2] * 0.995];
      R["eyeC" + i] = headW(ep); R["eyeN" + i] = norm3(M3.app(headM, en));
    });
    const tw = motionOff() ? 0 : (((o.t * 0.8) % 1) < 0.4 || o.chew > 0 ? Math.sin(o.t * 38) : 0);
    R.noseC = inHead([16.4, 0, 17.8]); R.noseSize = [1.25, 0.95 * (1 + tw * 0.15)];   // v8: raised again (v7 z 16.8, v6 z 15.6)
    // ears: long and soft; they tip back when she hops or naps and flick now and then
    const flick = o.earFlick > 0 && !motionOff() ? Math.sin(o.earFlick * Math.PI * 3) * 0.4 * o.earFlick : 0;
    const earBack = 0.12 + st * 0.55 + fl * 1.15 - up * 0.1;
    const ears = o.ears || {}, elen = clamp(ears.len || 1, 0.7, 1.25), ewide = clamp(ears.wide || 1, 0.85, 1.5);
    R.earCurl = [[0, 0, 1], [0, 0, 1]];
    [-1, 1].forEach((side, i) => {
      const style = (side < 0 ? ears.left : ears.right) || "up";
      const base = style === "lop" ? [5.8, side * 2.9, 22.4] : [7.2, side * 2.7, 22.5];
      const f = side === o.earFlickSide ? flick : 0;
      const half = 8.8 * elen;
      let eM;
      if (style === "lop") {
        // v4: a lop ear starts out sideways from the top of her head (a little up and back), then curves over
        // toward its pink side and hangs down close beside her face. Its pink side ends up facing her.
        const A = norm3([-0.3 - st * 0.3, side * 0.93, 0.3]);                        // along the ear, at its base
        let Wd = [1, 0, 0]; const dd = Wd[0] * A[0] + Wd[1] * A[1] + Wd[2] * A[2];
        Wd = norm3([Wd[0] - A[0] * dd, Wd[1] - A[1] * dd, Wd[2] - A[2] * dd]);           // its width runs front to back
        const N = [A[1] * Wd[2] - A[2] * Wd[1], A[2] * Wd[0] - A[0] * Wd[2], A[0] * Wd[1] - A[1] * Wd[0]];   // pink side (faces down, then in)
        const Nn = side > 0 ? N : [-N[0], -N[1], -N[2]];
        const Wf = side > 0 ? Wd : [-Wd[0], -Wd[1], -Wd[2]];
        eM = M3.mul(headM, [Nn[0], Wf[0], A[0], Nn[1], Wf[1], A[1], Nn[2], Wf[2], A[2]]);
        R.earCurl[i] = [1.95, -half + 2.2, 7.2 * elen];
      } else {
        eM = M3.mul(headM, M3.mul(M3.mul(M3.rotY(earBack + f), M3.rotX(-side * (0.2 + o.look * 0.1 * side))), M3.rotZ(side * 0.5)));
        // v4: a bent ear's top folds forward over its pink front in a soft round curve and hangs down
        if (style === "bent") R.earCurl[i] = [2.9, -half * 0.12, 4.6 * elen];   // folds just above the middle; the flap hangs down the front
      }
      const baseW = headW(base);
      const off = M3.app(eM, [0, 0, 8.4 * elen]);
      R["earC" + i] = [baseW[0] + off[0], baseW[1] + off[1], baseW[2] + off[2]];
      R["earInv" + i] = M3.T(eM);
    });
    R.earR = [1.3 * (1 + (ewide - 1) * 0.5), 2.9 * ewide, 8.8 * elen];   // v11: wider ears are a little thicker too
    // things drawn on top (whiskers, carrot)
    R.headW = headW; R.headM = headM; R.holding = holding;
    R.mouthW = headW([16.0, 0, 15.6]);
    // v9: her paws hold the carrot's leafy end, so as she eats they rise along the carrot toward her mouth
    // (stopping just under her chin)
    if (holding) {
      const f = lerp(0.42, 1, clamp((o.carrot - 0.25) / 0.75, 0, 1)), mw = R.mouthW;   // v10: paws stay under her chin while she eats the greens
      const up2 = p => [mw[0] + (p[0] - mw[0]) * f, p[1] * lerp(0.8, 1, f), mw[2] + (p[2] - mw[2]) * f];
      R.pawL = up2(R.pawL); R.pawR = up2(R.pawR);
    }
    return R;
  }

  function drawGL(c, x, y, s, yaw, pitch, pose) {
    const G = glSetup(); if (!G) return false;
    const { gl, U, cv } = G;
    const t = pose.t || 0, ph = pose.ph || 0;
    const o = {
      t, stretch: pose.stretch || 0, up: pose.up || 0, flop: pose.flop || 0, groom: pose.groom || 0, chew: pose.chew || 0,
      squash: pose.squash || 0, happy: pose.happy || 0, earFlick: pose.earFlick || 0, earFlickSide: pose.earFlickSide || 1, ears: pose.ears || null,
      look: pose.look || 0, carrot: pose.carrot == null ? null : pose.carrot, roll: pose.roll || 0
    };
    const blink = pose.blink != null ? pose.blink < 0 : (((t + ph) % 3.9 + 3.9) % 3.9 < 0.13);
    const closed = o.flop > 0.5 || o.groom > 0.5;
    let k = 1; try { const T = c.getTransform(); k = Math.hypot(T.a, T.b) || 1; } catch (_) {}
    const S = Math.min(s * k, 14);   // detail cap (pixels per bunny unit) so big screens stay smooth
    const L = 30, TOP = 50, BOT = 6;
    const W = Math.max(2, Math.ceil(2 * L * S)), H = Math.max(2, Math.ceil((TOP + BOT) * S));
    if (W > 4096 || H > 4096) return false;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H);
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const Rv = [sy, cy, 0], Up = [cy * sp, -sy * sp, cp], F = [cy * cp, -sy * cp, -sp];
    const Ld = norm3([-0.45 * Rv[0] + 0.75 * Up[0] - 0.5 * F[0], -0.45 * Rv[1] + 0.75 * Up[1] - 0.5 * F[1], -0.45 * Rv[2] + 0.75 * Up[2] - 0.5 * F[2]]);
    const sq = o.squash, fl = o.flop;
    const sxx = 1 + sq * 0.1 + fl * 0.1, syy = 1 + sq * 0.1 + fl * 0.08, szz = (1 - sq * 0.14) * (1 - fl * 0.28);
    const M = M3.mul(M3.scale(sxx, syy, szz), M3.rotX(o.roll));
    const u = (name, ...v) => { const l = U[name]; if (l == null) return; if (v.length === 1) gl.uniform1f(l, v[0]); else if (v.length === 2) gl.uniform2f(l, v[0], v[1]); else gl.uniform3f(l, v[0], v[1], v[2]); };
    const u3 = (name, a) => u(name, a[0], a[1], a[2]);
    const um = (name, m) => { if (U[name] != null) gl.uniformMatrix3fv(U[name], false, new Float32Array(colMajor(m))); };
    const Rg = rig(o);
    u("uRes", W, H); u("uAnchor", L * S, TOP * S); u("uS", S);
    u3("uR", Rv); u3("uU", Up); u3("uF", F); u3("uL", Ld);
    um("uInvM", inv3(M)); u("uMinScale", Math.min(sxx, syy, szz));
    u3("uBodyC", Rg.bodyC); u3("uBodyR", Rg.bodyR); u3("uChestC", Rg.chestC); u3("uChestR", Rg.chestR);
    u3("uHeadC", Rg.headC); u3("uHeadR", Rg.headR); u3("uTailC", Rg.tailC); u("uTailR", Rg.tailR);
    um("uUpInv", Rg.upInv); um("uHeadInv", Rg.headInv); u3("uUpOff", Rg.upOff); u3("uHeadOff", Rg.headOff);
    u3("uHaunchC", Rg.haunchC); u3("uHaunchR", Rg.haunchR); u3("uFootC", Rg.footC); u3("uFootR", Rg.footR); um("uFootInv", Rg.footInv);
    u3("uShoulderL", Rg.shoulderL); u3("uShoulderR", Rg.shoulderR); u3("uPawL", Rg.pawL); u3("uPawR", Rg.pawR); u3("uPawRad", Rg.pawRad); u("uLegR", 2.1);
    u3("uCheekC", Rg.cheekC); u3("uCheekR", Rg.cheekR);
    u3("uEarC0", Rg.earC0); u3("uEarC1", Rg.earC1); u3("uEarR", Rg.earR); um("uEarInv0", Rg.earInv0); um("uEarInv1", Rg.earInv1); u3("uEarCurl0", Rg.earCurl[0]); u3("uEarCurl1", Rg.earCurl[1]);
    u3("uEyeC0", Rg.eyeC0); u3("uEyeN0", Rg.eyeN0); u3("uEyeC1", Rg.eyeC1); u3("uEyeN1", Rg.eyeN1); u("uEyeSize", 1.3, 1.65);
    u("uEyeMode", o.happy > 0 && !closed ? 2 : (closed || blink) ? 1 : 0);
    u3("uNoseC", Rg.noseC); u("uNoseSize", Rg.noseSize[0], Rg.noseSize[1]); u("uChew", o.chew);
    const pal = pose.pal && pose.pal.fur ? pose.pal : NEE_NEE;
    const fur = pal.fur.map(hexRGB), tail = (pal.tail || NEE_NEE.tail).map(hexRGB), alt = (pal.alt || pal.fur).map(hexRGB);
    u3("uFur0", fur[0]); u3("uFur1", fur[1]); u3("uFur2", fur[2]);
    u3("uTail0", tail[0]); u3("uTail1", tail[1]); u3("uTail2", tail[2]);
    u3("uAlt0", alt[0]); u3("uAlt1", alt[1]); u3("uAlt2", alt[2]); u("uHasAlt", pal.alt ? 1 : 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (pose.shadow) {
      c.fillStyle = "rgba(60, 100, 50, 0.24)";
      c.beginPath(); c.ellipse(x, y, 17 * s, 17 * s * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); c.fill();
    }
    c.drawImage(cv, x - L * s, y - TOP * s, W * s / S, H * s / S);   // stretched to her real size even when the detail is capped
    // on top: whiskers (only when her face is toward you) and the carrot she's munching
    const scr = v0 => { const v = M3.app(M, v0); return { x: x + (v[0] * sy + v[1] * cy) * s, y: y + (-(v[2] * cp) - (v[0] * cy - v[1] * sy) * sp) * s }; };
    const depthN = n => { const v = M3.app(M, n); return (v[0] * cy - v[1] * sy) * cp - v[2] * sp; };
    const face = depthN(M3.app(Rg.headM, [1, 0, -0.1]));
    if (face < -0.2) {
      c.save(); c.globalAlpha *= clamp((-face - 0.2) / 0.3, 0, 1);
      c.strokeStyle = "rgba(160, 130, 170, 0.45)"; c.lineWidth = Math.max(0.4, 0.2 * s); c.lineCap = "round";
      [-1, 1].forEach(side => {
        const a = scr(Rg.headW([15.8, side * 2.2, 16.4]));
        [[5, 1.2], [5.6, -0.2], [5, -1.5]].forEach(([len, dz]) => { const b = scr(Rg.headW([15.8 + len * 0.35, side * (2.2 + len), 16.4 + dz])); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); });
      });
      c.restore();
    }
    if (Rg.holding && face < 0.1 && o.carrot > 0.005) {
      // v2: the bitten end stays at her mouth; the leafy bottom moves up toward her mouth as she eats.
      // v10: first the orange part (carrot 1 -> 0.25), then she nibbles the greens in (0.25 -> 0) until nothing is left.
      const orangeK = clamp((o.carrot - 0.25) / 0.75, 0, 1), greenK = clamp(o.carrot / 0.25, 0, 1);
      const pm = [(Rg.pawL[0] + Rg.pawR[0]) / 2, 0, (Rg.pawL[2] + Rg.pawR[2]) / 2], mw = Rg.mouthW;
      const d = norm3([pm[0] - mw[0], pm[1] - mw[1], pm[2] - mw[2]]);
      const base = orangeK > 0 ? [pm[0] + d[0] * 1.6, pm[1] + d[1] * 1.6, pm[2] + d[2] * 1.6] : mw;   // the leafy end: below her paws, or at her mouth once the orange is gone
      const tip = mw;
      const B = scr(base), Tp = scr(tip), lf = scr([base[0] + d[0] * 4, base[1] + d[1] * 4, base[2] + d[2] * 4]);
      const la = Math.atan2(lf.y - B.y, lf.x - B.x);
      // the green leaves: full size while there's orange left, then shorter and shorter as she nibbles them in
      const gk = orangeK > 0 ? 1 : greenK;
      c.fillStyle = "#6CBF74";
      [-0.5, 0, 0.5].forEach(o2 => { c.beginPath(); c.ellipse(B.x + Math.cos(la + o2) * 2.2 * s * gk, B.y + Math.sin(la + o2) * 2.2 * s * gk, 2.6 * s * gk, 0.6 * s * Math.max(0.5, gk), la + o2, 0, Math.PI * 2); c.fill(); });
      const dx = Tp.x - B.x, dy = Tp.y - B.y, Ln = Math.hypot(dx, dy);
      if (orangeK > 0 && Ln > 0.5) {
        const nx = -dy / Ln, ny = dx / Ln, wb = 1.4 * s, wt = lerp(0.3, 1.2, 1 - orangeK) * s;
        const g = c.createLinearGradient(B.x - nx * wb, B.y - ny * wb, B.x + nx * wb, B.y + ny * wb);
        g.addColorStop(0, "#FFB46B"); g.addColorStop(1, "#F2803A"); c.fillStyle = g;
        c.beginPath(); c.moveTo(B.x - nx * wb, B.y - ny * wb); c.quadraticCurveTo(B.x - dx / Ln * wb, B.y - dy / Ln * wb, B.x + nx * wb, B.y + ny * wb);
        c.lineTo(Tp.x + nx * wt, Tp.y + ny * wt); c.lineTo(Tp.x - nx * wt, Tp.y - ny * wt); c.closePath(); c.fill();
        if (orangeK < 0.98) { c.fillStyle = "#FFD3A6"; c.beginPath(); c.ellipse(Tp.x, Tp.y, wt, wt * 0.5, Math.atan2(dy, dx) + Math.PI / 2, 0, Math.PI * 2); c.fill(); }   // the bitten end
      }
    }

    return scr(Rg.mouthW);   // her mouth on screen (games use it for crumbs)
  }

  root.__lilyBunnyGLV4 = drawGL;   // picked up by LilyCreatures below
})(typeof window !== "undefined" ? window : globalThis);

(function (root) {
  "use strict";
  const VERSION = "4";
  const settings = {
    reduceMotion: (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } })()
  };
  let ctx = null, reduceMotion = false;   // set at the start of every draw call
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ================= the 3D bee =================
  // She's one round, shaded body with two stripes that wrap all the way around, a face on the
  // front of the ball (eyes, rosy cheeks, smile), two antennae, two heart-shaped wings on her back
  // and six little legs. Every frame the pieces are turned to match which way she faces compared
  // to the camera, then drawn back to front.
  // Her own directions: x = forward (toward her face), y = her right side, z = up. "Bee units"
  // are the same as the flat drawing's (her body is 36 long); her feet rest 12.5 below the origin.
  const M3 = {
    I: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(a, b) { const r = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; },
    app(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },   // rolls her side (y) toward up (z)
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; },   // positive lifts her front up
    rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },   // turns her left/right
    scale(x, y, z) { return [x, 0, 0, 0, y, 0, 0, 0, z]; },
    fromNormal(n) {   // columns: the normal, then two directions along the surface (across, then up)
      let t1 = [-n[1], n[0], 0];
      const l1 = Math.hypot(t1[0], t1[1]) || 1; t1 = [t1[0] / l1, t1[1] / l1, 0];
      const t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
      return [n[0], t1[0], t2[0], n[1], t1[1], t2[1], n[2], t1[2], t2[2]];
    }
  };
  const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

  // her approved colors (bee-color-guide-v1); her friends' colors are further down
  const BEE_COLORS = { top: "#FFF371", bot: "#FFC921", stripe: "#E58E00", wingFront: "255, 228, 242", cheek: "255, 100, 132" };
  const INK = "#2E2440", LEG = "#4B3A66";
  const BODY_C = [-1.4, 0, 1], BODY_R = [18, 13.6, 12.7];
  const STRIPES = [[-0.8, -0.575], [-0.335, -0.045]];   // where each stripe sits, from tail (-1) to face (+1)
  const LEG_X = [-10.2, -4.4, 1.6], LEG_Y = 5.4, KNEE = 2.1, LEG_LEN = 3.9, TUCK_BEND = 0.984, SEAT_GROUND = 12.5;

  // a point on her body, in a direction from its center (and the way the surface faces there)
  function surf(d) {
    d = norm3(d);
    return { p: [BODY_C[0] + BODY_R[0] * d[0], BODY_C[1] + BODY_R[1] * d[1], BODY_C[2] + BODY_R[2] * d[2]], n: norm3([d[0] / BODY_R[0], d[1] / BODY_R[1], d[2] / BODY_R[2]]) };
  }
  function bellyZ(x, y) { const u = (x - BODY_C[0]) / BODY_R[0], v = y / BODY_R[1]; return BODY_C[2] - BODY_R[2] * Math.sqrt(Math.max(0, 1 - u * u - v * v)); }
  function hipZ(x, tuck) { return bellyZ(x, LEG_Y) + 1.1 + tuck * 0.9; }
  // resting: each leg folds with its knee forward so all six feet land flat on one line
  function seatedFold(x) { return Math.acos(clamp((hipZ(x, 0) + SEAT_GROUND - 1.22) / LEG_LEN, 0.12, 1)); }
  function legPose(i, side, o, t) {
    const far = side < 0;
    const ph = i * 2.1 + (far ? 1 : 0) + o.ph;
    let a = reduceMotion ? 0 : Math.sin(t * 1.4 + i + o.ph) * 0.04, b = 0;
    a += -0.22 * o.squish; b += 0.6 * o.squish;
    const k = seatedFold(LEG_X[i]);
    a += (-k - a) * o.seat; b += (2 * k - b) * o.seat;
    if (o.kick > 0 && !reduceMotion) { a += Math.sin(t * 16 + ph) * 0.35 * o.kick; b += (0.16 + 0.16 * Math.sin(t * 16 + ph + 1.2)) * o.kick; }
    const sway = reduceMotion ? 0 : Math.sin(t * 6 + i * 0.9 + (far ? 0.6 : 0) + o.ph);
    a += (0.6 + sway * 0.06 - a) * o.tuck;
    b += (TUCK_BEND + sway * 0.065 - b) * o.tuck;
    return { a, b };
  }
  // the heart-shaped wing outline from the flat drawing, as points (x across, y along its length)
  function wingOutline(L, w) {
    const pts = [[0, 0]];
    const bez = (p0, p1, p2, p3) => { for (let i = 1; i <= 12; i++) { const t = i / 12, u = 1 - t; pts.push([0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k])); } };
    const quad = (p0, p1, p2) => { for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; pts.push([0, 1].map(k => u * u * p0[k] + 2 * u * t * p1[k] + t * t * p2[k])); } };
    bez([0, 0], [-w * 0.9, -L * 0.2], [-w * 1.25, -L * 0.75], [-w * 0.55, -L * 0.95]);
    quad([-w * 0.55, -L * 0.95], [0, -L * 1.05], [w * 0.55, -L * 0.95]);
    bez([w * 0.55, -L * 0.95], [w * 1.25, -L * 0.75], [w * 0.9, -L * 0.2], [0, 0]);
    return pts;
  }
  const WING_L = 23, WING = wingOutline(WING_L, 4.8), WING_TILT = 0.85;   // wings lean back over her tail

  // Draws her with her origin at screen point (x, y). s = pixels per bee unit.
  // yaw: which way she faces compared to the camera (0 = away from you, PI = toward you, PI/2 = to the right).
  // pitch: how much we look down on her. o: her pose (see the flat drawBee in the game).
  function drawBee3D(x, y, s, yaw, pitch, o) {
    const t = o.t, pal = o.pal || BEE_COLORS, q = o.squish || 0;
    const tuck = o.tuck, seat = o.seat;
    // her whole-body squish, tilt and wiggle
    let G = M3.scale(1 + 0.14 * q, 1 + 0.14 * q, 1 - 0.22 * q);
    const rock = o.wiggle > 0 && !reduceMotion ? Math.sin(t * 18) * 0.12 * Math.min(1, o.wiggle) : 0;
    G = M3.mul(M3.rotY((o.flying ? 0.06 : 0) - clamp((o.speed || 0) * 0.0012, -0.2, 0.2) + rock), G);
    G = M3.mul(M3.rotX(rock * 0.6), G);
    const Wp = v => M3.app(G, v), Wn = n => norm3(M3.app(G, n));
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const P = [sy, cy, 0, -cy * sp, sy * sp, -cp];
    const scr = v => ({ x: x + (v[0] * sy + v[1] * cy) * s, y: y + (-(v[2] * cp) - (v[0] * cy - v[1] * sy) * sp) * s });
    const depth = v => (v[0] * cy - v[1] * sy) * cp - v[2] * sp;   // bigger = farther from you
    const facing = n => depth(n) < -0.05;
    const edgeFade = n => clamp((-depth(n) - 0.05) / 0.3, 0, 1);
    // an ellipsoid (center c, shape matrix A) always looks like an ellipse on screen
    const ellipseOf = (c, A) => {
      const a = new Array(6);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) a[r * 3 + k] = P[r * 3] * A[k] + P[r * 3 + 1] * A[3 + k] + P[r * 3 + 2] * A[6 + k];
      const s11 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2], s22 = a[3] * a[3] + a[4] * a[4] + a[5] * a[5], s12 = a[0] * a[3] + a[1] * a[4] + a[2] * a[5];
      const m = (s11 + s22) / 2, dd = Math.sqrt(Math.max(0, ((s11 - s22) / 2) ** 2 + s12 * s12));
      const p = scr(c);
      return { x: p.x, y: p.y, rx: Math.sqrt(m + dd) * s, ry: Math.max(0.3, Math.sqrt(Math.max(0, m - dd)) * s), ang: 0.5 * Math.atan2(2 * s12, s11 - s22) };
    };
    const Cw = Wp(BODY_C), body = ellipseOf(Cw, M3.mul(G, M3.scale(BODY_R[0], BODY_R[1], BODY_R[2])));
    const bodyPath = () => { ctx.beginPath(); ctx.ellipse(body.x, body.y, body.rx, body.ry, body.ang, 0, Math.PI * 2); };
    const parts = [];

    // ---- legs (under her tummy, so her body always covers their tops) ----
    [-1, 1].forEach(side => LEG_X.forEach((lx, i) => {
      const { a, b } = legPose(i, side, { tuck, seat, squish: q, kick: clamp(o.wiggle || 0, 0, 1), ph: o.ph }, t);
      const hip = [lx, side * LEG_Y, hipZ(lx, tuck)];
      const d1 = norm3([-Math.sin(a), side * 0.28, -Math.cos(a)]), d2 = norm3([-Math.sin(a + b), side * 0.2, -Math.cos(a + b)]);
      const knee = add3(hip, d1, KNEE), foot = add3(knee, d2, LEG_LEN - KNEE);
      parts.push({ d: 1e6 + depth(Wp(hip)), draw: () => {
        const H0 = scr(Wp(hip)), K = scr(Wp(knee)), F = scr(Wp(foot));
        ctx.strokeStyle = side < 0 ? "#3A2C52" : LEG; ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = Math.max(0.8, 1.4 * s); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(H0.x, H0.y); ctx.lineTo(K.x, K.y); ctx.lineTo(F.x, F.y); ctx.stroke();
        // her little foot follows the lower leg (and sits flat when she rests)
        const fa = Math.atan2(F.y - K.y, F.x - K.x) - Math.PI / 2;
        const fwd = scr(Wp(add3(foot, [1, 0, 0], 0.45)));
        ctx.beginPath(); ctx.ellipse(lerp(F.x, fwd.x, 1), lerp(F.y, fwd.y, 1), 1.25 * s, 0.9 * s, fa * (1 - seat), 0, Math.PI * 2); ctx.fill();
      } });
    }));

    // ---- wings: a quick, short beat in the air; resting, a flutter now and then ----
    [-1, 1].forEach(side => {
      const root = surf([-0.3, side * 0.3, 0.9]).p;
      const dirs = ang => {
        const R = M3.rotX(-side * (0.55 + ang));
        return { L: M3.app(R, [-Math.sin(WING_TILT), 0, Math.cos(WING_TILT)]), X: M3.app(R, [Math.cos(WING_TILT), 0, Math.sin(WING_TILT)]) };
      };
      const one = (ang, alpha) => {
        const { L, X } = dirs(ang);
        const at = (px, py) => scr(Wp(add3(add3(root, L, -py), X, -px)));
        const pts = WING.map(([px, py]) => at(px, py));
        ctx.save(); ctx.globalAlpha *= alpha;
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
        ctx.fillStyle = `rgba(${pal.wingFront}, 0.74)`; ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"; ctx.lineWidth = Math.max(0.8, 1.5 * s); ctx.lineJoin = "round"; ctx.stroke();
        if (alpha > 0.5) {
          const v0 = at(0, -2), v1 = at(-1.3, -12), v2 = at(0, -21);
          ctx.strokeStyle = "rgba(230, 150, 190, 0.45)"; ctx.lineWidth = Math.max(0.6, 1 * s); ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(v0.x, v0.y); ctx.quadraticCurveTo(v1.x, v1.y, v2.x, v2.y); ctx.stroke();
          const hl = at(-2.2, -19);
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; ctx.beginPath(); ctx.arc(hl.x, hl.y, Math.max(0.6, 1.5 * s), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      };
      const mid = dirs(o.flap);
      parts.push({ d: depth(Wp(add3(root, mid.L, WING_L * 0.5))), draw: () => {
        if (o.flying && !reduceMotion) { one(0, 0.16); one(1.32, 0.16); }   // a soft buzz blur at the top and bottom of each beat
        one(o.flap, 1);
      } });
    });

    // ---- antennae: a gently curved stalk with a round ball on the end ----
    const sway = reduceMotion ? 0 : Math.sin(t * 2.4 + o.ph) * 0.6;
    [-1, 1].forEach(side => {
      const base = surf([0.6, side * 0.28, 0.75]).p;
      const ANT = 0.75;   // antennae 25% shorter (Jessica)
      const tip = add3(base, [(0.8 + sway) * ANT, side * 6.2 * ANT, 13.2 * ANT]);
      const ctrl = add3(base, [3.2 * ANT, side * 1.2 * ANT, 8.5 * ANT]);   // up first, then a gentle curve outward
      parts.push({ d: depth(Wp(ctrl)), draw: () => {
        const B = scr(Wp(base)), C = scr(Wp(ctrl)), T = scr(Wp(tip));
        ctx.strokeStyle = LEG; ctx.fillStyle = LEG; ctx.lineWidth = Math.max(1, 2 * s); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.quadraticCurveTo(C.x, C.y, T.x, T.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(T.x, T.y, 1.75 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)"; ctx.beginPath(); ctx.arc(T.x - 0.5 * s, T.y - 0.6 * s, 0.6 * s, 0, Math.PI * 2); ctx.fill();
      } });
    });

    // ---- her body, stripes and face ----
    parts.push({ d: depth(Cw), draw: () => {
      ctx.save(); bodyPath(); ctx.clip();
      const ext = Math.sqrt((body.rx * Math.sin(body.ang)) ** 2 + (body.ry * Math.cos(body.ang)) ** 2);
      const g = ctx.createLinearGradient(0, body.y - ext, 0, body.y + ext);
      g.addColorStop(0, pal.top); g.addColorStop(1, pal.bot);
      ctx.fillStyle = g; ctx.fillRect(body.x - body.rx - 4, body.y - ext - 4, body.rx * 2 + 8, ext * 2 + 8);
      // the stripes wrap all the way around her, so each one is a ring cut into little pieces
      ctx.fillStyle = pal.stripe; ctx.beginPath();
      const N = 56, pt = (th, ph) => scr(Wp([BODY_C[0] + BODY_R[0] * Math.cos(th), BODY_R[1] * Math.sin(th) * Math.cos(ph), BODY_C[2] + BODY_R[2] * Math.sin(th) * Math.sin(ph)]));
      STRIPES.forEach(([u0, u1]) => {
        const ta = Math.acos(u0), tb = Math.acos(u1), tm = (ta + tb) / 2;
        for (let i = 0; i < N; i++) {
          const p0 = i / N * Math.PI * 2, p1 = (i + 1) / N * Math.PI * 2, pm = (p0 + p1) / 2;
          const n = Wn([Math.cos(tm) / BODY_R[0], Math.sin(tm) * Math.cos(pm) / BODY_R[1], Math.sin(tm) * Math.sin(pm) / BODY_R[2]]);
          if (depth(n) > 0.18) continue;
          const A = pt(ta, p0), B = pt(ta, p1), C = pt(tb, p1), D = pt(tb, p0);
          ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath();
        }
      });
      ctx.fill("nonzero");
      // soft round shading: lit from above, a warm shadow around her lower edge
      const R = Math.max(body.rx, body.ry);
      const sh = ctx.createRadialGradient(body.x - R * 0.28, body.y - body.ry * 0.5, R * 0.05, body.x, body.y, R * 1.08);
      sh.addColorStop(0, "rgba(255, 255, 235, 0.38)"); sh.addColorStop(0.5, "rgba(255, 255, 255, 0)"); sh.addColorStop(1, "rgba(196, 110, 10, 0.3)");
      ctx.fillStyle = sh; ctx.fillRect(body.x - R - 4, body.y - R - 4, R * 2 + 8, R * 2 + 8);
      // the glossy sheen across the top of her back
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath(); ctx.ellipse(body.x - body.rx * 0.08, body.y - ext * 0.66, body.rx * 0.5, Math.max(1, ext * 0.14), body.ang * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      drawFace();
    } });

    function disc(dir, w, h) {
      const sp0 = surf(dir), c = Wp(sp0.p), n = Wn(sp0.n), Q = M3.fromNormal(n);
      const t1 = [Q[1], Q[4], Q[7]], t2 = [Q[2], Q[5], Q[8]];
      return { c, n, t1, t2, e: ellipseOf(c, M3.mul(Q, M3.scale(0.05, w, h))), on: (u, v) => scr(add3(add3(c, t1, u), t2, v)) };
    }
    function drawFace() {
      const cheery = o.happy > 0 || o.wiggle > 0, special = o.happy > 0, blink = !cheery && o.blink;
      const A0 = ctx.globalAlpha;   // respect any fade the game has set
      ctx.save(); bodyPath(); ctx.clip();
      // rosy cheeks
      [-1, 1].forEach(side => {
        const d = disc([0.6, side * 0.64, -0.3], 2.9, 1.75);
        if (!facing(d.n)) return;
        ctx.globalAlpha = A0 * edgeFade(d.n);
        ctx.fillStyle = `rgba(${pal.cheek}, 0.75)`;
        ctx.beginPath(); ctx.ellipse(d.e.x, d.e.y, d.e.rx, d.e.ry, d.e.ang, 0, Math.PI * 2); ctx.fill();
      });
      // eyes: round and dark with a sparkle; happy arches; a quick blink
      [-1, 1].forEach(side => {
        const d = disc([0.8, side * 0.4, 0.06], 2.6, 3.3);
        if (!facing(d.n)) return;
        const fade = edgeFade(d.n), lines = cheery || blink;
        if (fade < (lines ? 0.35 : 0.1)) return;
        ctx.globalAlpha = A0 * Math.min(1, fade * 1.6);
        ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = "round"; ctx.lineWidth = Math.max(0.8, 1.35 * s);
        if (cheery) {
          const L = d.on(-2.1, -0.9), C = d.on(0, 2.3), Rr = d.on(2.1, -0.9);
          ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(C.x, C.y, Rr.x, Rr.y); ctx.stroke();
        } else if (blink) {
          const L = d.on(-2.2, 0), C = d.on(0, -1.8), Rr = d.on(2.2, 0);
          ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(C.x, C.y, Rr.x, Rr.y); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.ellipse(d.e.x, d.e.y, d.e.rx, d.e.ry, d.e.ang, 0, Math.PI * 2); ctx.fill();
          if (fade > 0.3) {
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath(); ctx.arc(d.e.x + d.e.rx * 0.32, d.e.y - d.e.ry * 0.4, Math.max(0.5, 1.1 * s * fade), 0, Math.PI * 2); ctx.fill();
          }
        }
      });
      // mouth
      const m = disc([0.95, 0, -0.33], 2.2, 2.5);
      if (facing(m.n) && edgeFade(m.n) > 0.2) {
        ctx.globalAlpha = A0 * Math.min(1, edgeFade(m.n) * 1.6);
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.8, 1.6 * s); ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (o.oops > 0) { const c = m.on(0, -0.6); ctx.beginPath(); ctx.arc(c.x, c.y, 1.3 * s, 0, Math.PI * 2); ctx.stroke(); }
        else if (o.focus) { const L = m.on(-1.2, 0), Rr = m.on(1.2, 0); ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(Rr.x, Rr.y); ctx.stroke(); }
        else if (special) {
          // open smile with a tiny pink tongue
          const L = m.on(-2.36, 0.3), Rr = m.on(2.36, 0.3), T = m.on(0, -0.5), B1 = m.on(2.36, -3.5), B2 = m.on(-2.36, -3.5);
          const mouth = () => { ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(T.x, T.y, Rr.x, Rr.y); ctx.bezierCurveTo(B1.x, B1.y, B2.x, B2.y, L.x, L.y); ctx.closePath(); };
          mouth(); ctx.fillStyle = INK; ctx.fill();
          ctx.save(); mouth(); ctx.clip();
          const tg = m.on(0, -2.6);
          ctx.fillStyle = "#FF8FA8"; ctx.beginPath(); ctx.ellipse(tg.x, tg.y, 1.75 * s, 1.4 * s, m.e.ang, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          ctx.lineWidth = Math.max(0.6, 0.9 * s); mouth(); ctx.stroke();
        } else {
          const L = m.on(-1.6, 0.4), C = m.on(0, -1.6), Rr = m.on(1.6, 0.4);
          ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(C.x, C.y, Rr.x, Rr.y); ctx.stroke();
        }
      }
      ctx.restore();
    }

    parts.sort((a, b) => b.d - a.d);
    parts.forEach(p => p.draw());
  }


  // ---------- bee: colors and the easy-to-use draw call ----------
  // Our bee plus her six friends (approved colors from bee-color-guide-v1)
  const BEE_PALETTES = {
    ours:       { name: "Our bee",    top: "#FFF371", bot: "#FFC921", stripe: "#E58E00", wingFront: "255, 228, 242", cheek: "255, 100, 132" },
    pink:       { name: "Pink",       top: "#FFE2F3", bot: "#FFC4E5", stripe: "#E987B3", wingFront: "255, 238, 246", cheek: "255, 90, 140" },
    mint:       { name: "Mint",       top: "#C8FDF4", bot: "#73DEC7", stripe: "#00B59F", wingFront: "236, 252, 248", cheek: "255, 110, 140" },
    lavender:   { name: "Lavender",   top: "#FCE6FF", bot: "#D6B7FC", stripe: "#A881E3", wingFront: "244, 236, 255", cheek: "255, 110, 150" },
    blue:       { name: "Blue",       top: "#D7F3FF", bot: "#67AEEF", stripe: "#307BD0", wingFront: "232, 243, 255", cheek: "255, 120, 150" },
    peach:      { name: "Peach",      top: "#FFE9CB", bot: "#FDAC73", stripe: "#DF7242", wingFront: "255, 236, 228", cheek: "255, 100, 120" },
    strawberry: { name: "Strawberry", top: "#FFE3DC", bot: "#F87D7C", stripe: "#C6515B", wingFront: "255, 232, 238", cheek: "255, 196, 206" }
  };
  // Bee pose (all optional):
  //   t        the game's clock in seconds (drives buzzing, blinking and bobbing)
  //   ph       a number that makes this bee move a little differently from others (0 for our bee)
  //   flying   in the air (wings buzz, legs tuck)          tuck / seat: 0..1 blends for legs
  //   lift     how high her center is above (x, y), in bee units (12.5 = sitting on it)
  //   wiggle   0..1 happy wiggle (also gives happy eyes)    happy: >0 open smile with happy eyes
  //   squish   0..1 crouch while winding up                 focus: concentrating mouth
  //   oops     >0 a little "oh!" mouth                       speed: forward speed (tilts her nose down)
  //   pal      a color name ("ours", "pink", "mint", "lavender", "blue", "peach", "strawberry") or a color set
  //   shadow   true draws her shadow on the ground at (x, y)
  //   flap, blink, bob: leave out to let the library animate them
  function beeDraw(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    ctx = c; reduceMotion = settings.reduceMotion;
    const t = pose.t || 0, ph = pose.ph || 0, flying = !!pose.flying;
    const tuck = pose.tuck != null ? pose.tuck : (flying ? 1 : 0), seat = pose.seat != null ? pose.seat : (flying ? 0 : 1);
    const lift = pose.lift != null ? pose.lift : SEAT_GROUND;
    let pal = pose.pal;
    if (typeof pal === "string") pal = BEE_PALETTES[pal];
    pal = pal || BEE_PALETTES.ours;
    if (pose.shadow) {
      const sh = clamp(1 - (lift - SEAT_GROUND) / 140, 0.55, 1);
      ctx.fillStyle = `rgba(60, 100, 50, ${0.24 * sh})`;
      ctx.beginPath(); ctx.ellipse(x, y + 1 * s, 16 * s * sh, 16 * s * sh * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); ctx.fill();
    }
    const bob = pose.bob === false || reduceMotion ? 0 : Math.sin(t * 3 + ph) * (flying ? 3 : 1.2) * (1 - seat * 0.85);
    let flap = pose.flap;
    if (flap == null) flap = reduceMotion ? (flying ? 0.3 : 0.06) : flying ? (0.5 - 0.5 * Math.cos(t * 34 + ph)) * 1.32
      : (Math.sin(t * 1.3 + ph) > 0.93 ? (0.5 - 0.5 * Math.cos(t * 26)) * 0.54 : 0.06 + 0.05 * Math.sin(t * 2 + ph));
    const blink = pose.blink != null ? !!pose.blink : ((t + ph) % 3.6 + 3.6) % 3.6 < 0.12;
    const oy = y - (lift - bob) * s;
    drawBee3D(x, oy, s, yaw, pitch, {
      t, ph, flap, flying, tuck, seat, squish: pose.squish || 0, wiggle: pose.wiggle || 0, happy: pose.happy || 0,
      blink, focus: !!pose.focus, oops: pose.oops || 0, speed: pose.speed || 0, pal
    });
    return { x, y: oy };   // her center on screen
  }

  // ================= the 3D bunny: approved master design (bunny-game-prototype-v8) =================
  // Built from soft, shaded 3D shapes: a round body, a head with cheeks, long ears, big hind feet,
  // little front paws and a cotton tail. Her own directions: x = forward (toward her nose),
  // y = her right side, z = up, in "bunny units" (she's about 30 long). z = 0 is the ground.
  const FUR_HI = "#FFFFFF", FUR = "#FFF7F0", FUR_SHADE = "#EEDBD6", EAR_IN = "#FFC4D6", NOSE = "#FF9AB6", BUN_INK = "#3B2D55";
  function buildBunny(o) {
    const parts = [], time = o.t;
    const st = o.stretch, up = o.up, fl = o.flop, sq = o.squash;
    let cur = { M: M3.mul(M3.scale(1 + sq * 0.1 + fl * 0.1, 1 + sq * 0.1 + fl * 0.08, (1 - sq * 0.14) * (1 - fl * 0.28)), M3.rotX(o.roll || 0)), t: [0, 0, 0] };
    const stack = [];
    const push = (pivot, R) => {
      stack.push(cur);
      const M = M3.mul(cur.M, R), Rp = M3.app(R, pivot), d = [pivot[0] - Rp[0], pivot[1] - Rp[1], pivot[2] - Rp[2]], Md = M3.app(cur.M, d);
      cur = { M, t: [Md[0] + cur.t[0], Md[1] + cur.t[1], Md[2] + cur.t[2]] };
    };
    const pop = () => { cur = stack.pop(); };
    const W = p => { const q = M3.app(cur.M, p); return [q[0] + cur.t[0], q[1] + cur.t[1], q[2] + cur.t[2]]; };
    const Wn = n => norm3(M3.app(cur.M, n));
    const blob = (c, size, look, R, extra) => parts.push(Object.assign({ kind: "blob", c: W(c), A: M3.mul(M3.mul(cur.M, R || M3.I()), M3.scale(size[0], size[1], size[2])), look }, extra || {}));
    const disc = (c, n, size, look, extra) => {
      const nn = Wn(n), Q = M3.fromNormal(nn);
      parts.push(Object.assign({ kind: "blob", flat: true, c: W(c), n: nn, t1: [Q[1], Q[4], Q[7]], t2: [Q[2], Q[5], Q[8]], size, A: M3.mul(Q, M3.scale(size[0], size[1], size[2])), look }, extra || {}));
    };
    // hind feet (big and long; they kick back when she hops)
    [-1, 1].forEach(side => {
      push([-2 - st * 9, side * 5.2, 1.4 + st * 2], M3.rotY(-0.5 * st));
      blob([-2 - st * 9, side * 5.2, 1.4 + st * 2], [7.2, 2.5, 1.5], "fur");
      pop();
    });
    // haunches (her round back legs)
    [-1, 1].forEach(side => blob([-6 - st * 2, side * 5.8, 6.4], [7.6, 3.9, 6.3], "fur", null, { alt: true }));
    // cotton tail: one round, fluffy ball
    const tz = 9.5 + up * 1.5, tx = -14 - st * 1.5 + up * 2;
    blob([tx, 0, tz], [4.2, 4.2, 4.2], "tail");
    // front paws: on the ground, washing her face, or holding a carrot up to her mouth
    const holding = o.carrot !== null && o.carrot !== undefined;
    const groomT = o.groom > 0 && !reduceMotion ? Math.sin(time * 9) : 0;
    const paws = [-1, 1].map(side => {
      let p = [8 + st * 4, side * 3, 1.6 + st * 3];
      const upP = [7.5, side * 2.3, 10.5], gP = [10.5, side * 2.5, 15 + side * groomT * 1.2];
      const u = holding ? 1 : up;
      p = p.map((v, i) => lerp(v, upP[i], u));
      if (!holding && o.groom > 0.05) p = p.map((v, i) => lerp(v, gP[i], o.groom));
      return p;
    });
    paws.forEach(p => blob(p, [2.7, 1.9, 1.8], "fur"));
    // ---- upper body: tips up from the hip when she sits up ----
    push([-6, 0, 3], M3.rotY(0.62 * up));
    const shoulders = [-1, 1].map(side => W([6.5, side * 3.1, 7.5]));
    blob([-2, 0, 9.5], [12.6 * (1 + st * 0.12), 9, 9.2], "fur");          // body: a round loaf
    blob([5, 0, 10], [7.2, 7, 7.6], "fur");                                  // chest
    // ---- head: stays level when she sits up; turns a little when she looks around ----
    const neck = [6, 0, 14];
    push(neck, M3.mul(M3.rotZ(o.look * 0.55), M3.rotY(-0.5 * up + (o.groom > 0.05 ? -0.15 * o.groom : 0))));
    const HC = [9, 0, 17.5], HR = [7.2, 6.9, 6.9];
    blob(HC, HR, "fur", null, { id: "head" });
    const ch = 1 + o.chew * 0.2;
    [-1, 1].forEach(side => {
      // cheeks: wide, soft, gentle lumps that barely rise off her face and melt into it at the edges.
      // Each is a round shape sunk almost all the way into her head, so only a low bump shows, and it
      // looks round from every angle (never a thin sliver).
      // Where the cheek sits: the same spot as v7, but now worked out exactly on the surface of her head.
      // (In v7 the spot was a little outside her head, so the cheeks rose about 1.25 units; now they rise 0.6, half as much.)
      const cd = [5.2, side * 4.53, -3.71];                              // same spot as v7, measured from the middle of her head
      const cn = 1 / Math.hypot(cd[0] / HR[0], cd[1] / HR[1], cd[2] / HR[2]);
      const surf = [HC[0] + cd[0] * cn, HC[1] + cd[1] * cn, HC[2] + cd[2] * cn];   // exactly on her head
      const cu = norm3([cd[0] / (HR[0] * HR[0]), cd[1] / (HR[1] * HR[1]), cd[2] / (HR[2] * HR[2])]);   // straight out from her face there
      const CR = 2.9 * ch;                                               // cheek size (same as v7)
      const RISE = 0.6;                                                  // how far the middle of each cheek rises off her face
      const cc = [surf[0] - cu[0] * (CR - RISE), surf[1] - cu[1] * (CR - RISE), surf[2] - cu[2] * (CR - RISE)];
      parts.push({ kind: "blob", c: W(cc), A: M3.mul(cur.M, M3.scale(CR * 0.9, CR, CR * 0.85)), look: "cheek", id: "cheek" + side, n: Wn(cu), needFacing: true, bias: -3, clip: "head" });   // kept inside her head's outline, so it only shows as a gentle swell
      // a soft rosy glow in the middle of each cheek
      const bc = [surf[0] - cu[0] * 0.3, surf[1] - cu[1] * 0.3, surf[2] - cu[2] * 0.3];
      parts.push({ kind: "blob", c: W(bc), A: M3.mul(cur.M, M3.scale(1.4, 1.7, 1.25)), look: "blush", n: Wn(cu), needFacing: true, bias: -3.2, clip: "head" });
      // eyes: round and dark with a sparkle
      const en = norm3([0.74, side * 0.52, 0.44]);
      const ep = [HC[0] + en[0] * HR[0] * 0.995, HC[1] + en[1] * HR[1] * 0.995, HC[2] + en[2] * HR[2] * 0.995];
      disc(ep, en, [0.08, 1.3, 1.65], "eye", { kind: "eye", bias: -0.3, clip: "head" });
      // whiskers
      const w0 = W([15, side * 2.2, 14.3]);
      [[5, 1.2], [5.6, -0.2], [5, -1.5]].forEach(([len, dz]) => parts.push({ kind: "line", a: w0, b: W([15 + len * 0.35, side * (2.2 + len), 14.3 + dz]), look: "whisker", bias: -0.1 }));
    });
    // twitchy pink nose and a tiny mouth
    const tw = reduceMotion ? 0 : (((time * 0.8) % 1) < 0.4 || o.chew > 0 ? Math.sin(time * 38) : 0);
    disc([15.9, 0, 15.6], [1, 0, 0.1], [0.5, 1.35, 1.0 * (1 + tw * 0.2)], "nose", { bias: -0.3 });
    parts.push({ kind: "mouth", c: W([15.6, 0, 13.7]), l: W([15.2, -1.3, 13.1 - o.chew * 0.5]), r: W([15.2, 1.3, 13.1 - o.chew * 0.5]), n: Wn([1, 0, -0.2]), bias: -0.2 });
    // ears: long and soft, pink inside; they tip back when she hops or naps and flick now and then
    const flick = o.earFlick > 0 && !reduceMotion ? Math.sin(o.earFlick * Math.PI * 3) * 0.4 * o.earFlick : 0;
    const earBack = 0.12 + st * 0.55 + fl * 1.15 - up * 0.1;
    [-1, 1].forEach(side => {
      const base = [7.2, side * 2.7, 22.5];
      const f = side === o.earFlickSide ? flick : 0;
      push(base, M3.mul(M3.mul(M3.rotY(earBack + f), M3.rotX(-side * (0.2 + o.look * 0.1 * side))), M3.rotZ(side * 0.5)));
      blob([7.2, side * 2.7, 22.5 + 8.4], [1.2, 2.9, 8.8], "fur", null, { alt: true });
      parts.push({ kind: "blob", c: W([7.2 + 0.95, side * 2.7, 22.5 + 8.1]), A: M3.mul(cur.M, M3.scale(0.3, 1.45, 6.3)), look: "earIn", n: Wn([1, 0, 0]), needFacing: true });
      pop();
    });
    const mouthW = W([15.4, 0, 13.4]);
    pop(); // head
    pop(); // upper body
    // front legs: a soft, rounded leg from each shoulder down to its little paw
    [0, 1].forEach(i => {
      const a = shoulders[i], b = W(paws[i]);
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]) || 1;
      const Q = M3.fromNormal([d[0] / len, d[1] / len, d[2] / len]);
      parts.push({ kind: "blob", c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], A: M3.mul(Q, M3.scale(len / 2 + 0.9, 2.05, 2.05)), look: "fur", bias: 0.3 });
    });
    // the carrot she's munching: held in her paws, tip at her mouth, shorter with every bite
    if (holding) {
      const pmW = W([(paws[0][0] + paws[1][0]) / 2, 0, (paws[0][2] + paws[1][2]) / 2]);
      const dir = norm3([pmW[0] - mouthW[0], pmW[1] - mouthW[1], pmW[2] - mouthW[2]]);
      const base = [pmW[0] + dir[0] * 3, pmW[1] + dir[1] * 3, pmW[2] + dir[2] * 3];
      const tip = [lerp(base[0], mouthW[0], o.carrot), lerp(base[1], mouthW[1], o.carrot), lerp(base[2], mouthW[2], o.carrot)];
      parts.push({ kind: "carrot", base, tip, dir, left: o.carrot, bias: -2 });
    }
    return { parts, mouth: mouthW };
  }
  const BUN_LOOKS = {
    fur: [FUR_HI, FUR, FUR_SHADE],
    tail: ["#FFFFFF", "#FFFFFF", "#F2E6EA"],
    earIn: ["#FFD8E4", EAR_IN, "#F5AFC5"],
    nose: ["#FFC2D4", NOSE, "#F07FA0"]
  };
  // v4: bunny friend colors. Each one: fur (light, middle, shadow), tail, and optionally
  // alt = a second fur color on her ears and back legs (spotted / oreo). Inside ears and nose stay pink.
  // cheek = the soft light on her cheek swells ([r,g,b] of the light, [r,g,b] of the edge).
  const BUNNY_PALETTES = Object.freeze({
    ours:     { fur: [FUR_HI, FUR, FUR_SHADE],             tail: ["#FFFFFF", "#FFFFFF", "#F2E6EA"], cheek: [[255, 255, 255], [255, 249, 244], [240, 224, 218]] },
    caramel:  { fur: ["#FFF1DE", "#F2CFA3", "#D9A876"],    tail: ["#FFFFFF", "#FFF6EA", "#F0DCC4"], cheek: [[255, 246, 232], [248, 222, 188], [222, 180, 138]] },
    gray:     { fur: ["#FBFAFD", "#DCDAE3", "#B8B5C4"],    tail: ["#FFFFFF", "#FFFFFF", "#E6E4EC"], cheek: [[255, 255, 255], [232, 230, 238], [196, 192, 208]] },
    cocoa:    { fur: ["#EFD8C6", "#CDA487", "#A67D61"],    tail: ["#FFFFFF", "#FBF1EA", "#E6D2C4"], cheek: [[246, 226, 210], [214, 176, 150], [176, 136, 108]] },
    spotted:  { fur: [FUR_HI, FUR, FUR_SHADE],             tail: ["#FFFFFF", "#FFFFFF", "#F2E6EA"], cheek: [[255, 255, 255], [255, 249, 244], [240, 224, 218]],
                alt: ["#FBE2C2", "#EDC291", "#D29D69"] },
    oreo:     { fur: ["#FFFFFF", "#FBF9F8", "#E6E0E0"],    tail: ["#FFFFFF", "#FFFFFF", "#EEE8E8"], cheek: [[255, 255, 255], [252, 250, 249], [232, 226, 226]],
                alt: ["#E3C9B6", "#BE9478", "#946C52"] },
    pink:     { fur: ["#FFF6F9", "#FFD9E6", "#F2B6CA"],    tail: ["#FFFFFF", "#FFF4F8", "#F6DCE6"], cheek: [[255, 250, 252], [255, 228, 238], [240, 190, 208]] },
    lavender: { fur: ["#FAF6FF", "#E3D6F7", "#C3B1E4"],    tail: ["#FFFFFF", "#FAF6FF", "#E6DDF4"], cheek: [[252, 250, 255], [234, 224, 250], [200, 184, 232]] },
    mint:     { fur: ["#F4FFFA", "#D2F2E3", "#A9D9C4"],    tail: ["#FFFFFF", "#F4FFFA", "#DAF0E6"], cheek: [[250, 255, 252], [222, 246, 234], [178, 220, 200]] }
  });
  let bunPal = BUNNY_PALETTES.ours;
  function drawBunny3D(x, y, s, yaw, pitch, o) {
    const { parts, mouth } = buildBunny(o);
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const P = [sy, cy, 0, -cy * sp, sy * sp, -cp];
    const scr = v => ({ x: x + (v[0] * sy + v[1] * cy) * s, y: y + (-(v[2] * cp) - (v[0] * cy - v[1] * sy) * sp) * s });
    const depth = v => (v[0] * cy - v[1] * sy) * cp - v[2] * sp;
    const facing = n => depth(n) < -0.05;
    parts.forEach(p => { const c = p.c || p.base || p.a; p.d = depth(c) + (p.bias || 0); });
    parts.sort((a, b) => b.d - a.d);
    const ellipseOf = p => {
      const A = p.A, a = new Array(6);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) a[r * 3 + k] = P[r * 3] * A[k] + P[r * 3 + 1] * A[3 + k] + P[r * 3 + 2] * A[6 + k];
      const s11 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2], s22 = a[3] * a[3] + a[4] * a[4] + a[5] * a[5], s12 = a[0] * a[3] + a[1] * a[4] + a[2] * a[5];
      const m = (s11 + s22) / 2, dd = Math.sqrt(Math.max(0, ((s11 - s22) / 2) ** 2 + s12 * s12));
      const q = scr(p.c);
      return { x: q.x, y: q.y, rx: Math.sqrt(m + dd) * s, ry: Math.sqrt(Math.max(0, m - dd)) * s, ang: 0.5 * Math.atan2(2 * s12, s11 - s22) };
    };
    const closed = o.flop > 0.5 || o.groom > 0.5;
    const named = {};
    parts.forEach(p => { if (p.id) named[p.id] = ellipseOf(p); });
    const clipTo = id => { const e = named[id]; if (!e) return; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, Math.max(e.ry, 0.3), e.ang, 0, Math.PI * 2); ctx.clip(); };
    const edgeFade = n => clamp((-depth(n) - 0.05) / 0.35, 0, 1);
    parts.forEach(p => {
      if (p.kind === "blob") {
        if ((p.flat || p.needFacing) && !facing(p.n)) return;
        const e = ellipseOf(p);
        if (e.rx < 0.05) return;
        if (p.look === "blush") {
          ctx.save(); if (p.clip) clipTo(p.clip);
          ctx.globalAlpha *= edgeFade(p.n);
          ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.scale(1, Math.max(e.ry, 0.3) / e.rx);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, e.rx);
          g.addColorStop(0, "rgba(255, 140, 180, 0.6)"); g.addColorStop(0.55, "rgba(255, 150, 185, 0.38)"); g.addColorStop(1, "rgba(255, 160, 190, 0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, e.rx, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          return;
        }
        if (p.look === "cheek") {
          ctx.save(); if (p.clip) clipTo(p.clip);
          ctx.translate(e.x, e.y); ctx.rotate(e.ang); ctx.scale(1, Math.max(e.ry, 0.3) / e.rx);
          const g = ctx.createRadialGradient(-e.rx * 0.2, -e.rx * 0.3, 0, 0, 0, e.rx);
          // half the light and shadow of v7, so the swell looks half as tall
          const ck = bunPal.cheek || BUNNY_PALETTES.ours.cheek;
          g.addColorStop(0, `rgba(${ck[0]}, 0.5)`); g.addColorStop(0.5, `rgba(${ck[1]}, 0.42)`);
          g.addColorStop(0.82, `rgba(${ck[2]}, 0.18)`); g.addColorStop(1, `rgba(${ck[2]}, 0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, e.rx, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          return;
        }
        const L = p.look === "tail" ? bunPal.tail : (p.look === "fur" || !BUN_LOOKS[p.look]) ? (p.alt && bunPal.alt ? bunPal.alt : bunPal.fur) : BUN_LOOKS[p.look];
        const R = Math.max(e.rx, e.ry);
        const g = ctx.createRadialGradient(e.x - R * 0.3, e.y - R * 0.38, R * 0.05, e.x, e.y, R * 1.15);
        g.addColorStop(0, L[0]); g.addColorStop(0.5, L[1]); g.addColorStop(1, L[2]);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, Math.max(e.ry, 0.3), e.ang, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === "eye") {
        if (!facing(p.n)) return;
        const e = ellipseOf(p);
        const fade = edgeFade(p.n);
        const on = (u, v) => scr([p.c[0] + p.t1[0] * u + p.t2[0] * v, p.c[1] + p.t1[1] * u + p.t2[1] * v, p.c[2] + p.t1[2] * u + p.t2[2] * v]);
        const sw = p.size[1], sh = p.size[2];
        const lines = (o.happy > 0 && !closed) || closed || o.blink < 0;
        if (fade < (lines ? 0.42 : 0.12)) return;
        ctx.save(); clipTo(p.clip);
        ctx.globalAlpha *= Math.min(1, fade * 1.6);
        ctx.strokeStyle = BUN_INK; ctx.fillStyle = BUN_INK; ctx.lineCap = "round"; ctx.lineWidth = Math.max(0.7, 0.34 * s);
        if (o.happy > 0 && !closed) {
          const L = on(-sw * 0.95, -sh * 0.1), C = on(0, sh * 1.1), Rr = on(sw * 0.95, -sh * 0.1);
          ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(C.x, C.y, Rr.x, Rr.y); ctx.stroke();
        } else if (closed || o.blink < 0) {
          const L = on(-sw * 0.95, 0), C = on(0, -sh * 0.75), Rr = on(sw * 0.95, 0);
          ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(C.x, C.y, Rr.x, Rr.y); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx, Math.max(e.ry, 0.3), e.ang, 0, Math.PI * 2); ctx.fill();
          if (fade > 0.35) {
            const hl = on(sw * 0.3, sh * 0.42);
            ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(hl.x, hl.y, Math.max(0.5, sh * 0.3 * s * fade), 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
      } else if (p.kind === "mouth") {
        if (depth(p.n) > -0.15) return;
        const c = scr(p.c), l = scr(p.l), r = scr(p.r);
        ctx.strokeStyle = "rgba(59, 45, 85, 0.7)"; ctx.lineWidth = Math.max(0.6, 0.32 * s); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.quadraticCurveTo((l.x + c.x) / 2, c.y + 0.6 * s, c.x, c.y); ctx.quadraticCurveTo((r.x + c.x) / 2, c.y + 0.6 * s, r.x, r.y); ctx.stroke();
      } else if (p.kind === "line") {
        const a = scr(p.a), b = scr(p.b);
        ctx.strokeStyle = "rgba(160, 130, 170, 0.45)"; ctx.lineWidth = Math.max(0.4, 0.2 * s);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (p.kind === "carrot") {
        const B = scr(p.base), T = scr(p.tip);
        const lf = scr([p.base[0] + p.dir[0] * 4, p.base[1] + p.dir[1] * 4, p.base[2] + p.dir[2] * 4]);
        const la = Math.atan2(lf.y - B.y, lf.x - B.x);
        ctx.fillStyle = "#6CBF74";
        [-0.5, 0, 0.5].forEach(o2 => { ctx.beginPath(); ctx.ellipse(B.x + Math.cos(la + o2) * 2.2 * s, B.y + Math.sin(la + o2) * 2.2 * s, 2.6 * s, 0.6 * s, la + o2, 0, Math.PI * 2); ctx.fill(); });
        const dx = T.x - B.x, dy = T.y - B.y, L = Math.hypot(dx, dy);
        if (L > 0.5) {
          const nx = -dy / L, ny = dx / L, wb = 1.4 * s, wt = lerp(0.3, 1.2, 1 - p.left) * s;
          const g = ctx.createLinearGradient(B.x - nx * wb, B.y - ny * wb, B.x + nx * wb, B.y + ny * wb);
          g.addColorStop(0, "#FFB46B"); g.addColorStop(1, "#F2803A");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(B.x - nx * wb, B.y - ny * wb);
          ctx.quadraticCurveTo(B.x - dx / L * wb, B.y - dy / L * wb, B.x + nx * wb, B.y + ny * wb);
          ctx.lineTo(T.x + nx * wt, T.y + ny * wt); ctx.lineTo(T.x - nx * wt, T.y - ny * wt);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = "rgba(200, 90, 40, 0.45)"; ctx.lineWidth = Math.max(0.4, 0.2 * s);
          for (let i = 1; i < 4; i++) { const u = i / 4; ctx.beginPath(); ctx.moveTo(B.x + dx * u - nx * wb * 0.6, B.y + dy * u - ny * wb * 0.6); ctx.lineTo(B.x + dx * u + nx * wb * 0.2, B.y + dy * u + ny * wb * 0.2); ctx.stroke(); }
          if (p.left < 1) { ctx.fillStyle = "#FFD3A6"; ctx.beginPath(); ctx.ellipse(T.x, T.y, wt, wt * 0.5, Math.atan2(dy, dx) + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); }   // the bitten end
        }
      }
    });
    return scr(mouth);
  }
  // Bunny pose (all optional):
  //   t          the game's clock in seconds (drives blinking, nose twitch and grooming)
  //   stretch    0..1 mid-hop stretch (feet kick back, ears tip back)
  //   up         0..1 sitting up          flop: 0..1 lying down for a nap (eyes close)
  //   groom      0..1 washing her face     chew: 0..1 cheeks puff
  //   squash     0..1 landing squish       happy: >0 happy eyes
  //   earFlick   0..1 an ear flick (earFlickSide: 1 or -1)   look: -1..1 turns her head
  //   carrot     null, or 1 (whole) down to 0 (eaten) when she holds one to munch
  //   roll       a little side-to-side wiggle (radians)
  //   blink      leave out to let the library blink her; a number below 0 means eyes shut
  //   shadow     true draws her shadow on the ground at (x, y)
  //   pal        v4: a friend color name ("ours", "caramel", "gray", "cocoa", "spotted", "oreo", "pink",
  //              "lavender", "mint") or a color set like those. Leave out for Nee Nee.
  //   ears       v4: { left, right, len } for bunny friends. left / right: "up" (like Nee Nee), "bent" (the top
  //              folds forward over the front) or "lop" (curves over and hangs beside her face).
  //              len: ear length, 1 = Nee Nee's (friends about 0.8 to 1.15). wide: ear width, 1 = Nee Nee's
  //              (up to about 1.4 for short, fat ears). Leave out for Nee Nee.
  //   (the no-WebGL fallback bunny shows the colors, but not the ear styles)
  // Returns where her mouth is on screen (for crumbs).
  function bunnyDraw(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    // v4: the approved smooth bunny (WebGL). Falls back to the parts bunny below if the device can't.
    if (BUNNY_GL && !root.__bunnyForce2D) {
      let p0 = pose.pal;
      if (typeof p0 === "string") p0 = BUNNY_PALETTES[p0];
      const got = BUNNY_GL(c, x, y, s, yaw, pitch, Object.assign({}, pose, { pal: p0 && p0.fur ? p0 : BUNNY_PALETTES.ours }));
      if (got) return got;
    }
    ctx = c; reduceMotion = settings.reduceMotion;
    const t = pose.t || 0, ph = pose.ph || 0;
    if (pose.shadow) {
      ctx.fillStyle = "rgba(60, 100, 50, 0.24)";
      ctx.beginPath(); ctx.ellipse(x, y, 17 * s, 17 * s * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); ctx.fill();
    }
    const blink = pose.blink != null ? pose.blink : (((t + ph) % 3.9 + 3.9) % 3.9 < 0.13 ? -1 : 1);
    let pal = pose.pal;
    if (typeof pal === "string") pal = BUNNY_PALETTES[pal];
    bunPal = pal && pal.fur ? pal : BUNNY_PALETTES.ours;
    return drawBunny3D(x, y, s, yaw, pitch, {
      t, stretch: pose.stretch || 0, up: pose.up || 0, flop: pose.flop || 0, groom: pose.groom || 0, chew: pose.chew || 0,
      squash: pose.squash || 0, blink, happy: pose.happy || 0, earFlick: pose.earFlick || 0, earFlickSide: pose.earFlickSide || 1,
      look: pose.look || 0, carrot: pose.carrot == null ? null : pose.carrot, roll: pose.roll || 0
    });
  }

  // the smooth bunny (approved Sept 30, 2026) is defined in its own block above this one
  const BUNNY_GL = root.__lilyBunnyGLV4;
  try { delete root.__lilyBunnyGLV4; } catch (_) { root.__lilyBunnyGLV4 = undefined; }
  // the frog is defined in its own block above this one
  const FROG = root.__lilyFrogV3;
  try { delete root.__lilyFrogV3; } catch (_) { root.__lilyFrogV3 = undefined; }

  root.LilyCreatures = Object.freeze({
    version: VERSION,
    settings,                                   // settings.reduceMotion can be changed by a game
    names: ["bee", "bunny", "frog"],
    bee: Object.freeze({ draw: beeDraw, colors: BEE_PALETTES, SEAT: SEAT_GROUND, length: 36 }),
    bunny: Object.freeze({ draw: bunnyDraw, colors: BUNNY_PALETTES, earStyles: Object.freeze(["up", "bent", "lop"]), length: 30 }),
    frog: FROG
  });
})(typeof window !== "undefined" ? window : globalThis);
