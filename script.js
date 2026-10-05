const playBtn = document.getElementById('playBtn');
const loading = document.getElementById('loading');
const bootCanvas = document.getElementById('bootFrame');
const game = document.getElementById('game');
const select = document.getElementById('select');

/* ---------- หน้าโหลดตอนเริ่มเกม (สไปรต์ชีต 23 เฟรม) ----------
   เฟรม 0-16  = หลอดโหลด 0% -> 100% (มีเฟรมเบลนด์คั่นกลางไว้แล้ว)
   เฟรม 17    = ช่วงเปลี่ยนจากหลอดเป็นปุ่ม PLAY
   เฟรม 18-22 = ปุ่ม PLAY เรืองแสง (วนไปกลับ)
   หลอดเดินตามเวลาจริง (requestAnimationFrame) ไม่ใช่ตัวเลขสุ่ม */
const BOOT_COUNT = 23, BOOT_LAST = 16;
const BOOT_MS = 3200;                       // เวลาขั้นต่ำที่หลอดเดิน 0 -> 100%
const bootCtx = bootCanvas.getContext('2d');
const bootImgs = new Array(BOOT_COUNT).fill(null);
let bootDrawn = -1, bootLoaded = 0;

function drawBoot(i) {
  if (i === bootDrawn || !bootImgs[i]) return;
  bootCtx.drawImage(bootImgs[i], 0, 0, bootCanvas.width, bootCanvas.height);
  bootDrawn = i;
}
for (let i = 0; i < BOOT_COUNT; i++) {
  const im = new Image();
  im.src = `loadboot_${i}.jpg`;
  const done = () => { bootImgs[i] = im.naturalWidth ? im : null; bootLoaded++; if (i === 0) drawBoot(0); };
  (im.decode ? im.decode() : Promise.resolve()).then(done, done);   // decode ล่วงหน้า ตอนสลับเฟรมจะไม่กระตุก
}

const GLOW = [18, 19, 20, 21, 22, 21, 20, 19];
let bootT0 = null, bootDone = false;
function bootTick(now) {
  if (bootT0 === null) bootT0 = now;
  const t = now - bootT0;
  if (!bootDone) {
    const p = Math.min(1, t / BOOT_MS);
    const want = Math.floor(p * BOOT_LAST + 1e-6);
    // เลื่อนเฟรมตามเวลา; ถ้าเฟรมนั้นยังโหลดไม่เสร็จ ให้ค้างเฟรมก่อนหน้า
    let f = Math.max(0, bootDrawn);
    while (f < want && bootImgs[f + 1]) f++;
    drawBoot(f);
    if (p >= 1 && bootLoaded >= BOOT_COUNT && bootDrawn >= BOOT_LAST) {
      bootDone = true; bootT0 = now;
    }
  } else if (t < 360) {
    drawBoot(17);                                   // หลอด -> ปุ่ม PLAY
  } else {
    if (playBtn.hidden) playBtn.hidden = false;
    drawBoot(GLOW[Math.floor((t - 360) / 130) % GLOW.length]);
  }
  if (loading.classList.contains('active')) requestAnimationFrame(bootTick);
}
requestAnimationFrame(bootTick);

playBtn.addEventListener('click', () => {
  loading.classList.remove('active');
  select.classList.add('active');
});

// พยายามล็อกแนวนอน (ใช้ได้เฉพาะบางเบราว์เซอร์ตอนเต็มจอ)
playBtn.addEventListener('click', () => {
  try { screen.orientation.lock('landscape'); } catch (e) {}
});


/* ================= ตัวละคร (รายชื่อ + สไปรต์เดิน) ================= */
// frames = จำนวนเฟรมในแถบ chars/walk_<id>.png (เรียงซ้าย->ขวา หันขวา)
const CHARS = [
  { id: 'stella', name: 'Stella', title: 'Star Princess',    color: '#ff6fa5', frames: 8  },
  { id: 'orion',  name: 'Orion',  title: 'Stardust Wanderer', color: '#6f8fff', frames: 8  },
  { id: 'vega',   name: 'Vega',   title: 'Cosmic Blossom',    color: '#ff5a5a', frames: 8  },
  { id: 'luna',   name: 'Luna',   title: 'Moon Serenade',     color: '#8fb4ff', frames: 10 },
  { id: 'nebula', name: 'Nebula', title: 'Galaxy Healer',     color: '#b784ff', frames: 10 },
  { id: 'zenith', name: 'Zenith', title: 'Astral Guardian',   color: '#5fd6a4', frames: 6  },
  { id: 'noctis', name: 'Noctis', title: 'Eclipse Rogue',     color: '#a79bc4', frames: 8  },
];
const portraitUrl = (c) => `portrait_${c.id}.png`;
const walkUrl = (c) => `walk_${c.id}.png`;

// โหลดรูปไว้ล่วงหน้า จะได้ไม่กระตุกตอนสลับตัว
CHARS.forEach((c) => { new Image().src = portraitUrl(c); new Image().src = walkUrl(c); });

const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

// ตั้งสไปรต์ให้เป็นตัวละครที่เลือก
function applySprite(el, c) {
  el.style.setProperty('--walk', `url("${walkUrl(c)}")`);
  el.style.setProperty('--n', c.frames);
}
function showFrame(el, c, f) {
  el.style.backgroundPositionX = (c.frames > 1 ? f / (c.frames - 1) * 100 : 0) + '%';
}

const selPortrait = document.getElementById('selPortrait');
const selName = document.getElementById('selName');
const selTitle = document.getElementById('selTitle');
const selSprite = document.getElementById('selSprite');
const selThumbs = document.getElementById('selThumbs');
const selArt = document.getElementById('selArt');
const heroBody = document.getElementById('heroBody');

let current = 0;
try {
  const saved = CHARS.findIndex((c) => c.id === localStorage.getItem('fp_char'));
  if (saved >= 0) current = saved;
} catch (e) {}

