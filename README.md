# 🔍 Lupa — Mini-Gadget de Siglas

Gadget de desktop para Windows que fica **sempre visível** na tela como um ícone
de lupa flutuante. Clique, digite uma sigla e receba na hora:

- 🇬🇧 **Inglês** — a expansão original
- 🇧🇷 **Português** — o termo usado no dia a dia
- 🎯 **Aplicação** — *Contexto de uso* e *Onde aparece* (área, processo, referência)

Tudo a partir de um **repertório local que você alimenta**. Funciona 100% offline.

---

## Status

🟡 **Em planejamento** — documentação de projeto concluída, implementação a iniciar.

## Documentação

| Documento | O que responde |
|---|---|
| [BRIEFING](docs/BRIEFING.md) | O quê, para quem e por quê — escopo, métricas, riscos |
| [SPEC](docs/SPEC.md) | Como — stack, arquitetura, modelo de dados, UI, contrato IPC |
| [VF](docs/VF.md) | Verificação Funcional — matriz de rastreabilidade e casos de teste |
| [SPR](docs/SPR.md) | Sprint Planning & Release — backlog, ondas paralelas, marcos |
| [AGENTS](docs/AGENTS.md) | A malha de agentes paralelos e as skills de cada um |

## Stack

Electron 32 · Vite 5 · TypeScript 5 · React 18 · Fuse.js · SheetJS · electron-builder

## Dados

O repertório fica em `%APPDATA%/Lupa/repertorio.json`, com backup rotativo.
Semente inicial versionada em [`data/siglas.seed.json`](data/siglas.seed.json).
Importe e exporte em JSON, CSV ou XLSX a qualquer momento.
