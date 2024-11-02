import Phaser from 'phaser';

// 플레이어 애니메이션 생성
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

// 플레이어 생성
export const createPlayer = (scene) => {
  const tileSize = 64;
  const spacing = 1.5;
  const playerScale = 0.08;
  const player = scene.physics.add.sprite(tileSize * spacing, tileSize * spacing, 'cat1');
  player.setScale(playerScale);
  player.setOrigin(0.5, 0.5);
  player.lastDirection = 'right';
  player.jumpCount = 0;
  player.isJumping = false;

  const imageWidth = player.width * playerScale;
  const imageHeight = player.height * playerScale;
  player.body.setSize(imageWidth, imageHeight);
  player.body.setOffset((player.width - imageWidth) / 2, (player.height - imageHeight) / 2);

  return player;
};

// 플레이어 이동 처리
export const handlePlayerMovement = (player, cursors) => {
  const speed = 160;
  let isMoving = false;

  if (player.isJumping) return;

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
    player.setTexture('cat1');
  }

  if (player.body.velocity.x < 0) {
    player.setFlipX(true);
  } else if (player.body.velocity.x > 0) {
    player.setFlipX(false);
  }
};

export const handlePlayerJump = (player, scene) => {
  if (!player || player.isJumping || player.jumpCount <= 0) return false;

  try {
    const direction = player.lastDirection;
    const angle = direction === 'left' ? Math.PI : 0;
    
    // 점프 전 벽 체크
    const lookAheadDist = 80;
    const lookX = player.x + Math.cos(angle) * lookAheadDist;
    const lookY = player.y + Math.sin(angle) * lookAheadDist;
    
    const bounds = new Phaser.Geom.Rectangle(
      lookX - 16, 
      lookY - 16, 
      32, 
      32
    );

    const hasWallAhead = scene.walls.getChildren().some(wall => 
      Phaser.Geom.Rectangle.Overlaps(bounds, wall.getBounds())
    );

    if (hasWallAhead) {
      player.jumpCount--;
      scene.events.emit('updateJumpCount', player.jumpCount);
      
      if (scene.soundManager) {
        scene.soundManager.playJumpSound();
      }

      // 점프 시작
      player.isJumping = true;
      const jumpHeight = 150;
      const jumpDistance = 200;
      const jumpDuration = 600;
      const startY = player.y;
      const targetX = player.x + Math.cos(angle) * jumpDistance;
      const targetY = player.y + Math.sin(angle) * jumpDistance;

      // 그림자 효과
      const shadow = scene.add.ellipse(player.x, player.y + 5, 40, 10, 0x000000, 0.3);
      shadow.setDepth(player.depth - 1);

      // 단일 Tween으로 점프 실행
      scene.tweens.add({
        targets: player,
        x: targetX,
        duration: jumpDuration,
        ease: 'Linear',
        onUpdate: (tween) => {
          const progress = tween.progress;
          const heightOffset = Math.sin(progress * Math.PI) * jumpHeight;
          player.y = Phaser.Math.Linear(startY, targetY, progress) - heightOffset;
          
          shadow.setPosition(player.x, player.y + 5);
          shadow.setAlpha(0.3 * (1 - Math.sin(progress * Math.PI) * 0.5));
        },
        onComplete: () => {
          player.isJumping = false;
          player.y = targetY;
          shadow.destroy();
        },
        onStop: () => {
          player.isJumping = false;
          shadow.destroy();
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error('Jump error:', error);
    if (player) {
      player.isJumping = false;
    }
  }
  return false;
};

// milk 아이템 생성
export const createMilkItems = (scene, walls, player) => {
  const milks = scene.physics.add.group();
  const mazeSize = 41;
  const tileSize = 64;
  const spacing = 1.5;

  // milk 애니메이션 생성
  if (!scene.anims.exists('milkFloat')) {
    scene.anims.create({
      key: 'milkFloat',
      frames: [{ key: 'milk' }],
      frameRate: 1,
      repeat: -1
    });
  }

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      const posX = x * tileSize * spacing;
      const posY = y * tileSize * spacing;
      
      const hasWall = walls.getChildren().some(wall => 
        Math.abs(wall.x - posX) < tileSize && Math.abs(wall.y - posY) < tileSize
      );

      if (!hasWall && Math.random() < 0.05 && !(x === 1 && y === 1)) {
        const milk = milks.create(posX, posY, 'milk');
        milk.setScale(0.05);
        milk.setDepth(y);

        scene.tweens.add({
          targets: milk,
          y: milk.y - 10,
          duration: 1500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

    // milk 충돌 처리를 여기서 직접 구현
    scene.physics.add.overlap(player, milks, (player, milk) => {
      if (!scene.gameOverStarted) {
        if (scene.soundManager) {
          scene.soundManager.playFishSound();
        }
        player.jumpCount++;
        // milk 카운트 업데이트
        scene.events.emit('collectMilk');
        scene.events.emit('updateJumpCount', player.jumpCount);
        milk.destroy();
      }
    });

  return milks;
};