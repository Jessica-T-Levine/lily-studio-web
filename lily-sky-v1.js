/*
  Lily Studio · Shared Live Sky, version 1
  ----------------------------------------
  ONE clock for every game and live cam: Lily's home sky on Central Time (see lily-home-sky-v1.js).
  Load lily-home-sky-v1.js first, then this file. Then:
    LilySky.hour()      the hour (0..24) in the games' "story frame": the real Central time of day, stretched so the
                        real sunrise lands on 6.3 and the real sunset on 19.2 (the hours the colors were drawn for).
    LilySky.realHour()  the plain Central clock hour (0..24)
    LilySky.rise / LilySky.set   today's real sunrise and sunset (Central hours)
    LilySky.centralTimeText()    "6:42 pm" in Central Time
    LilySky.skyRgb(h), light(h), nightness(h), goldness(h), moon()   the shared colors, light and moon (h defaults to now)
  Add #h7 or #h21.5 to a page's link to preview that hour (for checking).
  If the home sky file did not load, it falls back to the visitor's own clock so a game never breaks.
*/
(function (root) {
  "use strict";
  const HS = root.LilyHomeSky || null;
  const STORY_RISE = 6.3, STORY_SET = 19.2;
  let test = null;
  try { const m = /[#&]h(\d{1,2}(\.\d+)?)/.exec(root.location.hash); if (m) test = parseFloat(m[1]) % 24; } catch (_) {}
  function realHour() {
    if (test !== null) return test;
    if (HS) return HS.centralHour(Date.now());
    const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }
  let evKey = "", ev = { sunrise: STORY_RISE, sunset: STORY_SET };
  function today() {
    if (!HS) return ev;
    const d = HS.centralDate(Date.now()), key = d.y + "-" + d.m + "-" + d.d;
    if (key !== evKey) {
      evKey = key;
      try { const e = HS.events(d.y, d.m, d.d); if (e.sunrise != null && e.sunset != null) ev = e; else ev = { sunrise: STORY_RISE, sunset: STORY_SET }; } catch (_) {}
    }
    return ev;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function hour() {
    const h = realHour(), e = today(), r = e.sunrise, s = e.sunset;
    if (h < r) return lerp(0, STORY_RISE, h / r);
    if (h <= s) return lerp(STORY_RISE, STORY_SET, (h - r) / (s - r));
    return lerp(STORY_SET, 24, (h - s) / (24 - s));
  }
  function centralTimeText() {
    const h = realHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return ((hh % 12) || 12) + ":" + String(mm).padStart(2, "0") + (hh < 12 ? " am" : " pm");
  }

  // ---------- the shared palette (the colors the Playhouse, Buzz Buzz and Nee Nee are drawn with) ----------
  // Each key is an hour in the story frame. Sky: four colors, top to horizon. Light: a soft tint over the whole scene.
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const SKY_KEYS = [
    [0,    ["#12133A", "#1B1D4A", "#27285B", "#35306A"]],
    [4.8,  ["#171A48", "#2A2C66", "#4A4380", "#7A5E92"]],
    [6.2,  ["#6D78CF", "#B79CE0", "#F7A9B8", "#FFCFB0"]],
    [8,    ["#7FB2EA", "#A9CDF2", "#CFE3F6", "#F4E9DC"]],
    [12.5, ["#8DB6EE", "#B7D2F4", "#FFE6C2", "#FFE2B0"]],
    [16.2, ["#8DB6EE", "#B7D2F4", "#FFE6C2", "#FFE2B0"]],
    [18.2, ["#7B6FD0", "#C79BDB", "#FFB0A0", "#FFD1A1"]],
    [19.5, ["#4E4A9A", "#8A6CB8", "#D98FA8", "#F2B39A"]],
    [21,   ["#1E1F4A", "#2E2C66", "#4A3F7A", "#5E4A86"]],
    [24,   ["#12133A", "#1B1D4A", "#27285B", "#35306A"]]
  ].map(k => [k[0], k[1].map(hexRgb)]);
  const LIGHT_KEYS = [
    [0, [18, 20, 64, 0.46]], [4.8, [30, 28, 90, 0.4]], [6.2, [255, 188, 175, 0.1]], [8, [255, 230, 200, 0.03]],
    [12.5, [255, 214, 140, 0.02]], [16.2, [255, 214, 140, 0.04]], [18.2, [255, 150, 165, 0.1]],
    [19.5, [60, 50, 140, 0.26]], [21, [22, 22, 72, 0.42]], [24, [18, 20, 64, 0.46]]
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = t => t * t * (3 - 2 * t);
  function keyAt(keys, h) {
    let i = 0;
    while (i < keys.length - 2 && keys[i + 1][0] <= h) i++;
    const a = keys[i], b = keys[i + 1];
    return { a: a[1], b: b[1], t: smooth(clamp((h - a[0]) / (b[0] - a[0]), 0, 1)) };
  }
  function skyRgb(h) { const k = keyAt(SKY_KEYS, h == null ? hour() : h); return k.a.map((ca, i) => ca.map((v, j) => Math.round(lerp(v, k.b[i][j], k.t)))); }
  function light(h) { const k = keyAt(LIGHT_KEYS, h == null ? hour() : h); return k.a.map((v, j) => lerp(v, k.b[j], k.t)); }
  function nightness(h) {   // 0 in daylight, 1 in the middle of the night
    h = h == null ? hour() : h;
    if (h >= STORY_RISE + 1.2 && h <= STORY_SET - 0.4) return 0;
    if (h > STORY_SET - 0.4 && h < STORY_SET + 2) return smooth((h - (STORY_SET - 0.4)) / 2.4);
    if (h > STORY_RISE - 1.3 && h < STORY_RISE + 1.2) return 1 - smooth((h - (STORY_RISE - 1.3)) / 2.5);
    return 1;
  }
  function goldness(h) {    // how golden the light is around sunrise and sunset
    h = h == null ? hour() : h;
    const g1 = Math.max(0, 1 - Math.abs(h - (STORY_SET - 0.6)) / 1.6), g2 = Math.max(0, 1 - Math.abs(h - (STORY_RISE + 0.4)) / 1.4);
    return Math.max(g1, g2 * 0.7);
  }
  function moon() {         // the real moon's shape today: illum 0 (new) to 1 (full), waxing while it grows
    try { if (HS) { const m = HS.at(Date.now()).moon; return { illum: m.lit, waxing: m.phase < 0.5 }; } } catch (_) {}
    return { illum: 1, waxing: true };
  }
  root.LilySky = Object.freeze({
    version: "1", hour, realHour, centralTimeText, skyRgb, light, nightness, goldness, moon, STORY_RISE, STORY_SET,
    get rise() { return today().sunrise; }, get set() { return today().sunset; },
    isTest: () => test !== null
  });
})(typeof window !== "undefined" ? window : globalThis);
