/* Lily's Halloween friends (v1, Oct 8, 2026): THE design of the pumpkin and the bat.
   This is the one place they live (like the creature library is for the animals). Never redraw them another way.
   These are the exact functions Jessica approved ("That's perfect", "He's perfect"):
     pumpkin-master-v1.html  (pumpkin + carveFace)      bat-v4.html  (bat)      ghost-v3.html  (ghost)
   Never edit a published version: make lily-halloween-v2.js instead.

     LilyHalloween.pumpkin(ctx, x, y, s, state, opts)
        x, y = the middle of the bottom of the pumpkin; s = size (1 is about 56 units wide)
        state: "plain" (no face) | "carved" (face, candle not lit) | "glow" (candle lit)
        opts.shape: { w, h, lobes, face }   face: 1 round and sweet (not used), 2 classic friendly, 3 happy, 4 wink
        opts.flick: how bright the glow is (about 0.8 to 1.2); opts.halo: false = leave out the soft glow around it
     LilyHalloween.SHAPES: the four approved shapes  A classic round, B wide and squat, C tall and round, D little sugar pumpkin
     LilyHalloween.FACES:  the three approved faces  [2, 3, 4]   (rule: the wink, 4, is never used on shape B)
     LilyHalloween.bat(ctx, x, y, s, pose, night)
        pose: 1 = wings up, 0 = gliding, -1 = wings down (any value in between works, for flapping)
     LilyHalloween.ghost(ctx, x, y, s, t, alpha, glow)
        the tiny friendly ghost; t = time in seconds (the hem ripples, he bobs and sways); x, y = the middle of his sheet */
