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
    description: "ÚNICA ferramenta para interagir com a interface. OBRIGATÓRIO definir a propriedade 'acao' para decidir o comportamento.",
    inputSchema: z.object({
      // Aqui está o "IF" - O modelo é obrigado a escolher o caminho
      acao: z.enum(["atualizar", "reagir"])
             .describe("Use 'atualizar' se o usuário pedir para abrir, adicionar elementos ou mudar temperatura. Use 'reagir' APENAS se o usuário pedir explicitamente para reagir os elementos atuais."),
      
      mensagem_interpretacao: z.string()
             .describe("Frase em primeira pessoa sobre a ação. Ex: 'Abri o simulador com o Oxigênio.' ou 'Gerei a substância da reação.'"),
      
      // Campos do "atualizar" (usamos nullish para evitar o erro das 4 tentativas)
      elementos: z.array(z.string()).max(6).nullish()
             .describe("Lista de símbolos químicos. Use apenas se acao='atualizar'."),
      temperatura_K: z.number().max(6000).nullish(),
      pressao_Pa: z.number().max(100000000000).nullish(),
      
      // Campos do "reagir" (também com nullish)
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
      }).nullish().describe("Preencha APENAS se acao='reagir'.")
    }),
    _meta: {
      "readOnlyHint": true,
      "openai/outputTemplate": "ui://widget/element-viewer.html",
      "openai/widgetAccessible": true,
    }
  },
  async (args) => {
    // Monta o objeto de base sempre mantendo o status "open" para não resetar o widget
    const payload = {
      app: "Element Viewer",
      status: "open", // <- Importante para manter a estabilidade no Front
      timestamp_atualizacao: Date.now(),
      configuracao_ia: {
        interpretacao_do_modelo: args.mensagem_interpretacao,
        // O "??" converte tanto undefined quanto null do modelo em null real para o seu frontend
        elementos: args.elementos ?? null,
        temperatura_K: args.temperatura_K ?? null,
        pressao_Pa: args.pressao_Pa ?? null
      },
      substancia_reacao: null
    };

    // Aplica a lógica da reação apenas se a ação for a correta e a substância existir
    if (args.acao === "reagir" && args.substancia_reacao) {
      payload.substancia_reacao = args.substancia_reacao;
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