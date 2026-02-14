import { axiosClient } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: any) {
  const { id } = context.params;
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 }
    );
  }
  const body = await request.formData();

  try {
    const res = await axiosClient.patch(`/users/${id}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(res);
    return NextResponse.json(res.data.message, { status: res.data.code });
  } catch (error: any) {
    console.log("Error updating user:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Error updating user",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(context: any) {
  const { id } = context.params;

  // 1. Lấy token chuẩn Async
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // if (!token) {
  //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // }

  try {
    const res = await axiosClient.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(res.data.message, { status: res.data.code });
  } catch (error: any) {
    // 2. Trả đúng mã lỗi từ Backend (Quan trọng cho Interceptor)
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };

    console.error("Error deleting user:", data);
    return NextResponse.json(data, { status });
  }
}
