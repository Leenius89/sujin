import Phaser from 'phaser';
import { showEndingMessages } from './endingMessages';
import { showCredits } from './creditsSystem';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
    this.buttonsContainer = null;
    this.isShowingCredits = false;
  }

  preload() {
    if (!this.textures.exists('goalBackground')) {
      this.load.image('goalBackground', './sources/goalbackground.png');
    }
    if (!this.textures.exists('victoryCat1')) {
      this.load.image('victoryCat1', './sources/catfish1.png');
    }
    if (!this.textures.exists('victoryCat2')) {
      this.load.image('victoryCat2', './sources/catfish2.png');
    }
    if (!this.textures.exists('milk')) {
      this.load.image('milk', './sources/milk.png');
    }
    if (!this.textures.exists('fish1')) {
      this.load.image('fish1', './sources/fish1.png');
    }
  }

  init(data) {
    this.milkCount = data.milkCount || 0;
    this.fishCount = data.fishCount || 0;
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
  
    // 검은 배경으로 시작
    this.blackOverlay = this.add.graphics();
    this.blackOverlay.setDepth(1);
    this.blackOverlay.fillStyle(0x000000, 1);
    this.blackOverlay.fillRect(0, 0, width, height);
  
    // 배경 이미지 (처음에는 안 보이게)
    this.background = this.add.image(0, 0, 'goalBackground');
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0);
  
    // 엔딩 메시지 표시
    await showEndingMessages(this, width, height);
  
    // 배경과 오버레이 전환
    this.tweens.add({
      targets: this.background,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: this.blackOverlay,
          alpha: 0,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            this.startCatfishAnimation(width, height);
          }
        });
      }
    });
  }

  startCatfishAnimation(width, height) {
    if (!this.anims.exists('victoryCatSwim')) {
      this.anims.create({
        key: 'victoryCatSwim',
        frames: [
          { key: 'victoryCat1' },
          { key: 'victoryCat2' }
        ],
        frameRate: 4,
        repeat: -1
      });
    }

    const cat = this.add.sprite(-100, height * 0.8, 'victoryCat1');
    cat.setScale(0.15);
    cat.play('victoryCatSwim');

    this.tweens.add({
      targets: cat,
      x: width / 2,
      duration: 4000,
      ease: 'Power1',
      onComplete: () => {
        cat.anims.stop();
        cat.setTexture('victoryCat1');
        this.time.delayedCall(1000, () => {
          this.setupUI(width, height);
        });
      }
    });
  }

  setupUI(width, height) {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      this.buttonsContainer = document.createElement('div');
      Object.assign(this.buttonsContainer.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '999',  // 크레딧보다 낮은 z-index
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      });
      gameContainer.appendChild(this.buttonsContainer);
    }

    this.setupItemStats();
    this.setupButtons();
}

  setupItemStats() {
    // 아이템 통계 컨테이너
    const statsContainer = document.createElement('div');
    Object.assign(statsContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginBottom: '2rem',
      color: 'white',
      fontSize: '1.5rem'
    });

    // Milk 카운트
    const milkDiv = document.createElement('div');
    Object.assign(milkDiv.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    });
    milkDiv.innerHTML = `
      <img src="/sources/milk.png" alt="milk" style="width: 32px; height: 32px" />
      <span>× ${this.milkCount}</span>
    `;

    // Fish 카운트
    const fishDiv = document.createElement('div');
    Object.assign(fishDiv.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    });
    fishDiv.innerHTML = `
      <img src="/sources/fish1.png" alt="fish" style="width: 32px; height: 32px" />
      <span>× ${this.fishCount}</span>
    `;

    statsContainer.appendChild(milkDiv);
    statsContainer.appendChild(fishDiv);
    this.buttonsContainer.appendChild(statsContainer);
  }

  setupButtons() {
    // 버튼 스타일 기본값
    const buttonStyle = {
      padding: '1rem 2rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginBottom: '0.5rem',
      width: '200px'
    };

    // 메인 메뉴 버튼
    const mainMenuButton = this.createButton('MAIN MENU', '#4CAF50', buttonStyle);
    
    // 재시작 버튼
    const retryButton = this.createButton('RETRY', '#ff0000', buttonStyle);
    
    // 크레딧 버튼
    const creditButton = this.createButton('CREDITS', '#2196F3', buttonStyle);

    // 버튼 이벤트 설정
    mainMenuButton.onclick = () => {
      this.buttonsContainer.remove();
      document.dispatchEvent(new CustomEvent('gameVictory', { 
        detail: { action: 'mainMenu' } 
      }));
    };

    retryButton.onclick = () => {
      this.buttonsContainer.remove();
      document.dispatchEvent(new CustomEvent('gameVictory', { 
        detail: { action: 'retry' } 
      }));
    };

    creditButton.onclick = () => {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      showCredits(
          this, 
          width, 
          height,
          // 크레딧 시작 시 버튼 숨기기
          () => {
              if (this.buttonsContainer) {
                  this.buttonsContainer.style.visibility = 'hidden';
              }
          },
          // 크레딧 종료 시 버튼 다시 보이기
          () => {
              if (this.buttonsContainer) {
                  this.buttonsContainer.style.visibility = 'visible';
              }
          }
      );
  };

    // 버튼들을 컨테이너에 추가
    [mainMenuButton, retryButton, creditButton].forEach(button => {
      this.buttonsContainer.appendChild(button);
      requestAnimationFrame(() => {
        button.style.transform = 'translateY(0)';
      });
    });
  }

  createButton(text, bgColor, baseStyle) {
    const button = document.createElement('button');
    Object.assign(button.style, {
      ...baseStyle,
      backgroundColor: bgColor,
      transform: 'translateY(100vh)',
      transition: 'all 0.3s ease'
    });
    button.textContent = text;
    
    button.onmouseover = () => {
      button.style.transform = 'scale(1.1)';
      button.style.filter = 'brightness(0.9)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'scale(1)';
      button.style.filter = 'brightness(1)';
    };

    return button;
  }
}