(function () {
  "use strict";
  const TAU = Math.PI * 2;

  const SHAPES = [
    { name: "A", w: 1, h: 1, lobes: 5 },          // classic round
    { name: "B", w: 1.35, h: 0.75, lobes: 5 },    // wide and squat
    { name: "C", w: 0.88, h: 1.18, lobes: 5 },    // tall and round
    { name: "D", w: 0.78, h: 0.78, lobes: 5 }     // little sugar pumpkin
  ];
  const FACES = [2, 3, 4];

  // ---------- the pumpkin: the original glossy body, five lobes, cap, stem, leaf, tendril ----------
  function pumpkin(ctx, x, y, s, state, o) {
    o = o || {};
    const flick = o.flick === undefined ? 1 : o.flick, shape = o.shape || { w: 1, h: 1, lobes: 5 };
    const lit = state === "glow", fw = shape.w, fh = shape.h;
    if (lit && o.halo !== false) {
      const gr = ctx.createRadialGradient(x, y - 22 * s * fh, 4 * s, x, y - 22 * s * fh, 110 * s * fw);
      gr.addColorStop(0, `rgba(255,200,90,${0.42 * flick})`); gr.addColorStop(0.5, `rgba(255,170,70,${0.16 * flick})`); gr.addColorStop(1, "rgba(255,150,60,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - 22 * s * fh, 110 * s * fw, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const base = lit ? "#F08A30" : "#FF9A3C", rib = lit ? "#C9611E" : "#E9792A";
    ctx.fillStyle = "rgba(40,40,80,0.22)"; ctx.beginPath(); ctx.ellipse(0, 0, 36 * fw, 7, 0, 0, TAU); ctx.fill();
    const L5 = [[-20, -22, 16, 21], [20, -22, 16, 21], [-9, -24, 18, 24], [9, -24, 18, 24], [0, -25, 17, 25]];
    const L7 = [[-26, -20, 13, 18], [26, -20, 13, 18], [-17, -22, 15, 21], [17, -22, 15, 21], [-8, -24, 16, 24], [8, -24, 16, 24], [0, -25, 15, 25]];
    (shape.lobes === 7 ? L7 : L5).forEach(([cx, cy, rx, ry]) => {
      cx *= fw; rx *= fw; cy *= fh; ry *= fh;
      const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0); g.addColorStop(0, rib); g.addColorStop(0.5, base); g.addColorStop(1, rib);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.fill();
      // shadow on the top of each lobe, where it curves in toward the stem
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
      const tg = ctx.createLinearGradient(0, cy - ry, 0, cy - ry * 0.35); tg.addColorStop(0, lit ? "rgba(120,45,10,0.45)" : "rgba(160,65,15,0.4)"); tg.addColorStop(1, "rgba(160,65,15,0)");
      ctx.fillStyle = tg; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 0.7);
      const bgd = ctx.createLinearGradient(0, cy + ry * 0.45, 0, cy + ry); bgd.addColorStop(0, "rgba(150,60,15,0)"); bgd.addColorStop(1, "rgba(150,60,15,0.22)");
      ctx.fillStyle = bgd; ctx.fillRect(cx - rx, cy + ry * 0.45, rx * 2, ry * 0.6);
      ctx.restore();
    });
    // ---- stem area: green cap, stem, leaf and tendril, each casting a soft shadow onto the pumpkin ----
    const top = -49 * fh, px = ctx.getTransform().a, ls = Math.min(1, fh < 0.9 ? fh * 1.05 : Math.sqrt(fw * fh)), lift = fh < 0.9 ? -2.5 : 0, lx = -7 - Math.max(0, fw - 1) * 14;
    const lobes = (shape.lobes === 7 ? L7 : L5).map(([cx, cy, rx, ry]) => [cx * fw, cy * fh, rx * fw, ry * fh]);
    const bodyClip = () => { ctx.beginPath(); lobes.forEach(([cx, cy, rx, ry]) => { ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); }); ctx.clip(); };
    const leafPath = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-4, -9, -12, -12, -16, -8); ctx.bezierCurveTo(-20, -12, -27, -8, -25, -2); ctx.bezierCurveTo(-30, 1, -26, 8, -19, 6); ctx.bezierCurveTo(-14, 10, -6, 7, 0, 0); };
    const stemPath = () => { ctx.beginPath(); ctx.moveTo(-4.6, top + 1); ctx.bezierCurveTo(-5.2, top - 10, -1, top - 17, 6, top - 18); ctx.lineTo(8, top - 14); ctx.bezierCurveTo(3, top - 12, 4, top - 5, 4.4, top + 1); ctx.closePath(); };
    const vinePath = () => { ctx.beginPath(); ctx.moveTo(5, top - 1); ctx.bezierCurveTo(16, top - 7, 20, top + 5, 14, top + 7); ctx.bezierCurveTo(10, top + 8, 11, top + 1, 15, top + 2); };
    // the cap: a little green star of sepals where the stem joins the pumpkin, seen from the side (flattened)
    const capPath = () => {
      ctx.beginPath(); const n = 6, R = 9.5 * Math.min(fw, 1.15), r = 5.2, cx = 0, cy = top + 1.6;
      for (let i = 0; i <= n; i++) {
        const a = i / n * TAU, b = (i + 0.5) / n * TAU;
        const ox = cx + Math.cos(a) * R, oy = cy + Math.sin(a) * R * 0.32, ix = cx + Math.cos(b) * r, iy = cy + Math.sin(b) * r * 0.32;
        if (i === 0) ctx.moveTo(ox, oy); else ctx.quadraticCurveTo(cx + Math.cos(a - 0.18) * R * 1.08, cy + Math.sin(a - 0.18) * R * 0.35, ox, oy);
        if (i < n) ctx.quadraticCurveTo(ix, iy, ix, iy);
      }
      ctx.closePath();
    };
    // 1) shadows, kept on the pumpkin's skin (light comes from the upper left, so they fall down and to the right)
    ctx.save(); bodyClip(); ctx.filter = `blur(${Math.max(1, 1.6 * px)}px)`; const SH = lit ? "rgba(90,30,5,0.45)" : "rgba(120,45,8,0.38)";
    const dg = ctx.createRadialGradient(0, top + 3, 1, 0, top + 3, 15 * fw); dg.addColorStop(0, "rgba(130,50,10,0.55)"); dg.addColorStop(1, "rgba(130,50,10,0)"); ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(0, top + 3.5, 15 * fw, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = SH;
    ctx.save(); ctx.translate(1.6, 2.2); capPath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(3.2, 3); stemPath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(lx + 2.6, top + 1 + lift + 3.6); ctx.rotate(fh < 0.9 ? -0.6 : -0.35); ctx.scale(ls, ls); leafPath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(1.8, 2.8); ctx.strokeStyle = SH; ctx.lineWidth = 2.2; ctx.lineCap = "round"; vinePath(); ctx.stroke(); ctx.restore();
    ctx.restore();
    // 2) the face is carved FIRST, so the leaf, cap, stem and tendril always lie OVER any hole (Jessica's rule)
    if (state !== "plain") { ctx.save(); ctx.translate(0, fh < 1 ? (1 - fh) * 9 : 0); carveFace(ctx, shape.face || 1, fw, fh, lit); ctx.restore(); }
    // 3) the cap
    const cg = ctx.createLinearGradient(0, top - 2, 0, top + 5); cg.addColorStop(0, "#7E9B40"); cg.addColorStop(1, "#4F6926");
    ctx.fillStyle = cg; capPath(); ctx.fill();
    // 4) the stem
    const st = ctx.createLinearGradient(-5, 0, 6, 0); st.addColorStop(0, "#5E7A2E"); st.addColorStop(0.5, "#7E9B40"); st.addColorStop(1, "#4F6926");
    ctx.fillStyle = st; stemPath(); ctx.fill();
    ctx.fillStyle = "#8C7A4E"; ctx.beginPath(); ctx.ellipse(7, top - 16.5, 2.6, 2, 0.6, 0, TAU); ctx.fill();                   // dry tip
    ctx.strokeStyle = "rgba(40,60,20,0.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2, top); ctx.quadraticCurveTo(-2, top - 9, 3, top - 15); ctx.stroke();
    // 5) the leaf
    ctx.save(); ctx.translate(lx, top + 1 + lift); ctx.rotate(fh < 0.9 ? -0.6 : -0.35); ctx.scale(ls, ls);
    const lg = ctx.createLinearGradient(-22, 0, 0, 0); lg.addColorStop(0, "#6CBF74"); lg.addColorStop(1, "#4E9A55");
    ctx.fillStyle = lg; leafPath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -1); ctx.moveTo(-10, -1); ctx.lineTo(-16, -7); ctx.moveTo(-10, -1); ctx.lineTo(-15, 5); ctx.stroke();
    ctx.restore();
    // 6) the tendril
    ctx.strokeStyle = "#7FC476"; ctx.lineWidth = 1.8; ctx.lineCap = "round"; vinePath(); ctx.stroke();
    ctx.restore();
  }

  // ---------- carved faces: each cut shows the pale pumpkin flesh along its edge, and the dark (or glowing) inside ----------
  function rtri(ctx, cx, cy, w, h, r, up) { // a softly rounded triangle
    const p = up ? [[cx, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]] : [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx, cy + h / 2]];
    ctx.moveTo((p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2);
    for (let i = 0; i < 3; i++) { const a = p[i], b = p[(i + 1) % 3]; ctx.arcTo(a[0], a[1], b[0], b[1], r); }
    ctx.closePath();
  }
  function facePath(ctx, v, fw, fh) {
    const X = u => u * fw, Y = u => u * fh; ctx.beginPath();
    if (v === 1) { // round & sweet (not used)
      ctx.ellipse(X(-10), Y(-31), 5.2, 6.4, 0, 0, TAU); ctx.moveTo(X(15), Y(-31)); ctx.ellipse(X(10), Y(-31), 5.2, 6.4, 0, 0, TAU);
      ctx.moveTo(X(-14), Y(-18)); ctx.quadraticCurveTo(0, Y(-5), X(14), Y(-18)); ctx.quadraticCurveTo(0, Y(-11), X(-14), Y(-18)); ctx.closePath();
    } else if (v === 2) { // classic, friendly: rounded triangle eyes and nose, a wide smile with two little teeth
      rtri(ctx, X(-10), Y(-32), 11, 10, 2.5, true); rtri(ctx, X(10), Y(-32), 11, 10, 2.5, true); rtri(ctx, 0, Y(-23.5), 5.5, 5, 1.4, true);
      ctx.moveTo(X(-16), Y(-17)); ctx.quadraticCurveTo(X(-8), Y(-17.5), X(-6), Y(-16)); ctx.lineTo(X(-6), Y(-13.5)); ctx.lineTo(X(-2), Y(-13)); ctx.lineTo(X(-2), Y(-15.6));
      ctx.quadraticCurveTo(0, Y(-15.8), X(2), Y(-15.6)); ctx.lineTo(X(2), Y(-13)); ctx.lineTo(X(6), Y(-13.5)); ctx.lineTo(X(6), Y(-16));
      ctx.quadraticCurveTo(X(8), Y(-17.5), X(16), Y(-17)); ctx.quadraticCurveTo(X(10), Y(-4), 0, Y(-4)); ctx.quadraticCurveTo(X(-10), Y(-4), X(-16), Y(-17)); ctx.closePath();
    } else if (v === 3) { // happy: smiling closed eyes and an open smile
      [[-10], [10]].forEach(([ex]) => { const x0 = X(ex); ctx.moveTo(x0 - 6, Y(-29)); ctx.quadraticCurveTo(x0, Y(-38), x0 + 6, Y(-29)); ctx.quadraticCurveTo(x0, Y(-33.5), x0 - 6, Y(-29)); ctx.closePath(); });
      ctx.moveTo(X(-13), Y(-19)); ctx.quadraticCurveTo(0, Y(-19.5), X(13), Y(-19)); ctx.quadraticCurveTo(X(12), Y(-6), 0, Y(-6)); ctx.quadraticCurveTo(X(-12), Y(-6), X(-13), Y(-19)); ctx.closePath();
    } else { // wink (the model face)
      ctx.ellipse(X(-10), Y(-31), 5.2, 6.4, 0, 0, TAU);
      const x0 = X(10); ctx.moveTo(x0 - 6, Y(-29)); ctx.quadraticCurveTo(x0, Y(-38), x0 + 6, Y(-29)); ctx.quadraticCurveTo(x0, Y(-33.5), x0 - 6, Y(-29)); ctx.closePath();
      ctx.moveTo(X(-12), Y(-18)); ctx.quadraticCurveTo(X(2), Y(-6), X(14), Y(-20)); ctx.quadraticCurveTo(X(4), Y(-12), X(-12), Y(-18)); ctx.closePath();
    }
  }
  function carveFace(ctx, v, fw, fh, lit) {
    const px = ctx.getTransform().a, dx = -0.85 * fw, dy = -1.2 * fh;    // how far the back of the pumpkin seems to sit behind the hole
    if (lit) { ctx.save(); ctx.shadowColor = "rgba(255,205,90,0.95)"; ctx.shadowBlur = 9 * px; facePath(ctx, v, fw, fh); ctx.fillStyle = "#FFD27A"; ctx.fill("evenodd"); ctx.restore(); }
    ctx.save(); facePath(ctx, v, fw, fh); ctx.clip("evenodd");
    // the cut wall (the thickness of the pumpkin), seen along the lower-right inside edge
    const wg = ctx.createLinearGradient(-15 * fw, -38 * fh, 15 * fw, -6 * fh);
    if (lit) { wg.addColorStop(0, "#FFC867"); wg.addColorStop(1, "#F08A2E"); } else { wg.addColorStop(0, "#D9772C"); wg.addColorStop(1, "#9A4512"); }
    ctx.fillStyle = wg; ctx.fillRect(-30 * fw, -50 * fh, 60 * fw, 50 * fh);
    // the back inside of the pumpkin, seen through the hole
    ctx.save(); ctx.translate(dx, dy); facePath(ctx, v, fw, fh);
    const bg = ctx.createRadialGradient(-2 * fw, -26 * fh, 1, 0, -24 * fh, 20 * fw);
    if (lit) { bg.addColorStop(0, "#FFF8D2"); bg.addColorStop(0.45, "#FFDE7A"); bg.addColorStop(1, "#FFAE45"); } else { bg.addColorStop(0, "#7A3512"); bg.addColorStop(0.6, "#5A240A"); bg.addColorStop(1, "#3A1404"); }
    ctx.fillStyle = bg; ctx.fill("evenodd");
    // faint inner ribs on the back wall
    ctx.save(); facePath(ctx, v, fw, fh); ctx.clip("evenodd");
    ctx.strokeStyle = lit ? "rgba(235,140,45,0.22)" : "rgba(25,8,2,0.22)"; ctx.lineWidth = 0.7;
    for (let i = -3; i <= 3; i += 2) { const x0 = i * 5.2 * fw; ctx.beginPath(); ctx.moveTo(x0 * 0.6, -44 * fh); ctx.quadraticCurveTo(x0 * 1.15, -25 * fh, x0 * 0.6, -4 * fh); ctx.stroke(); }
    ctx.restore(); ctx.restore();
    ctx.restore();
    // a thin pale rim of fresh-cut flesh all the way around each opening
    facePath(ctx, v, fw, fh); ctx.strokeStyle = lit ? "rgba(255,236,180,0.9)" : "rgba(250,214,160,0.95)"; ctx.lineWidth = 0.24; ctx.lineJoin = "round"; ctx.stroke();
  }

  // ---------- the bat (v4): one silhouette, curved finger bones, scalloped wings, friendly face with one tiny fang ----------
  // pose: 1 = wings up, 0 = gliding, -1 = wings down (any value in between works, for flapping)
  function bat(ctx, x, y, s, pose, night) {
    if (pose === undefined) pose = 0; if (night === undefined) night = true;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const P = pose;
    const fur1 = night ? "#8F7BC2" : "#9C89CC", fur2 = night ? "#5F4C93" : "#6E5BA2", fur3 = night ? "#45366F" : "#54447F";
    const skinA = night ? "rgba(96,76,150,0.96)" : "rgba(108,88,162,0.96)", skinB = night ? "rgba(132,112,190,0.88)" : "rgba(146,126,202,0.88)";
    const boneC = night ? "#3E3066" : "#4A3B78";
    // ---------- wings (drawn behind the body) ----------
    [-1, 1].forEach(side => {
      ctx.save(); ctx.scale(side, 1);
      const sh = { x: 8, y: -3 };
      ctx.translate(sh.x, sh.y); ctx.rotate(-0.6 * P); ctx.scale(1, 1 - 0.18 * Math.abs(P)); ctx.translate(-sh.x, -sh.y);   // the flap: the whole wing swings at the shoulder
      const wr = { x: 23, y: -10 };                                       // wrist
      const tips = [{ x: 45, y: -20 }, { x: 53, y: -4 }, { x: 44, y: 10 }];           // three finger tips
      const foot = { x: 9, y: 11 };
      const skin = () => {
        ctx.beginPath(); ctx.moveTo(sh.x - 1, sh.y - 1.6);
        ctx.quadraticCurveTo((sh.x + wr.x) / 2, wr.y - 3.6, wr.x, wr.y - 1.2);                                         // follows the arm bone, just outside it
        ctx.quadraticCurveTo((wr.x + tips[0].x) / 2 + 0.6, (wr.y + tips[0].y) / 2 - 3.6, tips[0].x, tips[0].y - 0.4);    // follows the first finger bone
        const sc = (a, b, d) => { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; const nx = -(b.y - a.y), ny = (b.x - a.x), L = Math.hypot(nx, ny) || 1; ctx.quadraticCurveTo(mx + nx / L * d, my + ny / L * d, b.x, b.y); };
        sc(tips[0], tips[1], 10); sc(tips[1], tips[2], 9.5); sc(tips[2], foot, 11); ctx.closePath();
      };
      // wing skin: darker near the body, lighter and a little see-through toward the edge
      const g = ctx.createLinearGradient(sh.x, 0, 52, 0); g.addColorStop(0, skinA); g.addColorStop(1, skinB);
      ctx.fillStyle = g; skin(); ctx.fill();
      // soft shading on the lower half of the wing (light comes from above)
      ctx.save(); skin(); ctx.clip();
      const sg = ctx.createLinearGradient(0, wr.y - 4, 0, 14); sg.addColorStop(0, "rgba(30,18,60,0)"); sg.addColorStop(1, "rgba(30,18,60,0.28)");
      ctx.fillStyle = sg; ctx.fillRect(0, -60, 60, 80);
      // faint folds between the fingers
      ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 0.8;
      tips.forEach((t, i) => { if (i === 0) return; const a = tips[i - 1]; ctx.beginPath(); ctx.moveTo(wr.x, wr.y); ctx.quadraticCurveTo((wr.x + (a.x + t.x) / 2) / 2 + 2, (wr.y + (a.y + t.y) / 2) / 2, (a.x + t.x) / 2 - 3, (a.y + t.y) / 2); ctx.stroke(); });
      ctx.restore();
      // finger bones: gently curved, thicker at the wrist
      ctx.strokeStyle = boneC; ctx.lineCap = "round";
      tips.forEach((t, i) => { ctx.lineWidth = 1.5 - i * 0.15; ctx.beginPath(); ctx.moveTo(wr.x, wr.y); ctx.quadraticCurveTo((wr.x + t.x) / 2 + (i === 2 ? -2 : 1), (wr.y + t.y) / 2 - 2.5, t.x, t.y); ctx.stroke(); });
      ctx.restore();
    });
    // ---------- body ----------
    // ONE silhouette (Jessica, Oct 8): body, ears and fur tufts are a single shape with a single fill, so no seams or stacked pieces
    const silhouette = () => {
      ctx.beginPath(); const C = (...v) => ctx.bezierCurveTo(...v), Q = (...v) => ctx.quadraticCurveTo(...v);
      ctx.moveTo(0, 14.5);
      C(7.2, 14.5, 13, 8, 13, 0);                       // right side of the body
      C(13, -4, 11.95, -6.75, 12.9, -9.5);              // flows smoothly into the ear (no corner)
      C(14.8, -15, 14.6, -25, 10.4, -26.6);             // outer edge of the right ear, up to its round tip
      C(7.2, -27.6, 5.2, -15.5, 4.0, -13.8);            // inner edge, down into a soft valley
      Q(3.4, -13.6, 2.9, -14.4); Q(2.8, -16.4, 1.9, -17.3); Q(1.8, -15.6, 1.1, -14.6);        // three soft fur tufts, part of the same outline
      Q(0.6, -16.8, -0.3, -17.9); Q(-0.4, -15.8, -1.0, -14.6); Q(-1.7, -16.6, -2.6, -17.2); Q(-2.6, -15.4, -2.9, -14.4);
      Q(-3.4, -13.6, -4.0, -13.8);
      C(-5.2, -15.5, -7.2, -27.6, -10.4, -26.6);        // left ear (mirror)
      C(-14.6, -25, -14.8, -15, -12.9, -9.5);
      C(-11.95, -6.75, -13, -4, -13, 0);
      C(-13, 8, -7.2, 14.5, 0, 14.5); ctx.closePath();
    };
    const bg = ctx.createRadialGradient(-5, -9, 1, 0, -3, 24); bg.addColorStop(0, fur1); bg.addColorStop(0.55, fur2); bg.addColorStop(1, fur3);
    ctx.fillStyle = bg; silhouette(); ctx.fill();
    // everything else is soft light and color painted ON the one shape (clipped to it), never separate pieces
    ctx.save(); silhouette(); ctx.clip();
    const tg = ctx.createRadialGradient(-0.8, 6, 0.5, 0, 6.5, 8.5); tg.addColorStop(0, "rgba(205,196,236,0.95)"); tg.addColorStop(0.65, "rgba(185,172,226,0.7)"); tg.addColorStop(1, "rgba(185,172,226,0)");
    ctx.fillStyle = tg; ctx.fillRect(-14, -4, 28, 20);                                                // soft tummy
    const hl = ctx.createRadialGradient(-5, -11, 0, -5, -11, 9); hl.addColorStop(0, "rgba(255,255,255,0.16)"); hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hl; ctx.fillRect(-16, -30, 22, 26);                                               // top light from the upper left
    const sd = ctx.createRadialGradient(7, 8, 2, 7, 8, 14); sd.addColorStop(0, "rgba(25,15,50,0.22)"); sd.addColorStop(1, "rgba(25,15,50,0)");
    ctx.fillStyle = sd; ctx.fillRect(-14, -14, 30, 32);                                               // soft shade lower right
    ctx.restore();
    // inner ears (the only detail drawn inside the ears)
    [-1, 1].forEach(d => {
      const ig = ctx.createLinearGradient(0, -24, 0, -11); ig.addColorStop(0, "#F3B8D5"); ig.addColorStop(1, "rgba(216,138,180,0.85)");
      ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(d * 5.8, -12.6); ctx.bezierCurveTo(d * 5.6, -20, d * 8, -24.6, d * 9.9, -24.1);
      ctx.bezierCurveTo(d * 12.2, -23.5, d * 12.4, -16, d * 11.4, -11.4); ctx.quadraticCurveTo(d * 8.6, -10.4, d * 5.8, -12.6); ctx.closePath(); ctx.fill();
    });
    // the arms: each wing grows out of the body at the shoulder (fur-colored at the root, becoming the wing's leading bone)
    [-1, 1].forEach(side => {
      ctx.save(); ctx.scale(side, 1);
      const sh = { x: 8, y: -3 }; ctx.translate(sh.x, sh.y); ctx.rotate(-0.6 * P); ctx.scale(1, 1 - 0.18 * Math.abs(P)); ctx.translate(-sh.x, -sh.y);
      const wr = { x: 23, y: -10 }, cx = (sh.x + wr.x) / 2, cy = wr.y - 2.5;
      const ag = ctx.createLinearGradient(10.2, 0, 15.5, 0); ag.addColorStop(0, "rgba(80,62,128,0)"); ag.addColorStop(1, boneC);   // fades in from the body's edge, so the arm grows out of it seamlessly
      ctx.fillStyle = ag; ctx.beginPath();
      ctx.moveTo(sh.x + 2, sh.y - 2.0); ctx.quadraticCurveTo(cx, cy - 1.4, wr.x, wr.y - 0.8);           // top of the arm
      ctx.arc(wr.x, wr.y, 0.8, -Math.PI / 2, Math.PI / 2);                                         // rounded wrist, inside the wing edge
      ctx.quadraticCurveTo(cx, cy + 1.4, sh.x + 2, sh.y + 2.2); ctx.closePath(); ctx.fill();          // bottom of the arm, wide at the shoulder
      ctx.restore();
    });
    // ---------- face ----------
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.ellipse(-5, -3, 4.2, 4.5, 0, 0, TAU); ctx.ellipse(5, -3, 4.2, 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#2E2440"; ctx.beginPath(); ctx.ellipse(-4.4, -2.4, 2.6, 2.9, 0, 0, TAU); ctx.ellipse(5.6, -2.4, 2.6, 2.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(-3.5, -3.7, 1, 0, TAU); ctx.arc(6.5, -3.7, 1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-5.2, -1.4, 0.45, 0, TAU); ctx.arc(4.8, -1.4, 0.45, 0, TAU); ctx.fill();
    ctx.fillStyle = "#C98BB0"; ctx.beginPath(); ctx.ellipse(0.5, 1.3, 1.5, 1.05, 0, 0, TAU); ctx.fill();                   // little nose
    [-1, 1].forEach(d => {
      ctx.save(); ctx.translate(d * 8.8, 2.4); ctx.scale(1, 0.68); const bl = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.4);
      bl.addColorStop(0, "rgba(255,150,190,0.6)"); bl.addColorStop(1, "rgba(255,150,190,0)"); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill(); ctx.restore();
    });   // soft blush
    ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 1.15; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-2.2, 3.6); ctx.quadraticCurveTo(0, 5.6, 2.2, 3.6); ctx.stroke();
    // one tiny friendly fang
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.moveTo(0.6, 4.45); ctx.lineTo(1.7, 4.15); ctx.lineTo(1.15, 5.7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- the tiny friendly ghost (v3): one outline, hollow sheet hem, soft glow ----------
  // t = time in seconds: the hem ripples gently and he bobs and sways a little.
  function ghost(ctx, x, y, s, t, alpha, glow) {
    if (t === undefined) t = 0; if (alpha === undefined) alpha = 1; if (glow === undefined) glow = true;
    ctx.save(); ctx.globalAlpha = alpha;
    const bob = Math.sin(t * 1.6) * 1.6, sway = Math.sin(t * 0.9) * 0.05;
    if (glow) {
      const g = ctx.createRadialGradient(x, y + (bob - 14) * s, 12 * s, x, y + (bob - 14) * s, 40 * s); g.addColorStop(0, "rgba(215,225,255,0.28)"); g.addColorStop(1, "rgba(215,225,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + (bob - 14) * s, 40 * s, 0, TAU); ctx.fill();
    }
    ctx.translate(x, y + bob * s); ctx.rotate(sway); ctx.scale(s, s);
    const outline = () => {
      ctx.beginPath(); const C = (...v) => ctx.bezierCurveTo(...v);
      ctx.moveTo(0, -38);
      C(12, -38, 21, -30, 21, -16);                       // right side of the head
      C(21, -11, 23, -8, 26.5, -6);                       // little right arm grows out…
      C(29.5, -4.3, 29, -0.6, 25.8, -0.6);                // …round tip…
      C(23.5, -0.6, 22, 1.5, 22, 5);                      // …and flows back into the body
      C(22, 8, 22, 10, 22, 12);
      const n = 4, w = 44 / n;                             // four soft waves along the front of the hem
      for (let i = 0; i < n; i++) {
        const xa = 22 - i * w, xm = xa - w / 2, xb = xa - w, dip = 3.4 + 0.6 * Math.sin(t * 2.2 + i * 1.3);
        C(xa - w * 0.08, 12 + dip * 0.6, xm + w * 0.28, 12 + dip, xm, 12 + dip); C(xm - w * 0.28, 12 + dip, xb + w * 0.08, 12 + dip * 0.6, xb, 12);
      }
      C(-22, 10, -22, 8, -22, 5);                         // left side (mirror)
      C(-22, 1.5, -23.5, -0.6, -25.8, -0.6);
      C(-29, -0.6, -29.5, -4.3, -26.5, -6);
      C(-23, -8, -21, -11, -21, -16);
      C(-21, -30, -12, -38, 0, -38); ctx.closePath();
    };
    // the BACK of the hollow sheet: the inside of the cloth, in soft shadow, peeking through between the front waves
    {
      const Cb = (...v) => ctx.bezierCurveTo(...v); ctx.beginPath(); ctx.moveTo(20.5, 2); ctx.lineTo(20.5, 12);
      const xs = [16.5, 5.5, -5.5, -16.5]; ctx.quadraticCurveTo(19, 12.6, xs[0], 12.5);
      for (let i = 0; i < 3; i++) {
        const xa = xs[i], xb = xs[i + 1], xm = (xa + xb) / 2, w = xa - xb, dip = 4.9 + 0.6 * Math.sin(t * 2.2 + i * 1.3 + 2.1);
        Cb(xa - w * 0.08, 12.5 + dip * 0.6, xm + w * 0.28, 12.5 + dip, xm, 12.5 + dip); Cb(xm - w * 0.28, 12.5 + dip, xb + w * 0.08, 12.5 + dip * 0.6, xb, 12.5);
      }
      ctx.quadraticCurveTo(-19, 12.6, -20.5, 12); ctx.lineTo(-20.5, 2); ctx.closePath();
      const ig = ctx.createLinearGradient(0, 8, 0, 19); ig.addColorStop(0, "#A9A3D8"); ig.addColorStop(1, "#C4C0EA");
      ctx.fillStyle = ig; ctx.fill();
      // a soft shadow of the front waves falling onto the inside of the back (gives the sheet depth)
      ctx.save(); ctx.clip(); ctx.translate(0, 1.3); ctx.filter = `blur(${0.8 * ctx.getTransform().a}px)`; ctx.fillStyle = "rgba(80,72,140,0.35)"; outline(); ctx.fill(); ctx.restore();
    }
    // one fill: bright white where the light hits (upper left), softly lavender toward the edges
    const body = ctx.createRadialGradient(-7, -24, 1, 0, -10, 36); body.addColorStop(0, "rgb(255,255,255)"); body.addColorStop(0.6, "rgb(244,244,255)"); body.addColorStop(1, "rgb(216,216,246)");
    ctx.fillStyle = body; outline(); ctx.fill();
    // soft shading painted onto the one shape (never separate pieces)
    ctx.save(); outline(); ctx.clip();
    const sh = ctx.createRadialGradient(12, 6, 2, 12, 6, 26); sh.addColorStop(0, "rgba(150,150,210,0.22)"); sh.addColorStop(1, "rgba(150,150,210,0)");
    ctx.fillStyle = sh; ctx.fillRect(-30, -40, 60, 60);                                  // shade on the lower right
    const hem = ctx.createLinearGradient(0, 4, 0, 16); hem.addColorStop(0, "rgba(190,195,240,0)"); hem.addColorStop(1, "rgba(190,195,240,0.35)");
    ctx.fillStyle = hem; ctx.fillRect(-30, 4, 60, 14);                                   // the hem fades a little, like soft cloth
    ctx.restore();
    // face
    ctx.fillStyle = "#3B3463"; ctx.beginPath(); ctx.ellipse(-8, -19, 3.6, 4.8, 0, 0, TAU); ctx.ellipse(8, -19, 3.6, 4.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(-6.9, -20.6, 1.3, 0, TAU); ctx.arc(9.1, -20.6, 1.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-8.9, -17.4, 0.55, 0, TAU); ctx.arc(7.1, -17.4, 0.55, 0, TAU); ctx.fill();
    [-1, 1].forEach(d => {
      ctx.save(); ctx.translate(d * 14, -11); ctx.scale(1, 0.66); const bl = ctx.createRadialGradient(0, 0, 0, 0, 0, 4.2);
      bl.addColorStop(0, "rgba(255,150,190,0.55)"); bl.addColorStop(1, "rgba(255,150,190,0)"); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, TAU); ctx.fill(); ctx.restore();
    });   // soft blush
    ctx.strokeStyle = "#3B3463"; ctx.lineWidth = 1.7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-3.6, -10.5); ctx.quadraticCurveTo(0, -6.8, 3.6, -10.5); ctx.stroke();
    ctx.restore();
  }

  window.LilyHalloween = { version: 1, SHAPES: SHAPES, FACES: FACES, pumpkin: pumpkin, bat: bat, ghost: ghost };
})();
