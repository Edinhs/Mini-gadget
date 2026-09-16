# 🔍 Lupa — Mini-Gadget de Siglas

Gadget de desktop para Windows que fica **sempre visível** na tela como um ícone
de lupa flutuante. Clique (ou tecle `Ctrl+Alt+L`), digite uma sigla e receba:

- 🇬🇧 **Inglês** — a expansão original
- 🇧🇷 **Português** — o termo usado no dia a dia
- 🎯 **Aplicação** — abas *Contexto de uso* e *Onde aparece* (área, processo, referência)

Funciona **100% offline**. O repertório é seu: nenhuma sigla é criada,
sugerida ou buscada automaticamente.

---

## Como instalar

### Opção 1 — Instalador (recomendado)
1. Abra a aba **[Actions](../../actions/workflows/build-windows.yml)** do repositório.
2. Entre na execução mais recente de **Build Windows**.
3. Baixe o artefato **Lupa-Windows** e extraia.
4. Rode `Lupa-Setup-1.0.0.exe`.

Instala **sem precisar de administrador**. Na primeira execução o Windows pode
exibir o aviso do SmartScreen (o app não tem certificado de assinatura):
**Mais informações → Executar assim mesmo**.

### Opção 2 — Portátil
Baixe `Lupa-Portable-1.0.0.exe` no mesmo artefato, ou extraia o ZIP portátil e
clique em `Lupa.exe`. Não instala nada.

## Como usar

| Ação | Como |
|---|---|
| Abrir a busca | Clicar na lupa, ou `Ctrl+Alt+L` de qualquer lugar |
| Mover a lupa | Arrastar; a posição fica salva |
| Cadastrar sigla | Botão **+ Nova sigla**, ou `Ctrl+N` |
| Importar planilha | Repertório → **Importar** (Excel, CSV ou JSON) |
| Exportar | Repertório → **Exportar**, ou Configurações |
| Copiar significado | Botão **⧉ Copiar** no card (copia a aba aberta) |
| Fechar o painel | `Esc` ou clicar fora |
| Sair | Botão direito no ícone da bandeja → Sair |

## Seus dados

Ficam em `%APPDATA%\Lupa\repertorio.json`, com backup rotativo das 5 últimas
versões em `%APPDATA%\Lupa\backups\`.

- **Desinstalar não apaga o repertório.**
- Atualizar o app **não** reaplica a carga inicial nem desfaz suas edições.
- Restaure um backup em Configurações → Backups.

### Formato da planilha de import

Uma linha por sentido, com as colunas:

```
id | sigla | rotulo | tipo | categoria | en | pt | original |
contexto | exemplo | area | processo | referencia | tags |
favorito | criadoEm | atualizadoEm
```

`tags` separadas por `;` · `favorito` aceita sim/não · exportar e reimportar
não perde favoritos nem datas. Só `rotulo` (ou `sigla`) e **um** entre `en`,
`pt` e `original` são obrigatórios.

## Desenvolvimento

```bash
npm install
npm run dev         # app em modo desenvolvimento
npm run test:unit   # testes (Vitest)
npm run typecheck   # TypeScript strict
npm run package     # instalador + portátil (exige Windows ou wine completo)
```

## Documentação do projeto

| Documento | O que responde |
|---|---|
| [BRIEFING](docs/BRIEFING.md) | O quê, para quem e por quê |
| [SPEC](docs/SPEC.md) | Arquitetura, modelo de dados, UI, contrato IPC |
| [VF](docs/VF.md) | Verificação funcional — 85 casos de teste |
| [SPR](docs/SPR.md) | Planejamento em ondas paralelas |
| [AGENTS](docs/AGENTS.md) | A malha de agentes que construiu isto |

## Stack

Electron 32 · Vite 5 · TypeScript 5 strict · React 18 · Zod · Fuse.js · SheetJS
