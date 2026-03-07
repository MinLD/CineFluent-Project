import { io, Socket } from "socket.io-client";

// Get backend URL for socket connection
const getSocketUrl = () => {
  if (typeof window === "undefined") return ""; // Server SSR shouldn't connect

  // In production, Nginx handles /socket.io/ on the same origin
  if (process.env.NODE_ENV === "production") {
    return "";
  }

  // In Development, connect directly to Flask backend
  return process.env.NEXT_PUBLIC_URL_BACKEND_LOCAL || "http://127.0.0.1:5000";
};

let socket: Socket | null = null;

export const initSocket = (): Socket | null => {
  if (!socket && typeof window !== "undefined") {
    const url = getSocketUrl();
    socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
