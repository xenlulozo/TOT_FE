import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import type { PlayerInfo, PlayerSelectedPayload, RoomStatePayload, TotPromptType } from "@/types/socket";
import Card from "./Card";

const AVATAR_EMOJI: Record<string, string> = {
    fox: "🦊",
    bear: "🐻",
    tiger: "🐯",
    panda: "🐼",
    koala: "🐨",
    monkey: "🐵",
    unicorn: "🦄",
};

type HostViewProps = {
    roomState: RoomStatePayload;
    me: PlayerInfo;
    selected: PlayerSelectedPayload | null;
    promptChoice: { type: TotPromptType; content: string } | null;
    promptCountdown: number | null;
    isFinishEnabled: boolean;
    gameStarted: boolean;
    choiceOption: TotPromptType | null;
    roomUrl: string;
    onStartGame: () => void;
    onRestartGame: () => void;
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
    roomUrl,
    onStartGame,
    onRestartGame,
    onFinishTurn,
}: HostViewProps) => {
    const participants = roomState.players.filter((player) => player.id !== me.id);
    const activePlayer = selected?.player ?? null;

    // Lấy thông tin thẻ bài từ selected player
    const truthOption = selected?.promptOptions?.truth;
    const trickOption = selected?.promptOptions?.trick;

    const renderAvatar = (player: PlayerInfo, size: "md" | "lg" = "md") => {
        const avatarId = player.data?.avatar as string;
        const emoji = avatarId ? AVATAR_EMOJI[avatarId] : undefined;
        const displayName = player.data?.name as string ?? "P";
        const fallbackInitial = displayName[0]?.toUpperCase() ?? "P";
        const baseClass =
            "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white";
        const sizeClass = size === "lg" ? "w-20 h-20 text-5xl" : "w-10 h-10 text-2xl";

        if (emoji) {
    return (
                <span className={`${baseClass} ${sizeClass}`} aria-label={displayName}>
                    {emoji}
                    </span>
            );
        }

        return (
            <span
                className={`${baseClass} ${
                    size === "lg" ? "w-20 h-20 text-3xl font-black" : "w-10 h-10 text-lg font-bold"
                }`}
                aria-label={displayName}
            >
                {fallbackInitial}
            </span>
        );
    };    // Nếu game đã bắt đầu, hiển thị layout mới
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
                                <div>{renderAvatar(activePlayer, "lg")}</div>
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
                                        // Trước khi chọn: hiện bình thường
                                        // Sau khi chọn: hiện cả hai rồi ẩn thẻ không được chọn
                                        opacity: choiceOption === null
                                            ? 1
                                            : choiceOption === "truth"
                                            ? 1
                                            : 0,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        // Nếu thẻ không được chọn, trì hoãn ẩn để người dùng kịp thấy nội dung
                                        delay: choiceOption && choiceOption !== "truth" ? 0.6 : 0,
                                    }}
                                >
                                    <Card
                                        type="truth"
                                        content={
                                            // Ưu tiên content đến từ payload, fallback theo option ban đầu
                                            promptChoice?.type === "truth" ? promptChoice.content : truthOption.content
                                        }
                                        // Sau khi chọn: cả hai đều lật để lộ nội dung
                                        isFlipped={choiceOption !== null}
                                        // Trước khi chọn: chỉ show mặt sau; Sau khi chọn: show mặt trước
                                        isRevealed={choiceOption !== null || choiceOption === null}
                                    />
                                </motion.div>
                        ) : null}

                            {/* Thẻ Trick */}
                            {trickOption ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: choiceOption === null
                                            ? 1
                                            : choiceOption === "trick"
                                            ? 1
                                            : 0,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        delay:
                                            choiceOption && choiceOption !== "trick"
                                                ? 0.6
                                                : 0.1,
                                    }}
                                >
                                    <Card
                                        type="trick"
                                        content={
                                            promptChoice?.type === "trick" ? promptChoice.content : trickOption.content
                                        }
                                        isFlipped={choiceOption !== null}
                                        isRevealed={choiceOption !== null || choiceOption === null}
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
                    {/* {activePlayer && (
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
                    )} */}
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
                                            {renderAvatar(player)}
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {player.data?.name ?? "Unnamed Player"}
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
                        {/* <button
                            type="button"
                            className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold shadow hover:bg-blue-700 transition"
                            onClick={onStartGame}
                        >
                            Bắt đầu game
                        </button> */}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                    {participants.length === 0 ? (
                            <p className="text-neutral-500 text-center mt-8">Chờ người chơi tham gia...</p>
                    ) : (
                            <ul className="space-y-3">
                            {participants.map((player) => (
                                <li
                                    key={player.id}
                                        className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950/50 p-4 flex items-center gap-3"
                                >
                                        {renderAvatar(player)}
                                        <div>
                                    <p className="text-lg font-medium">
                                        {player.data?.name ?? "Unnamed Player"}
                                    </p>
                                    <p className="text-xs text-neutral-500 break-all">ID: {player.id}</p>
                                        </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    </div>

                    {/* Active Player Info */}
                    {activePlayer ? (
                        <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    {renderAvatar(activePlayer)}
                                    <p className="text-lg font-bold">
                                        {activePlayer.data?.name ?? activePlayer.name ?? "Mystery Player"}
                                    </p>
                                </div>
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
                                <>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Còn lại: {selected.remainingCount} / {selected.totalPlayers}
                                    </p>
                                    {selected.exhausted ? (
                                        <div className="mt-3 flex items-center gap-3">
                        <button
                            type="button"
                                                className="rounded-lg bg-purple-600 px-4 py-2 text-white font-semibold shadow hover:bg-purple-700"
                                                onClick={onRestartGame}
                                            >
                                                Restart vòng chơi
                        </button>
                    </div>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default HostView;


