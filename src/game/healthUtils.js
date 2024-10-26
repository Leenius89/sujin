export const setupHealthSystem = (scene, player, fishes) => {
  // 체력 자동 감소 타이머 설정
  scene.time.addEvent({
    delay: 1000,  // 1초마다
    callback: () => {
      if (!scene.gameOverStarted) {
        scene.events.emit('changeHealth', -1);  // 체력 1 감소
      }
    },
    loop: true
  });
  
 // fish 충돌 시 체력 회복
 scene.physics.add.overlap(player, fishes, (player, fish) => {
  // 물고기 먹는 소리 재생
  const fishSound = scene.sound.add('fishSound', { volume: 0.5 });
  fishSound.play();
  
  fish.destroy();
  scene.events.emit('changeHealth', 20);  // 체력 20 회복
});
};
