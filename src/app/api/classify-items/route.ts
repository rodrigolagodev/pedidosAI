import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyItemsBySupplier } from '@/lib/ai/classifier';
import { ParsedItem } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, orderId } = body;

        if (!items || !Array.isArray(items) || !orderId) {
            return NextResponse.json(
                { error: 'Invalid items or missing orderId' },
                { status: 400 }
            );
        }

        // 1. Validate user access
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get order to find organization_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('organization_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
        }

        // Check membership
        const { data: membership } = await supabase
            .from('memberships')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', order.organization_id)
            .single();

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch suppliers for the organization
        const { data: suppliers, error: suppliersError } = await supabase
            .from('suppliers')
            .select('*')
            .eq('organization_id', order.organization_id);

        if (suppliersError) {
            return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
        }

        // 3. Classify items
        const classifiedItems = classifyItemsBySupplier(items as ParsedItem[], suppliers || []);

        return NextResponse.json({ classifiedItems });

    } catch (error) {
        console.error('Classification API error:', error);
        return NextResponse.json(
            { error: 'Failed to classify items' },
            { status: 500 }
        );
    }
}
