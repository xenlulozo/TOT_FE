"use client";

import { motion } from "framer-motion";

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

    // Nếu lá bài không được reveal, ẩn đi
    if (!isRevealed) {
        return null;
    }

    // Hiển thị thẻ với hiệu ứng lật
    // isFlipped = false: thẻ úp (rotateY = 180)
    // isFlipped = true: thẻ lật lên (rotateY = 0)
    return (
        <motion.div
            className="relative w-full h-[400px]"
            style={{ perspective: "1000px" }}
            initial={{ rotateY: 180 }}
            animate={{ rotateY: isFlipped ? 0 : 180 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
        >
            {/* Mặt úp của thẻ */}
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-900 shadow-2xl border-4 border-neutral-600 flex items-center justify-center"
                style={{
                    backfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                }}
            >
                <div className="text-white text-6xl font-bold opacity-50">?</div>
            </motion.div>

            {/* Mặt ngửa của thẻ */}
            <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardColor} shadow-2xl border-4 border-white/20 flex flex-col p-6`}
                style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Badge */}
                <div className={`${badgeColor} rounded-full px-4 py-2 w-fit mb-4`}>
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                        <span>#</span>
                        <span>{badgeText}</span>
                    </span>
                </div>

                {/* Nội dung thẻ */}
                <div className="flex-1 bg-white rounded-xl p-6 flex items-center justify-center">
                    <p className="text-neutral-800 text-xl font-medium text-center leading-relaxed">
                        {content}
                    </p>
                </div>

                {/* Icons ở dưới */}
                <div className="flex items-center justify-between mt-4">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🏳️</span>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">💬</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Card;

