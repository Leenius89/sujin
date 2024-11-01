import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MainPage = ({ onStartGame, gameSize }) => {
 const [showButton, setShowButton] = useState(false);
 const [showTitle, setShowTitle] = useState(false);
 const [catArrived, setCatArrived] = useState(false);

 // 고양이 애니메이션 컴포넌트
 const WalkingCat = () => (
   <motion.div
     style={{
       width: '8rem',
       height: '8rem',
       position: 'absolute',
       top: '50%',
       left: '50%',
       transform: 'translate(-50%, -50%)',
     }}
     initial={{ x: '100vw' }}
     animate={{ x: 0 }}
     transition={{ 
       duration: 2,
       ease: "linear"
     }}
     onAnimationComplete={() => {
       setCatArrived(true);
       setShowButton(true);
     }}
   >
     {/* 애니메이션용 이미지 컨테이너 */}
     <motion.div
       style={{
         width: '100%',
         height: '100%',
         position: 'relative',
         transform: 'scaleX(-1)',  // 고양이 반전
       }}
     >
       {/* cat1 이미지 */}
       <motion.img
         src="/sources/cat1.png"
         alt="Cat Walking 1"
         style={{
           width: '100%',
           height: '100%',
           objectFit: 'contain',
           position: 'absolute',
           left: 0,
           top: 0,
         }}
         animate={{
           opacity: catArrived ? 1 : [1, 0]
         }}
         transition={{
           duration: 0.25,
           repeat: catArrived ? 0 : Infinity,
           repeatType: "reverse"
         }}
       />
       {/* cat2 이미지 */}
       <motion.img
         src="/sources/cat2.png"
         alt="Cat Walking 2"
         style={{
           width: '100%',
           height: '100%',
           objectFit: 'contain',
           position: 'absolute',
           left: 0,
           top: 0,
         }}
         animate={{
           opacity: catArrived ? 0 : [0, 1]
         }}
         transition={{
           duration: 0.25,
           repeat: catArrived ? 0 : Infinity,
           repeatType: "reverse"
         }}
       />
     </motion.div>
   </motion.div>
 );

 return (
   <div style={{
     width: `${gameSize.width}px`,
     height: `${gameSize.height}px`,
     backgroundColor: '#2d3748',
     display: 'flex',
     flexDirection: 'column',
     alignItems: 'center',
     position: 'relative',
     overflow: 'hidden',
     margin: '0 auto'
   }}>
     {/* 타이틀 */}
     <motion.div
       style={{
         position: 'absolute',
         top: '20%',
         left: '50%',
         transform: 'translateX(-50%)',
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

     {/* 걷는 고양이 */}
     <WalkingCat />

     {/* 시작 버튼 */}
     {showButton && (
       <motion.button
         style={{
           padding: '0.75rem 1.5rem',
           backgroundColor: '#e53e3e',
           color: 'white',
           fontWeight: 'bold',
           borderRadius: '0.5rem',
           boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
           border: 'none',
           cursor: 'pointer',
           fontSize: '1.25rem',
           position: 'absolute',
           left: '50%',
           top: '65%',
           transform: 'translateX(-50%)',
           zIndex: 10,
           whiteSpace: 'nowrap'
         }}
         initial={{ scale: 0, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ 
           type: "spring",
           stiffness: 260,
           damping: 20,
           duration: 0.6
         }}
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