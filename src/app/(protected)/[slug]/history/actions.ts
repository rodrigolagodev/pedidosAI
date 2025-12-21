'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server';

export type HistoryFilter = {
  status?: string[];
  supplierId?: string;
  memberId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export type HistoryItem = {
  id: string;
  type: 'supplier_order' | 'order_bundle';
  displayId: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  supplier: {
    name: string;
    id: string;
  } | null;
  totalItems: number;
  createdBy: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  originalOrderId: string;
};

/**
 * Shared internal function to fetch history orders
 * Optimized to run independent queries in parallel
 */
import { fetchHistoryOrdersInternal as fetchRawHistory } from '@/features/history/queries/get-history';

/**
 * Shared internal function to fetch history orders
 * Optimized to run independent queries in parallel
 */
async function fetchHistoryOrdersInternal(
  organizationId: string,
  filters: HistoryFilter = {},
  limit?: number
) {
  const { supplierOrders, orderBundles, profiles, items } = await fetchRawHistory(
    organizationId,
    filters,
    limit
  );

  // Process Results
  const profilesMap: Record<string, any> = {};
  profiles.forEach((p: any) => {
    profilesMap[p.id] = p;
  });

  const itemCounts: Record<string, { total: number; bySupplier: Record<string, number> }> = {};
  items.forEach((item: any) => {
    if (!itemCounts[item.order_id]) {
      itemCounts[item.order_id] = { total: 0, bySupplier: {} };
    }
    itemCounts[item.order_id]!.total++;

    if (item.supplier_id) {
      if (!itemCounts[item.order_id]!.bySupplier[item.supplier_id]) {
        itemCounts[item.order_id]!.bySupplier[item.supplier_id] = 0;
      }
      itemCounts[item.order_id]!.bySupplier[item.supplier_id]!++;
    }
  });

  // Transform and Merge
  const historyItems: HistoryItem[] = [];

  supplierOrders.forEach((so: any) => {
    const profile = profilesMap[so.order.created_by] || {};
    const name = profile.full_name || 'Unknown';
    const avatar = profile.avatar_url || null;

    const count = itemCounts[so.order.id]?.bySupplier[so.supplier_id] || 0;

    historyItems.push({
      id: so.id,
      type: 'supplier_order',
      displayId: so.order.id.slice(0, 8),
      status: so.status,
      createdAt: so.created_at,
      sentAt: so.sent_at,
      supplier: so.supplier,
      totalItems: count,
      createdBy: {
        name,
        email: '',
        avatarUrl: avatar,
      },
      originalOrderId: so.order.id,
    });
  });

  orderBundles.forEach((order: any) => {
    const profile = profilesMap[order.created_by] || {};
    const name = profile.full_name || 'Unknown';
    const avatar = profile.avatar_url || null;

    const count = itemCounts[order.id]?.total || 0;

    historyItems.push({
      id: order.id,
      type: 'order_bundle',
      displayId: order.id.slice(0, 8),
      status: order.status,
      createdAt: order.created_at,
      sentAt: order.sent_at,
      supplier: null,
      totalItems: count,
      createdBy: {
        name,
        email: '',
        avatarUrl: avatar,
      },
      originalOrderId: order.id,
    });
  });

  const sortedItems = historyItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (limit) {
    return sortedItems.slice(0, limit);
  }

  return sortedItems;
}

export async function getHistoryOrders(
  organizationId: string,
  filters: HistoryFilter = {},
  limit?: number
) {
  return fetchHistoryOrdersInternal(organizationId, filters, limit);
}

export async function refreshHistoryOrders(
  organizationId: string,
  filters: HistoryFilter = {}
): Promise<HistoryItem[]> {
  return fetchHistoryOrdersInternal(organizationId, filters);
}

export async function getSuppliersForFilter(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('organization_id', organizationId)
    .order('name');
  return data || [];
}

export async function getMembersForFilter(organizationId: string) {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('organization_id', organizationId);

  if (!memberships || memberships.length === 0) return [];

  const userIds = memberships.map(m => m.user_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  return profiles || [];
}

/**
 * Manually resend a failed supplier order
 * Creates a new job in the queue to retry sending
 */
export async function resendSupplierOrder(
  supplierOrderId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'No autenticado' };
  }

  // 2. Fetch supplier order to verify access
  const { data: supplierOrder, error } = await supabase
    .from('supplier_orders')
    .select(
      `
      id,
      status,
      order:orders!inner(
        id,
        organization_id
      )
    `
    )
    .eq('id', supplierOrderId)
    .single();

  if (error || !supplierOrder) {
    return { success: false, message: 'Pedido no encontrado' };
  }

  // 3. Verify user belongs to organization
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', (supplierOrder.order as any).organization_id)
    .single();

  if (!membership) {
    return { success: false, message: 'No tienes permiso para reenviar este pedido' };
  }

  // 4. Reset supplier_order status to pending
  const { error: updateError } = await supabase
    .from('supplier_orders')
    .update({
      status: 'pending',
      error_message: null,
    })
    .eq('id', supplierOrderId);

  if (updateError) {
    return { success: false, message: 'Error al actualizar estado del pedido' };
  }

  // 5. Create a new job in the queue
  const { error: jobError } = await supabase.from('jobs').insert({
    type: 'SEND_SUPPLIER_ORDER',
    payload: { supplierOrderId },
    status: 'pending',
    attempts: 0,
    user_id: user.id,
  });

  if (jobError) {
    return { success: false, message: 'Error al encolar trabajo de reenvío' };
  }

  return { success: true, message: 'Pedido reencolado para reenvío' };
}
