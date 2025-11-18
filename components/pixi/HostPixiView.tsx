"use client";

import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Application, extend } from "@pixi/react";
import { Container as PixiContainer, Graphics as PixiGraphics, Text as PixiText } from "pixi.js";
import * as PIXI from "pixi.js";

extend({
    Container: PixiContainer,
    Graphics: PixiGraphics,
    Text: PixiText,
});
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MutableRefObject,
    type PropsWithChildren,
} from "react";
import type { HostViewProps } from "@/components/test/HostView";
import type { PlayerInfo, PlayerSelectedPayload } from "@/types/socket";

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
    lemon: "🍋",
};

const SEGMENT_COLORS = [
    0xff8fab, 0xffc77f, 0xc8ff8f, 0x8fffe0, 0x8fc7ff, 0xb18fff, 0xff8ff0, 0xffa9a3, 0xffd28f, 0xa3ff8f,
];

const CARD_COLORS = {
    truth: { base: 0x14312f, stroke: 0x4ade80 },
    trick: { base: 0x321417, stroke: 0xf97316 },
};

const hasLegacyName = (
    player: PlayerInfo | PlayerSelectedPayload["player"],
): player is PlayerSelectedPayload["player"] => "name" in player && typeof player.name === "string";

const getPlayerDisplayName = (player: PlayerInfo | PlayerSelectedPayload["player"]) => {
    const dataName = player.data?.name;
    if (typeof dataName === "string" && dataName.trim().length > 0) {
        return dataName;
    }

    if (hasLegacyName(player) && player.name?.length) {
        return player.name;
    }

    return "Player";
};

type WheelProps = {
    players: PlayerInfo[];
    rotation: number;
    highlightId?: string | null;
    radius: number;
};

type CardProps = {
    title: string;
    content?: string;
    isActive: boolean;
    reveal: boolean;
    position: { x: number; y: number };
    tone: typeof CARD_COLORS.truth;
};

const PixiWheel = ({ players, rotation, highlightId, radius }: WheelProps) => {
    const sliceAngle = players.length > 0 ? (Math.PI * 2) / players.length : Math.PI * 2;
    const labelStyle = useMemo(
        () =>
            new PIXI.TextStyle({
                fill: "#f4f7ff",
                fontFamily: "Poppins",
                fontSize: 20,
                fontWeight: "700",
                align: "center",
                wordWrap: true,
                wordWrapWidth: radius * 0.5,
            }),
        [radius],
    );

    return (
        <pixiContainer rotation={rotation}>
            {players.map((player, index) => {
                const start = index * sliceAngle;
                const end = start + sliceAngle;
                const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
                const isHighlighted = highlightId === player.id;

                const draw = (g: PIXI.Graphics) => {
                    g.clear();
                    g.beginFill(color, isHighlighted ? 0.95 : 0.7);
                    g.moveTo(0, 0);
                    g.arc(0, 0, radius, start, end);
                    g.lineTo(0, 0);
                    g.endFill();

                    if (isHighlighted) {
                        g.lineStyle(6, 0xffffff, 0.8);
                        g.arc(0, 0, radius, start, end);
                    }
                };

                const middle = start + sliceAngle / 2;
                const textPosition = {
                    x: Math.cos(middle) * radius * 0.68,
                    y: Math.sin(middle) * radius * 0.68,
                };

                return (
                    <pixiContainer key={player.id}>
                        <pixiGraphics draw={draw} />
                        <pixiText
                            text={getPlayerDisplayName(player)}
                            anchor={0.5}
                            position={textPosition}
                            rotation={middle + Math.PI / 2}
                            style={labelStyle}
                        />
                    </pixiContainer>
                );
            })}

            {/* center hub */}
            <pixiGraphics
                draw={(g: PIXI.Graphics) => {
                    g.clear();
                    g.beginFill(0x0f172a, 1);
                    g.drawCircle(0, 0, 60);
                    g.endFill();
                    g.lineStyle(6, 0xffffff, 0.6);
                    g.drawCircle(0, 0, 60);
                }}
            />
            <pixiText
                text="TOT"
                anchor={0.5}
                position={{ x: 0, y: 0 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#ffffff",
                        fontFamily: "Poppins",
                        fontSize: 32,
                        fontWeight: "800",
                    })
                }
            />

            {/* pointer */}
            <pixiGraphics
                draw={(g: PIXI.Graphics) => {
                    g.clear();
                    g.beginFill(0xfff685, 1);
                    g.moveTo(-20, -radius - 10);
                    g.lineTo(20, -radius - 10);
                    g.lineTo(0, -radius - 70);
                    g.endFill();
                    g.lineStyle(4, 0x1f2937, 0.8);
                    g.moveTo(-20, -radius - 10);
                    g.lineTo(20, -radius - 10);
                    g.lineTo(0, -radius - 70);
                    g.lineTo(-20, -radius - 10);
                }}
            />
        </pixiContainer>
    );
};

