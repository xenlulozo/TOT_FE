"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import * as PIXI from "pixi.js";

// Extend PIXI components for React
extend({
  Container,
  Graphics,
  Text,
});

// Suppress hydration warnings for framer-motion animations
const MotionDiv = motion.div;
const MotionAnimatePresence = AnimatePresence;

import { IPlayerSelectedPayload } from "./interface/game.interface";
// import PixiCard from "./PixiCard";

// Simple optimized card animation using CSS transforms only
const OptimizedCard = ({
  type,
  isSelected,
  promptContent,
  onClick,
  isInteractive
}: {
  type: 'truth' | 'trick';
  isSelected: boolean;
  promptContent?: string;
  onClick?: () => void;
  isInteractive?: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Use CSS transforms for smooth GPU-accelerated animations
  React.useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;
      card.style.willChange = 'transform, opacity';

      if (isSelected) {
        card.style.transform = 'scale(1.1) translateY(-20px) rotateY(180deg)';
        card.style.zIndex = '20';
      } else {
        card.style.transform = 'scale(1) translateY(0) rotateY(0deg)';
        card.style.zIndex = '10';
      }
    }
  }, [isSelected]);

  const bgGradient = type === 'truth'
    ? 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900'
    : 'bg-gradient-to-br from-red-400 via-red-600 to-red-900';

  const frontBgGradient = type === 'truth'
    ? 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800'
    : 'bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800';

  return (
    <div
      ref={cardRef}
      className={`w-64 h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out ${isInteractive ? 'hover:scale-105' : ''
        }`}
      style={{
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Card Back */}
      <div
        className={`absolute inset-0 w-full h-full ${bgGradient} flex flex-col items-center justify-center p-6 ${isSelected ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="text-6xl mb-4">{type === 'truth' ? '❓' : '🎭'}</div>
        <h3 className="text-2xl font-bold text-white mb-2 uppercase">
          {type === 'truth' ? 'Truth' : 'Trick'}
        </h3>
        <p className="text-center text-white/80 text-sm">
          {type === 'truth' ? 'Câu hỏi thật thà' : 'Câu hỏi thử thách'}
        </p>
        <div className="mt-4 text-xl">
          {type === 'truth' ? '🤔💭' : '😈🎪'}
        </div>
      </div>

      {/* Card Front - Content */}
      <div
        className={`absolute inset-0 w-full h-full ${frontBgGradient} flex flex-col items-center justify-center p-6 ${isSelected ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        <div className="text-5xl mb-4">{type === 'truth' ? '❓' : '🎭'}</div>
        <h3 className="text-xl font-bold text-white mb-3 uppercase">
          {type === 'truth' ? 'Truth' : 'Trick'}
        </h3>
        {promptContent && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-xs">
            <p className="text-white text-sm leading-relaxed text-center">
              {promptContent.length > 60 ? promptContent.substring(0, 60) + '...' : promptContent}
            </p>
          </div>
        )}
        <div className="mt-4 text-lg">🎯✨</div>
      </div>
    </div>
  );
};

export type PromptType = "truth" | "trick";

export type PromptSelectionProps = {
  selectedPlayer: IPlayerSelectedPayload | null; // Player data from PLAYER_SELECTED event
  selectedPrompt: PromptType | null; // Which prompt was selected (from server events)
  promptContent?: string | null; // Content of the selected prompt (from server events)
  onPromptSelected?: (promptType: PromptType) => void; // Callback when player chooses truth/trick (for client)
};

/**
 * PromptSelection Component - Handles Truth/Trick card selection
 *
 * Flow:
 * 1. PLAYER_SELECTED event provides player data
 * 2. PICK_PROMPT event signals to show this UI
 * 3. Player clicks Truth or Trick card
 * 4. Card flips and shows the question content
 * 5. Popup closes when END_TURN event is received from server
 */
// PixiCard component for smooth GPU-accelerated animations
// const PixiCard = ({
//   type,
//   isSelected,
//   isFront,
//   promptContent,
//   onClick,
//   isInteractive
// }: {
//   type: 'truth' | 'trick';
//   isSelected: boolean;
//   isFront: boolean;
//   promptContent?: string;
//   onClick?: () => void;
//   isInteractive?: boolean;
// }) => {
//   const [rotation, setRotation] = useState(0);
//   const [scale, setScale] = useState(1);
//   const [yOffset, setYOffset] = useState(0);

//   // Animation loop for floating effect
//   useEffect(() => {
//     if (!isSelected) {
//       const interval = setInterval(() => {
//         setYOffset(prev => Math.sin(Date.now() * 0.003) * 5);
//       }, 16); // 60fps
//       return () => clearInterval(interval);
//     }
//   }, [isSelected]);

//   // Selection animation
//       useEffect(() => {
//         if (isSelected) {
//           setScale(1.2);
//           setYOffset(-50);
//           setRotation(isFront ? 180 : 0);
//         } else {
//           setScale(1);
//           setYOffset(0);
//           setRotation(0);
//         }
//       }, [isSelected, isFront]);

//   const drawCard = (g: PIXI.Graphics) => {
//     g.clear();

//     // Card gradient background
//     const colors = type === 'truth'
//       ? [0x3b82f6, 0x1e40af, 0x1e3a8a] // Blue gradient
//       : [0xef4444, 0xdc2626, 0xb91c1c]; // Red gradient

//     // Main card shape with rounded corners
//     g.beginFill(colors[0]);
//     g.drawRoundedRect(-140, -180, 280, 360, 24);
//     g.endFill();

//     // Gradient overlay
//     g.beginFill(colors[1], 0.8);
//     g.drawRoundedRect(-140, -180, 280, 180, 24);
//     g.endFill();

//     g.beginFill(colors[2], 0.6);
//     g.drawRoundedRect(-140, 0, 280, 180, 24);
//     g.endFill();

//     // Decorative circles
//     g.lineStyle(2, 0xffffff, 0.2);
//     g.drawCircle(-100, -120, 20);
//     g.drawCircle(100, -120, 16);
//     g.drawCircle(0, 0, 24);
//     g.drawCircle(-80, 120, 12);
//     g.drawCircle(80, 120, 18);
//   };

//   const cardWidth = 280;
//   const cardHeight = 360;

//   return (
//     <motion.div
//       className={`relative ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
//       onClick={isInteractive ? onClick : undefined}
//       whileHover={isInteractive ? { scale: 1.05 } : {}}
//       whileTap={isInteractive ? { scale: 0.95 } : {}}
//       style={{ width: cardWidth, height: cardHeight }}
//     >
//       <Application
//         width={cardWidth}
//         height={cardHeight}
//         backgroundAlpha={0}
//         className="rounded-3xl overflow-hidden"
//       >
//         <pixiContainer
//           x={cardWidth / 2}
//           y={cardHeight / 2}
//           scale={scale}
//           rotation={rotation * Math.PI / 180}
//           // y={yOffset}
//         >
//           {/* Card Back */}
//           <pixiGraphics draw={drawCard} />

//           {/* Content */}
//           {isFront ? (
//             <pixiContainer>
//               {/* Background Pattern */}
//               <pixiGraphics
//                 draw={(g: PIXI.Graphics) => {
//                   g.clear();
//                   g.lineStyle(2, 0xffffff, 0.15);
//                   g.drawCircle(-80, -120, 16);
//                   g.drawCircle(80, -120, 12);
//                   g.drawCircle(0, 0, 20);
//                 }}
//               />

//               {/* Icon */}
//               <pixiText
//                 text={type === 'truth' ? '❓' : '🎭'}
//                 anchor={0.5}
//                 x={0}
//                 y={-80}
//                 style={
//                   new PIXI.TextStyle({
//                     fontSize: 64,
//                     fill: '#ffffff',
//                   })
//                 }
//               />

//               {/* Title */}
//               <pixiText
//                 text={type === 'truth' ? 'TRUTH' : 'TRICK'}
//                 anchor={0.5}
//                 x={0}
//                 y={-20}
//                 style={
//                   new PIXI.TextStyle({
//                     fontSize: 24,
//                     fontWeight: 'bold',
//                     fill: '#ffffff',
//                     dropShadow: true,
//                     // dropShadowColor: '#000000',
//                     // dropShadowBlur: 4,
//                     // dropShadowDistance: 2,
//                   })
//                 }
//               />

//               {/* Subtitle */}
//               <pixiText
//                 text={type === 'truth' ? 'Câu hỏi thật thà' : 'Câu hỏi thử thách'}
//                 anchor={0.5}
//                 x={0}
//                 y={10}
//                 style={
//                   new PIXI.TextStyle({
//                     fontSize: 16,
//                     fill: type === 'truth' ? '#dbeafe' : '#fecaca',
//                   })
//                 }
//               />

//               {/* Content if available */}
//               {promptContent && (
//                 <pixiContainer y={60}>
//                   <pixiGraphics
//                     draw={(g: PIXI.Graphics) => {
//                       g.clear();
//                       g.beginFill(0xffffff, 0.1);
//                       g.drawRoundedRect(-100, -30, 200, 60, 12);
//                       g.endFill();
//                     }}
//                   />
//                   <pixiText
//                     text={promptContent.length > 50 ? promptContent.substring(0, 50) + '...' : promptContent}
//                     anchor={0.5}
//                     x={0}
//                     y={0}
//                     style={
//                       new PIXI.TextStyle({
//                         fontSize: 12,
//                         fill: '#ffffff',
//                         align: 'center',
//                         wordWrap: true,
//                         wordWrapWidth: 180,
//                       })
//                     }
//                   />
//                 </pixiContainer>
//               )}
//             </pixiContainer>
//           ) : (
//             /* Card Back Content */
//             <pixiContainer>
//               <pixiText
//                 text="🎯"
//                 anchor={0.5}
//                 x={0}
//                 y={-40}
//                 style={
//                   new PIXI.TextStyle({
//                     fontSize: 48,
//                     fill: '#ffffff',
//                   })
//                 }
//               />
//               <pixiText
//                 text="Chọn để xem!"
//                 anchor={0.5}
//                 x={0}
//                 y={20}
//                 style={
//                   new PIXI.TextStyle({
//                     fontSize: 18,
//                     fill: '#ffffff',
//                     fontWeight: 'bold',
//                   })
//                 }
//               />
//             </pixiContainer>
//           )}
//         </pixiContainer>
//       </Application>
//     </motion.div>
//   );
// };

// Generate stable particle positions to avoid hydration issues
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * 400 - 200,
    delay: Math.random() * 2,
  }));
};

