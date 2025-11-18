"use client";

import { Application, extend } from "@pixi/react";
import { Container as PixiContainer, Graphics as PixiGraphics, Text as PixiText } from "pixi.js";
import * as PIXI from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { IRoomStatePayload, IPlayerInfo } from "@/types/socket";
import CountdownPopup from "./CountdownPopup";
import SelectedPlayerPopup from "./SelectedPlayerPopup";
import ClientPromptPopup from "./ClientPromptPopup";
import { IPlayerSelectedPayload } from "./interface/game.interface";

extend({
    Container: PixiContainer,
    Graphics: PixiGraphics,
    Text: PixiText,
});

const AVATAR_OPTIONS = [
    { id: "fox", emoji: "🦊", label: "Cáo" },
    { id: "bear", emoji: "🐻", label: "Gấu" },
    { id: "tiger", emoji: "🐯", label: "Hổ" },
    { id: "panda", emoji: "🐼", label: "Panda" },
    { id: "koala", emoji: "🐨", label: "Koala" },
    { id: "monkey", emoji: "🐵", label: "Khỉ" },
    { id: "unicorn", emoji: "🦄", label: "Kỳ lân" },
    { id: "cat", emoji: "🐱", label: "Mèo" },
    { id: "dog", emoji: "🐶", label: "Cún" },
    { id: "rabbit", emoji: "🐰", label: "Thỏ" },
    { id: "lion", emoji: "🦁", label: "Sư tử" },
    { id: "elephant", emoji: "🐘", label: "Voi" },
];

const RANDOM_NAMES = [
    "Người Chơi Bí Ẩn",
    "Chiến Binh Dũng Cảm",
    "Thám Tử Tài Ba",
    "Nhà Vô Địch",
    "Ngôi Sao Sáng",
    "Bậc Thầy Trò Chơi",
    "Kỳ Phùng Địch Thủ",
    "Siêu Nhân Vui Vẻ",
    "Người Hùng Thầm Lặng",
    "Quán Quân Tương Lai",
];

export type ClientViewProps = {
    roomState: IRoomStatePayload;
    me: IPlayerInfo;
    gameStarted: boolean;
    gameEnded?: boolean;
    selectedPlayer?: IPlayerSelectedPayload | null;
    showSelectedPlayerPopup?: boolean;
    showPromptSelection?: boolean;
    promptContent?: string | null;
    onUpdateProfile: (profile: { name: string; avatar: string }) => void;
    onStartGame: () => void;
    onRestartGame?: () => void;
    onSelectedPlayerClose?: () => void;
    onPromptSelected?: (promptType: "truth" | "trick") => void;
    onEndTurn?: () => void;
};

const useCanvasSize = (ref: React.MutableRefObject<HTMLDivElement | null>) => {
    const [size, setSize] = useState({ width: 400, height: 300 });

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }

        const update = () => {
            const width = Math.min(node.clientWidth, 600);
            const height = Math.max(250, width * 0.5);
            setSize({ width, height });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => observer.disconnect();
    }, [ref]);

    return size;
};

const PixiWelcomeCard = ({ width, height }: { width: number; height: number }) => {
    const draw = (g: PIXI.Graphics) => {
        g.clear();

        // Gradient background effect
        g.beginFill(0x1a1a2e, 0.95);
        g.drawRoundedRect(-width / 2, -height / 2, width, height, 24);
        g.endFill();

        // Border glow
        g.lineStyle(3, 0x6366f1, 0.8);
        g.drawRoundedRect(-width / 2, -height / 2, width, height, 24);
    };

    return (
        <pixiContainer x={width / 2} y={height / 2}>
            <pixiGraphics draw={draw} />
            <pixiText
                text="Chào mừng bạn!"
                anchor={0.5}
                position={{ x: 0, y: -60 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#ffffff",
                        fontFamily: "Poppins",
                        fontSize: 32,
                        fontWeight: "800",
                        letterSpacing: 2,
                    })
                }
            />
            <pixiText
                text="Đang chờ host bắt đầu..."
                anchor={0.5}
                position={{ x: 0, y: 20 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#a5b4fc",
                        fontFamily: "Poppins",
                        fontSize: 18,
                        fontWeight: "500",
                    })
                }
            />
        </pixiContainer>
    );
};

