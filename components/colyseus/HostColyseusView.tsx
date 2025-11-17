"use client";

import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useRef, useMemo } from "react";
import { IPlayerInfo, IRoomStatePayload, PlayerSelectedPayload, PromptOption, RoomStatePayload, RoundState, TotPromptType } from "@/types/socket";
import SpinningWheel from "./SpinningWheel";
import SelectedPlayerPopup from "./SelectedPlayerPopup";
import CountdownPopup from "./CountdownPopup";
import PromptSelection from "./PromptSelection";
import { IPlayerSelectedPayload } from "./interface/game.interface";


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

export type HostViewProps = {
    roomState: IRoomStatePayload;
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
    const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle countdown completion
    const handleCountdownComplete = () => {
        setShowCountdown(false);
        onTurnCountdownComplete?.();
    };

    // Trigger countdown when showTurnCountdown prop changes
    useEffect(() => {
        if (showTurnCountdown) {
            console.log("🎯 HostColyseusView: Starting turn countdown");
            setShowCountdown(true);
        }
    }, [showTurnCountdown]);

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
    const showWheel = isSpinning;
    const showCards = !isSpinning && hasCards && !turnFinished;

    const renderAvatar = (player: IPlayerInfo, size: "md" | "lg" = "md") => {
        const avatarId = player.avatar as string;
        const emoji = avatarId ? AVATAR_EMOJI[avatarId] : undefined;
        const displayName = player.name as string ?? "P";
        const fallbackInitial = displayName[0]?.toUpperCase() ?? "P";
        const baseClass =
            "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white";
        const sizeClass = size === "lg" ? "w-20 h-20 text-5xl" : "w-10 h-10 text-2xl";

        if (emoji) {
            return (
                <span className={`${baseClass} ${sizeClass}`} aria-label={displayName}>
                    {emoji}
                </span>
            );
        }

        return (
            <span
                className={`${baseClass} ${size === "lg" ? "w-20 h-20 text-3xl font-black" : "w-10 h-10 text-lg font-bold"
                    }`}
                aria-label={displayName}
            >
                {fallbackInitial}
            </span>
        );
    };    // Component popup chúc mừng với animation pháo
    const CelebrationPopup = ({ player }: { player: IPlayerInfo }) => {
        const playerName = player.name ?? "Player";
        const avatarId = player.avatar as string;
        const emoji = avatarId ? AVATAR_EMOJI[avatarId] : undefined;

        // Pre-calculate firework properties to avoid Math.random in render
        type Firework = {
            id: number;
            left: number;
            top: number;
            color: string;
            yOffset: number;
            xOffset: number;
            delay: number;
        };

        const fireworks = useMemo((): Firework[] =>
            [...Array(20)].map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                top: Math.random() * 100,
                color: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8b94", "#95e1d3"][
                    Math.floor(Math.random() * 5)
                ] as string,
                yOffset: -100 + Math.random() * 200,
                xOffset: -50 + Math.random() * 100,
                delay: Math.random() * 0.5,
            })), []
        );

        return (
            <AnimatePresence>
                {showCelebrationPopup && !showCountdown ? (
                    <motion.div
                        key="celebration-popup"
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        {/* Background overlay */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                        {/* Pháo chúc mừng */}
                        <div className="absolute inset-0 overflow-hidden">
                            {fireworks.map((firework) => (
                                <motion.div
                                    key={firework.id}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${firework.left}%`,
                                        top: `${firework.top}%`,
                                        background: firework.color,
                                    }}
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [1, 1, 0],
                                        y: [0, firework.yOffset],
                                        x: [0, firework.xOffset],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: firework.delay,
                                        repeat: Infinity,
                                        repeatDelay: 0.5,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Popup nội dung */}
                        <motion.div
                            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-400"
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.5 }}
                        >
                            <div className="text-center">
                                <motion.div
                                    className="text-8xl mb-4"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        repeatDelay: 0.3,
                                    }}
                                >
                                    🎉
                                </motion.div>
                                <h2 className="text-3xl font-bold text-yellow-500 mb-4">Chúc mừng!</h2>
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    {emoji ? (
                                        <span className="text-6xl">{emoji}</span>
                                    ) : (
                                        renderAvatar(player, "lg")
                                    )}
                                    <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                        {playerName}
                                    </p>
                                </div>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                    Bạn đã được chọn!
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        );
    };

    // Nếu game đã bắt đầu, hiển thị layout với bánh xe, danh sách và thẻ bài
    // Bánh xe luôn hiển thị ngay từ khi game bắt đầu
    if (gameStarted) {
        return (
            <>
                <div className="flex-1 flex gap-6">
                    {/* Bên trái: Bánh xe quay hoặc thẻ bài */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Bánh xe quay - luôn hiện khi game đã bắt đầu */}
                        <motion.div
                            key="wheel"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold">
                                    {isSpinning ? "Đang quay..." : "Bánh xe quay"}
                                </h3>
                            </div>
                            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[400px]">
                                <SpinningWheel
                                    players={wheelPlayers}
                                    selectedPlayerId={isSpinning ? spinningPlayerId : null}
                                    onSpinComplete={onSpinComplete}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Bên phải: Danh sách người chơi và người đã chơi */}
                    <div className="flex flex-col gap-6 w-80">
                        {/* Danh sách người chơi */}
                        <aside className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg">
                            <h3 className="text-2xl font-bold mb-4">Người chơi</h3>
                            {participants.length === 0 ? (
                                <p className="text-neutral-500">Chưa có người chơi</p>
                            ) : (
                                <ul className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {participants.map((player) => {
                                        const isActive = player.id === activePlayer?.id;
                                        return (
                                            <li
                                                key={player.id}
                                                className={`rounded-lg border p-4 transition ${isActive
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {renderAvatar(player)}
                                                    <div className="flex-1">
                                                        <p className="font-medium">
                                                            {player.name ?? "Unnamed Player"}
                                                        </p>
                                                        {isActive && (
                                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                                Đang chơi
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </aside>

                        {/* Danh sách người đã chơi */}
                        {completedPlayers.length > 0 && (
                            <aside className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg">
                                <h3 className="text-2xl font-bold mb-4">Đã chơi</h3>
                                <ul className="space-y-3 max-h-[200px] overflow-y-auto">
                                    {completedPlayers.map((player) => (
                                        <li
                                            key={player.id}
                                            className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800/50 opacity-60 p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                {renderAvatar(player)}
                                                <div className="flex-1">
                                                    <p className="font-medium text-neutral-600 dark:text-neutral-400">
                                                        {player.name ?? "Unnamed Player"}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">Đã hoàn thành</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </aside>
                        )}
                    </div>
                </div>

                {/* Popup chúc mừng */}
                {/* {activePlayer && <CelebrationPopup player={activePlayer} />} */}

                {/* Selected Player Popup - Hide during countdown */}
                {!showCountdown && (
                    <SelectedPlayerPopup
                        selectedPlayer={selectedPlayer ?? null}
                        onClose={onSelectedPlayerClose}
                    />
                )}

                {/* Prompt Selection - Hide during countdown */}
                {showPromptSelection && !showCountdown && (
                    <PromptSelection
                        selectedPlayer={selectedPlayer ?? null} // Data from PLAYER_SELECTED event
                        selectedPrompt={selectedPrompt ?? null} // Which prompt was selected (from server events)
                        promptContent={promptContent} // Content of the selected prompt
                        onPromptSelected={onPromptSelected || (() => { })}
                    />
                )}
            </>
        );
    }

    // Layout khi game chưa bắt đầu: 3 vùng (QR, Bánh xe, Danh sách)
    return (
        <section className="h-screen overflow-hidden flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
            <div className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-hidden">
                {/* Vùng 1: QR Code */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-hidden">
                    {roomUrl ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4 text-center">QR Code để tham gia</h2>
                            <div className="flex flex-col items-center gap-4 flex-1 justify-center">
                                <div className="rounded-lg border-4 border-neutral-200 dark:border-neutral-700 p-4 bg-white">
                                    <QRCodeSVG value={roomUrl} size={240} level="H" />
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 break-all text-center max-w-full">
                                    {roomUrl}
                                </p>
                                <p className="text-xs text-neutral-500 text-center">
                                    Quét QR code này để tham gia phòng chơi
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-neutral-500">Loading QR code...</p>
                    )}
                </div>

                {/* Vùng 2: Spinning Wheel */}
                <div className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">Bánh xe quay</h3>
                        {participants.length > 0 && (
                            <button
                                type="button"
                                className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold shadow hover:bg-blue-700 transition"
                                onClick={onStartGame}
                            >
                                Bắt đầu game
                            </button>
                        )}
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        {participants.length > 0 ? (
                            <SpinningWheel
                                players={wheelPlayers}
                                selectedPlayerId={null} // Không spin khi preview
                                onSpinComplete={() => { }} // Không cần callback khi preview
                            />
                        ) : (
                            <div className="text-center text-neutral-500">
                                <p className="text-lg mb-2">🎯</p>
                                <p>Chờ người chơi tham gia</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vùng 3: Danh sách người chơi */}
                <aside className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-hidden">
                    <h3 className="text-2xl font-bold mb-4">Danh sách người chơi {participants.length}</h3>
                    {participants.length === 0 ? (
                        <p className="text-neutral-500">Chưa có người chơi</p>
                    ) : (
                        <ul className="space-y-3 overflow-y-auto flex-1">
                            {participants.map((player) => {
                                const isActive = player.id === activePlayer?.id;
                                return (
                                    <li
                                        key={player.id}
                                        className={`rounded-lg border p-4 transition ${isActive
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                            : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {renderAvatar(player)}
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {player?.name ?? "Unnamed Player"}
                                                </p>
                                                {isActive && (
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        Đang chơi
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>

            {/* Turn Countdown - Full screen overlay */}
            <CountdownPopup
                show={showCountdown}
                onComplete={handleCountdownComplete}
                duration={3}
                startNumber={3}
            />
        </section>
    );
};

export default HostColyseusView;


