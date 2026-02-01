import { Api_Logout } from "@/app/lib/services/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  const access_token = (await cookieStore).get("access_token")?.value;
  if (!access_token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 }
    );
  }
  try {
    const res = await Api_Logout(access_token);
    (await cookieStore).delete("access_token");
    (await cookieStore).delete("refresh_token");
    return NextResponse.json(res.data, { status: res.data.code });
  } catch (error: any) {
    console.log(
      "Error in logout proxy: ",
      error.response.data.response.message
    );
    return NextResponse.json(error.response.data.response.message, {
      status: 401,
    });
  }
}
