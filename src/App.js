import React, { 
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
import { ApartmentSystem } from './game/apartmentUtils';

function App() {
  const gameRef = useRef(null);
  const game = useRef(null);
  const [gameSize, setGameSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [health, setHealth] = useState(100);
  const [showGame, setShowGame] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);
  const [orientation, setOrientation] = useState('portrait');

  // 화면 크기 및 방향 감지
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      let newWidth, newHeight;

      if (isMobile) {
        if (aspectRatio > 1) {
          setOrientation('landscape');
          newWidth = Math.min(height * 0.75, width);
          newHeight = height;
        } else {
          setOrientation('portrait');
          newWidth = width;
          newHeight = Math.min(width * 1.33, height);
        }
      } else {
        newWidth = Math.min(768, width * 0.9);
        newHeight = Math.min(1024, height * 0.9);
      }

      setGameSize({ width: newWidth, height: newHeight });

      if (game.current) {
        game.current.scale.resize(newWidth, newHeight);
        game.current.scale.refresh();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
        // 이미지 로드
        this.load.image('cat1', '/sources/cat1.png');
        this.load.image('cat2', '/sources/cat2.png');
        this.load.image('building1', '/sources/building1.png');
        this.load.image('building2', '/sources/building2.png');
        this.load.image('building3', '/sources/building3.png');
        this.load.image('milk', '/sources/milk.png');
        this.load.image('fish1', '/sources/fish1.png');
        this.load.image('fish2', '/sources/fish2.png');
        this.load.image('enemy1', '/sources/enemy1.png');
        this.load.image('enemy2', '/sources/enemy2.png');
        this.load.image('goal', '/sources/ith.png');
        this.load.image('goalBackground', '/sources/goalbackground.png');
        this.load.image('apt1', '/sources/apt1.png');
        this.load.image('apt2', '/sources/apt2.png');
        this.load.image('apt3', '/sources/apt3.png');
        this.load.image('dust1', '/sources/dust1.png');
        this.load.image('dust2', '/sources/dust2.png');

        this.soundManager = new SoundManager(this);
        this.soundManager.preloadSounds();
      }
    
      create() {
        this.soundManager.playMainBGM();
        createPlayerAnimations(this);
        createEnemyAnimations(this);
        const player = createPlayer(this);
        const { walls, fishes, worldWidth, worldHeight, centerX, centerY } = createMaze(this, player);
        
        // 모바일 컨트롤 추가
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          this.input.addPointer(1);
          this.setupMobileControls(player);
        }

        this.events.on('updateJumpCount', (count) => {
          setJumpCount(count);
        });
      
        player.jumpCount = 0;
        this.events.emit('updateJumpCount', 0);
      
        const milks = createMilkItems(this, walls, player);
      
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
      
        const spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceBar.on('down', () => {
          handlePlayerJump(player, this);
        });

        this.registry.set('milkCount', 0);
        this.registry.set('fishCount', 0);

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
      
        const centerPosX = centerX * this.tileSize * this.spacing;
        const centerPosY = centerY * this.tileSize * this.spacing;
        this.goal = createGoal(this, player, centerPosX, centerPosY);
        
        this.apartmentSystem = new ApartmentSystem(this, player, this.goal);
        
        const cursors = this.input.keyboard.createCursorKeys();
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        this.cameras.main.startFollow(player);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.player = player;
        this.cursors = cursors;
        this.walls = walls;
        
        this.events.on('changeHealth', handleHealthChange);
        
        setupHealthSystem(this, player, fishes);
        
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

      // 모바일 컨트롤 설정
      setupMobileControls(player) {
        // 가상 조이스틱 생성
        const joystickBase = this.add.circle(100, gameSize.height - 100, 50, 0x000000, 0.5);
        const joystick = this.add.circle(100, gameSize.height - 100, 25, 0xcccccc, 0.8);
        
        joystickBase.setScrollFactor(0);
        joystick.setScrollFactor(0);
        joystickBase.setDepth(1000);
        joystick.setDepth(1001);

        // 점프 버튼 생성
        const jumpButton = this.add.circle(gameSize.width - 100, gameSize.height - 100, 40, 0xff0000, 0.5);
        jumpButton.setScrollFactor(0);
        jumpButton.setDepth(1000);
        jumpButton.setInteractive();
        jumpButton.on('pointerdown', () => {
          handlePlayerJump(player, this);
        });

        // 조이스틱 컨트롤
        let isMoving = false;
        this.input.on('pointerdown', (pointer) => {
          if (pointer.x < gameSize.width / 2) {
            isMoving = true;
          }
        });

        this.input.on('pointermove', (pointer) => {
          if (isMoving && pointer.x < gameSize.width / 2) {
            const dx = pointer.x - joystickBase.x;
            const dy = pointer.y - joystickBase.y;
            const angle = Math.atan2(dy, dx);
            const distance = Math.min(50, Math.sqrt(dx * dx + dy * dy));
            
            joystick.x = joystickBase.x + Math.cos(angle) * distance;
            joystick.y = joystickBase.y + Math.sin(angle) * distance;

            const speed = 160 * (distance / 50);
            player.setVelocity(
              Math.cos(angle) * speed,
              Math.sin(angle) * speed
            );
          }
        });

        this.input.on('pointerup', () => {
          isMoving = false;
          joystick.x = joystickBase.x;
          joystick.y = joystickBase.y;
          player.setVelocity(0);
        });
      }

      update() {
        if (this.player && this.cursors && !this.gameOverStarted) {
          if (!this.input.activePointer.isDown) {
            handlePlayerMovement(this.player, this.cursors);
          }
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
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameSize.width,
        height: gameSize.height,
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

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#1a1a1a'
    }}>
      {showGame ? (
        <>
          <Header 
            restartGame={restartGame} 
            health={health} 
            jumpCount={jumpCount}
            orientation={orientation}
          />
          <div 
            id="game-container" 
            ref={gameRef} 
            style={{ 
              width: `${gameSize.width}px`, 
              height: `${gameSize.height}px`,
              margin: '0 auto',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          />
        </>
      ) : (
        <MainPage 
          onStartGame={startGame} 
          orientation={orientation}
        />
      )}
      
      {isGameOver && (
        <GameOver 
          onRetry={restartGame} 
          milkCount={milkCount} 
          fishCount={fishCount} 
          orientation={orientation}
        />
      )}

      {/* 모바일 가로 모드 경고 메시지 */}
      {orientation === 'landscape' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          textAlign: 'center',
          fontSize: '1.2rem'
        }}>
          더 나은 게임 경험을 위해<br/>
          세로 모드로 전환해주세요
        </div>
      )}
    </div>
  );
}

export default App;