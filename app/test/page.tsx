"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HostView from "@/components/test/HostView";
import PlayerView from "@/components/test/PlayerView";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socketClient";
import type { PlayerSelectedPayload, RoomStatePayload } from "@/types/socket";
import { isPlayerSelectedPayload, isRoomStatePayload } from "@/types/socket";

const TestSocketPage = () => {
    const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [lastMessage, setLastMessage] = useState<string>("No messages yet");
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
    const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const promptCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const me = useMemo(() => {
        if (!roomState) {
            return null;
        }

        const socket = getSocket();
        return roomState.players.find((player) => player.id === socket.id) ?? null;
    }, [roomState]);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStatus("connecting");

        const socket = connectSocket();

        const handleConnect = () => {
            setStatus("connected");
        };

        const handleDisconnect = () => {
            setStatus("disconnected");
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
            setLastMessage("Joined room successfully");
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
        socket.on("connect_error", handleError);
        socket.on("message", handleMessage);
        socket.on("joined", handleJoined);
        socket.on("roomUpdate", handleRoomUpdate);
        socket.on("tot:gameStarted", handleGameStarted);
        socket.on("tot:playerSelected", handlePlayerSelected);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleError);
            socket.off("message", handleMessage);
            socket.off("joined", handleJoined);
            socket.off("roomUpdate", handleRoomUpdate);
            socket.off("tot:gameStarted", handleGameStarted);
            socket.off("tot:playerSelected", handlePlayerSelected);
            disconnectSocket();
        };
    }, [startCountdown, clearPromptCountdown]);

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
        socket.emit("tot:finishTurn", {
            roomId: 1,
        });
        setLastMessage("Turn finished");
        setIsFinishEnabled(false);
        clearPromptCountdown();
    }, [isFinishEnabled, clearPromptCountdown]);

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
        socket.emit("tot:startGame", {
            roomId: 1,
        });
        setLastMessage("Game start requested");
    }, []);

    return (
        <main className="relative min-h-screen flex flex-col gap-6 p-6">
            <header className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold">Socket Test Page</h1>
                <p>Status: {status}</p>
                <p>{lastMessage}</p>
            </header>

            <div className="flex flex-wrap gap-4">
                <button
                    type="button"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    onClick={() => {
                        const socket = getSocket();
                        socket.emit("message", { clientTime: new Date().toISOString() });
                        setLastMessage("Sent ping to server");
                    }}
                >
                    Send Ping
                </button>
                <button
                    type="button"
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                    onClick={() => {
                        const socket = getSocket();
                        socket.emit("joinRoom", {
                            roomId: 1,
                            data: {
                                name: "YEAH",
                            },
                        });
                        setLastMessage("Sent joinRoom request");
                    }}
                >
                    Join Room
                </button>
            </div>

            {roomState && me ? (
                me.isHost ? (
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
                )
            ) : (
                <p className="text-neutral-500">Join a room to see the lobby.</p>
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

export default TestSocketPage;
