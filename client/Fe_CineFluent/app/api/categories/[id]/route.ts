import {
  Api_delete_category,
  Api_update_category,
} from "@/app/lib/services/categories";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: any) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 }
    );
  }
  const body = await request.formData();
  const { id } = context.params;
  try {
    const res = await Api_update_category(id, body, token);
    return NextResponse.json(res.data, { status: res.status });
  } catch (error: any) {
    console.log(
      "Error updating category:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        message: "Error updating category",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized: Access token not found" },
      { status: 401 }
    );
  }
  try {
    const { id } = context.params;
    const res = await Api_delete_category(id, token);
    return NextResponse.json(res.data, { status: res.status });
  } catch (error: any) {
    console.log(
      "Error deleting category:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        message: "Error deleting category",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
