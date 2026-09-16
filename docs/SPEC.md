# SPEC — Lupa (Mini-Gadget de Siglas)

> Especificação funcional e técnica. Responde *como*.
> Versão 1.0 — 2026-09-16 · Base: `docs/BRIEFING.md`

---

## 1. Stack

| Camada | Escolha | Justificativa |
|---|---|---|
| Runtime desktop | **Electron 32** | Única via madura para janela *always-on-top* + bandeja + atalho global no Windows |
| Build/bundler | **Vite 5** | HMR no dev, build de produção em segundos |
| Linguagem | **TypeScript 5** (strict) | Contratos de dados garantidos em tempo de compilação |
| UI | **React 18** + CSS Modules | Abas e estado de formulário sem boilerplate |
| Busca | **Fuse.js** | Fuzzy search local, ~5 KB, sem servidor |
| Persistência | **JSON em `%APPDATA%`** | Legível, versionável, exportável, zero dependência |
| Planilhas | **SheetJS (xlsx)** | Import/export XLSX e CSV |
| Empacotamento | **electron-builder** | NSIS (instalador) + portable, ambos x64 |
| Testes | **Vitest** (unit) + **Playwright** (E2E Electron) | Rápido no core, real na integração |

> Regra de ouro: nenhuma dependência de rede em tempo de execução.

## 2. Arquitetura

```
┌─────────────────────────── Processo MAIN (Node) ───────────────────────────┐
│  main.ts          cria janelas, ciclo de vida, single-instance lock        │
│  window-manager   LupaWindow (48px, frameless) + PanelWindow (380x520)     │
│  tray.ts          ícone de bandeja, menu de contexto                       │
│  shortcuts.ts     atalho global (globalShortcut)                           │
│  store/           repository.ts  → CRUD + escrita atômica + backup         │
│                   settings.ts    → preferências (electron-store)           │
│                   seed.ts        → popula repertório no 1º boot            │
│  services/        search.ts (Fuse) · importer.ts · exporter.ts             │
│  ipc/handlers.ts  canais expostos ao renderer                              │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ contextBridge (preload.ts) — API tipada
┌───────────────────────────────┴────────────────────────────────────────────┐
│                     Processo RENDERER (React, sandbox)                     │
│  LupaButton   ícone flutuante, drag, estados idle/hover/active             │
│  SearchPanel  input + resultados                                           │
│  ResultCard   abas: Inglês · Português · Aplicação                          │
│               └ Aplicação → sub-abas: Contexto · Onde aparece              │
│  Repertorio   lista, filtros, CRUD, importar/exportar                      │
│  Settings     atalho, autostart, tema, opacidade                           │
└────────────────────────────────────────────────────────────────────────────┘
```

**Segurança:** `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
O renderer nunca toca no filesystem — só fala por IPC tipado.

## 3. Modelo de dados

### 3.1 Arquivo

`%APPDATA%/Lupa/repertorio.json` — escrita atômica (`.tmp` + `rename`), backup
rotativo das últimas 5 versões em `%APPDATA%/Lupa/backups/`.

### 3.2 Schema

```ts
type Categoria = 'automotivo' | 'ti' | 'corporativo' | 'generico';

interface Sentido {
  id: string;              // uuid
  categoria: Categoria;
  en: string;              // "Production Part Approval Process"
  pt: string;              // "Processo de Aprovação de Peça de Produção"
  aplicacao: {
    contexto: string;      // como/quando se usa
    exemplo: string;       // frase real de uso
    area: string;          // "Qualidade"
    processo: string;      // "Validação de fornecedor"
    referencia?: string;   // norma, documento ou link
  };
  tags: string[];
  favorito: boolean;
  criadoEm: string;        // ISO 8601
  atualizadoEm: string;
}

interface Sigla {
  sigla: string;           // "PPAP" — normalizada em MAIÚSCULAS
  sentidos: Sentido[];     // 1..n (desambiguação)
}

