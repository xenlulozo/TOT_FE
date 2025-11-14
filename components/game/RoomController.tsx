"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
    PlayerAvatarUpdatedPayload,
    PlayerRenamedPayload,
    PlayerSelectedPayload,
    RoomStatePayload,
    TotPromptType,
    TotTurnOptionSelectedPayload,
} from "@/types/socket";
import {
    isPlayerAvatarUpdatedPayload,
    isPlayerRenamedPayload,
    isPlayerSelectedPayload,
    isRoomStatePayload,
    isTotTurnOptionSelectedPayload,
} from "@/types/socket";
import { SocketClientEvent, SocketServerEvent } from "@/types/socketEvents";
import { connectSocket, getSocket } from "@/lib/socketClient";
import type { HostViewProps } from "@/components/test/HostView";
import type { PlayerViewProps } from "@/components/test/PlayerView";

const PLAYER_NAME_POOL = [
    "Báo Đêm",
    "Gấu Tuyết",
    "Cáo Lửa",
    "Cú Mắt Vàng",
    "Sói Xám",
    "Bạch Miêu",
    "Hải Ly Tinh Nghịch",
    "Chó Sói Vui Vẻ",
    "Rồng Tí Hon",
    "Kỳ Lân Mơ Mộng",
    "Thuồng Luồng",
    "Hổ Bạc",
    "Cò Trắng",
    "Cá Mập Con",
    "Sư Tử Con",
    "Voi Con",
    "Đại Bàng Trẻ",
    "Ngựa Vằn",
    "Linh Dương",
    "Hà Mã",
    "Anh Hùng Xạ Điêu",
    "Thần Điêu Cô Đơn",
    "Soái Ca Không Có Nóc",
    "Tôn Ngộ Không WiFi Yếu",
    "Đại Hiệp Bán Mì Cay",
    "Cô Dâu 8 Phần",
    "Thủ Lĩnh Dải Ngân Hà",
    "Bà Năm Chạy Sô",
    "Trùm Cuối Vũ Trụ Marvel",
    "Hậu Duệ Mì Tôm",
    "Phó Bản Nhà Bà Phương",
    "Lý Tiểu Long Lanh",
    "Công Chúa Bong Bóng",
    "Thằng Điên Remix",
    "Idol Hết Thời",
    "Ca Sĩ Lạc Tông",
    "DJ Mất Sóng",
    "Rapper Hơi Mệt",
    "Ca Dao & Beat",
    "Sầu Riêng Buồn Remix",
    "Trịnh Cơm Tấm",
    "Sơn Tùng Giả Bộ",
    "Jack Không Cắm Sạc",
    "Đức Phúc Không Nói Nhiều",
    "Mỹ Tâm Hết Pin",
    "Bánh Tráng Trộn Sầu Bi",
    "Đại Ca Bò Viên",
    "Cơm Tấm Đa Vũ Trụ",
    "Gà Rán Không Xương",
    "Bún Riêu Đại Hiệp",
    "Bánh Bao Vô Địch",
    "Mì Cay Level 100",
    "Hủ Tiếu Cảm Tử",
    "Bò Kho Chấm Muối",
    "Súp Cua 3000",
    "Cơm Rang Vũ Trụ",
    "Phở Đệ Nhất Thiên Hạ",
    "Tôm Rim Hài Hước",
    "Trùm Bia Hơi",
    "Đại Ca Quán Nhậu",
    "Hoàng Thượng Hết Tiền",
    "Cụng Ly Không Say",
    "Sếp Bia Và Đồng Bọn",
    "Karaoke Mất Nóc",
    "Micro Vàng 9999",
    "Chúa Tể Cục Gạch",
    "Đệ Nhất Gào Thét",
    "Ca Sĩ Bất Đắc Dĩ",
    "DJ Bật Sai Nhạc",
    "Vô Tình Đập Ly",
];

export type RoomControllerProps = {
    roomId?: string;
    HostComponent: React.ComponentType<HostViewProps>;
    PlayerComponent: React.ComponentType<PlayerViewProps>;
};

