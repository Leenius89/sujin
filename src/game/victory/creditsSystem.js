export const showCredits = (scene, width, height, onStart, onEnd) => {
  if (onStart) onStart();

  const creditsBg = scene.add.graphics();
  creditsBg.fillStyle(0x000000, 1);
  creditsBg.fillRect(0, 0, width, height);
  creditsBg.setDepth(1000);
  creditsBg.setAlpha(0);

  const credits = [
      "Maze Whiskers",
      "",
      "A game about housing and equality",
      "",
      "Developer",
      "Joongmin Lee",
      "",
      "Art & Design",
      "Joongmin Lee",
      "",
      "Music & Sound",
      "Pixabay",
      "Lesiakower - Battle Time",
      "Spencer_YK - Little Slime's Adventure",
      "",
      "Special Thanks",
      "알투스 작가님들 감사합니다.",
      "",
      "© 2024 studio 凹凸",
      "",
      "Click anywhere to return"
  ];

  // 화면 중앙에 텍스트 배치
  const creditsText = scene.add.text(width / 2, height / 2, credits.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
  });
  creditsText.setOrigin(0.5, 0.5);
  creditsText.setDepth(1001);
  creditsText.setAlpha(0);

  // 전체 화면을 커버하는 인터랙티브 영역 생성
  const clickableArea = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
  clickableArea.setOrigin(0, 0);
  clickableArea.setDepth(1002);  // 가장 높은 depth 값으로 설정
  clickableArea.setInteractive();
  clickableArea.setAlpha(0);

  // 페이드인
  scene.tweens.add({
      targets: [creditsBg, creditsText],
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
  });

  // 전체 화면 영역에 클릭 이벤트 추가
  clickableArea.on('pointerdown', () => {
    scene.tweens.add({
        targets: [creditsBg, creditsText],
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
            creditsBg.destroy();
            creditsText.destroy();
            clickableArea.destroy();
            if (onEnd) onEnd();
        }
    });
  });

  return { creditsBg, creditsText, clickableArea };
};