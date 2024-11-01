import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MainPage = ({ onStartGame }) => {
  const [showButton, setShowButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [cameraPosition, setCameraPosition] = useState(0);

  useEffect(() => {
    // Start camera pan animation after a short delay
    setTimeout(() => {
      setCameraPosition(1);
      // Show title after camera reaches top
      setTimeout(() => {
        setShowTitle(true);
        // Show button after title animation
        setTimeout(() => {
          setShowButton(true);
        }, 2000);
      }, 2000);
    }, 500);
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-900">
      {/* Background with camera pan effect */}
      <motion.div
        className="w-full h-[200vh] relative"
        initial={{ y: "0%" }}
        animate={{ y: cameraPosition ? "-50%" : "0%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <img 
          src="/sources/main.png" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Title with pixel animation effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: showTitle ? 1 : 0,
        }}
        transition={{ duration: 0.1 }}
      >
        <motion.h1
          className="text-6xl font-bold text-white font-pixel"
          style={{ 
            textShadow: '2px 2px 0 #000',
            fontFamily: "'Press Start 2P', cursive"
          }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          initial="hidden"
          animate={showTitle ? "visible" : "hidden"}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 50,
            mass: 0.1,
            steps: 4  // Makes the animation appear choppy/pixelated
          }}
        >
          Maze Whiskers
        </motion.h1>
      </motion.div>

      {/* Pixel art start button */}
      {showButton && (
        <motion.button
          className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 px-8 py-4 bg-red-600 text-white font-pixel"
          style={{
            fontFamily: "'Press Start 2P', cursive",
            imageRendering: 'pixelated',
            boxShadow: '4px 4px 0 #000',
            border: '4px solid #000'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 200,
            damping: 15,
            steps: 5  // Pixelated animation effect
          }}
          whileHover={{ 
            scale: 1.1,
            transition: { duration: 0.1 }
          }}
          onClick={onStartGame}
        >
          GAME START
        </motion.button>
      )}

      {/* Add font loading for pixel art style */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" 
        rel="stylesheet"
      />
    </div>
  );
};

export default MainPage;