"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
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

interface SocketContextType {
  socket: Socket | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connectSocket: () => {},
  disconnectSocket: () => {},
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = () => {
    if (!socketRef.current && typeof window !== "undefined") {
      const url = getSocketUrl();
      const newSocket = io(url, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Global Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Global Socket disconnected");
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // We don't automatically connect on mount.
    // We let individual components (like MultiplayerLobby) trigger connectSocket()
    return () => {
      // Disconnect when the whole app unmounts
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, connectSocket, disconnectSocket, isConnected }}
    >
      {children}
    </SocketContext.Provider>
  );
};
