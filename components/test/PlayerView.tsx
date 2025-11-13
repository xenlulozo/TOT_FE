import type { PlayerInfo, PlayerSelectedPayload, RoomStatePayload } from "@/types/socket";

type PlayerViewProps = {
    roomState: RoomStatePayload;
    me: PlayerInfo;
    selected: PlayerSelectedPayload | null;
    promptChoice: { type: "truth" | "trick"; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    onPromptChoice: (type: "truth" | "trick", content: string) => void;
    onFinishTurn: () => void;
};

const PlayerView = ({
    roomState,
    me,
    selected,
    promptChoice,
    promptCountdown,
    isFinishEnabled,
    onPromptChoice,
    onFinishTurn,
}: PlayerViewProps) => {
    const otherPlayers = roomState.players.filter((player) => player.id !== roomState.hostId);
    const isMeSelected = selected?.player.id === me.id;
    const promptOptions = selected?.promptOptions;

    return (
        <section className="flex-1 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-purple-500/10 via-transparent to-blue-500/10 p-6 md:p-10 shadow-xl space-y-6">
            <header className="mb-6 text-center md:text-left">
                <p className="text-sm uppercase tracking-widest text-purple-500">Mobile Lobby</p>
                <h2 className="text-3xl md:text-4xl font-bold mt-2">
                    Hey {me.data?.name ?? "Player"} 👋 Ready to play?
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                    Stay tuned for the host to kick things off. We&apos;ll highlight you when it&apos;s your turn.
                </p>
            </header>

            <section className="rounded-2xl border border-purple-200 dark:border-purple-700/60 bg-white dark:bg-neutral-900 p-6 shadow-inner">
                <h3 className="text-xl font-semibold">Active Turn</h3>
                {selected ? (
                    <div className="mt-4 flex flex-col gap-4 items-center text-center">
                        <div>
                            <p className="text-2xl font-bold">
                                {selected.player.data?.name ?? selected.player.name ?? "Someone"}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 break-all">
                                Player ID: {selected.player.id}
                            </p>
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
                        {otherPlayers.map((player) => (
                            <li
                                key={player.id}
                                className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3"
                            >
                                <div>
                                    <p className="text-lg font-medium">{player.data?.name ?? "Player"}</p>
                                    <p className="text-xs text-neutral-500 break-all">{player.id}</p>
                                </div>
                                {player.id === me.id ? (
                                    <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                                        You
                                    </span>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    );
};

export default PlayerView;
