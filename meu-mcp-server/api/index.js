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
              ],
            },
          },
        },
      ],
    })
  );

  // --- 2. REGISTER TOOL: ABRIR E ATUALIZAR SIMULADOR ---
  server.registerTool(
  "gerenciar_simulador_interativo",
  {
    title: "Gerenciar Element Viewer",
    description: "ÚNICA ferramenta para interagir com a interface. Use a propriedade 'acao' para definir o que fazer. Se for apenas adicionar/remover elementos ou mudar temperatura, use 'atualizar'. Se o usuário pedir para REAGIR elementos (ou clicar no botão de reação), use 'reagir' e preencha o objeto de substância.",
    inputSchema: z.object({
      // ESTA É A CHAVE (O SEU "IF")
      acao: z.enum(["atualizar", "reagir"])
             .describe("Obrigatório. Define se você está apenas atualizando a tela ('atualizar') ou injetando o produto de uma reação química ('reagir')."),
      
      mensagem_interpretacao: z.string().describe("Frase curta explicando a ação tomada."),
      
      // Campos para quando acao === "atualizar"
      elementos: z.array(z.string()).max(6).optional()
                  .describe("Use APENAS se acao='atualizar'. Lista completa de símbolos."),
      temperatura_K: z.number().optional(),
      pressao_Pa: z.number().optional(),
      
      // Campos para quando acao === "reagir"
      substancia_reacao: z.object({
        substanceName: z.string(),
        formula: z.string(),
        suggestedColorHex: z.string(),
        mass: z.number(),
        meltingPointK: z.number(),
        boilingPointK: z.number(),
        specificHeatSolid: z.number(),
        specificHeatLiquid: z.number(),
        specificHeatGas: z.number(),
        latentHeatFusion: z.number(),
        latentHeatVaporization: z.number(),
        enthalpyVapJmol: z.number(),
        enthalpyFusionJmol: z.number(),
        triplePoint: z.object({ tempK: z.number(), pressurePa: z.number() }),
        criticalPoint: z.object({ tempK: z.number(), pressurePa: z.number() })
      }).optional().describe("Preencha APENAS se acao='reagir'. Propriedades termodinâmicas do produto da reação.")
    }),
    _meta: {
      "readOnlyHint": true,
      "openai/outputTemplate": "ui://widget/element-viewer.html",
      "openai/widgetAccessible": true,
    }
  },
  async (args) => {
    // Montamos o payload base que será enviado ao frontend
    const payload = {
      app: "Element Viewer",
      timestamp_atualizacao: Date.now(),
      configuracao_ia: {
        interpretacao_do_modelo: args.mensagem_interpretacao,
        elementos: null,
        temperatura_K: null,
        pressao_Pa: null
      },
      substancia_reacao: null
    };

    // Aqui acontece o IF no servidor, repassando apenas os dados certos para o Front
    if (args.acao === "atualizar") {
      payload.configuracao_ia.elementos = args.elementos || null;
      payload.configuracao_ia.temperatura_K = args.temperatura_K || null;
      payload.configuracao_ia.pressao_Pa = args.pressao_Pa || null;
    } else if (args.acao === "reagir" && args.substancia_reacao) {
      payload.substancia_reacao = args.substancia_reacao;
      // Você pode até passar a temperatura e pressão atuais aqui se quiser manter o ambiente
    }

    return {
      structuredContent: payload,
      content: [
        {
          type: "text",
          text: args.mensagem_interpretacao,
        },
      ],
    };
  }
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