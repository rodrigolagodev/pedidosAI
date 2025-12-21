'use server';

import { getOrderContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';

/**
 * Get order review data with items grouped by supplier
 */
export async function getOrderReview(orderId: string) {
  const { supabase, order, membership } = await getOrderContext(orderId);

  // Parallel fetch: Organization, Items, Suppliers
  const [orgResult, itemsResult, suppliersResult] = await Promise.all([
    // Get organization details
    supabase.from('organizations').select('*').eq('id', order.organization_id).single(),

    // Get all items
    supabase.from('order_items').select('*').eq('order_id', orderId).order('created_at'),

    // Get suppliers
    supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', order.organization_id)
      .order('name'),
  ]);

  const { data: organization, error: orgError } = orgResult;
  const { data: items, error: itemsError } = itemsResult;
  const { data: suppliers, error: suppliersError } = suppliersResult;

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError);
    throw new Error('Organización no encontrada');
  }

  if (itemsError) {
    throw new Error('Error al cargar items');
  }

  if (suppliersError) {
    throw new Error('Error al cargar proveedores');
  }

  // Combine for compatibility
  const orderWithOrg = { ...order, organization };

  return {
    order: orderWithOrg,
    items: items || [],
    suppliers: suppliers || [],
    userRole: membership.role,
  };
}

/**
 * Get supplier order details for read-only view (individual supplier order)
 * This is used when viewing a specific supplier_order from the history
 */
export async function getSupplierOrderDetails(supplierOrderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Get supplier_order with related order and supplier info
  const { data: supplierOrder, error: supplierOrderError } = await supabase
    .from('supplier_orders')
    .select(
      `
      *,
      order:orders!inner(*),
      supplier:suppliers(*)
    `
    )
    .eq('id', supplierOrderId)
    .single();

  if (supplierOrderError || !supplierOrder) {
    console.error('Error fetching supplier order:', supplierOrderError);
    throw new Error('Pedido de proveedor no encontrado');
  }

  const order = supplierOrder.order;

  // Parallel fetch: Organization, Membership, Items
  const [orgResult, membershipResult, itemsResult] = await Promise.all([
    // Get organization details
    supabase.from('organizations').select('*').eq('id', order.organization_id).single(),

    // Verify user membership
    supabase
      .from('memberships')
      .select('role')
      .eq('organization_id', order.organization_id)
      .eq('user_id', user.id)
      .single(),

    // Get items ONLY for this specific supplier
    supabase
      .from('order_items')
      .select('*, supplier:suppliers(name, category)')
      .eq('order_id', order.id)
      .eq('supplier_id', supplierOrder.supplier_id)
      .order('created_at'),
  ]);

  const { data: organization, error: orgError } = orgResult;
  const { data: membership } = membershipResult;
  const { data: items, error: itemsError } = itemsResult;

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError);
    throw new Error('Organización no encontrada');
  }

  if (!membership) {
    throw new Error('No tienes acceso a este pedido');
  }

  if (itemsError) {
    throw new Error('Error al cargar items');
  }

  // Get only this supplier (not all suppliers)
  const supplier = supplierOrder.supplier;
  const suppliers = supplier ? [supplier] : [];

  // Combine for compatibility
  const orderWithOrg = { ...order, organization };

  return {
    order: orderWithOrg,
    items: items || [],
    suppliers,
    isSupplierOrder: true,
    supplierOrder,
  };
}

/**
 * Get order details for read-only view (sent/archived orders)
 * This function automatically detects if the ID is a regular order or a supplier_order
 */
export async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // First, try to fetch as a regular order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  // If not found as an order, try as supplier_order
  if (orderError || !order) {
    const { data: supplierOrder } = await supabase
      .from('supplier_orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (supplierOrder) {
      // Delegate to supplier order handler
      return getSupplierOrderDetails(orderId);
    }

    // Neither found, throw error
    console.error('Error fetching order:', orderError);
    throw new Error('Pedido no encontrado');
  }

  // Parallel fetch: Organization, Membership, Items, Suppliers
  const [orgResult, membershipResult, itemsResult, suppliersResult] = await Promise.all([
    // Get organization details
    supabase.from('organizations').select('*').eq('id', order.organization_id).single(),

    // Verify user membership
    supabase
      .from('memberships')
      .select('role')
      .eq('organization_id', order.organization_id)
      .eq('user_id', user.id)
      .single(),

    // Get all items with supplier info
    supabase
      .from('order_items')
      .select('*, supplier:suppliers(name, category)')
      .eq('order_id', orderId)
      .order('created_at'),

    // Get suppliers
    supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', order.organization_id)
      .order('name'),
  ]);

  const { data: organization, error: orgError } = orgResult;
  const { data: membership } = membershipResult;
  const { data: items, error: itemsError } = itemsResult;
  const { data: suppliers, error: suppliersError } = suppliersResult;

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError);
    throw new Error('Organización no encontrada');
  }

  if (!membership) {
    throw new Error('No tienes acceso a este pedido');
  }

  if (itemsError) {
    throw new Error('Error al cargar items');
  }

  if (suppliersError) {
    throw new Error('Error al cargar proveedores');
  }

  // Combine for compatibility
  const orderWithOrg = { ...order, organization };

  return {
    order: orderWithOrg,
    items: items || [],
    suppliers: suppliers || [],
  };
}

/**
 * Get conversation history for an order
 */
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch conversation history using an existing supabase client
 */
export async function fetchOrderConversation(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from('order_conversations')
    .select(
      `
      *,
      audio_file:order_audio_files(*)
    `
    )
    .eq('order_id', orderId)
    .order('sequence_number', { ascending: true });

  if (error) {
    console.error('Error fetching conversation:', error);
    throw new Error('Failed to fetch conversation');
  }

  return data;
}

/**
 * Get conversation history for an order
 */
export async function getOrderConversation(orderId: string) {
  const { supabase } = await getOrderContext(orderId);
  return fetchOrderConversation(supabase, orderId);
}
