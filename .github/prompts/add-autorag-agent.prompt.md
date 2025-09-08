# AI Coding Assistant — Add `product-agent` with AutoRAG + Friendly Rephrase Tool + Chat Route (Existing Mastra Project)

> **Goal**: Extend your existing Mastra project (no re-setup) with:
> 1. **AutoRAG search tool** to fetch context.
> 2. **Friendly rephrase tool** (LLM-powered) to rewrite RAG output into a user-friendly answer.
> 3. **`product-agent`** that chains *search → rephrase → answer*.
> 4. **Chat API route** that exposes `product-agent` to be consumed by a frontend (e.g., Next.js + AI SDK v5).
>
> Notes:  
> - No Cloudflare deployment.  
> - No Vercel AI Gateway.  
> - Local only.  
> - **ENV policy:** Always **append, never overwrite** your `.env` file.

---

## 1) Tool: AutoRAG Search

`src/mastra/tools/autorag-search.ts`
```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const autoragSearch = createTool({
  id: "autorag-search",
  description: "Search context from Cloudflare AutoRAG for product-related queries",
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().min(1).max(50).default(5),
  }),
  outputSchema: z.object({
    snippets: z.array(z.string()),
  }),
  execute: async ({ input }) => {
    const { query, limit } = input;

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

    if (!res.ok) throw new Error(\`AutoRAG error \${res.status}\`);

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
```

---

## 2) Tool: Friendly Rephrase (LLM)

`src/mastra/tools/rag-rephrase.ts`
```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const ragRephrase = createTool({
  id: "rag-rephrase",
  description:
    "Rewrite AutoRAG snippets into a concise, user-friendly answer. Keep facts, remove noise, and organize clearly.",
  inputSchema: z.object({
    question: z.string().min(1),
    snippets: z.array(z.string()).min(1),
    tone: z.enum(["neutral", "helpful", "executive"]).default("helpful"),
    language: z.enum(["id", "en"]).default("id"),
  }),
  outputSchema: z.object({
    answer: z.string(),
  }),
  execute: async ({ input }) => {
    const { question, snippets, tone, language } = input;

    const toneHints: Record<string, string> = {
      neutral: "neutral, factual tone",
      helpful: "friendly, concise, helpful tone",
      executive: "concise executive summary tone",
    };

    const langHints: Record<string, string> = {
      id: "Bahasa Indonesia that is clear and concise",
      en: "clear and concise English",
    };

    const prompt = `
You are a product assistant. The user asked: "${question}".
You are given RAG snippets (may be noisy/duplicated). Produce a short, well-structured answer in ${langHints[language]} with ${toneHints[tone]}.
Rules:
- Keep only facts implied by the snippets.
- Remove noise and duplication.
- Use short paragraphs or bullet points where helpful.
- If the snippets conflict, state the most likely interpretation.
- End with 1-2 actionable suggestions if relevant.

Snippets:
${snippets.map((s, i) => `(${i + 1}) ${s}`).join("\n\n")}
`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return { answer: text };
  },
});
```

---

## 3) Agent: `product-agent` (chain search → rephrase)

`src/mastra/agents/product-agent.ts`
```ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { autoragSearch } from "../tools/autorag-search";
import { ragRephrase } from "../tools/rag-rephrase";

export const productAgent = new Agent({
  name: "product-agent",
  instructions: [
    "You are a product assistant for answering product-related questions.",
    "Always call autorag-search first to retrieve relevant context.",
    "Then call rag-rephrase to produce a user-friendly answer from the retrieved snippets.",
    "Reply concisely and focus on key insights."
  ].join(" "),
  model: openai("gpt-4o-mini"),
  tools: { autoragSearch, ragRephrase },
});
```

---

## 4) Register the Agent (append, don’t replace)

`src/mastra/index.ts`
```ts
import { Mastra } from "@mastra/core/mastra";
import { productAgent } from "./agents/product-agent";

export const mastra = new Mastra({
  agents: {
    // keep existing agents...
    product: productAgent,
  },
});
```

> ⚠️ Do not remove existing agents. Always append.

---

## 5) Environment Variables (append, don’t overwrite)

Append to your `.env` file (do not overwrite existing content):

```
OPENAI_API_KEY=your_openai_api_key
CF_ACCOUNT_ID=your_cloudflare_account_id
AUTORAG_ID=your_autorag_id
AUTORAG_TOKEN=your_autorag_api_token
```

---

## 6) Expose Chat API for `product-agent`

Choose one option. **Option A is recommended**. Always append, never remove other routes.

### A) Using `chatRoute` helper from `@mastra/ai-sdk` (recommended)

`src/mastra/server.ts` (or your server entry):
```ts
import { Mastra } from "@mastra/core/mastra";
import { chatRoute } from "@mastra/ai-sdk";
import { productAgent } from "./agents/product-agent";

export const mastra = new Mastra({
  agents: { product: productAgent },
  server: {
    apiRoutes: [
      chatRoute({
        path: "/chat",       // endpoint for frontend
        agent: "product",    // must match agent key
      }),
      // keep other routes here...
    ],
  },
});
```

> This route streams **AI SDK v5 UI messages** (`text/event-stream`), ready for Next.js proxy.

### B) Manual with `streamVNext`

Example handler (adapt to your framework):
```ts
import { productAgent } from "../agents/product-agent";

export async function postChatHandler(req: Request) {
  const body = await req.json();
  const stream = await productAgent.streamVNext({
    messages: body.messages ?? [],
    format: "aisdk",
  });
  return stream.toUIMessageStreamResponse();
}
```

Optional CORS headers:
```ts
return new Response(await stream.readable, {
  headers: {
    "Content-Type": "text/event-stream",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
  },
});
```

---

## 7) Local Run & Test

1. `npm run dev` to start Mastra server.  
2. Ensure `/chat` endpoint is running.  
3. Connect frontend (e.g., Next.js + AI SDK v5) via `${NEXT_PUBLIC_MASTRA_URL}/chat`.  
4. Test: **autorag-search → rag-rephrase → friendly streamed answer**.

---

### ✅ Done

Your Mastra project now has a **`product-agent`** that:  
- Retrieves context from **AutoRAG**,  
- Rewrites it into a user-friendly response via **LLM**,  
- Exposes a **`/chat`** endpoint compatible with **AI SDK v5**.