import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseOrderText } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, orderId } = body;

        if (!text || !orderId) {
            return NextResponse.json(
                { error: 'Missing text or orderId' },
                { status: 400 }
            );
        }

        // 1. Validate user access
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user has access to this order via organization membership
        const { data: orderAccess } = await supabase
            .from('orders')
            .select('organization_id')
            .eq('id', orderId)
            .single();

        if (!orderAccess) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const { data: membership } = await supabase
            .from('memberships')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', orderAccess.organization_id)
            .single();

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Parse with Gemini
        const items = await parseOrderText(text);

        return NextResponse.json({ items });

    } catch (error) {
        console.error('Parsing API error:', error);
        return NextResponse.json(
            { error: 'Failed to parse order' },
            { status: 500 }
        );
    }
}
