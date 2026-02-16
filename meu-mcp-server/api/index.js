import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { htmlContent } from "./html-content.js";

// --- Helpers ---
console.log(`[INIT] HTML content carregado: ${htmlContent.length} caracteres`);

/**
 * Creates a FRESH MCP server instance (stateless, per-request).
 * This follows the official Apps SDK quickstart pattern exactly.
 * Each request gets its own server + transport, which is required 
 * for Vercel serverless (no persistent connections).
 */
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
            "openai/widgetCSP": {
              connect_domains: ["https://chatgpt.com"],
              resource_domains: ["https://*.oaistatic.com"],
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
        "Abre a interface interativa do Element Viewer. Use quando o usuário pedir para abrir, visualizar ou interagir com o simulador de elementos químicos.",
      inputSchema: z.object({}),
      _meta: {
        "openai/outputTemplate": "ui://widget/element-viewer.html",
        "openai/toolInvocation/invoking": "Abrindo Element Viewer…",
        "openai/toolInvocation/invoked": "Element Viewer pronto.",
        "openai/widgetAccessible": true,
      },
    },
    async () => ({
      structuredContent: {
        app: "Element Viewer",
        status: "open",
      },
      content: [
        {
          type: "text",
          text: "Element Viewer aberto com sucesso.",
        },
      ],
    })
  );

  return server;
}

// --- EXPRESS APP (for Vercel serverless) ---
const app = express();
// NOTE: Do NOT use express.json() — the MCP SDK reads the raw request body
// stream itself. If Express parses it first, the stream is consumed and the
// SDK sees an empty body → 400 error.

// --- CORS PREFLIGHT for /mcp ---
app.options("/mcp", (req, res) => {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, mcp-session-id",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
  });
  res.end();
});

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.status(200).send("Element Viewer MCP Server Running");
});

// --- MCP HANDLER (POST, GET, DELETE /mcp) ---
app.all("/mcp", async (req, res) => {
  console.log(`[MCP] ${req.method} /mcp`);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  // Create FRESH server + transport per request (stateless mode)
  const server = createElementViewerServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode — required for Vercel
    enableJsonResponse: true,
  });

  // Cleanup on close
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

// Vercel serverless export
export default app;