import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { JobQueue } from '@/services/queue';

/**
 * API Route para procesar jobs pendientes
 * Diseñado para ser llamado por un cron job externo (GitHub Actions, Vercel Cron, etc.)
 *
 * Seguridad:
 * - Requiere CRON_SECRET en header Authorization
 * - Usa Service Role Key para bypasear RLS y procesar todos los jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized cron job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Crear cliente Supabase con Service Role Key
    // Esto bypasea RLS y permite procesar jobs de todos los usuarios
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Procesar jobs pendientes
    console.error('[Cron] Starting job processing...');
    await JobQueue.processBatch(supabaseAdmin);
    console.error('[Cron] Job processing completed');

    return NextResponse.json({
      success: true,
      message: 'Jobs processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to process jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Prevenir caching de esta ruta
export const dynamic = 'force-dynamic';
export const revalidate = 0;
