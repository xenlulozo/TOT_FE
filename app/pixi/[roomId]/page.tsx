"use client";

import { useParams } from "next/navigation";
import RoomController from "@/components/game/RoomController";
import HostPixiView from "@/components/pixi/HostPixiView";
import PlayerPixiView from "@/components/pixi/PlayerPixiView";

const PixiRoomPage = () => {
    const params = useParams();
    const roomIdParam = params?.roomId;
    const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;

    return <RoomController roomId={roomId} HostComponent={HostPixiView} PlayerComponent={PlayerPixiView} />;
};

export default PixiRoomPage;

