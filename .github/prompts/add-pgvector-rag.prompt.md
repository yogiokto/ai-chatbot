# Copilot Instruction — Add **PgVector RAG** as Default + Rename Existing AutoRAG Artifacts (MCP-enabled, official Mastra)

You are working **inside an existing Mastra project** that already has:
- **Agent**: `product-agent`
- **Tool**: `autorag-search`
- **Workflow**: `product-workflow`
…which currently use **Cloudflare AutoRAG**.

**Goal**
1) **Keep** the existing AutoRAG pipeline, but **rename it** to make it optional:
   - Agent → `product-agent-autorag`
   - Tool → `autorag-search-autorag`
   - Workflow → `product-workflow-autorag`
2) **Add a new PgVector RAG pipeline** and make it the **default**:
   - Agent → `product-agent` (PgVector)
   - Tool → `pg-search` (or `vector-search-pg`)
   - Workflow → `product-workflow`
3) Add a **file upsert script** and **docs folder** for PgVector.
4) Ensure **Mastra Docs MCP** is enabled in VS Code.
5) **Append** env keys (do **not** overwrite `.env` / `.env.local`).

Keep changes minimal and additive. Use TypeScript. Prefer `pnpm`.

---

## 1) Safe rename of existing AutoRAG artifacts (git-aware, no deletes)
Use **git moves** (preserve history) and update only the **names/ids**. **Do not** remove code.

**1.1) Agent rename**  
- Move/rename file if needed (e.g. `src/mastra/agents/product-agent.ts` → `src/mastra/agents/product-agent-autorag.ts`).  
- Inside the file, rename exported symbol and agent name/id to `product-agent-autorag`.

```ts
// before: export const productAgent = new Agent({ name: "product-agent", ... })
export const productAgentAutorag = new Agent({
  name: "product-agent-autorag",
  // keep instructions/model/tools as-is (AutoRAG flow)
});
```

**1.2) Tool rename**  
- Move/rename `src/mastra/tools/autorag-search.ts` → `src/mastra/tools/autorag-search-autorag.ts`.  
- Update export to `autoragSearchAutorag` and its `id` to `"autorag-search-autorag"`.

```ts
export const autoragSearchAutorag = createTool({
  id: "autorag-search-autorag",
  // ...keep existing execute(...) that calls Cloudflare AutoRAG
});
```

**1.3) Workflow rename**  
- Move/rename `src/mastra/workflows/product-workflow.ts` → `src/mastra/workflows/product-workflow-autorag.ts`.  
- Update exported symbol to `productWorkflowAutorag` and internal workflow `id/name` to `"product-workflow-autorag"`.

**1.4) Registration update**  
In your Mastra entry (e.g., `src/mastra/index.ts`), ensure **append-only** registration of the renamed artifacts (do not remove others):

```ts
import { productAgentAutorag } from "./agents/product-agent-autorag";
import { autoragSearchAutorag } from "./tools/autorag-search-autorag";
import { productWorkflowAutorag } from "./workflows/product-workflow-autorag";

export const mastra = new Mastra({
  agents: {
    // keep existing agents...
    "product-autorag": productAgentAutorag,
  },
  tools: {
    // keep existing tools...
    "autorag-search-autorag": autoragSearchAutorag,
  },
  workflows: {
    // keep existing workflows...
    "product-workflow-autorag": productWorkflowAutorag,
  },
  // server/apiRoutes remain untouched for now
});
```

> Note: If the project previously referenced `product-agent`, `autorag-search`, and `product-workflow` symbols elsewhere, update **imports** to the new `*-autorag` names where they belong to the AutoRAG flow.

---

## 2) Add new **PgVector RAG** artifacts (DEFAULT)

### 2.1) Dependencies (append-only)
```bash
pnpm add @mastra/pg @mastra/rag ai @ai-sdk/openai
pnpm add -D @types/node tsx
```

### 2.2) Env (append-only; do not overwrite)
Append missing keys to `.env` or `.env.local`:
```
POSTGRES_CONNECTION_STRING=postgres://user:password@host:5432/dbname
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
RAG_DOCS_DIR=./data/new-docs
```

### 2.3) New PgVector tool: `pg-search`
Create `src/mastra/tools/pg-search.ts` using **official pattern** (`MDocument`, `PgVector` for query can be separate; here we only define the search tool interface—you may later add a query function that hits PgVector with filters/rerank as per docs). For now keep it minimal or stub if query logic is not finalized.

```ts
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
  execute: async ({ input }) => {
    // Stub: return empty array for now (fill with PgVector query later)
    const { query, limit } = input;
    console.log("pg-search called:", { query, limit });
    return { snippets: [] };
  },
});
```

> If you already have a vector query utility, wire it here to **return `snippets: string[]`**.

### 2.4) New PgVector agent: `product-agent` (DEFAULT)
Create `src/mastra/agents/product-agent.ts`:

```ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { pgSearch } from "../tools/pg-search";

export const productAgent = new Agent({
  name: "product-agent",
  instructions: [
    "You are a product assistant with PgVector-backed RAG.",
    "Call pg-search to retrieve relevant context before answering.",
    "Respond concisely with key insights.",
  ].join(" "),
  model: openai("gpt-4o-mini"),
  tools: { pgSearch },
});
```

