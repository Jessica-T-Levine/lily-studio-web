const LilyFishMoves = (() => {
  const TAU = Math.PI * 2;
  function hover(t, o = {}) {
    const bob = o.bob === undefined ? .36 : o.bob, P = o.period || 10;
    const dy = bob * Math.sin(TAU * t / P), vy = bob * TAU / P * Math.cos(TAU * t / P);
    return {
      dx: .18 * Math.sin(TAU * t / (P * 1.5)),
      dy: dy,
      rot: -.09 * vy,
      sa: 1,
      sc: 1,
      opt: {
        ripple: t / 5 % 1,
        rippleAmt: .5
      }
    };
  }
  const ease = p => p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
  function heightAt(t, plan) {
    let h = 0;
    for (const s of plan) {
      if (t <= s.at) break;
      h += (s.to - h) * ease((t - s.at) / s.dur);
    }
    return h;
  }
  function climb(t, plan, o = {}) {
    const dt = 1 / 60, h = heightAt(t, plan), v = (heightAt(t + dt, plan) - heightAt(t - dt, plan)) / (2 * dt);
    const a = (heightAt(t + dt, plan) - 2 * h + heightAt(t - dt, plan)) / (dt * dt);
    const move = Math.min(1, Math.abs(v) / 4);
    let ph = 0;
    for (let s = 0; s < t; s += dt) {
      const vv = (heightAt(s + dt, plan) - heightAt(s - dt, plan)) / (2 * dt);
      ph += dt * (.2 + 1.4 * Math.min(1, Math.abs(vv) / 4));
    }
    const rest = hover(t), calm = 1 - move;
    const rot = Math.atan2(v, 7) * .8 + rest.rot * calm;
    return {
      dx: rest.dx * calm,
      dy: h + rest.dy * calm,
      rot: rot,
      sa: 1 + .06 * move,
      sc: 1 - .04 * move,
      opt: {
        ripple: ph % 1,
        rippleAmt: .5 + .45 * move,
        speed: .55 * move,
        bend: Math.max(-1, Math.min(1, -a * .09))
      }
    };
  }
  function divePath(t, d) {
    const W = .35, tau = t - d.at;
    if (tau <= 0) return [ 0, 0 ];
    if (tau <= W) return [ 0, -.5 * ease(tau / W) ];
    const p = Math.min(1, (tau - W) / d.dur), k = 1 - Math.pow(1 - p, 2.4);
    return [ d.forward * k, -.5 + (d.depth + .5) * k ];
  }
  function dive(t, d) {
    d = Object.assign({
      at: 1.5,
      depth: 12,
      forward: 7,
      dur: 1.1
    }, d);
    const dt = 1 / 60, A = divePath(t - dt, d), B = divePath(t, d), C = divePath(t + dt, d);
    const vx = (C[0] - A[0]) / (2 * dt), vy = (C[1] - A[1]) / (2 * dt), sp = Math.hypot(vx, vy);
    const ay = (C[1] - 2 * B[1] + A[1]) / (dt * dt);
    const tau = t - d.at, W = .35, m = Math.min(1, sp / 18);
    const gather = tau > 0 && tau < W ? Math.sin(Math.PI * tau / W) : 0;
    const p = (tau - W) / d.dur, brake = p > .55 && p < 1.25 ? Math.sin(Math.PI * (p - .55) / .7) : 0;
    let ph = 0;
    for (let s = 0; s < t; s += dt) {
      const a2 = divePath(s - dt, d), c2 = divePath(s + dt, d), v2 = Math.hypot(c2[0] - a2[0], c2[1] - a2[1]) / (2 * dt);
      const tt = s - d.at;
      ph += dt * (.2 + 2.8 * Math.min(1, v2 / 18) + (tt > 0 && tt < W ? 1.2 : 0));
    }
    const rest = hover(t), calm = Math.max(0, 1 - 1.6 * m - gather - brake);
    const tip = tau <= 0 ? 0 : .5 * ease(tau / W), w = ease((tau - W) / .2);
    const head = sp > .5 ? Math.atan2(vy, vx + 3) * .75 * Math.min(1, sp / 4) : 0;
    const rot = tau > 0 ? tip * (1 - w) + head * w + rest.rot * calm : rest.rot * calm;
    return {
      dx: B[0] + rest.dx * calm,
      dy: B[1] + rest.dy * calm,
      rot: rot,
      sa: 1 - .1 * gather + .16 * m,
      sc: 1 + .08 * gather - .09 * m,
      opt: {
        ripple: ph % 1,
        rippleAmt: .5 + .5 * Math.min(1, m * 1.4 + gather),
        speed: Math.max(-1, m - .6 * brake),
        bend: Math.max(-1, Math.min(1, -ay * .03))
      }
    };
  }
  function jumpPlan(d) {
    const W = .3, Ta = .75, ex = [ 5, 0 ], st = [ 0, d.depth + .4 ];
    const vx = 2 * (ex[0] - st[0]) / Ta, vy = 2 * (ex[1] - st[1]) / Ta;
    const g = vy * vy / (2 * d.peak), Tair = -2 * vy / g, K = 3;
    return {
      W: W,
      Ta: Ta,
      ex: ex,
      st: st,
      vx: vx,
      vy: vy,
      g: g,
      Tair: Tair,
      K: K,
      en: [ ex[0] + vx * Tair, 0 ],
      t1: d.at + W,
      t2: d.at + W + Ta,
      t3: d.at + W + Ta + Tair
    };
  }
  function jumpPath(t, d, J) {
    if (t <= d.at) return [ 0, d.depth ];
    if (t <= J.t1) return [ 0, d.depth + .4 * ease((t - d.at) / J.W) ];
    if (t <= J.t2) {
      const k = Math.pow((t - J.t1) / J.Ta, 2);
      return [ J.st[0] + (J.ex[0] - J.st[0]) * k, J.st[1] + (J.ex[1] - J.st[1]) * k ];
    }
    if (t <= J.t3) {
      const u = t - J.t2;
      return [ J.ex[0] + J.vx * u, J.vy * u + J.g * u * u / 2 ];
    }
    const u = t - J.t3, f = (1 - Math.exp(-J.K * u)) / J.K, vyIn = -J.vy;
    return [ J.en[0] + J.vx * f, vyIn * f ];
  }
  function jump(t, d) {
    d = Object.assign({
      at: 1.2,
      depth: 14,
      peak: 15,
      speed: 1.8
    }, d);
    const S = d.speed;
    if (S === 1) return jumpCore(t, d);
    const J0 = jumpPlan(d), fastEnd = d.at + (J0.t3 - d.at) / S;
    const tt = t <= d.at ? t : t <= fastEnd ? d.at + (t - d.at) * S : J0.t3 + (t - fastEnd);
    return jumpCore(tt, d);
  }
  function jumpCore(t, d) {
    const J = jumpPlan(d), dt = 1 / 120, A = jumpPath(t - dt, d, J), B = jumpPath(t, d, J), C = jumpPath(t + dt, d, J);
    const vx = (C[0] - A[0]) / (2 * dt), vy = (C[1] - A[1]) / (2 * dt), sp = Math.hypot(vx, vy);
    const inAir = t > J.t2 && t < J.t3, m = Math.min(1, sp / 18), tau = t - d.at;
    const settle = t > J.t3 ? ease((t - J.t3 - .5) / 1.2) : 0;
    const rest = hover(t), calm = t < d.at ? 1 : settle;
    const tip = tau > 0 && tau <= J.W ? -.55 * ease(tau / J.W) : 0;
    const w = ease((t - J.t1) / .15), head = Math.atan2(vy, Math.max(.01, vx)) * (inAir ? 1 : Math.min(1, sp / 8));
    let rot = t <= J.t1 ? tip : tip * (1 - w) + head * w;
    rot = rot * (1 - calm) + rest.rot * calm;
    let ph = 0;
    for (let s = 0; s < t; s += 1 / 60) {
      const a2 = jumpPath(s - 1 / 60, d, J), c2 = jumpPath(s + 1 / 60, d, J), v2 = Math.hypot(c2[0] - a2[0], c2[1] - a2[1]) * 30;
      ph += 1 / 60 * (s > J.t2 && s < J.t3 ? 1.6 : .2 + 2.8 * Math.min(1, v2 / 18));
    }
    const pose = {
      dx: B[0] + rest.dx * calm,
      dy: B[1] + rest.dy * calm,
      rot: rot,
      sa: 1 + (inAir ? .08 : .14 * m) * (1 - calm),
      sc: 1 - (inAir ? .05 : .08 * m) * (1 - calm),
      opt: {
        ripple: ph % 1,
        rippleAmt: inAir ? .85 : .5 + .5 * m * (1 - calm),
        speed: inAir ? .4 : m * (1 - calm),
        bend: 0
      }
    };
    pose.splashes = [ {
      x: J.ex[0],
      age: t - J.t2,
      size: .6,
      seed: 1
    }, {
      x: J.en[0],
      age: t - J.t3,
      size: 1,
      seed: 2
    } ].filter(s => s.age >= 0 && s.age < 2.2);
    pose.bubbles = t > J.t3 && t - J.t3 < 2.4 ? {
      x0: J.en[0],
      age: t - J.t3,
      path: u => jumpPath(J.t3 + u, d, J)
    } : null;
    return pose;
  }
  function drawSplash(ctx, x, y, s, sp) {
    const a = sp.age, Z = sp.size, rnd = (i, k) => {
      const h = Math.sin(i * 127.1 + k * 311.7 + sp.seed * 74.7) * 43758.5453;
      return h - Math.floor(h);
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    for (let r = 0; r < 2; r++) {
      const ra = a - r * .25;
      if (ra <= 0) continue;
      const R = (3 + 12 * ra) * (.6 + .4 * Z), al = Math.max(0, .6 * (1 - ra / 1.8));
      ctx.strokeStyle = `rgba(255, 255, 255, ${al})`;
      ctx.lineWidth = .3;
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * .18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (a < .7) {
      const f = Math.sin(Math.PI * Math.min(1, a / .7)), g = ctx.createRadialGradient(0, 0, 0, 0, 0, 6 * Z + 2);
      g.addColorStop(0, `rgba(255, 255, 255, ${.9 * f})`);
      g.addColorStop(.5, `rgba(200, 228, 250, ${.6 * f})`);
      g.addColorStop(1, "rgba(170, 210, 245, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -.3, 6 * Z + 2, 2.2 * Z + .8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (a < .75) {
      const N = Math.round(8 + 7 * Z), Wd = 4 + 5 * Z, life = .8;
      for (let i = 0; i < N; i++) {
        const o = N > 1 ? i / (N - 1) - .5 : 0, bx = o * Wd, H = (4 + 6 * Z) * (.65 + .35 * rnd(i, 7)) * (1 - 1.2 * Math.abs(o)), h = H * Math.sin(Math.PI * Math.min(1, a / life)), lean = o * 2.6 * (.6 + a), w = .32 + .3 * rnd(i, 8), al = .85 * (1 - a / life);
        if (h < .1) continue;
        const cg = ctx.createLinearGradient(0, .2, 0, -h);
        cg.addColorStop(0, `rgba(150, 200, 242, ${al})`);
        cg.addColorStop(.55, `rgba(205, 232, 252, ${al})`);
        cg.addColorStop(1, `rgba(255, 255, 255, ${al})`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(bx - w, .2);
        ctx.quadraticCurveTo(bx - w * .4 + lean * .3, -h * .55, bx + lean, -h);
        ctx.quadraticCurveTo(bx + w * .4 + lean * .3, -h * .55, bx + w, .2);
        ctx.closePath();
        ctx.fill();
      }
    }
    const n = Math.round(14 + 18 * Z);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (rnd(i, 1) - .5) * 2.2, v = (14 + 18 * rnd(i, 2)) * (.6 + .5 * Z), life = .8 + .6 * rnd(i, 3);
      if (a > life) continue;
      const px = Math.cos(ang) * v * a, py = Math.sin(ang) * v * a + 44 * a * a / 2;
      if (py > .2) continue;
      const r = (.4 + .5 * rnd(i, 4)) * (1 - .5 * a / life), al = .92 * (1 - a / life);
      ctx.fillStyle = `rgba(165, 210, 246, ${al})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${al})`;
      ctx.beginPath();
      ctx.arc(px - r * .3, py - r * .3, r * .45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawBubbles(ctx, x, y, s, B) {
    if (!B) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    for (let i = 0; i < 14; i++) {
      const born = i * .06, a = B.age - born;
      if (a <= 0 || a > 1.6) continue;
      const p = B.path(born), px = p[0] - 2.5 + Math.sin(i * 2.3 + a * 6) * .4, py = p[1] - 2.5 * a + i % 3 * .8;
      if (py < .3) continue;
      const r = .3 + .25 * (i * 7 % 5) / 4, al = .7 * (1 - a / 1.6);
      ctx.strokeStyle = `rgba(255, 255, 255, ${al})`;
      ctx.lineWidth = .12;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${al * .25})`;
      ctx.fill();
    }
    ctx.restore();
  }
  const zScale = z => Math.pow(2, .75 * z);
  function depthState(t, plan) {
    let z = 0, x = 0;
    for (const s of plan) {
      if (t <= s.at) break;
      const e = ease((t - s.at) / s.dur);
      z += (s.z - z) * e;
      x += s.forward * e;
    }
    return [ z, x ];
  }
  function depthSwim(t, plan) {
    const dt = 1 / 60, [z, x] = depthState(t, plan), [z1, x1] = depthState(t + dt, plan), [z0, x0] = depthState(t - dt, plan);
    const vz = (z1 - z0) / (2 * dt), vx = (x1 - x0) / (2 * dt), move = Math.min(1, Math.abs(vz) * 1.6 + Math.abs(vx) / 6);
    let ph = 0;
    for (let s = 0; s < t; s += dt) {
      const [a] = depthState(s - dt, plan), [b] = depthState(s + dt, plan), [, ax] = depthState(s - dt, plan), [, bx] = depthState(s + dt, plan);
      ph += dt * (.2 + 1.4 * Math.min(1, Math.abs(b - a) / (2 * dt) * 1.6 + Math.abs(bx - ax) / (2 * dt) / 6));
    }
    const rest = hover(t), calm = 1 - move, turn = Math.min(1, Math.abs(vz) * 1.8);
    return {
      dx: x + rest.dx * calm,
      dy: rest.dy * calm - 2.5 * z,
      rot: rest.rot * calm,
      z: z,
      sa: 1 - .24 * turn,
      sc: 1,
      eyeTurn: true,
      opt: {
        ripple: ph % 1,
        rippleAmt: .5 + .4 * move,
        speed: .4 * move
      }
    };
  }
  let OFF = null;
  function drawAtDepth(ctx, name, pose, x, y, s, facing = 1, water = "120, 160, 220") {
    const z = pose.z || 0, k = zScale(z), haze = Math.max(0, -z), W = ctx.canvas.width, H = ctx.canvas.height;
    if (!OFF || OFF.width !== W || OFF.height !== H) {
      OFF = document.createElement("canvas");
      OFF.width = W;
      OFF.height = H;
    }
    const o = OFF.getContext("2d");
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, W, H);
    o.setTransform(ctx.getTransform());
    draw(o, name, Object.assign({}, pose, {
      dx: pose.dx / k,
      dy: pose.dy / k
    }), x, y, s * k, facing);
    if (haze > 0) {
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = "source-atop";
      o.fillStyle = `rgba(${water}, ${.5 * haze})`;
      o.fillRect(0, 0, W, H);
      o.globalCompositeOperation = "source-over";
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (haze > 0) ctx.filter = `blur(${(1.6 * haze).toFixed(2)}px)`;
    ctx.drawImage(OFF, 0, 0);
    ctx.restore();
  }
  function draw(ctx, name, pose, x, y, s, facing = 1) {
    ctx.save();
    ctx.translate(x + pose.dx * s * facing, y + pose.dy * s);
    ctx.scale(facing, 1);
    ctx.rotate(pose.rot);
    ctx.scale(s * pose.sa, s * pose.sc);
    LilyFish2D.draw(ctx, name, Object.assign({
      stretchAlong: pose.eyeTurn ? 1 : pose.sa,
      stretchAcross: pose.eyeTurn ? 1 : pose.sc
    }, pose.opt));
    ctx.restore();
  }
  return Object.freeze({
    hover: hover,
    climb: climb,
    heightAt: heightAt,
    dive: dive,
    jump: jump,
    drawSplash: drawSplash,
    drawBubbles: drawBubbles,
    depthSwim: depthSwim,
    drawAtDepth: drawAtDepth,
    zScale: zScale,
    draw: draw
  });
})();