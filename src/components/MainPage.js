import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MainPage = ({ onStartGame }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 3000); // 3초 후에 버튼 표시
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      backgroundColor: '#2d3748',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <motion.h1 
        style={{
          fontSize: '3.75rem',
          fontWeight: 'bold',
          color: 'white',
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 50, damping: 10, duration: 1.5 }}
      >
        Maze Whiskers
      </motion.h1>
      
      <motion.img
        src="/sources/cat1.png"
        alt="Cat"
        style={{
          width: '8rem',
          height: '8rem',
          objectFit: 'contain',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 50, damping: 10, delay: 1.5, duration: 1.5 }}
      />

      {showButton && (
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
            cursor: 'pointer'
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