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
  const [isVictory, setIsVictory] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [milkCount, setMilkCount] = useState(0);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 768;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
      if (isMobile) {
        // 모바일에서는 화면 너비의 90%를 사용
        const maxWidth = Math.min(width * 0.9, baseWidth);
        
        setGameSize({
          width: maxWidth,
          height: height * 0.8 // 화면 높이의 80%만 사용
        });
      } else {
        // 데스크톱에서는 768px 고정 너비 사용
        setGameSize({
          width: baseWidth,
          height: Math.min(height * 0.9, baseWidth * 1.33) // 4:3 비율 유지하되 화면 높이의 90% 제한
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
        
        // 카메라 설정 부분 수정
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        this.cameras.main.startFollow(player, true);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        
        if (isMobile) {
            this.cameras.main.setZoom(0.5); // 모바일에서 더 멀리 보이도록
            this.cameras.main.setFollowOffset(-50, -50);
            this.cameras.main.setLerp(0.1, 0.1); // 부드러운 카메라 움직임
        } else {
            this.cameras.main.setZoom(1); // PC에서는 기본 줌
        }
        
        this.player = player;
        this.cursors = cursors;
        this.walls = walls;
        
        this.events.on('changeHealth', handleHealthChange);
        
        setupHealthSystem(this, player, fishes);
        
        const spawnDelay = Phaser.Math.Between(16000, 20000);
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
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;
      
        // UI 컨테이너 생성
        const gameContainer = document.getElementById('game-container');
        const controlsContainer = document.createElement('div');
        Object.assign(controlsContainer.style, {
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          pointerEvents: 'none',
          zIndex: '1000'
        });
      
        // 조이스틱 영역
        const joystickArea = document.createElement('div');
        Object.assign(joystickArea.style, {
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.3)',
          position: 'relative',
          pointerEvents: 'auto'
        });
      
        // 조이스틱 핸들
        const joystickHandle = document.createElement('div');
        Object.assign(joystickHandle.style, {
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.5)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        });
      
        // 점프 버튼
        const jumpButton = document.createElement('button');
        Object.assign(jumpButton.style, {
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 0, 0, 0.5)',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          pointerEvents: 'auto',
          cursor: 'pointer'
        });
        jumpButton.textContent = 'JUMP';
      
        // UI 조립
        joystickArea.appendChild(joystickHandle);
        controlsContainer.appendChild(joystickArea);
        controlsContainer.appendChild(jumpButton);
        gameContainer.appendChild(controlsContainer);
      
        // 조이스틱 이벤트 처리
        let isJoystickActive = false;
        let joystickOrigin = { x: 0, y: 0 };
      
        joystickArea.addEventListener('pointerdown', (e) => {
          isJoystickActive = true;
          const rect = joystickArea.getBoundingClientRect();
          joystickOrigin.x = e.clientX - rect.left;
          joystickOrigin.y = e.clientY - rect.top;
          joystickHandle.style.left = `${joystickOrigin.x}px`;
          joystickHandle.style.top = `${joystickOrigin.y}px`;
        });
      
        document.addEventListener('pointermove', (e) => {
          if (!isJoystickActive) return;
      
          const rect = joystickArea.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const dx = x - joystickOrigin.x;
          const dy = y - joystickOrigin.y;
          const angle = Math.atan2(dy, dx);
          const distance = Math.min(60, Math.sqrt(dx * dx + dy * dy));
          
          const moveX = Math.cos(angle) * distance;
          const moveY = Math.sin(angle) * distance;
      
          joystickHandle.style.transform = `translate(${moveX}px, ${moveY}px)`;
      
          // 플레이어 이동
          const speed = 160 * (distance / 60);
          player.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
      
          // 애니메이션
          if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
            player.anims.play('walk', true);
            if (moveX < 0) {
              player.setFlipX(true);
              player.lastDirection = 'left';
            } else {
              player.setFlipX(false);
              player.lastDirection = 'right';
            }
          }
        });
      
        const endJoystick = () => {
          if (!isJoystickActive) return;
          isJoystickActive = false;
          joystickHandle.style.transform = 'translate(-50%, -50%)';
          player.setVelocity(0);
          player.anims.play('idle', true);
        };
      
        document.addEventListener('pointerup', endJoystick);
        document.addEventListener('pointercancel', endJoystick);
      
        // 점프 버튼 이벤트
        jumpButton.addEventListener('pointerdown', () => {
          if (!player.isJumping && player.jumpCount > 0) {
            handlePlayerJump(player, this);
          }
        });
      
        // 씬 종료 시 정리를 위해 저장
        this.mobileControls = { controlsContainer, joystickArea, jumpButton };
      
        // 씬 종료 시 정리 함수
        this.events.once('shutdown', () => {
          controlsContainer.remove();
        });
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
        if (this.mobileControls) {
          this.mobileControls.controlsContainer.remove();
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
      padding: '10px'
    }}>
      {showGame ? (
        <>
          <Header 
            restartGame={restartGame} 
            health={health} 
            jumpCount={jumpCount}
            gameSize={gameSize}
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
              position: 'relative',
              maxWidth: '768px',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}
          />
        </>
      ) : (
        <MainPage 
          onStartGame={startGame} 
          gameSize={gameSize}
        />
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