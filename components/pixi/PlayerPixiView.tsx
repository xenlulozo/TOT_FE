"use client";

import { Application, extend } from "@pixi/react";
import { Container as PixiContainer, Graphics as PixiGraphics, Text as PixiText } from "pixi.js";
import * as PIXI from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlayerViewProps } from "@/components/test/PlayerView";
import type { TotPromptType } from "@/types/socket";

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
];

const CARD_TONES = {
    truth: { base: 0x0f2e2a, stroke: 0x34d399 },
    trick: { base: 0x310f0f, stroke: 0xfb7185 },
};

const CanvasFrame = ({ children }: { children: React.ReactNode }) => (
    <div className="relative w-full rounded-[32px] border border-white/10 bg-slate-950 shadow-[0_20px_70px_rgba(0,0,0,0.45)] overflow-hidden">
        {children}
    </div>
);

const useCanvasSize = (ref: React.MutableRefObject<HTMLDivElement | null>) => {
    const [size, setSize] = useState({ width: 800, height: 520 });

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }

        const update = () => {
            const width = node.clientWidth;
            const height = Math.max(420, width * 0.55);
            setSize({ width, height });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => observer.disconnect();
    }, [ref]);

    return size;
};

type SelectableCardProps = {
    type: TotPromptType;
    title: string;
    content?: string;
    disabled: boolean;
    isChosen: boolean;
    onSelect: () => void;
    x: number;
    y: number;
};

const SelectableCard = ({ type, title, content, disabled, isChosen, onSelect, x, y }: SelectableCardProps) => {
    const tone = CARD_TONES[type];
    const width = 220;
    const height = 300;

    const draw = (g: PIXI.Graphics) => {
        g.clear();
        g.lineStyle(6, tone.stroke, isChosen ? 1 : 0.6);
        g.beginFill(tone.base, disabled ? 0.4 : 0.9);
        g.drawRoundedRect(-width / 2, -height / 2, width, height, 28);
        g.endFill();
    };

    return (
        <pixiContainer
            x={x}
            y={y}
            eventMode={disabled ? "none" : "static"}
            onPointerTap={() => {
                if (!disabled) {
                    onSelect();
                }
            }}
            cursor={disabled ? "not-allowed" : "pointer"}
            alpha={disabled ? 0.4 : 1}
        >
            <pixiGraphics draw={draw} />
            <pixiText
                text={title}
                anchor={0.5}
                position={{ x: 0, y: -height / 2 + 42 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#f1f5f9",
                        fontFamily: "Poppins",
                        fontSize: 26,
                        letterSpacing: 4,
                        fontWeight: "800",
                    })
                }
            />
            <pixiText
                text={content ?? (disabled ? "Chờ host..." : "Nhấn để chọn")}
                anchor={0.5}
                position={{ x: 0, y: 20 }}
                style={
                    new PIXI.TextStyle({
                        fill: "#f8fafc",
                        fontFamily: "Poppins",
                        fontSize: 18,
                        align: "center",
                        wordWrap: true,
                        wordWrapWidth: width - 48,
                    })
                }
            />
        </pixiContainer>
    );
};

type PixiButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    x: number;
    y: number;
    width?: number;
};

const PixiButton = ({ label, onClick, disabled, x, y, width = 260 }: PixiButtonProps) => {
    const height = 64;
    const draw = (g: PIXI.Graphics) => {
        g.clear();
        g.beginFill(disabled ? 0x475569 : 0x8b5cf6, 1);
        g.drawRoundedRect(-width / 2, -height / 2, width, height, 32);
        g.endFill();
    };

    return (
        <pixiContainer
            x={x}
            y={y}
            eventMode={disabled ? "none" : "static"}
            onPointerTap={() => {
                if (!disabled) {
                    onClick();
                }
            }}
            cursor={disabled ? "not-allowed" : "pointer"}
            alpha={disabled ? 0.6 : 1}
        >
            <pixiGraphics draw={draw} />
            <pixiText
                text={label}
                anchor={0.5}
                style={
                    new PIXI.TextStyle({
                        fill: "#ffffff",
                        fontFamily: "Poppins",
                        fontSize: 22,
                        fontWeight: "700",
                    })
                }
            />
        </pixiContainer>
    );
};

