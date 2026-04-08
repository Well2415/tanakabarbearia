import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, title, body, url } = await req.json();
    if (!userId) throw new Error("ID do usuário é obrigatório.");

    const supUrl = Deno.env.get('SUPABASE_URL')!;
    const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pubKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const privKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supUrl, supKey);
    webpush.setVapidDetails('mailto:contato@barbearia.com', pubKey, privKey);

    const { data: subs, error: subError } = await supabase
      .from('user_push_subscriptions')
      .select('id, subscription')
      .eq('user_id', String(userId));

    const subscriptions = [];
    if (!subError && subs && subs.length > 0) {
      subs.forEach(s => {
        try {
          subscriptions.push({ id: s.id, data: JSON.parse(s.subscription) });
        } catch (e) { /* silent fail for bad subscriptions */ }
      });
    } else {
      const { data: user } = await supabase.from('users').select('pushSubscription').eq('id', String(userId)).single();
      if (user?.pushSubscription) {
        try {
          subscriptions.push({ id: null, data: JSON.parse(user.pushSubscription) });
        } catch (e) { /* silent fail */ }
      }
    }

    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Sem dispositivos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let count = 0;
    const payload = JSON.stringify({ title, body, url });
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.data, payload);
        count++;
      } catch (err: any) {
        if (sub.id && (err.statusCode === 410 || err.statusCode === 404)) {
          await supabase.from('user_push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Entregue em ${count} aparelho(s)` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
