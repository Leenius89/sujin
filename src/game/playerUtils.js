export const createPlayer = (scene) => {
  const tileSize = 64;
  const spacing = 1.5;
  const playerScale = 0.08;
  const player = scene.physics.add.sprite(tileSize * spacing, tileSize * spacing, 'cat1');
  player.setScale(playerScale);
  // player.setCollideWorldBounds(true); // 이 줄을 제거하거나 주석 처리합니다.
  player.setOrigin(0.5, 0.5);
  player.lastDirection = 'right';

  const imageWidth = player.width * playerScale;
  const imageHeight = player.height * playerScale;
  player.body.setSize(imageWidth, imageHeight);
  player.body.setOffset((player.width - imageWidth) / 2, (player.height - imageHeight) / 2);

  return player;
};
export const createPlayerAnimations = (scene) => {
  if (!scene.anims.exists('walk')) {
    scene.anims.create({
      key: 'walk',
      frames: [
        { key: 'cat1' },
        { key: 'cat2' }
      ],
      frameRate: 8,
      repeat: -1
    });
  }

  if (!scene.anims.exists('idle')) {
    scene.anims.create({
      key: 'idle',
      frames: [{ key: 'cat1' }],
      frameRate: 1,
      repeat: 0
    });
  }
};

export const handlePlayerMovement = (player, cursors) => {
  const speed = 160;
  let isMoving = false;

  player.setVelocity(0);

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.lastDirection = 'left';
    isMoving = true;
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.lastDirection = 'right';
    isMoving = true;
  }

  if (cursors.up.isDown) {
    player.setVelocityY(-speed);
    isMoving = true;
  } else if (cursors.down.isDown) {
    player.setVelocityY(speed);
    isMoving = true;
  }

  player.body.velocity.normalize().scale(speed);

  if (isMoving) {
    player.anims.play('walk', true);
  } else {
    player.anims.stop();
    player.setTexture('cat1');  // 정지 상태일 때 기본 이미지로 설정
  }

  if (player.body.velocity.x < 0) {
    player.setFlipX(true);
  } else if (player.body.velocity.x > 0) {
    player.setFlipX(false);
  }
};