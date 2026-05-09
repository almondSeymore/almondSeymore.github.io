const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.font = "24px monospace";
ctx.textAlign = "center";

const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  speed: 7,
  text: "!!*+*+*!!",
  width: 130,
  height: 24
};

let keys = {};
let bullets = [];
let enemies = [];
let enemyDirection = 1;
let score = 0;
let lives = 3;
let gameOver = false;
let wave = 1;
let enemiesPerWave = 2;
let paused = false;
let spawnQueue = 0;
let spawnTimer = 0;
let spawnDelay = 60;

function createEnemies() {
  enemies = [];
  spawnQueue = enemiesPerWave;
  spawnTimer = 0;
  spawnDelay = Math.max(10, 60 - wave * 5);
}

createEnemies();

window.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === " " && !gameOver) {
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
  if (bullets.length < 5) {
    bullets.push({
      x: player.x,
      y: player.y - 25,
      speed: 9,
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

      enemy.speedX = (Math.random() - 0.5) * (1.5 + wave * 0.15);
      const mobileBoost =
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
            ? 1.7
            : 1;

        enemy.speedY =
        (
            0.8 +
            Math.random() * 1.4 +
            wave * 0.12
        ) * mobileBoost;

      enemy.wobbleOffset = Math.random() * Math.PI * 2;
      enemy.wobbleSpeed = 0.02 + Math.random() * 0.04;
      enemy.wobbleAmount = 1 + Math.random() * 2.5;
    }

    const dx = player.x - enemy.x;
    const distanceX = Math.abs(dx);

    // Enemies gently steer toward the player's x-position
    enemy.speedX += dx * 0.0008;

    // Limit side-to-side speed so movement stays fluid
    if (enemy.speedX > 3) enemy.speedX = 3;
    if (enemy.speedX < -3) enemy.speedX = -3;

    // Move downward faster as they get closer to the player
    const dangerBoost = enemy.y / canvas.height;
    enemy.speedY += 0.002 + dangerBoost * 0.003;

    if (enemy.speedY > 3.8) enemy.speedY = 3.8;

    // Smooth independent movement
    enemy.x += enemy.speedX;
    enemy.y += enemy.speedY;

    // Organic wobble
    enemy.x += Math.sin(Date.now() * enemy.wobbleSpeed + enemy.wobbleOffset) * enemy.wobbleAmount;

    // Keep enemies on screen
    if (enemy.x < 30) {
      enemy.x = 30;
      enemy.speedX *= -0.6;
    }

    if (enemy.x > canvas.width - 30) {
      enemy.x = canvas.width - 30;
      enemy.speedX *= -0.6;
    }

    // If enemy reaches player area, lose a life
    if (enemy.y > player.y - 30 && distanceX < 80) {
      lives--;

      resetWavePosition();

      if (lives <= 0) {
        gameOver = true;
      }

      break;
    }

    // If enemy passes the bottom, loop it back upward
    if (enemy.y > canvas.height + 40) {
      enemy.y = -40;
      enemy.x = Math.random() * canvas.width;
      enemy.speedY = 0.8 + Math.random() * 1.2;
    }
  }
}

function resetWavePosition() {
  for (let enemy of enemies) {
    enemy.y -= 100;
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
  ctx.fillText(player.text, player.x, player.y);
}

function drawBullets() {
  ctx.fillStyle = "#ffffff";

  for (let bullet of bullets) {
    ctx.fillText(bullet.text, bullet.x, bullet.y);
  }
}

function drawEnemies() {
  ctx.fillStyle = "#ff4fd8";

  for (let enemy of enemies) {
    if (enemy.alive) {
      ctx.fillText(enemy.text, enemy.x, enemy.y);
    }
  }
}

function drawHUD() {
  ctx.fillStyle = "#dcdac0";
  ctx.font = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  ? "34px monospace"
  : "20px monospace";

  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + score, 20, 35);
  ctx.fillText("LIVES: " + lives, 20, 65);
  ctx.fillText("WAVE: " + wave, 20, 95);

  ctx.textAlign = "right";
  ctx.fillText("MOVE: ← → / A D   SHOOT: SPACE", canvas.width - 20, 35);

  ctx.textAlign = "center";
  ctx.font = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  ? "32px monospace"
  : "24px monospace";
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#dcdac0";
  ctx.font = "44px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "22px monospace";
  ctx.fillText("FINAL SCORE: " + score, canvas.width / 2, canvas.height / 2);
  ctx.fillText("PRESS R TO RESTART", canvas.width / 2, canvas.height / 2 + 40);
}

function drawPaused() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#dcdac0";
  ctx.font = "44px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);

  ctx.font = "22px monospace";
  ctx.fillText("PRESS P TO RESUME", canvas.width / 2, canvas.height / 2 + 40);
}

function restartGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemyDirection = 1;
  gameOver = false;
  player.x = canvas.width / 2;
  createEnemies();
}

function gameLoop() {
  drawBackground();

  if (!gameOver && !paused) {
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
  player.y = canvas.height - 60;
});


let touchLeft = false;
let touchRight = false;

const controls = document.createElement("div");

controls.innerHTML = `

<div id="leftControls">
  <button id="shootBtn">^</button>
  <button id="pauseBtn">P</button>
</div>

<div id="rightControls">
  <button id="leftBtn">◀</button>
  <button id="rightBtn">▶</button>
</div>

`;

document.body.appendChild(controls);

const leftControls = document.getElementById("leftControls");
const rightControls = document.getElementById("rightControls");

leftControls.style.position = "fixed";
leftControls.style.left = "20px";
leftControls.style.bottom = "120px";
leftControls.style.display = "flex";
leftControls.style.gap = "12px";
leftControls.style.zIndex = "9999";

rightControls.style.position = "fixed";
rightControls.style.right = "20px";
rightControls.style.bottom = "120px";
rightControls.style.display = "flex";
rightControls.style.gap = "12px";
rightControls.style.zIndex = "9999";

document.querySelectorAll("button").forEach(button => {

  button.style.fontSize = "28px";

  button.style.padding = "16px 20px";

  button.style.background = "rgba(0,0,0,0.7)";

  button.style.color = "#00ffee";

  button.style.border = "1px solid #00ffee";

  button.style.fontFamily = "monospace";

  button.style.borderRadius = "6px";

  button.style.backdropFilter = "blur(4px)";

  if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {

  // Bigger mobile buttons
  document.querySelectorAll("button").forEach(button => {

    button.style.fontSize = "38px";

    button.style.padding = "20px 26px";
  });

  // Move pause button to top-right
  const pauseBtn = document.getElementById("pauseBtn");

  pauseBtn.style.position = "fixed";
  pauseBtn.style.top = "20px";
  pauseBtn.style.right = "20px";
  pauseBtn.style.bottom = "auto";

}
});


function holdButton(id, onDown, onUp) {
  const btn = document.getElementById(id);

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    onDown();
  });

  btn.addEventListener("touchend", e => {
    e.preventDefault();
    onUp();
  });
}

holdButton("leftBtn", () => touchLeft = true, () => touchLeft = false);
holdButton("rightBtn", () => touchRight = true, () => touchRight = false);

document.getElementById("shootBtn").addEventListener("touchstart", e => {
  e.preventDefault();
  if (!gameOver && !paused) shoot();
});

document.getElementById("pauseBtn").addEventListener("touchstart", e => {
  e.preventDefault();
  if (!gameOver) paused = !paused;
});

gameLoop();
