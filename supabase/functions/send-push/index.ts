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
    console.log(`🚀 [Push Server] Processando para: ${userId}`);

    if (!userId) throw new Error("ID do usuário é obrigatório.");

    const supUrl = Deno.env.get('SUPABASE_URL')!;
    const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pubKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const privKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supUrl, supKey);
    webpush.setVapidDetails('mailto:contato@barbearia.com', pubKey, privKey);

    // Busca inscrições (Lógica robusta para múltiplos dispositivos)
    const { data: subs, error: subError } = await supabase
      .from('user_push_subscriptions')
      .select('id, subscription')
      .eq('user_id', String(userId)); // Força string para evitar erro de UUID

    const subscriptions = [];
    if (!subError && subs && subs.length > 0) {
      subs.forEach(s => {
        try {
          subscriptions.push({ id: s.id, data: JSON.parse(s.subscription) });
        } catch (e) { console.error('Erro no parse:', e); }
      });
    } else {
      // Fallback para a tabela users (antigo)
      const { data: user } = await supabase.from('users').select('pushSubscription').eq('id', String(userId)).single();
      if (user?.pushSubscription) {
        try {
          subscriptions.push({ id: null, data: JSON.parse(user.pushSubscription) });
        } catch (e) { console.error('Erro no parse fallback:', e); }
      }
    }

    if (subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Sem dispositivos cadastrados' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Envio um por um para não quebrar o processo
    let count = 0;
    const payload = JSON.stringify({ title, body, url });
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.data, payload);
        count++;
      } catch (err: any) {
        console.error(`Falha no disp ${sub.id}:`, err.message);
        if (sub.id && (err.statusCode === 410 || err.statusCode === 404)) {
          await supabase.from('user_push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Entregue em ${count} aparelhos` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('ERRO:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200, // Manter 200 para o site procesar a mensagem de erro
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
