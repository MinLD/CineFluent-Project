import { NextResponse } from "next/server";
import { AxiosError } from "axios";
import { Api_Login } from "@/app/lib/services/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, email } = body;

    const res = await Api_Login(email, password);

    const { access_token, refresh_token } = res.data.data;

    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https");

    const response = NextResponse.json(res.data, {
      status: res.data.code,
    });

    response.cookies.set("access_token", access_token, {
      secure: isHttps,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 2592000,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    // An toàn hơn khi truy xuất error.response
    if (error instanceof AxiosError) {
      if (error.response) {
        return NextResponse.json(
          error.response.data || { message: "Error from backend" },
          {
            status: error.response.status,
          },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal Proxy Error", details: error.message },
      { status: 500 },
    );
  }
}
