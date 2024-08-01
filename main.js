import { ResourceLoader } from "./source/resourceLoader.js";
import { toAngle, toRadian, normalizeAngle, getRandomNumber } from "./source/helpers.js";
import { GameMap } from "./source/gameMap.js";

const main = async function() {
  const files = await ResourceLoader.loadConfigFiles("assets/files.json");
  const enemies = files.enemies;
  const sprites = {};
  const tiles = {};

  await ResourceLoader.loadImages(files.sprites, ((key, image, config) => sprites[key] = { image, config }));
  await ResourceLoader.loadImages(files.tiles, ((key, image, config) => tiles[key] = { image, config }));

  console.log(enemies, sprites, tiles);
}

main();

// Random map generation with rooms and corridors
function generateMap(size) {
  const map = Array(size).fill().map(() => Array(size).fill(1));
  const roomMinSize = 5;
  const roomMaxSize = 15;
  const numRooms = 40;

  function createRoom(x, y, width, height) {
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        if (i > 0 && j > 0 && i < size - 1 && j < size - 1) {
          map[j][i] = 0;
        }
      }
    }
  }

  function createCorridor(x1, y1, x2, y2) {
    if (Math.random() < 0.5) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (x > 0 && y1 > 0 && x < size - 1 && y1 < size - 1) {
          map[y1][x] = 0;
        }
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (x2 > 0 && y > 0 && x2 < size - 1 && y > 0) {
          map[y][x2] = 0;
        }
      }
    } else {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (x1 > 0 && y > 0 && x1 < size - 1 && y < size - 1) {
          map[y][x1] = 0;
        }
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (x > 0 && y2 > 0 && x < size - 1 && y2 < size - 1) {
          map[y2][x] = 0;
        }
      }
    }
  }

  const rooms = [];
  for (let i = 0; i < numRooms; i++) {
    const width = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
    const height = Math.floor(Math.random() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
    const x = Math.floor(Math.random() * (size - width - 1)) + 1;
    const y = Math.floor(Math.random() * (size - height - 1)) + 1;

    createRoom(x, y, width, height);
    if (rooms.length > 0) {
      const prevRoom = rooms[rooms.length - 1];
      const prevX = prevRoom.x + Math.floor(prevRoom.width / 2);
      const prevY = prevRoom.y + Math.floor(prevRoom.height / 2);
      const newX = x + Math.floor(width / 2);
      const newY = y + Math.floor(height / 2);
      createCorridor(prevX, prevY, newX, newY);
    }
    rooms.push({ x, y, width, height });
  }

  return { map, rooms };
}

const mazeSize = 50;
const { map: maze, rooms } = generateMap(mazeSize);

const player = {
  x: rooms[0].x + 2,
  y: rooms[0].y + 2,
  dir: 0,
  fov: toRadian(90),
  speed: 10,
  turnSpeed: (Math.PI / 180) * 150,
  health: 1000
};

const enemies = [];
const numEnemies = 20;

