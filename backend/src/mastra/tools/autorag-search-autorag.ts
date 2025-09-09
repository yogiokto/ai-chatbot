import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const autoragSearchAutorag = createTool({
  id: "autorag-search-autorag",
  description: "Search context from Cloudflare AutoRAG for product-related queries",
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(5),
  }),
  outputSchema: z.object({
    snippets: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { query, limit } = context;

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/autorag/rags/${process.env.AUTORAG_ID}/search`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AUTORAG_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          max_num_results: limit,
          rewrite_query: false,
        }),
      }
    );

    if (!res.ok) throw new Error(`AutoRAG error ${res.status}`);

    const data = await res.json();
    const items = data?.result?.data ?? [];
    const snippets = items.flatMap((item: any) =>
      (item?.content ?? [])
        .filter((c: any) => c?.type === "text")
        .map((c: any) => c?.text ?? "")
    );

    return { snippets };
  },
});
