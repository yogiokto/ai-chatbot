import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// TODO: implement query against PgVector index "product_docs" per Mastra docs

export const pgSearch = createTool({
  id: "pg-search",
  description: "Semantic search over PgVector 'product_docs' index",
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(5),
  }),
  outputSchema: z.object({
    snippets: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    // Stub: return empty array for now (fill with PgVector query later)
    const { query, limit } = context;
    console.log("pg-search called:", { query, limit });
    return { snippets: [] };
  },
});
