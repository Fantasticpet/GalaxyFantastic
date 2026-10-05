const fill = document.getElementById('fill');
const percentText = document.getElementById('percent');
const loader = document.querySelector('.loader');
const playBtn = document.getElementById('playBtn');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const select = document.getElementById('select');

let progress = 0;

// โหลดจาก 1 ถึง 100% (ตอนนี้เป็นการจำลอง — เปลี่ยนเป็นโหลดรูป/เสียงจริงทีหลังได้)
const timer = setInterval(() => {
  progress += Math.ceil(Math.random() * 3);
  if (progress >= 100) progress = 100;

  fill.style.width = progress + '%';
  percentText.textContent = progress + '%';

  if (progress === 100) {
    clearInterval(timer);
    loader.hidden = true;
    playBtn.hidden = false;
  }
}, 80);

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
const portraitUrl = (c) => `chars/portrait_${c.id}.png`;
const walkUrl = (c) => `chars/walk_${c.id}.png`;

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
}
document.getElementById('selGo').addEventListener('click', startGame);
choose(current);


/* ================= ตัวละคร + ประตูคอก ================= */
const hero = document.getElementById('hero');
const mark = document.getElementById('mark');
const gate = document.getElementById('gate');

// ตำแหน่งตัวละคร / จุดหมาย เป็น 0-1 ของหน้าจอเกม
const pos = { x: 0.5, y: 0.6 };
let target = null;
const keys = {};

const SPEED = 0.55;        // ความเร็ว (ความสูงจอ ต่อวินาที)
const OPEN_DIST = 0.13;    // เดินเข้าใกล้ประตูในระยะนี้ (เทียบความสูงจอ) ประตูถึงจะเปิด
const GATE = { x: 0.758, y: 0.35 };   // จุดกลางประตูคอก

// แปลงพิกัดนิ้ว/เมาส์ เป็นพิกัดในหน้าเกม (รองรับตอนจอถูกหมุนอัตโนมัติ)
const rotated = () => matchMedia('(orientation:portrait) and (pointer:coarse)').matches;
function toLocal(cx, cy) {
  if (rotated()) return { x: cy, y: window.innerWidth - cx };
  const r = game.getBoundingClientRect();
  return { x: cx - r.left, y: cy - r.top };
}

game.addEventListener('pointerdown', (e) => {
  const p = toLocal(e.clientX, e.clientY);
  target = {
    x: Math.min(0.97, Math.max(0.03, p.x / game.clientWidth)),
    y: Math.min(0.97, Math.max(0.12, p.y / game.clientHeight)),
  };
  mark.style.left = target.x * 100 + '%';
  mark.style.top = target.y * 100 + '%';
  mark.classList.remove('show'); void mark.offsetWidth; mark.classList.add('show');
});

addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ประตู: 5 เฟรม (0 ปิด -> 4 เปิดสุด) ค่อย ๆ เปลี่ยนทีละเฟรม
let gateFrame = 0;
setInterval(() => {
  const want = gateOpen ? 4 : 0;
  if (gateFrame === want) return;
  gateFrame += gateFrame < want ? 1 : -1;
  gate.style.backgroundPosition = (gateFrame * 25) + '% 0';
}, 110);
let gateOpen = false;

let heroFrame = -1;
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (game.classList.contains('active')) {
    const W = game.clientWidth, H = game.clientHeight;
    game.style.setProperty('--u', (H / 100) + 'px');

    // เดินตามปุ่มคีย์บอร์ด (ถ้ามี)
    let kx = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
    let ky = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
    let moving = false, dirx = 0;

    if (kx || ky) {
      target = null;
      const len = Math.hypot(kx, ky);
      pos.x += (kx / len) * SPEED * dt * H / W;
      pos.y += (ky / len) * SPEED * dt;
      moving = true; dirx = kx;
    } else if (target) {
      const dx = (target.x - pos.x) * W, dy = (target.y - pos.y) * H;
      const dist = Math.hypot(dx, dy), step = SPEED * H * dt;
      if (dist <= step) { pos.x = target.x; pos.y = target.y; target = null; }
      else { pos.x += (dx / dist) * step / W; pos.y += (dy / dist) * step / H; moving = true; dirx = dx; }
    }

    pos.x = Math.min(0.97, Math.max(0.03, pos.x));
    pos.y = Math.min(0.97, Math.max(0.12, pos.y));
    hero.style.left = pos.x * 100 + '%';
    hero.style.top = pos.y * 100 + '%';
    hero.classList.toggle('walk', moving);
    if (dirx) hero.classList.toggle('left', dirx < 0);

    // เดิน -> วนเฟรมเดิน (~11 เฟรม/วินาที) / หยุด -> เฟรมแรก
    const hc = CHARS[current];
    const hf = moving ? Math.floor(now / 90) % hc.frames : 0;
    if (hf !== heroFrame) { heroFrame = hf; showFrame(heroBody, hc, hf); }

    // ตัวละครเดินเข้าใกล้ประตูพอ -> เปิด / เดินออกห่าง -> ปิด
    const gd = Math.hypot((pos.x - GATE.x) * W, (pos.y - GATE.y) * H);
    gateOpen = gd < OPEN_DIST * H;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
