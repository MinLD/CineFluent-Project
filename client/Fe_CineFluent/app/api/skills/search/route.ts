import { axiosClient } from "@/app/lib/services/api_client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const categoryId = searchParams.get("categoryId");

  const response = await axiosClient.get(
    `/skills/search/${categoryId}?keyword=${keyword}`
  );
  const { skills, pagination } = response?.data?.data;
  return NextResponse.json({ skills, pagination });
}
