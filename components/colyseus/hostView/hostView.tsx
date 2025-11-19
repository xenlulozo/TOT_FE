import { IPlayerInfo, IRoomStatePayload, IStatePayload, RoundState } from "@/types/socket";
import { AnimatedBackground } from "./background";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import SpinningWheel from "../SpinningWheel";
import { ListPlayer } from "./listPlayer";
import { StoreApi, UseBoundStore } from "zustand";
import { PopupState } from "../popupState";
import { RoomState } from "@/types/ws.enum";

export interface ISpinPayload {
    playerId?: string | null;
}
export interface HostViewProps {
    controller: UseBoundStore<StoreApi<PopupState>>;
    roomState: IStatePayload;
    roomUrl: string;
    me: IPlayerInfo;
    spin: ISpinPayload
}

export const HostView = ({ spin, me, roomUrl, roomState }: HostViewProps) => {
    console.log("🚀 ~ HostView ~ spin:", spin)

    const participants = roomState.players.filter((player) => {
        // if (player.id === me.id) return false;
        return player.isHost === false;
    });
    const wheelPlayers = participants.filter((player) => {
        if (player.id === me.id) return false; // Always exclude host
        const status = player.roundState as RoundState;
        return status !== RoundState.COMPLETED;
    });



    return (

        <div className="h-screen overflow-hidden">
            <AnimatedBackground />

            <section className="h-screen overflow-hidden flex flex-col relative">
                {/* Header với logo */}
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 p-8 pb-4"
                >
                    <div className="flex items-center justify-center gap-6">

                        <div className="text-center">
                            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                TOT CHALLENGE
                            </h1>
                            <p className="text-2xl text-white/80 font-medium">
                                Chờ người chơi tham gia
                            </p>
                        </div>
                    </div>
                </motion.div>

                {roomState.state === RoomState.READY ?
                    F_Idle(roomUrl, participants, me, spin, roomState) :

                    F_Playing(roomUrl, participants, me, spin, roomState)

                }


            </section>
        </div>

    )


}
const F_Idle = (roomUrl: string, participants: IPlayerInfo[], me: IPlayerInfo, spin: ISpinPayload, roomState: IStatePayload) => {
    return <div className="flex-1 grid grid-cols-3 gap-8 px-8 pb-8 overflow-hidden">
        {/* Vùng 1: QR Code */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
        >
            {roomUrl ? (
                <>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="text-center mb-6"
                    >
                        <h2 className="text-4xl font-bold text-white mb-2">QR Code tham gia</h2>
                        <p className="text-lg text-white/70">Quét để tham gia phòng chơi</p>
                    </motion.div>
                    <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                        <motion.div
                            className="rounded-2xl border-4 border-white/30 p-6 bg-white/95 shadow-2xl"
                            // whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <QRCodeSVG value={roomUrl} size={280} level="H" />
                        </motion.div>
                        <div className="text-center max-w-full">
                            <p className="text-base text-white/90 break-all bg-black/20 rounded-lg p-3 font-mono">
                                {roomUrl}
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="text-6xl mb-4">🔄</div>
                    <p className="text-xl text-white/70">Đang tải QR code...</p>
                </motion.div>
            )}
        </motion.div>

        {/* Vùng 2: Spinning Wheel */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
        >
            {/* <div className="flex items-center justify-center mb-6">
               {participants.length > 0 && (
                   <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       type="button"
                       className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-white text-2xl font-bold shadow-2xl hover:shadow-green-500/25 transition-all duration-300 border-2 border-white/20"
                       onClick={onStartGame}
                   >
                       🚀 Bắt đầu game
                   </motion.button>
               )}
           </div> */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {participants.length > 0 ? (
                    <SpinningWheel
                        players={participants}
                        selectedPlayerId={spin.playerId} // Không spin khi preview
                        onSpinComplete={() => { }} // Không cần callback khi preview
                        is_preview={true}
                    />
                ) : (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <div className="text-8xl mb-6">🎯</div>
                        <p className="text-2xl text-white/70 mb-2">Chờ người chơi tham gia</p>
                        {/* <p className="text-lg text-white/50">Bánh xe sẽ xuất hiện khi có người chơi</p> */}
                    </motion.div>
                )}
            </div>
        </motion.div>

        {/* Vùng 3: Danh sách người chơi */}
        <ListPlayer roomState={roomState} me={me} />

    </div>
}

const F_Playing = (roomUrl: string, participants: IPlayerInfo[], me: IPlayerInfo, spin: ISpinPayload, roomState: IStatePayload) => {
    return <div className="flex-1 grid grid-cols-[70%_1fr] gap-8 px-8 pb-8 overflow-hidden">

        {/* Vùng 2: Spinning Wheel */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
        >

            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {participants.length > 0 ? (
                    <SpinningWheel
                        players={participants}
                        selectedPlayerId={spin.playerId} // Không spin khi preview
                        onSpinComplete={() => { }} // Không cần callback khi preview
                        is_preview={true}
                    />
                ) : (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <div className="text-8xl mb-6">🎯</div>
                        <p className="text-2xl text-white/70 mb-2">Chờ người chơi tham gia</p>
                    </motion.div>
                )}
            </div>
        </motion.div>

        {/* Vùng 3: Danh sách người chơi */}
        <ListPlayer roomState={roomState} me={me} />

    </div>
}