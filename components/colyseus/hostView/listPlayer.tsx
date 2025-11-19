import { ComicText } from "@/components/ui/comic-text";
import { Highlighter } from "@/components/ui/highlighter";
import { SparklesText } from "@/components/ui/sparkles-text";
import { IRoomStatePayload, IStatePayload, RoundState } from "@/types/socket";
import { IPlayerInfo } from "@/types/ws.enum";
import { motion } from "motion/react";
export const AVATAR_EMOJI: Record<string, string> = {
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
    lemon: "🍋"
};
const renderAvatar = (player: IPlayerInfo, size: "md" | "lg" | "xl" = "md") => {
    const avatarId = player.avatar as string;
    const emoji = avatarId ? AVATAR_EMOJI[avatarId] : undefined;
    const displayName = player.name as string ?? "P";
    const fallbackInitial = displayName[0]?.toUpperCase() ?? "P";

    // Enhanced gradients for 4K display
    const baseClass =
        "inline-flex items-center justify-center rounded-full text-white font-bold shadow-2xl ring-4 ring-white/20 backdrop-blur-sm";
    const gradients = [
        "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
        "bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600",
        "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600",
        "bg-gradient-to-br from-green-400 via-teal-500 to-blue-600",
        "bg-gradient-to-br from-violet-400 via-purple-500 to-pink-600",
    ];
    const gradientClass = gradients[Math.abs(player.id?.charCodeAt(0) || 0) % gradients.length];

    const sizeClass = size === "xl" ? "w-32 h-32 text-7xl" : size === "lg" ? "w-24 h-24 text-6xl" : "w-16 h-16 text-4xl";

    if (emoji) {
        return (
            <motion.span
                className={`${baseClass} ${gradientClass} ${sizeClass}`}
                aria-label={displayName}
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [0, 5, 0],
              opacity: 1
            }}
            transition={{
              duration: 1,
              ease: "easeOut"
            }}
            >
                {emoji}
            </motion.span>
        );
    }

    return (
        <motion.span
        className={`${baseClass} ${gradientClass} ${size === "xl" ? "w-32 h-32 text-5xl" : size === "lg" ? "w-24 h-24 text-4xl" : "w-16 h-16 text-3xl"
            }`}
        aria-label={displayName}
        // whileHover={{ scale: 1.05 }}
        // whileTap={{ scale: 0.95 }}
        >
            {/* {fallbackInitial} */}
        </motion.span>
    );
};    // Component popup chúc mừng với animation pháo


export type PropListPlayer = {
    roomState: IStatePayload;
    me: IPlayerInfo;

}
export const ListPlayer = ({ roomState, me
}: PropListPlayer
) => {

    const participants = roomState.players.filter((player) => {
        if (player.id === me.id) return false;
        const status = player.roundState as RoundState;
        return status !== RoundState.COMPLETED;
    });


    return <motion.aside
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="flex flex-col rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 overflow-hidden shadow-2xl"
    >
        <div className="flex items-center gap-4 mb-6">
            <ComicText fontSize={2.5} >Người chơi</ComicText>
            <div className="ml-auto bg-white/20 rounded-full px-4 py-2">
                <span className="text-xl font-bold text-white">{participants.length}</span>
            </div>
        </div>
        
        {participants.length === 0 ? (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-16 flex-1 flex flex-col items-center justify-center"
            >
                <div className="text-8xl mb-6 animate-bounce">📱</div>
                <p className="text-2xl text-white/70 mb-2">Chưa có ai tham gia</p>
                <p className="text-lg text-white/50">Hãy chia sẻ QR code để mời bạn bè!</p>
            </motion.div>
        ) : (
            <motion.ul
                className="space-y-4 overflow-y-auto flex-1"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1,
                        },
                    },
                }}
            >
                {participants.map((player) => {
                    // const isActive = player.id === activePlayer?.id;
                    return (
                        <motion.li
                            key={player.id}
                       
                            className={`rounded-2xl border p-6 transition-all duration-300
                               
                                 "border-white/20 bg-white/5 "
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {renderAvatar(player, "md")}
                                {/* <div className="flex-1"> */}
                                    <p className="text-xl font-bold text-white mb-1">
                                        <Highlighter action="underline" color="#87CEFA" >   {player?.name ?? "Unnamed Player"}  </Highlighter>{" "}

                                    </p>
                                    {/* {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <p className="text-sm text-green-400 font-medium">
                                                Đang chơi 🎯
                                            </p>
                                        </motion.div>
                                    )} */}
                                {/* </div> */}
                            </div>
                        </motion.li>
                    );
                })}
            </motion.ul>
        )}
    </motion.aside>
}