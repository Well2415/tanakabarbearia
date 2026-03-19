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
                    success: String(finalBackUrl || "http://localhost:8080"),
                    failure: String(finalBackUrl || "http://localhost:8080"),
                    pending: String(finalBackUrl || "http://localhost:8080")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTRVJWSURPUlxcXFxEZXNrdG9wXFxcXGJhcmJlYXJpYVxcXFxiYXJiXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTRVJWSURPUlxcXFxEZXNrdG9wXFxcXGJhcmJlYXJpYVxcXFxiYXJiXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9TRVJWSURPUi9EZXNrdG9wL2JhcmJlYXJpYS9iYXJiL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBwcm94eToge1xuICAgICAgLy8gQ29uZmlndXJhcmVtb3MgbyBwcm94eSBwYXJhIHNpbXVsYXIgYXMgZnVuXHUwMEU3XHUwMEY1ZXMgZG8gVmVyY2VsIGxvY2FsbWVudGVcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLCBcbiAgICBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAge1xuICAgICAgbmFtZTogJ3ZlcmNlbC1hcGktc2ltdWxhdG9yJyxcbiAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGFueSkge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnksIG5leHQ6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHJhd1VybCA9IHJlcS51cmwgfHwgJyc7XG4gICAgICAgICAgaWYgKCFyYXdVcmwuaW5jbHVkZXMoJy9hcGkvJykpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgICAgICBjb25zdCB1cmxQYXRoID0gcmF3VXJsLnNwbGl0KCc/JylbMF07XG4gICAgICAgICAgY29uc29sZS5sb2coYFtWaXRlIFNpbXVsYXRvcl0gXHVEODNEXHVERTgwIFJlcXVpc2lcdTAwRTdcdTAwRTNvOiAke3JlcS5tZXRob2R9ICR7dXJsUGF0aH1gKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xuICAgICAgICAgICAgICBib2R5ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY2h1bmtzID0gJyc7XG4gICAgICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rOiBhbnkpID0+IGNodW5rcyArPSBjaHVuayk7XG4gICAgICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGNodW5rcykpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgYm9keVRleHQgPSBib2R5IHx8ICd7fSc7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRCb2R5ID0gSlNPTi5wYXJzZShib2R5VGV4dCk7XG4gICAgICAgICAgICBjb25zdCBhY2Nlc3NUb2tlbiA9IHBhcnNlZEJvZHkuYWNjZXNzVG9rZW47XG4gICAgICAgICAgICBjb25zdCBiYWNrVXJsID0gcGFyc2VkQm9keS5iYWNrVXJsO1xuICAgICAgICAgICAgY29uc3QgcGF5ZXJFbWFpbCA9IHBhcnNlZEJvZHkuZW1haWwgfHwgJ05cdTAwRTNvIGluZm9ybWFkbyc7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1RENCMyBQYWdhZG9yOiAke3BheWVyRW1haWx9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdUREMTEgVG9rZW46ICR7YWNjZXNzVG9rZW4gPyBhY2Nlc3NUb2tlbi5zdWJzdHJpbmcoMCwgMTApICsgJy4uLicgOiAnTnVsbyd9YCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEdhcmFudGlyIHF1ZSB0ZW1vcyB1bSBvcmlnaW4gdlx1MDBFMWxpZG8gKGZhbGxiYWNrIHNlIG8gZnJvbnRlbmQgblx1MDBFM28gbWFuZGFyKVxuICAgICAgICAgICAgbGV0IG9yaWdpbiA9IHJlcS5oZWFkZXJzLm9yaWdpbiB8fCAocmVxLmhlYWRlcnMucmVmZXJlciA/IG5ldyBVUkwocmVxLmhlYWRlcnMucmVmZXJlcikub3JpZ2luIDogYGh0dHA6Ly8ke3JlcS5oZWFkZXJzLmhvc3QgfHwgJ2xvY2FsaG9zdDo4MDgwJ31gKTtcbiAgICAgICAgICAgIGlmIChvcmlnaW4uZW5kc1dpdGgoJy8nKSkgb3JpZ2luID0gb3JpZ2luLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgZmluYWxCYWNrVXJsID0gYmFja1VybCB8fCBvcmlnaW47XG5cbiAgICAgICAgICAgIC8vIFJvdGE6IENyaWFyIFBpeFxuICAgICAgICAgICAgaWYgKHVybFBhdGguaW5jbHVkZXMoJ2NyZWF0ZS1waXgnKSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdURDOEUgR2VyYW5kbyBQaXguLi4nKTtcbiAgICAgICAgICAgICAgY29uc3QgbXBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkubWVyY2Fkb3BhZ28uY29tL3YxL3BheW1lbnRzJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gLFxuICAgICAgICAgICAgICAgICAgJ1gtSWRlbXBvdGVuY3ktS2V5JzogRGF0ZS5ub3coKS50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9hbW91bnQ6IE51bWJlcihwYXJzZUZsb2F0KFN0cmluZyhwYXJzZWRCb2R5LmFtb3VudCkpLnRvRml4ZWQoMikpLFxuICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHBhcnNlZEJvZHkuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICBwYXltZW50X21ldGhvZF9pZDogJ3BpeCcsXG4gICAgICAgICAgICAgICAgICBwYXllcjoge1xuICAgICAgICAgICAgICAgICAgICBlbWFpbDogcGFyc2VkQm9keS5lbWFpbCB8fCAnY29udGF0b0B0YW5ha2FiYXJiZWFyaWEuY29tLmJyJyxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbmFtZTogJ0NsaWVudGUnLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X25hbWU6ICdUYW5ha2EnXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBtcFJlcy5qc29uKCkgYXMgYW55O1xuICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSb3RhOiBDcmlhciBQcmVmZXJcdTAwRUFuY2lhIChDYXJ0XHUwMEUzbylcbiAgICAgICAgICAgIGlmICh1cmxQYXRoLmluY2x1ZGVzKCdjcmVhdGUtcHJlZmVyZW5jZScpKSB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdURDQjMgR2VyYW5kbyBDaGVja291dCBDYXJ0XHUwMEUzbzonLCBwYXJzZWRCb2R5LmFtb3VudCk7XG4gICAgICAgICAgICAgICBjb25zdCBhbW91bnQgPSBOdW1iZXIocGFyc2VGbG9hdChTdHJpbmcocGFyc2VkQm9keS5hbW91bnQpKS50b0ZpeGVkKDIpKTtcbiAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgY29uc3QgbXBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkubWVyY2Fkb3BhZ28uY29tL2NoZWNrb3V0L3ByZWZlcmVuY2VzJywge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthY2Nlc3NUb2tlbn1gXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICBpdGVtczogW3tcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdTZXJ2aVx1MDBFN29zIGRlIEJhcmJlYXJpYScsXG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5OiAxLFxuICAgICAgICAgICAgICAgICAgICB1bml0X3ByaWNlOiBhbW91bnQsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5X2lkOiAnQlJMJ1xuICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICBwYXllcjogeyBlbWFpbDogcGFyc2VkQm9keS5lbWFpbCB8fCAndGVzdF91c2VyXzEyMzQ1Njc4QHRlc3R1c2VyLmNvbScgfSxcbiAgICAgICAgICAgICAgICAgIGJpbmFyeV9tb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgIHBheW1lbnRfbWV0aG9kczoge1xuICAgICAgICAgICAgICAgICAgICBleGNsdWRlZF9wYXltZW50X21ldGhvZHM6IFt7IGlkOiAndGlja2V0JyB9XVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGJhY2tfdXJsczoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBTdHJpbmcoZmluYWxCYWNrVXJsIHx8IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCIpLFxuICAgICAgICAgICAgICAgICAgICBmYWlsdXJlOiBTdHJpbmcoZmluYWxCYWNrVXJsIHx8IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCIpLFxuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nOiBTdHJpbmcoZmluYWxCYWNrVXJsIHx8IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCIpXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgYXV0b19yZXR1cm46IFwiYXBwcm92ZWRcIlxuICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZpZGFzIGNvbmZpZ3VyYVx1MDBFN1x1MDBGNWVzIGV4dHJhcyBwYXJhIGdhcmFudGlyIGNvbXBhdGliaWxpZGFkZSBjb20gY2FydFx1MDBGNWVzIGRlIHRlc3RlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gbXBSZXMuc3RhdHVzO1xuICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgbXBSZXMuanNvbigpIGFzIGFueTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1RENFNiBSZXNwb3N0YSBNUCAoU3RhdHVzICR7c3RhdHVzfSk6YCwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMikpO1xuXG4gICAgICAgICAgICAgIGlmICghbXBSZXMub2spIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVml0ZSBTaW11bGF0b3JdIFx1Mjc0QyBFcnJvIGFvIGNyaWFyIHByZWZlclx1MDBFQW5jaWEgbm8gTVA6JywgZGF0YSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWaXRlIFNpbXVsYXRvcl0gXHUyNzA1IExpbmsgR2VyYWRvOicsIGRhdGEuaWQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1REQxNyBTYW5kYm94IExpbms6JywgZGF0YS5zYW5kYm94X2luaXRfcG9pbnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBzdGF0dXM7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJvdGE6IFZlcmlmaWNhciBTdGF0dXNcbiAgICAgICAgICAgIGlmICh1cmxQYXRoLmluY2x1ZGVzKCdjaGVjay1zdGF0dXMnKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1wUmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLm1lcmNhZG9wYWdvLmNvbS92MS9wYXltZW50cy8ke3BhcnNlZEJvZHkucGF5bWVudElkfWAsIHtcbiAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YWNjZXNzVG9rZW59YCB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gbXBSZXMuc3RhdHVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBtcFJlcy5qc29uKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtWaXRlIFNpbXVsYXRvcl0gXHVEODNEXHVEQ0U2IFJlc3Bvc3RhIE1QIChTdGF0dXMgJHtzdGF0dXN9KTpgLCBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIW1wUmVzLm9rKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVml0ZSBTaW11bGF0b3JdIFx1Mjc0QyBFcnJvIGFvIHZlcmlmaWNhciBzdGF0dXMgbm8gTVA6JywgZGF0YSk7XG4gICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IHN0YXR1cztcbiAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVml0ZSBTaW11bGF0b3JdIFx1RDgzRFx1REQyNSBFeGNlXHUwMEU3XHUwMEUzbyBhbyB2ZXJpZmljYXIgc3RhdHVzOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdFcnJvIGludGVybm8gbm8gc2ltdWxhZG9yJywgbWVzc2FnZTogU3RyaW5nKGVycm9yKSB9KSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1ZpdGUgU2ltdWxhdG9yXSBcdUQ4M0RcdUREMjUgRXJybzonLCBlcnJvcik7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0Vycm8gaW50ZXJubyBubyBzaW11bGFkb3InIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyxvQkFBb0I7QUFDblYsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJ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
