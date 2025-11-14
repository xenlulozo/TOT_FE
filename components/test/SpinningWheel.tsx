"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PlayerInfo } from "@/types/socket";

const AVATAR_EMOJI: Record<string, string> = {
    fox: "🦊",
    bear: "🐻",
    tiger: "🐯",
    panda: "🐼",
    koala: "🐨",
    monkey: "🐵",
    unicorn: "🦄",
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
    players: PlayerInfo[];
    selectedPlayerId?: string | null;
};

const SpinningWheel = ({ players, selectedPlayerId }: SpinningWheelProps) => {
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
        
        // Tính góc giữa của segment được chọn (từ vị trí ban đầu, segment 0 bắt đầu từ phía trên)
        // Segment được vẽ từ góc -90 độ (phía trên), nên góc giữa của segment index i là:
        // -90 + (i * segmentAngle + segmentAngle/2) trong hệ tọa độ SVG
        // Nhưng khi xoay, ta tính từ vị trí ban đầu (0 độ)
        const selectedSegmentMidAngle = selectedIndex * segmentAngle + segmentAngle / 2;
        
        // Mũi tên chỉ lên trên (góc -90 độ trong SVG = 270 độ trong hệ quay)
        // Để đưa segment lên vị trí mũi tên, cần xoay: 270 - selectedSegmentMidAngle
        // Hoặc đơn giản hơn: 360 - selectedSegmentMidAngle - 90 = 270 - selectedSegmentMidAngle
        // Thêm nhiều vòng quay để tạo hiệu ứng quay (4-5 vòng)
        const baseRotation = 270 - selectedSegmentMidAngle;
        const extraRotations = 4 * 360; // 4 vòng quay thêm để tạo hiệu ứng
        const targetRotation = baseRotation + extraRotations;

        // Bắt đầu quay
        setIsSpinning(true);
        setRotation(targetRotation);

        // Sau 7 giây, dừng quay
        const timer = setTimeout(() => {
            setIsSpinning(false);
        }, 7000);

        return () => clearTimeout(timer);
    }, [selectedPlayerId, players]);

    if (players.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-neutral-500">Chưa có người chơi</p>
            </div>
        );
    }

    const segmentAngle = 360 / players.length;
    const radius = 200;
    const centerX = 250;
    const centerY = 250;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
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
                        ease: [0.25, 0.1, 0.25, 1], // Custom easing để quay chậm dần tự nhiên
                    }}
                    style={{ transformOrigin: "center" }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Drop shadow filter */}
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                            <feOffset dx="0" dy="4" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        
                        {/* Gradients cho các segment */}
                        {players.map((_, index) => {
                            const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
                            return (
                                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={color.start} />
                                    <stop offset="100%" stopColor={color.end} />
                                </linearGradient>
                            );
                        })}
                    </defs>

                    {/* Vòng ngoài với các marker - có shadow */}
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill="none"
                        stroke="#8B4513"
                        strokeWidth="10"
                        filter="url(#shadow)"
                    />
                    {/* Vòng trong trang trí */}
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius - 5}
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1"
                    />

                    {/* Các segment */}
                    {players.map((player, index) => {
                        const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                        const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

                        const x1 = centerX + radius * Math.cos(startAngle);
                        const y1 = centerY + radius * Math.sin(startAngle);
                        const x2 = centerX + radius * Math.cos(endAngle);
                        const y2 = centerY + radius * Math.sin(endAngle);

                        const midAngle = (startAngle + endAngle) / 2;
                        const midAngleDeg = (midAngle * 180) / Math.PI;
                        
                        // Tên ở xa tâm hơn để không bị đè bởi hình tròn trung tâm
                        const textRadius = radius * 0.65;
                        const textX = centerX + textRadius * Math.cos(midAngle);
                        const textY = centerY + textRadius * Math.sin(midAngle);
                        
                        // Góc xoay để text hướng từ tâm ra ngoài (song song với bán kính)
                        const textRotation = midAngleDeg;

                        const playerName = (player.data?.name as string) ?? "Player";

                        return (
                            <g key={player.id}>
                                {/* Segment path với shadow */}
                                <path
                                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                                    fill={`url(#gradient-${index})`}
                                    stroke="#8B4513"
                                    strokeWidth="3"
                                    filter="url(#shadow)"
                                />

                                {/* Tên người chơi - hướng từ tâm ra ngoài */}
                                <text
                                    x={textX}
                                    y={textY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize="18"
                                    fontWeight="bold"
                                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                                    className="select-none"
                                    style={{ 
                                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                                        letterSpacing: "0.5px"
                                    }}
                                >
                                    {playerName.length > 14 ? playerName.substring(0, 14) + "..." : playerName}
                                </text>
                            </g>
                        );
                    })}

                    {/* Các marker vàng ở viền - đẹp hơn */}
                    {players.map((_, index) => {
                        const angle = (index * segmentAngle - 90) * (Math.PI / 180);
                        const markerX = centerX + radius * Math.cos(angle);
                        const markerY = centerY + radius * Math.sin(angle);
                        return (
                            <g key={index}>
                                <circle
                                    cx={markerX}
                                    cy={markerY}
                                    r="10"
                                    fill="#FFD700"
                                    stroke="#8B4513"
                                    strokeWidth="3"
                                    filter="url(#shadow)"
                                />
                                <circle
                                    cx={markerX}
                                    cy={markerY}
                                    r="6"
                                    fill="#FFA500"
                                />
                            </g>
                        );
                    })}
                </motion.svg>

                {/* Pointer ở giữa - thiết kế mới đẹp và hợp hơn */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative">
                        {/* Mũi tên chỉ lên trên - thiết kế sắc nét và hiện đại */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                            <svg width="50" height="50" viewBox="0 0 50 50" className="drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#dc2626" />
                                        <stop offset="100%" stopColor="#b91c1c" />
                                    </linearGradient>
                                    <filter id="arrowShadow">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                                        <feOffset dx="0" dy="2" result="offsetblur" />
                                        <feComponentTransfer>
                                            <feFuncA type="linear" slope="0.5" />
                                        </feComponentTransfer>
                                        <feMerge>
                                            <feMergeNode />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                {/* Mũi tên tam giác đơn giản và sắc nét */}
                                <polygon
                                    points="25,5 40,35 30,35 30,45 20,45 20,35 10,35"
                                    fill="url(#arrowGradient)"
                                    stroke="#991b1b"
                                    strokeWidth="2"
                                    filter="url(#arrowShadow)"
                                />
                                {/* Đường viền sáng ở trên */}
                                <line
                                    x1="25"
                                    y1="5"
                                    x2="35"
                                    y2="30"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                        
                        {/* Vòng tròn trung tâm - thiết kế tối giản và đẹp */}
                        <div className="w-16 h-16 rounded-full bg-white border-4 border-red-500 shadow-2xl flex items-center justify-center relative">
                            {/* Hiệu ứng glow đỏ */}
                            <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 blur-lg animate-pulse"></div>
                            
                            {/* Icon trung tâm - ngôi sao hoặc dấu chấm */}
                            <div className="relative z-10">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="6"
                                        fill="#ef4444"
                                        stroke="#dc2626"
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="3"
                                        fill="#ffffff"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpinningWheel;

