import Phaser from 'phaser';
import { VictoryScene } from './victory/victoryUtils';

const create8BitTransition = (scene, player) => {
  return new Promise((resolve) => {
    const { width, height } = scene.cameras.main;
    const graphics = scene.add.graphics();
    graphics.setScrollFactor(0);  // 카메라에 고정
    graphics.setDepth(9999);

    // 현재 화면상의 중심점 계산
    const centerX = width / 2;
    const centerY = height / 2;

    // 8x8 크기의 픽셀 그리드 생성
    const pixelSize = 32;
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);

    // 각 픽셀의 화면 중심으로부터의 거리 계산
    const pixels = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distance = Math.sqrt(
          Math.pow(x * pixelSize - centerX, 2) + 
          Math.pow(y * pixelSize - centerY, 2)
        );
        pixels.push({ x, y, distance });
      }
    }

    // 거리순으로 정렬 (가까운 것부터)
    pixels.sort((a, b) => a.distance - b.distance);

    const darkSteps = 8;
    let currentStep = 0;

    const updateDarkness = () => {
      if (currentStep >= darkSteps) {
        resolve();
        return;
      }

      graphics.clear();  // 이전 그래픽 지우기
      const pixelsThisStep = Math.ceil(pixels.length / darkSteps);
      const endIdx = Math.min((currentStep + 1) * pixelsThisStep, pixels.length);

      for (let i = 0; i < endIdx; i++) {
        const pixel = pixels[i];
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(
          pixel.x * pixelSize,
          pixel.y * pixelSize,
          pixelSize,
          pixelSize
        );
      }

      currentStep++;
      scene.time.delayedCall(200, updateDarkness);
    };

    updateDarkness();
  });
};

export const createGoal = (scene, player, centerX, centerY) => {
  const goal = scene.physics.add.sprite(centerX, centerY, 'goal');
  goal.setScale(0.1);
  
  const hitboxScale = 1.2;
  const hitboxSize = goal.width * goal.scale * hitboxScale;
  goal.body.setCircle(hitboxSize / 2);
  goal.body.setOffset(goal.width / 2 - hitboxSize / 2, goal.height / 2 - hitboxSize / 2);
  
  let isVictoryHandled = false;

  scene.physics.add.overlap(player, goal, async () => {
      if (isVictoryHandled) return;
      isVictoryHandled = true;

      // 모든 게임 물리 정지
      scene.physics.pause();
      
      // 모든 움직임 정지
      player.setVelocity(0, 0);
      if (scene.enemy) {
          scene.enemy.setVelocity(0, 0);
      }

      // 아파트 시스템 정지
      if (scene.apartmentSystem) {
          scene.apartmentSystem.stopSpawning();
      }

      try {
          // 모든 사운드 즉시 중지
          scene.soundManager.stopAllSounds();

          // 화면 전환 효과
          await create8BitTransition(scene, player);

          // BGM만 재생
          scene.soundManager.playMainBGM();

          // Victory 씬으로 전환
          scene.time.delayedCall(500, () => {
              // 현재 씬의 모든 업데이트 중지
              scene.scene.pause();
              
              // Enemy AI 정지
              if (scene.enemy && scene.enemy.enemySound) {
                  scene.soundManager.stopEnemySound(scene.enemy.enemySound);
              }

              // Victory 씬 시작
              scene.scene.add('VictoryScene', VictoryScene, true, {
                  milkCount: scene.registry.get('milkCount') || 0,
                  fishCount: scene.registry.get('fishCount') || 0
              });
              scene.scene.setVisible(false);
          });

      } catch (error) {
          console.error('Transition failed:', error);
      }
  });

  if (scene.walls) {
      scene.physics.add.collider(goal, scene.walls);
  }

  return goal;
};