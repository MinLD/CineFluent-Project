"use server";

import { cookies } from "next/headers";
import {
  Api_Ask_Chat_Assistant,
  Api_Create_Chat_Session,
  Api_Get_Chat_Session_Messages,
  Api_Get_Chat_Sessions,
} from "@/app/lib/services/chat";
import {
  IAskAssistantPayload,
  IAskAssistantResponse,
  IChatSession,
  IChatSessionMessagesResponse,
  ICreateChatSessionPayload,
} from "@/app/lib/types/chat";

function emptyAskResponse(): IAskAssistantResponse {
  return {
    session_id: 0,
    mode: "rag",
    user_message: {
      id: 0,
      session_id: 0,
      user_id: "",
      role: "user",
      content: "",
      context_used: null,
      sources: null,
      usage: null,
      latency_ms: null,
      created_at: null,
    },
    assistant_message: {
      id: 0,
      session_id: 0,
      user_id: "",
      role: "assistant",
      content: "Hiện chưa thể phản hồi. Bạn thử lại sau nhé.",
      context_used: null,
      sources: [],
      usage: null,
      latency_ms: null,
      created_at: null,
    },
    context_used: null,
    sources: [],
  };
}

function emptySessionMessages(): IChatSessionMessagesResponse {
  return {
    session: {
      id: 0,
      title: null,
      context_type: "general",
      context_id: null,
      created_at: null,
      updated_at: null,
    },
    messages: [],
  };
}

export async function createChatSessionAction(
  payload: ICreateChatSessionPayload,
): Promise<IChatSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Create_Chat_Session(token, payload);
    return res?.data?.data ?? null;
  } catch (error) {
    return null;
  }
}

export async function getChatSessionsAction(): Promise<IChatSession[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Get_Chat_Sessions(token);
    return res?.data?.data ?? [];
  } catch (error) {
    return [];
  }
}

export async function getChatSessionMessagesAction(
  sessionId: number,
): Promise<IChatSessionMessagesResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Get_Chat_Session_Messages(token, sessionId);
    return res?.data?.data ?? emptySessionMessages();
  } catch (error) {
    return emptySessionMessages();
  }
}

export async function askChatAssistantAction(
  sessionId: number,
  payload: IAskAssistantPayload,
): Promise<IAskAssistantResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Ask_Chat_Assistant(token, sessionId, payload);
    return res?.data?.data ?? emptyAskResponse();
  } catch (error) {
    return emptyAskResponse();
  }
}