for (let i = 0; i < numEnemies; i++) {
  const enemy = {
    x: Math.floor(Math.random() * (mazeSize - 2)) + 1.5,
    y: Math.floor(Math.random() * (mazeSize - 2)) + 1.5,
    speed: getRandomNumber(2, 5),
    maxHealth: 100,
    health: 100,
    damage: 1,
    hit: false,
    hitTime: 0,
    path: [],
    type: i % 2 === 0 ? 'enemyOne' : 'enemyTwo' // Alternate between enemy types
  }

  while (maze[Math.floor(enemy.y)][Math.floor(enemy.x)] !== 0) {
    enemy.x = Math.floor(Math.random() * (mazeSize - 2)) + 1.5;
    enemy.y = Math.floor(Math.random() * (mazeSize - 2)) + 1.5;
  }

  enemies.push(enemy);
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const minimapScale = minimapCanvas.width / mazeSize;

ctx.imageSmoothingEnabled = false;
minimapCtx.imageSmoothingEnabled = false;

const fpsCounter = document.getElementById('fpsCounter');
const enemyCounter = document.getElementById('enemyCounter');
const playerHealthInner = document.getElementById('playerHealthInner');

const wallImg = new Image();
wallImg.src = 'assets/tiles/wall.png';

const enemyImg = new Image();
enemyImg.src = 'assets/sprites/enemy.png';

const enemyTwoImg = new Image();
enemyTwoImg.src = 'assets/sprites/enemy_two.png';

const groundImg = new Image();
groundImg.src = 'assets/tiles/ground.png';

const skyImg = new Image();
skyImg.src = 'assets/tiles/sky.png';

const cloudImg = new Image();
cloudImg.src = 'assets/tiles/clouds.png'; 

let cloudOffset = 0;

const keys = {};
document.addEventListener('keydown', (event) => { keys[event.key] = true; });
document.addEventListener('keyup', (event) => { keys[event.key] = false; });

canvas.addEventListener('click', handleMouseClick);

document.addEventListener('click', () => {
  canvas.requestPointerLock();
});

function handleMouseClick(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
  const adjustedAngle = angle + player.dir;

  for (const enemy of enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    
    if (distance < 20 && Math.abs(angleToEnemy - player.dir) < player.fov / 2) {
      const enemySize = canvas.height / distance;
      const enemyX = (canvas.width / 2) + Math.tan(angleToEnemy - player.dir) * canvas.width / 2 - enemySize / 2;

      if (mouseX >= enemyX && mouseX <= enemyX + enemySize) {
        enemy.health -= 20;
        enemy.hit = true;
        enemy.hitTime = performance.now();
        if (enemy.health <= 0) {
          enemies.splice(enemies.indexOf(enemy), 1);
        }
      }
    }
  }
}

function castRay(rayAngle) {
  const stepSize = 0.05;
  const cos = Math.cos(rayAngle);
  const sin = Math.sin(rayAngle);
  let distance = 0;
  let hit = { distance: 20, x: player.x + cos * 20, y: player.y + sin * 20, vertical: false };
  while (distance < 20) {
    distance += stepSize;
    const x = player.x + cos * distance;
    const y = player.y + sin * distance;
    if (maze[Math.floor(y)][Math.floor(x)] === 1) {
      hit = { distance, x, y, vertical: Math.abs(x - Math.floor(x + cos * stepSize)) < Math.abs(y - Math.floor(y + sin * stepSize)) };
      break;
    }
  }
  return hit;
}

const MAX_PATH_LENGTH = 5;

function findPath(start, end) {
  const openList = [];
  const closedList = [];
  openList.push({ x: start.x, y: start.y, g: 0, h: heuristic(start, end), f: 0, parent: null });

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift();
    closedList.push(current);

    if (current.x === end.x && current.y === end.y || openList.length >= MAX_PATH_LENGTH) {
      const path = [];
      let temp = current;
      while (temp.parent) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (maze[neighbor.y] && maze[neighbor.y][neighbor.x] === 0 && !closedList.find(node => node.x === neighbor.x && node.y === neighbor.y)) {
        const g = current.g + 1;
        const h = heuristic(neighbor, end);
        const f = g + h;
        const existingNode = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
        if (existingNode) {
          if (g < existingNode.g) {
            existingNode.g = g;
            existingNode.f = f;
            existingNode.parent = current;
          }
        } else {
          openList.push({ ...neighbor, g, h, f, parent: current });
        }
      }
    }
  }

  return [];
}

function moveEnemies() {
  for (const enemy of enemies) {
    const enemySpeed = enemy.speed * timeStep;

    const start = { x: Math.floor(enemy.x), y: Math.floor(enemy.y) };
    const end = { x: Math.floor(player.x), y: Math.floor(player.y) };
    
    if (enemy.path.length === 0 || (start.x === end.x && start.y === end.y)) {
      enemy.path = findPath(start, end);
    }

    if (enemy.path.length > 0) {
      const nextStep = enemy.path[0];
      const dx = nextStep.x + 0.5 - enemy.x;
      const dy = nextStep.y + 0.5 - enemy.y;
      const distance = Math.hypot(dx, dy);

      if (distance > enemySpeed) {
        enemy.x += (dx / distance) * enemySpeed;
        enemy.y += (dy / distance) * enemySpeed;
      } else {
        enemy.x = nextStep.x + 0.5;
        enemy.y = nextStep.y + 0.5;
        enemy.path.shift();
      }
    }

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      player.health -= enemy.damage;
    }
  }
}

