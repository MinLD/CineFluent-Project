"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "./AuthContext";

interface SocketContextData {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const auth = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Lấy userId từ AuthContext (đảm bảo AuthProvider bọc ngoài SocketProvider)
  const userId = auth?.userId;

  useEffect(() => {
    // 1. Chỉ kết nối khi có userId (User đã login)
    // Nếu muốn support guest thì bỏ check này, nhưng logic "online user" cần id.
    if (!userId) {
      if (socket) {
        console.log("🔌 Socket: User logout -> Disconnecting...");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 2. Nếu đã có socket và đang kết nối với đúng user thì không làm gì (hoặc check logic khác)
    // Tuy nhiên, đơn giản nhất là khi userId thay đổi -> tạo connection mới.

    // Lấy URL từ env, fallback về localhost
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:5000";

    console.log(
      `🔌 Socket: Initializing connection to ${SOCKET_URL} for User ${userId}...`,
    );

    const newSocket = io(SOCKET_URL, {
      reconnection: true, // Mặc định là true
      reconnectionAttempts: 10, // Thử lại 10 lần
      reconnectionDelay: 1000, // Đợi 1s giữa các lần
      transports: ["websocket"], // Ưu tiên websocket
    });

    // 3. Xử lý các sự kiện connection
    newSocket.on("connect", () => {
      console.log("✅ Socket: Connected!", newSocket.id);
      setIsConnected(true);

      // QUAN TRỌNG: Auto-register ngay khi connect (bao gồm cả Reconnect)
      newSocket.emit("register", { user_id: userId });
      console.log(`🔔 Socket: Auto-registered user ${userId}`);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket: Disconnected.", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket: Create connection error:", err.message);
    });

    setSocket(newSocket);

    // 4. Cleanup khi unmount hoặc userId thay đổi
    return () => {
      console.log("🔌 Socket: Cleanup (userId changed or unmount)");
      newSocket.disconnect();
    };
  }, [userId]); // Chạy lại khi userId thay đổi

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
