import { Api_Logout } from "@/app/lib/services/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AxiosError } from "axios";

export async function POST() {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("access_token")?.value;

  if (!access_token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 },
    );
  }

  try {
    const res = await Api_Logout(access_token);

    // Xóa cookie sau khi logout thành công
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return NextResponse.json(res.data, { status: res.data.code });
  } catch (error: any) {
    console.error("❌ [Logout Proxy] Error:", error);

    // Dù lỗi backend, vẫn nên xóa cookie ở frontend để user thoát được
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(
        error.response.data || { message: "Logout failed but cookies cleared" },
        {
          status: error.response.status,
        },
      );
    }

    return NextResponse.json(
      { message: "Logout failed but cookies cleared" },
      { status: 200 }, // Trả về 200 để frontend vẫn redirect được
    );
  }
}
