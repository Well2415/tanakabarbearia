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

    // 4. Buscar Usuário
    console.log(`🔍 Buscando subscrição para ID: ${userId}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pushSubscription, fullName')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(`Erro ao buscar usuário no Banco: ${userError.message}`);
    if (!user?.pushSubscription) throw new Error(`O usuário ${user?.fullName || userId} não tem uma inscrição de Push ativa.`);

    // 5. Enviar Notificação
    console.log(`🚀 Enviando notificação para: ${user.fullName}`);
    const subscription = JSON.parse(user.pushSubscription);
    const payload = JSON.stringify({ title, body, url });
    
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Push entregue com sucesso!');

    return new Response(
      JSON.stringify({ success: true, message: 'Entregue' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('❌ ERRO NA EDGE FUNCTION:', err.message);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: err.message,
        details: 'Verifique os logs no dashboard do Supabase para mais detalhes.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