function isEnemyVisible(enemy) {
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const angleToEnemy = Math.atan2(dy, dx);
  const distanceToEnemy = Math.hypot(dx, dy);
  const normalizedAngleToEnemy = normalizeAngle(toAngle(angleToEnemy - player.dir));
  const playerFovAngle = toAngle(player.fov) + 10;

  enemy.distanceToPlayer = distanceToEnemy;
  enemy.angleToPlayer = angleToEnemy;

  if (distanceToEnemy > 20 || normalizedAngleToEnemy > playerFovAngle / 2 && normalizedAngleToEnemy < 360 - playerFovAngle / 2) {
    return false;
  }

  for (let t = 0; t < distanceToEnemy; t += 0.05) {
    const x = player.x + Math.cos(angleToEnemy) * t;
    const y = player.y + Math.sin(angleToEnemy) * t;
    if (maze[Math.floor(y)][Math.floor(x)] === 1) {
      return false;
    }
  }

  return true;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rays = 240;
  const stripWidth = canvas.width / rays;

  ctx.drawImage(skyImg, 0, 0, canvas.width, canvas.height / 2);
  ctx.drawImage(groundImg, 0, canvas.height / 2, canvas.width, canvas.height / 2);

  const halfCameraFOV = player.fov / 2;
  const halfCameraFOVTan = Math.tan(halfCameraFOV);

  for (let i = 0; i < rays; i++) {
    const screenX = (2 * i) / rays - 1;
    const rayAngle = Math.atan(screenX * halfCameraFOVTan)
    const correctedRayAngle = rayAngle + player.dir;
    const ray = castRay(correctedRayAngle);
    const distance = ray.distance * Math.cos(rayAngle);
    const stripHeight = Math.min(canvas.height / distance, canvas.height);

    const textureX = ray.vertical ? (ray.y % 1) * wallImg.width : (ray.x % 1) * wallImg.width;
    const correctedTextureX = Math.floor(textureX) % wallImg.width;

    ctx.drawImage(wallImg, correctedTextureX, 0, 1, wallImg.height, Math.floor(i * stripWidth), Math.floor((canvas.height - stripHeight) / 2), Math.ceil(stripWidth), Math.ceil(stripHeight));
  }

  renderEnemies();
  renderMinimap();
  updatePlayerHealth();
}

function renderEnemies() {
  const currentTime = performance.now();
  const visibleEnemies = enemies.filter(enemy => isEnemyVisible(enemy)).sort((a, b) => b.distanceToPlayer - a.distanceToPlayer);

  visibleEnemies.forEach(enemy => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = enemy.distanceToPlayer;
    const angleToEnemy = enemy.angleToPlayer - player.dir;
    const enemySize = canvas.height / distance;
    const normalizedAngle = Math.atan2(Math.sin(angleToEnemy), Math.cos(angleToEnemy));

    const halfWidth = canvas.width / 2;
    const enemyX = Math.tan(normalizedAngle) * halfWidth + halfWidth - enemySize / 2;

    const offScreenCanvas = document.createElement('canvas');
    const offScreenCtx = offScreenCanvas.getContext('2d');
    offScreenCanvas.width = enemy.type === 'enemyOne' ? enemyImg.width : enemyTwoImg.width;
    offScreenCanvas.height = enemy.type === 'enemyOne' ? enemyImg.height : enemyTwoImg.height;

    offScreenCtx.drawImage(enemy.type === 'enemyOne' ? enemyImg : enemyTwoImg, 0, 0);

    if (enemy.hit && currentTime - enemy.hitTime < 100) {
      const imageData = offScreenCtx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = 255;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 128;
        }
      }

      offScreenCtx.putImageData(imageData, 0, 0);
    }

    ctx.drawImage(offScreenCanvas, enemyX, (canvas.height - enemySize) / 2, enemySize, enemySize);

    const barWidth = enemySize * 0.6;
    const barHeight = 5;
    const barX = enemyX + (enemySize - barWidth) / 2;
    const barY = (canvas.height - enemySize) / 2 - barHeight - 5;

    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = 'green';
    ctx.fillRect(barX, barY, barWidth * (enemy.health / enemy.maxHealth), barHeight);
  });
}

