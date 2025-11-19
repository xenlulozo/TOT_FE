import { AnimatePresence, motion } from "motion/react"
import { PromptType } from "../ClientPromptPopup";
import { TextAnimate } from "@/components/ui/text-animate";


export type PromptSelectionProps = {
    selectedPrompt: PromptType | null; // Which prompt was selected (from server events)
    promptContent?: string | null; // Content of the selected prompt (from server events)
};
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
export const CardSelectedPopup = ({ selectedPrompt, promptContent }: PromptSelectionProps) => {

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
                                        <TextAnimate animation="blurInUp" by="character" duration={4}>
                                            {promptContent || "Đang tải câu hỏi..."}

                                        </TextAnimate>

                                    </motion.p>
                                </motion.div>


                            </motion.div>

                        </motion.div>


                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>


    )
}