const PixiCard = ({ title, content, isActive, reveal, position, tone }: CardProps) => {
    const cardWidth = 240;
    const cardHeight = 320;
    const drawCard = useCallback(
        (g: PIXI.Graphics) => {
            g.clear();
            g.lineStyle(6, tone.stroke, isActive ? 1 : 0.7);
            g.beginFill(tone.base, reveal ? 0.95 : 0.6);
            g.drawRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
            g.endFill();
        },
        [tone.base, tone.stroke, isActive, reveal, cardWidth, cardHeight],
    );

    return (
        <pixiContainer x={position.x} y={position.y}>
            <pixiGraphics draw={drawCard} />
            <pixiText
                text={title}
                anchor={0.5}
                position={{ x: 0, y: -cardHeight / 2 + 40 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#f8fafc",
                        fontFamily: "Poppins",
                        fontWeight: "800",
                        fontSize: 26,
                        letterSpacing: 2,
                    })
                }
            />
            {reveal ? (
            <pixiText
                    text={content ?? "Đang chờ người chơi lựa chọn..."}
                    anchor={0.5}
                    position={{ x: 0, y: 20 }}
                    style={
                        new PIXI.TextStyle({
                            fill: "#f1f5f9",
                            fontFamily: "Poppins",
                            fontSize: 20,
                            wordWrap: true,
                            wordWrapWidth: cardWidth - 48,
                            align: "center",
                        })
                    }
                />
            ) : (
            <pixiText
                    text="?"
                    anchor={0.5}
                    position={{ x: 0, y: 20 }}
                    style={
                        new PIXI.TextStyle({
                            fill: "#ffffff",
                            fontFamily: "Poppins",
                            fontSize: 72,
                            fontWeight: "900",
                        })
                    }
                />
            )}
        </pixiContainer>
    );
};

const CanvasFrame = ({ children }: PropsWithChildren) => (
    <div className="relative w-full rounded-[36px] border border-neutral-800/60 bg-neutral-950 shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden">
        {children}
    </div>
);

const useResizeObserver = (
    ref: MutableRefObject<HTMLDivElement | null>,
    fallback: { width: number; height: number },
) => {
    const [size, setSize] = useState(fallback);

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }

        const update = () => {
            const width = node.clientWidth;
            const height = Math.max(420, width * 0.6);
            setSize({ width, height });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => observer.disconnect();
    }, [ref]);

    return size;
};

