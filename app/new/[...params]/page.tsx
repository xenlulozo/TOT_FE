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
import { IPlayerSelectedPayload } from "@/components/colyseus/interface/game.interface";

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
    const [selected, setSelected] = useState<IPlayerSelectedPayload | null>(null);
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
    const [selectedPlayer, setSelectedPlayer] = useState<IPlayerSelectedPayload | null>(null);
    const [showPromptSelection, setShowPromptSelection] = useState<boolean>(false);
    const [showSelectedPlayerPopup, setShowSelectedPlayerPopup] = useState<boolean>(false);
    const [selectedPrompt, setSelectedPrompt] = useState<"truth" | "trick" | null>(null);
    const [promptContent, setPromptContent] = useState<string | null>(null);
    const [showTurnCountdown, setShowTurnCountdown] = useState<boolean>(false);
    const [gameEnded, setGameEnded] = useState<boolean>(false);

    // Ref to store room for cleanup
    const roomRef = useRef<Room | null>(null);

    // Debug selectedPlayer changes
    // useEffect(() => {
    //     console.log("🎯 selectedPlayer STATE CHANGED:", selectedPlayer);
    //     console.log("🎯 selectedPlayer.player:", selectedPlayer?.player);
    //     console.log("🎯 selectedPlayer.player.id:", selectedPlayer?.player?.id);
    // }, [selectedPlayer]);

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

                // Handle PLAYER_SELECTED event - provides player data for prompt selection
                connectedRoom.onMessage(SocketEnum.PLAYER_SELECTED, (message: IPlayerSelectedPayload ) => {
                    console.log("🚀 ~ PLAYER_SELECTED received:", message ,typeof message);

                    if (typeof message === 'object' && message !== null) {
                        const payload = message as IPlayerSelectedPayload;
                        // console.log("🚀 ~ PLAYER_SELECTED ~ payload received:", payload);
                        // console.log("🚀 ~ PLAYER_SELECTED ~ payload.player:", payload.player);
                        console.log("🚀 ~ PLAYER_SELECTED ~ setting selectedPlayer...");

                        setSelectedPlayer(payload); // Store player data
                        setShowSelectedPlayerPopup(true); // Show the popup

                        // Log after state update (useEffect will handle this)
                        // setTimeout(() => {
                        //     console.log("🚀 ~ PLAYER_SELECTED ~ selectedPlayer state should be updated now");
                        //     console.log("🚀 ~ initializeRoom ~ setSelectedPlayer:", selectedPlayer)
                        // }, 100);
                    }
                });

                // Handle PICK_PROMPT event - signal to show prompt selection UI
                connectedRoom.onMessage(SocketEnum.PICK_PROMPT, (message: unknown) => {
                    console.log("🚀 ~ PICK_PROMPT received:", message);
                    console.log("🚀 ~ Current state - selectedPlayer:", selectedPlayer, "showPromptSelection:", showPromptSelection);

                    // PICK_PROMPT is just a signal to show the prompt selection UI
                    // It can arrive before or after PLAYER_SELECTED
                    setShowPromptSelection(true);
                    setSelectedPrompt(null); // Reset prompt selection
                    console.log("🚀 ~ After PICK_PROMPT - showPromptSelection set to true, popup should show");
                });

                // Handle TRUTH_PROMPT_SELECTED event
                connectedRoom.onMessage(SocketEnum.TRUTH_PROMPT_SELECTED, (message: { playerId: string; content?: string; prompt?: unknown } | unknown) => {
                    console.log("🚀 ~ TRUTH_PROMPT_SELECTED received:", message);

                    if (typeof message === 'object' && message !== null) {
                        const payload = message as { playerId: string; content?: string; prompt?: unknown };
                        setSelectedPrompt("truth");
                        setPromptContent(payload.content || null);
                        // Don't hide prompt selection - wait for END_TURN event
                        console.log("🚀 ~ Truth prompt selected with content:", payload.content);
                    }
                });

                // Handle TRICK_PROMPT_SELECTED event
                connectedRoom.onMessage(SocketEnum.TRICK_PROMPT_SELECTED, (message: { playerId: string; content?: string; prompt?: unknown } | unknown) => {
                    console.log("🚀 ~ TRICK_PROMPT_SELECTED received:", message);

                    if (typeof message === 'object' && message !== null) {
                        const payload = message as { playerId: string; content?: string; prompt?: unknown };
                        setSelectedPrompt("trick");
                        setPromptContent(payload.content || null);
                        // Don't hide prompt selection - wait for END_TURN event
                        console.log("🚀 ~ Trick prompt selected with content:", payload.content);
                    }
                });

                // Handle END_TURN event - reset states for next turn
                connectedRoom.onMessage(SocketEnum.END_TURN, (message: unknown) => {
                    console.log("🚀 ~ END_TURN received:", message);
                    console.log("🚀 ~ END_TURN - selectedPlayer before reset:", selectedPlayer);
                    console.log("🚀 ~ Before END_TURN - showPromptSelection:", showPromptSelection);

                    // Reset all states and close popup when END_TURN is received from server
                    setSelectedPrompt(null);
                    setPromptContent(null); // Clear prompt content
                    setSelectedPlayer(null); // Clear selected player
                    setShowSelectedPlayerPopup(false); // Hide selected player popup
                    setShowPromptSelection(false); // Close the prompt selection popup
                    console.log("🚀 ~ END_TURN received from server - popup closed and states reset");
                });

                // Handle HIDE_PLAYER_SELECTED_POPUP event - hide selected player popup
                connectedRoom.onMessage(SocketEnum.HIDE_PLAYER_SELECTED_POPUP, (message: unknown) => {
                    console.log("🚀 ~ HIDE_PLAYER_SELECTED_POPUP received:", message);
                    console.log("🚀 ~ Hiding selected player popup");

                    // Hide selected player popup without affecting selectedPlayer state
                    setShowSelectedPlayerPopup(false);

                    console.log("🚀 ~ Selected player popup hidden");
                });

                // Handle END_GAME event - signal game has ended
                connectedRoom.onMessage(SocketEnum.END_GAME, (message: unknown) => {
                    console.log("🚀 ~ END_GAME received:", message);
                    setGameEnded(true);
                    console.log("🚀 ~ Game ended, showing restart button for clients");
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
            setGameEnded(false); // Reset game ended state
            setTurnFinished(false);
            setSelected(null);
            setPromptChoice(null);
            setIsSpinning(false);
        }
    };

    const handleClientRestartGame = () => {
        if (room) {
            // Client requests to restart game
            room.send(SocketEnum.PLAY_AGAIN);
            console.log("🚀 ~ handleClientRestartGame ~ Client requested game restart");
            // Reset game states for client
            setGameEnded(false);
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

    const handlePromptSelected = (promptType: "truth" | "trick") => {
        console.log("🎯 page.tsx: handlePromptSelected called with", promptType);
        console.log("🔍 page.tsx: room exists?", !!room);
        console.log("🔍 page.tsx: selectedPlayer exists?", !!selectedPlayer);
        console.log("🔍 page.tsx: selectedPlayer data:", selectedPlayer);

        // Always try to send the event, even if selectedPlayer is not available yet
        // The server should handle this case
        if (room) {
            const eventType = promptType === "truth" ? SocketEnum.TRUTH_PROMPT_SELECTED : SocketEnum.TRICK_PROMPT_SELECTED;
            console.log(`📤 page.tsx: Sending ${eventType} with playerId:`, selectedPlayer?.player?.id || "unknown");

            // Send with playerId if available, otherwise just send the event type
            if (selectedPlayer?.player?.id) {
                room.send(eventType, { playerId: selectedPlayer.player.id });
                console.log(`🚀 ~ handlePromptSelected ~ ${eventType} sent for player:`, selectedPlayer.player.name);
            } else {
                // Fallback: send without playerId - server should know which player this is
                room.send(eventType);
                console.log(`🚀 ~ handlePromptSelected ~ ${eventType} sent (no playerId available yet)`);
            }
        } else {
            console.log("❌ page.tsx: Cannot send event - room not available");
        }
    };

    const handleEndTurn = () => {
        if (room) {
            room.send(SocketEnum.END_TURN);
            console.log("🚀 ~ handleEndTurn ~ END_TURN sent");

            // Trigger countdown for next turn (for host view)
            setShowTurnCountdown(true);
        }
    };

    const handleTurnCountdownComplete = () => {
        setShowTurnCountdown(false);
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
                selectedPlayer={selectedPlayer}
                onStartGame={handleStartGame}
                onRestartGame={handleRestartGame}
                onFinishTurn={handleFinishTurn}
                onSpinComplete={handleSpinComplete}
                onSelectedPlayerClose={() => {
                    console.log("🎯 HOST onSelectedPlayerClose triggered - setting selectedPlayer to null");
                    setSelectedPlayer(null);
                }}
                showPromptSelection={showPromptSelection}
                selectedPrompt={selectedPrompt}
                promptContent={promptContent}
                showTurnCountdown={showTurnCountdown}
                onTurnCountdownComplete={handleTurnCountdownComplete}
                onPromptSelected={handlePromptSelected}
                gameEnded={gameEnded}
            />
        );
    } else {
        // Client view
        return (
            <ClientColyseusView
                roomState={roomState}
                me={me}
                gameStarted={gameStarted}
                gameEnded={gameEnded}
                selectedPlayer={selectedPlayer}
                showSelectedPlayerPopup={showSelectedPlayerPopup}
                showPromptSelection={showPromptSelection}
                promptContent={promptContent}
                onUpdateProfile={handleUpdateProfile}
                onStartGame={handleStartGame}
                onRestartGame={handleClientRestartGame}
                onSelectedPlayerClose={() => {
                    console.log("🎯 CLIENT onSelectedPlayerClose triggered - hiding selected player popup");
                    setShowSelectedPlayerPopup(false);
                }}
                onPromptSelected={handlePromptSelected}
                onEndTurn={handleEndTurn}
            />
        );
    }
};

export default PixiRoomPage;

