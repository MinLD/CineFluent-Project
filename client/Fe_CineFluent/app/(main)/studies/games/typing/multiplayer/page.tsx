"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useContext } from "react";
import { Users, Loader2, Play, Copy, Check } from "lucide-react";
import { useSocket } from "@/app/lib/context/SocketContext";
import { AuthContext } from "@/app/lib/context/AuthContext";
import { toast } from "sonner";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

// Mutilplayer Lobby component
function MultiplayerLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCodeQuery = searchParams.get("room");
  const action = searchParams.get("action");

  const auth = useContext(AuthContext);
  const username = auth?.profile_user?.profile?.fullname || "Guest";

  const [roomState, setRoomState] = useState<{
    room_code: string;
    host: string;
    players: Array<{ sid: string; username: string; is_host: boolean }>;
    status: string;
    map_id: number | null;
  } | null>(null);

  const [maps, setMaps] = useState<any[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);

  const { socket, connectSocket, isConnected } = useSocket();

  useEffect(() => {
    // Fetch available maps for the host
    const fetchMaps = async () => {
      try {
        const res = await fetch(`${FeApiProxyUrl}/typing-game/maps`);
        const data = await res.json();
        if (data.code === 200) {
          setMaps(data.data);
          if (data.data.length > 0) setSelectedMapId(data.data[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch maps:", e);
      }
    };
    if (action === "create") {
      fetchMaps();
    }
  }, [action]);

  useEffect(() => {
    if (!socket) {
      connectSocket();
      return;
    }

    // Xử lý khi socket connect xong
    const onConnectHandler = () => {
      console.log("Joined socket, now emitting action...");
      if (action === "create") {
        socket.emit("typing_create_room", { username, map_id: selectedMapId });
      } else if (roomCodeQuery) {
        socket.emit("typing_join_room", { username, room_code: roomCodeQuery });
      } else {
        router.push("/studies/games/typing");
      }
    };

    if (socket.connected) {
      onConnectHandler();
    } else {
      socket.once("connect", onConnectHandler);
    }

    socket.on("room_created", (data: any) => {
      console.log("Room created", data);
      toast.success("Tạo phòng thành công!");
    });

    socket.on("room_state_updated", (data: any) => {
      console.log("Room update", data);
      setRoomState(data);
    });

    socket.on("game_started", (data: any) => {
      console.log("Game started by host", data);
      toast.success("Trận đấu bắt đầu!");
      // Redirect to play view inside multiplayer folder, pass room code
      router.push(
        `/studies/games/typing/multiplayer/play?room=${roomState?.room_code || roomCodeQuery}&map_id=${data.map_id}`,
      );
    });

    socket.on("error", (data: any) => {
      toast.error(data.message || "Có lỗi xảy ra");
      router.push("/studies/games/typing");
    });

    return () => {
      // Cleanup listeners only
      socket.off("room_created");
      socket.off("room_state_updated");
      socket.off("game_started");
      socket.off("error");

      // DO NOT disconnect socket here because we need it for the next page
    };
  }, [action, roomCodeQuery, username, router, socket]);

  const handleStartGame = () => {
    if (!selectedMapId) {
      toast.error("Vui lòng chọn bản đồ thi đấu!");
      return;
    }
    if (socket) {
      socket.emit("typing_start_game", {
        room_code: roomState?.room_code,
        map_id: selectedMapId,
      });
    }
  };

  const copyToClipboard = () => {
    if (roomState?.room_code) {
      navigator.clipboard.writeText(roomState.room_code);
      setCopied(true);
      toast.success("Đã copy mã phòng!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = roomState?.host === socket?.id;

  if (!isConnected || !roomState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
        <p>Đang kết nối Server Multiplayer...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 left-0"></div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Thông tin phòng */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Mã Phòng</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl text-white font-black tracking-widest font-mono">
                    {roomState.room_code}
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-slate-300">
              Chia sẻ mã này với bạn bè để họ có thể nhập mã và tham gia cùng
              bạn.
            </p>

            {isHost && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-sm font-semibold text-slate-400">
                  CHỌN MAP THI ĐẤU
                </label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  value={selectedMapId || ""}
                  onChange={(e) => setSelectedMapId(Number(e.target.value))}
                >
                  <option value="" disabled>
                    -- Chọn Map --
                  </option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Danh sách người chơi */}
          <div className="w-full md:w-80 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">
                Sảnh chờ ({roomState.players.length}/10)
              </h3>
            </div>

            <div className="space-y-3 flex-1">
              {roomState.players.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800/50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">
                      {p.username} {p.sid === socket?.id ? "(Bạn)" : ""}
                    </p>
                    {p.is_host && (
                      <span className="text-xs text-purple-400 font-medium">
                        Chủ phòng
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {roomState.players.length === 1 && (
                <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-sm">
                  Đang chờ người chơi khác tham gia...
                </div>
              )}
            </div>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!selectedMapId}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform fill-current" />{" "}
                Bắt đầu trận đấu
              </button>
            )}

            {!isHost && (
              <div className="w-full mt-6 py-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Chờ chủ phòng bắt
                đầu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MultiplayerTypingPage() {
  return (
    <div className="min-h-screen bg-[#020617] pt-24 px-4 sm:px-6 lg:px-8 pb-12 font-sans">
      <Suspense
        fallback={
          <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        }
      >
        <MultiplayerLobby />
      </Suspense>
    </div>
  );
}
