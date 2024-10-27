import Phaser from 'phaser';

export class SoundManager {
    constructor(scene) {
      this.scene = scene;
      this.sounds = {};
      this.soundsLoaded = false;
      this.currentFishSound = null;
    }
  
    preloadSounds() {
        try {
          // 상대 경로로 수정
          this.scene.load.audio('mainBGM', 'sources/main.mp3');
          this.scene.load.audio('enemySound', 'sources/enemy.mp3');
          this.scene.load.audio('fishSound', 'sources/fish.mp3');
          this.scene.load.audio('dyingSound', 'sources/dying.mp3');
          this.scene.load.audio('construct1', 'sources/construct1.mp3');
          this.scene.load.audio('construct2', 'sources/construct2.mp3');
          this.scene.load.audio('construct3', 'sources/construct3.mp3');
    
          // 로드 완료 이벤트 설정
          this.scene.load.on('complete', this.initializeSounds.bind(this));
        } catch (error) {
          console.error('Error loading audio files:', error);
        }
      }
    
      initializeSounds() {
        try {
          this.sounds = {
            mainBGM: this.scene.sound.add('mainBGM', { loop: true, volume: 0.5 }),
            fishSound: this.scene.sound.add('fishSound', { loop: false, volume: 0.5 }),
            dyingSound: this.scene.sound.add('dyingSound', { loop: false, volume: 0.5 }),
            enemySound: this.scene.sound.add('enemySound', { loop: true, volume: 0 })
          };
          this.soundsLoaded = true;
          console.log('Sounds initialized successfully'); // 디버깅용
        } catch (error) {
          console.error('Error initializing sounds:', error);
          this.soundsLoaded = false;
        }
      }
  
    playMainBGM() {
      if (this.soundsLoaded && this.sounds.mainBGM) {
        try {
          this.sounds.mainBGM.play();
        } catch (error) {
          console.error('Error playing mainBGM:', error);
        }
      }
    }
  
    playFishSound() {
        if (!this.soundsLoaded) {
          console.warn('Sounds not loaded yet');
          return;
        }
      
        try {
          // 새 사운드 인스턴스 생성 및 재생
          const fishSound = this.scene.sound.add('fishSound', {
            volume: 0.5,
            loop: false
          });
      
          fishSound.play();
          console.log('Fish sound played');
      
          // 재생 완료 시 정리
          fishSound.once('complete', () => {
            fishSound.destroy();
          });
        } catch (error) {
          console.error('Error playing fish sound:', error);
        }
      }
  
    playEnemySound() {
      if (this.soundsLoaded && this.sounds.enemySound) {
        try {
          const enemySound = this.sounds.enemySound;
          enemySound.play();
          
          // 페이드 인
          this.scene.tweens.add({
            targets: enemySound,
            volume: 0.3,
            duration: 1000
          });
          
          return enemySound;
        } catch (error) {
          console.error('Error playing enemySound:', error);
        }
      }
      return null;
    }
  
    playDyingSound() {
      if (this.soundsLoaded && this.sounds.dyingSound) {
        try {
          this.sounds.dyingSound.play();
        } catch (error) {
          console.error('Error playing dyingSound:', error);
        }
      }
    }
  
    stopMainBGM() {
      if (this.soundsLoaded && this.sounds.mainBGM) {
        this.scene.tweens.add({
          targets: this.sounds.mainBGM,
          volume: 0,
          duration: 1000,
          onComplete: () => {
            this.sounds.mainBGM.stop();
          }
        });
      }
    }
  
    stopEnemySound(enemySound) {
      if (enemySound) {
        this.scene.tweens.add({
          targets: enemySound,
          volume: 0,
          duration: 500,
          onComplete: () => {
            enemySound.stop();
          }
        });
      }
    }
    playConstructSound() {
        if (!this.soundsLoaded) {
          console.warn('Sounds not loaded yet');
          return;
        }
      
        try {
          // 랜덤하게 1~3개의 사운드 선택
          const numSounds = Phaser.Math.Between(1, 3);
          const availableSounds = [1, 2, 3];
          const selectedSounds = Phaser.Utils.Array.Shuffle(availableSounds).slice(0, numSounds);
      
          selectedSounds.forEach(num => {
            const constructSound = this.scene.sound.add(`construct${num}`, {
              volume: 0.5,
              loop: false
            });
            constructSound.play();
          });
        } catch (error) {
          console.error('Error playing construct sound:', error);
        }
      }
  }