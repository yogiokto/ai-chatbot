# Chat SDK - AI Chatbot Template

## Project Introduction and Purpose

Chat SDK is an open-source AI chatbot template built with modern web technologies, designed to provide a robust foundation for building conversational AI applications. This project leverages the power of Next.js 15, TypeScript, and the Vercel AI SDK to create a feature-rich chatbot with multimodal capabilities, artifact generation, and real-time interactions.

The primary purpose of Chat SDK is to serve as a starting point for developers looking to build sophisticated AI-powered chat applications. It includes essential features like user authentication, message history, file uploads, and an extensible artifact system that can generate and display various types of content including text, code, images, and spreadsheets.

## Technology Stack and Architecture

### Core Technologies
- **Frontend Framework**: Next.js 15.3.0-canary.31 with App Router
- **UI Library**: React 19.0.0-rc with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Integration**: Vercel AI SDK (ai 5.0.26) with AI Gateway
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **Database**: PostgreSQL with Drizzle ORM 0.34.0
- **State Management**: React hooks and SWR for data fetching
- **Real-time Features**: Server-Sent Events for streaming responses

### Additional Libraries and Tools
- **Code Editor**: CodeMirror for in-app code editing
- **Rich Text**: ProseMirror for advanced text editing
- **Data Visualization**: React Data Grid for spreadsheet functionality
- **Icons**: Lucide React and Radix UI icons
- **Animations**: Framer Motion for smooth transitions
- **Caching**: Redis for session and data caching
- **File Storage**: Vercel Blob for file uploads
- **Testing**: Playwright for end-to-end testing
- **Linting/Formatting**: Biome and ESLint

### Architecture Overview
The application follows a modern Next.js architecture with:
- **App Router**: File-based routing with nested layouts
- **Server Components**: Optimized rendering and data fetching
- **API Routes**: RESTful endpoints for chat, authentication, and file handling
- **Middleware**: Authentication and request handling
- **Database Layer**: Drizzle ORM with migration support
- **Component Architecture**: Modular, reusable components with TypeScript

## Installation and Setup Instructions

### Prerequisites
- Node.js (version 18 or higher)
- pnpm package manager
- Vercel CLI (for deployment)
- PostgreSQL database
- Redis instance
- Vercel account (for AI Gateway and Blob storage)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-chatbot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and configure the following variables:

   ```env
   # Generate a random secret: https://generate-secret.vercel.app/32
   AUTH_SECRET=your-auth-secret-here

   # AI Gateway API Key (required for non-Vercel deployments)
   AI_GATEWAY_API_KEY=your-ai-gateway-key

   # Vercel Blob Store token
   BLOB_READ_WRITE_TOKEN=your-blob-token

   # PostgreSQL database URL
   POSTGRES_URL=your-postgres-url

   # Redis URL
   REDIS_URL=your-redis-url
   ```

4. **Set up the database**
   ```bash
   # Generate database schema
   pnpm db:generate

   # Run migrations
   pnpm db:migrate

   # (Optional) Open Drizzle Studio for database management
   pnpm db:studio
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Deployment
1. **Deploy to Vercel**
   ```bash
   vercel
   ```

2. **Configure environment variables in Vercel dashboard**

3. **Set up Vercel Postgres, Blob Storage, and Redis through Vercel dashboard**

## Usage Examples

### Basic Chat Interaction
```typescript
// Example of sending a message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello, how can you help me today?'
      }
    ],
    model: 'chat-model'
  })
});
```

### File Upload
```typescript
// Upload a file
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
});
```

### Creating an Artifact
```typescript
// Generate a code artifact
const artifactResponse = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Create a React component for a todo list'
      }
    ],
    createArtifact: true,
    artifactType: 'code'
  })
});
```

## Key Features and Components

### Core Features
- **Real-time Chat**: Streaming responses with WebSocket-like experience
- **Multimodal Input**: Support for text, images, and file uploads
- **Artifact System**: Generate and display various content types:
  - Text documents with rich formatting
  - Code snippets with syntax highlighting
  - Images and diagrams
  - Interactive spreadsheets
- **User Authentication**: Secure login with NextAuth.js
- **Message History**: Persistent chat history with search
- **Voting System**: Rate and feedback on responses
- **Model Selection**: Choose between different AI models
- **Theme Support**: Light and dark mode themes

### Key Components
- **Chat Interface**: Main conversation component with message display
- **Artifact Renderer**: Dynamic component for displaying generated content
- **File Upload**: Drag-and-drop file upload with preview
- **Model Selector**: Dropdown for choosing AI models
- **Sidebar**: Navigation with chat history and user settings
- **Authentication Forms**: Login and registration components
- **Data Stream Handler**: Manages real-time data updates

### Advanced Features
- **Auto-resume**: Continue conversations from previous sessions
- **Message Reasoning**: Display AI thought process for complex responses
- **Code Editor**: In-app code editing with syntax highlighting
- **Sheet Editor**: Spreadsheet functionality with data manipulation
- **Image Editor**: Basic image editing and annotation tools
- **Weather Integration**: Real-time weather data through AI tools

## API Reference

### Chat API
- `POST /api/chat` - Send messages and receive AI responses
- `GET /api/chat/[id]/stream` - Stream responses for a specific chat
- `POST /api/chat/schema` - Validate chat request schema

### Authentication API
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication routes
- `POST /api/auth/guest` - Create guest session

### File Management
- `POST /api/files/upload` - Upload files to blob storage
- `GET /api/document` - Retrieve document content

### Additional APIs
- `GET /api/history` - Retrieve chat history
- `GET /api/suggestions` - Get AI-generated suggestions
- `POST /api/vote` - Submit feedback on responses

### Request/Response Examples

**Chat Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "model": "chat-model-reasoning",
  "visibility": "private"
}
```

**Chat Response:**
```json
{
  "id": "chat-123",
  "messages": [
    {
      "role": "assistant",
      "content": "Quantum computing uses quantum mechanics...",
      "artifacts": []
    }
  ],
  "model": "chat-model-reasoning"
}
```

## Contributing Guidelines

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `pnpm install`
4. Set up your development environment with required environment variables
5. Run the development server: `pnpm dev`

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Linting**: Run `pnpm lint` before committing
- **Formatting**: Use `pnpm format` to format code with Biome
- **Testing**: Write tests for new features and run `pnpm test`

### Commit Guidelines
- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Keep commits focused and descriptive
- Squash related commits before merging

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers
5. Address review feedback

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (chat)/            # Chat interface routes
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility libraries and configurations
│   ├── ai/               # AI-related utilities
│   ├── db/               # Database schema and migrations
│   └── artifacts/        # Artifact generation logic
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── tests/                 # Test files
```

### Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Include detailed steps to reproduce bugs
- Provide environment information and error logs
- Suggest solutions when possible

### Feature Requests
- Check existing issues before creating new ones
- Provide detailed use cases and benefits
- Consider implementation complexity and alignment with project goals

---

Built with ❤️ using Next.js, TypeScript, and the Vercel AI SDK</instructions>