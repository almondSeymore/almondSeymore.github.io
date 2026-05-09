const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";
document.body.style.userSelect = "none";
document.body.style.webkitUserSelect = "none";
document.body.style.webkitTouchCallout = "none";

canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
canvas.style.webkitUserSelect = "none";
canvas.style.webkitTouchCallout = "none";

document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());
document.addEventListener("gestureend", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());

ctx.font = isMobile ? "18px monospace" : "24px monospace";
ctx.textAlign = "center";

const player = {
  x: canvas.width / 2,
  y: isMobile ? canvas.height - 110 : canvas.height - 60,
  speed: isMobile ? 8 : 7,
  text: "!!*+*+*!!",
  width: 130,
  height: 24
};

let keys = {};
let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;
let wave = 1;
let enemiesPerWave = 2;
let paused = false;

let spawnQueue = 0;
let spawnTimer = 0;
let spawnDelay = 60;
let damageFlash = 0;

let touchLeft = false;
let touchRight = false;
let firing = false;
let fireCooldown = 0;

function createEnemies() {
  enemies = [];
  spawnQueue = enemiesPerWave;
  spawnTimer = 0;
  spawnDelay = Math.max(8, 60 - wave * 5);
}

createEnemies();

window.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " " && !gameOver && !paused) {
    shoot();
  }

  if (e.key.toLowerCase() === "p" && !gameOver) {
    paused = !paused;
  }

  if (e.key.toLowerCase() === "r" && gameOver) {
    restartGame();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

function shoot() {
  if (bullets.length < 10) {
    bullets.push({
      x: player.x,
      y: player.y - 25,
      speed: isMobile ? 11 : 9,
      text: "^",
      width: 12,
      height: 20
    });
  }
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * -200 - 50,
    text: "*+*",
    width: 45,
    height: 24,
    alive: true,
    initialized: false
  });
}

function updateSpawning() {
  if (spawnQueue > 0) {
    spawnTimer++;

    if (spawnTimer >= spawnDelay) {
      spawnEnemy();
      spawnQueue--;
      spawnTimer = 0;
    }
  }
}

function updatePlayer() {
  if (keys["ArrowLeft"] || keys["a"] || touchLeft) {
    player.x -= player.speed;
  }

  if (keys["ArrowRight"] || keys["d"] || touchRight) {
    player.x += player.speed;
  }

  if (player.x < player.width / 2) {
    player.x = player.width / 2;
  }

  if (player.x > canvas.width - player.width / 2) {
    player.x = canvas.width - player.width / 2;
  }
}

function updateBullets() {
  for (let bullet of bullets) {
    bullet.y -= bullet.speed;
  }

  bullets = bullets.filter(bullet => bullet.y > 0);
}

function updateEnemies() {
  for (let enemy of enemies) {
    if (!enemy.alive) continue;

    if (!enemy.initialized) {
      enemy.initialized = true;

      const mobileBoost = isMobile ? 1.45 : 1;

      enemy.speedX = (Math.random() - 0.5) * (2 + wave * 0.12);

      enemy.speedY =
        (0.8 + Math.random() * 1.4 + wave * 0.12) * mobileBoost;

      enemy.wobbleOffset = Math.random() * Math.PI * 2;
      enemy.wobbleSpeed = 0.02 + Math.random() * 0.04;
      enemy.wobbleAmount = 1.5 + Math.random() * 3;

      enemy.changeTimer = Math.floor(Math.random() * 90) + 40;
    }

    enemy.changeTimer--;

    if (enemy.changeTimer <= 0) {
      enemy.speedX += (Math.random() - 0.5) * 2.5;
      enemy.changeTimer = Math.floor(Math.random() * 90) + 40;
    }

    if (enemy.speedX > 3.5) enemy.speedX = 3.5;
    if (enemy.speedX < -3.5) enemy.speedX = -3.5;

    enemy.x += enemy.speedX;
    enemy.y += enemy.speedY;

    enemy.x +=
      Math.sin(Date.now() * enemy.wobbleSpeed + enemy.wobbleOffset) *
      enemy.wobbleAmount;

    if (enemy.x < 30) {
      enemy.x = 30;
      enemy.speedX *= -1;
    }

    if (enemy.x > canvas.width - 30) {
      enemy.x = canvas.width - 30;
      enemy.speedX *= -1;
    }

    if (enemy.y > canvas.height + 20) {
      enemy.alive = false;
      lives--;
      damageFlash = 10;

      if (lives <= 0) {
        gameOver = true;
      }
    }
  }
}

function checkCollisions() {
  for (let bullet of bullets) {
    for (let enemy of enemies) {
      if (!enemy.alive) continue;

      const hit =
        bullet.x > enemy.x - enemy.width / 2 &&
        bullet.x < enemy.x + enemy.width / 2 &&
        bullet.y > enemy.y - enemy.height &&
        bullet.y < enemy.y + enemy.height;

      if (hit) {
        enemy.alive = false;
        bullet.y = -100;
        score += 100;
      }
    }
  }

  if (spawnQueue === 0 && enemies.every(enemy => !enemy.alive)) {
    score += 500;
    wave++;
    enemiesPerWave += 2;
    createEnemies();
  }
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(0, 255, 220, 0.08)";
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

function drawPlayer() {
  ctx.fillStyle = "#00ffee";
  ctx.font = isMobile ? "18px monospace" : "24px monospace";
  ctx.textAlign = "center";
  ctx.fillText(player.text, player.x, player.y);
}

function drawBullets() {
  ctx.fillStyle = "#ffffff";
  ctx.font = isMobile ? "18px monospace" : "24px monospace";
  ctx.textAlign = "center";

  for (let bullet of bullets) {
    ctx.fillText(bullet.text, bullet.x, bullet.y);
  }
}

function drawEnemies() {
  ctx.fillStyle = "#ff4fd8";
  ctx.font = isMobile ? "18px monospace" : "24px monospace";
  ctx.textAlign = "center";

  for (let enemy of enemies) {
    if (enemy.alive) {
      ctx.fillText(enemy.text, enemy.x, enemy.y);
    }
  }
}

function drawHUD() {
  ctx.fillStyle = "#dcdac0";
  ctx.font = isMobile ? "24px monospace" : "20px monospace";

  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, 20, 35);
  ctx.fillText("LIVES: " + lives, 20, 65);
  ctx.fillText("WAVE: " + wave, 20, 95);

  if (!isMobile) {
    ctx.textAlign = "right";
    ctx.fillText("MOVE: ← → / A D   SHOOT: SPACE", canvas.width - 20, 35);
  }

  ctx.textAlign = "center";
}

