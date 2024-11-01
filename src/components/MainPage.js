import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MainPage = ({ onStartGame, gameSize }) => {  // gameSize prop 추가
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [catArrived, setCatArrived] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 4000); // 애니메이션 후에 버튼 표시
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: `${gameSize.width}px`,
      height: `${gameSize.height}px`,
      backgroundColor: '#2d3748',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto'
    }}>
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: catArrived ? 1 : 0 }}
        transition={{ duration: 1 }}
      >
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: 'white',
          margin: 0,
          whiteSpace: 'nowrap'
        }}>
          Maze Whiskers
        </h1>
      </motion.div>
      
      <motion.div
        style={{
          width: '8rem',
          height: '8rem',
          position: 'absolute',
          top: '50%',
          left: '50%',
          scaleX: -1,  // 고양이 반전
        }}
        initial={{ x: '100%', opacity: 1 }}
        animate={{ x: '-50%' }}
        transition={{ 
          type: 'spring', 
          stiffness: 50, 
          damping: 10, 
          duration: 2 
        }}
        onAnimationComplete={() => {
          setCatArrived(true);
        }}
      >
        <motion.div
          animate={{
            backgroundImage: ['url(/sources/cat1.png)', 'url(/sources/cat2.png)']
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </motion.div>

      {showButton && catArrived && (
        <motion.button
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#e53e3e',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            position: 'absolute',
            bottom: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem'
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.1 }}
          onClick={onStartGame}
        >
          GAME START
        </motion.button>
      )}
    </div>
  );
};

export default MainPage;