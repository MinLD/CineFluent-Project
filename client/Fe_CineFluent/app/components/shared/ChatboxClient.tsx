"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Bot, Send, X } from "lucide-react";

import {
  askChatAssistantAction,
  askPublicChatAssistantAction,
  createChatSessionAction,
  getChatSessionMessagesAction,
  getChatSessionsAction,
  hasChatAccessTokenAction,
} from "@/app/lib/actions/chat";
import {
  IChatMessage,
  IChatSession,
  TChatContextType,
} from "@/app/lib/types/chat";

type Props = {
  contextType?: TChatContextType;
  contextId?: number | string | null;
  title?: string;
  clientState?: Record<string, unknown>;
};

export default function ChatboxClient({
  contextType = "general",
  contextId = null,
  title = "Trợ lý CineFluent",
  clientState,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<IChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<IChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [booting, setBooting] = useState(false);
  const [isGuestGeneralChat, setIsGuestGeneralChat] = useState(false);

  const isGeneralContext = contextType === "general";
  const canUseGuestGeneralChat = isGeneralContext && isGuestGeneralChat;

  const sessionTitle = useMemo(() => {
    if (contextType === "movie") return "Chat học qua phim";
    if (contextType === "flashcard") return "Chat flashcard";
    if (contextType === "roadmap") return "Chat roadmap";
    if (contextType === "typing_game") return "Chat typing game";
    if (contextType === "realtime_practice") return "Chat luyện tập realtime";
    return "Chat hỗ trợ chung";
  }, [contextType]);

  const subtitleText = useMemo(() => {
    if (canUseGuestGeneralChat) {
      return "Chat chung dùng Product-RAG nội bộ, không cần đăng nhập.";
    }
    if (contextType === "movie") return "Hỏi về subtitle, ngữ pháp và đoạn phim đang xem.";
    if (contextType === "flashcard") return "Hỏi về bộ flashcard và cách ôn tập hiệu quả.";
    if (contextType === "roadmap") return "Hỏi về roadmap, tiến độ học và bước tiếp theo.";
    if (contextType === "typing_game") return "Hỏi về map, stage và phần luyện gõ hiện tại.";
    if (contextType === "realtime_practice") return "Hỏi về chủ đề và nội dung luyện tập realtime.";
    return "Hỏi về tính năng CineFluent, cách học và tài liệu nội bộ.";
  }, [canUseGuestGeneralChat, contextType]);

  async function bootstrapChat() {
    setBooting(true);
    try {
      const hasToken = await hasChatAccessTokenAction();
      if (!hasToken) {
        setSessions([]);
        setActiveSession(null);
        setIsGuestGeneralChat(isGeneralContext);
        if (!isGeneralContext) {
          setMessages([]);
        }
        return;
      }

      setIsGuestGeneralChat(false);
      const sessionList = await getChatSessionsAction();
      setSessions(sessionList);

      const matchedSession =
        sessionList.find(
          (item) =>
            item.context_type === contextType &&
            String(item.context_id ?? "") === String(contextId ?? ""),
        ) ?? null;

      if (matchedSession) {
        setActiveSession(matchedSession);
        const res = await getChatSessionMessagesAction(matchedSession.id);
        setMessages(res.messages);
        return;
      }

      const created = await createChatSessionAction({
        context_type: contextType,
        context_id: contextId,
        title: sessionTitle,
      });

      if (created) {
        setActiveSession(created);
        setSessions((prev) => [created, ...prev]);
        setMessages([]);
        return;
      }

      setActiveSession(null);
      if (isGeneralContext) {
        setIsGuestGeneralChat(true);
        return;
      }

      setMessages([]);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void bootstrapChat();
  }, [open, contextType, contextId]);

  async function handleSend() {
    const content = input.trim();
    const shouldUseGuestGeneralChat = canUseGuestGeneralChat;
    if (!content || (!activeSession && !shouldUseGuestGeneralChat)) return;

    const optimisticUserMessage: IChatMessage = {
      id: Date.now(),
      session_id: activeSession?.id ?? 0,
      user_id: shouldUseGuestGeneralChat ? "guest" : "me",
      role: "user",
      content,
      context_used: null,
      sources: null,
      usage: null,
      latency_ms: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    startTransition(async () => {
      const history = messages
        .slice(-6)
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const result = shouldUseGuestGeneralChat
        ? await askPublicChatAssistantAction({
            content,
            client_state: clientState,
            history,
          })
        : await askChatAssistantAction(activeSession!.id, {
            content,
            client_state: clientState,
          });

      const persistedUserMessage = result.user_message.content.trim()
        ? result.user_message
        : optimisticUserMessage;

      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (item) => item.id !== optimisticUserMessage.id,
        );
        return [
          ...withoutOptimistic,
          persistedUserMessage,
          result.assistant_message,
        ];
      });
    });
  }

  const canSend =
    !isPending &&
    Boolean(input.trim()) &&
    (Boolean(activeSession) || canUseGuestGeneralChat);

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-4 z-[70] flex h-16 w-16 items-center justify-center text-white transition-all hover:scale-[1.03] md:bottom-6 md:right-6"
        aria-label={open ? "Đóng chatbox AI" : "Mở chatbox AI"}
      >
        {open ? (
          <X size={24} />
        ) : (
          <div className="relative flex h-12 w-12 items-center justify-center">
            <Image
              src="/img/chatbox-ai-logo.svg"
              alt="CineFluent AI"
              width={48}
              height={48}
              className="drop-shadow-[0_8px_22px_rgba(59,130,246,0.45)]"
            />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-slate-950">
              AI
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-24 top-20 z-[65] flex flex-col overflow-hidden rounded-[28px] border border-white/12 bg-slate-950/88 text-white shadow-[0_32px_120px_rgba(15,23,42,0.72)] backdrop-blur-2xl md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(520px,calc(100dvh-120px))] md:w-[420px]">
          <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(110,231,249,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(30,41,59,0.96))] px-5 py-4">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 p-2.5 shadow-[0_8px_30px_rgba(59,130,246,0.18)]">
                  <Image
                    src="/img/chatbox-ai-logo.svg"
                    alt="CineFluent AI"
                    width={42}
                    height={42}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {title}
                    </h3>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      {canUseGuestGeneralChat ? "Khách" : "Sẵn sàng"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300/90">
                    {sessionTitle}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {subtitleText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,_rgba(15,23,42,0.2),_rgba(2,6,23,0.38))] px-4 py-4 md:px-5">
            {booting ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                Đang chuẩn bị phiên chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-slate-200">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 p-3 text-cyan-200">
                    <Bot size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Bắt đầu với CineFluent AI
                    </p>
                    <p className="text-xs text-slate-400">
                      {canUseGuestGeneralChat
                        ? "Bạn đang ở chế độ chat chung, chỉ dùng tài liệu nội bộ của CineFluent."
                        : "Trợ lý sẽ bám vào ngữ cảnh học tập hiện tại của bạn để trả lời sát hơn."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  {(canUseGuestGeneralChat
                    ? [
                        "CineFluent hiện có những tính năng học nào?",
                        "Hệ thống học qua phim hoạt động ra sao?",
                        "Quiz ngữ pháp và DKT dùng để làm gì?",
                      ]
                    : [
                        "Giải thích subtitle hiện tại theo ngữ cảnh",
                        "Gợi ý nên ôn từ nào trước",
                        "Hôm nay tôi nên học gì trong roadmap",
                      ]
                  ).map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-2.5 text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div
                      key={`${message.id}-${message.created_at}`}
                      className="ml-auto max-w-[82%] rounded-[22px] border border-blue-400/20 bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-3 text-sm leading-6 text-white shadow-[0_10px_32px_rgba(15,23,42,0.18)]"
                    >
                      <p>{message.content}</p>
                    </div>
                  ) : (
                    <div
                      key={`${message.id}-${message.created_at}`}
                      className="w-full px-1 py-1 text-sm leading-7 text-slate-100"
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.sources?.length ? (
                        <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-cyan-200/90">
                          Nguồn:{" "}
                          {message.sources[0]?.title ||
                            "Tài liệu nội bộ CineFluent"}
                        </div>
                      ) : null}
                    </div>
                  ),
                )}

                {isPending ? (
                  <div className="w-full px-1 py-2 text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-cyan-400/15 p-2 text-cyan-200">
                        <Bot size={16} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.25s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.12s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-300" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-white/10 bg-slate-950/95 p-3 md:p-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập câu hỏi cho trợ lý AI..."
                  rows={2}
                  className="min-h-[64px] flex-1 resize-none rounded-[18px] border border-transparent bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-400/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-[0_12px_30px_rgba(59,130,246,0.35)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span>
                  {isPending
                    ? "AI đang suy nghĩ..."
                    : canUseGuestGeneralChat
                    ? "Chat chung không cần đăng nhập"
                    : "Phản hồi theo ngữ cảnh CineFluent"}
                </span>
                <span>{canUseGuestGeneralChat ? "Phiên tạm" : `${sessions.length} phiên`}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
