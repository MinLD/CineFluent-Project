import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";
const backendApiUrl = isProd
  ? process.env.URL_BACKEND_INTERNAL || "http://backend:5000/api"
  : process.env.URL_BACKEND_LOCAL || "http://127.0.0.1:5000/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { classroomId } = await params;
  const response = await fetch(
    `${backendApiUrl}/classrooms/${classroomId}/homework-sources`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