const RoomController = ({ roomId, HostComponent, PlayerComponent }: RoomControllerProps) => {
    const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [lastMessage, setLastMessage] = useState<string>("Connecting...");
    const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerSelectedPayload | null>(null);
    const [promptChoice, setPromptChoice] = useState<{ type: TotPromptType; content: string } | null>(null);
    const [promptCountdown, setPromptCountdown] = useState<number | null>(null);
    const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [roomUrl, setRoomUrl] = useState<string>("");
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [choiceOption, setChoiceOption] = useState<TotPromptType | null>(null);
    const [showTurnPopup, setShowTurnPopup] = useState<boolean>(false);
    const [showPlayAgain, setShowPlayAgain] = useState<boolean>(false);
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [turnFinished, setTurnFinished] = useState<boolean>(false);
    const remainingNamesRef = useRef<string[]>([...PLAYER_NAME_POOL]);
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
        if (typeof window === "undefined") {
            return;
        }

        const nextUrl = roomId ? `${window.location.origin}${window.location.pathname}` : window.location.href;
        setRoomUrl(nextUrl);
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

    const getRandomDisplayName = useCallback((): string => {
        if (remainingNamesRef.current.length === 0) {
            remainingNamesRef.current = [...PLAYER_NAME_POOL];
        }

        const index = Math.floor(Math.random() * remainingNamesRef.current.length);
        const [name] = remainingNamesRef.current.splice(index, 1);
        return name;
    }, []);

    const getSuggestedDisplayName = useCallback((): string => {
        const name = getRandomDisplayName();
        remainingNamesRef.current.push(name);
        return name;
    }, [getRandomDisplayName]);

    useEffect(() => {
        if (!roomId) {
            return;
        }

        setStatus("connecting");

        const socket = connectSocket();
        let hasJoinedRef = hasJoined;

        const joinRoomIfNeeded = () => {
            if (hasJoinedRef) {
                return;
            }

            const numericRoomId = Number.parseInt(roomId, 10);
            if (!Number.isNaN(numericRoomId)) {
                socket.emit(SocketClientEvent.JoinRoom, {
                    roomId: numericRoomId,
                    data: {
                        name: getRandomDisplayName(),
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
            setStatus("connected");
            setLastMessage("Reconnected, rejoining room...");
            hasJoinedRef = false;
            setHasJoined(false);
            joinRoomIfNeeded();
        };

        const handleRoomUpdate = (payload: unknown) => {
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
            if (!isPlayerSelectedPayload(payload)) {
                setLastMessage("Player selected: Unexpected payload shape");
                return;
            }

            clearPromptCountdown();
            setPromptChoice(null);
            setSelectedPlayer(payload);
            setIsFinishEnabled(false);
            setChoiceOption(null);
            setTurnFinished(false);
            const playerName = payload.player.data?.name ?? payload.player.name ?? "Player";
            setLastMessage(`${playerName} has been selected to play`);

            setTimeout(() => {
                setIsSpinning(false);
            }, 10000);

            const socketInstance = getSocket();
            if (payload.player.id === socketInstance.id && !payload.player.isHost) {
                setTimeout(() => {
                    setShowTurnPopup(true);
                }, 7000);
            }
        };

        const handleTurnOptionSelected = (payload: unknown) => {
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

        const handleSpinning = () => {
            setIsSpinning(true);
            setTurnFinished(false);
        };

        const handleTurnFinished = () => {
            setTurnFinished(true);
            setIsSpinning(false);
            setSelectedPlayer(null);
            setPromptChoice(null);
            setChoiceOption(null);
        };

        const handleGameRestarted = () => {
            setShowPlayAgain(false);
            setGameStarted(false);
            setLastMessage("Game restarted");
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
        socket.on(SocketServerEvent.TotSpinning, handleSpinning);
        socket.on(SocketServerEvent.TotTurnFinished, handleTurnFinished);
        socket.on(SocketServerEvent.TotGameRestarted, handleGameRestarted);

        return () => {
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
            socket.off(SocketServerEvent.TotSpinning, handleSpinning);
            socket.off(SocketServerEvent.TotTurnFinished, handleTurnFinished);
            socket.off(SocketServerEvent.TotGameRestarted, handleGameRestarted);
        };
    }, [roomId, hasJoined, startCountdown, clearPromptCountdown, getRandomDisplayName]);

    useEffect(
        () => () => {
            clearCountdownTimers();
            clearPromptCountdown();
        },
        [clearCountdownTimers, clearPromptCountdown],
    );

    const handleFinishTurn = useCallback(() => {
        if (!roomId || !isFinishEnabled) {
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
            if (!roomId) {
                return;
            }

            setPromptChoice({ type, content });
            setPromptCountdown(5);
            setIsFinishEnabled(false);

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
        if (!roomId) {
            return;
        }

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
            if (!roomId) {
                return;
            }

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
        if (!roomId) {
            return;
        }

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
        if (!roomId) {
            return;
        }

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
            {roomState && me ? (
                <>
                    {me.isHost ? (
                        <HostComponent
                            roomState={roomState}
                            me={me}
                            selected={selectedPlayer}
                            promptChoice={promptChoice}
                            promptCountdown={promptCountdown}
                            isFinishEnabled={isFinishEnabled}
                            gameStarted={gameStarted}
                            choiceOption={choiceOption}
                            roomUrl={roomUrl}
                            isSpinning={isSpinning}
                            turnFinished={turnFinished}
                            onStartGame={handleStartGame}
                            onRestartGame={handleRestartGame}
                            onFinishTurn={handleFinishTurn}
                        />
                    ) : (
                        <PlayerComponent
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
                            onRandomName={getSuggestedDisplayName}
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
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <span className="text-6xl block">⚡</span>
                            </motion.div>
                            <h3 className="text-3xl font-bold text-white mb-2">Đến lượt bạn!</h3>
                            <p className="text-white/80 mb-6">Host đang chọn bạn, chuẩn bị sẵn sàng nhé!</p>
                            <button
                                type="button"
                                className="rounded-full bg-white/90 text-purple-700 font-semibold px-6 py-3 hover:bg-white transition"
                                onClick={handleCloseTurnPopup}
                            >
                                Sẵn sàng
                            </button>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </main>
    );
};

export default RoomController;