### 2.5) New PgVector workflow: `product-workflow`
Create `src/mastra/workflows/product-workflow.ts` (keep minimal; it can orchestrate pg-search + answer as needed).

```ts
export const productWorkflow = {
  id: "product-workflow",
  description: "Default product RAG workflow using PgVector",
  // add steps/nodes according to your project conventions
};
```

### 2.6) Register new defaults
Append to `src/mastra/index.ts`:

```ts
import { productAgent } from "./agents/product-agent";
import { pgSearch } from "./tools/pg-search";
import { productWorkflow } from "./workflows/product-workflow";

export const mastra = new Mastra({
  agents: {
    // default PgVector
    product: productAgent,
    // optional AutoRAG (renamed)
    "product-autorag": productAgentAutorag,
  },
  tools: {
    "pg-search": pgSearch,
    "autorag-search-autorag": autoragSearchAutorag,
  },
  workflows: {
    "product-workflow": productWorkflow,
    "product-workflow-autorag": productWorkflowAutorag,
  },
});
```

---

## 3) PgVector **upsert** pipeline (official Mastra pattern)

### 3.1) Create docs folder
```
data/new-docs/
```

### 3.2) Upsert script
Create `scripts/rag-upsert.ts` using **official APIs** (`MDocument.chunk()`, `embedMany()`, `PgVector.createIndex()`, `PgVector.upsert()`):

```ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { MDocument } from "@mastra/rag";
import { PgVector } from "@mastra/pg";

const RAG_DOCS_DIR = process.env.RAG_DOCS_DIR || "./data/new-docs";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 1536);
const POSTGRES_CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING;

if (!POSTGRES_CONNECTION_STRING) {
  console.error("Missing POSTGRES_CONNECTION_STRING");
  process.exit(1);
}

function idFor(source: string, idx: number) {
  return crypto.createHash("sha1").update(`${source}#${idx}`).digest("hex");
}

async function upsertFile(pgVector: PgVector, filePath: string) {
  const rel = path.relative(process.cwd(), filePath);
  const raw = await fs.promises.readFile(filePath, "utf8");

  const doc = MDocument.fromText(raw, { metadata: { source: rel } });
  const chunks = await doc.chunk();

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: chunks.map(c => c.text),
  });

  await pgVector.createIndex({
    indexName: "product_docs",
    dimension: EMBEDDING_DIM,
  });

  await pgVector.upsert({
    indexName: "product_docs",
    vectors: embeddings,
    metadata: chunks.map((c, i) => ({
      id: idFor(rel, i),
      text: c.text,
      source: rel,
      chunkIndex: i,
    })),
  });

  console.log(`Upserted ${chunks.length} chunks from ${rel}`);
}

async function main() {
  fs.mkdirSync(RAG_DOCS_DIR, { recursive: true });

  const pgVector = new PgVector({ connectionString: POSTGRES_CONNECTION_STRING! });
  const entries = await fs.promises.readdir(RAG_DOCS_DIR, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isFile()) continue;
    const filePath = path.join(RAG_DOCS_DIR, e.name);
    if (!/\.(md|txt|json|csv)$/i.test(filePath)) continue;
    await upsertFile(pgVector, filePath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Append scripts to `package.json` (append-only):
```jsonc
{
  "scripts": {
    "rag:upsert": "tsx scripts/rag-upsert.ts"
  }
}
```

(Optional) watch mode (requires nodemon):
```jsonc
{
  "scripts": {
    "rag:watch": "nodemon --ext md,txt,json,csv --watch data/new-docs --exec \"pnpm rag:upsert\""
  }
}
```

---

## 4) Make PgVector the **default** chat route, keep AutoRAG optional

If you currently expose `/chat` for the old agent, switch **default** to the **PgVector** agent, and add a second route for AutoRAG.

**A) Using `chatRoute` helper**
```ts
import { chatRoute } from "@mastra/ai-sdk";

export const mastra = new Mastra({
  // ...agents registered above
  server: {
    apiRoutes: [
      // Default: PgVector
      chatRoute({ path: "/chat", agent: "product" }),
      // Optional: AutoRAG
      chatRoute({ path: "/chat-autorag", agent: "product-autorag" }),
    ],
  },
});
```

**B) Manual `streamVNext`**  
Keep `/chat` → PgVector, and add `/chat-autorag` for the optional agent.

---

## 5) Acceptance criteria
- **Existing AutoRAG** artifacts renamed to `*-autorag` and still functional.
- **New PgVector** artifacts added and set as **default** (`product-agent`, `product-workflow`, `pg-search`).
- **Docs folder** (`data/new-docs/`) and **upsert script** exist and run.
- **MCP Mastra Docs** is enabled (append-only update).
- **Env keys appended**; no `.env`/`.env.local` content overwritten.
- **Server routes**: `/chat` uses PgVector agent by default; `/chat-autorag` serves optional AutoRAG agent.