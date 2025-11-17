"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { IPlayerSelectedPayload } from "./interface/game.interface";

export type PromptType = "truth" | "trick";

export type ClientPromptPopupProps = {
  selectedPlayer: IPlayerSelectedPayload | null;
  onPromptSelected: (promptType: PromptType) => void;
  onEndTurn: () => void;
  onClose?: () => void; // Callback to close the popup
};

const ClientPromptPopup = ({ selectedPlayer, onPromptSelected, onEndTurn, onClose }: ClientPromptPopupProps) => {
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

    console.log("🎯 ClientPromptPopup: User selected", promptType);
    setSelectedPrompt(promptType);
    console.log("📤 ClientPromptPopup: Calling onPromptSelected with", promptType);
    onPromptSelected(promptType);

    // Simulate showing a question (in real implementation, this would come from server)
    setTimeout(() => {
      const sampleQuestions = {
        truth: [
          "Bạn đã từng nói dối bố mẹ về điểm số chưa?",
          "Điều xấu nhất bạn từng làm là gì?",
          "Bạn có crush ai trong lớp không?"
        ],
        trick: [
          "Hát bài hát yêu thích của bạn mà không có nhạc!",
          "Gọi điện cho người thân và nói tiếng lạ!",
          "Đi bộ như robot trong 30 giây!"
        ]
      };

      const randomQuestion = sampleQuestions[promptType][Math.floor(Math.random() * sampleQuestions[promptType].length)];
      setQuestion(randomQuestion);
      setShowQuestion(true);
    }, 1000);
  };

  // Allow popup to show even if selectedPlayer is null initially
  // It will update when PLAYER_SELECTED event arrives
  const player = selectedPlayer?.player;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
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
            /* Selection Phase */
            <div className="flex justify-center items-center gap-6 mb-8">
              {/* Truth Button */}
              <motion.button
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="w-48 h-48 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex flex-col items-center justify-center text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePromptClick("truth")}
                disabled={!!selectedPrompt}
                whileHover={!selectedPrompt ? { scale: 1.05 } : {}}
                whileTap={!selectedPrompt ? { scale: 0.95 } : {}}
                suppressHydrationWarning={true}
              >
                <div className="text-5xl mb-3">❓</div>
                <h3 className="text-xl font-bold">TRUTH</h3>
                <p className="text-sm text-blue-100 mt-1">Câu hỏi thật thà</p>
              </motion.button>

              {/* Trick Button */}
              <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                className="w-48 h-48 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 flex flex-col items-center justify-center text-white shadow-2xl hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePromptClick("trick")}
                disabled={!!selectedPrompt}
                whileHover={!selectedPrompt ? { scale: 1.05 } : {}}
                whileTap={!selectedPrompt ? { scale: 0.95 } : {}}
                suppressHydrationWarning={true}
              >
                <div className="text-5xl mb-3">🎭</div>
                <h3 className="text-xl font-bold">TRICK</h3>
                <p className="text-sm text-red-100 mt-1">Câu hỏi thử thách</p>
              </motion.button>
            </div>
          ) : (
            /* Question Display Phase */
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
                  <span className="text-2xl">
                    {selectedPrompt === "truth" ? "❓" : "🎭"}
                  </span>
                  <span className="text-white font-semibold text-lg">
                    Đã chọn {selectedPrompt === "truth" ? "TRUTH" : "TRICK"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* End Turn Button - only show after question is displayed */}
          {showQuestion && (
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
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientPromptPopup;
