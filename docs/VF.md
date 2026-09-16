# VF — Verificação Funcional · Lupa (Mini-Gadget de Siglas)

> Documento de verificação, validação e aceite. Responde *como provamos que funciona*.
> Versão 1.1 — 2026-09-16 · Base: `docs/SPEC.md` (v1.1) e `docs/BRIEFING.md` (v1.1)
> v1.1: o repertório deixou de ter seed gerado — passa a conter **exclusivamente**
> siglas fornecidas pelo usuário (SPEC §3.2.1). Casos de seed reescritos, casos de
> carga inicial, cadastro manual e estado vazio acrescentados.
> Owner da qualidade: Agente de Qualidade · Owner do produto: Edinho Siqueira

---

## 1. Objetivo e estratégia de verificação

### 1.1 Objetivo

Provar, com evidência reproduzível, que a v1.0 do Lupa entrega **todo** o escopo
declarado em `BRIEFING §6.1` dentro dos limites numéricos de `SPEC §8` (RNF1–RNF8)
e das metas de `BRIEFING §7` (M1–M6) — e que falha de forma segura nos casos de
borda de `SPEC §3.3`, `§4.2` e `§7`.

Regra de verificação de topo, acima de qualquer outra (BRIEFING §8 — risco Alto
"significado incorreto por sigla inventada"): **nenhuma sigla pode existir no
repertório sem ter vindo do usuário**, por um dos três caminhos do SPEC §3.2.1.
Qualquer conteúdo gerado, sugerido ou buscado externamente é reprovação imediata,
independente do resultado dos demais casos (ver CT-062).

Nada é considerado verificado por inspeção visual isolada: todo caso de teste tem
**pré-condição explícita, passos reproduzíveis e resultado esperado observável**
(valor, string, arquivo ou medição em ms/MB).

### 1.2 Níveis de teste

| Nível | O que cobre | Ferramenta | Onde roda | Gate |
|---|---|---|---|---|
| **Unitário** | Funções puras do `shared/` e `main/store`, `main/services`: `normalize.ts`, cascata de busca (`search.ts`), validação Zod (`schema.ts`), parser de import, serializador de export, escrita atômica e rotação de backup | **Vitest 2** + `@vitest/coverage-v8` | CI a cada push, < 20 s | Cobertura de linhas ≥ 85% em `src/shared` e `src/main/services` |
| **Integração / IPC** | Contrato `LupaAPI` (SPEC §6) ponta a ponta no processo main: cada canal invocado com payload válido e inválido, validando resposta e efeito no `repertorio.json` real (em diretório temporário) | **Vitest** com o main carregado em processo Node + mock de `app.getPath('userData')` | CI a cada push | 100% dos 14 métodos de `LupaAPI` com ≥ 1 caso feliz e ≥ 1 caso de payload inválido |
| **E2E** | Comportamento real da aplicação empacotada: janelas, abas, drag, bandeja, atalho global, clipboard, diálogos de arquivo | **Playwright** com `_electron.launch()` (Playwright-Electron) | CI (Windows runner) + local antes da release | 100% dos CTs marcados `E2E` e prioridade P0 verdes |
| **Não-funcional** | RNF1–RNF8: latência, boot, RAM, offline, privilégio, tamanho do instalador, ausência de telemetria | Playwright-Electron + `performance.now()`, `process.memoryUsage()`, Windows Firewall, Wireshark/`netstat`, `dir` no artefato | Release candidate, máquina limpa | Todos os 8 RNFs medidos e dentro do alvo |
| **Aceite do usuário (UAT)** | Roteiro de 10 minutos executado pelo owner do produto na máquina dele, sem instrumentação | Manual (§8 deste documento) | Antes de liberar a v1.0 | Todos os 12 passos do roteiro aprovados |

### 1.3 Convenções

- **IDs:** `CT-xxx` caso funcional · `NF-x` caso não-funcional · `RB-xx` robustez/borda.
- **Prioridade:** `P0` bloqueia a release · `P1` bloqueia se houver 2 ou mais falhas · `P2` registra dívida.
- **Tipo:** `unit` · `int` (integração/IPC) · `E2E` · `manual`.
- **Massa de teste canônica:** `tests/fixtures/repertorio.fixture.json` — 12 siglas, incluindo `PPAP` (2 sentidos: automotivo e corporativo), `PHES`, `PPM`, `API` (3 sentidos), `SOP`, `BOM`, `KPI`, `ECR`, `ECN`, `MTBF`, `TCO`, `WIP`.
- **As fixtures são massa de teste, não conteúdo do produto.** Vivem apenas em `tests/`, nunca são embarcadas no pacote nem copiadas para `%APPDATA%`. CT-062 verifica isso.
- **Massa de carga inicial:** `tests/fixtures/carga-inicial.fixture.json` — 8 entradas válidas + 2 inválidas, usada em CT-056.
- **Massa de volume:** `tests/fixtures/repertorio.10k.json` — 10.000 siglas geradas, usada em NF-2 e RB-05.
- **Ambiente de referência:** Windows 11 23H2 x64, 16 GB RAM, SSD NVMe, display 1920×1080 @100%.

### 1.4 O que NÃO é verificado na v1.0

Itens de `BRIEFING §6.2` (IA online, sync em nuvem, macOS/Linux/Android, OCR,
integração SharePoint/Confluence) não possuem caso de teste. Qualquer CT que
pareça exercitá-los deve ser rejeitado em revisão.

Não existe mais **seed gerado**: não há caso de teste que verifique quantidade
mínima de siglas embarcadas, cobertura de categorias no pacote ou qualidade de
conteúdo pré-existente, porque o produto não traz conteúdo nenhum.

---

## 2. Matriz de rastreabilidade

### 2.1 Requisitos funcionais derivados de `BRIEFING §6.1`

| ID | Requisito (linha do escopo 6.1) | Origem complementar no SPEC |
|---|---|---|
| RF-01 | Gadget flutuante always-on-top no Windows, arrastável, posição persistida | §5.1 |
| RF-02 | Atalho global (padrão `Ctrl+Alt+L`) para abrir/fechar o painel | §2 `shortcuts.ts`, §5.2 |
| RF-03 | Busca de sigla com resultado em EN / PT / Aplicação (2 sub-abas) | §5.3 |
| RF-04 | Busca tolerante a erro de digitação, acento, ponto e caixa (`p.h.e.s` = `PHES`) | §4.1, §4.2 |
| RF-05 | Desambiguação: mesma sigla com múltiplos significados por categoria | §3.2, §4.3 |
| RF-06 | CRUD completo do repertório dentro do app (cadastrar, editar, excluir) | §3.3, §5.4, §6 |
| RF-07 | Importar/exportar repertório em JSON, CSV e XLSX | §7 |
| RF-08a | Carga inicial: lista do usuário convertida para `data/carga-inicial.json` e importada no 1º boot; arquivo **opcional** | §2 `bootstrap.ts`, §3.2.1 |
| RF-08b | Import de planilha Excel/CSV no layout da §7 como caminho de entrada de siglas | §3.2.1, §7 |
| RF-08c | Cadastro manual pelo botão **+ Nova sigla** na tela de Repertório | §3.2.1, §5.4 |
| RF-08d | Sem `carga-inicial.json`, o 1º boot cria repertório **vazio** e a UI mostra o estado vazio com os CTAs "cadastrar primeira sigla" e "importar planilha" | §3.2.1 |
| RF-09 | Histórico das últimas consultas e favoritos | §4.3, §5.3, §6 |
| RF-10 | Iniciar com o Windows (opcional) e minimizar para a bandeja | §2 `tray.ts`, §5.5 |
| RF-11 | Instalador Windows (.exe) + versão portátil | §1, §8 (RNF7) |

### 2.2 Requisitos funcionais transversais derivados do SPEC (sem linha própria em 6.1)

| ID | Requisito | Origem |
|---|---|---|
| RF-12 | Copiar o texto da aba ativa para a área de transferência (`[⧉]`) | SPEC §5.3, §6 `copiar()` |
| RF-13 | Opacidade ociosa 0,55 após 5 s e 1,0 em hover | SPEC §5.1, BRIEFING §5.1 |
| RF-14 | Sigla não encontrada exibe CTA "Cadastrar «XYZ»" em vez de inventar significado | SPEC §4.2 (ordem 5), BRIEFING §5.5 |
| RF-15 | Tela de Configurações (atalho, autostart, tema, opacidade, aba padrão, categoria preferida, pasta, fixar painel) | SPEC §5.5 |
| RF-16 | Segurança do renderer: `nodeIntegration:false`, `contextIsolation:true`, `sandbox:true`, IPC validado com Zod | SPEC §2, §6 |
| RF-17 | Escrita atômica (`.tmp` + rename) e backup rotativo das 5 últimas versões | SPEC §3.1, BRIEFING §8 |
| RF-18 | Single-instance lock | SPEC §2 `main.ts` |
| RF-19 | **Origem exclusiva no usuário**: o app não gera, não sugere e não busca significado em fonte externa; nada entra no repertório sem um dos 3 caminhos de §3.2.1 | SPEC §3.2.1, BRIEFING §5.5, §8, §9 |

### 2.3 Matriz RF → casos de teste

