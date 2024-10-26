import Phaser from 'phaser';

export const isValidPosition = (x, y, scene, allowClose = false) => {
  if (x < 0 || x >= scene.worldWidth || y < 0 || y >= scene.worldHeight) {
    return false;
  }

  const hitbox = new Phaser.Geom.Rectangle(x - 16, y - 16, 32, 32);
  const bodies = scene.walls.getChildren();

  for (let wall of bodies) {
    const wallBounds = wall.getBounds();
    if (Phaser.Geom.Rectangle.Overlaps(hitbox, wallBounds)) {
      return false;
    }
  }
  
  return true;
};

// 전방의 벽 감지
const detectWallAhead = (enemy, targetX, targetY, scene) => {
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
  const distance = 50; // 감지 거리
  const lookX = enemy.x + Math.cos(angle) * distance;
  const lookY = enemy.y + Math.sin(angle) * distance;

  return !isValidPosition(lookX, lookY, scene);
};

// 점프 동작 수행
const performJump = (enemy, targetX, targetY, scene) => {
  const jumpDuration = 500;
  const jumpHeight = 100;
  
  // 시작 위치 저장
  const startX = enemy.x;
  const startY = enemy.y;
  
  // 점프 목표 지점 계산 (현재 진행 방향으로 더 멀리)
  const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
  const jumpDistance = 150;
  const endX = startX + Math.cos(angle) * jumpDistance;
  const endY = startY + Math.sin(angle) * jumpDistance;

  // 그림자 효과
  const shadow = scene.add.ellipse(enemy.x, enemy.y + 5, 40, 10, 0x000000, 0.3);
  
  // 점프 시작 시 스케일 효과
  scene.tweens.add({
    targets: enemy,
    scaleY: 0.8,
    duration: 100,
    ease: 'Quad.easeOut',
    onComplete: () => {
      // 실제 점프 동작
      scene.tweens.add({
        targets: enemy,
        scaleY: 1.2,
        duration: jumpDuration / 2,
        ease: 'Quad.easeOut',
        yoyo: true
      });

      scene.tweens.add({
        targets: enemy,
        x: endX,
        y: endY,
        duration: jumpDuration,
        ease: 'Quad.inOut',
        onUpdate: (tween) => {
          const progress = tween.progress;
          const heightOffset = Math.sin(progress * Math.PI) * jumpHeight;
          enemy.y = Phaser.Math.Linear(startY, endY, progress) - heightOffset;
          
          // 그림자 업데이트
          shadow.setPosition(enemy.x, enemy.y + 5);
          shadow.setAlpha(0.3 * (1 - Math.sin(progress * Math.PI) * 0.5));
        },
        onComplete: () => {
          // 착지 효과
          scene.tweens.add({
            targets: enemy,
            scaleY: 0.7,
            duration: 100,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              scene.tweens.add({
                targets: enemy,
                scaleY: 1,
                duration: 100,
                ease: 'Quad.easeOut',
                onComplete: () => {
                  enemy.isJumping = false;
                  shadow.destroy();
                }
              });
            }
          });
        }
      });
    }
  });

  return true;
};

export const moveTowardsPlayer = (enemy, player, scene) => {
  if (enemy.isJumping) return;

  // 플레이어 방향으로의 각도 계산
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  
  // 전방에 벽이 있는지 확인
  if (detectWallAhead(enemy, player.x, player.y, scene)) {
    enemy.isJumping = true;
    performJump(enemy, player.x, player.y, scene);
    return;
  }

  // 일반 이동
  const speed = 120;
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;
  
  enemy.setVelocity(velocityX, velocityY);

  // 이동 방향에 따른 스프라이트 방향 설정
  if (velocityX < 0) {
    enemy.setFlipX(true);
  } else if (velocityX > 0) {
    enemy.setFlipX(false);
  }

  // 걷기 애니메이션
  if (!enemy.isJumping) {
    enemy.anims.play('enemyWalk', true);
  }
};