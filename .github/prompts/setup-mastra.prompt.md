# 🚀 Copilot Master Prompt — Split Mastra AI as Separate Backend (consumed by AI SDK v5 via HTTP)

**Context & Sources (read first):**

* Read `#file:AI_ASSISTANT_REFERENCE.md` and `#file:README.md` to understand the current project structure, conventions, and how the AI SDK v5 frontend works today.
* **Always check the latest Mastra AI documentation via Mastra MCP server** before suggesting or generating code. Use it as the source of truth for API references, integration details, and best practices.

**Goal:**

* Integrate **Mastra AI** as a **separate backend service** (standalone project) that exposes HTTP endpoints (JSON + SSE) to be consumed by the existing **AI SDK v5** frontend.
* The **Mastra backend** will be deployed on a **different platform** than the frontend. Keep the integration environment-agnostic (no provider-specific code).
* The frontend continues to use **Vercel AI SDK v5** hooks and will call the Mastra backend over HTTP.
* **IMPORTANT:** `.env.local` already has content — **append** new variables; **do not replace** existing ones.

---

## Deliverables

1. **Project Structure**

   * Two-project layout:
     * `frontend/` (existing AI SDK v5 Next.js app; keep changes minimal)
     * `backend/` (new service for Mastra AI: HTTP routes, JSON & SSE)
   * Add/update root-level or per-project `README.md` explaining local development, env vars, and how the pieces connect.

2. **Backend Service (Mastra AI)**

   * Tech stack: TypeScript, ESM-only, minimal HTTP framework (Express, Hono, etc.), Fetch/WHATWG Streams-compatible (no Node-native-only APIs).
   * Files to create:
     * `backend/package.json`
     * `backend/src/index.ts`
     * `backend/src/mastra.ts`
     * `backend/src/types.ts`
     * `backend/.env.example`
   * Routes:
     * `GET /health` → `{ status: "ok" }`
     * `POST /agents/:agentId/generate` → return `{ text, meta? }`
     * `POST /agents/:agentId/stream` → SSE stream (`delta`, `done`, `error`)
   * Auth:
     * **Skip authentication for now** — all routes are open access.
   * Error handling:
     * JSON errors for non-stream routes.
     * SSE route emits `error` event and closes the stream.

3. **Frontend Changes (AI SDK v5)**

   * Add `frontend/lib/mastraClient.ts`:
     * `generate(agentId, prompt)` → POST to backend `/agents/:id/generate`.
     * `stream(agentId, prompt, onEvent)` → connect to `/agents/:id/stream` with SSE.
   * Example page: `frontend/app/chat/page.tsx` using AI SDK v5 patterns.

4. **Environment Variables**

   * Append to `frontend/.env.local`:
     * `NEXT_PUBLIC_MASTRA_API_URL=<your-backend-url>`
     * `NEXT_PUBLIC_AGENT_ID=default`
   * `backend/.env.example`: include provider keys (e.g., `OPENAI_API_KEY`).

5. **Documentation**

   * Update/author `README.md` in both `frontend/` and `backend/`:
     * Setup & run locally (two terminals or dev scripts).
     * Env vars (append only).
     * How frontend calls backend (URLs, endpoints, SSE events).
     * How to change `agentId`.
     * Mention that **auth is skipped** in this version.
     * Note: Copilot must check **Mastra MCP server docs** for the latest integration details.

---

## Constraints & Acceptance Criteria

* **No Cloudflare/Vercel-specific code** — keep platform-agnostic.
* **SSE streaming works** end-to-end with AI SDK v5 UI.
* **Mastra initialization** in `backend/src/mastra.ts` with one example agent + trivial tool.
* **No authentication required.**
* **Error handling** is consistent and typed.
* Env vars appended safely, not overwritten.

---

## File-by-File Guidance for Copilot

**backend/package.json**

* `"type": "module"`.
* Scripts: `dev`, `build`, `start`, `typecheck`.
* Deps: `mastra`, `@mastra/core`, `express` or `hono`, types, `eventsource-parser`.

**backend/src/types.ts**

```ts
export interface GenerateRequest { prompt: string; meta?: Record<string, any>; }
export interface GenerateResponse { text: string; meta?: Record<string, any>; }
export interface StreamEvent { type: "delta" | "message" | "error" | "done"; data?: any; }
```

**backend/src/mastra.ts**

* Initialize Mastra and export `getAgent(agentId: string)`.
* Register a default agent (`"default"`) with a simple tool (echo/time).
* Read provider keys from env.

**backend/src/index.ts**

* Create HTTP app + CORS.
* Routes:
  * `/health` → `{ status: "ok" }`
  * `/agents/:id/generate` → call Mastra agent
  * `/agents/:id/stream` → SSE with `delta` + `done`.
* **No auth middleware applied.**

**frontend/lib/mastraClient.ts**

* Wrap backend calls.
* Normalize events to `{ type, data }`.

**frontend/app/chat/page.tsx**

* Submit user input, consume SSE, append deltas, finalize on done.

---

## Refactoring Notes for Copilot

* **Always check Mastra MCP server docs** for the latest API usage.
* Respect project conventions (`#file:AI_ASSISTANT_REFERENCE.md`, `#file:README.md`).
* Keep frontend UI intact, only re-route to backend.
* Use simple, focused modules with comments.
* Document any ambiguity in the README.

---

**Now implement all of the above (without auth).**
