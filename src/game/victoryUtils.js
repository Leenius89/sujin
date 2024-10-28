import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
    constructor() {
      super('VictoryScene');
      this.buttonsContainer = null;
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
    }
  
    create() {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      // 먼저 검은색 배경으로 시작
      const blackOverlay = this.add.graphics();
      blackOverlay.setDepth(1);
      blackOverlay.fillStyle(0x000000, 1);
      blackOverlay.fillRect(0, 0, width, height);

      // 배경 이미지 (처음에는 안 보이게)
      const background = this.add.image(0, 0, 'goalBackground');
      background.setOrigin(0, 0);
      background.setDisplaySize(width, height);
      background.setAlpha(0);

      // 텍스트 메시지들
      const messages = [
        "우리 모두에게 집은 소중하다.",
        "좋은 집을 가지고 싶은 마음은 똑같다.",
        "하지만...",
        "모두가 똑같은 집을 가진다해도",
        "모두가 다 똑같아지는 않는다.",
        "우리는 모두 똑같아지고 싶은걸까?"
      ];

      const textStyle = {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
        fixedWidth: width * 0.8,
        wordWrap: { width: width * 0.8 }
      };

      // 각 텍스트의 수직 간격 조정
      const lineSpacing = 60;
      const startY = height / 2 - ((messages.length - 1) * lineSpacing) / 2;

      // 각 텍스트 객체 생성
      const texts = messages.map((_, i) => {
        const text = this.add.text(
          width / 2,
          startY + i * lineSpacing,
          '',
          textStyle
        );
        text.setOrigin(0.5);
        text.setDepth(2);
        return text;
      });

      // 개선된 타자 효과
      const typewriteText = (text, textObject, duration = 1500) => {
        return new Promise((resolve) => {
          const length = text.length;
          let i = 0;
          
          const timer = this.time.addEvent({
            callback: () => {
              textObject.setText(text.slice(0, i + 1));
              i++;
              
              if (i === length) {
                resolve();
              }
            },
            repeat: length - 1,
            delay: duration / length
          });
        });
      };

      // 비동기로 텍스트 순차 표시
      const showTexts = async () => {
        const initialDelay = 2000;
        await new Promise(resolve => this.time.delayedCall(initialDelay, resolve));

        for (let i = 0; i < messages.length; i++) {
          await typewriteText(messages[i], texts[i]);
          if (i < messages.length - 1) {
            await new Promise(resolve => this.time.delayedCall(1000, resolve));
          }
        }

        // 모든 텍스트 표시 후 추가 대기
        await new Promise(resolve => this.time.delayedCall(4000, resolve));

        // 페이드아웃 및 다음 단계로 전환
        texts.forEach(text => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
          });
        });

        // 배경 페이드인 (검은색 오버레이는 유지)
        this.tweens.add({
          targets: background,
          alpha: 1,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            // 배경이 완전히 나타난 후에 검은색 오버레이 페이드아웃
            this.tweens.add({
              targets: blackOverlay,
              alpha: 0,
              duration: 1000,
              ease: 'Power2',
              onComplete: () => {
                this.startCatfishAnimation(width, height);
              }
            });
          }
        });
      };

      showTexts();

      // DOM 요소 설정
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.style.position = 'absolute';
        this.buttonsContainer.style.left = '50%';
        this.buttonsContainer.style.top = '50%';
        this.buttonsContainer.style.transform = 'translate(-50%, -50%)';
        this.buttonsContainer.style.zIndex = '1000';
        this.buttonsContainer.style.display = 'flex';
        this.buttonsContainer.style.flexDirection = 'column';
        this.buttonsContainer.style.gap = '1rem';
        gameContainer.appendChild(this.buttonsContainer);
      }
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
            this.createButtons();
          });
        }
      });
    }

    createButtons() {
      if (this.buttonsContainer) {
        // 메인 메뉴 버튼
        const mainMenuButton = this.createButton('MAIN MENU', '', '#4CAF50');
        
        // 재시작 버튼
        const retryButton = this.createButton('RETRY', `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        `, '#ff0000');

        mainMenuButton.addEventListener('click', () => {
          if (this.buttonsContainer) {
            this.buttonsContainer.remove();
          }
          document.dispatchEvent(new CustomEvent('gameVictory', { detail: { action: 'mainMenu' } }));
        });

        retryButton.addEventListener('click', () => {
          if (this.buttonsContainer) {
            this.buttonsContainer.remove();
          }
          document.dispatchEvent(new CustomEvent('gameVictory', { detail: { action: 'retry' } }));
        });

        this.buttonsContainer.appendChild(mainMenuButton);
        this.buttonsContainer.appendChild(retryButton);

        [mainMenuButton, retryButton].forEach(button => {
          button.style.transform = 'translateY(100vh)';
          requestAnimationFrame(() => {
            button.style.transform = 'translateY(0)';
          });
        });
      }
    }

    createButton(text, icon, bgColor) {
      const button = document.createElement('button');
      button.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          ${icon} ${text}
        </div>
      `;
      
      Object.assign(button.style, {
        backgroundColor: bgColor,
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '0.75rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '250px',
        margin: '0 auto'
      });

      button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.05)';
        button.style.filter = 'brightness(0.9)';
      });

      button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)';
        button.style.filter = 'brightness(1)';
      });

      return button;
    }

    shutdown() {
      if (this.buttonsContainer) {
        this.buttonsContainer.remove();
      }
    }
}