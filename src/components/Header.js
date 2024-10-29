import React from 'react';

const Header = ({ restartGame, health, jumpCount = 0 }) => {
  // 체력을 백분율로 변환
  const healthPercentage = (health / 100) * 100;

  return (
    <div style={{
      width: '100%',
      maxWidth: '768px',
      height: '64px',
      backgroundColor: '#F5E5DC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ cursor: 'pointer', margin: 0 }} onClick={restartGame}>
        Maze Whiskers
      </h1>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '20px'  // HP와 Jump 사이의 간격
      }}>
        {/* Jump 카운트 표시 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: '#4a5568',
          padding: '4px 12px',
          borderRadius: '15px',
          color: 'white'
        }}>
          <span>Jump × {jumpCount}</span>
        </div>

        {/* HP 바 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '8px' }}>HP</span>
          <div style={{ 
            width: '100px', 
            height: '20px', 
            backgroundColor: '#ddd', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${healthPercentage}%`,
              height: '100%',
              backgroundColor: 'red',
              borderRadius: '10px',
              transition: 'width 0.5s'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;