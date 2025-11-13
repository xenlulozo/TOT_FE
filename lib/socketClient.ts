import { io, Socket } from "socket.io-client";

const DEFAULT_SOCKET_URL = "http://192.168.10.211:3333";

let socketInstance: Socket | undefined;

const resolveSocketUrl = () => {
  if (
    process.env.NEXT_PUBLIC_SOCKET_URL &&
    process.env.NEXT_PUBLIC_SOCKET_URL.trim().length > 0
  ) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  return DEFAULT_SOCKET_URL;
};

const createSocket = (): Socket => {
  const socketUrl = resolveSocketUrl();

  return io(socketUrl, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};

const ensureClientSide = () => {
  if (typeof window === "undefined") {
    throw new Error("Socket client can only be used in the browser.");
  }
};

export type SocketClient = Socket;

export interface ConnectOptions {
  auth?: Record<string, unknown>;
  query?: Record<string, string | number>;
}

export const getSocket = (): Socket => {
  ensureClientSide();

  if (!socketInstance) {
    socketInstance = createSocket();
  }

  return socketInstance;
};

export const connectSocket = (options?: ConnectOptions): Socket => {
  const socket = getSocket();

  if (options?.auth) {
    socket.auth = options.auth;
  }

  if (options?.query) {
    socket.io.opts = {
      ...socket.io.opts,
      query: {
        ...(socket.io.opts?.query as Record<string, unknown> | undefined),
        ...options.query,
      },
    };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (!socketInstance) {
    return;
  }

  if (socketInstance.connected) {
    socketInstance.disconnect();
  }
};

export const destroySocket = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = undefined;
};
