import {
  Api_create_category,
  get_all_categories,
} from "@/app/lib/services/categories";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const per_page = parseInt(searchParams.get("per_page") || "3", 10);
  try {
    const res = await get_all_categories(page, per_page);
    console.log("API Route categories res:", res);
    if (res.status !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: res.status }
      );
    }
    const responseData = NextResponse.json(res.data.data, {
      status: res.data.code,
    });

    responseData.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    return responseData;
  } catch (error) {
    console.error("Lỗi API Route:", error);
    return NextResponse.json(
      { error: "Đã có lỗi phía máy chủ" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 }
    );
  }
  const formData = await request.formData();
  try {
    const res = await Api_create_category(formData, token);
    console.log("API Route create category res:", res);
    return NextResponse.json(res.data, { status: res.status });
  } catch (error: any) {
    console.error("Lỗi API Route tạo danh mục:", error);
    return NextResponse.json(
      {
        message: "Error creating category",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
