import { axiosClient } from "@/app/lib/services/api_client";
import {
  IAppendChatMessagePayload,
  IAskAssistantPayload,
  ICreateChatSessionPayload,
} from "@/app/lib/types/chat";

export const Api_Create_Chat_Session = (
  token?: string,
  payload?: ICreateChatSessionPayload,
) => {
  return axiosClient.post("/chat/sessions", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_Get_Chat_Sessions = (token?: string) => {
  return axiosClient.get("/chat/sessions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_Get_Chat_Session_Messages = (
  token?: string,
  sessionId?: number,
) => {
  return axiosClient.get(`/chat/sessions/${sessionId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_Append_Chat_Message = (
  token?: string,
  sessionId?: number,
  payload?: IAppendChatMessagePayload,
) => {
  return axiosClient.post(`/chat/sessions/${sessionId}/messages`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_Ask_Chat_Assistant = (
  token?: string,
  sessionId?: number,
  payload?: IAskAssistantPayload,
) => {
  return axiosClient.post(`/chat/sessions/${sessionId}/ask`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
