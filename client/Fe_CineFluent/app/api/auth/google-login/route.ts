import { NextResponse } from "next/server";
import { AxiosError } from "axios";
import { Api_GoogleLogin } from "@/app/lib/services/auth";

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();
    const res = await Api_GoogleLogin(credential);
    const { access_token, refresh_token } = res.data.data;

    const response = NextResponse.json(res.data, {
      status: res.data.code,
    });

    response.cookies.set("access_token", access_token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 2592000,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.log(
      "Error in google login proxy: ",
      error.response?.data?.response?.message || error.message
    );
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(
        error.response.data.response || error.response.data,
        {
          status: error.response.status,
        }
      );
    }

    console.error("Lỗi API Route:", error);
    return NextResponse.json(
      { error: "Đã có lỗi phía máy chủ" },
      { status: 500 }
    );
  }
}