// ปุ่มรูปเล็กของทุกตัว
const thumbs = CHARS.map((c, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-label', c.name);
  b.style.setProperty('--img', `url("${portraitUrl(c)}")`);
  b.style.setProperty('--c', c.color);
  b.addEventListener('click', () => choose(i));
  selThumbs.appendChild(b);
  return b;
});

function choose(i) {
  current = (i + CHARS.length) % CHARS.length;
  const c = CHARS[current];
  select.style.setProperty('--accent', c.color);
  selName.textContent = c.name;
  selTitle.textContent = c.title;
  selPortrait.alt = c.name;
  selPortrait.src = portraitUrl(c);
  selPortrait.classList.remove('swap'); void selPortrait.offsetWidth; selPortrait.classList.add('swap');
  applySprite(selSprite, c);
  walkFrame = 0; showFrame(selSprite, c, 0);
  thumbs.forEach((b, k) => b.setAttribute('aria-checked', k === current ? 'true' : 'false'));
}

// พรีวิวเดินอยู่กับที่ในหน้าเลือกตัว
let walkFrame = 0;
setInterval(() => {
  if (!select.classList.contains('active') || reduceMotion) return;
  const c = CHARS[current];
  walkFrame = (walkFrame + 1) % c.frames;
  showFrame(selSprite, c, walkFrame);
}, 100);

document.getElementById('selPrev').addEventListener('click', () => choose(current - 1));
document.getElementById('selNext').addEventListener('click', () => choose(current + 1));

