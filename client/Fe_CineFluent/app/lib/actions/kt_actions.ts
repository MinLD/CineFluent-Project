"use server";

import { cookies } from "next/headers";
import { Api_KT_Predict, Api_KT_UpdateState } from "@/app/lib/services/kt";

export async function predictKtAction(tag_ids: number[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    
    if (!token) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    const data = await Api_KT_Predict(token, tag_ids);
    return { success: true, data: data.data };
  } catch (error: any) {
    if (error.message.includes("401")) {
      return { success: false, status: 401, message: "Unauthorized" };
    }
    console.error("KT Predict Action Error:", error.message);
    return { success: false, status: 500, message: "Server Error" };
  }
}

export async function updateKtStateAction(tag_id: number, is_correct: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    
    if (!token) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    const data = await Api_KT_UpdateState(token, tag_id, is_correct);
    return { success: true, data: data.data };
  } catch (error: any) {
    if (error.message.includes("401")) {
      return { success: false, status: 401, message: "Unauthorized" };
    }
    console.error("KT Update Action Error:", error.message);
    return { success: false, status: 500, message: "Server Error" };
  }
}
