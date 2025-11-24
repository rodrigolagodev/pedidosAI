'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ClassifiedItem } from '@/lib/ai/classifier';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Create a new draft order
 */
export async function createDraftOrder(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }

  return order;
}

/**
 * Save a message to the conversation history
 */
export async function saveConversationMessage(
  orderId: string,
  role: 'user' | 'assistant',
  content: string,
  audioFileId?: string,
  sequenceNumber?: number
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check access via order membership
  const { data: order } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

  // Use command pattern to execute business logic
  const { OrderCommands } = await import('@/application/commands/OrderCommands');
  const commands = new OrderCommands(supabase);

  await commands.addMessage({
    orderId,
    role,
    content,
    audioFileId,
    sequenceNumber: sequenceNumber || 0,
  });
}

/**
 * Save parsed and classified items to the order
 */
export async function saveParsedItems(orderId: string, items: ClassifiedItem[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check access via order membership
  const { data: order } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

  // Prepare items for insertion
  const dbItems = items.map(item => ({
    order_id: orderId,
    product: item.product,
    quantity: item.quantity,
    unit: item.unit,
    original_text: item.original_text,
    confidence_score: item.confidence,
    supplier_id: item.supplier_id, // Can be null
  }));

  const { error } = await supabase.from('order_items').insert(dbItems);

  if (error) {
    console.error('Error saving items:', error);
    throw new Error('Failed to save items');
  }

  revalidatePath(`/orders/${orderId}`);
}

/**
 * Process all messages in an order to extract items
 * - Fetches all user messages
 * - Aggregates text
 * - Parses with Gemini
 * - Classifies with Suppliers
 * - Replaces existing items
 */
export async function processOrderBatch(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // 1. Get order and verify access
  const { data: order } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

  // 2. Use command pattern to execute business logic
  const { OrderCommands } = await import('@/application/commands/OrderCommands');
  const commands = new OrderCommands(supabase);

  return await commands.processOrder(orderId, order.organization_id);
}

/**
 * Get conversation history for an order
 */
export async function getOrderConversation(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check access via order membership
  const { data: order } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

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
 * Send an order to suppliers
 */
export async function sendOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // 1. Get order and verify access
  const { data: order } = await supabase
    .from('orders')
    .select('organization_id, status')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', order.organization_id)
    .single();

  if (!membership) {
    throw new Error('Forbidden');
  }

  // Verify status
  if (order.status !== 'draft' && order.status !== 'review') {
    throw new Error('Order can only be sent from draft or review status');
  }

  // 2. Use command pattern to execute business logic
  const { OrderCommands } = await import('@/application/commands/OrderCommands');
  const commands = new OrderCommands(supabase);

  await commands.sendOrder(orderId);

  revalidatePath(`/orders/${orderId}`);

  return { success: true };
}

/**
 * Clean up empty draft orders older than a specified number of days
 * This function is designed to be called by a cron job with admin privileges
 *
 * @param supabaseAdmin - Supabase client with admin/service role privileges
 * @param daysOld - Number of days to consider a draft as "old" (default: 7)
 * @returns Object with count of deleted orders and any errors
 */
export async function cleanupEmptyDrafts(
  supabaseAdmin: SupabaseClient<Database>,
  daysOld: number = 7
): Promise<{ deletedCount: number; errors: string[] }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Find draft orders older than cutoff date
    const { data: oldDrafts, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, created_at')
      .eq('status', 'draft')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('[Cleanup] Error fetching old drafts:', fetchError);
      return { deletedCount: 0, errors: [fetchError.message] };
    }

    if (!oldDrafts || oldDrafts.length === 0) {
      console.error('[Cleanup] No old draft orders found');
      return { deletedCount: 0, errors: [] };
    }

    console.error(`[Cleanup] Found ${oldDrafts.length} old draft orders`);

    const deletedIds: string[] = [];
    const errors: string[] = [];

    // Check each draft for messages and delete if empty
    for (const draft of oldDrafts) {
      try {
        // Check if order has any messages
        const { data: messages, error: msgError } = await supabaseAdmin
          .from('order_conversations')
          .select('id')
          .eq('order_id', draft.id)
          .limit(1);

        if (msgError) {
          errors.push(`Error checking messages for order ${draft.id}: ${msgError.message}`);
          continue;
        }

        // If no messages, delete the order
        if (!messages || messages.length === 0) {
          const { error: deleteError } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', draft.id);

          if (deleteError) {
            errors.push(`Error deleting order ${draft.id}: ${deleteError.message}`);
          } else {
            deletedIds.push(draft.id);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing order ${draft.id}: ${errorMsg}`);
      }
    }

    console.error(`[Cleanup] Deleted ${deletedIds.length} empty draft orders`);
    if (errors.length > 0) {
      console.error('[Cleanup] Errors during cleanup:', errors);
    }

    return { deletedCount: deletedIds.length, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cleanup] Fatal error during cleanup:', errorMsg);
    return { deletedCount: 0, errors: [errorMsg] };
  }
}
