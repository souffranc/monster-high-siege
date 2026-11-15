/*
 * Экран «Бестиарий» — галерея мобов и боссов из bestiary.js.
 * Подключать после effects.js и bestiary.js, до app.js.
 *
 *   BestiaryView.open('ghostQueen');  // открыть на конкретном существе
 *   BestiaryView.close();             // остановить рендер при уходе с экрана
 */
(function (global) {
  'use strict';

  const canvas = document.getElementById('bestiary-canvas');
  if (!canvas) return;
  const cx = canvas.getContext('2d');
  const W = 960, H = 440, GROUND = 372;
  const TAU = Math.PI * 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const FXLib = global.AttackFX, LIB = global.Bestiary;
  const fx = typeof FXLib === 'function' ? new FXLib() : null;
  const hero = { x: 215, y: 318, gy: GROUND };

  let type = 'slime', mon = null, walking = true, queue = null;
  let raf = 0, last = 0, statTick = 0, ready = false, drag = false;

  const $ = id => document.getElementById(id);

  const stars = Array.from({ length: 46 }, (_, i) => ({
    x: (i * 149) % W,
    y: (i * 71) % 240,
    r: .8 + (i % 3) * .6,
    a: .18 + (i % 4) * .14
  }));

  function chip(text, cls) {
    const b = document.createElement('button');
    b.className = 'chip' + (cls ? ' ' + cls : '');
    b.textContent = text;
    return b;
  }

  function show(id) {
    if (!LIB || !LIB.types[id]) return;
    const T = LIB.types[id];
    type = id;
    mon = new LIB.Monster(id, { x: 705, y: GROUND, face: -1, scale: T.boss ? .86 : 1.15, fx });
    if (fx) fx.clear();
    walking = true;
    queue = null;
    $('bestiary-walk').textContent = 'ХОДЬБА: ВКЛ';
    $('bestiary-walk').classList.add('on');
    $('bestiary-rage').textContent = 'ЯРОСТЬ: ВЫКЛ';
    $('bestiary-rage').classList.remove('on');
    document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('on', b.dataset.type === id));
    $('bestiary-name').textContent = T.label;
    $('bestiary-kind').textContent = T.boss ? 'БОСС ЛОКАЦИИ' : 'ОБЫЧНЫЙ ПРОТИВНИК';
    buildAbilities();
    updateStats();
  }

  function buildAbilities() {
    const box = $('bestiary-abilities');
    box.innerHTML = '';
    ((mon && mon.T.abilities) || []).forEach(ab => {
      const b = chip(ab.label, 'act');
      b.title = ab.desc;
      b.onclick = () => cast(ab);
      box.appendChild(b);
    });
  }

  function cast(ab) {
    if (!mon || mon.dead) return;
    mon.cast(ab.id, hero, {});
  }

  function updateStats() {
    if (!mon) return;
    const T = mon.T;
    const pct = Math.max(0, mon.hp / mon.maxHp * 100);
    $('bestiary-stats').innerHTML =
      `<span class="bestiary-bar"><i style="width:${pct.toFixed(1)}%"></i></span>` +
      `<span><small>ЗДОРОВЬЕ</small><b>${Math.round(mon.hp)} / ${mon.maxHp}</b></span>` +
      `<span><small>УРОН</small><b>${mon.damage}</b></span>` +
      `<span><small>СКОРОСТЬ</small><b>${T.speed}</b></span>` +
      `<span><small>РОСТ</small><b>${T.h}</b></span>` +
      `<span><small>СПОСОБНОСТИ</small><b>${(T.abilities || []).length}</b></span>`;
  }

  function drawScene() {
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#140624');
    g.addColorStop(.58, '#25113a');
    g.addColorStop(1, '#180a26');
    cx.fillStyle = g;
    cx.fillRect(0, 0, W, H);

    cx.save();
    cx.globalAlpha = .45;
    cx.fillStyle = '#ffe6ff';
    cx.shadowColor = '#ff6ad5';
    cx.shadowBlur = 70;
    cx.beginPath();
    cx.arc(800, 74, 38, 0, TAU);
    cx.fill();
    cx.restore();

    for (const s of stars) {
      cx.globalAlpha = s.a;
      cx.fillStyle = '#fff';
      cx.fillRect(s.x, s.y, s.r, s.r);
    }
    cx.globalAlpha = 1;

    cx.fillStyle = 'rgba(92,45,120,.35)';
    for (let i = 0; i < 7; i++) {
      const bx = 36 + i * 145, bh = 62 + (i % 3) * 40;
      cx.beginPath();
      cx.moveTo(bx, GROUND);
      cx.lineTo(bx, GROUND - bh + 16);
      cx.quadraticCurveTo(bx, GROUND - bh, bx + 22, GROUND - bh);
      cx.quadraticCurveTo(bx + 44, GROUND - bh, bx + 44, GROUND - bh + 16);
      cx.lineTo(bx + 44, GROUND);
      cx.closePath();
      cx.fill();
    }

    cx.fillStyle = '#150a21';
    cx.fillRect(0, GROUND, W, H - GROUND);
    cx.strokeStyle = 'rgba(255,134,220,.4)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(0, GROUND);
    cx.lineTo(W, GROUND);
    cx.stroke();
    cx.strokeStyle = 'rgba(255,134,220,.12)';
    cx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      cx.beginPath();
      cx.moveTo(0, GROUND + i * 15);
      cx.lineTo(W, GROUND + i * 15);
      cx.stroke();
    }
  }

  function drawHero() {
    cx.save();
    cx.fillStyle = 'rgba(0,0,0,.35)';
    cx.beginPath();
    cx.ellipse(hero.x, hero.y + 34, 30, 9, 0, 0, TAU);
    cx.fill();
    cx.strokeStyle = 'rgba(128,231,239,.5)';
    cx.setLineDash([6, 7]);
    cx.lineWidth = 2;
    cx.beginPath();
    cx.arc(hero.x, hero.y, 44, 0, TAU);
    cx.stroke();
    cx.setLineDash([]);
    cx.fillStyle = '#2b5d93';
    cx.strokeStyle = '#80e7ef';
    cx.lineWidth = 3;
    cx.shadowColor = '#80e7ef';
    cx.shadowBlur = 16;
    cx.beginPath();
    cx.arc(hero.x, hero.y, 27, 0, TAU);
    cx.fill();
    cx.stroke();
    cx.shadowBlur = 0;
    cx.fillStyle = '#dff4ff';
    cx.font = 'bold 11px system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText('ГЕРОЙ', hero.x, hero.y);
    cx.restore();
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0);
    last = now;
    if (mon) {
      if (walking && !mon.busy) {
        if (mon.x < 560) { mon.face = 1; mon.walk(1); }
        else if (mon.x > 840) { mon.face = -1; mon.walk(-1); }
        else if (!mon.moving) mon.walk(mon.face);
      } else if (!mon.busy) mon.walk(0);
      if (queue && queue.length && !mon.busy && (!fx || !fx.active.length)) cast(queue.shift());
      mon.target = hero;
      mon.update(dt);
    }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene();
    if (mon) mon.draw(cx);
    drawHero();
    if (fx) {
      fx.update(dt);
      fx.render(cx);
    }
    statTick += dt;
    if (statTick > .12) {
      statTick = 0;
      updateStats();
    }
    raf = requestAnimationFrame(frame);
  }

  function toLocal(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (W / r.width), y: (ev.clientY - r.top) * (H / r.height) };
  }

  canvas.addEventListener('pointerdown', ev => {
    const p = toLocal(ev);
    if (Math.hypot(p.x - hero.x, p.y - hero.y) < 46) {
      drag = true;
      canvas.setPointerCapture(ev.pointerId);
      return;
    }
    hero.x = Math.max(70, Math.min(W - 70, p.x));
    hero.y = Math.max(190, Math.min(GROUND - 24, p.y));
  });
  canvas.addEventListener('pointermove', ev => {
    if (!drag) return;
    const p = toLocal(ev);
    hero.x = Math.max(70, Math.min(W - 70, p.x));
    hero.y = Math.max(190, Math.min(GROUND - 24, p.y));
  });
  canvas.addEventListener('pointerup', () => { drag = false; });

  function init() {
    ready = true;
    const mobs = $('bestiary-mobs'), bosses = $('bestiary-bosses');
    if (!LIB) {
      $('bestiary-name').textContent = 'Бестиарий недоступен';
      $('bestiary-kind').textContent = 'НЕ ЗАГРУЗИЛСЯ MOBS/BESTIARY.JS';
      return;
    }
    LIB.list.forEach(item => {
      const b = chip(item.label, item.boss ? 'boss' : '');
      b.dataset.type = item.id;
      b.onclick = () => show(item.id);
      (item.boss ? bosses : mobs).appendChild(b);
    });

    $('bestiary-hurt').onclick = () => {
      if (!mon || mon.dead) return;
      mon.hurt(Math.max(1, Math.round(mon.maxHp * .1)));
      updateStats();
    };
    $('bestiary-die').onclick = () => { if (mon) mon.die(); };
    $('bestiary-revive').onclick = () => { if (mon) { mon.revive(); updateStats(); } };
    $('bestiary-walk').onclick = e => {
      walking = !walking;
      e.target.classList.toggle('on', walking);
      e.target.textContent = 'ХОДЬБА: ' + (walking ? 'ВКЛ' : 'ВЫКЛ');
      if (!walking && mon) mon.walk(0);
    };
    $('bestiary-rage').onclick = e => {
      if (!mon) return;
      mon.enrage(!mon.enraged);
      e.target.classList.toggle('on', mon.enraged);
      e.target.textContent = 'ЯРОСТЬ: ' + (mon.enraged ? 'ВКЛ' : 'ВЫКЛ');
    };
    $('bestiary-all').onclick = () => {
      if (!mon) return;
      queue = (mon.T.abilities || []).slice();
    };

    show(type);
  }

  function open(id) {
    if (!ready) init();
    if (id) show(id);
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function close() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    drag = false;
    if (fx) fx.clear();
  }

  global.BestiaryView = { open, close, show };
})(window);
