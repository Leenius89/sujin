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
       left: '50%', // 중앙 정렬을 위해 추가
       transform: 'translate(-50%, -50%)', // 중앙 정렬
     }}
     initial={{ x: gameSize.width / 2 }} // 오른쪽에서 시작
     animate={{ x: 0 }} // 중앙으로 이동
     transition={{ 
       duration: 3, // 더 빠른 이동
       ease: "linear"
     }}
     onAnimationComplete={() => {
       setCatArrived(true);
       setShowButton(true);
     }}
   >
     <motion.div
       style={{
         width: '100%',
         height: '100%',
         display: 'flex',
         justifyContent: 'center',
         alignItems: 'center',
         position: 'relative',
       }}
     >
       <motion.img
         src="/sources/cat1.png"
         alt="Walking Cat"
         style={{
           width: '100%',
           height: '100%',
           objectFit: 'contain',
           position: 'absolute',
           transform: 'scaleX(1)', // 정방향으로 변경
         }}
         animate={{ opacity: [1, 0] }}
         transition={{
           duration: 0.3, // 애니메이션 속도 증가
           repeat: catArrived ? 0 : Infinity, // 도착 시 애니메이션 정지
           repeatType: "reverse"
         }}
       />
       <motion.img
         src="/sources/cat2.png"
         alt="Walking Cat 2"
         style={{
           width: '100%',
           height: '100%',
           objectFit: 'contain',
           position: 'absolute',
           transform: 'scaleX(1)', // 정방향으로 변경
         }}
         animate={{ opacity: [0, 1] }}
         transition={{
           duration: 0.3, // 애니메이션 속도 증가
           repeat: catArrived ? 0 : Infinity, // 도착 시 애니메이션 정지
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
     justifyContent: 'center',
     position: 'relative',
     overflow: 'hidden',
     margin: '0 auto'
   }}>
     {/* 타이틀 */}
     <motion.div
       style={{
         position: 'absolute',
         top: '20%',
         left: '50%', // 중앙 정렬
         transform: 'translateX(-50%)', // 중앙 정렬
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
           left: '50%', // 중앙 정렬
           top: '70%',
           transform: 'translateX(-50%)', // 중앙 정렬
           zIndex: 10
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