'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useOrderChat } from '@/context/OrderChatContext';
import { Sparkles, Loader2 } from 'lucide-react';

export function ProcessButton() {
    const { processOrder, isProcessing, messages } = useOrderChat();

    // Only show if there are user messages
    const hasUserMessages = messages.some(m => m.role === 'user');

    if (!hasUserMessages) return null;

    return (
        <Button
            onClick={processOrder}
            disabled={isProcessing}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
        >
            {isProcessing ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4" />
                    Procesar Pedido
                </>
            )}
        </Button>
    );
}
