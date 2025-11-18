"use client"
import ClientPromptPopup, { PromptType } from "@/components/colyseus/ClientPromptPopup";
import CountdownPopup from "@/components/colyseus/CountdownPopup";
import PromptSelection from "@/components/colyseus/PromptSelection";
import SelectedPlayerPopup from "@/components/colyseus/SelectedPlayerPopup";
import SpinningWheel from "@/components/colyseus/SpinningWheel";
import { useUIStore } from "@/stores/UIStore";
import { RoundState } from "@/types/socket";
import { TotPopup } from "@/ui/popup/tot";
import { AnimatePresence } from "motion/react";
const page = () => {
    // Trong thực tế, currentPlayerId sẽ được lấy từ socket connection hoặc context
    // Ví dụ: const currentPlayerId = useSocket()?.sessionId;

    return <div>
        <button
            onClick={() => useUIStore.getState().openPopup("tot")}
            className="p-2 bg-blue-500 text-white"
        >
            Open Popup
        </button>

        <TotPopup />
    </div>

    //     return     <CountdownPopup
    //     show={true}
    //     onComplete={() => {}}
    //     duration={3}
    //     startNumber={3}
    // />
    // const currentPlayerId = "PASS"; // Placeholder
    // return     <ClientPromptPopup
    //     selectedPlayer={null} // Có thể null ban đầu, sẽ update khi PLAYER_SELECTED đến
    //     onPromptSelected={function (promptType: PromptType): void {
    //         throw new Error("Function not implemented.");
    //     } } onEndTurn={function (): void {
    //         throw new Error("Function not implemented.");
    //     } }/>
    // return <ClientPromptPopup
    //     selectedPlayer={null}
    //     currentPlayerId={currentPlayerId}
    //     onPromptSelected={
    //     function (promptType: PromptType): void {
    // } }
    // onEndTurn={function (): void {
    // } }/>
    // <SpinningWheel
    //     players={[{
    //         id: "1",
    //         name: "Player 1",
    //         avatar: "fox",
    //         roundState: RoundState.NOT_STARTED,
    //         isHost: false,
    //     }, {
    //         id: "2",
    //         name: "Player 1",
    //         avatar: "fox",
    //         roundState: RoundState.NOT_STARTED,
    //         isHost: false,
    //     }, {
    //         id: "3",
    //         name: "Player 1",
    //         avatar: "fox",
    //         roundState: RoundState.NOT_STARTED,
    //         isHost: false,
    //     }]}
    //     selectedPlayerId={"2"}
    //     onSpinComplete={() => { }}
    //     spinTime={10}
    // />
    // <PromptSelection
    //     selectedPlayer={null} // Data from PLAYER_SELECTED event
    //     selectedPrompt={"trick"} // Which prompt was selected (from server events)
    //     promptContent={"YEAH"} // Content of the selected prompt
    //     onPromptSelected={() => { }}
    // />

    {/* <PromptSelection selectedPlayer={null} selectedPrompt={null} promptContent={null} onPromptSelected={() => { }} /> */ }

}
export default page;
