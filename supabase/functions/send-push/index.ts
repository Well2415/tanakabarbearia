Deno.serve(async (req) => {
  console.log(`[PING] Requisição recebida: ${req.method}`);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Resposta imediata para teste
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "✅ SERVIDOR ON-LINE - VERSÃO 2.0",
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
