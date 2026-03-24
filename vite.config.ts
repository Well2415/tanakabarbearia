import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Configuraremos o proxy para simular as funções do Vercel localmente
    }
  },
  plugins: [
    react(),
    mode === 'development' && {
      name: 'vercel-api-simulator',
      configureServer(server: any) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          const rawUrl = req.url || '';
          if (!rawUrl.includes('/api/')) return next();

          const urlPath = rawUrl.split('?')[0];
          console.log(`[Vite Simulator] 🚀 Requisição: ${req.method} ${urlPath}`);

          try {
            let body = '';
            if (req.method === 'POST') {
              body = await new Promise((resolve) => {
                let chunks = '';
                req.on('data', (chunk: any) => chunks += chunk);
                req.on('end', () => resolve(chunks));
              });
            }
            
            const bodyText = body || '{}';
            const parsedBody = JSON.parse(bodyText);
            const accessToken = parsedBody.accessToken;
            const backUrl = parsedBody.backUrl;
            const payerEmail = parsedBody.email || 'Não informado';

            console.log(`[Vite Simulator] 💳 Pagador: ${payerEmail}`);
            console.log(`[Vite Simulator] 🔑 Token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'Nulo'}`);
            
            // Garantir que temos um origin válido (fallback se o frontend não mandar)
            let origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : `http://${req.headers.host || 'localhost:8080'}`);
            if (origin.endsWith('/')) origin = origin.slice(0, -1);
            
            const finalBackUrl = backUrl || origin;

            // Rota: Criar Pix
            if (urlPath.includes('create-pix')) {
              console.log('[Vite Simulator] 💎 Gerando Pix...');
              const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                  'X-Idempotency-Key': Date.now().toString()
                },
                body: JSON.stringify({
                  transaction_amount: Number(parseFloat(String(parsedBody.amount)).toFixed(2)),
                  description: parsedBody.description,
                  payment_method_id: 'pix',
                  payer: {
                    email: parsedBody.email || 'contato@tanakabarbearia.com.br',
                    first_name: 'Cliente',
                    last_name: 'Tanaka'
                  }
                })
              });
              const data = await mpRes.json() as any;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return;
            }

            // Rota: Criar Preferência (Cartão)
            if (urlPath.includes('create-preference')) {
               console.log('[Vite Simulator] 💳 Gerando Checkout Cartão:', parsedBody.amount);
               const amount = Number(parseFloat(String(parsedBody.amount)).toFixed(2));
               
               const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                  items: [{
                    title: 'Serviços de Barbearia',
                    quantity: 1,
                    unit_price: amount,
                    currency_id: 'BRL'
                  }],
                  payer: { email: parsedBody.email || 'cliente@tanakabarbearia.com.br' },
                  binary_mode: false,
                  payment_methods: {
                    excluded_payment_methods: [{ id: 'ticket' }]
                  },
                  back_urls: {
                    success: "https://httpbin.org/redirect-to?url=" + encodeURIComponent(finalBackUrl + "?status=approved&payment_id=mock_local_tested_123"),
                    failure: "https://httpbin.org/redirect-to?url=" + encodeURIComponent(finalBackUrl + "?status=failure"),
                    pending: "https://httpbin.org/redirect-to?url=" + encodeURIComponent(finalBackUrl + "?status=pending")
                  },
                  auto_return: "approved"
                  // Removidas configurações extras para garantir compatibilidade com cartões de teste
                })
              });

              const status = mpRes.status;
              const data = await mpRes.json() as any;
              
              console.log(`[Vite Simulator] 📦 Resposta MP (Status ${status}):`, JSON.stringify(data, null, 2));

              if (!mpRes.ok) {
                console.error('[Vite Simulator] ❌ Erro ao criar preferência no MP:', data);
              } else {
                console.log('[Vite Simulator] ✅ Link Gerado:', data.id);
                console.log('[Vite Simulator] 🔗 Sandbox Link:', data.sandbox_init_point);
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = status;
              res.end(JSON.stringify(data));
              return;
            }

            // Rota: Verificar Status
            if (urlPath.includes('check-status')) {
              try {
                const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${parsedBody.paymentId}`, {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const status = mpRes.status;
                const data = await mpRes.json();
                
                console.log(`[Vite Simulator] 📦 Resposta MP (Status ${status}):`, JSON.stringify(data, null, 2));

                if (!mpRes.ok) {
                  console.error('[Vite Simulator] ❌ Erro ao verificar status no MP:', data);
                  res.statusCode = status;
                  res.end(JSON.stringify(data));
                  return;
                }
                
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(data));
                return;
              } catch (error) {
                console.error('[Vite Simulator] 🔥 Exceção ao verificar status:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Erro interno no simulador', message: String(error) }));
                return;
              }
            }

            next();
          } catch (error) {
            console.error('[Vite Simulator] 🔥 Erro:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Erro interno no simulador' }));
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