| Requisito | Casos de teste | Nível predominante |
|---|---|---|
| RF-01 | CT-042, CT-043, CT-044, CT-046, RB-11, RB-12 | E2E |
| RF-02 | CT-039, CT-040, CT-041, RB-13, NF-1 | E2E |
| RF-03 | CT-005, CT-015, CT-016, CT-017, CT-018, CT-048 | E2E |
| RF-04 | CT-001, CT-002, CT-003, CT-004, CT-005, CT-006, CT-007, CT-008, CT-009, CT-010, CT-011, CT-055 | unit + E2E |
| RF-05 | CT-012, CT-013, CT-014 | unit + E2E |
| RF-06 | CT-004, CT-025, CT-026, CT-027, CT-028, CT-029, CT-030, RB-07, RB-08 | int + E2E |
| RF-07 | CT-031 a CT-038, RB-06, RB-09, RB-14 | int |
| RF-08a | CT-056, RB-02, RB-14 | int |
| RF-08b | CT-031 a CT-038, RB-06 | int |
| RF-08c | CT-057, CT-058, CT-025 | E2E |
| RF-08d | CT-049, CT-059, CT-060, CT-061 | int + E2E |
| RF-09 | CT-021, CT-022, CT-023, CT-024 | int + E2E |
| RF-10 | CT-044, CT-045 | E2E |
| RF-11 | CT-051, CT-052, NF-6, NF-7 | manual |
| RF-12 | CT-019, CT-020 | E2E |
| RF-13 | CT-046 | E2E |
| RF-14 | CT-010, CT-025 | E2E |
| RF-15 | CT-018, CT-041, CT-045, CT-047, CT-050 | E2E |
| RF-16 | CT-053, NF-8 | int |
| RF-17 | CT-054, RB-01, RB-03, RB-04 | unit + int |
| RF-18 | RB-10 | E2E |
| RF-19 | CT-062, CT-010, CT-061, NF-8 | int + E2E |

### 2.4 Matriz RNF → casos de teste

| RNF | Requisito (SPEC §8) | Alvo | Caso | Métrica do BRIEFING §7 relacionada |
|---|---|---|---|---|
| RNF1 | Latência atalho → painel focado | < 300 ms | NF-1 | M1 (parcial — ver §9 Lacunas) |
| RNF2 | Latência busca → resultado (10k siglas) | < 50 ms | NF-2 | M1 |
| RNF3 | Boot a frio | < 3 s | NF-3 | M2 |
| RNF4 | RAM em repouso | < 180 MB | NF-4 | M4 |
| RNF5 | Funciona 100% offline | obrigatório | NF-5 | — |
| RNF6 | Sem privilégio de administrador | obrigatório | NF-6 | — |
| RNF7 | Instalador x64 | < 120 MB | NF-7 | — |
| RNF8 | Nenhuma telemetria / envio externo | obrigatório | NF-8 | — |

### 2.5 Matriz Métrica de negócio → caso

| Métrica | Meta | Caso que a mede |
|---|---|---|
| M1 — atalho até resultado na tela | < 1,5 s | NF-1 + NF-2 (soma medida em NF-1b) |
| M2 — boot a frio | < 3 s | NF-3 |
| M3 — acerto na primeira busca (repertório do usuário) | ≥ 90% | CT-055 |
| M4 — RAM em repouso | < 180 MB | NF-4 |
| M5 — siglas da lista do usuário importadas sem erro | 100% | CT-056 (N/A se não houver `carga-inicial.json` — ver §9 G-05) |
| M6 — passos para cadastrar | ≤ 4 | CT-025 |

---

## 3. Casos de teste funcionais

> Legenda das colunas: **Req.** = requisito coberto · **Pré** = pré-condição ·
> **Prio** = P0/P1/P2 · **Tipo** = unit / int / E2E / manual.
> Em todos os casos E2E a aplicação é lançada via `_electron.launch()` apontando
> `userData` para um diretório temporário limpo, salvo indicação em contrário.

### 3.1 Normalização da entrada (SPEC §4.1)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-001 | RF-04 | Repertório fixture contém `PHES` | 1. Chamar `normalizar(" p.h.e.s ")`.<br>2. Chamar `normalizar("P-H-E-S")`.<br>3. Chamar `normalizar("p_h_e_s")`.<br>4. Chamar `normalizar("p/h/e/s")`. | As 4 chamadas retornam exatamente `"PHES"`. Caracteres `.`, `-`, `_`, `/` removidos; espaços das pontas removidos. | P0 | unit |
| CT-002 | RF-04 | — | 1. `normalizar("Ação")`.<br>2. `normalizar("MANUTENÇÃO")`.<br>3. `normalizar("órgão")`.<br>4. `normalizar("ÍNDICE")`. | Retornos: `"ACAO"`, `"MANUTENCAO"`, `"ORGAO"`, `"INDICE"`. Decomposição NFD com remoção de diacríticos, sem perder letras base. | P0 | unit |
| CT-003 | RF-04 | — | 1. `normalizar("  ppap  ")`.<br>2. `normalizar("PpAp")`.<br>3. `normalizar("p p a p")` (espaços internos). | 1 e 2 retornam `"PPAP"`. 3 retorna `"PPAP"` — espaços internos também são removidos na chave de busca. Resultado documentado e estável. | P0 | unit |
| CT-004 | RF-04, RF-06 | Repertório vazio | 1. Salvar sentido com `sigla = "p.p.a.p"`.<br>2. Ler `repertorio.json`.<br>3. Buscar `"PPAP"`. | O arquivo grava `"sigla": "PPAP"`. A busca por `"PPAP"` retorna 1 resultado. Chave única normalizada conforme SPEC §3.3. | P0 | int |
| CT-005 | RF-03, RF-04 | Fixture carregada | 1. Digitar `p.h.e.s` no painel.<br>2. Aguardar debounce de 120 ms. | Card de `PHES` renderizado em tela com as 3 abas visíveis, sem tela de "não encontrado". | P0 | E2E |

### 3.2 Cascata de busca em 5 estratégias (SPEC §4.2)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-006 | RF-04 | Fixture com `PPAP` e `PPM` | 1. `buscar("PPAP")`. | `ResultadoBusca.estrategia === "exato"`, 1 sigla retornada (`PPAP`), sem lista de sugestões. Estratégia 1 da cascata. | P0 | unit |
| CT-007 | RF-04 | Fixture com `PPAP` e `PPM` | 1. `buscar("PP")`. | `estrategia === "prefixo"`, sugestões contendo exatamente `["PPAP","PPM"]`, ordenadas alfabeticamente. Nenhum card único aberto automaticamente. | P0 | unit |
| CT-008 | RF-04 | Fixture com `PPAP` | 1. `buscar("PAPP")`.<br>2. `buscar("PPAPP")`. | `estrategia === "fuzzy"`, resposta rotulada "Você quis dizer…" com `PPAP` no topo. Fuse configurado com `threshold: 0.3` — verificado lendo a instância de configuração. | P0 | unit |
| CT-009 | RF-04 | Fixture: `PPAP.sentidos[0].en = "Production Part Approval Process"` | 1. `buscar("Approval Process")`.<br>2. `buscar("Aprovação de Peça")`.<br>3. `buscar("qualidade")` (tag). | `estrategia === "fulltext"` nos 3 casos, com `PPAP` no conjunto retornado. Busca reversa cobre `en`, `pt` e `tags`. | P1 | unit |
| CT-010 | RF-14 | Fixture sem `ZZZZ` | 1. Digitar `ZZZZ` no painel.<br>2. Aguardar 200 ms. | Nenhum significado inventado. Área de resultado mostra o texto `Cadastrar «ZZZZ» no repertório` como botão clicável. Clicar abre o formulário de novo sentido com o campo sigla pré-preenchido `ZZZZ`. | P0 | E2E |
| CT-011 | RF-04 | Fixture com `PPM` (sigla) e outra sigla cujo campo `en` contém a palavra "ppm" | 1. `buscar("PPM")`. | A cascata para na estratégia 1: retorna o match exato, e NÃO mistura resultados de fulltext no mesmo bloco. Estratégias posteriores só executam se a anterior retornar vazio. | P0 | unit |

### 3.3 Desambiguação (SPEC §4.3)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-012 | RF-05 | `API` com 3 sentidos: `ti`, `automotivo`, `corporativo` | 1. Buscar `API` no painel. | 3 cards empilhados verticalmente, um por sentido, cada um com seu badge de categoria visível (`ti`, `automotivo`, `corporativo`). Nenhum sentido omitido. | P0 | E2E |
| CT-013 | RF-05 | `API` com 3 sentidos; sentido `corporativo` marcado `favorito:true`; `Settings.categoriaPreferida = "ti"` | 1. `buscar("API")`.<br>2. Inspecionar a ordem do array retornado. | Ordem: 1º o favorito (`corporativo`), depois pelos acessos, depois a categoria preferida (`ti`), depois alfabética por `en`. Critério de SPEC §4.3 aplicado nessa precedência exata. | P1 | unit |
| CT-014 | RF-05, RF-06 | `API` com 3 sentidos | 1. Editar apenas o sentido `ti` alterando `pt`.<br>2. Salvar.<br>3. Reabrir `API`. | Apenas o sentido `ti` mudou; os outros 2 mantêm `pt`, `atualizadoEm` e `id` originais. | P0 | int |

