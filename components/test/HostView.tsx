import { motion } from "framer-motion";
import type { PlayerInfo, PlayerSelectedPayload, RoomStatePayload } from "@/types/socket";
import Card from "./Card";

type HostViewProps = {
    roomState: RoomStatePayload;
    me: PlayerInfo;
    selected: PlayerSelectedPayload | null;
    promptChoice: { type: "truth" | "trick"; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    gameStarted: boolean;
    choiceOption: "truth" | "trick" | null;
    onStartGame: () => void;
    onFinishTurn: () => void;
};

const HostView = ({
    roomState,
    me,
    selected,
    promptChoice,
    promptCountdown,
    isFinishEnabled,
    gameStarted,
    choiceOption,
    onStartGame,
    onFinishTurn,
}: HostViewProps) => {
    const participants = roomState.players.filter((player) => player.id !== me.id);
    const activePlayer = selected?.player ?? null;

    // Lấy thông tin thẻ bài từ selected player
    const truthOption = selected?.promptOptions?.truth;
    const trickOption = selected?.promptOptions?.trick;

    // Nếu game đã bắt đầu, hiển thị layout mới
    if (gameStarted) {
        return (
            <div className="flex-1 flex gap-6">
                {/* Bên trái: Người chơi hiện tại và 2 thẻ bài */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Thông tin người chơi hiện tại */}
                    {activePlayer ? (
                        <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Người chơi hiện tại</h2>
                                <span className="rounded-full bg-orange-500 text-white text-sm font-semibold px-4 py-1">
                                    Lượt của
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                    {(activePlayer.data?.name ?? activePlayer.name ?? "P")[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-orange-500">
                                        {activePlayer.data?.name ?? activePlayer.name ?? "Player"}
                                    </p>
                                    <p className="text-sm text-neutral-500">Đang chơi</p>
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {/* 2 thẻ bài */}
                    {(truthOption || trickOption) && activePlayer ? (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Thẻ Truth */}
                            {truthOption ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: choiceOption === null || choiceOption === "truth" ? 1 : 0,
                                        y: 0,
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card
                                        type="truth"
                                        content={truthOption.content}
                                        isFlipped={choiceOption === "truth"}
                                        isRevealed={choiceOption === "truth" || choiceOption === null}
                                    />
                                </motion.div>
                            ) : null}

                            {/* Thẻ Trick */}
                            {trickOption ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: choiceOption === null || choiceOption === "trick" ? 1 : 0,
                                        y: 0,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    <Card
                                        type="trick"
                                        content={trickOption.content}
                                        isFlipped={choiceOption === "trick"}
                                        isRevealed={choiceOption === "trick" || choiceOption === null}
                                    />
                                </motion.div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[400px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                            <p className="text-neutral-500">Chờ người chơi được chọn...</p>
                        </div>
                    )}

                    {/* Nút Finish Turn */}
                    {activePlayer && (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className={`rounded-full px-8 py-4 text-white font-semibold text-lg shadow transition ${
                                    isFinishEnabled
                                        ? "bg-amber-600 hover:bg-amber-700"
                                        : "bg-amber-400 cursor-not-allowed"
                                }`}
                                onClick={onFinishTurn}
                                disabled={!isFinishEnabled}
                            >
                                Kết thúc lượt
                            </button>
                        </div>
                    )}
                </div>

                {/* Bên phải: Danh sách người chơi */}
                <aside className="w-80 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-lg">
                    <h3 className="text-2xl font-bold mb-4">Danh sách người chơi</h3>
                    {roomState.players.length === 0 ? (
                        <p className="text-neutral-500">Chưa có người chơi</p>
                    ) : (
                        <ul className="space-y-3">
                            {roomState.players.map((player) => {
                                const isActive = player.id === activePlayer?.id;
                                return (
                                    <li
                                        key={player.id}
                                        className={`rounded-lg border p-4 transition ${
                                            isActive
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {(player.data?.name ?? player.name ?? "P")[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {player.data?.name ?? player.name ?? "Unnamed Player"}
                                                </p>
                                                {isActive && (
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        Đang chơi
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>
        );
    }

    // Layout cũ khi game chưa bắt đầu
    return (
        <section className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 shadow-lg space-y-8">
            <header>
                <h2 className="text-4xl font-bold tracking-tight">Host Control Center</h2>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-300">
                    Welcome back, {me.data?.name ?? "Host"}! You&apos;re running room{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-300">
                        {roomState.hostId.slice(0, 6)}
                    </span>
                </p>
            </header>

            <section className="rounded-2xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-6">
                <h3 className="text-2xl font-semibold text-amber-700 dark:text-amber-200">Active Player</h3>
                {activePlayer ? (
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-bold">
                                {activePlayer.data?.name ?? activePlayer.name ?? "Mystery Player"}
                            </p>
                            <span className="rounded-full bg-amber-600 text-white text-xs font-semibold px-4 py-1">
                                Playing Now
                            </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 break-all">
                            ID: {activePlayer.id}
                        </p>
                        {selected ? (
                            <p className="text-sm text-neutral-500">
                                Remaining players: {selected.remainingCount} / {selected.totalPlayers}
                            </p>
                        ) : null}
                        {selected?.exhausted ? (
                            <p className="text-sm font-semibold text-red-600">No more players available.</p>
                        ) : null}
                        {typeof promptCountdown === "number" ? (
                            <p className="text-sm text-amber-600">
                                Finish button unlocks in {promptCountdown}s
                            </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                className={`rounded-full px-6 py-3 text-white font-semibold text-lg shadow transition ${
                                    isFinishEnabled
                                        ? "bg-amber-600 hover:bg-amber-700"
                                        : "bg-amber-400 cursor-not-allowed"
                                }`}
                                onClick={onFinishTurn}
                                disabled={!isFinishEnabled}
                            >
                                Finish Turn
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mt-4 text-neutral-600 dark:text-neutral-300">
                        Waiting for the first player to be selected.
                    </p>
                )}
            </section>

            <section className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-6">
                <h3 className="text-2xl font-semibold text-purple-700 dark:text-purple-200">Prompt In Play</h3>
                {promptChoice ? (
                    <div className="mt-4 space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-200">
                            {promptChoice.type === "truth" ? "Truth" : "Trick"}
                        </span>
                        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-200">
                            {promptChoice.content}
                        </p>
                        {typeof promptCountdown === "number" ? (
                            <p className="text-sm text-neutral-500">
                                Finish button unlocks in {promptCountdown}s
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <p className="mt-4 text-neutral-600 dark:text-neutral-300">
                        Waiting for the selected player to choose a prompt.
                    </p>
                )}
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <article className="rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-6">
                    <h3 className="text-2xl font-semibold">Players in Lobby</h3>
                    {participants.length === 0 ? (
                        <p className="mt-4 text-neutral-500">Waiting for players to join...</p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {participants.map((player) => (
                                <li
                                    key={player.id}
                                    className="rounded border border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-blue-950/50 p-4"
                                >
                                    <p className="text-lg font-medium">
                                        {player.data?.name ?? "Unnamed Player"}
                                    </p>
                                    <p className="text-xs text-neutral-500 break-all">ID: {player.id}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                <aside className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6">
                    <h4 className="text-xl font-semibold">Host Tools</h4>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Build your game controls here for the 4K host display.
                    </p>
                    <div className="mt-4 grid gap-3">
                        <button
                            type="button"
                            className="w-full rounded bg-blue-600 px-4 py-3 text-white shadow hover:bg-blue-700 transition"
                            onClick={onStartGame}
                        >
                            Start Game
                        </button>
                        <button
                            type="button"
                            className="w-full rounded border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-neutral-700 dark:text-neutral-200"
                            disabled
                        >
                            Manage Rounds
                        </button>
                    </div>
                </aside>
            </section>
        </section>
    );
};

export default HostView;


