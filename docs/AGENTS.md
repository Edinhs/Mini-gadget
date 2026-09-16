# AGENTES & SKILLS — Malha de execução paralela

> Como o projeto **Lupa** é construído: quem faz o quê, com qual skill,
> e qual o protocolo que impede dois agentes de se atropelarem.
> Versão 1.0 — 2026-09-16

---

## 1. Princípio

O projeto não é executado em série. Ele é quebrado em **tarefas independentes por
fronteira de arquivo**, distribuídas a agentes especializados que rodam ao mesmo
tempo, e sincronizadas em **ondas** (ver `docs/SPR.md`).

A regra que torna isso possível:

> **Contrato antes de código.** `src/shared/types.ts` e `src/shared/schema.ts`
> são escritos e congelados na Onda 1. Todo agente programa contra o contrato,
> nunca contra a implementação do outro. Mudança de contrato depois da Onda 1
> exige aprovação explícita e re-broadcast para todos os agentes ativos.

## 2. Quadro de agentes

| # | Agente | Responsabilidade | Fronteira de arquivos (exclusiva) | Skills |
|---|---|---|---|---|
| A0 | **Orquestrador** | Decompõe, dispara, sincroniza ondas, resolve conflito de contrato, faz o merge final | `docs/`, raiz do repo | — |
| A1 | **Arquiteto / Core** | Contrato de tipos, schema Zod, normalização, config do projeto | `src/shared/**`, `vite.config.ts`, `tsconfig.json`, `package.json` | `init` |
| A2 | **Dados** | Repertório semente, store com escrita atômica, backup, migração de schema, import/export | `data/**`, `src/main/store/**`, `src/main/services/importer.ts`, `exporter.ts` | `anthropic-skills:xlsx` |
| A3 | **Main Process** | Janelas, always-on-top, bandeja, atalho global, IPC, busca em cascata | `src/main/**` (exceto store), `src/preload/**` | — |
| A4 | **Renderer / UI** | Lupa flutuante, painel, card com abas, repertório, configurações, tema | `src/renderer/**` | `artifact-design` |
| A5 | **Identidade visual** | Ícone da lupa (.ico/.png), ícone de bandeja, arte do instalador | `build/**` | `anthropic-skills:canvas-design` |
| A6 | **Qualidade** | Plano de VF, testes unitários e E2E, execução da matriz, revisão de código | `tests/**`, `docs/VF.md` | `code-review`, `security-review`, `run` |
| A7 | **Build / Release** | electron-builder, NSIS + portable, smoke test, release notes | `electron-builder.yml`, `.github/**` | `run` |
| A8 | **Documentação** | README, guia de uso, changelog, manual do repertório | `README.md`, `docs/**` | `anthropic-skills:docx` |

## 3. Matriz de paralelização por onda

```
ONDA 1  ── A1 (contrato + setup) ─────────────────────┐  [serial: bloqueia todos]
                                                      │
ONDA 2  ── A2 (store+seed) ║ A3 (janelas+IPC) ║ A5 (ícones) ║ A6 (plano VF)
                                                      │
ONDA 3  ── A3 (busca cascata) ║ A4 (lupa+painel+card) ║ A2 (import/export)
                                                      │
ONDA 4  ── A4 (repertório CRUD + settings) ║ A6 (testes unit+E2E) ║ A8 (README)
                                                      │
ONDA 5  ── A6 (execução da VF + RNFs) ║ A7 (empacotamento) ║ A4 (polimento)
                                                      │
ONDA 6  ── A7 (release) ── A0 (aceite final contra VF)
```
`║` = executa em paralelo · `──` = dependência sequencial

## 4. Protocolo anti-colisão

1. **Um arquivo, um dono.** A tabela §2 é a fonte de verdade. Nenhum agente
   edita arquivo fora da sua fronteira; se precisar, abre pedido ao A0.
2. **Contrato congelado.** Após a Onda 1, `src/shared/types.ts` só muda por
   decisão do A0, e a mudança é propagada a todos antes de qualquer commit.
3. **Commit por tarefa.** Mensagem no formato `T-xx: descrição` — rastreável
   contra o backlog do SPR.
4. **Critério de saída de onda.** A onda só fecha quando *todos* os critérios
   listados no SPR forem verdadeiros; nenhuma onda começa parcialmente.
5. **Stub-first.** Quem depende de algo ainda não pronto programa contra um stub
   tipado do contrato, nunca esperando o outro agente terminar.
6. **Verificação cruzada.** Nenhum agente aprova o próprio trabalho: o A6 valida
   A2/A3/A4, e o A0 valida o A6 contra a matriz do VF.

## 5. Skills — quando cada uma entra

| Skill | Momento de uso | Por quê |
|---|---|---|
| `init` | Onda 1 | Gera o `CLAUDE.md` do repo, fixando convenções para todos os agentes |
| `anthropic-skills:canvas-design` | Onda 2 | Arte original do ícone da lupa em PNG/ICO, sem copiar ícone de terceiros |
| `anthropic-skills:xlsx` | Ondas 2–3 | Modelo de planilha de import e gerador do export XLSX |
| `artifact-design` | Onda 3 | Fundamentos visuais do painel: tipografia, tokens de cor, tema claro/escuro |
| `run` | Ondas 3–5 | Subir o app Electron de verdade e conferir a mudança na tela |
| `code-review` | Onda 4 | Revisão do diff antes de fechar cada onda |
| `security-review` | Onda 5 | Auditar `contextIsolation`, IPC e leitura/escrita de arquivo |
| `anthropic-skills:docx` | Onda 6 | Manual do usuário em Word para distribuir ao time, se pedido |

## 6. Entradas e saídas de cada agente

| Agente | Consome | Entrega |
|---|---|---|
| A1 | BRIEFING, SPEC | Projeto compilando + contrato congelado |
| A2 | Contrato, SPEC §3 e §7 | `siglas.seed.json`, store persistente, import/export |
| A3 | Contrato, SPEC §2, §4, §5.1, §6 | Janelas, bandeja, atalho, IPC, serviço de busca |
| A4 | Contrato, SPEC §5, ícones do A5 | Interface completa e navegável |
| A5 | BRIEFING §5 | `build/icon.ico`, `build/tray.png`, arte do instalador |
| A6 | SPEC inteiro | `docs/VF.md`, suíte de testes, relatório de execução |
| A7 | App pronto + ícones | Instalador NSIS, portable, release notes |
| A8 | Tudo | README, guia de uso, changelog |

## 7. Critério de encerramento do projeto

O A0 só declara a v1.0 entregue quando, simultaneamente:

- [ ] Todos os casos P0 do `docs/VF.md` estão aprovados;
- [ ] RNF1..RNF8 medidos e dentro do alvo;
- [ ] Instalador testado em máquina limpa Windows 10/11;
- [ ] Repertório semente carregando no primeiro boot;
- [ ] README permite que um terceiro instale e use sem ajuda;
- [ ] Nenhuma tarefa `Must` do SPR em aberto.
