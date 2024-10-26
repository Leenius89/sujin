import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
    constructor() {
      super('VictoryScene');
    }
  
    preload() {
      if (!this.textures.exists('goalBackground')) {
        this.load.image('goalBackground', './sources/goalbackground.png');
      }
      if (!this.textures.exists('victoryCat')) {
        this.load.image('victoryCat', './sources/cat1.png');
      }
    }
  
    create() {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
  
      // 배경 이미지
      const background = this.add.image(0, 0, 'goalBackground');
      background.setOrigin(0, 0);
      background.setDisplaySize(width, height);
  
      // 고양이 스프라이트
      const cat = this.add.sprite(-100, height / 2, 'victoryCat');
      cat.setScale(0.2);
  
      // 애니메이션
      this.tweens.add({
        targets: cat,
        x: width / 2,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          this.time.addEvent({
            delay: 1000,
            callback: () => {
              // victory 이벤트를 scene에서 발생시킴
              this.events.emit('victoryComplete');
            }
          });
        }
      });
    }
  }