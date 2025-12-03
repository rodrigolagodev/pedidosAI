'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalOrder } from '@/features/orders/hooks/useLocalOrder';
import { Loader2 } from 'lucide-react';

interface NewOrderInitializerProps {
  organizationId: string;
  organizationSlug: string;
}

export function NewOrderInitializer({
  organizationId,
  organizationSlug,
}: NewOrderInitializerProps) {
  const router = useRouter();
  const { createOrder } = useLocalOrder();

  useEffect(() => {
    const initOrder = async () => {
      try {
        // Create order locally in IndexedDB
        const newOrderId = await createOrder(organizationId);

        // Redirect to the organization-aware order page
        // The order will ONLY be synced to Supabase once items are added
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace(`/${organizationSlug}/orders/${newOrderId}` as any);
      } catch (error) {
        console.error('Failed to initialize local order:', error);
      }
    };

    initOrder();
  }, [organizationId, organizationSlug, createOrder, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Iniciando nuevo pedido...</p>
    </div>
  );
}
