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
    fontSize: '1rem',
    fontFamily: "'Press Start 2P', cursive",
    textAlign: 'center',
    width: '240px',  // 버튼과 동일한 너비
    margin: '0 auto 2rem auto'  // 중앙 정렬
  });

  // Milk 카운트
  const milkDiv = document.createElement('div');
  Object.assign(milkDiv.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',  // 중앙 정렬 추가
    gap: '1rem',
    imageRendering: 'pixelated',
    width: '100%'  // 전체 너비 사용
  });
  milkDiv.innerHTML = `
    <img src="/sources/milk.png" alt="milk" style="width: 32px; height: 32px" />
    <span style="text-shadow: 2px 2px 0 #000; min-width: 50px; text-align: left">× ${this.milkCount}</span>
  `;

  // Fish 카운트
  const fishDiv = document.createElement('div');
  Object.assign(fishDiv.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',  // 중앙 정렬 추가
    gap: '1rem',
    imageRendering: 'pixelated',
    width: '100%'  // 전체 너비 사용
  });
  fishDiv.innerHTML = `
    <img src="/sources/fish1.png" alt="fish" style="width: 32px; height: 32px" />
    <span style="text-shadow: 2px 2px 0 #000; min-width: 50px; text-align: left">× ${this.fishCount}</span>
  `;

  statsContainer.appendChild(milkDiv);
  statsContainer.appendChild(fishDiv);
  this.buttonsContainer.appendChild(statsContainer);
}

setupButtons() {
  // 버튼 스타일 기본값
  const buttonStyle = {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontFamily: "'Press Start 2P', cursive",  // 픽셀 폰트 적용
    color: 'white',
    border: '4px solid',  // 8비트 스타일 테두리
    cursor: 'pointer',
    marginBottom: '1rem',
    width: '240px',  // 버튼 너비 증가
    imageRendering: 'pixelated',
    textAlign: 'center',
    boxShadow: '4px 4px 0 #000',  // 8비트 스타일 그림자
    textShadow: '2px 2px 0 #000'  // 텍스트 그림자
  };

  // 메인 메뉴 버튼
  const mainMenuButton = this.createButton('MAIN MENU', '#4CAF50', {
    ...buttonStyle,
    borderColor: '#2E7D32'  // 어두운 녹색 테두리
  });
  
  // 재시작 버튼
  const retryButton = this.createButton('RETRY', '#ff0000', {
    ...buttonStyle,
    borderColor: '#8B0000'  // 어두운 빨간색 테두리
  });
  
  // 크레딧 버튼
  const creditButton = this.createButton('CREDITS', '#2196F3', {
    ...buttonStyle,
    borderColor: '#0D47A1'  // 어두운 파란색 테두리
  });

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
    transition: 'all 0.1s ease'  // 더 빠른 전환 효과
  });
  button.textContent = text;
  
  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '6px 6px 0 #000';  // 그림자 증가
  };
  
  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '4px 4px 0 #000';  // 원래 그림자로 복귀
  };

  button.onmousedown = () => {
    button.style.transform = 'translateY(2px)';
    button.style.boxShadow = '2px 2px 0 #000';  // 그림자 감소
  };

  button.onmouseup = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '6px 6px 0 #000';
  };

  return button;
  }
}