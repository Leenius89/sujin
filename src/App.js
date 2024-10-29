import * as React from 'react';
import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from 'react';
import Phaser from 'phaser';
import Header from './components/Header';
import MainPage from './components/MainPage';
import GameOver from './components/GameOver';
import { createMaze, updatePlayerDepth } from './game/mazeUtils';
import { 
  createPlayer, 
  createPlayerAnimations, 
  handlePlayerMovement,
  handlePlayerJump,
  createMilkItems, 
} from './game/playerUtils';
import {
  createEnemy,
  createEnemyAnimations,
  handleEnemyMovement
} from './game/enemyUtils';
import { VictoryScene } from './game/victory/victoryUtils';
import { createGoal } from './game/goalUtils';
import { setupHealthSystem } from './game/healthUtils';
import { SoundManager } from './game/soundUtils';
import { ApartmentSystem } from './game/apartmentUtils';  // 추가

function App() {
  const gameRef = useRef(null);
  const game = useRef(null);
  const [gameSize, setGameSize] = useState({ width: 768, height: 1024 });
  const [health, setHealth] = useState(100);
  const [showGame, setShowGame] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);

  const handleHealthChange = useCallback((amount) => {
    setHealth(prevHealth => {
      const newHealth = Math.max(0, Math.min(prevHealth + amount, 100));
      if (newHealth <= 0 && !isGameOver) {
        if (game.current) {
          game.current.scene.getScene('GameScene').gameOverAnimation();
        }
      }
      return newHealth;
    });
  }, [isGameOver]);

  const createGame = useCallback(() => {
    class GameScene extends Phaser.Scene {
      constructor() {
        super('GameScene');
        this.health = 100;
        this.enemy = null;
        this.enemySpawned = false;
        this.worldWidth = 0;
        this.worldHeight = 0;
        this.gameOverStarted = false;
        this.soundManager = null;
        this.apartmentSystem = null;
        
        this.tileSize = 64;
        this.spacing = 1.5;
      }

      preload() {
        // 기본 이미지 로드
        this.load.image('cat1', './sources/cat1.png');
        this.load.image('cat2', './sources/cat2.png');
        this.load.image('building1', './sources/building1.png');
        this.load.image('building2', './sources/building2.png');
        this.load.image('building3', './sources/building3.png');
        this.load.image('milk', './sources/milk.png');
        this.load.image('fish1', './sources/fish1.png');
        this.load.image('fish2', './sources/fish2.png');
        this.load.image('enemy1', './sources/enemy1.png');
        this.load.image('enemy2', './sources/enemy2.png');
        this.load.image('goal', './sources/ith.png');
        this.load.image('goalBackground', './sources/goalbackground.png');

        // 아파트 이미지 로드
        this.load.image('apt1', './sources/apt1.png');
        this.load.image('apt2', './sources/apt2.png');
        this.load.image('apt3', './sources/apt3.png');

        // dust 이미지 로드 추가
        this.load.image('dust1', './sources/dust1.png');
        this.load.image('dust2', './sources/dust2.png');

        // 사운드 매니저 초기화
        this.soundManager = new SoundManager(this);
        this.soundManager.preloadSounds();
      }
    
      create() {
        this.soundManager.playMainBGM();
        createPlayerAnimations(this);
        createEnemyAnimations(this);
        const player = createPlayer(this);
        const { walls, fishes, worldWidth, worldHeight, centerX, centerY } = createMaze(this, player);
        
        // jumpCount 업데이트를 위한 이벤트 설정
        this.events.on('updateJumpCount', (count) => {
          setJumpCount(count);
        });
      
        // player의 초기 jumpCount 설정
        player.jumpCount = 0;
        this.events.emit('updateJumpCount', 0);
      
        // milk 아이템 생성
        const milks = createMilkItems(this, walls, player);
      
        // milk 충돌 처리
        this.physics.add.overlap(player, milks, (player, milk) => {
          if (!this.gameOverStarted) {
            if (this.soundManager) {
              this.soundManager.playFishSound();
            }
            player.jumpCount++;
            this.events.emit('updateJumpCount', player.jumpCount);
            milk.destroy();
          }
        });
      
        // 스페이스바 키 설정
        const spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceBar.on('down', () => {
          handlePlayerJump(player, this);
        });

          // 아이템 카운트 초기화
        this.registry.set('milkCount', 0);
        this.registry.set('fishCount', 0);

        // 아이템 수집 이벤트 리스너
        this.events.on('collectMilk', () => {
          const currentCount = this.registry.get('milkCount') || 0;
          this.registry.set('milkCount', currentCount + 1);
          setMilkCount(currentCount + 1);
        });

        this.events.on('collectFish', () => {
          const currentCount = this.registry.get('fishCount') || 0;
          this.registry.set('fishCount', currentCount + 1);
          setFishCount(currentCount + 1);
        });
      
        // 맵 중앙에 goal 생성
        const centerPosX = centerX * this.tileSize * this.spacing;
        const centerPosY = centerY * this.tileSize * this.spacing;
        this.goal = createGoal(this, player, centerPosX, centerPosY);
        
        // 아파트 시스템 초기화
        this.apartmentSystem = new ApartmentSystem(this, player, this.goal);
        
        const cursors = this.input.keyboard.createCursorKeys();
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        this.cameras.main.startFollow(player);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.player = player;
        this.cursors = cursors;
        this.walls = walls;
        
        // 체력 변경 이벤트 리스너 설정
        this.events.on('changeHealth', handleHealthChange);
        
        // 체력 시스템 설정
        setupHealthSystem(this, player, fishes);
        
        // Enemy 스폰 타이머 설정
        const spawnDelay = Phaser.Math.Between(30000, 45000);
        this.time.delayedCall(spawnDelay, () => {
          if (!this.gameOverStarted) {
            this.enemy = createEnemy(this, this.player, worldWidth, worldHeight);
            this.enemy.enemySound = this.soundManager.playEnemySound();
            this.enemySpawned = true;
            
            this.physics.add.overlap(this.player, this.enemy, () => {
              if (!this.gameOverStarted) {
                this.gameOverAnimation();
              }
            });
          }
        });
      }

      update() {
        if (this.player && this.cursors && !this.gameOverStarted) {
          handlePlayerMovement(this.player, this.cursors);
          updatePlayerDepth(this.player, 21);
          
          if (this.enemySpawned && this.enemy) {
            handleEnemyMovement(this.enemy, this.player, this);
          }
        }
      }
    
      gameOverAnimation() {
        this.gameOverStarted = true;
        this.soundManager.playDyingSound();
        this.soundManager.stopMainBGM();
        
        if (this.enemy && this.enemy.enemySound) {
          this.soundManager.stopEnemySound(this.enemy.enemySound);
        }

        // 아파트 시스템 정지
        if (this.apartmentSystem) {
          this.apartmentSystem.stopSpawning();
        }

        this.tweens.add({
          targets: this.player,
          y: this.player.y - 50,
          angle: 180,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x000000, 1);
            graphics.beginPath();
            graphics.arc(this.player.x, this.player.y + 50, 30, 0, Math.PI, false);
            graphics.closePath();
            graphics.fill();

            this.tweens.add({
              targets: this.player,
              y: this.player.y + 100,
              alpha: 0,
              duration: 500,
              ease: 'Power2',
              onComplete: () => {
                setTimeout(() => {
                  setIsGameOver(true);
                  this.scene.pause();
                }, 500);
              }
            });
          }
        });
      }

      shutdown() {
        if (this.apartmentSystem) {
          this.apartmentSystem.destroy();
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: gameSize.width,
      height: gameSize.height,
      parent: 'game-container',
      backgroundColor: '#808080',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
      },
      scene: GameScene
    };

    if (game.current) game.current.destroy(true);
    game.current = new Phaser.Game(config);
  }, [gameSize, handleHealthChange]);

  useEffect(() => {
    if (showGame && !isGameOver) {
      createGame();
    }

    const handleVictory = (event) => {
      const action = event.detail?.action;
      
      if (action === 'mainMenu') {
        setIsVictory(true);
        setShowGame(false);
      } else if (action === 'retry') {
        setIsVictory(false);
        setHealth(100);
        setShowGame(true);
        setTimeout(() => {
          if (game.current) {
            game.current.destroy(true);
          }
          createGame();
        }, 100);
      }
    };
  
    document.addEventListener('gameVictory', handleVictory);

    return () => {
      if (game.current) game.current.destroy(true);
      document.removeEventListener('gameVictory', handleVictory);
    };
  }, [showGame, createGame, isGameOver]);

  const startGame = () => {
    setShowGame(true);
    setHealth(100);
    setIsGameOver(false);
    setMilkCount(0);
    setFishCount(0);
    setJumpCount(0);
  };

  const restartGame = () => {
    setIsGameOver(false);
    setHealth(100);
    setMilkCount(0);
    setFishCount(0);
    setJumpCount(0);
    setTimeout(() => {
      if (game.current) {
        game.current.destroy(true);
      }
      setShowGame(true);
      createGame();
    }, 100);
  };

// App.js의 return 부분
return (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    minHeight: '100vh',
    padding: '20px',
    position: 'relative'
  }}>
    {showGame ? (
      <>
        <Header 
          restartGame={restartGame} 
          health={health} 
          jumpCount={jumpCount}  // jumpCount props 추가
        />
        <div 
          id="game-container" 
          ref={gameRef} 
          style={{ 
            width: `${gameSize.width}px`, 
            height: `${gameSize.height}px`,
            marginTop: '20px'
          }}
        />
      </>
    ) : (
      <MainPage onStartGame={startGame} />
    )}
    
    {isGameOver && (
  <GameOver 
    onRetry={restartGame} 
    milkCount={milkCount} 
    fishCount={fishCount} 
  />
)}
  </div>
);
}

export default App;