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
    console.log('Recebida requisição OPTIONS - Respondendo com CORS');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Extrair e validar corpo
    const bodyData = await req.json();
    const { userId, title, body, url } = bodyData;
    console.log(`Solicitação de push para usuário: ${userId}`);

    // 3. Configurar Supabase e VAPID dentro de try
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const pubKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const privKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    if (!pubKey || !privKey) {
       throw new Error("Chaves VAPID não configuradas no Supabase Secrets.");
    }

    webpush.setVapidDetails(
      'mailto:contato@tanakabarbearia.com.br',
      pubKey,
      privKey
    );

    // 4. Buscar Usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pushSubscription')
      .eq('id', userId)
      .single();

    if (userError || !user?.pushSubscription) {
      console.error('Inscrição não encontrada para o ID:', userId);
      return new Response(
        JSON.stringify({ error: 'Inscrição não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Enviar Notificação
    const subscription = JSON.parse(user.pushSubscription);
    const payload = JSON.stringify({ title, body, url });
    
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Push enviado com sucesso para:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('❌ Falha na execução do Push:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
