import Phaser from 'phaser';
import { isValidPosition } from './enemyPathfinding';

export const handleWallJump = (enemy, scene, player) => {
  if (enemy.isJumping) return false;

  // 플레이어까지의 직선 거리 계산
  const distanceToPlayer = Phaser.Math.Distance.Between(
    enemy.x, enemy.y,
    player.x, player.y
  );

  // 전방 벽 감지를 위한 레이캐스트
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  const lookAheadDist = 80;
  const lookX = enemy.x + Math.cos(angle) * lookAheadDist;
  const lookY = enemy.y + Math.sin(angle) * lookAheadDist;

  // 벽 감지 및 거리 체크 (일정 거리 이상일 때만 점프)
  if (!isValidPosition(lookX, lookY, scene) && distanceToPlayer > 200) {
    enemy.isJumping = true;
    
    // 점프 시작 효과음 (있다면)
    if (scene.sound.get('jumpSound')) {
      scene.sound.play('jumpSound', { volume: 0.3 });
    }

    // 점프 준비 동작
    scene.tweens.add({
      targets: enemy,
      scaleY: 0.8,
      duration: 100,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // 실제 점프 동작
        performJump(enemy, scene, angle);
      }
    });

    return true;
  }
  return false;
};

const performJump = (enemy, scene, angle) => {
  // 점프 높이와 거리 계산
  const jumpHeight = 150;
  const jumpDistance = 200;
  const jumpDuration = 600;

  // 이동 전 위치 저장
  const startX = enemy.x;
  const startY = enemy.y;
  const targetX = enemy.x + Math.cos(angle) * jumpDistance;
  const targetY = enemy.y + Math.sin(angle) * jumpDistance;

  // 그림자 효과 생성
  const shadow = scene.add.ellipse(enemy.x, enemy.y + 5, 40, 10, 0x000000, 0.3);
  
  // 수직 점프
  scene.tweens.add({
    targets: enemy,
    scaleY: 1.2,
    duration: jumpDuration / 2,
    ease: 'Quad.easeOut',
    yoyo: true
  });

  // 점프 궤적
  scene.tweens.add({
    targets: enemy,
    x: targetX,
    y: targetY,
    duration: jumpDuration,
    ease: 'Quad.inOut',
    onUpdate: (tween) => {
      // 포물선 움직임 계산
      const progress = tween.progress;
      const heightOffset = Math.sin(progress * Math.PI) * jumpHeight;
      enemy.y = Phaser.Math.Linear(startY, targetY, progress) - heightOffset;
      
      // 그림자 업데이트
      shadow.setPosition(enemy.x, enemy.y + 5);
      shadow.setAlpha(0.3 * (1 - Math.sin(progress * Math.PI) * 0.5));
    },
    onComplete: () => {
      // 착지 효과
      scene.tweens.add({
        targets: enemy,
        scaleY: 0.85,
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

      // 착지 효과음 (있다면)
      if (scene.sound.get('landSound')) {
        scene.sound.play('landSound', { volume: 0.2 });
      }
    }
  });
};

export const updateEnemyAnimation = (enemy, movement, scene) => { // scene 매개변수 추가
  // 점프 중에는 애니메이션 변경하지 않음
  if (enemy.isJumping) return;

  if (Math.abs(movement.x) > 0.1 || Math.abs(movement.y) > 0.1) {
    // 움직임이 있을 때
    enemy.anims.play('enemyWalk', true);
    
    // 이동 방향에 따른 스프라이트 방향 설정
    if (movement.x < 0) {
      enemy.setFlipX(true);
    } else if (movement.x > 0) {
      enemy.setFlipX(false);
    }

    // 움직임에 따른 미세한 흔들림 효과
    if (!enemy.isJumping && !enemy.wobble && scene) {  // scene 존재 여부 확인
      enemy.wobble = scene.tweens.add({
        targets: enemy,
        y: enemy.y + 2,
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  } else {
    // 정지 상태
    enemy.anims.play('enemyIdle', true);
    if (enemy.wobble) {
      enemy.wobble.stop();
      enemy.wobble = null;
    }
  }
};