"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo } from "react";
import { config } from "@/lib/socket.enum";
import { IPlayerSelectedPayload } from "../interface/game.interface";
import { AVATAR_EMOJI } from "./listPlayer";
import { A_comratulation } from "@/components/Wheel/Confetti";

// Generate particle properties outside render to avoid Math.random in render
const generateParticles = () => {
    return [...Array(20)].map((_, i) => ({
        id: i,
        x: Math.random() * 400 - 200,
        y: Math.random() * 300 - 150,
        yOffset: -100 + Math.random() * 200,
        xOffset: -50 + Math.random() * 100,
        delay: Math.random() * 1,
    }));
};



type SelectedPlayerPopupProps = {
    selectedPlayer: IPlayerSelectedPayload | null;
};


const CardPlayerSelectedPopup = ({ selectedPlayer }: SelectedPlayerPopupProps) => {
    console.log("🚀 ~ SelectedPlayerPopup ~ selectedPlayer:", selectedPlayer)
    // Pre-calculate particle properties to avoid Math.random in render
    const particles = useMemo(() => generateParticles(), []);



    if (!selectedPlayer) {
        return null;
    }

    const player = selectedPlayer.player;
    const avatarEmoji = AVATAR_EMOJI[player.avatar] || "🎮";

    return (
        <AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ transition:{duration: 0.5} , scale: 0.5 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <A_comratulation />
                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 text-center"
                >
                    {/* Animated background particles */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                        {particles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                className="absolute w-2 h-2 bg-white rounded-full opacity-60"
                                initial={{
                                    x: particle.x,
                                    y: particle.y,
                                    scale: 0,
                                }}
                                animate={{
                                    scale: [0, 1, 0],
                                    y: [particle.y, particle.y + particle.yOffset],
                                    x: [particle.x, particle.x + particle.xOffset],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: particle.delay,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                }}
                            />
                        ))}
                    </div>

                    {/* Pulsing rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="w-32 h-32 border-4 border-white rounded-full opacity-30"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                times: [0, 0.7, 1], // điều chỉnh thời điểm mỗi keyframe
                            }}
                        />
                        <motion.div
                            className="absolute w-32 h-32 border-2 border-white rounded-full opacity-20"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0, 0]
                            }}
                            transition={{
                                duration: 2,
                                delay:0.1,
                                repeat: Infinity,
                                times: [0, 0.3, 1], // điều chỉnh thời điểm mỗi keyframe
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold text-white mb-6"
                        >
                            Lượt của {player.name || "bạn"}!
                        </motion.h1>

                        {/* Player Avatar and Name Container */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
                            className="flex flex-col items-center mb-6"
                        >
                            {/* Avatar */}
                            <div className="w-32 h-32 flex items-center justify-center text-8xl bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                                {avatarEmoji}
                            </div>


                            {/* Name */}
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-3xl font-bold text-white bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent"
                            >
                                {player.name || "Người chơi"}
                            </motion.h2>
                        </motion.div>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-xl text-yellow-300 font-medium text-center"
                        >
                            Đến lượt bạn trả lời câu hỏi!
                        </motion.p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CardPlayerSelectedPopup;

