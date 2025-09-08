# AI Chatbot with Mastra AI Backend

This project integrates a Next.js frontend with a separate Mastra AI backend service for AI-powered chat functionality.

## Project Structure

```
/
├── frontend/          # Next.js AI SDK v5 frontend
├── backend/           # Mastra AI backend service
└── README.md         # This file
```

## Architecture

- **Frontend**: Next.js application using AI SDK v5 hooks, communicating with the Mastra backend via HTTP
- **Backend**: Express.js server running Mastra AI agents, exposing REST and SSE endpoints
- **Communication**: Frontend calls backend endpoints for chat generation and streaming

## Local Development

### Prerequisites

- Node.js v20+
- pnpm (recommended) or npm
- OpenAI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ai-chatbot

   # Install frontend dependencies
   cd frontend && pnpm install

   # Install backend dependencies
   cd ../backend && pnpm install
   ```

2. **Configure environment variables:**

   **Frontend (.env.local):**
   ```bash
   NEXT_PUBLIC_MASTRA_API_URL=http://localhost:3001
   NEXT_PUBLIC_AGENT_ID=default
   ```

   **Backend (.env):**
   ```bash
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=3001
   ```

3. **Start the services:**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   pnpm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   pnpm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend health check: http://localhost:3001/health

## API Endpoints

### Backend Endpoints

- `GET /health` - Health check
- `POST /agents/:agentId/generate` - Generate response (JSON)
- `POST /agents/:agentId/stream` - Stream response (SSE)

### SSE Events

- `message` - Initial connection message
- `delta` - Text chunk
- `done` - Stream completion
- `error` - Error occurred

## Configuration

### Changing Agent ID

To use a different agent, update the `NEXT_PUBLIC_AGENT_ID` in the frontend `.env.local` file.

### Backend Configuration

The backend supports multiple agents. Currently configured:
- `default` - Basic agent with echo tool

## Deployment

### Backend Deployment

The backend can be deployed to any platform that supports Node.js:

```bash
cd backend
pnpm run build
pnpm start
```

### Frontend Deployment

The frontend can be deployed to Vercel, Netlify, or any static hosting platform:

```bash
cd frontend
pnpm run build
pnpm start
```

### Environment Variables for Production

**Frontend:**
```bash
NEXT_PUBLIC_MASTRA_API_URL=https://your-mastra-backend.com
NEXT_PUBLIC_AGENT_ID=default
```

**Backend:**
```bash
OPENAI_API_KEY=your-production-api-key
PORT=3001
```

## Development Scripts

### Frontend
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting

### Backend
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking

## Notes

- Authentication is currently skipped for this implementation
- The backend uses Server-Sent Events (SSE) for real-time streaming
- Error handling is implemented for both JSON and streaming responses
- The frontend maintains compatibility with existing UI components</content>
<parameter name="filePath">/Users/mac/Repos/dev/ai-chatbot-branches/with-mastra-ai-backend/ai-chatbot/README.md
