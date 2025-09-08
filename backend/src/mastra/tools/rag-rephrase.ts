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
  execute: async ({ context }) => {
    const { question, snippets, tone, language } = context;

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
      model: openai("gpt-5-nano"),
      prompt,
    });

    return { answer: text };
  },
});