// ปัดซ้าย/ขวาที่รูปตัวละครเพื่อสลับตัว
let swipeX = null;
selArt.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
selArt.addEventListener('pointerup', (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX; swipeX = null;
  if (Math.abs(dx) > 40) choose(current + (dx < 0 ? 1 : -1));
});
addEventListener('keydown', (e) => {
  if (!select.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') choose(current - 1);
  else if (e.key === 'ArrowRight') choose(current + 1);
  else if (e.key === 'Enter' && document.activeElement === document.body) startGame();
});

// ยืนยัน -> เข้าเกมด้วยตัวที่เลือก
function startGame() {
  const c = CHARS[current];
  try { localStorage.setItem('fp_char', c.id); } catch (e) {}
  applySprite(heroBody, c);
  showFrame(heroBody, c, 0);
  select.classList.remove('active');
  game.classList.add('active');
  if (typeof updateProfile === 'function') updateProfile();
}
document.getElementById('selGo').addEventListener('click', startGame);
choose(current);


/* ================= ตัวละคร + แมพ + ประตูวาป ================= */
const hero = document.getElementById('hero');
const mark = document.getElementById('mark');
const gate = document.getElementById('gate');
const roomEl = document.getElementById('room');
const warpFx = document.getElementById('warpFx');
const toastEl = document.getElementById('toast');

// ตำแหน่งตัวละคร / จุดหมาย เป็น 0-1 ของหน้าจอเกม
const pos = { x: 0.5, y: 0.66 };
let target = null;
const keys = {};
let curMap = 'field';
let busy = false;      // กำลังวาป / คุยกับพนักงาน / เปิดร้าน -> ห้ามเดิน
let lock = false;      // เพิ่งโผล่มาที่ประตู ต้องเดินออกห่างก่อนถึงจะวาปได้อีก
let heroS = 1, heroA = 1;

const SPEED = 0.55;        // ความเร็ว (ความสูงจอ ต่อวินาที)
const OPEN_DIST = 0.13;    // เดินเข้าใกล้ประตูคอกในระยะนี้ ประตูถึงจะเปิด
const GATE = { x: 0.758, y: 0.35 };   // จุดกลางประตูคอก
const PORTAL_R = 0.055;    // เดินเข้าใกล้ประตูวาปในระยะนี้ (เทียบความสูงจอ) = วาป

/* ---------- ข้อมูลแมพ ----------
   พิกัดทั้งหมดเป็น 0-1 ของ "ภาพแมพ" (local)
   bounds = เดินได้ในกรอบนี้, solids = สิ่งกีดขวาง (เท้าตัวละครห้ามเข้า)
   hs = ขนาดตัวละคร, speed = ความเร็ว, doors = ประตูไปแมพอื่น */
const MAPS = {
  field: {
    name: 'ทุ่งดอกไม้ดาว', hs: 1, speed: 1,
    bounds: { x0: .03, x1: .97, y0: .12, y1: .97 },
    portals: [{ id: 'field_p', x: .5, y: .90, size: .30, to: 'plaza', toPortal: 'plaza_p' }],
  },
  plaza: {
    name: 'จัตุรัสไข่ดาว', hs: .5, speed: .8,
    bounds: { x0: .03, x1: .97, y0: .10, y1: .96 },
    solids: [
      { x0: .64, x1: .965, y0: 0, y1: .25 },      // ตัวร้านไข่
      { x0: .69, x1: .775, y0: .25, y1: .285 },   // แผงหน้าร้านซ้าย
      { x0: .845, x1: .93, y0: .25, y1: .285 },   // แผงหน้าร้านขวา
      { x0: .09, x1: .20, y0: .07, y1: .27 },     // น้ำพุไข่ซ้ายบน
      { x0: .20, x1: .30, y0: .80, y1: 1 },       // น้ำพุไข่ซ้ายล่าง
      { x0: .91, x1: 1, y0: .58, y1: .80 },       // ลูกแก้วขวาล่าง
      { x0: .82, x1: 1, y0: .84, y1: 1 },
      { x0: 0, x1: .10, y0: .82, y1: 1 },
    ],
    portals: [{ id: 'plaza_p', x: .5, y: .20, size: .26, to: 'field', toPortal: 'field_p' }],
    doors: [{ x0: .78, x1: .84, y0: .255, y1: .30, to: 'shop', spawn: { x: .495, y: .86 }, walk: { x: .495, y: .70 } }],
  },
  shop: {
    name: 'ร้านไข่ดาราจักร', hs: .62, speed: .7,
    aspect: 1554 / 534,
    bounds: { x0: .08, x1: .93, y0: .30, y1: .95 },
    solids: [
      { x0: .10, x1: .30, y0: 0, y1: .57 },       // ชั้นไข่
      { x0: .295, x1: .335, y0: 0, y1: .48 },     // ตู้คอมพิวเตอร์
      { x0: .19, x1: .345, y0: .59, y1: .85 },    // ม้านั่งไข่
      { x0: .05, x1: .15, y0: .50, y1: .90 },     // ลูกแก้ว + ต้นไม้
      { x0: .63, x1: .815, y0: 0, y1: .55 },      // เคาน์เตอร์
      { x0: .84, x1: .93, y0: 0, y1: .57 },       // ตู้ข้างขวา
      { x0: .80, x1: .885, y0: .58, y1: .85 },    // โต๊ะ
      { x0: .885, x1: .96, y0: .58, y1: .82 },    // ต้นไม้ขวา
      { x0: 0, x1: .41, y0: .84, y1: 1 },         // เหลือแค่ช่องทางเดินไปประตู
      { x0: .59, x1: 1, y0: .84, y1: 1 },
      { x0: .35, x1: .405, y0: .74, y1: .84 },
      { x0: .605, x1: .65, y0: .74, y1: .84 },
    ],
    talk: { x0: .64, x1: .81, y0: .55, y1: .66 },   // ยืนหน้าเคาน์เตอร์ = คุยกับพนักงาน
    exit: { x0: .44, x1: .55, y0: .88, y1: 1, to: 'plaza', spawn: { x: .81, y: .34 }, walk: { x: .81, y: .44 } },
  },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const inR = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const anim = (ms, fn) => new Promise((res) => {
  const t0 = performance.now();
  (function f(n) { const k = Math.min(1, (n - t0) / ms); fn(k); k < 1 ? requestAnimationFrame(f) : res(); })(t0);
});

// กรอบที่ภาพแมพวางอยู่บนจอ (0-1 ของจอ) — แมพทุ่ง/จัตุรัสยืดเต็มจอ, ร้านไข่วางกลางจอตามสัดส่วนภาพ
function viewRect(m) {
  if (!m.aspect) return { x: 0, y: 0, w: 1, h: 1 };
  const W = game.clientWidth, H = game.clientHeight;
  if (W / H >= m.aspect) { const w = H * m.aspect / W; return { x: (1 - w) / 2, y: 0, w, h: 1 }; }
  const h = W / m.aspect / H; return { x: 0, y: (1 - h) / 2, w: 1, h };
}
const toL = (r, x, y) => ({ x: (x - r.x) / r.w, y: (y - r.y) / r.h });
const toS = (r, l) => ({ x: r.x + l.x * r.w, y: r.y + l.y * r.h });

function canStand(m, sx, sy) {
  const l = toL(viewRect(m), sx, sy);
  if (!inR(m.bounds, l.x, l.y)) return false;
  return !(m.solids || []).some((s) => inR(s, l.x, l.y));
}
function moveHero(dx, dy) {
  const m = MAPS[curMap];
  if (canStand(m, pos.x + dx, pos.y + dy)) { pos.x += dx; pos.y += dy; return true; }
  if (dx && canStand(m, pos.x + dx, pos.y)) { pos.x += dx; return true; }
  if (dy && canStand(m, pos.x, pos.y + dy)) { pos.y += dy; return true; }
  return false;
}

/* ---------- ประตูวาป (สไปรต์จาก portal_*.png แถบ 8 เฟรม) ---------- */
const PORTAL_STRIP = { idle: 'portal_idle.png', open: 'portal_open.png', warp: 'portal_warp.png' };
Object.values(PORTAL_STRIP).forEach((u) => { new Image().src = u; });
const PORTALS = [];
Object.entries(MAPS).forEach(([mid, m]) => (m.portals || []).forEach((d) => {
  const el = document.createElement('div');
  el.className = 'portal';
  el.style.left = d.x * 100 + '%';
  el.style.top = d.y * 100 + '%';
  el.style.width = `calc(var(--u,6px) * ${d.size * 100})`;
  el.style.zIndex = Math.round(d.y * 1000) - 1;
  el.innerHTML = '<span class="sprite"></span>';
  game.appendChild(el);
  PORTALS.push({ ...d, map: mid, sx: d.x, sy: d.y, el, body: el.firstChild, state: 'idle', t0: 0, keep: false, strip: '' });
}));
const portalIn = (mid) => PORTALS.filter((p) => p.map === mid);

function stepPortals(now) {
  for (const p of PORTALS) {
    if (p.map !== curMap) continue;
    let name = p.state, f;
    if (name === 'open') {
      const k = (now - p.t0) / 560;
      if (k >= 1) { p.state = p.keep ? 'warp' : 'idle'; name = p.state; }
      f = Math.min(7, Math.floor(Math.max(0, k) * 8));
      if (name !== 'open') f = Math.floor(now / 90) % 8;
    } else if (name === 'warp') f = Math.floor(now / 70) % 8;
    else f = Math.floor(now / 110) % 8;
    if (p.strip !== name) {
      p.strip = name;
      p.body.style.setProperty('--walk', `url("${PORTAL_STRIP[name]}")`);
      p.body.style.setProperty('--n', 8);
    }
    p.body.style.backgroundPositionX = (f / 7 * 100) + '%';
  }
}

/* ---------- เปลี่ยนแมพ ---------- */
function setBusy(v) { busy = v; game.classList.toggle('busy', v); }
function showToast(t) {
  toastEl.textContent = t;
  toastEl.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}
function enterMap(id) {
  curMap = id;
  game.dataset.map = id;
  PORTALS.forEach((p) => { p.el.style.display = p.map === id ? '' : 'none'; });
  showToast(MAPS[id].name);
}
enterMap('field');

// แปลงพิกัดนิ้ว/เมาส์ เป็นพิกัดในหน้าเกม (รองรับตอนจอถูกหมุนอัตโนมัติ)
const rotated = () => matchMedia('(orientation:portrait) and (pointer:coarse)').matches;
function toLocal(cx, cy) {
  if (rotated()) return { x: cy, y: window.innerWidth - cx };
  const r = game.getBoundingClientRect();
  return { x: cx - r.left, y: cy - r.top };
}

game.addEventListener('pointerdown', (e) => {
  if (busy) return;
  const p = toLocal(e.clientX, e.clientY);
  const m = MAPS[curMap], r = viewRect(m), b = m.bounds;
  const l = toL(r, p.x / game.clientWidth, p.y / game.clientHeight);
  target = toS(r, { x: clamp(l.x, b.x0, b.x1), y: clamp(l.y, b.y0, b.y1) });
  mark.style.left = target.x * 100 + '%';
  mark.style.top = target.y * 100 + '%';
  mark.classList.remove('show'); void mark.offsetWidth; mark.classList.add('show');
});

addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ประตูคอก: 5 เฟรม (0 ปิด -> 4 เปิดสุด) ค่อย ๆ เปลี่ยนทีละเฟรม
let gateFrame = 0;
setInterval(() => {
  const want = gateOpen ? 4 : 0;
  if (gateFrame === want) return;
  gateFrame += gateFrame < want ? 1 : -1;
  gate.style.backgroundPosition = (gateFrame * 25) + '% 0';
}, 110);
let gateOpen = false;


// หน้าโหลดตอนวาป: หลอด 0-100% (โหลดรูปแมพปลายทางจริงไปด้วย) เต็มแล้วไปต่อเอง ไม่ต้องกดอะไร
const mapLoadEl = document.getElementById('mapLoad');
// หน้าโหลดตอนเข้าจัตุรัสไข่ดาว (สไปรต์ชีต 6 เฟรม: 0,20,40,60,80,100 %)
const PLAZA_STEPS = [0, 20, 40, 60, 80, 100];
const PLAZA_FRAMES = PLAZA_STEPS.map((_, i) => `loadplaza_${i}.jpg`);
const MAP_IMGS = { field: ['map.png', 'pen.png', 'gate.png'], plaza: ['plaza.png', ...PLAZA_FRAMES], shop: ['shop.png', 'clerk_talk.png'] };
async function runMapLoad(id) {
  document.getElementById('mapLoadName').textContent = MAPS[id].name;
  const fillEl = document.getElementById('mapFill'), pctEl = document.getElementById('mapPercent');
  fillEl.style.width = '0%'; pctEl.textContent = '0%';
  const artMode = id === 'plaza';
  const artEl = document.getElementById('mapLoadArt'), artBg = document.getElementById('mapLoadBg');
  mapLoadEl.classList.toggle('art', artMode);
  if (artMode) { artEl.src = PLAZA_FRAMES[0]; artBg.style.backgroundImage = `url(${PLAZA_FRAMES[0]})`; }
  mapLoadEl.classList.add('on');
  warpFx.classList.remove('on');
  let ready = false;
  Promise.all((MAP_IMGS[id] || []).map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = u; })))
    .then(() => { ready = true; });
  let pr = 0;
  while (pr < 100) {
    await sleep(55);
    pr = Math.min(100, pr + Math.ceil(Math.random() * 4));
    if (pr >= 100 && !ready) pr = 99;       // รอรูปโหลดเสร็จก่อนค่อยถึง 100
    fillEl.style.width = pr + '%'; pctEl.textContent = pr + '%';
    if (artMode) {
      let f = 0;
      PLAZA_STEPS.forEach((t, i) => { if (pr >= t) f = i; });
      artEl.src = PLAZA_FRAMES[f]; artBg.style.backgroundImage = `url(${PLAZA_FRAMES[f]})`;
    }
  }
  await sleep(250);
}

