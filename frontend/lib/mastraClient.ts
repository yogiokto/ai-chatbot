import { MastraClient } from '@mastra/client-js';

export interface GenerateRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  meta?: Record<string, any>;
}

export interface GenerateResponse {
  text: string;
  meta?: Record<string, any>;
}

export interface StreamEvent {
  type: "delta" | "message" | "error" | "done";
  data?: any;
}

export interface MastraClientOptions {
  baseUrl: string;
  agentId: string;
}

export class CustomMastraClient {
  private mastraClient: MastraClient;
  private agentId: string;

  constructor(options: MastraClientOptions) {
    this.mastraClient = new MastraClient({
      baseUrl: options.baseUrl,
    });
    this.agentId = options.agentId;
  }

  /**
   * Generate a response using the official Mastra client
   */
  async generate(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, meta?: Record<string, any>): Promise<GenerateResponse> {
    const agent = this.mastraClient.getAgent(this.agentId);
    const result = await agent.generate({
      messages,
      ...meta,
    });

    return {
      text: result.text || '',
      meta,
    };
  }

  /**
   * Stream a response using the official Mastra client
   */
  async stream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    onEvent: (event: StreamEvent) => void,
    meta?: Record<string, any>
  ): Promise<void> {
    const agent = this.mastraClient.getAgent(this.agentId);
    const streamResult = await agent.stream({
      messages,
      ...meta,
    });

    // Process the stream
    await streamResult.processDataStream({
      onTextPart: (text) => {
        onEvent({
          type: 'delta',
          data: text,
        });
      },
      onErrorPart: (error) => {
        onEvent({
          type: 'error',
          data: error,
        });
      },
    });

    // Send done event
    onEvent({
      type: 'done',
      data: null,
    });
  }
}

// Factory function for easier usage
export function createMastraClient(options: MastraClientOptions) {
  return new CustomMastraClient(options);
}
