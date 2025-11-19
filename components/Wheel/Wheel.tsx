"use client";

import { motion, useAnimation } from "framer-motion";
import { useRef, useState } from "react";
import { ConfettiDemo } from "./Confetti";

export default function SpinWheel({ players }: { players: string[] }) {
  const controls = useAnimation();
  const slice = 360 / players.length;
  const confettiRef = useRef<any>(null);

  const [winner, setWinner] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
    "#e67e22",
  ];

  const startSpin = () => {
    if (spinning) return;

    setSpinning(true);

    // chọn kết quả (định trước hoặc random)
    const index = Math.floor(Math.random() * players.length);

    setWinner(index);

    const stopAngle = 360 - index * slice - slice / 2;
    const totalSpin = 1440 + stopAngle; // 4 vòng + điểm dừng

    controls.start({
      rotate: totalSpin,
      transition: { duration: 5, ease: [0.17, 0.67, 0.24, 1.02] },
    });

    // Confetti + hiệu ứng zoom
    // setTimeout(() => {
    //   confetti();
    // }, 5100);

    setTimeout(() => {
      setSpinning(false);
      setConfetti(true);
    }, 5200);
  };

  return (
    <div className="flex flex-col items-center mt-10">

      {/* luôn mount nhưng không bắn */}
      <div className="relative w-[400px] h-[400px]">
        {/* Wheel */}
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-[8px] border-gray-300 overflow-hidden relative"
        >
          {players.map((name, i) => {
            const rotate = slice * i;

            return (
              <div
                key={i}
                className="absolute w-1/2 h-1/2 origin-bottom-left"
                style={{
                  transform: `rotate(${rotate}deg)`,
                  background: colors[i % colors.length],
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              >
                <div
                  className="absolute top-[35%] left-[60%] font-semibold text-white text-[20px]"
                  style={{
                    transform: `rotate(${slice / 2}deg) translate(-50%, -50%)`,
                  }}
                >
                  {name}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Pointer */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-0 h-0 
                border-t-[15px] border-b-[15px] border-l-[20px] border-transparent 
                border-l-red-500"></div>
      </div>

      {/* Button */}
      <button
        className="mt-5 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
        onClick={startSpin}
        disabled={spinning}
      >
        {spinning ? "Spinning..." : "Spin"}
      </button>


{confetti && <ConfettiDemo />}
      {winner !== null && (
        <div className="text-2xl mt-4 font-bold animate-pulse">
          Winner: {players[winner]}
        </div>
      )}
    </div>
  );
}