/* ---------- วาปข้ามแมพ ---------- */
// เดินเข้าประตูวาป: ตัวละครถูกดูดเข้า -> แฟลช -> เปลี่ยนแมพ -> โผล่จากประตูอีกฝั่ง
async function travelPortal(p) {
  setBusy(true); target = null;
  p.state = 'open'; p.t0 = performance.now(); p.keep = true;
  const sx = pos.x, sy = pos.y, ex = p.sx, ey = p.sy - 0.03;
  await anim(560, (k) => { pos.x = sx + (ex - sx) * k; pos.y = sy + (ey - sy) * k; heroS = 1 - k * 0.9; heroA = 1 - k; });
  warpFx.classList.add('on');
  await sleep(420);
  p.state = 'idle'; p.keep = false;
  await runMapLoad(p.to);          // หน้าโหลด 0-100% แล้วไปต่ออัตโนมัติ
  enterMap(p.to);
  const q = PORTALS.find((z) => z.id === p.toPortal);
  q.state = 'open'; q.t0 = performance.now(); q.keep = false;
  pos.x = q.sx; pos.y = q.sy - 0.03; heroS = 0.1; heroA = 0;
  hero.classList.remove('left');
  warpFx.classList.remove('on');
  mapLoadEl.classList.remove('on');
  await sleep(380);
  await anim(520, (k) => { heroS = 0.1 + 0.9 * k; heroA = k; pos.y = q.sy - 0.03 + 0.03 * k; });
  heroS = 1; heroA = 1;
  target = { x: q.sx, y: q.sy + (q.sy > 0.5 ? -0.14 : 0.14) };   // เดินออกจากประตูเอง (เข้าหากลางจอ)
  lock = true;
  setBusy(false);
}

// เข้า/ออกร้านไข่: เฟดจอ -> เปลี่ยนแมพ
async function travelDoor(d) {
  setBusy(true); target = null;
  warpFx.classList.add('on');
  await sleep(400);
  await runMapLoad(d.to);          // หน้าโหลด 0-100% แล้วไปต่ออัตโนมัติ
  enterMap(d.to);
  const r = viewRect(MAPS[d.to]);
  const s = toS(r, d.spawn), w = toS(r, d.walk);
  pos.x = s.x; pos.y = s.y; heroS = 1; heroA = 1;
  warpFx.classList.remove('on');
  mapLoadEl.classList.remove('on');
  await sleep(380);
  target = w;
  lock = true;
  setBusy(false);
}