const ClientColyseusView = ({ roomState, me, gameStarted, gameEnded, selectedPlayer, showSelectedPlayerPopup, showPromptSelection, promptContent, onUpdateProfile, onStartGame, onRestartGame, onSelectedPlayerClose, onPromptSelected, onEndTurn }: ClientViewProps) => {
    // Local state to control popup visibility
    const [localShowPromptSelection, setLocalShowPromptSelection] = useState(showPromptSelection);

    // Debug wrapper for onPromptSelected
    const handlePromptSelected = (promptType: "truth" | "trick") => {
        console.log("🎯 ClientColyseusView: handlePromptSelected called with", promptType);
        console.log("🔍 ClientColyseusView: onPromptSelected callback exists?", !!onPromptSelected);
        if (onPromptSelected) {
            console.log("📤 ClientColyseusView: Calling onPromptSelected callback");
            onPromptSelected(promptType);
            console.log("✅ ClientColyseusView: onPromptSelected callback called successfully");
        } else {
            console.log("❌ ClientColyseusView: onPromptSelected callback is undefined");
        }
    };

    // Update local state when prop changes
    useEffect(() => {
        setLocalShowPromptSelection(showPromptSelection);
    }, [showPromptSelection]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClosePromptPopup = () => {
        setLocalShowPromptSelection(false);
    };
    const [nameInput, setNameInput] = useState(me.name || "");
    const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
        return me.avatar && AVATAR_OPTIONS.some((opt) => opt.id === me.avatar)
            ? me.avatar
            : AVATAR_OPTIONS[0]?.id ?? "fox";
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCountdown, setShowCountdown] = useState(false);

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const stageSize = useCanvasSize(canvasRef);

    // Get other players (excluding current user)
    const otherPlayers = useMemo(
        () => roomState.players.filter((player) => player.id !== me.id),
        [roomState.players, me.id]
    );

    // Get current player info
    const currentPlayer = useMemo(
        () => roomState.players.find((p) => p.id === me.id) || me,
        [roomState.players, me]
    );

    useEffect(() => {
        if (me.name) {
            setNameInput(me.name);
        }
    }, [me.name]);

    useEffect(() => {
        if (me.avatar && AVATAR_OPTIONS.some((opt) => opt.id === me.avatar)) {
            setSelectedAvatar(me.avatar);
        }
    }, [me.avatar]);

    // Auto-generate random profile when client connects and game hasn't started
    useEffect(() => {
        if (!gameStarted && onUpdateProfile && (!me.name || !me.avatar)) {
            console.log("🎲 ClientColyseusView: Auto-generating random profile for new client");

            const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
            const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].id;

            console.log("🎲 ClientColyseusView: Generated profile:", { name: randomName, avatar: randomAvatar });

            // Update local state
            setNameInput(randomName);
            setSelectedAvatar(randomAvatar);

            // Send to server
            onUpdateProfile({
                name: randomName,
                avatar: randomAvatar,
            });
        }
    }, [gameStarted, onUpdateProfile, me.name, me.avatar]);

    const trimmedName = nameInput.trim();
    const isNameDirty = trimmedName !== (currentPlayer.name || "");
    const isAvatarDirty = selectedAvatar !== (currentPlayer.avatar || AVATAR_OPTIONS[0]?.id);
    const isSubmitDisabled =
        trimmedName.length === 0 ||
        trimmedName.length > 20 ||
        (!isNameDirty && !isAvatarDirty) ||
        isSubmitting;

    const handleRandomName = () => {
        const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
        setNameInput(randomName);
    };

    const handleSubmitProfile = async () => {
        if (isSubmitDisabled) return;

        setIsSubmitting(true);
        try {
            onUpdateProfile({
                name: trimmedName,
                avatar: selectedAvatar,
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartGame = () => {
        onStartGame();
    };

    // Show countdown when game starts
    useEffect(() => {
        if (gameStarted) {
            setShowCountdown(true);
        }
    }, [gameStarted]);

    const handleCountdownComplete = () => {
        setShowCountdown(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 p-4 pb-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center pt-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Truth or Trick
                    </h1>
                    <p className="text-indigo-200 text-sm md:text-base">
                        {roomState.players.length} người chơi trong phòng
                    </p>
                </div>

                {/* Pixi Canvas Welcome Card */}
                {/* <div className="w-full rounded-3xl border border-white/20 bg-black/30 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <div ref={canvasRef} style={{ height: stageSize.height }}>
                        <Application
                            width={stageSize.width}
                            height={stageSize.height}
                            antialias
                            backgroundAlpha={0}
                        >
                            <PixiWelcomeCard width={stageSize.width} height={stageSize.height} />
                        </Application>
                    </div>
                </div> */}

                {/* Start Game Button - Show when not started */}
                {!gameStarted && (
                    <div className="rounded-3xl border border-white/20 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-md p-6 shadow-xl">
                        <button
                            type="button"
                            onClick={handleStartGame}
                            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 font-bold text-xl text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                        >
                            🎮 Bắt đầu trò chơi
                        </button>
                    </div>
                )}

                {/* Countdown Popup */}
                <CountdownPopup
                    show={showCountdown}
                    onComplete={handleCountdownComplete}
                    duration={3}
                    startNumber={3}
                />

                {/* Profile Setup Card - Hide when game started */}
                {!gameStarted && (
                    <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Thiết lập hồ sơ</h2>
                            <button
                                type="button"
                                onClick={handleRandomName}
                                className="rounded-xl bg-indigo-500/80 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition shadow-lg"
                            >
                                🎲 Random
                            </button>
                        </div>

                        {/* Name Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-indigo-200 mb-2">
                                Tên hiển thị
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value.length <= 20) {
                                            setNameInput(value);
                                        }
                                    }}
                                    maxLength={20}
                                    className="w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition"
                                    placeholder="Nhập tên của bạn"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/60">
                                    {trimmedName.length}/20
                                </span>
                            </div>
                        </div>

                        {/* Avatar Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-indigo-200 mb-3">
                                Chọn avatar
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                {AVATAR_OPTIONS.map((option) => {
                                    const isSelected = option.id === selectedAvatar;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setSelectedAvatar(option.id)}
                                            className={`relative rounded-2xl border-2 p-3 transition-all transform ${isSelected
                                                ? "border-indigo-400 bg-indigo-500/30 scale-110 shadow-lg shadow-indigo-500/50"
                                                : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                                                }`}
                                        >
                                            <span className="text-3xl block">{option.emoji}</span>
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-400 rounded-full border-2 border-white"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handleSubmitProfile}
                            disabled={isSubmitDisabled}
                            className={`w-full rounded-2xl px-6 py-4 font-bold text-lg transition-all transform ${isSubmitDisabled
                                ? "bg-white/10 text-white/40 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                                }`}
                        >
                            {isSubmitting ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
                        </button>
                    </div>
                )}

                {/* Game Started Message */}
                {gameStarted && !showCountdown && !gameEnded && (
                    <div className="rounded-3xl border border-white/20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md p-6 shadow-xl">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white mb-2">🎉 Trò chơi đã bắt đầu!</p>
                            <p className="text-indigo-200">Chúc bạn may mắn!</p>
                        </div>
                    </div>
                )}

                {/* Game Ended - Restart Button */}
                {gameEnded && (
                    <div className="rounded-3xl border border-white/20 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-md p-6 shadow-xl">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white mb-4">🏁 Trò chơi đã kết thúc!</p>
                            <p className="text-indigo-200 mb-6">Bạn có muốn chơi lại không?</p>
                            <button
                                type="button"
                                onClick={onRestartGame}
                                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 font-bold text-xl text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all transform"
                            >
                                🔄 Chơi lại
                            </button>
                        </div>
                    </div>
                )}

                {/* Players List */}
                <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Người chơi</h2>
                        <span className="rounded-full bg-indigo-500/80 px-4 py-1 text-sm font-semibold text-white">
                            {roomState.players.length}
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {/* Current Player */}
                        <div className="rounded-2xl border-2 border-indigo-400 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">
                                    {AVATAR_OPTIONS.find((opt) => opt.id === currentPlayer.avatar)?.emoji || "🎮"}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-white text-lg">
                                            {currentPlayer.name || "Bạn"}
                                        </p>
                                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                                            Bạn
                                        </span>
                                    </div>
                                    {currentPlayer.isHost && (
                                        <p className="text-xs text-indigo-200 mt-1">👑 Host</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Other Players */}
                        {otherPlayers.map((player) => {
                            const avatarEmoji =
                                AVATAR_OPTIONS.find((opt) => opt.id === player.avatar)?.emoji || "🎮";
                            return (
                                <div
                                    key={player.id}
                                    className="rounded-2xl border border-white/20 bg-white/5 p-4 hover:bg-white/10 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{avatarEmoji}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">
                                                {player.name || "Player"}
                                            </p>
                                            {player.isHost && (
                                                <p className="text-xs text-indigo-300 mt-1">👑 Host</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {otherPlayers.length === 0 && (
                            <p className="text-center text-white/60 py-4">
                                Chưa có người chơi khác trong phòng
                            </p>
                        )}
                    </div>
                </div>

                {/* Status Footer */}
                {!gameStarted && (
                    <div className="text-center text-white/60 text-sm">
                        <p>Đang chờ bắt đầu trò chơi...</p>
                    </div>
                )}

                {/* Selected Player Popup - chỉ hiển thị khi người này là người được chọn và được phép hiển thị */}
                {selectedPlayer && selectedPlayer.player.id === me.id && showSelectedPlayerPopup && (
                    <SelectedPlayerPopup
                        selectedPlayer={selectedPlayer}
                        onClose={() => {
                            console.log("🎯 SelectedPlayerPopup onClose triggered");
                            // Call parent's onSelectedPlayerClose to update showSelectedPlayerPopup state
                            onSelectedPlayerClose?.();
                        }}
                    />
                )}

                {/* Client Prompt Popup - hiển thị khi PICK_PROMPT received */}
                { selectedPlayer && localShowPromptSelection && (
                    
                    <ClientPromptPopup
                        selectedPlayer={selectedPlayer ?? null} // Có thể null ban đầu, sẽ update khi PLAYER_SELECTED đến
                        currentPlayerId={me.id}
                        promptContent={promptContent}
                        onPromptSelected={handlePromptSelected}
                        onEndTurn={onEndTurn || (() => { })}
                        onClose={handleClosePromptPopup}
                    />
                )}
            </div>
        </div>
    );
};

export default ClientColyseusView;

