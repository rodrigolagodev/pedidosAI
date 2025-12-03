'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrderChatProvider } from '@/context/OrderChatContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ProcessButton } from './ProcessButton';
import { Database } from '@/types/database';
import { ConnectionStatus } from './ConnectionStatus';

type Message = Database['public']['Tables']['order_conversations']['Row'];

interface OrderChatInterfaceProps {
  orderId: string;
  initialMessages: Message[];
  organizationSlug: string;
  organizationId: string;
}

export function OrderChatInterface({
  orderId,
  initialMessages,
  organizationSlug,
  organizationId,
}: OrderChatInterfaceProps) {
  const router = useRouter();

  const handleOrderProcessed = useCallback(
    (redirectUrl: string) => {
      // Navigate to the review page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(redirectUrl as any);
    },
    [router]
  );

  return (
    <OrderChatProvider
      orderId={orderId}
      initialMessages={initialMessages}
      organizationId={organizationId}
      organizationSlug={organizationSlug}
      onOrderProcessed={handleOrderProcessed}
    >
      <div className="flex flex-col h-full bg-background">
        {/* Sticky Header - Below TopBar */}
        <div className="sticky top-[var(--top-bar-height)] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-none">Nuevo Pedido</h1>
            <div className="flex items-center gap-2 mt-1">
              <ConnectionStatus />
              <span className="text-xs text-muted-foreground">Graba o escribe</span>
            </div>
          </div>
          <ProcessButton />
        </div>

        {/* Chat Area - Full Height */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <MessageList />
          <ChatInput />
        </div>
      </div>
    </OrderChatProvider>
  );
}
