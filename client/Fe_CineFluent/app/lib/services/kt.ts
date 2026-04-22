import { BeUrl } from "./api_client";

export const Api_KT_Predict = async (token: string | undefined, tag_ids: number[]) => {
  const res = await fetch(`${BeUrl}/kt/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ tag_ids }),
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error(`[${res.status}] KT Predict failed`);
  }
  
  return await res.json();
};

export const Api_KT_UpdateState = async (token: string | undefined, tag_id: number, is_correct: number) => {
  const res = await fetch(`${BeUrl}/kt/update_state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ tag_id, is_correct }),
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error(`[${res.status}] KT Update failed`);
  }
  
  return await res.json();
};
