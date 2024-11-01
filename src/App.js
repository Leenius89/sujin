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
  const [setIsVictory] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
      if (isMobile) {
        // 모바일에서는 화면의 95%를 사용
        const availableWidth = width * 0.95;
        const availableHeight = height * 0.8; // 헤더와 여백을 고려하여 80%만 사용
  
        // 게임 화면 비율을 3:4로 고정
        const targetAspectRatio = 3 / 4;
        let newWidth, newHeight;
  
        if (availableWidth / availableHeight > targetAspectRatio) {
          // 화면이 더 넓은 경우, 높이 기준으로 계산
          newHeight = availableHeight;
          newWidth = availableHeight * targetAspectRatio;
        } else {
          // 화면이 더 좁은 경우, 너비 기준으로 계산
          newWidth = availableWidth;
          newHeight = availableWidth / targetAspectRatio;
        }
  
        // 최소/최대 크기 제한 설정
        newWidth = Math.min(Math.max(newWidth, 300), 600);
        newHeight = Math.min(Math.max(newHeight, 400), 800);
  
        setGameSize({
          width: Math.floor(newWidth),
          height: Math.floor(newHeight)
        });
      } else {
        // 데스크톱 크기는 기존대로 유지
        setGameSize({
          width: Math.min(768, width * 0.9),
          height: Math.min(1024, height * 0.9)
        });
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
      setupMobileControls(player) {
        const joystickRadius = Math.min(gameSize.width * 0.15, 50);
        const buttonRadius = Math.min(gameSize.width * 0.12, 40);
      
        // 조이스틱 베이스 생성
        const joystickBase = this.add.circle(
          joystickRadius * 1.5,
          gameSize.height - joystickRadius * 1.5,
          joystickRadius,
          0x000000,
          0.3
        );
      
        // 조이스틱 핸들 생성
        const joystick = this.add.circle(
          joystickBase.x,
          joystickBase.y,
          joystickRadius * 0.5,
          0xcccccc,
          0.5
        );
      
        // 점프 버튼 생성
        const jumpButton = this.add.circle(
          gameSize.width - buttonRadius * 1.5,
          gameSize.height - buttonRadius * 1.5,
          buttonRadius,
          0xff0000,
          0.3
        );
      
        // UI 요소 설정
        [joystickBase, joystick, jumpButton].forEach(element => {
          element.setScrollFactor(0);
          element.setDepth(1000);
        });
      
        // 여기서부터 조이스틱 컨트롤 로직 시작
        let isMoving = false;
        const maxDistance = joystickRadius;
      
        this.input.on('pointerdown', (pointer) => {
          if (pointer.x < gameSize.width / 2) {
            isMoving = true;
          }
        });
      
        this.input.on('pointermove', (pointer) => {
          if (isMoving && pointer.x < gameSize.width / 2) {
            // ... 조이스틱 이동 로직 유지 ...
          }
        });
      
        this.input.on('pointerup', () => {
          isMoving = false;
          joystick.x = joystickBase.x;
          joystick.y = joystickBase.y;
          player.setVelocity(0);
          player.anims.play('idle', true);
        });
      
        // 점프 버튼 로직 - 한 번만 설정
        jumpButton.setInteractive()
          .on('pointerdown', () => {
            if (!player.isJumping && player.jumpCount > 0) {
              handlePlayerJump(player, this);
            }
          });
      
        // 터치 이벤트가 다른 입력을 방해하지 않도록 설정
        this.input.setPollAlways();
      }

update() {
  if (this.player && !this.gameOverStarted) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
        if (!this.player.isJumping) {  // 점프 중이 아닐 때만 이동 처리
          if (isMobile) {
            // 모바일에서는 속도 기반으로 애니메이션 처리
            const speed = Math.sqrt(
              Math.pow(this.player.body.velocity.x, 2) + 
              Math.pow(this.player.body.velocity.y, 2)
            );
      
            if (speed > 10) {  // 최소 속도 임계값
              this.player.anims.play('walk', true);
              // 방향 설정
              if (this.player.body.velocity.x < 0) {
                this.player.setFlipX(true);
              } else if (this.player.body.velocity.x > 0) {
                this.player.setFlipX(false);
              }
            } else {
              this.player.anims.play('idle', true);
            }
          } else {
            // 데스크톱 동작 유지
            handlePlayerMovement(this.player, this.cursors);
          }
      
          updatePlayerDepth(this.player, 21);
          
          if (this.enemySpawned && this.enemy) {
            handleEnemyMovement(this.enemy, this.player, this);
          }
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
      backgroundColor: '#1a1a1a',
      paddingTop: '10px' // 상단 여백 추가
    }}>
      {showGame ? (
        <>
          <Header 
            restartGame={restartGame} 
            health={health} 
            jumpCount={jumpCount}
            orientation={orientation}
            gameSize={gameSize}  // gameSize prop 추가
          />
          <div 
            id="game-container" 
            ref={gameRef} 
            style={{ 
              width: `${gameSize.width}px`, 
              height: `${gameSize.height}px`,
              margin: '10px auto',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              position: 'relative'
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
    </div>
  );
}

export default App;