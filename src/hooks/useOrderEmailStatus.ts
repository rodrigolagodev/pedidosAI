import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useOrderEmailStatus(orderId: string) {
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-email-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_orders',
          filter: `order_id=eq.${orderId}`,
        },
        payload => {
          const newStatus = payload.new.status;
          if (newStatus === 'sent') {
            toast.success('Email sent successfully!');
            setEmailStatus('sent');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  return emailStatus;
}
