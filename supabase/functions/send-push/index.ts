import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // 1. Tratamento imediato de OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Extrair dados
    const bodyData = await req.json().catch(() => null);
    if (!bodyData) throw new Error("Corpo da requisição inválido ou vazio.");

    const { userId, title, body, url } = bodyData;
    console.log(`🔍 Iniciando processo para usuário: ${userId}`);

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
      throw new Error(`Nenhum dispositivo de Push encontrado para o usuário ${userId}.`);
    }

    // 5. Enviar Notificações em Paralelo
    const payload = JSON.stringify({ title, body, url });
    const results = await Promise.allSettled(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.data, payload);
        return { success: true, id: sub.id };
      } catch (err: any) {
        // Se o erro for 410 (Gone) ou 404 (Not Found), a inscrição expirou e deve ser removida
        if (sub.id && (err.statusCode === 410 || err.statusCode === 404)) {
          console.log(`🗑️ Removendo inscrição expirada: ${sub.id}`);
          await supabase.from('user_push_subscriptions').delete().eq('id', sub.id);
        }
        throw err;
      }
    }));

    const details = results.map((r, i) => ({
      device: i + 1,
      status: r.status === 'fulfilled' ? 'sent' : 'failed',
      error: r.status === 'rejected' ? (r as any).reason.message : null
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Processo finalizado. Sucessos: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        message: `${successCount} notificações enviadas.`,
        details 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('❌ ERRO NA EDGE FUNCTION:', err.message);
    
    // Identifica se é erro de configuração para retornar 400 em vez de 500
    const isConfigError = err.message.includes('não encontradas') || err.message.includes('não configuradas');
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: err.message,
        details: isConfigError ? '⚠️ ERRO DE CONFIGURAÇÃO: Verifique as Secrets no Painel do Supabase.' : 'Erro interno do servidor.'
      }),
      { status: isConfigError ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
