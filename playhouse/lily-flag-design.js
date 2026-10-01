/* Lily's Playhouse: THE design of the playhouse flag (v1, Oct 1, 2026).
   The Lily Studio lily, grown as a real Playhouse flower: the same 3D petals, soft color fades, golden
   middle, stem and leaves as every flower in the world, in the logo's colors (blue, white, pink petals,
   three stamens with round tips, green leaves, sparkles). It is painted onto a cloth flag that flies
   in 3D from a tall pole on the playhouse roof, and glows softly at night so you can always find home.
   Like lily-playhouse-design.js, this is the one place the flag's look lives.

     LilyFlag.design                  sizes and colors (world units)
     LilyFlag.paint(canvas, t)        paints the flag cloth (the world wraps it onto the waving 3D flag)
     LilyFlag.drawLily(ctx, cx, cy, r, t)   just the lily, seen a little from above (r = its size)  */
(function () {
  "use strict";
  const design = {
    version: 1,
    pole: { height: 1500, width: 22, widthBase: 34, ball: 28, at: { right: 300, front: 220 }, base: { r: 190, h: 62, stone: ["#F4EFE8", "#E2D9CE", "#C9BCAE"], soil: "#8A6A52" }, rope: "rgba(250, 246, 238, 0.85)", color: ["#E9DCCB", "#FFFFFF", "#CDBBA6"], gold: ["#FFF6C8", "#FFD36E", "#E9A83C"] },
    flag: { width: 511, height: 296, wave: 30, cloth: ["#202D56", "#0C1838"], hem: "#F2F5FE", hemWidth: 0.03, sleeve: 0.06, sleeveShade: "#D9E0F2", stitch: "rgba(126, 146, 204, 0.75)", words: "#ACC0F2" },
    glow: "255, 214, 238",
    lily: {
      // outer petals in order around the flower, then the three inner petals. [base color, tip color]
      outer: [["#7FA6EE", "#E2EDFF"], ["#F4D3E6", "#FFFFFF"], ["#F58CC0", "#FFE3F1"], ["#9DD08A", "#E4F7D6"], ["#7FA6EE", "#E2EDFF"], ["#F4D3E6", "#FFFFFF"], ["#F58CC0", "#FFE3F1"], ["#A3BDF2", "#F0F5FF"]],
      inner: ["#FFB8DA", "#FFFFFF"],
      stamens: ["#FF8FC4", "#C9A3F2", "#8FC8F5"],
      stem: "#5FAE68", leaf: "#6CBF74", leafLight: "#9BD88E"
    }
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- the lily: the studio logo's shape, drawn with the Playhouse's soft style ----------
  // Same pieces and places as the logo (big blue petal sweeping left, tall white petal with a pink line,
  // pink petal to the right, a low blue-and-white petal curling up on the right, two green leaves, a stem,
  // stamens with round tips, little dots and two sparkles), painted the way the world paints its flowers:
  // soft color fades from base to tip, a lighter inside, a thin white edge, round shiny tips, golden fairy dust.
  // Lily units: about -1..1 across and down (y goes down), base of the flower near (0, 0.42).
  // a long curved petal or leaf along a smooth curve B -> T (c1, c2 bend it), W = how wide (part of its length)
  function curvedPetal(ctx, B, c1, c2, T, W, cols, opt) {
    opt = opt || {};
    const pt = u => { const a = (1 - u) ** 3, b2 = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3; return [a * B[0] + b2 * c1[0] + c * c2[0] + d * T[0], a * B[1] + b2 * c1[1] + c * c2[1] + d * T[1]]; };
    const tan = u => { const e = 0.002, p0 = pt(Math.max(0, u - e)), p1 = pt(Math.min(1, u + e)), x = p1[0] - p0[0], y = p1[1] - p0[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    let L = 0; { let q = pt(0); for (let i = 1; i <= 20; i++) { const n = pt(i / 20); L += Math.hypot(n[0] - q[0], n[1] - q[1]); q = n; } }
    const width = u => W * L * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 1.25) * (u < 0.08 ? 0.6 + 5 * u : 1);
    const N = 30, left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, s0 = pt(u), t = tan(u), w = width(u);
      left.push([s0[0] - t[1] * w, s0[1] + t[0] * w]); right.push([s0[0] + t[1] * w, s0[1] - t[0] * w]);
    }
    const path = () => { ctx.beginPath(); left.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath(); };
    // two tones across the petal, like the logo: a light outer side and a deeper inner side
    const m = pt(0.42), tm = tan(0.42), ww = width(0.42) * 1.05;
    const g = ctx.createLinearGradient(m[0] + tm[1] * ww, m[1] - tm[0] * ww, m[0] - tm[1] * ww, m[1] + tm[0] * ww);
    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    path(); ctx.fillStyle = g; ctx.fill();
    // the Playhouse fade: lighter toward the tip
    const g2 = ctx.createLinearGradient(B[0], B[1], T[0], T[1]);
    g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(0.6, "rgba(255,255,255,0.06)"); g2.addColorStop(1, "rgba(255,255,255,0.4)");
    ctx.fillStyle = g2; ctx.fill();
    ctx.save(); path(); ctx.clip();
    const line = (k, from, to, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.beginPath();
      for (let i = from; i <= to; i++) { const u = i / N, s0 = pt(u), t = tan(u), w = width(u) * k; const q = [s0[0] + t[1] * w, s0[1] - t[0] * w]; i === from ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); } ctx.stroke(); };
    line(0.5, 3, N - 5, "rgba(255,255,255,0.5)", width(0.42) * 0.28);   // a soft shine along the light side
    if (opt.stripe) line(-0.42, 5, N - 4, opt.stripe, width(0.42) * 0.3);   // the pink line inside the white petal
    ctx.restore();
    path(); ctx.strokeStyle = "rgba(255, 255, 255, 0.55)"; ctx.lineWidth = 0.011; ctx.lineJoin = "round"; ctx.stroke();   // thin white edge
  }
  // ---------- Jessica's flag sketch (Oct 1): a night-blue flag, the lily at the top left with a golden sparkle,
  // "Lily's Playhouse" in soft periwinkle letters, and little glowing gold sparkles ----------
  // The lily is drawn in "sketch units": the same numbers as her sketch (the flag is 1054 x 650 there).
  function drawLily(ctx, cx, cy, r, t) {
    t = t || 0;
    const S = r / 130;   // r = the lily's size; 130 sketch units
    const U = p => [(p[0] - 240) / 130, (p[1] - 230) / 130];
    const pet = (B, c1, c2, T, W, cols, opt) => curvedPetal(ctx, U(B), U(c1), U(c2), U(T), W, cols, opt);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(S * 130, S * 130);
    // stem
    ctx.strokeStyle = "#71B173"; ctx.lineWidth = 0.05; ctx.lineCap = "round";
    const s0 = U([241, 262]), s1 = U([236, 300]), s2 = U([238, 340]);
    ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]); ctx.stroke();
    // green leaf, low on the left
    pet([242, 262], [205, 238], [160, 210], [128, 200], 0.17, ["#D9F0D3", "#A6D7A0", "#7ABA7C"]);
    // big periwinkle petal sweeping up to the left
    pet([238, 258], [205, 205], [150, 168], [104, 172], 0.24, ["#E7EEFF", "#BACAF3", "#92A9E4", "#758FD6"]);
    // the deeper pink petal behind, reaching up to the right
    pet([248, 252], [285, 186], [330, 156], [370, 154], 0.24, ["#E8B2CA", "#D281A8", "#BB6690"]);
    // the tall white petal in the middle
    pet([240, 262], [228, 210], [216, 160], [226, 116], 0.21, ["#FFFDFD", "#FEF4F7", "#F6DDE5"], { stripe: "rgba(246, 171, 199, 0.45)" });
    // stamens with round shiny tips (pink and lilac)
    [[[252, 245], [270, 190], [280, 147], "#F496BB"], [[256, 248], [282, 205], [296, 172], "#B59BE6"]].forEach(([A, C, P, col]) => {
      const a = U(A), c = U(C), q = U(P);
      ctx.strokeStyle = "#DB87A8"; ctx.lineWidth = 0.022;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]); ctx.stroke();
      const br = 0.055, g = ctx.createRadialGradient(q[0] - br * 0.35, q[1] - br * 0.4, br * 0.1, q[0], q[1], br);
      g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.45, col); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], br, 0, Math.PI * 2); ctx.fill();
    });
    // the soft pink front petal (the cup of the lily) and a little blue petal tucked under it
    pet([250, 266], [300, 268], [330, 250], [342, 240], 0.17, ["#E4EBFD", "#C0CDEF", "#A1B3E2"]);
    pet([244, 266], [280, 250], [325, 205], [356, 184], 0.26, ["#FFF0F6", "#FDD0E0", "#F6ABC7", "#E98DB2"]);
    ctx.restore();
    // the golden sparkle (the world's fairy dust), with a soft glow
    goldSparkle(ctx, cx + (300 - 240) * S, cy + (100 - 230) * S, 30 * S, 0.75 + 0.25 * Math.sin(t * 2.2));
  }
  function goldSparkle(ctx, x, y, rr, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr * 2.2);
    g.addColorStop(0, `rgba(248, 202, 101, ${0.5 * a})`); g.addColorStop(1, "rgba(248, 202, 101, 0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr * 2.2, 0, Math.PI * 2); ctx.fill();
    starPath(ctx, x, y, rr * (0.9 + 0.1 * a), 0.3);
    ctx.fillStyle = "#FDEBAA"; ctx.fill();
    ctx.strokeStyle = "rgba(163, 128, 67, 0.6)"; ctx.lineWidth = rr * 0.12; ctx.lineJoin = "round"; ctx.stroke();
  }
  // a four-point star with soft curved sides (like the stars in Jessica's sketch)
  function starPath(ctx, x, y, r, pinch) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 - Math.PI / 2, b = a + Math.PI / 2;
      const p1 = [x + Math.cos(a) * r, y + Math.sin(a) * r], p2 = [x + Math.cos(b) * r, y + Math.sin(b) * r];
      if (i === 0) ctx.moveTo(p1[0], p1[1]);
      ctx.quadraticCurveTo(x + Math.cos(a + Math.PI / 4) * r * pinch, y + Math.sin(a + Math.PI / 4) * r * pinch, p2[0], p2[1]);
    }
    ctx.closePath();
  }

  // ---------- the flag cloth (the world wraps this onto the waving flag) ----------
  // back = true paints the other side of the flag: the sleeve is still at the pole, but now on the right,
  // and the picture is NOT mirrored, so the words read correctly from behind too (a double-sided flag).
  function paint(canvas, t, back) {
    t = t || 0;
    const c = canvas.getContext("2d"), Wc = canvas.width, Hc = canvas.height, F = design.flag;
    const sw = Wc * F.sleeve, x0 = back ? 0 : sw, Wi = Wc - sw, k = Wi / 1054, ky = Hc / 650;
    c.clearRect(0, 0, Wc, Hc);
    // the sleeve: a white strip folded around the pole, with two gold rings
    const sx = back ? Wc - sw : 0;
    const sg = c.createLinearGradient(sx, 0, sx + sw, 0);
    sg.addColorStop(0, F.hem); sg.addColorStop(0.5, "#FFFFFF"); sg.addColorStop(1, F.sleeveShade);
    c.fillStyle = sg; c.fillRect(sx, 0, sw, Hc);
    c.strokeStyle = F.stitch; c.lineWidth = Math.max(1, Wc * 0.0022); c.setLineDash([Wc * 0.009, Wc * 0.007]);
    c.beginPath(); const lx = back ? sx + sw * 0.18 : sx + sw * 0.82; c.moveTo(lx, Hc * 0.02); c.lineTo(lx, Hc * 0.98); c.stroke(); c.setLineDash([]);
    [0.1, 0.9].forEach(v => {   // grommets: gold rings set into the sleeve
      const gx = sx + sw * 0.45, gy = Hc * v, rr = sw * 0.24;
      c.fillStyle = "#A38043"; c.beginPath(); c.arc(gx, gy, rr, 0, Math.PI * 2); c.fill();
      const g = c.createRadialGradient(gx - rr * 0.3, gy - rr * 0.35, rr * 0.1, gx, gy, rr);
      g.addColorStop(0, "#FFF4C8"); g.addColorStop(0.55, "#E9C15E"); g.addColorStop(1, "#B38A3E");
      c.fillStyle = g; c.beginPath(); c.arc(gx, gy, rr * 0.86, 0, Math.PI * 2); c.fill();
      c.fillStyle = F.cloth[1]; c.beginPath(); c.arc(gx, gy, rr * 0.42, 0, Math.PI * 2); c.fill();
    });
        // the cloth
    c.save(); c.translate(x0, 0);
    const W2 = Wi;
    const g = c.createRadialGradient(W2 * 0.45, Hc * 0.42, Hc * 0.1, W2 * 0.5, Hc * 0.5, W2 * 0.75);
    g.addColorStop(0, F.cloth[0]); g.addColorStop(1, F.cloth[1]);
    c.fillStyle = g; c.fillRect(0, 0, W2, Hc);
    // a white hem on the three open edges, sewn with a soft dashed stitch
    const hw = Hc * F.hemWidth;
    c.fillStyle = F.hem;
    c.fillRect(0, 0, W2, hw); c.fillRect(0, Hc - hw, W2, hw);
    if (back) c.fillRect(0, 0, hw, Hc); else c.fillRect(W2 - hw, 0, hw, Hc);
    c.strokeStyle = F.stitch; c.lineWidth = Math.max(1, Hc * 0.004); c.setLineDash([Hc * 0.016, Hc * 0.012]); c.lineCap = "round";
    const d = hw * 0.5;
    c.beginPath();
    if (back) { c.moveTo(W2, d); c.lineTo(d, d); c.lineTo(d, Hc - d); c.lineTo(W2, Hc - d); }
    else { c.moveTo(0, d); c.lineTo(W2 - d, d); c.lineTo(W2 - d, Hc - d); c.lineTo(0, Hc - d); }
    c.stroke(); c.setLineDash([]);
    // a second stitch line just inside the hem, on the blue
    c.strokeStyle = "rgba(242, 245, 254, 0.22)"; c.setLineDash([Hc * 0.012, Hc * 0.012]);
    const e = hw * 1.9; c.beginPath();
    if (back) { c.moveTo(W2, e); c.lineTo(e, e); c.lineTo(e, Hc - e); c.lineTo(W2, Hc - e); }
    else { c.moveTo(0, e); c.lineTo(W2 - e, e); c.lineTo(W2 - e, Hc - e); c.lineTo(0, Hc - e); }
    c.stroke(); c.setLineDash([]);
    // little glowing gold sparkles in different sizes (the same as the lily's sparkle), twinkling
    [[60, 205, 26, 0], [945, 150, 38, 1.3], [935, 300, 22, 2.6], [160, 568, 24, 3.9], [700, 70, 14, 5.1], [1000, 560, 16, 0.7], [400, 592, 12, 2.0]].forEach(([x, y, r, ph]) => {
      goldSparkle(c, x * k, y * ky, r * k, 0.7 + 0.3 * Math.sin(t * 2 + ph));
    });
    // the lily, top left
    drawLily(c, 240 * k, 230 * ky, 130 * k, t);
    // "Lily's Playhouse": the two lines are measured and moved together so they sit centered top to bottom
    c.fillStyle = F.words; c.textBaseline = "alphabetic";
    c.shadowColor = "rgba(172, 192, 242, 0.3)"; c.shadowBlur = 10 * k;
    const f1 = `500 ${172 * k}px Grandstander, "Chalkboard SE", "Comic Sans MS", ui-rounded, sans-serif`;
    const f2 = `500 ${200 * k}px Grandstander, "Chalkboard SE", "Comic Sans MS", ui-rounded, sans-serif`;
    c.font = f1; const m1 = c.measureText("Lily’s");
    c.font = f2; const m2 = c.measureText("Playhouse");
    const top = 290 * ky - (m1.actualBoundingBoxAscent || 172 * k * 0.75), bottom = 500 * ky + (m2.actualBoundingBoxDescent || 200 * k * 0.25);
    const dy = Hc / 2 - (top + bottom) / 2;
    c.font = f1; c.textAlign = "left"; c.fillText("Lily’s", 420 * k, 290 * ky + dy, 600 * k);
    c.font = f2; c.textAlign = "center"; c.fillText("Playhouse", 540 * k, 500 * ky + dy, 920 * k);
    c.restore();
  }

  window.LilyFlag = Object.freeze({ design, paint, drawLily });
})();
