/**
 * embed-html.js
 * 
 * Script que lê o dist/index.html do frontend e o embute como um módulo JS
 * no diretório do servidor MCP, para que funcione no deploy da Vercel.
 * 
 * Uso: node scripts/embed-html.js
 * (execute após "npm run build" no Element-Viewer)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_INPUT = path.resolve(__dirname, "../../Element-Viewer/dist/index.html");
const JS_OUTPUT = path.resolve(__dirname, "../api/html-content.js");

console.log(`[embed-html] Lendo: ${HTML_INPUT}`);

if (!fs.existsSync(HTML_INPUT)) {
    console.error(`[embed-html] ERRO: ${HTML_INPUT} não encontrado!`);
    console.error(`[embed-html] Execute 'npm run build' na pasta Element-Viewer primeiro.`);
    process.exit(1);
}

const htmlRaw = fs.readFileSync(HTML_INPUT, "utf-8");
console.log(`[embed-html] HTML lido: ${htmlRaw.length} caracteres`);

const REQUIRED_MARKER = "Picture-in-Picture";
if (!htmlRaw.includes(REQUIRED_MARKER)) {
    console.error(`[embed-html] ERRO: marcador obrigatório \"${REQUIRED_MARKER}\" não encontrado no bundle.`);
    console.error("[embed-html] Isso pode indicar que o dist/index.html está desatualizado.");
    console.error("[embed-html] Refaça o build do Element-Viewer antes de publicar.");
    process.exit(1);
}

console.log(`[embed-html] Marcador obrigatório encontrado: \"${REQUIRED_MARKER}\"`);

// Escapar backticks e ${} para uso seguro dentro de template literal
const escaped = htmlRaw
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

const moduleContent = `// AUTO-GENERATED — NÃO EDITE MANUALMENTE
// Gerado por: node scripts/embed-html.js
// Data: ${new Date().toISOString()}
// Tamanho original: ${htmlRaw.length} caracteres

export const htmlContent = \`${escaped}\`;
`;

fs.writeFileSync(JS_OUTPUT, moduleContent, "utf-8");
console.log(`[embed-html] Módulo gerado: ${JS_OUTPUT}`);
console.log(`[embed-html] Tamanho do módulo: ${moduleContent.length} caracteres`);
console.log(`[embed-html] ✅ Pronto! Agora faça deploy do meu-mcp-server.`);
