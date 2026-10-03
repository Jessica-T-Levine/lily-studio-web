/*
  Lily Studio · Home Sky, version 1
  ---------------------------------
  The real sun and moon for the "home sky": where they are, how high they are, and the moon's shape,
  for any moment. Pure math, no internet, no location lookups. Games, Watch pages and the Playhouse
  can all load this one file.

  PRIVACY RULE: the home sky is only ever a rounded grid point (33° N, 97° W) on Central Time.
  No town, city or address is ever written in this file or anything that uses it.

  How to use:
    <script src="lily-home-sky-v1.js"></script>
    const ms = LilyHomeSky.centralToUTC(2026, 10, 1, 6);      // 6:00 AM Central on Oct 1, 2026, as a UTC timestamp
    const s  = LilyHomeSky.at(ms);
      s.sun.alt, s.sun.az       degrees (alt includes the air's bending near the horizon; az: 0 north, 90 east, 180 south, 270 west)
      s.moon.alt, s.moon.az     degrees (seen from the ground, so it includes the moon's parallax)
      s.moon.lit                0..1 how much of the moon is lit
      s.moon.phase              0..1 through the month: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter
    LilyHomeSky.events(2026, 10, 1)  sunrise, sunset, moonrise, moonset (Central clock hours) for that day

  Accuracy: about a minute for sunrise and sunset, a few minutes for moonrise and moonset. That's the
  standard "low precision" formulas from the Astronomical Almanac, which is plenty for a picture.
*/
(function (root) {
  "use strict";
  const LAT = 33, LON = -97;                       // rounded grid point only
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const sin = d => Math.sin(d * RAD), cos = d => Math.cos(d * RAD);
  const wrap360 = d => ((d % 360) + 360) % 360;

  // ---------- Central Time (CST = UTC-6, CDT = UTC-5, US rules since 2007) ----------
  function nthSunday(y, m, n) {                       // m: 1..12, the day of the month
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  }
  function centralOffsetHours(utcMs) {                // -5 in daylight time, -6 otherwise
    const y = new Date(utcMs).getUTCFullYear();
    const start = Date.UTC(y, 2, nthSunday(y, 3, 2), 8);   // 2:00 AM CST = 08:00 UTC
    const end = Date.UTC(y, 10, nthSunday(y, 11, 1), 7);   // 2:00 AM CDT = 07:00 UTC
    return utcMs >= start && utcMs < end ? -5 : -6;
  }
  function centralToUTC(y, m, d, hour) {              // a Central wall-clock time -> UTC ms
    let guess = Date.UTC(y, m - 1, d) + hour * 3600e3 + 6 * 3600e3;
    return Date.UTC(y, m - 1, d) + hour * 3600e3 - centralOffsetHours(guess - 3600e3) * 3600e3;
  }
  function centralHour(utcMs) {                       // UTC ms -> Central clock hour (0..24)
    const t = utcMs + centralOffsetHours(utcMs) * 3600e3, dd = new Date(t);
    return dd.getUTCHours() + dd.getUTCMinutes() / 60 + dd.getUTCSeconds() / 3600 + dd.getUTCMilliseconds() / 3600e3;
  }
  function centralDate(utcMs) {                       // {y, m, d} of the Central calendar day
    const dd = new Date(utcMs + centralOffsetHours(utcMs) * 3600e3);
    return { y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate() };
  }

  // ---------- sun and moon ----------
  function sunEcl(n) {                                // n = days since J2000.0
    const g = wrap360(357.529 + 0.98560028 * n), q = wrap360(280.459 + 0.98564736 * n);
    return { lon: wrap360(q + 1.915 * sin(g) + 0.020 * sin(2 * g)), lat: 0 };
  }
  function moonEcl(n) {
    const T = n / 36525;
    const lon = 218.32 + 481267.881 * T
      + 6.29 * sin(135.0 + 477198.87 * T) - 1.27 * sin(259.3 - 413335.36 * T)
      + 0.66 * sin(235.7 + 890534.22 * T) + 0.21 * sin(269.9 + 954397.74 * T)
      - 0.19 * sin(357.5 + 35999.05 * T) - 0.11 * sin(186.5 + 966404.03 * T);
    const lat = 5.13 * sin(93.3 + 483202.02 * T) + 0.28 * sin(228.2 + 960400.89 * T)
      - 0.28 * sin(318.3 + 6003.15 * T) - 0.17 * sin(217.6 - 407332.21 * T);
    const par = 0.9508 + 0.0518 * cos(134.9 + 477198.87 * T) + 0.0095 * cos(259.2 - 413335.36 * T)
      + 0.0078 * cos(235.7 + 890534.22 * T) + 0.0028 * cos(269.9 + 954397.74 * T);
    return { lon: wrap360(lon), lat, par };
  }
  function toHorizon(lon, lat, n) {                   // ecliptic -> altitude/azimuth at the home sky
    const e = 23.439 - 0.0000004 * n;
    const ra = Math.atan2(sin(lon) * cos(e) - Math.tan(lat * RAD) * sin(e), cos(lon)) * DEG;
    const dec = Math.asin(sin(lat) * cos(e) + cos(lat) * sin(e) * sin(lon)) * DEG;
    const lst = wrap360(280.46061837 + 360.98564736629 * n + LON);
    const H = wrap360(lst - ra);
    const alt = Math.asin(sin(LAT) * sin(dec) + cos(LAT) * cos(dec) * cos(H)) * DEG;
    const az = wrap360(Math.atan2(-cos(dec) * sin(H), sin(dec) * cos(LAT) - cos(dec) * sin(LAT) * cos(H)) * DEG);
    return { alt, az };
  }
  function refraction(alt) {                          // how much the air lifts a body near the horizon (degrees)
    if (alt < -2) return 0;
    const a = Math.max(alt, -1.9);
    return (1.02 / Math.tan((a + 10.3 / (a + 5.11)) * RAD)) / 60;
  }
  function at(utcMs) {
    const n = utcMs / 86400000 + 2440587.5 - 2451545.0;
    const S = sunEcl(n), M = moonEcl(n);
    const sh = toHorizon(S.lon, 0, n), mh = toHorizon(M.lon, M.lat, n);
    const mTopo = mh.alt - M.par * cos(mh.alt);       // seen from the ground, not the Earth's center
    const elong = wrap360(M.lon - S.lon);
    const cosPsi = cos(M.lat) * cos(elong);
    return {
      sun: { alt: sh.alt + refraction(sh.alt), trueAlt: sh.alt, az: sh.az },
      moon: { alt: mTopo + refraction(mTopo), trueAlt: mTopo, az: mh.az, lit: (1 - cosPsi) / 2, phase: elong / 360 }
    };
  }

  // ---------- rise and set times for a Central calendar day (minute steps, then refined) ----------
  function events(y, m, d) {
    const t0 = centralToUTC(y, m, d, 0), t1 = centralToUTC(y, m, d + 1, 0);
    const out = { sunrise: null, sunset: null, moonrise: null, moonset: null };
    const f = { sun: ms => at(ms).sun.trueAlt + 0.833, moon: ms => at(ms).moon.trueAlt + 0.833 };
    ["sun", "moon"].forEach(k => {
      let prev = f[k](t0);
      for (let t = t0 + 60e3; t <= t1; t += 60e3) {
        const v = f[k](t);
        if ((prev < 0) !== (v < 0)) {
          let a = t - 60e3, b = t;
          for (let i = 0; i < 20; i++) { const mid = (a + b) / 2; if ((f[k](a) < 0) !== (f[k](mid) < 0)) b = mid; else a = mid; }
          const name = k === "sun" ? (v > 0 ? "sunrise" : "sunset") : (v > 0 ? "moonrise" : "moonset");
          if (out[name] === null) out[name] = centralHour((a + b) / 2);
        }
        prev = v;
      }
    });
    return out;
  }

  const api = Object.freeze({ version: "1", LAT, LON, at, events, centralToUTC, centralHour, centralDate, centralOffsetHours });
  root.LilyHomeSky = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
