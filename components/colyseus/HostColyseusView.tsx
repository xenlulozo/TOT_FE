"use client";

import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useRef, useMemo } from "react";
import { IPlayerInfo, IRoomStatePayload, PlayerSelectedPayload, PromptOption, RoomStatePayload, RoundState, TotPromptType, IStatePayload } from "@/types/socket";
import SpinningWheel from "./SpinningWheel";
import SelectedPlayerPopup from "./SelectedPlayerPopup";
import CountdownPopup from "./CountdownPopup";
import PromptSelection from "./PromptSelection";
import { IPlayerSelectedPayload } from "./interface/game.interface";
import { ComicText } from "../ui/comic-text";
import { Highlighter } from "../ui/highlighter";
import { Particles } from "../ui/particles";
import { ListPlayer } from "./hostView/listPlayer";

// Animated background component for 4K display
const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient background */}
        <Particles
            className="absolute inset-0 z-20"
            quantity={120}
            ease={80}
            color={"#f7e431"}
            size={0.4}
            refresh={true}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />

    </div>
);




export type HostViewProps = {
    roomState: IStatePayload;
    me: IPlayerInfo;
    selected: IPlayerSelectedPayload | null;
    promptChoice: { type: TotPromptType; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    gameStarted: boolean;
    choiceOption: TotPromptType | null;
    roomUrl: string;
    isSpinning: boolean; // Khi nghe tot:spinning
    turnFinished: boolean; // Khi nghe tot:turnFinished
    spinningPlayerId?: string | null; // ID của player đang được spin
    selectedPlayer?: IPlayerSelectedPayload | null; // Player được chọn sau khi quay
    onStartGame: () => void;
    onRestartGame: () => void;
    onFinishTurn: () => void;
    onSpinComplete?: () => void;
    onSelectedPlayerClose?: () => void;
    showPromptSelection?: boolean;
    selectedPrompt?: "truth" | "trick" | null; // Which prompt was selected (from server events)
    promptContent?: string | null; // Content of the selected prompt
    showTurnCountdown?: boolean; // Trigger countdown for next turn
    onTurnCountdownComplete?: () => void; // Callback when countdown completes
    onPromptSelected?: (promptType: "truth" | "trick") => void;
    gameEnded?: boolean; // Game has ended
};

const HostColyseusView = ({
    roomState,
    me,
    selected,
    promptChoice,
    promptCountdown,
    isFinishEnabled,
    gameStarted,
    choiceOption,
    roomUrl,
    isSpinning,
    turnFinished,
    spinningPlayerId,
    selectedPlayer,
    onStartGame,
    onRestartGame,
    onFinishTurn,
    onSpinComplete,
    onSelectedPlayerClose,
    showPromptSelection,
    selectedPrompt,
    promptContent,
    showTurnCountdown,
    onTurnCountdownComplete,
    onPromptSelected,
    gameEnded,
}: HostViewProps) => {
    // Filter players: loại bỏ host và những player có status là completed
    // wheelPlayers luôn loại bỏ host để host không xuất hiện trong bánh xe
    const participants = roomState.players.filter((player) => {
        if (player.id === me.id) return false;
        const status = player.roundState as RoundState;
        return status !== RoundState.COMPLETED;
    });

    // For wheel display, show all active players except host (during game)
    const wheelPlayers = roomState.players.filter((player) => {
        if (player.id === me.id) return false; // Always exclude host
        const status = player.roundState as RoundState;
        return status !== RoundState.COMPLETED;
    });

    // Danh sách người đã chơi (completed)
    const completedPlayers = roomState.players.filter((player) => {
        if (player.id === me.id) return false;
        const status = player.roundState as RoundState;
        return status === RoundState.COMPLETED;
    });

    const activePlayer = selected?.player ?? null;

    // Lấy thông tin thẻ bài từ selected player
    const truthOption = selected?.promptOptions?.truth;
    const trickOption = selected?.promptOptions?.trick;

    // State để quản lý popup chúc mừng sau khi bánh xe quay xong
    const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);
    const [showGameStartCountdown, setShowGameStartCountdown] = useState(false);
    const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle countdown completion
    const handleCountdownComplete = () => {
        setShowCountdown(false);
        onTurnCountdownComplete?.();
    };

    // Handle game start countdown completion
    const handleGameStartCountdownComplete = () => {
        setShowGameStartCountdown(false);
    };

    // Trigger countdown when showTurnCountdown prop changes
    useEffect(() => {
        if (showTurnCountdown) {
            console.log("🎯 HostColyseusView: Starting turn countdown");
            setShowCountdown(true);
        }
    }, [showTurnCountdown]);

    // Trigger game start countdown when game starts
    useEffect(() => {
        if (gameStarted) {
            console.log("🎯 HostColyseusView: Starting game start countdown");
            setShowGameStartCountdown(true);
        }
    }, [gameStarted]);

    const hidePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasShownPopupRef = useRef<string | null>(null); // Track player đã hiện popup

    // Logic đơn giản:
    // Khi có activePlayer mới và đang spinning → sau 7s hiện popup chúc mừng và thẻ bài
    // Sau 10s (7s quay + 3s popup) → ẩn popup, thẻ bài vẫn hiện
    useEffect(() => {
        if (!activePlayer) {
            setShowCelebrationPopup(false);
            if (popupTimerRef.current) {
                clearTimeout(popupTimerRef.current);
                popupTimerRef.current = null;
            }
            if (hidePopupTimerRef.current) {
                clearTimeout(hidePopupTimerRef.current);
                hidePopupTimerRef.current = null;
            }
            hasShownPopupRef.current = null;
            return;
        }

        // Nếu đã hiện popup cho player này rồi, không hiện lại
        if (hasShownPopupRef.current === activePlayer.id) {
            console.log("🚀 ~ HostView ~ Đã hiện popup cho player này rồi, skip");
            setShowCelebrationPopup(false);

            return;
        }

        // Chỉ bắt đầu timer khi đang spinning và chưa có timer nào đang chạy
        // Và popup chưa đang hiện
        if (!isSpinning || popupTimerRef.current || showCelebrationPopup) {
            console.log("🚀 ~ HostView ~ Điều kiện không đủ:", { isSpinning, hasTimer: !!popupTimerRef.current, showPopup: showCelebrationPopup });
            return;
        }

        console.log("🚀 ~ HostView ~ Bắt đầu timer popup cho player:", activePlayer.id);

        // Sau 7s (thời gian bánh xe quay), hiện popup chúc mừng
        const popupTimer = setTimeout(() => {
            console.log("🚀 ~ HostView ~ Hiện popup chúc mừng");
            setShowCelebrationPopup(true);
            popupTimerRef.current = null;
            hasShownPopupRef.current = activePlayer.id;
        }, 7000);
        popupTimerRef.current = popupTimer;

        // Sau 10s (7s quay + 3s popup), ẩn popup
        const hidePopupTimer = setTimeout(() => {
            console.log("🚀 ~ HostView ~ Ẩn popup chúc mừng");
            setShowCelebrationPopup(false);
            hidePopupTimerRef.current = null;
        }, 10000);
        hidePopupTimerRef.current = hidePopupTimer;

        // Cleanup khi activePlayer hoặc isSpinning thay đổi
        return () => {
            console.log("🚀 ~ HostView ~ Cleanup timer");
            if (popupTimerRef.current) {
                clearTimeout(popupTimerRef.current);
                popupTimerRef.current = null;
            }
            if (hidePopupTimerRef.current) {
                clearTimeout(hidePopupTimerRef.current);
                hidePopupTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePlayer?.id, isSpinning]);

    // Khi turnFinished, reset popup và ref để có thể hiện lại ở turn tiếp theo
    useEffect(() => {
        if (turnFinished) {
            setShowCelebrationPopup(false);
            hasShownPopupRef.current = null;
            if (popupTimerRef.current) {
                clearTimeout(popupTimerRef.current);
                popupTimerRef.current = null;
            }
            if (hidePopupTimerRef.current) {
                clearTimeout(hidePopupTimerRef.current);
                hidePopupTimerRef.current = null;
            }
        }
    }, [turnFinished]);

    // Logic đơn giản: chỉ dùng isSpinning
    // - isSpinning = true → hiện bánh xe, ẩn thẻ bài
    // - isSpinning = false → ẩn bánh xe, hiện thẻ bài (nếu có)
    const hasCards = activePlayer && (truthOption || trickOption);


    // Nếu game đã bắt đầu và chưa kết thúc, hiển thị layout với bánh xe, danh sách và thẻ bài
    // Khi game kết thúc, quay về UI ban đầu (QR code)
    // Bánh xe luôn hiển thị ngay từ khi game bắt đầu
    if (gameStarted && !gameEnded) {
        return (
            <div className="h-screen overflow-hidden">
                <AnimatedBackground />
                <div className="h-screen overflow-hidden flex flex-col relative">
                    {/* Header với logo và title */}
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex-shrink-0 p-8 pb-4"
                    >
                        <div className="flex items-center justify-center gap-6">

                            <div className="text-center">
                                <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                    TOT CHALLENGE
                                </h1>
                                <p className="text-2xl text-white/80 font-medium">
                                    Game đang diễn ra
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex-1 flex gap-8 px-8 pb-8">
                        {/* Bên trái: Bánh xe quay hoặc thẻ bài */}
                        <div className="flex-1 flex flex-col gap-8">
                            {/* Bánh xe quay - luôn hiện khi game đã bắt đầu */}
                            <motion.div
                                key="wheel"
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl min-h-[600px]"
                            >
                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                    <SpinningWheel
                                        players={wheelPlayers}
                                        selectedPlayerId={isSpinning ? spinningPlayerId : null}
                                        onSpinComplete={onSpinComplete}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Bên phải: Danh sách người chơi và người đã chơi */}
                        <div className="flex flex-col gap-8 w-[480px]">
                            {/* Danh sách người chơi */}

                            <ListPlayer roomState={roomState} me={me} />

                        </div>
                    </div>

                    {/* Popup chúc mừng */}
                    {/* {activePlayer && <CelebrationPopup player={activePlayer} />} */}

                    {/* Selected Player Popup - Hide during countdown */}
                    {!showCountdown && !showGameStartCountdown && (
                        <SelectedPlayerPopup
                            selectedPlayer={selectedPlayer ?? null}
                            onClose={onSelectedPlayerClose}
                        />
                    )}

                    {/* Prompt Selection - Hide during countdown */}
                    <AnimatePresence>
                        {showPromptSelection && !showCountdown && !showGameStartCountdown && (
                            <PromptSelection
                                selectedPlayer={selectedPlayer ?? null} // Data from PLAYER_SELECTED event
                                selectedPrompt={selectedPrompt ?? null} // Which prompt was selected (from server events)
                                promptContent={promptContent} // Content of the selected prompt
                                onPromptSelected={onPromptSelected || (() => { })}
                            />
                        )}
                    </AnimatePresence>

                    {/* Game Start Countdown - Full screen overlay */}
                    <CountdownPopup
                        show={showGameStartCountdown}
                        onComplete={handleGameStartCountdownComplete}
                        duration={3}
                        startNumber={3}
                    />

                    {/* Turn Countdown - Full screen overlay */}
                    <CountdownPopup
                        show={showCountdown}
                        onComplete={handleCountdownComplete}
                        duration={3}
                        startNumber={3}
                    />
                </div>
            </div>
        );
    }

    // Layout khi game chưa bắt đầu: 3 vùng (QR, Bánh xe, Danh sách)
    return (
        <div className="h-screen overflow-hidden">
            <AnimatedBackground />

            <section className="h-screen overflow-hidden flex flex-col relative">
                {/* Header với logo */}
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 p-8 pb-4"
                >
                    <div className="flex items-center justify-center gap-6">

                        <div className="text-center">
                            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                TOT CHALLENGE
                            </h1>
                            <p className="text-2xl text-white/80 font-medium">
                                Chờ người chơi tham gia
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex-1 grid grid-cols-3 gap-8 px-8 pb-8 overflow-hidden">
                    {/* Vùng 1: QR Code */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex flex-col items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
                    >
                        {roomUrl ? (
                            <>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                    className="text-center mb-6"
                                >
                                    <h2 className="text-4xl font-bold text-white mb-2">QR Code tham gia</h2>
                                    <p className="text-lg text-white/70">Quét để tham gia phòng chơi</p>
                                </motion.div>
                                <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                                    <motion.div
                                        className="rounded-2xl border-4 border-white/30 p-6 bg-white/95 shadow-2xl"
                                        // whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <QRCodeSVG value={roomUrl} size={280} level="H" />
                                    </motion.div>
                                    <div className="text-center max-w-full">
                                        <p className="text-base text-white/90 break-all bg-black/20 rounded-lg p-3 font-mono">
                                            {roomUrl}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center"
                            >
                                <div className="text-6xl mb-4">🔄</div>
                                <p className="text-xl text-white/70">Đang tải QR code...</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Vùng 2: Spinning Wheel */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
                    >
                        {/* <div className="flex items-center justify-center mb-6">
                            {participants.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-white text-2xl font-bold shadow-2xl hover:shadow-green-500/25 transition-all duration-300 border-2 border-white/20"
                                    onClick={onStartGame}
                                >
                                    🚀 Bắt đầu game
                                </motion.button>
                            )}
                        </div> */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            {participants.length > 0 ? (
                                <SpinningWheel
                                    players={wheelPlayers}
                                    selectedPlayerId={null} // Không spin khi preview
                                    onSpinComplete={() => { }} // Không cần callback khi preview
                                />
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="text-8xl mb-6">🎯</div>
                                    <p className="text-2xl text-white/70 mb-2">Chờ người chơi tham gia</p>
                                    <p className="text-lg text-white/50">Bánh xe sẽ xuất hiện khi có người chơi</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Vùng 3: Danh sách người chơi */}
                    <ListPlayer roomState={roomState} me={me} />
                    {/* <motion.aside
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <ComicText fontSize={2.1} >Người chơi</ComicText>
                            <div className="ml-auto bg-white/20 rounded-full px-4 py-2">
                                <span className="text-xl font-bold text-white">{participants.length}</span>
                            </div>
                        </div>
                        {participants.length === 0 ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-16 flex-1 flex flex-col items-center justify-center"
                            >
                                <div className="text-8xl mb-6 animate-bounce">📱</div>
                                <p className="text-2xl text-white/70 mb-2">Chưa có ai tham gia</p>
                                <p className="text-lg text-white/50">Hãy chia sẻ QR code để mời bạn bè!</p>
                            </motion.div>
                        ) : (
                            <motion.ul
                                className="space-y-4 overflow-y-auto flex-1"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1,
                                        },
                                    },
                                }}
                            >
                                {participants.map((player) => {
                                    const isActive = player.id === activePlayer?.id;
                                    return (
                                        <motion.li
                                            key={player.id}
                                            variants={{
                                                hidden: { x: 50, opacity: 0 },
                                                visible: { x: 0, opacity: 1 },
                                            }}
                                            className={`rounded-2xl border p-6 transition-all duration-300 hover:scale-105 ${
                                                isActive
                                                    ? "border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 shadow-lg shadow-yellow-400/25"
                                                    : "border-white/20 bg-white/5 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {renderAvatar(player, "lg")}
                                                <div className="flex-1">
                                                    <p className="text-xl font-bold text-white mb-1">
                                                    <Highlighter action="highlight" color="#87CEFA">  {player?.name ?? "Unnamed Player"}  </Highlighter>

                                                    </p>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                            <p className="text-sm text-green-400 font-medium">
                                                                Đang chơi 🎯
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </motion.ul>
                        )}
                    </motion.aside> */}
                </div>

                {/* Turn Countdown - Full screen overlay */}
                <CountdownPopup
                    show={showCountdown}
                    onComplete={handleCountdownComplete}
                    duration={3}
                    startNumber={3}
                />
            </section>
        </div>
    );
};

export default HostColyseusView;


