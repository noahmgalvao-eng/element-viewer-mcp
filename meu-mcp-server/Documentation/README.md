# Element Viewer — Documentação do Projeto

## Visão Geral

O **Element Viewer** é um ecossistema de duas aplicações que juntas formam um simulador interativo de matéria e elementos químicos, integrado como app do ChatGPT via **OpenAI Apps SDK (MCP)**.

| Componente | Tipo | URL de Deploy |
|---|---|---|
| **Element-Viewer** | Web App (React + Vite) | [element-viewer.vercel.app](https://element-viewer.vercel.app/) |
| **meu-mcp-server** | Servidor MCP (Express + MCP SDK) | [element-viewer-mcp-server.vercel.app](https://element-viewer-mcp-server.vercel.app/) |

---

## Objetivo

Permitir que usuários do ChatGPT abram um **simulador de física da matéria em tempo real** diretamente dentro da interface do chat, através de um widget iframe. O usuário pode:

- Explorar os **118 elementos** da tabela periódica
- Simular **transições de fase** (sólido → líquido → gasoso → supercrítico)
- Ajustar **temperatura** e **pressão** em tempo real
- Visualizar **partículas** com física baseada em dados científicos reais
- Comparar **até 6 elementos simultaneamente** em grade
- **Gravar** snapshots de simulação para análise comparativa

---

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────┐
│                    ChatGPT UI                       │
│                                                     │
│  Usuário pede: "Abra o Element Viewer"              │
│         │                                           │
│         ▼                                           │
│  ┌─────────────────────────────┐                    │
│  │   meu-mcp-server (MCP)     │                    │
│  │   POST /mcp                │                    │
│  │   Tool: abrir_app          │◄── Vercel Serverless│
│  │   Resource: widget HTML    │                    │
│  └──────────┬──────────────────┘                    │
│             │                                       │
│             ▼ (iframe widget)                       │
│  ┌─────────────────────────────┐                    │
│  │   Element-Viewer (Web App) │                    │
│  │   React + Vite + Canvas    │◄── Vercel Static   │
│  │   Simulação de Física      │                    │
│  └─────────────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## Documentação Detalhada

| Documento | Descrição |
|---|---|
| [Element-Viewer (Web App)](./element-viewer-webapp.md) | Arquitetura do webapp, componentes, hooks de física, tipos e dados |
| [meu-mcp-server (Servidor MCP)](./mcp-server.md) | Servidor MCP, integração com ChatGPT, deploy serverless |

---

## Stack Tecnológico

### Element-Viewer (Web App)
- **React 19** — UI declarativa com componentes funcionais
- **Vite 6** — Bundler e dev server
- **TypeScript** — Tipagem estática
- **TailwindCSS (CDN)** — Estilização
- **Lucide React** — Ícones
- **SVG + Canvas** — Renderização de simulação
- **Vercel** — Deploy estático

### meu-mcp-server (Servidor MCP)
- **Express 5** — Framework HTTP
- **@modelcontextprotocol/sdk** — SDK oficial para protocolo MCP
- **Zod** — Validação de schemas
- **Vercel Serverless** — Deploy como função serverless
