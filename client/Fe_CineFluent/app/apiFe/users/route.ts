import { Api_Register, Api_Users } from "@/app/lib/services/user";
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
        { status: 401 },
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
      "public, s-maxage=60, stale-while-revalidate=120",
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
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullname, email, password } = body;

    // Call Python Backend
    const res = await Api_Register(fullname, email, password);

    return NextResponse.json(res.data, { status: 201 });
  } catch (error: any) {
    console.error("Error registering user in API route:", error);

    // Check if it's an axios error with a response from backend
    if (error.response && error.response.data) {
      return NextResponse.json(error.response.data, {
        status: error.response.status || 500,
      });
    }

    return NextResponse.json(
      {
        message: "Failed to register user",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
