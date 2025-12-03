'use server';

import { getOrderContext } from '@/lib/auth/context';
import { revalidatePath } from 'next/cache';

/**
 * Archivar manualmente un pedido en draft o review
 * No requiere confirmación ya que es reversible
 */
export async function archiveOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, order } = await getOrderContext(orderId);

    // Validar que el pedido esté en un estado archivable
    if (!['draft', 'review'].includes(order.status)) {
      return {
        success: false,
        error: 'Solo se pueden archivar pedidos en borrador o revisión',
      };
    }

    // Actualizar estado a archived
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    // Invalidar cache de páginas que muestran este pedido
    revalidatePath('/[slug]', 'page'); // Dashboard
    revalidatePath('/[slug]/history', 'page'); // Historial

    return { success: true };
  } catch (error) {
    console.error('Error archiving order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al archivar pedido',
    };
  }
}

/**
 * Restaurar un pedido archivado a estado review
 * Permite recuperar pedidos archivados por error
 */
export async function restoreOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, order } = await getOrderContext(orderId);

    // Validar que el pedido esté archivado
    if (order.status !== 'archived') {
      return {
        success: false,
        error: 'Solo se pueden restaurar pedidos archivados',
      };
    }

    // Restaurar a review (estado más seguro para revisión)
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    // Invalidar cache
    revalidatePath('/[slug]', 'page');
    revalidatePath('/[slug]/history', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error restoring order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al restaurar pedido',
    };
  }
}

/**
 * Eliminar permanentemente un pedido archivado
 * Solo disponible para administradores
 * Requiere confirmación del usuario en el frontend
 */
export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, order, membership } = await getOrderContext(orderId);

    // Validar permisos: solo admins pueden eliminar
    if (membership.role !== 'admin') {
      return {
        success: false,
        error: 'Solo los administradores pueden eliminar pedidos permanentemente',
      };
    }

    // Validar que el pedido esté archivado
    if (order.status !== 'archived') {
      return {
        success: false,
        error: 'Solo se pueden eliminar pedidos archivados',
      };
    }

    // Eliminar items primero (por si no hay ON DELETE CASCADE)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Eliminar mensajes de conversación
    const { error: messagesError } = await supabase
      .from('order_conversations')
      .delete()
      .eq('order_id', orderId);

    if (messagesError) {
      console.warn('No conversation messages to delete or error:', messagesError);
    }

    // Eliminar archivos de audio (metadata, los archivos en Storage se pueden limpiar después)
    const { error: audioError } = await supabase
      .from('order_audio_files')
      .delete()
      .eq('order_id', orderId);

    if (audioError) {
      console.warn('No audio files to delete or error:', audioError);
    }

    // Finalmente, eliminar la orden
    const { error: orderError } = await supabase.from('orders').delete().eq('id', orderId);

    if (orderError) throw orderError;

    // Invalidar cache
    revalidatePath('/[slug]', 'page');
    revalidatePath('/[slug]/history', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar pedido',
    };
  }
}
