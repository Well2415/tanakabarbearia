import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// CONFIGURAÇÃO DAS CHAVES VAPID
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contato@tanakabarbearia.com.br',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

Deno.serve(async (req) => {
  // 1. Tratamento de CORS para preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extrair dados do corpo (POST)
    const { userId, title, body, url } = await req.json()

    // 3. Criar cliente Supabase com a Service Role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Buscar a inscrição de push do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pushSubscription')
      .eq('id', userId)
      .single()

    if (userError || !user?.pushSubscription) {
      console.error('Usuário não encontrado ou sem subscrição:', userId);
      return new Response(
        JSON.stringify({ error: 'Usuário sem inscrição de push' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const subscription = JSON.parse(user.pushSubscription)

    // 5. Enviar a notificação real
    const payload = JSON.stringify({ title, body, url })
    await webpush.sendNotification(subscription, payload)
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('❌ Erro crítico no envio de push:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
