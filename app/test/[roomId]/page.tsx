"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import HostView from "@/components/test/HostView";
import PlayerView from "@/components/test/PlayerView";
import { connectSocket, getSocket } from "@/lib/socketClient";
import type { PlayerSelectedPayload, RoomStatePayload } from "@/types/socket";
import { isPlayerSelectedPayload, isRoomStatePayload } from "@/types/socket";

const RoomPage = () => {
    const params = useParams();
    const roomId = params.roomId as string;
    const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [lastMessage, setLastMessage] = useState<string>("Connecting...");
    const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerSelectedPayload | null>(null);
    const [promptChoice, setPromptChoice] = useState<
        | {
            type: "truth" | "trick";
            content: string;
        }
        | null
    >(null);
    const [promptCountdown, setPromptCountdown] = useState<number | null>(null);
    const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [roomUrl, setRoomUrl] = useState<string>("");
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
                socket.emit("joinRoom", {
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
            const playerName = payload.player.data?.name ?? payload.player.name ?? "Player";
            setLastMessage(`${playerName} has been selected to play`);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);
        socket.on("connect_error", handleError);
        socket.on("message", handleMessage);
        socket.on("joined", handleJoined);
        socket.on("roomUpdate", handleRoomUpdate);
        socket.on("tot:gameStarted", handleGameStarted);
        socket.on("tot:playerSelected", handlePlayerSelected);

        return () => {
            // Only remove listeners, don't disconnect socket
            // Socket should remain connected for other tabs/devices
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect", handleReconnect);
            socket.off("connect_error", handleError);
            socket.off("message", handleMessage);
            socket.off("joined", handleJoined);
            socket.off("roomUpdate", handleRoomUpdate);
            socket.off("tot:gameStarted", handleGameStarted);
            socket.off("tot:playerSelected", handlePlayerSelected);
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
            socket.emit("tot:finishTurn", {
                roomId: numericRoomId,
            });
            setLastMessage("Turn finished");
            setIsFinishEnabled(false);
            clearPromptCountdown();
        }
    }, [isFinishEnabled, clearPromptCountdown, roomId]);

    const handlePromptChoice = useCallback(
        (type: "truth" | "trick", content: string) => {
            setPromptChoice({ type, content });
            setPromptCountdown(5);
            setIsFinishEnabled(false);

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
        [],
    );

    const handleStartGame = useCallback(() => {
        const socket = getSocket();
        const numericRoomId = Number.parseInt(roomId, 10);
        if (!Number.isNaN(numericRoomId)) {
            socket.emit("tot:startGame", {
                roomId: numericRoomId,
            });
            setLastMessage("Game start requested");
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
            <header className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold">Room {roomId}</h1>
                <p>Status: {status}</p>
                <p>{lastMessage}</p>
            </header>

            {roomState && me ? (
                <>
                    {me.isHost && roomUrl ? (
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
                    ) : null}

                    {me.isHost ? (
                        <HostView
                            roomState={roomState}
                            me={me}
                            selected={selectedPlayer}
                            promptChoice={promptChoice}
                            promptCountdown={promptCountdown}
                            isFinishEnabled={isFinishEnabled}
                            onStartGame={handleStartGame}
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
                            onFinishTurn={handleFinishTurn}
                            onPromptChoice={handlePromptChoice}
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
            </AnimatePresence>
        </main>
    );
};

export default RoomPage;

