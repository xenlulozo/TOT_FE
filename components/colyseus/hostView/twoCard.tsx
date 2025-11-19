import { Highlighter } from "@/components/ui/highlighter";
import { SparklesText } from "@/components/ui/sparkles-text";
import { AnimatePresence, motion } from "motion/react"
import { IPlayerSelectedPayload } from "../interface/game.interface";


export const TowCard = () => {
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
                        exit={{ opacity: 0, scale: 0.8 }}
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
                        className={`relative 'cursor-default'}`}

                        suppressHydrationWarning={true}
                    >

                        <motion.div
                            className={`absolute inset-0 rounded-3xl opacity-0  transition-opacity duration-300`}
                            style={{
                                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Floating Particles */}
                        <motion.div className="absolute -top-4 -right-4 w-3 h-3 bg-blue-400 rounded-full opacity-60" />
                        <motion.div className="absolute -bottom-4 -left-4 w-2 h-2 bg-cyan-400 rounded-full opacity-40" />

                        <motion.div
                            className="w-64 sm:w-72 h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl relative"

                            animate={{

                                y: [0, -8, -6, -10, -4, -8, 0],
                                boxShadow: [
                                    "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
                                    "0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)",
                                    "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)"
                                ],
                            }}
                            transition={{
                                duration: 0.6,
                                y: {
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                rotateX: {
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                boxShadow: {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            style={{
                                transformStyle: "preserve-3d",
                                willChange: "transform"
                            }}
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
                                            // scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                            textShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        className=" font-black mb-3 text-white drop-shadow-lg"
                                    >
                                        <SparklesText> TRUTH</SparklesText>
                                    </motion.h3>

                                    <motion.p
                                        // initial={{ opacity: 0, y: 10 }}
                                        // animate={{ opacity: 1, y: 0 }}
                                        // transition={{ delay: 1.3, duration: 0.4, ease: "easeOut" }}
                                        className="text-blue-100 text-lg font-medium"
                                    >
                                        <Highlighter action="circle" color="#e02f2f" strokeWidth={2} animationDuration={1000} iterations={1} padding={3} multiline={true} isView={true} >
                                            Câu hỏi thật thà
                                        </Highlighter>
                                    </motion.p>

                                    {/* <motion.div
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
         className="mt-6 text-2xl"
       >
         🤔💭
       </motion.div> */}
                                </motion.div>
                            </motion.div>


                        </motion.div>
                    </motion.div>

                    {/* Trick Card */}
                    <motion.div
                        exit={{ opacity: 0, scale: 0.8 }}

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

                        suppressHydrationWarning={true}
                    >
                        {/* Glow Effect */}
                        <motion.div
                            className={`absolute inset-0 rounded-3xl opacity-0  ''} transition-opacity duration-300`}
                            style={{
                                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                            }}

                        />

                        {/* Floating Particles */}
                        <motion.div className="absolute -top-4 -left-4 w-3 h-3 bg-red-400 rounded-full opacity-60" />
                        <motion.div className="absolute -bottom-4 -right-4 w-2 h-2 bg-pink-400 rounded-full opacity-40" />

                        {/* card */}
                        <motion.div
                            className="w-64 sm:w-72 h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl relative"
                            animate={{

                                y: [0, -10, -8, -12, -6, -10, 0],
                                boxShadow: [
                                    "0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)",
                                    "0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.2)",
                                    "0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)"
                                ]
                            }}
                            transition={{
                                duration: 0.6,
                                y: {
                                    duration: 6.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                rotateX: {
                                    duration: 6.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                },
                                boxShadow: {
                                    duration: 3.2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            style={{
                                transformStyle: "preserve-3d",
                                willChange: "transform"
                            }}

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
                                            // delay: 1.3,
                                            // duration: 0.4,
                                            // ease: "easeOut",
                                            // scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                                            textShadow: { duration: 1.7, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        className="text-4xl font-black mb-3 text-white drop-shadow-lg"
                                    >
                                        <SparklesText> TRICK</SparklesText>
                                    </motion.h3>

                                    <motion.p
                                        // initial={{ opacity: 0, y: 10 }}
                                        // animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.5, duration: 0.4, ease: "easeOut" }}
                                        className="text-red-100 text-lg font-medium"
                                    >
                                        <Highlighter action="circle" color="#87CEFA" strokeWidth={2} animationDuration={1000} iterations={1} padding={2} multiline={true} isView={true} >
                                            Câu hỏi thử thách
                                        </Highlighter>
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

export default TowCard;
