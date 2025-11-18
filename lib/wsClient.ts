import { Client, Room } from "colyseus.js";
import { SocketEnum } from "./socket.enum";
import { IHostPayload } from "@/components/colyseus/interface/host.interface";

async function resolveEndpoint(): Promise<string> {
  const rawEnv = await "ws://localhost:2567".trim();

  if (rawEnv.length > 0) {
    try {
      return new URL(rawEnv).toString();
    } catch (error) {
      console.warn(
        "[client] VITE_COLYSEUS_ENDPOINT is invalid, falling back to window.location",
        error
      );
    }
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const secure = protocol === "https:";
    const wsProtocol = secure ? "wss" : "ws";
    const inferredPort =
      port && port !== "80" && port !== "443" ? port : "2567";
    return `${wsProtocol}://${hostname}:${inferredPort}`;
  }

  // SSR / tests
  return "ws://localhost:2567";
}

export async function showConnectionStatus(
  roomId: string,
  host: string | undefined
) {
  const endpoint = await resolveEndpoint();
  console.log("🚀 ~ showConnectionStatus ~ endpoint:", endpoint);

  try {
    const client = new Client(endpoint);
    let room: Room | undefined;
    if (host) {
      room = await client.joinById(host);
      console.log("🚀 ~ showConnectionStatus ~ joinById: " + host);
    } else {
      room = await client.joinOrCreate("my_room");
      room.send(SocketEnum.SET_ROOM_HOST, {
        roomId: room.roomId,
        url: "localhost:3000/new/" + roomId + "/" + room.roomId,
      });
    }

    if (!room) return;

    room.onMessage(SocketEnum.SET_ROOM_HOST, (message: IHostPayload) => {
      console.log("🚀 ~ showConnectionStatus ~ message:", message);
    });

    console.info(`[client] Connected to ${room.sessionId} @ ${endpoint}`);
    return room;
    // room.onMessage(SocketEnum.START_GAME, (message) => {
    //   console.log("🚀 ~ showConnectionStatus ~ message:", message)
    // });
  } catch (err) {
    console.error(`[client] Failed to connect ${endpoint}:`, err);

    throw undefined;
  }
}
