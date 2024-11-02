export const showEndingMessages = async (scene, width, height) => {
  const messages = [
    "집은 소중하다.",
    "좋은 집을 가지고 싶은 마음은 똑같다.",
    "모두가 집을 가진다해도",
    "모두가 똑같아지지 않는다.",
    "우리는 모두 똑같아지고 싶은걸까?"
  ];

  const textStyle = {
    fontFamily: 'Arial',
    fontSize: '20px',
    color: '#ffffff',
    align: 'center',
    fixedWidth: width * 0.8,
    wordWrap: { width: width * 0.8 }
  };

  // 텍스트 위치 계산
  const lineSpacing = 60;
  const startY = height / 2 - ((messages.length - 1) * lineSpacing) / 2;

  // 텍스트 객체 생성
  const texts = messages.map((_, i) => {
    const text = scene.add.text(width / 2, startY + i * lineSpacing, '', textStyle);
    text.setOrigin(0.5);
    text.setDepth(2);
    return text;
  });

  // 타자 효과 함수
  const typewriteText = (text, textObject, duration = 1500) => {
    return new Promise((resolve) => {
      const length = text.length;
      let i = 0;
      
      scene.time.addEvent({
        callback: () => {
          textObject.setText(text.slice(0, i + 1));
          i++;
          if (i === length) resolve();
        },
        repeat: length - 1,
        delay: duration / length
      });
    });
  };

  // 초기 대기
  await new Promise(resolve => scene.time.delayedCall(2000, resolve));

  // 메시지 순차 표시
  for (let i = 0; i < messages.length; i++) {
    await typewriteText(messages[i], texts[i]);
    if (i < messages.length - 1) {
      await new Promise(resolve => scene.time.delayedCall(1000, resolve));
    }
  }

  // 최종 대기
  await new Promise(resolve => scene.time.delayedCall(4000, resolve));

  // 텍스트 페이드아웃
  texts.forEach(text => {
    scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 1000,
      ease: 'Power2'
    });
  });

  return { texts };
};