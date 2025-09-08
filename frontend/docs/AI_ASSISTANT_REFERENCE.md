# AI Assistant Reference Guide

## Project Overview

This is an open-source AI chatbot template called "Chat SDK" built with Next.js 15, TypeScript, and Vercel AI SDK. Features conversational AI, artifact generation, authentication, multimodal capabilities. Tech stack: Next.js, React 19, PostgreSQL with Drizzle ORM, NextAuth.js, Vercel services, shadcn/ui.

## Directory Structure

- `app/` (Next.js app router with (auth) and (chat) route groups)
- `components/` (UI components with subdirectories)
- `lib/` (utilities, AI providers, database logic)
- `artifacts/` (specialized components for content types)
- `hooks/` (custom React hooks)
- `docs/` (documentation)

## Coding Standards and Conventions

- Biome for formatting/linting (2 spaces, 80 chars, single quotes, trailing commas)
- ESLint with Next.js rules
- TypeScript strict mode
- PascalCase for components
- camelCase for functions
- kebab-case for files
- Functional components with hooks
- Absolute imports with @/ alias

Example:
```typescript
// components/chat-header.tsx
import { useState } from 'react';

interface ChatHeaderProps {
  title: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

## Key Dependencies and Libraries

- Next.js 15.3.0-canary
- React 19.0.0-rc
- AI SDK 5.0.26
- Drizzle ORM 0.34.0
- NextAuth 5.0.0-beta.25
- Vercel services
- Tailwind CSS
- shadcn/ui
- CodeMirror
- ProseMirror
- Pyodide

## Main Functions or Modules

- **Core modules**: AI integration with models/providers/prompts/tools, database operations with schema/queries/migrate, artifact handling, authentication, chat processing
- **UI components**: chat interface, artifact panels, input components, navigation
- **Utilities**: core utils, hooks, configuration

## Common Workflows or Tasks

- Local development setup
- Adding features
- Code quality checks
- Debugging with Drizzle Studio
- Build/deployment to Vercel
- Testing with Playwright
- Database operations with migrations

## Troubleshooting Tips

- **Setup issues**: Environment variables, Node version
- **Database problems**: Migration failures, connection issues
- **AI integration**: API keys, rate limiting
- **Authentication**: Session errors
- **Build errors**: Biome/TypeScript issues

## Project-Specific Guidelines

- Use Biome for formatting
- Follow strict TypeScript
- Implement error handling with ChatSDKError
- Use server/client directives
- Maintain modular architecture
- Follow conventional commits
- Ensure accessibility with semantic HTML