const HostPixiView = ({
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
    onStartGame,
    onRestartGame,
    onFinishTurn,
}: HostViewProps) => {
    const participants = useMemo(() => {
        return roomState.players.filter((player) => {
            if (player.id === me.id) return false;
            const status = player.data?.status as string | undefined;
            return status !== "completed";
        });
    }, [roomState.players, me.id]);

    const completedPlayers = useMemo(() => {
        return roomState.players.filter((player) => {
            if (player.id === me.id) return false;
            const status = player.data?.status as string | undefined;
            return status === "completed";
        });
    }, [roomState.players, me.id]);

    const activePlayer = selected?.player ?? null;
    const truthOption = selected?.promptOptions?.truth;
    const trickOption = selected?.promptOptions?.trick;
    const hasCards = Boolean(activePlayer && (truthOption || trickOption));
    const showWheel = isSpinning || !hasCards;
    const showCards = !isSpinning && hasCards && !turnFinished;

    const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);
    const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hidePopupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasShownPopupRef = useRef<string | null>(null);

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const stageSize = useResizeObserver(canvasRef, { width: 960, height: 540 });
    const roomCode = useMemo(() => {
        if (!roomUrl) {
            return "—";
        }
        const parts = roomUrl.split("/");
        const last = parts[parts.length - 1];
        return last && last.length > 0 ? last : "—";
    }, [roomUrl]);

    const [wheelRotation, setWheelRotation] = useState(0);
    const animationRef = useRef<number | null>(null);
    const rotationStart = useRef(0);
    const rotationTarget = useRef(0);
    const rotationStartTime = useRef<number | null>(null);

    useEffect(() => {
        if (!isSpinning || !activePlayer || participants.length === 0) {
            if (!isSpinning && activePlayer) {
                const idx = participants.findIndex((p) => p.id === activePlayer.id);
                if (idx !== -1) {
                    const slice = (Math.PI * 2) / participants.length;
                    const pointerAngle = -Math.PI / 2;
                    const desired = pointerAngle - (idx + 0.5) * slice;
                    setWheelRotation(desired);
                }
            }

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const participantSnapshot = [...participants];
        const targetIndex = participantSnapshot.findIndex((player) => player.id === activePlayer.id);
        if (targetIndex === -1) {
            return;
        }

        const slice = (Math.PI * 2) / participantSnapshot.length;
        const pointerAngle = -Math.PI / 2;
        const desiredAngle = pointerAngle - (targetIndex + 0.5) * slice;
        const extraTurns = Math.PI * 4;

        rotationStart.current = wheelRotation;
        rotationTarget.current = desiredAngle + extraTurns;
        rotationStartTime.current = null;

        const animate = (timestamp: number) => {
            if (!rotationStartTime.current) rotationStartTime.current = timestamp;
            const progress = Math.min((timestamp - rotationStartTime.current) / 7000, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValue = rotationStart.current + (rotationTarget.current - rotationStart.current) * eased;
            setWheelRotation(nextValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [isSpinning, activePlayer?.id, participants, wheelRotation]);

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

        if (!isSpinning || popupTimerRef.current || hasShownPopupRef.current === activePlayer.id) {
            return;
        }

        popupTimerRef.current = setTimeout(() => {
            setShowCelebrationPopup(true);
            popupTimerRef.current = null;
            hasShownPopupRef.current = activePlayer.id;
        }, 7000);

        hidePopupTimerRef.current = setTimeout(() => {
            setShowCelebrationPopup(false);
            hidePopupTimerRef.current = null;
        }, 10000);

        return () => {
            if (popupTimerRef.current) {
                clearTimeout(popupTimerRef.current);
                popupTimerRef.current = null;
            }
            if (hidePopupTimerRef.current) {
                clearTimeout(hidePopupTimerRef.current);
                hidePopupTimerRef.current = null;
            }
        };
    }, [activePlayer, isSpinning]);

    useEffect(() => {
        if (turnFinished) {
            setShowCelebrationPopup(false);
            hasShownPopupRef.current = null;
        }
    }, [turnFinished]);

    const renderAvatar = (player: PlayerInfo) => {
        const avatarId = player.data?.avatar as string | undefined;
        const emoji = avatarId ? AVATAR_EMOJI[avatarId] : undefined;
        const displayName = getPlayerDisplayName(player);

        return (
            <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-2xl">
                    {emoji ?? (displayName ? displayName[0]?.toUpperCase() : "P")}
                </div>
                <div>
                    <p className="font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-white/60 break-all">{player.id}</p>
                </div>
            </div>
        );
    };

    const CelebrationOverlay = ({ player }: { player: PlayerInfo }) => (
        <AnimatePresence>
            {showCelebrationPopup ? (
                <motion.div
                    key="pixi-celebration"
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="rounded-3xl border border-amber-200/40 bg-slate-900/80 p-10 text-center shadow-[0_0_60px_rgba(234,179,8,0.25)]"
                        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                    >
                        <motion.div
                            className="text-6xl mb-4"
                            animate={{ scale: [1, 1.2], rotate: [0, 8] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                            🎉
                        </motion.div>
                        <p className="text-lg uppercase tracking-[0.5em] text-amber-200">Winner</p>
                        <p className="text-4xl font-black text-white mt-2">{getPlayerDisplayName(player)}</p>
                        <p className="text-sm text-white/70 mt-4">Chuẩn bị cho thử thách tiếp theo!</p>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );

    return (
        <section className="flex flex-col gap-6 text-white">
            <div className="grid gap-6 lg:grid-cols-[2.2fr,0.8fr]">
                <CanvasFrame>
                    <div ref={canvasRef} style={{ height: stageSize.height }}>
                        <Application
                            width={stageSize.width}
                            height={stageSize.height}
                            antialias
                            backgroundAlpha={0}
                            background={0x05060a}
                        >
                            <pixiContainer x={stageSize.width * 0.32} y={stageSize.height / 2}>
                                {showWheel && (
                                    <PixiWheel
                                        players={participants}
                                        rotation={wheelRotation}
                                        highlightId={isSpinning ? activePlayer?.id ?? null : null}
                                        radius={Math.min(stageSize.height, stageSize.width) * 0.28}
                                    />
                                )}
                            </pixiContainer>

                            <pixiContainer x={stageSize.width * 0.72} y={stageSize.height / 2} alpha={showCards ? 1 : 0.08}>
                                <PixiCard
                                    title="TRUTH"
                                    content={
                                        promptChoice?.type === "truth"
                                            ? promptChoice.content
                                            : truthOption?.content ?? undefined
                                    }
                                    isActive={choiceOption === "truth"}
                                    reveal={showCards && choiceOption === "truth"}
                                    position={{ x: -140, y: 0 }}
                                    tone={CARD_COLORS.truth}
                                />
                                <PixiCard
                                    title="TRICK"
                                    content={
                                        promptChoice?.type === "trick"
                                            ? promptChoice.content
                                            : trickOption?.content ?? undefined
                                    }
                                    isActive={choiceOption === "trick"}
                                    reveal={showCards && choiceOption === "trick"}
                                    position={{ x: 140, y: 0 }}
                                    tone={CARD_COLORS.trick}
                                />
                            </pixiContainer>

                            {activePlayer ? (
                                <pixiContainer x={stageSize.width * 0.32} y={80}>
                                    <pixiText
                                        text={`Người chơi: ${getPlayerDisplayName(activePlayer)}`}
                                        anchor={0.5}
                                        style={
                                            new PIXI.TextStyle({
                                                fill: "#c7d2fe",
                                                fontFamily: "Poppins",
                                                fontSize: 28,
                                                fontWeight: "700",
                                            })
                                        }
                                    />
                                </pixiContainer>
                            ) : null}
                        </Application>
                        {activePlayer ? <CelebrationOverlay player={activePlayer} /> : null}
                    </div>
                </CanvasFrame>

                <div className="flex flex-col gap-6">
                    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Phòng</p>
                        <p className="text-3xl font-black">{roomCode}</p>
                        <p className="text-xs text-white/60 mt-2 break-all">{roomUrl}</p>
                        {!gameStarted ? (
                            <button
                                type="button"
                                onClick={onStartGame}
                                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-center font-semibold shadow-lg shadow-fuchsia-500/40 transition hover:scale-[1.01]"
                            >
                                Bắt đầu game (Pixi)
                            </button>
                        ) : (
                            <div className="mt-4 grid gap-3">
                                <button
                                    type="button"
                                    onClick={onFinishTurn}
                                    disabled={!isFinishEnabled}
                                    className={`rounded-2xl px-4 py-3 font-semibold transition ${
                                        isFinishEnabled
                                            ? "bg-emerald-500 text-white hover:bg-emerald-400"
                                            : "bg-white/10 text-white/50 cursor-not-allowed"
                                    }`}
                                >
                                    Kết thúc lượt hiện tại
                                </button>
                                <button
                                    type="button"
                                    onClick={onRestartGame}
                                    className="rounded-2xl border border-white/20 px-4 py-3 font-semibold text-white/80 hover:bg-white/10"
                                >
                                    Restart vòng chơi
                                </button>
                            </div>
                        )}
                    </div>

                    {roomUrl ? (
                        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-center">
                            <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-3">QR</p>
                            <div className="mx-auto inline-flex rounded-2xl border border-white/10 bg-white p-3 shadow-inner">
                                <QRCodeSVG value={roomUrl} size={180} level="Q" />
                            </div>
                            <p className="text-xs text-white/60 mt-3">Quét để tham gia phiên bản Pixi</p>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                        Người chơi đang quay
                        <span className="text-xs rounded-full bg-white/10 px-3 py-1">{participants.length}</span>
                    </h3>
                    {participants.length === 0 ? (
                        <p className="text-sm text-white/60">Chưa có người chơi nào.</p>
                    ) : (
                        <div className="space-y-3">
                            {participants.map((player) => (
                                <div
                                    key={player.id}
                                    className={`rounded-2xl border px-3 py-2 transition ${
                                        player.id === activePlayer?.id
                                            ? "border-emerald-400 bg-emerald-400/10 shadow-inner shadow-emerald-400/20"
                                            : "border-white/10 bg-white/5"
                                    }`}
                                >
                                    {renderAvatar(player)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                        Đã hoàn thành
                        <span className="text-xs rounded-full bg-white/10 px-3 py-1">{completedPlayers.length}</span>
                    </h3>
                    {completedPlayers.length === 0 ? (
                        <p className="text-sm text-white/60">Chưa có ai hoàn thành lượt.</p>
                    ) : (
                        <div className="space-y-3 opacity-70">
                            {completedPlayers.map((player) => (
                                <div key={player.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                                    {renderAvatar(player)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HostPixiView;

