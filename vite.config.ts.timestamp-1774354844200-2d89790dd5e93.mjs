// vite.config.ts
import { defineConfig } from "file:///C:/Users/SERVIDOR/Desktop/barbearia/barb/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/SERVIDOR/Desktop/barbearia/barb/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/SERVIDOR/Desktop/barbearia/barb/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\SERVIDOR\\Desktop\\barbearia\\barb";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Configuraremos o proxy para simular as funções do Vercel localmente
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "vercel-api-simulator",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url || "";
          if (!rawUrl.includes("/api/")) return next();
          const urlPath = rawUrl.split("?")[0];
          console.log(`[Vite Simulator] \u{1F680} Requisi\xE7\xE3o: ${req.method} ${urlPath}`);
          try {
            let body = "";
            if (req.method === "POST") {
              body = await new Promise((resolve) => {
                let chunks = "";
                req.on("data", (chunk) => chunks += chunk);
                req.on("end", () => resolve(chunks));
              });
            }
            const bodyText = body || "{}";
            const parsedBody = JSON.parse(bodyText);
            const accessToken = parsedBody.accessToken;
            const backUrl = parsedBody.backUrl;
            const payerEmail = parsedBody.email || "N\xE3o informado";
            console.log(`[Vite Simulator] \u{1F4B3} Pagador: ${payerEmail}`);
            console.log(`[Vite Simulator] \u{1F511} Token: ${accessToken ? accessToken.substring(0, 10) + "..." : "Nulo"}`);
            let origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : `http://${req.headers.host || "localhost:8080"}`);
            if (origin.endsWith("/")) origin = origin.slice(0, -1);
            const finalBackUrl = backUrl || origin;
            if (urlPath.includes("create-pix")) {
              console.log("[Vite Simulator] \u{1F48E} Gerando Pix...");
              const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`,
                  "X-Idempotency-Key": Date.now().toString()
                },
                body: JSON.stringify({
                  transaction_amount: Number(parseFloat(String(parsedBody.amount)).toFixed(2)),
                  description: parsedBody.description,
                  payment_method_id: "pix",
                  payer: {
                    email: parsedBody.email || "contato@tanakabarbearia.com.br",
                    first_name: "Cliente",
                    last_name: "Tanaka"
                  }
                })
              });
              const data = await mpRes.json();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
              return;
            }
            if (urlPath.includes("create-preference")) {
              console.log("[Vite Simulator] \u{1F4B3} Gerando Checkout Cart\xE3o:", parsedBody.amount);
              const amount = Number(parseFloat(String(parsedBody.amount)).toFixed(2));
              const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                  items: [{
                    title: "Servi\xE7os de Barbearia",
                    quantity: 1,
                    unit_price: amount,
                    currency_id: "BRL"
                  }],
                  payer: { email: parsedBody.email || "test_user_12345678@testuser.com" },
                  binary_mode: false,
                  payment_methods: {
                    excluded_payment_methods: [{ id: "ticket" }]
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
              const data = await mpRes.json();
              console.log(`[Vite Simulator] \u{1F4E6} Resposta MP (Status ${status}):`, JSON.stringify(data, null, 2));
              if (!mpRes.ok) {
                console.error("[Vite Simulator] \u274C Erro ao criar prefer\xEAncia no MP:", data);
              } else {
                console.log("[Vite Simulator] \u2705 Link Gerado:", data.id);
                console.log("[Vite Simulator] \u{1F517} Sandbox Link:", data.sandbox_init_point);
              }
              res.setHeader("Content-Type", "application/json");
              res.statusCode = status;
              res.end(JSON.stringify(data));
              return;
            }
            if (urlPath.includes("check-status")) {
              try {
                const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${parsedBody.paymentId}`, {
                  headers: { "Authorization": `Bearer ${accessToken}` }
                });
                const status = mpRes.status;
                const data = await mpRes.json();
                console.log(`[Vite Simulator] \u{1F4E6} Resposta MP (Status ${status}):`, JSON.stringify(data, null, 2));
                if (!mpRes.ok) {
                  console.error("[Vite Simulator] \u274C Erro ao verificar status no MP:", data);
                  res.statusCode = status;
                  res.end(JSON.stringify(data));
                  return;
                }
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 200;
                res.end(JSON.stringify(data));
                return;
              } catch (error) {
                console.error("[Vite Simulator] \u{1F525} Exce\xE7\xE3o ao verificar status:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Erro interno no simulador", message: String(error) }));
                return;
              }
            }
            next();
          } catch (error) {
            console.error("[Vite Simulator] \u{1F525} Erro:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Erro interno no simulador" }));
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTRVJWSURPUlxcXFxEZXNrdG9wXFxcXGJhcmJlYXJpYVxcXFxiYXJiXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTRVJWSURPUlxcXFxEZXNrdG9wXFxcXGJhcmJlYXJpYVxcXFxiYXJiXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TRVJWSURPUi9EZXNrdG9wL2JhcmJlYXJpYS9iYXJiL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBwcm94eToge1xuICAgICAgLy8gQ29uZmlndXJhcmVtb3MgbyBwcm94eSBwYXJhIHNpbXVsYXIgYXMgZnVuXHUwMEU3XHUwMEY1ZXMgZG8gVmVyY2VsIGxvY2FsbWVudGVcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLCBcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAge1xuICAgICAgbmFtZTogJ3ZlcmNlbC1hcGktc2ltdWxhdG9yJyxcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGFueSkge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHJhd1VybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgICAgaWYgKCFyYXdVcmwuaW5jbHVkZXMoJy9hcGkvJykpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgICBjb25zdCB1cmxQYXRoID0gcmF3VXJsLnNwbGl0KCc/JylbMF07XG4gICAgICAgICAgY29uc29sZS5sb2coYFtWaXRlIFNpbXVsYXRvcl0gXHVEODNEXHVERTgwIFJlcXVpc2lcdTAwRTdcdTAwRTNvOiAke3JlcS5tZXRob2R9ICR7dXJsUGF0aH1gKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgICBib2R5ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY2h1bmtzID0gJyc7XG4gICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rOiBhbnkpID0+IGNodW5rcyArPSBjaHVuayk7XG4gICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGNodW5rcykpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgYm9keVRleHQgPSBib2R5IHx8ICd7fSc7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRCb2R5ID0gSlNPTi5wYXJzZShib2R5VGV4dCk7XG4gICAgICAgICAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IHBhcnNlZEJvZHkuYWNjZXNzVG9rZW47XG4gICAgICAgICAgICBjb25zdCBiYWNrVXJsID0gcGFyc2VkQm9keS5iYWNrVXJsO1xuICAgICAgICAgICAgY29uc3QgcGF5ZXJFbWFpbCA9IHBhcnNlZEJvZHkuZW1haWwgfHwgJ05cdTAwRTNvIGluZm9ybWFkbyc7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1RENCMyBQYWdhZG9yOiAke3BheWVyRW1haWx9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdUREMTEgVG9rZW46ICR7YWNjZXNzVG9rZW4gPyBhY2Nlc3NUb2tlbi5zdWJzdHJpbmcoMCwgMTApICsgJy4uLicgOiAnTnVsbyd9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdhcmFudGlyIHF1ZSB0ZW1vcyB1bSBvcmlnaW4gdlx1MDBFMWxpZG8gKGZhbGxiYWNrIHNlIG8gZnJvbnRlbmQgblx1MDBFM28gbWFuZGFyKVxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHJlcS5oZWFkZXJzLm9yaWdpbiB8fCAocmVxLmhlYWRlcnMucmVmZXJlciA/IG5ldyBVUkwocmVxLmhlYWRlcnMucmVmZXJlcikub3JpZ2luIDogYGh0dHA6Ly8ke3JlcS5oZWFkZXJzLmhvc3QgfHwgJ2xvY2FsaG9zdDo4MDgwJ31gKTtcbiAgICAgICAgICAgIGlmIChvcmlnaW4uZW5kc1dpdGgoJy8nKSkgb3JpZ2luID0gb3JpZ2luLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgZmluYWxCYWNrVXJsID0gYmFja1VybCB8fCBvcmlnaW47XG5cbiAgICAgICAgICAgIC8vIFJvdGE6IENyaWFyIFBpeFxuICAgICAgICAgICAgaWYgKHVybFBhdGguaW5jbHVkZXMoJ2NyZWF0ZS1waXgnKSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdURDOEUgR2VyYW5kbyBQaXguLi4nKTtcbiAgICAgICAgICAgICAgY29uc3QgbXBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkubWVyY2Fkb3BhZ28uY29tL3YxL3BheW1lbnRzJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gLFxuICAgICAgICAgICAgICAgICAgJ1gtSWRlbXBvdGVuY3ktS2V5JzogRGF0ZS5ub3coKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9hbW91bnQ6IE51bWJlcihwYXJzZUZsb2F0KFN0cmluZyhwYXJzZWRCb2R5LmFtb3VudCkpLnRvRml4ZWQoMikpLFxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHBhcnNlZEJvZHkuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICBwYXltZW50X21ldGhvZF9pZDogJ3BpeCcsXG4gICAgICAgICAgICAgICAgICBwYXllcjoge1xuICAgICAgICAgICAgICAgICAgICBlbWFpbDogcGFyc2VkQm9keS5lbWFpbCB8fCAnY29udGF0b0B0YW5ha2FiYXJiZWFyaWEuY29tLmJyJyxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbmFtZTogJ0NsaWVudGUnLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X25hbWU6ICdUYW5ha2EnXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBtcFJlcy5qc29uKCkgYXMgYW55O1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSb3RhOiBDcmlhciBQcmVmZXJcdTAwRUFuY2lhIChDYXJ0XHUwMEUzbylcbiAgICAgICAgICAgIGlmICh1cmxQYXRoLmluY2x1ZGVzKCdjcmVhdGUtcHJlZmVyZW5jZScpKSB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdURDQjMgR2VyYW5kbyBDaGVja291dCBDYXJ0XHUwMEUzbzonLCBwYXJzZWRCb2R5LmFtb3VudCk7XG4gICAgICAgICAgICAgICBjb25zdCBhbW91bnQgPSBOdW1iZXIocGFyc2VGbG9hdChTdHJpbmcocGFyc2VkQm9keS5hbW91bnQpKS50b0ZpeGVkKDIpKTtcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgY29uc3QgbXBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkubWVyY2Fkb3BhZ28uY29tL2NoZWNrb3V0L3ByZWZlcmVuY2VzJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBpdGVtczogW3tcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdTZXJ2aVx1MDBFN29zIGRlIEJhcmJlYXJpYScsXG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICB1bml0X3ByaWNlOiBhbW91bnQsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5X2lkOiAnQlJMJ1xuICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICBwYXllcjogeyBlbWFpbDogcGFyc2VkQm9keS5lbWFpbCB8fCAndGVzdF91c2VyXzEyMzQ1Njc4QHRlc3R1c2VyLmNvbScgfSxcbiAgICAgICAgICAgICAgICAgIGJpbmFyeV9tb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHBheW1lbnRfbWV0aG9kczoge1xuICAgICAgICAgICAgICAgICAgICBleGNsdWRlZF9wYXltZW50X21ldGhvZHM6IFt7IGlkOiAndGlja2V0JyB9XVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGJhY2tfdXJsczoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBcImh0dHBzOi8vaHR0cGJpbi5vcmcvcmVkaXJlY3QtdG8/dXJsPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbmFsQmFja1VybCArIFwiP3N0YXR1cz1hcHByb3ZlZCZwYXltZW50X2lkPW1vY2tfbG9jYWxfdGVzdGVkXzEyM1wiKSxcbiAgICAgICAgICAgICAgICAgICAgZmFpbHVyZTogXCJodHRwczovL2h0dHBiaW4ub3JnL3JlZGlyZWN0LXRvP3VybD1cIiArIGVuY29kZVVSSUNvbXBvbmVudChmaW5hbEJhY2tVcmwgKyBcIj9zdGF0dXM9ZmFpbHVyZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZzogXCJodHRwczovL2h0dHBiaW4ub3JnL3JlZGlyZWN0LXRvP3VybD1cIiArIGVuY29kZVVSSUNvbXBvbmVudChmaW5hbEJhY2tVcmwgKyBcIj9zdGF0dXM9cGVuZGluZ1wiKVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGF1dG9fcmV0dXJuOiBcImFwcHJvdmVkXCJcbiAgICAgICAgICAgICAgICAgIC8vIFJlbW92aWRhcyBjb25maWd1cmFcdTAwRTdcdTAwRjVlcyBleHRyYXMgcGFyYSBnYXJhbnRpciBjb21wYXRpYmlsaWRhZGUgY29tIGNhcnRcdTAwRjVlcyBkZSB0ZXN0ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IG1wUmVzLnN0YXR1cztcbiAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IG1wUmVzLmpzb24oKSBhcyBhbnk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdURDRTYgUmVzcG9zdGEgTVAgKFN0YXR1cyAke3N0YXR1c30pOmAsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpKTtcblxuICAgICAgICAgICAgICBpZiAoIW1wUmVzLm9rKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZpdGUgU2ltdWxhdG9yXSBcdTI3NEMgRXJybyBhbyBjcmlhciBwcmVmZXJcdTAwRUFuY2lhIG5vIE1QOicsIGRhdGEpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVml0ZSBTaW11bGF0b3JdIFx1MjcwNSBMaW5rIEdlcmFkbzonLCBkYXRhLmlkKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdUREMTcgU2FuZGJveCBMaW5rOicsIGRhdGEuc2FuZGJveF9pbml0X3BvaW50KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gc3RhdHVzO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSb3RhOiBWZXJpZmljYXIgU3RhdHVzXG4gICAgICAgICAgICBpZiAodXJsUGF0aC5pbmNsdWRlcygnY2hlY2stc3RhdHVzJykpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtcFJlcyA9IGF3YWl0IGZldGNoKGBodHRwczovL2FwaS5tZXJjYWRvcGFnby5jb20vdjEvcGF5bWVudHMvJHtwYXJzZWRCb2R5LnBheW1lbnRJZH1gLCB7XG4gICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FjY2Vzc1Rva2VufWAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IG1wUmVzLnN0YXR1cztcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgbXBSZXMuanNvbigpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1RENFNiBSZXNwb3N0YSBNUCAoU3RhdHVzICR7c3RhdHVzfSk6YCwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMikpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFtcFJlcy5vaykge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZpdGUgU2ltdWxhdG9yXSBcdTI3NEMgRXJybyBhbyB2ZXJpZmljYXIgc3RhdHVzIG5vIE1QOicsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gICAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdUREMjUgRXhjZVx1MDBFN1x1MDBFM28gYW8gdmVyaWZpY2FyIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRXJybyBpbnRlcm5vIG5vIHNpbXVsYWRvcicsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWaXRlIFNpbXVsYXRvcl0gXHVEODNEXHVERDI1IEVycm86JywgZXJyb3IpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdFcnJvIGludGVybm8gbm8gc2ltdWxhZG9yJyB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNULFNBQVMsb0JBQW9CO0FBQ25WLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxJQUVQO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUM7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLGdCQUFnQixRQUFhO0FBQzNCLGVBQU8sWUFBWSxJQUFJLE9BQU8sS0FBVSxLQUFVLFNBQWM7QUFDOUQsZ0JBQU0sU0FBUyxJQUFJLE9BQU87QUFDMUIsY0FBSSxDQUFDLE9BQU8sU0FBUyxPQUFPLEVBQUcsUUFBTyxLQUFLO0FBRTNDLGdCQUFNLFVBQVUsT0FBTyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ25DLGtCQUFRLElBQUksZ0RBQW1DLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtBQUV0RSxjQUFJO0FBQ0YsZ0JBQUksT0FBTztBQUNYLGdCQUFJLElBQUksV0FBVyxRQUFRO0FBQ3pCLHFCQUFPLE1BQU0sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUNwQyxvQkFBSSxTQUFTO0FBQ2Isb0JBQUksR0FBRyxRQUFRLENBQUMsVUFBZSxVQUFVLEtBQUs7QUFDOUMsb0JBQUksR0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNLENBQUM7QUFBQSxjQUNyQyxDQUFDO0FBQUEsWUFDSDtBQUVBLGtCQUFNLFdBQVcsUUFBUTtBQUN6QixrQkFBTSxhQUFhLEtBQUssTUFBTSxRQUFRO0FBQ3RDLGtCQUFNLGNBQWMsV0FBVztBQUMvQixrQkFBTSxVQUFVLFdBQVc7QUFDM0Isa0JBQU0sYUFBYSxXQUFXLFNBQVM7QUFFdkMsb0JBQVEsSUFBSSx1Q0FBZ0MsVUFBVSxFQUFFO0FBQ3hELG9CQUFRLElBQUkscUNBQThCLGNBQWMsWUFBWSxVQUFVLEdBQUcsRUFBRSxJQUFJLFFBQVEsTUFBTSxFQUFFO0FBR3ZHLGdCQUFJLFNBQVMsSUFBSSxRQUFRLFdBQVcsSUFBSSxRQUFRLFVBQVUsSUFBSSxJQUFJLElBQUksUUFBUSxPQUFPLEVBQUUsU0FBUyxVQUFVLElBQUksUUFBUSxRQUFRLGdCQUFnQjtBQUM5SSxnQkFBSSxPQUFPLFNBQVMsR0FBRyxFQUFHLFVBQVMsT0FBTyxNQUFNLEdBQUcsRUFBRTtBQUVyRCxrQkFBTSxlQUFlLFdBQVc7QUFHaEMsZ0JBQUksUUFBUSxTQUFTLFlBQVksR0FBRztBQUNsQyxzQkFBUSxJQUFJLDJDQUFvQztBQUNoRCxvQkFBTSxRQUFRLE1BQU0sTUFBTSwyQ0FBMkM7QUFBQSxnQkFDbkUsUUFBUTtBQUFBLGdCQUNSLFNBQVM7QUFBQSxrQkFDUCxnQkFBZ0I7QUFBQSxrQkFDaEIsaUJBQWlCLFVBQVUsV0FBVztBQUFBLGtCQUN0QyxxQkFBcUIsS0FBSyxJQUFJLEVBQUUsU0FBUztBQUFBLGdCQUMzQztBQUFBLGdCQUNBLE1BQU0sS0FBSyxVQUFVO0FBQUEsa0JBQ25CLG9CQUFvQixPQUFPLFdBQVcsT0FBTyxXQUFXLE1BQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQUEsa0JBQzNFLGFBQWEsV0FBVztBQUFBLGtCQUN4QixtQkFBbUI7QUFBQSxrQkFDbkIsT0FBTztBQUFBLG9CQUNMLE9BQU8sV0FBVyxTQUFTO0FBQUEsb0JBQzNCLFlBQVk7QUFBQSxvQkFDWixXQUFXO0FBQUEsa0JBQ2I7QUFBQSxnQkFDRixDQUFDO0FBQUEsY0FDSCxDQUFDO0FBQ0Qsb0JBQU0sT0FBTyxNQUFNLE1BQU0sS0FBSztBQUM5QixrQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsa0JBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQzVCO0FBQUEsWUFDRjtBQUdBLGdCQUFJLFFBQVEsU0FBUyxtQkFBbUIsR0FBRztBQUN4QyxzQkFBUSxJQUFJLDBEQUFnRCxXQUFXLE1BQU07QUFDN0Usb0JBQU0sU0FBUyxPQUFPLFdBQVcsT0FBTyxXQUFXLE1BQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRXRFLG9CQUFNLFFBQVEsTUFBTSxNQUFNLG9EQUFvRDtBQUFBLGdCQUM3RSxRQUFRO0FBQUEsZ0JBQ1IsU0FBUztBQUFBLGtCQUNQLGdCQUFnQjtBQUFBLGtCQUNoQixpQkFBaUIsVUFBVSxXQUFXO0FBQUEsZ0JBQ3hDO0FBQUEsZ0JBQ0EsTUFBTSxLQUFLLFVBQVU7QUFBQSxrQkFDbkIsT0FBTyxDQUFDO0FBQUEsb0JBQ04sT0FBTztBQUFBLG9CQUNQLFVBQVU7QUFBQSxvQkFDVixZQUFZO0FBQUEsb0JBQ1osYUFBYTtBQUFBLGtCQUNmLENBQUM7QUFBQSxrQkFDRCxPQUFPLEVBQUUsT0FBTyxXQUFXLFNBQVMsa0NBQWtDO0FBQUEsa0JBQ3RFLGFBQWE7QUFBQSxrQkFDYixpQkFBaUI7QUFBQSxvQkFDZiwwQkFBMEIsQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0FBQUEsa0JBQzdDO0FBQUEsa0JBQ0EsV0FBVztBQUFBLG9CQUNULFNBQVMseUNBQXlDLG1CQUFtQixlQUFlLG1EQUFtRDtBQUFBLG9CQUN2SSxTQUFTLHlDQUF5QyxtQkFBbUIsZUFBZSxpQkFBaUI7QUFBQSxvQkFDckcsU0FBUyx5Q0FBeUMsbUJBQW1CLGVBQWUsaUJBQWlCO0FBQUEsa0JBQ3ZHO0FBQUEsa0JBQ0EsYUFBYTtBQUFBO0FBQUEsZ0JBRWYsQ0FBQztBQUFBLGNBQ0gsQ0FBQztBQUVELG9CQUFNLFNBQVMsTUFBTTtBQUNyQixvQkFBTSxPQUFPLE1BQU0sTUFBTSxLQUFLO0FBRTlCLHNCQUFRLElBQUksa0RBQTJDLE1BQU0sTUFBTSxLQUFLLFVBQVUsTUFBTSxNQUFNLENBQUMsQ0FBQztBQUVoRyxrQkFBSSxDQUFDLE1BQU0sSUFBSTtBQUNiLHdCQUFRLE1BQU0sK0RBQXVELElBQUk7QUFBQSxjQUMzRSxPQUFPO0FBQ0wsd0JBQVEsSUFBSSx3Q0FBbUMsS0FBSyxFQUFFO0FBQ3RELHdCQUFRLElBQUksNENBQXFDLEtBQUssa0JBQWtCO0FBQUEsY0FDMUU7QUFFQSxrQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsa0JBQUksYUFBYTtBQUNqQixrQkFBSSxJQUFJLEtBQUssVUFBVSxJQUFJLENBQUM7QUFDNUI7QUFBQSxZQUNGO0FBR0EsZ0JBQUksUUFBUSxTQUFTLGNBQWMsR0FBRztBQUNwQyxrQkFBSTtBQUNGLHNCQUFNLFFBQVEsTUFBTSxNQUFNLDJDQUEyQyxXQUFXLFNBQVMsSUFBSTtBQUFBLGtCQUMzRixTQUFTLEVBQUUsaUJBQWlCLFVBQVUsV0FBVyxHQUFHO0FBQUEsZ0JBQ3RELENBQUM7QUFDRCxzQkFBTSxTQUFTLE1BQU07QUFDckIsc0JBQU0sT0FBTyxNQUFNLE1BQU0sS0FBSztBQUU5Qix3QkFBUSxJQUFJLGtEQUEyQyxNQUFNLE1BQU0sS0FBSyxVQUFVLE1BQU0sTUFBTSxDQUFDLENBQUM7QUFFaEcsb0JBQUksQ0FBQyxNQUFNLElBQUk7QUFDYiwwQkFBUSxNQUFNLDJEQUFzRCxJQUFJO0FBQ3hFLHNCQUFJLGFBQWE7QUFDakIsc0JBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQzVCO0FBQUEsZ0JBQ0Y7QUFFQSxvQkFBSSxVQUFVLGdCQUFnQixrQkFBa0I7QUFDaEQsb0JBQUksYUFBYTtBQUNqQixvQkFBSSxJQUFJLEtBQUssVUFBVSxJQUFJLENBQUM7QUFDNUI7QUFBQSxjQUNGLFNBQVMsT0FBTztBQUNkLHdCQUFRLE1BQU0saUVBQW9ELEtBQUs7QUFDdkUsb0JBQUksYUFBYTtBQUNqQixvQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8sNkJBQTZCLFNBQVMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ3RGO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFFQSxpQkFBSztBQUFBLFVBQ1AsU0FBUyxPQUFPO0FBQ2Qsb0JBQVEsTUFBTSxvQ0FBNkIsS0FBSztBQUNoRCxnQkFBSSxhQUFhO0FBQ2pCLGdCQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsT0FBTyw0QkFBNEIsQ0FBQyxDQUFDO0FBQUEsVUFDaEU7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0YsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
