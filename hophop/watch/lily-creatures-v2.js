/*
  Lily Studio Creature Library, version 2
  ----------------------------------------
  One master design for every Lily Studio creature. Every game, Watch page and video loads this
  one file, so all the creatures live in the same world and look the same everywhere.

  Creatures in v2:
    bee    Our bee in 3D (approved Sept 28, 2026, bee-3d-preview-v2), plus her six friend colors.
    bunny  The cream bunny in 3D. APPROVED MASTER DESIGN (Jessica, Sept 28, 2026), from
           bunny-game-prototype-v8: soft, low cheek swells with a rosy glow, connected front legs,
           small eyes set flat on her face, one round cotton-ball tail.

  What changed from v1: only the bunny's cheeks (v6 small round cheeks -> v8 soft, low swells).

  How a game uses it:
    <script src="lily-creatures-v2.js"></script>
    LilyCreatures.bee.draw(ctx, x, y, s, yaw, pitch, pose);
    LilyCreatures.bunny.draw(ctx, x, y, s, yaw, pitch, pose);

    x, y   the screen point on the ground (or perch) right under the creature
    s      screen pixels per creature unit (bee: her body is 36 units long; bunny: about 30)
    yaw    which way she faces compared to the camera: 0 = away from you, PI = toward you,
           PI/2 = toward the right side of the screen, -PI/2 = toward the left
    pitch  how much the camera looks down on her (0 = level, about 0.3 = a little above)
    pose   what she's doing (see each creature below). Anything left out uses a calm default.

  Rules:
    - Never edit a published version. Changes go into a new file (lily-creatures-v3.js), and each
      game switches to the new version on purpose, one at a time.
    - The library only draws. Each game keeps its own movement, sounds and world.
*/
(function (root) {
  "use strict";
  const VERSION = "2";
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
    [-1, 1].forEach(side => blob([-6 - st * 2, side * 5.8, 6.4], [7.6, 3.9, 6.3], "fur"));
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
      blob([7.2, side * 2.7, 22.5 + 8.4], [1.2, 2.9, 8.8], "fur");
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
          g.addColorStop(0, "rgba(255, 255, 255, 0.5)"); g.addColorStop(0.5, "rgba(255, 249, 244, 0.42)");
          g.addColorStop(0.82, "rgba(240, 224, 218, 0.18)"); g.addColorStop(1, "rgba(240, 224, 218, 0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, e.rx, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          return;
        }
        const L = BUN_LOOKS[p.look] || BUN_LOOKS.fur;
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
  // Returns where her mouth is on screen (for crumbs).
  function bunnyDraw(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    ctx = c; reduceMotion = settings.reduceMotion;
    const t = pose.t || 0, ph = pose.ph || 0;
    if (pose.shadow) {
      ctx.fillStyle = "rgba(60, 100, 50, 0.24)";
      ctx.beginPath(); ctx.ellipse(x, y, 17 * s, 17 * s * clamp(0.25 + pitch * 0.8, 0.2, 0.7), 0, 0, Math.PI * 2); ctx.fill();
    }
    const blink = pose.blink != null ? pose.blink : (((t + ph) % 3.9 + 3.9) % 3.9 < 0.13 ? -1 : 1);
    return drawBunny3D(x, y, s, yaw, pitch, {
      t, stretch: pose.stretch || 0, up: pose.up || 0, flop: pose.flop || 0, groom: pose.groom || 0, chew: pose.chew || 0,
      squash: pose.squash || 0, blink, happy: pose.happy || 0, earFlick: pose.earFlick || 0, earFlickSide: pose.earFlickSide || 1,
      look: pose.look || 0, carrot: pose.carrot == null ? null : pose.carrot, roll: pose.roll || 0
    });
  }

  root.LilyCreatures = Object.freeze({
    version: VERSION,
    settings,                                   // settings.reduceMotion can be changed by a game
    names: ["bee", "bunny"],
    bee: Object.freeze({ draw: beeDraw, colors: BEE_PALETTES, SEAT: SEAT_GROUND, length: 36 }),
    bunny: Object.freeze({ draw: bunnyDraw, length: 30 })
  });
})(typeof window !== "undefined" ? window : globalThis);
