import Phaser from 'phaser';

export const createMaze = (scene, player) => {
  const tileSize = 64;
  const wallScale = 0.1;  // 벽 크기를 0.1로 고정
  const mazeSize = 21;
  const spacing = 1.5;

  let maze = Array(mazeSize).fill().map(() => Array(mazeSize).fill(1));

  // 시작 위치와 주변을 비웁니다
  maze[1][1] = 0;
  maze[1][2] = 0;
  maze[2][1] = 0;

  const carve = (x, y) => {
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    directions.sort(() => Math.random() - 0.5);

    for (let [dx, dy] of directions) {
      let nx = x + dx * 2, ny = y + dy * 2;
      if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && maze[ny][nx] === 1) {
        maze[y + dy][x + dx] = 0;
        maze[ny][nx] = 0;
        carve(nx, ny);
      }
    }
  };

  carve(1, 1);

  const walls = scene.physics.add.staticGroup();
  const fishes = scene.physics.add.group();

  const worldWidth = mazeSize * tileSize * spacing;
  const worldHeight = mazeSize * tileSize * spacing;

  // 월드 경계 설정
  scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      if (maze[y][x] === 1) {
        const buildingType = Phaser.Math.Between(1, 3);
        const wall = walls.create(x * tileSize * spacing, y * tileSize * spacing, `building${buildingType}`);
        wall.setScale(wallScale);
        wall.setOrigin(0.5, 0.5);
        wall.setDepth(y);
        
        const imageWidth = wall.width * wallScale;
        const imageHeight = wall.height * wallScale;
        wall.body.setSize(imageWidth, imageHeight);
        wall.body.setOffset((wall.width - imageWidth) / 2, (wall.height - imageHeight) / 2);
      } else if (Math.random() < 0.1 && !(x === 1 && y === 1)) {
        const fish = fishes.create(x * tileSize * spacing, y * tileSize * spacing, 'fish1');
        fish.setScale(0.05);
        fish.setDepth(y);
        fish.play('fishSwim');
        
        scene.tweens.add({
          targets: fish,
          y: fish.y - 15,
          duration: 400,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  scene.physics.add.collider(player, walls);
  
  scene.physics.add.overlap(player, fishes, (player, fish) => {
    fish.destroy();
    document.dispatchEvent(new CustomEvent('changeHealth', { detail: 20 }));
  });

  return { walls, fishes, worldWidth, worldHeight };
};

export const updatePlayerDepth = (player, mazeSize) => {
  player.setDepth(mazeSize);
};