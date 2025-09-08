
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { productWorkflow } from './workflows/product-workflow';
import { weatherAgent } from './agents/weather-agent';
import { productAgent } from './agents/product-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow, productWorkflow },
  agents: { weatherAgent, productAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    port: 4111, // Default Mastra port for playground
    host: 'localhost',
    cors: {
      origin: ['http://localhost:3000'], // Allow frontend
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    },
  },
});
