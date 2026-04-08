// Versão Ultra-Simples sem arquivos externos para Diagnóstico
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log(`[PING] Requisição recebida: ${req.method}`);
  
  // Tratamento de OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Tenta ler o corpo apenas para logar
    const body = await req.json().catch(() => ({}));
    console.log('[PING] Body recebido:', body);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "✅ CONEXÃO ESTABELECIDA! O servidor está funcionando.",
        data: body 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { 
        status: 200, // Mantemos 200 para o site não dar erro vermelho
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
