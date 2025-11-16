"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { Room } from "colyseus.js";
import { showConnectionStatus } from "@/lib/wsClient";
import HostColyseusView from "@/components/colyseus/HostColyseusView";
import ClientColyseusView from "@/components/colyseus/ClientColyseusView";
import { RoundState, IRoomStatePayload, IPlayerInfo, PlayerSelectedPayload, TotPromptType } from "@/types/socket";
import { RoomState } from "@/types/ws.enum";
import { SocketEnum } from "@/lib/socket.enum";
import { IHostPayload } from "@/components/colyseus/interface/host.interface";
import { MapSchema } from "@colyseus/schema";

// Type for Colyseus room state
type ColyseusRoomState = {
    players?: IPlayerInfo[];
    meta?: Record<string, unknown>;
    hostId?: string;
    [key: string]: unknown;
};

const PixiRoomPage = () => {
    const params = useParams();
    console.log("🚀 ~ PixiRoomPage ~ params:", params.params)
    const [roomId, host] = params.params || [];

    // State management
    const [room, setRoom] = useState<Room | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
    const [roomState, setRoomState] = useState<IRoomStatePayload>({
        players: [],
        meta: {},
        hostId: ""
    });
    const [selected, setSelected] = useState<PlayerSelectedPayload | null>(null);
    const [promptChoice, setPromptChoice] = useState<{ type: TotPromptType; content: string } | null>(null);
    const [promptCountdown, setPromptCountdown] = useState<number | null>(null);
    const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [choiceOption, setChoiceOption] = useState<TotPromptType | null>(null);
    const [roomUrl, setRoomUrl] = useState<string>("");
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [turnFinished, setTurnFinished] = useState<boolean>(false);
    const [hostId, setHostId] = useState<string>("");
    const [spinningPlayerId, setSpinningPlayerId] = useState<string | null>(null);

    // Ref to store room for cleanup
    const roomRef = useRef<Room | null>(null);

    // Calculate `me` from roomState and determine if user is host
    const me = useMemo<IPlayerInfo>(() => {
        if (!roomState || !room) {
            return {
                id: "",
                isHost: false,
                roundState: RoundState.NOT_STARTED,
                avatar: "",
                name: ""
            };
        }
        const currentPlayer = roomState.players.find((player) => player.id === room.sessionId);
        const isHost = room.sessionId === hostId || currentPlayer?.isHost || false;
        return currentPlayer ? {
            ...currentPlayer,
            isHost
        } : {
            id: room.sessionId || "",
            isHost,
            roundState: RoundState.NOT_STARTED,
            avatar: "",
            name: ""
        };
    }, [roomState, room, hostId]);

    // Determine if current user is host
    const isHost = useMemo(() => {
        return room?.sessionId === hostId || me.isHost;
    }, [room, hostId, me.isHost]);

    // Initialize Room connection and setup handlers
    useEffect(() => {
        if (!roomId) {
            return;
        }

        let isMounted = true;

        const initializeRoom = async () => {
            setConnectionStatus("connecting");

            try {
                const connectedRoom = await showConnectionStatus(roomId, host);

                if (!connectedRoom || !isMounted) {
                    if (connectedRoom && !isMounted) {
                        // Component unmounted during connection, cleanup
                        connectedRoom.leave();
                    }
                    if (isMounted) {
                        setConnectionStatus("disconnected");
                    }
                    return;
                }

                roomRef.current = connectedRoom;
                setRoom(connectedRoom);
                setConnectionStatus("connected");

                // Setup message handlers
                connectedRoom.onMessage(SocketEnum.SET_ROOM_HOST, (message: IHostPayload) => {
                    console.log("🚀 ~ SET_ROOM_HOST ~ message:", message);
                    if (message.url) {
                        setRoomUrl(message.url);
                    }
                });

                connectedRoom.onMessage(SocketEnum.UPDATE_MEMBERS, (message: MapSchema<IPlayerInfo, string> | Record<string, IPlayerInfo>) => {
                    console.log("🚀 ~ UPDATE_MEMBERS ~ message:", message);

                    // Convert MapSchema or Record to array
                    let playersArray: IPlayerInfo[] = [];
                    let detectedHostId = "";

                    if (message instanceof Map) {
                        // If it's a MapSchema, convert to array
                        playersArray = Array.from(message.values());
                    } else if (message && typeof message === 'object') {
                        // If it's a Record/object, convert to array
                        const entries = Object.entries(message);
                        playersArray = entries.map(([key, value]): IPlayerInfo => {
                            // If value is already IPlayerInfo, use it
                            if (value && typeof value === 'object' && 'id' in value && 'name' in value) {
                                return value as IPlayerInfo;
                            }
                            // Otherwise, use key as id and extract properties from value
                            const valueObj = value as Record<string, unknown>;
                            return {
                                id: key,
                                name: (typeof valueObj?.name === 'string' ? valueObj.name : "") as string,
                                avatar: (typeof valueObj?.avatar === 'string' ? valueObj.avatar : "") as string,
                                roundState: (valueObj?.roundState as RoundState) || RoundState.NOT_STARTED,
                                isHost: (typeof valueObj?.isHost === 'boolean' ? valueObj.isHost : false) as boolean
                            };
                        });
                    }

                    // Find hostId from players (player with isHost: true)
                    const hostPlayer = playersArray.find(p => p.isHost);
                    if (hostPlayer) {
                        detectedHostId = hostPlayer.id;
                        setHostId(detectedHostId);
                    }

                    // Update roomState with new members
                    setRoomState((prevState) => ({
                        players: playersArray,
                        meta: prevState.meta,
                        hostId: detectedHostId || prevState.hostId
                    }));
                });

                connectedRoom.onMessage(SocketEnum.START_GAME, (message: { state?: RoomState } | RoomState | unknown) => {
                    console.log("🚀 ~ START_GAME received:", message);

                    // Handle different message formats
                    let gameState: RoomState | undefined;
                    if (typeof message === 'object' && message !== null && 'state' in message) {
                        gameState = (message as { state: RoomState }).state;
                    } else if (typeof message === 'string' && Object.values(RoomState).includes(message as RoomState)) {
                        gameState = message as RoomState;
                    }

                    // If state is PLAYING, start the game
                    if (gameState === RoomState.PLAYING) {
                        setGameStarted(true);
                    }
                });

                // Handle profile update response if needed
                connectedRoom.onMessage(SocketEnum.UPDATE_PROFILE, (message: unknown) => {
                    console.log("🚀 ~ UPDATE_PROFILE response:", message);
                    // Profile update is handled via UPDATE_MEMBERS
                });

                // Handle SPIN event
                connectedRoom.onMessage(SocketEnum.SPIN, (message: { playerId: string } | unknown) => {
                    console.log("🚀 ~ SPIN received:", message);
                    
                    let playerId: string | undefined;
                    if (typeof message === 'object' && message !== null && 'playerId' in message) {
                        playerId = (message as { playerId: string }).playerId;
                    }
                    
                    if (playerId) {
                        setSpinningPlayerId(playerId);
                        setIsSpinning(true);
                        console.log("🚀 ~ Starting spin for player:", playerId);
                    }
                });

                // Listen to room state changes if available
                if (connectedRoom.state) {
                    // Handle initial state
                    const state = connectedRoom.state as ColyseusRoomState;
                    if (state.players && Array.isArray(state.players)) {
                        setRoomState({
                            players: state.players,
                            meta: state.meta || {},
                            hostId: state.hostId || ""
                        });
                    }

                    // Listen to state changes
                    connectedRoom.onStateChange((state: ColyseusRoomState) => {
                        if (state.players && Array.isArray(state.players)) {
                            setRoomState({
                                players: state.players,
                                meta: state.meta || {},
                                hostId: state.hostId || ""
                            });
                        }
                    });
                }

                // Setup error and leave handlers
                connectedRoom.onError((code, message) => {
                    console.error(`[client] Room error: ${code} - ${message}`);
                    setConnectionStatus("disconnected");
                });

                connectedRoom.onLeave((code) => {
                    console.log(`[client] Left room with code: ${code}`);
                    setConnectionStatus("disconnected");
                    setRoom(null);
                    roomRef.current = null;
                });

            } catch (err) {
                console.error(`[client] Failed to connect:`, err);
                if (isMounted) {
                    setConnectionStatus("disconnected");
                }
            }
        };

        initializeRoom();

        // Cleanup function
        return () => {
            isMounted = false;
            const currentRoom = roomRef.current;
            if (currentRoom) {
                console.log("[client] Cleaning up room connection");
                currentRoom.leave();
                roomRef.current = null;
                setRoom(null);
                setConnectionStatus("disconnected");
            }
        };
    }, [roomId, host]);

    // Callback implementations
    const handleStartGame = () => {
        if (room) {
            room.send(SocketEnum.START_GAME);
            console.log("🚀 ~ handleStartGame ~ START_GAME sent");
        }
    };

    const handleRestartGame = () => {
        if (room) {
            // Assuming there's a RESTART_GAME message type, or reuse START_GAME
            room.send(SocketEnum.START_GAME);
            console.log("🚀 ~ handleRestartGame ~ RESTART_GAME sent");
            setGameStarted(false);
            setTurnFinished(false);
            setSelected(null);
            setPromptChoice(null);
            setIsSpinning(false);
        }
    };

    const handleFinishTurn = () => {
        if (room) {
            // Send finish turn message if there's a specific enum for it
            // For now, you may need to add a new SocketEnum value
            console.log("🚀 ~ handleFinishTurn ~ Finish turn");
            setTurnFinished(true);
        }
    };

    const handleSpinComplete = () => {
        console.log("🚀 ~ Spin completed");
        setIsSpinning(false);
        // Keep spinningPlayerId for display purposes
    };

    const handleUpdateProfile = (profile: { name: string; avatar: string }) => {
        if (room) {
            room.send(SocketEnum.UPDATE_PROFILE, profile);
            console.log("🚀 ~ handleUpdateProfile ~ Profile sent:", profile);
        }
    };

    // Show loading state while connecting
    if (connectionStatus === "connecting") {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg">Đang kết nối...</p>
            </div>
        );
    }

    // Show error state if disconnected after attempting connection
    if (connectionStatus === "disconnected" && !room) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-red-500">Không thể kết nối đến server</p>
            </div>
        );
    }

    // Render based on whether user is host or client
    if (isHost) {
        return (
            <HostColyseusView
                roomState={roomState}
                me={me}
                selected={selected}
                promptChoice={promptChoice}
                promptCountdown={promptCountdown}
                isFinishEnabled={isFinishEnabled}
                gameStarted={gameStarted}
                choiceOption={choiceOption}
                roomUrl={roomUrl}
                isSpinning={isSpinning}
                turnFinished={turnFinished}
                spinningPlayerId={spinningPlayerId}
                onStartGame={handleStartGame}
                onRestartGame={handleRestartGame}
                onFinishTurn={handleFinishTurn}
                onSpinComplete={handleSpinComplete}
            />
        );
    } else {
        // Client view
        return (
            <ClientColyseusView
                roomState={roomState}
                me={me}
                gameStarted={gameStarted}
                onUpdateProfile={handleUpdateProfile}
                onStartGame={handleStartGame}
            />
        );
    }
};

export default PixiRoomPage;

