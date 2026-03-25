import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push"

// CONFIGURAÇÃO DAS CHAVES VAPID
// Nota: Substitua pelas chaves reais geradas no painel
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

webpush.setVapidDetails(
  'mailto:contato@tanakabarbearia.com.br',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de CORS para preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, body, url } = await req.json()

    // 1. Criar cliente Supabase com a Service Role (para ler usuários)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Buscar a inscrição de push do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('pushSubscription')
      .eq('id', userId)
      .single()

    if (error || !user?.pushSubscription) {
      return new Response(JSON.stringify({ error: 'Usuário sem inscrição de push' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const subscription = JSON.parse(user.pushSubscription)

    // 3. Enviar a notificação real
    const payload = JSON.stringify({ title, body, url })
    await webpush.sendNotification(subscription, payload)
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Erro ao enviar push:', err)
    return new Response(JSON.stringify({ error: 'Falha no envio' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
