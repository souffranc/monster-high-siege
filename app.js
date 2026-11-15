(() => {
  'use strict';
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const HEROES = [{
      id: 'draculaura',
      name: 'Дракулаура',
      role: 'УРОН · ВАМПИР',
      cost: 95,
      hp: 160,
      damage: 34,
      range: 145,
      rate: 1.15,
      color: '#ff4fa3',
      desc: 'Рой летучих мышей наносит высокий урон одиночной цели.',
      special: 'БАТ-ШТОРМ',
      specialDesc: 'Призывает стаю мышей, которая атакует всех врагов рядом.',
      kind: 'bat'
    },
    {
      id: 'lagoona',
      name: 'Лагуна',
      role: 'КОНТРОЛЬ · ВОДА',
      cost: 90,
      hp: 190,
      damage: 15,
      range: 155,
      rate: 1.0,
      color: '#57d9e8',
      desc: 'Пузырьки наносят урон и замедляют противников.',
      special: 'ПУЗЫРЬКОВАЯ ВОЛНА',
      specialDesc: 'Замедляет всех врагов на поле на 5 секунд.',
      kind: 'bubble'
    },
    {
      id: 'clawdeen',
      name: 'Клодин',
      role: 'УРОН ПО ОБЛАСТИ',
      cost: 105,
      hp: 200,
      damage: 24,
      range: 130,
      rate: 1.35,
      color: '#c18bff',
      desc: 'Мощный вой задевает несколько противников.',
      special: 'ЛУННЫЙ ВОЙ',
      specialDesc: 'Оглушает и повреждает врагов вокруг героини.',
      kind: 'howl'
    },
    {
      id: 'frankie',
      name: 'Фрэнки',
      role: 'ПОДДЕРЖКА · ЭЛЕКТРИЧЕСТВО',
      cost: 115,
      hp: 220,
      damage: 18,
      range: 150,
      rate: 1.1,
      color: '#a8f36a',
      desc: 'Молнии бьют врагов, а союзники рядом получают бонус к урону.',
      special: 'ПЕРЕЗАРЯДКА',
      specialDesc: 'Усиливает всех героинь на поле на 8 секунд.',
      kind: 'zap'
    },
    {
      id: 'kiyomi',
      name: 'Киёми',
      role: 'ДАЛЬНИЙ УРОН',
      cost: 100,
      hp: 150,
      damage: 23,
      range: 180,
      rate: 1.0,
      color: '#e7a8ff',
      desc: 'Магические сердечки летят далеко и метят цель.',
      special: 'СЕРДЦЕЕД',
      specialDesc: 'Выпускает веер усиленных сердечек по нескольким целям.',
      kind: 'heart'
    },
    {
      id: 'bonita',
      name: 'Бонита',
      role: 'ПОДДЕРЖКА · БАФФЫ',
      cost: 110,
      hp: 185,
      damage: 8,
      range: 120,
      rate: 1.5,
      color: '#f5b8d5',
      desc: 'Крылатая пыльца ускоряет атаки ближайших героинь.',
      special: 'КРЫЛЬЯ УДАЧИ',
      specialDesc: 'Даёт ближайшим союзницам щит и ускорение атак.',
      kind: 'fairy'
    },
    {
      id: 'catty',
      name: 'Кэтти',
      role: 'УРОН ПО ОБЛАСТИ · МУЗЫКА',
      cost: 120,
      hp: 175,
      damage: 19,
      range: 150,
      rate: 1.2,
      color: '#ff72d2',
      desc: 'Музыкальные волны проходят сквозь группу врагов.',
      special: 'ГЛАВНЫЙ ХИТ',
      specialDesc: 'Большая звуковая волна наносит урон по линии.',
      kind: 'sound'
    },
    {
      id: 'rochelle',
      name: 'Рошель',
      role: 'КОНТРОЛЬ · КАМЕНЬ',
      cost: 115,
      hp: 240,
      damage: 12,
      range: 135,
      rate: 1.3,
      color: '#d8b8ff',
      desc: 'Окаменяет противников, останавливая их на время.',
      special: 'КАМЕННЫЙ ВЗГЛЯД',
      specialDesc: 'Останавливает всех обычных врагов на 3 секунды.',
      kind: 'stone'
    },
    {
      id: 'abbey',
      name: 'Эбби',
      role: 'КОНТРОЛЬ · ЛЁД',
      cost: 120,
      hp: 215,
      damage: 21,
      range: 155,
      rate: 1.1,
      color: '#8ee9ff',
      desc: 'Ледяные осколки наносят урон и замедляют.',
      special: 'ЛЕДЯНАЯ БУРЯ',
      specialDesc: 'Замораживает всех обычных врагов на 3 секунды.',
      kind: 'ice'
    },
    {
      id: 'spectra',
      name: 'Спектра',
      role: 'ОСЛАБЛЕНИЕ · ФОТО',
      cost: 125,
      hp: 155,
      damage: 17,
      range: 190,
      rate: 1.25,
      color: '#c9a4ff',
      desc: 'Вспышка камеры ослепляет врага и помечает его для усиленного урона.',
      special: 'СНИМОК НА ПАМЯТЬ',
      specialDesc: 'Помечает всех врагов: они получают больше урона 7 секунд.',
      kind: 'flash'
    }
  ];
  const MAPS = [{
      id: 'campus',
      name: 'ШКОЛА MONSTER HIGH',
      sub: 'Первый день хаоса',
      theme: 'campus',
      waves: 15,
      boss: 'Директорша Тьмы',
      desc: 'Защити главный двор школы. Отличная карта для знакомства с монстрами.'
    },
    {
      id: 'graveyard',
      name: 'КЛАДБИЩЕ',
      sub: 'Кто-то не спит',
      theme: 'graveyard',
      waves: 15,
      boss: 'Королева Призраков',
      desc: 'Призрачный туман скрывает врагов, а старые склепы хранят секреты.'
    },
    {
      id: 'lab',
      name: 'СТАРАЯ ЛАБОРАТОРИЯ',
      sub: 'Опасные эксперименты',
      theme: 'lab',
      waves: 15,
      boss: 'Доктор Разряд',
      desc: 'Неисправные установки периодически выпускают электрические импульсы.'
    },
    {
      id: 'forest',
      name: 'ПРОКЛЯТЫЙ ЛЕС',
      sub: 'Не ходи за огни',
      theme: 'forest',
      waves: 15,
      boss: 'Лесная Матрона',
      desc: 'Развилки, засады и существа, которые появляются из тумана.'
    },
    {
      id: 'castle',
      name: 'ЗАМОК ВАМПИРОВ',
      sub: 'Последняя ночь',
      theme: 'castle',
      waves: 15,
      boss: 'Кровавая Королева',
      desc: 'Финальная территория кампании. Несколько входов и сильнейшие враги.'
    }
  ];
  // Обычные противники — записи ./mobs/bestiary.js: у каждого свой силуэт,
  // процедурная анимация ходьбы/смерти и способность.
  // hp совпадает с прежним балансом, speed — в единицах прогресса по маршруту.
  const ENEMIES = [
    { type: 'frog', name: 'Лягушка-прыгун', hp: 35, speed: 1.13, color: '#8ce86a' },
    { type: 'slime', name: 'Слизень', hp: 48, speed: .84, color: '#7dff8a' },
    { type: 'zombie', name: 'Зомби-ученик', hp: 58, speed: .5, color: '#a7c48a' },
    { type: 'vampire', name: 'Вампир-ученик', hp: 72, speed: 1.3, color: '#ff6fc0' },
    { type: 'mushroom', name: 'Гриб-спорник', hp: 85, speed: .64, color: '#ff9cce' },
    { type: 'eye', name: 'Парящее око', hp: 100, speed: .73, color: '#9cecff' },
    { type: 'spiker', name: 'Колючий зверёк', hp: 110, speed: 1, color: '#e2ff8a' },
    { type: 'ghost', name: 'Призрак', hp: 115, speed: .95, color: '#c7f7ff' },
    { type: 'golem', name: 'Каменный голем', hp: 140, speed: .55, color: '#c9c3b0' },
    { type: 'darkMage', name: 'Тёмный маг', hp: 155, speed: .45, color: '#cf9cff' },
    { type: 'golem', name: 'Древний голем', hp: 190, speed: .45, color: '#ffcf7a', scale: .9 },
    { type: 'darkMage', name: 'Верховный маг', hp: 260, speed: .4, color: '#ff8ad8', scale: .94 }
  ];
  // Единая таблица сложности: HP врагов, урон врагов и множитель наград.
  const DIFFICULTY = {
    easy: { hp: .75, dmg: .7, reward: .9 },
    normal: { hp: 1, dmg: 1, reward: 1 },
    hard: { hp: 1.5, dmg: 1.25, reward: 1.3 }
  };
  const BOSS_DMG_MULT = .45,
    MOB_ATTACK_MIN = 3.6,
    MOB_ATTACK_MAX = 6.4;
  // Боссы локаций кампании в порядке MAPS.
  const BOSS_TYPES = ['headmistress', 'ghostQueen', 'doctorShock', 'forestMatron', 'bloodQueen'];
  const BOSS_SUMMONS = { headmistress: 'darkMage', ghostQueen: 'ghost' };
  const MOB_SCALE = .82, BOSS_SCALE = .6;
  let state = {
    screen: 'home',
    map: 0,
    difficulty: 'normal',
    coins: 260,
    lives: 20,
    wave: 0,
    score: 0,
    heroes: [],
    enemies: [],
    corpses: [],
    effects: [],
    floaters: [],
    selectedBuild: null,
    selectedTower: null,
    running: false,
    paused: false,
    between: true,
    last: 0,
    spawnLeft: 0,
    spawnTimer: 0,
    eventUsed: false,
    boss: null,
    speed: 1,
    completed: [],
    unlocked: 0,
    boostUntil: 0,
    slowUntil: 0,
    save: {}
  };
  const canvas = $('#game-canvas'),
    ctx = canvas.getContext('2d');
  let audioCtx = null,
    musicOn = true,
    soundOn = true,
    musicTimer = null,
    musicStep = 0;
  const bgm = $('#bgm');
  if (bgm) bgm.onerror = () => startSynthMusic();
  const img = {};
  HEROES.forEach(h => {
    img[h.id] = new Image();
    img[h.id].src = `./assets/heroes/sprites/${h.id}.webp`;
  });
  const mapImgs = MAPS.map(() => new Image());
  const ambientParticles = Array.from({
    length: 58
  }, (_, i) => ({
    x: (i * 197) % 1100,
    y: (i * 113) % 580,
    r: 1 + (i % 3) * .55,
    phase: i * .7,
    speed: .15 + (i % 5) * .06
  }));

  const attackFx = typeof AttackFX === 'function' ? new AttackFX() : null;
  // Мобы и боссы приходят из ./mobs/bestiary.js (подключается до app.js).
  const BESTIARY = typeof Bestiary !== 'undefined' ? Bestiary : null;
  const spawnMonster = (type, o) => BESTIARY && BESTIARY.types[type] ? new BESTIARY.Monster(type, o) : null;
  // героиня → эффект атаки из effects/effects.js
  const ATTACK_FX = {
    draculaura: 'bats',
    lagoona: 'bubbles',
    clawdeen: 'howl',
    frankie: 'lightning',
    kiyomi: 'hearts',
    bonita: 'shield',
    catty: 'notes',
    rochelle: 'petrify',
    abbey: 'freeze',
    spectra: 'flash'
  };
  const ATTACK_FX_SPEED = 1.5;

  function save() {
    localStorage.setItem('ghoulsSiegeSave', JSON.stringify({
      completed: state.completed,
      unlocked: state.unlocked,
      score: state.score
    }));
    $('#save-state-text').textContent = 'ПРОГРЕСС СОХРАНЁН';
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('ghoulsSiegeSave') || '{}');
      state.completed = s.completed || [];
      state.unlocked = s.unlocked || 0;
      state.score = s.score || 0;
    } catch {}
  }

  function toast(t) {
    const e = $('#toast');
    e.textContent = t;
    e.classList.add('show');
    setTimeout(() => e.classList.remove('show'), 2200)
  }

  function showScreen(id) {
    $$('.screen').forEach(x => x.classList.remove('active'));
    $('#screen-' + id).classList.add('active');
    state.screen = id;
    document.body.classList.toggle('in-game', id === 'game');
    if (id === 'game') startMusic();
    else stopMusic();
    if (id !== 'bestiary' && window.BestiaryView) window.BestiaryView.close();
  }

  function openBestiary(id) {
    $('#modal-backdrop').classList.add('hidden');
    showScreen('bestiary');
    if (window.BestiaryView) window.BestiaryView.open(id);
  }

  function renderMaps() {
    $('#map-grid').innerHTML = MAPS.map((m, i) => {
      let locked = i > state.unlocked;
      return `<button class="map-card ${locked?'locked':''}" data-map="${i}" ${locked?'disabled':''}><div class="map-art map-${m.theme}"><img src="./assets/maps/${m.theme}.webp" alt=""><span class="map-art-icon">${['🏫','⚰️','⚡','🌲','🏰'][i]}</span><span class="map-number">${String(i+1).padStart(2,'0')}</span>${state.completed.includes(i)?'<b class="map-cleared">✓ CLEARED</b>':''}</div><div class="map-card-copy"><small>CHAPTER ${i+1} · ${m.waves} WAVES</small><b>${m.name}</b><span>${m.desc}</span><em>${locked?'🔒 ЗАКРЫТО':`БОСС: ${m.boss}`}</em></div></button>`
    }).join('');
    $('#campaign-progress').textContent = `${state.completed.length} / 5 ЛОКАЦИЙ`;
    $$('[data-map]').forEach(b => b.addEventListener('click', () => startMap(+b.dataset.map)));
  }

  const MAP_ROUTES = [
    [[-8,276],[65,276],[112,300],[165,326],[250,326],[315,310],[365,270],[425,238],[505,238],[575,255],[630,300],[690,330],[770,330],[835,300],[895,260],[965,260],[1035,300],[1095,330]],
    [[-8,110],[75,110],[130,155],[155,225],[220,265],[310,265],[360,220],[390,145],[465,115],[540,145],[585,220],[650,270],[745,270],[820,225],[855,155],[930,115],[1010,145],[1095,210]],
    [[-8,430],[70,430],[125,380],[185,330],[260,330],[325,380],[380,445],[460,455],[520,405],[565,330],[640,285],[720,285],[780,335],[840,400],[920,420],[985,375],[1035,320],[1095,300]],
    [[-8,280],[75,280],[135,235],[195,190],[270,190],[330,235],[385,300],[445,350],[520,350],[575,300],[620,230],[690,185],[770,185],[830,235],[875,300],[940,350],[1010,350],[1095,300]],
    [[-8,500],[65,500],[120,450],[150,380],[210,325],[280,325],[335,375],[390,445],[465,470],[535,430],[585,355],[635,285],[710,250],[785,270],[840,330],[900,390],[970,390],[1035,340],[1095,280]]
  ];

  function startMap(i) {
    state.map = i;
    path = MAP_ROUTES[i].map(point => [...point]);
    if (!mapImgs[i].src) mapImgs[i].src = `./assets/maps/${MAPS[i].theme}.webp`;
    state.coins = 260;
    state.lives = 20;
    state.wave = 0;
    state.nextWaveCountdown = 0;
    state.score = 0;
    state.heroes = [];
    state.enemies = [];
    state.corpses = [];
    if (attackFx) attackFx.clear();
    state.effects = [];
    state.floaters = [];
    state.boss = null;
    state.running = false;
    state.paused = false;
    state.between = true;
    state.selectedBuild = null;
    state.selectedTower = null;
    state.eventUsed = false;
    $('#game-map-name').textContent = MAPS[i].name;
    $('#boss-hud').classList.add('hidden');
    $('#result-overlay').classList.add('hidden');
    $('#pause-overlay').classList.add('hidden');
    $('#event-overlay').classList.add('hidden');
    $('#canvas-hint').textContent = 'ВЫБЕРИ ГЕРОИНЮ ВНИЗУ → УСТАНОВИ ЕЁ РЯДОМ С ДОРОГОЙ';
    showScreen('game');
    renderShop();
    renderHUD();
    renderInspector();
    draw();
  }

  function renderShop() {
    const tab = $('#shop-tabs .active')?.dataset.tab || 'towers';
    let list = tab === 'support' ? HEROES.filter(h => ['bonita', 'frankie', 'lagoona'].includes(h.id)) : HEROES;
    if (tab === 'powers') {
      $('#shop-items').innerHTML = [
        ['✦', 'БАТ-ШТОРМ', 'Рой Дракулауры', 'draculaura'],
        ['⚡', 'ПЕРЕЗАРЯДКА', 'Усиление команды', 'frankie'],
        ['❄', 'ЛЕДЯНАЯ БУРЯ', 'Заморозка поля', 'abbey'],
        ['📸', 'ВСПЫШКА', 'Метка всем врагам', 'spectra']
      ].map(([icon, title, desc, id]) => `<button class="shop-power" data-power="${id}"><b>${icon}</b><strong>${title}</strong><small>${desc}</small><em>ВЫБРАТЬ ГЕРОИНЮ</em></button>`).join('');
      $$('[data-power]').forEach(b => b.onclick = () => {
        let t = state.heroes.find(x => x.id === b.dataset.power);
        if (!t) {
          toast('Сначала установи эту героиню');
          return;
        }
        state.selectedTower = t.uid;
        renderInspector();
        activateSpecial();
      });
    } else if (tab === 'boss') {
      $('#shop-items').innerHTML = MAPS.map((m, i) => `<button class="shop-note-card" data-boss="${BOSS_TYPES[i]}" title="Открыть бестиарий"><b>☠ ${m.boss}</b><small>${m.name} · финальная волна ${m.waves}</small><em>${i<=state.unlocked?'ДОСТУПЕН В КАМПАНИИ':'ЗАКРЫТ'}</em></button>`).join('');
      $$('[data-boss]').forEach(b => b.onclick = () => openBestiary(b.dataset.boss));
    } else if (tab === 'orbs') {
      $('#shop-items').innerHTML = [
        ['💗', 'СЕРДЦЕ', '+3 жизни', 'orb-life', 60],
        ['⚡', 'ЭНЕРГИЯ', '+15% урона на 12 сек.', 'orb-power', 60],
        ['🪙', 'КОШЕЛЁК', '+75 BIT$', 'orb-coins', 60],
        ['🛡', 'ОБЕРЕГ', 'Щит от следующего прорыва', 'orb-shield', 60],
        ['💊', 'ЛЕЧЕНИЕ', '+35% HP отряду', 'orb-heal', 70],
        ['🛡', 'ЭГИДА', 'Щит 50 героиням на 15 сек.', 'orb-aegis', 70]
      ].map(([icon, title, desc, key, cost]) => `<button class="shop-power" data-orb="${key}" data-cost="${cost}"><b>${icon}</b><strong>${title}</strong><small>${desc}</small><em>КУПИТЬ · ${cost} BIT$</em></button>`).join('');
      $$('[data-orb]').forEach(b => b.onclick = () => {
        const cost = Number(b.dataset.cost) || 60;
        if (state.coins < cost) {
          toast('Не хватает BIT$');
          return;
        }
        state.coins -= cost;
        const k = b.dataset.orb;
        if (k === 'orb-life') state.lives = Math.min(30, state.lives + 3);
        if (k === 'orb-power') state.boostUntil = Date.now() + 12000;
        if (k === 'orb-coins') state.coins += 75;
        if (k === 'orb-shield') state.shield = true;
        if (k === 'orb-heal') state.heroes.filter(h => !h.dead).forEach(h => healHero(h, h.maxHp * .35));
        if (k === 'orb-aegis') state.heroes.filter(h => !h.dead).forEach(h => {
          h.shield = Math.max(h.shield || 0, 50);
          h.shieldUntil = Date.now() + 15000;
        });
        renderHUD();
        renderInspector();
        toast('Магический орб активирован!');
        playTone(720, .12);
      });
    } else {
      $('#shop-items').innerHTML = list.map((h, i) => `<button class="shop-hero ${state.coins<h.cost?'unaffordable':''} ${state.selectedBuild===h.id?'selected':''}" data-hero="${h.id}"><span class="hero-card-image"><img src="./assets/heroes/${h.id}.webp" alt=""></span><b>${h.name}</b><small><em>✦</em> ${h.cost} BIT$</small><i>${HEROES.findIndex(x=>x.id===h.id)+1}</i></button>`).join('');
      $$('[data-hero]').forEach(b => b.addEventListener('click', () => {
        let h = HEROES.find(x => x.id === b.dataset.hero);
        if (state.coins < h.cost) {
          toast('Не хватает BIT$');
          return;
        }
        state.selectedBuild = h.id;
        state.selectedTower = null;
        renderShop();
        renderInspector();
        $('#canvas-hint').textContent = `${h.name.toUpperCase()}: КОСНИСЬ СВОБОДНОГО МЕСТА РЯДОМ С ДОРОГОЙ`;
      }));
    }
  }

  function renderHUD() {
    $('#lives-value').textContent = state.lives;
    $('#coins-value').textContent = state.coins;
    $('#wave-value').textContent = state.wave ? `${state.wave}/15` : 'ПОДГ 1/15';
    $('#score-value').textContent = state.score;
    if ($('#squad-value')) $('#squad-value').textContent = state.heroes.filter(h => !h.dead).length;
    if ($('#next-wave-value')) $('#next-wave-value').textContent = state.wave === 0 ? 'ГОТОВО' : state.running ? 'ИДЁТ ВОЛНА' : `${String(Math.floor(state.nextWaveCountdown/60)).padStart(2,'0')}:${String(Math.floor(state.nextWaveCountdown%60)).padStart(2,'0')}`;
    const disabled = state.running || state.paused || !!state.boss && state.boss.dead;
    $('#wave-button').disabled = disabled;
    $('#wave-button').textContent = state.wave === 0 ? 'НАЧАТЬ ПЕРВУЮ ВОЛНУ' : state.wave >= 15 ? 'ФИНАЛЬНАЯ ВОЛНА' : 'НАЧАТЬ ВОЛНУ';
    if ($('#wave-button-large')) {
      $('#wave-button-large').disabled = disabled;
      $('#wave-button-large').innerHTML = state.wave >= 15 ? 'ФИНАЛЬНАЯ ВОЛНА' : 'НАЧАТЬ ВОЛНУ <b>➜</b>';
    }
  }

  function renderInspector() {
    let t = state.heroes.find(x => x.uid === state.selectedTower);
    $('#tower-inspector').classList.toggle('hidden', !t);
    $('#inspector-empty').classList.toggle('hidden', !!t);
    $('#inspector-content').classList.toggle('hidden', !t);
    if (!t) return;
    let h = HEROES.find(x => x.id === t.id);
    $('#inspector-image').src = `./assets/heroes/sprites/${h.id}.webp`;
    $('#inspector-name').textContent = h.name;
    $('#inspector-role').textContent = h.role;
    $('#inspector-level').textContent = `LEVEL ${t.level}`;
    $('#inspector-description').textContent = h.desc;
    const hpPct = Math.max(0, Math.min(1, t.hp / t.maxHp));
    $('#inspector-hp-text').textContent = `${Math.ceil(t.hp)} / ${Math.round(t.maxHp)}`;
    $('#inspector-hp-fill').style.width = `${hpPct * 100}%`;
    $('#inspector-hp-fill').className = hpPct > .6 ? 'ok' : hpPct > .3 ? 'warn' : 'danger';
    const missing = Math.max(0, Math.ceil(t.maxHp - t.hp));
    const healCost = missing > 0 ? Math.max(5, Math.ceil(missing * .3)) : 0;
    $('#heal-button').disabled = missing <= 0 || state.coins < healCost;
    $('#heal-value').textContent = missing > 0 ? `${healCost} BIT$` : 'ПОЛНОЕ HP';
    $('#inspector-stats').innerHTML = `<span><small>УРОН</small><b>${Math.round(t.damage)}</b></span><span><small>РАДИУС</small><b>${Math.round(t.range)}</b></span><span><small>АТАКА</small><b>${t.rate.toFixed(1)}/с</b></span>`;
    $('#special-name').textContent = h.special;
    $('#special-description').textContent = h.specialDesc;
    $('#special-cooldown').textContent = t.cooldown > 0 ? `${t.cooldown.toFixed(1)}s` : 'READY';
    $('#special-button').disabled = t.cooldown > 0;
    $('#synergy-label').textContent = synergyText(t);
    $('#upgrade-grid').innerHTML = [
      ['damage', 'УРОН', '+35%'],
      ['speed', 'СКОРОСТЬ', '+15%'],
      ['range', 'ДАЛЬНОСТЬ', '+12%'],
      ['health', 'ЗДОРОВЬЕ', '+18% HP']
    ].map(([k, n, b]) => `<button data-upgrade="${k}">${n}<b>${b}</b><small>УРОВЕНЬ ${t.upgrades[k]||0}/3 · ${65+(t.upgrades[k]||0)*45} BIT$</small></button>`).join('');
    $$('[data-upgrade]').forEach(b => b.onclick = () => upgrade(t, b.dataset.upgrade));
    $('#sell-value').textContent = `+${Math.floor(t.spent*.65)} BIT$`;
  }

  function synergyText(t) {
    let pairs = {
      frankie: ['lagoona', 'bonita'],
      lagoona: ['frankie'],
      clawdeen: ['draculaura'],
      draculaura: ['clawdeen'],
      abbey: ['catty'],
      catty: ['abbey'],
      rochelle: ['spectra'],
      spectra: ['rochelle'],
      bonita: ['kiyomi'],
      kiyomi: ['bonita']
    };
    let near = state.heroes.filter(x => x !== t && !x.dead && Math.hypot(x.x - t.x, x.y - t.y) < 145);
    let p = near.find(x => (pairs[t.id] || []).includes(x.id));
    return p ? `✦ СИНЕРГИЯ: ${HEROES.find(h=>h.id===p.id).name}` : 'NO SYNERGY NEARBY';
  }

  function upgrade(t, k) {
    let n = t.upgrades[k] || 0,
      cost = 65 + n * 45;
    if (n >= 3) return toast('Улучшение уже максимальное');
    if (state.coins < cost) return toast('Не хватает BIT$');
    state.coins -= cost;
    t.upgrades[k] = n + 1;
    if (k === 'damage') t.damage *= 1.35;
    if (k === 'speed') t.rate *= 1.15;
    if (k === 'range') t.range *= 1.12;
    if (k === 'health') {
      const gain = t.maxHp * .18;
      t.maxHp += gain;
      t.hp = Math.min(t.maxHp, t.hp + gain);
    }
    t.spent += cost;
    renderHUD();
    renderInspector();
    renderShop();
    playTone(520, .08);
  }

  function placeHero(x, y) {
    let h = HEROES.find(h => h.id === state.selectedBuild);
    if (!h) return;
    if (state.coins < h.cost) return toast('Не хватает BIT$');
    if (state.heroes.length >= 18) return toast('Максимум 18 героинь на поле');
    if (x < 34 || x > 1066 || y < 34 || y > 540) return toast('Выбери свободное место внутри карты');
    if (isPath(x, y)) return toast('Нельзя ставить на маршрут');
    if (state.heroes.some(t => Math.hypot(t.x - x, t.y - y) < 48)) return toast('Слишком близко к другой героине');
    state.coins -= h.cost;
    let t = {
      uid: Date.now() + Math.random(),
      id: h.id,
      x,
      y,
      level: 1,
      maxHp: h.hp,
      hp: h.hp,
      dead: false,
      hitFlash: 0,
      shield: 0,
      shieldUntil: 0,
      lastHitAt: 0,
      damage: h.damage,
      range: h.range,
      rate: h.rate,
      cd: .3,
      spent: h.cost,
      cooldown: 0,
      upgrades: {}
    };
    state.heroes.push(t);
    state.selectedTower = t.uid;
    state.selectedBuild = null;
    renderHUD();
    renderShop();
    renderInspector();
    playTone(650, .09);
  }

  function startWave(manual = true) {
    if (state.running || state.paused) return;
    if (state.wave >= 15) return;
    if (manual && state.wave > 0 && state.nextWaveCountdown > 0) {
      state.coins += Math.floor(state.nextWaveCountdown / 4);
      renderHUD();
    }
    state.nextWaveCountdown = 24;
    state.wave++;
    state.running = true;
    state.between = false;
    state.spawnLeft = state.wave === 15 ? 1 : Math.min(5 + state.wave * 2, 32);
    state.spawnTimer = .2;
    state.eventUsed = false;
    renderHUD();
    if (state.wave === 15) {
      spawnBoss();
    } else if (state.wave % 4 === 0) setTimeout(() => {
      if (state.running && !state.paused && !state.eventUsed) showRandomEvent();
    }, 1800);
  }

  function spawnBoss() {
    let name = MAPS[state.map].boss;
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.normal;
    let hp = (1250 + state.map * 320) * diff.hp;
    state.boss = {
      name,
      type: BOSS_TYPES[state.map],
      hp,
      max: hp,
      phase: 1,
      dead: false
    };
    $('#boss-name').textContent = name;
    $('#boss-phase').textContent = 'PHASE 1';
    $('#boss-hud').classList.remove('hidden');
    state.spawnLeft = 0;
  }

  function spawnEnemy() {
    let idx = (state.wave + Math.floor(Math.random() * Math.min(4, 1 + state.wave / 3))) % ENEMIES.length;
    addEnemy(ENEMIES[idx], { progress: 0 });
  }

  // Создаёт моба: игровые параметры плюс Bestiary-сущность для анимаций и эффектов.
  function addEnemy(cfg, o = {}) {
    const T = BESTIARY && BESTIARY.types[cfg.type];
    const scale = o.scale || cfg.scale || MOB_SCALE;
    const progress = o.progress || 0;
    const pt = pointAt(progress);
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.normal;
    const hp = o.hp !== undefined ? o.hp : cfg.hp * (1 + state.wave * .105 + Math.max(0, state.wave - 8) * .018) * diff.hp;
    const e = {
      x: pt[0],
      y: pt[1],
      progress,
      hp,
      max: hp,
      speed: o.speed || cfg.speed * (1 + state.wave * .012) * (state.slowUntil > Date.now() ? .65 : 1),
      name: o.name || cfg.name,
      type: cfg.type,
      color: cfg.color,
      slow: 0,
      stun: 0,
      marked: 0,
      flash: 0,
      anim: Math.random() * Math.PI * 2,
      lane: o.lane !== undefined ? o.lane : (Math.random() - .5) * 14,
      boss: false,
      atkCd: 1.4 + Math.random() * 2.6,
      mon: null
    };
    if (T) {
      e.mon = spawnMonster(cfg.type, { x: e.x, y: e.y, face: 1, scale, fx: attackFx });
      e.scale = scale;
      e.top = T.h * scale;
    }
    state.enemies.push(e);
    return e;
  }

  function nearestHero(x, y, radius) {
    let best = null, bd = radius;
    for (const h of state.heroes) {
      if (h.dead) continue;
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }

  function heroDamageScale() {
    const diff = DIFFICULTY[state.difficulty] || DIFFICULTY.normal;
    return diff.dmg * (1 + state.wave * .03 + Math.max(0, state.wave - 8) * .012);
  }

  function pushFloatText(x, y, text, color) {
    state.floaters.push({ x, y, text, color: color || '#fff', life: .85, maxLife: .85 });
  }

  function healHero(t, amount) {
    if (!t || t.dead) return 0;
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amount);
    const healed = Math.round(t.hp - before);
    if (healed > 0) pushFloatText(t.x, t.y - 80, `+${healed}`, '#8bff9a');
    return healed;
  }

  // Урон героине: сначала щит, затем HP. Один удар не может снять больше половины запаса.
  function hurtHero(t, raw, isBoss = false) {
    if (!t || t.dead || t.hp <= 0) return 0;
    if (t.shieldUntil && Date.now() > t.shieldUntil) { t.shield = 0; t.shieldUntil = 0; }
    let dmg = Math.max(1, Math.round(raw * (isBoss ? BOSS_DMG_MULT : 1) * heroDamageScale()));
    dmg = Math.min(dmg, Math.max(1, Math.round(t.maxHp * .5)));
    const absorbed = Math.min(t.shield || 0, dmg);
    if (absorbed > 0) {
      t.shield -= absorbed;
      dmg -= absorbed;
      pushFloatText(t.x, t.y - 74, `-${absorbed}`, '#7ee7ff');
    }
    if (dmg > 0) {
      t.hp = Math.max(0, t.hp - dmg);
      t.hitFlash = .22;
      t.lastHitAt = performance.now();
      pushFloatText(t.x, t.y - 82, `-${dmg}`, '#ff8d9d');
      state.effects.push({ x: t.x, y: t.y - 10, color: '#ff8ad8', life: .24, max: .24, type: 'hit' });
      if (t.hp <= 0) killHero(t);
    }
    return absorbed + dmg;
  }

  // Героиня погибает навсегда: слот освобождается, возвращается 40% вложенных битов.
  function killHero(t) {
    if (!t || t.dead) return;
    t.dead = true;
    const refund = Math.floor((t.spent || 0) * .4);
    state.coins += refund;
    state.score += 20;
    if (state.selectedTower === t.uid) state.selectedTower = null;
    state.effects.push({ x: t.x, y: t.y - 18, color: '#ff5fa8', life: .95, max: 125, maxLife: .95, type: 'heroDown', seed: Math.random() * 6.28 });
    pushFloatText(t.x, t.y - 92, 'ВЫБЫЛА', '#ffb3cf');
    const field = $('.battle-field-wrap');
    if (field) {
      field.classList.remove('hero-down');
      void field.offsetWidth;
      field.classList.add('hero-down');
      setTimeout(() => field.classList.remove('hero-down'), 460);
    }
    const h = HEROES.find(x => x.id === t.id);
    toast(`${h ? h.name : 'Героиня'} пала в бою! Возврат ${refund} BIT$`);
    playTone(140, .32, 'sawtooth');
    renderHUD();
    renderInspector();
    renderShop();
  }

  // Моб бьёт ближайшую героиню своей способностью (на ходу).
  function mobCast(e) {
    if (!e.mon || e.mon.busy) { e.atkCd = .6; return; }
    const target = nearestHero(e.x, e.y, 195);
    if (!target) { e.atkCd = .7; return; }
    const targetUid = target.uid;
    e.atkCd = MOB_ATTACK_MIN + Math.random() * (MOB_ATTACK_MAX - MOB_ATTACK_MIN);
    e.mon.cast('attack', { x: target.x, y: target.y - 26, gy: target.y }, {
      onHit: () => {
        const live = state.heroes.find(h => h.uid === targetUid && !h.dead) || nearestHero(e.x, e.y, 220);
        if (live) hurtHero(live, (e.mon && e.mon.damage) || 10, false);
      }
    });
  }

  // Босс раз в несколько секунд применяет одну из способностей своего типа.
  function bossCast(e) {
    if (!e.mon || e.mon.busy) { e.bossCd = 1.2; return; }
    const list = e.mon.T.abilities || [];
    if (!list.length) return;
    const ab = list[(Math.random() * list.length) | 0];
    const alive = state.heroes.filter(h => !h.dead);
    const pool = alive.filter(h => h.uid !== e.lastTargetUid);
    const target = pool.length ? pool[(Math.random() * pool.length) | 0] : alive.length ? alive[(Math.random() * alive.length) | 0] : { x: e.x - 220, y: e.y - 40 };
    if (target.uid) e.lastTargetUid = target.uid;
    const fired = e.mon.cast(ab.id, { x: target.x, y: target.y - 26, gy: target.y }, {
      onHit: () => {
        if (ab.at === 'self') {
          e.hp = Math.min(e.max, e.hp + e.max * .08);
          if (state.boss) state.boss.hp = e.hp;
          state.effects.push({ x: e.x, y: e.y - 20, color: '#8bff9a', life: .5, max: .5, type: 'hit' });
          toast(`${e.name} восстанавливает силы!`);
        } else if (ab.at === 'front') {
          const cfg = ENEMIES.find(c => c.type === (BOSS_SUMMONS[e.type] || 'ghost'));
          for (let i = 0; i < 2; i++) {
            addEnemy(cfg, {
              progress: Math.max(0, e.progress - 18 - i * 16),
              hp: Math.round(e.max * .06),
              speed: .85,
              name: 'Прислужник тьмы'
            });
          }
          toast(`${e.name} призывает подкрепление!`);
        } else if (target.uid) {
          const live = state.heroes.find(h => h.uid === target.uid && !h.dead) || nearestHero(e.x, e.y, 260);
          if (live) {
            hurtHero(live, (e.mon && e.mon.damage) || 20, true);
            live.flinch = Math.max(live.flinch || 0, .7);
          }
        }
      }
    });
    if (fired) e.bossCd = 4.5 + Math.random() * 2.5;
  }

  let path = [
    [-8, 276],
    [60, 276],
    [105, 293],
    [150, 310],
    [235, 316],
    [300, 316],
    [355, 305],
    [400, 280],
    [445, 260],
    [535, 258],
    [605, 262],
    [650, 280],
    [680, 304],
    [740, 311],
    [820, 310],
    [870, 302],
    [915, 302],
    [945, 324],
    [965, 352],
    [1000, 370],
    [1095, 372]
  ];

  function isPath(x, y) {
    for (let i = 0; i < path.length - 1; i++) {
      let a = path[i],
        b = path[i + 1],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        l = dx * dx + dy * dy,
        t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l));
      if (Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) < 46) return true;
    }
    return false;
  }

  function pointAt(p) {
    let dist = p,
      segments = [];
    for (let i = 0; i < path.length - 1; i++) {
      let a = path[i],
        b = path[i + 1],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segments.push(len);
      if (dist <= len) {
        let t = dist / len;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      dist -= len;
    }
    return path.at(-1);
  }

  function activateSpecial() {
    let t = state.heroes.find(x => x.uid === state.selectedTower);
    if (!t || t.dead || t.cooldown > 0) return;
    let h = HEROES.find(x => x.id === t.id);
    t.cooldown = 24;
    let near = state.enemies.filter(e => !e.dead);
    if (t.id === 'lagoona') {
      state.slowUntil = Date.now() + 5000;
      near.forEach(e => e.slow = 5);
    } else if (t.id === 'frankie') {
      state.boostUntil = Date.now() + 8000;
      state.heroes.filter(h => !h.dead).forEach(h => healHero(h, h.maxHp * .12));
    } else if (t.id === 'bonita') {
      state.boostUntil = Date.now() + 8000;
      state.heroes.filter(h => !h.dead && Math.hypot(h.x - t.x, h.y - t.y) < 220).forEach(h => {
        h.shield = Math.max(h.shield || 0, Math.round(h.maxHp * .35));
        h.shieldUntil = Date.now() + 8000;
      });
    } else if (t.id === 'rochelle' || t.id === 'abbey') {
      near.filter(e => !e.boss).forEach(e => e.stun = 3);
    } else if (t.id === 'spectra') {
      near.forEach(e => e.marked = 7);
    } else if (t.id === 'clawdeen') {
      near.forEach(e => {
        if (Math.hypot(e.x - t.x, e.y - t.y) < 220) {
          hurtEnemy(e, 100);
          e.stun = 1.3;
        }
      });
    } else if (t.id === 'draculaura' || t.id === 'kiyomi' || t.id === 'catty') {
      near.slice(0, 8).forEach(e => hurtEnemy(e, t.damage * 3));
    } else {
      state.coins += 35;
    }
    state.effects.push({
      x: t.x,
      y: t.y,
      r: 0,
      max: 620,
      color: h.color,
      life: 1.05,
      maxLife: 1.05,
      type: 'special',
      kind: t.id
    });
    state.enemies = state.enemies.filter(e => {
      if (e.hp > 0) return true;
      spawnCorpse(e);
      if (e.boss && state.boss) {
        state.boss.dead = true;
        state.boss.hp = 0;
        $('#boss-hud').classList.add('hidden');
      }
      return false;
    });
    renderInspector();
    renderHUD();
    document.body.classList.add('special-flash');
    setTimeout(()=>document.body.classList.remove('special-flash'),180);
    playTone(880, .18, 'triangle');
    setTimeout(()=>playTone(1175,.2,'sine'),85);
    toast(`${h.special}!`);
  }

  function showRandomEvent() {
    state.eventUsed = true;
    state.running = false;
    let events = [{
      icon: '🌙',
      title: 'ПОЛНОЛУНИЕ',
      desc: 'Лунная энергия наполняет поле. Клодин наносит больше урона, но враги становятся быстрее.',
      choices: [
        ['Принять вызов', 'claw'],
        ['Укрыться: +25 BIT$', 'coins']
      ]
    }, {
      icon: '🎁',
      title: 'ЗАБЫТЫЙ ШКАФЧИК',
      desc: 'Ты нашла странный школьный шкафчик. Внутри может быть полезная вещь.',
      choices: [
        ['Забрать 70 BIT$', 'coins70'],
        ['Магический заряд: усилить героинь', 'boost']
      ]
    }, {
      icon: '🌫️',
      title: 'ПРИЗРАЧНЫЙ ТУМАН',
      desc: 'Туман окутывает территорию. Следующая волна будет сложнее, но награда выше.',
      choices: [
        ['Рискнуть ради награды', 'risk'],
        ['Развеять туман: -30 BIT$', 'clear']
      ]
    }, {
      icon: '⚡',
      title: 'ЭНЕРГЕТИЧЕСКИЙ СКАЧОК',
      desc: 'Фрэнки может перенаправить энергию в защиту школы.',
      choices: [
        ['Зарядить команду', 'boost'],
        ['Получить 40 BIT$', 'coins40']
      ]
    }];
    let ev = events[Math.floor(Math.random() * events.length)];
    $('#event-symbol').textContent = ev.icon;
    $('#event-title').textContent = ev.title;
    $('#event-description').textContent = ev.desc;
    $('#event-choices').innerHTML = ev.choices.map(([label, key]) => `<button class="btn-primary" data-choice="${key}">${label}</button>`).join('');
    $('#event-overlay').classList.remove('hidden');
    $$('[data-choice]').forEach(b => b.onclick = () => chooseEvent(b.dataset.choice));
  }

  function chooseEvent(k) {
    if (k === 'coins') state.coins += 25;
    if (k === 'coins70') state.coins += 70;
    if (k === 'coins40') state.coins += 40;
    if (k === 'boost') state.boostUntil = Date.now() + 12000;
    if (k === 'risk') {
      state.spawnLeft += 8;
      state.coins += 90;
    }
    if (k === 'clear') state.coins = Math.max(0, state.coins - 30);
    if (k === 'claw') state.boostUntil = Date.now() + 10000;
    $('#event-overlay').classList.add('hidden');
    state.running = state.spawnLeft > 0 || state.enemies.length > 0;
    renderHUD();
    renderShop();
    toast('Событие завершено');
  }

  function finishWave() {
    state.running = false;
    state.between = true;
    state.nextWaveCountdown = 24;
    if (state.wave === 15) {
      state.completed = [...new Set([...state.completed, state.map])];
      state.unlocked = Math.max(state.unlocked, Math.min(4, state.map + 1));
      state.coins += 250;
      save();
      showResult(true);
    } else {
      const rewardMult = (DIFFICULTY[state.difficulty] || DIFFICULTY.normal).reward;
      state.coins += Math.round((35 + state.wave * 5) * rewardMult);
      state.heroes.filter(h => !h.dead).forEach(h => {
        h.hp = Math.min(h.maxHp, h.hp + h.maxHp * .12);
        h.shield = 0;
        h.shieldUntil = 0;
      });
      renderHUD();
      renderInspector();
      renderShop();
      if (state.wave % 3 === 0 && !state.eventUsed) showRandomEvent();
    }
  }

  function showResult(win) {
    $('#result-stamp').textContent = win ? 'VICTORY' : 'DEFEAT';
    $('#result-title').textContent = win ? 'ЛОКАЦИЯ ЗАЩИЩЕНА!' : 'ШКОЛА В ОПАСНОСТИ';
    $('#result-description').textContent = win ? `${MAPS[state.map].name} спасена! Ты победила босса ${MAPS[state.map].boss}.` : 'Монстры прорвались через защиту. Попробуй изменить расстановку героинь.';
    $('#result-rewards').innerHTML = win ? '<span>✦ +250 BIT$</span><span>★ НОВАЯ ГЛАВА</span>' : '<span>ПОПРОБУЙ ЕЩЁ РАЗ</span>';
    $('#result-actions').innerHTML = `<button class="btn-primary" id="result-retry">${win?'ПЕРЕИГРАТЬ':'ПОВТОРИТЬ'}</button><button class="btn-outline" id="result-maps">К КАРТАМ</button>`;
    $('#result-overlay').classList.remove('hidden');
    $('#result-retry').onclick = () => startMap(state.map);
    $('#result-maps').onclick = () => {
      renderMaps();
      showScreen('maps');
    };
  }

  function nearbyAllyPoints(t) {
    return state.heroes
      .filter(a => a !== t && Math.hypot(a.x - t.x, a.y - t.y) < t.range)
      .slice(0, 2)
      .map(a => ({ x: a.x, y: a.y - 22 }));
  }

  function fireHeroAttack(t, target) {
    const name = ATTACK_FX[t.id];
    if (!attackFx || !name) {
      applyHeroHit(t, target);
      return;
    }
    let opts = {
      from: { x: t.x, y: t.y - 30 },
      to: { x: target.x, y: target.y },
      scale: target.boss ? 1.15 : .95,
      radius: target.boss ? 44 : 28,
      speed: ATTACK_FX_SPEED,
      onHit: () => applyHeroHit(t, target)
    };
    if (name === 'lightning') opts.allies = [{ x: target.x, y: target.y }, ...nearbyAllyPoints(t)];
    if (name === 'shield') {
      // Щит Бониты уходит на союзницу, ближайшую к цели, а урон всё равно получает цель.
      const ally = state.heroes
        .filter(a => a !== t && Math.hypot(a.x - target.x, a.y - target.y) < t.range)
        .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))[0] || t;
      opts.to = { x: ally.x, y: ally.y };
    }
    attackFx.play(name, opts);
  }

  // Урон по врагу: HP считает игра, монстр из бестиария отвечает за вспышку.
  function hurtEnemy(e, dmg) {
    if (!e || e.dead || e.hp <= 0) return;
    e.hp -= dmg;
    e.flash = .16;
    if (e.mon) e.mon.hurtK = 1;
  }

  // Труп остаётся на поле, пока проигрывается анимация смерти.
  function spawnCorpse(e) {
    if (!e.mon) return;
    e.mon.walk(0);
    e.mon.die();
    state.corpses.push({ mon: e.mon, x: e.x, y: e.y });
  }

  function applyHeroHit(t, target) {
    if (target.dead) return;
    const h = HEROES.find(x => x.id === t.id);
    const dmg = t.damage * (state.boostUntil > Date.now() ? 1.35 : 1) * (target.marked > 0 ? 1.3 : 1) * (t.buffUntil > Date.now() ? 1.15 : 1);
    hurtEnemy(target, dmg);
    state.effects.push({
      x: target.x,
      y: target.y,
      color: h ? h.color : '#fff',
      life: .22,
      max: .22,
      type: 'hit'
    });
    if (['clawdeen', 'catty'].includes(t.id)) {
      state.enemies.filter(e => e !== target && !e.dead && e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < 42).forEach(e => hurtEnemy(e, dmg * .45));
    }
    if (t.id === 'lagoona' || t.id === 'abbey') target.slow = 1.6;
    if (t.id === 'rochelle') target.stun = .45;
    if (t.id === 'frankie') {
      hurtEnemy(target, 3);
      state.heroes.forEach(a => {
        if (a !== t && !a.dead && Math.hypot(a.x - t.x, a.y - t.y) < t.range) a.buffUntil = Date.now() + 2500;
      });
    }
  }

  function update(dt) {
    if (state.paused) return;
    let factor = state.speed;
    dt = Math.min(dt, .05) * factor;
    if (attackFx) attackFx.update(dt);
    for (const f of state.floaters) {
      f.life -= dt;
      f.y -= 28 * dt;
    }
    state.floaters = state.floaters.filter(f => f.life > 0);
    for (const c of state.corpses) c.mon.update(dt);
    state.corpses = state.corpses.filter(c => !c.mon.dead);
    if (!state.running && state.between && state.wave > 0 && state.wave < 15 && state.nextWaveCountdown > 0) {
      state.nextWaveCountdown = Math.max(0, state.nextWaveCountdown - dt);
      if ($('#next-wave-value')) $('#next-wave-value').textContent = `${String(Math.floor(state.nextWaveCountdown/60)).padStart(2,'0')}:${String(Math.floor(state.nextWaveCountdown%60)).padStart(2,'0')}`;
      if (state.nextWaveCountdown <= 0) startWave(false);
    }
    if (state.running) {
      if (state.spawnLeft > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          spawnEnemy();
          state.spawnLeft--;
          state.spawnTimer = Math.max(.25, .9 - state.wave * .025);
        }
      }
      if (state.boss && !state.boss.dead) {
        state.boss.hp -= 0;
        let b = state.boss;
        $('#boss-health-fill').style.width = `${Math.max(0,b.hp/b.max*100)}%`;
        if (b.hp < b.max * .65 && b.phase === 1) {
          b.phase = 2;
          $('#boss-phase').textContent = 'PHASE 2';
          const be = state.enemies.find(e => e.boss);
          if (be) {
            be.speed *= 1.25;
            if (be.mon) be.mon.enrage(true);
            for (let i = 0; i < 2; i++) {
              addEnemy(ENEMIES[7], {
                progress: Math.max(0, be.progress - 45 * (i + 1)),
                hp: 180,
                speed: .8,
                name: 'Призрачный миньон'
              });
            }
          }
          toast('Босс перешёл во вторую фазу и призвал свиту!');
        }
        if (b.hp < b.max * .3 && b.phase === 2) {
          b.phase = 3;
          $('#boss-phase').textContent = 'FINAL PHASE';
          const be = state.enemies.find(e => e.boss);
          if (be) {
            be.speed *= 1.35;
            if (be.mon) be.mon.enrage(true);
            for (let i = 0; i < 3; i++) {
              addEnemy(ENEMIES[9], {
                progress: Math.max(0, be.progress - 35 * (i + 1)),
                hp: 260,
                speed: 1.05,
                name: 'Теневой страж'
              });
            }
          }
          toast('ФИНАЛЬНАЯ ФАЗА БОССА!');
        }
      }
      const totalLen = path.reduce((s, a, i) => i ? s + Math.hypot(a[0] - path[i - 1][0], a[1] - path[i - 1][1]) : 0, 0);
      for (let e of state.enemies) {
        if (e.dead) continue;
        if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
        if (e.boss && state.boss) state.boss.hp = e.hp;
        const mon = e.mon;
        if (e.stun > 0) {
          e.stun -= dt;
          if (mon) {
            mon.walk(0);
            mon.update(dt);
            mon.x = e.x;
            mon.y = e.y;
          }
          continue;
        }
        if (e.slow > 0) e.slow -= dt;
        e.anim = (e.anim || 0) + dt * (e.speed * 7 + 3.5);
        if (mon) {
          mon.face = 1;
          mon.walk(mon.busy ? 0 : 1);
          mon.update(dt);
          mon.x = e.x;
          mon.y = e.y;
        }
        if (e.boss) {
          e.bossCd = (e.bossCd === undefined ? 3 : e.bossCd) - dt;
          if (e.bossCd <= 0) bossCast(e);
        } else {
          e.atkCd -= dt;
          if (e.atkCd <= 0) mobCast(e);
        }
        // босс останавливается на время заклинания, мобы бьют на ходу
        if (e.boss && mon && mon.busy) continue;
        let p = pointAt(e.progress);
        e.x = p[0] + (e.lane || 0);
        e.y = p[1];
        e.progress += e.speed * (e.slow > 0 ? .55 : 1) * dt * 55;
        if (e.progress > totalLen) {
          e.dead = true;
          if (state.shield) {
            state.shield = false;
            toast('Оберег остановил прорыв!');
          } else {
            state.lives--;
            const field=$('.battle-field-wrap'); if(field){field.classList.remove('life-hit'); void field.offsetWidth; field.classList.add('life-hit'); setTimeout(()=>field.classList.remove('life-hit'),420);}
            playTone(115,.22,'sawtooth');
            if (state.lives <= 0) {
              state.running = false;
              showResult(false);
            }
          }
        }
      }
      for (let t of state.heroes) {
        if (t.dead) continue;
        if (t.hitFlash > 0) t.hitFlash = Math.max(0, t.hitFlash - dt);
        if (t.shieldUntil && Date.now() > t.shieldUntil) { t.shield = 0; t.shieldUntil = 0; }
        t.attackAnim = Math.max(0, (t.attackAnim || 0) - dt);
        t.cooldown = Math.max(0, t.cooldown - dt);
        t.flinch = Math.max(0, (t.flinch || 0) - dt);
        t.cd -= dt;
        if (t.cd <= 0 && t.flinch <= 0) {
          let target = state.enemies.filter(e => !e.dead && Math.hypot(e.x - t.x, e.y - t.y) < t.range).sort((a, b) => b.progress - a.progress)[0];
          if (target) {
            t.cd = 1 / t.rate;
            t.attackAnim = .22;
            fireHeroAttack(t, target);
          }
        }
      }
      state.enemies = state.enemies.filter(e => {
        if (e.hp <= 0) {
          state.effects.push({x:e.x,y:e.y,color:e.boss?'#ff65d2':(e.color||'#e9baff'),life:e.boss?.9:.48,max:e.boss?.9:.48,type:'death',seed:Math.random()*6.28});
          spawnCorpse(e);
          if (e.boss && state.boss) state.boss.hp = 0;
          const rewardMult = (DIFFICULTY[state.difficulty] || DIFFICULTY.normal).reward;
          state.coins += Math.round((e.boss ? 250 : 7) * rewardMult);
          state.score += e.boss ? 500 : 10;
          if (e.boss) {
            state.boss.dead = true;
            $('#boss-hud').classList.add('hidden');
          }
          return false;
        }
        return !e.dead;
      });
      if (state.heroes.some(h => h.dead)) {
        state.heroes = state.heroes.filter(h => !h.dead);
        if (state.selectedTower && !state.heroes.some(h => h.uid === state.selectedTower)) state.selectedTower = null;
        renderHUD();
        renderInspector();
        renderShop();
      }
      for (let e of state.effects) e.life -= dt;
      state.effects = state.effects.filter(e => e.life > 0);
      if (state.spawnLeft === 0 && state.enemies.length === 0) {
        if (state.wave === 15) {
          if (state.boss && !state.boss.dead) {
            let b = state.boss;
            if (!b.spawned) {
              b.spawned = true;
              const bt = BESTIARY && BESTIARY.types[b.type] ? b.type : 'headmistress';
              const bossMon = spawnMonster(bt, { x: path[0][0], y: path[0][1], face: 1, scale: BOSS_SCALE, fx: attackFx });
              state.enemies.push({
                x: path[0][0],
                y: path[0][1],
                hp: b.hp,
                max: b.max,
                speed: .34,
                name: b.name,
                type: bt,
                color: '#ff4fa3',
                progress: 0,
                boss: true,
                slow: 0,
                stun: 0,
                marked: 0,
                phase: 1,
                flash: 0,
                anim: 0,
                lane: 0,
                bossCd: 2.5,
                mon: bossMon,
                top: bossMon ? bossMon.T.h * BOSS_SCALE : 60
              });
            }
          } else finishWave();
        } else finishWave();
      }
    }
  }

  // Мобы рисуются из bestiary.js: силуэт, ходьба, замах, способность и смерть.
  function drawEnemy(e) {
    if (e.mon) {
      e.mon.draw(ctx);
      return;
    }
    // запасная отрисовка, если bestiary.js не загрузился
    const r = 17;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = .3;
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(0, 2, r, 6, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = e.color || "#b98cff";
    ctx.beginPath(); ctx.arc(0, -r, r, 0, 7); ctx.fill();
    ctx.fillStyle = "#1a0b26";
    ctx.beginPath(); ctx.arc(-6, -r - 2, 3, 0, 7); ctx.arc(6, -r - 2, 3, 0, 7); ctx.fill();
    ctx.restore();
  }


  function draw() {
    const w = canvas.width,
      h = canvas.height,
      theme = MAPS[state.map].theme,
      im = mapImgs[state.map];
    ctx.clearRect(0, 0, w, h);
    if (im && im.complete && im.naturalWidth) {
      const ratio = w / h,
        ir = im.naturalWidth / im.naturalHeight;
      let sx = 0,
        sy = 0,
        sw = im.naturalWidth,
        sh = im.naturalHeight;
      if (ir < ratio) {
        sh = im.naturalWidth / ratio;
        sy = (im.naturalHeight - sh) / 2;
      } else {
        sw = im.naturalHeight * ratio;
        sx = (im.naturalWidth - sw) / 2;
      }
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#45305e');
      g.addColorStop(1, '#170d25');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const tint = {
      campus: 'rgba(80,25,110,.06)',
      grave: 'rgba(18,32,76,.23)',
      graveyard: 'rgba(18,32,76,.23)',
      lab: 'rgba(25,92,116,.18)',
      forest: 'rgba(27,83,47,.2)',
      castle: 'rgba(112,20,70,.19)'
    } [theme] || 'transparent';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
    // Cinematic vignette, soft floating dust and a subtle path centerline.
    const vg = ctx.createRadialGradient(w * .5, h * .48, h * .12, w * .5, h * .48, w * .74);
    vg.addColorStop(0, 'rgba(15,7,28,0)');
    vg.addColorStop(1, 'rgba(10,5,19,.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    ambientParticles.forEach(a => {
      const y = (a.y + performance.now() * .012 * a.speed) % h;
      ctx.globalAlpha = .24;
      ctx.fillStyle = a.phase % 2 ? '#ffd5f7' : '#a9f7ff';
      ctx.beginPath();
      ctx.arc(a.x, y, a.r, 0, 7);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,226,255,.17)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 18]);
    ctx.beginPath();
    path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Placed heroines: illustrated cutout, glowing base, idle bob and range ring.
    state.heroes.forEach(t => {
      const h = HEROES.find(x => x.id === t.id),
        selected = state.selectedTower === t.uid;
      const bob = Math.sin(performance.now() / 260 + (t.uid % 13)) * 2.2;
      ctx.save();
      ctx.globalAlpha = .16;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 5, 31, 14, 0, 0, 7);
      ctx.fill();
      ctx.globalAlpha = .95;
      ctx.shadowColor = h.color;
      ctx.shadowBlur = selected ? 26 : 13;
      ctx.strokeStyle = selected ? '#fff0b5' : h.color;
      ctx.lineWidth = selected ? 3 : 2;
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 4, 27, 11, 0, 0, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (selected) {
        ctx.globalAlpha = .12;
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,238,255,.42)';
        ctx.setLineDash([7, 8]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const sprite = img[t.id];
      const shake = t.hitFlash > 0 ? Math.sin(performance.now() / 18) * 3 : 0;
      if (sprite && sprite.complete && sprite.naturalWidth) {
        const sh = 104,
          sw = sh * (sprite.naturalWidth / sprite.naturalHeight);
        ctx.shadowColor = 'rgba(0,0,0,.6)';
        ctx.shadowBlur = 9;
        ctx.drawImage(sprite, t.x - sw / 2 + shake, t.y - sh + 14 + bob, sw, sh);
      }
      ctx.shadowBlur = 0;
      if (t.hitFlash > 0) {
        ctx.globalAlpha = Math.min(1, t.hitFlash * 4);
        ctx.strokeStyle = '#ff5f8f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(t.x, t.y - 34, 34, 42, 0, 0, 7);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const hpPct = Math.max(0, Math.min(1, t.hp / t.maxHp));
      if (t.hp < t.maxHp || selected) {
        const bw = 46, bh = 5, bx = t.x - bw / 2, by = t.y - 102 + bob;
        ctx.fillStyle = 'rgba(12,6,18,.88)';
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        ctx.fillStyle = hpPct > .6 ? '#8ef0a2' : hpPct > .3 ? '#ffd166' : '#ff6f8a';
        ctx.fillRect(bx, by, bw * hpPct, bh);
        if (t.shield > 0) {
          ctx.fillStyle = '#7ee7ff';
          ctx.fillRect(bx, by - 4, bw * Math.min(1, t.shield / Math.max(1, t.maxHp * .35)), 2);
        }
      }
      ctx.fillStyle = '#fff2fb';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${t.level}`, t.x, t.y + 24);
      if (t.flinch > 0) {
        ctx.globalAlpha = Math.min(1, t.flinch * 2);
        ctx.fillStyle = '#ff9ed6';
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('✧', t.x + 20, t.y - 72);
        ctx.globalAlpha = 1;
      }
      if (t.attackAnim > 0) {
        ctx.globalAlpha = t.attackAnim / .22;
        ctx.strokeStyle = h.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y - 28, 31 + (1 - t.attackAnim / .22) * 18, 0, 7);
        ctx.stroke();
      }
      ctx.restore();
    });
    // Трупы: анимация смерти доигрывается поверх земли.
    state.corpses.forEach(c => c.mon.draw(ctx));
    // Enemy bodies and status markers.
    state.enemies.forEach(e => {
      drawEnemy(e);
      ctx.save();
      const top = e.top || 44;
      const bw = e.boss ? 68 : 32,
        bh = e.boss ? 6 : 4,
        yy = Math.max(10, e.y - top - 9);
      ctx.fillStyle = 'rgba(15,7,22,.9)';
      ctx.fillRect(e.x - bw / 2 - 1, yy - 1, bw + 2, bh + 2);
      ctx.fillStyle = e.boss ? '#ff4aa9' : e.hp / e.max < .3 ? '#ff775e' : '#92ec9d';
      ctx.fillRect(e.x - bw / 2, yy, bw * Math.max(0, e.hp / e.max), bh);
      if (e.marked > 0) {
        ctx.strokeStyle = '#f1a5ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, 22, 0, 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (e.stun > 0 || e.slow > 0) {
        ctx.font = '12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillStyle = e.stun > 0 ? '#bfefff' : '#a5f6ff';
        ctx.fillText(e.stun > 0 ? '✧' : '❄', e.x + 18, yy - 4);
      }
      ctx.restore();
    });
    if (attackFx) attackFx.render(ctx);
    state.effects.forEach(e => {
      const alpha = Math.max(0, e.life / (e.maxLife || e.max || .6));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = e.color || '#fff';
      ctx.fillStyle = e.color || '#fff';
      ctx.shadowColor = e.color || '#fff';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      const r = (1 - alpha) * (e.max || 90) + 8;
      if (e.type === 'death') {
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x,e.y,r*.55,0,Math.PI*2); ctx.stroke();
        for(let i=0;i<14;i++){const a=i*Math.PI*2/14+(e.seed||0),d=r*(.48+(i%4)*.16);ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*r*.12,e.y+Math.sin(a)*r*.12);ctx.lineTo(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d);ctx.stroke();ctx.beginPath();ctx.arc(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d,2+(i%2),0,Math.PI*2);ctx.fill();}
        ctx.beginPath();ctx.arc(e.x,e.y,r*.28,0,Math.PI*2);ctx.stroke();ctx.font='bold 19px Georgia';ctx.textAlign='center';ctx.fillText('✦',e.x,e.y+5);
      } else if (e.type === 'heroDown') {
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, r * .9, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(e.x, e.y, r * .55, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI * 2 / 12 + (e.seed || 0);
          const d = r * (.6 + (i % 3) * .14);
          ctx.beginPath();
          ctx.moveTo(e.x + Math.cos(a) * r * .2, e.y + Math.sin(a) * r * .2);
          ctx.lineTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
          ctx.stroke();
        }
        ctx.font = 'bold 28px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('☠', e.x, e.y + 10);
      } else if (e.type === 'hit') {
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * .35, 0, 7);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          let a = i * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(e.x + Math.cos(a) * r * .4, e.y + Math.sin(a) * r * .4);
          ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * .65, 0, 7);
        ctx.stroke();
        const symbols = {
          draculaura: '✦',
          lagoona: '○',
          clawdeen: '〰',
          frankie: 'ϟ',
          kiyomi: '♥',
          bonita: '✧',
          catty: '♫',
          rochelle: '◆',
          abbey: '❄',
          spectra: '✷'
        };
        ctx.font = 'bold 24px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(symbols[e.kind] || '✦', e.x, e.y);
      }
      ctx.restore();
    });
    state.floaters.forEach(f => {
      const a = Math.max(0, Math.min(1, f.life / f.maxLife));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 15px Georgia';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,.85)';
      ctx.shadowBlur = 5;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }

  function loop(ts) {
    let dt = (ts - state.last) / 1000 || 0;
    state.last = ts;
    update(dt);
    if (state.screen === 'game') draw();
    requestAnimationFrame(loop);
  }
  canvas.addEventListener('pointerdown', e => {
    let r = canvas.getBoundingClientRect(),
      x = (e.clientX - r.left) / r.width * canvas.width,
      y = (e.clientY - r.top) / r.height * canvas.height;
    let hit = [...state.heroes].reverse().find(t => Math.hypot(t.x - x, t.y - y) < 30);
    if (hit) {
      state.selectedTower = hit.uid;
      state.selectedBuild = null;
      renderInspector();
      renderShop();
      return;
    }
    if (state.selectedBuild) {
      placeHero(x, y);
      return;
    }
    state.selectedTower = null;
    renderInspector();
  });

  function playTone(freq = 440, dur = .1, type = 'sine') {
    if (!soundOn) return;
    try {
      audioCtx ||= new(window.AudioContext || window.webkitAudioContext)();
      let o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(.06, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch {}
  }

  // Резервная синтезированная тема, если аудиофайл недоступен.
  function startSynthMusic() {
    if (!musicOn || musicTimer || state.screen !== 'game') return;
    try {
      audioCtx ||= new(window.AudioContext || window.webkitAudioContext)();
      let notes = [196, 246.94, 293.66, 246.94, 174.61, 220, 261.63, 220];
      musicTimer = setInterval(() => {
        if (state.screen !== 'game' || state.paused) return;
        let f = notes[musicStep++ % notes.length];
        playTone(f, .22, 'triangle');
      }, 310);
    } catch {}
  }

  // Основная музыка: Monster High instrumental, бесконечный цикл на игровом экране.
  function startMusic() {
    if (!musicOn || state.screen !== 'game') return;
    if (bgm) {
      bgm.volume = .45;
      bgm.loop = true;
      const p = bgm.play();
      if (p && p.catch) p.catch(() => startSynthMusic());
      return;
    }
    startSynthMusic();
  }

  function stopMusic() {
    if (bgm && !bgm.paused) bgm.pause();
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }
  const openCampaign = () => {
    renderMaps();
    showScreen('maps');
  };
  $('#play-button').onclick = openCampaign;
  $('#play-button-fallback').onclick = openCampaign;
  $('#continue-button').onclick = openCampaign;
  $('#settings-button-home').onclick = () => $('#settings-button').click();
  $('#achievements-button').onclick = () => {
    const unlocked = state.completed.length;
    $('#modal-content').innerHTML = `<div class="eyebrow">GHOULS' COLLECTION</div><h2 id="modal-title">ДОСТИЖЕНИЯ</h2><p>Защищено локаций: <b>${unlocked}/5</b></p><p>Победи боссов, чтобы открыть новые значки и территории.</p><div class="achievement-list"><span>☠ Первый бой — пройди первую волну</span><span>✦ Защитница школы — заверши первую локацию</span><span>♛ Охотница на боссов — победи финального босса</span></div>`;
    $('#modal-backdrop').classList.remove('hidden');
  };
  $('#collection-button').onclick = () => {
    $('#modal-content').innerHTML = `<div class="eyebrow">MONSTER HIGH</div><h2 id="modal-title">КОЛЛЕКЦИЯ</h2><p>Героини отряда</p><div class="collection-grid">${HEROES.map(h=>`<div><img src="./assets/heroes/${h.id}.webp" alt="${h.name}"><b>${h.name}</b></div>`).join('')}</div><button class="btn-outline" id="open-bestiary">☠ БЕСТИАРИЙ МОНСТРОВ</button>`;
    $('#modal-backdrop').classList.remove('hidden');
    $('#open-bestiary').onclick = () => openBestiary();
  };
  $('#bestiary-button').onclick = () => openBestiary();
  $('#bestiary-home').onclick = () => showScreen('home');
  $('#exit-button').onclick = () => toast('До встречи в Monster High!');
  $('#brand-home').onclick = () => showScreen('home');
  $('#maps-home').onclick = () => showScreen('home');
  $('#game-home').onclick = () => {
    state.paused = true;
    showScreen('home');
  };
  $('#wave-button').onclick = () => {
    startMusic();
    startWave();
  };
  if ($('#wave-button-large')) $('#wave-button-large').onclick = () => {
    startMusic();
    startWave();
  };
  $('#pause-button').onclick = () => {
    state.paused = !state.paused;
    $('#pause-overlay').classList.toggle('hidden', !state.paused);
    $('#pause-button').textContent = state.paused ? '▶' : 'Ⅱ';
  };
  $('#resume-button').onclick = () => $('#pause-button').click();
  $('#speed-button').onclick = () => {
    state.speed = state.speed === 1 ? 1.5 : state.speed === 1.5 ? 2 : 1;
    $('#speed-button').textContent = state.speed + '×';
  };
  $('#special-button').onclick = activateSpecial;
  $('#inspector-close').onclick = () => {
    state.selectedTower = null;
    renderInspector();
  };
  $('#sell-button').onclick = () => {
    let i = state.heroes.findIndex(x => x.uid === state.selectedTower);
    if (i >= 0) {
      state.coins += Math.floor(state.heroes[i].spent * .65);
      state.heroes.splice(i, 1);
      state.selectedTower = null;
      renderHUD();
      renderInspector();
      renderShop();
    }
  };
  $('#heal-button').onclick = () => {
    const t = state.heroes.find(x => x.uid === state.selectedTower);
    if (!t || t.dead) return;
    const missing = Math.max(0, Math.ceil(t.maxHp - t.hp));
    if (missing <= 0) return;
    const cost = Math.max(5, Math.ceil(missing * .3));
    if (state.coins < cost) return toast('Не хватает BIT$');
    state.coins -= cost;
    t.hp = t.maxHp;
    pushFloatText(t.x, t.y - 80, `+${missing}`, '#8bff9a');
    playTone(680, .09);
    renderHUD();
    renderInspector();
  };
  $$('#shop-tabs button').forEach(b => b.onclick = () => {
    $$('#shop-tabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    renderShop();
  });
  $$('[data-difficulty]').forEach(b => b.onclick = () => {
    $$('[data-difficulty]').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    state.difficulty = b.dataset.difficulty;
    $('#difficulty-description').textContent = {
      easy: 'Мягкий баланс · больше жизней',
      normal: 'Стандартный баланс',
      hard: 'Враги сильнее · награды выше'
    } [state.difficulty];
  });
  $('#music-toggle').onclick = () => {
    musicOn = !musicOn;
    $('#music-toggle').style.opacity = musicOn ? 1 : .4;
    if (musicOn) startMusic();
    else stopMusic();
  };
  $('#sound-toggle').onclick = () => {
    soundOn = !soundOn;
    $('#sound-toggle').style.opacity = soundOn ? 1 : .4;
  };
  $('#settings-button').onclick = () => {
    let c = $('#modal-content');
    c.innerHTML = '<div class="eyebrow">SETTINGS</div><h2 id="modal-title">НАСТРОЙКИ</h2><p>Прогресс сохраняется автоматически в этом браузере.</p><button class="btn-outline" id="reset-save">СБРОСИТЬ ПРОГРЕСС</button>';
    $('#modal-backdrop').classList.remove('hidden');
    $('#reset-save').onclick = () => {
      if (confirm('Удалить сохранение кампании?')) {
        localStorage.removeItem('ghoulsSiegeSave');
        state.completed = [];
        state.unlocked = 0;
        save();
        renderMaps();
        $('#modal-backdrop').classList.add('hidden');
        toast('Сохранение сброшено');
      }
    };
  };
  $('#modal-close').onclick = () => $('#modal-backdrop').classList.add('hidden');
  $('#modal-backdrop').onclick = e => {
    if (e.target.id === 'modal-backdrop') e.currentTarget.classList.add('hidden');
  };
  $('#save-code-button').onclick = () => {
    let data = btoa(unescape(encodeURIComponent(JSON.stringify({
      completed: state.completed,
      unlocked: state.unlocked,
      score: state.score
    }))));
    navigator.clipboard?.writeText(data).then(() => toast('Код сохранения скопирован')).catch(() => toast('Код сохранения: ' + data));
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
      if (state.screen === 'game') $('#pause-button').click();
    }
    if (e.key.toLowerCase() === 'n' && state.screen === 'game') $('#wave-button').click();
    if (e.key >= '1' && e.key <= '9' && state.screen === 'game') {
      let h = HEROES[+e.key - 1];
      if (h) {
        state.selectedBuild = h.id;
        renderShop();
      }
    }
  });
  load();
  renderMaps();
  renderHUD();
  requestAnimationFrame(loop);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
