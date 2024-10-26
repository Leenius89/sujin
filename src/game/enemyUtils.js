import Phaser from 'phaser';
import { createEnemy, createEnemyAnimations } from './enemyCreation';
import { updateEnemyAnimation } from './enemyAnimations';

const handleEnemyMovement = (enemy, player, scene) => {
  if (!enemy.active) {
    enemy.setVelocity(0, 0);
    return;
  }

  if (enemy.isJumping) {
    return;
  }

  // 기본 이동 속도를 80으로 감소
  const speed = 80;

  // 벽 감지
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  const lookAheadDist = 50;
  const lookX = enemy.x + Math.cos(angle) * lookAheadDist;
  const lookY = enemy.y + Math.sin(angle) * lookAheadDist;

  const hitbox = new Phaser.Geom.Rectangle(lookX - 16, lookY - 16, 32, 32);
  const wallAhead = scene.walls.getChildren().some(wall => 
    Phaser.Geom.Rectangle.Overlaps(hitbox, wall.getBounds())
  );

  if (wallAhead) {
    performJump(enemy, player, scene);
    return;
  }

  // 일반 이동
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;
  
  enemy.setVelocity(velocityX, velocityY);

  // 이동 방향에 따른 스프라이트 방향 설정
  if (velocityX < 0) {
    enemy.setFlipX(true);
  } else if (velocityX > 0) {
    enemy.setFlipX(false);
  }

  // 일반 걷기 애니메이션
  if (!enemy.isJumping) {
    enemy.anims.play('enemyWalk', true);
  }
};

const performJump = (enemy, player, scene) => {
  if (enemy.isJumping) return;
  
  enemy.isJumping = true;
  enemy.anims.stop();

  // 점프 관련 수치 조정
  const jumpDuration = 800;  // 점프 시간 증가
  const jumpHeight = 120;    // 점프 높이 조정
  
  const startX = enemy.x;
  const startY = enemy.y;
  const angle = Phaser.Math.Angle.Between(startX, startY, player.x, player.y);
  const jumpDistance = 160;  // 점프 거리 조정
  const endX = startX + Math.cos(angle) * jumpDistance;
  const endY = startY + Math.sin(angle) * jumpDistance;

  // 그림자 효과
  const shadow = scene.add.ellipse(enemy.x, enemy.y + 5, 40, 10, 0x000000, 0.3);

  // 포물선 점프
  scene.tweens.add({
    targets: enemy,
    x: endX,
    duration: jumpDuration,
    ease: 'Linear',
    onUpdate: (tween) => {
      const progress = tween.progress;
      const heightOffset = Math.sin(progress * Math.PI) * jumpHeight;
      enemy.y = Phaser.Math.Linear(startY, endY, progress) - heightOffset;
      
      // 그림자 업데이트
      shadow.setPosition(enemy.x, enemy.y + 5);
      shadow.setAlpha(0.3 * (1 - Math.sin(progress * Math.PI) * 0.5));
    },
    onComplete: () => {
      enemy.isJumping = false;
      shadow.destroy();
      enemy.anims.play('enemyWalk', true);
    }
  });
};

export {
  createEnemy,
  createEnemyAnimations,
  handleEnemyMovement
};