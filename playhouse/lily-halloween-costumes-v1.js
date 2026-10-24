/*
  Lily Studio · Halloween Costumes for Hop Hop and his friends (2D) + the Black Cat Witch · version 1
  -------------------------------------------------------------------------------------------------
  Website copy: the same code as the approved library, with only these header notes shortened.

  Needs lily-frog-friends-2d-v1.js loaded first (window.LilyFrogFriends2D). That file is never edited:
  every costume is drawn AROUND the friend (a back layer before him, a front layer after him).

  WHO WEARS WHAT (LilyHalloweenCostumes.WHO):
    ours (Hop Hop) firefly · mint little pumpkin · blue starry hat · golden little bee · pink party mask
    lavender moon cape · lime (Treetop) little bat · ember cowboy hat · hunter friendly ghost

  DRAWING A FRIEND IN COSTUME (origin = the middle of his feet, 1 unit = 1 frog unit, same as LilyFrogFriends2D):
    LilyHalloweenCostumes.drawFrog(ctx, name, pose, anim)
      pose  = the same pose object you pass to LilyFrogFriends2D.draw (jump, blink, happy, lookX ...)
      anim  = { t: seconds (any running clock), air: true while in the air,
                sec: secondary motion -1..1 (negative while rising, positive while falling, wobble after landing),
                wob: the damped wobble after landing (-1..1), glow: 0 by day .. 1 at night (firefly only) }
      Use LilyHalloweenCostumes.hopMotion({ air, vy, landedAgo }) to get sec and wob from your own jump:
        vy = 1 at take-off .. 0 at the top .. -1 at landing; landedAgo = seconds since the last landing.
    LilyHalloweenCostumes.drawLights(ctx, name, anim)
      The parts that GLOW (Hop Hop's chest and antenna tips). Draw these AFTER your night lighting/darkening,
      at the same transform, so they stay bright at night. (They are drawn by drawFrog too; call drawFrog
      with anim.noLights = true if you draw the lights separately.)

  THE BLACK CAT WITCH (flies across the sky):
    LilyHalloweenCostumes.drawCatWitch(ctx, x, y, size, t, { hat: true|false, flip: false })
      x, y = her middle; size 1 = about 60 px tall (her picture is about 60 x 64 units incl. hat); t = seconds.
      She faces right (flying right). flip: true to fly left.

  THE RULES:
    costumesOn({ date, night })  -> true when costumes show:
        Halloween week: only at NIGHT. Halloween (Oct 31): ALL DAY and ALL NIGHT.
    catWitchFlies({ date })      -> true during Halloween week (she flies by day and by night).
    catWitchHat({ date, night }) -> her hat: off by day, on at night, on all day and night on Oct 31.
    HALLOWEEN_WEEK = { from: [10, 25], to: [10, 31] } (month 10 = October). Change here if the week changes.
*/
(function (root) {
  "use strict";
  const TAU = Math.PI * 2;
  const F2lib = () => root.LilyFrogFriends2D;
  function ell(c, x, y, rx, ry, a = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, TAU); c.fill(); }
  function star(c, x, y, r, n = 4) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }

  // ---------- the friends' costumes (each friend's measurements come from the library's own palette settings) ----------
  function geo(name) { const p = F2lib().palettes[name], T = p.tall, W = p.wide, FD = p.drop;
  return { p, W, T, FD, brx: 23 * W, by: -38 * T + FD * 0.45, bx: 1, off: 10 * p.gap, br: 9.5 * p.bump, ek: p.bump * p.eyeK, leg: p.leg[1] }; }

  const COSTUME = {
    pumpkinCap: { front(c, G, A) {
      const k = G.br / 9.5;
      c.save(); c.translate(G.bx, G.by - G.br - 0.3 - A.sec * 1.8); c.rotate(-0.12 + A.sec * 0.08); c.scale(0.86 * k * Math.max(1, G.off / 10), 0.86 * k);
      const g = c.createLinearGradient(-15, 0, 15, 0); g.addColorStop(0, "#E9792A"); g.addColorStop(0.5, "#FF9A3C"); g.addColorStop(1, "#E9792A");
      c.fillStyle = g; c.beginPath(); c.moveTo(-16, 1); c.bezierCurveTo(-16, -14, 16, -14, 16, 1); c.quadraticCurveTo(0, 4, -16, 1); c.fill();
      c.strokeStyle = "rgba(170,70,20,0.45)"; c.lineWidth = 1.3; c.lineCap = "round";
      [-8, 0, 8].forEach(x => { c.beginPath(); c.moveTo(x * 0.9, -9.5 + Math.abs(x) * 0.25); c.quadraticCurveTo(x * 1.25, -4, x * 1.15, 1.8); c.stroke(); });
      c.fillStyle = "#6E9A4B"; c.beginPath(); c.moveTo(-2, -10); c.quadraticCurveTo(-2.5, -17, 2, -19); c.lineTo(3.4, -17); c.quadraticCurveTo(0.8, -15, 1.6, -10); c.fill();
      c.save(); c.translate(1, -11); c.rotate(Math.sin(A.t * 3.1) * 0.1 + A.sec * 0.25); c.translate(-1, 11); c.fillStyle = "#8CC56B"; c.beginPath(); c.moveTo(1, -11); c.bezierCurveTo(5, -18, 12, -17, 13, -12); c.bezierCurveTo(9, -9, 5, -9, 1, -11); c.fill(); c.restore();
      c.strokeStyle = "#6E9A4B"; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -12); c.bezierCurveTo(-7, -14, -9, -9, -6, -8); c.stroke();
      c.restore(); } },
    // the whole body is a pumpkin (wider than the body, so none of it shows); head and legs stick out
    pumpkinSuit: { front(c, G, A) {
      const B = G.brx, T = G.T, top = -21 * T + G.FD * 0.3;
      c.save();
      // outer lobes rise a little higher, so at the collar the pumpkin is as wide as the body (no green sides showing)
      const lobes = [[-0.74, 0.42, 1.25], [0.74, 0.42, 1.25], [-0.36, 0.44, 1.08], [0.38, 0.44, 1.08], [0.01, 0.42, 1.02]];
      lobes.forEach(([x, rx, h]) => { const cx = 1 + x * B, ry = -top / 2 * h + 0.5, cy = top / 2, R = rx * B;
        const g = c.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, "#E9792A"); g.addColorStop(0.5, "#FF9A3C"); g.addColorStop(1, "#E9792A"); c.fillStyle = g; ell(c, cx, cy + 0.5, R, ry); });
      c.fillStyle = "rgba(150,60,15,0.18)"; ell(c, 1, -1.2, B * 1.02, 2.6);
      c.fillStyle = "#7DBA5A";                                        // a leafy collar under the chin
      const n = 8; for (let i = 0; i < n; i++) { const x = 1 + (i / (n - 1) - 0.5) * B * 1.7; const fl = Math.sin(A.t * 4 + i * 1.3) * 0.8 - A.sec * 1.2; c.beginPath(); c.moveTo(x - 4, top + 0.5); c.quadraticCurveTo(x, top + 5 + (i % 2) * 1.5 + fl, x + 4, top + 0.5); c.quadraticCurveTo(x, top - 1.2, x - 4, top + 0.5); c.fill(); }
      c.fillStyle = G.leg; const fk = G.p.frontK;                   // the front feet, in front of the pumpkin
      ell(c, -6 * G.W, -1, 5 * fk, 2.6 * fk); ell(c, 10 * G.W, -1, 5 * fk, 2.6 * fk);
      c.restore(); } },
    // starry hat, too big: it slips down over the top of the left eye
    starHat: { front(c, G, A) {
      const k = G.br / 9.5;
      c.save(); c.translate(G.bx - 2 * k, G.by - G.br + 0.5 - A.sec * 2.2); c.rotate(-0.22 + A.sec * 0.06 + A.wob * 0.05); c.scale(1.25 * k * Math.max(1, G.off / 10), 1.25 * k);
      const g = c.createLinearGradient(0, -34, 0, 0); g.addColorStop(0, "#9C8FE0"); g.addColorStop(1, "#6A63B8");
      c.fillStyle = g; c.beginPath(); c.moveTo(-12, -1); const sw = Math.sin(A.t * 2.4) * 1.5 + A.sec * 3; c.bezierCurveTo(-8, -14, -4, -26, 4, -33); c.quadraticCurveTo(13, -36 - A.sec, 17 + sw, -28 + sw * 0.4 - A.sec * 2);
      c.quadraticCurveTo(10, -29, 8, -24); c.bezierCurveTo(9, -16, 11, -8, 13, -1); c.closePath(); c.fill();
      c.fillStyle = "#544E9E"; c.beginPath(); c.moveTo(-19, 1); c.bezierCurveTo(-19, -5, 20, -5, 20, 0); c.bezierCurveTo(20, 4, 6, 4.6, 0, 4.4); c.bezierCurveTo(-8, 4.4, -19, 7, -19, 1); c.fill();
      c.fillStyle = "#FFF1B8"; ell(c, 17.5 + sw, -28 + sw * 0.4 - A.sec * 2, 3.6, 3.6);
      c.fillStyle = "#FFE27A";
      [[-3, -8, 2.4], [4, -17, 1.9], [-1, -24, 1.4], [7, -5, 1.6]].forEach(([x, y, r]) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); });
      c.restore(); } },
    // little bee: the real bee's heart wings (twice draft 3) and an antennae headband
    bee: {
      back(c, G, A) {
        const K = 42.6 / 25.7;
        const path = big => { const L = (big ? 25.7 : 20.2) * K, w = (big ? 4.9 : 3.8) * K; c.beginPath(); c.moveTo(0, 0);
          c.bezierCurveTo(-w * 0.9, -L * 0.2, -w * 1.25, -L * 0.75, -w * 0.55, -L * 0.95); c.quadraticCurveTo(0, -L * 1.05, w * 0.55, -L * 0.95);
          c.bezierCurveTo(w * 1.25, -L * 0.75, w * 0.9, -L * 0.2, 0, 0); c.closePath(); };
        const wing = big => { path(big); c.fillStyle = big ? "rgba(255, 228, 242, 0.78)" : "rgba(255, 214, 234, 0.5)"; c.fill();
          c.lineCap = "round"; c.strokeStyle = big ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.55)"; c.lineWidth = 1.5; path(big); c.stroke();
          if (big) { c.strokeStyle = "rgba(230, 150, 190, 0.45)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -2 * K); c.quadraticCurveTo(-1.3 * K, -12 * K, 0, -21 * K); c.stroke();
            c.fillStyle = "rgba(255, 255, 255, 0.7)"; c.beginPath(); c.ellipse(-2.2 * K, -19 * K, 1.4 * K, 3 * K, -0.2, 0, TAU); c.fill(); } };
        const ang = A.air ? (0.5 - 0.5 * Math.cos(A.t * 34)) * 1.2 : 0.18 + 0.18 * Math.sin(A.t * 5);
        [-1, 1].forEach(s => { c.save(); c.translate(1 + s * 16 * G.W, -33 * G.T); c.scale(s, 1);
          c.save(); c.translate(1, 3); c.rotate(1.0 + Math.sin(ang) * 0.2); c.scale(1, 0.55 + 0.45 * Math.cos(ang * 0.9)); wing(false); c.restore();
          c.save(); c.rotate(0.55 + Math.sin(ang) * 0.25); c.scale(1, 0.55 + 0.45 * Math.cos(ang)); wing(true); c.restore();
          c.restore(); });
      },
      front(c, G, A) { const k = G.br / 9.5; c.save(); c.translate(G.bx, G.by); c.scale(k, k); c.strokeStyle = "#5A4630"; c.lineWidth = 1.8; c.lineCap = "round";
        c.beginPath(); c.moveTo(-5, -9.5); c.quadraticCurveTo(1, -12, 7, -9.5); c.stroke();
        [[-4, -10.5, -11, -24], [5, -10.5, 12, -24]].forEach(([x0, y0, x1, y1], j) => { x1 += Math.sin(A.t * 5 + j * 2) * 0.7 + A.wob * (j ? 1.2 : -1.2); y1 -= A.sec * 3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (x1 - x0) * 0.6, (y0 + y1) / 2, x1, y1); c.stroke(); c.fillStyle = "#5A4630"; ell(c, x1, y1, 3.2, 3.2); c.fillStyle = "#F6CD5A"; ell(c, x1 - 0.8, y1 - 0.9, 1.1, 1.1); });
        c.restore(); } },
    // a little party mask that fits the friend's own eyes (eye holes, sparkles, a soft bow)
    mask: { front(c, G, A) {
      const sx = G.off / 10, sy = G.br / 9.5;
      c.save(); c.translate(G.bx, G.by);
      const P = (x, y) => [x * sx, y * sy];
      const g = c.createLinearGradient(-22 * sx, -6, 24 * sx, 8); g.addColorStop(0, "#B07CE0"); g.addColorStop(1, "#8A5CCB");
      c.fillStyle = g; c.beginPath();
      c.moveTo(...P(-22, -2)); c.bezierCurveTo(...P(-22, -10), ...P(-13, -12), ...P(-6, -8)); c.quadraticCurveTo(...P(0, -5), ...P(6, -8));
      c.bezierCurveTo(...P(13, -12), ...P(22, -10), ...P(22, -2)); c.bezierCurveTo(...P(22, 6), ...P(15, 9), ...P(9, 7)); c.quadraticCurveTo(...P(0, 3), ...P(-9, 7)); c.bezierCurveTo(...P(-15, 9), ...P(-22, 6), ...P(-22, -2)); c.closePath();
      const hr = 7 * G.ek; c.moveTo(-G.off + hr, 0); c.arc(-G.off, 0, hr, 0, TAU, true); c.moveTo(G.off + hr, 0); c.arc(G.off, 0, hr, 0, TAU, true);
      c.fill("evenodd");
      c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; [-G.off, G.off].forEach(x => { c.beginPath(); c.arc(x, 0, hr + 0.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
      c.fillStyle = "#FFE27A"; [[-18, -6, 1.6], [18, -6, 1.6], [0, -2.5, 1.3]].forEach(([x, y, r]) => { const [X, Y] = P(x, y); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? r * 0.4 : r; c.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } c.fill(); });
      c.save(); c.translate(...P(22.5, -3)); c.rotate(Math.sin(A.t * 7) * 0.15 + A.sec * 0.35); c.fillStyle = "#C79BEA";
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(4, -7, 10, -6, 9, -1); c.bezierCurveTo(8, 2, 3, 2, 0, 0); c.fill();
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(5, 3, 9, 8, 6, 10); c.bezierCurveTo(3, 10, 1, 5, 0, 0); c.fill();
      c.fillStyle = "#A578DA"; c.beginPath(); c.arc(0.5, 0, 2, 0, TAU); c.fill(); c.restore();
      c.restore(); } },
    // a friendly ghost sheet: the whole frog under a soft white sheet, his own eyes peeking through two holes, feet out the bottom
    ghost: { front(c, G, A) {
      const B = G.brx, top = G.by - G.br - 16 + A.sec * 1.5, sway = Math.sin(A.t * 1.7) * 1.2, up = Math.max(0, A.sec) * 4, L = -B - 3 - up + sway, R = B + 5 + up + sway, hem = -2.5 - up;   // a tall round ghost head over his eyes
      c.save();
      const g = c.createLinearGradient(0, top, 0, hem); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#E9E6F7");
      c.fillStyle = g; c.beginPath();
      c.moveTo(L, hem); c.bezierCurveTo(L - 2, G.by, L + 2, top, 1, top); c.bezierCurveTo(R - 2, top, R + 2, G.by, R, hem);
      const n = 6; for (let i = 0; i < n; i++) { const x0 = R - (R - L) * i / n, x1 = R - (R - L) * (i + 1) / n, ripple = Math.sin(A.t * 3.2 + i * 1.3) * 1.6; c.quadraticCurveTo((x0 + x1) / 2 + ripple * 0.6, hem + 6 + ripple, x1, hem + Math.sin(A.t * 3.2 + i * 1.3 + 0.7) * 0.8); }
      c.closePath();
      const hr = 7.2 * G.ek; [G.bx - G.off, G.bx + G.off].forEach(x => { c.moveTo(x + hr, G.by); c.arc(x, G.by, hr, 0, TAU, true); });
      c.fill("evenodd"); c.strokeStyle = "rgba(160,150,205,0.7)"; c.lineWidth = 1; c.stroke();   // a soft outline so the sheet shows on light skies
      c.strokeStyle = "rgba(170,160,210,0.55)"; c.lineWidth = 1.2; c.lineCap = "round";               // soft folds
      [[-0.45, 0.2], [0.5, 0.25]].forEach(([fx, fy]) => { c.beginPath(); c.moveTo(fx * B, -14 * G.T); c.quadraticCurveTo(fx * B * 1.15, -6, fx * B * 1.05, hem + 2); c.stroke(); });
      c.fillStyle = "rgba(255,140,175,0.45)"; ell(c, G.bx - G.off - 2, G.by + 10, 4, 2.6); ell(c, G.bx + G.off + 2, G.by + 10, 4, 2.6);   // painted-on rosy cheeks
      c.strokeStyle = "#6E6890"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(G.bx - 3, G.by + 12); c.quadraticCurveTo(G.bx + 1, G.by + 15, G.bx + 5, G.by + 12); c.stroke();   // and a little painted smile
      if (!A.air) { c.fillStyle = G.leg; const fk = G.p.frontK; ell(c, -6 * G.W, -1, 5 * fk, 2.6 * fk); ell(c, 10 * G.W, -1, 5 * fk, 2.6 * fk); }   // (in the air his front feet tuck, like the library frog)
      c.restore(); } },
    // a little cowboy hat: soft brown felt, a pinched crown, a brim that curls up at both sides, a band with a tiny gold star
    cowboy: { front(c, G, A) {
      const k = G.br / 9.5;
      c.save(); c.translate(G.bx, G.by - G.br + 1.5 - A.sec * 2); c.rotate(-0.06 + A.sec * 0.07 + A.wob * 0.06); c.scale(k * 1.12, k * 1.12);
      const felt = c.createLinearGradient(0, -18, 0, 4); felt.addColorStop(0, "#B07A4A"); felt.addColorStop(1, "#8A5A34");
      // brim (back part), curled up at the sides
      c.fillStyle = "#7E5230"; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-20, 2, 0, 2.5); c.quadraticCurveTo(20, 2, 26, -6);
      c.quadraticCurveTo(22, -1, 0, -1.5); c.quadraticCurveTo(-22, -1, -26, -6); c.closePath(); c.fill();
      // crown with the pinch on top
      c.fillStyle = felt; c.beginPath(); c.moveTo(-11, 0); c.bezierCurveTo(-13, -10, -10, -17, -5, -17); c.quadraticCurveTo(0, -13.5, 5, -17);
      c.bezierCurveTo(10, -17, 13, -10, 11, 0); c.closePath(); c.fill();
      c.strokeStyle = "rgba(70,40,20,0.35)"; c.lineWidth = 1; c.lineCap = "round"; c.beginPath(); c.moveTo(0, -13.8); c.quadraticCurveTo(0.6, -9, 0, -5); c.stroke();   // the crease
      c.fillStyle = "#5E3B22"; c.fillRect(-11.6, -4.6, 23.2, 3.4);                                              // band
      c.fillStyle = "#FFD55A"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 1.1 : 2.4; c.lineTo(6 + Math.cos(a) * r, -2.9 + Math.sin(a) * r); } c.fill();
      // brim (front lip)
      c.fillStyle = "#946238"; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-20, 3.5, 0, 3.8); c.quadraticCurveTo(20, 3.5, 26, -6);
      c.quadraticCurveTo(21, 1, 0, 1.2); c.quadraticCurveTo(-21, 1, -26, -6); c.closePath(); c.fill();
      c.restore(); } },
    // a little bat: soft scalloped bat wings and a headband with pointy bat ears
    bat: {
      back(c, G, A) { const B = G.brx;
        const fa = A.air ? Math.sin(A.t * 13) * 0.45 : Math.sin(A.t * 2.2) * 0.1; [-1, 1].forEach(s => { c.save(); c.translate(1 + s * B * 0.6, -26 * G.T); c.scale(s, 1); c.rotate(-fa); c.scale(1, 1 - Math.abs(fa) * 0.3);
          const g = c.createLinearGradient(0, -20, 30, 10); g.addColorStop(0, "#8A7BB8"); g.addColorStop(1, "#6E5FA0");
          c.fillStyle = g; c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(14, -24, 36, -18);
          c.quadraticCurveTo(33, -9, 37, 0); c.quadraticCurveTo(29, -3, 26, 6); c.quadraticCurveTo(19, 0, 13, 9); c.quadraticCurveTo(8, 2, 0, 8); c.closePath(); c.fill();
          c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1; c.lineCap = "round"; [[14, -15, 32, -16], [12, -12, 26, 4], [9, -8, 13, 8]].forEach(([a, b, x, y]) => { c.beginPath(); c.moveTo(4, -2); c.quadraticCurveTo(a, b, x, y); c.stroke(); });
          c.restore(); }); },
      front(c, G, A) { const k = G.br / 9.5; c.save(); c.translate(G.bx, G.by); c.scale(k * Math.max(1, G.off / 10), k);
        c.strokeStyle = "#6E5FA0"; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(-6, -9.5); c.quadraticCurveTo(0, -12.5, 6, -9.5); c.stroke();
        [[-4.5, -1], [4.5, 1]].forEach(([x0, s]) => { const x = x0, tipx = s * 2 + A.wob * s * 1.5, tipy = -23 - A.sec * 2; c.fillStyle = "#7A6BAC"; c.beginPath(); c.moveTo(x - 4.5 * s * s, -10.5); c.lineTo(x + tipx, tipy); c.lineTo(x + 4.5 * s * s, -10.5); c.closePath(); c.fill();
          c.fillStyle = "#F4B3CF"; c.beginPath(); c.moveTo(x - 2.2, -11.5); c.lineTo(x + tipx * 0.8, tipy + 3.5); c.lineTo(x + 2.2, -11.5); c.closePath(); c.fill(); });
        c.restore(); } },
    // a short cozy cape with a little moon pin
    cape: {
      back(c, G, A) { c.save(); c.scale(G.W, G.T); const g = c.createLinearGradient(0, -36, 0, 2); g.addColorStop(0, "#8E78D8"); g.addColorStop(1, "#6E58BE");
        const sx = Math.sin(A.t * 2.2) * 1.6, up = Math.max(0, A.sec) * 6, fl = Math.max(0, A.sec) * 4, h = i => Math.sin(A.t * 3 + i) * 1.2;
        c.fillStyle = g; c.beginPath(); c.moveTo(-14, -33); c.bezierCurveTo(-28 - fl, -24, -31 - fl + sx, -8 - up * 0.5, -29 - fl * 1.5 + sx, 1 - up);
        c.quadraticCurveTo(-24 + sx, -2 - up + h(1), -20 + sx, 2 - up * 0.8); c.quadraticCurveTo(-14 + sx, -1 - up * 0.6 + h(2), -9 + sx, 3 - up * 0.5);
        c.lineTo(15 + sx, 3 - up * 0.5); c.quadraticCurveTo(20 + sx, -1 - up * 0.6 + h(3), 25 + sx, 2 - up * 0.8); c.quadraticCurveTo(29 + sx, -2 - up + h(4), 33 + fl * 1.5 + sx, 1 - up);
        c.bezierCurveTo(35 + fl + sx, -8 - up * 0.5, 32 + fl, -24, 18, -33); c.closePath(); c.fill(); c.restore(); },
      front(c, G, A) { c.save(); c.fillStyle = "#FFE27A"; c.beginPath(); c.arc(-25 * G.W, -22 * G.T, 3.2, 0, TAU); c.fill(); c.fillStyle = "#7E68CC"; c.beginPath(); c.arc(-23.6 * G.W, -23 * G.T, 2.6, 0, TAU); c.fill(); c.restore(); } }
  };
  

  // ---------- Hop Hop the firefly ----------
  const FIREFLY = {
    // the glowing firefly tail: a soft round light peeking out behind him, low on his right side
    glowBack(c, A) { const pulse = 0.75 + 0.25 * Math.sin(A.t * 1.6), k = 0.35 + 0.65 * A.glow;
      const g = c.createRadialGradient(24, -6, 2, 24, -6, 46); g.addColorStop(0, `rgba(255,246,190,${0.55 * pulse * k})`); g.addColorStop(0.45, `rgba(240,255,170,${0.22 * pulse * k})`); g.addColorStop(1, "rgba(240,255,170,0)");
      c.fillStyle = g; ell(c, 24, -6, 46, 46); },
    tail(c, A) { const pulse = 0.75 + 0.25 * Math.sin(A.t * 1.6);
      c.save(); c.translate(27, -10); c.rotate(-0.95);
      c.fillStyle = "#5E4E3A"; ell(c, 0, -4.2, 6.2, 2.4);                                      // a thin brown band where the light starts
      const g = c.createRadialGradient(0, 2.5, 0.5, 0, 2.5, 8); g.addColorStop(0, "#FFFFF2"); g.addColorStop(0.55, `rgba(248,255,175,${0.85 + 0.15 * pulse})`); g.addColorStop(1, "#DCEB78");
      c.fillStyle = g; ell(c, 0, 2.5, 6.4, 8.2);
      c.strokeStyle = "rgba(200,215,110,0.6)"; c.lineWidth = 0.6; [0, 3.5].forEach(y => { c.beginPath(); c.ellipse(0, y, 5.6, 1.4, 0, 0, Math.PI); c.stroke(); });   // soft segment lines
      c.restore(); },
    belly(c, A) { const pulse = 0.8 + 0.2 * Math.sin(A.t * 1.6);
      const g = c.createRadialGradient(3, -14, 1, 3, -13, 14); g.addColorStop(0, "#FFFFF0"); g.addColorStop(0.55, `rgba(250,255,185,${0.92 + 0.08 * pulse})`); g.addColorStop(1, "#E4F28A");
      c.fillStyle = g; ell(c, 3, -13, 14, 11); },
    bellyGlow(c, A, k) { const pulse = 0.75 + 0.25 * Math.sin(A.t * 1.6);
      const g = c.createRadialGradient(3, -13, 4, 3, -13, 40); g.addColorStop(0, `rgba(255,246,190,${0.5 * pulse * k})`); g.addColorStop(0.5, `rgba(240,255,170,${0.18 * pulse * k})`); g.addColorStop(1, "rgba(240,255,170,0)");
      c.fillStyle = g; ell(c, 3, -13, 40, 40); },
    // sheer, sparkly wings: long and narrow, rainbow-tinted glass, two on each side
    wings(c, A) {
      const wing = (L, w, a) => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-w, -L * 0.25, -w * 1.05, -L * 0.85, 0, -L); c.bezierCurveTo(w * 1.05, -L * 0.85, w, -L * 0.25, 0, 0); c.closePath();
        const g = c.createLinearGradient(0, 0, 0, -L); g.addColorStop(0, `rgba(200,235,255,${0.32 * a})`); g.addColorStop(0.5, `rgba(225,210,255,${0.28 * a})`); g.addColorStop(1, `rgba(210,255,235,${0.3 * a})`);
        c.fillStyle = g; c.fill(); c.strokeStyle = `rgba(255,255,255,${0.85 * a})`; c.lineWidth = 1.1; c.stroke();
        c.strokeStyle = `rgba(190,200,240,${0.45 * a})`; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-w * 0.2, -L * 0.5, 0, -L * 0.92); c.stroke();
        [[-0.3, 0.35], [0.25, 0.55], [-0.15, 0.75], [0.3, 0.2], [0, 0.88]].forEach(([fx, fy], i) => { const tw = 0.5 + 0.5 * Math.sin(A.t * 4 + i * 1.9 + L); c.fillStyle = `rgba(255,255,255,${(0.35 + 0.65 * tw) * a})`; const x = fx * w, y = -fy * L, r = 0.9 + tw * 0.9;
          c.beginPath(); c.moveTo(x, y - r * 1.8); c.lineTo(x + r * 0.4, y - r * 0.4); c.lineTo(x + r * 1.8, y); c.lineTo(x + r * 0.4, y + r * 0.4); c.lineTo(x, y + r * 1.8); c.lineTo(x - r * 0.4, y + r * 0.4); c.lineTo(x - r * 1.8, y); c.lineTo(x - r * 0.4, y - r * 0.4); c.closePath(); c.fill(); }); };
      const flut = A.air ? Math.sin(A.t * 30) * 0.22 : Math.sin(A.t * 6) * 0.06 + (A.wob || 0) * 0.08;
      [-1, 1].forEach(s => { c.save(); c.translate(1 + s * 14, -30); c.scale(s, 1);
        c.save(); c.translate(2, 4); c.rotate(1.05 + flut); wing(30, 7, 0.85); c.restore();
        c.save(); c.rotate(0.6 + flut); wing(40, 8.5, 1); c.restore();
        c.restore(); }); },
    tips(c, A) { const by = -38, br = 9.5; [[-3, -1], [5, 1]].forEach(([x0, s], j) => { const sw = Math.sin(A.t * 2.6 + j * 2.2) * 1.2 + (A.wob || 0) * s * 1.6, tx = x0 + s * 13 + sw + s * 2.5, ty = by - br - 18 - (A.sec || 0) * 3.5 + 2.5, p = 0.7 + 0.3 * Math.sin(A.t * 1.6 + j);
      const g = c.createRadialGradient(tx, ty, 0.5, tx, ty, 6 + 3 * A.glow); g.addColorStop(0, `rgba(255,250,200,${0.95 * p})`); g.addColorStop(1, "rgba(240,255,170,0)"); c.fillStyle = g; ell(c, tx, ty, 6 + 3 * A.glow, 6 + 3 * A.glow); c.fillStyle = "#FFFBD6"; ell(c, tx, ty, 1.7, 1.7); }); },
    // thin antennae with tiny glowing tips
    antennae(c, A) { const by = -38, br = 9.5;
      c.save(); c.strokeStyle = "#3E3550"; c.lineWidth = 1.5; c.lineCap = "round";
      [[-3, -1], [5, 1]].forEach(([x0, s], j) => { const sw = Math.sin(A.t * 2.6 + j * 2.2) * 1.2 + (A.wob || 0) * s * 1.6, tx = x0 + s * 13 + sw, ty = by - br - 18 - (A.sec || 0) * 3.5;
        c.beginPath(); c.moveTo(x0, by - br + 1.5); c.bezierCurveTo(x0 + s * 2, by - br - 9, x0 + s * 9 + sw * 0.5, ty + 6, tx, ty); c.quadraticCurveTo(tx + s * 3.5, ty - 2, tx + s * 2.5, ty + 2.5); c.stroke();
        if (A.noTips) return;
        const p = 0.7 + 0.3 * Math.sin(A.t * 1.6 + j);
        const g = c.createRadialGradient(tx + s * 2.5, ty + 2.5, 0.5, tx + s * 2.5, ty + 2.5, 6); g.addColorStop(0, `rgba(255,250,200,${0.95 * p})`); g.addColorStop(1, "rgba(240,255,170,0)");
        c.fillStyle = g; ell(c, tx + s * 2.5, ty + 2.5, 6, 6); c.fillStyle = "#FFFBD6"; ell(c, tx + s * 2.5, ty + 2.5, 1.7, 1.7); });
      c.restore(); }
  };

  const WHO = { ours: ["firefly"], mint: ["pumpkinSuit", "pumpkinCap"], blue: ["starHat"], golden: ["bee"], pink: ["mask"],
    lavender: ["cape"], lime: ["bat"], ember: ["cowboy"], hunter: ["ghost"] };

  function fullAnim(anim) { return Object.assign({ t: 0, air: false, sec: 0, wob: 0, glow: 0 }, anim || {}); }

  function drawFrog(ctx, name, pose, anim) {
    const A = fullAnim(anim), list = WHO[name] || [], F2 = F2lib();
    pose = Object.assign({}, pose || {});
    if (list.includes("ghost")) pose.happy = false;                  // the ghost keeps his eyes open in the holes
    if (list.includes("firefly")) {
      FIREFLY.wings(ctx, A); F2.draw(ctx, name, pose); FIREFLY.antennae(ctx, Object.assign({}, A, { noTips: true }));
      if (!A.noLights) drawLights(ctx, name, A);
      return;
    }
    const G = geo(name);
    list.forEach(k => COSTUME[k].back && COSTUME[k].back(ctx, G, A));
    F2.draw(ctx, name, pose);
    list.forEach(k => COSTUME[k].front && COSTUME[k].front(ctx, G, A));
  }
  function drawLights(ctx, name, anim) {
    if (!(WHO[name] || []).includes("firefly")) return;
    const A = fullAnim(anim);
    FIREFLY.belly(ctx, A);
    const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = "lighter"; FIREFLY.bellyGlow(ctx, A, 0.35 + 0.55 * A.glow); ctx.globalCompositeOperation = op;
    FIREFLY.tips(ctx, A);
  }
  // secondary motion from your own jump: costumes lag a little behind the body, then wobble after landing
  function hopMotion({ air = false, vy = 0, landedAgo = 9 } = {}) {
    const wob = Math.exp(-landedAgo * 5) * Math.sin(landedAgo * 17);
    return { air, sec: (air ? -vy * 0.7 : 0) + wob * 0.8, wob };
  }

  // ---------- the black cat witch ----------
  // a broom, flying to the right: handle from (-46,0) to (40,0), bristles at the back (left)
  function broom(c, t) {
    c.save(); c.rotate(-0.06);
    c.strokeStyle = "#8A5A34"; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(-30, 0); c.lineTo(42, -2); c.stroke();
    c.strokeStyle = "#B07A4A"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-28, -0.8); c.lineTo(40, -2.6); c.stroke();
    const g = c.createLinearGradient(-58, 0, -28, 0); g.addColorStop(0, "#E9C46A"); g.addColorStop(1, "#D6A84E");
    c.fillStyle = g; c.beginPath(); c.moveTo(-28, -4); c.quadraticCurveTo(-48, -11 + Math.sin(t * 6) * 1.2, -60, -9); c.quadraticCurveTo(-56, 0, -61, 10 + Math.sin(t * 6 + 1) * 1.2); c.quadraticCurveTo(-46, 10, -28, 4); c.closePath(); c.fill();
    c.strokeStyle = "rgba(160,110,40,0.5)"; c.lineWidth = 0.8; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-30, i * 1.1); c.quadraticCurveTo(-45, i * 2.5, -58, i * 3 + Math.sin(t * 6 + i) * 0.8); c.stroke(); }
    c.fillStyle = "#9B6FD6"; c.fillRect(-31, -4.8, 4, 9.6);
    c.restore();
  }
  // a sparkle trail behind the broom
  function trail(c, t, k = 1) { for (let i = 0; i < 9; i++) { const u = ((t * 0.9 + i / 9) % 1), x = -62 - u * 90, y = 4 + Math.sin(u * 7 + i) * 8 + u * 6, a = (1 - u) * 0.9;
    c.fillStyle = `rgba(255,236,160,${a * k})`; star(c, x, y, 2.6 * (1 - u * 0.5)); c.fillStyle = `rgba(214,190,255,${a * 0.7 * k})`; ell(c, x + 8, y + 5, 1.1, 1.1); } }
  
  function trail(c, t, k = 1) { for (let i = 0; i < 9; i++) { const u = ((t * 0.9 + i / 9) % 1), x = -62 - u * 90, y = 4 + Math.sin(u * 7 + i) * 8 + u * 6, a = (1 - u) * 0.9;
    c.fillStyle = `rgba(255,236,160,${a * k})`; star(c, x, y, 2.6 * (1 - u * 0.5)); c.fillStyle = `rgba(214,190,255,${a * 0.7 * k})`; ell(c, x + 8, y + 5, 1.1, 1.1); } }
  // OPTION C: a little black cat in a witch hat (soft charcoal-purple, so she shows against the night sky, with a faint moonlit edge)
  function catWitch(c, t, hat = true) {
    const bob = Math.sin(t * 2.2 + 2) * 2, blink = (t % 4.2) > 4.05;
    c.save(); c.translate(0, bob);
    const halo = c.createRadialGradient(3, -22, 4, 3, -22, 46); halo.addColorStop(0, "rgba(200,185,255,0.42)"); halo.addColorStop(0.5, "rgba(180,165,255,0.16)"); halo.addColorStop(1, "rgba(180,165,255,0)");
    c.fillStyle = halo; ell(c, 3, -22, 46, 46);                                                 // a soft glow behind her so she stands out
    trail(c, t);
    // ONE fur color field for the whole cat (head, ears, body, tail, paws), lit by the moon from the upper right,
    // so the parts melt into each other with no seams or outlines
    const furG = c.createRadialGradient(12, -38, 2, 2, -20, 40); furG.addColorStop(0, "#5A5480"); furG.addColorStop(0.35, "#3D3757"); furG.addColorStop(0.75, "#2B263F"); furG.addColorStop(1, "#1F1B30");
    // tail: curls up behind, swishing (same fur)
    c.strokeStyle = furG; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(-6, -8); c.bezierCurveTo(-24, -8, -26 + Math.sin(t * 2.5) * 3, -26, -16 + Math.sin(t * 2.5) * 4, -32); c.stroke();
    broom(c, t);
    c.fillStyle = furG;
    // ears grow out of the head: soft curved sides and a rounded tip, their bases hidden inside the head
    [[-1], [1]].forEach(([s2]) => { const bx = 3 + s2 * 9; c.beginPath(); c.moveTo(bx - s2 * 7.5, -34); c.quadraticCurveTo(bx - s2 * 5, -45, bx + s2 * 0.5, -50.5);
      c.quadraticCurveTo(bx + s2 * 2, -51.5, bx + s2 * 3, -49.5); c.quadraticCurveTo(bx + s2 * 7, -42, bx + s2 * 5.5, -33); c.closePath(); c.fill(); });
    ell(c, 3, -18, 9, 7);                                                                          // neck: head and body are one shape
    ell(c, 2, -9, 13, 12);                                                                         // body
    ell(c, 3, -31, 14.5, 12.5);                                                                    // head
    // front legs, in the SAME fur as her body (drawn before the tummy light, so the light falls across body and legs alike: no edge at the top)
    // (drawn without moving the drawing origin, so the fur shading lines up exactly with her body)
    [[-3.6, -0.6], [8.6, 0.6]].forEach(([x, lean]) => { const y0 = -11, y1 = 2.5;
      c.fillStyle = furG; c.beginPath(); c.moveTo(x - 3.2, y0); c.quadraticCurveTo(x - 3.6 + lean * 0.5, y0 + 8, x - 3.2 + lean, y1); c.lineTo(x + 3.2 + lean, y1); c.quadraticCurveTo(x + 3.6 + lean * 0.5, y0 + 8, x + 3.2, y0); c.closePath(); c.fill(); });
    // one soft shadow between the legs, fading out toward the chest (even shading, no stripes)
    c.save(); c.beginPath(); c.ellipse(2, -9, 13, 12, 0, 0, TAU); c.clip();                    // stays inside her body
    const soft = (x, y, sx, sy, a) => { c.save(); c.translate(x, y); c.scale(sx, sy); const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(14,11,26,${a})`); g.addColorStop(1, "rgba(14,11,26,0)"); c.fillStyle = g; ell(c, 0, 0, 1, 1); c.restore(); };
    soft(2.5, 1, 2.4, 10, 0.6);                                                                    // the soft shadow between her legs, fading up into her chest
    soft(-7.6, 0, 1.8, 8, 0.35); soft(12.8, 0, 1.8, 8, 0.25);                                      // soft shade at the outer side of each leg
    c.restore();
    // soft tummy light across the chest and the tops of the legs
    // a glowing pink heart on her chest (a soft pink glow around it, gently pulsing)
    const hp = 0.85 + 0.15 * Math.sin(t * 1.8), hx = 4, hy = -10.5, hs = 4.6;
    const hglow = c.createRadialGradient(hx, hy + 1, 0.5, hx, hy + 1, 10); hglow.addColorStop(0, `rgba(255,150,200,${0.18 * hp})`); hglow.addColorStop(1, "rgba(255,150,200,0)");
    c.fillStyle = hglow; ell(c, hx, hy + 1, 10, 10);
    const heart = () => { c.beginPath(); c.moveTo(hx, hy + hs * 0.95); c.bezierCurveTo(hx - hs * 1.25, hy + hs * 0.15, hx - hs * 1.05, hy - hs * 0.85, hx, hy - hs * 0.25);
      c.bezierCurveTo(hx + hs * 1.05, hy - hs * 0.85, hx + hs * 1.25, hy + hs * 0.15, hx, hy + hs * 0.95); c.closePath(); };
    // dimmer, and its edge melts softly into her black fur
    // see-through like her cheeks (same pink, about the same strength), soft edge
    const hg2 = c.createRadialGradient(hx - 0.4, hy - 0.4, 0.3, hx, hy, hs * 1.15); hg2.addColorStop(0, "rgba(255,178,208,1)"); hg2.addColorStop(1, "rgba(255,145,182,0.9)");
    c.save(); c.globalAlpha *= 0.58 + 0.08 * hp; c.filter = `blur(${(0.4 * c.getTransform().a).toFixed(2)}px)`; c.fillStyle = hg2; heart(); c.fill(); c.restore();
    // paws: part of each leg, wrapped over the broom, with a little moonlight on top so they read as paws, not blobs
    [[-4.1], [9.1]].forEach(([x]) => { c.fillStyle = furG; ell(c, x, 2.4, 4, 2.9);
      const pg = c.createRadialGradient(x + 0.8, 1.2, 0.2, x + 0.8, 1.4, 3.6); pg.addColorStop(0, "rgba(130,120,180,0.32)"); pg.addColorStop(1, "rgba(130,120,180,0)"); c.fillStyle = pg; ell(c, x + 0.6, 1.6, 3.6, 2.4); });
    c.fillStyle = "#F4B3CF"; ell(c, -4.1, 3.9, 1.5, 0.9); ell(c, 9.1, 3.9, 1.5, 0.9);
    // pink inner ears (fading toward the tip)
    [[-1], [1]].forEach(([s2]) => { const bx = 3 + s2 * 9, g = c.createLinearGradient(0, -36, 0, -49); g.addColorStop(0, "rgba(244,179,207,0.95)"); g.addColorStop(1, "rgba(244,179,207,0.25)");
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - s2 * 4, -37.5); c.quadraticCurveTo(bx - s2 * 2.4, -44, bx + s2 * 0.9, -47.5); c.quadraticCurveTo(bx + s2 * 4, -42, bx + s2 * 3.4, -37); c.closePath(); c.fill(); });
    if (hat) {
    // shading inside the head: a soft shadow under the hat brim
    c.save(); c.beginPath(); c.ellipse(3, -31, 14.5, 12.5, 0, 0, TAU); c.clip();
    const sh = c.createLinearGradient(0, -44, 0, -36); sh.addColorStop(0, "rgba(15,12,30,0.4)"); sh.addColorStop(1, "rgba(15,12,30,0)"); c.fillStyle = sh; c.fillRect(-14, -44, 34, 8);
    c.restore();
    }
    // eyes: big and friendly
    [[-2.5, -31], [8.5, -31]].forEach(([x, y]) => { if (blink) { c.strokeStyle = "#FFE27A"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 3.2, y); c.quadraticCurveTo(x, y + 2, x + 3.2, y); c.stroke(); return; }
      c.fillStyle = "#D8F27A"; ell(c, x, y, 3.8, 4.2); c.fillStyle = "#2A2440"; ell(c, x + 0.5, y + 0.3, 1.7, 2.8); c.fillStyle = "#FFF"; ell(c, x + 1.4, y - 1.4, 1, 1); });
    c.fillStyle = "rgba(255,130,170,0.5)"; ell(c, -6, -25.5, 2.6, 1.6); ell(c, 12, -25.5, 2.6, 1.6);
    c.fillStyle = "#F4A0C0"; c.beginPath(); c.moveTo(1.6, -27.2); c.lineTo(4.4, -27.2); c.lineTo(3, -25.6); c.closePath(); c.fill();   // nose
    c.strokeStyle = "#E9D9FF"; c.lineWidth = 0.9; c.lineCap = "round"; c.beginPath(); c.moveTo(3, -25.6); c.quadraticCurveTo(1.4, -23.6, 0, -24.4); c.moveTo(3, -25.6); c.quadraticCurveTo(4.6, -23.6, 6, -24.4); c.stroke();   // smile
    c.strokeStyle = "rgba(233,217,255,0.7)"; c.lineWidth = 0.6; [[-1, -1], [1, 1]].forEach(([d, s]) => { [ -0.5, 1.2].forEach(dy => { c.beginPath(); c.moveTo(3 + s * 6, -26 + dy); c.lineTo(3 + s * 15, -27 + dy * 1.6); c.stroke(); }); });   // whiskers
    if (hat) {
    // witch hat, tipped a little, the tip bouncing
    c.save(); c.translate(3.5, -41.5); c.rotate(0.12); c.scale(0.72, 0.8);          // smaller, sitting between her ears so both ears show
    c.fillStyle = "#3E3170"; ell(c, 0, 0, 19, 4.4);
    c.fillStyle = "#5A48A0"; c.beginPath(); c.moveTo(-10, -1); c.bezierCurveTo(-8, -13, -5, -23, -1, -31); c.quadraticCurveTo(5, -36, 13, -31 + Math.sin(t * 3) * 1.5); c.quadraticCurveTo(6, -29, 4, -22); c.bezierCurveTo(6, -13, 8, -6, 10, -1); c.closePath(); c.fill();
    c.fillStyle = "#F2A0C8"; c.fillRect(-9.6, -5.6, 19.4, 3.4); c.fillStyle = "#FFE27A"; star(c, 5, -4, 2.4, 5);
    c.fillStyle = "#FFE27A"; [[-3, -14, 1.3], [2, -21, 1.1]].forEach(([x, y, r]) => star(c, x, y, r, 4));
    c.restore();
    }
    c.restore();
  }
  
  function drawCatWitch(ctx, x, y, size, t, opts) {
    opts = opts || {};
    ctx.save(); ctx.translate(x, y); ctx.scale((opts.flip ? -1 : 1) * size, size); catWitch(ctx, t, opts.hat !== false); ctx.restore();
  }

  // ---------- the rules ----------
  const HALLOWEEN_WEEK = { from: [10, 25], to: [10, 31] };
  const md = d => (d.getMonth() + 1) * 100 + d.getDate();
  const inWeek = d => md(d) >= HALLOWEEN_WEEK.from[0] * 100 + HALLOWEEN_WEEK.from[1] && md(d) <= HALLOWEEN_WEEK.to[0] * 100 + HALLOWEEN_WEEK.to[1];
  const isHalloween = d => d.getMonth() === 9 && d.getDate() === 31;
  function costumesOn({ date = new Date(), night = false } = {}) { return isHalloween(date) || (inWeek(date) && !!night); }
  function catWitchFlies({ date = new Date() } = {}) { return inWeek(date); }
  function catWitchHat({ date = new Date(), night = false } = {}) { return isHalloween(date) || !!night; }

  root.LilyHalloweenCostumes = Object.freeze({ version: "1", WHO, drawFrog, drawLights, hopMotion, drawCatWitch,
    costumesOn, catWitchFlies, catWitchHat, HALLOWEEN_WEEK });
})(typeof window !== "undefined" ? window : globalThis);
