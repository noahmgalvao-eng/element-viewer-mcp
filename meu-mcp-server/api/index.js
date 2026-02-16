import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { htmlContent } from "./html-content.js";

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = 8080;

const server = new McpServer({
  name: "meu-webapp-wrapper",
  version: "1.0.0"
});

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
            title: "Element Viewer",
            url: "ui://widget/index.html"
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
          title: "Element Viewer",
          text: "Simulador interativo de elementos químicos.",
          url: "ui://widget/index.html"
        })
      }]
    };
  }
);

// --- 2. SUA FERRAMENTA UI ---
// htmlContent é importado de html-content.js (gerado por scripts/embed-html.js)
console.log(`[INIT] HTML content carregado: ${htmlContent.length} caracteres`);

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
        "openai/widgetPrefersBorder": true
      },
    }],
  })
);

server.registerTool(
  "abrir_app",
  {
    title: "Abrir Meu App",
    description: "Abre a interface do aplicativo web Element Viewer.",
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
app.post("/sse", async (req, res) => {
  const sessionId = req.query.sessionId;

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
export default app;