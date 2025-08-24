# Next.js AI Chatbot Project Overview

## 1. Brief Overview

This is a Next.js AI chatbot application built with the Vercel AI SDK. It provides a complete chat interface with AI capabilities, user authentication, and data persistence. The application allows users to have conversations with AI models, with support for various tools and features.

## 2. Key Technologies Used

- **Next.js**: React framework with App Router for server-side rendering and client-side navigation
- **Vercel AI SDK**: Unified API for generating text, structured objects, and tool calls with LLMs
- **PostgreSQL**: Database for storing user data, chat history, and application state
- **Auth.js (NextAuth.js)**: Authentication system for user management
- **Tailwind CSS & shadcn/ui**: Styling and UI components
- **Drizzle ORM**: Database ORM for TypeScript

## 3. Main Features

- **Chat Functionality**: Interactive chat interface with streaming responses from AI models
- **AI Tools**: Extensible tool system (e.g., weather lookup, document creation/editing)
- **Authentication**: User authentication with guest access, login, and registration
- **Chat History**: Persistent storage of conversations with PostgreSQL
- **Message Voting**: Ability to upvote/downvote messages
- **Document Artifacts**: Creation and editing of documents during chat sessions
- **Multi-model Support**: Integration with various AI providers (xAI, OpenAI, etc.)

## 4. Project Structure Summary

```
app/
├── (auth)/          # Authentication pages and API routes
├── (chat)/          # Main chat interface and API routes
├── layout.tsx       # Root layout component
├── page.tsx         # Home page
components/           # React components
lib/
├── ai/              # AI-related functionality and tools
├── db/              # Database schema and queries
├── artifacts/       # Artifact-related functionality
hooks/               # Custom React hooks
public/              # Static assets
```

## 5. Database Schema Overview

The application uses PostgreSQL with the following main tables:

- **User**: Stores user information (id, email, password)
- **Chat**: Chat sessions with titles, creation dates, and visibility settings
- **Message_v2**: Chat messages with role, content parts, and attachments
- **Vote_v2**: User votes on messages (upvotes/downvotes)
- **Document**: Text documents that can be created and edited during chat
- **Suggestion**: Edit suggestions for documents
- **Stream**: Stream information for chat sessions

## 6. Authentication System

The authentication system is built with Auth.js (NextAuth.js) and provides:

- Guest access for users who don't want to create an account
- Email/password registration and login
- Session management with secure cookies
- Middleware protection for API routes and pages
- User-specific data isolation

Users can start as guests and later create accounts to persist their chat history.

## 7. How to Run the Project

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables by copying `.env.example` to `.env` and filling in the required values

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Access the application at http://localhost:3000

For production deployment, you can use:
```bash
pnpm build
pnpm start
```

The application requires PostgreSQL for data persistence and various API keys for AI model access.