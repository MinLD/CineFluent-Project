import { cookies } from "next/headers";

import {
  Api_Get_Classroom_Detail,
  Api_Get_Classrooms,
} from "@/app/lib/services/classroom";
import { IClassroom, IClassroomListData } from "@/app/lib/types/classroom";

export async function SSR_ClassroomsData(): Promise<{
  data: IClassroomListData | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const response = await Api_Get_Classrooms(token);
    return { data: response.data ?? { classrooms: [] }, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Không thể tải danh sách lớp học.",
    };
  }
}

export async function SSR_ClassroomDetailData(classroomId: number): Promise<{
  data: IClassroom | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const response = await Api_Get_Classroom_Detail(token, classroomId);
    return { data: response.data ?? null, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Không thể tải thông tin lớp học.",
    };
  }
}
