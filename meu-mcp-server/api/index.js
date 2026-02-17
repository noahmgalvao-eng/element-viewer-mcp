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

  // --- 2. REGISTER TOOL: ABRIR E ATUALIZAR SIMULADOR ---
  server.registerTool(
    "abrir_simulador_interativo",
    {
      title: "Abrir ou Atualizar Element Viewer",
      description:
        "Use esta ferramenta para abrir o app OU para ATUALIZAR a visualizacao atual se o app ja estiver em tela cheia. O app reage em tempo real. Importante: Se o usuario pedir para 'adicionar' um elemento, voce DEVE consultar o widgetState atual, pegar os elementos que ja estao na tela e enviar a lista COMPLETA (antigos + novos) no parametro 'elementos'.",
      inputSchema: z.object({
        elementos: z
          .array(z.string())
          .max(6)
          .optional()
          .describe(
            "Lista COMPLETA de simbolos quimicos para mostrar. Se vazio, mantem o que esta na tela."
          ),
        temperatura_K: z
          .number()
          .max(6000)
          .optional()
          .describe("Nova temperatura em Kelvin. Se nao especificada, deixe vazio."),
        pressao_Pa: z
          .number()
          .max(100000000000)
          .optional()
          .describe("Nova pressao em Pascal. Se nao especificada, deixe vazio."),
        mensagem_interpretacao: z
          .string()
          .describe(
            "Frase curta em primeira pessoa sobre a acao. Ex: 'Adicionei o Oxigenio e aumentei a temperatura para 5000K na sua tela.'"
          ),
      }),
      _meta: {
        "readOnlyHint": true,
        "openai/outputTemplate": "ui://widget/element-viewer.html",
        "openai/widgetAccessible": true,
      },
    },
    async (args) => ({
      structuredContent: {
        app: "Element Viewer",
        status: "open",
        timestamp_atualizacao: Date.now(),
        configuracao_ia: {
          elementos: args.elementos || null,
          temperatura_K: args.temperatura_K || null,
          pressao_Pa: args.pressao_Pa || null,
          interpretacao_do_modelo: args.mensagem_interpretacao,
        },
      },
      content: [
        {
          type: "text",
          text: args.mensagem_interpretacao,
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
