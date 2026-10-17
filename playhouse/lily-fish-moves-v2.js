// Lily's fish moves (Pond chat, v2, Oct 17). v1: all five moves approved (Oct 16-17).
// v2 (Oct 17, approved by Jessica: "Love v2"): the jump plays 1.8x faster from the wind-up until he is back in the water, so a
//   leap is a quick burst (drawn small, the v1 timing looked like slow motion; found in the Hop Hop app). The jump's
//   shape is exactly the same; the splash back in, the bubbles and settling down play at normal speed.
//   jump(t, d): d.speed (default 1.8; 1 = v1 timing exactly). Callers: do NOT also speed up your own clock.
//   Every other move is exactly as in v1. Every fish shares these moves; the goldfish (the star) uses them most.
// A move turns time (seconds) into a pose: where the fish is (dx, dy in body units from its spot), how its nose is
// tipped (rot, radians), how it is squashed or stretched (sa along, sc across) and the drawing dials (opt) for LilyFish2D.
const LilyFishMoves = (() => {
  const TAU = Math.PI * 2;
  // 1. hover: swimming slowly while staying in the same place. A slow, gentle tail wave, a soft rise and fall
  //    (10 seconds), the nose tipping a little with it, and the side fins paddling to hold position.
  //    A tad calmer than the first try (Jessica, Oct 16): slower strokes (5 s), a softer tail, less rise and fall.
  //    APPROVED (Oct 16): "Lock that in for the most resting position." This is the fish's resting pose.
  function hover(t, o = {}) {
    const bob = o.bob === undefined ? 0.36 : o.bob, P = o.period || 10;
    const dy = bob * Math.sin(TAU * t / P), vy = bob * TAU / P * Math.cos(TAU * t / P);
    return { dx: 0.18 * Math.sin(TAU * t / (P * 1.5)), dy, rot: -0.09 * vy, sa: 1, sc: 1,
             opt: { ripple: (t / 5) % 1, rippleAmt: 0.5 } };
  }
  // 2. rise / sink: swimming up or down to a new height. The nose tips the way he is going, his tail beats faster and
  //    bigger while he moves, the tail lags a little behind each turn (follow-through), the fins sweep back, and he
  //    stretches a touch; then he levels off and settles back into his calm resting hover.
  //    APPROVED (Oct 16): "I really love it. Perfect."
  //    climb(t, plan): plan is a list of steps [{ at: seconds, to: height, dur: seconds }]; heights in body units (up = negative).
  const ease = p => p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
  function heightAt(t, plan) { let h = 0; for (const s of plan) { if (t <= s.at) break; h += (s.to - h) * ease((t - s.at) / s.dur); } return h; }
  function climb(t, plan, o = {}) {
    const dt = 1 / 60, h = heightAt(t, plan), v = (heightAt(t + dt, plan) - heightAt(t - dt, plan)) / (2 * dt);
    const a = (heightAt(t + dt, plan) - 2 * h + heightAt(t - dt, plan)) / (dt * dt);
    const move = Math.min(1, Math.abs(v) / 4);                       // 0 = resting ... 1 = swimming hard
    // the tail's clock: the calm 5-second stroke, speeding up to about 1.6 strokes a second while he moves
    let ph = 0; for (let s = 0; s < t; s += dt) { const vv = (heightAt(s + dt, plan) - heightAt(s - dt, plan)) / (2 * dt); ph += dt * (0.2 + 1.4 * Math.min(1, Math.abs(vv) / 4)); }
    const rest = hover(t), calm = 1 - move;
    const rot = Math.atan2(v, 7) * 0.8 + rest.rot * calm;              // nose up going up (v < 0), nose down going down (about 25 degrees at most)
    return { dx: rest.dx * calm, dy: h + rest.dy * calm, rot, sa: 1 + 0.06 * move, sc: 1 - 0.04 * move,
             opt: { ripple: ph % 1, rippleAmt: 0.5 + 0.45 * move, speed: 0.55 * move,
                    bend: Math.max(-1, Math.min(1, -a * 0.09)) } };   // starting up, the tail lags down (and the other way)
  }
  // 3. dive: diving down fast. A wind-up (he rises a hair and squashes a touch as his nose tips down), a burst
  //    forward and down (fast, strong tail beats, stretched long, fins swept back), a brake near the bottom (fins flare
  //    forward, he levels off), then he settles into his calm resting hover.
  //    APPROVED (Oct 16): "Perfect."
  //    dive(t, { at, depth, forward, dur }): starts at time "at"; depth and forward in body units; dur = burst seconds.
  function divePath(t, d) {
    const W = 0.35, tau = t - d.at;
    if (tau <= 0) return [0, 0];
    if (tau <= W) return [0, -0.5 * ease(tau / W)];
    const p = Math.min(1, (tau - W) / d.dur), k = 1 - Math.pow(1 - p, 2.4);
    return [d.forward * k, -0.5 + (d.depth + 0.5) * k];
  }
  function dive(t, d) {
    d = Object.assign({ at: 1.5, depth: 12, forward: 7, dur: 1.1 }, d);
    const dt = 1 / 60, A = divePath(t - dt, d), B = divePath(t, d), C = divePath(t + dt, d);
    const vx = (C[0] - A[0]) / (2 * dt), vy = (C[1] - A[1]) / (2 * dt), sp = Math.hypot(vx, vy);
    const ay = (C[1] - 2 * B[1] + A[1]) / (dt * dt);
    const tau = t - d.at, W = 0.35, m = Math.min(1, sp / 18);              // m: 0 resting ... 1 full speed
    const gather = tau > 0 && tau < W ? Math.sin(Math.PI * tau / W) : 0;   // the wind-up squash
    const p = (tau - W) / d.dur, brake = p > 0.55 && p < 1.25 ? Math.sin(Math.PI * (p - 0.55) / 0.7) : 0;
    let ph = 0; for (let s = 0; s < t; s += dt) {   // the tail's clock: calm strokes, racing up to about 3 a second in the burst
      const a2 = divePath(s - dt, d), c2 = divePath(s + dt, d), v2 = Math.hypot(c2[0] - a2[0], c2[1] - a2[1]) / (2 * dt);
      const tt = s - d.at; ph += dt * (0.2 + 2.8 * Math.min(1, v2 / 18) + (tt > 0 && tt < W ? 1.2 : 0)); }
    const rest = hover(t), calm = Math.max(0, 1 - 1.6 * m - gather - brake);
    // the nose tips down during the wind-up, then follows the way he is going (handing over smoothly in 0.2 s)
    const tip = tau <= 0 ? 0 : 0.5 * ease(tau / W), w = ease((tau - W) / 0.2);
    const head = sp > 0.5 ? Math.atan2(vy, vx + 3) * 0.75 * Math.min(1, sp / 4) : 0;
    const rot = tau > 0 ? tip * (1 - w) + head * w + rest.rot * calm : rest.rot * calm;
    return { dx: B[0] + rest.dx * calm, dy: B[1] + rest.dy * calm, rot,
             sa: 1 - 0.1 * gather + 0.16 * m, sc: 1 + 0.08 * gather - 0.09 * m,
             opt: { ripple: ph % 1, rippleAmt: 0.5 + 0.5 * Math.min(1, m * 1.4 + gather), speed: Math.max(-1, m - 0.6 * brake),
                    bend: Math.max(-1, Math.min(1, -ay * 0.03)) } };
  }
  // 4. jump: leaping out of the water and splashing back in. Positions are measured from the water's surface
  //    (y = 0 is the surface, + is down). Wind-up (he sinks a hair, nose tips up), a rush up to the surface (speeding
  //    up), out with a small splash, an arc through the air (nose follows the arc, tail flipping), back in nose first
  //    with a bigger splash, then he slows under the water (bubbles trailing), levels off and rests.
  //    APPROVED (Oct 16): "Great."
  //    jump(t, { at, depth, peak }) returns a pose plus .splashes (for drawSplash) and .bubbles.
  function jumpPlan(d) {
    const W = 0.3, Ta = 0.75, ex = [5, 0], st = [0, d.depth + 0.4];
    const vx = 2 * (ex[0] - st[0]) / Ta, vy = 2 * (ex[1] - st[1]) / Ta;   // speed leaving the water
    const g = vy * vy / (2 * d.peak), Tair = -2 * vy / g, K = 3;          // gravity set so he reaches the chosen height
    return { W, Ta, ex, st, vx, vy, g, Tair, K, en: [ex[0] + vx * Tair, 0], t1: d.at + W, t2: d.at + W + Ta, t3: d.at + W + Ta + Tair };
  }
  function jumpPath(t, d, J) {
    if (t <= d.at) return [0, d.depth];
    if (t <= J.t1) return [0, d.depth + 0.4 * ease((t - d.at) / J.W)];
    if (t <= J.t2) { const k = Math.pow((t - J.t1) / J.Ta, 2); return [J.st[0] + (J.ex[0] - J.st[0]) * k, J.st[1] + (J.ex[1] - J.st[1]) * k]; }
    if (t <= J.t3) { const u = t - J.t2; return [J.ex[0] + J.vx * u, J.vy * u + J.g * u * u / 2]; }
    const u = t - J.t3, f = (1 - Math.exp(-J.K * u)) / J.K, vyIn = -J.vy;   // slowing down under the water (water drag)
    return [J.en[0] + J.vx * f, vyIn * f];
  }
  // v2: the leap plays faster (speed, default 1.8) from the wind-up until he is back in the water; then normal time again
  function jump(t, d) {
    d = Object.assign({ at: 1.2, depth: 14, peak: 15, speed: 1.8 }, d);
    const S = d.speed; if (S === 1) return jumpCore(t, d);   // v1 timing exactly
    const J0 = jumpPlan(d), fastEnd = d.at + (J0.t3 - d.at) / S;   // when he is back in the water, in real time
    const tt = t <= d.at ? t : t <= fastEnd ? d.at + (t - d.at) * S : J0.t3 + (t - fastEnd);
    return jumpCore(tt, d);
  }
  function jumpCore(t, d) {   // high enough that his whole body (and tail) clears the water
    const J = jumpPlan(d), dt = 1 / 120, A = jumpPath(t - dt, d, J), B = jumpPath(t, d, J), C = jumpPath(t + dt, d, J);
    const vx = (C[0] - A[0]) / (2 * dt), vy = (C[1] - A[1]) / (2 * dt), sp = Math.hypot(vx, vy);
    const inAir = t > J.t2 && t < J.t3, m = Math.min(1, sp / 18), tau = t - d.at;
    const settle = t > J.t3 ? ease((t - J.t3 - 0.5) / 1.2) : 0;           // after the splash he eases back into his rest
    const rest = hover(t), calm = t < d.at ? 1 : settle;
    const tip = tau > 0 && tau <= J.W ? -0.55 * ease(tau / J.W) : 0;      // wind-up: nose tips up
    const w = ease((t - J.t1) / 0.15), head = Math.atan2(vy, Math.max(0.01, vx)) * (inAir ? 1 : Math.min(1, sp / 8));
    let rot = t <= J.t1 ? tip : tip * (1 - w) + head * w; rot = rot * (1 - calm) + rest.rot * calm;
    let ph = 0; for (let s = 0; s < t; s += 1 / 60) {                       // tail clock: fast in the rush, flipping in the air
      const a2 = jumpPath(s - 1 / 60, d, J), c2 = jumpPath(s + 1 / 60, d, J), v2 = Math.hypot(c2[0] - a2[0], c2[1] - a2[1]) * 30;
      ph += (1 / 60) * (s > J.t2 && s < J.t3 ? 1.6 : 0.2 + 2.8 * Math.min(1, v2 / 18)); }
    const pose = { dx: B[0] + rest.dx * calm, dy: B[1] + rest.dy * calm, rot,
      sa: 1 + (inAir ? 0.08 : 0.14 * m) * (1 - calm), sc: 1 - (inAir ? 0.05 : 0.08 * m) * (1 - calm),
      opt: { ripple: ph % 1, rippleAmt: inAir ? 0.85 : 0.5 + 0.5 * m * (1 - calm), speed: inAir ? 0.4 : m * (1 - calm), bend: 0 } };
    pose.splashes = [{ x: J.ex[0], age: t - J.t2, size: 0.6, seed: 1 }, { x: J.en[0], age: t - J.t3, size: 1, seed: 2 }].filter(s => s.age >= 0 && s.age < 2.2);
    pose.bubbles = t > J.t3 && t - J.t3 < 2.4 ? { x0: J.en[0], age: t - J.t3, path: u => jumpPath(J.t3 + u, d, J) } : null;
    return pose;
  }
  // a splash at the surface: droplets flying up and falling back, a burst of foam, and rings spreading out.
  // (x, y) = where it happens on screen, s = pixels per body unit, age in seconds, size 0 ... 1.
  function drawSplash(ctx, x, y, s, sp) {
    const a = sp.age, Z = sp.size, rnd = (i, k) => { const h = Math.sin(i * 127.1 + k * 311.7 + sp.seed * 74.7) * 43758.5453; return h - Math.floor(h); };
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let r = 0; r < 2; r++) {   // rings spreading on the surface
      const ra = a - r * 0.25; if (ra <= 0) continue; const R = (3 + 12 * ra) * (0.6 + 0.4 * Z), al = Math.max(0, 0.6 * (1 - ra / 1.8));
      ctx.strokeStyle = `rgba(255, 255, 255, ${al})`; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.ellipse(0, 0, R, R * 0.18, 0, 0, Math.PI * 2); ctx.stroke(); }   // (sizes in body units)
    if (a < 0.7) {   // foam burst
      const f = Math.sin(Math.PI * Math.min(1, a / 0.7)), g = ctx.createRadialGradient(0, 0, 0, 0, 0, 6 * Z + 2);
      g.addColorStop(0, `rgba(255, 255, 255, ${0.9 * f})`); g.addColorStop(0.5, `rgba(200, 228, 250, ${0.6 * f})`); g.addColorStop(1, "rgba(170, 210, 245, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -0.3, 6 * Z + 2, (2.2 * Z + 0.8), 0, 0, Math.PI * 2); ctx.fill(); }
    if (a < 0.75) {   // the crown: white sheets of water shooting up around the spot, leaning outward, then falling back
      const N = Math.round(8 + 7 * Z), Wd = 4 + 5 * Z, life = 0.8;
      for (let i = 0; i < N; i++) {
        const o = N > 1 ? i / (N - 1) - 0.5 : 0, bx = o * Wd, H = (4 + 6 * Z) * (0.65 + 0.35 * rnd(i, 7)) * (1 - 1.2 * Math.abs(o)),
          h = H * Math.sin(Math.PI * Math.min(1, a / life)), lean = o * 2.6 * (0.6 + a), w = 0.32 + 0.3 * rnd(i, 8), al = 0.85 * (1 - a / life);
        if (h < 0.1) continue;
        const cg = ctx.createLinearGradient(0, 0.2, 0, -h); cg.addColorStop(0, `rgba(150, 200, 242, ${al})`); cg.addColorStop(0.55, `rgba(205, 232, 252, ${al})`); cg.addColorStop(1, `rgba(255, 255, 255, ${al})`);
        ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(bx - w, 0.2);   // the water's blue at the bottom, bright white at the tip
        ctx.quadraticCurveTo(bx - w * 0.4 + lean * 0.3, -h * 0.55, bx + lean, -h); ctx.quadraticCurveTo(bx + w * 0.4 + lean * 0.3, -h * 0.55, bx + w, 0.2);
        ctx.closePath(); ctx.fill();
      }
    }
    const n = Math.round(14 + 18 * Z);
    for (let i = 0; i < n; i++) {   // droplets: thrown up and out, falling back under gravity, fading
      const ang = -Math.PI / 2 + (rnd(i, 1) - 0.5) * 2.2, v = (14 + 18 * rnd(i, 2)) * (0.6 + 0.5 * Z), life = 0.8 + 0.6 * rnd(i, 3);
      if (a > life) continue; const px = Math.cos(ang) * v * a, py = Math.sin(ang) * v * a + 44 * a * a / 2;
      if (py > 0.2) continue; const r = (0.4 + 0.5 * rnd(i, 4)) * (1 - 0.5 * a / life), al = 0.92 * (1 - a / life);
      ctx.fillStyle = `rgba(165, 210, 246, ${al})`; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();   // a drop of water, blue with a white shine
      ctx.fillStyle = `rgba(255, 255, 255, ${al})`; ctx.beginPath(); ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  // bubbles trailing behind him after he splashes in, wobbling up and fading
  function drawBubbles(ctx, x, y, s, B) {
    if (!B) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 14; i++) {
      const born = i * 0.06, a = B.age - born; if (a <= 0 || a > 1.6) continue;
      const p = B.path(born), px = p[0] - 2.5 + Math.sin(i * 2.3 + a * 6) * 0.4, py = p[1] - 2.5 * a + (i % 3) * 0.8;
      if (py < 0.3) continue; const r = 0.3 + 0.25 * ((i * 7) % 5) / 4, al = 0.7 * (1 - a / 1.6);
      ctx.strokeStyle = `rgba(255, 255, 255, ${al})`; ctx.lineWidth = 0.12; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${al * 0.25})`; ctx.fill(); }
    ctx.restore();
  }
  // 5. depth: swimming into the background or out into the foreground. z = 0 is his usual distance, -1 far away,
  //    +1 close up. Far away he is smaller, softly tinted by the water and a touch blurry; close up he is bigger and crisp.
  //    While he travels toward or away from us his body looks a little shorter (he is partly turned), his tail beats
  //    faster, and then he settles into his resting hover at the new distance.
  //    depthSwim(t, plan): plan = [{ at, z, dur, forward }] (forward = how far he swims sideways, in body units at z = 0).
  const zScale = z => Math.pow(2, 0.75 * z);   // far (-1): about 0.6x ... near (+1): about 1.7x
  function depthState(t, plan) { let z = 0, x = 0; for (const s of plan) { if (t <= s.at) break; const e = ease((t - s.at) / s.dur); z += (s.z - z) * e; x += s.forward * e; } return [z, x]; }
  function depthSwim(t, plan) {
    const dt = 1 / 60, [z, x] = depthState(t, plan), [z1, x1] = depthState(t + dt, plan), [z0, x0] = depthState(t - dt, plan);
    const vz = (z1 - z0) / (2 * dt), vx = (x1 - x0) / (2 * dt), move = Math.min(1, Math.abs(vz) * 1.6 + Math.abs(vx) / 6);
    let ph = 0; for (let s = 0; s < t; s += dt) { const [a] = depthState(s - dt, plan), [b] = depthState(s + dt, plan), [, ax] = depthState(s - dt, plan), [, bx] = depthState(s + dt, plan);
      ph += dt * (0.2 + 1.4 * Math.min(1, Math.abs(b - a) / (2 * dt) * 1.6 + Math.abs(bx - ax) / (2 * dt) / 6)); }
    const rest = hover(t), calm = 1 - move, turn = Math.min(1, Math.abs(vz) * 1.8);   // turned partly toward or away from us
    // turning partly toward or away from us shortens his whole body, eyes included (eyeTurn: the eye is NOT kept
    // round here, unlike a squash-and-stretch; Jessica, Oct 17)
    return { dx: x + rest.dx * calm, dy: rest.dy * calm - 2.5 * z, rot: rest.rot * calm, z,
             sa: 1 - 0.24 * turn, sc: 1, eyeTurn: true, opt: { ripple: ph % 1, rippleAmt: 0.5 + 0.4 * move, speed: 0.4 * move } };
  }
  // draw a fish at a distance: size, the water's soft tint and blur come from pose.z (0 when there is no z).
  // water = the water's color "r, g, b" (the game passes its own); haze only shows when he is farther than usual.
  let OFF = null;
  function drawAtDepth(ctx, name, pose, x, y, s, facing = 1, water = "120, 160, 220") {
    const z = pose.z || 0, k = zScale(z), haze = Math.max(0, -z), W = ctx.canvas.width, H = ctx.canvas.height;
    if (!OFF || OFF.width !== W || OFF.height !== H) { OFF = document.createElement("canvas"); OFF.width = W; OFF.height = H; }
    const o = OFF.getContext("2d"); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.setTransform(ctx.getTransform());
    draw(o, name, Object.assign({}, pose, { dx: pose.dx / k, dy: pose.dy / k }), x, y, s * k, facing);
    if (haze > 0) { o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-atop"; o.fillStyle = `rgba(${water}, ${0.5 * haze})`; o.fillRect(0, 0, W, H); o.globalCompositeOperation = "source-over"; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (haze > 0) ctx.filter = `blur(${(1.6 * haze).toFixed(2)}px)`; ctx.drawImage(OFF, 0, 0); ctx.restore();
  }
  // draw a fish in a pose at (x, y) on the screen, s pixels per body unit; facing -1 turns it to swim left
  function draw(ctx, name, pose, x, y, s, facing = 1) {
    ctx.save(); ctx.translate(x + pose.dx * s * facing, y + pose.dy * s); ctx.scale(facing, 1); ctx.rotate(pose.rot);
    ctx.scale(s * pose.sa, s * pose.sc);
    // a squash or stretch keeps the eye round; a turn (pose.eyeTurn) shortens the eye along with the body
    LilyFish2D.draw(ctx, name, Object.assign({ stretchAlong: pose.eyeTurn ? 1 : pose.sa, stretchAcross: pose.eyeTurn ? 1 : pose.sc }, pose.opt));
    ctx.restore();
  }
  return Object.freeze({ hover, climb, heightAt, dive, jump, drawSplash, drawBubbles, depthSwim, drawAtDepth, zScale, draw });
})();
