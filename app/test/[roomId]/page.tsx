"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import HostView from "@/components/test/HostView";
import PlayerView from "@/components/test/PlayerView";
import { connectSocket, getSocket } from "@/lib/socketClient";
import type {
    PlayerSelectedPayload,
    PlayerRenamedPayload,
    PlayerAvatarUpdatedPayload,
    RoomStatePayload,
    TotPromptType,
    TotTurnOptionSelectedPayload,
} from "@/types/socket";
import {
    isPlayerRenamedPayload,
    isPlayerAvatarUpdatedPayload,
    isPlayerSelectedPayload,
    isRoomStatePayload,
    isTotTurnOptionSelectedPayload,
} from "@/types/socket";
import { SocketClientEvent, SocketServerEvent } from "@/types/socketEvents";
import { QRCodeSVG } from "qrcode.react";

const RoomPage = () => {
    const params = useParams();
    const roomId = params.roomId as string;
    const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [lastMessage, setLastMessage] = useState<string>("Connecting...");
    const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerSelectedPayload | null>(null);
    const [promptChoice, setPromptChoice] = useState<{
        type: TotPromptType;
        content: string;
    } | null>(null);
    const [promptCountdown, setPromptCountdown] = useState<number | null>(null);
    const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [roomUrl, setRoomUrl] = useState<string>("");
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [choiceOption, setChoiceOption] = useState<TotPromptType | null>(null);
    const [showTurnPopup, setShowTurnPopup] = useState<boolean>(false);
    const [showPlayAgain, setShowPlayAgain] = useState<boolean>(false);
    const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const promptCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const me = useMemo(() => {
        if (!roomState) {
            return null;
        }

        const socket = getSocket();
        return roomState.players.find((player) => player.id === socket.id) ?? null;
    }, [roomState]);

    useLayoutEffect(() => {
        // Set roomUrl only on client side to avoid hydration mismatch
        // This is necessary because window.location is only available on client
        // Using useLayoutEffect to set it before paint to minimize visual flicker
        if (typeof window !== "undefined") {
            setRoomUrl(`${window.location.origin}/test/${roomId}`);
        }
    }, [roomId]);

    const clearCountdownTimers = useCallback(() => {
        countdownTimeoutsRef.current.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        countdownTimeoutsRef.current = [];
    }, []);

    const clearPromptCountdown = useCallback(() => {
        if (promptCountdownIntervalRef.current) {
            clearInterval(promptCountdownIntervalRef.current);
            promptCountdownIntervalRef.current = null;
        }
        setPromptCountdown(null);
        setIsFinishEnabled(false);
    }, []);

    const startCountdown = useCallback(() => {
        clearCountdownTimers();

        const sequence = [3, 2, 1];

        sequence.forEach((value, index) => {
            const timeoutId = setTimeout(() => {
                setCountdown(value);

                if (index === sequence.length - 1) {
                    const hideId = setTimeout(() => {
                        setCountdown(null);
                    }, 1100);

                    countdownTimeoutsRef.current.push(hideId);
                }
            }, index * 1000);

            countdownTimeoutsRef.current.push(timeoutId);
        });
    }, [clearCountdownTimers]);

    useEffect(() => {
        if (!roomId) {
            return;
        }

        // Initialize connection status - this is necessary for UI state
        setStatus("connecting");

        const socket = connectSocket();
        let hasJoinedRef = hasJoined;

        const joinRoomIfNeeded = () => {
            // Only join if not already joined
            if (hasJoinedRef) {
                return;
            }

            const numericRoomId = Number.parseInt(roomId, 10);
            if (!Number.isNaN(numericRoomId)) {
                socket.emit(SocketClientEvent.JoinRoom, {
                    roomId: numericRoomId,
                    data: {
                        name: `Player-${Math.random().toString(36).substring(2, 9)}`,
                    },
                });
            } else {
                setLastMessage("Invalid room ID");
            }
        };

        const handleConnect = () => {
            setStatus("connected");
            setLastMessage("Connected, joining room...");
            joinRoomIfNeeded();
        };

        // If already connected, join immediately
        if (socket.connected && !hasJoined) {
            setStatus("connected");
            setLastMessage("Connected, joining room...");
            joinRoomIfNeeded();
        }

        const handleDisconnect = () => {
            setStatus("disconnected");
            setLastMessage("Disconnected from server");
        };

        const handleError = (error: Error) => {
            setLastMessage(`Error: ${error.message}`);
        };

        const handleMessage = (data: unknown) => {
            setLastMessage(`Message: ${JSON.stringify(data)}`);
        };

        const handleJoined = (payload: unknown) => {
            console.log("🚀 ~ handleJoined ~ payload:", payload);
            if (!isRoomStatePayload(payload)) {
                setLastMessage("Joined: Unexpected payload shape");
                return;
            }

            setRoomState(payload);
            hasJoinedRef = true;
            setHasJoined(true);
            setLastMessage("Joined room successfully");
        };

        const handleReconnect = () => {
            console.log("Socket reconnected, rejoining room...");
            setStatus("connected");
            setLastMessage("Reconnected, rejoining room...");
            // Reset hasJoined to allow rejoin
            hasJoinedRef = false;
            setHasJoined(false);
            joinRoomIfNeeded();
        };

        const handleRoomUpdate = (payload: unknown) => {
            console.log("🚀 ~ handleRoomUpdate ~ payload:", payload);
            if (!isRoomStatePayload(payload)) {
                setLastMessage("Room update: Unexpected payload shape");
                return;
            }

            setRoomState(payload);
            setLastMessage("Room updated");
        };

        const handleGameStarted = () => {
            setLastMessage("Game starting...");
            setGameStarted(true);
            startCountdown();
        };

        const handlePlayerSelected = (payload: unknown) => {
            console.log("🚀 ~ handlePlayerSelected ~ payload:", payload)
            if (!isPlayerSelectedPayload(payload)) {
                setLastMessage("Player selected: Unexpected payload shape");
                return;
            }

            clearPromptCountdown();
            setPromptChoice(null);
            setSelectedPlayer(payload);
            setIsFinishEnabled(false);
            setChoiceOption(null); // Reset choice option khi chọn người chơi mới
            const playerName = payload.player.data?.name ?? payload.player.name ?? "Player";
            setLastMessage(`${playerName} has been selected to play`);

            // Show popup if it's the current player's turn (only for non-host players)
            const socket = getSocket();
            if (payload.player.id === socket.id && !payload.player.isHost) {
                setShowTurnPopup(true);
            }
        };

        const handleTurnOptionSelected = (payload: unknown) => {
            console.log("🚀 ~ handleTurnOptionSelected ~ payload:", payload);
            if (!isTotTurnOptionSelectedPayload(payload)) {
                setLastMessage("Turn option selected: Unexpected payload shape");
                return;
            }

            setChoiceOption(payload.type);
            setPromptChoice({
                type: payload.type,
                content: payload.content,
            });
            setLastMessage(`Player chose ${payload.type}`);
        };

        const handlePlayerRenamed = (payload: unknown) => {
            if (!isPlayerRenamedPayload(payload)) {
                setLastMessage("Player renamed: Unexpected payload shape");
                return;
            }

            setRoomState((prev) => {
                if (!prev) {
                    return prev;
                }

                const updatedPlayers = prev.players.map((player) => {
                    if (player.id !== payload.playerId) {
                        return player;
                    }

                    return {
                        ...player,
                        data: {
                            ...player.data,
                            name: payload.name,
                        },
                    };
                });

                return {
                    ...prev,
                    players: updatedPlayers,
                };
            });

            setSelectedPlayer((prev) => {
                if (!prev || prev.player.id !== payload.playerId) {
                    return prev;
                }

                return {
                    ...prev,
                    player: {
                        ...prev.player,
                        data: {
                            ...prev.player.data,
                            name: payload.name,
                        },
                    },
                };
            });

            setLastMessage(`${payload.name} đã đổi tên`);
        };

        const handlePlayerAvatarUpdated = (payload: unknown) => {
            if (!isPlayerAvatarUpdatedPayload(payload)) {
                setLastMessage("Player avatar updated: Unexpected payload shape");
                return;
            }

            setRoomState((prev) => {
                if (!prev) {
                    return prev;
                }

                const updatedPlayers = prev.players.map((player) => {
                    if (player.id !== payload.playerId) {
                        return player;
                    }

                    return {
                        ...player,
                        data: {
                            ...player.data,
                            avatar: payload.avatar,
                        },
                    };
                });

                return {
                    ...prev,
                    players: updatedPlayers,
                };
            });

            setSelectedPlayer((prev) => {
                if (!prev || prev.player.id !== payload.playerId) {
                    return prev;
                }

                return {
                    ...prev,
                    player: {
                        ...prev.player,
                        data: {
                            ...prev.player.data,
                            avatar: payload.avatar,
                        },
                    },
                };
            });

            setLastMessage("Người chơi đã cập nhật avatar");
        };

        const handleOutOfTurn = () => {
            setShowPlayAgain(true);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);
        socket.on("connect_error", handleError);
        socket.on("message", handleMessage);
        socket.on("joined", handleJoined);
        socket.on(SocketServerEvent.RoomUpdate, handleRoomUpdate);
        socket.on(SocketServerEvent.TotGameStarted, handleGameStarted);
        socket.on(SocketServerEvent.TotPlayerSelected, handlePlayerSelected);
        socket.on(SocketServerEvent.TotTurnOptionSelected, handleTurnOptionSelected);
        socket.on(SocketServerEvent.PlayerRenamed, handlePlayerRenamed);
        socket.on(SocketServerEvent.PlayerAvatarUpdated, handlePlayerAvatarUpdated);
        socket.on(SocketServerEvent.TotOutOfTurn, handleOutOfTurn);

        return () => {
            // Only remove listeners, don't disconnect socket
            // Socket should remain connected for other tabs/devices
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect", handleReconnect);
            socket.off("connect_error", handleError);
            socket.off("message", handleMessage);
            socket.off("joined", handleJoined);
            socket.off(SocketServerEvent.RoomUpdate, handleRoomUpdate);
            socket.off(SocketServerEvent.TotGameStarted, handleGameStarted);
            socket.off(SocketServerEvent.TotPlayerSelected, handlePlayerSelected);
            socket.off(SocketServerEvent.TotTurnOptionSelected, handleTurnOptionSelected);
            socket.off(SocketServerEvent.PlayerRenamed, handlePlayerRenamed);
            socket.off(SocketServerEvent.PlayerAvatarUpdated, handlePlayerAvatarUpdated);
            socket.off(SocketServerEvent.TotOutOfTurn, handleOutOfTurn);
            // Don't disconnect socket here - it's shared across components
        };
    }, [roomId, hasJoined, startCountdown, clearPromptCountdown]);

    useEffect(
        () => () => {
            clearCountdownTimers();
            clearPromptCountdown();
        },
        [clearCountdownTimers, clearPromptCountdown],
    );

    const handleFinishTurn = useCallback(() => {
        if (!isFinishEnabled) {
            return;
        }

        const socket = getSocket();
        const numericRoomId = Number.parseInt(roomId, 10);
        if (!Number.isNaN(numericRoomId)) {
            socket.emit(SocketClientEvent.TotFinishTurn, {
                roomId: numericRoomId,
            });
            setLastMessage("Turn finished");
            setIsFinishEnabled(false);
            clearPromptCountdown();
        }
    }, [isFinishEnabled, clearPromptCountdown, roomId]);

    const handlePromptChoice = useCallback(
        (type: TotPromptType, content: string) => {
            setPromptChoice({ type, content });
            setPromptCountdown(5);
            setIsFinishEnabled(false);

            // Gửi event lên server
            const socket = getSocket();
            const numericRoomId = Number.parseInt(roomId, 10);
            if (!Number.isNaN(numericRoomId)) {
                socket.emit(SocketClientEvent.TotTurnOptionSelected, {
                    roomId: numericRoomId.toString(),
                    type,
                    content,
                });
            }

            if (promptCountdownIntervalRef.current) {
                clearInterval(promptCountdownIntervalRef.current);
            }

            promptCountdownIntervalRef.current = setInterval(() => {
                setPromptCountdown((prev) => {
                    if (prev === null) {
                        return prev;
                    }

                    if (prev <= 1) {
                        if (promptCountdownIntervalRef.current) {
                            clearInterval(promptCountdownIntervalRef.current);
                            promptCountdownIntervalRef.current = null;
                        }
                        setIsFinishEnabled(true);
                        return null;
                    }

                    return prev - 1;
                });
            }, 1000);
        },
        [roomId],
    );

    const handleStartGame = useCallback(() => {
        const socket = getSocket();
        const numericRoomId = Number.parseInt(roomId, 10);
        if (!Number.isNaN(numericRoomId)) {
            socket.emit(SocketClientEvent.TotStartGame, {
                roomId: numericRoomId,
            });
            setLastMessage("Game start requested");
        }
    }, [roomId]);

    const handleProfileUpdate = useCallback(
        (updates: { name?: string; avatar?: string }) => {
            const socket = getSocket();

            if (updates.name !== undefined) {
                const trimmed = updates.name.trim();

                if (!trimmed) {
                    setLastMessage("Tên không được để trống");
                } else if (trimmed.length > 20) {
                    setLastMessage("Tên không được dài quá 20 ký tự");
                } else {
                    socket.emit(SocketClientEvent.PlayerRename, {
                        roomId,
                        name: trimmed,
                    });
                    setLastMessage("Đã gửi yêu cầu đổi tên");
                }
            }

            if (updates.avatar !== undefined) {
                socket.emit(SocketClientEvent.PlayerAvatarUpdate, {
                    roomId,
                    avatar: updates.avatar,
                });
                setLastMessage("Đã gửi yêu cầu đổi avatar");
            }
        },
        [roomId],
    );

    const handleCloseTurnPopup = useCallback(() => {
        setShowTurnPopup(false);
    }, []);

    const handleRestartGame = useCallback(() => {
        const socket = getSocket();
        const numericRoomId = Number.parseInt(roomId, 10);
        if (!Number.isNaN(numericRoomId)) {
            socket.emit(SocketClientEvent.TotControlGame, {
                roomId: numericRoomId,
                action: "restart",
            });
            setLastMessage("Restart game requested");
        }
    }, [roomId]);

    const handlePlayAgain = useCallback(() => {
        const socket = getSocket();
        const numericRoomId = Number.parseInt(roomId, 10);
        if (!Number.isNaN(numericRoomId)) {
            socket.emit(SocketClientEvent.TotControlGame, {
                roomId: numericRoomId,
                action: "restart",
            });
            setShowPlayAgain(false);
            setLastMessage("Play again requested");
        }
    }, [roomId]);

    if (!roomId) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-neutral-500">Invalid room ID</p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen flex flex-col gap-6 p-6">
            {/* <header className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold">Room {roomId}</h1>
                <p>Status: {status}</p>
                <p>{lastMessage}</p>
            </header> */}

            {roomState && me ? (
                <>
                    {/* {me.isHost && roomUrl && !gameStarted ? (
                        <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg">
                            <h2 className="text-2xl font-bold mb-4">QR Code để tham gia</h2>
                            <div className="flex flex-col items-center gap-4">
                                <div className="rounded-lg border-4 border-neutral-200 dark:border-neutral-700 p-4 bg-white">
                                    <QRCodeSVG value={roomUrl} size={256} level="H" />
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 break-all text-center max-w-md">
                                    {roomUrl}
                                </p>
                                <p className="text-xs text-neutral-500 text-center">
                                    Quét QR code này để tham gia phòng chơi
                                </p>
                            </div>
                        </section>
                    ) : null} */}

                    {me.isHost ? (
                        <HostView
                            roomState={roomState}
                            me={me}
                            selected={selectedPlayer}
                            promptChoice={promptChoice}
                            promptCountdown={promptCountdown}
                            isFinishEnabled={isFinishEnabled}
                            gameStarted={gameStarted}
                            choiceOption={choiceOption}
                            roomUrl={roomUrl}
                            onStartGame={handleStartGame}
                             onRestartGame={handleRestartGame}
                            onFinishTurn={handleFinishTurn}
                        />
                    ) : (
                        <PlayerView
                            roomState={roomState}
                            me={me}
                            selected={selectedPlayer}
                            promptChoice={promptChoice}
                            promptCountdown={promptCountdown}
                            isFinishEnabled={isFinishEnabled}
                            onStartGame={handleStartGame}
                            onFinishTurn={handleFinishTurn}
                            onPromptChoice={handlePromptChoice}
                            onUpdateProfile={handleProfileUpdate}
                             gameStarted={gameStarted}
                        />
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <p className="text-neutral-500">Đang kết nối và tham gia phòng...</p>
                    {status === "connecting" ? (
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                </div>
            )}

            <AnimatePresence>
                {countdown !== null ? (
                    <motion.div
                        key="countdown-overlay"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.span
                            key={countdown}
                            className="text-white font-black text-9xl md:text-[12rem] tracking-widest"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                            {countdown}
                        </motion.span>
                    </motion.div>
                ) : null}

                {showPlayAgain ? (
                    <motion.div
                        key="play-again"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-600 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        >
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Play again?</h3>
                            <p className="text-white/90 mb-6">Hết lượt rồi, bắt đầu vòng mới nhé!</p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-full bg-white text-emerald-700 font-bold px-6 py-3 hover:bg-white/90 transition"
                                    onClick={handlePlayAgain}
                                >
                                    Restart vòng chơi
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}

                {showTurnPopup ? (
                    <motion.div
                        key="turn-popup"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseTurnPopup}
                    >
                        <motion.div
                            className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center"
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: -20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                className="mb-6"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    delay: 0.2,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                }}
                            >
                                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
                                    <span className="text-4xl md:text-5xl">🎯</span>
                                </div>
                            </motion.div>
                            <motion.h2
                                className="text-3xl md:text-4xl font-black text-white mb-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Lượt của bạn!
                            </motion.h2>
                            <motion.p
                                className="text-white/90 text-lg md:text-xl mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Hãy chọn Truth hoặc Trick để bắt đầu
                            </motion.p>
                            <motion.button
                                className="bg-white text-purple-700 font-bold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleCloseTurnPopup}
                            >
                                Bắt đầu
                            </motion.button>
                            <motion.p
                                className="text-white/70 text-sm mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                (Click vào màn hình để đóng)
                            </motion.p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </main>
    );
};

export default RoomPage;

