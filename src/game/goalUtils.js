import Phaser from 'phaser';

// 벽의 위치를 찾아서 반환하는 함수
const findWallPosition = (scene) => {
  const walls = scene.walls.getChildren();
  const validWalls = walls.filter(wall => {
    // 시작 지점에서 멀리 있는 벽들만 선택
    const distanceFromStart = Phaser.Math.Distance.Between(
      wall.x, wall.y,
      64 * 1.5, 64 * 1.5  // 시작 위치 (tileSize * spacing)
    );
    return distanceFromStart > 800;  // 시작점에서 충분히 먼 거리
  });

  // 유효한 벽들 중 랜덤하게 하나 선택
  const randomWall = Phaser.Utils.Array.GetRandom(validWalls);
  return randomWall;
};

export const createGoal = (scene, player) => {
  // 벽 위치 찾기
  const selectedWall = findWallPosition(scene);
  if (!selectedWall) return null;

  // 선택된 벽의 위치 저장
  const wallX = selectedWall.x;
  const wallY = selectedWall.y;

  // 선택된 벽 제거
  selectedWall.destroy();

  // goal 생성
  const goal = scene.physics.add.sprite(wallX, wallY, 'goal');
  goal.setScale(0.1);
  
  // goal과 벽 충돌 설정
  scene.physics.add.collider(goal, scene.walls);
  
  // goal과 player 충돌 설정
  scene.physics.add.overlap(player, goal, () => {
    // 이미 승리 처리가 진행 중인지 확인
    if (scene.isVictoryInProgress) return;
    scene.isVictoryInProgress = true;

    // goal 제거
    goal.destroy();
    
    // BGM 정지
    if (scene.mainBGM) {
      scene.mainBGM.stop();
    }
    
    // enemy 사운드 정지
    if (scene.enemy && scene.enemy.enemySound) {
      scene.enemy.enemySound.stop();
    }

    // 플레이어 이동 중지
    player.setVelocity(0, 0);

    // VictoryScene이 존재하는지 확인하고 없으면 추가
    if (!scene.scene.get('VictoryScene')) {
      scene.scene.add('VictoryScene', VictoryScene);
    }

    // 승리 시퀀스 시작
    scene.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        // VictoryScene 시작
        scene.scene.start('VictoryScene');
        
        // victory 이벤트 발생
        scene.time.delayedCall(500, () => {
          document.dispatchEvent(new CustomEvent('gameVictory'));
        });
      }
    });
  });

  return goal;
};

// VictoryScene 클래스 재정의
class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    // 승리 화면 표시
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경 이미지
    const background = this.add.image(0, 0, 'goalBackground');
    background.setOrigin(0, 0);
    background.setDisplaySize(width, height);

    // 고양이 스프라이트
    const cat = this.add.sprite(-100, height / 2, 'victoryCat');
    cat.setScale(0.2);

    // 고양이 등장 애니메이션
    this.tweens.add({
      targets: cat,
      x: width / 2,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 승리 텍스트 표시
        const victoryText = this.add.text(width / 2, height / 4, 'VICTORY!', {
          fontSize: '64px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6
        });
        victoryText.setOrigin(0.5);
        
        // 텍스트 애니메이션
        this.tweens.add({
          targets: victoryText,
          scale: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }
}