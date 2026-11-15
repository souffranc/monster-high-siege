/*
 * AttackFX — процедурные анимации атак для 2D-игры на canvas.
 * Без зависимостей и без картинок: всё рисуется кодом.
 *
 * Использование:
 *   const fx = new AttackFX();
 *   fx.play('lightning', {
 *     from: {x: 200, y: 300},     // кто атакует
 *     to:   {x: 700, y: 300},     // цель (для щита — союзник)
 *     scale: 1,                   // общий масштаб эффекта
 *     onHit: () => { ... },       // момент попадания: здесь наносите урон
 *     onEnd: () => { ... }        // эффект закончился
 *   });
 *   // в игровом цикле:
 *   fx.update(dt);   // dt в секундах
 *   fx.render(ctx);  // рисовать поверх сцены
 *
 * Дополнительные опции:
 *   speed   — множитель скорости (1 по умолчанию)
 *   radius  — размер цели в пикселях (для щита, окаменения, заморозки)
 *   allies  — массив точек, только для 'lightning': эффект «баффа» на союзников
 */
(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const k01 = (t, start, len) => clamp((t - start) / len);
  const fade = (t, dur, len = 0.3) => clamp((dur - t) / len);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutBack = t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const sign = () => (Math.random() < 0.5 ? -1 : 1);

  function geom(o) {
    const a = o.from, b = o.to || o.from;
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    return { a, b, dx, dy, L, nx: -dy / L, ny: dx / L, ang: Math.atan2(dy, dx) };
  }

  /* ---------- общие рисовалки ---------- */

  function glowDot(ctx, x, y, r, color, a = 1) {
    if (r <= 0 || a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // Кольцо + искры в точке попадания. k: 0..1
  function impact(ctx, p, color, k, size = 50) {
    if (k <= 0 || k >= 1) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 8 * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * easeOut(k), 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.3;
      const r1 = size * (0.35 + 0.5 * k), r2 = size * (0.6 + 0.9 * k);
      ctx.lineWidth = 3 * (1 - k) + 0.5;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      ctx.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
    glowDot(ctx, p.x, p.y, size * 1.2, color, (1 - k) * 0.8);
  }

  function starPath(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.42 : r;
      const a = rot + (i / 10) * TAU - Math.PI / 2;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x + s * 0.9, y - s * 0.3, x + s * 0.45, y - s * 0.95, x, y - s * 0.4);
    ctx.bezierCurveTo(x - s * 0.45, y - s * 0.95, x - s * 0.9, y - s * 0.3, x, y + s * 0.35);
    ctx.closePath();
  }

  function plus(ctx, x, y, s) {
    ctx.fillRect(x - s, y - s * 0.3, s * 2, s * 0.6);
    ctx.fillRect(x - s * 0.3, y - s, s * 0.6, s * 2);
  }

  function polyline(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }

  /* ---------- 1. Рой летучих мышей ---------- */

  function drawBat(ctx, x, y, s, flap, ang) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (Math.cos(ang) < 0) ctx.scale(1, -1);
    const f = 0.35 + 0.65 * Math.abs(flap);
    const wing = dir => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.2, dir * s * f, -s * 0.9, dir * s * 1.1 * f);
      ctx.quadraticCurveTo(-s * 0.75, dir * s * 0.55 * f, -s * 0.6, dir * s * 0.5 * f);
      ctx.quadraticCurveTo(-s * 0.5, dir * s * 0.25 * f, -s * 0.35, dir * s * 0.3 * f);
      ctx.quadraticCurveTo(-s * 0.25, dir * s * 0.1, 0, dir * s * 0.1);
      ctx.closePath();
      ctx.fill();
    };
    wing(1);
    wing(-1);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.3, s * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.3, 0, s * 0.14, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.26, -s * 0.1);
    ctx.lineTo(s * 0.3, -s * 0.3);
    ctx.lineTo(s * 0.37, -s * 0.1);
    ctx.moveTo(s * 0.26, s * 0.1);
    ctx.lineTo(s * 0.3, s * 0.3);
    ctx.lineTo(s * 0.37, s * 0.1);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff4a6a';
    ctx.beginPath();
    ctx.arc(s * 0.36, -s * 0.04, s * 0.04, 0, TAU);
    ctx.arc(s * 0.36, s * 0.04, s * 0.04, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 2. Пузыри (замедление) ---------- */

  function bubble(ctx, x, y, r) {
    ctx.save();
    ctx.shadowColor = '#5cf';
    ctx.shadowBlur = 10;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(200,240,255,0.15)');
    g.addColorStop(0.75, 'rgba(90,170,255,0.25)');
    g.addColorStop(1, 'rgba(120,200,255,0.8)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,230,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.22, r * 0.13, -0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 3. Молнии ---------- */

  function bolt(a, b, jit, depth) {
    let pts = [a, b];
    for (let d = 0; d < depth; d++) {
      const n = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        const dx = q.x - p.x, dy = q.y - p.y;
        const l = Math.hypot(dx, dy) || 1;
        const off = rnd(-1, 1) * l * 0.35 * jit;
        n.push({ x: (p.x + q.x) / 2 - (dy / l) * off, y: (p.y + q.y) / 2 + (dx / l) * off }, q);
      }
      pts = n;
    }
    return pts;
  }

  /* ---------- 4. Снежинка ---------- */

  function snowflake(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, r * 0.12);
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * TAU);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      for (const f of [0.45, 0.72]) {
        ctx.moveTo(r * f, 0);
        ctx.lineTo(r * (f + 0.18), r * 0.2);
        ctx.moveTo(r * f, 0);
        ctx.lineTo(r * (f + 0.18), -r * 0.2);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- 5. Нота ---------- */

  function note(ctx, x, y, s, rot, double) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.4, -0.4, 0, TAU);
    ctx.fill();
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 0.48, -s * 0.1);
    ctx.lineTo(s * 0.48, -s * 1.7);
    ctx.stroke();
    if (!double) {
      ctx.beginPath();
      ctx.moveTo(s * 0.48, -s * 1.7);
      ctx.quadraticCurveTo(s * 1.3, -s * 1.3, s * 0.95, -s * 0.6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(s * 1.3, -s * 0.3, s * 0.55, s * 0.4, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 1.78, -s * 0.4);
      ctx.lineTo(s * 1.78, -s * 1.9);
      ctx.stroke();
      ctx.lineWidth = s * 0.3;
      ctx.beginPath();
      ctx.moveTo(s * 0.48, -s * 1.7);
      ctx.lineTo(s * 1.78, -s * 1.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 6. Призрак (для фото-вспышки) ---------- */

  function ghost(ctx, x, y, s, t) {
    ctx.beginPath();
    ctx.moveTo(x - s, y + s * 1.1);
    ctx.lineTo(x - s, y);
    ctx.bezierCurveTo(x - s, y - s * 1.3, x + s, y - s * 1.3, x + s, y);
    ctx.lineTo(x + s, y + s * 1.1);
    for (let i = 0; i < 3; i++) {
      const x1 = x + s - ((i + 1) * 2 * s) / 3;
      const xm = x + s - ((i + 0.5) * 2 * s) / 3;
      ctx.quadraticCurveTo(xm, y + s * (1.1 + (i % 2 ? -0.35 : 0.35) + 0.1 * Math.sin(t * 12 + i)), x1, y + s * 1.1);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ====================================================================
   *  ЭФФЕКТЫ
   *  dur — длительность (сек), hit — момент попадания (сек)
   * ==================================================================== */
  const EFFECTS = {};
  const LIST = [];
  function def(id, label, d) {
    EFFECTS[id] = d;
    LIST.push({ id, label });
  }

  /* --- Рой летучих мышей: сильный урон --- */
  def('bats', 'Рой летучих мышей', {
    dur: 1.8,
    hit: 1.0,
    init() {
      return {
        bats: Array.from({ length: 16 }, (_, i) => ({
          d: i * 0.03 + rnd(0, 0.1), ph: rnd(0, TAU), amp: rnd(18, 50), s: rnd(11, 17),
          lat: rnd(-26, 26), orb: rnd(26, 60), sp: rnd(4, 7) * sign()
        }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      ctx.fillStyle = '#1d0a2e';
      ctx.shadowColor = '#ff2bd6';
      ctx.shadowBlur = 12;
      for (const b of s.bats) {
        if (t < b.d) continue;
        const q = clamp((t - b.d) / 0.85);
        let x, y, ang;
        if (q < 1) {
          const e = easeInOut(q);
          const w = (Math.sin(q * TAU * 1.5 + b.ph) * b.amp + b.lat) * Math.sin(q * Math.PI) * sc;
          x = g.a.x + g.dx * e + g.nx * w;
          y = g.a.y + g.dy * e + g.ny * w;
          ang = g.ang + Math.cos(q * TAU * 1.5 + b.ph) * 0.5;
        } else {
          const th = b.ph + (t - b.d - 0.85) * b.sp;
          const sg = Math.sign(b.sp);
          x = g.b.x + Math.cos(th) * b.orb * sc;
          y = g.b.y + Math.sin(th) * b.orb * 0.6 * sc;
          ang = Math.atan2(0.6 * Math.cos(th) * sg, -Math.sin(th) * sg);
        }
        drawBat(ctx, x, y, b.s * sc, Math.sin(t * 30 + b.ph), ang);
      }
      ctx.shadowBlur = 0;
      impact(ctx, g.b, '#ff3fd0', k01(t, this.hit, 0.35), 55 * sc);
    }
  });

  /* --- Пузыри: замедление --- */
  def('bubbles', 'Пузыри (замедление)', {
    dur: 2.1,
    hit: 0.85,
    init() {
      return {
        b: Array.from({ length: 8 }, (_, i) => ({
          d: i * 0.09, r: rnd(9, 18), arc: rnd(30, 90) * sign(), ph: rnd(0, TAU),
          drops: Array.from({ length: 6 }, () => ({ a: rnd(0, TAU), v: rnd(40, 90), r: rnd(2, 4) }))
        }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.35);
      ctx.globalAlpha = fa;
      for (const b of s.b) {
        const q = (t - b.d) / 0.75;
        if (q < 0) continue;
        if (q < 1) {
          const e = easeInOut(q);
          const off = Math.sin(q * Math.PI) * b.arc * sc;
          const r = b.r * sc * (0.4 + 0.6 * Math.min(1, q * 4)) * (1 + 0.08 * Math.sin(t * 14 + b.ph));
          bubble(ctx, g.a.x + g.dx * e + g.nx * off, g.a.y + g.dy * e + g.ny * off, r);
        } else {
          const k = (q - 1) * 0.75, pk = clamp(k / 0.45);
          if (pk < 1) {
            ctx.save();
            ctx.globalAlpha = fa * (1 - pk);
            ctx.strokeStyle = '#bfe8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(g.b.x, g.b.y, b.r * sc * (1 + 2.2 * pk), 0, TAU);
            ctx.stroke();
            ctx.fillStyle = '#d9f3ff';
            for (const d of b.drops) {
              ctx.beginPath();
              ctx.arc(g.b.x + Math.cos(d.a) * d.v * k * sc, g.b.y + Math.sin(d.a) * d.v * k * sc, d.r * sc, 0, TAU);
              ctx.fill();
            }
            ctx.restore();
          }
        }
      }
      // аура замедления
      const ak = k01(t, this.hit, 0.3);
      if (ak > 0) {
        ctx.save();
        ctx.globalAlpha = fa * ak;
        ctx.strokeStyle = 'rgba(120,200,255,0.8)';
        ctx.lineWidth = 3 * sc;
        const pr = (40 + 6 * Math.sin(t * 5)) * sc;
        ctx.beginPath();
        ctx.ellipse(g.b.x, g.b.y + 30 * sc, pr * 1.4, pr * 0.45, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const th = t * 1.6 + (i / 5) * TAU;
          ctx.save();
          ctx.globalAlpha = fa * ak;
          bubble(ctx, g.b.x + Math.cos(th) * 42 * sc, g.b.y + Math.sin(th) * 20 * sc, (7 + (i % 3) * 2) * sc);
          ctx.restore();
        }
      }
    }
  });

  /* --- Вой: звуковые волны + когти --- */
  def('howl', 'Вой (звуковая волна)', {
    dur: 1.5,
    hit: 0.7,
    draw(ctx, t, o) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      glowDot(ctx, g.a.x, g.a.y, 40 * sc * (1 - k01(t, 0, 0.5) * 0.5), 'rgba(190,120,255,0.9)', k01(t, 0, 0.15) * (1 - k01(t, 0.5, 0.3)));
      for (let i = 0; i < 5; i++) {
        const q = k01(t, 0.05 + i * 0.09, 0.7);
        if (q <= 0 || q >= 1) continue;
        const r = lerp(20 * sc, g.L, easeOut(q));
        const sp = 0.25 + 0.2 * q;
        ctx.globalAlpha = fa * (1 - q) * 0.9;
        ctx.strokeStyle = i % 2 ? '#e7c2ff' : '#a64dff';
        ctx.lineWidth = (14 * (1 - q) + 2) * sc;
        ctx.beginPath();
        ctx.arc(g.a.x, g.a.y, r, g.ang - sp, g.ang + sp);
        ctx.stroke();
      }
      // три росчерка когтей на цели
      for (let i = 0; i < 3; i++) {
        const p = k01(t, 0.7 + i * 0.08, 0.18);
        if (p <= 0) continue;
        const al = fa * (1 - k01(t, 0.95 + i * 0.08, 0.3));
        const dirx = Math.cos(-0.9), diry = Math.sin(-0.9);
        const cx = g.b.x + (i - 1) * 18 * sc * -diry, cy = g.b.y + (i - 1) * 18 * sc * dirx;
        const sx = cx - dirx * 35 * sc, sy = cy - diry * 35 * sc;
        const ex = sx + dirx * 70 * sc * easeOut(p), ey = sy + diry * 70 * sc * easeOut(p);
        ctx.globalAlpha = al * 0.6;
        ctx.strokeStyle = '#b05cff';
        ctx.lineWidth = 10 * sc;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.globalAlpha = al;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3 * sc;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#d9a8ff', k01(t, 0.7, 0.4), 55 * sc);
    }
  });

  /* --- Молнии: урон по врагу или бафф союзников (опция allies) --- */
  def('lightning', 'Молнии', {
    dur: 1.3,
    hit: 0.35,
    init() { return { step: -1, cache: [] }; },
    draw(ctx, t, o, s) {
      const sc = o.scale || 1, a = o.from, fa = fade(t, this.dur, 0.3);
      const buff = !!(o.allies && o.allies.length);
      const targets = buff ? o.allies : [o.to || o.from];
      const step = Math.floor(t / 0.05);
      if (step !== s.step) {
        s.step = step;
        s.cache = targets.map(tg => {
          const main = bolt(a, tg, 1, 5);
          const br = [];
          for (let i = 0; i < 3; i++) {
            const p = main[(Math.random() * main.length) | 0];
            const an = rnd(0, TAU), len = rnd(30, 70) * sc;
            br.push(bolt(p, { x: p.x + Math.cos(an) * len, y: p.y + Math.sin(an) * len }, 1, 3));
          }
          const halo = Array.from({ length: 3 }, () => {
            const th = rnd(0, TAU), r = rnd(26, 40) * sc;
            return bolt(
              { x: tg.x + Math.cos(th) * r, y: tg.y + Math.sin(th) * r },
              { x: tg.x + Math.cos(th + 0.9) * r, y: tg.y + Math.sin(th + 0.9) * r }, 0.6, 3);
          });
          return { main, br, halo };
        });
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const pass = (w, col, al, fn) => {
        ctx.lineWidth = w * sc;
        ctx.strokeStyle = col;
        ctx.globalAlpha = al * fa;
        fn();
      };
      glowDot(ctx, a.x, a.y, 45 * sc, 'rgba(120,200,255,0.9)', k01(t, 0, 0.12) * (1 - k01(t, 0.6, 0.3)) * fa);
      const striking = t > 0.12 && t < 0.75;
      s.cache.forEach((c, i) => {
        const tg = targets[i];
        if (striking) {
          const fl = 0.6 + 0.4 * Math.random();
          pass(10, 'rgba(60,120,255,0.35)', fl, () => polyline(ctx, c.main));
          pass(4, '#6fd0ff', fl, () => { polyline(ctx, c.main); c.br.forEach(b => polyline(ctx, b)); });
          pass(1.6, '#ffffff', fl, () => polyline(ctx, c.main));
          glowDot(ctx, tg.x, tg.y, 40 * sc, 'rgba(150,220,255,0.9)', fl * fa);
        }
        if (t > 0.12) {
          const al = clamp((t - 0.12) / 0.15) * (buff ? 1 : 1 - k01(t, 0.7, 0.4));
          pass(2, '#bfe9ff', al * (0.6 + 0.4 * Math.random()), () => c.halo.forEach(h => polyline(ctx, h)));
        }
        if (buff && t > 0.4) {
          ctx.globalAlpha = fa * clamp((t - 0.4) / 0.2);
          ctx.strokeStyle = '#ffe97a';
          ctx.lineWidth = 3 * sc;
          for (let j = 0; j < 3; j++) {
            const cyc = (t * 1.2 + j / 3) % 1;
            const cy = tg.y - 20 * sc - cyc * 55 * sc;
            ctx.save();
            ctx.globalAlpha *= Math.sin(cyc * Math.PI);
            ctx.beginPath();
            ctx.moveTo(tg.x - 10 * sc, cy + 6 * sc);
            ctx.lineTo(tg.x, cy - 4 * sc);
            ctx.lineTo(tg.x + 10 * sc, cy + 6 * sc);
            ctx.stroke();
            ctx.restore();
          }
        }
      });
      ctx.globalAlpha = 1;
      if (!buff) impact(ctx, targets[0], '#8fdcff', k01(t, this.hit, 0.35), 45 * sc);
    }
  });

  /* --- Сердечки: средний урон --- */
  def('hearts', 'Сердечки', {
    dur: 1.9,
    hit: 1.0,
    init() {
      return {
        h: Array.from({ length: 12 }, (_, i) => ({
          d: i * 0.06, s: rnd(8, 16), arc: rnd(30, 90) * sign(), ph: rnd(0, TAU), a: rnd(0, TAU),
          col: Math.random() < 0.5 ? '#ff4fa3' : '#ff8ac6'
        }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      ctx.shadowColor = '#ff3d9a';
      ctx.shadowBlur = 14;
      for (const h of s.h) {
        const q = (t - h.d) / 0.85;
        if (q < 0) continue;
        ctx.fillStyle = h.col;
        if (q < 1) {
          const e = easeInOut(q);
          const off = (Math.sin(q * Math.PI) * h.arc + Math.sin(q * TAU * 2 + h.ph) * 8) * sc;
          const x = g.a.x + g.dx * e + g.nx * off;
          const y = g.a.y + g.dy * e + g.ny * off - Math.sin(q * Math.PI) * 20 * sc;
          heartPath(ctx, x, y, h.s * sc * (0.3 + 0.7 * Math.min(1, q * 3)) * (1 + 0.1 * Math.sin(t * 16 + h.ph)));
          ctx.fill();
        } else {
          const k = clamp(((q - 1) * 0.85) / 0.4);
          if (k < 1) {
            ctx.save();
            ctx.globalAlpha = fa * (1 - k);
            heartPath(ctx, g.b.x + Math.cos(h.a) * 30 * k * sc, g.b.y + Math.sin(h.a) * 30 * k * sc - 10 * k * sc, h.s * 0.5 * sc);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      // большое сердце в момент попадания
      const bk = k01(t, this.hit, 0.5);
      if (bk > 0 && bk < 1) {
        ctx.globalAlpha = fa * (1 - bk);
        ctx.fillStyle = '#ff5fae';
        heartPath(ctx, g.b.x, g.b.y - 10 * sc, 40 * sc * (0.3 + 0.9 * easeOut(bk)));
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#ff6ab8', k01(t, this.hit, 0.4), 50 * sc);
    }
  });

  /* --- Щит и лечение: ставится на точку `to` (союзник) --- */
  def('shield', 'Щит и лечение', {
    dur: 2.3,
    hit: 0.45,
    draw(ctx, t, o) {
      const c = o.to || o.from, sc = o.scale || 1, R = (o.radius || 60) * sc, fa = fade(t, this.dur, 0.45);
      const r = R * Math.max(easeOutBack(k01(t, 0, 0.5)), 0);
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = fa;
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      g.addColorStop(0, 'rgba(255,230,120,0.05)');
      g.addColorStop(0.8, 'rgba(255,200,60,0.22)');
      g.addColorStop(1, 'rgba(255,230,140,0.7)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.lineWidth = 3 * sc;
      ctx.strokeStyle = '#ffe27a';
      ctx.shadowColor = '#ffcf3d';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // вращающийся шестиугольник
      ctx.save();
      ctx.rotate(t * 0.8);
      ctx.strokeStyle = 'rgba(255,240,170,0.7)';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        const px = Math.cos(a) * r * 0.72, py = Math.sin(a) * r * 0.72;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      // метки по ободу
      ctx.save();
      ctx.rotate(-t * 0.5);
      ctx.strokeStyle = 'rgba(255,235,150,0.85)';
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU, r1 = r * 0.88, r2 = r * (i % 3 ? 0.94 : 1.0);
        ctx.lineWidth = (i % 3 ? 1.5 : 2.5) * sc;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.restore();
      // лучи внутри
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.rotate(t * 0.3);
      ctx.fillStyle = 'rgba(255,220,100,0.12)';
      for (let i = 0; i < 6; i++) {
        ctx.rotate(TAU / 6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r * 0.7, -r * 0.08);
        ctx.lineTo(r * 0.7, r * 0.08);
        ctx.fill();
      }
      ctx.restore();
      // волна лечения
      const pk = k01(t, this.hit, 0.6);
      if (pk > 0 && pk < 1) {
        ctx.globalAlpha = fa * (1 - pk);
        ctx.strokeStyle = '#9dffb5';
        ctx.lineWidth = 5 * (1 - pk) * sc;
        ctx.beginPath();
        ctx.arc(0, 0, r * (1 + 0.5 * pk), 0, TAU);
        ctx.stroke();
      }
      // плюсики
      ctx.fillStyle = '#9dffb5';
      ctx.shadowColor = '#4dff8a';
      ctx.shadowBlur = 8;
      for (let i = 0; i < 7; i++) {
        const cyc = (t * 0.9 + i / 7) % 1;
        ctx.globalAlpha = fa * Math.sin(cyc * Math.PI) * clamp((t - this.hit) / 0.2);
        plus(ctx, Math.sin(i * 2.3) * r * 0.7, r * 0.6 - cyc * r * 1.5, (5 + (i % 3) * 2) * sc);
      }
    }
  });

  /* --- Мелодия: ноты на волнистом нотном стане --- */
  def('notes', 'Мелодия (ноты)', {
    dur: 1.9,
    hit: 1.1,
    init() {
      const cols = ['#ff6ad5', '#7df9ff', '#ffffff', '#ffd36a'];
      return {
        n: Array.from({ length: 9 }, (_, i) => ({
          d: i * 0.1, s: rnd(7, 11), pitch: rnd(-9, 9), dbl: Math.random() < 0.35, col: cols[i % cols.length],
          a: rnd(0, TAU), ph: rnd(0, TAU)
        }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, fa = fade(t, this.dur, 0.3);
      const wave = q => Math.sin(q * TAU * 2) * 28 * sc * Math.sin(q * Math.PI * 0.9 + 0.1);
      ctx.globalAlpha = fa;
      // нотный стан
      const sk = k01(t, 0, 0.9);
      ctx.strokeStyle = 'rgba(255,200,255,0.4)';
      ctx.lineWidth = 1.5;
      for (let l = -2; l <= 2; l++) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const q = (i / 24) * sk;
          const off = wave(q) + l * 4 * sc;
          const x = g.a.x + g.dx * q + g.nx * off, y = g.a.y + g.dy * q + g.ny * off;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 12;
      for (const n of s.n) {
        const q = (t - n.d) / 0.9;
        if (q < 0) continue;
        ctx.fillStyle = ctx.strokeStyle = n.col;
        ctx.shadowColor = n.col;
        if (q < 1) {
          const off = wave(q) + n.pitch * sc;
          const x = g.a.x + g.dx * q + g.nx * off, y = g.a.y + g.dy * q + g.ny * off;
          note(ctx, x, y, n.s * sc * (0.4 + 0.6 * Math.min(1, q * 4)), Math.sin(q * TAU + n.ph) * 0.3, n.dbl);
        } else {
          const k = clamp(((q - 1) * 0.9) / 0.4);
          if (k < 1) {
            ctx.save();
            ctx.globalAlpha = fa * (1 - k);
            starPath(ctx, g.b.x + Math.cos(n.a) * 32 * k * sc, g.b.y + Math.sin(n.a) * 32 * k * sc, 5 * sc, k * 3);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#ff8ae6', k01(t, this.hit, 0.4), 50 * sc);
    }
  });

  /* --- Окаменение: взгляд, кристаллы, трещины --- */
  def('petrify', 'Окаменение', {
    dur: 2.2,
    hit: 0.7,
    init() {
      return {
        shards: Array.from({ length: 8 }, (_, i) => ({
          x: rnd(-0.9, 0.9), h: rnd(0.8, 1.8), w: rnd(0.22, 0.4), d: 0.65 + i * 0.05
        })),
        cracks: Array.from({ length: 6 }, () => {
          let an = rnd(0, TAU), x = 0, y = 0;
          const pts = [{ x, y }];
          for (let i = 0; i < 3; i++) {
            an += rnd(-0.6, 0.6);
            x += Math.cos(an) * rnd(0.2, 0.4);
            y += Math.sin(an) * rnd(0.2, 0.4);
            pts.push({ x, y });
          }
          return pts;
        }),
        dust: Array.from({ length: 10 }, () => ({ x: rnd(-1, 1), v: rnd(0.3, 0.8), r: rnd(3, 7), d: rnd(0.8, 1.3) }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, R = (o.radius || 45) * sc, fa = fade(t, this.dur, 0.4);
      ctx.globalAlpha = fa;
      // луч взгляда
      const bk = k01(t, 0, 0.35), be = 1 - k01(t, 0.55, 0.25);
      if (bk > 0 && be > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fa * be;
        const gr = ctx.createLinearGradient(g.a.x, g.a.y, g.b.x, g.b.y);
        gr.addColorStop(0, 'rgba(200,170,255,0.9)');
        gr.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.strokeStyle = gr;
        ctx.lineCap = 'round';
        ctx.lineWidth = (4 + 8 * bk) * sc;
        ctx.beginPath();
        ctx.moveTo(g.a.x, g.a.y);
        ctx.lineTo(g.a.x + g.dx * easeOut(bk), g.a.y + g.dy * easeOut(bk));
        ctx.stroke();
        ctx.restore();
        glowDot(ctx, g.a.x, g.a.y, 30 * sc, 'rgba(210,180,255,0.9)', fa * be);
      }
      // каменная оболочка
      const sk = k01(t, 0.6, 0.6);
      if (sk > 0) {
        ctx.save();
        ctx.translate(g.b.x, g.b.y);
        ctx.fillStyle = `rgba(150,148,170,${0.55 * sk})`;
        ctx.strokeStyle = `rgba(60,55,80,${0.8 * sk})`;
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 0.6, R * 0.95, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = `rgba(40,35,55,${0.9 * sk})`;
        ctx.lineWidth = 1.6 * sc;
        const ck = k01(t, 0.9, 0.5);
        s.cracks.forEach(cr => {
          const n = Math.max(2, Math.ceil(cr.length * ck));
          ctx.beginPath();
          cr.slice(0, n).forEach((p, i) => (i ? ctx.lineTo(p.x * R, p.y * R) : ctx.moveTo(p.x * R, p.y * R)));
          ctx.stroke();
        });
        ctx.restore();
      }
      // кристаллы из земли
      const by = g.b.y + R * 0.9;
      s.shards.forEach(sh => {
        const gk = easeOutBack(k01(t, sh.d, 0.4));
        if (gk <= 0) return;
        const bx = g.b.x + sh.x * R, h = sh.h * R * gk, w = sh.w * R;
        const gr = ctx.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
        gr.addColorStop(0, '#d6d3e6');
        gr.addColorStop(0.5, '#8c88a6');
        gr.addColorStop(1, '#4a4660');
        ctx.fillStyle = gr;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - w / 2, by);
        ctx.lineTo(bx - w * 0.35, by - h * 0.6);
        ctx.lineTo(bx, by - h);
        ctx.lineTo(bx + w * 0.4, by - h * 0.5);
        ctx.lineTo(bx + w / 2, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      // пыль
      ctx.fillStyle = 'rgba(170,165,190,0.5)';
      s.dust.forEach(d => {
        const k = k01(t, d.d, 0.8);
        if (k <= 0 || k >= 1) return;
        ctx.save();
        ctx.globalAlpha = fa * (1 - k) * 0.6;
        ctx.beginPath();
        ctx.arc(g.b.x + d.x * R, by - k * d.v * R * 2, d.r * sc * (1 + k), 0, TAU);
        ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#cfc6ff', k01(t, this.hit, 0.35), 45 * sc);
    }
  });

  /* --- Заморозка: снежинки, ледяной блок, иней --- */
  def('freeze', 'Заморозка', {
    dur: 2.1,
    hit: 0.7,
    init() {
      return {
        f: Array.from({ length: 7 }, (_, i) => ({ d: i * 0.07, r: rnd(8, 14), arc: rnd(-30, 30), rs: rnd(-6, 6) })),
        sp: Array.from({ length: 12 }, () => ({ a: rnd(0, TAU), v: rnd(0.8, 1.5), r: rnd(2, 4) }))
      };
    },
    draw(ctx, t, o, s) {
      const g = geom(o), sc = o.scale || 1, R = (o.radius || 45) * sc, fa = fade(t, this.dur, 0.4);
      ctx.globalAlpha = fa;
      ctx.strokeStyle = '#d6f4ff';
      ctx.shadowColor = '#7fd4ff';
      ctx.shadowBlur = 10;
      for (const f of s.f) {
        const q = (t - f.d) / 0.55;
        if (q < 0 || q > 1) continue;
        const e = easeInOut(q), off = Math.sin(q * Math.PI) * f.arc * sc;
        snowflake(ctx, g.a.x + g.dx * e + g.nx * off, g.a.y + g.dy * e + g.ny * off, f.r * sc, t * f.rs);
      }
      ctx.shadowBlur = 0;
      const k = k01(t, this.hit - 0.1, 0.5);
      if (k > 0) {
        const e = Math.max(easeOutBack(k), 0);
        // иней на земле
        ctx.save();
        ctx.globalAlpha = fa * 0.6;
        ctx.fillStyle = 'rgba(170,225,255,0.5)';
        ctx.strokeStyle = 'rgba(230,248,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(g.b.x, g.b.y + R * 0.8, R * 1.5 * e, R * 0.45 * e, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // большая снежинка за блоком
        ctx.save();
        ctx.globalAlpha = fa * 0.5 * k;
        ctx.strokeStyle = '#eaf9ff';
        snowflake(ctx, g.b.x, g.b.y, R * 1.5 * e, t * 0.5);
        ctx.restore();
        // ледяной блок
        ctx.save();
        ctx.translate(g.b.x, g.b.y + R * 0.1);
        ctx.scale(e, e);
        const gr = ctx.createLinearGradient(0, -R * 1.2, 0, R * 1.1);
        gr.addColorStop(0, 'rgba(200,240,255,0.55)');
        gr.addColorStop(1, 'rgba(90,170,230,0.55)');
        ctx.fillStyle = gr;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.5 * sc;
        ctx.beginPath();
        ctx.moveTo(0, -R * 1.2);
        ctx.lineTo(R * 0.8, -R * 0.6);
        ctx.lineTo(R * 0.8, R * 0.8);
        ctx.lineTo(0, R * 1.15);
        ctx.lineTo(-R * 0.8, R * 0.8);
        ctx.lineTo(-R * 0.8, -R * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.moveTo(-R * 0.55, -R * 0.4); ctx.lineTo(-R * 0.55, R * 0.3);
        ctx.moveTo(-R * 0.35, -R * 0.65); ctx.lineTo(-R * 0.1, -R * 0.85);
        ctx.moveTo(0, -R * 1.2); ctx.lineTo(0, 1.15 * R);
        ctx.stroke();
        ctx.restore();
        // ледяные шипы
        ctx.fillStyle = 'rgba(210,245,255,0.85)';
        for (let i = 0; i < 6; i++) {
          const bx = g.b.x + (i - 2.5) * R * 0.32, h = R * (0.35 + 0.25 * ((i * 7) % 3)) * e;
          ctx.beginPath();
          ctx.moveTo(bx - R * 0.1, g.b.y + R * 0.95);
          ctx.lineTo(bx, g.b.y + R * 0.95 - h);
          ctx.lineTo(bx + R * 0.1, g.b.y + R * 0.95);
          ctx.fill();
        }
        // искры
        ctx.fillStyle = '#fff';
        for (const p of s.sp) {
          const pk = (t * p.v) % 1;
          ctx.save();
          ctx.globalAlpha = fa * Math.sin(pk * Math.PI);
          starPath(ctx, g.b.x + Math.cos(p.a) * R * 1.2, g.b.y + Math.sin(p.a) * R * 1.2 - pk * 15, p.r * sc, pk * 4);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      impact(ctx, g.b, '#9fe0ff', k01(t, this.hit, 0.35), 45 * sc);
    }
  });

  /* --- Фото-вспышка: призрак, вспышка, звёзды оглушения --- */
  def('flash', 'Фото-вспышка (оглушение)', {
    dur: 2.0,
    hit: 0.9,
    draw(ctx, t, o) {
      const g = geom(o), sc = o.scale || 1, R = (o.radius || 45) * sc, fa = fade(t, this.dur, 0.3);
      ctx.globalAlpha = fa;
      // вспышка у атакующего
      const fk = k01(t, 0.15, 0.35);
      if (fk > 0 && fk < 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fa * (1 - fk);
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          ctx.lineWidth = (i % 2 ? 2 : 4) * sc;
          ctx.beginPath();
          ctx.moveTo(g.a.x + Math.cos(a) * 12 * sc, g.a.y + Math.sin(a) * 12 * sc);
          ctx.lineTo(g.a.x + Math.cos(a) * (30 + 40 * fk) * sc, g.a.y + Math.sin(a) * (30 + 40 * fk) * sc);
          ctx.stroke();
        }
        ctx.restore();
        glowDot(ctx, g.a.x, g.a.y, 55 * sc, 'rgba(255,255,255,1)', 1 - fk);
      }
      // призрак летит к цели + шлейф
      for (let i = 3; i >= 0; i--) {
        const q = clamp((t - 0.3 - i * 0.04) / 0.65);
        if (q <= 0 || q >= 1) continue;
        const e = easeInOut(q);
        const off = Math.sin(q * TAU) * 14 * sc;
        const x = g.a.x + g.dx * e + g.nx * off, y = g.a.y + g.dy * e + g.ny * off;
        ctx.save();
        ctx.globalAlpha = fa * (i === 0 ? 0.8 : 0.2) * (1 - q * 0.3);
        ctx.shadowColor = '#c9a6ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#e6d8ff';
        const gs = (14 + 14 * q) * sc;
        ghost(ctx, x, y, gs, t);
        if (i === 0) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#3a2260';
          ctx.beginPath();
          ctx.ellipse(x - gs * 0.35, y - gs * 0.1, gs * 0.14, gs * 0.2, 0, 0, TAU);
          ctx.ellipse(x + gs * 0.35, y - gs * 0.1, gs * 0.14, gs * 0.2, 0, 0, TAU);
          ctx.ellipse(x, y + gs * 0.35, gs * 0.16, gs * 0.22, 0, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      // вспышка на цели
      const hk = k01(t, this.hit, 0.4);
      if (hk > 0 && hk < 1) {
        glowDot(ctx, g.b.x, g.b.y, 120 * sc, 'rgba(255,255,255,1)', 1 - hk);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fa * (1 - hk);
        ctx.fillStyle = '#fff';
        starPath(ctx, g.b.x, g.b.y, 70 * sc * (0.4 + hk), hk * 2);
        ctx.fill();
        ctx.restore();
      }
      impact(ctx, g.b, '#e6d8ff', k01(t, this.hit, 0.4), 50 * sc);
      // звёзды оглушения
      const sk = k01(t, this.hit + 0.05, 0.25);
      if (sk > 0) {
        const cx = g.b.x, cy = g.b.y - R * 1.1;
        for (let i = 0; i < 3; i++) {
          const th = t * 4 + (i / 3) * TAU;
          const depth = 0.75 + 0.25 * Math.sin(th);
          ctx.save();
          ctx.globalAlpha = fa * sk;
          ctx.fillStyle = '#ffe14d';
          ctx.shadowColor = '#ffb800';
          ctx.shadowBlur = 8;
          starPath(ctx, cx + Math.cos(th) * 28 * sc, cy + Math.sin(th) * 9 * sc, 8 * sc * depth, t * 3 + i);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  });

  /* ====================================================================
   *  Движок
   * ==================================================================== */
  class AttackFX {
    constructor() {
      this.active = [];
    }

    /** Запустить эффект. Возвращает {cancel()}. */
    play(name, opts = {}) {
      const d = EFFECTS[name];
      if (!d) throw new Error('AttackFX: неизвестный эффект «' + name + '». Доступно: ' + Object.keys(EFFECTS).join(', '));
      if (!opts.from) throw new Error('AttackFX: нужна точка from');
      const o = Object.assign({ scale: 1, speed: 1 }, opts);
      if (!o.to) o.to = o.from;
      const inst = { d, o, t: 0, s: d.init ? d.init(o) : {}, hit: false, dead: false };
      this.active.push(inst);
      return { cancel() { inst.dead = true; } };
    }

    update(dt) {
      dt = Math.min(dt, 0.05);
      for (const i of this.active) {
        i.t += dt * i.o.speed;
        if (!i.hit && i.t >= i.d.hit) {
          i.hit = true;
          if (i.o.onHit) i.o.onHit();
        }
        if (i.t >= i.d.dur) {
          i.dead = true;
          if (i.o.onEnd) i.o.onEnd();
        }
      }
      this.active = this.active.filter(i => !i.dead);
    }

    render(ctx) {
      for (const i of this.active) {
        ctx.save();
        i.d.draw(ctx, i.t, i.o, i.s);
        ctx.restore();
      }
    }

    clear() { this.active.length = 0; }
  }

  AttackFX.list = LIST;
  AttackFX.durations = Object.fromEntries(Object.entries(EFFECTS).map(([k, v]) => [k, v.dur]));

  // Регистрация дополнительных эффектов из других файлов (например, bestiary.js)
  AttackFX.extra = [];
  AttackFX.register = function (id, label, d) {
    EFFECTS[id] = d;
    AttackFX.extra.push({ id, label });
    AttackFX.durations[id] = d.dur;
  };
  AttackFX.util = {
    TAU, rnd, lerp, clamp, k01, fade, easeOut, easeInOut, easeOutBack, sign,
    geom, glowDot, impact, starPath, heartPath, plus, polyline, bolt, snowflake
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AttackFX;
  global.AttackFX = AttackFX;
})(typeof window !== 'undefined' ? window : globalThis);
