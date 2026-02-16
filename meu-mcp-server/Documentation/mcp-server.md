# meu-mcp-server — Servidor MCP

> **URL de Deploy:** [https://element-viewer-mcp-server.vercel.app/](https://element-viewer-mcp-server.vercel.app/)  
> **Diretório:** `meu-mcp-server/`  
> **Connector URL (ChatGPT):** `https://element-viewer-mcp-server.vercel.app/mcp`

---

## Objetivo

O meu-mcp-server é um **servidor MCP (Model Context Protocol)** que funciona como conector entre o ChatGPT e o Element-Viewer. Ele segue a especificação do **OpenAI Apps SDK** para expor tools e resources que o ChatGPT pode invocar, permitindo que o webapp seja renderizado como um **widget iframe** dentro da interface do chat.

---

## Estrutura de Arquivos

```
meu-mcp-server/
├── api/
│   ├── index.js              # Servidor Express + MCP (entry point)
│   └── html-content.js       # HTML do webapp embedado (gerado pelo script)
├── scripts/
│   └── embed-html.js         # Script para gerar html-content.js a partir do build
├── Documentation/            # Esta documentação
├── package.json              # Dependências e scripts
└── vercel.json               # Rewrites para Vercel serverless
```

---

## Como Funciona

### Fluxo de Requisição

```
ChatGPT → POST /mcp → Express → McpServer (fresh instance) → Response
```

1. O ChatGPT envia uma requisição JSON-RPC para `POST /mcp`
2. O Express recebe e cria uma **instância fresca** do McpServer (stateless)
3. O servidor processa a requisição (list tools, call tool, read resource)
4. A resposta é enviada de volta ao ChatGPT com JSON habilitado
5. Servidor e transport são destruídos após a resposta (sem estado persistente)

> **Importante:** O modo stateless (sem `sessionIdGenerator`) é obrigatório para deploy na Vercel, pois funções serverless não mantêm estado entre invocações.

---

## Componentes do Servidor (`api/index.js`)

### 1. Resource — Widget HTML

```javascript
server.registerResource(
  "element-viewer-widget",
  "ui://widget/element-viewer.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/element-viewer.html",
      mimeType: "text/html+skybridge",
      text: htmlContent,        // HTML completo do webapp
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": "https://chatgpt.com",
        "openai/widgetCSP": {
          connect_domains: ["https://chatgpt.com"],
          resource_domains: ["https://*.oaistatic.com"],
        },
      },
    }],
  })
);
```

| Campo | Valor | Descrição |
|---|---|---|
| `uri` | `ui://widget/element-viewer.html` | Identificador único do recurso |
| `mimeType` | `text/html+skybridge` | Tipo de conteúdo — HTML renderizável como widget |
| `widgetPrefersBorder` | `true` | Widget exibe com borda |
| `widgetDomain` | `https://chatgpt.com` | Domínio de contexto do widget |
| `widgetCSP` | `connect_domains`, `resource_domains` | Política de segurança de conteúdo |

A propriedade `text` contém o **HTML completo** do webapp (gerado pelo build single-file do Vite), embedado diretamente no servidor através do arquivo `html-content.js`.

---

### 2. Tool — `abrir_app`

```javascript
server.registerTool(
  "abrir_app",
  {
    title: "Abrir Element Viewer",
    description: "Abre a interface interativa do Element Viewer...",
    inputSchema: z.object({}),       // Sem parâmetros de entrada
    _meta: {
      "openai/outputTemplate": "ui://widget/element-viewer.html",
      "openai/toolInvocation/invoking": "Abrindo Element Viewer…",
      "openai/toolInvocation/invoked": "Element Viewer pronto.",
    },
  },
  async () => ({
    structuredContent: { app: "Element Viewer", status: "open" },
    content: [{ type: "text", text: "Element Viewer aberto com sucesso." }],
  })
);
```

| Campo | Descrição |
|---|---|
| `title` | Nome da tool exibido na UI do ChatGPT |
| `description` | Descritivo que o modelo usa para decidir quando invocar |
| `inputSchema` | Schema Zod — objeto vazio (sem parâmetros) |
| `outputTemplate` | Aponta para o URI do resource (widget HTML) |
| `toolInvocation/invoking` | Mensagem exibida durante a execução |
| `toolInvocation/invoked` | Mensagem exibida após conclusão |
| `structuredContent` | Dados estruturados para o ChatGPT consumir |

> **O `outputTemplate` é a peça-chave** — ele conecta a tool ao resource, fazendo com que o ChatGPT renderize o widget HTML quando a tool é invocada.

---

### 3. Express App — Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `OPTIONS` | `/mcp` | CORS preflight (retorna 204 com headers) |
| `GET` | `/` | Health check ("Element Viewer MCP Server Running") |
| `POST/GET/DELETE` | `/mcp` | Handler MCP principal (via `app.all`) |

**Headers CORS configurados:**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: content-type, mcp-session-id`
- `Access-Control-Expose-Headers: Mcp-Session-Id`

> **Nota:** O middleware `express.json()` **NÃO** é utilizado. O SDK do MCP lê o body stream diretamente — se o Express parsear primeiro, o stream é consumido e o SDK recebe um body vazio (erro 400).

---

## Configuração de Deploy (`vercel.json`)

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

Todas as requisições são redirecionadas para a função serverless `api/index.js`.

---

## Scripts

```bash
# Iniciar servidor localmente
npm start         # node api/index.js
npm run dev       # node api/index.js

# Gerar HTML embedado
npm run embed     # node scripts/embed-html.js
```

O script `embed` lê o build do Element-Viewer (`dist/index.html`) e gera `api/html-content.js` com o HTML como uma string exportada. Isso permite que o servidor MCP sirva o webapp completo sem depender de URLs externas.

---

## Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `@modelcontextprotocol/sdk` | ^1.25.3 | SDK oficial MCP para registrar tools e resources |
| `express` | ^5.2.1 | Framework HTTP para servir endpoints |
| `zod` | ^3.25.76 | Validação de schemas (inputSchema das tools) |

---

## Integração com ChatGPT

Para conectar o servidor como app no ChatGPT:

1. Acesse as configurações de apps/connectors do ChatGPT
2. Configure o **Connector URL** como: `https://element-viewer-mcp-server.vercel.app/mcp`
3. O ChatGPT irá automaticamente:
   - Enumerar tools disponíveis (`abrir_app`)
   - Enumerar resources disponíveis (`element-viewer-widget`)
   - Invocar a tool quando o usuário pedir para abrir o simulador
   - Renderizar o widget HTML como iframe na interface

---

## Documentação de Referência (SDK)

A pasta `Documentation/` contém documentação oficial do OpenAI Apps SDK:

| Arquivo | Conteúdo |
|---|---|
| `quickstart.txt` | Guia de início rápido do Apps SDK |
| `chatgptdocs.md` | Documentação geral do ChatGPT para desenvolvedores |
| `further documentation.txt` | Documentação avançada adicional |
| `UI Guidelines.txt` | Diretrizes de interface para apps |
| `ux principles.txt` | Princípios de UX para apps do ChatGPT |
| `What makes a great chatgpt app.txt` | Boas práticas para apps |
| `app submission.txt` | Processo de submissão para a loja |
| `security & privacy.txt` | Requisitos de segurança e privacidade |
| `openai usage policies.txt` | Políticas de uso da OpenAI |
| `optimize metadata.txt` | Otimização de metadados do app |
| `troubleshooting.txt` | Resolução de problemas comuns |
