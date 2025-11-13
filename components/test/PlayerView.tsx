import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PlayerInfo, PlayerSelectedPayload, RoomStatePayload, TotPromptType } from "@/types/socket";

const AVATAR_OPTIONS = [
    { id: "fox", emoji: "🦊", label: "Cáo tinh ranh" },
    { id: "bear", emoji: "🐻", label: "Gấu ấm áp" },
    { id: "tiger", emoji: "🐯", label: "Hổ mạnh mẽ" },
    { id: "panda", emoji: "🐼", label: "Gấu trúc đáng yêu" },
    { id: "koala", emoji: "🐨", label: "Gấu koala chill" },
    { id: "monkey", emoji: "🐵", label: "Khỉ vui nhộn" },
    { id: "unicorn", emoji: "🦄", label: "Kỳ lân huyền ảo" },
];

export type PlayerViewProps = {
    roomState: RoomStatePayload;
    me: PlayerInfo;
    selected: PlayerSelectedPayload | null;
    promptChoice: { type: TotPromptType; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    onStartGame: () => void;
    onPromptChoice: (type: TotPromptType, content: string) => void;
    onFinishTurn: () => void;
    onUpdateProfile: (profile: { name?: string; avatar?: string }) => void;
    gameStarted: boolean;
};

const PlayerView = (props: PlayerViewProps) => {
    const {
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
    } = props;
    const otherPlayers = useMemo(
        () => roomState.players.filter((player) => player.id !== roomState.hostId),
        [roomState.players, roomState.hostId],
    );
    const isMeSelected = selected?.player.id === me.id;
    const promptOptions = selected?.promptOptions;
    const [nameInput, setNameInput] = useState(me.data?.name ?? "");
    const initialAvatar = useMemo<string>(() => {
        const avatarId = typeof me.data?.avatar === "string" ? me.data.avatar : undefined;
        if (avatarId && AVATAR_OPTIONS.some((option) => option.id === avatarId)) {
            return avatarId;
        }
        return AVATAR_OPTIONS[0]?.id ?? "fox";
    }, [me.data?.avatar]);
    const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatar);

    useEffect(() => {
        setNameInput(me.data?.name ?? "");
    }, [me.data?.name]);

    useEffect(() => {
        setSelectedAvatar(initialAvatar);
    }, [initialAvatar]);

    const trimmedName = nameInput.trim();
    const isNameDirty = trimmedName !== (me.data?.name ?? "");
    const isAvatarDirty = selectedAvatar !== initialAvatar;
    const isSubmitDisabled =
        me.isHost || (trimmedName.length === 0 && !isAvatarDirty) || trimmedName.length > 20 || (!isNameDirty && !isAvatarDirty);

    return (
        <section className="flex-1 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-purple-500/10 via-transparent to-blue-500/10 p-6 md:p-10 shadow-xl space-y-6">
            <header className="mb-6 text-center md:text-left">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-purple-500">Mobile Lobby</p>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2">
                            Hey {me.data?.name ?? "Player"} 👋 Ready to play?
                        </h2>
                        <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                            Stay tuned for the host to kick things off. We&apos;ll highlight you when it&apos;s your turn.
                        </p>
                    </div>
                    {!gameStarted ? (
                    <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
                        onClick={onStartGame}
                    >
                        Bắt đầu game
                    </button>
                    ) : null}
                </div>
                {!me.isHost && !gameStarted ? (
                    <form
                        className="mt-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
                        onSubmit={(event: FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            if (isSubmitDisabled) {
                                return;
                            }
                            const updates: { name?: string; avatar?: string } = {};
                            if (isNameDirty) {
                                updates.name = trimmedName;
                            }
                            if (isAvatarDirty) {
                                updates.avatar = selectedAvatar;
                            }
                            onUpdateProfile(updates);
                        }}
                    >
                        <div className="flex-1 flex items-center gap-3">
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(event) => {
                                    const next = event.target.value;
                                    if (next.length <= 20) {
                                        setNameInput(next);
                                    }
                                }}
                                maxLength={20}
                                className="w-full rounded-xl border border-purple-200 dark:border-purple-700/60 bg-white/80 dark:bg-neutral-900/80 px-4 py-3 text-base text-neutral-800 dark:text-neutral-100 shadow-inner focus:border-purple-500 focus:ring-2 focus:ring-purple-400 transition"
                                placeholder="Nhập tên của bạn (tối đa 20 ký tự)"
                            />
                            <span className="text-xs text-neutral-500">
                                {trimmedName.length}/{20}
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            {AVATAR_OPTIONS.map((option) => {
                                const isSelected = option.id === selectedAvatar;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-2 transition w-16 sm:w-20 ${
                                            isSelected
                                                ? "border-purple-500 bg-purple-50 text-purple-600 shadow-lg"
                                                : "border-transparent bg-white/70 text-neutral-700 hover:border-purple-300 hover:bg-purple-50"
                                        }`}
                                        onClick={() => setSelectedAvatar(option.id)}
                                        title={option.label}
                                    >
                                        <span className="text-3xl leading-none">{option.emoji}</span>
                                        <span className="mt-1 text-[10px] uppercase tracking-wide font-semibold">
                                            {option.label.split(" ")[0]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="submit"
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                                isSubmitDisabled
                                    ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                            }`}
                            disabled={isSubmitDisabled}
                        >
                            Cập nhật
                        </button>
                    </form>
                ) : null}
            </header>

            <section className="rounded-2xl border border-purple-200 dark:border-purple-700/60 bg-white dark:bg-neutral-900 p-6 shadow-inner">
                <h3 className="text-xl font-semibold">Active Turn</h3>
                {selected ? (
                    <div className="mt-4 flex flex-col gap-4 items-center text-center">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">
                                {(() => {
                                    const avatarId = selected.player.data?.avatar;
                                    const avatarOption = avatarId
                                        ? AVATAR_OPTIONS.find((item) => item.id === avatarId)
                                        : undefined;
                                    return avatarOption?.emoji ?? "🎯";
                                })()}
                            </span>
                            <div className="text-left">
                                <p className="text-2xl font-bold">
                                    {selected.player.data?.name ?? selected.player.name ?? "Someone"}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1 break-all">
                                    Player ID: {selected.player.id}
                                </p>
                            </div>
                        </div>
                        {isMeSelected && promptOptions ? (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {promptOptions.truth ? (
                                    <button
                                        type="button"
                                        className={`rounded-full px-5 py-2 font-semibold transition ${
                                            promptChoice?.type === "truth"
                                                ? "bg-green-600 text-white shadow-lg"
                                                : "bg-green-100 text-green-700 hover:bg-green-200"
                                        }`}
                                        onClick={() => onPromptChoice("truth", promptOptions.truth!.content)}
                                        disabled={!!promptChoice}
                                    >
                                        Truth
                                    </button>
                                ) : null}
                                {promptOptions.trick ? (
                                    <button
                                        type="button"
                                        className={`rounded-full px-5 py-2 font-semibold transition ${
                                            promptChoice?.type === "trick"
                                                ? "bg-orange-600 text-white shadow-lg"
                                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                        }`}
                                        onClick={() => onPromptChoice("trick", promptOptions.trick!.content)}
                                        disabled={!!promptChoice}
                                    >
                                        Trick
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                        {promptChoice ? (
                            <div className="w-full rounded-2xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 p-4 text-left">
                                <p className="text-sm uppercase font-semibold text-purple-500 mb-2">
                                    {promptChoice.type === "truth" ? "Truth" : "Trick"}
                                </p>
                                <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-100">
                                    {promptChoice.content}
                                </p>
                            </div>
                        ) : null}
                        {typeof promptCountdown === "number" ? (
                            <p className="text-sm font-medium text-purple-600">
                                Có thể kết thúc lượt sau {promptCountdown}s
                            </p>
                        ) : null}
                        {isMeSelected ? (
                            <button
                                type="button"
                                className={`rounded-full px-6 py-3 text-white font-semibold text-lg shadow-lg transition ${
                                    isFinishEnabled ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-400 cursor-not-allowed"
                                }`}
                                onClick={onFinishTurn}
                                disabled={!isFinishEnabled}
                            >
                                Kết thúc lượt
                            </button>
                        ) : (
                            <p className="text-sm text-neutral-500">
                                Chờ {selected.player.data?.name ?? selected.player.name ?? "bạn"} hoàn thành lượt nhé!
                            </p>
                        )}
                        <p className="text-xs text-neutral-400">
                            Remaining players: {selected.remainingCount} / {selected.totalPlayers}
                        </p>
                        {selected.exhausted ? (
                            <p className="text-sm font-semibold text-red-500">
                                Mọi người đều đã tham gia trong vòng này.
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <p className="mt-4 text-neutral-500 text-center">Chờ MC chọn người chơi đầu tiên...</p>
                )}
            </section>

            <section className="rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-inner">
                <h3 className="text-xl font-semibold">Players in this room</h3>
                        {otherPlayers.length === 0 ? (
                            <p className="mt-4 text-neutral-500">No players yet. Invite your friends!</p>
                        ) : (
                            <ul className="mt-4 grid gap-3">
                                {otherPlayers.map((player) => {
                                    const avatarId = player.data?.avatar;
                                    const avatarOption = avatarId
                                        ? AVATAR_OPTIONS.find((item) => item.id === avatarId)
                                        : undefined;
                                    const avatarEmoji = avatarOption?.emoji ?? "🙂";

                                    return (
                                        <li
                                            key={player.id}
                                            className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{avatarEmoji}</span>
                                                <div>
                                                    <p className="text-lg font-medium">{player.data?.name ?? "Player"}</p>
                                                    <p className="text-xs text-neutral-500 break-all">{player.id}</p>
                                                </div>
                                            </div>
                                            {player.id === me.id ? (
                                                <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                                                    You
                                                </span>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
            </section>
        </section>
    );
};

export default PlayerView;
