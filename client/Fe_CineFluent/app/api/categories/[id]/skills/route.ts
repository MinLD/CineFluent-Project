import { Api_get_all_skills_in_category } from "@/app/lib/services/categories";
import { NextRequest, NextResponse } from "next/server";

async function GET(nextRequest: NextRequest) {
  const { searchParams } = new URL(nextRequest.url);
  const categoryId = nextRequest.nextUrl.pathname.split("/")[3];
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "3";
  try {
    const res = await Api_get_all_skills_in_category(
      categoryId,
      parseInt(page),
      parseInt(per_page)
    );
    if (res.status !== 200) {
      return NextResponse.json(
        { message: "Error fetching skills" },
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
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { message: "Error fetching skills", error: error },
      { status: 500 }
    );
  }
}