// Generate selected card particles - called outside component to avoid render issues
const generateSelectedParticles = () => {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * 400 - 200,
    yStart: Math.random() * 400 - 200,
    yMid: Math.random() * 400 - 200 - 50,
    yEnd: Math.random() * 400 - 200,
    duration: 4 + Math.random() * 2,
    delay: Math.random() * 2,
  }));
};

// Pre-calculate selected particles outside component
const SELECTED_PARTICLES = generateSelectedParticles();

export const PromptSelection = ({ selectedPlayer, selectedPrompt, promptContent, onPromptSelected }: PromptSelectionProps) => {
  // selectedPlayer data comes from PLAYER_SELECTED event
  // PICK_PROMPT event just signals to show this UI
  // selectedPrompt comes from server events (TRUTH_PROMPT_SELECTED/TRICK_PROMPT_SELECTED)
  // Component closes when END_TURN event is received from server


  // Pre-calculate particles to avoid Math.random() in render
  const truthParticles = useMemo(() => generateParticles(12), []);
  const trickParticles = useMemo(() => generateParticles(12), []);

  const handlePromptClick = (promptType: PromptType) => {
    if (selectedPrompt || !onPromptSelected) return; // Prevent multiple selections or if not interactive

    onPromptSelected(promptType);
  };

  // Allow showing cards even if selectedPlayer is null initially
  // PLAYER_SELECTED event may arrive after PICK_PROMPT
  const player = selectedPlayer?.player;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="prompt-selection-overlay"
        initial={{
          opacity: 0,
          backdropFilter: "blur(0px)",
          backgroundColor: "rgba(0, 0, 0, 0)"
        }}
        animate={{
          opacity: 1,
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.9)"
        }}
        exit={{
          opacity: 0,
          backdropFilter: "blur(0px)",
          backgroundColor: "rgba(0, 0, 0, 0)",
          transition: { duration: 0.4, ease: "easeInOut" }
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        suppressHydrationWarning={true}
      >
        <motion.div
          initial={{
            scale: 0.7,
            y: 60,
            opacity: 0,
            rotateX: 15
          }}
          animate={{
            scale: 1,
            y: 0,
            opacity: 1,
            rotateX: 0
          }}
          exit={{
            scale: 0.7,
            y: 60,
            opacity: 0,
            rotateX: 15,
            transition: {
              duration: 0.4,
              ease: "easeInOut",
              opacity: { duration: 0.3 }
            }
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="relative w-full max-w-4xl mx-4"
          suppressHydrationWarning={true}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            {/* <motion.div
              animate={{ rotate: [0, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-4"
            >
              <span className="text-6xl">🎯</span>
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              {player?.name || "Người chơi"} chọn loại câu hỏi!
            </h2>
            <p className="text-white/70 text-xl font-medium">
              Chọn Truth hoặc Trick để bắt đầu
            </p> */}
          </motion.div>

          {/* Cards Container */}
          {!selectedPrompt ? (
            /* Selection Phase - Show both cards */
            <motion.div
              key="selection-phase"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 30,
                transition: { duration: 0.4, ease: "easeInOut" }
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.15,
                delayChildren: 0.3
              }}
              className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12"
            >
              {/* Truth Card */}
              <motion.div
                initial={{
                  x: -120,
                  opacity: 0,
                  rotateY: -20,
                  scale: 0.8,
                  filter: "blur(4px)"
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                  filter: "blur(0px)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.6, ease: "easeOut" }
                }}
                className={`relative ${onPromptSelected ? 'cursor-pointer group' : 'cursor-default'}`}
                onClick={() => handlePromptClick("truth")}
                whileHover={onPromptSelected && !selectedPrompt ? {
                  scale: 1.08,
                  rotateY: 5,
                  rotateX: 5,
                  z: 50,
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={onPromptSelected && !selectedPrompt ? {
                  scale: 0.95,
                  transition: { duration: 0.1 }
                } : {}}
                suppressHydrationWarning={true}
              >
                {/* Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl opacity-0 ${onPromptSelected ? 'group-hover:opacity-100' : ''} transition-opacity duration-300`}
                  style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                  animate={selectedPrompt === "truth" ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  } : {}}
                  transition={{ duration: 2, repeat: selectedPrompt === "truth" ? Infinity : 0 }}
                />

                {/* Floating Particles */}
                {selectedPrompt !== "truth" && (
                  <motion.div className="absolute -top-4 -right-4 w-3 h-3 bg-blue-400 rounded-full opacity-60" />
                )}
                {selectedPrompt !== "truth" && (
                  <motion.div className="absolute -bottom-4 -left-4 w-2 h-2 bg-cyan-400 rounded-full opacity-40" />
                )}

                <motion.div
                  className="w-64 sm:w-72 h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl relative"
                  animate={{
                    rotateY: selectedPrompt === "truth" ? 180 : 0,
                    scale: selectedPrompt === "truth" ? 1.1 : 1,
                    y: selectedPrompt !== "truth" ? [0, -8, -6, -10, -4, -8, 0] : 0,
                    rotateX: selectedPrompt !== "truth" ? [0, -0.5, 0.3, -0.8, 0.2, -0.5, 0] : 0,
                    boxShadow: selectedPrompt !== "truth"
                      ? [
                        "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
                        "0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)",
                        "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)"
                      ]
                      : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                  }}
                  transition={{
                    duration: 0.6,
                    y: {
                      duration: 6,
                      repeat: selectedPrompt !== "truth" ? Infinity : 0,
                      ease: "easeInOut"
                    },
                    rotateX: {
                      duration: 6,
                      repeat: selectedPrompt !== "truth" ? Infinity : 0,
                      ease: "easeInOut"
                    },
                    boxShadow: {
                      duration: 3,
                      repeat: selectedPrompt !== "truth" ? Infinity : 0,
                      ease: "easeInOut"
                    }
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform"
                  }}
                  whileHover={selectedPrompt !== "truth" ? {
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={selectedPrompt !== "truth" ? {
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  } : {}}
                >
                  {/* Card Back */}
                  <motion.div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-600 via-blue-700 to-blue-900 flex flex-col items-center justify-center relative overflow-hidden"
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.0, duration: 0.3 }}
                          className="absolute top-4 left-4 w-16 h-16 border-2 border-white/20 rounded-full"
                        />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.1, duration: 0.3 }}
                          className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white/20 rounded-full"
                        />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2, duration: 0.3 }}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full"
                        />
                      </div>

                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 200 }}
                        className="text-8xl mb-6"
                      >
                        <motion.span
                          animate={{ rotate: [0, 180] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          ❓
                        </motion.span>
                      </motion.div>

                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.05, 1],
                          textShadow: [
                            "0 0 10px rgba(255,255,255,0.5)",
                            "0 0 20px rgba(255,255,255,0.8)",
                            "0 0 10px rgba(255,255,255,0.5)"
                          ]
                        }}
                        transition={{
                          delay: 1.1,
                          duration: 0.4,
                          ease: "easeOut",
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          textShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="text-4xl font-black mb-3 text-white drop-shadow-lg"
                      >
                        TRUTH
                      </motion.h3>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3, duration: 0.4, ease: "easeOut" }}
                        className="text-blue-100 text-lg font-medium"
                      >
                        Câu hỏi thật thà
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
                        className="mt-6 text-2xl"
                      >
                        🤔💭
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Card Front - Selected State */}
                  <motion.div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Success Particles Background */}
                      <div className="absolute inset-0">
                        {truthParticles.map((particle) => (
                          <motion.div
                            key={particle.id}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            initial={{
                              x: particle.x,
                              y: particle.y,
                              opacity: 0,
                              scale: 0
                            }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: particle.x,
                              y: [particle.y, particle.y - 20, particle.y],
                              rotate: [0, 180, 360]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: particle.delay,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>

                      <motion.div
                        animate={{ scale: [1, 1.2], rotate: [0, 10] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl mb-6 z-10"
                      >
                        ✅
                      </motion.div>
                      <h3 className="text-4xl font-black mb-3 text-white drop-shadow-lg z-10">
                        TRUTH
                      </h3>
                      <p className="text-emerald-100 text-xl font-bold z-10">
                        Đã chọn! 🎉
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Trick Card */}
              <motion.div
                initial={{
                  x: 120,
                  opacity: 0,
                  rotateY: 20,
                  scale: 0.8,
                  filter: "blur(4px)"
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                  rotateY: 0,
                  scale: 1,
                  filter: "blur(0px)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.6, ease: "easeOut" }
                }}
                className={`relative ${onPromptSelected ? 'cursor-pointer group' : 'cursor-default'}`}
                onClick={() => handlePromptClick("trick")}
                whileHover={onPromptSelected && !selectedPrompt ? {
                  scale: 1.08,
                  rotateY: -5,
                  rotateX: -5,
                  z: 50,
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={onPromptSelected && !selectedPrompt ? {
                  scale: 0.95,
                  transition: { duration: 0.1 }
                } : {}}
                suppressHydrationWarning={true}
              >
                {/* Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl opacity-0 ${onPromptSelected ? 'group-hover:opacity-100' : ''} transition-opacity duration-300`}
                  style={{
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                  animate={selectedPrompt === "trick" ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  } : {}}
                  transition={{ duration: 2, repeat: selectedPrompt === "trick" ? Infinity : 0 }}
                />

                {/* Floating Particles */}
                {selectedPrompt !== "trick" && (
                  <motion.div className="absolute -top-4 -left-4 w-3 h-3 bg-red-400 rounded-full opacity-60" />
                )}
                {selectedPrompt !== "trick" && (
                  <motion.div className="absolute -bottom-4 -right-4 w-2 h-2 bg-pink-400 rounded-full opacity-40" />
                )}

                <motion.div
                  className="w-64 sm:w-72 h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl relative"
                  animate={{
                    rotateY: selectedPrompt === "trick" ? 180 : 0,
                    scale: selectedPrompt === "trick" ? 1.1 : 1,
                    y: selectedPrompt !== "trick" ? [0, -10, -8, -12, -6, -10, 0] : 0,
                    rotateX: selectedPrompt !== "trick" ? [0, 0.6, -0.4, 0.9, -0.2, 0.6, 0] : 0,
                    boxShadow: selectedPrompt !== "trick"
                      ? [
                        "0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)",
                        "0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.2)",
                        "0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)"
                      ]
                      : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                  }}
                  transition={{
                    duration: 0.6,
                    y: {
                      duration: 6.5,
                      repeat: selectedPrompt !== "trick" ? Infinity : 0,
                      ease: "easeInOut"
                    },
                    rotateX: {
                      duration: 6.5,
                      repeat: selectedPrompt !== "trick" ? Infinity : 0,
                      ease: "easeInOut"
                    },
                    boxShadow: {
                      duration: 3.2,
                      repeat: selectedPrompt !== "trick" ? Infinity : 0,
                      ease: "easeInOut"
                    }
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform"
                  }}
                  whileHover={selectedPrompt !== "trick" ? {
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={selectedPrompt !== "trick" ? {
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  } : {}}
                >
                  {/* Card Back */}
                  <motion.div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0, duration: 0.4 }}
                      className="w-full h-full bg-gradient-to-br from-red-400 via-red-600 via-red-700 to-red-900 flex flex-col items-center justify-center relative overflow-hidden"
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2, duration: 0.3 }}
                          className="absolute top-4 right-4 w-16 h-16 border-2 border-white/20 rounded-full"
                        />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.3, duration: 0.3 }}
                          className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white/20 rounded-full"
                        />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.4, duration: 0.3 }}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full"
                        />
                      </div>

                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: 180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ delay: 1.1, duration: 0.5, type: "spring", stiffness: 200 }}
                        className="text-8xl mb-6"
                      >
                        <motion.span
                          animate={{ rotate: [0, -180] }}
                          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        >
                          🎭
                        </motion.span>
                      </motion.div>

                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.05, 1],
                          textShadow: [
                            "0 0 10px rgba(255,255,255,0.5)",
                            "0 0 20px rgba(255,255,255,0.8)",
                            "0 0 10px rgba(255,255,255,0.5)"
                          ]
                        }}
                        transition={{
                          delay: 1.3,
                          duration: 0.4,
                          ease: "easeOut",
                          scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                          textShadow: { duration: 1.7, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="text-4xl font-black mb-3 text-white drop-shadow-lg"
                      >
                        TRICK
                      </motion.h3>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
                        className="text-red-100 text-lg font-medium"
                      >
                        Câu hỏi thử thách
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.7, duration: 0.4, ease: "easeOut" }}
                        className="mt-6 text-2xl"
                      >
                        😈🎪
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Card Front - Selected State */}
                  <motion.div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Success Particles Background */}
                      <div className="absolute inset-0">
                        {trickParticles.map((particle) => (
                          <motion.div
                            key={particle.id}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            initial={{
                              x: particle.x,
                              y: particle.y,
                              opacity: 0,
                              scale: 0
                            }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: particle.x,
                              y: [particle.y, particle.y - 25, particle.y],
                              rotate: [0, -180, -360]
                            }}
                            transition={{
                              duration: 3.5,
                              repeat: Infinity,
                              delay: particle.delay,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>

                      <motion.div
                        animate={{ scale: [1, 1.2], rotate: [0, -10] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl mb-6 z-10"
                      >
                        🎪
                      </motion.div>
                      <h3 className="text-4xl font-black mb-3 text-white drop-shadow-lg z-10">
                        TRICK
                      </h3>
                      <p className="text-orange-100 text-xl font-bold z-10">
                        Đã chọn! 🎉
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

          ) : (
            /* Selected Phase - Show only the selected card with content */
            <motion.div
              key="selected-phase"
              initial={{
                opacity: 0,
                scale: 0.6,
                y: 40,
                filter: "blur(8px)"
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                filter: "blur(0px)"
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                y: -40,
                filter: "blur(8px)",
                transition: { duration: 0.5, ease: "easeInOut" }
              }}
              transition={{
                duration: 0.7,
                ease: "easeOut",
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="flex justify-center"
            >
              <motion.div
                initial={{
                  scale: 0.5,
                  opacity: 0,
                  rotateY: -90,
                  filter: "blur(6px)"
                }}
                animate={{
                  scale: [1, 1.08, 1.05, 1.08, 1],
                  opacity: 1,
                  rotateY: [0, 2, -2, 1, 0],
                  y: [0, -15, -10, -15, 0],
                  rotateX: [0, -3, 2, -1, 0],
                  boxShadow: selectedPrompt === "truth"
                    ? [
                      "0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)",
                      "0 0 60px rgba(59, 130, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.5), 0 0 140px rgba(59, 130, 246, 0.2)",
                      "0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)"
                    ]
                    : [
                      "0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.3), 0 0 120px rgba(239, 68, 68, 0.1)",
                      "0 0 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.5), 0 0 140px rgba(239, 68, 68, 0.2)",
                      "0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.3), 0 0 120px rgba(239, 68, 68, 0.1)"
                    ],
                  filter: "blur(0px)"
                }}
                transition={{
                  duration: 1.0,
                  type: "spring",
                  stiffness: 250,
                  damping: 20,
                  delay: 0.1,
                  scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  rotateX: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                  rotateY: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-80 sm:w-96 h-[480px] sm:h-[560px] rounded-3xl overflow-hidden shadow-2xl relative"
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform"
                }}
              >
                {/* Card Front - Shows the question content */}
                <motion.div
                  className={`absolute inset-0 w-full h-full backface-hidden ${selectedPrompt === "truth"
                    ? "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900"
                    : "bg-gradient-to-br from-red-400 via-red-600 to-red-900"
                    } flex flex-col items-center justify-center relative overflow-hidden`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <motion.div
                      className="absolute top-4 left-4 w-16 h-16 border-2 border-white/20 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white/20 rounded-full"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.5, 0.2]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 180, 360],
                        opacity: [0.2, 0.3, 0.2]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                      }}
                    />
                  </div>

                  {/* Animated Particles Background */}
                  <div className="absolute inset-0">
                    {SELECTED_PARTICLES.map((particle) => (
                      <motion.div
                        key={`selected-particle-${particle.id}`}
                        className="absolute w-3 h-3 bg-white/30 rounded-full"
                        initial={{
                          x: particle.x,
                          y: particle.y,
                          opacity: 0,
                          scale: 0
                        }}
                        animate={{
                          opacity: [0, 0.6, 0],
                          scale: [0, 1, 0],
                          x: particle.x,
                          y: [particle.yStart, particle.yMid, particle.yEnd],
                          rotate: [0, 180, 360]
                        }}
                        transition={{
                          duration: particle.duration,
                          repeat: Infinity,
                          delay: particle.delay,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 0.5,
                      duration: 0.6,
                      ease: "easeOut",
                      staggerChildren: 0.2
                    }}
                    className="text-center px-8 z-10"
                  >
                    <motion.div
                      initial={{
                        scale: 0.3,
                        opacity: 0,
                        rotate: -180,
                        filter: "blur(4px)"
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        rotate: 0,
                        filter: "blur(0px)"
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 200
                      }}
                      className="text-7xl mb-6"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {selectedPrompt === "truth" ? "❓" : "🎭"}
                      </motion.span>
                    </motion.div>

                    <motion.h3
                      initial={{
                        opacity: 0,
                        y: 20,
                        scale: 0.8,
                        filter: "blur(2px)"
                      }}
                      animate={{
                        opacity: 1,
                        y: [0, -5, 0],
                        scale: [1, 1.15, 1.1, 1.15, 1],
                        filter: "blur(0px)",
                        textShadow: [
                          "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)",
                          "0 0 15px rgba(255,255,255,1), 0 0 30px rgba(255,255,255,0.6), 0 0 45px rgba(255,255,255,0.3)",
                          "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)"
                        ]
                      }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 300,
                        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        textShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="text-3xl font-black mb-4 text-white drop-shadow-lg uppercase"
                    >
                      {selectedPrompt === "truth" ? "Truth" : "Trick"}
                    </motion.h3>

                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.7,
                        y: 20,
                        filter: "blur(3px)"
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        filter: "blur(0px)"
                      }}
                      transition={{
                        duration: 0.7,
                        ease: "easeOut",
                        delay: 0.2
                      }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                    >
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.5,
                          duration: 0.4,
                          ease: "easeOut"
                        }}
                        className="text-white text-lg leading-relaxed font-medium"
                      >
                        {promptContent || "Đang tải câu hỏi..."}
                      </motion.p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4, duration: 0.4, ease: "easeOut" }}
                      className="mt-6 text-2xl"
                    >
                      🎯✨
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Card Back - Hidden after flip */}
                <motion.div
                  className={`absolute inset-0 w-full h-full backface-hidden ${selectedPrompt === "truth"
                    ? "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-900"
                    : "bg-gradient-to-br from-red-400 via-red-600 to-red-900"
                    } flex flex-col items-center justify-center relative overflow-hidden`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-white">Đã chọn!</h3>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

        </motion.div>

        {/* Selected prompt indicator - Only show when not displaying the card */}
        {selectedPrompt && !promptContent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            className="text-center mt-12"
            suppressHydrationWarning={true}
          >
            <motion.div
              className="inline-flex items-center gap-4 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255,255,255,0.1)',
                  '0 0 40px rgba(255,255,255,0.2)',
                  '0 0 20px rgba(255,255,255,0.1)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="text-4xl"
                animate={{ rotate: [0, 10] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {selectedPrompt === "truth" ? "❓" : "🎭"}
              </motion.span>
              <div className="flex flex-col items-start">
                <span className="text-white font-black text-xl tracking-wide">
                  ĐÃ CHỌN
                </span>
                <span className="text-white/90 font-bold text-2xl uppercase tracking-wider">
                  {selectedPrompt === "truth" ? "TRUTH" : "TRICK"}
                </span>
              </div>
              <motion.span
                className="text-3xl"
                animate={{ scale: [1, 1.2] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                ✨
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PromptSelection;
