import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log(`[HTTP] Recebida requisição ${req.method}`);
  
  // 1. Tratamento imediato de OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log('[HTTP] Corpo Bruto:', bodyText);
    
    const bodyData = JSON.parse(bodyText);
    const { userId, title, body, url } = bodyData;
    console.log(`🔍 [Push Server] Processando para: ${userId} | Título: ${title}`);

    if (!userId) throw new Error("O campo 'userId' é obrigatório.");

    // 3. Configurar Supabase e VAPID
    const supUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const pubKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const privKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    if (!supUrl || !supKey) throw new Error("Supabase URL ou Key não encontradas no ambiente.");
    if (!pubKey || !privKey) throw new Error("Chaves VAPID (PUBLIC/PRIVATE) não configuradas no Supabase Secrets.");

    const supabase = createClient(supUrl, supKey);

    webpush.setVapidDetails('https://tanakabarbearia.vercel.app', pubKey, privKey);

    // 4. Buscar Inscrições (Múltiplos Dispositivos)
    console.log(`🔍 Buscando inscrições para ID: ${userId}`);
    
    // Tentamos buscar na nova tabela de múltiplos dispositivos
    const { data: multiSubs, error: multiError } = await supabase
      .from('user_push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId);

    const subscriptions: any[] = [];

    if (!multiError && multiSubs && multiSubs.length > 0) {
      console.log(`📱 Encontrados ${multiSubs.length} dispositivos para este usuário.`);
      multiSubs.forEach(s => {
        try {
          subscriptions.push({ id: s.id, data: JSON.parse(s.subscription) });
        } catch (e) {
          console.error(`Erro ao parsear inscrição ${s.id}:`, e);
        }
      });
    } else {
      // Fallback para a coluna antiga caso a migração ainda não tenha ocorrido ou falhado
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('pushSubscription, fullName')
        .eq('id', userId)
        .single();
      
      if (user?.pushSubscription) {
        console.log("⚠️ Usando fallback da coluna única 'pushSubscription'.");
        subscriptions.push({ id: null, data: JSON.parse(user.pushSubscription) });
      }
    }

    if (subscriptions.length === 0) {
      console.log(`⚠️ Nenhum dispositivo encontrado para o usuário ${userId}. Ignorando silenciosamente.`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `O usuário ${userId} não possui dispositivos cadastrados para Push.` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Enviar Notificações (Loop Robusto)
    const payload = JSON.stringify({ title, body, url });
    const details = [];
    let successCount = 0;

    for (const sub of subscriptions) {
      try {
        console.log(`📡 Enviando para dispositivo ${sub.id || 'fallback'}...`);
        await webpush.sendNotification(sub.data, payload);
        successCount++;
        details.push({ id: sub.id, status: 'sent' });
      } catch (err: any) {
        console.error(`❌ Falha no dispositivo ${sub.id || 'fallback'}:`, err.message);
        
        // Trata expiração (Gone/NotFound)
        if (sub.id && (err.statusCode === 410 || err.statusCode === 404)) {
          console.log(`🗑️ Removendo dispositivo expirado: ${sub.id}`);
          await supabase.from('user_push_subscriptions').delete().eq('id', sub.id);
        }
        
        details.push({ id: sub.id, status: 'failed', error: err.message });
      }
    }

    console.log(`✅ Processo finalizado. Sucessos: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        message: `${successCount} notificações enviadas de ${subscriptions.length} dispositivos.`,
        details 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('❌ ERRO CRÍTICO NA EDGE FUNCTION:', err.message);
    
    // Retornamos 200 OK com success: false para que o log apareça no console sem "quebrar" a rede
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: true,
        message: `Erro na Função: ${err.message}`,
        details: err.stack || 'Sem detalhes técnicos.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
