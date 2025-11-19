"use client"
import ClientPromptPopup, { PromptType } from "@/components/colyseus/ClientPromptPopup";
import CountdownPopup from "@/components/colyseus/CountdownPopup";
import CardPlayerSelectedPopup from "@/components/colyseus/hostView/cardPlayerSelected";
import { CardSelectedPopup } from "@/components/colyseus/hostView/cardSelected";
import { ListPlayer } from "@/components/colyseus/hostView/listPlayer";
import TowCard from "@/components/colyseus/hostView/twoCard";
import { EPopupName, usePopupStore } from "@/components/colyseus/popupState";
import PromptSelection from "@/components/colyseus/PromptSelection";
import SelectedPlayerPopup from "@/components/colyseus/SelectedPlayerPopup";
import SpinningWheel from "@/components/colyseus/SpinningWheel";
import { Particles } from "@/components/ui/particles";
import Wheel from "@/components/Wheel/Wheel";
import { useUIStore } from "@/stores/UIStore";
import { IPlayerInfo, RoundState } from "@/types/socket";
import { TotPopup } from "@/ui/popup/tot";
import { AnimatePresence, color } from "motion/react";
import { useEffect } from "react";
const page = () => {
    const activePopup = usePopupStore((s) => s.activePopup);


    // Trong thực tế, currentPlayerId sẽ được lấy từ socket connection hoặc context
    // Ví dụ: const currentPlayerId = useSocket()?.sessionId;
    // const players = ["Ali", "Hanna", "Gabriel", "Fatima", "Eric", "Diva", "Charles", "Beatriz"];
    const players: IPlayerInfo[] = [{
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
    }];

    useEffect(() => {
    //     usePopupStore.getState().openPopup(EPopupName.CountdownPopup);

 

    //     const timeout2 = setTimeout(() => {
    //         usePopupStore.getState().openPopup(EPopupName.CardPlayerSelectedPopup);
    //     }, 4000);

    //     const timeout3 = setTimeout(() => {
    //         usePopupStore.getState().closePopup(EPopupName.CardPlayerSelectedPopup);
    //     }, 7000);
    //     const timeout = setTimeout(() => {
    //         usePopupStore.getState().openPopup(EPopupName.TowCard);
    //     }, 7000);

    //     const timeout1 = setTimeout(() => {
    //         usePopupStore.getState().closePopup(EPopupName.TowCard);
    //     }, 14000);

    //    setTimeout(() => {
    //         usePopupStore.getState().openPopup(EPopupName.CardSelectedPopup);
    //     }, 16000);

    //   setTimeout(() => {
    //         usePopupStore.getState().closePopup(EPopupName.CardSelectedPopup);
    //     }, 20000);
    usePopupStore.getState().openPopup(EPopupName.CardSelectedPopup);

          setTimeout(() => {
            usePopupStore.getState().closePopup(EPopupName.CardSelectedPopup);
        }, 5000);
    }, []);

    return <>
        <AnimatePresence>
            {activePopup === EPopupName.TowCard && <TowCard />}
            {activePopup === EPopupName.CountdownPopup && <CountdownPopup show={true} onComplete={() => { }} duration={3} startNumber={3} />}
            {activePopup === EPopupName.CardSelectedPopup && <CardSelectedPopup selectedPrompt={"truth"} promptContent={"what your name"} />}
            {activePopup === EPopupName.CardPlayerSelectedPopup && <CardPlayerSelectedPopup selectedPlayer={{
                player: {
                    id: "3",
                    name: "Player 1",
                    avatar: "fox",
                    roundState: RoundState.NOT_STARTED,
                    isHost: false,
                }
            }} />}
        </AnimatePresence>
        {/* <CardPlayerSelectedPopup selectedPlayer={{
            player: {
                id: "3",
                name: "Player 1",
                avatar: "fox",
                roundState: RoundState.NOT_STARTED,
                isHost: false,
            }
        }} onClose={() => { }} /> */}
    </>

    // return <TowCard/>

    //   return   <PromptSelection selectedPlayer={null} selectedPrompt={null} promptContent={null} onPromptSelected={() => { }} /> 
    //     return     <SelectedPlayerPopup selectedPlayer={{
    //         player: {
    //             id: "3",
    //             name: "Player 1",
    //             avatar: "fox",
    //             roundState: RoundState.NOT_STARTED,
    //             isHost: false,
    //         },
    //     }} onClose={() => { }}
    // />

    // return  <ListPlayer roomState={{ players: players, meta: {}, hostId: "" }} me={players[0]} />;
    //     <div className="bg-background relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
    //     <span className="pointer-events-none z-10 text-center text-8xl leading-none font-semibold whitespace-pre-wrap">
    //       Particles
    //     </span>
    //     <Particles
    //       className="absolute inset-0 z-0"
    //       quantity={100}
    //       ease={80}
    //       color={"#2ecc71"}
    //       refresh
    //     />
    //   </div>


    // return <div>
    //     <button
    //         onClick={() => useUIStore.getState().openPopup("tot")}
    //         className="p-2 bg-blue-500 text-white"
    //     >
    //         Open Popup
    //     </button>

    //     <TotPopup />
    // </div>

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




}
export default page;
