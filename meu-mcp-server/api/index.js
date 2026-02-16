import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { htmlContent } from "./html-content.js";

// --- Helpers ---
console.log(`[INIT] HTML content carregado: ${htmlContent.length} caracteres`);

function createElementViewerServer() {
  const server = new McpServer({
    name: "element-viewer",
    version: "1.0.0",
  });

  // --- 1. REGISTER RESOURCE (the widget HTML) ---
  server.registerResource(
    "element-viewer-widget",
    "ui://widget/element-viewer.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://widget/element-viewer.html",
          mimeType: "text/html+skybridge",
          text: htmlContent,
          _meta: {
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": "https://chatgpt.com",
            "openai/widgetDescription": "Element Viewer interativo para explorar estados da materia e transicoes de fase.",
            "openai/widgetCSP": {
              connect_domains: ["https://chatgpt.com"],
              resource_domains: [
                "https://*.oaistatic.com",
                "https://cdn.tailwindcss.com",
                "https://esm.sh",
              ],
            },
          },
        },
      ],
    })
  );

  // --- 2. REGISTER TOOL ---
  server.registerTool(
    "abrir_app",
    {
      title: "Abrir Element Viewer",
      description:
        "Abre a interface interativa do simulador de fisica/quimica Element Viewer. Use quando o usuario quiser visualizar ou interagir com estados da materia.",
      inputSchema: z.object({}),
      _meta: {
        "openai/outputTemplate": "ui://widget/element-viewer.html",
        "openai/toolInvocation/invoking": "Abrindo Element Viewer...",
        "openai/toolInvocation/invoked": "Element Viewer pronto.",
        "openai/widgetAccessible": true,
      },
    },
    async () => ({
      // Estado inicial para o ChatGPT comecar com contexto
      structuredContent: {
        app: "Element Viewer",
        status: "open",
        ambiente_inicial: {
          temperatura_K: 298.15,
          pressao_Pa: 101325,
        },
      },
      content: [
        {
          type: "text",
          text: "Element Viewer aberto com sucesso. A simulacao iniciou em Condicoes Normais de Temperatura e Pressao (298.15K, 1 atm).",
        },
      ],
    })
  );

  return server;
}

// --- EXPRESS APP (for Vercel serverless) ---
const app = express();

app.options("/mcp", (req, res) => {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, mcp-session-id",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  });
  res.end();
});

app.get("/", (req, res) => {
  res.status(200).send("Element Viewer MCP Server Running");
});

app.all("/mcp", async (req, res) => {
  console.log(`[MCP] ${req.method} /mcp`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  const server = createElementViewerServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
    console.log("[MCP] Request handled successfully");
  } catch (error) {
    console.error("[MCP] Error:", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Internal server error");
    }
  }
});

export default app;