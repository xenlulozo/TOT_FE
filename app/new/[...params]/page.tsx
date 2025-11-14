"use client";
import { useParams } from "next/navigation";
import { showConnectionStatus } from "@/lib/wsClient";
import HostColyseusView from "@/components/colyseus/HostColyseusView";
import { RoundState } from "@/types/socket";
import { SocketEnum } from "@/lib/socket.enum";
import { IHostPayload } from "@/components/colyseus/interface/host.interface";

interface Props {
    params: { params?: string[] }; // có thể undefined
  }
  
const PixiRoomPage =  ()  => {
    const params = useParams();
    console.log("🚀 ~ PixiRoomPage ~ params:", params.params)
    const [roomId, host] = params.params || [];
   showConnectionStatus(roomId ,host)

// if(roomConnection){
//     roomConnection.onMessage(SocketEnum.START_GAME, (message) => {
//         console.log("🚀 ~ showConnectionStatus ~ message:", message)
//     });

//     roomConnection.onMessage(SocketEnum.SET_ROOM_HOST, (message : IHostPayload) => {
//         console.log("🚀 ~ showConnectionStatus ~ message:", message)
//     });
// }

    return  <HostColyseusView roomState={{
        players: [],
        meta: {},
        hostId: ""
    }} me={{
        id: "",
        isHost: false,
        roundState: RoundState.NOT_STARTED,
        avatar: "",
        name: ""
    }} selected={null} promptChoice={null} promptCountdown={null} isFinishEnabled={false} gameStarted={false} choiceOption={null} roomUrl={""} isSpinning={false} turnFinished={false} onStartGame={function (): void {
        throw new Error("Function not implemented.");
    } } onRestartGame={function (): void {
        throw new Error("Function not implemented.");
    } } onFinishTurn={function (): void {
        throw new Error("Function not implemented.");
    } }>
    </HostColyseusView>;
};

export default PixiRoomPage;

