import { Api_Users } from "@/app/lib/services/user";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";


export async function GET(request: NextRequest) {
  try {
    // ✅ Next 16 Fix: Explicit await on cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Access token not found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "5", 10);

    const response = await Api_Users(token, page, per_page);
    const { users, pagination } = response?.data?.data;

    // ✅ Next 16 Fix: Set proper cache headers
    const responseData = NextResponse.json({ users, pagination });
    responseData.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    return responseData;
  } catch (error: any) {
    console.error("Error fetching users in API route:", error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch users",
        error: error.message,
      },
      {
        status: error.response?.status || 500,
      }
    );
  }
}
