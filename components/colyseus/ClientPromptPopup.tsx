"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { IPlayerSelectedPayload } from "./interface/game.interface";

export type PromptType = "truth" | "trick";

export type ClientPromptPopupProps = {
  selectedPlayer: IPlayerSelectedPayload | null;
  promptContent?: string | null;
  onPromptSelected: (promptType: PromptType) => void;
  onEndTurn: () => void;
  onClose?: () => void; // Callback to close the popup
  currentPlayerId?: string; // ID của player hiện tại để check xem có phải người được chọn không
};

export const ClientPromptPopup = ({ selectedPlayer, promptContent, onPromptSelected, onEndTurn, onClose, currentPlayerId }: ClientPromptPopupProps) => {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState<string>("");

  // Reset state when selectedPlayer changes
  useEffect(() => {
    if (selectedPlayer) {
      setSelectedPrompt(null);
      setShowQuestion(false);
      setQuestion("");
    }
  }, [selectedPlayer]);

  const handlePromptClick = (promptType: PromptType) => {
    if (selectedPrompt) return; // Prevent multiple selections

    console.log("🎯 ClientPromptPopup: User selected", promptType, "selectedPlayer:", selectedPlayer);
    setSelectedPrompt(promptType);
    console.log("📤 ClientPromptPopup: Calling onPromptSelected with", promptType);

    // Send the prompt selection event
    onPromptSelected(promptType);

    // Wait for server response with actual content
    // Don't show question immediately - wait for TRUTH_PROMPT_SELECTED or TRICK_PROMPT_SELECTED event
  };

  // Show question when promptContent is received from server
  useEffect(() => {
    if (selectedPrompt && promptContent) {
      console.log("📝 ClientPromptPopup: Received prompt content from server:", promptContent);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuestion(promptContent);
      setShowQuestion(true);
    }
  }, [selectedPrompt, promptContent]);

  // Fallback timeout - if no content received after 5 seconds, show sample question

  // Allow popup to show even if selectedPlayer is null initially
  // It will update when PLAYER_SELECTED event arrives
  const player = selectedPlayer?.player;

  // Chỉ show popup cho player được server chọn
  const isCurrentPlayerSelected = currentPlayerId && selectedPlayer?.player?.id === currentPlayerId;

  // Nếu chưa có player được chọn hoặc player hiện tại không phải người được chọn, không render gì
  if (!isCurrentPlayerSelected) {
    if (currentPlayerId != "PASS")
      return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        suppressHydrationWarning={true}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="relative w-full max-w-2xl mx-4"
          suppressHydrationWarning={true}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              🎯 {player?.name || "Bạn"}, đến lượt bạn!
            </h2>
            {!showQuestion ? (
              <p className="text-white/80 text-lg">
                Chọn loại câu hỏi bạn muốn trả lời
              </p>
            ) : (
              <p className="text-white/80 text-lg">
                Câu hỏi của bạn:
              </p>
            )}
          </motion.div>

          {!showQuestion ? (
            /* Selection Phase - Mobile Optimized Animation */
            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-8 px-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.1, // Smoother stagger rhythm
                    delayChildren: 0.25
                  }
                }
              }}
            >
              {/* Loading state when selectedPlayer is not available yet */}
              {/* {!selectedPlayer && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">Đang tải dữ liệu người chơi...</p>
                  </div>
                </div>
              )} */}

              {/* Truth Button - Smooth bounce from bottom with rotation */}
              <motion.button
                variants={{
                  hidden: {
                    y: 100,
                    opacity: 0,
                    scale: 0.4,
                    rotate: -90
                  },
                  visible: {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0
                  }
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 30,
                  mass: 0.7,
                  bounce: 0.3,
                  duration: 0.7
                }}
                // animate={{
                //   y: [0, -2, 0],
                //   rotate: [0, 0.5, -0.5, 0],
                //   scale: [1, 1.02, 1],
                //   filter: ["blur(0px)", "blur(0.5px)", "blur(0px)"]
                // }}
                whileHover={{
                  scale: 1.03,
                  rotate: 1,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
                style={{
                  transition: "y 3s ease-in-out 0.5s infinite, rotate 4s ease-in-out 0.5s infinite, scale 2.5s ease-in-out 0.5s infinite, filter 3.5s ease-in-out 0.5s infinite"
                }}
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex flex-col items-center justify-center text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                onClick={() => handlePromptClick("truth")}
                // disabled={!!selectedPrompt || !selectedPlayer}
                suppressHydrationWarning={true}
              >
                <motion.div
                  className="text-4xl sm:text-5xl mb-2"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.5,
                    type: "spring",
                    stiffness: 250,
                    damping: 25,
                    bounce: 0.4
                  }}
                >
                  ❓
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.25, ease: "easeOut" }}
                >
                  <h3 className="text-lg sm:text-xl font-bold">TRUTH</h3>
                  <p className="text-xs sm:text-sm text-blue-100 mt-1">Câu hỏi thật thà</p>
                </motion.div>
              </motion.button>

              {/* Trick Button - Smooth bounce from bottom with opposite rotation */}
              <motion.button
                variants={{
                  hidden: {
                    y: 100,
                    opacity: 0,
                    scale: 0.4,
                    rotate: 90
                  },
                  visible: {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotate: 0
                  }
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 30,
                  mass: 0.7,
                  bounce: 0.3,
                  duration: 0.7
                }}
                animate={{
                  y: [0, -3, 0],
                  rotate: [0, -0.7, 0.7, 0],
                  scale: [1, 1.025, 1],
                  filter: ["blur(0px)", "blur(0.7px)", "blur(0px)"]
                }}
                style={{
                  transition: "y 3.2s ease-in-out 0.7s infinite, rotate 4.3s ease-in-out 0.7s infinite, scale 2.8s ease-in-out 0.7s infinite, filter 3.8s ease-in-out 0.7s infinite"
                }}
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex flex-col items-center justify-center text-white shadow-2xl hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                onClick={() => handlePromptClick("trick")}
                // disabled={!!selectedPrompt || !selectedPlayer}
                suppressHydrationWarning={true}
              >
                <motion.div
                  className="text-4xl sm:text-5xl mb-2"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 250,
                    damping: 25,
                    bounce: 0.4
                  }}
                >
                  🎭
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65, duration: 0.25, ease: "easeOut" }}
                >
                  <h3 className="text-lg sm:text-xl font-bold">TRICK</h3>
                  <p className="text-xs sm:text-sm text-red-100 mt-1">Câu hỏi thử thách</p>
                </motion.div>
              </motion.button>
            </motion.div>
          ) : (
            /* Question Display Phase */

            <motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8"
                suppressHydrationWarning={true}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {selectedPrompt === "truth" ? "❓" : "🎭"}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {selectedPrompt === "truth" ? "TRUTH" : "TRICK"}
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    {question}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <button
                  onClick={() => {
                    onEndTurn(); // Send END_TURN event
                    onClose?.(); // Close popup locally
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  🎯 Kết thúc lượt
                </button>
              </motion.div>
            </motion.div>

          )}

          {/* Selected prompt indicator */}
          <AnimatePresence>
            {selectedPrompt && !showQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-6"
                suppressHydrationWarning={true}
              >
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {selectedPrompt === "truth" ? "❓" : "🎭"}
                    </span>
                    <span className="text-white font-semibold text-lg">
                      Đã chọn {selectedPrompt === "truth" ? "TRUTH" : "TRICK"}
                    </span>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  Đang tải câu hỏi từ server...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* End Turn Button - always show in selection phase */}
          {!showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="text-center"
            >
              <button
                onClick={() => {
                  onEndTurn(); // Send END_TURN event
                  onClose?.(); // Close popup locally
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-full text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                🚪 Chuồn lẹ
              </button>
              <p className="text-white/60 text-xs mt-2">
                Hoặc chọn Truth/Trick để tiếp tục
              </p>
            </motion.div>
          )}

          {/* End Turn Button - show when prompt is selected and question displayed */}
          {/* {selectedPrompt && showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <button
                onClick={() => {
                  onEndTurn(); // Send END_TURN event
                  onClose?.(); // Close popup locally
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                🎯 Kết thúc lượt
              </button>
            </motion.div>
          )} */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientPromptPopup;