const PlayerPixiView = ({
    roomState,
    me,
    selected,
    promptChoice,
    promptCountdown,
    isFinishEnabled,
    onStartGame,
    onPromptChoice,
    onFinishTurn,
    onUpdateProfile,
    gameStarted,
    onRandomName,
}: PlayerViewProps) => {
    const otherPlayers = useMemo(() => roomState.players.filter((player) => player.id !== me.id), [roomState.players, me.id]);
    const isMeSelected = selected?.player.id === me.id;
    const promptOptions = selected?.promptOptions;
    const [nameInput, setNameInput] = useState(me.data?.name ?? "");
    const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
        const avatarId = typeof me.data?.avatar === "string" ? me.data.avatar : undefined;
        return avatarId && AVATAR_OPTIONS.some((option) => option.id === avatarId) ? avatarId : AVATAR_OPTIONS[0]?.id ?? "fox";
    });

    useEffect(() => {
        setNameInput(me.data?.name ?? "");
    }, [me.data?.name]);

    useEffect(() => {
        const avatarId = typeof me.data?.avatar === "string" ? me.data.avatar : undefined;
        if (avatarId && AVATAR_OPTIONS.some((option) => option.id === avatarId)) {
            setSelectedAvatar(avatarId);
        }
    }, [me.data?.avatar]);

    const trimmedName = nameInput.trim();
    const isNameDirty = trimmedName !== (me.data?.name ?? "");
    const isAvatarDirty = selectedAvatar !== (me.data?.avatar ?? AVATAR_OPTIONS[0]?.id);
    const isSubmitDisabled =
        me.isHost || (trimmedName.length === 0 && !isAvatarDirty) || trimmedName.length > 20 || (!isNameDirty && !isAvatarDirty);

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const stageSize = useCanvasSize(canvasRef);

    const handleSelectPrompt = (type: TotPromptType) => {
        if (!promptOptions?.[type] || !isMeSelected || promptChoice) {
            return;
        }
        onPromptChoice(type, promptOptions[type]!.content);
    };

    const handleSubmitProfile = () => {
        if (isSubmitDisabled) return;
        const data: { name?: string; avatar?: string } = {};
        if (isNameDirty) data.name = trimmedName;
        if (isAvatarDirty) data.avatar = selectedAvatar;
        onUpdateProfile(data);
    };

    return (
        <section className="flex flex-col gap-6 text-white">
            <CanvasFrame>
                <div ref={canvasRef} style={{ height: stageSize.height }}>
                    <Application
                        width={stageSize.width}
                        height={stageSize.height}
                        antialias
                        backgroundAlpha={0}
                        background={0x030712}
                    >
                        <pixiContainer x={stageSize.width / 2} y={80}>
                            <pixiText
                                text={isMeSelected ? "Đến lượt bạn!" : "Chờ host chọn người chơi"}
                                anchor={0.5}
                                style={
                                    new PIXI.TextStyle({
                                        fill: isMeSelected ? "#fcd34d" : "#94a3b8",
                                        fontFamily: "Poppins",
                                        fontSize: 28,
                                        fontWeight: "800",
                                    })
                                }
                            />
                        </pixiContainer>

                        <pixiContainer x={stageSize.width / 2} y={stageSize.height / 2}>
                            <SelectableCard
                                type="truth"
                                title="TRUTH"
                                content={
                                    promptChoice?.type === "truth"
                                        ? promptChoice.content
                                        : promptOptions?.truth?.content ?? undefined
                                }
                                disabled={!isMeSelected || !!promptChoice || !promptOptions?.truth}
                                isChosen={promptChoice?.type === "truth"}
                                onSelect={() => handleSelectPrompt("truth")}
                                x={-150}
                                y={0}
                            />
                            <SelectableCard
                                type="trick"
                                title="TRICK"
                                content={
                                    promptChoice?.type === "trick"
                                        ? promptChoice.content
                                        : promptOptions?.trick?.content ?? undefined
                                }
                                disabled={!isMeSelected || !!promptChoice || !promptOptions?.trick}
                                isChosen={promptChoice?.type === "trick"}
                                onSelect={() => handleSelectPrompt("trick")}
                                x={150}
                                y={0}
                            />
                        </pixiContainer>

                        <pixiContainer x={stageSize.width / 2} y={stageSize.height - 100}>
                            <PixiButton
                                label={gameStarted ? "Kết thúc lượt" : "Bắt đầu trò chơi"}
                                onClick={gameStarted ? onFinishTurn : onStartGame}
                                disabled={gameStarted ? !isMeSelected || !isFinishEnabled : false}
                                x={0}
                                y={0}
                            />
                            {typeof promptCountdown === "number" ? (
                                <pixiText
                                    text={`Có thể kết thúc sau ${promptCountdown}s`}
                                    anchor={0.5}
                                    position={{ x: 0, y: 60 }}
                                    style={
                                        new PIXI.TextStyle({
                                            fill: "#fde68a",
                                            fontFamily: "Poppins",
                                            fontSize: 18,
                                        })
                                    }
                                />
                            ) : null}
                        </pixiContainer>
                    </Application>
                </div>
            </CanvasFrame>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.4em] text-white/50">Danh tính</p>
                            <p className="text-2xl font-bold">{me.data?.name ?? "Player"}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const random = onRandomName();
                                setNameInput(random);
                            }}
                            className="rounded-2xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                        >
                            🎲 Random
                        </button>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-[0.3em] text-white/40">Tên hiển thị</label>
                        <input
                            type="text"
                            value={nameInput}
                            maxLength={20}
                            onChange={(event) => setNameInput(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-purple-400"
                            placeholder="Nhập tên của bạn"
                        />
                        <p className="text-right text-xs text-white/40 mt-1">
                            {trimmedName.length} / 20
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Avatar</p>
                        <div className="grid grid-cols-5 gap-2">
                            {AVATAR_OPTIONS.map((option) => {
                                const isSelected = option.id === selectedAvatar;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setSelectedAvatar(option.id)}
                                        className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-xs transition ${
                                            isSelected
                                                ? "border-purple-400 bg-purple-400/20 text-white"
                                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                                        }`}
                                    >
                                        <span className="text-2xl">{option.emoji}</span>
                                        <span className="mt-1 font-semibold">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmitProfile}
                        disabled={isSubmitDisabled}
                        className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                            isSubmitDisabled
                                ? "bg-white/10 text-white/40 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30"
                        }`}
                    >
                        Cập nhật profile
                    </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                        Người trong phòng
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{otherPlayers.length + 1}</span>
                    </h3>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                        {[me, ...otherPlayers].map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                                    player.id === me.id ? "border-purple-400 bg-purple-400/10" : "border-white/10 bg-white/5"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">
                                        {AVATAR_OPTIONS.find((option) => option.id === player.data?.avatar)?.emoji ?? "🎮"}
                                    </span>
                                    <div>
                                        <p className="font-semibold">{player.data?.name ?? "Player"}</p>
                                        <p className="text-xs text-white/50 break-all">{player.id}</p>
                                    </div>
                                </div>
                                {player.id === me.id ? (
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-widest">
                                        You
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlayerPixiView;