function renderMinimap() {
  const halfScale = minimapScale / 2;
  minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      if (maze[y][x] === 1) {
        minimapCtx.fillStyle = 'black';
      } else {
        minimapCtx.fillStyle = 'white';
      }
      minimapCtx.fillRect(x * minimapScale, y * minimapScale, minimapScale, minimapScale);
    }
  }
  minimapCtx.fillStyle = 'red';
  minimapCtx.fillRect(player.x * minimapScale - halfScale, player.y * minimapScale - halfScale, minimapScale, minimapScale);

  minimapCtx.fillStyle = 'blue';
  for (const enemy of enemies) {
    minimapCtx.fillRect(enemy.x * minimapScale - halfScale, enemy.y * minimapScale - halfScale, minimapScale, minimapScale);
  }

  minimapCtx.strokeStyle = 'red';
  minimapCtx.beginPath();
  minimapCtx.moveTo(player.x * minimapScale, player.y * minimapScale);
  minimapCtx.lineTo((player.x + Math.cos(player.dir) * 4) * minimapScale, (player.y + Math.sin(player.dir) * 4) * minimapScale);
  minimapCtx.stroke();

  minimapCtx.beginPath();
  minimapCtx.moveTo(player.x * minimapScale, player.y * minimapScale);
  minimapCtx.lineTo((player.x + Math.cos(player.dir - player.fov / 2) * 4) * minimapScale, (player.y + Math.sin(player.dir - player.fov / 2) * 4) * minimapScale);
  minimapCtx.stroke();

  minimapCtx.beginPath();
  minimapCtx.moveTo(player.x * minimapScale, player.y * minimapScale);
  minimapCtx.lineTo((player.x + Math.cos(player.dir + player.fov / 2) * 4) * minimapScale, (player.y + Math.sin(player.dir + player.fov / 2) * 4) * minimapScale);
  minimapCtx.stroke();
}

function updatePlayer() {
  const moveSpeed = player.speed * timeStep;
  const turnSpeed = player.turnSpeed * timeStep;

  if (keys['w']) {
    const newX = player.x + Math.cos(player.dir) * moveSpeed;
    const newY = player.y + Math.sin(player.dir) * moveSpeed;
    if (maze[Math.floor(newY)][Math.floor(newX)] === 0) {
      player.x = newX;
      player.y = newY;
    }
  }
  if (keys['s']) {
    const newX = player.x - Math.cos(player.dir) * moveSpeed;
    const newY = player.y - Math.sin(player.dir) * moveSpeed;
    if (maze[Math.floor(newY)][Math.floor(newX)] === 0) {
      player.x = newX;
      player.y = newY;
    }
  }
  if (keys['a']) {
    player.dir -= turnSpeed;
    player.dir = toRadian(normalizeAngle(toAngle(player.dir)));
  }
  if (keys['d']) {
    player.dir += turnSpeed;
    player.dir = toRadian(normalizeAngle(toAngle(player.dir)));
  }
}

function updatePlayerHealth() {
  playerHealthInner.style.width = `${player.health}%`;
  if (player.health <= 0) {
    document.getElementById('mainMenu').style.display = 'flex';
    canvas.style.display = 'none';
  }
}

let accumulatedTime = 0;
let timeStep = 1/60; //Physics FPS
let lastTime = 0;

function gameLoop(timestamp) {
  let deltaTime = timestamp / 1000;
  let passedTime = deltaTime - lastTime;

  accumulatedTime += passedTime;

  while(accumulatedTime > timeStep) {
    updatePlayer();
    moveEnemies();
    accumulatedTime -= timeStep;
  }

  fpsCounter.textContent = `FPS: ${Math.floor(1/passedTime)}`;
  enemyCounter.textContent = `Enemies Alive: ${enemies.length}`;

  render();

  lastTime = deltaTime;

  requestAnimationFrame(gameLoop);
}

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('mainMenu').style.display = 'none';
  canvas.style.display = 'block';
  player.health = 100;
  requestAnimationFrame(gameLoop);
});

const images = [wallImg, enemyImg, enemyTwoImg, groundImg, skyImg];
let imagesLoaded = 0;
images.forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === images.length) {
      document.getElementById('startButton').disabled = false;
    }
  };
});