### 3.4 Abas de resultado e sub-abas (SPEC §5.3)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-015 | RF-03 | Buscar `PPAP` | 1. Observar a aba ativa ao abrir.<br>2. Clicar em `Português`.<br>3. Clicar em `Aplicação`.<br>4. Clicar em `Inglês`. | Aba inicial é `Inglês` mostrando `Production Part Approval Process`. `Português` mostra `Processo de Aprovação de Peça de Produção`. `Aplicação` mostra as sub-abas. Troca de aba não recarrega a busca nem perde a posição de rolagem. | P0 | E2E |
| CT-016 | RF-03 | Card `PPAP` aberto na aba `Aplicação` | 1. Verificar a sub-aba ativa.<br>2. Clicar em `Onde aparece`.<br>3. Voltar para `Contexto`. | Sub-aba inicial `Contexto` exibe `aplicacao.contexto` e `aplicacao.exemplo`. `Onde aparece` exibe `area › processo` e a linha `Ref.:` com `aplicacao.referencia`. Alternar entre as sub-abas não altera a aba principal. | P0 | E2E |
| CT-017 | RF-03 | Sentido cadastrado sem `aplicacao.referencia` (campo opcional, SPEC §3.3) | 1. Abrir a sub-aba `Onde aparece`. | A linha `Ref.:` não é renderizada (nem como `undefined`, `null` ou `Ref.: `). `area › processo` continua visível. | P1 | E2E |
| CT-018 | RF-03, RF-15 | Configurações com `abaPadrao = "pt"` | 1. Salvar a configuração.<br>2. Fechar e reabrir o painel.<br>3. Buscar `PPAP`. | O card abre já na aba `Português`. A preferência persiste após reiniciar o app. | P1 | E2E |

### 3.5 Copiar, favoritar, histórico

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-019 | RF-12 | Card `PPAP` aberto na aba `Inglês` | 1. Clicar em `[⧉]`.<br>2. Ler a área de transferência via `clipboard.readText()`.<br>3. Trocar para a aba `Português` e clicar `[⧉]` novamente.<br>4. Ler novamente. | Passo 2 retorna `Production Part Approval Process`. Passo 4 retorna `Processo de Aprovação de Peça de Produção`. O botão copia o conteúdo da **aba ativa**, e um feedback visual "Copiado" aparece por até 2 s. | P0 | E2E |
| CT-020 | RF-12 | Card na aba `Aplicação`, sub-aba `Contexto` | 1. Clicar `[⧉]`.<br>2. Ler a área de transferência. | O texto copiado contém o `contexto` e o `exemplo` da sub-aba ativa, em texto plano, sem marcação HTML. | P1 | E2E |
| CT-021 | RF-09 | `PPAP.sentidos[0].favorito = false` | 1. Clicar `[★]` no card.<br>2. Ler `repertorio.json`.<br>3. Reiniciar o app e buscar `PPAP`. | Após o passo 1 o ícone fica no estado ativo; o arquivo grava `"favorito": true` e `atualizadoEm` é atualizado. Após reiniciar, o estado permanece favoritado. | P0 | E2E |
| CT-022 | RF-09 | Sentido já favoritado | 1. Clicar `[★]` novamente.<br>2. Ler o arquivo. | `favorito` volta a `false`. A ação é um toggle idempotente por sentido, não por sigla — os demais sentidos da mesma sigla permanecem inalterados. | P1 | int |
| CT-023 | RF-09 | Repertório fixture, histórico vazio | 1. Buscar `PPAP`, `KPI`, `SOP`, `BOM` nessa ordem.<br>2. Chamar `historico()`.<br>3. Buscar `KPI` de novo e chamar `historico()`. | Passo 2 retorna `["BOM","SOP","KPI","PPAP"]` (mais recente primeiro). Passo 3 retorna `["KPI","BOM","SOP","PPAP"]` — sem duplicata, item promovido ao topo. Lista limitada a 10 entradas. | P1 | int |
| CT-024 | RF-09 | 3 sentidos favoritados em siglas distintas | 1. Abrir o painel sem digitar nada. | A área de resultado vazia mostra a lista de favoritos (até 10) e, abaixo, o histórico recente. Clicar em um item abre o card correspondente. | P1 | E2E |

### 3.6 CRUD do repertório (SPEC §3.3, §5.4)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-025 | RF-06 | App aberto, painel com busca `XPTO` sem resultado | 1. Clicar no CTA `Cadastrar «XPTO»`.<br>2. Preencher `en`, `pt` e `contexto`.<br>3. Escolher a categoria.<br>4. Clicar em `Salvar`. | A sigla é criada com no máximo **4 interações** após o CTA (meta M6). O arquivo recebe `XPTO` com 1 sentido, `id` uuid v4 válido, `criadoEm` e `atualizadoEm` em ISO 8601 iguais, `favorito:false`, `tags:[]`. | P0 | E2E |
| CT-026 | RF-06 | `PPAP` existente | 1. Abrir o Repertório.<br>2. Clicar `✎` no sentido automotivo.<br>3. Alterar `pt`.<br>4. Salvar. | `pt` atualizado; `criadoEm` inalterado; `atualizadoEm` maior que o valor anterior; `id` preservado. | P0 | E2E |
| CT-027 | RF-06 | `API` com 3 sentidos | 1. Excluir o sentido `ti`.<br>2. Observar o diálogo.<br>3. Confirmar. | Um diálogo de confirmação nomeando o sentido aparece antes de qualquer escrita. Após confirmar, `API` permanece com 2 sentidos. Cancelar no diálogo não altera o arquivo. | P0 | E2E |
| CT-028 | RF-06 | `PHES` com 1 único sentido | 1. Excluir esse sentido.<br>2. Confirmar.<br>3. Buscar `PHES`. | A sigla `PHES` é removida inteiramente do array `siglas` (SPEC §3.3: excluir o último sentido remove a sigla). A busca cai na estratégia 5 com o CTA de cadastro. | P0 | int |
| CT-029 | RF-06 | `PPAP` com 1 sentido | 1. No Repertório, acionar `Duplicar` no sentido.<br>2. Salvar. | Novo sentido criado na mesma sigla com `id` **diferente**, demais campos copiados, `criadoEm`/`atualizadoEm` novos. `PPAP` passa a ter 2 sentidos e o card mostra 2 blocos empilhados. | P2 | E2E |
| CT-030 | RF-06 | Repertório com 12 siglas | 1. Abrir o Repertório.<br>2. Filtrar por categoria `ti`.<br>3. Digitar `A` no campo de busca da tabela.<br>4. Ordenar por sigla desc. | A tabela mostra apenas linhas da categoria `ti` que contenham `A`; a ordenação desc é aplicada sobre o conjunto filtrado. Contador de linhas visível e coerente com o filtro. | P1 | E2E |

### 3.7 Import / Export (SPEC §7)

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-031 | RF-07 | Fixture de 12 siglas carregada | 1. `exportar("json")`.<br>2. Abrir o arquivo gerado. | Arquivo JSON válido com `schemaVersion: 1`, `atualizadoEm` ISO 8601 e `siglas` com as 12 entradas e todos os campos do schema (`id`, `favorito`, `criadoEm`, `atualizadoEm`). Passa na validação Zod de `Repertorio`. | P0 | int |
| CT-032 | RF-07 | Fixture contendo `pt = "Processo de Aprovação de Peça de Produção"` | 1. `exportar("csv")`.<br>2. Ler os 3 primeiros bytes do arquivo em hexadecimal.<br>3. Abrir o CSV no Excel PT-BR. | Bytes iniciais `EF BB BF` (BOM UTF-8). No Excel, a célula exibe `Aprovação` e `Peça` com acentuação correta, sem `AprovaÃ§Ã£o`. | P0 | int + manual |
| CT-033 | RF-07 | Fixture carregada | 1. `exportar("xlsx")`.<br>2. Ler a primeira linha da planilha. | Cabeçalho exatamente nesta ordem, com as 14 colunas do SPEC §7: `id, sigla, categoria, en, pt, contexto, exemplo, area, processo, referencia, tags, favorito, criadoEm, atualizadoEm`. Uma linha por **sentido** (não por sigla): `API` com 3 sentidos gera 3 linhas. `tags` serializada com separador `;`; `favorito` como `sim`/`não`. | P0 | int |
| CT-034 | RF-07 | Repertório com `PPAP` (1 sentido) e `KPI`. Arquivo de import com `PPAP` (mesmo sentido, `pt` alterado) e `SOP` (novo) | 1. `importar(arquivo, "merge")`.<br>2. Ler o `RelatorioImport`.<br>3. Ler `repertorio.json`. | `RelatorioImport = { inseridos: 1, atualizados: 1, ignorados: 0, erros: [] }`. `SOP` inserida, `PPAP.pt` atualizado, `KPI` **preservada** (merge não apaga o que existe). | P0 | int |
| CT-035 | RF-07 | Repertório com 12 siglas. Arquivo de import com 3 siglas | 1. `importar(arquivo, "substituir")`.<br>2. Listar `%APPDATA%/Lupa/backups/`.<br>3. Ler `repertorio.json`. | Antes da troca, um backup novo é criado em `backups/` com o conteúdo das 12 siglas anteriores. Após a operação, o repertório tem exatamente as 3 siglas do arquivo — as 12 antigas sumiram. | P0 | int |
| CT-036 | RF-07 | CSV salvo em UTF-8 **com** BOM, contendo `MANUTENÇÃO PREVENTIVA` em `pt` e `Ação corretiva` em `contexto` | 1. `importar(csv, "merge")`.<br>2. Ler os valores gravados no JSON. | Os acentos são preservados byte a byte no JSON; o BOM é consumido e **não** aparece dentro do primeiro campo (`sigla` não vira `﻿PPAP`). | P0 | int |
| CT-037 | RF-07 | CSV com 5 linhas: 3 válidas, 1 sem o campo `en`, 1 com `categoria = "financeiro"` (fora do enum) | 1. `importar(csv, "merge")`.<br>2. Ler o `RelatorioImport`.<br>3. Ler o repertório. | `inseridos: 3`, `ignorados: 2`, `erros` com 2 entradas contendo o **número da linha** e o motivo (`campo obrigatório en ausente`, `categoria inválida: financeiro`). As 3 linhas válidas foram gravadas — o import não é abortado por uma linha ruim. | P0 | int |
| CT-038 | RF-07, RF-08b | Fixture carregada, com 2 sentidos favoritados | 1. `exportar("xlsx")`.<br>2. Apagar o repertório.<br>3. `importar(xlsx, "substituir")`.<br>4. Comparar campo a campo com o original. | Round-trip **sem perda** (SPEC §7): as 12 siglas voltam com `id`, `sigla`, `categoria`, `en`, `pt`, `aplicacao`, `tags`, `favorito`, `criadoEm` e `atualizadoEm` idênticos. Os 2 favoritos continuam favoritados. Diferença zero no diff do JSON exportado antes e depois. | P0 | int |

