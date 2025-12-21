import { createClient } from '@/lib/supabase/server';

export type HistoryFilter = {
  status?: string[];
  supplierId?: string;
  memberId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export async function fetchHistoryOrdersInternal(
  organizationId: string,
  filters: HistoryFilter = {},
  limit?: number
) {
  const supabase = await createClient();

  // Determine which types to fetch based on filters
  const supplierOrderStatuses = ['pending', 'sending', 'sent', 'failed', 'delivered'];
  const orderBundleStatuses = ['draft', 'review'];

  let showSupplierOrders = true;
  let showOrderBundles = true;

  if (filters.status && filters.status.length > 0) {
    // Check if filtering by supplier_order statuses or order statuses
    const hasSupplierOrderStatus = filters.status.some(s => supplierOrderStatuses.includes(s));
    const hasOrderBundleStatus = filters.status.some(s => orderBundleStatuses.includes(s));

    showSupplierOrders = hasSupplierOrderStatus;
    showOrderBundles = hasOrderBundleStatus;
  }

  // Prepare Queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries: PromiseLike<any>[] = [];

  // 1. Supplier Orders Query
  if (showSupplierOrders) {
    let supplierOrdersQuery = supabase
      .from('supplier_orders')
      .select(
        `
        id,
        status,
        created_at,
        sent_at,
        supplier_id,
        supplier:suppliers!inner(id, name),
        order:orders!inner(
          id,
          organization_id,
          created_by
        )
      `
      )
      .eq('order.organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      const relevantStatuses = filters.status.filter(s => supplierOrderStatuses.includes(s));
      if (relevantStatuses.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supplierOrdersQuery = supplierOrdersQuery.in('status', relevantStatuses as any);
      }
    }
    if (filters.supplierId) {
      supplierOrdersQuery = supplierOrdersQuery.eq('supplier_id', filters.supplierId);
    }
    if (filters.memberId) {
      supplierOrdersQuery = supplierOrdersQuery.eq('order.created_by', filters.memberId);
    }
    if (filters.dateFrom) {
      supplierOrdersQuery = supplierOrdersQuery.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      supplierOrdersQuery = supplierOrdersQuery.lte('created_at', filters.dateTo.toISOString());
    }

    if (limit && !showOrderBundles) {
      supplierOrdersQuery = supplierOrdersQuery.limit(limit);
    }

    queries.push(supplierOrdersQuery);
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  // 2. Order Bundles Query
  if (showOrderBundles) {
    let orderBundlesQuery = supabase
      .from('orders')
      .select(
        `
        id,
        status,
        created_at,
        sent_at,
        created_by
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      const relevantStatuses = filters.status.filter(s =>
        [...orderBundleStatuses, 'archived'].includes(s)
      );
      if (relevantStatuses.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBundlesQuery = orderBundlesQuery.in('status', relevantStatuses as any);
      } else {
        orderBundlesQuery = orderBundlesQuery.in('status', []);
      }
    } else {
      orderBundlesQuery = orderBundlesQuery.in('status', ['draft', 'review']);
    }

    if (filters.memberId) {
      orderBundlesQuery = orderBundlesQuery.eq('created_by', filters.memberId);
    }
    if (filters.dateFrom) {
      orderBundlesQuery = orderBundlesQuery.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      orderBundlesQuery = orderBundlesQuery.lte('created_at', filters.dateTo.toISOString());
    }

    if (limit && !showSupplierOrders) {
      orderBundlesQuery = orderBundlesQuery.limit(limit);
    }

    queries.push(orderBundlesQuery);
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  // Execute Main Queries in Parallel
  const [supplierOrdersResult, orderBundlesResult] = await Promise.all(queries);

  const supplierOrders = supplierOrdersResult.data || [];
  const orderBundles = orderBundlesResult.data || [];

  // Collect IDs for secondary fetches
  const userIds = new Set<string>();
  const orderIds = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supplierOrders.forEach((so: any) => {
    userIds.add(so.order.created_by);
    orderIds.add(so.order.id);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderBundles.forEach((order: any) => {
    userIds.add(order.created_by);
    orderIds.add(order.id);
  });

  // Secondary Queries (Profiles and Item Counts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const secondaryQueries: PromiseLike<any>[] = [];

  // 3. Profiles Query
  if (userIds.size > 0) {
    secondaryQueries.push(
      supabase.from('profiles').select('id, full_name, avatar_url').in('id', Array.from(userIds))
    );
  } else {
    secondaryQueries.push(Promise.resolve({ data: [] }));
  }

  // 4. Items Query
  if (orderIds.size > 0) {
    secondaryQueries.push(
      supabase
        .from('order_items')
        .select('order_id, supplier_id')
        .in('order_id', Array.from(orderIds))
    );
  } else {
    secondaryQueries.push(Promise.resolve({ data: [] }));
  }

  // Execute Secondary Queries in Parallel
  const [profilesResult, itemsResult] = await Promise.all(secondaryQueries);

  const profiles = profilesResult.data || [];
  const items = itemsResult.data || [];

  return {
    supplierOrders,
    orderBundles,
    profiles,
    items,
  };
}