let heroFrame = -1;
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (game.classList.contains('active')) {
    const W = game.clientWidth, H = game.clientHeight;
    const m = MAPS[curMap];
    game.style.setProperty('--u', (H / 100) + 'px');
    game.style.setProperty('--hu', (H / 100 * m.hs) + 'px');

    // ภาพห้องในร้านวางกลางจอ
    if (m.aspect) {
      const r = viewRect(m);
      roomEl.style.left = r.x * 100 + '%'; roomEl.style.top = r.y * 100 + '%';
      roomEl.style.width = r.w * 100 + '%'; roomEl.style.height = r.h * 100 + '%';
    }

    let moving = false, dirx = 0;
    if (!busy) {
      const sp = SPEED * m.speed;
      // เดินตามปุ่มคีย์บอร์ด (ถ้ามี)
      const kx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
      const ky = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
      if (kx || ky) {
        target = null;
        const len = Math.hypot(kx, ky);
        moving = moveHero((kx / len) * sp * dt * H / W, (ky / len) * sp * dt);
        dirx = kx;
      } else if (target) {
        const dx = (target.x - pos.x) * W, dy = (target.y - pos.y) * H;
        const dist = Math.hypot(dx, dy), step = sp * H * dt;
        if (dist <= step) { moveHero(target.x - pos.x, target.y - pos.y); target = null; }
        else if (moveHero((dx / dist) * step / W, (dy / dist) * step / H)) { moving = true; dirx = dx; }
        else target = null;   // ชนของ หยุดเดิน
      }
    }
    hero.style.left = pos.x * 100 + '%';
    hero.style.top = pos.y * 100 + '%';
    hero.style.setProperty('--s', heroS);
    hero.style.opacity = heroA;
    hero.classList.toggle('walk', moving);
    if (dirx) hero.classList.toggle('left', dirx < 0);

    // เดิน -> วนเฟรมเดิน (~11 เฟรม/วินาที) / หยุด -> เฟรมแรก
    const hc = CHARS[current];
    const hf = moving ? Math.floor(now / 90) % hc.frames : 0;
    if (hf !== heroFrame) { heroFrame = hf; showFrame(heroBody, hc, hf); }

    stepPortals(now);

    // ประตูคอก (เฉพาะแมพทุ่ง): ตัวละครเดินเข้าใกล้ -> เปิด / ออกห่าง -> ปิด
    const gd = Math.hypot((pos.x - GATE.x) * W, (pos.y - GATE.y) * H);
    gateOpen = curMap === 'field' && gd < OPEN_DIST * H;

    // เช็กจุดวาป / ประตูร้าน / ประตูออก / หน้าเคาน์เตอร์
    if (!busy) {
      const l = toL(viewRect(m), pos.x, pos.y);
      const np = portalIn(curMap).find((p) => Math.hypot((pos.x - p.sx) * W, (pos.y - p.sy) * H) < PORTAL_R * H);
      const door = (m.doors || []).find((d) => inR(d, l.x, l.y));
      const ex = m.exit && inR(m.exit, l.x, l.y);
      const talk = m.talk && inR(m.talk, l.x, l.y);
      if (lock) { if (!np && !door && !ex && !talk) lock = false; }
      else if (np) travelPortal(np);
      else if (door) travelDoor(door);
      else if (ex) travelDoor(m.exit);
      else if (talk) { lock = true; openNpc(); }
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);


/* ================= สัตว์เลี้ยง / ไข่ / กระเป๋า ================= */
// walk = จำนวนเฟรมเดิน, fx = จำนวนเฟรมเอฟเฟกต์รอบตัว (เล่นตอนยืนนิ่ง), color = สีแสงตอนฟัก
const ANIMALS = [
  { id: 'starchick',     name: 'Starchick',      th: 'ลูกเจี๊ยบนทอง มีประกายดาว',        color: '#ffd45e', walk: 7, fx: 5 },
  { id: 'moonbunny',     name: 'Moon Bunny',     th: 'กระต่ายพระจันทร์',                  color: '#b9a6ff', walk: 6, fx: 5 },
  { id: 'cloudlamb',     name: 'Cloud Lamb',     th: 'ขนฟูเป็นก้อนเมฆ',                   color: '#a9c8ff', walk: 5, fx: 5 },
  { id: 'dewduck',       name: 'Dew Duck',       th: 'เป็ดสีฟ้าใส มีหยดน้ำ',               color: '#6cc6ff', walk: 6, fx: 5 },
  { id: 'twilightkitty', name: 'Twilight Kitty', th: 'แมวหูดาว',                          color: '#8f7bff', walk: 6, fx: 4 },
  { id: 'berrypiglet',   name: 'Berry Piglet',   th: 'หมูสีชมพูแก้มเบอร์รี่',               color: '#ff8fb8', walk: 5, fx: 4 },
  { id: 'mossturtle',    name: 'Moss Turtle',    th: 'เต่ามีมอสและดอกไม้บนกระดอง',        color: '#8fd66a', walk: 5, fx: 4 },
  { id: 'cosmogoat',     name: 'Cosmo Goat',     th: 'แพะเขาโค้งเหมือนเสี้ยวจันทร์',       color: '#c9b8ff', walk: 6, fx: 4 },
];
const A_BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));
const petWalk = (a) => `pet_${a.id}_walk.png`;
const petFx = (a) => `pet_${a.id}_fx.png`;
const hatchUrl = (a) => `hatch_${a.id}.png`;
const EGG_IMG = 'egg_common.png';
// โหลดรูปไว้ล่วงหน้า
ANIMALS.forEach((a) => { [petWalk(a), petFx(a), hatchUrl(a)].forEach((u) => { new Image().src = u; }); });
new Image().src = EGG_IMG;

