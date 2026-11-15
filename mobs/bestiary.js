/*
 * Bestiary — оригинальные мобы и боссы для 2D-игры на canvas.
 * Зависит от effects.js (подключать после него). Без картинок: всё рисуется кодом.
 *
 *   const fx = new AttackFX();
 *   const m = new Monster('slime', { x: 700, y: 430, face: -1, fx });
 *   m.attack(hero, { onHit: () => hero.hp -= 10 });     // моб
 *   boss.cast('roots', hero, { onHit: () => ... });     // способность босса
 *   m.hurt(); m.die(() => removeFromGame(m));
 *   // каждый кадр:
 *   m.update(dt); m.draw(ctx); fx.update(dt); fx.render(ctx);
 *
 * x, y — точка под ногами существа; face: 1 — смотрит вправо, -1 — влево.
 * target — любая точка {x, y} (центр цели); можно добавить target.gy — y земли под целью.
 * Мобы: slime, mushroom, eye, golem, spiker, wisp.
 * Боссы: treant, dragon, lich.
 */
(function (global) {
  'use strict';

  const FX = global.AttackFX;
  if (!FX || !FX.register) throw new Error('Bestiary: сначала подключите effects.js (свежую версию)');
  const U = FX.util;
  const { TAU, rnd, lerp, clamp, k01, fade, easeOut, easeInOut, easeOutBack, sign, geom, glowDot, impact, starPath } = U;
  const pick = a => a[(Math.random() * a.length) | 0];
  const easeIn = t => t * t;
  const reg = (id, label, d) => FX.register(id, label, d);

  // точки земли для эффектов, привязанных к полу
  const gnd = o => {
    const sc = o.scale || 1;
    return {
      a: { x: o.from.x, y: o.gy !== undefined ? o.gy : o.from.y },
      b: { x: o.to.x, y: o.tgy !== undefined ? o.tgy : o.to.y + 30 * sc }
    };
  };

  /* ====================================================================
   *  ЭФФЕКТЫ МОБОВ
   * ==================================================================== */

  reg('splat', 'Брызги слизи', {
    dur: 0.7, hit: 0.12,
    init() { return { d: Array.from({ length: 12 }, () => ({ a: rnd(-Math.PI * 1.05, 0.05), v: rnd(40, 110), r: rnd(3, 7) })) }; },
    draw(ctx, t, o, s) {
      const sc = o.scale || 1, b = o.to, k = k01(t, 0.05, 0.55);
      ctx.globalAlpha = fade(t, this.dur, 0.25);
      ctx.fillStyle = '#7dff8a';
      for (const d of s.d) {
        ctx.beginPath();
        ctx.arc(b.x + Math.cos(d.a) * d.v * k * sc, b.y + Math.sin(d.a) * d.v * k * sc + k * k * 60 * sc, d.r * sc * (1 - k * 0.5), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      impact(ctx, b, '#6dff7a', k01(t, 0.08, 0.4), 38 * sc);
    }
  });

  reg('spores', 'Ядовитые споры', {
    dur: 1.8, hit: 0.75,
    init() {
      return { p: Array.from({ length: 24 }, (_, i) => ({ d: i * 0.02, ph: rnd(0, TAU), r: rnd(4, 9), amp: rnd(10, 30), a: rnd(0, TAU), rr: rnd(10, 48), c: i % 2 ? '#9be86a' : '#c58bff' })) };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.4);
      for (const p of s.p) {
        const q = (t - p.d) / 0.7;
        if (q < 0) continue;
        let x, y, r = p.r * sc, al = 1;
        if (q < 1) {
          const e = easeInOut(q), w = Math.sin(q * TAU + p.ph) * p.amp * sc;
          x = g.a.x + g.dx * e + g.nx * w;
          y = g.a.y + g.dy * e + g.ny * w - Math.sin(q * Math.PI) * 15 * sc;
        } else {
          const k = q - 1;
          x = g.b.x + Math.cos(p.a + k * 2) * p.rr * sc;
          y = g.b.y + Math.sin(p.a + k * 2) * p.rr * 0.6 * sc - k * 18 * sc;
          r *= 1 + k * 1.4;
          al = Math.max(0, 1 - k * 0.55);
        }
        ctx.globalAlpha = fa * al * 0.6;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#a6ff7a', k01(t, this.hit, 0.4), 40 * sc);
    }
  });

  reg('laser', 'Лазерный взгляд', {
    dur: 1.2, hit: 0.55,
    draw(ctx, t, o) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.2);
      ctx.globalAlpha = fa;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      glowDot(ctx, g.a.x, g.a.y, (10 + 28 * k01(t, 0, 0.5)) * sc, 'rgba(255,60,90,0.95)', 1 - k01(t, 0.9, 0.3));
      if (t < 0.5) {
        ctx.save();
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(255,90,120,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(g.a.x, g.a.y); ctx.lineTo(g.b.x, g.b.y); ctx.stroke();
        ctx.restore();
      }
      if (t >= 0.5 && t < 1) {
        const w = Math.sin(((t - 0.5) / 0.5) * Math.PI);
        for (const [col, lw] of [['rgba(255,40,80,0.5)', 10 + 18 * w], ['#ff8aa0', 5 + 8 * w], ['#ffffff', 1.5 + 3 * w]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw * sc;
          ctx.beginPath(); ctx.moveTo(g.a.x, g.a.y); ctx.lineTo(g.b.x, g.b.y); ctx.stroke();
        }
        glowDot(ctx, g.b.x, g.b.y, (40 + 30 * w) * sc, 'rgba(255,120,150,0.9)', 1);
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#ff6a8a', k01(t, this.hit, 0.4), 40 * sc);
    }
  });

  reg('rockhit', 'Каменный удар', {
    dur: 1.0, hit: 0.12,
    init() {
      return {
        cr: Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * TAU + rnd(-0.3, 0.3), l: rnd(30, 70), j: rnd(-6, 6) })),
        rk: Array.from({ length: 7 }, () => ({ a: rnd(-Math.PI, 0), v: rnd(80, 170), r: rnd(4, 8) }))
      };
    },
    draw(ctx, t, o, s) {
      const b = o.to, sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      const gy = o.tgy !== undefined ? o.tgy : b.y + 28 * sc;
      ctx.globalAlpha = fa;
      const k = k01(t, 0.05, 0.35);
      ctx.strokeStyle = '#2a1c14';
      ctx.lineWidth = 2.5 * sc;
      ctx.lineCap = 'round';
      for (const c of s.cr) {
        const l = c.l * easeOut(k) * sc;
        ctx.beginPath();
        ctx.moveTo(b.x, gy);
        ctx.lineTo(b.x + Math.cos(c.a) * l * 0.5 + c.j * sc, gy + Math.sin(c.a) * l * 0.18);
        ctx.lineTo(b.x + Math.cos(c.a) * l, gy + Math.sin(c.a) * l * 0.3);
        ctx.stroke();
      }
      const kk = k01(t, 0.05, 0.7) * 0.7;
      ctx.fillStyle = '#6e635d';
      ctx.strokeStyle = '#2a1c14';
      ctx.lineWidth = 1.5;
      for (const r of s.rk) {
        const x = b.x + Math.cos(r.a) * r.v * kk * sc, y = gy + Math.sin(r.a) * r.v * kk * sc + 260 * kk * kk * sc;
        if (y > gy + 4 * sc) continue;
        ctx.beginPath();
        ctx.moveTo(x - r.r * sc, y); ctx.lineTo(x - r.r * 0.3 * sc, y - r.r * sc); ctx.lineTo(x + r.r * sc, y - r.r * 0.2 * sc); ctx.lineTo(x + r.r * 0.4 * sc, y + r.r * sc);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      const dk = k01(t, 0.05, 0.6);
      ctx.globalAlpha = fa * (1 - dk) * 0.5;
      ctx.fillStyle = '#c9b49a';
      ctx.beginPath();
      ctx.ellipse(b.x, gy, (20 + 60 * dk) * sc, (6 + 14 * dk) * sc, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      impact(ctx, { x: b.x, y: gy - 20 * sc }, '#ffd9a0', k01(t, this.hit, 0.4), 50 * sc);
    }
  });

  reg('quills', 'Иглы', {
    dur: 1.2, hit: 0.5,
    init() { return { q: Array.from({ length: 7 }, (_, i) => ({ d: i * 0.04, sp: (i - 3) * 0.09 + rnd(-0.02, 0.02), l: rnd(14, 20) })) }; },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      ctx.lineCap = 'round';
      for (const q of s.q) {
        const u = clamp((t - q.d) / 0.5);
        if (u <= 0) continue;
        const ang = g.ang + q.sp * (1 - u);
        const px = g.a.x + Math.cos(g.ang) * g.L * u + Math.cos(g.ang + Math.PI / 2) * q.sp * 60 * (1 - u) * sc;
        const py = g.a.y + Math.sin(g.ang) * g.L * u + Math.sin(g.ang + Math.PI / 2) * q.sp * 60 * (1 - u) * sc;
        const dx = Math.cos(ang) * q.l * sc, dy = Math.sin(ang) * q.l * sc;
        ctx.strokeStyle = '#1a0b26'; ctx.lineWidth = 5 * sc;
        ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px, py); ctx.stroke();
        ctx.strokeStyle = '#f4e3c0'; ctx.lineWidth = 2.5 * sc;
        ctx.beginPath(); ctx.moveTo(px - dx, py - dy); ctx.lineTo(px, py); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#ffe9b0', k01(t, this.hit, 0.35), 34 * sc);
    }
  });

  reg('fireball', 'Духовный огонь', {
    dur: 1.1, hit: 0.6,
    draw(ctx, t, o) {
      const g = geom(o), sc = o.scale || 1, q = clamp(t / 0.6);
      const at = u => ({ x: g.a.x + g.dx * easeIn(u), y: g.a.y + g.dy * easeIn(u) });
      if (q < 1) {
        for (let i = 12; i >= 0; i--) {
          const u = q - i * 0.03;
          if (u < 0) continue;
          const p = at(u);
          glowDot(ctx, p.x, p.y, (24 - i * 1.4) * sc, i < 3 ? 'rgba(220,250,255,0.95)' : 'rgba(70,170,255,0.8)', 1 - i / 14);
        }
        const p = at(q);
        glowDot(ctx, p.x, p.y, 20 * sc, 'rgba(255,255,255,1)', 1);
      } else {
        const k = k01(t, 0.6, 0.5);
        glowDot(ctx, g.b.x, g.b.y, (30 + 70 * k) * sc, 'rgba(90,200,255,0.9)', 1 - k);
        impact(ctx, g.b, '#7fdcff', k, 48 * sc);
      }
    }
  });

  /* ====================================================================
   *  ЭФФЕКТЫ БОССОВ
   * ==================================================================== */

  // --- Треант: корни ---
  reg('roots', 'Корни', {
    dur: 1.8, hit: 0.85,
    init() {
      const n = 7;
      return { r: Array.from({ length: n }, (_, i) => ({ d: i * 0.1, s: i === n - 1 ? 1.6 : rnd(0.8, 1.15), bend: rnd(-1, 1), ph: rnd(0, TAU) })) };
    },
    draw(ctx, t, o, s) {
      const G = gnd(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3), n = s.r.length;
      ctx.globalAlpha = fa;
      s.r.forEach((r, i) => {
        const u = (i + 1) / n, bx = lerp(G.a.x, G.b.x, u), by = lerp(G.a.y, G.b.y, u);
        let q = easeOutBack(k01(t, 0.12 + r.d, 0.4));
        q = Math.max(q, 0) * (1 - k01(t, 1.3, 0.4));
        if (q <= 0) return;
        const H = (80 + 55 * r.s) * sc * q, pts = [];
        for (let j = 0; j <= 10; j++) {
          const v = j / 10;
          pts.push({ x: bx + (r.bend * 34 * v * v + Math.sin(t * 5 + r.ph + v * 4) * 4 * v) * sc, y: by - H * v, w: (18 * (1 - v * 0.92) + 1) * sc });
        }
        const dk = k01(t, 0.12 + r.d, 0.5);
        if (dk > 0 && dk < 1) {
          ctx.save();
          ctx.globalAlpha = fa * (1 - dk) * 0.5;
          ctx.fillStyle = '#b99a6b';
          ctx.beginPath();
          ctx.ellipse(bx, by, (20 + 30 * dk) * sc, (6 + 8 * dk) * sc, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.beginPath();
        pts.forEach((p, j) => (j ? ctx.lineTo(p.x - p.w / 2, p.y) : ctx.moveTo(p.x - p.w / 2, p.y)));
        for (let j = pts.length - 1; j >= 0; j--) ctx.lineTo(pts[j].x + pts[j].w / 2, pts[j].y);
        ctx.closePath();
        ctx.fillStyle = '#6b4524';
        ctx.fill();
        ctx.lineWidth = 2.5 * sc;
        ctx.strokeStyle = '#2a170a';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.fillStyle = '#4e8a3a';
        for (const j of [3, 6]) {
          const p = pts[j];
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y);
          ctx.lineTo(p.x + p.w / 2 + 10 * sc, p.y - 8 * sc);
          ctx.lineTo(p.x + p.w / 2, p.y - 12 * sc);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      impact(ctx, { x: G.b.x, y: G.b.y - 20 * sc }, '#8fe05a', k01(t, this.hit, 0.4), 55 * sc);
    }
  });

  // --- Треант: буря листьев ---
  reg('leafstorm', 'Буря листьев', {
    dur: 1.9, hit: 1.0,
    init() {
      return { l: Array.from({ length: 30 }, (_, i) => ({ d: i * 0.025, ph: rnd(0, TAU), rad: rnd(14, 46), sp: rnd(5, 9), sz: rnd(5, 9), col: pick(['#4fa84a', '#7ed957', '#3f8a3a', '#b5d94a']) })) };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.35);
      for (const l of s.l) {
        const q = (t - l.d) / 0.9;
        if (q < 0) continue;
        const th = l.ph + t * l.sp;
        let cx, cy, rad, al = 1;
        if (q < 1) {
          const e = easeInOut(q);
          cx = g.a.x + g.dx * e; cy = g.a.y + g.dy * e;
          rad = l.rad * (0.4 + 0.6 * Math.sin(q * Math.PI * 0.5 + 0.3));
        } else {
          cx = g.b.x; cy = g.b.y; rad = l.rad * (1.1 + (q - 1) * 0.5); al = Math.max(0, 1 - (q - 1) * 0.5);
        }
        const x = cx + Math.cos(th) * rad * sc, y = cy + Math.sin(th) * rad * 0.6 * sc;
        ctx.save();
        ctx.globalAlpha = fa * al;
        ctx.translate(x, y);
        ctx.rotate(th + Math.PI / 2);
        ctx.fillStyle = l.col;
        ctx.strokeStyle = '#1f4a1c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, l.sz * 1.8 * sc, l.sz * sc, 0, 0, TAU);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-l.sz * 1.8 * sc, 0); ctx.lineTo(l.sz * 1.8 * sc, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#9be05a', k01(t, this.hit, 0.4), 55 * sc);
    }
  });

  // --- Треант: возрождение (лечение себя) ---
  reg('regrow', 'Возрождение', {
    dur: 2.2, hit: 0.5,
    init() { return { m: Array.from({ length: 16 }, (_, i) => ({ i, a: rnd(0, TAU), v: rnd(0.55, 0.9) })) }; },
    draw(ctx, t, o, s) {
      const c = o.to, sc = o.scale || 1, R = (o.radius || 110) * sc, fa = fade(t, this.dur, 0.4);
      ctx.globalAlpha = fa;
      glowDot(ctx, c.x, c.y, R * 1.2, 'rgba(110,255,140,0.55)', Math.sin(clamp(t / this.dur) * Math.PI));
      for (let r = 0; r < 2; r++) {
        const k = k01(t, 0.1 + r * 0.35, 0.8);
        if (k <= 0 || k >= 1) continue;
        ctx.save();
        ctx.globalAlpha = fa * (1 - k);
        ctx.strokeStyle = '#9dffb5';
        ctx.lineWidth = 4 * (1 - k) * sc;
        ctx.beginPath();
        ctx.arc(c.x, c.y, R * (0.3 + 0.9 * k), 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#b6ffc6';
      ctx.shadowColor = '#4dff8a';
      ctx.shadowBlur = 10;
      for (const m of s.m) {
        const q = (t * m.v + m.i / s.m.length) % 1;
        const ang = m.a + q * 5, rr = R * (1.1 - 0.9 * q);
        ctx.save();
        ctx.globalAlpha = fa * Math.sin(q * Math.PI);
        if (m.i % 3 === 0) U.plus(ctx, c.x + Math.cos(ang) * rr, c.y + Math.sin(ang) * rr * 0.8, 5 * sc);
        else { ctx.beginPath(); ctx.arc(c.x + Math.cos(ang) * rr, c.y + Math.sin(ang) * rr * 0.8, 3.5 * sc, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    }
  });

  // --- Дракон: огненное дыхание ---
  reg('firebreath', 'Огненное дыхание', {
    dur: 1.7, hit: 0.55,
    init() { return { p: Array.from({ length: 90 }, (_, i) => ({ b: i * 0.0085 + rnd(0, 0.02), sp: rnd(0.8, 1.15), off: rnd(-1, 1), r: rnd(10, 20) })) }; },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, life = 0.55;
      for (const p of s.p) {
        const age = t - p.b;
        if (age < 0 || age > life) continue;
        const u = age / life;
        const dist = Math.min(g.L * 1.08, g.L * 1.05 * p.sp * easeOut(u));
        const sp = p.off * dist * 0.22 * (0.3 + u);
        const x = g.a.x + Math.cos(g.ang) * dist + g.nx * sp, y = g.a.y + Math.sin(g.ang) * dist + g.ny * sp - u * 12 * sc;
        const col = u < 0.25 ? 'rgba(255,246,190,1)' : u < 0.55 ? 'rgba(255,184,48,1)' : 'rgba(255,74,26,1)';
        glowDot(ctx, x, y, p.r * sc * (0.6 + u * 1.8) * 1.6, col, (1 - u) * 0.75);
      }
      const bk = k01(t, this.hit, 0.2) * (1 - k01(t, 1.2, 0.5));
      glowDot(ctx, g.b.x, g.b.y, 70 * sc, 'rgba(255,140,40,0.9)', bk);
      impact(ctx, g.b, '#ffa63a', k01(t, this.hit, 0.4), 55 * sc);
    }
  });

  // --- Дракон: метеоритный дождь ---
  reg('meteors', 'Метеоритный дождь', {
    dur: 2.4, hit: 0.85,
    init() {
      return { m: Array.from({ length: 5 }, (_, i) => ({ dx: i === 0 ? 0 : rnd(-120, 120), dy: i === 0 ? 0 : rnd(-18, 18), d: 0.1 + i * 0.28 })) };
    },
    draw(ctx, t, o, s) {
      const G = gnd(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      for (const m of s.m) {
        const x = G.b.x + m.dx * sc, y = G.b.y + m.dy * sc, L = m.d + 0.75, tf = L - 0.55;
        ctx.globalAlpha = fa;
        if (t < L) {
          const wk = k01(t, m.d - 0.1, 0.2);
          ctx.save();
          ctx.globalAlpha = fa * wk * (0.5 + 0.3 * Math.sin(t * 14));
          ctx.fillStyle = 'rgba(255,60,30,0.35)';
          ctx.strokeStyle = '#ff5a2a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, 46 * sc, 16 * sc, 0, 0, TAU);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        }
        if (t >= tf && t < L) {
          const u = clamp((t - tf) / 0.55);
          const sx = x - 300 * sc, sy = y - 520 * sc;
          for (let j = 8; j >= 0; j--) {
            const uu = Math.max(0, u - j * 0.035);
            const px = lerp(sx, x, easeIn(uu)), py = lerp(sy, y, easeIn(uu));
            glowDot(ctx, px, py, (26 - j * 2) * sc, j < 2 ? 'rgba(255,220,120,1)' : 'rgba(255,90,30,1)', 1 - j / 10);
          }
          const px = lerp(sx, x, easeIn(u)), py = lerp(sy, y, easeIn(u));
          ctx.fillStyle = '#4a1a14';
          ctx.strokeStyle = '#ff8a3a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(px, py, 14 * sc, 0, TAU);
          ctx.fill(); ctx.stroke();
        }
        if (t >= L) {
          const k = k01(t, L, 0.55);
          glowDot(ctx, x, y - 14 * sc, (50 + 60 * k) * sc, 'rgba(255,150,50,0.95)', 1 - k);
          impact(ctx, { x, y: y - 10 * sc }, '#ffa040', k, 62 * sc);
        }
      }
      ctx.globalAlpha = 1;
    }
  });

  // --- Дракон: удар хвостом (трещина по земле) ---
  reg('tailquake', 'Удар хвоста', {
    dur: 1.5, hit: 0.7,
    init() { return { j: Array.from({ length: 24 }, () => rnd(-8, 8)), sp: Array.from({ length: 8 }, () => ({ h: rnd(30, 60), w: rnd(12, 20) })) }; },
    draw(ctx, t, o, s) {
      const G = gnd(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.35);
      const dx = G.b.x - G.a.x, dy = G.b.y - G.a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const prog = easeOut(k01(t, 0.05, 0.65));
      ctx.globalAlpha = fa;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const n = s.j.length, last = Math.max(2, Math.floor(n * prog));
      const crack = () => {
        ctx.beginPath();
        for (let i = 0; i < last; i++) {
          const u = (i / (n - 1)) * 1;
          const x = G.a.x + dx * u + nx * s.j[i] * sc, y = G.a.y + dy * u + ny * s.j[i] * sc;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      };
      ctx.strokeStyle = '#1a0f0a'; ctx.lineWidth = 8 * sc; crack();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,120,30,0.8)'; ctx.lineWidth = 3 * sc; crack();
      ctx.restore();
      s.sp.forEach((p, i) => {
        const u = (i + 1) / s.sp.length;
        const k = easeOutBack(k01(t, 0.1 + u * 0.55, 0.3)) * (1 - k01(t, 1.0, 0.35));
        if (k <= 0) return;
        const bx = G.a.x + dx * u, by = G.a.y + dy * u, h = p.h * sc * k, w = p.w * sc;
        ctx.beginPath();
        ctx.moveTo(bx - w, by); ctx.lineTo(bx - w * 0.2, by - h); ctx.lineTo(bx + w * 0.7, by);
        ctx.closePath();
        ctx.fillStyle = '#5b4a40'; ctx.fill();
        ctx.strokeStyle = '#1a0f0a'; ctx.lineWidth = 2.5 * sc; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - w * 0.2, by - h); ctx.lineTo(bx + w * 0.7, by); ctx.strokeStyle = 'rgba(255,140,50,0.8)'; ctx.lineWidth = 2; ctx.stroke();
      });
      const rk = k01(t, this.hit - 0.1, 0.5);
      if (rk > 0 && rk < 1) {
        ctx.save();
        ctx.globalAlpha = fa * (1 - rk);
        ctx.strokeStyle = '#ffb060'; ctx.lineWidth = 6 * (1 - rk) * sc;
        ctx.beginPath(); ctx.ellipse(G.b.x, G.b.y, 90 * rk * sc, 28 * rk * sc, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      impact(ctx, { x: G.b.x, y: G.b.y - 16 * sc }, '#ffa040', k01(t, this.hit, 0.4), 55 * sc);
    }
  });

  // --- Лич: теневые сферы ---
  reg('shadowbolt', 'Теневые сферы', {
    dur: 1.6, hit: 0.8,
    init() { return { o: Array.from({ length: 3 }, (_, i) => ({ d: i * 0.18, arc: (i - 1) * 70 + rnd(-15, 15) })) }; },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      glowDot(ctx, g.a.x, g.a.y, (14 + 26 * k01(t, 0, 0.3)) * sc, 'rgba(180,100,255,0.95)', 1 - k01(t, 0.55, 0.3));
      const pos = (q, arc) => {
        const e = easeInOut(clamp(q)), off = Math.sin(clamp(q) * Math.PI) * arc * sc;
        return { x: g.a.x + g.dx * e + g.nx * off, y: g.a.y + g.dy * e + g.ny * off };
      };
      for (const b of s.o) {
        const q = (t - b.d) / 0.75;
        if (q < 0) continue;
        if (q < 1) {
          for (let j = 10; j >= 1; j--) {
            const p = pos(q - j * 0.04, b.arc);
            if (q - j * 0.04 < 0) continue;
            glowDot(ctx, p.x, p.y, (20 - j * 1.3) * sc, 'rgba(150,70,230,1)', 1 - j / 11);
          }
          const p = pos(q, b.arc);
          glowDot(ctx, p.x, p.y, 28 * sc, 'rgba(170,90,255,0.9)', 1);
          ctx.save();
          ctx.fillStyle = '#14041f';
          ctx.strokeStyle = '#c28bff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11 * sc, 0, TAU);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        } else {
          const k = clamp((q - 1) * 0.75 / 0.45);
          if (k < 1) {
            impact(ctx, g.b, '#b36bff', k, 46 * sc);
            ctx.save();
            ctx.globalAlpha = fa * (1 - k) * 0.7;
            ctx.fillStyle = '#14041f';
            ctx.beginPath();
            ctx.arc(g.b.x, g.b.y, (14 + 30 * k) * sc, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
  });

  // --- Лич: призыв (точка `to` — на земле, где появятся слуги) ---
  reg('summon', 'Призыв', {
    dur: 2.4, hit: 1.1,
    init() { return { s: Array.from({ length: 6 }, (_, i) => ({ i, a: (i / 6) * TAU })) }; },
    draw(ctx, t, o, s) {
      const c = o.to, sc = o.scale || 1, R = (o.radius || 80) * sc, fa = fade(t, this.dur, 0.4);
      const k = easeOut(k01(t, 0, 0.5));
      ctx.globalAlpha = fa;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(c.x, c.y);
      ctx.scale(1, 0.38);
      ctx.strokeStyle = '#b36bff';
      ctx.shadowColor = '#b36bff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3 * sc;
      ctx.beginPath(); ctx.arc(0, 0, R * k, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.78 * k, 0, TAU); ctx.stroke();
      ctx.save();
      ctx.rotate(t * 0.9);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ((i * 2) % 5 / 5) * TAU;
        const px = Math.cos(i * TAU * 2 / 5) * R * 0.76 * k, py = Math.sin(i * TAU * 2 / 5) * R * 0.76 * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      ctx.rotate(-t * 0.4);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 0.82 * k, Math.sin(a) * R * 0.82 * k);
        ctx.lineTo(Math.cos(a) * R * 0.96 * k, Math.sin(a) * R * 0.96 * k);
        ctx.stroke();
      }
      ctx.restore();
      if (t > 0.5) {
        const pk = clamp((t - 0.5) / 0.4);
        const gr = ctx.createLinearGradient(0, c.y - 220 * sc, 0, c.y);
        gr.addColorStop(0, 'rgba(180,100,255,0)');
        gr.addColorStop(1, 'rgba(180,100,255,0.45)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fa * pk * (0.7 + 0.3 * Math.sin(t * 8));
        ctx.fillStyle = gr;
        ctx.fillRect(c.x - R * 0.3, c.y - 220 * sc, R * 0.6, 220 * sc);
        ctx.restore();
        for (const so of s.s) {
          const q = ((t - 0.5) * 0.8 + so.i / 6) % 1;
          const ang = so.a + q * 3;
          const x = c.x + Math.cos(ang) * R * 0.6 * (1 - q * 0.7), y = c.y + Math.sin(ang) * R * 0.2 - q * 150 * sc;
          glowDot(ctx, x, y, 14 * sc, 'rgba(210,170,255,1)', Math.sin(q * Math.PI));
          ctx.save();
          ctx.globalAlpha = fa * Math.sin(q * Math.PI) * 0.8;
          ctx.fillStyle = '#e9dcff';
          ctx.beginPath(); ctx.arc(x, y, 4 * sc, 0, TAU); ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      const hk = k01(t, this.hit, 0.5);
      glowDot(ctx, c.x, c.y - 30 * sc, 120 * sc, 'rgba(220,180,255,1)', (1 - hk) * (hk > 0 ? 1 : 0));
      impact(ctx, { x: c.x, y: c.y - 20 * sc }, '#c89bff', hk, 60 * sc);
    }
  });

  // --- Лич: проклятие ---
  reg('curse', 'Проклятие', {
    dur: 2.2, hit: 0.8,
    draw(ctx, t, o) {
      const b = o.to, sc = o.scale || 1, R = 60 * sc, fa = fade(t, this.dur, 0.4);
      const gy = o.tgy !== undefined ? o.tgy : b.y + 30 * sc;
      const k = easeOut(k01(t, 0, 0.5));
      ctx.globalAlpha = fa;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(b.x, gy);
      ctx.scale(1, 0.38);
      ctx.strokeStyle = '#ff3a7a';
      ctx.shadowColor = '#ff3a7a';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3 * sc;
      ctx.beginPath(); ctx.arc(0, 0, R * k, 0, TAU); ctx.stroke();
      ctx.rotate(t * 0.8);
      ctx.lineWidth = 2 * sc;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 0.3 * k, Math.sin(a) * R * 0.3 * k);
        ctx.lineTo(Math.cos(a) * R * 0.95 * k, Math.sin(a) * R * 0.95 * k);
        ctx.stroke();
      }
      ctx.restore();
      glowDot(ctx, b.x, b.y, 70 * sc, 'rgba(140,40,200,0.8)', Math.sin(clamp(t / this.dur) * Math.PI) * 0.8);
      // цепи по спирали
      const ck = k01(t, 0.2, 0.6);
      ctx.strokeStyle = '#d6d0e0';
      ctx.lineWidth = 2.2 * sc;
      const cnt = Math.floor(16 * ck);
      for (let j = 0; j < cnt; j++) {
        const u = j / 15, ang = u * TAU * 1.5 + t * 2;
        const x = b.x + Math.cos(ang) * R * 0.45 * (1 - u * 0.3), y = gy - u * R * 1.9 + Math.sin(ang) * R * 0.15;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(j % 2 ? 0.9 : -0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5 * sc, 3 * sc, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      // череп над головой
      const sk = k01(t, 0.4, 0.4);
      if (sk > 0) {
        const sy = b.y - R * 1.5 + Math.sin(t * 3) * 4 * sc;
        ctx.save();
        ctx.globalAlpha = fa * sk * 0.95;
        ctx.translate(b.x, sy);
        ctx.rotate(Math.sin(t * 2) * 0.12);
        ctx.shadowColor = '#ff3a7a';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#efe6d2';
        ctx.strokeStyle = '#1a0b26';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 13 * sc, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillRect(-7 * sc, 8 * sc, 14 * sc, 9 * sc);
        ctx.strokeRect(-7 * sc, 8 * sc, 14 * sc, 9 * sc);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1a0b26';
        ctx.beginPath(); ctx.arc(-5 * sc, -1 * sc, 3.5 * sc, 0, TAU); ctx.arc(5 * sc, -1 * sc, 3.5 * sc, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 3 * sc); ctx.lineTo(-2 * sc, 7 * sc); ctx.lineTo(2 * sc, 7 * sc); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      impact(ctx, b, '#ff4a8a', k01(t, this.hit, 0.4), 50 * sc);
    }
  });

  /* ====================================================================
   *  РИСОВАНИЕ СУЩЕСТВ
   *  Локальные координаты: (0,0) — точка под ногами, существо смотрит вправо (+x), вверх — это -y.
   * ==================================================================== */

  const outline = (ctx, w = 3) => { ctx.lineWidth = w; ctx.strokeStyle = '#1a0b26'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
  const fillO = (ctx, fill, w = 3) => { ctx.fillStyle = fill; ctx.fill(); outline(ctx, w); };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function eye(ctx, x, y, r, px = 0, py = 0, pr = r * 0.5, col = '#fff', pupil = '#1a0b26') {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#1a0b26'; ctx.stroke();
    ctx.fillStyle = pupil; ctx.beginPath(); ctx.arc(x + px, y + py, pr, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + px - pr * 0.3, y + py - pr * 0.3, pr * 0.28, 0, TAU); ctx.fill();
  }

  // запоминает мировую позицию точки (для якорей эффектов: пасть, кулак, руки…)
  function mark(ctx, c, name, x, y) {
    const m = ctx.getTransform && ctx.getTransform();
    if (!m || !c._base || !m.transformPoint) return;
    const p = m.transformPoint({ x, y });
    const q = c._base.inverse().transformPoint(p);
    c.anch[name] = { x: q.x, y: q.y };
  }

  // универсальная анимация замаха: покой -> замах -> удар -> возврат
  function swing(c, pose, rest, up, down, wrap) {
    if (c.anim !== 'cast' || c.pose !== pose) return rest;
    if (c.s <= 0) return lerp(rest, up, easeInOut(c.w));
    const k = c.s, end = wrap ? rest + TAU : rest;
    if (k < 0.22) return lerp(up, down, easeOut(k / 0.22));
    return lerp(down, end, easeInOut(clamp((k - 0.4) / 0.6)));
  }

  function limb(ctx, L, w0, w1, fill) {
    ctx.beginPath();
    ctx.moveTo(-w0 / 2, 0); ctx.lineTo(-w1 / 2, L); ctx.lineTo(w1 / 2, L); ctx.lineTo(w0 / 2, 0);
    ctx.closePath();
    fillO(ctx, fill);
  }

  const TYPES = {};

  /* ---------- МОБЫ ---------- */

  TYPES.slime = {
    label: 'Слизень', h: 60, shadow: 38, death: 'custom', deathDur: 0.9, speed: 50,
    abilities: [{ id: 'attack', label: 'Прыжок', desc: 'Прыгает на героя и обливает слизью', dur: 0.9, fxAt: 0.45, fx: 'splat', from: 'center' }],
    draw(ctx, c) {
      let sx = 1, sy = 1, ox = 0, oy = 0;
      const b = Math.sin(c.t * 3);
      if (c.anim === 'walk') {
        const h = Math.abs(Math.sin(c.t * 5));
        oy = -h * 18; sy = 1 + h * 0.12; sx = 1 / sy;
        if (h < 0.1) { sy = 0.86; sx = 1.14; }
      } else { sy = 1 + b * 0.05; sx = 1 / sy; }
      if (c.anim === 'cast') {
        sy = 1 - 0.38 * c.wind; sx = 1 + 0.3 * c.wind;
        if (c.pulse > 0) { ox = c.pulse * 55; oy = -c.pulse * 28; sx = 1 + 0.22 * c.pulse; sy = 1 - 0.12 * c.pulse; }
      }
      if (c.dk > 0) { const e = easeOut(c.dk); sy = lerp(1, 0.14, e); sx = lerp(1, 1.7, e); ox = 0; oy = 0; }
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(sx, sy);
      const g = ctx.createLinearGradient(0, -56, 0, 0);
      g.addColorStop(0, '#8bf08f'); g.addColorStop(1, '#3fb255');
      ctx.beginPath();
      ctx.moveTo(-36, 0);
      ctx.bezierCurveTo(-46, -26, -24, -56, 0, -56);
      ctx.bezierCurveTo(24, -56, 46, -26, 36, 0);
      ctx.bezierCurveTo(18, 5, -18, 5, -36, 0);
      ctx.closePath();
      fillO(ctx, g);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (const [x, y, r] of [[-16, -14, 5], [10, -10, 4], [22, -22, 3]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(-14, -42, 10, 5, -0.5, 0, TAU); ctx.fill();
      if (c.dk < 0.5) {
        eye(ctx, 6, -30, 7, 2, 1, 3.5);
        eye(ctx, 24, -29, 6, 2, 1, 3);
        ctx.beginPath(); ctx.arc(16, -17, 5, 0.1, Math.PI - 0.1); ctx.lineWidth = 2.5; ctx.strokeStyle = '#1a0b26'; ctx.stroke();
      }
      mark(ctx, c, 'center', 0, -28);
      ctx.restore();
    }
  };

  TYPES.mushroom = {
    label: 'Гриб-спорник', h: 90, shadow: 36, death: 'custom', deathDur: 1.0, speed: 35,
    abilities: [{ id: 'attack', label: 'Споры', desc: 'Выпускает облако ядовитых спор', dur: 1.2, fxAt: 0.6, fx: 'spores', from: 'cap' }],
    draw(ctx, c) {
      const sw = Math.sin(c.t * 2) * 0.05, d = c.dk;
      let lean = sw, capSq = 1;
      if (c.anim === 'cast') { lean = -0.28 * c.wind + 0.4 * c.pulse + sw * 0.2; capSq = 1 + 0.15 * c.wind - 0.2 * c.pulse; }
      const wk = c.anim === 'walk' ? Math.sin(c.t * 8) : 0;
      ctx.save();
      for (const sg of [-1, 1]) {
        const lx = sg * 9, swg = wk * sg * 8;
        ctx.beginPath();
        ctx.moveTo(lx - 5, -12); ctx.lineTo(lx - 5 + swg, -1); ctx.lineTo(lx + 7 + swg, -1); ctx.lineTo(lx + 5, -12);
        ctx.closePath();
        fillO(ctx, '#e7cfa8');
      }
      ctx.translate(0, -10);
      ctx.rotate(lean);
      ctx.scale(1, 1 - 0.6 * easeOut(d));
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-18, -20, -12, -34); ctx.lineTo(12, -34); ctx.quadraticCurveTo(18, -20, 14, 0);
      ctx.closePath();
      fillO(ctx, '#f3dfc0');
      if (d < 0.6) {
        eye(ctx, -5, -18, 5, 1.5, 0, 2.5);
        eye(ctx, 8, -18, 5, 1.5, 0, 2.5);
        ctx.beginPath(); ctx.arc(2, -8, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0b26'; ctx.stroke();
      }
      ctx.save();
      ctx.translate(d * 50, -34 - 80 * Math.sin(Math.min(d * 1.7, 1) * Math.PI));
      ctx.rotate(d * 2.5);
      ctx.scale(1, capSq);
      ctx.beginPath();
      ctx.moveTo(-46, 0); ctx.bezierCurveTo(-46, -44, 46, -44, 46, 0); ctx.quadraticCurveTo(0, 10, -46, 0);
      ctx.closePath();
      fillO(ctx, '#b8335f');
      ctx.fillStyle = '#ffe9c7';
      for (const [x, y, r] of [[-22, -20, 7], [6, -28, 9], [28, -13, 6], [-4, -12, 5]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(-24, -30, 12, 5, -0.5, 0, TAU); ctx.fill();
      mark(ctx, c, 'cap', 0, -30);
      ctx.restore();
      if (d === 0) {
        ctx.fillStyle = '#c8ff9a';
        for (let i = 0; i < 3; i++) {
          const q = (c.t * 0.4 + i / 3) % 1;
          ctx.globalAlpha = Math.sin(q * Math.PI) * 0.5;
          ctx.beginPath(); ctx.arc(Math.sin(i * 3) * 20, -40 - 50 * q, 3 + q * 5, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  };

  TYPES.eye = {
    label: 'Парящее око', h: 120, shadow: 24, death: 'custom', deathDur: 0.8, speed: 40,
    abilities: [{ id: 'attack', label: 'Лазер', desc: 'Заряжает взгляд и жжёт лучом', dur: 1.3, fxAt: 0.65, fx: 'laser', from: 'eye' }],
    draw(ctx, c) {
      const bob = Math.sin(c.t * 2.2) * 6, cy = -80 + bob, d = c.dk;
      let ox = 0, sc = 1;
      if (c.anim === 'cast') { ox = -14 * c.pulse + Math.sin(c.t * 50) * 2 * c.wind; sc = 1 + 0.08 * c.wind; }
      if (d > 0) {
        if (d >= 0.3) {
          const k = (d - 0.3) / 0.7;
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = '#ff7aa0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * TAU;
            ctx.beginPath(); ctx.moveTo(Math.cos(a) * (14 + 20 * k), cy + Math.sin(a) * (14 + 20 * k)); ctx.lineTo(Math.cos(a) * (30 + 70 * k), cy + Math.sin(a) * (30 + 70 * k)); ctx.stroke();
          }
          ctx.restore();
          return;
        }
        sc = 1 + 0.5 * easeOut(d / 0.3);
      }
      ctx.save();
      ctx.translate(ox, 0);
      ctx.strokeStyle = '#7a2f6b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        for (let j = 0; j <= 6; j++) {
          const x = -14 + i * 9 + Math.sin(c.t * 3 + i + j * 0.7) * (4 + j * 2), y = cy + 24 + j * 7;
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.translate(0, cy);
      ctx.scale(sc, sc);
      const g = ctx.createRadialGradient(-8, -8, 4, 0, 0, 32);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9cfe6');
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); fillO(ctx, g);
      ctx.strokeStyle = 'rgba(210,60,90,0.5)'; ctx.lineWidth = 1.2;
      for (const [x1, y1, x2, y2] of [[-26, -8, -14, -2], [-22, 12, -10, 6], [-4, -28, -2, -18], [14, 26, 8, 16]]) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      const ix = c.aim.x * 11, iy = c.aim.y * 11;
      if (c.wind > 0) glowDot(ctx, ix, iy, 46 * c.wind, 'rgba(255,50,90,0.9)', c.wind);
      const ig = ctx.createRadialGradient(ix, iy, 2, ix, iy, 15);
      ig.addColorStop(0, '#ff8aa8'); ig.addColorStop(1, '#a0124a');
      ctx.beginPath(); ctx.arc(ix, iy, 15, 0, TAU); ctx.fillStyle = ig; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0b26'; ctx.stroke();
      ctx.fillStyle = '#10020a'; ctx.beginPath(); ctx.ellipse(ix, iy, 7 * (1 - 0.4 * c.wind), 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix - 4, iy - 5, 2.5, 0, TAU); ctx.fill();
      mark(ctx, c, 'eye', ix, iy);
      const ph = c.t % 4, bl = ph < 0.15 ? 1 - Math.abs((ph / 0.15) * 2 - 1) : 0;
      if (bl > 0) {
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, 29, 0, TAU); ctx.clip();
        ctx.fillStyle = '#6b2a66';
        ctx.fillRect(-31, -31, 62, 31 * bl);
        ctx.fillRect(-31, 31 - 31 * bl, 62, 31 * bl);
        ctx.restore();
      }
      ctx.restore();
    }
  };

  TYPES.golem = {
    label: 'Каменный голем', h: 110, shadow: 46, death: 'custom', deathDur: 1.2, speed: 30,
    abilities: [{ id: 'attack', label: 'Удар кулаком', desc: 'Замахивается и бьёт по земле', dur: 1.3, fxAt: 0.7, fx: 'rockhit', from: 'fist' }],
    draw(ctx, c) {
      const d = easeOut(c.dk), wk = c.anim === 'walk' ? Math.sin(c.t * 4) : 0;
      const bob = c.anim === 'walk' ? Math.abs(Math.sin(c.t * 4)) * -3 : Math.sin(c.t * 1.8) * 1.2;
      let lean = 0;
      if (c.anim === 'cast') lean = -0.1 * c.wind + 0.16 * c.pulse;
      const armF = swing(c, 'attack', -0.15, 3.5, 5.8, true);
      const armB = -0.35 + Math.sin(c.t * 1.8 + 1) * 0.04 + (c.anim === 'walk' ? -wk * 0.3 : 0);
      const ST = '#8a7f78', DK = '#5e544f';
      const part = (cx, cy, vx, rv, base, fn) => {
        ctx.save();
        ctx.translate(cx + vx * d * 45, cy + d * (-10 - cy));
        ctx.rotate(base + rv * d);
        fn();
        ctx.restore();
      };
      const rect = (w, h, fill, r = 5) => { rr(ctx, -w / 2, -h / 2, w, h, r); fillO(ctx, fill); };
      ctx.save();
      ctx.translate(0, -34 + bob);
      ctx.rotate(lean * (1 - d));
      ctx.translate(0, 34);
      part(-22, -66, -0.8, -1.2, armB, () => { ctx.translate(0, 18); rect(16, 36, DK, 6); ctx.translate(0, 24); ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); fillO(ctx, DK); });
      part(-14, -17, -0.6, -0.2, wk * 0.35, () => rect(18, 34, DK));
      part(14, -17, 0.6, 0.2, -wk * 0.35, () => rect(18, 34, ST));
      part(0, -54, 0, 0.1, 0, () => {
        rect(52, 44, ST, 10);
        ctx.fillStyle = '#6a9a4a'; ctx.beginPath(); ctx.ellipse(-10, -18, 14, 5, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(30,20,15,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(14, 2); ctx.lineTo(8, 14); ctx.stroke();
      });
      part(8, -88, 0.5, 0.8, 0, () => {
        rect(26, 22, ST, 6);
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(1, -4, 6, 4); ctx.fillRect(10, -4, 6, 4);
        glowDot(ctx, 8, -2, 22, 'rgba(255,170,60,0.8)', 0.7 * (1 - d));
      });
      part(24, -66, 0.9, 1.5, armF, () => {
        ctx.translate(0, 18); rect(16, 36, ST, 6); ctx.translate(0, 24);
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); fillO(ctx, '#9a8f88');
        mark(ctx, c, 'fist', 0, 6);
      });
      ctx.restore();
    }
  };

  TYPES.spiker = {
    label: 'Колючий зверёк', h: 70, shadow: 44, death: 'tip', deathDur: 0.9, speed: 55,
    abilities: [{ id: 'attack', label: 'Залп игл', desc: 'Взъерошивается и стреляет иглами', dur: 1.1, fxAt: 0.55, fx: 'quills', from: 'back' }],
    draw(ctx, c) {
      const wk = c.anim === 'walk' ? Math.sin(c.t * 9) : 0;
      let crouch = 0, spk = 1, kick = 0;
      if (c.anim === 'cast') { crouch = 8 * c.wind; spk = 1 + 0.6 * c.wind + 0.5 * c.pulse; kick = -10 * c.pulse; }
      const bob = Math.sin(c.t * 3) * 1.2;
      ctx.save();
      ctx.translate(kick, crouch + bob);
      for (const [x, ph] of [[-22, 0], [-12, 1], [14, 1], [24, 0]]) {
        const sw = wk * (ph ? 1 : -1) * 5;
        rr(ctx, x - 4 + sw, -18 - crouch - bob, 8, 18 + crouch + bob, 3);
        fillO(ctx, '#6b4a3a');
      }
      ctx.beginPath(); ctx.ellipse(0, -30, 36, 20, 0, 0, TAU); fillO(ctx, '#8a5d46');
      for (let i = 0; i < 11; i++) {
        const u = i / 10, ang = lerp(-2.7, -0.45, u);
        const bx = Math.cos(ang) * 34, by = -30 + Math.sin(ang) * 19, L = (16 + (i % 2) * 6) * spk;
        const nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny * 4, ty = nx * 4;
        ctx.beginPath();
        ctx.moveTo(bx - tx, by - ty); ctx.lineTo(bx + nx * L, by + ny * L); ctx.lineTo(bx + tx, by + ty);
        ctx.closePath();
        fillO(ctx, '#f1e3c0', 2);
      }
      mark(ctx, c, 'back', 0, -54);
      ctx.beginPath(); ctx.ellipse(38, -30, 16, 13, 0, 0, TAU); fillO(ctx, '#9a6a50');
      ctx.beginPath(); ctx.moveTo(28, -42); ctx.lineTo(34, -56); ctx.lineTo(40, -42); ctx.closePath(); fillO(ctx, '#7a4d3a', 2);
      ctx.beginPath(); ctx.arc(52, -28, 4, 0, TAU); ctx.fillStyle = '#1a0b26'; ctx.fill();
      eye(ctx, 42, -36, 4, 1, 0, 2, '#ffd0d0', '#d01030');
      ctx.restore();
    }
  };

  TYPES.wisp = {
    label: 'Блуждающий огонёк', h: 90, shadow: 20, death: 'custom', deathDur: 0.9, speed: 60,
    abilities: [{ id: 'attack', label: 'Огненный рывок', desc: 'Сжимается и выстреливает духовным огнём', dur: 1.0, fxAt: 0.5, fx: 'fireball', from: 'core' }],
    draw(ctx, c) {
      const f = Math.sin(c.t * 9) * 3 + Math.sin(c.t * 13) * 2;
      let s = 1, dash = 0;
      if (c.anim === 'cast') { s = 1 - 0.3 * c.wind + 0.35 * c.pulse; dash = 40 * c.pulse; }
      const d = c.dk;
      if (d > 0) s *= Math.max(0, 1 - d) * (0.7 + 0.3 * Math.sin(c.t * 40));
      if (s <= 0.01) return;
      ctx.save();
      ctx.translate(dash, -52 + Math.sin(c.t * 2.5) * 6);
      ctx.scale(s, s);
      const flame = (k, col) => {
        ctx.beginPath();
        ctx.moveTo(0, -44 * k - f);
        ctx.bezierCurveTo(8 * k, -24 * k, 26 * k, -14 * k, 24 * k, 6 * k);
        ctx.bezierCurveTo(22 * k, 24 * k, -22 * k, 24 * k, -24 * k, 6 * k);
        ctx.bezierCurveTo(-26 * k, -14 * k, -8 * k, -24 * k, 0, -44 * k - f);
        ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
      };
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      flame(1.35, 'rgba(60,140,255,0.25)');
      ctx.restore();
      ctx.fillStyle = 'rgba(90,215,255,0.5)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-18, -4 + i * 8);
        ctx.quadraticCurveTo(-40 - i * 10, -10 + i * 8 + Math.sin(c.t * 8 + i) * 6, -64 - i * 12, -2 + i * 10);
        ctx.lineTo(-18, 6 + i * 8);
        ctx.closePath(); ctx.fill();
      }
      const g = ctx.createRadialGradient(0, -4, 2, 0, 0, 28);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#9be9ff'); g.addColorStop(1, '#3a8cff');
      flame(1, g);
      ctx.fillStyle = '#10305a';
      ctx.beginPath(); ctx.ellipse(-7, -2, 3.5, 5, 0, 0, TAU); ctx.ellipse(8, -2, 3.5, 5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 8, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = '#10305a'; ctx.stroke();
      mark(ctx, c, 'core', 16, -2);
      ctx.restore();
    }
  };

  /* ---------- БОССЫ ---------- */

  TYPES.treant = {
    boss: true, label: 'Древний Страж', h: 260, shadow: 80, death: 'tip', deathDur: 2.4, speed: 22,
    abilities: [
      { id: 'roots', label: 'Корни', desc: 'Бьёт по земле, из-под героя вырываются корни', dur: 1.7, fxAt: 0.85, fx: 'roots', from: 'hand', pose: 'roots' },
      { id: 'leafstorm', label: 'Буря листьев', desc: 'Закручивает вихрь листьев вокруг героя', dur: 1.8, fxAt: 0.8, fx: 'leafstorm', from: 'crown', pose: 'storm' },
      { id: 'regrow', label: 'Возрождение', desc: 'Лечит себя соками леса', dur: 2.2, fxAt: 0.7, fx: 'regrow', from: 'center', at: 'self', pose: 'regrow', opts: { radius: 120 } }
    ],
    draw(ctx, c) {
      const sway = Math.sin(c.t * 1.2) * 0.025, br = Math.sin(c.t * 2) * 2;
      let a = -0.25;
      if (c.anim === 'cast') {
        a = c.pose === 'roots' ? swing(c, 'roots', -0.25, 3.4, 5.9, true)
          : c.pose === 'storm' ? swing(c, 'storm', -0.25, 3.7, 4.5, true)
          : swing(c, 'regrow', -0.25, 4.3, 4.3, true);
      } else a += Math.sin(c.t * 1.5) * 0.05;
      let lean = sway;
      if (c.anim === 'cast' && c.pose === 'roots') lean = sway - 0.07 * c.wind + 0.1 * c.pulse;
      const shake = c.anim === 'cast' && c.pose === 'storm' ? Math.sin(c.t * 40) * 2 * (c.s > 0 ? 1 - c.s : c.w) : 0;
      const glow = c.anim === 'cast' && c.pose === 'regrow' ? (c.s > 0 ? 1 - c.s : c.w) : 0;
      const arm = (sx, sy, ang, bend, front) => {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        limb(ctx, 90, 30, 22, '#6b4524');
        ctx.translate(0, 90);
        ctx.rotate(bend);
        limb(ctx, 80, 22, 10, '#6b4524');
        for (const k of [-0.5, 0, 0.5]) {
          ctx.save(); ctx.translate(0, 80); ctx.rotate(k);
          ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, 28); ctx.lineTo(3, 0); ctx.closePath(); fillO(ctx, '#5a3a1e', 2);
          ctx.restore();
        }
        if (front) mark(ctx, c, 'hand', 0, 96);
        ctx.restore();
      };
      ctx.save();
      for (const x of [-40, -14, 14, 42]) { ctx.beginPath(); ctx.ellipse(x, -6, 18, 10, 0, 0, TAU); fillO(ctx, '#4d3018'); }
      ctx.rotate(lean);
      arm(-30, -178, a - 0.15, 0.35, false);
      const tg = ctx.createLinearGradient(-50, 0, 50, 0);
      tg.addColorStop(0, '#5b3b1f'); tg.addColorStop(0.5, '#7a5230'); tg.addColorStop(1, '#4d3018');
      ctx.beginPath();
      ctx.moveTo(-52, 0);
      ctx.bezierCurveTo(-40, -60, -44, -120, -40, -190);
      ctx.lineTo(-26, -222); ctx.lineTo(30, -222); ctx.lineTo(44, -190);
      ctx.bezierCurveTo(48, -120, 42, -60, 54, 0);
      ctx.closePath();
      fillO(ctx, tg);
      ctx.strokeStyle = 'rgba(40,22,10,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const x = -36 + i * 12;
        ctx.beginPath(); ctx.moveTo(x, -10 - (i % 2) * 10); ctx.quadraticCurveTo(x + 5, -90, x - 2, -170); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(90,160,70,0.8)';
      ctx.beginPath(); ctx.ellipse(-20, -40, 22, 7, 0, 0, TAU); ctx.ellipse(26, -96, 14, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#2a170a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-6, -190); ctx.lineTo(10, -184); ctx.moveTo(18, -184); ctx.lineTo(36, -190); ctx.stroke();
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.ellipse(2, -176, 6, 5, 0, 0, TAU); ctx.ellipse(26, -176, 6, 5, 0, 0, TAU); ctx.fill();
      glowDot(ctx, 14, -176, 40, 'rgba(255,216,74,0.9)', 0.5 + glow * 0.5);
      ctx.beginPath(); ctx.moveTo(-2, -154); ctx.quadraticCurveTo(14, -142, 30, -154); ctx.quadraticCurveTo(14, -150, -2, -154); ctx.closePath(); fillO(ctx, '#1a0b0a', 2);
      arm(36, -176, a, 0.35, true);
      const blobs = [[-40, -228, 34, '#3f8a3a'], [40, -228, 34, '#3f8a3a'], [0, -250, 42, '#4fa84a'], [-20, -216, 28, '#2f6e2f'], [24, -214, 28, '#4fa84a']];
      blobs.forEach(([x, y, r, col], i) => {
        const jx = shake * (i % 2 ? 1 : -1);
        ctx.beginPath(); ctx.arc(x + jx, y + br, r, 0, TAU); fillO(ctx, col);
        ctx.fillStyle = 'rgba(190,255,140,0.25)'; ctx.beginPath(); ctx.arc(x + jx - r * 0.3, y + br - r * 0.3, r * 0.4, 0, TAU); ctx.fill();
      });
      mark(ctx, c, 'crown', 0, -240);
      mark(ctx, c, 'center', 0, -110);
      if (glow > 0) glowDot(ctx, 0, -120, 170, 'rgba(110,255,140,0.8)', glow * 0.8);
      ctx.restore();
    }
  };

  function dragonWing(ctx, sx, sy, ang, scale) {
    const L = [150, 172, 140], A = [ang - 0.38, ang, ang + 0.4];
    const tips = A.map((a, i) => ({ x: Math.cos(a) * L[i] * scale, y: Math.sin(a) * L[i] * scale }));
    ctx.save();
    ctx.translate(sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tips[0].x, tips[0].y);
    for (let i = 1; i < 3; i++) ctx.quadraticCurveTo(((tips[i - 1].x + tips[i].x) / 2) * 0.6, ((tips[i - 1].y + tips[i].y) / 2) * 0.6, tips[i].x, tips[i].y);
    ctx.closePath();
    fillO(ctx, '#8e2230');
    ctx.strokeStyle = '#c8402a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const t of tips) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(t.x, t.y); ctx.stroke(); }
    ctx.restore();
  }

  function dragonHead(ctx, c, jaw, wind) {
    ctx.save();
    ctx.translate(-4, 8);
    ctx.rotate(jaw);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(52, 2); ctx.lineTo(48, 12); ctx.lineTo(4, 16); ctx.closePath();
    fillO(ctx, '#a8321f');
    ctx.fillStyle = '#f4e3c0';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(14 + i * 9, 3); ctx.lineTo(18 + i * 9, -5); ctx.lineTo(22 + i * 9, 3); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-24, -14); ctx.lineTo(6, -24); ctx.lineTo(54, -10); ctx.quadraticCurveTo(62, -2, 54, 6); ctx.lineTo(6, 10); ctx.lineTo(-24, 14);
    ctx.closePath();
    fillO(ctx, '#c8402a');
    ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-52, -36); ctx.lineTo(-10, -6); ctx.closePath(); fillO(ctx, '#f4e3c0', 2.5);
    ctx.fillStyle = '#1a0b26'; ctx.beginPath(); ctx.arc(48, -4, 2.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -9, 7, 5, -0.2, 0, TAU); ctx.fillStyle = '#ffd84a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0b26'; ctx.stroke();
    ctx.fillStyle = '#1a0b26'; ctx.fillRect(13, -13, 2.5, 8);
    mark(ctx, c, 'mouth', 56, 6);
    if (wind > 0) glowDot(ctx, 52, 6, 36 * wind, 'rgba(255,150,40,0.95)', wind);
    ctx.restore && 0;
  }

  TYPES.dragon = {
    boss: true, label: 'Пепельный Змей', h: 230, shadow: 95, death: 'tip', deathDur: 2.4, speed: 22,
    abilities: [
      { id: 'firebreath', label: 'Огненное дыхание', desc: 'Выдыхает конус пламени', dur: 1.6, fxAt: 0.7, fx: 'firebreath', from: 'mouth', pose: 'breath' },
      { id: 'meteors', label: 'Метеоритный дождь', desc: 'Призывает метеориты вокруг героя', dur: 2.0, fxAt: 0.8, fx: 'meteors', from: 'center', pose: 'meteor' },
      { id: 'tailquake', label: 'Удар хвоста', desc: 'Бьёт хвостом, земля трескается', dur: 1.6, fxAt: 0.75, fx: 'tailquake', from: 'tailtip', pose: 'quake' }
    ],
    draw(ctx, c) {
      let hr = -0.1, jaw = 0.1, hdx = 0, hdy = 0, wa = -2.3 + Math.sin(c.t * 1.8) * 0.14, lift = 0, rear = 0, mouthWind = 0;
      if (c.anim === 'cast') {
        hr = swing(c, 'breath', -0.1, -0.75, 0.2) + swing(c, 'meteor', -0.1, -0.6, -0.1) + 0.1;
        jaw = swing(c, 'breath', 0.1, 0.8, 0.8) + swing(c, 'meteor', 0.1, 0.6, 0.1) - 0.1;
        hdx = swing(c, 'breath', 0, -14, 26);
        wa = swing(c, 'meteor', wa, -1.55, -3.6);
        lift = swing(c, 'quake', 0, 1.0, -0.2);
        rear = swing(c, 'quake', 0, -0.16, 0.08) + swing(c, 'meteor', 0, -0.1, 0.04);
        if (c.pose === 'breath') mouthWind = c.s > 0 ? 1 - c.s : c.w;
      }
      const wk = c.anim === 'walk' ? Math.sin(c.t * 3) : 0;
      ctx.save();
      // ноги
      ctx.beginPath(); ctx.moveTo(-50, -90); ctx.lineTo(-20, -90); ctx.lineTo(-14 + wk * 6, -10); ctx.lineTo(-40 + wk * 6, -10); ctx.closePath(); fillO(ctx, '#a8321f');
      ctx.beginPath(); ctx.ellipse(-20 + wk * 6, -5, 26, 9, 0, 0, TAU); fillO(ctx, '#8e2a1a');
      ctx.beginPath(); ctx.moveTo(24, -80); ctx.lineTo(46, -80); ctx.lineTo(48 - wk * 6, -8); ctx.lineTo(30 - wk * 6, -8); ctx.closePath(); fillO(ctx, '#a8321f');
      ctx.beginPath(); ctx.ellipse(40 - wk * 6, -4, 20, 8, 0, 0, TAU); fillO(ctx, '#8e2a1a');
      ctx.translate(-20, 0); ctx.rotate(rear); ctx.translate(20, 0);
      // хвост
      let x = -62, y = -92, ang = Math.PI - 0.15 + lift * 0.9 + Math.sin(c.t * 1.4) * 0.08;
      const tp = [{ x, y }];
      for (let i = 0; i < 9; i++) {
        ang += 0.07 + Math.sin(c.t * 2 + i * 0.6) * 0.035;
        x += Math.cos(ang) * 34 * (1 - i * 0.05); y += Math.sin(ang) * 34 * (1 - i * 0.05);
        if (lift < 0.2) y = Math.min(y, -8);
        tp.push({ x, y });
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [col, extra] of [['#1a0b26', 5], ['#c8402a', 0]]) {
        for (let i = 0; i < tp.length - 1; i++) {
          ctx.strokeStyle = col; ctx.lineWidth = 26 * (1 - i / tp.length * 0.85) + extra;
          ctx.beginPath(); ctx.moveTo(tp[i].x, tp[i].y); ctx.lineTo(tp[i + 1].x, tp[i + 1].y); ctx.stroke();
        }
      }
      const te = tp[tp.length - 1], tb = tp[tp.length - 2], ta = Math.atan2(te.y - tb.y, te.x - tb.x);
      ctx.save(); ctx.translate(te.x, te.y); ctx.rotate(ta);
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(22, 0); ctx.lineTo(0, 10); ctx.closePath(); fillO(ctx, '#f4e3c0', 2.5);
      ctx.restore();
      mark(ctx, c, 'tailtip', te.x, te.y);
      // крылья
      dragonWing(ctx, -5, -140, wa, 1);
      // туловище
      const tg = ctx.createLinearGradient(0, -145, 0, -55);
      tg.addColorStop(0, '#d44a30'); tg.addColorStop(1, '#a8321f');
      ctx.save(); ctx.translate(0, -100); ctx.rotate(-0.15);
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 18, -38); ctx.lineTo(-42 + i * 18, -58); ctx.lineTo(-32 + i * 18, -38); ctx.closePath(); fillO(ctx, '#f4e3c0', 2); }
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 44, 0, 0, TAU); fillO(ctx, tg);
      ctx.fillStyle = '#f0b45a'; ctx.beginPath(); ctx.ellipse(8, 18, 50, 20, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(160,90,30,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 20, 6); ctx.lineTo(-24 + i * 20, 32); ctx.stroke(); }
      ctx.restore();
      mark(ctx, c, 'center', 0, -100);
      // шея и голова
      const H = { x: 104 + hdx, y: -168 + hdy };
      for (const [col, w] of [['#1a0b26', 38], ['#c8402a', 31]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(48, -118); ctx.quadraticCurveTo(60 + hdx * 0.5, -165, H.x, H.y); ctx.stroke();
      }
      ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(hr);
      dragonHead(ctx, c, jaw, mouthWind);
      ctx.restore();
      ctx.restore();
    }
  };

  function boneArm(ctx, c, sx, sy, ang, bend, front) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2a1245'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.stroke();
    ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.stroke();
    ctx.translate(0, 44);
    ctx.rotate(bend);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.stroke();
    ctx.lineWidth = 3;
    for (const k of [-0.35, 0, 0.35]) { ctx.save(); ctx.translate(0, 42); ctx.rotate(k); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke(); ctx.restore(); }
    if (front) mark(ctx, c, 'hand', 0, 48);
    ctx.restore();
  }

  TYPES.lich = {
    boss: true, label: 'Король-лич', h: 190, shadow: 44, death: 'custom', deathDur: 2.2, speed: 22,
    abilities: [
      { id: 'shadowbolt', label: 'Теневые сферы', desc: 'Выпускает три тёмные сферы', dur: 1.5, fxAt: 0.6, fx: 'shadowbolt', from: 'hand', pose: 'bolt' },
      { id: 'summon', label: 'Призыв', desc: 'Открывает круг и призывает слуг (создайте мобов в onHit)', dur: 2.2, fxAt: 1.0, fx: 'summon', from: 'center', at: 'front', pose: 'summon', opts: { radius: 90 } },
      { id: 'curse', label: 'Проклятие', desc: 'Накладывает руны и цепи на героя', dur: 1.8, fxAt: 0.7, fx: 'curse', from: 'hand', pose: 'curse' }
    ],
    draw(ctx, c) {
      const d = c.dk, hover = Math.sin(c.t * 1.6) * 8;
      let y0 = -46 + hover, sy = 1;
      if (d > 0) { y0 += easeIn(d) * 40; sy = 1 - 0.7 * easeIn(d); }
      const flare = c.anim === 'cast' ? (c.s > 0 ? 1 - c.s : c.w) : 0;
      let ra = 0.25 + Math.sin(c.t * 1.8) * 0.05;
      if (c.anim === 'cast') {
        ra = c.pose === 'bolt' ? swing(c, 'bolt', 0.25, 3.0, 4.6, true)
          : c.pose === 'curse' ? swing(c, 'curse', 0.25, 3.6, 4.5, true)
          : swing(c, 'summon', 0.25, 3.3, 3.3, true);
      }
      const staffDy = c.anim === 'cast' && c.pose === 'summon' ? swing(c, 'summon', 0, -26, 10) : 0;
      ctx.save();
      ctx.translate(0, y0);
      ctx.scale(1, sy);
      // посох
      ctx.strokeStyle = '#4a2f1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-64, -20 + staffDy); ctx.lineTo(-64, -170 + staffDy); ctx.stroke();
      glowDot(ctx, -64, -176 + staffDy, 40 + 20 * flare, 'rgba(190,110,255,0.9)', 0.6 + flare * 0.4);
      ctx.beginPath(); ctx.arc(-64, -176 + staffDy, 12, 0, TAU); fillO(ctx, '#b36bff', 2.5);
      // мантия
      const rg = ctx.createLinearGradient(0, -110, 0, 30);
      rg.addColorStop(0, '#3a1a5c'); rg.addColorStop(1, '#1a0a2e');
      ctx.beginPath();
      ctx.moveTo(-30, -105);
      ctx.bezierCurveTo(-48, -60, -62, -10, -58, 26);
      for (let i = 0; i <= 6; i++) ctx.lineTo(-58 + i * (116 / 6), 26 + (i % 2 ? 10 : -4) + Math.sin(c.t * 3 + i) * 3);
      ctx.bezierCurveTo(62, -10, 48, -60, 30, -105);
      ctx.closePath();
      fillO(ctx, rg);
      ctx.strokeStyle = '#d9a93a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-30, -100); ctx.quadraticCurveTo(0, -70, 30, -40); ctx.stroke();
      // левая рука к посоху
      ctx.strokeStyle = '#2a1245'; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(-30, -100); ctx.lineTo(-62, -74 + staffDy); ctx.stroke();
      ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-50, -84 + staffDy * 0.6); ctx.lineTo(-62, -74 + staffDy); ctx.stroke();
      // наплечники
      for (const sx of [-32, 32]) { ctx.beginPath(); ctx.arc(sx, -104, 16, 0, TAU); fillO(ctx, '#2a1245'); ctx.fillStyle = '#d9a93a'; ctx.beginPath(); ctx.moveTo(sx - 5, -116); ctx.lineTo(sx, -134); ctx.lineTo(sx + 5, -116); ctx.fill(); }
      // голова
      ctx.beginPath(); ctx.arc(0, -130, 27, 0, TAU); fillO(ctx, '#2a1245');
      ctx.beginPath(); ctx.ellipse(0, -128, 16, 19, 0, 0, TAU); fillO(ctx, '#efe6d2', 2.5);
      ctx.fillStyle = '#1a0b26';
      ctx.beginPath(); ctx.arc(-6, -130, 5, 0, TAU); ctx.arc(6, -130, 5, 0, TAU); ctx.fill();
      glowDot(ctx, -6, -130, 18 + 12 * flare, 'rgba(190,110,255,1)', 0.9);
      glowDot(ctx, 6, -130, 18 + 12 * flare, 'rgba(190,110,255,1)', 0.9);
      ctx.beginPath(); ctx.moveTo(0, -124); ctx.lineTo(-2.5, -118); ctx.lineTo(2.5, -118); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1a0b26'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-8, -112); ctx.lineTo(8, -112); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 3.5, -114); ctx.lineTo(i * 3.5, -110); } ctx.stroke();
      ctx.fillStyle = '#d9a93a';
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 9 - 4, -148); ctx.lineTo(i * 9, -148 - (i % 2 ? 12 : 18)); ctx.lineTo(i * 9 + 4, -148); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#1a0b26'; ctx.stroke(); }
      ctx.fillRect(-20, -150, 40, 6);
      // правая рука
      boneArm(ctx, c, 32, -100, ra, 0.2, true);
      mark(ctx, c, 'center', 0, -70);
      ctx.restore();
      if (d > 0) {
        for (let i = 0; i < 8; i++) {
          const q = clamp(d * 1.2 - i * 0.05);
          if (q <= 0) continue;
          ctx.save();
          ctx.globalAlpha = (1 - q) * 0.6;
          ctx.fillStyle = '#4a1a7a';
          ctx.beginPath();
          ctx.arc(Math.sin(i * 2.1) * 40, -30 - q * 120 - (i % 3) * 14, 12 + q * 24, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  };

  /* ====================================================================
   *  БАЛАНС КАМПАНИИ MONSTER HIGH
   *  HP и damage — базовые значения для первого этапа баланса.
   * ==================================================================== */

  // Новые обычные противники используют готовые процедурные анимационные
  // заготовки, но получают собственные параметры и способности.
  // Новая линейка кампании: каждый тип получает собственный силуэт и анимацию.
  const creatureBob = c => c.anim === 'walk' ? Math.abs(Math.sin(c.t * 7)) * 7 : Math.sin(c.t * 2.2) * 2;
  const castK = c => c.anim === 'cast' ? (c.s > 0 ? 1 - c.s : c.w) : 0;

  TYPES.frog = {
    label: 'Лягушка', h: 64, hp: 35, damage: 5, speed: 62, shadow: 34, death: 'custom', deathDur: .75,
    abilities: [{ id:'attack', label:'Язык-рывок', desc:'Выбрасывает длинный липкий язык', dur:.85, fxAt:.42, fx:'splat', from:'mouth' }],
    draw(ctx,c) {
      const b=creatureBob(c), k=castK(c), hop=c.anim==='cast'?k*13:0;
      ctx.save(); ctx.translate(0,-b-hop);
      // задние лапы
      for(const x of [-29,29]) { ctx.beginPath(); ctx.ellipse(x, -9, 20, 10, x<0?-.3:.3, 0,TAU); fillO(ctx,'#4c9c43',3); }
      ctx.beginPath(); ctx.ellipse(0,-31,38,29,0,0,TAU); fillO(ctx,'#70c94e',3);
      ctx.beginPath(); ctx.ellipse(0,-18,23,12,0,0,TAU); fillO(ctx,'#d5ed91',2);
      for(const x of [-19,19]) { ctx.beginPath(); ctx.arc(x,-57,13,0,TAU); fillO(ctx,'#70c94e',2); eye(ctx,x+2,-58,6,1,0,3,'#fff','#20152a'); }
      ctx.beginPath(); ctx.moveTo(7,-30); ctx.quadraticCurveTo(20,-23,30,-31); ctx.strokeStyle='#25321c'; ctx.lineWidth=2.5; ctx.stroke();
      for(const x of [-24,24]) { ctx.beginPath(); ctx.ellipse(x,-3,13,5,0,0,TAU); fillO(ctx,'#b4e66c',2); }
      mark(ctx,c,'mouth',28,-31); mark(ctx,c,'center',0,-35);
      if(k>0){ ctx.strokeStyle='#ff7b9c'; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(28,-31); ctx.quadraticCurveTo(58,-42,78,-32); ctx.stroke(); }
      ctx.restore();
    }
  };
  TYPES.slime = { ...TYPES.slime, label:'Слизень', h:55, hp:55, damage:8, speed:46 };
  TYPES.zombie = {
    label:'Зомби', h:100, hp:85, damage:12, speed:27, shadow:42, death:'tip', deathDur:1.15,
    abilities:[{id:'attack',label:'Удар мертвеца',desc:'Медленно замахивается и наносит тяжёлый удар',dur:1.25,fxAt:.72,fx:'rockhit',from:'fist',pose:'smash'}],
    draw(ctx,c){
      const b=creatureBob(c), k=castK(c), arm=c.anim==='cast'?lerp(-.7,1.35,k):Math.sin(c.t*2)*.08;
      ctx.save(); ctx.translate(0,-b);
      // рваный плащ и ноги
      ctx.beginPath(); ctx.moveTo(-28,-67); ctx.lineTo(27,-67); ctx.lineTo(35,-8); ctx.lineTo(15,-15); ctx.lineTo(0,-5); ctx.lineTo(-17,-16); ctx.lineTo(-36,-7); ctx.closePath(); fillO(ctx,'#53634c',3);
      for(const x of [-15,14]){ctx.beginPath();ctx.moveTo(x-6,-14);ctx.lineTo(x-8,0);ctx.lineTo(x+7,0);ctx.lineTo(x+5,-14);ctx.closePath();fillO(ctx,'#68765a',2);}
      ctx.save();ctx.translate(-25,-65);ctx.rotate(-.25);limb(ctx,48,13,10,'#788365');ctx.restore();
      ctx.save();ctx.translate(25,-65);ctx.rotate(arm);limb(ctx,50,15,11,'#788365');ctx.translate(0,48);ctx.beginPath();ctx.arc(0,5,9,0,TAU);fillO(ctx,'#9aa27a',2);mark(ctx,c,'fist',0,5);ctx.restore();
      ctx.beginPath();ctx.arc(0,-88,25,0,TAU);fillO(ctx,'#879879',3);
      ctx.beginPath();ctx.moveTo(-22,-102);ctx.lineTo(-10,-116);ctx.lineTo(-3,-105);ctx.lineTo(8,-116);ctx.lineTo(24,-100);ctx.closePath();fillO(ctx,'#64765c',2);
      eye(ctx,-9,-91,5,1,1,2.8,'#f6df82','#421c19'); eye(ctx,9,-91,5,1,1,2.8,'#f6df82','#421c19');
      ctx.beginPath();ctx.moveTo(-8,-76);ctx.lineTo(9,-78);ctx.strokeStyle='#39252a';ctx.lineWidth=3;ctx.stroke();
      ctx.beginPath();ctx.moveTo(-17,-58);ctx.lineTo(-5,-51);ctx.lineTo(7,-58);ctx.lineTo(18,-51);ctx.strokeStyle='#b7b99b';ctx.lineWidth=3;ctx.stroke();
      mark(ctx,c,'center',0,-65);ctx.restore();
    }
  };
  TYPES.vampire = {
    label:'Вампир', h:132, hp:120, damage:17, speed:72, shadow:38, death:'tip', deathDur:1.2,
    abilities:[{id:'attack',label:'Кровавый рывок',desc:'Растворяется в тумане и атакует из рывка',dur:1.0,fxAt:.5,fx:'fireball',from:'mouth'}],
    draw(ctx,c){
      const b=creatureBob(c), k=castK(c), flap=Math.sin(c.t*5)*9;
      ctx.save();ctx.translate(0,-b);
      // развевающийся плащ-крылья
      ctx.beginPath();ctx.moveTo(-8,-68);ctx.quadraticCurveTo(-55,-92,-61+flap,-17);ctx.lineTo(-34,-29);ctx.lineTo(-17,-8);ctx.lineTo(0,-29);ctx.lineTo(19,-8);ctx.lineTo(34,-29);ctx.lineTo(61-flap,-17);ctx.quadraticCurveTo(54,-91,8,-68);ctx.closePath();fillO(ctx,'#64234e',3);
      ctx.beginPath();ctx.moveTo(-22,-72);ctx.lineTo(-16,-17);ctx.lineTo(17,-17);ctx.lineTo(23,-72);ctx.closePath();fillO(ctx,'#21152e',3);
      ctx.beginPath();ctx.moveTo(-23,-93);ctx.lineTo(-18,-111);ctx.lineTo(-7,-97);ctx.lineTo(7,-97);ctx.lineTo(18,-111);ctx.lineTo(24,-93);ctx.closePath();fillO(ctx,'#21152e',3);
      ctx.beginPath();ctx.ellipse(0,-89,24,28,0,0,TAU);fillO(ctx,'#d7b5b8',3);
      ctx.beginPath();ctx.moveTo(-21,-105);ctx.lineTo(-27,-133);ctx.lineTo(-7,-111);ctx.moveTo(21,-105);ctx.lineTo(27,-133);ctx.lineTo(7,-111);ctx.strokeStyle='#d7b5b8';ctx.lineWidth=7;ctx.stroke();
      eye(ctx,-9,-92,5,1,0,3,'#ff5d82','#4b1429');eye(ctx,9,-92,5,1,0,3,'#ff5d82','#4b1429');
      ctx.beginPath();ctx.moveTo(-8,-75);ctx.lineTo(-4,-67);ctx.lineTo(0,-75);ctx.lineTo(4,-67);ctx.lineTo(8,-75);ctx.strokeStyle='#fff0e8';ctx.lineWidth=2.5;ctx.stroke();
      ctx.fillStyle='#d9b35c';ctx.fillRect(-17,-115,34,5);ctx.beginPath();ctx.moveTo(-12,-115);ctx.lineTo(-5,-130);ctx.lineTo(0,-115);ctx.lineTo(7,-130);ctx.lineTo(13,-115);ctx.fill();
      mark(ctx,c,'mouth',18,-78);mark(ctx,c,'core',0,-68);
      if(k>0){ctx.globalAlpha=.35+k*.4;ctx.fillStyle='#b94b85';ctx.beginPath();ctx.ellipse(0,-45,54+k*15,35,0,0,TAU);ctx.fill();}
      ctx.restore();
    }
  };
  TYPES.mushroom = { ...TYPES.mushroom, hp:150, damage:20, speed:35 };
  TYPES.eye = { ...TYPES.eye, hp:180, damage:24, speed:40 };
  TYPES.spiker = { ...TYPES.spiker, hp:210, damage:27, speed:55 };
  TYPES.ghost = {
    label:'Призрак', h:125, hp:250, damage:32, speed:52, shadow:25, death:'custom', deathDur:1.0,
    abilities:[{id:'attack',label:'Призрачный импульс',desc:'Выпускает волну потусторонней энергии',dur:1.15,fxAt:.58,fx:'fireball',from:'core'}],
    draw(ctx,c){
      const b=creatureBob(c), k=castK(c), wave=Math.sin(c.t*3)*5;
      ctx.save();ctx.translate(0,-b);
      ctx.globalAlpha=1-c.dk*.35;
      ctx.beginPath();ctx.moveTo(-29,-27);ctx.bezierCurveTo(-42,-63,-31,-116,0,-119);ctx.bezierCurveTo(36,-118,43,-65,29,-27);ctx.lineTo(28,-5);ctx.lineTo(12,-16);ctx.lineTo(0,-3);ctx.lineTo(-13,-16);ctx.lineTo(-29,-5);ctx.closePath();
      const g=ctx.createLinearGradient(0,-120,0,0);g.addColorStop(0,'#d9f5ff');g.addColorStop(1,'#77b7df');fillO(ctx,g,3);
      eye(ctx,-10,-79,7,1,0,3,'#fff','#34205c');eye(ctx,11,-79,7,1,0,3,'#fff','#34205c');
      ctx.beginPath();ctx.arc(0,-58,7,0,Math.PI);ctx.strokeStyle='#53628f';ctx.lineWidth=2.5;ctx.stroke();
      for(let i=0;i<3;i++){ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(-25+i*25,-42+wave+i*5,7,0,TAU);ctx.fillStyle='#c7f7ff';ctx.fill();}ctx.globalAlpha=1;
      mark(ctx,c,'core',0,-63);ctx.restore();
    }
  };
  TYPES.golem = { ...TYPES.golem, hp:320, damage:40, speed:30 };
  TYPES.darkMage = {
    label:'Тёмный маг', h:150, hp:380, damage:48, speed:25, shadow:36, death:'custom', deathDur:1.3,
    abilities:[
      {id:'attack',label:'Тёмная сфера',desc:'Запускает сгусток тёмной энергии',dur:1.35,fxAt:.62,fx:'shadowbolt',from:'hand',pose:'bolt'},
      {id:'curse',label:'Малое проклятие',desc:'Накладывает ослабляющие руны',dur:1.5,fxAt:.7,fx:'curse',from:'hand',pose:'curse'}
    ],
    draw(ctx,c){
      const b=creatureBob(c),k=castK(c),raise=c.anim==='cast'?k*25:0;
      ctx.save();ctx.translate(0,-b);
      ctx.beginPath();ctx.moveTo(-24,-95);ctx.lineTo(24,-95);ctx.lineTo(46,-4);ctx.lineTo(-44,-4);ctx.closePath();fillO(ctx,'#392052',3);
      ctx.beginPath();ctx.moveTo(-28,-95);ctx.lineTo(0,-143);ctx.lineTo(29,-95);ctx.closePath();fillO(ctx,'#21142f',3);
      ctx.beginPath();ctx.arc(0,-102,22,0,TAU);fillO(ctx,'#b9a0c9',3);
      eye(ctx,-8,-105,5,0,0,3,'#b67aff','#261339');eye(ctx,8,-105,5,0,0,3,'#b67aff','#261339');
      ctx.strokeStyle='#9a6bc9';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(34,-15);ctx.lineTo(45,-145-raise);ctx.stroke();
      ctx.beginPath();ctx.arc(45,-151-raise,12,0,TAU);fillO(ctx,'#b67aff',2);glowDot(ctx,45,-151-raise,30,'rgba(175,100,255,.9)',.8);
      mark(ctx,c,'hand',45,-151-raise);mark(ctx,c,'center',0,-76);ctx.restore();
    }
  };

  // Боссы кампании — пять самостоятельных силуэтов, а не перекраски старых шаблонов.
  TYPES.headmistress = {
    boss:true,label:'Директорша Тьмы',h:225,hp:1250,damage:72,speed:20,shadow:52,death:'custom',deathDur:2.1,
    phaseAt:.5, abilities:[
      {id:'shadowbolt',label:'Тёмные снаряды',desc:'Выпускает серию сгустков тьмы',dur:1.5,fxAt:.6,fx:'shadowbolt',from:'hand',pose:'bolt'},
      {id:'summon',label:'Призыв теней',desc:'Открывает портал для тёмных помощников',dur:2.2,fxAt:1,fx:'summon',from:'center',at:'front',pose:'summon',opts:{radius:90}},
      {id:'curse',label:'Печать тьмы',desc:'Накладывает на героя магическую печать',dur:1.8,fxAt:.7,fx:'curse',from:'hand',pose:'curse'}
    ],
    draw(ctx,c){const b=creatureBob(c),k=castK(c),a=c.anim==='cast'?k*.7:0;ctx.save();ctx.translate(0,-b);
      ctx.beginPath();ctx.moveTo(-55,-8);ctx.lineTo(-39,-145);ctx.lineTo(-20,-169);ctx.lineTo(0,-145);ctx.lineTo(22,-174);ctx.lineTo(42,-144);ctx.lineTo(56,-8);ctx.closePath();fillO(ctx,'#27122f',4);
      ctx.beginPath();ctx.moveTo(-39,-115);ctx.lineTo(0,-151);ctx.lineTo(39,-115);ctx.lineTo(28,-5);ctx.lineTo(-28,-5);ctx.closePath();fillO(ctx,'#5a245e',3);
      ctx.beginPath();ctx.arc(0,-145,27,0,TAU);fillO(ctx,'#d7c3d7',3);eye(ctx,-10,-148,6,0,0,4,'#fff','#7b2c9b');eye(ctx,10,-148,6,0,0,4,'#fff','#7b2c9b');
      ctx.fillStyle='#d7b35a';ctx.beginPath();ctx.moveTo(-25,-167);ctx.lineTo(-18,-195);ctx.lineTo(-4,-171);ctx.lineTo(7,-198);ctx.lineTo(18,-171);ctx.lineTo(28,-191);ctx.lineTo(26,-162);ctx.closePath();fillO(ctx,'#d7b35a',2);
      for(const x of [-43,43]){ctx.save();ctx.translate(x,-95);ctx.rotate(x<0?-.5:.5);limb(ctx,62,18,12,'#d7c3d7');ctx.restore();}
      ctx.beginPath();ctx.arc(0,-67,9,0,TAU);fillO(ctx,'#b45dff',2);glowDot(ctx,0,-67,38,'rgba(170,65,255,.8)',.6+a*.4);mark(ctx,c,'hand',36,-88);mark(ctx,c,'center',0,-75);ctx.restore();}
  };
  TYPES.ghostQueen = {
    boss:true,phaseAt:.5,label:'Королева Призраков',h:245,hp:1550,damage:88,speed:23,shadow:46,death:'custom',deathDur:2.2,
    abilities:[
      {id:'howl',label:'Призрачная волна',desc:'Посылает по арене волну духовной энергии',dur:1.5,fxAt:.7,fx:'fireball',from:'center'},
      {id:'summon',label:'Спектральная свита',desc:'Открывает портал для призрачных слуг',dur:2.2,fxAt:1,fx:'summon',from:'center',at:'front',pose:'summon',opts:{radius:100}},
      {id:'curse',label:'Проклятие призраков',desc:'Окружает героя призрачными рунами',dur:1.8,fxAt:.7,fx:'curse',from:'hand',pose:'curse'}
    ],
    draw(ctx,c){const b=creatureBob(c),k=castK(c),fl=Math.sin(c.t*3)*7;ctx.save();ctx.translate(0,-b);
      ctx.beginPath();ctx.moveTo(-48,-14);ctx.quadraticCurveTo(-65,-100,-30,-173);ctx.lineTo(0,-195);ctx.lineTo(30,-173);ctx.quadraticCurveTo(65,-100,48,-14);ctx.lineTo(25,-28);ctx.lineTo(0,-12);ctx.lineTo(-24,-28);ctx.closePath();const g=ctx.createLinearGradient(0,-195,0,0);g.addColorStop(0,'#e8f5ff');g.addColorStop(1,'#7693c9');fillO(ctx,g,4);
      ctx.beginPath();ctx.arc(0,-150,27,0,TAU);fillO(ctx,'#c7d8ed',3);eye(ctx,-10,-153,6,0,0,3,'#fff','#28345f');eye(ctx,10,-153,6,0,0,3,'#fff','#28345f');
      ctx.fillStyle='#d9c5f2';ctx.beginPath();ctx.moveTo(-32,-172);ctx.lineTo(-25,-220);ctx.lineTo(-4,-184);ctx.lineTo(0,-229);ctx.lineTo(12,-184);ctx.lineTo(31,-216);ctx.lineTo(27,-170);ctx.closePath();fillO(ctx,'#b8c8e8',2);
      ctx.strokeStyle='#a5cfff';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-35,-100);ctx.quadraticCurveTo(-70,-72-fl,-43,-36);ctx.moveTo(35,-100);ctx.quadraticCurveTo(70,-72+fl,43,-36);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-70,12,0,TAU);fillO(ctx,'#91dfff',2);glowDot(ctx,0,-70,55,'rgba(120,210,255,.8)',.45+k*.4);mark(ctx,c,'center',0,-75);mark(ctx,c,'hand',38,-82);ctx.restore();}
  };
  TYPES.doctorShock = {
    boss:true,phaseAt:.5,label:'Доктор Разряд',h:245,hp:1850,damage:105,speed:24,shadow:58,death:'custom',deathDur:2.0,
    abilities:[
      {id:'lightning',label:'Цепной разряд',desc:'Бьёт электрической дугой по цели',dur:1.45,fxAt:.65,fx:'laser',from:'coil'},
      {id:'meteors',label:'Энергокапсулы',desc:'Обрушивает заряженные капсулы на арену',dur:2,fxAt:.8,fx:'meteors',from:'center',pose:'meteor'},
      {id:'tailquake',label:'Импульс перегрузки',desc:'Создаёт мощную ударную волну',dur:1.6,fxAt:.75,fx:'tailquake',from:'fist',pose:'quake'}
    ],
    draw(ctx,c){const b=creatureBob(c),k=castK(c);ctx.save();ctx.translate(0,-b);
      ctx.beginPath();ctx.moveTo(-42,-12);ctx.lineTo(-34,-125);ctx.lineTo(34,-125);ctx.lineTo(44,-12);ctx.closePath();fillO(ctx,'#52616e',4);
      ctx.beginPath();ctx.arc(0,-145,34,0,TAU);fillO(ctx,'#a9c0c9',4);ctx.beginPath();ctx.arc(0,-145,24,0,TAU);fillO(ctx,'#27394a',2);
      eye(ctx,-11,-148,7,0,0,4,'#8effff','#092c47');eye(ctx,11,-148,7,0,0,4,'#8effff','#092c47');
      ctx.fillStyle='#d9e6e8';rr(ctx,-19,-194,38,15,5);ctx.fill();outline(ctx,2);
      for(const x of [-45,45]){ctx.beginPath();ctx.arc(x,-116,15,0,TAU);fillO(ctx,'#e1a64e',3);glowDot(ctx,x,-116,28,'rgba(70,220,255,.9)',.5+k*.5);}
      ctx.strokeStyle='#c9d7df';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-30,-102);ctx.lineTo(-51,-55);ctx.lineTo(-34,-24);ctx.moveTo(30,-102);ctx.lineTo(51,-55);ctx.lineTo(34,-24);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-75,16,0,TAU);fillO(ctx,'#4ce5ff',3);glowDot(ctx,0,-75,50,'rgba(60,220,255,.85)',.7);mark(ctx,c,'coil',45,-116);mark(ctx,c,'fist',34,-24);mark(ctx,c,'center',0,-75);ctx.restore();}
  };
  TYPES.forestMatron = {
    boss:true,phaseAt:.5,label:'Лесная Матрона',h:285,hp:2200,damage:120,speed:18,shadow:72,death:'tip',deathDur:2.4,
    abilities:[
      {id:'roots',label:'Живые корни',desc:'Корни вырываются из земли под героем',dur:1.7,fxAt:.85,fx:'roots',from:'hand',pose:'roots'},
      {id:'leafstorm',label:'Шторм шипов',desc:'Поднимает вихрь колючих листьев',dur:1.8,fxAt:.8,fx:'leafstorm',from:'crown',pose:'storm'},
      {id:'regrow',label:'Лесное возрождение',desc:'Восстанавливает часть здоровья',dur:2.2,fxAt:.7,fx:'regrow',from:'center',at:'self',pose:'regrow',opts:{radius:120}}
    ],
    draw(ctx,c){const b=creatureBob(c),k=castK(c),sway=Math.sin(c.t*1.4)*.05;ctx.save();ctx.translate(0,-b);ctx.rotate(sway);
      ctx.beginPath();ctx.moveTo(-52,-4);ctx.lineTo(-38,-145);ctx.lineTo(-24,-190);ctx.lineTo(0,-166);ctx.lineTo(25,-198);ctx.lineTo(39,-145);ctx.lineTo(53,-4);ctx.closePath();fillO(ctx,'#654329',4);
      ctx.beginPath();ctx.ellipse(0,-160,48,53,0,0,TAU);fillO(ctx,'#80552e',3);
      for(const [x,y,r] of [[-35,-190,30],[0,-218,36],[35,-190,30],[-8,-175,27]]){ctx.beginPath();ctx.arc(x,y,r,0,TAU);fillO(ctx,'#4d9b45',3);}
      eye(ctx,-12,-163,7,0,0,3,'#f7e7a2','#382116');eye(ctx,12,-163,7,0,0,3,'#f7e7a2','#382116');
      ctx.beginPath();ctx.moveTo(-20,-135);ctx.quadraticCurveTo(0,-123,20,-135);ctx.strokeStyle='#301d16';ctx.lineWidth=4;ctx.stroke();
      for(const x of [-46,46]){ctx.save();ctx.translate(x,-135);ctx.rotate(x<0?-.7:.7);limb(ctx,92,22,14,'#654329');for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-10+i*9,55);ctx.lineTo(-8+i*9,75);ctx.strokeStyle='#3e7b35';ctx.lineWidth=4;ctx.stroke();}ctx.restore();}
      ctx.beginPath();ctx.arc(0,-90,14,0,TAU);fillO(ctx,'#8be05c',2);glowDot(ctx,0,-90,48,'rgba(115,255,95,.75)',.5+k*.5);mark(ctx,c,'hand',48,-70);mark(ctx,c,'crown',0,-218);mark(ctx,c,'center',0,-90);ctx.restore();}
  };
  TYPES.bloodQueen = {
    boss:true,phaseAt:.5,label:'Кровавая Королева',h:275,hp:2800,damage:145,speed:26,shadow:62,death:'custom',deathDur:2.3,
    abilities:[
      {id:'bats',label:'Кровавые летучие мыши',desc:'Натравливает на героя рой летучих мышей',dur:1.8,fxAt:1,fx:'fireball',from:'mouth'},
      {id:'firebreath',label:'Кровавое дыхание',desc:'Выдыхает поток алой магии',dur:1.7,fxAt:.55,fx:'firebreath',from:'mouth',pose:'breath'},
      {id:'curse',label:'Алое проклятие',desc:'Накладывает на героя кровавую печать',dur:1.8,fxAt:.7,fx:'curse',from:'center'}
    ],
    draw(ctx,c){const b=creatureBob(c),k=castK(c),fl=Math.sin(c.t*4)*6;ctx.save();ctx.translate(0,-b);
      // королевский силуэт с крыльями и длинным платьем
      ctx.beginPath();ctx.moveTo(-8,-90);ctx.quadraticCurveTo(-88,-145,-73,-20);ctx.lineTo(-35,-43);ctx.lineTo(-18,-8);ctx.lineTo(0,-35);ctx.lineTo(18,-8);ctx.lineTo(35,-43);ctx.lineTo(73,-20);ctx.quadraticCurveTo(88,-145,8,-90);ctx.closePath();fillO(ctx,'#641b3a',4);
      ctx.beginPath();ctx.moveTo(-31,-110);ctx.lineTo(31,-110);ctx.lineTo(54,-5);ctx.lineTo(-54,-5);ctx.closePath();fillO(ctx,'#a52d50',3);
      ctx.beginPath();ctx.arc(0,-135,29,0,TAU);fillO(ctx,'#e0c1c5',3);eye(ctx,-10,-137,6,0,0,3,'#ff5d79','#4b1429');eye(ctx,10,-137,6,0,0,3,'#ff5d79','#4b1429');
      ctx.fillStyle='#d9b35c';ctx.beginPath();ctx.moveTo(-32,-153);ctx.lineTo(-26,-188);ctx.lineTo(-8,-162);ctx.lineTo(0,-199);ctx.lineTo(9,-162);ctx.lineTo(27,-188);ctx.lineTo(32,-153);ctx.closePath();fillO(ctx,'#d9b35c',2);
      ctx.beginPath();ctx.arc(0,-80,16,0,TAU);fillO(ctx,'#d62e62',2);glowDot(ctx,0,-80,52,'rgba(255,35,90,.85)',.55+k*.45);
      for(const x of [-45,45]){ctx.beginPath();ctx.arc(x,-70+fl,7,0,TAU);fillO(ctx,'#d9b35c',2);}
      mark(ctx,c,'mouth',18,-125);mark(ctx,c,'center',0,-80);ctx.restore();}
  };

  // Скрываем старые демонстрационные имена из выбора кампании.
  delete TYPES.treant;
  delete TYPES.dragon;
  delete TYPES.lich;
  delete TYPES.wisp;

  /* ====================================================================
   *  Класс существа
   * ==================================================================== */
  class Monster {
    constructor(type, o = {}) {
      const T = TYPES[type];
      if (!T) throw new Error('Monster: неизвестный тип «' + type + '». Доступно: ' + Object.keys(TYPES).join(', '));
      this.type = type; this.T = T;
      this.maxHp = T.hp || T.h || 100; this.hp = this.maxHp; this.baseDamage = T.damage || 10; this.damage = this.baseDamage; this.phase = 1;
      this.x = o.x || 0; this.y = o.y || 0;
      this.face = o.face || -1; this.scale = o.scale || 1;
      this.fx = o.fx || null;
      this.t = rnd(0, 10);
      this.anim = 'idle'; this.at = 0;
      this.hurtK = 0; this.dk = 0; this.dead = false;
      this.moving = 0; this.rage = 0; this.enraged = false;
      this.anch = {}; this.aim = { x: 1, y: 0.1 };
      this.cbs = {}; this.ab = null; this.fired = false; this.target = null;
      this.w = 0; this.s = 0; this.wind = 0; this.pulse = 0; this.pose = '';
      this.noFxTimer = -1;
    }

    get isBoss() { return !!this.T.boss; }
    get abilities() { return this.T.abilities; }
    get busy() { return this.anim === 'cast' || this.anim === 'death'; }

    /** Мировая точка якоря: 'mouth', 'hand', 'fist', 'center'… (обновляется при отрисовке) */
    anchor(name) { return this.anch[name] || { x: this.x, y: this.y - (this.T.h / 2) * this.scale }; }

    attack(target, cbs) { return this.cast(0, target, cbs); }

    /** Запустить способность по id или индексу. cbs: { onHit, onFxEnd, onDone } */
    cast(id, target, cbs = {}) {
      if (this.anim === 'death' || this.anim === 'cast') return false;
      const ab = typeof id === 'number' ? this.T.abilities[id] : this.T.abilities.find(a => a.id === id);
      if (!ab) throw new Error('Monster: нет способности «' + id + '» у ' + this.type);
      this.anim = 'cast'; this.ab = ab; this.at = 0; this.fired = false;
      this.target = target || null; this.cbs = cbs; this.pose = ab.pose || 'attack';
      return true;
    }

    hurt(amount = 1) { if (this.anim !== 'death') { this.hp = Math.max(0, this.hp - Math.max(0, amount)); this.hurtK = 1; this.phase = this.T.phaseAt && this.hp <= this.maxHp * this.T.phaseAt ? 2 : 1; if (this.phase === 2) { this.enrage(true); this.damage = Math.round(this.baseDamage * 1.25); } if (this.hp <= 0) this.die(); } }

    die(cb) {
      if (this.anim === 'death') return;
      this.anim = 'death'; this.at = 0; this.dk = 0; this.deathCb = cb || null; this.cbs = {}; this.ab = null;
    }

    revive() {
      this.anim = 'idle'; this.at = 0; this.dk = 0; this.dead = false; this.hurtK = 0; this.ab = null; this.hp = this.maxHp; this.phase = 1; this.damage = this.baseDamage; this.enrage(false);
      this.w = this.s = this.wind = this.pulse = 0;
    }

    /** -1 / 0 / 1: идти влево / стоять / идти вправо */
    walk(dir) { this.moving = dir; }
    enrage(on = true) { this.enraged = on; }

    _fire() {
      const ab = this.ab, tg = this.target || { x: this.x + this.face * 300 * this.scale, y: this.y - 40 };
      const sc = (ab.fxScale || 1) * this.scale;
      let to = tg;
      if (ab.at === 'self') to = this.anchor('center');
      else if (ab.at === 'front') to = { x: this.x + this.face * 170 * this.scale, y: this.y - 2 };
      const o = Object.assign({
        from: this.anchor(ab.from || 'center'), to, scale: sc,
        gy: this.y, tgy: ab.at === 'front' ? this.y : (tg.gy !== undefined ? tg.gy : tg.y + 30)
      }, ab.opts || {});
      if (o.radius) o.radius = o.radius * this.scale;
      o.onHit = () => { if (this.cbs.onHit) this.cbs.onHit(); };
      o.onEnd = () => { if (this.cbs.onFxEnd) this.cbs.onFxEnd(); };
      if (this.fx) this.fx.play(ab.fx, o);
      else this.noFxTimer = 0.25;
    }

    update(dt) {
      dt = Math.min(dt, 0.05);
      this.t += dt; this.at += dt;
      this.hurtK = Math.max(0, this.hurtK - dt * 3.5);
      this.rage = lerp(this.rage, this.enraged ? 1 : 0, Math.min(1, dt * 3));
      if (this.noFxTimer >= 0) {
        this.noFxTimer -= dt;
        if (this.noFxTimer < 0 && this.cbs.onHit) this.cbs.onHit();
      }
      if (this.target) {
        const dx = (this.target.x - this.x) * this.face, dy = this.target.y - (this.y - 80 * this.scale), l = Math.hypot(dx, dy) || 1;
        this.aim.x = lerp(this.aim.x, dx / l, Math.min(1, dt * 8));
        this.aim.y = lerp(this.aim.y, dy / l, Math.min(1, dt * 8));
      }
      this.w = this.s = this.wind = this.pulse = 0;
      if (this.anim === 'death') {
        this.dk = clamp(this.at / this.T.deathDur);
        if (this.dk >= 1 && !this.dead) { this.dead = true; if (this.deathCb) this.deathCb(); }
        return;
      }
      if (this.anim === 'cast') {
        const ab = this.ab;
        if (!this.fired && this.at >= ab.fxAt) { this.fired = true; this._fire(); }
        this.w = clamp(this.at / ab.fxAt);
        this.s = this.fired ? clamp((this.at - ab.fxAt) / (ab.dur - ab.fxAt)) : 0;
        this.wind = this.s > 0 ? 0 : this.w;
        this.pulse = this.s > 0 ? Math.sin(clamp(this.s * 1.6) * Math.PI) : 0;
        if (this.at >= ab.dur) {
          const done = this.cbs.onDone;
          this.anim = 'idle'; this.ab = null; this.at = 0;
          this.w = this.s = this.wind = this.pulse = 0;
          if (done) done();
        }
        return;
      }
      if (this.moving) {
        this.anim = 'walk';
        this.x += this.moving * this.T.speed * this.scale * dt * (this.enraged ? 1.4 : 1);
      } else this.anim = 'idle';
    }

    draw(ctx) {
      if (this.dead) return;
      const T = this.T;
      ctx.save();
      this._base = ctx.getTransform ? ctx.getTransform() : null;
      ctx.translate(this.x, this.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, T.shadow * this.scale, T.shadow * 0.22 * this.scale, 0, 0, TAU);
      ctx.fill();
      ctx.scale(this.face * this.scale, this.scale);
      if (this.rage > 0.01) glowDot(ctx, 0, -T.h / 2, T.h * 0.95, 'rgba(255,40,40,0.7)', this.rage * 0.55);
      ctx.translate(-8 * this.hurtK + Math.sin(this.t * 70) * 3 * this.hurtK, 0);
      if (this.hurtK > 0 && 'filter' in ctx) ctx.filter = 'brightness(' + (1 + 1.6 * this.hurtK) + ') saturate(' + (1 - 0.5 * this.hurtK) + ')';
      const d = this.dk;
      if (d > 0.7) ctx.globalAlpha = Math.max(0, 1 - (d - 0.7) / 0.3);
      if (T.death === 'tip' && d > 0) ctx.rotate(-1.45 * easeIn(d));
      T.draw(ctx, this);
      ctx.restore();
    }
  }

  const CAMPAIGN_ORDER = ['frog','slime','zombie','vampire','mushroom','eye','spiker','ghost','golem','darkMage','headmistress','ghostQueen','doctorShock','forestMatron','bloodQueen'];
  const LIST = CAMPAIGN_ORDER.filter(id => TYPES[id]).map(id => ({ id, label: TYPES[id].label, boss: !!TYPES[id].boss }));

  const Bestiary = { types: TYPES, list: LIST, Monster };
  global.Monster = Monster;
  global.Bestiary = Bestiary;
  if (typeof module !== 'undefined' && module.exports) module.exports = Bestiary;
})(typeof window !== 'undefined' ? window : globalThis);
