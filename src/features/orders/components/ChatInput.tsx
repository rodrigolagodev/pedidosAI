'use client';

import React, { useRef, useEffect, memo } from 'react';
import { useOrderChat } from '@/context/OrderChatContext';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Check, WifiOff, Wifi } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSync } from '@/context/SyncContext';

/**
 * ChatInput component with React.memo to prevent unnecessary re-renders
 * when orderId changes in the context (which doesn't affect this component's UI)
 */
export const ChatInput = memo(function ChatInput() {
  const {
    input,
    handleInputChange,
    handleSubmit,
    processAudio,
    isLoading,
    orderId,
    pendingCount,
    updateTypingActivity,
    setIsRecording,
  } = useOrderChat();
  const { isOnline } = useSync();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div
      className="fixed bottom-[var(--bottom-nav-height)] left-0 right-0 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-30"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-app mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                handleInputChange(e);
                updateTypingActivity();
              }}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu pedido..."
              className="min-h-[48px] max-h-[120px] resize-none pr-12 py-3 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary bg-background"
              rows={1}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 bottom-1 h-10 w-10 text-primary hover:bg-primary/10 disabled:opacity-50"
              onClick={e => {
                e.preventDefault();
                const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                handleSubmit(formEvent as unknown as React.FormEvent<HTMLFormElement>);
              }}
              disabled={!input.trim() || isLoading}
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <VoiceRecorderButton
            orderId={orderId}
            onRecordingComplete={processAudio}
            onRecordingStateChange={setIsRecording}
            disabled={input.length > 0} // Disable voice if typing
          />
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            {/* Online/Offline indicator */}
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-3 w-3" />
                <span className="text-[10px] font-medium">ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <WifiOff className="h-3 w-3" />
                <span className="text-[10px] font-medium">OFFLINE</span>
              </div>
            )}

            {/* Pending messages indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Check className="h-3 w-3" />
                <span className="text-[10px]">
                  {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
