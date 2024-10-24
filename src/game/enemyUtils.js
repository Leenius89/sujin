import Phaser from 'phaser';

export const createEnemyAnimations = (scene) => {
  if (!scene.anims.exists('enemyWalk')) {
    scene.anims.create({
      key: 'enemyWalk',
      frames: [
        { key: 'enemy1' },
        { key: 'enemy2' }
      ],
      frameRate: 8,
      repeat: -1
    });
  }

  if (!scene.anims.exists('enemyIdle')) {
    scene.anims.create({
      key: 'enemyIdle',
      frames: [{ key: 'enemy1' }],
      frameRate: 1,
      repeat: 0
    });
  }
};

export const createEnemy = (scene, player, worldWidth, worldHeight) => {
    const enemyScale = 0.08;
  
  // 플레이어와 충분히 떨어진 위치 찾기
  let enemyX, enemyY;
  let distance;
  
  do {
    enemyX = Phaser.Math.Between(100, worldWidth - 100);
    enemyY = Phaser.Math.Between(100, worldHeight - 100);
    distance = Phaser.Math.Distance.Between(enemyX, enemyY, player.x, player.y);
  } while (distance < 500);

  const enemy = scene.physics.add.sprite(enemyX, enemyY, 'enemy1');
  enemy.setScale(enemyScale);
  enemy.setOrigin(0.5, 0.5);

  const imageWidth = enemy.width * enemyScale;
  const imageHeight = enemy.height * enemyScale;
  enemy.body.setSize(imageWidth, imageHeight);
  enemy.body.setOffset((enemy.width - imageWidth) / 2, (enemy.height - imageHeight) / 2);

  // 사운드 전환
  const mainBGM = scene.mainBGM;
  const enemySound = scene.sound.add('enemySound', { loop: true, volume: 0 });
  enemySound.play();
  
 // 카메라 및 게임 일시정지 효과
 scene.cameras.main.pan(enemyX, enemyY, 1000, 'Sine.easeInOut', true, (camera, progress) => {
    if (progress === 1) {
      // 1.5초 동안 화면 정지
      scene.time.delayedCall(1500, () => {
        // 기존 BGM 페이드 아웃
        scene.tweens.add({
          targets: mainBGM,
          volume: 0,
          duration: 1000,
          onComplete: () => {
            mainBGM.stop();
          }
        });
        
        // enemy 사운드 페이드 인
        scene.tweens.add({
          targets: enemySound,
          volume: 1,
          duration: 1000
        });

        // 0.5초 후 카메라 복귀
        scene.time.delayedCall(500, () => {
          scene.cameras.main.startFollow(player);
        });
      });
    }
  });

  enemy.enemySound = enemySound;  // enemy 객체에 사운드 참조 저장

  // 경로 찾기를 위한 속성 추가
  enemy.pathFinder = {
    path: [],
    currentNode: 0,
    lastPathFinding: 0
  };

  return enemy;
};

// 거리 계산 함수
const manhattanDistance = (x1, y1, x2, y2) => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

// A* 알고리즘을 위한 Node 클래스
class Node {
  constructor(x, y, g, h) {
    this.x = x;
    this.y = y;
    this.g = g; // 시작점으로부터의 비용
    this.h = h; // 목표점까지의 예상 비용
    this.f = g + h; // 총 비용
    this.parent = null;
  }
}

// 유효한 위치인지 확인
const isValidPosition = (x, y, scene) => {
  // 맵 범위 체크
  if (x < 0 || x >= scene.worldWidth || y < 0 || y >= scene.worldHeight) {
    return false;
  }
  
  // 벽과의 충돌 체크
  const bodies = scene.physics.world.bodies.entries;
  for (let body of bodies) {
    if (body.gameObject.texture.key.includes('building')) {
      if (Phaser.Geom.Rectangle.Contains(body.getBounds(), x, y)) {
        return false;
      }
    }
  }
  
  return true;
};

// A* 경로 찾기
const findPath = (enemy, player, scene) => {
  const gridSize = 32; // 그리드 크기
  const startX = Math.floor(enemy.x / gridSize);
  const startY = Math.floor(enemy.y / gridSize);
  const endX = Math.floor(player.x / gridSize);
  const endY = Math.floor(player.y / gridSize);

  const openList = [];
  const closedList = new Set();
  
  const startNode = new Node(startX, startY, 0, manhattanDistance(startX, startY, endX, endY));
  openList.push(startNode);

  while (openList.length > 0) {
    // f값이 가장 작은 노드 찾기
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift();
    closedList.add(`${currentNode.x},${currentNode.y}`);

    // 목표 도달
    if (currentNode.x === endX && currentNode.y === endY) {
      const path = [];
      let node = currentNode;
      while (node) {
        path.unshift({ x: node.x * gridSize, y: node.y * gridSize });
        node = node.parent;
      }
      return path;
    }

    // 주변 노드 탐색
    const directions = [
      { x: 0, y: -1 }, { x: 1, y: 0 }, 
      { x: 0, y: 1 }, { x: -1, y: 0 }
    ];

    for (let dir of directions) {
      const newX = currentNode.x + dir.x;
      const newY = currentNode.y + dir.y;
      
      if (!isValidPosition(newX * gridSize, newY * gridSize, scene)) {
        continue;
      }

      const nodeKey = `${newX},${newY}`;
      if (closedList.has(nodeKey)) {
        continue;
      }

      const g = currentNode.g + 1;
      const h = manhattanDistance(newX, newY, endX, endY);
      const newNode = new Node(newX, newY, g, h);
      newNode.parent = currentNode;

      const existingNode = openList.find(n => n.x === newX && n.y === newY);
      if (!existingNode) {
        openList.push(newNode);
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = g + existingNode.h;
        existingNode.parent = currentNode;
      }
    }
  }

  return null; // 경로를 찾지 못함
};

export const handleEnemyMovement = (enemy, player, scene) => {
  const speed = 80;
  const now = Date.now();

  // 200ms마다 경로 재계산
  if (now - enemy.pathFinder.lastPathFinding > 200) {
    const newPath = findPath(enemy, player, scene);
    if (newPath) {
      enemy.pathFinder.path = newPath;
      enemy.pathFinder.currentNode = 0;
    }
    enemy.pathFinder.lastPathFinding = now;
  }

  // 경로가 있으면 따라가기
  if (enemy.pathFinder.path.length > 0) {
    const currentTarget = enemy.pathFinder.path[enemy.pathFinder.currentNode];
    const distance = Phaser.Math.Distance.Between(
      enemy.x, enemy.y,
      currentTarget.x, currentTarget.y
    );

    if (distance < 5) {
      enemy.pathFinder.currentNode++;
      if (enemy.pathFinder.currentNode >= enemy.pathFinder.path.length) {
        enemy.pathFinder.path = [];
        enemy.pathFinder.currentNode = 0;
      }
    } else {
      const angle = Phaser.Math.Angle.Between(
        enemy.x, enemy.y,
        currentTarget.x, currentTarget.y
      );

      enemy.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
  } else {
    // 직접 플레이어를 향해 이동
    const angle = Phaser.Math.Angle.Between(
      enemy.x, enemy.y,
      player.x, player.y
    );
    
    enemy.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }

  // 애니메이션 처리
  enemy.anims.play('enemyWalk', true);

  // 스프라이트 방향 설정
  if (enemy.body.velocity.x < 0) {
    enemy.setFlipX(true);
  } else if (enemy.body.velocity.x > 0) {
    enemy.setFlipX(false);
  }
};