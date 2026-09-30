/* Lily's Playhouse: THE design of the playhouse (v1, Sept 30, 2026).
   This is the one place the playhouse's look lives (like the creature library is for the animals).
   Everything that shows the playhouse draws it from here:
     - the big 3D playhouse in Lily's Playhouse world
     - the tiny playhouse on the Playhouse's games button
   Change the playhouse here (colors, sizes, windows, door, roof) and it changes everywhere at once.

   Units are the world's units. Walls: u runs along a wall (0 = its middle), v goes up from the ground.
     LilyPlayhouse.design            the numbers and colors
     LilyPlayhouse.drawIcon(ctx, cx, cy, size, night)   the playhouse seen from the front, as a small picture
                                     (cx, cy = middle of the picture; size = how tall it is; night = 0..1) */
(function () {
  "use strict";
  const design = {
    version: 1,
    size: { w: 920, d: 640, wallH: 520, roofZ: 960 },      // width, depth, wall height, roof peak
    colors: {
      front: "#FFF6E6", back: "#F6E6D2", left: "#F1DCC4", right: "#F7E7D4", wallLine: "rgba(180, 140, 110, 0.35)",
      roofL: "#E0559F", roofR: "#F966BC", roofLine: "#D4509E", roofEdge: "#F966BC",
      door: "#6B4C9A", doorLine: "#57397F", doorPanel: "rgba(255, 255, 255, 0.22)", knob: "#FFD36E",
      glassDay: "#BFE3F7", glassNight: "#FFE08A", glow: "rgba(255, 210, 122, 0.9)", frame: "#FFFFFF", flowerBox: "#FF9EC3"
    },
    front: {                                                  // the front and back walls (the front has the door)
      windows: [[-270, 190, 150, 150], [270, 190, 150, 150]],  // [u, bottom, width, height]
      flowerBoxes: [[-270, 160, 170, 26], [270, 160, 170, 26]],
      roundWindow: [0, 690, 70],                               // [u, v, radius] up in the gable
      door: { w: 250, h: 340, panels: [[-58, 86, 270], [58, 86, 270]], knob: [80, 160, 12] },
      roofEdge: { over: 45, top: 25, low: 45, thick: 70 }       // the pink edge that hangs out over the gable
    },
    side: { windows: [[-170, 200, 140, 150], [170, 200, 140, 150]] },
    chimneySmoke: { u: 200, depth: -60, below: 120 }           // where the little puff of smoke rises
  };

  // the playhouse seen straight from the front, as a small picture
  function drawIcon(ctx, cx, cy, size, night) {
    const S = design.size, C = design.colors, Fr = design.front, n = night || 0;
    const hw = S.w / 2 + Fr.roofEdge.over, totalH = S.roofZ + Fr.roofEdge.top;
    const k = size / totalH, base = cy + size / 2;
    const X = u => cx + u * k, Y = v => base - v * k;
    const poly = pts => { ctx.beginPath(); pts.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v)))); ctx.closePath(); };
    const lw = w => Math.max(0.6, w * k * 3.2);
    ctx.save();
    ctx.lineJoin = "round";
    // walls and gable
    poly([[-S.w / 2, 0], [S.w / 2, 0], [S.w / 2, S.wallH], [0, S.roofZ], [-S.w / 2, S.wallH]]);
    ctx.fillStyle = C.front; ctx.fill(); ctx.strokeStyle = C.wallLine; ctx.lineWidth = lw(1.5); ctx.stroke();
    const glass = n > 0.3 ? C.glassNight : C.glassDay;
    Fr.windows.forEach(([u, v, w, h]) => {
      poly([[u - w / 2, v], [u + w / 2, v], [u + w / 2, v + h], [u - w / 2, v + h]]);
      ctx.fillStyle = glass; ctx.fill(); ctx.strokeStyle = C.frame; ctx.lineWidth = lw(3); ctx.stroke();
    });
    Fr.flowerBoxes.forEach(([u, v, w, h]) => { poly([[u - w / 2, v], [u + w / 2, v], [u + w / 2, v + h], [u - w / 2, v + h]]); ctx.fillStyle = C.flowerBox; ctx.fill(); });
    const [ru, rv, rr] = Fr.roundWindow;
    ctx.beginPath(); ctx.arc(X(ru), Y(rv), rr * k, 0, Math.PI * 2); ctx.fillStyle = glass; ctx.fill(); ctx.strokeStyle = C.frame; ctx.lineWidth = lw(4); ctx.stroke();
    // the pink roof edge over the gable
    const E = Fr.roofEdge, Wz = S.wallH, R = S.roofZ;
    poly([[-hw, Wz - E.low], [0, R + E.top], [hw, Wz - E.low], [hw, Wz - E.low - E.thick], [0, R - E.low], [-hw, Wz - E.low - E.thick]]);
    ctx.fillStyle = C.roofEdge; ctx.fill(); ctx.strokeStyle = C.roofLine; ctx.lineWidth = lw(3); ctx.stroke();
    // the door (an arch), closed
    const D = Fr.door, r = D.w / 2;
    ctx.beginPath(); ctx.moveTo(X(-r), Y(0)); ctx.lineTo(X(-r), Y(D.h - r)); ctx.arc(X(0), Y(D.h - r), r * k, Math.PI, 0); ctx.lineTo(X(r), Y(0)); ctx.closePath();
    ctx.fillStyle = C.door; ctx.fill(); ctx.strokeStyle = C.doorLine; ctx.lineWidth = lw(3); ctx.stroke();
    const [ku, kv, kr] = D.knob;
    ctx.beginPath(); ctx.arc(X(ku), Y(kv), Math.max(0.8, kr * k), 0, Math.PI * 2); ctx.fillStyle = C.knob; ctx.fill();
    ctx.restore();
  }

  window.LilyPlayhouse = { design, drawIcon };
})();