const BAG_SLOTS = 20;      // ช่องกระเป๋า (ไข่ 1 กอง = 1 ช่อง, สัตว์ 1 ตัว = 1 ช่อง)
const PEN_MAX = 8;         // สัตว์ในคอกได้สูงสุดกี่ตัว
const PEN = { x0: 0.58, x1: 0.95, y0: 0.14, y1: 0.33 };   // พื้นที่ที่สัตว์เดินเล่นในคอก (0-1 ของจอ)

/* ---------- เซฟ ---------- */
let save = { eggs: 3, pets: [], nextUid: 1, coins: 500, gems: 3, level: 1, xp: 0 };   // ไข่เริ่มต้น 3 ฟอง (เอาไว้ลอง)
try {
  const raw = JSON.parse(localStorage.getItem('fp_save') || 'null');
  if (raw && Array.isArray(raw.pets)) save = Object.assign(save, raw);
} catch (e) {}
const persist = () => { try { localStorage.setItem('fp_save', JSON.stringify(save)); } catch (e) {} };
const slotsUsed = () => (save.eggs > 0 ? 1 : 0) + save.pets.length;
// ใช้ทดสอบในคอนโซล: fpGiveEggs(5)
window.fpGiveEggs = (n = 1) => { save.eggs += n; persist(); renderBag(); updateBadge(); };

/* ---------- สัตว์เดินเล่นในคอก ---------- */
const runtime = new Map();   // uid -> สถานะเดิน
const rand = (a, b) => a + Math.random() * (b - a);

function syncPen() {
  const outs = save.pets.filter((p) => p.out);
  // เอาตัวที่เก็บเข้ากระเป๋าแล้วออก
  for (const [uid, rt] of runtime) {
    if (!outs.some((p) => p.uid === uid)) { rt.el.remove(); runtime.delete(uid); }
  }
  // เพิ่มตัวที่เพิ่งปล่อย
  outs.forEach((p) => {
    if (runtime.has(p.uid)) return;
    const a = A_BY_ID[p.id];
    const el = document.createElement('div');
    el.className = 'pet';
    el.innerHTML = '<span class="petbody sprite"></span>';
    game.appendChild(el);
    const x = rand(PEN.x0, PEN.x1), y = rand(PEN.y0, PEN.y1);
    runtime.set(p.uid, { el, body: el.firstChild, a, x, y, tx: x, ty: y, wait: rand(0.3, 2.5), moving: false, left: false, mode: '', phase: Math.random() * 10 });
  });
}

let lastPet = performance.now();
function petLoop(now) {
  const dt = Math.min(0.05, (now - lastPet) / 1000);
  lastPet = now;
  if (game.classList.contains('active')) {
    const W = game.clientWidth, H = game.clientHeight;
    for (const rt of runtime.values()) {
      if (rt.wait > 0) {
        rt.wait -= dt; rt.moving = false;
        if (rt.wait <= 0) { rt.tx = rand(PEN.x0, PEN.x1); rt.ty = rand(PEN.y0, PEN.y1); }
      } else {
        const dx = (rt.tx - rt.x) * W, dy = (rt.ty - rt.y) * H;
        const dist = Math.hypot(dx, dy), step = 0.075 * H * dt;
        if (dist <= step) { rt.x = rt.tx; rt.y = rt.ty; rt.wait = rand(1.5, 4.5); rt.moving = false; }
        else { rt.x += (dx / dist) * step / W; rt.y += (dy / dist) * step / H; rt.moving = true; if (Math.abs(dx) > 1) rt.left = dx < 0; }
      }
      const mode = rt.moving ? 'walk' : 'fx';
      if (mode !== rt.mode) {
        rt.mode = mode;
        rt.body.style.setProperty('--walk', `url("${mode === 'walk' ? petWalk(rt.a) : petFx(rt.a)}")`);
        rt.body.style.setProperty('--n', mode === 'walk' ? rt.a.walk : rt.a.fx);
      }
      const n = mode === 'walk' ? rt.a.walk : rt.a.fx;
      const f = Math.floor(now / 1000 * (mode === 'walk' ? 9 : 6) + rt.phase) % n;
      rt.body.style.backgroundPositionX = (n > 1 ? f / (n - 1) * 100 : 0) + '%';
      rt.el.style.left = rt.x * 100 + '%';
      rt.el.style.top = rt.y * 100 + '%';
      rt.el.style.zIndex = Math.round(rt.y * 1000);
      rt.el.classList.toggle('left', rt.left);
    }
    hero.style.zIndex = Math.round(pos.y * 1000);   // ตัวละครซ้อนหน้า/หลังสัตว์ตามตำแหน่ง
  }
  requestAnimationFrame(petLoop);
}
requestAnimationFrame(petLoop);

/* ---------- กระเป๋า ---------- */
const bagBtn = document.getElementById('bagBtn');
const bagBadge = document.getElementById('bagBadge');
const bagWin = document.getElementById('bagWin');
const bagGrid = document.getElementById('bagGrid');
const bagInfo = document.getElementById('bagInfo');
const bagCap = document.getElementById('bagCap');
let selected = null;   // 'egg' หรือ uid ของสัตว์

// ปุ่ม/หน้าต่างทั้งหมดไม่ให้ไปสั่งตัวละครเดิน
document.querySelectorAll('#game .ui').forEach((el) => {
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
});

function updateBadge() {
  bagBadge.hidden = save.eggs <= 0;
  bagBadge.textContent = save.eggs;
}

function spriteEl(url, n, cls = '') {
  const s = document.createElement('span');
  s.className = 'sprite ' + cls;
  s.style.setProperty('--walk', `url("${url}")`);
  s.style.setProperty('--n', n);
  s.style.backgroundPositionX = '0%';
  return s;
}

