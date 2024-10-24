import React from 'react';

const Header = ({ restartGame, health }) => {
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
      <h1 style={{ cursor: 'pointer', margin: 0 }} onClick={restartGame}>Maze Whiskers</h1>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px' }}>HP</span>
        <div style={{ width: '100px', height: '20px', backgroundColor: '#ddd', borderRadius: '10px' }}>
          <div style={{
            width: `${health}px`,
            height: '100%',
            backgroundColor: 'red',
            borderRadius: '10px',
            transition: 'width 0.5s'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default Header;