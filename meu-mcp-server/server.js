import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = 8080;

const server = new McpServer({
  name: "meu-webapp-wrapper",
  version: "1.0.0"
});

// URL DO FRONTEND
const MINHA_URL_WEBAPP = "https://element-viewer.vercel.app";

// --- 1. FERRAMENTAS OBRIGATÓRIAS (SEARCH & FETCH) ---
server.registerTool(
  "search",
  {
    title: "Search Data",
    description: "Search for documents or data in the application.",
    inputSchema: z.object({
      query: z.string().describe("Search query string")
    })
  },
  async ({ query }) => {
    console.log(`[TOOL] Search executado: ${query}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results: [{
            id: "home",
            title: "App Home",
            url: MINHA_URL_WEBAPP
          }]
        })
      }]
    };
  }
);

server.registerTool(
  "fetch",
  {
    title: "Fetch Document",
    description: "Retrieve full content.",
    inputSchema: z.object({
      id: z.string().describe("Document ID")
    })
  },
  async ({ id }) => {
    console.log(`[TOOL] Fetch executado: ${id}`);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: id,
          title: "App Content",
          text: "Conteúdo do WebApp acessível via UI.",
          url: MINHA_URL_WEBAPP
        })
      }]
    };
  }
);

// --- 2. SUA FERRAMENTA UI ---
const htmlContent = `
<!DOCTYPE html>
<html style="height: 100%; margin: 0;">
  <body style="height: 100%; margin: 0; overflow: hidden;">
    <style>
      #fullscreen-btn {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-family: sans-serif;
        opacity: 0.8;
      }
      #fullscreen-btn:hover {
        opacity: 1;
      }
    </style>
    <button id="fullscreen-btn" onclick="requestFullScreen()">Tela Cheia</button>
    <script>
      function requestFullScreen() {
        if (window.openai) {
           window.openai.requestDisplayMode({ mode: "fullscreen" });
           console.log("Requested fullscreen");
        } else {
           alert("OpenAI API ainda não disponível. Tente novamente em instantes.");
        }
      }
    </script>
    <iframe 
      src="${MINHA_URL_WEBAPP}" 
      style="width: 100%; height: 100%; border: none;"
      allow="camera; microphone; geolocation"
    ></iframe>
  </body>
</html>
`;

server.registerResource(
  "app-ui",
  "ui://widget/index.html",
  {},
  async () => ({
    contents: [{
      uri: "ui://widget/index.html",
      mimeType: "text/html+skybridge",
      text: htmlContent,
      _meta: {
        "openai/widgetPrefersBorder": true,
        "openai/widgetDomain": MINHA_URL_WEBAPP,
        "openai/widgetCSP": {
          "connect_domains": [MINHA_URL_WEBAPP],
          "resource_domains": [MINHA_URL_WEBAPP, "https://assets.gadget.dev", "https://app-assets.gadget.dev"]
        },
      },
    }],
  })
);

server.registerTool(
  "abrir_app",
  {
    title: "Abrir Meu App",
    description: "Abre a interface do aplicativo web.",
    inputSchema: z.object({}),
    _meta: {
      "openai/outputTemplate": "ui://widget/index.html",
      "openai/toolBehavior": "interactive"
    },
  },
  async () => {
    return { content: [{ type: "text", text: "App aberto." }] };
  }
);

// --- SERVIDOR EXPRESS ---

app.use(cors());

// Middleware para log detalhado
app.use((req, res, next) => {
  if (!req.url.includes("favicon")) {
    const isSSE = req.headers.accept === 'text/event-stream';
    console.log(`[REQ] ${req.method} ${req.url} | SessionID: ${req.query.sessionId || 'N/A'} | SSE Request? ${isSSE}`);
  }
  next();
});

// Armazenamento de transportes SSE
const transports = new Map();

// Rota de Health Check
app.get("/", (req, res) => {
  res.status(200).send("Mcp Server Running");
});

// --- ROTA 1: CRIAR SESSÃO (GET /sse) ---
app.get("/sse", async (req, res) => {
  console.log(">>> [SSE] Tentativa de conexão iniciada...");

  // Instrui o cliente a mandar mensagens para /message usando o ID da sessão
  // Se o client for "esperto", ele usará isso. Se for "burro", ele tentará POST /sse
  const transport = new SSEServerTransport("/message", res);

  await server.connect(transport);

  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  console.log(`>>> [SSE] CONEXÃO ESTABELECIDA! Sessão: ${sessionId}`);

  req.on("close", () => {
    console.log(`<<< [SSE] Cliente desconectou. Sessão: ${sessionId}`);
    transports.delete(sessionId);
  });
});

// --- ROTA 2: RECEBER MENSAGENS DA SESSÃO (POST /message) ---
// O padrão do SDK geralmente pede um endpoint separado para receber as mensagens
app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`[MSG] Recebido POST em /message para sessão: ${sessionId}`);

  if (!sessionId) {
    return res.status(400).send("Session ID required");
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    console.log("[ERRO] Sessão não encontrada no mapa!");
    return res.status(404).send("Session not found");
  }

  await transport.handlePostMessage(req, res);
});

// --- ROTA 3: HANDLER HÍBRIDO (POST /sse) ---
// Resolve o problema: Se o ChatGPT manda POST para /sse com sessionId, trata como mensagem.
// Se manda sem sessionId, trata como Stateless (validação inicial).
app.post("/sse", async (req, res) => {
  const sessionId = req.query.sessionId;

  // CASO A: Tem Session ID? Então é uma mensagem para uma conexão existente!
  if (sessionId) {
    console.log(`[MSG] Recebido POST em /sse (Redirecionando logica) para sessão: ${sessionId}`);
    const transport = transports.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res);
      return;
    } else {
      console.log("[ERRO] Sessão informada não existe mais.");
      return res.status(404).send("Session expired");
    }
  }

  // CASO B: Não tem Session ID? Então é Stateless (Fallback/Inicialização rápida)
  console.log("[FALLBACK] POST /sse Stateless (Cliente não iniciou Stream)");
  const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
    console.log("[FALLBACK] Sucesso no Stateless");
  } catch (error) {
    console.error("[ERRO] Falha no Stateless:", error);
    res.status(500).send("Internal Error");
  }
});

app.listen(PORT, () => {
  console.log(`\n=== SERVIDOR MCP PRONTO NA PORTA ${PORT} ===`);
  console.log(`Use esta URL no ChatGPT: https://<SEU-NGROK>.ngrok-free.dev/sse`);
});