function renderBag() {
  bagGrid.innerHTML = '';
  bagCap.textContent = `${slotsUsed()} / ${BAG_SLOTS} ช่อง`;
  if (selected === 'egg' && save.eggs <= 0) selected = null;
  if (selected !== null && selected !== 'egg' && !save.pets.some((p) => p.uid === selected)) selected = null;
  const items = [];
  if (save.eggs > 0) items.push({ key: 'egg' });
  save.pets.forEach((p) => items.push({ key: p.uid, pet: p }));
  for (let i = 0; i < BAG_SLOTS; i++) {
    const it = items[i];
    const b = document.createElement('button');
    b.type = 'button';
    if (!it) { b.className = 'slot empty'; b.disabled = true; bagGrid.appendChild(b); continue; }
    b.className = 'slot' + (selected === it.key ? ' sel' : '');
    if (it.key === 'egg') {
      const ic = document.createElement('span'); ic.className = 'ico'; ic.style.backgroundImage = `url("${EGG_IMG}")`;
      const c = document.createElement('span'); c.className = 'cnt'; c.textContent = '×' + save.eggs;
      b.append(ic, c);
    } else {
      b.appendChild(spriteEl(petWalk(A_BY_ID[it.pet.id]), A_BY_ID[it.pet.id].walk));
      if (it.pet.out) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = 'คอก'; b.appendChild(t); }
    }
    b.addEventListener('click', () => { selected = it.key; renderBag(); });
    bagGrid.appendChild(b);
  }
  renderInfo();
}

let infoAnim = null;   // เอฟเฟกต์เคลื่อนไหวของสัตว์ในช่องรายละเอียด
function renderInfo() {
  bagInfo.innerHTML = '';
  infoAnim = null;
  if (selected === null) {
    bagInfo.innerHTML = '<p class="bag-hint">แตะไอเทมในกระเป๋า<br>เพื่อดูรายละเอียด</p>';
    return;
  }
  if (selected === 'egg') {
    const big = document.createElement('div'); big.className = 'big ico'; big.style.backgroundImage = `url("${EGG_IMG}")`;
    bagInfo.innerHTML = '<span class="rar">COMMON</span><h3>ไข่ธรรมดา</h3><p>ฟักแล้วจะได้สัตว์สุ่ม 1 ตัว<br>จากทั้งหมด 8 ชนิด</p>';
    bagInfo.prepend(big);
    const go = document.createElement('button'); go.type = 'button'; go.className = 'bag-btn2'; go.textContent = 'ฟักไข่';
    go.addEventListener('click', startHatch);
    bagInfo.appendChild(go);
    return;
  }
  const p = save.pets.find((q) => q.uid === selected), a = A_BY_ID[p.id];
  const big = spriteEl(petFx(a), a.fx, 'big');
  infoAnim = { el: big, n: a.fx };
  bagInfo.innerHTML = `<span class="rar">COMMON</span><h3>${a.name}</h3><p>${a.th}</p>`;
  bagInfo.prepend(big);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'bag-btn2' + (p.out ? ' alt' : '');
  btn.textContent = p.out ? 'เก็บเข้ากระเป๋า' : 'ปล่อยลงคอก';
  btn.addEventListener('click', () => {
    if (!p.out && save.pets.filter((q) => q.out).length >= PEN_MAX) { alert(`คอกเต็มแล้ว (สูงสุด ${PEN_MAX} ตัว)`); return; }
    p.out = !p.out; persist(); syncPen(); renderBag();
  });
  bagInfo.appendChild(btn);
}
setInterval(() => {
  if (!infoAnim || bagWin.hidden) return;
  const f = Math.floor(performance.now() / 160) % infoAnim.n;
  infoAnim.el.style.backgroundPositionX = (infoAnim.n > 1 ? f / (infoAnim.n - 1) * 100 : 0) + '%';
}, 80);

bagBtn.addEventListener('click', () => { bagWin.hidden = false; renderBag(); });
document.getElementById('bagClose').addEventListener('click', () => { bagWin.hidden = true; });
bagWin.addEventListener('click', (e) => { if (e.target === bagWin) bagWin.hidden = true; });

/* ---------- ฟักไข่ ---------- */
const hatchWin = document.getElementById('hatchWin');
const hatchEgg = document.getElementById('hatchEgg');
const hatchGlow = document.getElementById('hatchGlow');
const hatchText = document.getElementById('hatchText');
const hatchRes = document.getElementById('hatchRes');
let hatching = false;

function setHatchFrame(f) { hatchEgg.style.backgroundPositionX = (f / 5 * 100) + '%'; }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function startHatch() {
  if (hatching || save.eggs <= 0) return;
  hatching = true;
  // สุ่มสัตว์ แล้วเซฟก่อนเล่นอนิเมชัน (ปิดแอปกลางคันก็ไม่เสียไข่ฟรี)
  const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  save.eggs -= 1;
  const pet = { uid: save.nextUid++, id: a.id, out: save.pets.filter((p) => p.out).length < PEN_MAX };
  save.pets.push(pet);
  persist(); updateBadge();

  hatchWin.hidden = false; hatchRes.hidden = true;
  hatchWin.style.setProperty('--gc', a.color);
  hatchEgg.style.setProperty('--hs', `url("${hatchUrl(a)}")`);
  hatchGlow.classList.remove('flash');
  hatchText.textContent = 'ไข่กำลังสั่น...';
  setHatchFrame(0);
  hatchEgg.className = 'hatch-egg shake';
  await wait(1300);
  hatchText.textContent = 'ไข่เริ่มแตก!';
  for (let f = 1; f <= 4; f++) {
    setHatchFrame(f);
    hatchEgg.classList.toggle('shake', f < 4);
    await wait(f < 4 ? 650 : 750);
  }
  hatchEgg.className = 'hatch-egg';
  void hatchGlow.offsetWidth; hatchGlow.classList.add('flash');
  setHatchFrame(5);
  void hatchEgg.offsetWidth; hatchEgg.classList.add('pop');
  hatchText.textContent = '';
  await wait(900);
  document.getElementById('hatchName').textContent = a.name;
  document.getElementById('hatchSub').textContent = a.th + (pet.out ? ' · ปล่อยลงคอกแล้ว' : ' · เก็บไว้ในกระเป๋า (คอกเต็ม)');
  hatchRes.hidden = false;
  selected = pet.uid;
}
document.getElementById('hatchOk').addEventListener('click', () => {
  hatchWin.hidden = true; hatching = false;
  syncPen(); renderBag();
});

