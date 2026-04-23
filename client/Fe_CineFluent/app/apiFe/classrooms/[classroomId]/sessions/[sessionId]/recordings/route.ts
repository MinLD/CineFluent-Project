import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";
const backendApiUrl = isProd
  ? process.env.URL_BACKEND_INTERNAL || "http://backend:5000/api"
  : process.env.URL_BACKEND_LOCAL || "http://127.0.0.1:5000/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string; sessionId: string }> },
) {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { classroomId, sessionId } = await params;
  const formData = await request.formData();

  const response = await fetch(
    `${backendApiUrl}/classrooms/${classroomId}/sessions/${sessionId}/recordings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: "no-store",
    },
  );

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
