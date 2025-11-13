import { QRCodeSVG } from "qrcode.react";
import type { PlayerInfo, PlayerSelectedPayload, RoomStatePayload } from "@/types/socket";

type HostViewProps = {
    roomState: RoomStatePayload;
    me: PlayerInfo;
    selected: PlayerSelectedPayload | null;
    promptChoice: { type: "truth" | "trick"; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    roomUrl: string;
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
    roomUrl,
    onStartGame,
    onFinishTurn,
}: HostViewProps) => {
    const participants = roomState.players.filter((player) => player.id !== me.id);
    const activePlayer = selected?.player ?? null;

    return (
        <section className="h-screen overflow-hidden flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
            <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
                {/* Left: QR Code */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-hidden">
                    {roomUrl ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4 text-center">QR Code để tham gia</h2>
                            <div className="flex flex-col items-center gap-4 flex-1 justify-center">
                                <div className="rounded-lg border-4 border-neutral-200 dark:border-neutral-700 p-4 bg-white">
                                    <QRCodeSVG value={roomUrl} size={320} level="H" />
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 break-all text-center max-w-full">
                                    {roomUrl}
                                </p>
                                <p className="text-xs text-neutral-500 text-center">
                                    Quét QR code này để tham gia phòng chơi
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-neutral-500">Loading QR code...</p>
                    )}
                </div>

                {/* Right: Players List */}
                <div className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">Danh sách người chơi</h3>
                        <button
                            type="button"
                            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold shadow hover:bg-blue-700 transition"
                            onClick={onStartGame}
                        >
                            Bắt đầu game
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {participants.length === 0 ? (
                            <p className="text-neutral-500 text-center mt-8">Chờ người chơi tham gia...</p>
                        ) : (
                            <ul className="space-y-3">
                                {participants.map((player) => (
                                    <li
                                        key={player.id}
                                        className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950/50 p-4"
                                    >
                                        <p className="text-lg font-medium">
                                            {player.data?.name ?? "Unnamed Player"}
                                        </p>
                                        <p className="text-xs text-neutral-500 break-all">ID: {player.id}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Active Player Info */}
                    {activePlayer ? (
                        <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-lg font-bold">
                                    {activePlayer.data?.name ?? activePlayer.name ?? "Mystery Player"}
                                </p>
                                <span className="rounded-full bg-amber-600 text-white text-xs font-semibold px-3 py-1">
                                    Đang chơi
                                </span>
                            </div>
                            {promptChoice ? (
                                <div className="mt-2 space-y-1">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 px-3 py-1 text-xs font-semibold uppercase text-purple-700 dark:text-purple-200">
                                        {promptChoice.type === "truth" ? "Truth" : "Trick"}
                                    </span>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-200 line-clamp-2">
                                        {promptChoice.content}
                                    </p>
                                </div>
                            ) : null}
                            {selected ? (
                                <p className="text-xs text-neutral-500 mt-2">
                                    Còn lại: {selected.remainingCount} / {selected.totalPlayers}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default HostView;


