import express from 'express';
import cors from 'cors';
import { mastra } from './mastra/index.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'], // Allow frontend
  credentials: false,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate endpoint (non-streaming)
app.post('/agents/:agentId/generate', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { prompt, meta } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get available agents
    const agents = mastra.getAgents();
    const agent = agents[agentId as keyof typeof agents];

    if (!agent) {
      return res.status(404).json({ error: `Agent ${agentId} not found` });
    }

    // Generate response
    const result = await agent.generate(prompt);

    res.json({
      text: result.text || '',
      meta,
    });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Stream endpoint (streaming)
app.post('/agents/:agentId/stream', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { prompt, meta } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get available agents
    const agents = mastra.getAgents();
    const agent = agents[agentId as keyof typeof agents];

    if (!agent) {
      return res.status(404).json({ error: `Agent ${agentId} not found` });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the response
    const streamResult = await agent.stream(prompt);

    // Handle the text stream
    for await (const chunk of streamResult.textStream) {
      res.write(`data: ${JSON.stringify({
        type: 'delta',
        data: chunk,
      })}\n\n`);
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'done',
      data: null,
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    } else {
      // If headers already sent, send error as SSE event
      res.write(`data: ${JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Internal server error',
      })}\n\n`);
      res.end();
    }
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mastra HTTP server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
