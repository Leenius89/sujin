import Phaser from 'phaser';

export class ApartmentSystem {
  constructor(scene, player, goal) {
    this.scene = scene;
    this.player = player;
    this.goal = goal;
    this.apartments = scene.physics.add.staticGroup();
    this.mazeSize = 21;
    this.tileSize = 64;
    this.spacing = 1.5;
    this.wallScale = 0.22;
    this.currentRow = 0;
    this.isGameOver = false;
    this.baseDepth = 1000;

    // dust 애니메이션 생성
    this.createDustAnimation();

    // 15초 후에 시작
    this.scene.time.delayedCall(15000, () => this.startApartmentSpawn(), [], this);
  }

  createDustAnimation() {
    if (!this.scene.anims.exists('dust')) {
      this.scene.anims.create({
        key: 'dust',
        frames: [
          { key: 'dust1', frame: null },
          { key: 'dust2', frame: null }
        ],
        frameRate: 8,
        repeat: 3,
        duration: 1000
      });
    }
  }

  startApartmentSpawn() {
    // 10초마다 새로운 아파트 행 생성
    this.spawnTimer = this.scene.time.addEvent({
      delay: 10000,
      callback: () => this.spawnApartmentRow(),
      callbackScope: this,
      loop: true
    });

    // 첫 번째 행 즉시 생성
    this.spawnApartmentRow();
  }

  spawnApartmentRow() {
    if (this.isGameOver) return;

    const yPos = this.currentRow * this.tileSize * this.spacing;
    const dustSprites = [];

    // 기존 벽 제거 및 dust 생성
    for (let x = 0; x < this.mazeSize; x++) {
      const xPos = x * this.tileSize * this.spacing;
      this.removeExistingWalls(xPos, yPos);

      const dust = this.scene.add.sprite(xPos, yPos, 'dust1');
      dust.setScale(this.wallScale);
      dust.setDepth(this.baseDepth + this.currentRow * 10);
      
      // 애니메이션 시작 및 완료 이벤트 설정
      dust.play('dust');
      dust.on('animationcomplete', () => {
        this.createApartment(xPos, yPos, x, dust);
      });
      
      dustSprites.push(dust);
    }

    // construct 사운드 재생
    this.scene.soundManager.playConstructSound();

    this.currentRow++;
    this.checkGameOver();
  }

  createApartment(xPos, yPos, index, dust) {
    const apartmentType = Phaser.Math.Between(1, 3);

    // 아파트 생성
    const apartment = this.apartments.create(
      xPos,
      yPos,
      `apt${apartmentType}`
    );
    
    apartment.setScale(this.wallScale);
    apartment.setOrigin(0.5, 0.5);
    apartment.setDepth(this.baseDepth + (this.currentRow - 1) * 10);

    const imageWidth = apartment.width * this.wallScale;
    const imageHeight = apartment.height * this.wallScale;
    apartment.body.setSize(imageWidth, imageHeight);
    apartment.body.setOffset((apartment.width - imageWidth) / 2, (apartment.height - imageHeight) / 2);

    // 아파트 등장 효과
    apartment.setAlpha(0);
    this.scene.tweens.add({
      targets: apartment,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        dust.destroy();
        this.checkCollisions(apartment);
      }
    });
  }

  removeExistingWalls(x, y) {
    const walls = this.scene.walls.getChildren();
    walls.forEach(wall => {
      if (Math.abs(wall.x - x) < this.tileSize && Math.abs(wall.y - y) < this.tileSize) {
        wall.destroy();
      }
    });
  }

  checkCollisions(apartment) {
    // 플레이어와 아파트 충돌 체크
    const playerBounds = this.player.getBounds();
    const apartmentBounds = apartment.getBounds();

    if (Phaser.Geom.Rectangle.Overlaps(playerBounds, apartmentBounds)) {
      this.triggerGameOver('player');
      return;
    }

    // 골과 아파트 충돌 체크
    if (this.goal) {
      const goalBounds = this.goal.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(goalBounds, apartmentBounds)) {
        this.triggerGameOver('goal');
      }
    }
  }

  checkGameOver() {
    if (this.currentRow >= this.mazeSize) {
      this.stopSpawning();
    }
  }

  triggerGameOver(reason) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.stopSpawning();
    this.scene.gameOverAnimation();
  }

  stopSpawning() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
  }

  destroy() {
    this.stopSpawning();
    this.apartments.clear(true, true);
  }
}