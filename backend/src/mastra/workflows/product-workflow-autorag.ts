import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { RuntimeContext } from '@mastra/core/di';
import { autoragSearch } from '../tools/autorag-search';
import { ragRephrase } from '../tools/rag-rephrase';

const productSearchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(50).default(5),
});

const productRecommendationSchema = z.object({
  question: z.string(),
  snippets: z.array(z.string()),
  tone: z.enum(["neutral", "helpful", "executive"]).default("helpful"),
  language: z.enum(["id", "en"]).default("id"),
});

const productResultSchema = z.object({
  answer: z.string(),
  snippets: z.array(z.string()),
  query: z.string(),
});

const searchProducts = createStep({
  id: 'search-products',
  description: 'Search for product information using AutoRAG',
  inputSchema: z.object({
    query: z.string().describe('Product search query'),
    limit: z.number().min(1).max(50).default(5).describe('Maximum number of results'),
    tone: z.enum(["neutral", "helpful", "executive"]).default("helpful").describe('Response tone'),
    language: z.enum(["id", "en"]).default("id").describe('Response language'),
  }),
  outputSchema: z.object({
    snippets: z.array(z.string()),
    query: z.string(),
    tone: z.enum(["neutral", "helpful", "executive"]),
    language: z.enum(["id", "en"]),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { query, limit } = inputData;

    const runtimeContext = new RuntimeContext();

    // Call the AutoRAG search tool
    const result = await autoragSearch.execute({
      context: { query, limit },
      runtimeContext,
      tracingContext: {}
    });

    return {
      snippets: result.snippets,
      query,
      tone: inputData.tone,
      language: inputData.language,
    };
  },
});

const generateRecommendation = createStep({
  id: 'generate-recommendation',
  description: 'Generate user-friendly product recommendation from search results',
  inputSchema: z.object({
    snippets: z.array(z.string()),
    query: z.string(),
    tone: z.enum(["neutral", "helpful", "executive"]),
    language: z.enum(["id", "en"]),
  }),
  outputSchema: z.object({
    answer: z.string(),
    snippets: z.array(z.string()),
    query: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { snippets, query, tone, language } = inputData;

    if (!snippets || snippets.length === 0) {
      return {
        answer: language === 'id'
          ? 'Maaf, tidak ditemukan informasi produk yang relevan untuk pertanyaan Anda.'
          : 'Sorry, no relevant product information found for your question.',
        snippets: [],
        query,
      };
    }

    const runtimeContext = new RuntimeContext();

    // Call the RAG rephrase tool
    const result = await ragRephrase.execute({
      context: {
        question: query,
        snippets,
        tone,
        language,
      },
      runtimeContext,
      tracingContext: {}
    });

    return {
      answer: result.answer,
      snippets,
      query,
    };
  },
});

const productWorkflow = createWorkflow({
  id: 'product-workflow',
  inputSchema: z.object({
    query: z.string().describe('Product search query'),
    limit: z.number().min(1).max(50).default(5).describe('Maximum number of search results'),
    tone: z.enum(["neutral", "helpful", "executive"]).default("helpful").describe('Response tone'),
    language: z.enum(["id", "en"]).default("id").describe('Response language'),
  }),
  outputSchema: z.object({
    answer: z.string(),
    snippets: z.array(z.string()),
    query: z.string(),
  }),
})
  .then(searchProducts)
  .then(generateRecommendation);

productWorkflow.commit();

export { productWorkflow };
