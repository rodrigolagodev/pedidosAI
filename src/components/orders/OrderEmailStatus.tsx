'use client';

import { useOrderEmailStatus } from '@/hooks/useOrderEmailStatus';

export function OrderEmailStatus({ orderId }: { orderId: string }) {
  useOrderEmailStatus(orderId);
  return null;
}
