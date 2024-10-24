import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

export default function GameOver({ onRetry }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem'
        }}
        initial={{ y: '100vh' }}
        animate={{ y: 0 }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 100,
          duration: 0.8
        }}
      >
        {/* 게임오버 텍스트 */}
        <motion.h1
          style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: '#ff0000',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          GAME OVER
        </motion.h1>

        {/* 리트라이 버튼 */}
        <motion.button
          style={{
            backgroundColor: '#ff0000',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.75rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onClick={onRetry}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: '#cc0000'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw 
            size={24} 
            style={{
              color: 'white'
            }}
          />
          RETRY
        </motion.button>
      </motion.div>
    </div>
  );
}