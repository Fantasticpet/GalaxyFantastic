const fill = document.getElementById('fill');
const percentText = document.getElementById('percent');
const loader = document.querySelector('.loader');
const playBtn = document.getElementById('playBtn');
const loading = document.getElementById('loading');
const game = document.getElementById('game');

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
  game.classList.add('active');
});
