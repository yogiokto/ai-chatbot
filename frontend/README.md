# AI Chatbot Frontend

Next.js frontend application for the AI Chatbot, using AI SDK v5 patterns with a separate Mastra AI backend.

## Overview

This frontend provides:
- Chat interface with real-time streaming
- Message history and management
- Artifact generation and display
- Responsive design with modern UI components

## Architecture

The frontend communicates with the Mastra backend via HTTP:
- REST calls for non-streaming operations
- Server-Sent Events (SSE) for real-time chat streaming
- Environment-based configuration for backend URL and agent selection

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Configure backend URL
# NEXT_PUBLIC_MASTRA_API_URL=http://localhost:3001
# NEXT_PUBLIC_AGENT_ID=default

# Start development server
pnpm dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MASTRA_API_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_AGENT_ID` | Default agent ID | `default` |

## Key Components

### Chat System
- **Chat Component** (`components/chat.tsx`): Main chat interface with custom Mastra integration
- **Messages** (`components/messages.tsx`): Message display and management
- **Multimodal Input** (`components/multimodal-input.tsx`): Input handling with attachments

### Mastra Client
- **Mastra Client** (`lib/mastraClient.ts`): HTTP client for backend communication
- Supports both streaming and non-streaming responses
- Handles SSE parsing and error management

### Artifacts
- **Artifact System**: Dynamic content generation (code, images, documents)
- **Data Stream**: Real-time artifact updates during streaming

## API Integration

### Streaming Chat
```typescript
import { createMastraClient } from '@/lib/mastraClient';

const client = createMastraClient({
  baseUrl: process.env.NEXT_PUBLIC_MASTRA_API_URL,
  agentId: process.env.NEXT_PUBLIC_AGENT_ID,
});

await client.stream(prompt, (event) => {
  if (event.type === 'delta') {
    // Handle text chunk
  } else if (event.type === 'done') {
    // Handle completion
  }
});
```

### Non-Streaming Generation
```typescript
const response = await client.generate(prompt, meta);
// response.text contains the full response
```

## Development

### Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting and formatting

### Key Files
- `app/(chat)/page.tsx` - Main chat page
- `components/chat.tsx` - Chat implementation with Mastra backend
- `lib/mastraClient.ts` - Backend communication client
- `lib/types.ts` - TypeScript type definitions

## UI Components

Built with:
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Icon system
- **Framer Motion**: Animations

## Features

- ✅ Real-time chat streaming via SSE
- ✅ Message history and regeneration
- ✅ Artifact generation and display
- ✅ Responsive design
- ✅ Error handling and loading states
- ✅ Environment-based backend configuration

## Integration Notes

- Uses AI SDK v5 patterns but with custom Mastra backend integration
- Maintains compatibility with existing UI components
- SSE parsing handles connection management and error recovery
- Easy switching between different backend environments via environment variables

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).
