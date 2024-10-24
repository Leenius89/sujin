// React와 Hook imports를 분리해서 명시적으로 import
import * as React from 'react';
import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback 
} from 'react';

// Phaser import
import Phaser from 'phaser';

// Components imports
import Header from './components/Header';
import MainPage from './components/MainPage';
import GameOver from './components/GameOver';

// Utility functions imports
import { createMaze, updatePlayerDepth } from './game/mazeUtils';
import { 
  createPlayer, 
  createPlayerAnimations, 
  handlePlayerMovement 
} from './game/playerUtils';
import {
  createEnemy,
  createEnemyAnimations,
  handleEnemyMovement
} from './game/enemyUtils';

// App component 정의
const App = () => {
  const gameRef = useRef(null);
  const game = useRef(null);
  const [gameSize, setGameSize] = useState({ width: 768, height: 1024 });
  const [health, setHealth] = useState(100);
  const [showGame, setShowGame] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

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
        this.mainBGM = null;
        this.worldWidth = 0;
        this.worldHeight = 0;
      }

      preload() {
        // 기존 이미지 로드
        this.load.image('cat1', './sources/cat1.png');
        this.load.image('cat2', './sources/cat2.png');
        this.load.image('building1', './sources/building1.png');
        this.load.image('building2', './sources/building2.png');
        this.load.image('building3', './sources/building3.png');
        this.load.image('fish1', './sources/fish1.png');
        this.load.image('fish2', './sources/fish2.png');
        
        // enemy 이미지 로드
        this.load.image('enemy1', './sources/enemy1.png');
        this.load.image('enemy2', './sources/enemy2.png');
        
        // 사운드 로드
        this.load.audio('mainBGM', './sources/main.mp3');
        this.load.audio('enemySound', './sources/enemy.mp3');
      }
    
      create() {
        // 배경음악 재생
        this.mainBGM = this.sound.add('mainBGM', { loop: true });
        this.mainBGM.play();
    
        createPlayerAnimations(this);
        createEnemyAnimations(this);
    
        const player = createPlayer(this);
        const { walls, fishes, worldWidth, worldHeight } = createMaze(this, player);
        const cursors = this.input.keyboard.createCursorKeys();
      
        // 월드 크기 저장
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        
        this.cameras.main.startFollow(player);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      
        this.player = player;
        this.cursors = cursors;
        this.walls = walls;  // walls 참조 저장
        this.gameOverStarted = false;

      // Enemy 스폰 타이머 설정
      const spawnDelay = Phaser.Math.Between(30000, 45000);
      this.time.delayedCall(spawnDelay, () => {
        if (!this.gameOverStarted) {
          this.enemy = createEnemy(this, this.player, this.worldWidth, this.worldHeight);
          this.enemySpawned = true;
          
          // enemy와 벽 충돌 설정
          this.physics.add.collider(this.enemy, this.walls);
          
          // enemy와 player 충돌 설정
          this.physics.add.overlap(this.player, this.enemy, () => {
            if (!this.gameOverStarted) {
              this.gameOverAnimation();
            }
          });
        }
      });

    // 주기적으로 체력 감소
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        document.dispatchEvent(new CustomEvent('changeHealth', { detail: -1 }));
      },
      loop: true
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

          // 모든 사운드 페이드 아웃
  if (this.mainBGM) {
    this.tweens.add({
      targets: this.mainBGM,
      volume: 0,
      duration: 500,
      onComplete: () => {
        this.mainBGM.stop();
      }
    });
  }

  // enemy 사운드가 있다면 페이드 아웃
  if (this.enemy && this.enemy.enemySound) {
    this.tweens.add({
      targets: this.enemy.enemySound,
      volume: 0,
      duration: 500,
      onComplete: () => {
        this.enemy.enemySound.stop();
      }
    });
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
                }, 500);
              }
            });
          }
        });
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
  }, [gameSize]);

  useEffect(() => {
    if (showGame) {
      createGame();
    }
  
    const handleHealthChangeEvent = (e) => {
      handleHealthChange(e.detail);
    };
  
    document.addEventListener('changeHealth', handleHealthChangeEvent);
  
    return () => {
      if (game.current) game.current.destroy(true);
      document.removeEventListener('changeHealth', handleHealthChangeEvent);
    };
  }, [showGame, createGame, handleHealthChange]);

  const startGame = () => {
    setShowGame(true);
    setHealth(100);
    setIsGameOver(false);
  };

  const restartGame = () => {
    setHealth(100);
    setIsGameOver(false);
    setShowGame(true);
    createGame();
  };

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
          <Header restartGame={restartGame} health={health} />
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
      
      {isGameOver && <GameOver onRetry={restartGame} />}
    </div>
  );
};

export default App;