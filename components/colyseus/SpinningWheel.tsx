"use client";

import { Easing, motion } from "motion/react";
import { useEffect, useState } from "react";
import { IPlayerInfo, RoundState } from "@/types/socket";
import { config } from "@/lib/socket.enum";


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
    spinTime?: number; // Override default spin time
    is_preview?: boolean; // Override default spin time
};

// Sample players for demonstration when no real players exist
const SAMPLE_PLAYERS: IPlayerInfo[] = [
    { id: "sample-1", name: "Player 1", avatar: "fox", roundState: RoundState.NOT_STARTED, isHost: false },
    { id: "sample-2", name: "Player 2", avatar: "bear", roundState: RoundState.NOT_STARTED, isHost: false },
    { id: "sample-3", name: "Player 3", avatar: "tiger", roundState: RoundState.NOT_STARTED, isHost: false },
    { id: "sample-4", name: "Player 4", avatar: "panda", roundState: RoundState.NOT_STARTED, isHost: false },
    { id: "sample-5", name: "Player 5", avatar: "unicorn", roundState: RoundState.NOT_STARTED, isHost: false },
    { id: "sample-6", name: "Player 6", avatar: "cat", roundState: RoundState.NOT_STARTED, isHost: false },
];


export const SpinningWheel = ({ players, selectedPlayerId, onSpinComplete, spinTime = config.SPIN_TIME , is_preview = false}: SpinningWheelProps) => {
    console.log("🚀 ~ SpinningWheel ~ players:", players,selectedPlayerId)
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(true);

    // Use sample players if no real players, otherwise combine sample + real players
    const displayPlayers = players.length === 0 ? SAMPLE_PLAYERS : players;
    const isUsingSamplePlayers = players.length === 0;

    // Handle spinning logic
    useEffect(() => {
        if (!is_preview) return;

        console.log("🚀 ~ SpinningWheel ~ isSpinning:", isSpinning)
        
        // If using sample players, keep spinning continuously
        // if (isUsingSamplePlayers) {
        //     setIsSpinning(true);
        //     const spinInterval = setInterval(() => {
        //         setRotation(current => current + 1); // Slow continuous rotation
        //     }, 50);
        //     return () => clearInterval(spinInterval);
        // }

        // Reset wheel when no player is selected
        if (!selectedPlayerId) {
            // Reset rotation and spinning state - this is intentional for cleanup
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setRotation(0);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setIsSpinning(false);
            return;
        }

        // Tìm index của người chơi được chọn
        const selectedIndex = displayPlayers.findIndex((p) => p.id === selectedPlayerId);
        if (selectedIndex === -1) {
            return;
        }

        const segmentAngle = 360 / displayPlayers.length;

        // Tính góc giữa của segment được chọn
        // Segment được vẽ từ góc -90 độ (phía trên)
        const startDeg = selectedIndex * segmentAngle - 90;
        const endDeg = (selectedIndex + 1) * segmentAngle - 90;
        // Mũi tên chỉ lên trên (góc -90 độ trong SVG = 270 độ trong hệ quay)
        // Để đưa segment lên vị trí mũi tên, cần xoay: 270 - selectedSegmentMidAngle
        const middleDeg = (startDeg + endDeg) / 2;
        const baseRotation = 270 - middleDeg;

        // Thêm nhiều vòng quay để tạo hiệu ứng quay nhanh rồi chậm dần (5-6 vòng)
        const extraRotations = 360 * (5 + Math.random() * 1.5);
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
    }, [selectedPlayerId, displayPlayers, onSpinComplete, isUsingSamplePlayers, spinTime]);

    const segmentAngle = 360 / displayPlayers.length;
    const radius = 200;
    const centerX = 250;
    const centerY = 250;
    const innerRadius = 60; // Inner radius for text positioning

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
                        duration: isSpinning ? spinTime / 1000 : 0,
                        ease: "easeInOut" as Easing, // Custom easing để quay chậm dần tự nhiên
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
                    {displayPlayers.map((player, index) => {
                        const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                        const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

                        const x1 = centerX + radius * Math.cos(startAngle);
                        const y1 = centerY + radius * Math.sin(startAngle);
                        const x2 = centerX + radius * Math.cos(endAngle);
                        const y2 = centerY + radius * Math.sin(endAngle);

                        let pathData: string;

                        if (displayPlayers.length === 1) {
                            // For single player, draw a full circle
                            pathData = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius} A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius} Z`;
                        } else {
                            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                            pathData = [
                                `M ${centerX} ${centerY}`,
                                `L ${x1} ${y1}`,
                                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                'Z'
                            ].join(' ');
                        }

                        let midAngle: number;
                        let textRadius: number;

                        if (displayPlayers.length === 1) {
                            // For single player, place text at top (towards the arrow)
                            midAngle = -Math.PI / 2; // -90 degrees (top)
                            textRadius = (radius + innerRadius) / 2;
                        } else {
                            midAngle = (startAngle + endAngle) / 2;
                            textRadius = (radius + innerRadius) / 2;
                        }

                        const textX = centerX + textRadius * Math.cos(midAngle);
                        const textY = centerY + textRadius * Math.sin(midAngle);

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
                                {/* Player name - centered in segment */}
                                <text
                                    x={textX}
                                    y={textY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize="2vh"
                                    fontWeight="700"
                                    fill="#ffffff"
                                    className="pointer-events-none select-none drop-shadow-lg"
                                    transform={displayPlayers.length === 1 ? undefined : `rotate(${(midAngle * 180) / Math.PI}, ${textX}, ${textY})`}
                                >
                                    {player.name
                                        ? player.name.length > 10
                                            ? player.name.slice(0, 10) + "..."
                                            : player.name
                                        : "Player"}
                                </text>
                            </g>
                        );
                    })}
                </motion.svg>

                {/* Mũi tên chỉ vào bánh xe từ phía trên */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 translate-y-2 z-30">
                    <svg width="50" height="35" viewBox="0 0 30 25" className="rotate-180"
                    >
                        <path
                            d="M 15 0 L 0 25 L 30 25 Z"
                            fill="#ef4444"
                            stroke="#dc2626"
                            strokeWidth="1"
                            className="drop-shadow-lg"
                        />
                    </svg>
                </div>

                {/* Vòng tròn trung tâm với shadow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-white shadow-2xl flex items-center justify-center">
                        <span className="text-3xl">🎯</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpinningWheel;

