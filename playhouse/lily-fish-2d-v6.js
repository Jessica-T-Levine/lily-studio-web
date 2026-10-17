const LilyFish2D = (() => {
  const PALETTES = {
    goldfish: {
      body: "#FF8F52",
      light: "#FFC08A",
      pale: "rgba(255, 214, 180, 1)",
      paleClear: "rgba(255,214,180,0)",
      tailRay: "222, 112, 60",
      finRay: "214, 110, 62",
      farFin: [ "#F7A26C", "#FBC79F" ],
      topFin: [ "#FF9A60", "#FFC9A0" ],
      nearFin: [ "#FFBF89", "#FFB585", "#FFD3B0" ],
      belly: null,
      bellySoft: {
        x: 1,
        y: 3.1,
        rx: 9.6,
        ry: 3.3,
        color: "255, 230, 190",
        alpha: .82
      },
      oneBody: true,
      tailWave: {
        from: -10.5,
        to: -26,
        amp: 2.2,
        pow: 1.6
      },
      bendFrom: 10,
      bendLen: 44,
      wholeWave: true,
      finsRipple: true,
      depth: {
        shadow: "196, 84, 34",
        shadowA: .3,
        head: "255, 196, 84",
        headA: .42,
        sheen: "255, 214, 120",
        sheenA: .5,
        scale: "255, 232, 176",
        scaleA: .24,
        gill: "196, 86, 36",
        gillA: .28,
        gillLight: "255, 222, 160",
        root: "205, 80, 30",
        rootA: .26,
        streak: .24
      }
    },
    koi: {
      body: "#FFF3EA",
      light: "#FFFFFF",
      pale: "rgba(255, 220, 206, 1)",
      paleClear: "rgba(255,220,206,0)",
      tailRay: "236, 138, 118",
      finRay: "228, 140, 120",
      farFin: [ "#F4DCD2", "#FAE6DE" ],
      topFin: [ "#FFE6DC", "#FFD0C0" ],
      nearFin: [ "#FFFFFF", "#FFE3D8", "#FFD2C2" ],
      belly: null,
      marks: "koi",
      size: 1.2,
      finScale: 1.15,
      ribbons: {
        tip: "#FF7A6B"
      }
    },
    stripe: {
      body: "#7FA8EE",
      light: "#B9D2FA",
      pale: "rgba(200, 186, 244, 1)",
      paleClear: "rgba(200,186,244,0)",
      tailRay: "126, 112, 214",
      finRay: "122, 108, 206",
      farFin: [ "#9289DA", "#B7AAEE" ],
      topFin: [ "#9C93E6", "#C6B8F5" ],
      nearFin: [ "#B9D2FA", "#B4A6F0", "#D3C8F8" ],
      belly: null,
      marks: "stripe",
      stretch: [ 1.2, .7 ]
    },
    rainbow: {
      bodyRy: 7.6,
      frontShift: 1.2,
      pupil: "#0B1E3F",
      sparkle: "glints",
      bellyBase: 1.15,
      farFinScale: [ 1.4, 1.25 ],
      rainbow: {
        from: [ 12, 0 ],
        to: [ -26, 0 ],
        stops: [ [ 0, "#FF8FC7" ], [ .16, "#FFB27A" ], [ .32, "#FFE27A" ], [ .48, "#A3D977" ], [ .63, "#7DD3FC" ], [ .84, "#C277F5" ], [ 1, "#D9B8FA" ] ]
      },
      tailRay: "255, 255, 255",
      finRay: "255, 255, 255",
      farFin: [ "#FFFFFF", "#FFFFFF" ],
      topFin: [ "#FFFFFF", "#FFFFFF" ],
      nearFin: [ "#FFFFFF", "#FFFFFF", "#FFFFFF" ],
      belly: "rgba(255, 255, 255, 0.28)",
      marks: null,
      streamers: {
        tailTop: {
          w: 1.6,
          r: 2.3,
          pts: [ [ -21, -11 ], [ -23, -11.75 ], [ -24.8, -12.25 ], [ -26.6, -12.6 ], [ -27.48, -12.56 ], [ -28.35, -12.25 ], [ -29.23, -11.64 ], [ -29.97, -10.76 ], [ -30.54, -9.71 ], [ -31.02, -8.57 ], [ -31.54, -7.52 ], [ -32.24, -6.65 ], [ -33.08, -5.99 ], [ -33.95, -5.55 ], [ -34.65, -5.38 ] ]
        },
        tailBot: {
          w: 1.6,
          r: 2.3,
          grow: 1.37,
          pts: [ [ -22.2, 9.1 ], [ -24, 10 ], [ -25.7, 10.8 ], [ -27.3, 11.6 ], [ -28.9, 13.3 ], [ -29.4, 15.2 ], [ -29.7, 17.7 ], [ -30.8, 19.4 ], [ -32.3, 21.6 ] ]
        },
        topFin: {
          w: 1.7,
          r: 2.7,
          e: .2,
          grow: 1.66,
          pts: [ [ -1.5, -8.8 ], [ -1.75, -10.3 ], [ -2.6, -11.25 ], [ -3.9, -11.55 ], [ -5, -11.4 ], [ -6.3, -11 ], [ -7.9, -10.6 ], [ -9, -11.2 ], [ -9.9, -12.5 ], [ -10.6, -13.5 ], [ -12.1, -14.2 ], [ -14.2, -14.3 ], [ -15.7, -13.9 ] ]
        },
        nearFin: {
          w: 2.4,
          r: 3.4,
          grow: 1.35,
          pts: [ [ -1.3, 8 ], [ -1.3, 9.5 ], [ -1.4, 11 ], [ -2.8, 12.7 ], [ -6.3, 14.4 ], [ -9.4, 15.7 ], [ -11.9, 17.2 ], [ -14, 19.4 ], [ -16.6, 20.1 ], [ -18.6, 20.1 ] ]
        },
        farFin: {
          w: 1.6,
          r: 2.6,
          grow: 1.3,
          pts: [ [ 3.2, 6.9 ], [ 3.5, 8.7 ], [ 3.85, 9.8 ], [ 3.4, 11.2 ], [ 2.7, 12.1 ], [ -.6, 14.3 ], [ -3.4, 16 ], [ -4.8, 17.4 ], [ -5.1, 18.9 ], [ -6.5, 20.2 ] ]
        }
      }
    },
    puffer: {
      size: .8,
      bodyRy: 7.6,
      bodyShape: "tear",
      tear: {
        xm: 3,
        back: -12,
        stalk: 2.3,
        puffH: 11.4
      },
      bendFrom: 10,
      bendLen: 40,
      wholeWave: true,
      tailScale: .92,
      finScale: .8,
      frontShift: -2.6,
      pupil: "#0B1E3F",
      fanTail: {
        cx: -12.2,
        r: 8.2,
        open: .95,
        rays: 9,
        root: 2.7,
        scallop: .55,
        mid: "rgba(255, 228, 120, 0.96)",
        edge: "rgba(255, 242, 190, 0.72)"
      },
      fans: [ {
        x: -7.8,
        top: true,
        inset: .8,
        angle: .75,
        len: 4.2,
        base: .8,
        spread: .42
      }, {
        x: -7.2,
        top: false,
        inset: .8,
        angle: -.75,
        len: 3.8,
        base: .8,
        spread: .42
      } ],
      fanBase: "rgba(255, 228, 150, 0.92)",
      fanTip: "rgba(255, 244, 210, 0.55)",
      topTuck: 2.4,
      topStart: [ -5.2, -4.4 ],
      nearFinFront: true,
      rainbow: {
        from: [ 0, -7.6 ],
        to: [ 0, 7.6 ],
        stops: [ [ 0, "#F5CF2E" ], [ .36, "#FADD55" ], [ .6, "#FCEEA8" ], [ .8, "#FFF8DE" ], [ 1, "#FFFCF2" ] ]
      },
      sideSpines: {
        w: .17,
        clearEye: 4.1,
        puffN: 80,
        puffLen: 2.4,
        shadow: "rgba(190, 140, 20, 0.15)",
        base: "rgba(255, 236, 140, 0)",
        color: "rgba(255, 240, 160, 0.95)",
        tip: "rgba(255, 251, 228, 0.9)",
        rows: [ [ .1, 2.8, 1.55, -9.5, 8.5 ], [ .28, 2.6, 1.65, -9, 7.8 ], [ .46, 2.3, 1.75, -8.4, 6.6 ], [ .62, 1.9, 1.9, -7.6, 4.8 ] ]
      },
      polka: {
        color: "rgba(255, 252, 228, 0.42)",
        pts: [ [ -9.62, -6.21, .54 ], [ -7.55, -5.98, .49 ], [ -5.31, -6, .43 ], [ -2.8, -6.26, .44 ], [ -.55, -5.8, .44 ], [ 1.56, -5.92, .59 ], [ 8.75, -6.13, .45 ], [ -8.67, -4.21, .57 ], [ -6.37, -4.05, .54 ], [ -3.99, -4.07, .43 ], [ -1.96, -4.28, .54 ], [ .55, -4.21, .53 ], [ -9.34, -2.33, .6 ], [ -7.52, -2.25, .56 ], [ -5.24, -2.21, .43 ], [ -2.63, -2.04, .52 ], [ -.24, -2.31, .55 ], [ -8.26, -.21, .6 ], [ -5.92, -.43, .49 ], [ -3.78, -.59, .5 ], [ -1.88, -.53, .43 ], [ .79, -.52, .46 ], [ 9.82, -.08, .47 ], [ -9.56, 1.52, .58 ], [ -6.93, 1.39, .45 ], [ -5.19, 1.44, .51 ], [ -2.69, 1.46, .42 ], [ -.56, 1.52, .52 ], [ 2.07, 1.71, .51 ], [ 4.08, 1.71, .43 ], [ 6.53, 1.77, .58 ], [ -8.47, 3.26, .53 ], [ -6.46, 3.24, .46 ], [ -4.14, 3.4, .43 ], [ -2, 3.29, .44 ], [ .5, 3.22, .58 ], [ 2.93, 3.29, .47 ], [ 4.99, 3.42, .44 ] ]
      },
      tailRay: "214, 168, 70",
      finRay: "214, 168, 70",
      farFin: [ "#FFFFFF", "#FFFFFF" ],
      topFin: [ "#FFFFFF", "#FFFFFF" ],
      nearFin: [ "#FFFFFF", "#FFFFFF", "#FFFFFF" ],
      finFill: "rgba(255, 234, 168, 0.9)",
      belly: null,
      bellySoft: {
        x: 1.5,
        y: 3.6,
        rx: 10.5,
        ry: 4.4,
        color: "255, 253, 244",
        alpha: .75
      },
      eye: {
        x: 5.9,
        y: -2.6,
        s: 1.38,
        ring: "rgba(255, 236, 168, 0.95)",
        glint2: true
      },
      cheek: [ 5.9, 2, 1.5, .9 ],
      smile: {
        a: [ 8.75, 2.5 ],
        c: [ 9.6, 4 ],
        b: [ 10.45, 2.55 ],
        lip: "rgba(255, 222, 196, 0.95)",
        lipW: .85,
        line: "rgba(150, 92, 70, 0.75)",
        lineW: .28
      },
      pecFin: {
        x: 2.6,
        y: 1.6,
        len: 4.4,
        base: "rgba(255, 226, 140, 0.95)",
        tip: "rgba(255, 244, 205, 0.75)",
        ray: "205, 150, 50"
      },
      marks: {
        type: "dots",
        color: "rgba(92, 64, 30, 0.7)",
        pts: [ [ -6, -6.6, .34 ], [ -3.2, -7.6, .3 ], [ -.4, -7.9, .32 ], [ 2.2, -7.3, .28 ], [ -8.6, -4.6, .3 ], [ -4.8, -5.2, .26 ], [ -1.8, -5.8, .3 ], [ .9, -5.6, .24 ], [ -7.4, -2.4, .26 ], [ -10, -1.2, .24 ], [ -2.8, -3.6, .22 ], [ 3.6, -5.6, .22 ] ]
      },
      spines: {
        n: 37,
        nTop: 24,
        w: .34,
        len: 2.5,
        lean: .95,
        skipBack: .72,
        root: .9,
        base: "#F5CF2E",
        color: "#FADF6A",
        tip: "rgba(255, 248, 210, 0.55)"
      }
    },
    angel: {
      size: .75,
      bodyRy: 8.6,
      pupil: "#0B1E3F",
      finScale: 1.5,
      tailScale: 1.25,
      finWave: .4,
      bandsInFins: 13,
      topTuck: 1.4,
      topStart: [ -5.5, -4.6 ],
      rainbow: {
        from: [ 12, 0 ],
        to: [ -26, 0 ],
        stops: [ [ 0, "#FFFFFF" ], [ .35, "#F3F0FF" ], [ .7, "#E4E0FA" ], [ 1, "#D9D3F7" ] ]
      },
      tailRay: "150, 140, 200",
      finRay: "150, 140, 200",
      farFin: [ "#FFFFFF", "#FFFFFF" ],
      topFin: [ "#FFFFFF", "#FFFFFF" ],
      nearFin: [ "#FFFFFF", "#FFFFFF", "#FFFFFF" ],
      belly: null,
      marks: {
        type: "bands",
        color: "11, 30, 63",
        alpha: .035,
        xs: [ -6.4, -.8, 4.2 ],
        width: 1,
        edge: null
      },
      streamers: {
        topFin: {
          w: 2.2,
          r: 3.4,
          pts: [ [ -1.5, -8.6 ], [ -1.9, -10.6 ], [ -3, -12.6 ], [ -4.8, -14.6 ], [ -7.2, -16.6 ], [ -10.2, -18.4 ], [ -13.6, -19.6 ], [ -17, -20.2 ] ]
        },
        nearFin: {
          w: 2.2,
          r: 3.4,
          pts: [ [ -1.4, 8.6 ], [ -1.9, 10.6 ], [ -3, 12.6 ], [ -4.8, 14.6 ], [ -7.2, 16.6 ], [ -10.2, 18.4 ], [ -13.6, 19.6 ], [ -17, 20.2 ] ]
        },
        farFin: {
          w: .9,
          r: 1.3,
          pts: [ [ 3.2, 6.9 ], [ 3.4, 9.4 ], [ 3.3, 12.2 ], [ 2.8, 15 ], [ 1.9, 17.8 ], [ .6, 20.4 ], [ -1, 22.6 ] ]
        }
      }
    },
    clown: {
      size: .6,
      bodyRy: 6.9,
      bodyShape: "tear",
      tear: {
        xm: 1,
        back: -17.04,
        stalk: 3.2
      },
      tailShift: -4.84,
      bendFrom: 10,
      bendLen: 44,
      wholeWave: true,
      tailScale: .9,
      pupil: "#0B1E3F",
      rainbow: {
        from: [ 0, -6.9 ],
        to: [ 0, 6.9 ],
        stops: [ [ 0, "#C9400F" ], [ .3, "#E85A1C" ], [ .55, "#F37A2C" ], [ .74, "#F9A766" ], [ .88, "#FDDCBC" ], [ 1, "#FFF5EA" ] ]
      },
      bellySoft: {
        x: .5,
        y: 5.6,
        rx: 11,
        ry: 2.6,
        color: "255, 247, 236",
        alpha: .55
      },
      finFill: "rgba(255, 176, 64, 0.95)",
      tailRay: "214, 120, 30",
      finRay: "214, 120, 30",
      farFin: [ "#FFFFFF", "#FFFFFF" ],
      topFin: [ "#FFFFFF", "#FFFFFF" ],
      nearFin: [ "#FFFFFF", "#FFFFFF", "#FFFFFF" ],
      belly: null,
      eye: {
        x: 7.7,
        y: -1.5,
        s: .8075
      },
      cheek: [ 7, 2.3, 1.4, .85 ],
      eyeRim: "rgba(214, 92, 30, 0.75)",
      cheekColor: "rgba(226, 78, 24, 0.42)",
      smile: {
        a: [ 8.75, 2.5 ],
        c: [ 9.6, 4 ],
        b: [ 10.45, 2.55 ],
        lip: "rgba(255, 200, 170, 0.9)",
        lipW: .8,
        line: "rgba(120, 50, 30, 0.8)",
        lineW: .28
      },
      marks: {
        type: "bands",
        color: "255, 255, 255",
        alpha: .4,
        xs: [ 4.5, -3.9, -14.9 ],
        width: .72,
        edge: "11, 30, 63",
        edgeAlpha: .17
      },
      fanTail: {
        cx: -12.4,
        r: 7.4,
        open: .9,
        rays: 9,
        root: 3,
        scallop: .6,
        mid: "rgba(255, 178, 60, 0.97)",
        edge: "rgba(255, 205, 110, 0.9)"
      },
      fanBase: "rgba(255, 168, 52, 0.97)",
      fanTip: "rgba(255, 200, 100, 0.92)",
      fans: [ {
        x: -2.2,
        top: true,
        inset: 1.5,
        angle: 1.45,
        len: 4,
        base: 3,
        spread: .8
      }, {
        x: -10.1,
        top: true,
        inset: 1.4,
        angle: 1.2,
        len: 4.4,
        base: 2.8,
        spread: .8
      }, {
        x: -.6,
        top: false,
        inset: 1.3,
        angle: -1.4,
        len: 3.8,
        base: 2,
        spread: .75,
        darkEdge: "rgba(11, 30, 63, 0.6)"
      }, {
        x: -9.7,
        top: false,
        inset: 1.4,
        angle: -1.15,
        len: 4,
        base: 2.4,
        spread: .75,
        darkEdge: "rgba(11, 30, 63, 0.6)"
      } ],
      pecFin: {
        x: 2,
        y: 1,
        len: 4,
        base: "rgba(255, 170, 56, 0.97)",
        tip: "rgba(255, 200, 100, 0.92)",
        ray: "214, 120, 30"
      }
    }
  };
  Object.values(PALETTES).forEach((P => P.streamers && Object.values(P.streamers).forEach((S => {
    if (!S.grow || S.grow === 1) return;
    const a = S.pts[2];
    S.pts = S.pts.map(((q, i) => i <= 2 ? q : [ a[0] + (q[0] - a[0]) * S.grow, a[1] + (q[1] - a[1]) * S.grow ]));
  }))));
  function bodySpaceWarp(real, BM0, W) {
    const BI = BM0.inverse();
    let cx = 0, cy = 0, has = false, L2B = null, B2L = null;
    const frame = () => {
      L2B = BI.multiply(real.getTransform());
      B2L = L2B.inverse();
    };
    const put = (x, y, first) => {
      const b = L2B.transformPoint({
        x: x,
        y: y
      }), q = W(b.x, b.y), l = B2L.transformPoint({
        x: q[0],
        y: q[1]
      });
      if (first) real.moveTo(l.x, l.y); else real.lineTo(l.x, l.y);
      cx = x;
      cy = y;
      has = true;
    };
    const ops = {
      beginPath() {
        real.beginPath();
        has = false;
      },
      moveTo(x, y) {
        frame();
        put(x, y, true);
      },
      lineTo(x, y) {
        frame();
        if (!has) return put(x, y, true);
        const n = Math.max(1, Math.ceil(Math.hypot(x - cx, y - cy) / .6)), x0 = cx, y0 = cy;
        for (let i = 1; i <= n; i++) put(x0 + (x - x0) * i / n, y0 + (y - y0) * i / n);
      },
      bezierCurveTo(a, b, c, d, x, y) {
        frame();
        const x0 = cx, y0 = cy;
        for (let i = 1; i <= 24; i++) {
          const t = i / 24, u = 1 - t;
          put(u * u * u * x0 + 3 * u * u * t * a + 3 * u * t * t * c + t * t * t * x, u * u * u * y0 + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * y);
        }
      },
      quadraticCurveTo(a, b, x, y) {
        frame();
        const x0 = cx, y0 = cy;
        for (let i = 1; i <= 16; i++) {
          const t = i / 16, u = 1 - t;
          put(u * u * x0 + 2 * u * t * a + t * t * x, u * u * y0 + 2 * u * t * b + t * t * y);
        }
      },
      arc(x, y, r, a0, a1, ccw) {
        frame();
        let sw = a1 - a0;
        if (!ccw && sw < 0) sw += 2 * Math.PI;
        if (ccw && sw > 0) sw -= 2 * Math.PI;
        if (Math.abs(a1 - a0) >= 2 * Math.PI - 1e-9) sw = ccw ? -2 * Math.PI : 2 * Math.PI;
        const n = Math.max(8, Math.ceil(Math.abs(sw) / (Math.PI / 32)));
        for (let i = 0; i <= n; i++) {
          const a = a0 + sw * i / n;
          put(x + r * Math.cos(a), y + r * Math.sin(a), !has && i === 0);
        }
      },
      ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
        frame();
        let sw = a1 - a0;
        if (!ccw && sw < 0) sw += 2 * Math.PI;
        if (ccw && sw > 0) sw -= 2 * Math.PI;
        if (Math.abs(a1 - a0) >= 2 * Math.PI - 1e-9) sw = ccw ? -2 * Math.PI : 2 * Math.PI;
        const n = Math.max(12, Math.ceil(Math.abs(sw) / (Math.PI / 48))), cr = Math.cos(rot), sr = Math.sin(rot);
        for (let i = 0; i <= n; i++) {
          const a = a0 + sw * i / n, ex = rx * Math.cos(a), ey = ry * Math.sin(a);
          put(x + ex * cr - ey * sr, y + ex * sr + ey * cr, i === 0 && !has);
          if (i === 0 && has) {}
        }
      },
      rect(x, y, w, h) {
        frame();
        put(x, y, true);
        [ [ x + w, y ], [ x + w, y + h ], [ x, y + h ], [ x, y ] ].forEach((q => ops.lineTo(q[0], q[1])));
        real.closePath();
        has = false;
      },
      closePath() {
        real.closePath();
      }
    };
    return new Proxy(real, {
      get(t, k) {
        if (k in ops) return ops[k];
        const v = t[k];
        return typeof v === "function" ? v.bind(t) : v;
      },
      set(t, k, v) {
        t[k] = v;
        return true;
      }
    });
  }
  function draw(ctx, name, opt) {
    const P = PALETTES[name] || PALETTES.goldfish;
    if ((P.size || P.stretch) && !(opt && opt.__sized)) {
      const z = P.size || 1, st = P.stretch || [ 1, 1 ], o = opt || {};
      ctx.save();
      ctx.scale(z * st[0], z * st[1]);
      try {
        return draw(ctx, name, Object.assign({}, o, {
          __sized: true,
          stretchAlong: (o.stretchAlong || 1) * st[0],
          stretchAcross: (o.stretchAcross || 1) * st[1]
        }));
      } finally {
        ctx.restore();
      }
    }
    const BM = ctx.getTransform();
    opt = opt || {};
    const PUFF = P.bodyShape === "tear" && P.tear.puffH ? Math.max(0, Math.min(1, opt.puff || 0)) : 0;
    const mouth = Math.max(opt.mouth || 0, .6 * PUFF * PUFF);
    const wag = opt.wag || 0;
    const flick = opt.flick || 0;
    const fk = 1 - .32 * Math.abs(flick);
    const RIP = opt.ripple !== undefined, RA = opt.rippleAmt === undefined ? 1 : opt.rippleAmt, TH = 2 * Math.PI * (opt.ripple || 0);
    const TR = P.bendFrom === undefined ? -10.5 : P.bendFrom, TLN = P.bendLen || 20;
    const tailWarp = (x, y) => {
      const u = TR - x;
      if (u <= 0) return [ x, y ];
      const d0 = u / TLN, d = d0 <= .9 ? d0 : .9 + .35 * Math.tanh((d0 - .9) / .35);
      const squeeze = .13 * RA * (.5 - .5 * Math.cos(2 * TH - 1.6 * d)) * (P.wholeWave ? .45 * Math.min(1, d / .75) : 1);
      const thin = Math.min(1, Math.pow(Math.max(0, (d - .55) / .6), 2));
      const TW = P.tailWave, tw = TW ? TW.amp * RA * Math.pow(Math.min(1.15, Math.max(0, (TW.from - x) / (TW.from - TW.to))), TW.pow) * Math.sin(TH - 2.6 * d) : 0;
      return [ TR - u * (1 - squeeze), y + 1.2 * RA * Math.pow(d, 1.7) * Math.sin(TH - 2.6 * d) + tw + 1.6 * RA * thin * (Math.sin(TH - 4.6 * d + .8) + .35 * Math.sin(2 * TH - 7.5 * d)) ];
    };
    const finWarp = (ax, ay, len, ph) => (x, y) => {
      const vx = x - ax, vy = y - ay, r = Math.hypot(vx, vy) || 1, d = r / len;
      if (d <= .28) return [ x, y ];
      const e = Math.pow((d - .28) / .72, 1.8);
      const amt = 2.3 * RA * (P.finWave === undefined ? 1 : P.finWave) * e * (Math.sin(TH + ph - 4.6 * d) + .35 * Math.sin(2 * TH + 2 * ph - 7.5 * d));
      return [ x - vy / r * amt, y + vx / r * amt ];
    };
    const finRipple = (L, ph) => (x, y) => {
      const u = -x;
      if (u <= 0) return [ x, y ];
      const d = Math.min(1.3, u / L), th = TH + ph;
      const sq = .13 * RA * (.5 - .5 * Math.cos(2 * th - 1.6 * d));
      return [ -u * (1 - sq), y + .15 * L * RA * Math.pow(d, 1.7) * Math.sin(th - 2.6 * d) ];
    };
    const axisRipple = (bx, by, dx, dy, L, ph) => {
      const n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, R = finRipple(L, ph);
      return (x, y) => {
        const a = (x - bx) * ux + (y - by) * uy, c = -(x - bx) * uy + (y - by) * ux;
        if (a <= 0) return [ x, y ];
        const q = R(-a, c), a2 = -q[0], c2 = q[1];
        return [ bx + a2 * ux - c2 * uy, by + a2 * uy + c2 * ux ];
      };
    };
    const FR = P.finsRipple;
    const scullAt = ph => {
      if (!FR || !RIP) return {
        a: 0,
        s: 1
      };
      const f = .5 + .5 * Math.sin(TH + ph);
      return {
        a: .32 * f * RA,
        s: 1 - .22 * (1 - f) * RA
      };
    };
    const SCN = scullAt(.3), SCF = SCN;
    const topWarp = FR ? axisRipple(-1.4, -5.4, -.3, -1, 4.4, .9) : finWarp(-1.4, -5.4, 16, .9), nearWarp = FR ? axisRipple(-1.6, 4.6, -.2, 1, 4.7, .3) : finWarp(-1.6, 4.6, 22, .3), farWarp = FR ? axisRipple(3, 5.2, .05, 1, 3, .3) : finWarp(3, 5.2, 23, 1.6);
    function warpCtx(real, W) {
      let cx = 0, cy = 0, has = false;
      const put = (x, y, first) => {
        const q = W(x, y);
        if (first) real.moveTo(q[0], q[1]); else real.lineTo(q[0], q[1]);
        cx = x;
        cy = y;
        has = true;
      };
      const ops = {
        beginPath() {
          real.beginPath();
          has = false;
        },
        moveTo(x, y) {
          put(x, y, true);
        },
        lineTo(x, y) {
          if (!has) return put(x, y, true);
          const n = Math.max(1, Math.ceil(Math.hypot(x - cx, y - cy) / .8)), x0 = cx, y0 = cy;
          for (let i = 1; i <= n; i++) put(x0 + (x - x0) * i / n, y0 + (y - y0) * i / n);
        },
        bezierCurveTo(a, b, c, d, x, y) {
          const x0 = cx, y0 = cy;
          for (let i = 1; i <= 24; i++) {
            const t = i / 24, u = 1 - t;
            put(u * u * u * x0 + 3 * u * u * t * a + 3 * u * t * t * c + t * t * t * x, u * u * u * y0 + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * y);
          }
        },
        quadraticCurveTo(a, b, x, y) {
          const x0 = cx, y0 = cy;
          for (let i = 1; i <= 16; i++) {
            const t = i / 16, u = 1 - t;
            put(u * u * x0 + 2 * u * t * a + t * t * x, u * u * y0 + 2 * u * t * b + t * t * y);
          }
        },
        arc(x, y, r, a0, a1, ccw) {
          let sw = a1 - a0;
          if (!ccw && sw < 0) sw += 2 * Math.PI;
          if (ccw && sw > 0) sw -= 2 * Math.PI;
          const n = Math.max(4, Math.ceil(Math.abs(sw) / (Math.PI / 24)));
          for (let i = 0; i <= n; i++) {
            const a = a0 + sw * i / n;
            put(x + r * Math.cos(a), y + r * Math.sin(a), !has && i === 0);
          }
        },
        closePath() {
          real.closePath();
        }
      };
      return new Proxy(real, {
        get(t, k) {
          if (k in ops) return ops[k];
          const v = t[k];
          return typeof v === "function" ? v.bind(t) : v;
        },
        set(t, k, v) {
          t[k] = v;
          return true;
        }
      });
    }
    const SHT = P.tailShift || 0, tailWarpT = SHT ? (x, y) => {
      const q = tailWarp(x + SHT, y);
      return [ q[0] - SHT, q[1] ];
    } : tailWarp;
    const WHOLE = !!opt.__wave;
    const warped = (W, fn) => {
      if (!RIP || !W || WHOLE && (W === tailWarp || W === tailWarpT)) return fn();
      const c0 = ctx;
      ctx = warpCtx(c0, W);
      try {
        fn();
      } finally {
        ctx = c0;
      }
    };
    if (P.wholeWave && RIP && !WHOLE) return draw(bodySpaceWarp(ctx, BM, tailWarp), name, Object.assign({}, opt, {
      __wave: true
    }));
    const paddle = opt.paddle || 0;
    const sa = opt.stretchAlong || 1, sc = opt.stretchAcross || 1;
    const speed = opt.speed || 0;
    const bend = opt.bend || 0;
    const sweep = (x, y, k, fn) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(1, 0, k, 1, 0, 0);
      ctx.translate(-x, -y);
      fn();
      ctx.restore();
    };
    const fs = P.finScale || 1;
    const RY = P.bodyRy || 6.5, dT = -(RY - 6.5), dB = RY - 6.5;
    const FX = P.frontShift || 0;
    const TS = P.topStart || [ -7.2, -4.6 ];
    const TEAR = P.bodyShape === "tear" ? P.tear : null;
    const halfLocal = x => TEAR ? halfH(x) : RY * Math.sqrt(Math.max(0, 1 - x * x / 144));
    const halfTear = x => {
      const T = TEAR, xm = T.xm, H = RY;
      if (x >= xm) return H * Math.sqrt(Math.max(0, 1 - Math.pow((x - xm) / (12 - xm), 2)));
      const t = Math.min(1, (xm - x) / (xm - T.back));
      return T.stalk + (H - T.stalk) * (.5 + .5 * Math.cos(Math.PI * t));
    };
    const halfH = x => {
      const h0 = halfTear(x);
      if (!PUFF) return h0;
      const hb = (TEAR.puffH || 11.5) * Math.sqrt(Math.max(0, 1 - Math.pow(x / 12, 2)));
      return h0 + (Math.max(hb, TEAR.stalk * (1 - PUFF)) - h0) * PUFF;
    };
    const VS = TEAR && PUFF ? halfH(0) / halfTear(0) : 1;
    const bodyPath = (shrink = 0, keepPath = false) => {
      if (!keepPath) ctx.beginPath();
      if (!TEAR) {
        ctx.ellipse(0, 0, 12 - shrink, RY - shrink, 0, 0, Math.PI * 2);
        return;
      }
      if (PUFF) {
        const N = 200, x0 = TEAR.back, X = i => x0 + (12 - x0) * (1 - Math.cos(Math.PI * i / N)) / 2;
        for (let i = 0; i <= N; i++) {
          const x = X(i), y = -Math.max(0, halfH(x) - shrink);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        for (let i = N; i >= 0; i--) {
          const x = X(i);
          ctx.lineTo(x, Math.max(0, halfH(x) - shrink));
        }
        const hb = Math.max(0, halfH(x0) - shrink);
        ctx.quadraticCurveTo(x0 - 1.2, 0, x0, -hb);
        ctx.closePath();
        return;
      }
      const N = 90, x0 = TEAR.back, xm = TEAR.xm;
      for (let i = 0; i <= N; i++) {
        const x = x0 + (xm - x0) * i / N, y = -Math.max(0, halfH(x) - shrink);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.ellipse(xm, 0, Math.max(.01, 12 - xm - shrink), Math.max(.01, RY - shrink), 0, -Math.PI / 2, Math.PI / 2);
      for (let i = N; i >= 0; i--) {
        const x = x0 + (xm - x0) * i / N;
        ctx.lineTo(x, Math.max(0, halfH(x) - shrink));
      }
      ctx.quadraticCurveTo(x0 - 1.2, 0, x0, -Math.max(0, TEAR.stalk - shrink));
      ctx.closePath();
    };
    let rbo = 0;
    const grow = (x, y, fn) => {
      if (fs === 1) return fn();
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(fs, fs);
      ctx.translate(-x, -y);
      fn();
      ctx.restore();
    };
    function ribbon(c, w0, from, to) {
      const N = 28, L = [], R = [];
      const pt = t => {
        const u = 1 - t;
        return [ u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0], u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1] ];
      };
      for (let i = 0; i <= N; i++) {
        const t = i / N, a = pt(Math.max(0, t - .01)), b = pt(Math.min(1, t + .01)), m = pt(t);
        const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
        const k = t < .3 ? Math.sin(t / .3 * Math.PI / 2) : Math.pow((1 - t) / .7, .85);
        const w = w0 * .5 * k + .04 * Math.min(1, t * 5);
        L.push([ m[0] + nx * w, m[1] + ny * w ]);
        R.push([ m[0] - nx * w, m[1] - ny * w ]);
      }
      const g = ctx.createLinearGradient(c[0][0], c[0][1], c[3][0], c[3][1]);
      g.addColorStop(0, from);
      g.addColorStop(.25, from);
      g.addColorStop(1, to);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(L[0][0], L[0][1]);
      L.forEach((q => ctx.lineTo(q[0], q[1])));
      R.reverse().forEach((q => ctx.lineTo(q[0], q[1])));
      ctx.closePath();
      ctx.fill();
    }
    function streamer(S, fills) {
      const G = ribbonGeom(S);
      if (!G) return;
      fills.forEach((f => {
        ctx.fillStyle = f;
        G.shape();
        ctx.fill();
      }));
      G.endFade();
    }
    function ribbonGeom(S) {
      if (!S) return null;
      const P0 = S.pts, n = P0.length, line = [];
      for (let i = 0; i < n - 1; i++) {
        const a = P0[Math.max(0, i - 1)], b = P0[i], c = P0[i + 1], d = P0[Math.min(n - 1, i + 2)];
        for (let k = 0; k < 8; k++) {
          const t = k / 8, t2 = t * t, t3 = t2 * t;
          line.push([ 0, 1 ].map((j => .5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3))));
        }
      }
      line.push(P0[n - 1]);
      const acc = [ 0 ];
      for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
      const len = acc[acc.length - 1], M = 140, even = [];
      for (let i = 0, j = 0; i < M; i++) {
        const d = len * i / (M - 1);
        while (j < acc.length - 2 && acc[j + 1] < d) j++;
        const u = (d - acc[j]) / (acc[j + 1] - acc[j] || 1);
        even.push([ line[j][0] + (line[j + 1][0] - line[j][0]) * u, line[j][1] + (line[j + 1][1] - line[j][1]) * u ]);
      }
      let sm = even;
      for (let pass = 0; pass < 48; pass++) sm = sm.map(((q, i) => i === 0 || i === M - 1 ? q : [ .25 * sm[i - 1][0] + .5 * q[0] + .25 * sm[i + 1][0], .25 * sm[i - 1][1] + .5 * q[1] + .25 * sm[i + 1][1] ]));
      line.length = 0;
      sm.forEach((q => line.push(q)));
      const N = line.length - 1, L = [], R = [];
      line.forEach(((m, i) => {
        const t = i / N, a = line[Math.max(0, i - 2)], b = line[Math.min(N, i + 2)];
        const dx = b[0] - a[0], dy = b[1] - a[1], dd = Math.hypot(dx, dy) || 1, nx = -dy / dd, ny = dx / dd;
        const w0 = S.r || S.w, w1 = .16;
        const w = .5 * (w1 + (w0 - w1) * Math.pow(1 - t, .85));
        L.push([ m[0] + nx * w, m[1] + ny * w ]);
        R.push([ m[0] - nx * w, m[1] - ny * w ]);
      }));
      const shape = () => {
        ctx.beginPath();
        ctx.moveTo(L[0][0], L[0][1]);
        L.forEach((q => ctx.lineTo(q[0], q[1])));
        cap(true);
        R.slice().reverse().forEach((q => ctx.lineTo(q[0], q[1])));
        ctx.closePath();
      };
      const cap = (fromL = true) => {
        const e = line[N], f0 = line[N - 3], fa = Math.atan2(e[1] - f0[1], e[0] - f0[0]);
        const S0 = fromL ? L[N] : R[N], a0 = Math.atan2(S0[1] - e[1], S0[0] - e[0]), r = Math.hypot(S0[0] - e[0], S0[1] - e[1]);
        const cw = Math.cos(a0 + Math.PI / 2 - fa) > 0;
        ctx.arc(e[0], e[1], r, a0, a0 + (cw ? Math.PI : -Math.PI), !cw);
      };
      const near = q => {
        let bi = 0, bd = 1e9;
        line.forEach(((m, i) => {
          const d = Math.hypot(m[0] - q[0], m[1] - q[1]);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }));
        return bi;
      };
      const joined = (A, B, i0, x0, y0, c1, c2, x1, y1, closeFn, o = {}) => {
        const dA = [ A[i0 + 2][0] - A[i0 - 2][0], A[i0 + 2][1] - A[i0 - 2][1] ], dB = [ B[i0 + 2][0] - B[i0 - 2][0], B[i0 + 2][1] - B[i0 - 2][1] ];
        const nA = Math.hypot(dA[0], dA[1]) || 1, nB = Math.hypot(dB[0], dB[1]) || 1, k = o.kA || 1.6, kb = o.kB || 1.6;
        if (o.cont) ctx.lineTo(x0, y0); else {
          ctx.beginPath();
          ctx.moveTo(x0, y0);
        }
        ctx.bezierCurveTo(c1[0], c1[1], A[i0][0] - dA[0] / nA * k, A[i0][1] - dA[1] / nA * k, A[i0][0], A[i0][1]);
        for (let i = i0 + 1; i <= N; i++) ctx.lineTo(A[i][0], A[i][1]);
        cap(A === L);
        for (let i = N; i >= i0; i--) ctx.lineTo(B[i][0], B[i][1]);
        ctx.bezierCurveTo(B[i0][0] - dB[0] / nB * kb, B[i0][1] - dB[1] / nB * kb, c2[0], c2[1], x1, y1);
        if (closeFn) closeFn();
        if (!o.open) ctx.closePath();
      };
      const s0 = line[Math.floor(N * .45)], s1 = line[N];
      return {
        L: L,
        R: R,
        line: line,
        N: N,
        shape: shape,
        cap: cap,
        near: near,
        joined: joined,
        endFade(sh) {
          ctx.fillStyle = whiteFade(s0[0], s0[1], s1[0], s1[1], .22);
          (sh || shape)();
          ctx.fill();
        }
      };
    }
    const ST = P.streamers || {};
    const pivot = (x, y, a, sy, fn) => {
      if (typeof sy === "function") {
        fn = sy;
        sy = 1;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      if (sy !== 1) ctx.scale(1, sy);
      ctx.translate(-x, -y);
      fn();
      ctx.restore();
    };
    const BODY = P.body, LIGHT = P.light, PALE = P.pale;
    function softLine(pts, rgb, a, w) {
      const [p0] = pts, pn = pts[pts.length - 1];
      const g = ctx.createLinearGradient(p0[0], p0[1], pn[0], pn[1]);
      g.addColorStop(0, `rgba(${rgb},0)`);
      g.addColorStop(.3, `rgba(${rgb},${a})`);
      g.addColorStop(.7, `rgba(${rgb},${a})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      if (pts.length === 4) ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pn[0], pn[1]); else if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pn[0], pn[1]); else ctx.lineTo(pn[0], pn[1]);
      ctx.stroke();
    }
    const RB = P.rainbow;
    const rainbowFill = () => {
      if (P.finFill) {
        const m = ctx.getTransform().inverse().multiply(BM), a = m.transformPoint({
          x: RB.from[0],
          y: RB.from[1] * VS
        }), b = m.transformPoint({
          x: RB.to[0],
          y: RB.to[1] * VS
        });
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        RB.stops.forEach((st => g.addColorStop(st[0], st[1])));
        return g;
      }
      const g = ctx.createLinearGradient(RB.from[0] - rbo, RB.from[1], RB.to[0] - rbo, RB.to[1]);
      RB.stops.forEach((st => g.addColorStop(st[0], st[1])));
      return g;
    };
    const whiteFade = (x0, y0, x1, y1, a) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(255,255,255,${a})`);
      return g;
    };
    const bodyFill = () => RB ? rainbowFill() : bodyFillPlain();
    const bodyColorAt = (x, y) => {
      y /= VS;
      const hex = h => [ 1, 3, 5 ].map((i => parseInt(h.slice(i, i + 2), 16)));
      const fx = RB.to[0] - RB.from[0], fy = RB.to[1] - RB.from[1], t = Math.max(0, Math.min(1, ((x - RB.from[0]) * fx + (y - RB.from[1]) * fy) / (fx * fx + fy * fy)));
      let k = 0;
      while (k < RB.stops.length - 2 && RB.stops[k + 1][0] < t) k++;
      const [t0, c0] = RB.stops[k], [t1, c1] = RB.stops[k + 1], u = (t - t0) / (t1 - t0 || 1), A = hex(c0), B = hex(c1);
      return `rgb(${A.map(((v, i) => Math.round(v + (B[i] - v) * u))).join(",")})`;
    };
    const longBand = (sx, w) => {
      const L = P.bandsInFins, k = 1.6 / (RY + 1), Y = RY + 1, pts = [];
      pts.push([ sx - w - k * L, -Y - L ]);
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        pts.push([ u * u * (sx - w) + 2 * u * t * (sx - w + 1.6) + t * t * (sx - w), -Y * u * u + Y * t * t ]);
      }
      pts.push([ sx - w - k * L, Y + L ], [ sx + w - k * L, Y + L ]);
      for (let i = 24; i >= 0; i--) {
        const t = i / 24, u = 1 - t;
        pts.push([ u * u * (sx + w) + 2 * u * t * (sx + w + 1.6) + t * t * (sx + w), -Y * u * u + Y * t * t ]);
      }
      pts.push([ sx + w - k * L, -Y - L ]);
      ctx.beginPath();
      pts.forEach(((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath();
    };
    const longBandFill = M => {
      const T = RY + 1 + P.bandsInFins, g = ctx.createLinearGradient(0, -T, 0, T), a = (P.bandsInFins + 1) / (2 * T);
      g.addColorStop(0, `rgba(${M.color}, 0)`);
      g.addColorStop(a, `rgba(${M.color}, ${M.alpha})`);
      g.addColorStop(1 - a, `rgba(${M.color}, ${M.alpha})`);
      g.addColorStop(1, `rgba(${M.color}, 0)`);
      return g;
    };
    const drawLongBands = () => {
      const M = P.marks;
      M.xs.forEach((sx => {
        const g = longBandFill(M);
        for (let j = 5; j >= 0; j--) {
          ctx.fillStyle = g;
          longBand(sx, M.width - .1 + j * .12);
          ctx.fill();
        }
      }));
    };
    const bandsIntoFin = outline => {
      const M = P.marks;
      if (!M || M.type !== "bands" || !P.bandsInFins) return;
      ctx.save();
      outline();
      ctx.clip();
      ctx.setTransform(BM);
      drawLongBands();
      ctx.restore();
    };
    const rootFade = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, P.finFill.replace(/[\d.]+\)$/, "0)"));
      g.addColorStop(1, P.finFill);
      return g;
    };
    const finFillAt = (shape, x0, y0, x1, y1, g) => {
      if (!P.finFill) {
        ctx.fillStyle = RB ? rainbowFill() : g;
        shape();
        ctx.fill();
        return;
      }
      ctx.fillStyle = rainbowFill();
      shape();
      ctx.fill();
      ctx.fillStyle = rootFade(x0, y0, x1, y1);
      shape();
      ctx.fill();
    };
    const tipFade = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, P.tipColor);
      return g;
    };
    const bodyFillPlain = () => {
      const g = ctx.createLinearGradient(0, -6.5, 0, 6.5);
      g.addColorStop(0, BODY);
      g.addColorStop(1, LIGHT);
      return g;
    };
    const depthUnder = () => {
      const DP = P.depth;
      let dg = ctx.createLinearGradient(0, 1.2, 0, RY);
      dg.addColorStop(0, `rgba(${DP.shadow}, 0)`);
      dg.addColorStop(1, `rgba(${DP.shadow}, ${DP.shadowA})`);
      ctx.fillStyle = dg;
      ctx.fillRect(-40, -RY - 16, 56, 2 * RY + 32);
      dg = ctx.createLinearGradient(-3, 0, -12, 0);
      dg.addColorStop(0, `rgba(${DP.shadow}, 0)`);
      dg.addColorStop(1, `rgba(${DP.shadow}, ${DP.shadowA * .6})`);
      ctx.fillStyle = dg;
      ctx.fillRect(-40, -RY - 16, 56, 2 * RY + 32);
      dg = ctx.createRadialGradient(8.6, -.4, 0, 8.6, -.4, 6.2);
      dg.addColorStop(0, `rgba(${DP.head}, ${DP.headA})`);
      dg.addColorStop(.55, `rgba(${DP.head}, ${DP.headA * .55})`);
      dg.addColorStop(1, `rgba(${DP.head}, 0)`);
      ctx.fillStyle = dg;
      ctx.fillRect(-40, -RY - 16, 56, 2 * RY + 32);
      if (P.oneBody) {
        ctx.save();
        ctx.scale(12, RY);
        dg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        dg.addColorStop(0, `rgba(${DP.shadow}, 0)`);
        dg.addColorStop(.68, `rgba(${DP.shadow}, 0)`);
        dg.addColorStop(1, `rgba(${DP.shadow}, 0.2)`);
        ctx.fillStyle = dg;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
    };
    const paintBody = () => {
      ctx.fillStyle = bodyFillPlain();
      ctx.fillRect(-40, -RY - 16, 56, 2 * RY + 32);
      depthUnder();
      depthSheen();
    };
    const depthSheen = () => {
      const DP = P.depth;
      ctx.save();
      ctx.translate(-1.2, -3.4);
      ctx.scale(8.4, 3.2);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      sg.addColorStop(0, `rgba(${DP.sheen}, ${DP.sheenA})`);
      sg.addColorStop(.5, `rgba(${DP.sheen}, ${DP.sheenA * .55})`);
      sg.addColorStop(1, `rgba(${DP.sheen}, 0)`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const hexA = (h, a) => `rgba(${[ 1, 3, 5 ].map((i => parseInt(h.slice(i, i + 2), 16))).join(", ")}, ${a})`;
    const blendFin = (shape, stops) => {
      ctx.save();
      shape();
      ctx.clip();
      ctx.setTransform(BM);
      paintBody();
      ctx.restore();
      const y0 = stops[0][0], y1 = stops[stops.length - 1][0], fg = ctx.createLinearGradient(0, y0, 0, y1);
      stops.forEach((([y, c, a]) => fg.addColorStop((y - y0) / (y1 - y0), hexA(c, a))));
      ctx.fillStyle = fg;
      shape();
      ctx.fill();
    };
    const farFin = () => {
      ctx.beginPath();
      ctx.moveTo(1.6, 5.2);
      ctx.bezierCurveTo(2, 7.4, 2.6, 8.1, 3.2, 8.1);
      ctx.bezierCurveTo(3.9, 8.1, 4.2, 7, 4.5, 5.2);
      ctx.closePath();
    };
    let g = ctx.createLinearGradient(0, 6, 0, 8.2);
    g.addColorStop(0, P.farFin[0]);
    g.addColorStop(1, P.farFin[1]);
    if (!P.fans) {
      ctx.save();
      ctx.translate(0, dB);
      sweep(3, 5.2, -.95 * speed, (() => pivot(3, 5.2, -paddle * .22 + SCF.a, SCF.s, (() => grow(3, 5.4, (() => warped(farWarp, (() => {
        if (RB && ST.farFin) {
          const G = ribbonGeom(ST.farFin), i0 = G.near(ST.farFin.pts[2]);
          const xf = ((P.bellyBase || 1) - 1) * 2.9 / 2;
          const [fsx, fsy] = P.farFinScale || [ 1, 1 ], X = x => 3.05 + (x - 3.05) * fsx, Y = y => 5.2 + (y - 5.2) * fsy;
          const one = () => G.joined(G.L, G.R, i0, X(1.6 - xf), 5.2, [ X(2 - xf * .4), Y(7.4) ], [ X(4.2 + xf * .4), Y(7) ], X(4.5 + xf), 5.2);
          [ rainbowFill(), "rgba(60, 50, 110, 0.12)", whiteFade(0, 5.6, 0, 8.2, .45) ].forEach((f => {
            ctx.fillStyle = f;
            one();
            ctx.fill();
          }));
          G.endFade(one);
        } else {
          if (P.depth) blendFin(farFin, [ [ 6.2, P.farFin[0], 0 ], [ 7.1, P.farFin[0], 1 ], [ 8.2, P.farFin[1], 1 ] ]); else finFillAt(farFin, 0, 5.8, 0, 8, g);
          if (RB) {
            [ "rgba(60, 50, 110, 0.12)", whiteFade(0, 5.6, 0, 8.2, .45) ].forEach((f => {
              ctx.fillStyle = f;
              farFin();
              ctx.fill();
            }));
          }
          if (P.tipColor) {
            ctx.fillStyle = tipFade(0, 7, 0, 8.2);
            farFin();
            ctx.fill();
          }
        }
        softLine([ [ 3, 6.6 ], [ 3, 7.7 ] ], P.finRay, .45, .32);
      }))))))));
      ctx.restore();
    }
    const FT = P.fanTail, fanRays = [];
    if (FT) {
      const n = FT.rays;
      for (let i = 0; i <= n; i++) fanRays.push(Math.PI + FT.open - 2 * FT.open * i / n);
    }
    const fanTail = () => {
      const cx = FT.cx, R = FT.r, a0 = fanRays[0], a1 = fanRays[fanRays.length - 1];
      ctx.beginPath();
      ctx.moveTo(-10.5, -FT.root);
      ctx.bezierCurveTo(-12, -FT.root - .4, cx + R * Math.cos(a0) + 1.6, R * Math.sin(a0) * .75, cx + R * Math.cos(a0), R * Math.sin(a0));
      for (let i = 1; i < fanRays.length; i++) {
        const am = (fanRays[i - 1] + fanRays[i]) / 2, Rb = R + FT.scallop;
        ctx.quadraticCurveTo(cx + Rb * Math.cos(am), Rb * Math.sin(am), cx + R * Math.cos(fanRays[i]), R * Math.sin(fanRays[i]));
      }
      ctx.bezierCurveTo(cx + R * Math.cos(a1) + 1.6, R * Math.sin(a1) * .75, -12, FT.root + .4, -10.5, FT.root);
      ctx.closePath();
    };
    const tail = () => {
      if (FT) return fanTail();
      ctx.beginPath();
      ctx.moveTo(-10.5, -3.6);
      ctx.bezierCurveTo(-12.6, -8.2, -17.5, -12.4, -25, -13);
      ctx.bezierCurveTo(-20, -6, -21, 5, -26, 11);
      ctx.bezierCurveTo(-19.5, 10.2, -14, 7.4, -10.5, 3.6);
      ctx.closePath();
    };
    ctx.save();
    if (P.tailShift) ctx.translate(P.tailShift, 0);
    ctx.translate(-10.5, 0);
    ctx.rotate(wag);
    ctx.transform(1, -.36 * bend, 0, 1 - .3 * Math.max(0, speed), 0, 0);
    ctx.scale(fk, 1);
    if (P.tailScale) ctx.scale(P.tailScale, P.tailScale);
    ctx.translate(10.5, 0);
    warped(tailWarpT, (() => {
      if (P.ribbons) {
        ribbon([ [ -23.4, -12.55 ], [ -28.8, -12.7 ], [ -32.6, -17.4 ], [ -37.4, -16.4 ] ], 1.4, PALE, P.ribbons.tip);
        ribbon([ [ -24.4, 10.5 ], [ -28.8, 13 ], [ -31.4, 12.6 ], [ -35.2, 15.1 ] ], 1.4, PALE, P.ribbons.tip);
      }
      if (RB && ST.tailTop && ST.tailBot) {
        const T = ribbonGeom(ST.tailTop), B = ribbonGeom(ST.tailBot), it = T.near(ST.tailTop.pts[3]), ib = B.near(ST.tailBot.pts[3]);
        const Mx = -21.75, My = -.625, km = 4;
        const tailOne = () => {
          T.joined(T.L, T.R, it, -10.5, -3.6, [ -12.6, -8.2 ], [ Mx + .23, My - km ], Mx, My, null, {
            kA: 8,
            kB: 3,
            open: true
          });
          B.joined(B.L, B.R, ib, Mx, My, [ Mx - .23, My + km ], [ -14, 7.4 ], -10.5, 3.6, null, {
            kA: 3,
            kB: 8,
            cont: true
          });
        };
        [ rainbowFill(), whiteFade(-12.5, 0, -25, 0, .42) ].forEach((f => {
          ctx.fillStyle = f;
          tailOne();
          ctx.fill();
        }));
        T.endFade((() => T.shape()));
        B.endFade((() => B.shape()));
      } else {
        if (FT) {
          const tg = ctx.createLinearGradient(-10.8, 0, FT.cx - FT.r, 0);
          const bc = bodyColorAt(-12, 0);
          tg.addColorStop(0, bc);
          tg.addColorStop(.3, bc);
          tg.addColorStop(.55, FT.mid);
          tg.addColorStop(1, FT.edge);
          ctx.fillStyle = tg;
          tail();
          ctx.fill();
          ctx.save();
          tail();
          ctx.clip();
          const bf = rainbowFill();
          for (let k = 0; k < 24; k++) {
            const x0 = -10.4 - k * .2;
            ctx.globalAlpha = Math.pow(1 - k / 24, 1.6);
            ctx.fillStyle = bf;
            ctx.fillRect(x0 - .2, -14, .21, 28);
          }
          ctx.restore();
        } else if (P.finFill) finFillAt(tail, -11, 0, -15.5, 0); else if (P.oneBody && P.depth) {
          ctx.save();
          tail();
          ctx.clip();
          ctx.setTransform(BM);
          paintBody();
          ctx.restore();
        } else {
          ctx.fillStyle = bodyFill();
          tail();
          ctx.fill();
        }
        if (RB) {
          ctx.fillStyle = whiteFade(-12.5, 0, -25, 0, .42);
          tail();
          ctx.fill();
        } else {
          g = ctx.createLinearGradient(-12.5, 0, -24, 0);
          g.addColorStop(0, P.paleClear);
          g.addColorStop(1, PALE);
          ctx.fillStyle = g;
          tail();
          ctx.fill();
        }
        if (P.tipColor) {
          ctx.fillStyle = tipFade(-22.5, 0, -26.5, 0);
          tail();
          ctx.fill();
        }
      }
      if (FT) {
        ctx.save();
        tail();
        ctx.clip();
        fanRays.forEach((a => softLine([ [ -12.6, Math.sin(a) * 1.4 ], [ FT.cx + (FT.r + .3) * Math.cos(a), (FT.r + .3) * Math.sin(a) ] ], P.tailRay, .55, .17)));
        ctx.restore();
      }
      if (P.depth && !FT) {
        const D = P.depth;
        ctx.save();
        tail();
        ctx.clip();
        const rg = P.oneBody ? ctx.createLinearGradient(-12.9, 0, -18.5, 0) : ctx.createLinearGradient(-10.5, 0, -16.5, 0);
        if (P.oneBody) {
          rg.addColorStop(0, `rgba(${D.root}, 0)`);
          rg.addColorStop(.35, `rgba(${D.root}, ${D.rootA})`);
        } else rg.addColorStop(0, `rgba(${D.root}, ${D.rootA})`);
        rg.addColorStop(1, `rgba(${D.root}, 0)`);
        ctx.fillStyle = rg;
        tail();
        ctx.fill();
        [ [ [ -23.4, -11.6 ], [ -20, -8.9 ], [ -16.8, -6 ], [ -13.4, -3.2 ] ], [ [ -21, -6.9 ], [ -19, -5.6 ], [ -17, -3.9 ], [ -14.8, -2.3 ] ], [ [ -20.4, -.9 ], [ -18.8, -.9 ], [ -17, -.8 ], [ -15, -.7 ] ], [ [ -21.2, 4.3 ], [ -19.3, 3.5 ], [ -17.2, 2.2 ], [ -15.1, 1 ] ], [ [ -24.4, 9.6 ], [ -21, 7.8 ], [ -17.6, 5.2 ], [ -14.6, 3 ] ] ].forEach((p => softLine(p, P.tailRay, D.streak, .24)));
        ctx.restore();
      }
      if (!FT) [ [ [ -20.8, -10.1 ], [ -18.6, -7.9 ], [ -16.1, -5.4 ], [ -14.9, -3.2 ] ], [ [ -20.4, -3.6 ], [ -19, -3.6 ], [ -17.6, -2.2 ], [ -16.3, -1.7 ] ], [ [ -21.4, 1.4 ], [ -19.7, 1.5 ], [ -17.6, -.1 ], [ -15.6, -.1 ] ], [ [ -23.2, 7.4 ], [ -20.8, 6 ], [ -17.2, 3.9 ], [ -15.4, 1.9 ] ] ].forEach((p => softLine(p, P.tailRay, .5, .42)));
    }));
    ctx.restore();
    if (P.oneBody && P.depth && !FT) {
      const stalk = () => {
        ctx.beginPath();
        ctx.moveTo(-7.5, -5.07);
        ctx.bezierCurveTo(-9.15, -4.35, -11.13, -5, -12.09, -6.29);
        ctx.lineTo(-12.2, -3);
        ctx.lineTo(-12.2, 3);
        ctx.lineTo(-12.83, 5.75);
        ctx.bezierCurveTo(-11.57, 4.76, -9.15, 4.35, -7.5, 5.07);
        ctx.lineTo(-4, 4);
        ctx.lineTo(-4, -4);
        ctx.closePath();
      };
      ctx.save();
      stalk();
      ctx.clip();
      ctx.setTransform(BM);
      paintBody();
      ctx.restore();
    }
    const topFin = () => {
      ctx.beginPath();
      ctx.moveTo(TS[0], TS[1]);
      ctx.bezierCurveTo(-4.5, -6.2, -3.4, -9.6, -1.4, -9.6);
      ctx.bezierCurveTo(.6, -9.6, 1.5, -7, 4.4, -6 + .6 * FX + (P.topTuck || 0));
      ctx.lineTo(3, -4);
      ctx.closePath();
    };
    g = ctx.createLinearGradient(0, -5, 0, -9.6);
    g.addColorStop(0, P.topFin[0]);
    g.addColorStop(1, P.topFin[1]);
    if (!P.fans) {
      ctx.save();
      ctx.translate(FX, dT);
      rbo = FX;
      sweep(-1.5, -5.6, .85 * speed, (() => grow(-1.4, -5.4, (() => warped(topWarp, (() => {
        if (!(RB && ST.topFin)) {
          if (P.depth) blendFin(topFin, [ [ -5.9, P.topFin[0], 0 ], [ -7.5, P.topFin[0], 1 ], [ -9.6, P.topFin[1], 1 ] ]); else finFillAt(topFin, 0, -5.6, 0, -8.6, g);
          if (RB) {
            ctx.fillStyle = whiteFade(0, -5.4, 0, -9.8, .45);
            topFin();
            ctx.fill();
          }
          if (P.tipColor) {
            ctx.fillStyle = tipFade(0, -7.6, 0, -9.7);
            topFin();
            ctx.fill();
          }
          if (P.depth) {
            ctx.save();
            topFin();
            ctx.clip();
            [ [ [ -4.2, -5.4 ], [ -3.9, -7 ], [ -3, -8.6 ] ], [ [ -1.4, -5.6 ], [ -1.3, -7.6 ], [ -1.1, -9.3 ] ], [ [ 1.4, -5.4 ], [ 1.5, -6.6 ], [ 1.8, -7.8 ] ] ].forEach((p => softLine(p, P.finRay, P.depth.streak * 1.4, .24)));
            ctx.restore();
          }
        } else {
          const G = ribbonGeom(ST.topFin), i0 = G.near(ST.topFin.pts[2]);
          const one = () => G.joined(G.R, G.L, i0, TS[0], TS[1], [ -4.5, -6.2 ], [ 1.5, -7 ], 4.4, -6 + .6 * FX + (P.topTuck || 0), (() => ctx.lineTo(3, -4)));
          [ rainbowFill(), whiteFade(0, -5.4, 0, -9.8, .45) ].forEach((f => {
            ctx.fillStyle = f;
            one();
            ctx.fill();
          }));
          bandsIntoFin(one);
          G.endFade(one);
        }
      }))))));
      ctx.restore();
      rbo = 0;
    }
    const nearFin = () => {
      ctx.beginPath();
      ctx.moveTo(-5.2, 4.2);
      ctx.bezierCurveTo(-4.4, 5.6, -3.4, 9.3, -1.3, 9.3);
      ctx.bezierCurveTo(.6, 9.3, 1, 6, 2, 4.2);
      ctx.closePath();
    };
    g = ctx.createLinearGradient(0, 4.2, 0, 9.3);
    g.addColorStop(0, P.nearFin[0]);
    g.addColorStop(.47, P.nearFin[0]);
    g.addColorStop(.67, P.nearFin[1]);
    g.addColorStop(1, P.nearFin[2]);
    if (!P.fans) {
      ctx.save();
      ctx.translate(FX, dB);
      rbo = FX;
      sweep(-1.6, 4.4, -.95 * speed, (() => pivot(-1.6, 4.4, paddle * .2 + SCN.a, SCN.s, (() => grow(-1.6, 4.6, (() => warped(nearWarp, (() => {
        if (RB && ST.nearFin) {
          const G = ribbonGeom(ST.nearFin), i0 = G.near(ST.nearFin.pts[2]);
          const xb = ((P.bellyBase || 1) - 1) * 7.2 / 2;
          const one = () => G.joined(G.L, G.R, i0, -5.2 - xb, 4.2, [ -4.4 - xb * .75, 5.6 ], [ 1 + xb * .75, 6 ], 2 + xb, 4.2);
          [ rainbowFill(), whiteFade(0, 6.4, 0, 9.4, .45) ].forEach((f => {
            ctx.fillStyle = f;
            one();
            ctx.fill();
          }));
          bandsIntoFin(one);
          G.endFade(one);
        } else {
          if (P.depth) blendFin(nearFin, [ [ 6.3, P.nearFin[1], 0 ], [ 7.7, P.nearFin[1], 1 ], [ 9.3, P.nearFin[2], 1 ] ]); else if (!P.nearFinFront) finFillAt(nearFin, 0, 5.6, 0, 8.8, g);
          if (RB) {
            ctx.fillStyle = whiteFade(0, 6.4, 0, 9.4, .45);
            nearFin();
            ctx.fill();
          }
          if (P.tipColor) {
            ctx.fillStyle = tipFade(0, 7.8, 0, 9.4);
            nearFin();
            ctx.fill();
          }
        }
      }))))))));
      ctx.restore();
      rbo = 0;
    }
    warped(P.bendFrom !== undefined ? tailWarp : null, (() => {
      if (P.fans) {
        P.fans.forEach((F => {
          const on = F.x, yy = F.top ? -halfLocal(on) + F.inset : halfLocal(on) - F.inset;
          ctx.save();
          ctx.translate(on, yy);
          ctx.rotate(F.angle + (F.top ? 1 : -1) * .12 * Math.sin(F.x));
          const L = F.len, W = F.spread || .5, fan = () => {
            ctx.beginPath();
            ctx.moveTo(0, -F.base);
            ctx.bezierCurveTo(-L * .45, -L * W, -L * 1.05, -L * W * .8, -L, 0);
            ctx.bezierCurveTo(-L * 1.05, L * W * .8, -L * .45, L * W, 0, F.base);
            ctx.closePath();
          };
          const fg = ctx.createLinearGradient(0, 0, -L, 0);
          fg.addColorStop(0, F.baseC || P.fanBase || "rgba(255,226,140,0.95)");
          fg.addColorStop(1, F.tipC || P.fanTip || "rgba(255,244,205,0.6)");
          warped(finRipple(L, F.x * .3), (() => {
            ctx.fillStyle = fg;
            fan();
            ctx.fill();
            ctx.save();
            fan();
            ctx.clip();
            if (F.darkEdge) {
              const dg = ctx.createLinearGradient(-L * (F.rimFrom || .84), 0, -L * 1.03, 0);
              dg.addColorStop(0, "rgba(11, 30, 63, 0)");
              dg.addColorStop(1, F.darkEdge);
              ctx.fillStyle = dg;
              ctx.fillRect(-L * 1.2, -L, L * .6, L * 2);
            }
            for (let r = -3; r <= 3; r++) {
              const a = Math.PI + r * .13;
              softLine([ [ 0, r * .18 ], [ Math.cos(a) * L * 1.1, r * .18 + Math.sin(a) * L * 1.1 ] ], P.finRay, .5, .15);
            }
            ctx.restore();
          }));
          ctx.restore();
        }));
      }
      if (P.spines) {
        const S = P.spines;
        for (let i = 0; i < S.n; i++) {
          const a = Math.PI * (.12 + .76 * i / (S.n - 1)) * (i % 2 ? 1 : 1) + (i % 2 ? Math.PI : 0);
          if (S.skipBack && Math.cos(a) < -S.skipBack) continue;
          let bx = Math.cos(a) * 12, by = Math.sin(a) * RY, nx = Math.cos(a) / 12, ny = Math.sin(a) / RY, nn = Math.hypot(nx, ny);
          if (TEAR) {
            let top = i % 2 === 0, k = Math.floor(i / 2), m = Math.ceil(S.n / 2);
            if (S.nTop) {
              top = i < S.nTop;
              k = top ? i : i - S.nTop;
              m = top ? S.nTop : S.n - S.nTop;
            }
            bx = TEAR.back + 2 + (11 - TEAR.back - 2) * (k + (top ? .25 : .75)) / m;
            const hh = halfH(bx), dh = (halfH(bx + .05) - halfH(bx - .05)) / .1;
            by = top ? -hh : hh;
            nx = top ? -dh : -dh;
            ny = top ? -1 : 1;
            if (!top) nx = -dh;
            nn = 1;
            const L = Math.hypot(nx, ny);
            nx /= L;
            ny /= L;
            if (top) {
              nx = -dh / Math.hypot(dh, 1);
              ny = -1 / Math.hypot(dh, 1);
            } else {
              nx = -dh / Math.hypot(dh, 1);
              ny = 1 / Math.hypot(dh, 1);
            }
          }
          const ox = nx / nn, oy = ny / nn;
          let ux = ox, uy = oy;
          if (S.lean) {
            ux -= S.lean * (1 - .85 * PUFF);
            const m = Math.hypot(ux, uy);
            ux /= m;
            uy /= m;
          }
          if (PUFF) {
            const rr = Math.hypot(bx, by) || 1;
            ux += (bx / rr - ux) * PUFF;
            uy += (by / rr - uy) * PUFF;
            const m = Math.hypot(ux, uy);
            ux /= m;
            uy /= m;
          }
          const tx = -uy, ty = ux, SW = S.w || .55, SL = (S.len || 1.25) * (1 + .35 * PUFF);
          if (S.root) {
            const d = S.root, cx = bx - ox * d, cy = by - oy * d, edge = bodyColorAt(bx, by);
            const sg = ctx.createLinearGradient(bx, by, bx + ux * SL, by + uy * SL);
            sg.addColorStop(0, edge);
            sg.addColorStop(.45, S.color);
            sg.addColorStop(1, S.tip || S.color);
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.moveTo(cx + tx * SW * 1.6, cy + ty * SW * 1.6);
            ctx.quadraticCurveTo(bx + tx * SW * .4 + ux * SL * .3, by + ty * SW * .4 + uy * SL * .3, bx + ux * SL, by + uy * SL);
            ctx.quadraticCurveTo(bx - tx * SW * .4 + ux * SL * .3, by - ty * SW * .4 + uy * SL * .3, cx - tx * SW * 1.6, cy - ty * SW * 1.6);
            ctx.closePath();
            ctx.fill();
            continue;
          }
          const sg = ctx.createLinearGradient(bx - ux * .3, by - uy * .3, bx + ux * SL, by + uy * SL);
          sg.addColorStop(0, S.base || S.color);
          sg.addColorStop(.55, S.color);
          sg.addColorStop(1, S.tip || S.color);
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.moveTo(bx + tx * SW - ux * .3, by + ty * SW - uy * .3);
          ctx.quadraticCurveTo(bx + ux * SL * .48, by + uy * SL * .48, bx + ux * SL, by + uy * SL);
          ctx.quadraticCurveTo(bx + ux * SL * .48, by + uy * SL * .48, bx - tx * SW - ux * .3, by - ty * SW - uy * .3);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = bodyFill();
      bodyPath();
      ctx.fill();
      ctx.save();
      bodyPath();
      ctx.clip();
      ctx.save();
      if (VS !== 1) ctx.scale(1, VS);
      const DP = P.depth;
      if (DP) depthUnder();
      if (P.bellySoft) {
        const B = P.bellySoft;
        ctx.save();
        ctx.translate(B.x, B.y * RY / 6.5);
        ctx.scale(B.rx, B.ry * RY / 6.5);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        gg.addColorStop(0, `rgba(${B.color}, ${B.alpha})`);
        gg.addColorStop(.45, `rgba(${B.color}, ${B.alpha * .8})`);
        gg.addColorStop(1, `rgba(${B.color}, 0)`);
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (P.belly) {
        ctx.fillStyle = P.belly;
        ctx.beginPath();
        ctx.ellipse(1, 3 * RY / 6.5, 8, 2.5 * RY / 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (DP) {
        depthSheen();
        ctx.lineWidth = .13;
        ctx.lineCap = "round";
        for (let row = 0, y = -5.2; y <= 4.2; y += 1.05, row++) for (let x = -10.4 + row % 2 * .62; x <= 3.4; x += 1.24) {
          const h = RY * Math.sqrt(Math.max(0, 1 - x * x / 144));
          if (Math.abs(y) > h - .5) continue;
          const lit = Math.exp(-Math.pow((x + 1.2) / 7.5, 2) - Math.pow((y + 3) / 3.4, 2));
          const edge = Math.min(1, (h - Math.abs(y)) / 1.6) * Math.min(1, (3.6 - x) / 1.8) * Math.min(1, (x + 11) / 2.5);
          const a = DP.scaleA * (.25 + .75 * lit) * edge;
          if (a < .02) continue;
          ctx.strokeStyle = `rgba(${DP.scale}, ${a})`;
          ctx.beginPath();
          ctx.arc(x, y, .72, Math.PI * .62, Math.PI * 1.38);
          ctx.stroke();
        }
        softLine([ [ 4.1, -5.1 ], [ 2.4, -2.7 ], [ 2.2, .8 ], [ 3, 3 ] ], DP.gill, DP.gillA, .42);
        softLine([ [ 4.65, -4.8 ], [ 3.05, -2.6 ], [ 2.85, .7 ], [ 3.6, 2.8 ] ], DP.gillLight, DP.gillA * .9, .3);
      }
      if (P.marks === "koi") {
        ctx.fillStyle = "#FF7A6B";
        ctx.beginPath();
        ctx.ellipse(2, -3.5, 4.5, 3, .3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-6, 1, 3.2, 2.6, -.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFB15C";
        ctx.beginPath();
        ctx.ellipse(-2.5, 3.8, 1.9, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (P.marks && P.marks.type === "bands") {
        const M = P.marks;
        if (P.bandsInFins) {
          drawLongBands();
        } else {
          const band = (sx, w) => {
            ctx.beginPath();
            ctx.moveTo(sx - w, -RY - 1);
            ctx.quadraticCurveTo(sx - w + 1.6, 0, sx - w, RY + 1);
            ctx.lineTo(sx + w, RY + 1);
            ctx.quadraticCurveTo(sx + w + 1.6, 0, sx + w, -RY - 1);
            ctx.closePath();
          };
          M.xs.forEach((sx => {
            for (let k = 5; k >= 0; k--) {
              ctx.fillStyle = `rgba(${M.color}, ${M.alpha})`;
              band(sx, M.width - .1 + k * .12);
              ctx.fill();
            }
            if (M.edge) [ -1, 1 ].forEach((side => {
              const ex = sx + side * (M.width + .62);
              for (let k = 0; k < 4; k++) {
                ctx.strokeStyle = `rgba(${M.edge}, ${M.edgeAlpha || .12})`;
                ctx.lineWidth = .18 + k * .14;
                ctx.beginPath();
                ctx.moveTo(ex, -RY - 1);
                ctx.quadraticCurveTo(ex + 1.6, 0, ex, RY + 1);
                ctx.stroke();
              }
            }));
          }));
        }
      }
      if (P.sideSpines) {
        ctx.save();
        if (VS !== 1) ctx.scale(1, 1 / VS);
        const SS = P.sideSpines, E2 = P.eye || {}, ex = E2.x === undefined ? 6.6 : E2.x, ey = E2.y === undefined ? -1.6 : E2.y;
        SS.rows.forEach((([down, len0, step, x0, x1]) => {
          for (let x = x0, j = 0; x <= x1; x += step, j++) {
            const h = halfLocal(x), by = -h * (1 - down), bx = x + (j % 2 ? step * .35 : 0);
            if (Math.hypot(bx - ex, by - ey) < SS.clearEye) continue;
            let ux = -.9, uy = -.42 * (1 - down) - .05;
            {
              const m = Math.hypot(ux, uy);
              ux /= m;
              uy /= m;
            }
            let len = len0;
            if (PUFF) {
              const rr = Math.hypot(bx, by) || 1, R = Math.max(halfH(0), 1);
              ux += (bx / rr - ux) * PUFF;
              uy += (by / rr - uy) * PUFF;
              const m = Math.hypot(ux, uy);
              ux /= m;
              uy /= m;
              len = len0 * (1 - PUFF) + PUFF * len0 * 1.15 * Math.min(1, rr / R);
            }
            const tx = -uy, ty = ux, w = SS.w;
            const spine = () => {
              ctx.beginPath();
              ctx.moveTo(bx + tx * w, by + ty * w);
              ctx.quadraticCurveTo(bx + ux * len * .5, by + uy * len * .5, bx + ux * len, by + uy * len);
              ctx.quadraticCurveTo(bx + ux * len * .5, by + uy * len * .5, bx - tx * w, by - ty * w);
              ctx.closePath();
            };
            ctx.save();
            ctx.translate(.06, .14);
            ctx.fillStyle = SS.shadow;
            spine();
            ctx.fill();
            ctx.restore();
            const g = ctx.createLinearGradient(bx, by, bx + ux * len, by + uy * len);
            g.addColorStop(0, SS.base);
            g.addColorStop(.5, SS.color);
            g.addColorStop(1, SS.tip);
            ctx.fillStyle = g;
            spine();
            ctx.fill();
          }
        }));
        if (PUFF > .02) {
          const R = halfH(0), n = SS.puffN || 70, golden = Math.PI * (3 - Math.sqrt(5));
          ctx.save();
          ctx.globalAlpha = Math.min(1, PUFF * 1.4);
          for (let i = 1; i < n; i++) {
            const rr = .93 * Math.sqrt(i / n), a = i * golden, bx = rr * 11.2 * Math.cos(a), by = rr * R * .93 * Math.sin(a);
            if (Math.hypot(bx - ex, by - ey) < SS.clearEye || bx > 7.4 && by > .5 || Math.abs(by) > halfH(bx) - .6) continue;
            const ux = Math.cos(a), uy = Math.sin(a) * R / 12, m = Math.hypot(ux, uy), vx = ux / m, vy = uy / m, len = SS.puffLen * rr * PUFF, w = SS.w * (.6 + .4 * rr);
            if (len < .15) continue;
            const tx = -vy, ty = vx;
            const sp = () => {
              ctx.beginPath();
              ctx.moveTo(bx + tx * w, by + ty * w);
              ctx.quadraticCurveTo(bx + vx * len * .5, by + vy * len * .5, bx + vx * len, by + vy * len);
              ctx.quadraticCurveTo(bx + vx * len * .5, by + vy * len * .5, bx - tx * w, by - ty * w);
              ctx.closePath();
            };
            ctx.save();
            ctx.translate(.05, .12);
            ctx.fillStyle = SS.shadow;
            sp();
            ctx.fill();
            ctx.restore();
            const g = ctx.createLinearGradient(bx, by, bx + vx * len, by + vy * len);
            g.addColorStop(0, SS.base);
            g.addColorStop(.5, SS.color);
            g.addColorStop(1, SS.tip);
            ctx.fillStyle = g;
            sp();
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.restore();
      }
      if (P.polka) {
        P.polka.pts.forEach((([x, y, r]) => {
          const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
          gg.addColorStop(0, P.polka.color);
          gg.addColorStop(.55, P.polka.color);
          gg.addColorStop(1, P.polka.color.replace(/[\d.]+\)$/, "0)"));
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }));
      }
      if (P.marks && P.marks.type === "dots") {
        const M = P.marks;
        M.pts.forEach((([x, y, r]) => {
          const gg = ctx.createRadialGradient(x, y * RY / 6.5 * .75, 0, x, y * RY / 6.5 * .75, r);
          gg.addColorStop(0, M.color);
          gg.addColorStop(1, M.color.replace(/[\d.]+\)$/, "0)"));
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(x, y * RY / 6.5 * .75, r, 0, Math.PI * 2);
          ctx.fill();
        }));
      }
      ctx.restore();
      if (P.marks === "stripe") {
        ctx.lineCap = "butt";
        [ -7.1, -3.1, .9 ].forEach((sx => {
          for (let i = 0; i < 16; i++) {
            ctx.strokeStyle = "rgba(190, 160, 240, 0.09)";
            ctx.lineWidth = .5 + i * .14;
            ctx.beginPath();
            ctx.moveTo(sx, -7);
            ctx.quadraticCurveTo(sx + 2, 0, sx, 7);
            ctx.stroke();
          }
        }));
      }
      ctx.restore();
    }));
    if (P.nearFinFront && !P.fans) {
      ctx.save();
      ctx.translate(FX, dB);
      rbo = FX;
      sweep(-1.6, 4.4, -.95 * speed, (() => pivot(-1.6, 4.4, paddle * .2 + SCN.a, SCN.s, (() => grow(-1.6, 4.6, (() => warped(nearWarp, (() => {
        const LT = ctx.getTransform();
        ctx.save();
        ctx.setTransform(BM);
        ctx.beginPath();
        ctx.rect(-60, -60, 120, 120);
        bodyPath(0, true);
        ctx.clip("evenodd");
        ctx.setTransform(LT);
        finFillAt(nearFin, 0, 5.6, 0, 8.8);
        ctx.save();
        nearFin();
        ctx.clip();
        [ [ [ -3.3, 5.9 ], [ -2.8, 7 ], [ -2.3, 8.5 ] ], [ [ -1.5, 6.2 ], [ -1.3, 8.7 ] ], [ [ .2, 5.9 ], [ -.3, 7 ], [ -.4, 8.4 ] ] ].forEach((q => softLine(q, P.finRay, .5, .32)));
        ctx.restore();
        ctx.restore();
      }))))))));
      ctx.restore();
      rbo = 0;
    }
    if (!P.nearFinFront && !P.fans) {
      ctx.save();
      ctx.translate(FX, dB);
      [ [ [ -3.3, 5.9 ], [ -2.8, 7 ], [ -2.3, 8.5 ] ], [ [ -1.5, 6.2 ], [ -1.3, 8.7 ] ], [ [ .2, 5.9 ], [ -.3, 7 ], [ -.4, 8.4 ] ] ].forEach((p => sweep(-1.6, 4.4, -.95 * speed, (() => pivot(-1.6, 4.4, paddle * .2 + SCN.a, SCN.s, (() => grow(-1.6, 4.6, (() => warped(FR ? nearWarp : null, (() => softLine(p, P.finRay, .5, .32)))))))))));
      ctx.restore();
    }
    if (P.pecFin) {
      const F = P.pecFin;
      ctx.save();
      ctx.translate(F.x, F.y * (TEAR ? 1 : RY / 6.5));
      ctx.rotate(-.25);
      const fan = () => {
        ctx.beginPath();
        ctx.moveTo(0, -.9);
        ctx.bezierCurveTo(-F.len * .5, -F.len * .9, -F.len * 1.15, -F.len * .45, -F.len, F.len * .15);
        ctx.bezierCurveTo(-F.len * .85, F.len * .75, -F.len * .35, F.len * .7, 0, .9);
        ctx.closePath();
      };
      const fg = ctx.createLinearGradient(0, 0, -F.len, 0);
      fg.addColorStop(0, F.base);
      fg.addColorStop(1, F.tip);
      warped(finRipple(F.len, .6), (() => {
        ctx.fillStyle = fg;
        fan();
        ctx.fill();
        ctx.save();
        fan();
        ctx.clip();
        for (let r = -3; r <= 3; r++) {
          const a = Math.PI + r * .22;
          softLine([ [ 0, r * .2 ], [ Math.cos(a) * F.len * 1.1, r * .2 + Math.sin(a) * F.len * 1.1 ] ], F.ray, .55, .16);
        }
        ctx.restore();
      }));
      ctx.restore();
    }
    const E = P.eye || {}, EX = E.x === undefined ? 6.6 : E.x, EY = E.y === undefined ? -1.6 : E.y, ES = E.s || 1;
    ctx.save();
    ctx.translate(EX, EY);
    ctx.scale(1 / sa, 1 / sc);
    ctx.translate(-EX, -EY);
    if (E.ring) {
      const rg = ctx.createRadialGradient(EX, EY, 2.2 * ES, EX, EY, 3.5 * ES);
      rg.addColorStop(0, E.ring);
      rg.addColorStop(1, E.ring.replace(/[\d.]+\)$/, "0)"));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(EX, EY, 3.5 * ES, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(EX, EY, 2.4 * ES, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = P.eyeRim || "rgba(59, 45, 85, 0.3)";
    ctx.lineWidth = .4;
    ctx.stroke();
    ctx.fillStyle = P.pupil || "#2E2440";
    ctx.beginPath();
    ctx.arc(EX + .5 * ES, EY + .1 * ES, 1.45 * ES, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(EX + 1 * ES, EY - .5 * ES, .5 * ES, 0, Math.PI * 2);
    ctx.fill();
    if (E.glint2) {
      ctx.beginPath();
      ctx.arc(EX + .05 * ES, EY + .75 * ES, .22 * ES, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const CK = P.cheek || [ 5.5, 2, 1.8, 1.1 ];
    ctx.fillStyle = P.cheekColor || "rgba(255, 130, 170, 0.5)";
    ctx.beginPath();
    ctx.ellipse(CK[0], CK[1], CK[2], CK[3], 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2E2440";
    ctx.lineWidth = .42;
    ctx.lineCap = "round";
    const lineA = Math.max(0, 1 - mouth / .25);
    if (lineA > 0 && P.smile) {
      const M = P.smile;
      ctx.globalAlpha = lineA;
      ctx.strokeStyle = M.lip;
      ctx.lineWidth = M.lipW;
      ctx.beginPath();
      ctx.moveTo(M.a[0], M.a[1]);
      ctx.quadraticCurveTo(M.c[0], M.c[1], M.b[0], M.b[1]);
      ctx.stroke();
      ctx.strokeStyle = M.line;
      ctx.lineWidth = M.lineW;
      ctx.beginPath();
      ctx.moveTo(M.a[0], M.a[1]);
      ctx.quadraticCurveTo(M.c[0], M.c[1] - .15, M.b[0], M.b[1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (lineA > 0) {
      ctx.globalAlpha = lineA;
      ctx.beginPath();
      ctx.moveTo(9.2, 2.8);
      ctx.quadraticCurveTo(9.526, 3.289, 9.911, 3.394);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (mouth > 0) {
      ctx.save();
      bodyPath(.25);
      ctx.clip();
      ctx.globalAlpha = Math.min(1, mouth / .25);
      ctx.translate(9.45 - .25 * mouth, 3.12 - .12 * mouth);
      ctx.rotate(.69);
      const rx = .42 + .28 * mouth, ry = .21 + .57 * mouth;
      ctx.fillStyle = "#2E2440";
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      if (mouth > .4) {
        ctx.fillStyle = `rgba(255, 130, 170, ${.6 * (mouth - .4) / .6})`;
        ctx.beginPath();
        ctx.ellipse(0, ry * .35, rx * .6, ry * .42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    const SPK = opt.sparkle !== undefined ? opt.sparkle : P.sparkle;
    if (SPK) {
      const tw = opt.twinkle || 0, TAU = Math.PI * 2;
      const pulse = ph => Math.max(0, Math.sin(TAU * (tw + ph)));
      function star(x, y, r, a) {
        if (a <= .01 || r <= .01) return;
        if (RIP && curW) [x, y] = curW(x, y);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1 / sa, 1 / sc);
        let g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.7);
        g.addColorStop(0, `rgba(255,255,255,${.55 * a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.7, 0, TAU);
        ctx.fill();
        const pts = R => {
          ctx.beginPath();
          ctx.moveTo(0, -R);
          ctx.quadraticCurveTo(0, 0, R, 0);
          ctx.quadraticCurveTo(0, 0, 0, R);
          ctx.quadraticCurveTo(0, 0, -R, 0);
          ctx.quadraticCurveTo(0, 0, 0, -R);
          ctx.closePath();
        };
        ctx.fillStyle = `rgba(255,255,255,${.95 * a})`;
        pts(r);
        ctx.fill();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `rgba(255,255,255,${.6 * a})`;
        pts(r * .45);
        ctx.fill();
        ctx.restore();
      }
      let curW = null;
      const riding = (W, fn) => () => {
        curW = WHOLE ? null : W;
        fn();
        curW = null;
      };
      const onTail = fn => {
        ctx.save();
        if (P.tailShift) ctx.translate(P.tailShift, 0);
        ctx.translate(-10.5, 0);
        ctx.rotate(wag);
        ctx.transform(1, -.36 * bend, 0, 1 - .3 * Math.max(0, speed), 0, 0);
        ctx.scale(fk, 1);
        if (P.tailScale) ctx.scale(P.tailScale, P.tailScale);
        ctx.translate(10.5, 0);
        riding(tailWarpT, fn)();
        ctx.restore();
      };
      const onTop = fn => {
        ctx.save();
        ctx.translate(FX, dT);
        sweep(-1.5, -5.6, .85 * speed, (() => grow(-1.4, -5.4, riding(topWarp, fn))));
        ctx.restore();
      };
      const onNear = fn => {
        ctx.save();
        ctx.translate(FX, dB);
        sweep(-1.6, 4.4, -.95 * speed, (() => pivot(-1.6, 4.4, paddle * .2 + SCN.a, SCN.s, (() => grow(-1.6, 4.6, riding(nearWarp, fn))))));
        ctx.restore();
      };
      const tick = ph => .35 + .65 * pulse(ph);
      if (SPK === "glints") {
        const T = opt.time !== undefined ? opt.time : tw * 4, seed = opt.seed || 0;
        const rnd = (a, b, c) => {
          let h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed * 19.19) * 43758.5453;
          return h - Math.floor(h);
        };
        const SPOTS = [ [ "body", -3.2, -4.6 ], [ "body", 2.5, -5 ], [ "body", -6.5, -2 ], [ "body", .5, -2.6 ], [ "body", 3, 4.9 ], [ "body", -4.5, 3 ], [ "body", -8, 1.5 ], [ "body", 4.6, -3.9 ], [ "tail", -21.5, -6.5 ], [ "tail", -20.2, 4.6 ], [ "tail", -17, -4 ], [ "tail", -18.5, 1 ], [ "tail", -23.5, -10 ], [ "tail", -24, 7.5 ], [ "top", -7.9, -10.6 ], [ "top", -4, -11.4 ], [ "top", -11, -13.6 ], [ "near", -6.3, 14.4 ], [ "near", -2.6, 12.5 ], [ "near", -10, 16 ], [ "near", -13.5, 18.8 ] ];
        for (let m = 0; m < 4; m++) {
          const per = 2.4 + 1.4 * rnd(m, 0, 1);
          for (let back = 0; back < 2; back++) {
            const k = Math.floor((T + m * .37) / per) - back;
            if (rnd(m, k, 2) < .35) continue;
            const life = 1.1 + .6 * rnd(m, k, 3), start = k * per - m * .37 + (per - .4) * rnd(m, k, 4), u = (T - start) / life;
            if (u < 0 || u > 1) continue;
            const env = u < .28 ? Math.sin(u / .28 * Math.PI / 2) : Math.pow(1 - (u - .28) / .72, 1.6);
            const [part, sx, sy] = SPOTS[Math.floor(rnd(m, k, 5) * SPOTS.length)];
            const x = sx + (rnd(m, k, 6) - .5) * 1.2, y = sy + (rnd(m, k, 7) - .5) * 1;
            const big = (part === "body" ? 1.25 : 1) * (.8 + .45 * rnd(m, k, 8)), r = big * (.35 + .65 * env);
            const one = () => star(x, part === "body" ? y * RY / 6.5 : y, r, env);
            if (part === "tail") onTail(one); else if (part === "top") onTop(one); else if (part === "near") onNear(one); else one();
          }
        }
      } else if (SPK === "shimmer") {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, RY, 0, 0, TAU);
        ctx.moveTo(6.6 + 2.7 / sa, -1.6);
        ctx.ellipse(6.6, -1.6, 2.7 / sa, 2.7 / sc, 0, 0, TAU);
        ctx.clip("evenodd");
        const sx = -16 + 32 * ((tw + .62) % 1);
        const g = ctx.createLinearGradient(sx - 4, -RY, sx + 4, RY);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(.5, "rgba(255,255,255,0.38)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-12, -RY, 24, RY * 2);
        ctx.restore();
        [ [ -7.5, -2.5, 0 ], [ -4.5, 1.5, .37 ], [ -1.5, -4.2, .71 ], [ 1.8, .4, .18 ], [ 3.6, -4.6, .52 ], [ -9.2, 1.8, .86 ], [ .2, 4.6, .27 ], [ -5.8, -5, .63 ] ].forEach((([x, y, ph]) => {
          ctx.fillStyle = `rgba(255,255,255,${.25 + .6 * pulse(ph)})`;
          ctx.beginPath();
          ctx.arc(x, y * RY / 6.5, .22, 0, TAU);
          ctx.fill();
        }));
        onTail((() => [ [ -16, -5, .44 ], [ -19, 1, .09 ], [ -18, 5.5, .77 ], [ -22.5, -8, .33 ] ].forEach((([x, y, ph]) => {
          ctx.fillStyle = `rgba(255,255,255,${.25 + .6 * pulse(ph)})`;
          ctx.beginPath();
          ctx.arc(x, y, .24, 0, TAU);
          ctx.fill();
        }))));
        star(2.4, -5 * RY / 6.5, .9 * tick(.1), tick(.1));
      } else if (SPK === "trail") {
        for (let i = 0; i < 6; i++) {
          const f = (tw + i / 6) % 1;
          const x = -30 - 14 * f, y = 1.5 * Math.sin(TAU * (f * 1.3 + i * .37)) + (i % 2 ? 3 : -3);
          star(x, y, (1.1 - .7 * f) * (.7 + .3 * pulse(i * .21)), 1 - f);
        }
      }
    }
  }
  return Object.freeze({
    draw: draw,
    size: name => {
      const P = PALETTES[name] || {};
      return P.size || 1;
    },
    names: Object.keys(PALETTES),
    palettes: PALETTES
  });
})();

function drawGoldfish(ctx, opt) {
  LilyFish2D.draw(ctx, "goldfish", opt);
}