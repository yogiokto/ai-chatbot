'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { createMastraClient, type StreamEvent } from '@/lib/mastraClient';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  // Initialize Mastra client
  const mastraClient = createMastraClient({
    baseUrl: process.env.NEXT_PUBLIC_MASTRA_API_URL || 'http://localhost:4111',
    agentId: process.env.NEXT_PUBLIC_AGENT_ID || 'weatherAgent',
  });

  // Custom sendMessage function
  const sendMessage = async (message: ChatMessage) => {
    console.log('sendMessage called, isLoading:', isLoading);
    if (isLoading) return;

    console.log('Setting isLoading to true');
    setIsLoading(true);
    setStreamingMessage('');

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      parts: message.parts,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = generateUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }],
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);

    try {
      // Convert message to the format expected by Mastra client
      const messages = message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => ({
          role: 'user' as const,
          content: part.text,
        }));

      let accumulatedText = '';

      await mastraClient.stream(messages, (event: StreamEvent) => {
        if (event.type === 'delta' && event.data) {
          accumulatedText += event.data;
          console.log('Streaming delta:', event.data, 'Accumulated:', accumulatedText);
          setStreamingMessage(accumulatedText);

          // Update the assistant message with a new object reference
          setMessages((prev: ChatMessage[]) => prev.map((msg: ChatMessage) =>
            msg.id === assistantMessageId
              ? { ...msg, parts: [{ type: 'text', text: accumulatedText }] }
              : msg
          ));

          // Update data stream for artifacts
          setDataStream((ds: any) => (ds ? [...ds, event.data] : [event.data]));
        } else if (event.type === 'done') {
          console.log('Streaming done, final text:', accumulatedText);
          console.log('Setting isLoading to false');
          setIsLoading(false);
          setStreamingMessage('');
          mutate(unstable_serialize(getChatHistoryPaginationKey));
        } else if (event.type === 'error') {
          console.error('Stream error:', event.data);
          console.log('Setting isLoading to false due to error');
          toast({
            type: 'error',
            description: event.data || 'An error occurred during streaming',
          });
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Failed to send message',
      });
      setIsLoading(false);

      // Remove the placeholder assistant message on error
      setMessages((prev: ChatMessage[]) => prev.filter((msg: ChatMessage) => msg.id !== assistantMessageId));
    }
  };

  // Custom stop function
  const stop = () => {
    setIsLoading(false);
    setStreamingMessage('');
  };

  // Custom regenerate function
  const regenerate = async () => {
    if (messages.length < 2) return;

    const lastUserMessage = [...messages].reverse().find((msg: ChatMessage) => msg.role === 'user');
    if (lastUserMessage) {
      // Remove the last assistant message
      setMessages((prev: ChatMessage[]) => prev.slice(0, -1));
      await sendMessage(lastUserMessage);
    }
  };

  // Custom resumeStream function (placeholder)
  const resumeStream = () => {
    // For now, just restart the last message
    regenerate();
  };

  // Status mapping for compatibility
  const status = useMemo(() => {
    const currentStatus = isLoading ? 'streaming' : 'ready';
    console.log('Chat status computed:', currentStatus, 'isLoading:', isLoading);
    return currentStatus;
  }, [isLoading]);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      const message: ChatMessage = {
        id: generateUUID(),
        role: 'user',
        parts: [{ type: 'text', text: query }],
        createdAt: new Date().toISOString(),
      };
      sendMessage(message);

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background touch-pan-y overscroll-behavior-contain">
        <ChatHeader
          chatId={id}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          selectedModelId={initialChatModel}
        />

        <div className="sticky bottom-0 flex gap-2 px-2 md:px-4 pb-3 md:pb-4 mx-auto w-full bg-background max-w-4xl z-[1] border-t-0">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        selectedModelId={initialChatModel}
      />
    </>
  );
}
