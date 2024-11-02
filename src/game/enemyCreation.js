import Phaser from 'phaser';
import { isValidPosition } from './enemyPathfinding';

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

const setupEnemyPhysics = (enemy, scale) => {
  enemy.setScale(scale);
  enemy.setOrigin(0.5, 0.5);
  enemy.setDepth(10000);

  const imageWidth = enemy.width * scale;
  const imageHeight = enemy.height * scale;
  enemy.body.setSize(imageWidth, imageHeight);
  enemy.body.setOffset((enemy.width - imageWidth) / 2, (enemy.height - imageHeight) / 2);
};

const executeCutscene = (scene, enemy, player) => {
  scene.cameras.main.pan(enemy.x, enemy.y, 1000, 'Power2', true, (camera, progress) => {
    if (progress === 1) {
      scene.time.delayedCall(3500, () => {
        scene.cameras.main.pan(player.x, player.y, 1000, 'Power2', true, (camera, progress) => {
          if (progress === 1) {
            enemy.active = true;
            scene.cameras.main.startFollow(player);
            
            // 메인 BGM 페이드 아웃
            scene.soundManager.stopMainBGM();
            
            // 적 사운드 시작
            enemy.enemySound = scene.soundManager.playEnemySound();
          }
        });
      });
    }
  });
};

export const createEnemy = (scene, player, worldWidth, worldHeight) => {
  const enemyScale = 0.08;
  const minSpawnDistance = 800;
  
  // 적 생성 위치 결정
  let enemyX, enemyY;
  let distance;
  do {
    enemyX = Phaser.Math.Between(100, worldWidth - 100);
    enemyY = Phaser.Math.Between(100, worldHeight - 100);
    distance = Phaser.Math.Distance.Between(enemyX, enemyY, player.x, player.y);
  } while (distance < minSpawnDistance || !isValidPosition(enemyX, enemyY, scene));

  // 적 스프라이트 생성 및 설정
  const newEnemy = scene.physics.add.sprite(enemyX, enemyY, 'enemy1');
  setupEnemyPhysics(newEnemy, enemyScale);
  
  // 행동 타입 및 상태 설정
  newEnemy.behaviorType = Phaser.Math.Between(0, 1);
  newEnemy.isJumping = false;
  newEnemy.active = false;

  // 벽 충돌 설정
  scene.physics.add.collider(newEnemy, scene.walls);

  // 초기 경로 설정
  newEnemy.pathFinder = {
    path: [],
    currentNode: 0,
    lastPathFinding: 0
  };

  // 컷신 실행
  executeCutscene(scene, newEnemy, player);

  return newEnemy;
};