// เริ่มเกม: แสดงสัตว์ที่ปล่อยไว้ + ตัวเลขบนปุ่มกระเป๋า
syncPen(); updateBadge();


/* ================= พนักงานร้านไข่ + ซื้อไข่ ================= */
const EGG_PRICE = 100;   // ราคาไข่ต่อฟอง (เหรียญ)
const coinNum = document.getElementById('coinNum');
const npcWin = document.getElementById('npcWin');
const npcFace = document.getElementById('npcFace');
const npcText = document.getElementById('npcText');
const shopWin = document.getElementById('shopWin');
const qtyNum = document.getElementById('qtyNum');
const shopMsg = document.getElementById('shopMsg');
let qty = 1;

const updateCoins = () => { coinNum.textContent = save.coins; };
const xpNeed = (lv) => 100 * lv;   // EXP ที่ต้องใช้เลื่อนจาก lv นี้ไปเลเวลถัดไป

// โปรไฟล์: รูป+ชื่อตามตัวละครที่เลือก, เลเวล, แถบ EXP, เพชร
function updateProfile() {
  const c = CHARS[current];
  document.getElementById('hudAvatar').style.setProperty('--av', `url("${portraitUrl(c)}")`);
  document.getElementById('hudName').textContent = c.name;
  document.getElementById('hudLv').textContent = 'Lv. ' + save.level;
  const need = xpNeed(save.level);
  document.getElementById('hudXpFill').style.width = Math.min(100, save.xp / need * 100) + '%';
  document.getElementById('hudXpTxt').textContent = `${save.xp} / ${need}`;
  document.getElementById('gemNum').textContent = save.gems;
}
updateCoins(); updateProfile();

function npcFrame(f) { npcFace.style.backgroundPositionX = (f / 5 * 100) + '%'; }
npcFrame(0);

const NPC_LINES = [
  'ยินดีต้อนรับสู่ร้านไข่ดาราจักรค่ะ! ✨\nวันนี้จะรับไข่สักฟองไหมคะ? ฟักแล้วได้สัตว์เลี้ยงสุ่มเลยนะ',
];
let npcTimer = null;
function openNpc() {
  setBusy(true); target = null;
  npcWin.hidden = false;
  const line = NPC_LINES[Math.floor(Math.random() * NPC_LINES.length)];
  let i = 0;
  npcText.textContent = '';
  clearInterval(npcTimer);
  npcTimer = setInterval(() => {
    i++;
    npcText.textContent = line.slice(0, i);
    npcFrame(Math.floor(i / 3) % 4);   // พนักงานขยับปากตอนพูด
    if (i >= line.length) { clearInterval(npcTimer); npcFrame(1); }
  }, 32);
}
function closeNpc() { clearInterval(npcTimer); npcWin.hidden = true; }
document.getElementById('npcBye').addEventListener('click', () => { closeNpc(); setBusy(false); });
document.getElementById('npcBuy').addEventListener('click', () => { closeNpc(); openShop(); });

function renderShop() {
  const maxQty = Math.max(1, Math.floor(save.coins / EGG_PRICE));
  qty = clamp(qty, 1, Math.min(99, maxQty));
  const total = qty * EGG_PRICE;
  document.getElementById('shopCoins').textContent = `เหรียญ ${save.coins}`;
  document.getElementById('shopPrice').textContent = EGG_PRICE;
  document.getElementById('shopHave').textContent = `ในกระเป๋า: ไข่ ×${save.eggs}`;
  qtyNum.textContent = qty;
  document.getElementById('shopTotal').textContent = total;
  const btn = document.getElementById('shopBuyBtn');
  const noCoin = save.coins < total;
  const noSlot = save.eggs <= 0 && slotsUsed() >= BAG_SLOTS;
  btn.disabled = noCoin || noSlot;
  shopMsg.textContent = noCoin ? 'เหรียญไม่พอ' : noSlot ? 'กระเป๋าเต็ม' : '';
}
function openShop() { qty = 1; shopMsg.textContent = ''; renderShop(); shopWin.hidden = false; }
function closeShop() { shopWin.hidden = true; setBusy(false); }
document.getElementById('shopClose').addEventListener('click', closeShop);
shopWin.addEventListener('click', (e) => { if (e.target === shopWin) closeShop(); });
document.getElementById('qtyMinus').addEventListener('click', () => { qty -= 1; renderShop(); });
document.getElementById('qtyPlus').addEventListener('click', () => { qty += 1; renderShop(); });
document.getElementById('shopBuyBtn').addEventListener('click', () => {
  const total = qty * EGG_PRICE;
  if (save.coins < total) return;
  if (save.eggs <= 0 && slotsUsed() >= BAG_SLOTS) return;
  save.coins -= total; save.eggs += qty;
  persist(); updateCoins(); updateBadge(); renderBag();
  showToast(`ซื้อไข่ ×${qty} แล้ว`);
  qty = 1; renderShop();
});
// ใช้ทดสอบในคอนโซล: fpGiveCoins(1000)
window.fpGiveCoins = (n = 100) => { save.coins += n; persist(); updateCoins(); };
// ใช้ทดสอบในคอนโซล: fpGiveGems(5), fpGiveXp(50)
window.fpGiveGems = (n = 1) => { save.gems += n; persist(); updateProfile(); };
window.fpGiveXp = (n = 10) => {
  save.xp += n;
  while (save.xp >= xpNeed(save.level)) { save.xp -= xpNeed(save.level); save.level += 1; }
  persist(); updateProfile();
};
