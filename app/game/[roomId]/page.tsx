"use client"
import PromptSelection from "@/components/colyseus/PromptSelection";
import SpinningWheel from "@/components/colyseus/SpinningWheel";
import { RoundState } from "@/types/socket";
import { AnimatePresence } from "motion/react";
const page = () => {
    return <SpinningWheel
        players={[{
            id: "1",
            name: "Player 1",
            avatar: "fox",
            roundState: RoundState.NOT_STARTED,
            isHost: false,
        }, {
            id: "2",
            name: "Player 1",
            avatar: "fox",
            roundState: RoundState.NOT_STARTED,
            isHost: false,
        }, {
            id: "3",
            name: "Player 1",
            avatar: "fox",
            roundState: RoundState.NOT_STARTED,
            isHost: false,
        }]}
        selectedPlayerId={"2"}
        onSpinComplete={() => { }}
        spinTime={10}
    />
    // <PromptSelection
    //     selectedPlayer={null} // Data from PLAYER_SELECTED event
    //     selectedPrompt={"trick"} // Which prompt was selected (from server events)
    //     promptContent={"YEAH"} // Content of the selected prompt
    //     onPromptSelected={() => { }}
    // />

    {/* <PromptSelection selectedPlayer={null} selectedPrompt={null} promptContent={null} onPromptSelected={() => { }} /> */ }

}
export default page;
