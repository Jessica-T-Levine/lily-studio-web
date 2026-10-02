/* Lily's Playhouse shared asset: Buzz Buzz's home (the straw hive), drawn as one smooth, solid 3D shape.
   Published files are never edited. Changes go into a new version (lily-bee-home-v2.js). */
// =====================================================================================================
// Buzz Buzz's Home (the straw hive): lily-bee-home-v1.js. APPROVED Oct 1, 2026 (design: bee-home-3d-preview-v4).
// Shared asset for Lily's Playhouse. Load it with <script src="lily-bee-home-v1.js"></script>; it sets window.LilyBeeHome.
// Design history: bee-home-3d-preview-v1 .. v4.
// v4: calmer straw. Fewer, softer ties, and gentle strands with no dark lines between them.
// v3: a small round upper entrance on the fourth ring, where friend bees fly in and out.
// v2: rounder dome and cap, woven straw texture, two-part honey drips that run over the rings, thicker door rim and step.
// One smooth, solid body drawn with WebGL (ray marching), the same way as Hop Hop and Nee Nee.
// If a device can't do WebGL, the current 2D hive is drawn instead, so nothing ever breaks.
//
// LilyBeeHome.draw(ctx, x, y, s, yaw, pitch, pose)
//   x, y  = where the bottom middle of the hive sits on the screen
//   s     = screen pixels per hive unit (the hive is 40 units wide, so s = width / 40)
//   yaw   = 0 shows the door; turning moves the camera around the hive
//   pitch = 0 is eye level, bigger numbers look down from above
//   pose  = { t: seconds, glow: 0..1 (door light), shadow: true/false, still: true (no drip stretching),
//             maxDetail: most real screen pixels per hive unit (default 16; games use about 10 to stay fast on phones) }
// Returns { doorX, doorY, dw, dh, facing } in screen pixels, so a game can land a bee on the step.
// =====================================================================================================
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mqReduce = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; } })();

  // ---- the hive's measurements (hive units; 40 units wide, base at z = 0, door faces +x) ----
  const RING_Z0 = 5.06, RING_DZ = 7.54, RING_RZ = 5.8;   // same spacing as the 2D hive
  const ringR = i => 20 * (1 - 0.42 * Math.pow(i / 4, 1.5));   // v2: rounder shoulders
  const DOOR = { w: 4.1, base: 1.1, h: 8.0 };            // half width, sill height, total height
  const STEP_X = 20.8;
  // v3: the little upper entrance (ring 3, a bit to the right of the door when you face it)
  const HOLE = { ring: 3, angle: 1.0, w: 2.2, h: 4.4 };
  HOLE.base = RING_Z0 + HOLE.ring * RING_DZ - 2.1;

  const VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  const FRAG = `
precision highp float;
uniform vec2 uRes, uAnchor; uniform float uS;
uniform vec3 uR, uU, uF, uL, uD;
uniform float uGlow;
uniform vec3 uDA[4], uDM[4], uDB[4]; uniform vec3 uDRad[4];   // honey drips: start, bend over the ring, drop; (film, neck, drop) radii

const float PI = 3.14159265;
const float RZ = ${RING_RZ.toFixed(3)};
const float DW = ${DOOR.w.toFixed(3)}, DB = ${DOOR.base.toFixed(3)}, DH = ${DOOR.h.toFixed(3)};
const vec3 STEP_C = vec3(${STEP_X.toFixed(2)}, 0.0, ${(DOOR.base - 0.9).toFixed(2)});
const vec3 STEP_R = vec3(3.4, 6.0, 1.15);

const float HA = ${HOLE.angle.toFixed(3)}, HW = ${HOLE.w.toFixed(3)}, HB = ${HOLE.base.toFixed(3)}, HH = ${HOLE.h.toFixed(3)}, HR = ${HOLE.ring.toFixed(1)};
float ringZ(float i){ return ${RING_Z0.toFixed(3)} + i * ${RING_DZ.toFixed(3)}; }
float ringR(float i){ return 20.0 * (1.0 - 0.42 * pow(i / 4.0, 1.5)); }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-4); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// the straw body before the door is cut in: five rings melted together, the domed cap and the knob
float hiveU(vec3 p){
  float d = sdEll(p - vec3(0.0, 0.0, ringZ(0.0)), vec3(ringR(0.0), ringR(0.0), RZ));
  for (int i = 1; i < 5; i++){
    float fi = float(i);
    d = smin(d, sdEll(p - vec3(0.0, 0.0, ringZ(fi)), vec3(ringR(fi), ringR(fi), RZ)), 1.1);
  }
  float r4 = ringR(4.0), capZ = ringZ(4.0) + 2.6;                    // v2: a rounder, fuller dome on top
  d = smin(d, sdEll(p - vec3(0.0, 0.0, capZ), vec3(r4 * 0.88, r4 * 0.88, 6.8)), 2.2);
  d = smin(d, length(p - vec3(0.0, 0.0, capZ + 7.9)) - 2.5, 1.1);
  // a straight-sided base band under the bottom ring (a flat wall for the door to sit in)
  vec2 bq = vec2(length(p.xy) - 17.6, abs(p.z - 3.4) - 2.6);
  float band = min(max(bq.x, bq.y), 0.0) + length(max(bq, 0.0)) - 1.6;
  d = smin(d, band, 1.2);
  return max(d, -p.z);                                // flat underneath, so it sits on the branch
}
// the door's arched shape, flat on the wall (q = sideways, height)
float arch(vec2 q){
  float z = q.y - DB, zc = DH - DW;
  if (z > zc) return length(vec2(q.x, z - zc)) - DW;
  return max(abs(q.x) - DW, -z);
}
// the same arch, at any size (for the little upper entrance)
float archS(vec2 q, float w, float b, float h){
  float z = q.y - b, zc = h - w;
  if (z > zc) return length(vec2(q.x, z - zc)) - w;
  return max(abs(q.x) - w, -z);
}
// the upper entrance's frame: (out from the middle, sideways)
vec2 holeQ(vec3 p){ vec2 c = vec2(cos(HA), sin(HA)); return vec2(dot(p.xy, c), dot(p.xy, vec2(-c.y, c.x))); }
// the outline of the arch without its bottom edge (for the straw rim)
float archLine(vec2 q){
  float z = q.y - DB, zc = DH - DW;
  if (z > zc) return length(vec2(q.x, z - zc)) - DW;
  return abs(q.x) - DW;
}
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2; vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv);
  float y2 = y * y * l2; float z2 = z * z * l2; float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1; }
// honey drips: a thin trickle from under a ring down to a round, glossy drop
float drips(vec3 p){
  float d = 1e3;
  for (int i = 0; i < 4; i++) d = min(d, min(sdRoundCone(p, uDA[i], uDM[i], uDRad[i].x, uDRad[i].y), sdRoundCone(p, uDM[i], uDB[i], uDRad[i].y, uDRad[i].z)));
  return d;
}

// returns (distance, how much honey)
vec2 model(vec3 p){
  float body = hiveU(p);
  float walls = max(body, -max(arch(p.yz), 9.0 - p.x));            // the doorway, cut deep into the straw
  float rim = length(vec2(archLine(p.yz), body)) - 1.25;   // v2: a thicker rolled rim               // a rolled straw rim around it
  rim = max(rim, max(DB - 0.4 - p.z, -p.x));
  // v3: the little upper entrance, with its own thin rolled rim (a round little doorway, rim all the way around)
  vec2 hq = holeQ(p);
  float hole = archS(vec2(hq.y, p.z), HW, HB, HH);
  walls = max(walls, -max(hole, ringR(HR) - 6.0 - hq.x));
  float rim2 = max(length(vec2(hole, body)) - 0.75, -hq.x);
  rim = min(rim, rim2);
  float d = smin(walls, rim, 0.45);
  d = smin(d, sdEll(p - STEP_C, STEP_R), 0.9);                        // the landing step
  float hd = drips(p);
  float hw = clamp(0.5 + 0.5 * (d - hd) / 0.5, 0.0, 1.0);
  return vec2(smin(d, hd, 0.45), hw);
}
vec3 nrm(vec3 p){
  const vec2 e = vec2(0.03, -0.03);
  return normalize(e.xyy * model(p + e.xyy).x + e.yyx * model(p + e.yyx).x + e.yxy * model(p + e.yxy).x + e.xxx * model(p + e.xxx).x);
}
float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i = 1; i <= 5; i++){ float h = 0.8 * float(i); o += (h - model(p + n * h).x) * s; s *= 0.6; } return clamp(1.0 - 0.1 * o, 0.0, 1.0); }
vec3 ramp(vec3 dk, vec3 md, vec3 lt, float t){ return t < 0.55 ? mix(dk, md, t / 0.55) : mix(md, lt, (t - 0.55) / 0.45); }
vec3 hex(float r, float g, float b){ return vec3(r, g, b) / 255.0; }

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float X = (px.x - uAnchor.x) / uS, Y = (uAnchor.y - px.y) / uS;
  vec3 ro = X * uR + Y * uU + uD * 120.0;
  float t = 0.0, dmin = 1e9, hit = 0.0;
  for (int i = 0; i < 110; i++){
    float d = model(ro + uF * t).x;
    dmin = min(dmin, d);
    if (d < 0.004) { hit = 1.0; break; }
    t += d * 0.85; if (t > 240.0) break;
  }
  float px1 = 1.0 / uS;
  float alpha = hit > 0.5 ? 1.0 : 1.0 - smoothstep(0.0, px1 * 1.2, dmin);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }
  if (hit < 0.5) {                                   // soft edge: step to the closest point for its color
    t = 0.0; for (int i = 0; i < 110; i++){ float d = model(ro + uF * t).x; if (d <= dmin + 1e-3) break; t += d * 0.85; if (t > 240.0) break; }
  }
  vec3 w = ro + uF * t;
  vec2 m = model(w);
  vec3 n = nrm(w);
  float lit = pow(clamp(0.5 * dot(n, uL) + 0.5, 0.0, 1.0), 1.15);
  float occ = ao(w, n);
  float body = hiveU(w);

  // which part of the hive is this?
  float capW = smoothstep(ringZ(4.0) + 2.2, ringZ(4.0) + 4.2, w.z);
  float rimW = (1.0 - smoothstep(1.1, 1.9, length(vec2(archLine(w.yz), max(body, 0.0))))) * step(0.0, w.x) * step(DB - 0.6, w.z) * smoothstep(-1.0, -0.35, body);
  float stepW = 1.0 - smoothstep(0.0, 0.5, sdEll(w - STEP_C, STEP_R));
  float inner = (1.0 - smoothstep(0.1, 0.7, arch(w.yz))) * smoothstep(-0.2, -0.9, body) * step(0.0, w.x);
  vec2 hqw = holeQ(w);
  float holeD = archS(vec2(hqw.y, w.z), HW, HB, HH);
  float inner2 = (1.0 - smoothstep(0.05, 0.45, holeD)) * smoothstep(-0.15, -0.7, body) * step(0.0, hqw.x);
  rimW = max(rimW, (1.0 - smoothstep(0.65, 1.2, length(vec2(holeD, max(body, 0.0))))) * step(0.0, hqw.x) * smoothstep(-0.8, -0.25, body));
  float deep2 = clamp((ringR(HR) - 0.5 - hqw.x) / 5.0, 0.0, 1.0);

  // straw: the same honey-gold as the 2D hive
  vec3 straw = ramp(hex(169.,106.,34.), hex(237.,184.,88.), hex(255.,226.,156.), lit);
  // ring index and how far up this ring we are (for stitches and the shadow under each ring)
  float ri = clamp(floor((w.z - ringZ(0.0)) / ${RING_DZ.toFixed(3)} + 0.5), 0.0, 4.0);
  float v = (w.z - ringZ(ri)) / RZ;
  float ang = atan(w.y, w.x), rl = max(length(w.xy), 1.0);
  // v2: WOVEN STRAW. Each ring is a coil of straw strands running around the hive, tied with binding wraps.
  float sw = (1.0 - capW) * (1.0 - inner) * (1.0 - inner2) * (1.0 - stepW) * (1.0 - rimW) * (1.0 - m.y);
  float arcU = ang * rl;                                             // distance around the hive
  float fz = w.z * 2.6 + 0.35 * sin(arcU * 0.12 + ri * 1.7);   // v4: fewer, wider strands
  float strand = floor(fz / (2.0 * PI));
  float fiberDetail = 1.0 - smoothstep(0.12, 0.3, px1);              // fade the finest lines when it's drawn tiny
  // light catches the top of each strand (bump the surface normal a little)
  vec3 tz = normalize(vec3(0.0, 0.0, 1.0) - n * n.z + 1e-4);
  vec3 ta = normalize(vec3(-w.y, w.x, 0.0) + 1e-4);
  vec3 nb = normalize(n - tz * cos(fz) * 0.12 * sw * fiberDetail);
  // binding wraps: little raised straw ties wrapping each ring (every other ring is offset)
  float f = ang / (2.0 * PI) * 10.0 + 0.5 * mod(ri, 2.0) + 0.06 * v * v;   // v4: half as many ties
  float fs = fract(f) - 0.5, sd = abs(fs) * (2.0 * PI * rl / 10.0);
  float wrapW = 0.6;
  float wrap = (1.0 - smoothstep(wrapW - px1, wrapW + px1, sd)) * (1.0 - smoothstep(0.5, 0.82, abs(v))) * sw;
  nb = normalize(nb + ta * sign(fs) * smoothstep(0.0, wrapW, sd) * 0.3 * wrap);
  float litB = pow(clamp(0.5 * dot(nb, uL) + 0.5, 0.0, 1.0), 1.15);
  straw = ramp(hex(169.,106.,34.), hex(237.,184.,88.), hex(255.,226.,156.), mix(lit, litB, sw));
  // every strand is a slightly different gold, with a thin dark line between strands
  float hs = fract(sin(strand * 12.9898 + ri * 78.233) * 43758.5453);
  straw *= mix(1.0, 0.97 + 0.05 * hs, sw);
  // the wraps are a slightly deeper, sun-warmed straw with a fine edge line
  vec3 wrapC = straw * vec3(0.95, 0.91, 0.84);
  wrapC *= 1.0 - 0.06 * smoothstep(wrapW - 2.0 * px1 - 0.12, wrapW, sd);
  straw = mix(straw, wrapC, wrap);
  // a soft band of shade tucked under each ring
  straw *= 1.0 - 0.14 * smoothstep(-0.4, -1.0, v) * step(0.5, ri) * (1.0 - capW);

  vec3 cap = ramp(hex(194.,127.,44.), hex(240.,184.,88.), hex(255.,231.,168.), lit);
  vec3 rimC = ramp(hex(196.,134.,52.), hex(247.,206.,124.), hex(255.,234.,180.), lit);
  vec3 stepC = ramp(hex(185.,122.,44.), hex(231.,169.,72.), hex(255.,217.,138.), lit);
  vec3 honey = ramp(hex(196.,110.,14.), hex(233.,149.,26.), hex(255.,211.,92.), lit);

  vec3 col = mix(straw, cap, capW);
  col = mix(col, rimC, rimW);
  col = mix(col, stepC, stepW);
  col *= mix(0.7, 1.0, occ);
  col = mix(col, honey, m.y);

  // the inside of the doorway: dark and cozy (warm honey light when she's home)
  float deep = clamp((18.0 - w.x) / 8.0, 0.0, 1.0);
  vec3 dark = mix(hex(90.,58.,30.), hex(28.,15.,6.), clamp((w.z - DB) / DH * 0.6 + deep * 0.6, 0.0, 1.0));
  // brightest deep inside and low down, deeper amber toward the door's edges
  float glowC = clamp(deep * (1.0 - 0.55 * clamp((w.z - DB) / DH, 0.0, 1.0)) * (1.0 - 0.5 * clamp(abs(w.y) / DW, 0.0, 1.0)), 0.0, 1.0);
  vec3 warm = mix(hex(150.,62.,10.), mix(hex(240.,140.,30.), hex(255.,214.,100.), smoothstep(0.45, 0.9, glowC)), smoothstep(0.0, 0.5, glowC));
  dark = mix(dark, warm, uGlow);
  col = mix(col, dark, inner);
  // the little entrance: dark inside, with a warm hint of honey light when she's home
  vec3 dark2 = mix(hex(80.,50.,24.), hex(26.,14.,6.), clamp(deep2 * 1.1, 0.0, 1.0));
  dark2 = mix(dark2, mix(hex(170.,80.,14.), hex(250.,170.,60.), deep2), uGlow * 0.85);
  col = mix(col, dark2, inner2);

  // shine: soft on straw, glossy on honey
  vec3 h = normalize(uL + uD);
  float sp = max(dot(n, h), 0.0);
  col += vec3(1.0) * (pow(sp, 30.0) * 0.08 * (1.0 - m.y) + pow(sp, 70.0) * 0.75 * m.y) * (1.0 - inner);
  col *= mix(0.88, 1.0, smoothstep(0.0, 0.45, dot(n, uD)));
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
    } catch (e) { glFailed = true; if (root.console) console.warn("Bee home: using the 2D drawing (" + e.message + ")"); }
    return GL;
  }
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // the camera: yaw turns around the hive, pitch looks down from above
  function camera(yaw, pitch) {
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const R = [-sy, cy, 0], U = [-cy * sp, -sy * sp, cp], D = [cy * cp, sy * cp, sp], F = [-D[0], -D[1], -D[2]];
    return { R, U, D, F };
  }
  const proj = (cam, p) => [p[0] * cam.R[0] + p[1] * cam.R[1] + p[2] * cam.R[2], p[0] * cam.U[0] + p[1] * cam.U[1] + p[2] * cam.U[2]];

  // the honey drips: [ring, angle around (0 = door side, + = to the right), length, width]
  const DRIPS = [[1, 0.66, 4.8, 1.0], [2, 0.42, 4.0, 0.9], [1, -0.7, 3.8, 0.85], [3, 2.55, 3.8, 0.85]];
  // how far out the straw surface is at height z (the widest ring there)
  const surfR = z => { let r = 0; for (let i = 0; i < 5; i++) { const q = (z - (RING_Z0 + i * RING_DZ)) / RING_RZ; if (Math.abs(q) < 1) r = Math.max(r, ringR(i) * Math.sqrt(1 - q * q)); } if (z > 0.4 && z < 6.4) r = Math.max(r, 19.2); return r; };
  function dripPoints(t, still) {
    const A = [], M = [], B = [], Rd = [];
    DRIPS.forEach(([ri, ang, len, wd], j) => {
      const L = len * (1 + (still ? 0 : 0.15 * Math.sin(t * 1.3 + j * 2)));   // they stretch a little, slowly
      const zc = RING_Z0 + ri * RING_DZ;
      // a thin film of honey runs over the round edge of its ring, then hangs down as a teardrop
      const zA = zc + 1.6, rA = surfR(zA) - 0.2;
      const zM = zc - 1.2, rM = surfR(zM) + 0.15;
      const r2 = 1.45 * wd, zB = zM - L, rB = Math.max(rM + 0.1, surfR(zB) + r2 * 0.95);
      const c = Math.cos(ang), sn = Math.sin(ang);
      A.push(c * rA, sn * rA, zA); M.push(c * rM, sn * rM, zM); B.push(c * rB, sn * rB, zB); Rd.push(0.55 * wd, 0.62 * wd, r2);
    });
    return { A, M, B, Rd };
  }

  function drawGL(c, x, y, s, yaw, pitch, pose) {
    const G = glSetup(); if (!G) return false;
    const { gl, U, cv } = G;
    let k = 1; try { const T = c.getTransform(); k = Math.hypot(T.a, T.b) || 1; } catch (_) {}
    const S = Math.min(s * k, pose.maxDetail || 16);    // cap the work on big screens (pose.maxDetail = most screen pixels per hive unit)
    const ap = Math.abs(Math.sin(pitch)), cpv = Math.cos(pitch);
    const L = 26, TOP = 49.5 * cpv + 24 * ap + 2, BOT = 24 * ap + 3;
    const W = Math.max(2, Math.ceil(2 * L * S)), H = Math.max(2, Math.ceil((TOP + BOT) * S));
    if (W > 4096 || H > 4096) return false;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H);
    const cam = camera(yaw, pitch);
    const Ld = norm3([-0.45 * cam.R[0] + 0.75 * cam.U[0] + 0.5 * cam.D[0], -0.45 * cam.R[1] + 0.75 * cam.U[1] + 0.5 * cam.D[1], -0.45 * cam.R[2] + 0.75 * cam.U[2] + 0.5 * cam.D[2]]);
    const u = (name, ...v) => { const l = U[name]; if (l == null) return; if (v.length === 1) gl.uniform1f(l, v[0]); else if (v.length === 2) gl.uniform2f(l, v[0], v[1]); else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]); else gl.uniform4f(l, v[0], v[1], v[2], v[3]); };
    u("uRes", W, H); u("uAnchor", L * S, TOP * S); u("uS", S);
    u("uR", ...cam.R); u("uU", ...cam.U); u("uF", ...cam.F); u("uD", ...cam.D); u("uL", ...Ld);
    u("uGlow", clamp(pose.glow || 0, 0, 1));
    const t = pose.t || 0;
    const dp = dripPoints(t, mqReduce || pose.still);
    if (U["uDA[0]"] != null) { gl.uniform3fv(U["uDA[0]"], new Float32Array(dp.A)); gl.uniform3fv(U["uDM[0]"], new Float32Array(dp.M)); gl.uniform3fv(U["uDB[0]"], new Float32Array(dp.B)); gl.uniform3fv(U["uDRad[0]"], new Float32Array(dp.Rd)); }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    c.drawImage(cv, x - L * s, y - TOP * s, W * s / S, H * s / S);   // (stays the right size even when the detail is capped)
    return true;
  }

  // ---- the current 2D hive (used if WebGL isn't available, and for side-by-side comparing) ----
  function shadeBall(c, x, y, r, hi, mid, lo) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.42, r * 0.06, x, y, r * 1.05);
    g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  function draw2D(c, hx, baseY, Wh, glow, yaw, time) {
    const ks = Wh / 200, rings = 5, rh = Wh * 0.23;
    yaw = clamp(yaw, -0.3, 0.3);
    const ring = i => { const u = i / (rings - 1); return { R: Wh * (1 - u * 0.42) / 2, y: baseY - i * rh * 0.82 - rh * 0.55, ry: rh * 0.62 }; };
    for (let i = 0; i < rings; i++) {
      const { R, y, ry } = ring(i);
      if (i > 0) { c.fillStyle = "rgba(150, 90, 25, 0.35)"; c.beginPath(); c.ellipse(hx, y + ry * 0.5, R * 1.02, ry * 0.5, 0, 0, Math.PI * 2); c.fill(); }
      const g = c.createLinearGradient(hx - R, 0, hx + R, 0);
      g.addColorStop(0, "#C0802E"); g.addColorStop(0.14, "#EDB858"); g.addColorStop(0.34, "#FFE29C"); g.addColorStop(0.6, "#F2B955"); g.addColorStop(0.86, "#CF8D35"); g.addColorStop(1, "#A96A22");
      c.fillStyle = g; c.beginPath(); c.ellipse(hx, y, R, ry, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.ellipse(hx, y, R, ry, 0, 0, Math.PI * 2); c.clip();
      const v = c.createLinearGradient(0, y - ry, 0, y + ry);
      v.addColorStop(0, "rgba(255, 248, 215, 0.55)"); v.addColorStop(0.45, "rgba(255, 248, 215, 0)"); v.addColorStop(1, "rgba(140, 80, 15, 0.4)");
      c.fillStyle = v; c.fillRect(hx - R, y - ry, R * 2, ry * 2);
      c.lineCap = "round";
      for (let k = 0; k < 20; k++) {
        const th = (k + (i % 2) * 0.5) / 20 * Math.PI * 2 + yaw * 1.4, cth = Math.cos(th);
        if (cth < 0.06) continue;
        const x = hx + Math.sin(th) * R * 0.96;
        c.strokeStyle = `rgba(175, 110, 35, ${0.5 * cth})`; c.lineWidth = (0.6 + 1.4 * cth) * ks;
        c.beginPath(); c.moveTo(x - 1.5 * cth * ks, y - ry * 0.55); c.quadraticCurveTo(x + 2 * cth * ks, y, x - 1 * cth * ks, y + ry * 0.6); c.stroke();
      }
      c.restore();
    }
    const top = ring(rings - 1), capY = top.y - top.ry * 0.75;
    c.save(); c.translate(hx, capY); c.scale(1, 0.72); shadeBall(c, 0, 0, top.R * 0.72, "#FFE7A8", "#F0B858", "#C27F2C"); c.restore();
    shadeBall(c, hx, capY - top.ry * 0.62, top.R * 0.2, "#FFE7A8", "#E9AA48", "#B8752A");
    [[1, 0.62, 1], [2, 0.5, 0.8], [0, -0.55, 0.7]].forEach(([ri, side, k], j) => {
      const { R, y, ry } = ring(ri), x = hx + side * R, len = Wh * 0.1 * k * (1 + (mqReduce ? 0 : 0.15 * Math.sin(time * 1.3 + j * 2)));
      const dg = c.createLinearGradient(x - 4, 0, x + 4, 0); dg.addColorStop(0, "#FFD35C"); dg.addColorStop(1, "#E9951A"); c.fillStyle = dg;
      const w = Wh * 0.03 * k, y0 = y + ry * 0.2, bulb = w * 1.25;
      c.beginPath(); c.moveTo(x - w * 0.7, y0);
      c.bezierCurveTo(x - w * 0.5, y0 + len * 0.45, x - bulb * 1.1, y0 + len - bulb * 0.6, x - bulb, y0 + len);
      c.arc(x, y0 + len, bulb, Math.PI, 0, true);
      c.bezierCurveTo(x + bulb * 1.1, y0 + len - bulb * 0.6, x + w * 0.5, y0 + len * 0.45, x + w * 0.7, y0);
      c.closePath(); c.fill();
      c.fillStyle = "rgba(255, 255, 240, 0.9)"; c.beginPath(); c.ellipse(x - bulb * 0.35, y0 + len - bulb * 0.2, bulb * 0.28, bulb * 0.4, -0.3, 0, Math.PI * 2); c.fill();
    });
    const b0 = ring(0), dth = -yaw * 1.4, dc = Math.cos(dth);
    const dx = hx + Math.sin(dth) * b0.R * 0.55, dw = Wh * 0.28 * (0.75 + 0.25 * dc), dh = Wh * 0.26, dy = baseY - 2 * ks;
    const arch = () => { c.beginPath(); c.moveTo(dx - dw / 2, dy); c.lineTo(dx - dw / 2, dy - dh + dw / 2); c.arc(dx, dy - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw / 2, dy); c.closePath(); };
    c.strokeStyle = "#FFE3A0"; c.lineWidth = 5 * ks; arch(); c.stroke();
    const ig = c.createLinearGradient(0, dy - dh, 0, dy); ig.addColorStop(0, "#1C0F06"); ig.addColorStop(1, "#5A3A1E");
    c.fillStyle = ig; arch(); c.fill();
    if (glow > 0) {
      c.save(); arch(); c.clip();
      const gg = c.createRadialGradient(dx, dy - dh * 0.35, 0, dx, dy - dh * 0.35, dw * 0.9);
      gg.addColorStop(0, `rgba(255, 222, 110, ${0.98 * glow})`); gg.addColorStop(1, `rgba(255, 170, 50, ${0.35 * glow})`);
      c.fillStyle = gg; c.fillRect(dx - dw, dy - dh, dw * 2, dh); c.restore();
    }
    c.fillStyle = "#B97A2C"; c.beginPath(); c.ellipse(dx, dy + 3.5 * ks, dw * 0.78, dw * 0.16, 0, 0, Math.PI * 2); c.fill();
    const lg = c.createLinearGradient(dx - dw * 0.78, 0, dx + dw * 0.78, 0); lg.addColorStop(0, "#E7A948"); lg.addColorStop(0.4, "#FFD98A"); lg.addColorStop(1, "#D9953A");
    c.fillStyle = lg; c.beginPath(); c.ellipse(dx, dy + 0.5 * ks, dw * 0.75, dw * 0.14, 0, 0, Math.PI * 2); c.fill();
    return { doorX: dx, doorY: dy, dw, dh, facing: 1 };
  }

  // v3: where the upper entrance is (hive units), and which way is "out" from it
  const holeR = () => surfR(HOLE.base + HOLE.h * 0.45);
  const holeWorld = () => { const r = holeR(); return [Math.cos(HOLE.angle) * r, Math.sin(HOLE.angle) * r, HOLE.base + HOLE.h * 0.4]; };
  // turn a point on/around the hive (hive units) into screen pixels; depth > 0 means nearer to you than the hive's middle
  function project(x, y, s, yaw, pitch, p) {
    const cam = camera(yaw, pitch), [px, py] = proj(cam, p);
    return { x: x + px * s, y: y - py * s, depth: p[0] * cam.D[0] + p[1] * cam.D[1] + p[2] * cam.D[2] };
  }
  function draw(c, x, y, s, yaw, pitch, pose) {
    pose = pose || {};
    const glow = clamp(pose.glow || 0, 0, 1);
    if (pose.shadow !== false) {   // a soft shadow under the hive
      c.fillStyle = "rgba(70, 40, 20, 0.26)";
      c.beginPath(); c.ellipse(x + s * 0.8, y + s * 0.3, s * 15, s * (2 + 9 * Math.abs(Math.sin(pitch))), 0, 0, Math.PI * 2); c.fill();
    }
    if (pose.force2D || root.__beeHomeForce2D || !drawGL(c, x, y, s, yaw, pitch, pose)) return draw2D(c, x, y, s * 40, glow, yaw, pose.t || 0);
    // where the door is on screen (a game uses this to land a bee on the step)
    const cam = camera(yaw, pitch), facing = Math.cos(yaw);
    const [sx, sy] = proj(cam, [STEP_X - 1, 0, DOOR.base]);
    const out = { doorX: x + sx * s, doorY: y - sy * s, dw: DOOR.w * 2 * s, dh: DOOR.h * s, facing };
    const hp = holeWorld(), [hx2, hy2] = proj(cam, hp);
    out.hole = { x: x + hx2 * s, y: y - hy2 * s, w: HOLE.w * 2 * s, facing: Math.cos(yaw - HOLE.angle) };   // v3: the upper entrance
    if (glow > 0 && facing > 0) {   // warm light spilling out of the door
      const r = out.dw * 1.5, a = 0.3 * glow * facing;
      const og = c.createRadialGradient(out.doorX, out.doorY, 0, out.doorX, out.doorY, r);
      og.addColorStop(0, `rgba(255, 200, 90, ${a})`); og.addColorStop(1, "rgba(255, 200, 90, 0)");
      c.fillStyle = og; c.beginPath(); c.arc(out.doorX, out.doorY, r, 0, Math.PI * 2); c.fill();
    }
    return out;
  }

  root.LilyBeeHome = Object.freeze({ draw, draw2D, project, hole: Object.freeze({ angle: HOLE.angle, point: holeWorld() }), width: 40, version: "lily-bee-home-v1" });
})(typeof window !== "undefined" ? window : globalThis);
