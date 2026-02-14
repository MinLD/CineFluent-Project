import { Api_search_categories } from "@/app/lib/services/categories";
import { NextRequest, NextResponse } from "next/server"; // Import NextRequest

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kw = searchParams.get("keyword");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "3", 10);

    if (!kw) {
      return NextResponse.json(
        { message: "Keyword not provided" },
        { status: 400 }
      );
    }

    const response = await Api_search_categories(kw, page, per_page);
    console.log("🔍 Search Categories Response:", response);

    const { categories, pagination } = response?.data.data || {};

    return NextResponse.json({ categories, pagination });
  } catch (error: any) {
    console.error("Error searching categories:", error);
    return NextResponse.json(
      { message: "Failed to search categories", error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}