interface Repertorio {
  schemaVersion: 1;
  atualizadoEm: string;
  siglas: Sigla[];
}
```

### 3.3 Regras de integridade
- `sigla` é chave única, normalizada: maiúsculas, sem acento, sem pontuação.
- Toda sigla tem ≥ 1 sentido; excluir o último sentido remove a sigla.
- `en` e `pt` são obrigatórios; `aplicacao.contexto` obrigatório; demais opcionais.
- `schemaVersion` habilita migração automática em versões futuras.

## 4. Normalização e busca

### 4.1 Normalização da entrada
`" p.h.e.s "` → trim → uppercase → remover acentos (NFD) → remover `. - _ /` → `"PHES"`

### 4.2 Estratégia em cascata
| Ordem | Estratégia | Resultado |
|---|---|---|
| 1 | Match exato na sigla normalizada | Resultado direto |
| 2 | Prefixo (`PP` → `PPAP`, `PPM`) | Lista de sugestões |
| 3 | Fuzzy sobre sigla (Fuse, threshold 0.3) | "Você quis dizer…" |
| 4 | Full-text em `en`, `pt`, `tags` | Busca reversa (pelo significado) |
| 5 | Nenhum resultado | CTA "Cadastrar «XYZ» no repertório" |

### 4.3 Desambiguação
Múltiplos sentidos → cards empilhados, ordenados por: favorito → nº de acessos →
categoria preferida (Settings) → ordem alfabética.

## 5. Especificação de interface

### 5.1 Lupa flutuante
| Propriedade | Valor |
|---|---|
| Tamanho | 48 × 48 px |
| Janela | frameless, transparente, `alwaysOnTop: 'screen-saver'`, sem barra de tarefas |
| Idle | opacidade 0,55 após 5 s sem interação |
| Hover | opacidade 1,0 + leve escala (1,08) |
| Arrastar | `-webkit-app-region: drag`; posição salva em Settings |
| Clique | abre/fecha o painel ancorado ao lado da lupa |
| Botão direito | menu: Repertório · Configurações · Sair |

### 5.2 Painel de busca (380 × 520 px)
- Abre com foco automático no input (cursor pronto para digitar).
- Busca *as-you-type* com debounce de 120 ms.
- `Esc` fecha · `Enter` seleciona o primeiro resultado · `↑/↓` navega.
- Perde o foco → fecha (configurável: modo "fixar painel").

### 5.3 Card de resultado
```
┌──────────────────────────────────────────┐
│  PPAP                       [automotivo] │
│  ┌────────┬────────────┬──────────────┐  │
│  │ Inglês │ Português  │  Aplicação   │  │
│  └────────┴────────────┴──────────────┘  │
│  Production Part Approval Process    [⧉] │
│                                          │
│  ── aba Aplicação ──                     │
│  [ Contexto ] [ Onde aparece ]           │
│  Contexto: usado na validação de peças   │
│  antes da produção seriada.              │
│  Exemplo: "o PPAP foi aprovado pelo      │
│  cliente na fase 3."                     │
│  ───────────────────────────────────     │
│  Onde aparece: Qualidade ›               │
│  Validação de fornecedor                 │
│  Ref.: AIAG PPAP 4ª ed.                  │
│                                [★] [✎]   │
└──────────────────────────────────────────┘
```
- Aba padrão: **Inglês** (configurável).
- `[⧉]` copia o texto da aba ativa para a área de transferência.
- `[★]` favorita · `[✎]` abre edição daquele sentido.

### 5.4 Tela Repertório
Tabela virtualizada com busca, filtro por categoria e ordenação. Ações: novo,
editar, duplicar, excluir (com confirmação), importar, exportar.

### 5.5 Configurações
Atalho global · iniciar com o Windows · tema (claro/escuro/sistema) · opacidade
ociosa · aba padrão · categoria preferida · pasta do repertório · fixar painel.

## 6. Contrato IPC

```ts
interface LupaAPI {
  buscar(termo: string): Promise<ResultadoBusca>;
  obter(sigla: string): Promise<Sigla | null>;
  listar(filtro?: Filtro): Promise<Sigla[]>;
  salvarSentido(sigla: string, sentido: Sentido): Promise<void>;
  excluirSentido(sigla: string, sentidoId: string): Promise<void>;
  alternarFavorito(sigla: string, sentidoId: string): Promise<void>;
  importar(caminho: string, modo: 'merge' | 'substituir'): Promise<RelatorioImport>;
  exportar(formato: 'json' | 'csv' | 'xlsx'): Promise<string>;
  historico(): Promise<string[]>;
  obterConfig(): Promise<Config>;
  salvarConfig(patch: Partial<Config>): Promise<Config>;
  abrirPainel(): void;
  fecharPainel(): void;
  copiar(texto: string): void;
}
```
Todo handler valida entrada com **Zod** antes de tocar no store.

## 7. Import / Export

**Colunas do XLSX/CSV** (uma linha por sentido):
`sigla | categoria | en | pt | contexto | exemplo | area | processo | referencia | tags`

- Import valida linha a linha e devolve `RelatorioImport { inseridos, atualizados, ignorados, erros[] }`.
- Modo `merge` (padrão) preserva o que existe; `substituir` troca o repertório inteiro (com backup automático antes).
- Export sempre em UTF-8 com BOM (Excel PT-BR abre sem quebrar acento).

## 8. Requisitos não-funcionais

| ID | Requisito | Alvo |
|---|---|---|
| RNF1 | Latência atalho → painel focado | < 300 ms |
| RNF2 | Latência busca → resultado (10k siglas) | < 50 ms |
| RNF3 | Boot a frio | < 3 s |
| RNF4 | RAM em repouso | < 180 MB |
| RNF5 | Funciona 100% offline | obrigatório |
| RNF6 | Sem privilégio de administrador | obrigatório |
| RNF7 | Instalador x64 | < 120 MB |
| RNF8 | Nenhuma telemetria / envio externo | obrigatório |

## 9. Estrutura do repositório

```
Mini-gadget/
├─ docs/           BRIEFING · SPEC · VF · SPR · AGENTS
├─ data/           siglas.seed.json
├─ src/
│  ├─ main/        main.ts · window-manager · tray · shortcuts · ipc · store · services
│  ├─ preload/     preload.ts (contextBridge)
│  ├─ renderer/    App.tsx · components/ · styles/
│  └─ shared/      types.ts · schema.ts (Zod) · normalize.ts
├─ tests/          unit/ · e2e/
├─ build/          ícones (.ico/.png)
├─ electron-builder.yml
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

## 10. Decisões de arquitetura (ADR resumido)

| # | Decisão | Alternativa descartada | Motivo |
|---|---|---|---|
| ADR-1 | Electron | Tauri (Rust) | Entrega mais rápida; ecossistema conhecido; Tauri exigiria toolchain Rust |
| ADR-2 | JSON em arquivo | SQLite | Repertório < 10k linhas; legível e versionável; zero binário nativo |
| ADR-3 | Duas janelas (lupa + painel) | Janela única redimensionável | Lupa permanece leve e sempre no topo, sem redraw do painel |
| ADR-4 | Fuse.js | Índice próprio | 5 KB resolvem fuzzy + full-text; não reinventar |
| ADR-5 | Sem IA na v1 | Fallback Claude API | Offline-first e zero custo; fica planejado para v2 |
