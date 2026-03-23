# Sistema de Agendamento - Barbearia Moderna

Este é um projeto profissional de agendamento online para barbearias, desenvolvido com tecnologias modernas e focado em alta performance e facilidade de manutenção manual.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React.js com TypeScript
- **Estilização**: Tailwind CSS e Shadcn/UI
- **Banco de Dados**: Supabase (PostgreSQL)
- **Pagamentos**: Mercado Pago (Pix e Cartão)
- **Notificações**: Integração com API de WhatsApp
- **Hospedagem**: Vercel

## 📂 Estrutura do Projeto

O código está organizado de forma modular para facilitar a manutenção:

- `src/lib/`: Contém a lógica de comunicação com serviços externos.
  - `storage.ts`: O "motor" do app. Gerencia o cache e sincroniza com o banco de dados.
  - `supabase.ts`: Configuração da conexão com o banco de dados.
  - `mercadoPago.ts`: Lógica de geração de pagamentos e verificação de status.
  - `whatsapp.ts`: Envio de mensagens automáticas e manuais.
- `src/pages/`: Telas principais do sistema (Agendamento, Admin, Barbeiro).
- `src/components/`: Componentes visuais reutilizáveis.

## 🛠️ Como dar manutenção manual

O código possui comentários detalhados em português em seus arquivos principais (`src/lib/`). Para realizar alterações:

1. **Instalação**: Execute `npm install` para baixar as dependências.
2. **Desenvolvimento**: Use `npm run dev` para rodar o projeto localmente.
3. **Produção**: Para enviar alterações ao ar, basta realizar o `git push` para o repositório principal no GitHub, e a Vercel fará o deploy automático.

### Configurações de Banco de Dados
Certifique-se de que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas corretamente no seu ambiente de hospedagem (Vercel).

---
*Este projeto foi limpo e organizado para suporte manual definitivo.*
