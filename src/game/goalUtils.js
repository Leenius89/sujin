import Phaser from 'phaser';
import { VictoryScene } from './victoryUtils';

export const createGoal = (scene, player, centerX, centerY) => {
  const goal = scene.physics.add.sprite(centerX, centerY, 'goal');
  goal.setScale(0.1);
  
  if (scene.walls) {
    scene.physics.add.collider(goal, scene.walls);
  }
  
  let isVictoryHandled = false;
  
  scene.physics.add.overlap(player, goal, () => {
    if (isVictoryHandled) return;
    isVictoryHandled = true;

    // BGM과 enemy 사운드 정지
    scene.soundManager.stopMainBGM();
    if (scene.enemy && scene.enemy.enemySound) {
      scene.soundManager.stopEnemySound(scene.enemy.enemySound);
    }

    // 현재 씬 일시 정지
    scene.scene.pause();

    // goal 제거
    goal.destroy();

    // 승리 씬 생성
    const victoryScene = new VictoryScene();
    scene.scene.add('VictoryScene', victoryScene, true);

    // 승리 이벤트 발생 (VictoryScene 전환 전)
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('gameVictory'));
    }, 1000);
  });

  return goal;
};