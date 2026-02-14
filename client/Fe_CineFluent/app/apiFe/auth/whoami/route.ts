// File: app/api/auth/whoami/route.ts (Proxy trên Server Next.js)
import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;

  const res = await fetch(`${BeUrl}/auth/whoami`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return NextResponse.json(await res.json());
}
