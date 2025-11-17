"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export type CountdownPopupProps = {
    show: boolean;
    onComplete?: () => void;
    duration?: number; // Total duration in seconds (default: 3)
    startNumber?: number; // Starting countdown number (default: 3)
};

const CountdownPopup = ({
    show,
    onComplete,
    duration = 3,
    startNumber = 3
}: CountdownPopupProps) => {
    const [countdown, setCountdown] = useState(startNumber);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(true);
            setCountdown(startNumber);

            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Wait a bit before hiding
                        setTimeout(() => {
                            setIsVisible(false);
                            onComplete?.();
                        }, 500);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setIsVisible(false);
            setCountdown(startNumber);
        }
    }, [show, startNumber, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && countdown > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 0.3,
                                repeat: Infinity,
                                repeatType: "reverse",
                            }}
                            className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                        >
                            {countdown}
                        </motion.div>
                        {countdown === 1 && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl md:text-4xl font-bold text-white mt-4"
                            >
                                Bắt đầu!
                            </motion.p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CountdownPopup;

