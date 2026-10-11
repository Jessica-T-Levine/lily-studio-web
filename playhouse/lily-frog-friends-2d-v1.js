/*
  Lily Studio Frog Friends, flat 2D, version 1
  ------------------------------------------------
  Hop Hop's friends drawn in the same flat 2D style as the live Lily's Hop Hop game.
  Colors and shape settings are copied from the approved 3D friends (lily-creatures-v5.js, Oct 10, 2026),
  so each friend matches its 3D twin. "ours" is the original flat Hop Hop, drawn exactly as the game draws him.

  Use:  LilyFrogFriends2D.draw(ctx, "golden", pose)     (origin = the middle of his feet, 1 unit = 1 game unit;
        the live game scales him 1.38x, then also scale by LilyFrogFriends2D.palettes[name].size)
  pose (all optional): jump, blink, happy (closed happy eyes), lick, oops, charging, charge (0..1), lookX, lookY
  Names: ours, golden, blue, lime, hunter, ember, pink, lavender, mint
*/
(function (root) {
  "use strict";
  const PAL = {"ours":{"name":"Hop Hop","skin":["#3e9658","#5dba73","#a0e2ac"],"leg":["#2c6e40","#3f9458","#68b87c"],"belly":["#aadea0","#d2f2c6","#ecfbe4"],"cheek":"#ff85ab","mark":0,"markCol":"#ffffff","bump":1,"size":1,"wide":1,"tall":1,"legs":1,"gap":1,"drop":0,"eyeK":1,"cheekK":1,"tummyK":1,"tummyD":0,"fade":0,"frontK":1},"golden":{"name":"Golden","skin":["#c48018","#eeb230","#ffe280"],"leg":["#a06010","#d28c20","#f5be50"],"belly":["#fae296","#fff0be","#fffae2"],"cheek":"#ff8078","mark":0,"markCol":"#ffffff","bump":1,"size":1.1,"wide":1.14,"tall":0.96,"legs":1.15,"gap":1,"drop":0,"eyeK":1,"cheekK":2,"tummyK":1,"tummyD":0,"fade":0,"frontK":1},"blue":{"name":"Blue","skin":["#1c4caa","#3880e0","#84bafc"],"leg":["#123480","#265cb8","#5892e2"],"belly":["#bed6fa","#deecff","#f4faff"],"cheek":"#ff8caa","mark":1,"markCol":"#161e4e","bump":1.1,"size":0.72,"wide":0.88,"tall":1.05,"legs":0.85,"gap":1,"drop":0,"eyeK":1,"cheekK":1,"tummyK":0.85,"tummyD":2.2,"fade":0,"frontK":1},"lime":{"name":"Treetop","skin":["#3a9628","#68c83c","#bef078"],"leg":["#d65c14","#fa8c28","#ffb85a"],"belly":["#fff4c8","#fffae0","#fffff4"],"cheek":"#ff9678","mark":2,"markCol":"#96c8ff","bump":1.14,"size":1,"wide":0.9,"tall":1.06,"legs":1,"gap":1.12,"drop":0,"eyeK":1,"cheekK":1,"tummyK":1,"tummyD":0,"fade":0,"frontK":1},"hunter":{"name":"Hunter","skin":["#1e462c","#366c42","#6c9e72"],"leg":["#163420","#285634","#50825c"],"belly":["#cee2c0","#e2f0d4","#f4faec"],"cheek":"#ff968c","mark":3,"markCol":"#0e2216","bump":0.94,"size":1.3,"wide":1.16,"tall":0.72,"legs":1.2,"gap":0.92,"drop":8,"eyeK":0.8,"cheekK":1,"tummyK":0.8,"tummyD":0,"fade":0,"frontK":1},"ember":{"name":"Ember","skin":["#be3824","#f0683c","#ffa878"],"leg":["#8c241c","#c8462c","#f07850"],"belly":["#ffdec4","#ffeeda","#fff8ee"],"cheek":"#ff9696","mark":1,"markCol":"#342230","bump":1.05,"size":0.8,"wide":1.06,"tall":0.94,"legs":0.9,"gap":0.78,"drop":0,"eyeK":1,"cheekK":1,"tummyK":1,"tummyD":0,"fade":0.5,"frontK":1},"pink":{"name":"Pink","skin":["#f096be","#ffb8d6","#ffdeee"],"leg":["#d670a0","#f094be","#ffbed8"],"belly":["#fff0f6","#fff8fb","#fffcfe"],"cheek":"#ff6e8c","mark":0,"markCol":"#ffffff","bump":1.08,"size":0.9,"wide":0.9,"tall":1.04,"legs":0.85,"gap":1.05,"drop":0,"eyeK":1,"cheekK":1,"tummyK":0.8,"tummyD":0,"fade":0,"frontK":1.2},"lavender":{"name":"Lavender","skin":["#a080de","#c6a6fa","#e6d4ff"],"leg":["#8060be","#aa88e6","#d0b8f8"],"belly":["#f4eeff","#faf6ff","#fefcff"],"cheek":"#ff82b4","mark":3,"markCol":"#ffffff","bump":1.04,"size":1,"wide":1.1,"tall":1,"legs":1.1,"gap":0.95,"drop":0,"eyeK":1,"cheekK":1,"tummyK":1,"tummyD":0,"fade":0,"frontK":1},"mint":{"name":"Mint","skin":["#60cdb8","#8cecd6","#c8fcee"],"leg":["#3aa692","#64d0ba","#9eecd6"],"belly":["#f0fffa","#f6fffc","#fcfffe"],"cheek":"#ff82a0","mark":2,"markCol":"#ecfff9","bump":1,"size":0.92,"wide":0.95,"tall":1.08,"legs":1,"gap":1.05,"drop":0,"eyeK":1,"cheekK":1,"tummyK":0.8,"tummyD":0,"fade":0,"frontK":1}};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"; };
  const darker = (h, k) => { const c = [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * k)); return "rgb(" + c.join(",") + ")"; };
  const rgba = (h, a) => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return "rgba(" + c.join(",") + "," + a + ")"; };
  // the flat colors for each friend (ours = the original game colors, untouched)
  function colorsOf(p, ours) {
    if (ours) return { top: "#6CC47E", bot: "#4FAE68", dark: "#3A8A52", belly: "#C9F2C2", bump: "#62BC76", cheek: "rgba(255, 130, 170, 0.55)" };
    return { top: mixHex(p.skin[1], p.skin[2], 0.4), bot: p.skin[1], dark: p.leg[1], belly: p.belly[1], bump: mixHex(p.skin[1], p.skin[2], 0.2), cheek: rgba(p.cheek, 0.55) };
  }
  // simple seeded random so a friend's spots are always in the same places
  const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function draw(ctx, name, pose) {
    const p = PAL[name] || PAL.ours; pose = pose || {};
    const ours = p === PAL.ours, C = colorsOf(p, ours);
    const W = p.wide, T = p.tall, LG = 1 + (p.legs - 1) * 0.6, CK = 1 + (p.cheekK - 1) * 0.5, FD = p.drop;   // flat versions soften leg and cheek size so they don't swamp the face
    const jump = !!pose.jump, charging = !!pose.charging, charge = pose.charge || 0;
    const closedHappy = !!pose.happy, blink = !!pose.blink;
    ctx.save();
    // back legs (the fade is only on the legs: darker toward the feet)
    const legFill = (cy, ry) => {
      if (!p.fade) return C.dark;
      const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry + 1);
      g.addColorStop(0, C.dark); g.addColorStop(1, darker(p.leg[1], 1 - p.fade)); return g;
    };
    if (jump) {
      ctx.fillStyle = legFill(-6, 5);
      ctx.beginPath(); ctx.ellipse(-20 * W, -6, 14 * LG, 5 * LG, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18 * W, -6, 12 * LG, 5 * LG, 0.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = legFill(-7, 8 * LG);
      ctx.beginPath(); ctx.ellipse(-17 * W, -7, 11 * LG, 8 * LG, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(17 * W, -7, 11 * LG, 8 * LG, 0, 0, Math.PI * 2); ctx.fill();
    }
    // body: a flat egg, bottom resting on the ground. wide = chubby or slim, tall = taller or shorter
    const bcy = -20 * T, brx = 23 * W, bry = 20 * T;
    const bg = ctx.createLinearGradient(0, -44 * T, 0, 0);
    bg.addColorStop(0, C.top); bg.addColorStop(1, C.bot);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, bcy, brx, bry, 0, 0, Math.PI * 2); ctx.fill();
    // back markings, clipped to the body (side stripes, round spots or speckles)
    if (p.mark) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, bcy, brx, bry, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = p.markCol; ctx.strokeStyle = p.markCol;
      const R = rnd(7);
      if (p.mark === 1) {
        [[-20, -15, 3], [21, -16, 3.1], [-17, -31, 2.4], [19, -31, 2.6], [-23, -26, 2], [23, -25, 2.1]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * W, y * T, r * (0.9 + 0.2 * R()), 0, Math.PI * 2); ctx.fill(); });
      } else if (p.mark === 2) {
        ctx.lineWidth = 2.6; ctx.lineCap = "round";
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * 19 * W, -36 * T); ctx.quadraticCurveTo(s * 25 * W, -22 * T, s * 17 * W, -6 * T); ctx.stroke(); });
      } else {
        for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); const x = Math.cos(a) * d * brx * 0.9, y = bcy + Math.sin(a) * d * bry * 0.9; if (Math.abs(x) < 11 * W) continue; ctx.beginPath(); ctx.arc(x, y, 0.9 + R() * 0.9, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
    // belly (tummyK = size, tummyD = how far it sits lower)
    ctx.fillStyle = C.belly;
    ctx.beginPath(); ctx.ellipse(3 * W, -13 * T + p.tummyD * 0.7 + FD * 0.2, 14 * W * p.tummyK, 11 * T * p.tummyK, 0, 0, Math.PI * 2); ctx.fill();
    // eye bumps (gap = how far apart, drop = how low they sit, bump = how big)
    const by = -38 * T + FD * 0.45, bx = 1, off = 10 * p.gap, br = 9.5 * p.bump;
    const eyeY = by;
    ctx.fillStyle = C.bump;
    ctx.beginPath(); ctx.arc(bx - off, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + off, by, br, 0, Math.PI * 2); ctx.fill();
    // eyes
    const lookX = pose.lookX != null ? pose.lookX : (jump ? 2.5 : 1.5), lookY = pose.lookY || 0, ek = p.bump * p.eyeK;
    [bx - off, bx + off].forEach(ex => {
      const ey = eyeY;
      if (closedHappy) {
        ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ex - 4.5 * ek, ey + 1.5); ctx.quadraticCurveTo(ex, ey - 4 * ek, ex + 4.5 * ek, ey + 1.5); ctx.stroke();
      } else if (blink) {
        ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ex - 4.5 * ek, ey); ctx.quadraticCurveTo(ex, ey + 3 * ek, ex + 4.5 * ek, ey); ctx.stroke();
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(ex, ey, 6.5 * ek, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2E2440";
        const pr = (charging ? 3.2 + charge * 1.2 : 3.4) * ek;
        ctx.beginPath(); ctx.arc(ex + lookX * ek, ey + lookY * ek, pr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(ex + lookX * ek + 1.2 * ek, ey + lookY * ek - 1.3 * ek, 1.1 * ek, 0, Math.PI * 2); ctx.fill();
      }
    });
    // cheeks (cheekK = size)
    ctx.fillStyle = C.cheek;
    ctx.beginPath(); ctx.ellipse(-14 * W, -24 * T + FD * 0.3, 4.5 * CK, 3 * CK, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(18 * W, -24 * T + FD * 0.3, 4.5 * CK, 3 * CK, 0, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2; ctx.lineCap = "round";
    const my = (v) => v * T + FD * 0.3;
    ctx.beginPath();
    if (pose.lick) { ctx.ellipse(4, my(-25), 3.6, 2.8, 0, 0, Math.PI * 2); ctx.fillStyle = "#6B2E4A"; ctx.fill(); }
    else if (pose.oops) { ctx.arc(3, my(-23), 3.2, 0, Math.PI * 2); }
    else if (closedHappy) { ctx.moveTo(-5, my(-28)); ctx.quadraticCurveTo(3, my(-19), 11, my(-28)); }
    else if (charging) { ctx.moveTo(-3, my(-26)); ctx.lineTo(9, my(-26)); }
    else { ctx.moveTo(-4, my(-28)); ctx.quadraticCurveTo(3, my(-22), 10, my(-28)); }
    ctx.stroke();
    // front feet (frontK = bigger front legs)
    if (!jump) {
      ctx.fillStyle = legFill(-1, 2.6 * p.frontK);
      ctx.beginPath(); ctx.ellipse(-6 * W, -1, 5 * p.frontK, 2.6 * p.frontK, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10 * W, -1, 5 * p.frontK, 2.6 * p.frontK, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  root.LilyFrogFriends2D = Object.freeze({ draw, palettes: PAL, names: Object.keys(PAL), version: "1" });
})(typeof window !== "undefined" ? window : globalThis);
