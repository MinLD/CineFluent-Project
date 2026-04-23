import { BeUrl } from "@/app/lib/services/api_client";

export async function Api_Get_Classrooms(token: string) {
  const response = await fetch(`${BeUrl}/classrooms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Get classrooms failed`);
  }

  return await response.json();
}

export async function Api_Get_Classroom_Detail(token: string, classroomId: number) {
  const response = await fetch(`${BeUrl}/classrooms/${classroomId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Get classroom detail failed`);
  }

  return await response.json();
}

export async function Api_Create_Classroom(
  token: string,
  payload: { name: string; description?: string },
) {
  const response = await fetch(`${BeUrl}/classrooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Create classroom failed`);
  }

  return await response.json();
}

export async function Api_Join_Classroom(token: string, inviteCode: string) {
  const response = await fetch(`${BeUrl}/classrooms/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ invite_code: inviteCode }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Join classroom failed`);
  }

  return await response.json();
}

export async function Api_Create_Class_Session(
  token: string,
  classroomId: number,
  payload: {
    title: string;
    description?: string;
    scheduled_at?: string;
    grammar_focus?: string[];
    teacher_notes?: string;
  },
) {
  const response = await fetch(`${BeUrl}/classrooms/${classroomId}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Create class session failed`);
  }

  return await response.json();
}
