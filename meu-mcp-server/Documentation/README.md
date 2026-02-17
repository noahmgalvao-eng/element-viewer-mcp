# Element Viewer â€” DocumentaÃ§Ã£o do Projeto

## VisÃ£o Geral

O **Element Viewer** Ã© um ecossistema de duas aplicaÃ§Ãµes que juntas formam um simulador interativo de matÃ©ria e elementos quÃ­micos, integrado como app do ChatGPT via **OpenAI Apps SDK (MCP)**.

| Componente | Tipo | URL de Deploy |
|---|---|---|
| **Element-Viewer** | Web App (React + Vite) | [element-viewer.vercel.app](https://element-viewer.vercel.app/) |
| **meu-mcp-server** | Servidor MCP (Express + MCP SDK) | [element-viewer-mcp-server.vercel.app](https://element-viewer-mcp-server.vercel.app/) |

---

## Objetivo

Permitir que usuÃ¡rios do ChatGPT abram um **simulador de fÃ­sica da matÃ©ria em tempo real** diretamente dentro da interface do chat, atravÃ©s de um widget iframe. O usuÃ¡rio pode:

- Explorar os **118 elementos** da tabela periÃ³dica
- Simular **transiÃ§Ãµes de fase** (sÃ³lido â†’ lÃ­quido â†’ gasoso â†’ supercrÃ­tico)
- Ajustar **temperatura** e **pressÃ£o** em tempo real
- Visualizar **partÃ­culas** com fÃ­sica baseada em dados cientÃ­ficos reais
- Comparar **atÃ© 6 elementos simultaneamente** em grade
- **Gravar** snapshots de simulaÃ§Ã£o para anÃ¡lise comparativa

---

## Arquitetura Geral

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    ChatGPT UI                       â”‚
â”‚                                                     â”‚
â”‚  UsuÃ¡rio pede: "Abra o Element Viewer"              â”‚
â”‚         â”‚                                           â”‚
â”‚         â–¼                                           â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”‚
â”‚  â”‚   meu-mcp-server (MCP)     â”‚                    â”‚
â”‚  â”‚   POST /mcp                â”‚                    â”‚
â”‚  â”‚   Tool: abrir_app          â”‚â—„â”€â”€ Vercel Serverlessâ”‚
â”‚  â”‚   Resource: widget HTML    â”‚                    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚
â”‚             â”‚                                       â”‚
â”‚             â–¼ (iframe widget)                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”‚
â”‚  â”‚   Element-Viewer (Web App) â”‚                    â”‚
â”‚  â”‚   React + Vite + Canvas    â”‚â—„â”€â”€ Vercel Static   â”‚
â”‚  â”‚   SimulaÃ§Ã£o de FÃ­sica      â”‚                    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## DocumentaÃ§Ã£o Detalhada

| Documento | DescriÃ§Ã£o |
|---|---|
| [Element-Viewer (Web App)](./element-viewer-webapp.md) | Arquitetura do webapp, componentes, hooks de fÃ­sica, tipos e dados |
| [meu-mcp-server (Servidor MCP)](./mcp-server.md) | Servidor MCP, integraÃ§Ã£o com ChatGPT, deploy serverless |

---

## Stack TecnolÃ³gico

### Element-Viewer (Web App)
- **React 19** â€” UI declarativa com componentes funcionais
- **Vite 6** â€” Bundler e dev server
- **TypeScript** â€” Tipagem estÃ¡tica
- **TailwindCSS (CDN)** â€” EstilizaÃ§Ã£o
- **Lucide React** â€” Ãcones
- **SVG + Canvas** â€” RenderizaÃ§Ã£o de simulaÃ§Ã£o
- **Vercel** â€” Deploy estÃ¡tico

### meu-mcp-server (Servidor MCP)
- **Express 5** â€” Framework HTTP
- **@modelcontextprotocol/sdk** â€” SDK oficial para protocolo MCP
- **Zod** â€” ValidaÃ§Ã£o de schemas
- **Vercel Serverless** â€” Deploy como funÃ§Ã£o serverless

---

## Fluxo de Sincronizacao Automatica (MCP <-> Webapp)

Para manter o widget do ChatGPT sempre igual ao deploy do webapp, o `meu-mcp-server` agora sincroniza automaticamente o HTML embedado a partir do build atual do `Element-Viewer`.

### Como funciona

- `npm run dev` em `meu-mcp-server` executa `predev` -> `npm run sync:webapp`.
- `npm start` em `meu-mcp-server` executa `prestart` -> `npm run sync:webapp`.
- No deploy da Vercel do MCP, o `buildCommand` executa `npm run vercel-build` -> `npm run sync:webapp`.

### O que o sync faz

1. Valida os paths (`../Element-Viewer`).
2. Garante dependencias do webapp (`npm ci` em CI, `npm install` local se necessario).
3. Roda `npm run build` no `Element-Viewer`.
4. Gera/atualiza `api/html-content.js` com hash SHA-256 da origem.
5. So reescreve `html-content.js` quando o conteudo realmente muda.

### Comando util

```bash
npm run sync:webapp
```

Use esse comando para diagnostico rapido quando quiser validar a sincronizacao manualmente.
