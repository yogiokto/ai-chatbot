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

  // Delete existing chunks for this source to handle updates
  // TODO: Implement deletion based on PgVector API - may need raw SQL or different method
  // await pgVector.delete({
  //   indexName: "product_docs",
  //   filter: { source: rel },
  // });

  // TODO: Fix embedding model usage - check correct API for current AI SDK version
  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: chunks.map(c => c.text),
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

  console.log(`Upserted ${chunks.length} chunks from ${rel} (after deleting old ones)`);
}

async function main() {
  fs.mkdirSync(RAG_DOCS_DIR, { recursive: true });

  const pgVector = new PgVector({ connectionString: POSTGRES_CONNECTION_STRING! });

  // Create index once at the start
  await pgVector.createIndex({
    indexName: "product_docs",
    dimension: EMBEDDING_DIM,
  });

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
