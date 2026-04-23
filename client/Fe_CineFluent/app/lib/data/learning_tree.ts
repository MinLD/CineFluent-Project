import { cookies } from "next/headers";

import { BeUrl } from "@/app/lib/services/api_client";
import { ILearningTreePageData } from "@/app/lib/types/learning_tree";

export async function SSR_LearningTreeData(): Promise<{
  data: ILearningTreePageData | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [treeResponse, summaryResponse] = await Promise.all([
      fetch(`${BeUrl}/learning-tree`, {
        headers,
        next: { revalidate: 0, tags: ["learning-tree"] },
      }),
      fetch(`${BeUrl}/learning-tree/summary`, {
        headers,
        next: { revalidate: 0, tags: ["learning-tree-summary"] },
      }),
    ]);

    if (!treeResponse.ok || !summaryResponse.ok) {
      throw new Error("Không thể tải dữ liệu cây khám phá ngữ pháp.");
    }

    const treeJson = await treeResponse.json();
    const summaryJson = await summaryResponse.json();

    return {
      data: {
        tree: treeJson.data ?? null,
        summary: summaryJson.data ?? null,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error:
        error?.message || "Không thể tải dữ liệu cây khám phá ngữ pháp.",
    };
  }
}
