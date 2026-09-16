# CLAUDE.md — Convenções do projeto Lupa

Mini-gadget de siglas para Windows (Electron + Vite + TypeScript + React).
Antes de qualquer implementação, leia `docs/SPEC.md` — ele é a fonte de verdade.

## Regras invioláveis

1. **Contrato primeiro.** `src/shared/types.ts` e `src/shared/schema.ts` definem
   o modelo de dados. Nenhum módulo redefine tipos localmente.
2. **Offline-first.** Nenhuma chamada de rede em runtime. Sem telemetria.
3. **Segurança do Electron.** `contextIsolation: true`, `nodeIntegration: false`,
   `sandbox: true`. O renderer só acessa o sistema via IPC tipado do preload.
4. **Validação na fronteira.** Todo handler IPC valida a entrada com Zod antes
   de tocar no store.
5. **Escrita atômica.** Gravação do repertório sempre via arquivo temporário +
   `rename`, com backup rotativo. Nunca escrever direto no arquivo final.
6. **Fronteira de arquivos.** Respeite o dono de cada pasta em `docs/AGENTS.md`.

## Convenções

- Idioma do código: identificadores em inglês; textos de interface e comentários
  de domínio em português do Brasil.
- Commits: `T-xx: descrição curta` (T-xx = ID da tarefa em `docs/SPR.md`).
- Nenhuma dependência nova sem registrar a decisão em `docs/SPEC.md` §10 (ADR).

## Comandos

```bash
npm run dev        # app em modo desenvolvimento
npm run build      # build de produção
npm run test       # testes unitários (Vitest)
npm run test:e2e   # testes E2E (Playwright + Electron)
npm run package    # instalador NSIS + versão portátil
```
