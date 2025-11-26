import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { record } = await req.json();

    if (!record || !record.id) {
      throw new Error('No record provided');
    }

    const jobId = record.id;
    const supplierOrderId = record.supplier_order_id;

    // 1. Fetch supplier order and supplier details
    const { data: supplierOrder, error: orderError } = await supabaseClient
      .from('supplier_orders')
      .select('*, suppliers(*)')
      .eq('id', supplierOrderId)
      .single();

    if (orderError || !supplierOrder) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    const supplier = supplierOrder.suppliers;
    if (!supplier || !supplier.email) {
      throw new Error('Supplier email not found');
    }

    // 2. Generate Email Content (Simplified for now)
    const emailHtml = `
      <h1>New Order from PedidosAI</h1>
      <p>Order ID: ${supplierOrder.id}</p>
      <p>Please check the attached details.</p>
      <p>${supplierOrder.message || ''}</p>
    `;

    // 3. Send Email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'PedidosAI <orders@pedidosai.com>', // TODO: Configure correct sender
      to: [supplier.email],
      subject: `New Order #${supplierOrder.order_number || supplierOrder.id}`,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(`Resend error: ${emailError.message}`);
    }

    // 4. Update Job Status to completed
    await supabaseClient
      .from('jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // 5. Update Supplier Order Status (for Realtime feedback)
    await supabaseClient
      .from('supplier_orders')
      .update({ status: 'sent' }) // Assuming 'sent' is a valid status
      .eq('id', supplierOrderId);

    return new Response(JSON.stringify({ message: 'Job processed successfully', jobId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing job:', error);

    // Attempt to update job status to failed if we have a record
    // Note: In a real scenario, we might want to retry based on error type
    // But for now, we just log and return error

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
