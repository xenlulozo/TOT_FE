"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { IPlayerInfo } from "@/types/socket";

const AVATAR_EMOJI: Record<string, string> = {
    fox: "🦊",
    bear: "🐻",
    tiger: "🐯",
    panda: "🐼",
    koala: "🐨",
    monkey: "🐵",
    unicorn: "🦄",
    cat: "🐱",
    dog: "🐶",
    rabbit: "🐰",
    pig: "🐷",
    chicken: "🐔",
    lion: "🦁",
    cow: "🐮",
    sheep: "🐑",
    elephant: "🐘",
    heart: "❤️",
    star: "⭐️",
    tree: "🌳",
    mushroom: "🍄",
    tulip: "🌷",
    cactus: "🌵",
    wrench: "🔧",
    hammer: "🔨",
    key: "🔑",
    lightbulb: "💡",
    umbrella: "☂️",
    book: "📚",
    camera: "📷",
    guitar: "🎸",
    donut: "🍩",
    pizza: "🍕",
    cheese: "🧀",
    watermelon: "🍉",
    lemon: "🍋"
};

const SEGMENT_COLORS = [
    { start: "#a855f7", end: "#9333ea" }, // purple
    { start: "#ec4899", end: "#db2777" }, // pink
    { start: "#eab308", end: "#f97316" }, // yellow to orange
    { start: "#3b82f6", end: "#2563eb" }, // blue
    { start: "#22c55e", end: "#16a34a" }, // green
    { start: "#ef4444", end: "#dc2626" }, // red
    { start: "#6366f1", end: "#4f46e5" }, // indigo
    { start: "#14b8a6", end: "#0d9488" }, // teal
    { start: "#f59e0b", end: "#d97706" }, // amber
    { start: "#f43f5e", end: "#e11d48" }, // rose
];

type SpinningWheelProps = {
    players: IPlayerInfo[];
    selectedPlayerId?: string | null;
    onSpinComplete?: () => void;
};

const SpinningWheel = ({ players, selectedPlayerId, onSpinComplete }: SpinningWheelProps) => {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);

    useEffect(() => {
        if (!selectedPlayerId || players.length === 0) {
            setRotation(0);
            setIsSpinning(false);
            return;
        }

        // Tìm index của người chơi được chọn
        const selectedIndex = players.findIndex((p) => p.id === selectedPlayerId);
        if (selectedIndex === -1) {
            return;
        }

        const segmentAngle = 360 / players.length;
        
        // Tính góc giữa của segment được chọn
        // Segment được vẽ từ góc -90 độ (phía trên)
        const selectedSegmentMidAngle = selectedIndex * segmentAngle + segmentAngle / 2;
        
        // Mũi tên chỉ lên trên (góc -90 độ trong SVG = 270 độ trong hệ quay)
        // Để đưa segment lên vị trí mũi tên, cần xoay: 270 - selectedSegmentMidAngle
        const baseRotation = 270 - selectedSegmentMidAngle;
        
        // Thêm nhiều vòng quay để tạo hiệu ứng quay nhanh rồi chậm dần (5-6 vòng)
        const extraRotations = 5 * 360; // 5 vòng quay thêm
        const targetRotation = baseRotation + extraRotations;

        // Bắt đầu quay
        setIsSpinning(true);
        setRotation(targetRotation);

        // Sau khi animation hoàn thành (7 giây), dừng quay và gọi callback
        const timer = setTimeout(() => {
            setIsSpinning(false);
            onSpinComplete?.();
        }, 7000);

        return () => clearTimeout(timer);
    }, [selectedPlayerId, players, onSpinComplete]);

    if (players.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[400px]">
                <p className="text-neutral-500 text-lg">Chưa có người chơi</p>
            </div>
        );
    }

    const segmentAngle = 360 / players.length;
    const radius = 200;
    const centerX = 250;
    const centerY = 250;

    return (
        <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
            <div className="relative w-full max-w-[500px] aspect-square">
                {/* Bánh xe */}
                <motion.svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 500 500"
                    className="absolute inset-0"
                    animate={{ rotate: rotation }}
                    transition={{ 
                        duration: isSpinning ? 7 : 0, 
                        ease: [0.17, 0.67, 0.83, 0.67], // Custom easing: nhanh rồi chậm dần (ease-out)
                    }}
                    style={{ transformOrigin: "center" }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {SEGMENT_COLORS.map((color, idx) => (
                            <linearGradient key={idx} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={color.start} />
                                <stop offset="100%" stopColor={color.end} />
                            </linearGradient>
                        ))}
                    </defs>
                    
                    {/* Vẽ các segment */}
                    {players.map((player, index) => {
                        const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                        const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                        
                        const x1 = centerX + radius * Math.cos(startAngle);
                        const y1 = centerY + radius * Math.sin(startAngle);
                        const x2 = centerX + radius * Math.cos(endAngle);
                        const y2 = centerY + radius * Math.sin(endAngle);
                        
                        const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                        
                        const pathData = [
                            `M ${centerX} ${centerY}`,
                            `L ${x1} ${y1}`,
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            'Z'
                        ].join(' ');

                        const midAngle = (startAngle + endAngle) / 2;
                        const textRadius = radius * 0.7;
                        const textX = centerX + textRadius * Math.cos(midAngle);
                        const textY = centerY + textRadius * Math.sin(midAngle);

                        const avatarEmoji = AVATAR_EMOJI[player.avatar] || "🎮";
                        const colorIndex = index % SEGMENT_COLORS.length;

                        return (
                            <g key={player.id}>
                                <path
                                    d={pathData}
                                    fill={`url(#gradient-${colorIndex})`}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                    className="transition-opacity"
                                />
                                <text
                                    x={textX}
                                    y={textY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="32"
                                    fontWeight="bold"
                                    fill="#ffffff"
                                    className="pointer-events-none select-none"
                                >
                                    {avatarEmoji}
                                </text>
                                <text
                                    x={textX}
                                    y={textY + 35}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="14"
                                    fontWeight="600"
                                    fill="#ffffff"
                                    className="pointer-events-none select-none"
                                >
                                    {player.name || "Player"}
                                </text>
                            </g>
                        );
                    })}
                </motion.svg>

                {/* Mũi tên chỉ vào segment */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                        <path
                            d="M 20 0 L 0 40 L 40 40 Z"
                            fill="#fbbf24"
                            stroke="#f59e0b"
                            strokeWidth="2"
                        />
                    </svg>
                </div>

                {/* Vòng tròn trung tâm */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-white shadow-xl flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpinningWheel;

