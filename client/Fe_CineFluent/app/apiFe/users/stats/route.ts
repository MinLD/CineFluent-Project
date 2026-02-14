import { Api_Admin_States_Users } from "@/app/lib/services/user";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Access token not found" },
        { status: 401 }
      );
    }
    const response = await Api_Admin_States_Users(token);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