function drawDamageFlash() {
  if (damageFlash > 0) {
    ctx.fillStyle = "rgba(0, 120, 255, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    damageFlash--;
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#dcdac0";
  ctx.font = isMobile ? "34px monospace" : "44px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = isMobile ? "20px monospace" : "22px monospace";
  ctx.fillText("FINAL SCORE: " + score, canvas.width / 2, canvas.height / 2);
  ctx.fillText("PRESS R TO RESTART", canvas.width / 2, canvas.height / 2 + 40);
}

function drawPaused() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#dcdac0";
  ctx.font = isMobile ? "34px monospace" : "44px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);

  ctx.font = isMobile ? "20px monospace" : "22px monospace";
  ctx.fillText("PRESS P TO RESUME", canvas.width / 2, canvas.height / 2 + 40);
}

function restartGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];
  wave = 1;
  enemiesPerWave = 2;
  spawnQueue = 0;
  spawnTimer = 0;
  spawnDelay = 60;
  damageFlash = 0;
  paused = false;
  firing = false;
  fireCooldown = 0;
  gameOver = false;
  player.x = canvas.width / 2;
  createEnemies();
}

function gameLoop() {
  drawBackground();

  if (!gameOver && !paused) {
    if (firing) {
      fireCooldown--;

      if (fireCooldown <= 0) {
        shoot();
        fireCooldown = 6;
      }
    }

    updateSpawning();
    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
  }

  drawPlayer();
  drawBullets();
  drawEnemies();
  drawHUD();
  drawDamageFlash();

  if (gameOver) {
    drawGameOver();
  }

  if (paused && !gameOver) {
    drawPaused();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.y = isMobile ? canvas.height - 110 : canvas.height - 60;
});

const controls = document.createElement("div");

controls.innerHTML = `
<div id="leftControls">
  <button id="shootBtn">^</button>
</div>

<div id="rightControls">
  <button id="leftBtn">◀</button>
  <button id="rightBtn">▶</button>
</div>

<button id="pauseBtn">P</button>
`;

document.body.appendChild(controls);

const leftControls = document.getElementById("leftControls");
const rightControls = document.getElementById("rightControls");
const pauseBtn = document.getElementById("pauseBtn");

leftControls.style.position = "fixed";
leftControls.style.left = "20px";
leftControls.style.bottom = isMobile ? "110px" : "120px";
leftControls.style.display = "flex";
leftControls.style.gap = "12px";
leftControls.style.zIndex = "9999";

rightControls.style.position = "fixed";
rightControls.style.right = "20px";
rightControls.style.bottom = isMobile ? "110px" : "120px";
rightControls.style.display = "flex";
rightControls.style.gap = "12px";
rightControls.style.zIndex = "9999";

pauseBtn.style.position = "fixed";
pauseBtn.style.top = "20px";
pauseBtn.style.right = "20px";
pauseBtn.style.zIndex = "10000";

document.querySelectorAll("button").forEach(button => {
  button.style.fontSize = isMobile ? "36px" : "28px";
  button.style.padding = isMobile ? "18px 24px" : "16px 20px";
  button.style.background = "rgba(0,0,0,0.7)";
  button.style.color = "#00ffee";
  button.style.border = "1px solid #00ffee";
  button.style.fontFamily = "monospace";
  button.style.borderRadius = "6px";
  button.style.backdropFilter = "blur(4px)";
  button.style.touchAction = "none";
  button.style.userSelect = "none";
  button.style.webkitUserSelect = "none";
  button.style.webkitTouchCallout = "none";
  button.style.webkitTapHighlightColor = "transparent";
});

function holdButton(id, onDown, onUp) {
  const btn = document.getElementById(id);

  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    onDown();
  });

  btn.addEventListener("pointerup", e => {
    e.preventDefault();
    onUp();
  });

  btn.addEventListener("pointercancel", e => {
    e.preventDefault();
    onUp();
  });

  btn.addEventListener("pointerleave", e => {
    e.preventDefault();
    onUp();
  });
}

holdButton("leftBtn", () => {
  touchLeft = true;
}, () => {
  touchLeft = false;
});

holdButton("rightBtn", () => {
  touchRight = true;
}, () => {
  touchRight = false;
});

holdButton("shootBtn", () => {
  firing = true;
  fireCooldown = 0;

  if (!gameOver && !paused) {
    shoot();
    fireCooldown = 6;
  }
}, () => {
  firing = false;
});

pauseBtn.addEventListener("pointerdown", e => {
  e.preventDefault();

  if (!gameOver) {
    paused = !paused;
  }
});

gameLoop();
