/* Hop Hop's nook
 *
 * A tiny animated Hop Hop who hangs out on a lily pad. Every now and then a single fly buzzes in,
 * wanders around, and Hop Hop eats it with his tongue ("yum!"). The whole thing is a link to the games.
 *
 * Hop Hop is drawn by the Lily Studio creature library (/playhouse/lily-creatures-v4.js), the same file
 * the Playhouse and the games page use, so he is the approved 3D Hop Hop, exactly. That file is loaded
 * quietly after the page is ready. If it can't load, a flat Hop Hop (the ORIGINAL design from the game)
 * sits there instead, so there is never an empty spot.
 *
 * Use it on any page:
 *   <a class="hop-nook" href="/playhouse/games/" data-hop-nook hidden
 *      aria-label="Play Lily's Playhouse games with Hop Hop"></a>
 *   <script src="/hop-nook.js" defer></script>
 *
 * Kind to phones and people: it only animates while it is on screen, pauses in background tabs, and
 * shows a still Hop Hop (no fly) for anyone who has "reduce motion" turned on. No sound.
 */
(function () {
  "use strict";

  var LIB_SRC = "/playhouse/lily-creatures-v4.js";   // the creature library (never edited; v5 would be a new file)
  var W = 320, H = 190;            // drawing size (the canvas scales down on small screens)
  var FROG_X = 160, FROG_Y = 160;  // where Hop Hop sits (the point on the pad right under him)
  var SCALE = 1.38;                // flat backup Hop Hop: the game draws him at 1.38x
  var S3D = 1.9, YAW = Math.PI - 0.35, PITCH = 0.32;   // 3D Hop Hop: size and angle (as on the games page)
  var MOUTH_FLAT = { x: FROG_X + 5.5, y: FROG_Y - 36 };
  var MOUTH_3D = { x: FROG_X + 14, y: FROG_Y - 18 };   // measured on his real face

  var STYLE =
    ".hop-nook{display:block;width:100%;max-width:" + W + "px;aspect-ratio:" + W + "/" + H + ";margin:8px auto 4px;border-radius:18px;" +
    "-webkit-tap-highlight-color:transparent;line-height:0;text-decoration:none}" +
    ".hop-nook canvas{display:block;width:100%;height:auto;aspect-ratio:" + W + "/" + H + "}" +
    ".hop-nook:focus-visible{outline:2px solid #F966BC;outline-offset:4px}";

  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function addStyle() {
    if (document.getElementById("hop-nook-style")) return;
    var s = document.createElement("style");
    s.id = "hop-nook-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // load the creature library once, then call back with it (or null if it couldn't load)
  var libWaiters = null, libResult;
  function withLibrary(cb) {
    if (window.LilyCreatures && window.LilyCreatures.frog) return cb(window.LilyCreatures);
    if (libResult !== undefined) return cb(libResult);
    if (libWaiters) return libWaiters.push(cb);
    libWaiters = [cb];
    var done = function (lib) { libResult = lib; var w = libWaiters; libWaiters = null; w.forEach(function (f) { f(lib); }); };
    var sc = document.createElement("script");
    sc.src = LIB_SRC; sc.async = true;
    sc.onload = function () { done(window.LilyCreatures && window.LilyCreatures.frog ? window.LilyCreatures : null); };
    sc.onerror = function () { done(null); };
    document.head.appendChild(sc);
  }

  function start(link, LC) {
    var MOUTH = LC ? MOUTH_3D : MOUTH_FLAT;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    link.appendChild(canvas);

    // ---------- state ----------
    var time = 0;
    var frog = { squash: 0, gulp: 0, blink: false, lick: null };
    var blinkIn = rand(2.5, 5), blinkFor = 0;
    var fly = null, nextFlyIn = 3.2;
    var popups = [];
    var pointer = null;

    // ---------- the fly ----------
    function spawnFly() {
      var fromLeft = Math.random() < 0.5;
      fly = {
        state: "in", t: 0, dir: fromLeft ? 1 : -1, buzz: rand(0, 10),
        sx: fromLeft ? -20 : W + 20, sy: rand(20, 70),
        cx: rand(125, 195), cy: rand(50, 72),
        wanderFor: rand(3, 4.5), side: 1,   // always his right: that is the side his mouth is on, so the tongue never crosses his face
       
        x: fromLeft ? -20 : W + 20, y: 40, hx: 0, hy: 0
      };
    }

    function snackX() { return MOUTH.x + 62; }   // a tongue's length to his right

    function updateFly(dt) {
      if (!fly) {
        nextFlyIn -= dt;
        if (nextFlyIn <= 0) spawnFly();
        return;
      }
      fly.t += dt;
      var px = fly.x;
      if (fly.state === "in") {
        var e = easeInOut(clamp(fly.t / 1.5, 0, 1));
        fly.x = lerp(fly.sx, fly.cx, e);
        fly.y = lerp(fly.sy, fly.cy, e) + Math.sin(fly.t * 7) * 4;
        if (fly.t >= 1.5) { fly.state = "wander"; fly.t = 0; }
      } else if (fly.state === "wander") {
        fly.x = fly.cx + 70 * Math.sin(1.25 * fly.t) + 18 * Math.sin(3.1 * fly.t);
        fly.y = fly.cy + 22 * Math.sin(1.9 * fly.t + 1) + 6 * Math.sin(4.3 * fly.t);
        if (fly.t >= fly.wanderFor) { fly.state = "settle"; fly.t = 0; fly.hx = fly.x; fly.hy = fly.y; }
      } else if (fly.state === "settle") {
        // drift to a spot a tongue's length from Hop Hop's mouth, then hover there
        var tx = snackX(), ty = MOUTH.y - 32;
        var k = easeInOut(clamp(fly.t / 1.1, 0, 1));
        fly.x = lerp(fly.hx, tx, k) + Math.sin(fly.t * 9) * 1.5;
        fly.y = lerp(fly.hy, ty, k) + Math.sin(fly.t * 11) * 1.5;
        if (fly.t >= 1.1) { fly.state = "hover"; fly.t = 0; }
      } else if (fly.state === "hover") {
        fly.x = snackX() + Math.sin(fly.t * 9) * 1.5;
        fly.y = MOUTH.y - 32 + Math.sin(fly.t * 11) * 1.5;
        if (!frog.lick && frog.gulp <= 0) {
          frog.lick = { t: 0, fromX: fly.x, fromY: fly.y, tipX: MOUTH.x, tipY: MOUTH.y };
          fly.state = "caught";
        }
      }
      if (fly.state !== "caught") {
        var vx = fly.x - px;
        if (Math.abs(vx) > 0.05) fly.dir = vx > 0 ? 1 : -1;
      }
    }

    // ---------- Hop Hop's feelings: the tongue, the gulp, blinking ----------
    function updateFrog(dt) {
      frog.squash = Math.max(0, frog.squash - dt * 2.4);
      frog.gulp = Math.max(0, frog.gulp - dt);

      blinkIn -= dt;
      if (blinkIn <= 0) { frog.blink = true; blinkFor = 0.13; blinkIn = rand(2.5, 5.5); }
      if (frog.blink) { blinkFor -= dt; if (blinkFor <= 0) frog.blink = false; }

      var L = frog.lick;
      if (L) {
        L.t += dt / 0.42;
        if (L.t < 0.5) {
          var e = L.t / 0.5;
          L.tipX = lerp(MOUTH.x, L.fromX, e); L.tipY = lerp(MOUTH.y, L.fromY, e);
        } else {
          var e2 = (L.t - 0.5) / 0.5, k = e2 * e2;   // the fly rides the tongue back in
          L.tipX = lerp(L.fromX, MOUTH.x, k); L.tipY = lerp(L.fromY, MOUTH.y, k);
          fly.x = L.tipX; fly.y = L.tipY;
        }
        if (L.t >= 1) {
          frog.lick = null; fly = null;
          frog.gulp = LC ? 1.3 : 0.7; frog.squash = LC ? 0 : 0.6;
          popups.push({ x: FROG_X + 6, y: FROG_Y - (LC ? 100 : 92), life: 1 });
          nextFlyIn = rand(9, 16);
        }
      }
      popups.forEach(function (p) { p.life -= dt; p.y -= 22 * dt; });
      popups = popups.filter(function (p) { return p.life > 0; });
    }

    // ---------- drawing ----------
    function drawPad() {
      var cx = FROG_X, cy = FROG_Y + 3;
      // soft ripple ring on the water
      ctx.strokeStyle = "rgba(185, 163, 227, " + (0.16 + 0.07 * Math.sin(time * 1.4)) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy + 3, 92 + Math.sin(time * 1.4) * 2, 19, 0, 0, Math.PI * 2); ctx.stroke();
      // the pad, with its little notch
      ctx.fillStyle = "#2C7C68";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.ellipse(cx, cy, 74, 15, 0, Math.PI + 0.2, Math.PI * 3 - 0.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#3E9C82";
      ctx.beginPath(); ctx.moveTo(cx, cy - 1); ctx.ellipse(cx, cy - 1.5, 70, 12, 0, Math.PI + 0.2, Math.PI * 3 - 0.2); ctx.closePath(); ctx.fill();
      // a small pink lily bloom on the water behind him
      var bx = cx - 92, by = cy + 2;
      for (var i = 0; i < 6; i++) {
        ctx.save(); ctx.translate(bx, by); ctx.rotate((i / 6) * Math.PI * 2);
        ctx.fillStyle = i % 2 ? "#FFD6E6" : "#FF9EC3";
        ctx.beginPath(); ctx.ellipse(0, -6, 3.2, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#FFD36E";
      ctx.beginPath(); ctx.arc(bx, by, 2.4, 0, Math.PI * 2); ctx.fill();
    }

    function lookTarget() {
      if (fly) return { x: fly.x, y: fly.y };
      if (pointer) return pointer;
      return null;
    }

    // The approved 3D Hop Hop, straight from the creature library.
    function drawFrog3D() {
      var look = lookTarget(), lx = 0, ly = 0;
      if (look) {   // pupils follow whatever he's watching
        var dx = look.x - MOUTH.x, dy = look.y - (FROG_Y - 60);
        var dist = Math.hypot(dx, dy) || 1;
        lx = clamp(dx / dist, -1, 1); ly = clamp(-dy / dist, -1, 1);
      }
      var happy = frog.gulp > 0;
      var pose = { t: time, shadow: false, lookX: lx, lookY: ly, lick: !!frog.lick };
      if (happy) { pose.dance = true; pose.t = 1.3 - frog.gulp; }   // his happy wiggle and tiny hop
      var bob = happy ? 0 : Math.sin(time * 1.6) * 1.2;
      LC.frog.draw(ctx, FROG_X, FROG_Y + bob, S3D, YAW, PITCH, pose);
    }

    // Backup: Hop Hop drawn like drawFrog() in the game (ORIGINAL flat design).
    function drawFrogFlat() {
      var x = FROG_X, y = FROG_Y + Math.sin(time * 1.6) * 1.4;
      var sy = 1 - frog.squash * 0.2, sx = 1 + frog.squash * 0.15;
      var happy = frog.gulp > 0;
      var look = lookTarget();

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx * SCALE, sy * SCALE);

      var green = "#4FAE68", dark = "#3A8A52";
      // back legs
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(-17, -7, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(17, -7, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      // body
      var bg = ctx.createLinearGradient(0, -44, 0, 0);
      bg.addColorStop(0, "#6CC47E"); bg.addColorStop(1, green);
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(0, -20, 23, 20, 0, 0, Math.PI * 2); ctx.fill();
      // belly
      ctx.fillStyle = "#C9F2C2";
      ctx.beginPath(); ctx.ellipse(3, -13, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
      // eye bumps
      ctx.fillStyle = "#62BC76";
      ctx.beginPath(); ctx.arc(-9, -38, 9.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(11, -38, 9.5, 0, Math.PI * 2); ctx.fill();
      // eyes
      [[-9, -38], [11, -38]].forEach(function (p) {
        var ex = p[0], ey = p[1];
        if (happy) {
          ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(ex - 4.5, ey + 1.5); ctx.quadraticCurveTo(ex, ey - 4, ex + 4.5, ey + 1.5); ctx.stroke();
        } else if (frog.blink) {
          ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(ex - 4.5, ey); ctx.quadraticCurveTo(ex, ey + 3, ex + 4.5, ey); ctx.stroke();
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath(); ctx.arc(ex, ey, 6.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#2E2440";
          var lx = 1.5, ly = 0;
          if (look) {   // pupils follow whatever he's watching
            var dx = look.x - (x + ex * SCALE), dy = look.y - (y + ey * SCALE);
            var dist = Math.hypot(dx, dy) || 1;
            lx = (dx / dist) * 2.6; ly = (dy / dist) * 2.6;
          }
          ctx.beginPath(); ctx.arc(ex + lx, ey + ly, 3.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath(); ctx.arc(ex + lx + 1.2, ey + ly - 1.3, 1.1, 0, Math.PI * 2); ctx.fill();
        }
      });
      // cheeks
      ctx.fillStyle = "rgba(255, 130, 170, 0.55)";
      ctx.beginPath(); ctx.ellipse(-14, -24, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18, -24, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      // mouth
      ctx.strokeStyle = "#2E2440"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath();
      if (frog.lick) { ctx.ellipse(4, -25, 3.6, 2.8, 0, 0, Math.PI * 2); ctx.fillStyle = "#6B2E4A"; ctx.fill(); }
      else if (happy) { ctx.moveTo(-5, -28); ctx.quadraticCurveTo(3, -19, 11, -28); }
      else { ctx.moveTo(-4, -28); ctx.quadraticCurveTo(3, -22, 10, -28); }
      ctx.stroke();
      // front feet
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(-6, -1, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -1, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawTongue() {
      var L = frog.lick; if (!L) return;
      ctx.strokeStyle = "#FF7FA8"; ctx.lineWidth = 3.4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(MOUTH.x, MOUTH.y); ctx.lineTo(L.tipX, L.tipY); ctx.stroke();
      ctx.fillStyle = "#FF6F9C";
      ctx.beginPath(); ctx.arc(L.tipX, L.tipY, 3.8, 0, Math.PI * 2); ctx.fill();
    }

    function drawFly() {
      if (!fly) return;
      var x = fly.x, y = fly.y, d = fly.dir;
      var g = ctx.createRadialGradient(x, y, 0, x, y, 13);   // a soft glow so it reads on the dark page
      g.addColorStop(0, "rgba(201, 189, 228, 0.5)"); g.addColorStop(1, "rgba(201, 189, 228, 0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.scale(1.5, 1.5);
      var flap = 0.35 + 0.65 * Math.abs(Math.sin(time * 38 + fly.buzz));
      ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      ctx.beginPath(); ctx.ellipse(-d * 0.6, -2.6, 3.4, 1.7 * flap, -0.55 * d, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(d * 0.9, -2.4, 3, 1.5 * flap, 0.5 * d, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#D8CCF2";
      ctx.beginPath(); ctx.ellipse(0, 0.4, 3.1, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#9B86CC"; ctx.lineWidth = 0.8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-0.8, -1.4); ctx.lineTo(-0.8, 2.2); ctx.stroke();
      ctx.fillStyle = "#B9A3E3";
      ctx.beginPath(); ctx.arc(d * 3, 0.2, 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2E2440";
      ctx.beginPath(); ctx.arc(d * 3.6, -0.2, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawPopups() {
      popups.forEach(function (p) {
        ctx.save();
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.font = '800 16px Montserrat, system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFE0EC";
        ctx.shadowColor = "rgba(249, 102, 188, 0.6)"; ctx.shadowBlur = 8;
        ctx.fillText("yum!", p.x, p.y);
        ctx.restore();
      });
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawPad();
      if (LC) drawFrog3D(); else drawFrogFlat();
      drawTongue();
      drawFly();
      drawPopups();
    }

    // ---------- the loop: only runs while he's on screen, the tab is open, and motion is welcome ----------
    var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    var onScreen = true, rafId = 0, last = 0;

    function frame(now) {
      rafId = 0;
      if (!shouldRun()) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      time += dt;
      updateFly(dt);
      updateFrog(dt);
      draw();
      rafId = requestAnimationFrame(frame);
    }
    function shouldRun() { return onScreen && !document.hidden && !reduce.matches; }
    // (in reduced motion he stays still at time 1, which is eyes open and calm)
    function sync() {
      if (shouldRun()) { if (!rafId) { last = 0; rafId = requestAnimationFrame(frame); } }
      else { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } if (reduce.matches) { fly = null; frog.lick = null; time = 1; draw(); } }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(link);
    }
    document.addEventListener("visibilitychange", sync);
    if (reduce.addEventListener) reduce.addEventListener("change", sync);
    else if (reduce.addListener) reduce.addListener(sync);

    // on a computer, his eyes follow the mouse when there's no fly to watch
    link.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = canvas.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
    });
    link.addEventListener("pointerleave", function () { pointer = null; });

    draw();
    sync();
  }

  function init() {
    try {
      var links = document.querySelectorAll("[data-hop-nook]");
      if (!links.length) return;
      addStyle();
      for (var i = 0; i < links.length; i++) links[i].hidden = false;   // space is reserved, so nothing jumps
      var go = function () {
        withLibrary(function (LC) {
          for (var j = 0; j < links.length; j++) { try { start(links[j], LC); } catch (e) { /* skip */ } }
        });
      };
      if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    } catch (err) { /* never let a little frog break the page */ }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
