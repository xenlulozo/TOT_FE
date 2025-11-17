"use client";

import { motion } from "motion/react";

type CardProps = {
    type: "truth" | "trick";
    content: string;
    isFlipped: boolean;
    isRevealed: boolean;
};

const Card = ({ type, content, isFlipped, isRevealed }: CardProps) => {
    const isTruth = type === "truth";
    const cardColor = isTruth
        ? "from-purple-500 to-blue-500"
        : "from-red-500 to-red-600";
    const badgeColor = isTruth ? "bg-purple-400/30" : "bg-red-400/30";
    const badgeText = isTruth ? "THẬT" : "THÁCH";

    if (!isRevealed) {
        return null;
    }

    const backLabel = isTruth ? "TRUTH" : "TRICK";

    return (
        <motion.div
            className="relative w-full h-[400px]"
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ rotateY: isFlipped ? 0 : 180 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
        >
            {/* Mặt úp của thẻ */}
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black shadow-2xl border-4 border-neutral-700 flex flex-col items-center justify-center gap-3 select-none"
                style={{
                    backfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                    transform: "rotateY(180deg)",
                }}
            >
                <span className="text-white/80 text-xl tracking-[0.3em] uppercase font-semibold">
                    LÁ BÀI
                </span>
                <span className="text-white text-4xl md:text-5xl font-black">{backLabel}</span>
            </motion.div>

            {/* Mặt ngửa của thẻ */}
            <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardColor} shadow-2xl border-4 border-white/20 flex flex-col p-6`}
                style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(0deg)",
                    transformStyle: "preserve-3d",
                }}
            >
                <div className={`${badgeColor} rounded-full px-4 py-2 w-fit mb-4`}>
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                        <span>#</span>
                        <span>{badgeText}</span>
                    </span>
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 flex items-center justify-center">
                    <p className="text-neutral-800 text-xl font-medium text-center leading-relaxed">
                        {content}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-4 text-white/80 text-xs uppercase tracking-[0.3em]">
                    <span>🔥 GAME</span>
                    <span>FUN 🎉</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Card;

