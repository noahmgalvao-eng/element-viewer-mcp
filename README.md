# 🧪 Chymia - The Interactive Chemistry Explorer

[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](#)
[![ChatGPT Plugin](https://img.shields.io/badge/ChatGPT-Store_Approved-10a37f?logo=openai)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](#)

> Explore a química de forma visual, interativa e inteligente. Disponível online em: [https://chymia.vercel.app/](https://chymia.vercel.app/) ou [chatgpt.com/plugins](https://chatgpt.com/plugins)

O **Chymia** é uma aplicação web para simulação e visualização de elementos químicos, termodinâmica e reações. Construído com um motor de simulação de partículas no frontend e integrado diretamente ao **ChatGPT** através do Model Context Protocol (MCP), o Chymia transforma a maneira como estudantes, pesquisadores e curiosos interagem com a tabela periódica.

![Simulação do Elemento Hidrogênio (H) no Chymia](./docs/preview.gif)

---

## 🤖 Integração com ChatGPT (Store Approved)

O aplicativo foi oficialmente aprovado como um Plugin do **ChatGPT**, permitindo que você controle a simulação, faça perguntas complexas de química e receba dados termodinâmicos diretamente pela interface do ChatGPT.

### Como usar a integração?

1. Acesse **[chatgpt.com/plugins](https://chatgpt.com/plugins)** (ou clique no menu de plugins/GPTs).
2. Busque por **Chymia** e conecte-se ao aplicativo.
3. Acesse um chat, digite `@chymia` e experimente os comandos.

**Exemplo de comando:**
![Demonstração do uso do Chymia no ChatGPT](./docs/chatgpt-integration.png)

---

## ✨ Principais Funcionalidades

* **Simulador de Partículas em Tempo Real:** Motor de física customizado (`ParticleCanvasLayer`) que simula o comportamento dos gases, líquidos e sólidos baseado em propriedades termodinâmicas.
* **Agente de IA Integrado:** Servidor MCP (Model Context Protocol) que expõe o contexto químico da interface web para o ChatGPT, permitindo interações com a IA, como tirar dúvidas, pedir elementos e reações específicas.
* **Tabela Periódica Interativa:** Visualização completa e rica em dados científicos de todos os elementos conhecidos.

---

## 🛠️ Stack

O ecossistema do Chymia é dividido em duas frentes principais:

**Frontend (Client & UI):**
* **React & Vite:** e **TypeScript:** Garantindo tipagem rigorosa para os dados científicos e estados das partículas.
* **Física Customizada:** Hooks dedicados (`usePhysics`, `thermodynamics.ts`) para os cálculos de simulação espacial.

**Integração IA (MCP Server):**
* **Node.js:** Backend leve operando como servidor MCP.
* **OpenAI API / ChatGPT:** Interface de linguagem natural para a base de dados química.
* **Vercel:** Hospedagem otimizada de alta disponibilidade.