### 3.8 Atalho global, janela, bandeja e sistema

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-039 | RF-02 | App em execução, painel fechado, foco no Bloco de Notas | 1. Pressionar `Ctrl+Alt+L`.<br>2. Digitar `PPAP` imediatamente, sem clicar em nada. | O painel abre ancorado à lupa e o texto `PPAP` aparece no campo de busca do Lupa (não no Bloco de Notas) — foco automático no input, conforme SPEC §5.2. | P0 | E2E |
| CT-040 | RF-02 | Painel aberto pelo atalho | 1. Pressionar `Ctrl+Alt+L` novamente. | O painel fecha. O atalho é um toggle abrir/fechar. Nenhuma segunda janela é criada. | P0 | E2E |
| CT-041 | RF-02, RF-15 | App aberto | 1. Em Configurações, trocar o atalho para `Ctrl+Alt+K` e salvar.<br>2. Pressionar `Ctrl+Alt+K`.<br>3. Pressionar `Ctrl+Alt+L`.<br>4. Reiniciar o app e repetir 2 e 3. | O novo atalho abre o painel; o antigo não faz mais nada (foi desregistrado). A preferência sobrevive ao reinício. Se o registro falhar (atalho já tomado pelo SO), a UI exibe o erro `Atalho indisponível` e mantém o anterior. | P0 | E2E |
| CT-042 | RF-01 | App aberto sobre o Explorador de Arquivos maximizado | 1. Clicar na janela do Explorador para dar foco.<br>2. Observar a lupa.<br>3. Abrir o painel e repetir. | A lupa e o painel permanecem visíveis acima da janela em foco (`alwaysOnTop: 'screen-saver'`). A lupa não aparece na barra de tarefas nem no `Alt+Tab`. | P0 | E2E |
| CT-043 | RF-01 | Lupa em `x:1200, y:400` | 1. Arrastar a lupa para `x:300, y:800`.<br>2. Ler `settings` (electron-store).<br>3. Fechar o app pela bandeja e reabrir. | `settings.lupaPos` grava `{x:300,y:800}` com tolerância de ±2 px. Ao reabrir, a lupa reaparece na mesma posição. | P0 | E2E |
| CT-044 | RF-01, RF-10 | App aberto | 1. Clicar com o botão direito na lupa.<br>2. Verificar os itens.<br>3. Clicar no ícone da bandeja e abrir o menu de contexto.<br>4. Acionar `Sair`. | O menu da lupa tem exatamente `Repertório`, `Configurações`, `Sair` (SPEC §5.1). A bandeja tem ícone visível com tooltip `Lupa`. `Sair` encerra o processo — nenhum `electron.exe` remanescente no Gerenciador de Tarefas. | P0 | E2E |
| CT-045 | RF-10 | Autostart desligado | 1. Ligar `Iniciar com o Windows` em Configurações.<br>2. Ler a chave `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.<br>3. Desligar a opção e ler de novo. | Ao ligar, existe um valor `Lupa` apontando para o executável instalado. Ao desligar, o valor é removido. Nenhuma escrita em `HKLM` (não exige admin — ver NF-6). | P1 | E2E |
| CT-046 | RF-13 | App recém-aberto, mouse longe da lupa | 1. Não interagir por 6 s e medir a opacidade computada da lupa.<br>2. Passar o mouse sobre a lupa e medir de novo.<br>3. Afastar o mouse e esperar 6 s. | Passo 1: opacidade `0.55` (±0,02) após 5 s de ociosidade. Passo 2: `1.0` com transformação de escala `1.08`. Passo 3: volta a `0.55`. | P1 | E2E |
| CT-047 | RF-15 | `fixarPainel = false` | 1. Abrir o painel.<br>2. Clicar em outra aplicação.<br>3. Ligar `fixar painel` e repetir 1 e 2. | Com `fixarPainel=false` o painel fecha ao perder o foco. Com `fixarPainel=true` o painel permanece aberto. | P1 | E2E |
| CT-048 | RF-03 | Busca `PP` retornando 2 sugestões | 1. Pressionar `↓` duas vezes.<br>2. Pressionar `Enter`.<br>3. Pressionar `Esc`. | `↓` move a seleção visível entre as sugestões (sem sair da lista no fim). `Enter` abre o card da sugestão selecionada. `Esc` fecha o painel. Com a lista vazia, `Enter` seleciona o primeiro resultado (SPEC §5.2). | P1 | E2E |
| CT-050 | RF-15 | App aberto | 1. Trocar o tema para `escuro`, depois `claro`, depois `sistema`.<br>2. Com `sistema`, alternar o tema do Windows. | A UI da lupa e do painel refletem cada escolha sem reiniciar. Em `sistema`, a troca do tema do Windows é seguida em até 1 s. | P2 | E2E |
| CT-051 | RF-11 | Instalador NSIS gerado, máquina Windows 11 limpa, usuário **sem** privilégio de administrador | 1. Executar o `.exe`.<br>2. Concluir a instalação.<br>3. Abrir o app pelo menu Iniciar.<br>4. Desinstalar pelo Painel de Controle. | Instala sem prompt de UAC, em `%LOCALAPPDATA%`. O app abre e faz uma busca com sucesso. A desinstalação remove os binários e **preserva** `%APPDATA%/Lupa/repertorio.json` (risco "perda do repertório ao reinstalar", BRIEFING §8). | P0 | manual |
| CT-052 | RF-11 | Artefato portátil gerado, pen drive | 1. Copiar o portátil para o pen drive.<br>2. Executar em uma máquina sem instalação prévia.<br>3. Fazer uma busca e cadastrar 1 sigla. | O app roda sem instalar nada e sem UAC. Os dados são gravados em `%APPDATA%/Lupa/` (mesmo local do instalado), conforme BRIEFING §8. | P1 | manual |
| CT-053 | RF-16 | App empacotado | 1. No renderer, avaliar `typeof require`, `typeof process`, `window.lupa`.<br>2. Chamar `window.lupa.salvarSentido()` com `categoria: "financeiro"`. | Passo 1: `require` e `process` são `undefined`; apenas a API exposta pelo `contextBridge` existe. Passo 2: a promessa rejeita com erro de validação Zod e **nada** é escrito no `repertorio.json`. | P0 | int |
| CT-054 | RF-17 | Repertório com 12 siglas | 1. Executar 7 operações de escrita seguidas (salvar/editar/excluir).<br>2. Listar `%APPDATA%/Lupa/backups/`.<br>3. Inspecionar o diretório durante uma escrita. | `backups/` contém no máximo **5** arquivos, os mais recentes (rotação). Durante a escrita existe um `.tmp` que depois é renomeado — o `repertorio.json` nunca fica parcialmente escrito. | P0 | int |
| CT-055 | RF-04, RF-19 | Repertório **do próprio usuário** já carregado na máquina dele (carga inicial e/ou cadastros), com N siglas — N registrado no §8. Amostra de **30 consultas reais fornecida pelo usuário**, escritas do jeito que ele digitaria (com pontos, sem acento, com erro de digitação) | 1. Para cada consulta da amostra, chamar `buscar()`.<br>2. Contar quantas retornaram, na **primeira** posição, a sigla que o usuário indicou como resposta correta.<br>3. Classificar cada falha em: sigla ausente do repertório (não conta contra a métrica) ou sigla presente e não encontrada (conta contra). | ≥ 90% de acerto **entre as consultas cuja sigla existe no repertório** — meta M3 medida sobre o conteúdo real do usuário, nunca sobre massa gerada por nós. Se a amostra não for fornecida, o caso é **bloqueado**, não aprovado por omissão. Registrar no §8: N, tamanho da amostra, acertos, e a lista nominal das falhas. | P1 | manual + int |

### 3.9 Origem dos dados, carga inicial, cadastro manual e estado vazio (SPEC §3.2.1)

> Esta seção verifica a regra dura do BRIEFING §9: **o usuário é a única fonte de
> verdade do repertório**. Um caso reprovado aqui bloqueia a release sozinho.

| ID | Req. | Pré | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| CT-049 | RF-08d | `%APPDATA%/Lupa/` inexistente (primeiro boot) **e** `data/carga-inicial.json` ausente do pacote | 1. Iniciar o app.<br>2. Ler `repertorio.json`.<br>3. Ler o log do processo main.<br>4. Abrir a tela Repertório. | O arquivo é criado com `{ "schemaVersion": 1, "atualizadoEm": <ISO>, "siglas": [] }` — repertório **vazio e válido** no Zod, com zero siglas. Nenhum erro, warning ou exceção no console do main (ausência da carga inicial é caminho normal, não falha). A tela Repertório abre no estado vazio, sem linha nenhuma. | P0 | int |
| CT-056 | RF-08a | `%APPDATA%/Lupa/` inexistente. `data/carga-inicial.json` presente com 10 entradas: 8 válidas, 1 sem `en` e 1 com `categoria: "financeiro"` | 1. Iniciar o app.<br>2. Ler o `RelatorioImport` da carga inicial (log + tela de aviso).<br>3. Ler `repertorio.json`.<br>4. Buscar uma das 8 siglas. | As 8 entradas válidas são importadas **na íntegra** (todos os campos preservados, nenhum campo inventado ou completado pelo app). `RelatorioImport` traz `inseridos: 8`, `ignorados: 2` e 2 erros com **número da linha e campo** (`en ausente`, `categoria inválida: financeiro`). O usuário vê esse relatório na 1ª abertura, não só no log. A busca encontra a sigla. Meta M5: 100% das linhas **válidas** importadas sem erro. | P0 | int |
| CT-057 | RF-08c, RF-06 | App aberto, repertório vazio | 1. Abrir a tela Repertório.<br>2. Clicar em **+ Nova sigla**.<br>3. Preencher `sigla`, `categoria`, `en`, `pt` e `contexto`.<br>4. Salvar.<br>5. Fechar o painel, reabrir e buscar a sigla. | O botão **+ Nova sigla** está visível e rotulado exatamente assim na tela Repertório (também no estado vazio). O formulário abre com o campo `sigla` focado. Ao salvar: a sigla é gravada normalizada em maiúsculas, com `id` uuid v4, `acessos: 0`, `favorito: false`, `criadoEm` = `atualizadoEm`, e **nenhum campo opcional preenchido automaticamente** com texto sugerido. A sigla aparece na tabela e na busca imediatamente, sem reiniciar. Fluxo concluído em ≤ 4 interações após o botão (RNF10 / M6). | P0 | E2E |
| CT-058 | RF-08c, RF-06 | Formulário **+ Nova sigla** aberto | 1. Salvar com todos os campos vazios.<br>2. Preencher só com espaços em `en` e salvar.<br>3. Preencher `sigla` com 33 caracteres.<br>4. Preencher `en` com 201 caracteres.<br>5. Preencher `contexto` com 2001 caracteres.<br>6. Adicionar 11 tags.<br>7. Preencher `sigla`, `en`, `pt` e `contexto` válidos e salvar. | Passos 1-2: submissão recusada com mensagem por campo em `sigla`, `en`, `pt` e `contexto` (obrigatórios do SPEC §3.4); `trim()` aplicado antes da validação. Passos 3-6: recusa com a mensagem do limite excedido (32 / 200 / 2000 / 10 tags × 40 do SPEC §3.3), **sem truncar em silêncio**, com contador de caracteres visível. Nada é escrito no `repertorio.json` em nenhum desses passos. Passo 7: grava com sucesso. | P0 | E2E |
| CT-059 | RF-08d | Repertório vazio (0 siglas) | 1. Abrir a tela Repertório.<br>2. Verificar os CTAs.<br>3. Clicar em "importar planilha" e cancelar o diálogo.<br>4. Clicar em "cadastrar primeira sigla". | A tela mostra o estado vazio com exatamente **dois** CTAs: `Cadastrar primeira sigla` e `Importar planilha`. Nenhuma tabela vazia com cabeçalho órfão, nenhum spinner, nenhuma sugestão de sigla de exemplo. O CTA de import abre o diálogo nativo e cancelar não altera nada (e não fecha o painel — SPEC §5.2). O CTA de cadastro abre o mesmo formulário de CT-057. | P1 | E2E |
| CT-060 | RF-08d | Repertório vazio, histórico e favoritos vazios | 1. Abrir o painel de busca sem digitar nada. | O painel mostra o estado vazio com os dois CTAs, em vez das listas de favoritos/histórico de CT-024. Nenhuma mensagem de erro, nenhum "carregando" permanente. O campo de busca permanece focado e utilizável. | P1 | E2E |
| CT-061 | RF-08d, RF-19 | Repertório vazio (0 siglas) | 1. Digitar `PPAP` no painel.<br>2. Aguardar 300 ms.<br>3. Repetir com `a` (1 caractere) e com 32 caracteres. | Em todos os casos a cascata termina em `estrategia: "nenhum"` com `sugestaoCadastro: true` e a UI exibe o CTA `Cadastrar «PPAP» no repertório`. **Nenhum erro**, nenhuma exceção, nenhuma tela em branco e nenhum significado exibido. Fuse.js opera sobre coleção vazia sem lançar. | P0 | E2E |
| CT-062 | RF-19 | Pacote de release (instalador e portátil) e repositório de código | 1. Desempacotar o `app.asar` e listar o conteúdo de `data/`.<br>2. `grep -riE "seed\|siglas.seed\|significado sugerido" dist/`.<br>3. Instalar em máquina limpa, abrir e fechar o app sem interagir, e ler `repertorio.json`.<br>4. Buscar 10 siglas comuns (`CEO`, `KPI`, `API`, `RH`, `TI`...). | O pacote **não contém** `siglas.seed.json` nem qualquer arquivo de siglas além de `carga-inicial.json`, quando o usuário tiver fornecido a lista. Após o passo 3, `siglas` continua com exatamente o que veio da carga inicial (ou `[]`) — o app não acrescentou nada sozinho. No passo 4, toda sigla ausente cai no CTA de cadastro; nenhuma definição aparece. Combinado com NF-8 (zero rede), prova que não há consulta externa. | P0 | int + manual |

---

## 4. Casos de teste não-funcionais (RNF1–RNF8)

> Todos executados na **máquina de referência** (§1.3), com o app **empacotado**
> (não em modo dev), repertório de 10.000 siglas quando indicado, e o resultado
> reportado como mediana de **10 execuções** + pior caso (p100). Reprova se a
> mediana exceder o alvo **ou** se o p100 exceder o alvo em mais de 50%.

| ID | RNF | Alvo | Método de medição | Critério de aprovação |
|---|---|---|---|---|
| **NF-1** | RNF1 — atalho → painel focado | < 300 ms | Instrumentar `t0` no callback de `globalShortcut` (main) e `t1` no evento `focus` do input do painel (renderer), ambos com `performance.now()` sincronizado por `process.hrtime.bigint()`. 10 disparos com 5 s de intervalo, painel previamente fechado. | Mediana `t1 - t0` < 300 ms **e** p100 < 450 ms. Nenhuma execução acima de 500 ms. |
| **NF-1b** | M1 — atalho → resultado na tela | < 1,5 s | Playwright: disparar o atalho, digitar `PPAP` com `delay: 0`, marcar `t2` quando o seletor `[data-testid="result-card"]` fica visível. 10 repetições. | Mediana `t2 - t0` < 1500 ms. Registrar também `t2 - t1` para isolar o custo da busca. |
| **NF-2** | RNF2 — busca → resultado (10k) | < 50 ms | `repertorio.10k.json` carregado. Benchmark Vitest (`bench`) chamando `buscar()` 1000 vezes com um conjunto de 20 termos que exercita as 5 estratégias (4 exatos, 4 prefixos, 4 fuzzy, 4 fulltext, 4 sem resultado). Medir por estratégia. | Mediana global < 50 ms **e** nenhuma estratégia isolada com mediana > 50 ms. Reportar separadamente porque fulltext é o pior caso esperado. |
| **NF-3** | RNF3 — boot a frio | < 3 s | Reiniciar o Windows, aguardar 60 s de estabilização, iniciar o app e marcar de `CreateProcess` (timestamp do `Start-Process`) até o `ready-to-show` da janela da lupa. 10 medições com reinício entre elas. Repertório de 10k carregado. | Mediana < 3000 ms **e** p100 < 4000 ms. |
| **NF-4** | RNF4 — RAM em repouso | < 180 MB | App aberto há 5 min, painel **fechado**, sem interação. Somar o `Private Working Set` de **todos** os processos (main + renderer + GPU + utility) via `Get-Process` ou `powershell Get-Counter`. 3 amostras com 1 min de intervalo. | Soma média < 180 MB **e** nenhuma amostra > 200 MB. Registrar também a RAM com o painel aberto (informativo, sem gate). |
| **NF-5** | RNF5 — 100% offline | obrigatório | Desconectar o Wi-Fi e desabilitar o adaptador Ethernet. Executar integralmente o roteiro de UAT (§7): buscar, cadastrar, editar, favoritar, importar CSV, exportar XLSX, reiniciar o app. | Zero erros, zero spinners infinitos, zero mensagens de rede. Todas as 13 etapas do UAT concluídas exatamente como com rede. |
| **NF-6** | RNF6 — sem privilégio de admin | obrigatório | Conta Windows **Standard User** (sem grupo Administradores), máquina limpa. Instalar, abrir, usar, ligar autostart, exportar para `Documentos` e desinstalar. | Nenhum prompt de UAC em nenhuma etapa. Instalação em `%LOCALAPPDATA%`, dados em `%APPDATA%`, autostart em `HKCU`. Nenhuma escrita em `Program Files` ou `HKLM`. |
| **NF-7** | RNF7 — tamanho do instalador | < 120 MB | `dir` sobre o artefato NSIS `.exe` gerado pelo electron-builder em release (`asar: true`, sem sourcemaps). Medir em MB decimais (1 MB = 1.000.000 B). | `.exe` do instalador < 120 MB. Registrar também o tamanho do portátil e o tamanho instalado em disco (informativo). |
| **NF-8** | RNF8 — zero telemetria | obrigatório | 1. Rodar o app por 30 min com Wireshark filtrando `ip.addr != 127.0.0.1` e o processo do Lupa.<br>2. `netstat -ano` filtrado pelo PID a cada 5 min.<br>3. `grep -riE "http(s)?://\|fetch\(\|XMLHttpRequest\|analytics\|telemetry\|sentry" dist/` no bundle desempacotado. | Zero conexões de saída observadas nos 30 min. `netstat` sem nenhuma conexão remota estabelecida. A varredura só encontra URLs inertes (links de `referencia` no conteúdo do repertório), nenhuma chamada de rede em código. |

---

## 5. Testes de robustez e casos de borda

| ID | Cenário | Pré / preparo | Passos | Resultado esperado | Prio | Tipo |
|---|---|---|---|---|---|---|
| **RB-01** | `repertorio.json` corrompido | Gravar no arquivo o conteúdo `{"schemaVersion":1,"siglas":[{"sigla":"PP` (JSON truncado). Existe backup válido em `backups/` | 1. Iniciar o app.<br>2. Observar a mensagem.<br>3. Buscar `PPAP`. | O app **abre**. Exibe aviso não modal: `Repertório corrompido — restaurado o backup de <data>`. O arquivo corrompido é preservado como `repertorio.corrupto-<timestamp>.json`. A busca funciona com os dados do backup. Nenhum crash, nenhuma tela branca. | P0 | int |
| **RB-02** | Arquivo inexistente no 1º boot | `%APPDATA%/Lupa/` apagado, em duas variantes: (a) sem `data/carga-inicial.json`, (b) com `carga-inicial.json` válido | 1. Iniciar o app.<br>2. Ler `repertorio.json`.<br>3. Buscar uma sigla.<br>4. Cadastrar uma sigla e reiniciar. | (a) Diretório e `repertorio.json` criados vazios e válidos; a busca cai no CTA de cadastro sem erro (CT-049, CT-061). (b) Criados já com o conteúdo da carga inicial (CT-056). Em ambas: nenhum erro no console do main, e o cadastro feito no passo 4 sobrevive ao reinício — a carga inicial **não** é reaplicada por cima nem duplica siglas no 2º boot. | P0 | int |
| **RB-03** | Disco cheio na escrita | Simular com mock de `fs.writeFile` lançando `ENOSPC` no `.tmp` | 1. Editar um sentido e salvar.<br>2. Ler `repertorio.json`. | A operação falha com mensagem clara ao usuário (`Não foi possível salvar: disco cheio`). O `repertorio.json` **original permanece íntegro e válido** (o rename nunca ocorreu). O `.tmp` parcial é removido. | P0 | unit |
| **RB-04** | Corrupção durante o rename | Mock que lança após escrever o `.tmp` e antes do `rename` | 1. Salvar.<br>2. Reiniciar o app. | Arquivo original íntegro; app abre normalmente; nenhum `.tmp` órfão acumulado (limpeza no boot). | P1 | unit |
| **RB-05** | Repertório com 10.000 siglas | `repertorio.10k.json` em `%APPDATA%` | 1. Medir o boot (NF-3).<br>2. Buscar 20 termos (NF-2).<br>3. Abrir a tela Repertório e rolar do topo ao fim.<br>4. Exportar XLSX. | Boot < 3 s; busca < 50 ms; a tabela virtualizada rola a 10.000 linhas sem travar (sem frame acima de 100 ms) e a RAM não passa de 250 MB com o painel aberto; o export XLSX conclui em < 10 s e gera um arquivo abrível no Excel. | P0 | E2E |
| **RB-06** | Sigla duplicada no import | CSV com 3 linhas para `PPAP`: duas idênticas e uma com `en` diferente | 1. `importar(csv, "merge")`.<br>2. Ler o repertório. | `PPAP` existe **uma única vez** no array `siglas`. As linhas idênticas viram 1 sentido (a 2ª é contada em `ignorados` como duplicata); a linha com `en` diferente vira um 2º sentido. `RelatorioImport` explica cada decisão com o número da linha. | P0 | int |
| **RB-07** | Campo obrigatório vazio | Formulário de novo sentido aberto | 1. Deixar `en` vazio e tentar salvar.<br>2. Preencher `en`, apagar `pt`, salvar.<br>3. Preencher `en` e `pt`, apagar `contexto`, salvar.<br>4. Preencher só com espaços em branco e salvar. | Em todos os casos o botão `Salvar` fica bloqueado ou a submissão é recusada com mensagem por campo. Nada é escrito no arquivo. Espaço em branco não conta como preenchido (`trim()` antes da validação Zod). `exemplo`, `area`, `processo`, `referencia` e `tags` permanecem opcionais e salvam vazios. | P0 | E2E |
| **RB-08** | String muito longa | — | 1. Colar 10.000 caracteres no campo `contexto` e salvar.<br>2. Colar 500 caracteres no campo `sigla`.<br>3. Buscar a sigla salva. | Limites explícitos e aplicados: `sigla` ≤ 32 caracteres, `en`/`pt` ≤ 200, `contexto`/`exemplo` ≤ 2000, com contador e truncamento/recusa informados na UI. O card renderiza o texto longo com rolagem, sem estourar o layout de 380×520 px nem sobrepor os botões `[★] [✎]`. | P1 | E2E |
| **RB-09** | Caracteres especiais | — | 1. Cadastrar sigla com conteúdo `<script>alert(1)</script>` em `pt`.<br>2. Cadastrar `contexto` com `"aspas"`, `;`, `,`, quebra de linha e emoji.<br>3. Exportar CSV e reimportar.<br>4. Abrir o card. | O texto é renderizado como texto literal (sem execução de script, sem HTML interpretado). No CSV os campos com `,`, `;`, `"` e quebra de linha são corretamente escapados e voltam idênticos no reimport. Emoji preservado em UTF-8. | P0 | int + E2E |
| **RB-10** | Duas instâncias abertas | App já em execução | 1. Executar o `.exe` novamente.<br>2. Observar a tela e o Gerenciador de Tarefas.<br>3. Repetir com o portátil enquanto o instalado roda. | A segunda instância encerra imediatamente e **traz a instância existente para frente** (lupa em destaque e painel aberto). Existe apenas um conjunto de processos do Lupa. Nenhuma escrita concorrente em `repertorio.json`. | P0 | E2E |
| **RB-11** | Múltiplos monitores | 2 monitores, principal 1920×1080 e secundário 2560×1440 com escala 150% | 1. Arrastar a lupa para o monitor secundário e soltar.<br>2. Abrir o painel.<br>3. Fechar e reabrir o app. | A lupa permanece no monitor secundário, com 48×48 px **visuais** corretos na escala 150% (sem borrar). O painel abre ancorado à lupa e inteiramente dentro do monitor secundário, nunca cortado pela borda. A posição persiste após reiniciar. | P1 | manual |
| **RB-12** | Mudança de resolução com a lupa fora da área visível | Posição salva `{x:2400,y:1300}` (válida em 2560×1440). Desconectar o monitor secundário / trocar para 1920×1080 | 1. Iniciar o app.<br>2. Localizar a lupa.<br>3. Disparar o atalho global. | O app detecta que a posição salva está fora de qualquer `display.workArea` e **reposiciona** a lupa para dentro da área visível do monitor principal (canto inferior direito, com margem de 24 px), gravando a nova posição. A lupa nunca fica inacessível. O atalho global abre o painel dentro da tela. | P0 | E2E |
| **RB-13** | Perda do atalho global para outro app | Outro aplicativo registra `Ctrl+Alt+L` antes do Lupa | 1. Iniciar o Lupa.<br>2. Observar a UI.<br>3. Abrir o painel pela lupa e pela bandeja. | `globalShortcut.register` retorna `false` e a UI exibe um aviso persistente em Configurações com o texto `Atalho Ctrl+Alt+L indisponível — escolha outro`. O app continua utilizável por clique na lupa e pela bandeja. | P1 | int |
| **RB-14** | Arquivo de import ilegível | Arquivo `.xlsx` renomeado a partir de um `.png`; e um `.json` com `schemaVersion: 99` | 1. Importar cada um. | Falha controlada: `RelatorioImport.erros` com mensagem legível (`arquivo não é uma planilha válida` / `versão de schema 99 não suportada`) e `inseridos: 0`. O repertório atual não é alterado. Nenhuma exceção não tratada no main. | P1 | int |

---

## 6. Critérios de aceite de release (Definition of Done da v1.0)

A v1.0 só pode ser liberada quando **todas** as linhas abaixo estiverem marcadas.
Qualquer linha em vermelho bloqueia o release — não existe exceção informal;
uma exceção só é válida se registrada como dívida assinada pelo owner do produto.

### 6.1 Qualidade de código e testes

| # | Critério | Medida objetiva | OK |
|---|---|---|:--:|
| DoD-01 | Todos os casos **P0** aprovados | 61 de 61 casos P0 verdes (43 funcionais + 9 não-funcionais + 9 robustez) | ☐ |
| DoD-02 | Casos **P1** | ≥ 90% aprovados; cada reprovação com issue aberta e classificada | ☐ |
| DoD-03 | Casos **P2** | Podem falhar; obrigatoriamente registrados como dívida no `docs/SPR.md` | ☐ |
| DoD-04 | Cobertura unitária | Linhas ≥ 85% em `src/shared/` e `src/main/services/`; ≥ 70% no total do projeto | ☐ |
| DoD-05 | Contrato IPC | 19 de 19 métodos de `LupaAPI` (SPEC v1.1 §6.2) com teste feliz **e** teste de payload inválido | ☐ |
| DoD-06 | Build limpo | `tsc --noEmit` sem erros em modo `strict`; ESLint sem `error`; zero `@ts-ignore` novo | ☐ |
| DoD-07 | Suíte verde no CI | 3 execuções consecutivas sem teste intermitente (flaky) | ☐ |
| DoD-08 | Nenhum crash não tratado | Zero exceções não capturadas no log do main durante toda a bateria E2E | ☐ |

### 6.2 Requisitos não-funcionais

| # | Critério | Medida objetiva | OK |
|---|---|---|:--:|
| DoD-09 | RNF1–RNF8 medidos | 8 de 8 com número registrado no §8, não apenas "ok" | ☐ |
| DoD-10 | Métricas de negócio | M1 < 1,5 s · M2 < 3 s · M3 ≥ 90% sobre o repertório do usuário (CT-055) · M4 < 180 MB · M5 = 100% das linhas válidas da carga inicial importadas, ou **N/A registrado** se o usuário não enviou lista · M6 ≤ 4, todas medidas | ☐ |
| DoD-11 | Offline | Bateria completa do UAT executada com a rede desabilitada (NF-5) | ☐ |
| DoD-12 | Zero telemetria | NF-8 com captura Wireshark de 30 min anexada como evidência | ☐ |

### 6.3 Empacotamento e instalação

| # | Critério | Medida objetiva | OK |
|---|---|---|:--:|
| DoD-13 | Instalador em máquina limpa | CT-051 aprovado em VM Windows 11 recém-provisionada, conta Standard User, sem runtime pré-instalado | ☐ |
| DoD-14 | Versão portátil | CT-052 aprovado; roda de pen drive sem instalação | ☐ |
| DoD-15 | Desinstalação | Remove binários e **preserva** `%APPDATA%/Lupa/` | ☐ |
| DoD-16 | Tamanho | Instalador < 120 MB (NF-7) | ☐ |
| DoD-17 | Atualização sobre versão anterior | Instalar v1.0 sobre uma v0.9 preserva o repertório e as configurações | ☐ |

### 6.4 Dados e conteúdo

| # | Critério | Medida objetiva | OK |
|---|---|---|:--:|
| DoD-18 | **Origem exclusiva no usuário** | CT-062 verde: o pacote não embarca nenhuma sigla além da carga inicial do usuário; o app não acrescenta, sugere nem busca significado; nenhuma fixture de teste vai para o pacote | ☐ |
| DoD-18a | Carga inicial sem perda | Se houver `data/carga-inicial.json`: 100% das linhas válidas importadas no 1º boot, com relatório de erro por linha para as inválidas (CT-056). Se não houver: 1º boot vazio e válido, sem erro (CT-049) | ☐ |
| DoD-18b | Três caminhos de entrada verdes | Carga inicial (CT-056), import de planilha (CT-031 a CT-038) e cadastro manual pelo **+ Nova sigla** (CT-057, CT-058), todos aprovados | ☐ |
| DoD-18c | Estado vazio | Tela Repertório e painel de busca com os 2 CTAs e busca sem erro em repertório zerado (CT-059, CT-060, CT-061) | ☐ |
| DoD-19 | Round-trip de dados | Exportar → apagar → importar reproduz o repertório **sem perda**, inclusive `id`, `favorito` e datas (CT-038) | ☐ |
| DoD-20 | Backup | Rotação de 5 versões comprovada (CT-054) e recuperação de corrupção comprovada (RB-01) | ☐ |

### 6.5 Documentação e processo

| # | Critério | Medida objetiva | OK |
|---|---|---|:--:|
| DoD-21 | Rastreabilidade fechada | Todas as 11 linhas de `BRIEFING §6.1` (RF-01 a RF-07, RF-08a/b/c/d, RF-09 a RF-11) com ≥ 1 CT aprovado, mais RF-19 (origem dos dados) | ☐ |
| DoD-22 | UAT aprovado | Os 13 passos do §7 executados e assinados pelo owner do produto | ☐ |
| DoD-23 | Registro preenchido | Tabela do §8 com a execução da build candidata | ☐ |
| DoD-24 | Lacunas tratadas | Cada item do §9 resolvido, ou aceito por escrito como dívida para a v1.1 | ☐ |

---

## 7. Roteiro de teste de aceite do usuário (UAT)

> Para o usuário final. Sem termos técnicos, sem ferramentas. Tempo estimado: **10 minutos**.
> Marque cada passo como **OK** ou **Problema** e escreva o que viu. Se qualquer passo
> marcar Problema, a versão não é liberada. São 13 passos (1 a 12, com um 11b).

**Antes de começar:** feche outros programas, deixe o computador ligado na internet
normalmente e tenha a lupa já instalada.

**Escolha antes uma sigla sua:** as siglas que aparecem aqui são as **da sua
própria lista** — o programa não vem com sigla nenhuma de fábrica e nunca inventa
significado. Antes de começar, escolha uma sigla que você enviou na carga inicial
(ou que vá cadastrar no passo 9) e use ela onde estiver escrito *«sua sigla»*.
Se o seu repertório ainda está vazio, faça o passo 9 primeiro e depois volte ao 4.

| # | O que fazer | O que você deve ver | Tempo | OK / Problema |
|---|---|---|---|---|
| 1 | Reinicie o computador e conte quantos segundos a lupa leva para aparecer na tela depois que você clica no ícone do programa. | A lupinha aparece flutuando na tela em menos de 3 segundos. | 1 min | ☐ |
| 2 | Abra qualquer programa (Outlook, Excel, navegador) em tela cheia e olhe para a lupa. | A lupa continua visível por cima do programa, sem sumir atrás da janela. | 30 s | ☐ |
| 3 | Fique 10 segundos sem mexer no mouse e observe a lupa. Depois passe o mouse em cima dela. | Parada, ela fica mais apagada (translúcida). Com o mouse em cima, fica nítida e um pouquinho maior. | 30 s | ☐ |
| 4 | Sem clicar em nada, aperte as teclas **Ctrl + Alt + L** juntas e, logo em seguida, digite *«sua sigla»*. | A caixa de busca abre na hora já com o cursor piscando, e as letras que você digitou aparecem nela — não no programa que estava aberto. O resultado aparece enquanto você digita. | 1 min | ☐ |
| 5 | Ainda com o resultado na tela, clique nas três abas: **Inglês**, **Português** e **Aplicação**. Dentro de Aplicação, clique em **Contexto** e depois em **Onde aparece**. | Inglês mostra o significado original; Português a tradução; Contexto explica quando se usa, com uma frase de exemplo; Onde aparece mostra a área, o processo e a referência. | 1 min | ☐ |
| 6 | Clique no botãozinho de copiar e cole (Ctrl+V) em um e-mail ou no Bloco de Notas. | O texto colado é exatamente o da aba que estava aberta. | 30 s | ☐ |
| 7 | Apague o que digitou e escreva *«sua sigla»* toda embaralhada: com pontos, tudo minúsculo e com um erro de digitação (por exemplo, se a sigla é `PPAP`, tente `p.p.a.p` e depois `ppapp`). | Nos dois casos o programa encontra a sigla certa (no segundo, oferecendo "você quis dizer"). | 1 min | ☐ |
| 8 | Digite uma sigla que você tem certeza que **não** está cadastrada, por exemplo `ZZZZ`. | Aparece a mensagem oferecendo cadastrar `ZZZZ`. O programa **não** inventa um significado. | 30 s | ☐ |
| 9 | Clique nessa oferta de cadastrar, preencha o inglês, o português e o contexto, e salve. Depois busque essa sigla de novo. Repita pelo botão **+ Nova sigla**, dentro da tela Repertório. | O cadastro leva poucos cliques e a sigla aparece normalmente na busca logo depois. O botão **+ Nova sigla** está visível na tela Repertório e abre o mesmo formulário. Se você deixar o inglês, o português ou o contexto em branco, o programa **não deixa salvar** e diz qual campo falta. | 1,5 min | ☐ |
| 10 | Clique na estrelinha de uma sigla que você usa muito. Depois feche a caixa e abra de novo com Ctrl+Alt+L sem digitar nada. | A sigla aparece na lista de favoritos, junto com as últimas buscas que você fez. | 1 min | ☐ |
| 11 | Abra o Repertório pelo botão direito na lupa, clique em **Exportar** e escolha Excel. Abra o arquivo gerado no Excel. | O Excel abre a planilha com todas as siglas e os acentos corretos (Aprovação, Peça, Manutenção — nada de símbolos estranhos). | 1,5 min | ☐ |
| 11b | Digite três siglas bem comuns que você **não** cadastrou (por exemplo `CEO`, `RH`, `TI`). | Para todas elas o programa diz que não encontrou e oferece cadastrar. Ele **não** mostra nenhum significado que você não tenha escrito — nem mesmo de siglas famosas. | 30 s | ☐ |
| 12 | Arraste a lupa para outro canto da tela. Feche o programa pelo ícone ao lado do relógio (bandeja) e abra de novo. | A lupa volta exatamente no canto onde você deixou, e o seu repertório continua lá, inclusive a sigla nova que você cadastrou. | 1 min | ☐ |

**Conclusão do UAT**

| Campo | Preencher |
|---|---|
| Data | |
| Versão testada | |
| Passos OK | ___ de 13 |
| Passos com Problema | |
| Descrição do problema | |
| Liberar a versão? (Sim / Não) | |
| Assinatura do responsável | |

---

## 8. Registro de execução

> Uma linha por bateria executada. Anexar as evidências (log do Vitest, relatório
> HTML do Playwright, captura do Wireshark, números dos RNFs) na pasta
> `tests/evidencias/<versao>-<data>/` e referenciá-la na coluna Observação.
> Para CT-055 e CT-056, anotar na Observação o tamanho do repertório do usuário (N
> siglas) e se havia `carga-inicial.json` — sem isso as métricas M3 e M5 não são
> interpretáveis.

| Data | Versão | CTs executados | Aprovados | Reprovados | Responsável | Observação |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

### 8.1 Resumo do inventário de casos

| Grupo | Quantidade | P0 | P1 | P2 |
|---|---|---|---|---|
| Funcionais (CT-001 a CT-062) | 62 | 43 | 17 | 2 |
| Não-funcionais (NF-1 a NF-8, incl. NF-1b) | 9 | 9 | — | — |
| Robustez e borda (RB-01 a RB-14) | 14 | 9 | 5 | — |
| **Total** | **85** | **61** | **22** | **2** |

---

## 9. Lacunas e inconsistências no BRIEFING/SPEC

### 9.1 Status das lacunas levantadas na VF v1.0

As 20 lacunas (L-01 a L-20) apontadas na versão 1.0 deste documento foram
**todas endereçadas** no SPEC v1.1 e no BRIEFING v1.1. Verificado item a item:

| Lacuna | Como foi fechada no SPEC/BRIEFING v1.1 | Efeito nesta VF |
|---|---|---|
| L-01 contador de acessos | `Sentido.acessos: number` + `registrarAcesso()` no IPC | CT-013 passa a ser verificável como especificado |
| L-02 / L-03 métricas sem RNF | RNF9 (M1 < 1,5 s) e RNF10 (M6 ≤ 4 passos) criados no §8 | NF-1b e CT-025/CT-057 ganham requisito de origem |
| L-04 tipos indefinidos | §6.1 define `Estrategia`, `ResultadoBusca`, `Filtro`, `RelatorioImport` e `Config` | Asserts de CT-006 a CT-011, CT-034 e CT-037 deixam de ser arbitrados |
| L-05 cascata | §4.2: cascata **excludente**, limite de 10 resultados | CT-011 confirmado; CT-007 ganha critério de limite |
| L-06 / L-07 round-trip e chave do merge | §7: 14 colunas com `id`, `favorito`, `criadoEm`, `atualizadoEm` e chave de merge em 3 níveis | CT-033 e CT-038 reescritos para exigir round-trip **sem perda**; CT-038 promovido a P0 |
| L-08 separador de tags | `;` fixado | CT-033 deixa de arbitrar |
| L-09 IPC faltante | `duplicarSentido`, `excluirSigla`, `restaurarBackup`, `listarBackups` adicionados | CT-029 e RB-01 passam a ter contrato; DoD-05 sobe de 14 para 19 métodos |
| L-10 histórico e favoritos | `Config.tamanhoHistorico` (padrão 10) e `Filtro.apenasFavoritos` | CT-023 e CT-024 deixam de arbitrar |
| L-11 opacidade | Faixa 0,30–1,00, padrão 0,55 | CT-046 confirmado |
| L-12 instância única | §2: a 2ª execução traz a existente ao topo e abre o painel | RB-10 confirmado |
| L-13 multi-monitor | §5.1: reposiciona no boot e em `display-metrics-changed` | RB-11 e RB-12 confirmados |
| L-14 assinatura de código | ADR-6: v1.0 sem assinatura, aviso do SmartScreen como limitação conhecida | CT-051 não reprova por SmartScreen; registrar o aviso como observação |
| L-15 tamanho do portátil | Não recebeu alvo numérico no §8 | **Permanece aberta** — NF-7 mede sem gate para o portátil |
| L-16 auto-close vs diálogo | §5.2: exceções para diálogo nativo e formulário sujo | CT-031 a CT-038, CT-059 e o passo 11 do UAT destravados |
| L-17 limites de campo | §3.3 com tabela de limites e rejeição pelo Zod sem truncar | RB-08 e CT-058 passam a ter critério exato |
| L-18 normalização | §4.1 mantida; espaços internos ainda não citados explicitamente | **Permanece parcialmente aberta** — CT-003 continua arbitrando |
| L-19 pasta configurável | §3.1: ao trocar a pasta, o app copia o repertório antes de usar | Falta caso de teste — ver G-08 |
| L-20 acessibilidade | Não endereçado | **Permanece aberta** — sem CT, dívida de v1.1 |

### 9.2 Lacunas novas, abertas pela mudança de requisito (repertório sem seed)

| # | Onde | Lacuna | Impacto na verificação | Proposta |
|---|---|---|---|---|
| G-01 | SPEC §3.2.1 | O **formato** de `data/carga-inicial.json` não é especificado: é o objeto `Repertorio` completo? um array de `Sigla`? as linhas planas do layout de colunas da §7? | CT-056 precisa fixar um formato para montar a fixture; assumi o objeto `Repertorio` do §3.2, validado pelo mesmo Zod. | Declarar no SPEC que `carga-inicial.json` é um `Repertorio` válido e que o `bootstrap.ts` o valida antes de copiar. |
| G-02 | SPEC §3.2.1 | Não diz qual **modo de import** o 1º boot usa (`merge` ou `substituir`) nem se ele passa pelo `importer.ts` ou é cópia direta do arquivo. | Muda o `RelatorioImport` esperado em CT-056 e o comportamento de RB-02(b). | Especificar: cópia validada, equivalente a `substituir` sobre repertório vazio. |
| G-03 | SPEC §3.2.1 | Não define o comportamento quando `carga-inicial.json` **existe mas está corrompido ou inválido** no 1º boot. | RB-14 cobre import manual, não o boot. Sem regra, o app pode falhar ao abrir na primeira execução — o pior momento possível. | Regra: repertório vazio + aviso na UI com o motivo; nunca impedir o app de abrir. |
| G-04 | SPEC §3.2.1 | Não diz se a carga inicial é aplicada **apenas uma vez**. Se `repertorio.json` já existir (2º boot, reinstalação, atualização de versão), a carga é reaplicada? duplica siglas? sobrescreve edições do usuário? | RB-02 assume "só no 1º boot, nunca reaplica". Se estiver errado, o usuário perde edições numa atualização. | Gravar uma marca (`cargaInicialAplicadaEm`) em Settings e condicionar a aplicação a ela. |
| G-05 | BRIEFING §7 (M5) | M5 é "siglas da lista do usuário importadas sem erro = 100%". Se o usuário **não enviar lista**, a métrica fica indefinida — e não há regra dizendo se isso é aprovação, N/A ou bloqueio. | DoD-10 hoje registra N/A; precisa de decisão formal. | Declarar M5 como N/A registrado quando não houver `carga-inicial.json`. |
| G-06 | BRIEFING §7 (M3) | M3 (≥ 90% de acerto) pressupõe "repertório populado", mas não define **tamanho mínimo** do repertório nem quem fornece a amostra de consultas. Com repertório do usuário, a métrica é inauditável sem essa amostra. | CT-055 fica **bloqueado** até o usuário fornecer as 30 consultas e o gabarito. | Definir no BRIEFING: mínimo de 50 siglas e amostra de 30 consultas fornecida pelo usuário como pré-requisito da medição. |
| G-07 | SPEC §5.4 vs §3.2.1 | O §5.4 lista a ação como **"novo"**, enquanto o §3.2.1 e o BRIEFING §6.1 falam do botão **"+ Nova sigla"**. Rótulo divergente entre duas seções do mesmo documento. | CT-057 assere o rótulo literal `+ Nova sigla` (o que o usuário pediu). | Uniformizar a §5.4 para `+ Nova sigla`. |
| G-08 | SPEC §3.2.1 / §5.4 | O **estado vazio** é descrito só em uma frase e apenas de forma genérica ("a interface exibe"). Não diz em quais telas (Repertório? painel de busca? ambas?), nem o texto exato dos CTAs, nem o que acontece com favoritos/histórico vazios. | CT-059 e CT-060 arbitram: os dois CTAs nas duas telas, com os rótulos `Cadastrar primeira sigla` e `Importar planilha`. | Especificar o estado vazio por tela, com os textos. |
| G-09 | SPEC §3.1 / §5.5 | A troca da pasta do repertório (fechamento de L-19) ganhou regra de cópia, mas nenhum caso de teste foi pedido e o comportamento em erro (destino sem permissão, pasta em rede indisponível) segue indefinido. | Nenhum CT cobre troca de pasta nesta versão. | Criar requisito de erro e um CT na VF v1.2. |
| G-10 | SPEC §9 | `data/carga-inicial.json` aparece na estrutura do repositório, mas não se diz se ele é **empacotado** no `app.asar` do instalador/portátil nem se é removido após a primeira aplicação. | CT-062 assere que o pacote não contém siglas **além** da carga inicial; sem regra, não dá para decidir se a presença do arquivo no pacote é esperada. | Declarar explicitamente que o arquivo é empacotado e permanece somente-leitura. |
